import re
import time
from django.core import signing
from unittest.mock import patch
from django.conf import settings
from django.db import IntegrityError, transaction
from django.test.utils import CaptureQueriesContext
from django.db import connection
from domain.contracts import schema_contract
from domain.fields import REGISTRY
from domain.management.commands.export_api_contract import generated_source
from domain.models import Bond, Sheet, User
from domain.permissions import projection
from domain import services
from .base import APICase


class ContractTests(APICase):
    def test_generated_typescript_matches_server_schema(self):
        target = settings.BASE_DIR.parent / "src/contracts/fieldRegistry.generated.ts"
        self.assertEqual(target.read_text(encoding="utf-8"), generated_source())
        self.assertEqual(self.read(self.client_for(self.alice), "schema"), schema_contract())

    def test_screens_offer_exactly_the_server_character_types(self):
        # The old hand-written local types were compared here until R3.6 deleted them;
        # the generated contract above now covers the fields.
        source = (settings.BASE_DIR.parent / "src/data/gameData.ts").read_text(encoding="utf-8")
        block = re.search(r"export const CHARACTER_TYPES = \{(.*?)\n\} as const;", source, re.S).group(1)
        self.assertEqual(re.findall(r"^  (\w+): \{", block, re.M), REGISTRY["character"]["characterType"]["choices"])

    def test_projection_query_count_does_not_grow_per_field_or_item(self):
        self.sheet.data["habilidades"] = [{"id": f"skill-{i}", "nombre": f"Demo {i}", "valor": i % 6, "categoria": "mentales"} for i in range(100)]
        self.sheet.save()
        with CaptureQueriesContext(connection) as queries:
            result = projection(self.alice, self.sheet)
        self.assertEqual(len(result["fields"]["habilidades"]), 100)
        self.assertLessEqual(len(queries), 6)

    def test_visibility_preview_reports_audience_changes_without_content(self):
        client = self.client_for(self.gm)
        current = self.read(client, f"characters/{self.sheet.pk}")
        preview = self.send(client, f"characters/{self.sheet.pk}/visibility/preview", {
            "expectedRevision": current["revision"], "overrides": {"linaje": "shared"}})
        self.assertIn({"path": "linaje", "before": "assigned", "after": "shared"}, preview["audienceChanges"])
        self.assertNotIn("ordinary-gm-visible-journal", str(preview))

    def test_bond_failure_rolls_back_removed_and_new_links(self):
        Bond.objects.create(character=self.sheet, familiar=self.familiar)
        another = Sheet.objects.create(campaign=self.campaign, creator=self.alice, assigned_player=self.alice,
                                       kind="familiar", data={"nombre": "Demo fox"})
        source = projection(self.gm, self.sheet)
        target = projection(self.gm, another)
        with patch("domain.services.touch", side_effect=RuntimeError("simulated failure")):
            with self.assertRaises(RuntimeError):
                services.set_bond(self.gm, self.sheet.pk, "character", {"expectedRevision": source["revision"],
                    "targetId": str(another.pk), "targetRevision": target["revision"]})
        self.assertEqual(Bond.objects.get(character=self.sheet).familiar_id, self.familiar.pk)
        self.assertFalse(Bond.objects.filter(familiar=another).exists())

    def test_expired_and_tampered_policy_previews_fail(self):
        client = self.client_for(self.gm)
        revision = self.read(client, f"characters/{self.sheet.pk}")["revision"]
        with patch("django.core.signing.time.time", return_value=time.time() - 301):
            preview = self.send(client, f"characters/{self.sheet.pk}/visibility/preview", {
                "expectedRevision": revision, "defaultAudience": "shared"})
        for token in [preview["previewToken"], preview["previewToken"] + "tampered"]:
            self.send(client, f"characters/{self.sheet.pk}/visibility", {"expectedRevision": revision, "previewToken": token}, status=409)

    def test_database_enforces_case_insensitive_username_uniqueness(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.bulk_create([User(username="ALICE", password="!")])

    def test_player_policy_metadata_and_token_omit_now_hidden_paths_without_clearing_them(self):
        gm, alice = self.client_for(self.gm), self.client_for(self.alice)
        hidden = "notasList/note-a/contenido"
        self.policy(alice, {"restrictions": {hidden: True}})
        self.policy(gm, {"overrides": {"notasList": "gm"}})
        metadata = self.read(alice, f"characters/{self.sheet.pk}/visibility")
        self.assertEqual(metadata["restrictions"], {})
        revision = self.read(alice, f"characters/{self.sheet.pk}")["revision"]
        preview = self.send(alice, f"characters/{self.sheet.pk}/visibility/preview", {
            "expectedRevision": revision, "restrictions": {"nombre": True}})
        decoded = signing.loads(preview["previewToken"], salt="sheet-policy")
        self.assertNotIn("note-a", str(decoded))
        self.assertNotIn("note-a", str(preview["proposedPolicy"]))
        self.send(alice, f"characters/{self.sheet.pk}/visibility", {"expectedRevision": revision, "previewToken": preview["previewToken"]})
        self.sheet.refresh_from_db()
        self.assertTrue(self.sheet.player_restrictions[hidden])

    def test_invalid_database_text_is_rejected_without_partial_saves(self):
        client = self.client_for(self.alice)
        self.send(client, "personal-notes", {"title": "Demo", "content": "invalid\x00private-text"}, status=400)
        current = self.read(client, f"characters/{self.sheet.pk}")
        self.send(client, f"characters/{self.sheet.pk}", {"expectedRevision": current["revision"],
            "changes": [{"path": "nombre", "value": "invalid\x00name"}]}, method="patch", status=400)
        self.sheet.refresh_from_db()
        self.assertEqual(self.sheet.data["nombre"], "Fictional Luna")
