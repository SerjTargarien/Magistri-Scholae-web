from copy import copy, deepcopy
from django.core import signing
from django.db import transaction
from django.db.models import Q
from .errors import APIError, keys, require, text
from .catalogue import link_own_skills, own_skills, validate_catalogue
from .fields import REGISTRY, descriptor, leaf_paths, obj, replace_path, validate_sheet
from .models import AuditEvent, Bond, Campaign, Membership, Share, Sheet, Table, User
from .permissions import (accessible, audience_tier, can_read, can_write, check_revision, gm_of, is_gm, real_gm,
                          member, projection, revision_for, sheet_for)
from .accounts import administrator

AUDIENCES = {"gm", "assigned", "shared"}


def touch(sheet, action, actor):
    sheet.revision += 1
    sheet.save()
    AuditEvent.objects.create(actor=actor, action=action, target_id=str(sheet.pk))


def campaign_for(actor, campaign_id, gm=False, lock=False, members_only=False):
    query = Campaign.objects.select_for_update() if lock else Campaign.objects
    campaign = query.filter(pk=campaign_id).first()
    require(campaign is not None, "not_found", 404)
    if not gm and not members_only:
        # The administrator during an access reads the campaign's sheets and skill list (R4 e).
        from .admin_access import active_access
        if active_access(actor, campaign):
            return campaign
    member(actor, campaign, gm)
    return campaign


def assigned_member(campaign, user_id):
    if user_id is None:
        return None
    user = User.objects.filter(pk=user_id, is_active=True, membership__campaign=campaign).first()
    require(user is not None, "invalid_assignment")
    return user


@transaction.atomic
def create_sheet(actor, kind, body):
    keys(body, ["campaignId", "fields", "assignedPlayerId"], ["campaignId", "fields"])
    campaign = campaign_for(actor, body["campaignId"], lock=True, members_only=True)
    gm = is_gm(actor, campaign)
    require(gm or "assignedPlayerId" not in body, "forbidden", 403)
    owner = assigned_member(campaign, body.get("assignedPlayerId")) if gm else actor
    validate_sheet(kind, body["fields"], campaign.skill_catalogue)
    require(gm or not own_skills(body["fields"]), "gm_only_skill", 403)
    from .media import validate_references
    validate_references(None, body["fields"], kind)
    # A player's new sheet is a draft in their private vault; the GM's are campaign sheets (R4 c).
    sheet = Sheet(campaign=campaign, creator=actor, assigned_player=owner, kind=kind, data=deepcopy(body["fields"]),
                  status="confirmed" if gm else "draft")
    if not gm:
        require(all(can_write(actor, sheet, p) for p in leaf_paths(sheet.data, obj(REGISTRY[kind]))), "field_forbidden", 403)
    sheet.save()
    AuditEvent.objects.create(actor=actor, action=f"{kind}.created", target_id=str(sheet.pk))
    return projection(actor, sheet)


@transaction.atomic
def save_catalogue(actor, campaign_id, body):
    """The GM writes the campaign's skill list (C2). Nothing is ever deleted
    (entries are archived); own skills on the campaign's sheets that now match
    a catalogue name become links, keeping their values."""
    keys(body, ["expectedRevision", "catalogue"], ["expectedRevision", "catalogue"])
    campaign = campaign_for(actor, campaign_id, gm=True, lock=True)
    require(body["expectedRevision"] == campaign.catalogue_revision, "revision_conflict", 409)
    catalogue = body["catalogue"]
    validate_catalogue(catalogue)
    old = campaign.skill_catalogue
    for section in ("categorias", "habilidades"):
        require({e["id"] for e in old[section]} <= {e["id"] for e in catalogue[section]}, "catalogue_entry_removed")
    campaign.skill_catalogue = deepcopy(catalogue)
    campaign.catalogue_revision += 1
    campaign.save(update_fields=["skill_catalogue", "catalogue_revision"])
    for sheet in Sheet.objects.select_for_update().filter(campaign=campaign, kind="character"):
        data = link_own_skills(sheet.data, catalogue)
        if data is not None:
            sheet.data = data
            sheet.revision += 1
            sheet.save(update_fields=["data", "revision"])
    AuditEvent.objects.create(actor=actor, action="campaign.skill_catalogue_saved", target_id=str(campaign.pk))
    return {"catalogue": campaign.skill_catalogue, "revision": campaign.catalogue_revision}


