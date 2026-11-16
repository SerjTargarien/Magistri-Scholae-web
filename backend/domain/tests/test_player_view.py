import tempfile
import uuid
from datetime import timedelta
from pathlib import Path
from django.core.signals import request_finished
from django.db import close_old_connections
from django.test import Client, override_settings
from django.utils import timezone
from domain.models import AdminAccess, PlayerView, PreparedView, Sheet, Table
from .base import APICase
from .test_remote import image_bytes


class PlayerViewTests(APICase):
    """Vista de jugadores (7a): only what the Máster sends, captured when he sends it."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.override = override_settings(PRIVATE_MEDIA_ROOT=Path(self.temp.name))
        self.override.enable(); self.addCleanup(self.override.disable)
        self.gm_client = self.client_for(self.gm)
        self.anonymous = Client()

    def link(self, action="create"):
        return self.send(self.gm_client, f"campaigns/{self.campaign.pk}/view", {"action": action})["view"]

    def show(self, items=None, sheet=None, status=200, client=None):
        body = {"sheetId": str((sheet or self.sheet).pk) if sheet is not False else None}
        if items is not None:
            body["items"] = items
        return self.send(client or self.gm_client, f"campaigns/{self.campaign.pk}/view/now", body, status=status)

    def public(self, token, status=200):
        response = self.anonymous.get(f"/api/v1/view/{token}")
        self.assertEqual(response.status_code, status, response.content.decode())
        if status == 200:
            self.assertIn("no-store", response["Cache-Control"])
        return response.json()

    def upload_portrait(self):
        current = self.read(self.client_for(self.alice), f"characters/{self.sheet.pk}")
        body = {"operationId": str(uuid.uuid4()), "expectedRevision": current["revision"], "path": "avatarImage", "imageBase64": image_bytes()}
        return self.send(self.client_for(self.alice), f"characters/{self.sheet.pk}/assets", body)["fields"]["avatarImage"]

    def test_the_link_shows_nothing_until_the_master_sends_something(self):
        token = self.link()["token"]
        self.assertEqual(self.public(token), {"campaignName": "Fictional academy", "revision": 0, "now": None})

    def test_mostrar_shows_the_photo_and_name_by_default_and_the_screen_reads_its_photo(self):
        self.upload_portrait()
        token = self.link()["token"]
        self.show()
        now = self.public(token)["now"]
        self.assertEqual(now["items"], [{"kind": "photo"}, {"kind": "field", "path": "nombre", "value": "Fictional Luna"}])
        self.assertTrue(now["photo"])
        photo = self.anonymous.get(f"/api/v1/view/{token}/photo")
        self.assertEqual(photo.status_code, 200)
        self.assertEqual(photo["Content-Type"], "image/png")
        self.assertTrue(b"".join(photo.streaming_content).startswith(b"\x89PNG"))
        # Closing a file response ends the request, which would also close the test's database connection.
        request_finished.disconnect(close_old_connections)
        try:
            photo.close()
        finally:
            request_finished.connect(close_old_connections)

    def test_values_are_captured_when_shown_and_later_edits_do_not_reach_the_screen(self):
        token = self.link()["token"]
        self.show([{"kind": "field", "path": "nombre"}, {"kind": "field", "path": "adultWizardProfile/role"}])
        Sheet.objects.filter(pk=self.sheet.pk).update(data={**self.sheet.data, "nombre": "Renamed later", "adultWizardProfile": {"role": "Changed"}})
        values = [i["value"] for i in self.public(token)["now"]["items"]]
        self.assertEqual(values, ["Fictional Luna", "Apprentice"])
        # Adding one more keeps the values already shown; only the new one is read now.
        self.show([{"kind": "field", "path": "nombre"}, {"kind": "field", "path": "adultWizardProfile/role"}, {"kind": "text", "value": "Os mira con desconfianza"}])
        items = self.public(token)["now"]["items"]
        self.assertEqual([i.get("value") for i in items], ["Fictional Luna", "Apprentice", "Os mira con desconfianza"])

    def test_only_allowlisted_values_reach_the_screen(self):
        self.link()
        for path in ["notasList", "galleryImages", "habilidades", "avatarImage", "unknown", "camposPersonalizados/missing"]:
            self.assertEqual(self.show([{"kind": "field", "path": path}], status=400)["error"]["code"], "invalid_view_item", path)
        self.show([{"kind": "text", "value": "x" * 301}], status=400)
        self.show([{"kind": "text", "value": f"Line {n}"} for n in range(21)], status=400)
        self.show([{"kind": "photo"}, {"kind": "photo"}], status=400)
        self.show([{"kind": "field", "path": "nombre", "value": "forged"}], status=400)
        familiar = self.show([{"kind": "field", "path": "especie"}], sheet=self.familiar)
        self.assertEqual(familiar["view"]["now"]["items"][0]["value"], "Owl")

    def test_only_the_campaigns_master_manages_it(self):
        path = f"campaigns/{self.campaign.pk}/view"
        self.send(self.client_for(self.alice), path, {"action": "create"}, status=403)
        self.show(client=self.client_for(self.alice), status=403)
        AdminAccess.objects.create(campaign=self.campaign, granted_by=self.gm, reason="Fictional issue", expires_at=timezone.now() + timedelta(hours=1))
        self.send(self.client_for(self.admin), path, {"action": "create"}, status=404)
        self.show(client=self.client_for(self.admin), status=404)
        # Another campaign's sheet, a draft and an archived sheet cannot be shown.
        other = Sheet.objects.create(campaign=self.other, creator=self.outsider, kind="character", data={"nombre": "Elsewhere"})
        self.show(sheet=other, status=404)
        draft = Sheet.objects.create(campaign=self.campaign, creator=self.alice, assigned_player=self.alice, kind="character", status="draft", data={"nombre": "Draft"})
        self.show(sheet=draft, status=404)
        Sheet.objects.filter(pk=self.familiar.pk).update(archived=True)
        self.show(sheet=self.familiar, status=404)

    def test_ocultar_disable_renew_and_expiry_leave_old_links_with_nothing(self):
        token = self.link()["token"]
        self.show()
        self.show(sheet=False)
        self.assertIsNone(self.public(token)["now"])
        self.show()
        renewed = self.link("renew")["token"]
        self.assertNotEqual(renewed, token)
        self.public(token, status=404)
        self.assertIsNotNone(self.public(renewed)["now"])
        self.link("disable")
        self.public(renewed, status=404)
        self.anonymous.get(f"/api/v1/view/{renewed}/photo")
        again = self.link("create")["token"]
        PlayerView.objects.filter(campaign=self.campaign).update(expires_at=timezone.now() - timedelta(seconds=1))
        self.public(again, status=404)
        for forged in ["nonsense", f"{self.campaign.pk.hex}-1-" + "0" * 32, f"{self.campaign.pk.hex}-x-y"]:
            self.public(forged, status=404)

    def test_prepared_values_are_kept_per_sheet_until_shown(self):
        path = f"characters/{self.sheet.pk}/prepared-view"
        self.assertEqual(self.read(self.gm_client, path)["items"], [{"kind": "photo"}, {"kind": "field", "path": "nombre"}])
        prepared = [{"kind": "photo"}, {"kind": "field", "path": "nombre"}, {"kind": "text", "value": "Cierra el libro"}]
        self.send(self.gm_client, path, {"items": prepared})
        self.assertEqual(self.read(self.gm_client, path)["items"], prepared)
        self.send(self.gm_client, path, {"items": [{"kind": "field", "path": "notasList"}]}, status=400)
        self.read(self.client_for(self.alice), path, status=403)
        # «Mostrar» without a list shows what was prepared.
        shown = self.show()["view"]["now"]["items"]
        self.assertEqual(shown[-1], {"kind": "text", "value": "Cierra el libro"})
        self.assertFalse(PreparedView.objects.filter(sheet=self.sheet).exists())

    def test_players_follow_it_in_the_app_only_when_allowed_and_in_the_sessions_partida(self):
        self.link()
        self.show()
        alice = self.client_for(self.alice)
        now = f"campaigns/{self.campaign.pk}/view/now"
        self.assertIsNone(self.read(alice, now)["now"])  # not allowed yet: the same as nothing showing
        self.send(self.gm_client, f"campaigns/{self.campaign.pk}/view", {"inApp": True})
        self.assertEqual(self.read(alice, now)["now"]["items"][1]["value"], "Fictional Luna")  # no partida chosen: everyone
        jueves = Table.objects.create(campaign=self.campaign, name="Jueves")
        sabado = Table.objects.create(campaign=self.campaign, name="Sábado")
        self.send(self.gm_client, f"campaigns/{self.campaign.pk}/view", {"tableId": str(jueves.pk)})
        self.assertIsNotNone(self.read(alice, now)["now"])  # her character is in no partida: common to all
        self.sheet.tables.add(sabado)
        self.assertIsNone(self.read(alice, now)["now"])
        self.sheet.tables.add(jueves)
        result = self.read(alice, now)
        self.assertIsNotNone(result["now"])
        self.assertNotIn("Jueves", str(result))
        self.read(self.client_for(self.outsider), now, status=404)
        self.assertIsNone(self.read(self.client_for(self.bob), now)["now"])  # bob plays no character here
