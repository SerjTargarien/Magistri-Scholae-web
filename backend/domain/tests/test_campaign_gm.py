from django.test import Client
from domain import accounts
from domain.models import Bond, MediaAsset, Membership, PersonalNote, Sheet
from .base import APICase, PASSWORD


class CampaignGMTests(APICase):
    """R4 (d): the GM creates and renames campaigns, invites players, assigns sheets and
    deletes archived ones."""

    def test_a_gm_creates_a_campaign_and_becomes_its_gm(self):
        result = self.send(self.client_for(self.gm), "campaigns", {"name": "  Nueva crónica "})
        self.assertEqual((result["name"], result["role"]), ("Nueva crónica", "gm"))
        self.assertTrue(Membership.objects.filter(campaign_id=result["id"], user=self.gm, role="gm").exists())
        self.send(self.client_for(self.alice), "campaigns", {"name": "Players cannot"}, status=403)
        admin_made = self.send(self.client_for(self.admin), "campaigns", {"name": "By the administrator"})
        self.assertIsNone(admin_made["role"])  # the administrator does not join it
        self.send(self.client_for(self.gm), "campaigns", {"name": "   "}, status=400)

    def test_the_gm_or_administrator_renames_a_campaign(self):
        self.assertEqual(self.send(self.client_for(self.gm), f"campaigns/{self.campaign.pk}", {"name": "Renamed"}, method="patch")["name"], "Renamed")
        self.send(self.client_for(self.alice), f"campaigns/{self.campaign.pk}", {"name": "Mine"}, method="patch", status=403)
        self.send(self.client_for(self.gm), f"campaigns/{self.other.pk}", {"name": "Not his"}, method="patch", status=403)  # a player there
        self.send(self.client_for(self.admin), f"campaigns/{self.other.pk}", {"name": "Fixed by admin"}, method="patch")

    def test_the_gm_lists_and_cancels_his_campaigns_player_invitations(self):
        token, invite = accounts.issue_invitation(self.gm, self.campaign.pk, "player")
        _, gm_invite = accounts.issue_invitation(self.admin, self.campaign.pk, "gm")
        accounts.issue_invitation(self.admin, self.other.pk, "player")
        gm = self.client_for(self.gm)
        ids = [i["id"] for i in self.read(gm, f"campaigns/{self.campaign.pk}/invitations")["items"]]
        self.assertEqual(sorted(ids), sorted([str(invite.pk), str(gm_invite.pk)]))
        self.read(self.client_for(self.alice), f"campaigns/{self.campaign.pk}/invitations", status=403)
        self.send(gm, f"campaigns/{self.campaign.pk}/invitations/{gm_invite.pk}", method="delete", status=403)  # GM invitations: the administrator's
        self.send(gm, f"campaigns/{self.campaign.pk}/invitations/{invite.pk}", method="delete")
        self.send(Client(), "auth/register", {"invitationToken": token, "username": "late", "password": PASSWORD}, status=400)

    def test_the_gm_reassigns_a_sheet_and_the_player_keeps_their_notes(self):
        note = PersonalNote.objects.create(author=self.alice, sheet=self.sheet, title="Mine")
        gm = self.client_for(self.gm)
        current = self.read(gm, f"characters/{self.sheet.pk}")
        result = self.send(gm, f"characters/{self.sheet.pk}/manage", {"expectedRevision": current["revision"], "assignedPlayerId": str(self.bob.pk)})
        self.assertEqual(result["assignedPlayerId"], str(self.bob.pk))
        self.read(self.client_for(self.alice), f"characters/{self.sheet.pk}", status=404)
        note.refresh_from_db()
        self.assertEqual((note.author_id, note.sheet_id), (self.alice.pk, self.sheet.pk))
        current = self.read(gm, f"characters/{self.sheet.pk}")
        self.assertIsNone(self.send(gm, f"characters/{self.sheet.pk}/manage", {"expectedRevision": current["revision"], "assignedPlayerId": None})["assignedPlayerId"])

    def test_only_an_archived_sheet_is_deleted_with_its_images_and_notes_stay(self):
        gm = self.client_for(self.gm)
        note = PersonalNote.objects.create(author=self.alice, sheet=self.sheet, title="Kept")
        MediaAsset.objects.create(sheet=self.sheet, field_path="avatarImage", storage_name="missing-file.png", width=1, height=1)
        Bond.objects.create(character=self.sheet, familiar=self.familiar)
        current = self.read(gm, f"characters/{self.sheet.pk}")
        self.assertEqual(self.send(gm, f"characters/{self.sheet.pk}", {"expectedRevision": current["revision"]}, method="delete", status=409)["error"]["code"], "not_archived")
        self.send(self.client_for(self.alice), f"characters/{self.sheet.pk}", {"expectedRevision": "x"}, method="delete", status=403)
        archived = self.send(gm, f"characters/{self.sheet.pk}/manage", {"expectedRevision": current["revision"], "archived": True})
        with self.captureOnCommitCallbacks(execute=True):
            self.send(gm, f"characters/{self.sheet.pk}", {"expectedRevision": archived["revision"]}, method="delete")
        self.assertFalse(Sheet.objects.filter(pk=self.sheet.pk).exists())
        self.assertFalse(MediaAsset.objects.filter(field_path="avatarImage", storage_name="missing-file.png").exists())
        note.refresh_from_db()
        self.assertIsNone(note.sheet_id)  # the author keeps it, unlinked
        self.assertTrue(Sheet.objects.filter(pk=self.familiar.pk).exists())
        self.assertFalse(Bond.objects.filter(familiar=self.familiar).exists())