@transaction.atomic
def patch_sheet(actor, sheet_id, kind, body):
    keys(body, ["expectedRevision", "changes"], ["expectedRevision", "changes"])
    sheet = sheet_for(actor, sheet_id, kind, lock=True)
    check_revision(actor, sheet, body["expectedRevision"])
    changes = body["changes"]
    require(isinstance(changes, list) and 1 <= len(changes) <= 100)
    gm = gm_of(actor, sheet)
    if not gm:
        # Unknown future fields fail closed. No details: the stored sheet may
        # contain paths this player cannot see.
        try:
            validate_sheet(kind, sheet.data)
        except APIError as error:
            raise APIError("stored_sheet_invalid", 409) from error
    own_before = own_skills(sheet.data)
    paths = []
    for change in changes:
        keys(change, ["path", "value"], ["path", "value"])
        path = change["path"]
        descriptor(kind, path)
        require(not any(path == p or path.startswith(p + "/") or p.startswith(path + "/") for p in paths), "overlapping_changes")
        paths.append(path)
        require(can_write(actor, sheet, path, gm=gm), "field_forbidden", 403)
        updated = replace_path(sheet.data, kind, path, change["value"], sheet.campaign.skill_catalogue)
        if not gm:
            # Replacing a section/list must not remove unseen descendants.
            candidates = set(leaf_paths(sheet.data, obj(REGISTRY[kind]))) | set(leaf_paths(updated, obj(REGISTRY[kind])))
            candidates |= set(sheet.gm_overrides) | set(sheet.campaign.visibility_defaults.get(kind, {}))
            require(all(can_write(actor, sheet, p, gm=False) for p in candidates if p.startswith(path + "/")), "field_forbidden", 403)
        sheet.data = updated
    # Players change the values of own skills, never which own skills exist.
    require(gm or own_skills(sheet.data) == own_before, "gm_only_skill", 403)
    from .media import validate_references
    validate_references(sheet, sheet.data, kind)
    touch(sheet, f"{kind}.patched", actor)
    from .admin_access import record
    record(actor, sheet, "write")
    return projection(actor, sheet)


@transaction.atomic
def manage_sheet(actor, sheet_id, kind, body):
    keys(body, ["expectedRevision", "assignedPlayerId", "archived", "tableId", "active"], ["expectedRevision"])
    sheet = sheet_for(actor, sheet_id, kind, lock=True)
    member(actor, sheet.campaign, gm=True)
    require(sheet.status == "confirmed", "not_confirmed", 409)
    check_revision(actor, sheet, body["expectedRevision"])
    if "active" in body:
        require(type(body["active"]) is bool)
        sheet.active = body["active"]
    if "assignedPlayerId" in body:
        sheet.assigned_player = assigned_member(sheet.campaign, body["assignedPlayerId"])
    if "archived" in body:
        require(type(body["archived"]) is bool)
        sheet.archived = body["archived"]
    if "tableId" in body:
        # A character's partida, or none; familiars follow their bond (R4 b).
        require(kind == "character", "invalid_table")
        table = body["tableId"]
        require(table is None or (isinstance(table, str) and Table.objects.filter(pk=table, campaign=sheet.campaign).exists()), "invalid_table")
        sheet.table_id = table
    touch(sheet, f"{kind}.managed", actor)
    return projection(actor, sheet)


MAX_TABLES = 12  # field-rules.md, Partidas


def table_view(table):
    return {"id": str(table.pk), "name": table.name}


