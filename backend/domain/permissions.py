import hashlib
import hmac
from copy import deepcopy
from django.conf import settings
from django.db.models import Q
from .errors import APIError, require
from .fields import REGISTRY, descriptor, leaf_paths, obj
from .models import Bond, Campaign, Membership, Share, Sheet


def member(actor, campaign, gm=False):
    require(actor.is_authenticated and actor.is_active, "authentication_required", 401)
    membership = Membership.objects.filter(campaign=campaign, user=actor).first()
    require(membership is not None, "not_found", 404)
    require(not gm or membership.role == "gm", "forbidden", 403)
    return membership


def is_gm(actor, campaign):
    return actor.is_authenticated and actor.is_active and Membership.objects.filter(campaign=campaign, user=actor, role="gm").exists()


def accessible(actor, sheet):
    if not actor.is_authenticated or not actor.is_active:
        return False
    if not Membership.objects.filter(user=actor, campaign=sheet.campaign).exists():
        return False
    return is_gm(actor, sheet.campaign) or (not sheet.archived and (
        sheet.assigned_player_id == actor.pk or Share.objects.filter(sheet=sheet, recipient=actor).exists()))


def sheet_for(actor, sheet_id, kind, lock=False):
    query = Sheet.objects.select_related("campaign")
    sheet = query.filter(pk=sheet_id, kind=kind).first()
    require(sheet is not None, "not_found", 404)
    if lock:
        # Every campaign-domain mutation locks campaign first. This serializes
        # role/policy changes with writes and avoids cross-entity lock ordering.
        campaign = Campaign.objects.select_for_update().get(pk=sheet.campaign_id)
        sheet = Sheet.objects.select_for_update().get(pk=sheet.pk)
        sheet.campaign = campaign
    require(accessible(actor, sheet), "not_found", 404)
    return sheet


def list_sheets(actor, campaign, kind):
    membership = member(actor, campaign)
    query = Sheet.objects.select_related("campaign").filter(campaign=campaign, kind=kind)
    if membership.role != "gm":
        query = query.filter(archived=False).filter(Q(assigned_player=actor) | Q(shares__recipient=actor)).distinct()
    # Newest first, as the app has always listed sheets.
    return query.order_by("-created_at", "id")


def audience_tier(sheet, path):
    campaign = sheet.campaign.visibility_defaults.get(sheet.kind, {})
    default = sheet.gm_default if sheet.gm_default != "inherit" else campaign.get("*", "assigned")
    # An explicit character/familiar default replaces campaign defaults; its
    # existing explicit per-field overrides remain in force.
    campaign_rules = campaign if sheet.gm_default == "inherit" else {}
    parts = path.split("/")
    explicit = []
    restricted = False
    for index in range(1, len(parts) + 1):
        prefix = "/".join(parts[:index])
        audience = sheet.gm_overrides.get(prefix, campaign_rules.get(prefix))
        if audience is not None:
            explicit.append(audience)
        restricted |= bool(sheet.player_restrictions.get(prefix))
    tier = min({"gm": 0, "assigned": 1, "shared": 2}.get(a, 0) for a in explicit or [default])
    return min(tier, 1) if restricted else tier


def can_read(actor, sheet, path, *, gm=None):
    if gm is None:
        gm = is_gm(actor, sheet.campaign)
    if gm:
        return True
    try:
        descriptor(sheet.kind, path)
    except APIError:
        return False  # Unknown fields fail closed for players.
    # Explicit parents dominate children. An explicit leaf overrides only the
    # ordinary fallback, never an explicitly restricted parent.
    return audience_tier(sheet, path) >= (1 if actor.pk == sheet.assigned_player_id else 2)


def can_write(actor, sheet, path, *, gm=None):
    if sheet.archived:
        return False
    if gm is None:
        gm = is_gm(actor, sheet.campaign)
    return (gm or actor.pk == sheet.assigned_player_id) and can_read(actor, sheet, path, gm=gm)


