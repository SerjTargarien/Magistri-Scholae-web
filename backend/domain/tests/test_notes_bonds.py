import json
from datetime import timedelta
from django.test import Client
from django.utils import timezone
from domain.models import Bond, Membership, PersonalNote, Share, Sheet
from .base import APICase


class NotesAndBondsTests(APICase):
    def setUp(self):
        self.gm_client = self.client_for(self.gm)
        self.alice_client = self.client_for(self.alice)
        self.bob_client = self.client_for(self.bob)

    def create_note(self):
        return self.send(self.alice_client, "personal-notes", {"sheetId": str(self.sheet.pk), "title": "private-title-marker", "content": "private-body-marker", "label": "Author label"})

    def bond(self, actor, client, source, target=None, status=200):
        plural = "characters" if source.kind == "character" else "familiars"
        body = {"expectedRevision": self.current(actor, source)["revision"], "targetId": str(target.pk) if target else None}
        if target:
            body["targetRevision"] = self.current(actor, target)["revision"]
        return self.send(client, f"{plural}/{source.pk}/bond", body, status=status)

    def test_personal_notes_inaccessible_to_gm_bob_and_operator(self):
        note = self.create_note()
        for user in [self.gm, self.bob, self.admin]:
            client = self.client_for(user)
            self.read(client, f"personal-notes/{note['id']}", status=404)
            listed = self.read(client, "personal-notes")
            self.assertEqual(listed["items"], [])
            self.send(client, f"personal-notes/{note['id']}", {"expectedRevision": 1, "content": "forged"}, method="patch", status=404)
            self.send(client, f"personal-notes/{note['id']}", {"expectedRevision": 1}, method="delete", status=404)
        for path in [f"characters/{self.sheet.pk}", f"characters?campaignId={self.campaign.pk}", f"characters/{self.sheet.pk}/gm-notes"]:
            result = self.read(self.gm_client, path)
            self.assertNotIn("private-title-marker", json.dumps(result))
            self.assertNotIn("private-body-marker", json.dumps(result))

    def test_personal_notes_survive_reassignment_and_membership_removal(self):
        note = self.create_note()
        self.send(self.gm_client, f"characters/{self.sheet.pk}/manage", {"expectedRevision": self.current(self.gm)["revision"], "assignedPlayerId": str(self.bob.pk)})
        self.read(self.alice_client, f"characters/{self.sheet.pk}", status=404)
        self.assertEqual(self.read(self.alice_client, f"personal-notes/{note['id']}")["content"], "private-body-marker")
        self.read(self.bob_client, f"personal-notes/{note['id']}", status=404)
        self.send(self.gm_client, f"campaigns/{self.campaign.pk}/members", {"userId": str(self.alice.pk), "role": None})
        self.assertEqual(self.read(self.alice_client, "personal-notes")["items"][0]["label"], "Author label")

    def test_personal_note_revision_and_author_only_deletion(self):
        note = self.create_note()
        updated = self.send(self.alice_client, f"personal-notes/{note['id']}", {"expectedRevision": 1, "content": "revised private marker"}, method="patch")
        self.assertEqual(updated["revision"], 2)
        self.send(self.alice_client, f"personal-notes/{note['id']}", {"expectedRevision": 1, "content": "stale"}, method="patch", status=409)
        self.send(self.alice_client, f"personal-notes/{note['id']}", {"expectedRevision": 2}, method="delete")
        self.assertFalse(PersonalNote.objects.filter(pk=note["id"]).exists())

    def test_private_notes_keep_when_they_were_written_newest_first_and_by_sheet(self):
        about_sheet = self.send(self.alice_client, "personal-notes", {"sheetId": str(self.sheet.pk), "content": "about the sheet"})
        self.assertEqual(about_sheet["title"], "")  # the title is optional
        PersonalNote.objects.filter(pk=about_sheet["id"]).update(created_at=timezone.now() - timedelta(hours=2))
        written = self.read(self.alice_client, f"personal-notes/{about_sheet['id']}")["createdAt"]
        edited = self.send(self.alice_client, f"personal-notes/{about_sheet['id']}", {"expectedRevision": 1, "content": "edited later"}, method="patch")
        self.assertEqual(edited["createdAt"], written)  # editing never changes when it was written
        self.assertGreater(edited["updatedAt"], written)
        no_sheet = self.send(self.alice_client, "personal-notes", {"content": "about no sheet"})
        listed = [n["id"] for n in self.read(self.alice_client, "personal-notes")["items"]]
        self.assertEqual(listed, [no_sheet["id"], about_sheet["id"]])  # newest written first
        on_sheet = self.read(self.alice_client, f"personal-notes?sheetId={self.sheet.pk}")["items"]
        self.assertEqual([n["id"] for n in on_sheet], [about_sheet["id"]])
        self.read(self.alice_client, "personal-notes?sheetId=not-an-id", status=400)
        self.assertEqual(self.read(self.gm_client, f"personal-notes?sheetId={self.sheet.pk}")["items"], [])  # still author-only

    def test_private_note_limits_name_the_field(self):
        error = self.send(self.alice_client, "personal-notes", {"title": "x" * 201, "content": ""}, status=400)["error"]
        self.assertEqual(error, {"code": "field_too_long", "path": "title", "rule": "maxLength", "limit": 200})
        note = self.send(self.alice_client, "personal-notes", {"content": "ok"})
        error = self.send(self.alice_client, f"personal-notes/{note['id']}", {"expectedRevision": 1, "content": "y" * 64001}, method="patch", status=400)["error"]
        self.assertEqual(error["path"], "content")
        self.assertEqual(error["limit"], 64000)

    def test_personal_note_author_cannot_be_forged_or_filtered(self):
        self.send(self.alice_client, "personal-notes", {"title": "Demo", "content": "Demo", "authorId": str(self.gm.pk)}, status=400)
        self.read(self.gm_client, f"personal-notes?authorId={self.alice.pk}", status=400)
        self.read(self.gm_client, "personal-notes?q=private-body-marker", status=400)

    def test_gm_note_is_separate_and_denied_to_assigned_player(self):
        self.send(self.gm_client, f"characters/{self.sheet.pk}/gm-notes", {"expectedRevision": 0, "content": "gm-note-marker"}, method="patch")
        self.read(self.alice_client, f"characters/{self.sheet.pk}/gm-notes", status=403)
        sheet = self.read(self.alice_client, f"characters/{self.sheet.pk}")
        self.assertNotIn("gm-note-marker", json.dumps(sheet))

    def test_bond_does_not_grant_familiar_access_or_reveal_its_id(self):
        self.bond(self.gm, self.gm_client, self.sheet, self.familiar)
        Share.objects.create(sheet=self.sheet, recipient=self.bob)
        self.policy(self.gm_client, {"defaultAudience": "shared"})
        result = self.read(self.bob_client, f"characters/{self.sheet.pk}")
        self.assertNotIn("bondId", result)
        self.read(self.bob_client, f"familiars/{self.familiar.pk}", status=404)
        self.assertNotIn(str(self.familiar.pk), json.dumps(result))

    def test_bond_visible_only_when_both_entities_independently_authorized(self):
        self.bond(self.gm, self.gm_client, self.sheet, self.familiar)
        for sheet in [self.sheet, self.familiar]:
            Share.objects.create(sheet=sheet, recipient=self.bob)
            self.policy(self.gm_client, {"defaultAudience": "shared"}, sheet=sheet, plural="characters" if sheet.kind == "character" else "familiars")
        result = self.read(self.bob_client, f"characters/{self.sheet.pk}")
        self.assertEqual(result["bondId"], str(self.familiar.pk))
        self.assertEqual(self.read(self.bob_client, f"familiars/{self.familiar.pk}")["capabilities"]["writablePaths"], [])

    def test_player_bond_both_directions_unbond_and_reassignment(self):
        self.bond(self.alice, self.alice_client, self.sheet, self.familiar)
        second = Sheet.objects.create(campaign=self.campaign, creator=self.alice, assigned_player=self.alice, kind="familiar", data={"nombre": "Demo fox"})
        self.bond(self.alice, self.alice_client, second, self.sheet)
        self.assertFalse(Bond.objects.filter(familiar=self.familiar).exists())
        self.assertEqual(Bond.objects.get(character=self.sheet).familiar_id, second.pk)
        self.bond(self.alice, self.alice_client, second)
        self.assertFalse(Bond.objects.exists())

    def test_cross_owner_bond_requires_gm(self):
        self.familiar.assigned_player = self.bob
        self.familiar.save()
        Share.objects.create(sheet=self.familiar, recipient=self.alice)
        self.bond(self.alice, self.alice_client, self.sheet, self.familiar, status=403)
        self.bond(self.gm, self.gm_client, self.sheet, self.familiar)
        self.assertEqual(Bond.objects.count(), 1)

    def test_bonds_reject_other_campaign_and_preserve_previous_link(self):
        self.bond(self.gm, self.gm_client, self.sheet, self.familiar)
        Membership.objects.filter(campaign=self.other, user=self.gm).update(role="gm")
        foreign = Sheet.objects.create(campaign=self.other, creator=self.gm, assigned_player=self.gm, kind="familiar", data={"nombre": "Other"})
        self.bond(self.gm, self.gm_client, self.sheet, foreign, status=400)
        self.assertEqual(Bond.objects.get(character=self.sheet).familiar_id, self.familiar.pk)

    def test_familiar_fields_have_independent_visibility(self):
        self.policy(self.gm_client, {"overrides": {"descripcion": "gm"}}, sheet=self.familiar, plural="familiars")
        result = self.read(self.alice_client, f"familiars/{self.familiar.pk}")
        self.assertNotIn("descripcion", result["fields"])

    def test_no_generic_admin_or_promotion_bypass(self):
        note = self.create_note()
        for client in [self.gm_client, self.client_for(self.admin)]:
            self.send(client, f"personal-notes/{note['id']}/promote/preview", {
                "sheetId": str(self.sheet.pk), "expectedRevision": self.current(self.gm)["revision"], "noteRevision": note["revision"]}, status=404)
            self.read(client, "admin/personal-notes", status=404)