def table_name(campaign, value, exclude=None):
    """A partida's name: required, 60 characters, unique in the campaign ignoring case."""
    name = text(value, 60).strip()
    require(name, "field_required")
    clash = Table.objects.filter(campaign=campaign, name__iexact=name)
    require(not (clash.exclude(pk=exclude.pk) if exclude else clash).exists(), "duplicate_table")
    return name


def list_tables(actor, campaign_id):
    campaign = campaign_for(actor, campaign_id, gm=True)
    return [table_view(t) for t in campaign.tables.order_by("created_at", "id")]


@transaction.atomic
def create_table(actor, campaign_id, body):
    keys(body, ["name"], ["name"])
    campaign = campaign_for(actor, campaign_id, gm=True, lock=True)
    require(campaign.tables.count() < MAX_TABLES, "too_many_items")
    table = Table.objects.create(campaign=campaign, name=table_name(campaign, body["name"]))
    AuditEvent.objects.create(actor=actor, action="table.created", target_id=str(table.pk))
    return table_view(table)


@transaction.atomic
def rename_table(actor, campaign_id, table_id, body):
    keys(body, ["name"], ["name"])
    campaign = campaign_for(actor, campaign_id, gm=True, lock=True)
    table = Table.objects.get(pk=table_id, campaign=campaign)
    table.name = table_name(campaign, body["name"], exclude=table)
    table.save(update_fields=["name"])
    AuditEvent.objects.create(actor=actor, action="table.renamed", target_id=str(table.pk))
    return table_view(table)


@transaction.atomic
def remove_table(actor, campaign_id, table_id):
    """Its characters stay, «sin partida»; their revision moves on, as the GM's copy changed."""
    campaign = campaign_for(actor, campaign_id, gm=True, lock=True)
    table = Table.objects.get(pk=table_id, campaign=campaign)
    for sheet in Sheet.objects.select_for_update().filter(table=table):
        sheet.table = None
        touch(sheet, f"{sheet.kind}.managed", actor)
    AuditEvent.objects.create(actor=actor, action="table.removed", target_id=str(table.pk))
    table.delete()


def bonded_with(sheet, statuses):
    """The sheet's bonded counterpart when it is in one of `statuses` (it moves with the sheet)."""
    bond = Bond.objects.filter(Q(character=sheet) | Q(familiar=sheet)).first()
    if not bond:
        return None
    other = Sheet.objects.select_for_update().get(pk=bond.familiar_id if sheet.kind == "character" else bond.character_id)
    return other if other.status in statuses else None


@transaction.atomic
def change_status(actor, sheet_id, kind, body):
    """Drafts and proposals (R4 c). The player proposes a draft or withdraws a proposal; the GM
    confirms a proposal as the player's character or as his own NPC, or returns it to the
    player's drafts. A bonded counterpart in the same state moves with it."""
    keys(body, ["expectedRevision", "action", "as"], ["expectedRevision", "action"])
    sheet = sheet_for(actor, sheet_id, kind, lock=True)
    check_revision(actor, sheet, body["expectedRevision"])
    action = body["action"]
    owner = actor.pk == sheet.assigned_player_id
    gm = real_gm(actor, sheet)  # proposals are the GM's decision, never the administrator's
    steps = {"propose": ("draft", "proposed", owner), "withdraw": ("proposed", "draft", owner),
             "return": ("proposed", "draft", gm), "confirm": ("proposed", "confirmed", gm)}
    require(action in steps, "invalid_status_action")
    before, after, allowed = steps[action]
    require(allowed, "forbidden", 403)
    require(sheet.status == before, "invalid_status", 409)
    npc = False
    if action == "confirm":
        require(body.get("as") in ("player", "npc"), "invalid_status_action")
        npc = body["as"] == "npc"
    else:
        require("as" not in body, "invalid_status_action")
    for target in [sheet, bonded_with(sheet, {before})]:
        if target is None:
            continue
        target.status = after
        if npc:
            # The GM's own NPC: the player who wrote it no longer has it (owner, 14 November 2026).
            target.assigned_player = actor
            Share.objects.filter(sheet=target).delete()
        touch(target, f"{target.kind}.{action}" + ("_npc" if npc else ""), actor)
    return projection(actor, sheet) if accessible(actor, sheet) else {"status": sheet.status}