def revision_for(actor, sheet):
    source = f"{sheet.pk}:{sheet.revision}:{sheet.campaign.policy_revision}:{actor.pk}:{actor.auth_epoch}"
    return hmac.new(settings.HMAC_KEY.encode(), source.encode(), hashlib.sha256).hexdigest()


def check_revision(actor, sheet, expected):
    require(isinstance(expected, str) and hmac.compare_digest(expected, revision_for(actor, sheet)), "revision_conflict", 409)


_MISSING = object()


def project_value(actor, sheet, value, spec, prefix):
    kind = spec["type"]
    if kind == "object":
        result = {}
        for key, entry in value.items():
            if key not in spec["fields"]:
                continue
            child = project_value(actor, sheet, entry, spec["fields"][key], f"{prefix}/{key}".strip("/"))
            if child is not _MISSING:
                result[key] = child
        if result or (not value and can_read(actor, sheet, prefix, gm=False)):
            return result
    elif kind == "items":
        result = []
        for entry in value:
            child = project_value(actor, sheet, {k: v for k, v in entry.items() if k != "id"}, obj(spec["fields"]), f"{prefix}/{entry['id']}")
            if child is not _MISSING:
                result.append({"id": entry["id"], **child})
        if result or (not value and can_read(actor, sheet, prefix, gm=False)):
            return result
    elif can_read(actor, sheet, prefix, gm=False):
        return deepcopy(value)
    return _MISSING


def projection(actor, sheet, include_bond=True):
    require(accessible(actor, sheet), "not_found", 404)
    gm = is_gm(actor, sheet.campaign)
    fields = deepcopy(sheet.data) if gm else project_value(actor, sheet, sheet.data, obj(REGISTRY[sheet.kind]), "")
    if fields is _MISSING:
        fields = {}
    readable = list(leaf_paths(fields, obj(REGISTRY[sheet.kind])))
    writable, collections, removable = [], [], []
    def editable(spec, value, path):
        if spec["type"] == "object":
            for key, child in spec["fields"].items():
                editable(child, value.get(key) if isinstance(value, dict) else None, f"{path}/{key}".strip("/"))
        elif spec["type"] == "items":
            child_spec = obj(spec["fields"])
            def all_editable(prefix):
                candidates = list(leaf_paths({k: None for k in spec["fields"]}, child_spec, prefix))
                candidates += [p for p in set(sheet.gm_overrides) | set(sheet.campaign.visibility_defaults.get(sheet.kind, {})) if p.startswith(prefix + "/")]
                return can_write(actor, sheet, prefix, gm=gm) and all(can_write(actor, sheet, p, gm=gm) for p in candidates)
            if all_editable(path + "/new-item"):
                collections.append(path)
            for item in value or []:
                prefix = f"{path}/{item['id']}"
                editable(child_spec, item, prefix)
                if all_editable(prefix):
                    removable.append(prefix)
        elif can_write(actor, sheet, path, gm=gm):
            writable.append(path)
    editable(obj(REGISTRY[sheet.kind]), fields, "")
    result = {
        "kind": "viewer-projection", "id": str(sheet.pk), "entityType": sheet.kind,
        "campaignId": str(sheet.campaign_id), "schemaVersion": sheet.schema_version,
        "revision": revision_for(actor, sheet), "fields": fields,
        "capabilities": {"readablePaths": readable, "writablePaths": writable,
                         "collectionPaths": collections, "removablePaths": removable,
                         "bondWritable": can_write(actor, sheet, "bond", gm=gm), "isGM": gm},
    }
    if gm:
        result["assignedPlayerId"] = str(sheet.assigned_player_id) if sheet.assigned_player_id else None
        result["archived"] = sheet.archived
    if include_bond and can_read(actor, sheet, "bond", gm=gm):
        bond = Bond.objects.filter(Q(character=sheet) | Q(familiar=sheet)).select_related("character__campaign", "familiar__campaign").first()
        if bond:
            counterpart = bond.familiar if sheet.kind == "character" else bond.character
            if accessible(actor, counterpart):
                result["bondId"] = str(counterpart.pk)
    return result
