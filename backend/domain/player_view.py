"""Vista de jugadores (step 7a; product-design.md 10d; owner decisions of 16 November 2026).

The Máster shows the table a sheet's photo and chosen values on another computer's screen, which
opens a secret link and never signs in. Only what he sends is shown:

- «Ahora» is a snapshot. Each value (and the portrait's file) is captured when he presses
  «Mostrar» or adds it; later edits to the sheet never reach the screen.
- «Preparado» keeps, per sheet, which values he wants to show next (paths and free text, not
  values), until he shows them.
- The values come from an allowlist built from the field registry: plain fields, lists of names
  and custom fields by item. Journals, galleries and every image but the portrait stay out.

Only the campaign's own Máster manages it (never the administrator during an access). The
screen reads the snapshot with the link; signed-in players may read it in the app when the
Máster allows it and they play in the session's partida. A wrong, replaced, disabled or expired
link, and a player who may not see it, get the same answer as «nothing showing» or not found.
"""
import hashlib
import hmac
from datetime import timedelta
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import transaction
from django.db.models import Q
from django.http import FileResponse
from django.utils import timezone
from .errors import APIError, keys, require, text
from .models import AuditEvent, Campaign, MediaAsset, Membership, PlayerView, PreparedView, Sheet, Table
from .permissions import member

LIFETIME = timedelta(days=90)
MAX_ITEMS = 20      # field-rules.md, Vista de jugadores
MAX_TEXT = 300
PHOTO = {"character": "avatarImage", "familiar": "imagen"}
VALUE_LISTS = {"aspectosPersonales", "complicaciones", "aspectoTemporal", "adultWizardProfile/teachingSubjects"}
NAME_LISTS = {"clubesList"}
CUSTOM = "camposPersonalizados/"
SHOWABLE = {
    "character": {"nombre", "concepto", "jugador", "edad", "curso", "puestoClase", "casa", "linaje", "economia", "varitaSintonia",
                  "adultWizardProfile/role", "adultWizardProfile/institution", "adultWizardProfile/reputation",
                  "adultWizardProfile/formerHouse", "puntosDestino", "pxs"} | VALUE_LISTS | NAME_LISTS,
    "familiar": {"nombre", "especie", "descripcion"},
}


# ---- the link ----------------------------------------------------------------------------

def _mac(campaign_id, generation):
    source = f"player-view:{campaign_id}:{generation}"
    return hmac.new(settings.HMAC_KEY.encode(), source.encode(), hashlib.sha256).hexdigest()[:32]


def token_for(view):
    """The link's secret, derived (never stored): the campaign, the link's generation and a MAC."""
    return f"{view.campaign_id.hex}-{view.generation}-{_mac(view.campaign_id, view.generation)}"


def view_for_token(token):
    """The view a link opens, or not found for a wrong, replaced, disabled or expired one."""
    try:
        campaign_hex, generation, mac = str(token).split("-")
        generation = int(generation)
        view = PlayerView.objects.select_related("campaign").get(campaign_id=campaign_hex)
    except (ValueError, PlayerView.DoesNotExist):
        raise APIError("not_found", 404) from None
    valid = (view.active and view.generation == generation and view.expires_at and view.expires_at > timezone.now()
             and hmac.compare_digest(mac, _mac(view.campaign_id, generation)))
    require(valid, "not_found", 404)
    return view


# ---- values ------------------------------------------------------------------------------

def _value(sheet, path):
    data = sheet.data or {}
    if path.startswith(CUSTOM) and sheet.kind == "character":
        item_id = path[len(CUSTOM):]
        found = next((i for i in data.get("camposPersonalizados") or [] if i.get("id") == item_id), None)
        require(found is not None, "invalid_view_item")
        return {"nombre": found.get("nombre", ""), "valor": found.get("valor", "")}
    require(path in SHOWABLE[sheet.kind], "invalid_view_item")
    value = data
    for part in path.split("/"):
        value = value.get(part) if isinstance(value, dict) else None
    if path in VALUE_LISTS:
        return [i.get("value", "") for i in value or [] if isinstance(i, dict)]
    if path in NAME_LISTS:
        return [i.get("nombre", "") for i in value or [] if isinstance(i, dict)]
    return value if isinstance(value, (str, int)) and not isinstance(value, bool) else ""