@transaction.atomic
def delete_sheet(actor, sheet_id, kind, body):
    """The GM deletes an archived sheet for good (R4 d; owner, 8 and 14 November 2026), to free
    space. Its images go with it; private notes about it stay with their authors, unlinked
    (PersonalNote.sheet is SET_NULL); a bonded counterpart simply loses the bond. Backups keep
    it for their 30 days."""
    keys(body, ["expectedRevision"], ["expectedRevision"])
    sheet = sheet_for(actor, sheet_id, kind, lock=True)
    member(actor, sheet.campaign, gm=True)
    require(sheet.status == "confirmed" and sheet.archived, "not_archived", 409)
    check_revision(actor, sheet, body["expectedRevision"])
    from .media import delete_files
    from .models import MediaAsset
    names = list(MediaAsset.objects.filter(sheet=sheet).values_list("storage_name", flat=True))
    AuditEvent.objects.create(actor=actor, action=f"{kind}.deleted", target_id=str(sheet.pk))
    sheet.delete()
    transaction.on_commit(lambda: delete_files(names))
    return {}


@transaction.atomic
def share_sheet(actor, sheet_id, kind, body):
    keys(body, ["expectedRevision", "recipientId", "grant"], ["expectedRevision", "recipientId", "grant"])
    sheet = sheet_for(actor, sheet_id, kind, lock=True)
    member(actor, sheet.campaign, gm=True)
    require(sheet.status == "confirmed", "not_confirmed", 409)
    check_revision(actor, sheet, body["expectedRevision"])
    recipient = assigned_member(sheet.campaign, body["recipientId"])
    require(recipient is not None and type(body["grant"]) is bool)
    if body["grant"]:
        Share.objects.get_or_create(sheet=sheet, recipient=recipient)
    else:
        Share.objects.filter(sheet=sheet, recipient=recipient).delete()
    touch(sheet, f"{kind}.shared", actor)
    return projection(actor, sheet)


def policy_patch(sheet, actor, body):
    gm = gm_of(actor, sheet)
    # Visibility is the GM's decision, never the administrator's during an access (R4 e).
    require(not gm or real_gm(actor, sheet), "forbidden", 403)
    if gm:
        require(sheet.status == "confirmed", "not_confirmed", 409)
        keys(body, ["expectedRevision", "defaultAudience", "overrides"], ["expectedRevision"])
        default = body.get("defaultAudience", sheet.gm_default)
        require(default in AUDIENCES | {"inherit"}, "invalid_audience")
        overrides = deepcopy(sheet.gm_overrides)
        updates = body.get("overrides", {})
        require(isinstance(updates, dict) and len(updates) <= 500)
        for path, audience in updates.items():
            descriptor(sheet.kind, path)
            require(audience is None or audience in AUDIENCES, "invalid_audience")
            if audience is None:
                overrides.pop(path, None)
            else:
                overrides[path] = audience
        return {"gm_default": default, "gm_overrides": overrides}
    require(actor.pk == sheet.assigned_player_id, "forbidden", 403)
    keys(body, ["expectedRevision", "restrictions"], ["expectedRevision", "restrictions"])
    updates = body["restrictions"]
    require(isinstance(updates, dict) and len(updates) <= 500)
    restrictions = deepcopy(sheet.player_restrictions)
    for path, restricted in updates.items():
        descriptor(sheet.kind, path)
        require(type(restricted) is bool)
        require(can_read(actor, sheet, path, gm=False), "field_forbidden", 403)
        if restricted:
            restrictions[path] = True
        else:
            restrictions.pop(path, None)
    return {"player_restrictions": restrictions}


