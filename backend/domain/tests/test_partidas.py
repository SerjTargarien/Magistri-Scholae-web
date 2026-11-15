from domain.models import AuditEvent, Sheet, Table
from .base import APICase


class PartidaTests(APICase):
    """The campaign's partidas (R4 b): the GM's own table management, never shown to players."""

    def tables(self, client, campaign=None, status=200):
        return self.read(client, f"campaigns/{(campaign or self.campaign).pk}/tables", status=status)

    def choose(self, client, table, ids, status=200):
        return self.send(client, f"campaigns/{self.campaign.pk}/tables/{table.pk}/characters", {"characterIds": [str(i) for i in ids]}, status=status)

    def partidas_of(self, sheet=None):
        return self.read(self.client_for(self.gm), f"characters/{(sheet or self.sheet).pk}")["tableIds"]

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
        self.assertEqual(self.partidas_of(), [])  # common to all
        before = self.read(self.client_for(self.gm), f"characters/{self.sheet.pk}")["revision"]
        self.assertEqual(self.choose(self.client_for(self.gm), table, [self.sheet.pk])["characterIds"], [str(self.sheet.pk)])
        after = self.read(self.client_for(self.gm), f"characters/{self.sheet.pk}")
        self.assertEqual(after["tableIds"], [str(table.pk)])
        self.assertNotEqual(after["revision"], before)
        player_view = self.read(self.client_for(self.alice), f"characters/{self.sheet.pk}")
        self.assertNotIn("tableIds", player_view)
        self.assertNotIn("Jueves", str(self.read(self.client_for(self.alice), f"characters?campaignId={self.campaign.pk}")))
        self.choose(self.client_for(self.gm), table, [])
        self.assertEqual(self.partidas_of(), [])

    def test_a_character_can_belong_to_several_partidas(self):
        gm = self.client_for(self.gm)
        jueves = Table.objects.create(campaign=self.campaign, name="Jueves")
        sabado = Table.objects.create(campaign=self.campaign, name="Sábado")
        self.choose(gm, jueves, [self.sheet.pk])
        self.choose(gm, sabado, [self.sheet.pk])
        self.assertEqual(self.partidas_of(), [str(jueves.pk), str(sabado.pk)])
        self.choose(gm, jueves, [])  # leaving it out removes only this partida
        self.assertEqual(self.partidas_of(), [str(sabado.pk)])
        listed = self.read(gm, f"characters?campaignId={self.campaign.pk}")["items"]
        self.assertEqual(next(i for i in listed if i["id"] == str(self.sheet.pk))["tableIds"], [str(sabado.pk)])

    def test_only_the_gm_and_only_this_campaigns_characters(self):
        mine = Table.objects.create(campaign=self.campaign, name="Jueves")
        foreign = Table.objects.create(campaign=self.other, name="Ajena")
        self.choose(self.client_for(self.alice), mine, [self.sheet.pk], status=403)
        self.choose(self.client_for(self.admin), mine, [self.sheet.pk], status=404)
        self.send(self.client_for(self.gm), f"campaigns/{self.campaign.pk}/tables/{foreign.pk}/characters", {"characterIds": []}, status=404)
        self.assertEqual(self.choose(self.client_for(self.gm), mine, ["not-a-sheet"], status=400)["error"]["code"], "invalid_table")
        self.send(self.client_for(self.gm), f"campaigns/{self.campaign.pk}/tables/{mine.pk}/characters", {"characterIds": "x"}, status=400)

    def test_familiars_follow_their_bond_and_take_no_partida(self):
        table = Table.objects.create(campaign=self.campaign, name="Jueves")
        self.assertEqual(self.choose(self.client_for(self.gm), table, [self.familiar.pk], status=400)["error"]["code"], "invalid_table")
        self.assertNotIn("tableIds", self.read(self.client_for(self.gm), f"familiars/{self.familiar.pk}"))

    def test_archived_characters_keep_their_partidas(self):
        gm = self.client_for(self.gm)
        table = Table.objects.create(campaign=self.campaign, name="Jueves")
        self.choose(gm, table, [self.sheet.pk])
        Sheet.objects.filter(pk=self.sheet.pk).update(archived=True)
        self.choose(gm, table, [])
        self.assertEqual(self.partidas_of(), [str(table.pk)])

    def test_removing_a_partida_keeps_its_characters_without_one(self):
        gm = self.client_for(self.gm)
        table = Table.objects.create(campaign=self.campaign, name="Jueves")
        self.choose(gm, table, [self.sheet.pk])
        before = self.read(gm, f"characters/{self.sheet.pk}")["revision"]
        self.send(gm, f"campaigns/{self.campaign.pk}/tables/{table.pk}", method="delete")
        after = self.read(gm, f"characters/{self.sheet.pk}")
        self.assertEqual(after["tableIds"], [])
        self.assertNotEqual(after["revision"], before)  # the GM's copy changed
        self.assertTrue(Sheet.objects.filter(pk=self.sheet.pk).exists())
        self.assertEqual(self.tables(gm)["items"], [])
        self.send(gm, f"campaigns/{self.campaign.pk}/tables/{table.pk}", method="delete", status=404)
