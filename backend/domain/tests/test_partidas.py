from domain.models import AuditEvent, Sheet, Table
from .base import APICase


class PartidaTests(APICase):
    """The campaign's partidas (R4 b): the GM's own table management, never shown to players."""

    def tables(self, client, campaign=None, status=200):
        return self.read(client, f"campaigns/{(campaign or self.campaign).pk}/tables", status=status)

    def manage(self, client, body, sheet=None, plural="characters", status=200):
        target = sheet or self.sheet
        current = self.read(self.client_for(self.gm), f"{plural}/{target.pk}")
        return self.send(client, f"{plural}/{target.pk}/manage", {"expectedRevision": current["revision"], **body}, status=status)

    def test_gm_creates_renames_and_lists_partidas(self):
        gm = self.client_for(self.gm)
        first = self.send(gm, f"campaigns/{self.campaign.pk}/tables", {"name": "  Mesa del jueves "})
        self.assertEqual(first["name"], "Mesa del jueves")
        self.send(gm, f"campaigns/{self.campaign.pk}/tables", {"name": "Mesa del sábado"})
        renamed = self.send(gm, f"campaigns/{self.campaign.pk}/tables/{first['id']}", {"name": "Los jueves"}, method="patch")
        self.assertEqual(renamed["name"], "Los jueves")
        self.assertEqual([t["name"] for t in self.tables(gm)["items"]], ["Los jueves", "Mesa del sábado"])
        self.assertTrue(AuditEvent.objects.filter(action="table.renamed", target_id=first["id"]).exists())

    def test_names_are_required_unique_ignoring_case_and_limited(self):
        gm = self.client_for(self.gm)
        path = f"campaigns/{self.campaign.pk}/tables"
        self.send(gm, path, {"name": "   "}, status=400)
        self.send(gm, path, {"name": "x" * 61}, status=400)
        self.send(gm, path, {"name": "Jueves"})
        self.assertEqual(self.send(gm, path, {"name": "JUEVES"}, status=400)["error"]["code"], "duplicate_table")
        for n in range(11):
            self.send(gm, path, {"name": f"Partida {n}"})
        self.assertEqual(self.send(gm, path, {"name": "One too many"}, status=400)["error"]["code"], "too_many_items")

    def test_players_and_other_campaigns_cannot_see_or_change_partidas(self):
        Table.objects.create(campaign=self.campaign, name="Jueves")
        self.tables(self.client_for(self.alice), status=403)
        self.send(self.client_for(self.alice), f"campaigns/{self.campaign.pk}/tables", {"name": "Mine"}, status=403)
        # The GM here is only a player in the other campaign.
        self.tables(self.client_for(self.gm), campaign=self.other, status=403)
        self.tables(self.client_for(self.admin), status=404)  # the site administrator is not the GM

    def test_gm_places_a_character_and_players_never_receive_it(self):
        table = Table.objects.create(campaign=self.campaign, name="Jueves")
        result = self.manage(self.client_for(self.gm), {"tableId": str(table.pk)})
        self.assertEqual(result["tableId"], str(table.pk))
        player_view = self.read(self.client_for(self.alice), f"characters/{self.sheet.pk}")
        self.assertNotIn("tableId", player_view)
        self.assertNotIn("Jueves", str(self.read(self.client_for(self.alice), f"characters?campaignId={self.campaign.pk}")))
        self.assertEqual(self.manage(self.client_for(self.gm), {"tableId": None})["tableId"], None)

    def test_only_the_gm_and_only_this_campaigns_partidas(self):
        mine = Table.objects.create(campaign=self.campaign, name="Jueves")
        foreign = Table.objects.create(campaign=self.other, name="Ajena")
        self.manage(self.client_for(self.alice), {"tableId": str(mine.pk)}, status=403)
        self.assertEqual(self.manage(self.client_for(self.gm), {"tableId": str(foreign.pk)}, status=400)["error"]["code"], "invalid_table")
        self.manage(self.client_for(self.gm), {"tableId": "not-a-uuid"}, status=400)

    def test_familiars_follow_their_bond_and_take_no_partida(self):
        table = Table.objects.create(campaign=self.campaign, name="Jueves")
        result = self.manage(self.client_for(self.gm), {"tableId": str(table.pk)}, sheet=self.familiar, plural="familiars", status=400)
        self.assertEqual(result["error"]["code"], "invalid_table")
        self.assertNotIn("tableId", self.read(self.client_for(self.gm), f"familiars/{self.familiar.pk}"))

    def test_removing_a_partida_keeps_its_characters_without_one(self):
        gm = self.client_for(self.gm)
        table = Table.objects.create(campaign=self.campaign, name="Jueves")
        self.manage(gm, {"tableId": str(table.pk)})
        before = self.read(gm, f"characters/{self.sheet.pk}")["revision"]
        self.send(gm, f"campaigns/{self.campaign.pk}/tables/{table.pk}", method="delete")
        after = self.read(gm, f"characters/{self.sheet.pk}")
        self.assertIsNone(after["tableId"])
        self.assertNotEqual(after["revision"], before)  # the GM's copy changed
        self.assertTrue(Sheet.objects.filter(pk=self.sheet.pk).exists())
        self.assertEqual(self.tables(gm)["items"], [])
        self.send(gm, f"campaigns/{self.campaign.pk}/tables/{table.pk}", method="delete", status=404)