def _specs(raw):
    """The Máster's list: {kind: photo}, {kind: field, path} or {kind: text, value}; no repeats."""
    require(isinstance(raw, list) and len(raw) <= MAX_ITEMS, "too_many_items")
    seen, out = set(), []
    for item in raw:
        require(isinstance(item, dict) and item.get("kind") in ("photo", "field", "text"), "invalid_view_item")
        if item["kind"] == "photo":
            keys(item, ["kind"])
            key, spec = "photo", {"kind": "photo"}
        elif item["kind"] == "field":
            keys(item, ["kind", "path"], ["kind", "path"])
            key, spec = "field:" + text(item["path"], 300), {"kind": "field", "path": item["path"]}
        else:
            keys(item, ["kind", "value"], ["kind", "value"])
            key, spec = None, {"kind": "text", "value": text(item["value"], MAX_TEXT)}
        require(key is None or key not in seen, "invalid_view_item")
        if key:
            seen.add(key)
        out.append(spec)
    return out


def _key(item):
    return "photo" if item["kind"] == "photo" else ("field:" + item["path"]) if item["kind"] == "field" else None


def _spec_of(item):
    """What the Máster chose, without the captured value: the panel's «Ahora» list."""
    if item["kind"] == "photo":
        return {"kind": "photo"}
    if item["kind"] == "field":
        return {"kind": "field", "path": item["path"]}
    return {"kind": "text", "value": item["value"]}


def defaults():
    return [{"kind": "photo"}, {"kind": "field", "path": "nombre"}]


# ---- the Máster's side ---------------------------------------------------------------------

def _gm_campaign(actor, campaign_id, lock=False):
    """The campaign's own Máster only: not a player, not the administrator during an access."""
    query = Campaign.objects.select_for_update() if lock else Campaign.objects
    campaign = query.filter(pk=campaign_id).first()
    require(campaign is not None, "not_found", 404)
    member(actor, campaign, gm=True)
    return campaign


def _gm_sheet(actor, sheet_id, kind=None, campaign=None):
    query = Sheet.objects.select_related("campaign").filter(pk=sheet_id)
    sheet = (query.filter(campaign=campaign) if campaign else query).first()
    require(sheet is not None and (kind is None or sheet.kind == kind), "not_found", 404)
    member(actor, sheet.campaign, gm=True)
    require(sheet.status == "confirmed" and not sheet.archived, "not_found", 404)
    return sheet


def _view(campaign, lock=False):
    query = PlayerView.objects.select_for_update() if lock else PlayerView.objects
    view = query.filter(campaign=campaign).first()
    return view or PlayerView.objects.create(campaign=campaign)


def snapshot(view):
    """What the screen shows now (also the players' copy in the app)."""
    if not view.sheet_id or not view.items:
        return None
    return {"sheetKind": view.sheet_kind, "items": view.items, "photo": bool(view.photo_id)}


def settings_view(view):
    live = view.active and view.expires_at and view.expires_at > timezone.now()
    return {
        "active": bool(live), "token": token_for(view) if live else None,
        "expiresAt": view.expires_at.isoformat() if live else None,
        "inApp": view.in_app, "tableId": str(view.table_id) if view.table_id else None,
        "sheetId": str(view.sheet_id) if view.sheet_id and view.items else None,
        "specs": [_spec_of(i) for i in view.items],
        "now": snapshot(view), "revision": view.revision,
    }


def read_settings(actor, campaign_id):
    return {"view": settings_view(_view(_gm_campaign(actor, campaign_id)))}


@transaction.atomic
def change_settings(actor, campaign_id, body):
    """«Crear enlace», «Cambiar enlace» (the old link stops), «Desactivar», and the in-app switch with its partida."""
    keys(body, ["action", "inApp", "tableId"])
    campaign = _gm_campaign(actor, campaign_id, lock=True)
    view = _view(campaign, lock=True)
    action = body.get("action")
    require(action in (None, "create", "renew", "disable"))
    if action in ("create", "renew"):
        view.generation += 1
        view.active = True
        view.expires_at = timezone.now() + LIFETIME
    elif action == "disable":
        view.active = False
    if "inApp" in body:
        require(type(body["inApp"]) is bool)
        view.in_app = body["inApp"]
    if "tableId" in body:
        table = body["tableId"]
        require(table is None or (isinstance(table, str) and Table.objects.filter(pk=table, campaign=campaign).exists()), "invalid_table")
        view.table_id = table
    view.save()
    if action:
        AuditEvent.objects.create(actor=actor, action=f"player_view.{action}", target_id=str(campaign.pk))
    return {"view": settings_view(view)}


