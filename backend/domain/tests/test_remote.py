import base64
import io
import tempfile
import uuid
import time
from pathlib import Path
from unittest.mock import patch
from django.test import override_settings
from PIL import Image
from domain.models import AuditEvent, MediaAsset, PersonalNote, ProcessedOperation, Share
from .base import APICase


def image_bytes():
    output = io.BytesIO()
    Image.new("RGB", (24, 18), "purple").save(output, format="PNG")
    return base64.b64encode(output.getvalue()).decode()


class RemoteEditingTests(APICase):
    def setUp(self):
        self.alice_client = self.client_for(self.alice)
        self.gm_client = self.client_for(self.gm)
        self.bob_client = self.client_for(self.bob)

    def patch_body(self, changes):
        return {"operationId": str(uuid.uuid4()), "expectedRevision": self.current()["revision"], "changes": changes}

    def test_same_operation_retry_applies_once_and_changed_content_rejected(self):
        body = self.patch_body([{"path": "nombre", "value": "Retry fixture"}])
        path = f"characters/{self.sheet.pk}"
        first = self.send(self.alice_client, path, body, "patch")
        second = self.send(self.alice_client, path, body, "patch")
        self.assertEqual(first, second)
        self.sheet.refresh_from_db()
        self.assertEqual(self.sheet.revision, 2)
        self.assertEqual(ProcessedOperation.objects.count(), 1)
        body["changes"][0]["value"] = "Different"
        self.send(self.alice_client, path, body, "patch", status=409)
        self.assertNotIn("Retry fixture", str(ProcessedOperation.objects.get().__dict__))

    def test_receipt_reprojects_current_permissions_and_revoked_access_is_denied(self):
        path = f"characters/{self.sheet.pk}"
        body = self.patch_body([{"path": "nombre", "value": "Retry fixture"}])
        self.send(self.alice_client, path, body, "patch")
        self.policy(self.gm_client, {"overrides": {"notas": "gm", "nombre": "gm"}})
        replay = self.send(self.alice_client, path, body, "patch")
        self.assertNotIn("nombre", replay["fields"])
        self.assertNotIn("notas", replay["fields"])
        self.sheet.assigned_player = self.bob; self.sheet.save()
        self.send(self.alice_client, path, body, "patch", status=404)

    def test_creation_retry_is_single_entity_and_ids_are_actor_scoped(self):
        body = {"operationId": str(uuid.uuid4()), "campaignId": str(self.campaign.pk), "fields": {"nombre": "Retry owl"}}
        first = self.send(self.alice_client, "familiars", body)
        self.assertEqual(self.send(self.alice_client, "familiars", body)["id"], first["id"])
        self.assertNotEqual(self.send(self.bob_client, "familiars", body)["id"], first["id"])

    def test_item_path_changes_preserve_hidden_siblings_and_reject_removal(self):
        self.policy(self.gm_client, {"overrides": {"notasList/note-a/contenido": "gm"}})
        body = self.patch_body([{"path": "notasList/note-a/titulo", "value": "Visible title"}])
        self.send(self.alice_client, f"characters/{self.sheet.pk}", body, "patch")
        self.sheet.refresh_from_db()
        self.assertEqual(self.sheet.data["notasList"][0]["contenido"], "secret-item-content")
        self.send(self.alice_client, f"characters/{self.sheet.pk}", self.patch_body([{"path": "notasList/note-a", "value": None}]), "patch", 403)
        self.send(self.alice_client, f"characters/{self.sheet.pk}", self.patch_body([{"path": "notasList/new-note", "value": {"titulo": "New", "contenido": "New content", "fecha": 1}}]), "patch")
        self.sheet.refresh_from_db()
        self.assertEqual(len(self.sheet.data["notasList"]), 2)
        view = self.current()
        self.assertNotIn("notasList/note-a", view["capabilities"]["removablePaths"])

    def test_missing_nested_parent_can_be_added_without_defaults(self):
        self.send(self.alice_client, f"familiars/{self.familiar.pk}", {"expectedRevision": self.current(sheet=self.familiar)["revision"],
            "changes": [{"path": "notasList/first", "value": {"titulo": "One", "contenido": "Only this", "fecha": 1}}]}, "patch")
        self.familiar.refresh_from_db()
        self.assertEqual(self.familiar.data["notasList"][0]["id"], "first")

    def test_bond_retry_is_one_transaction_and_gm_note_retry_has_independent_revision(self):
        body = {"operationId": str(uuid.uuid4()), "expectedRevision": self.current()["revision"],
                "targetId": str(self.familiar.pk), "targetRevision": self.current(sheet=self.familiar)["revision"]}
        path = f"characters/{self.sheet.pk}/bond"
        first = self.send(self.alice_client, path, body)
        self.assertEqual(self.send(self.alice_client, path, body)["revision"], first["revision"])
        self.familiar.refresh_from_db(); self.assertEqual(self.familiar.revision, 2)
        note_body = {"operationId": str(uuid.uuid4()), "expectedRevision": 0, "content": "Fictional GM note"}
        path = f"characters/{self.sheet.pk}/gm-notes"
        first_note = self.send(self.gm_client, path, note_body, "patch")
        self.assertEqual(self.send(self.gm_client, path, note_body, "patch"), first_note)
        self.assertEqual(first_note["revision"], 1)
        self.read(self.alice_client, path, status=403)

    def test_invalid_operation_id_has_bounded_error(self):
        self.send(self.alice_client, "familiars", {"operationId": 42, "campaignId": str(self.campaign.pk), "fields": {"nombre": "Invalid"}}, status=400)

    def test_promotion_preview_move_is_author_only_atomic_and_idempotent(self):
        note = self.send(self.alice_client, "personal-notes", {"title": "Private fixture", "content": "Private content"})
        body = {"sheetId": str(self.sheet.pk), "expectedRevision": self.current()["revision"], "noteRevision": note["revision"]}
        preview = self.send(self.alice_client, f"personal-notes/{note['id']}/promote/preview", body)
        self.assertTrue(preview["sourceWillBeDeleted"])
        self.assertEqual(preview["audiences"]["contenido"], "assigned")
        self.assertTrue(PersonalNote.objects.filter(pk=note["id"]).exists())
        apply_body = {**body, "previewToken": preview["previewToken"], "operationId": str(uuid.uuid4())}
        path = f"personal-notes/{note['id']}/promote"
        with patch("domain.notes.PersonalNote.delete", side_effect=RuntimeError("test rollback")):
            with self.assertRaises(RuntimeError): self.send(self.alice_client, path, apply_body)
        self.sheet.refresh_from_db()
        self.assertEqual(len(self.sheet.data["notasList"]), 1)
        self.assertTrue(PersonalNote.objects.filter(pk=note["id"]).exists())
        result = self.send(self.alice_client, path, apply_body)
        self.send(self.alice_client, path, apply_body)
        self.assertEqual(len(result["fields"]["notasList"]), 2)
        self.assertFalse(PersonalNote.objects.filter(pk=note["id"]).exists())
        self.assertNotIn("Private content", str(list(AuditEvent.objects.values())))

    def test_promotion_stale_note_sheet_or_policy_preserves_private_source(self):
        note = self.send(self.alice_client, "personal-notes", {"title": "Private", "content": "Keep"})
        body = {"sheetId": str(self.sheet.pk), "expectedRevision": self.current()["revision"], "noteRevision": note["revision"]}
        preview = self.send(self.alice_client, f"personal-notes/{note['id']}/promote/preview", body)
        self.policy(self.gm_client, {"overrides": {"notasList": "gm"}})
        self.send(self.alice_client, f"personal-notes/{note['id']}/promote", {**body, "previewToken": preview["previewToken"]}, status=409)
        body["expectedRevision"] = self.current()["revision"]
        self.send(self.alice_client, f"personal-notes/{note['id']}/promote/preview", body, status=403)
        self.assertTrue(PersonalNote.objects.filter(pk=note["id"]).exists())

    def test_expired_tampered_or_edited_note_preview_cannot_publish(self):
        note = self.send(self.alice_client, "personal-notes", {"title": "Private", "content": "Keep"})
        body = {"sheetId": str(self.sheet.pk), "expectedRevision": self.current()["revision"], "noteRevision": note["revision"]}
        path = f"personal-notes/{note['id']}/promote"
        with patch("django.core.signing.time.time", return_value=time.time() - 301):
            old = self.send(self.alice_client, path + "/preview", body)
        for token in [old["previewToken"], old["previewToken"] + "tampered"]:
            self.send(self.alice_client, path, {**body, "previewToken": token}, status=409)
        fresh = self.send(self.alice_client, path + "/preview", body)
        self.send(self.alice_client, f"personal-notes/{note['id']}", {"expectedRevision": note["revision"], "content": "Revised private text"}, "patch")
        self.send(self.alice_client, path, {**body, "previewToken": fresh["previewToken"]}, status=409)
        self.assertTrue(PersonalNote.objects.filter(pk=note["id"]).exists())


