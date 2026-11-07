import json
from django.test import Client
from domain.models import Bond, Campaign, Membership, PersonalNote, Share, Sheet
from .base import APICase


class ProjectionTests(APICase):
    def setUp(self):
        self.gm_client = self.client_for(self.gm)
        self.alice_client = self.client_for(self.alice)
        self.bob_client = self.client_for(self.bob)

    def patch(self, client, path, value, status=200, sheet=None, plural="characters"):
        sheet = sheet or self.sheet
        current = self.read(client, f"{plural}/{sheet.pk}")
        return self.send(client, f"{plural}/{sheet.pk}", {"expectedRevision": current["revision"], "changes": [{"path": path, "value": value}]}, method="patch", status=status)

    def test_every_domain_endpoint_requires_authentication(self):
        for path in ["auth/me", "schema", "campaigns", "characters", "familiars", "personal-notes", f"characters/{self.sheet.pk}"]:
            self.read(Client(), path, status=401)

    def test_membership_alone_does_not_grant_read_even_for_shared_fields(self):
        self.policy(self.gm_client, {"defaultAudience": "shared"})
        self.read(self.bob_client, f"characters/{self.sheet.pk}", status=404)
        result = self.read(self.bob_client, f"characters?campaignId={self.campaign.pk}")
        self.assertEqual(result["items"], [])

    def test_gm_hides_nested_field_from_assigned_player(self):
        self.policy(self.gm_client, {"overrides": {"adultWizardProfile/reputation": "gm", "characterType": "gm"}})
        assigned = self.read(self.alice_client, f"characters/{self.sheet.pk}")
        self.assertNotIn("reputation", assigned["fields"]["adultWizardProfile"])
        self.assertNotIn("characterType", assigned["fields"])
        self.assertNotIn("gm-secret-reputation", json.dumps(assigned))
        gm = self.read(self.gm_client, f"characters/{self.sheet.pk}")
        self.assertEqual(gm["fields"]["adultWizardProfile"]["reputation"], "gm-secret-reputation")

    def test_parent_restriction_dominates_leaf_override(self):
        self.policy(self.gm_client, {"overrides": {"adultWizardProfile": "gm", "adultWizardProfile/reputation": "shared"}})
        result = self.read(self.alice_client, f"characters/{self.sheet.pk}")
        self.assertNotIn("adultWizardProfile", result["fields"])

    def test_shared_reader_receives_only_authorized_fields_and_no_writes(self):
        Share.objects.create(sheet=self.sheet, recipient=self.bob)
        self.policy(self.gm_client, {"overrides": {"nombre": "shared"}})
        result = self.read(self.bob_client, f"characters/{self.sheet.pk}")
        self.assertEqual(result["fields"], {"nombre": "Fictional Luna"})
        self.assertEqual(result["capabilities"]["writablePaths"], [])
        self.patch(self.bob_client, "nombre", "forged", status=403)

    def test_player_restrictions_never_hide_ordinary_data_from_gm_or_self(self):
        Share.objects.create(sheet=self.sheet, recipient=self.bob)
        self.policy(self.gm_client, {"defaultAudience": "shared"})
        self.policy(self.alice_client, {"restrictions": {"notas": True}})
        shared = self.read(self.bob_client, f"characters/{self.sheet.pk}")
        self.assertNotIn("notas", shared["fields"])
        for client in [self.alice_client, self.gm_client]:
            result = self.read(client, f"characters/{self.sheet.pk}")
            self.assertEqual(result["fields"]["notas"], "ordinary-gm-visible-journal")

    def test_player_cannot_override_gm_policy(self):
        current = self.current()
        self.send(self.alice_client, f"characters/{self.sheet.pk}/visibility/preview", {
            "expectedRevision": current["revision"], "overrides": {"notas": "shared"}}, status=400)
        self.policy(self.gm_client, {"overrides": {"notas": "gm"}})
        self.patch(self.alice_client, "notas", "forged", status=403)
        self.sheet.refresh_from_db()
        self.assertEqual(self.sheet.data["notas"], "ordinary-gm-visible-journal")

    def test_patch_of_visible_field_preserves_hidden_values(self):
        self.policy(self.gm_client, {"overrides": {"adultWizardProfile/reputation": "gm"}})
        result = self.patch(self.alice_client, "nombre", "Renamed demo")
        self.assertNotIn("gm-secret-reputation", json.dumps(result))
        self.sheet.refresh_from_db()
        self.assertEqual(self.sheet.data["adultWizardProfile"]["reputation"], "gm-secret-reputation")

    def test_whole_record_put_and_forged_fields_are_not_supported(self):
        self.send(self.alice_client, f"characters/{self.sheet.pk}", {"fields": {"nombre": "forged"}}, method="put", status=405)
        self.send(self.alice_client, f"characters/{self.sheet.pk}", {"expectedRevision": self.current()["revision"], "changes": [], "assignedPlayerId": str(self.bob.pk)}, method="patch", status=400)
        self.patch(self.alice_client, "assignedPlayerId", str(self.bob.pk), status=400)

    def test_hidden_list_leaf_is_omitted_but_visible_leaf_can_be_edited(self):
        self.policy(self.gm_client, {"overrides": {"notasList/note-a/contenido": "gm"}})
        result = self.read(self.alice_client, f"characters/{self.sheet.pk}")
        self.assertNotIn("contenido", result["fields"]["notasList"][0])
        result = self.patch(self.alice_client, "notasList/note-a/titulo", "New visible title")
        self.assertEqual(result["fields"]["notasList"][0]["titulo"], "New visible title")
        self.sheet.refresh_from_db()
        self.assertEqual(self.sheet.data["notasList"][0]["contenido"], "secret-item-content")

    def test_parent_collection_replacement_cannot_delete_hidden_data(self):
        self.policy(self.gm_client, {"overrides": {"notasList/note-a/contenido": "gm"}})
        self.patch(self.alice_client, "notasList", [], status=403)
        self.sheet.refresh_from_db()
        self.assertEqual(len(self.sheet.data["notasList"]), 1)

    def test_item_identity_survives_reordering_and_numeric_indices_are_rejected(self):
        second = {"id": "note-b", "titulo": "Second", "contenido": "public demo", "fecha": 11}
        self.policy(self.gm_client, {"overrides": {"notasList/note-a/contenido": "gm"}})
        reordered = [second, self.sheet.data["notasList"][0]]
        self.patch(self.gm_client, "notasList", reordered)
        result = self.read(self.alice_client, f"characters/{self.sheet.pk}")
        self.assertNotIn("contenido", next(n for n in result["fields"]["notasList"] if n["id"] == "note-a"))
        self.patch(self.alice_client, "notasList/0/contenido", "forged", status=400)

    def test_duplicate_collection_ids_and_overlapping_changes_rejected(self):
        entry = self.sheet.data["habilidades"][0]
        self.patch(self.gm_client, "habilidades", [entry, entry], status=400)
        self.send(self.gm_client, f"characters/{self.sheet.pk}", {"expectedRevision": self.current(self.gm)["revision"],
            "changes": [{"path": "adultWizardProfile", "value": {}}, {"path": "adultWizardProfile/role", "value": "forged"}]}, method="patch", status=400)

    def test_unknown_fields_fail_closed_for_players(self):
        self.sheet.data["futureSecret"] = "unregistered-secret"
        self.sheet.save()
        self.assertNotIn("futureSecret", self.read(self.alice_client, f"characters/{self.sheet.pk}")["fields"])
        self.assertIn("futureSecret", self.read(self.gm_client, f"characters/{self.sheet.pk}")["fields"])
        self.patch(self.alice_client, "futureSecret", "forged", status=400)

    def test_stale_and_other_viewer_revisions_fail_without_secret_payload(self):
        old = self.current()["revision"]
        self.patch(self.gm_client, "nombre", "GM edit")
        response = self.send(self.alice_client, f"characters/{self.sheet.pk}", {
            "expectedRevision": old, "changes": [{"path": "nombre", "value": "stale"}]}, method="patch", status=409)
        self.assertEqual(response, {"error": {"code": "revision_conflict"}})
        gm_revision = self.current(self.gm)["revision"]
        self.send(self.alice_client, f"characters/{self.sheet.pk}", {"expectedRevision": gm_revision,
            "changes": [{"path": "nombre", "value": "stale"}]}, method="patch", status=409)

    def test_preview_is_required_and_bound_to_revision_and_actor(self):
        current = self.current(self.gm)
        preview = self.send(self.gm_client, f"characters/{self.sheet.pk}/visibility/preview", {
            "expectedRevision": current["revision"], "defaultAudience": "shared"})
        self.send(self.alice_client, f"characters/{self.sheet.pk}/visibility", {"expectedRevision": self.current()["revision"],
            "previewToken": preview["previewToken"]}, status=409)
        self.patch(self.gm_client, "nombre", "Intervening change")
        self.send(self.gm_client, f"characters/{self.sheet.pk}/visibility", {"expectedRevision": self.current(self.gm)["revision"],
            "previewToken": preview["previewToken"]}, status=409)

    def test_campaign_defaults_preview_apply_and_explicit_sheet_override(self):
        preview = self.send(self.gm_client, f"campaigns/{self.campaign.pk}/visibility/preview", {
            "expectedRevision": 1, "defaults": {"character": {"*": "assigned", "notas": "gm"}}})
        self.send(self.gm_client, f"campaigns/{self.campaign.pk}/visibility", {"expectedRevision": 1, "previewToken": preview["previewToken"]})
        self.assertNotIn("notas", self.read(self.alice_client, f"characters/{self.sheet.pk}")["fields"])
        self.policy(self.gm_client, {"overrides": {"notas": "assigned"}})
        self.assertIn("notas", self.read(self.alice_client, f"characters/{self.sheet.pk}")["fields"])

    def test_list_cards_do_not_leak_hidden_type_or_search_values(self):
        Share.objects.create(sheet=self.sheet, recipient=self.bob)
        self.policy(self.gm_client, {"overrides": {"nombre": "shared", "characterType": "gm"}})
        result = self.read(self.bob_client, f"characters?campaignId={self.campaign.pk}")
        self.assertNotIn("characterType", json.dumps(result))
        self.read(self.bob_client, f"characters?campaignId={self.campaign.pk}&q=gm-secret-reputation", status=400)
        self.read(self.bob_client, f"characters?campaignId={self.campaign.pk}&sort=notas", status=400)

    def test_entity_default_replaces_campaign_defaults_but_keeps_field_exceptions(self):
        self.campaign.visibility_defaults = {"character": {"notas": "gm"}}
        self.campaign.save()
        self.policy(self.gm_client, {"overrides": {"characterType": "gm"}})
        self.policy(self.gm_client, {"defaultAudience": "assigned"})
        result = self.read(self.alice_client, f"characters/{self.sheet.pk}")
        self.assertIn("notas", result["fields"])
        self.assertNotIn("characterType", result["fields"])

    def test_player_cannot_forge_assignment_or_share(self):
        self.send(self.alice_client, "characters", {"campaignId": str(self.campaign.pk), "fields": {"nombre": "Demo"}, "assignedPlayerId": str(self.bob.pk)}, status=403)
        self.send(self.alice_client, f"characters/{self.sheet.pk}/manage", {"expectedRevision": self.current()["revision"], "assignedPlayerId": str(self.bob.pk)}, status=403)
        self.send(self.alice_client, f"characters/{self.sheet.pk}/sharing", {"expectedRevision": self.current()["revision"], "recipientId": str(self.bob.pk), "grant": True}, status=403)

    def test_gm_cannot_assign_or_share_outside_campaign(self):
        self.send(self.gm_client, f"characters/{self.sheet.pk}/manage", {"expectedRevision": self.current(self.gm)["revision"], "assignedPlayerId": str(self.outsider.pk)}, status=400)
        self.send(self.gm_client, f"characters/{self.sheet.pk}/sharing", {"expectedRevision": self.current(self.gm)["revision"], "recipientId": str(self.outsider.pk), "grant": True}, status=400)

    def test_create_both_entities_without_changing_local_records(self):
        for plural, fields in [("characters", {"nombre": "Demo wizard", "characterType": "adult_wizard"}), ("familiars", {"nombre": "Demo fox", "especie": "Fox"})]:
            created = self.send(self.alice_client, plural, {"campaignId": str(self.campaign.pk), "fields": fields})
            self.assertEqual(created["fields"], fields)
            self.read(self.bob_client, f"{plural}/{created['id']}", status=404)

    def test_membership_revocation_is_immediate_and_gm_role_is_scoped(self):
        self.send(self.gm_client, f"campaigns/{self.campaign.pk}/members", {"userId": str(self.alice.pk), "role": None})
        self.read(self.alice_client, f"characters/{self.sheet.pk}", status=404)
        other_sheet = Sheet.objects.create(campaign=self.other, creator=self.outsider, assigned_player=self.outsider, kind="character", data={"nombre": "Other"})
        self.read(self.gm_client, f"characters/{other_sheet.pk}", status=404)

    def test_gm_cannot_promote_themself_and_last_gm_is_preserved(self):
        self.send(self.gm_client, f"campaigns/{self.other.pk}/members", {"userId": str(self.gm.pk), "role": "gm"}, status=403)
        self.send(self.client_for(self.admin), f"campaigns/{self.campaign.pk}/members", {"userId": str(self.gm.pk), "role": None}, status=400)

    def test_archive_removes_player_access_but_gm_can_restore(self):
        result = self.send(self.gm_client, f"characters/{self.sheet.pk}/manage", {"expectedRevision": self.current(self.gm)["revision"], "archived": True})
        self.read(self.alice_client, f"characters/{self.sheet.pk}", status=404)
        self.assertTrue(result["archived"])
        self.send(self.gm_client, f"characters/{self.sheet.pk}/manage", {"expectedRevision": result["revision"], "archived": False})
        self.read(self.alice_client, f"characters/{self.sheet.pk}")

    def test_account_admin_is_not_implicitly_a_campaign_gm(self):
        self.read(self.client_for(self.admin), f"characters/{self.sheet.pk}", status=404)

    def test_forged_media_and_raw_bypass_routes_fail(self):
        self.patch(self.gm_client, "avatarImage", "https://private.invalid/secret.jpg", status=400)
        for path in ["sheets", f"characters/{self.sheet.pk}/raw", f"characters/{self.sheet.pk}/export", f"familiars/{self.familiar.pk}/export"]:
            self.read(self.alice_client, path, status=404)
        self.assertEqual(self.gm_client.get("/admin/").status_code, 404)