@transaction.atomic
def preview_policy(actor, sheet_id, kind, body):
    sheet = sheet_for(actor, sheet_id, kind, lock=True)
    check_revision(actor, sheet, body.get("expectedRevision"))
    settings = policy_patch(sheet, actor, body)
    # The token contains policy only, no sheet or note content. It is bound to
    # actor, role, entity revision and campaign policy revision, and expires.
    gm = gm_of(actor, sheet)
    # Signed tokens are readable, not encrypted. A player token contains only
    # their authorized patch, never retained restrictions on now-hidden paths.
    token_settings = settings if gm else {"restriction_patch": body["restrictions"]}
    payload = {"actor": str(actor.pk), "sheet": str(sheet.pk), "gm": gm,
               "revision": revision_for(actor, sheet), "settings": token_settings}
    proposed = copy(sheet)
    for field, value in settings.items():
        setattr(proposed, field, value)
    paths = set(leaf_paths(sheet.data, obj(REGISTRY[kind]))) | {"bond"}
    audience_changes = []
    for path in sorted(paths):
        before, after = audience_tier(sheet, path), audience_tier(proposed, path)
        if before != after and can_read(actor, sheet, path, gm=payload["gm"]):
            audience_changes.append({"path": path, "before": ["gm", "assigned", "shared"][before],
                                     "after": ["gm", "assigned", "shared"][after]})
    public_settings = settings if gm else {"player_restrictions": {
        p: v for p, v in settings["player_restrictions"].items() if can_read(actor, sheet, p, gm=False)}}
    return {"previewToken": signing.dumps(payload, salt="sheet-policy"), "proposedPolicy": public_settings,
            "expectedRevision": payload["revision"], "audienceChanges": audience_changes}


@transaction.atomic
def apply_policy(actor, sheet_id, kind, body):
    keys(body, ["expectedRevision", "previewToken"], ["expectedRevision", "previewToken"])
    sheet = sheet_for(actor, sheet_id, kind, lock=True)
    check_revision(actor, sheet, body["expectedRevision"])
    try:
        payload = signing.loads(text(body["previewToken"], 524288), salt="sheet-policy", max_age=300)
    except signing.BadSignature:
        raise APIError("invalid_preview", 409) from None
    require(payload["actor"] == str(actor.pk) and payload["sheet"] == str(sheet.pk) and
            payload["revision"] == revision_for(actor, sheet) and payload["gm"] == gm_of(actor, sheet), "invalid_preview", 409)
    require(gm_of(actor, sheet) or actor.pk == sheet.assigned_player_id, "forbidden", 403)
    settings = payload["settings"] if payload["gm"] else policy_patch(sheet, actor, {
        "expectedRevision": body["expectedRevision"], "restrictions": payload["settings"]["restriction_patch"]})
    for field, value in settings.items():
        setattr(sheet, field, value)
    touch(sheet, f"{kind}.visibility_changed", actor)
    return projection(actor, sheet)


@transaction.atomic
def set_bond(actor, sheet_id, kind, body):
    keys(body, ["expectedRevision", "targetId", "targetRevision"], ["expectedRevision", "targetId"])
    sheet = sheet_for(actor, sheet_id, kind, lock=True)
    check_revision(actor, sheet, body["expectedRevision"])
    require(can_write(actor, sheet, "bond"), "forbidden", 403)
    target = None
    if body["targetId"] is not None:
        target_kind = "familiar" if kind == "character" else "character"
        target = sheet_for(actor, body["targetId"], target_kind)
        require(target.campaign_id == sheet.campaign_id, "invalid_bond")
        # A draft bonds only with another draft, so the GM never changes one he cannot see (R4 c).
        require((sheet.status == "draft") == (target.status == "draft"), "invalid_bond")
        require(can_write(actor, target, "bond"), "forbidden", 403)
        check_revision(actor, target, body.get("targetRevision"))
    existing = list(Bond.objects.filter(character_id__in=[s.pk for s in (sheet, target) if s is not None]) |
                    Bond.objects.filter(familiar_id__in=[s.pk for s in (sheet, target) if s is not None]))
    affected = {sheet.pk: sheet}
    if target:
        affected[target.pk] = target
    for bond in existing:
        for entity_id in [bond.character_id, bond.familiar_id]:
            if entity_id not in affected:
                displaced = Sheet.objects.select_related("campaign").get(pk=entity_id)
                require(displaced.campaign_id == sheet.campaign_id, "invalid_bond")
                require(accessible(actor, displaced) and can_write(actor, displaced, "bond"), "forbidden", 403)
                affected[entity_id] = displaced
    Bond.objects.filter(pk__in=[b.pk for b in existing]).delete()
    if target:
        character, familiar = (sheet, target) if kind == "character" else (target, sheet)
        Bond.objects.create(character=character, familiar=familiar)
    for entity in affected.values():
        touch(entity, "bond.changed", actor)
    from .admin_access import record
    record(actor, sheet, "write")
    return projection(actor, sheet)