class PrivateMediaTests(APICase):
    def setUp(self):
        RemoteEditingTests.setUp(self)
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.override = override_settings(PRIVATE_MEDIA_ROOT=Path(self.temp.name))
        self.override.enable(); self.addCleanup(self.override.disable)

    def upload(self, **overrides):
        body = {"operationId": str(uuid.uuid4()), "expectedRevision": self.current()["revision"], "path": "avatarImage", "imageBase64": image_bytes(), **overrides}
        result = self.send(self.alice_client, f"characters/{self.sheet.pk}/assets", body)
        return result, body

    def test_upload_retry_download_projection_and_detach_revoke_old_url(self):
        result, body = self.upload()
        self.send(self.alice_client, f"characters/{self.sheet.pk}/assets", body)
        self.assertEqual(MediaAsset.objects.count(), 1)
        asset_id = result["fields"]["avatarImage"]
        response = self.alice_client.get(f"/api/v1/assets/{asset_id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "image/png")
        self.assertIn("no-store", response["Cache-Control"])
        self.assertTrue(b"".join(response.streaming_content).startswith(b"\x89PNG"))
        self.read(self.bob_client, f"assets/{asset_id}", status=404)
        self.policy(self.gm_client, {"overrides": {"avatarImage": "gm"}})
        self.read(self.alice_client, f"assets/{asset_id}", status=404)
        self.assertNotIn(asset_id, str(self.current()))
        self.send(self.gm_client, f"characters/{self.sheet.pk}", {"expectedRevision": self.current(self.gm)["revision"], "changes": [{"path": "avatarImage", "value": None}]}, "patch")
        self.read(self.gm_client, f"assets/{asset_id}", status=404)

    def test_foreign_asset_reference_hidden_upload_and_invalid_images_are_rejected(self):
        result, _ = self.upload()
        self.send(self.alice_client, f"familiars/{self.familiar.pk}", {"expectedRevision": self.current(sheet=self.familiar)["revision"], "changes": [{"path": "imagen", "value": result["fields"]["avatarImage"]}]}, "patch", 400)
        for encoded in ["%%%", base64.b64encode(b"<svg>unsafe</svg>").decode(), base64.b64encode(b"broken image").decode()]:
            self.send(self.alice_client, f"characters/{self.sheet.pk}/assets", {"expectedRevision": self.current()["revision"], "path": "avatarImage", "imageBase64": encoded}, status=400)
        self.policy(self.gm_client, {"overrides": {"avatarImage": "gm"}})
        self.send(self.alice_client, f"characters/{self.sheet.pk}/assets", {"expectedRevision": self.current()["revision"], "path": "avatarImage", "imageBase64": image_bytes()}, status=403)
        self.assertEqual(MediaAsset.objects.count(), 1)

    def test_upload_failure_rolls_back_attachment_and_removes_only_its_own_file(self):
        with patch("domain.media.touch", side_effect=RuntimeError("synthetic rollback")):
            with self.assertRaises(RuntimeError): self.upload()
        self.sheet.refresh_from_db()
        self.assertNotIn("avatarImage", self.sheet.data)
        self.assertFalse(MediaAsset.objects.exists())
        self.assertEqual(list(Path(self.temp.name).iterdir()), [])

    def test_decoded_image_limit_and_stale_revision_fail_before_attachment(self):
        with patch("domain.media.MAX_PIXELS", 100):
            self.send(self.alice_client, f"characters/{self.sheet.pk}/assets", {"expectedRevision": self.current()["revision"], "path": "avatarImage", "imageBase64": image_bytes()}, status=413)
        self.send(self.alice_client, f"characters/{self.sheet.pk}/assets", {"expectedRevision": "stale", "path": "avatarImage", "imageBase64": image_bytes()}, status=409)
        self.assertFalse(MediaAsset.objects.exists())
