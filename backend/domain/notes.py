from django.db import transaction
from django.core import signing
from django.utils import timezone
import uuid
from .errors import keys, require, text
from .models import GMNote, PersonalNote, Sheet
from .permissions import accessible, member, sheet_for


@transaction.atomic
def promote(actor, note_id, body, apply=False):
    from .fields import replace_path
    from .permissions import audience_tier, can_write, check_revision, projection, revision_for
    from .services import touch
    keys(body, ["sheetId", "expectedRevision", "noteRevision", "previewToken"] if apply else
         ["sheetId", "expectedRevision", "noteRevision"], ["sheetId", "expectedRevision", "noteRevision"] + (["previewToken"] if apply else []))
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
    if not apply:
        token = {"actor": str(actor.pk), "note": str(note.pk), "noteRevision": note.revision,
                 "sheet": str(sheet.pk), "revision": revision_for(actor, sheet), "itemId": item_id}
        return {"previewToken": signing.dumps(token, salt="note-promotion"), "audiences": audiences,
                "sourceWillBeDeleted": True, "title": note.title, "content": note.content}
    sheet.data = replace_path(sheet.data, sheet.kind, path, {
        "titulo": note.title, "contenido": note.content, "fecha": int(timezone.now().timestamp() * 1000)})
    touch(sheet, "personal-note.promoted", actor)
    note.delete()
    return projection(actor, sheet)


def personal_view(note):
    # Labels are author-supplied; never join a reassigned sheet's current name.
    return {"id": str(note.pk), "sheetId": str(note.sheet_id) if note.sheet_id else None,
            "label": note.label, "title": note.title, "content": note.content, "revision": note.revision}


@transaction.atomic
def create_personal(actor, body):
    keys(body, ["sheetId", "label", "title", "content"], ["title", "content"])
    sheet = None
    if body.get("sheetId"):
        candidate = Sheet.objects.filter(pk=body["sheetId"]).first()
        require(candidate is not None, "not_found", 404)
        sheet = sheet_for(actor, candidate.pk, candidate.kind, lock=True)
    note = PersonalNote.objects.create(author=actor, sheet=sheet, label=text(body.get("label", ""), 120, empty=True),
                                       title=text(body["title"], 200), content=text(body["content"], 64000, empty=True))
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
    for field, maximum in [("title", 200), ("content", 64000), ("label", 120)]:
        if field in body:
            setattr(note, field, text(body[field], maximum, empty=field != "title"))
    note.revision += 1
    note.save()
    return personal_view(note)


@transaction.atomic
def gm_note(actor, sheet_id, kind, body=None):
    # Only an edit locks the campaign and sheet rows; reading does not.
    sheet = sheet_for(actor, sheet_id, kind, lock=body is not None)
    member(actor, sheet.campaign, gm=True)
    note = GMNote.objects.filter(sheet=sheet).first()
    if body is not None:
        keys(body, ["expectedRevision", "content"], ["expectedRevision", "content"])
        require(type(body["expectedRevision"]) is int and body["expectedRevision"] == (note.revision if note else 0), "revision_conflict", 409)
        if note is None:
            note = GMNote(sheet=sheet, revision=0)
        note.content = text(body["content"], 64000, empty=True)
        note.revision += 1
        note.save()
    return {"content": note.content if note else "", "revision": note.revision if note else 0}