@transaction.atomic
def show(actor, campaign_id, body):
    """Puts a sheet's chosen values on screen, or empties it (sheetId null, «Ocultar»). Values already
    on screen for the same sheet keep the value they were shown with; new ones are captured now."""
    keys(body, ["sheetId", "items"], ["sheetId"])
    campaign = _gm_campaign(actor, campaign_id, lock=True)
    view = _view(campaign, lock=True)
    if body["sheetId"] is None:
        require(not body.get("items"), "invalid_view_item")
        view.sheet, view.items, view.photo, view.sheet_kind = None, [], None, ""
    else:
        sheet = _gm_sheet(actor, text(body["sheetId"], 64), campaign=campaign)
        specs = _specs(body.get("items", defaults()))
        same = view.sheet_id == sheet.pk
        old = {_key(i): i for i in view.items if same and _key(i)}
        items, photo = [], view.photo if same else None
        for spec in specs:
            k = _key(spec)
            if k and k in old:
                items.append(old[k])
            elif spec["kind"] == "photo":
                asset_id = (sheet.data or {}).get(PHOTO[sheet.kind])
                photo = MediaAsset.objects.filter(pk=asset_id, sheet=sheet).first() if asset_id else None
                items.append({"kind": "photo"})
            elif spec["kind"] == "field":
                items.append({"kind": "field", "path": spec["path"], "value": _value(sheet, spec["path"])})
            else:
                items.append(spec)
        if not any(i["kind"] == "photo" for i in items):
            photo = None
        view.sheet, view.items, view.photo, view.sheet_kind = (sheet, items, photo, sheet.kind) if items else (None, [], None, "")
        PreparedView.objects.filter(sheet=sheet).delete()  # shown: what was prepared for it is done
    view.revision += 1
    view.save()
    return {"view": settings_view(view)}


def read_prepared(actor, sheet_id, kind):
    sheet = _gm_sheet(actor, sheet_id, kind)
    prepared = PreparedView.objects.filter(sheet=sheet).first()
    return {"items": prepared.items if prepared else defaults()}


@transaction.atomic
def save_prepared(actor, sheet_id, kind, body):
    """«Preparado»: what this sheet will show next, kept until shown or reset (to the defaults)."""
    keys(body, ["items"], ["items"])
    sheet = _gm_sheet(actor, sheet_id, kind)
    specs = _specs(body["items"])
    for spec in specs:
        if spec["kind"] == "field":
            _value(sheet, spec["path"])  # the path must be showable on this sheet
    if specs == defaults():
        PreparedView.objects.filter(sheet=sheet).delete()
    else:
        PreparedView.objects.update_or_create(sheet=sheet, defaults={"items": specs})
    return {"items": specs}


# ---- reading it -------------------------------------------------------------------------

def public_read(token):
    view = view_for_token(token)
    return {"campaignName": view.campaign.name, "revision": view.revision, "now": snapshot(view)}


def _may_follow(actor, view):
    """A signed-in member sees it in the app if he is the Máster, or the Máster allows it and the
    player has a character in the session's partida (or in none: common to all)."""
    membership = member(actor, view.campaign)
    if membership.role == "gm":
        return True
    if not view.in_app:
        return False
    if view.table_id is None:
        return True
    return Sheet.objects.filter(campaign=view.campaign, kind="character", status="confirmed", archived=False, assigned_player=actor) \
        .filter(Q(tables=view.table_id) | Q(tables__isnull=True)).exists()


def member_read(actor, campaign_id):
    campaign = Campaign.objects.filter(pk=campaign_id).first()
    require(campaign is not None, "not_found", 404)
    view = PlayerView.objects.filter(campaign=campaign).first()
    if not view:
        member(actor, campaign)
        return {"revision": 0, "now": None}
    if not _may_follow(actor, view):
        return {"revision": 0, "now": None}
    return {"revision": view.revision, "now": snapshot(view)}


def _photo(view):
    require(view.photo_id is not None and view.items, "not_found", 404)
    storage = FileSystemStorage(location=settings.PRIVATE_MEDIA_ROOT)
    try:
        response = FileResponse(storage.open(view.photo.storage_name, "rb"), content_type="image/png")
    except FileNotFoundError:
        raise APIError("not_found", 404) from None
    response["Content-Disposition"] = 'inline; filename="image.png"'
    response["Cross-Origin-Resource-Policy"] = "same-origin"
    response["Cache-Control"] = "no-store"
    return response


def public_photo(token):
    view = view_for_token(token)
    return _photo(PlayerView.objects.select_related("photo").get(pk=view.pk))


def member_photo(actor, campaign_id):
    view = PlayerView.objects.select_related("campaign", "photo").filter(campaign_id=campaign_id).first()
    require(view is not None, "not_found", 404)
    require(_may_follow(actor, view), "not_found", 404)
    return _photo(view)
