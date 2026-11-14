from domain.models import Bond, Share, Sheet
from .base import APICase


class DraftTests(APICase):
    """Drafts, proposals and active sheets (R4 c): a player's drafts are a private vault the GM
    does not see at all; the GM reviews a proposal read-only and confirms it as the player's
    character or as his own NPC, or returns it."""

    def create(self, actor, kind="character", name="Fictional Draft"):
        fields = {"nombre": name, "characterType": "student"} if kind == "character" else {"nombre": name, "especie": "Owl"}
        plural = "characters" if kind == "character" else "familiars"
        result = self.send(self.client_for(actor), plural, {"campaignId": str(self.campaign.pk), "fields": fields})
        return Sheet.objects.get(pk=result["id"]), result

    def status(self, actor, sheet, action, status=200, **extra):
        plural = "characters" if sheet.kind == "character" else "familiars"
        current = self.read(self.client_for(actor), f"{plural}/{sheet.pk}")
        return self.send(self.client_for(actor), f"{plural}/{sheet.pk}/status",
                         {"expectedRevision": current["revision"], "action": action, **extra}, status=status)

    def listed(self, actor, plural="characters"):
        return [s["id"] for s in self.read(self.client_for(actor), f"{plural}?campaignId={self.campaign.pk}")["items"]]

    def test_a_players_new_sheet_is_a_draft_the_gm_cannot_see(self):
        sheet, result = self.create(self.alice)
        self.assertEqual((result["status"], result["active"]), ("draft", True))
        self.assertIn(str(sheet.pk), self.listed(self.alice))
        self.assertNotIn(str(sheet.pk), self.listed(self.gm))
        self.read(self.client_for(self.gm), f"characters/{sheet.pk}", status=404)
        self.send(self.client_for(self.gm), f"characters/{sheet.pk}/manage", {"expectedRevision": "x", "archived": True}, status=404)
        self.send(self.client_for(self.gm), f"characters/{sheet.pk}", {"expectedRevision": "x", "changes": [{"path": "nombre", "value": "Seen"}]}, method="patch", status=404)

    def test_the_gms_own_sheets_and_existing_sheets_are_confirmed(self):
        _, result = self.create(self.gm, name="Fictional NPC")
        self.assertEqual(result["status"], "confirmed")
        self.assertEqual(self.read(self.client_for(self.alice), f"characters/{self.sheet.pk}")["status"], "confirmed")

    def test_a_proposal_is_read_only_until_withdrawn_or_returned(self):
        sheet, _ = self.create(self.alice)
        self.status(self.gm, self.sheet, "propose", status=403)  # not his to propose
        proposed = self.status(self.alice, sheet, "propose")
        self.assertEqual(proposed["status"], "proposed")
        self.assertEqual(proposed["capabilities"]["writablePaths"], [])
        gm_view = self.read(self.client_for(self.gm), f"characters/{sheet.pk}")
        self.assertEqual((gm_view["status"], gm_view["capabilities"]["writablePaths"]), ("proposed", []))
        self.send(self.client_for(self.alice), f"characters/{sheet.pk}",
                  {"expectedRevision": proposed["revision"], "changes": [{"path": "nombre", "value": "Changed"}]}, method="patch", status=403)
        self.assertEqual(self.status(self.alice, sheet, "withdraw")["status"], "draft")
        self.status(self.alice, sheet, "propose")
        self.assertEqual(self.status(self.gm, sheet, "return"), {"status": "draft"})  # the GM no longer sees it
        self.read(self.client_for(self.gm), f"characters/{sheet.pk}", status=404)
        self.status(self.alice, sheet, "confirm", status=403, **{"as": "player"})

    def test_confirmed_as_the_players_character(self):
        sheet, _ = self.create(self.alice)
        self.status(self.alice, sheet, "propose")
        self.status(self.gm, sheet, "confirm", status=400)  # PJ or PNJ must be chosen
        confirmed = self.status(self.gm, sheet, "confirm", **{"as": "player"})
        self.assertEqual((confirmed["status"], confirmed["assignedPlayerId"]), ("confirmed", str(self.alice.pk)))
        self.assertTrue(self.read(self.client_for(self.alice), f"characters/{sheet.pk}")["capabilities"]["writablePaths"])
        self.status(self.alice, sheet, "withdraw", status=409)

    def test_confirmed_as_the_gms_npc_the_player_loses_it(self):
        sheet, _ = self.create(self.alice)
        self.status(self.alice, sheet, "propose")
        Share.objects.create(sheet=sheet, recipient=self.bob)
        confirmed = self.status(self.gm, sheet, "confirm", **{"as": "npc"})
        self.assertEqual(confirmed["assignedPlayerId"], str(self.gm.pk))
        self.read(self.client_for(self.alice), f"characters/{sheet.pk}", status=404)
        self.read(self.client_for(self.bob), f"characters/{sheet.pk}", status=404)

    def test_a_bonded_draft_familiar_moves_with_its_character(self):
        sheet, _ = self.create(self.alice)
        familiar, _ = self.create(self.alice, kind="familiar", name="Fictional Draft Owl")
        Bond.objects.create(character=sheet, familiar=familiar)
        self.status(self.alice, sheet, "propose")
        familiar.refresh_from_db()
        self.assertEqual(familiar.status, "proposed")
        self.status(self.gm, sheet, "confirm", **{"as": "npc"})
        familiar.refresh_from_db()
        self.assertEqual((familiar.status, familiar.assigned_player_id), ("confirmed", self.gm.pk))

    def test_a_draft_bonds_only_with_another_draft(self):
        sheet, _ = self.create(self.alice)
        current = self.read(self.client_for(self.alice), f"characters/{sheet.pk}")
        target = self.read(self.client_for(self.alice), f"familiars/{self.familiar.pk}")  # confirmed
        result = self.send(self.client_for(self.alice), f"characters/{sheet.pk}/bond",
                           {"expectedRevision": current["revision"], "targetId": str(self.familiar.pk), "targetRevision": target["revision"]}, status=400)
        self.assertEqual(result["error"]["code"], "invalid_bond")

    def test_the_gm_sets_active_on_confirmed_sheets_and_the_player_still_edits(self):
        gm = self.client_for(self.gm)
        current = self.read(gm, f"characters/{self.sheet.pk}")
        self.assertFalse(self.send(gm, f"characters/{self.sheet.pk}/manage", {"expectedRevision": current["revision"], "active": False})["active"])
        player_view = self.read(self.client_for(self.alice), f"characters/{self.sheet.pk}")
        self.assertFalse(player_view["active"])
        self.send(self.client_for(self.alice), f"characters/{self.sheet.pk}",
                  {"expectedRevision": player_view["revision"], "changes": [{"path": "concepto", "value": "Travelling"}]}, method="patch")
        self.send(self.client_for(self.alice), f"characters/{self.sheet.pk}/manage", {"expectedRevision": player_view["revision"], "active": True}, status=403)

    def test_gm_only_actions_wait_for_confirmation(self):
        sheet, _ = self.create(self.alice)
        self.status(self.alice, sheet, "propose")
        current = self.read(self.client_for(self.gm), f"characters/{sheet.pk}")
        result = self.send(self.client_for(self.gm), f"characters/{sheet.pk}/manage", {"expectedRevision": current["revision"], "active": False}, status=409)
        self.assertEqual(result["error"]["code"], "not_confirmed")
