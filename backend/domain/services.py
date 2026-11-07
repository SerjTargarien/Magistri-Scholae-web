from copy import copy, deepcopy
from django.core import signing
from django.db import transaction
from .errors import APIError, keys, require, text
from .fields import REGISTRY, descriptor, leaf_paths, obj, replace_path, validate_sheet
from .models import AuditEvent, Bond, Campaign, Membership, Share, Sheet, User
from .permissions import (accessible, audience_tier, can_read, can_write, check_revision, is_gm,
                          member, projection, revision_for, sheet_for)
from .accounts import administrator

AUDIENCES = {"gm", "assigned", "shared"}


def touch(sheet, action, actor):
    sheet.revision += 1
    sheet.save()
    AuditEvent.objects.create(actor=actor, action=action, target_id=str(sheet.pk))


def campaign_for(actor, campaign_id, gm=False, lock=False):
    query = Campaign.objects.select_for_update() if lock else Campaign.objects
    campaign = query.filter(pk=campaign_id).first()
    require(campaign is not None, "not_found", 404)
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
    campaign = campaign_for(actor, body["campaignId"], lock=True)
    gm = is_gm(actor, campaign)
    require(gm or "assignedPlayerId" not in body, "forbidden", 403)
    owner = assigned_member(campaign, body.get("assignedPlayerId")) if gm else actor
    validate_sheet(kind, body["fields"])
    from .media import validate_references
    validate_references(None, body["fields"], kind)
    sheet = Sheet(campaign=campaign, creator=actor, assigned_player=owner, kind=kind, data=deepcopy(body["fields"]))
    if not gm:
        require(all(can_write(actor, sheet, p) for p in leaf_paths(sheet.data, obj(REGISTRY[kind]))), "field_forbidden", 403)
    sheet.save()
    AuditEvent.objects.create(actor=actor, action=f"{kind}.created", target_id=str(sheet.pk))
    return projection(actor, sheet)


@transaction.atomic
def patch_sheet(actor, sheet_id, kind, body):
    keys(body, ["expectedRevision", "changes"], ["expectedRevision", "changes"])
    sheet = sheet_for(actor, sheet_id, kind, lock=True)
    check_revision(actor, sheet, body["expectedRevision"])
    changes = body["changes"]
    require(isinstance(changes, list) and 1 <= len(changes) <= 100)
    gm = is_gm(actor, sheet.campaign)
    if not gm:
        validate_sheet(kind, sheet.data)  # Unknown future fields fail closed.
    paths = []
    for change in changes:
        keys(change, ["path", "value"], ["path", "value"])
        path = change["path"]
        descriptor(kind, path)
        require(not any(path == p or path.startswith(p + "/") or p.startswith(path + "/") for p in paths), "overlapping_changes")
        paths.append(path)
        require(can_write(actor, sheet, path, gm=gm), "field_forbidden", 403)
        updated = replace_path(sheet.data, kind, path, change["value"])
        if not gm:
            # Replacing a section/list must not remove unseen descendants.
            candidates = set(leaf_paths(sheet.data, obj(REGISTRY[kind]))) | set(leaf_paths(updated, obj(REGISTRY[kind])))
            candidates |= set(sheet.gm_overrides) | set(sheet.campaign.visibility_defaults.get(kind, {}))
            require(all(can_write(actor, sheet, p, gm=False) for p in candidates if p.startswith(path + "/")), "field_forbidden", 403)
        sheet.data = updated
    from .media import validate_references
    validate_references(sheet, sheet.data, kind)
    touch(sheet, f"{kind}.patched", actor)
    return projection(actor, sheet)


@transaction.atomic
def manage_sheet(actor, sheet_id, kind, body):
    keys(body, ["expectedRevision", "assignedPlayerId", "archived"], ["expectedRevision"])
    sheet = sheet_for(actor, sheet_id, kind, lock=True)
    member(actor, sheet.campaign, gm=True)
    check_revision(actor, sheet, body["expectedRevision"])
    if "assignedPlayerId" in body:
        sheet.assigned_player = assigned_member(sheet.campaign, body["assignedPlayerId"])
    if "archived" in body:
        require(type(body["archived"]) is bool)
        sheet.archived = body["archived"]
    touch(sheet, f"{kind}.managed", actor)
    return projection(actor, sheet)


@transaction.atomic
def share_sheet(actor, sheet_id, kind, body):
    keys(body, ["expectedRevision", "recipientId", "grant"], ["expectedRevision", "recipientId", "grant"])
    sheet = sheet_for(actor, sheet_id, kind, lock=True)
    member(actor, sheet.campaign, gm=True)
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
    gm = is_gm(actor, sheet.campaign)
    if gm:
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
    gm = is_gm(actor, sheet.campaign)
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
            payload["revision"] == revision_for(actor, sheet) and payload["gm"] == is_gm(actor, sheet.campaign), "invalid_preview", 409)
    require(is_gm(actor, sheet.campaign) or actor.pk == sheet.assigned_player_id, "forbidden", 403)
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
