from django.db import transaction
from django.core import signing
import uuid
from .errors import APIError, keys, require, text
from .models import PersonalNote, Sheet
from .permissions import accessible, member, sheet_for


# A note's fields and their rules (docs/field-rules.md, Private notes).
NOTE_LIMITS = {"title": 200, "content": 64000, "label": 120}
MAX_DATE = 8640000000000000  # the journal's «fecha» range (fields.DATE)


def note_text(body, field):
    """A note's text field: may be empty; too long or invalid text names the field."""
    value = body.get(field, "")
    if not isinstance(value, str) or "\x00" in value:
        raise APIError("invalid_field_value", 400, {"path": field, "rule": "type"})
    if len(value) > NOTE_LIMITS[field]:
        raise APIError("field_too_long", 400, {"path": field, "rule": "maxLength", "limit": NOTE_LIMITS[field]})
    return value


def millis(moment):
    return int(moment.timestamp() * 1000)


@transaction.atomic
def promote(actor, note_id, body, apply=False):
    from .fields import replace_path
    from .permissions import audience_tier, can_write, check_revision, projection, revision_for
    from .services import touch
    # «fecha»: the journal entry's date, chosen in the dialog; by default, when the note was written.
    keys(body, ["sheetId", "expectedRevision", "noteRevision", "fecha", "previewToken"] if apply else
         ["sheetId", "expectedRevision", "noteRevision", "fecha"], ["sheetId", "expectedRevision", "noteRevision"] + (["previewToken"] if apply else []))
    fecha = body.get("fecha")
    if fecha is not None and not (type(fecha) is int and 0 <= fecha <= MAX_DATE):
        raise APIError("field_out_of_range", 400, {"path": "fecha", "rule": "range", "limit": [0, MAX_DATE]})
    candidate = Sheet.objects.filter(pk=body["sheetId"]).first()
    require(candidate is not None, "not_found", 404)
    sheet = sheet_for(actor, candidate.pk, candidate.kind, lock=True)
    note = PersonalNote.objects.select_for_update().filter(pk=note_id, author=actor).first()
    require(note is not None, "not_found", 404)
    require(type(body["noteRevision"]) is int and body["noteRevision"] == note.revision, "revision_conflict", 409)
    check_revision(actor, sheet, body["expectedRevision"])
    item_id = uuid.uuid4().hex
    if apply:
        try:
            token = signing.loads(text(body["previewToken"], 4096), salt="note-promotion", max_age=300)
        except signing.BadSignature:
            require(False, "invalid_preview", 409)
        require(token["actor"] == str(actor.pk) and token["note"] == str(note.pk) and
                token["sheet"] == str(sheet.pk) and token["revision"] == revision_for(actor, sheet) and
                token["noteRevision"] == note.revision, "invalid_preview", 409)
        item_id = token["itemId"]
    path = f"notasList/{item_id}"
    require(all(can_write(actor, sheet, p) for p in [path, *[f"{path}/{f}" for f in ("titulo", "contenido", "fecha")]]), "field_forbidden", 403)
    audiences = {f: ["gm", "assigned", "shared"][audience_tier(sheet, f"{path}/{f}")] for f in ("titulo", "contenido", "fecha")}
    entry = {"titulo": note.title, "contenido": note.content, "fecha": fecha if fecha is not None else millis(note.created_at)}
    # The new entry is checked against the journal's rules (length, an empty note, the sheet's size)
    # already in the preview, so a note that does not fit is refused before anything moves.
    moved = replace_path(sheet.data, sheet.kind, path, entry)
    if not apply:
        token = {"actor": str(actor.pk), "note": str(note.pk), "noteRevision": note.revision,
                 "sheet": str(sheet.pk), "revision": revision_for(actor, sheet), "itemId": item_id}
        return {"previewToken": signing.dumps(token, salt="note-promotion"), "audiences": audiences,
                "sourceWillBeDeleted": True, "title": note.title, "content": note.content, "fecha": entry["fecha"]}
    sheet.data = moved
    touch(sheet, "personal-note.promoted", actor)
    note.delete()
    return projection(actor, sheet)


def personal_view(note):
    # Labels are author-supplied; never join a reassigned sheet's current name.
    return {"id": str(note.pk), "sheetId": str(note.sheet_id) if note.sheet_id else None,
            "label": note.label, "title": note.title, "content": note.content, "revision": note.revision,
            "createdAt": millis(note.created_at), "updatedAt": millis(note.updated_at)}


@transaction.atomic
def create_personal(actor, body):
    # The title is optional (the app shows «Nota del 12 nov»); an empty note may be saved while it is written.
    keys(body, ["sheetId", "label", "title", "content"])
    sheet = None
    if body.get("sheetId"):
        candidate = Sheet.objects.filter(pk=body["sheetId"]).first()
        require(candidate is not None, "not_found", 404)
        sheet = sheet_for(actor, candidate.pk, candidate.kind, lock=True)
    note = PersonalNote.objects.create(author=actor, sheet=sheet, label=note_text(body, "label"),
                                       title=note_text(body, "title"), content=note_text(body, "content"))
    return personal_view(note)


@transaction.atomic
def edit_personal(actor, note_id, body, delete=False):
    keys(body, ["expectedRevision"] if delete else ["expectedRevision", "title", "content", "label"], ["expectedRevision"])
    note = PersonalNote.objects.select_for_update().filter(pk=note_id, author=actor).first()
    require(note is not None, "not_found", 404)
    require(type(body["expectedRevision"]) is int and body["expectedRevision"] == note.revision, "revision_conflict", 409)
    if delete:
        note.delete()
        return {}
    for field in NOTE_LIMITS:
        if field in body:
            setattr(note, field, note_text(body, field))
    note.revision += 1
    note.save()
    return personal_view(note)