@transaction.atomic
def set_membership(actor, campaign_id, body):
    keys(body, ["userId", "role"], ["userId", "role"])
    campaign = Campaign.objects.select_for_update().get(pk=campaign_id)
    if actor.is_superuser:
        administrator(actor)
    else:
        member(actor, campaign, gm=True)
    require(body["role"] in (None, "player", "gm"), "invalid_role")
    user = User.objects.get(pk=body["userId"])
    existing = Membership.objects.filter(campaign=campaign, user=user).first()
    if body["role"] == "gm" or (existing and existing.role == "gm"):
        administrator(actor)
    if existing and existing.role == "gm" and body["role"] != "gm":
        require(Membership.objects.filter(campaign=campaign, role="gm").count() > 1, "last_gm")
    if body["role"] is None:
        Membership.objects.filter(campaign=campaign, user=user).delete()
        Share.objects.filter(sheet__campaign=campaign, recipient=user).delete()
    else:
        require(user.is_active, "invalid_member")
        Membership.objects.update_or_create(campaign=campaign, user=user, defaults={"role": body["role"]})
    campaign.policy_revision += 1
    campaign.save(update_fields=["policy_revision"])
    AuditEvent.objects.create(actor=actor, action="membership.changed", target_id=str(campaign.pk))


@transaction.atomic
def campaign_policy(actor, campaign_id, body, apply=False):
    campaign = campaign_for(actor, campaign_id, gm=True, lock=True)
    if not apply:
        keys(body, ["expectedRevision", "defaults"], ["expectedRevision", "defaults"])
        require(body["expectedRevision"] == campaign.policy_revision, "revision_conflict", 409)
        defaults = body["defaults"]
        require(isinstance(defaults, dict) and not (defaults.keys() - REGISTRY.keys()))
        for kind, policies in defaults.items():
            require(isinstance(policies, dict) and len(policies) <= 500)
            for path, audience in policies.items():
                if path != "*":
                    descriptor(kind, path)
                require(audience in AUDIENCES, "invalid_audience")
        return {"previewToken": signing.dumps({"actor": str(actor.pk), "campaign": str(campaign.pk),
                "revision": campaign.policy_revision, "defaults": defaults}, salt="campaign-policy"),
                "currentDefaults": campaign.visibility_defaults, "proposedDefaults": defaults,
                "expectedRevision": campaign.policy_revision}
    keys(body, ["expectedRevision", "previewToken"], ["expectedRevision", "previewToken"])
    require(body["expectedRevision"] == campaign.policy_revision, "revision_conflict", 409)
    try:
        payload = signing.loads(text(body["previewToken"], 524288), salt="campaign-policy", max_age=300)
    except signing.BadSignature:
        raise APIError("invalid_preview", 409) from None
    require(payload["actor"] == str(actor.pk) and payload["campaign"] == str(campaign.pk) and
            payload["revision"] == campaign.policy_revision, "invalid_preview", 409)
    campaign.visibility_defaults = payload["defaults"]
    campaign.policy_revision += 1
    campaign.save(update_fields=["visibility_defaults", "policy_revision"])
    AuditEvent.objects.create(actor=actor, action="campaign.visibility_changed", target_id=str(campaign.pk))
    return {"policyRevision": campaign.policy_revision}
