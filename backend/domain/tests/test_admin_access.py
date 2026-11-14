from datetime import timedelta
from django.utils import timezone
from domain.models import AdminAccess, AdminAccessEvent, AuditEvent, PersonalNote, Sheet
from .base import APICase


class AdminAccessTests(APICase):
    """R4 (e): the site administrator reaches a campaign's sheets only while its GM allows it."""

    def grant(self, reason="La ficha de Luna no guarda"):
        return self.send(self.client_for(self.gm), f"campaigns/{self.campaign.pk}/admin-access", {"reason": reason})["access"]

    def draft(self):
        result = self.send(self.client_for(self.alice), "characters",
                           {"campaignId": str(self.campaign.pk), "fields": {"nombre": "Fictional Secret Draft", "characterType": "student"}})
        return Sheet.objects.get(pk=result["id"])

    def test_without_an_access_the_administrator_reads_no_sheet(self):
        operator = self.client_for(self.admin)
        self.read(operator, f"characters?campaignId={self.campaign.pk}", status=404)
        self.read(operator, f"characters/{self.sheet.pk}", status=404)

    def test_only_the_gm_grants_and_a_reason_is_required(self):
        self.send(self.client_for(self.alice), f"campaigns/{self.campaign.pk}/admin-access", {"reason": "x"}, status=403)
        self.send(self.client_for(self.admin), f"campaigns/{self.campaign.pk}/admin-access", {"reason": "x"}, status=403)
        self.send(self.client_for(self.gm), f"campaigns/{self.campaign.pk}/admin-access", {"reason": "   "}, status=400)
        access = self.grant()
        self.assertTrue(access["active"])
        self.assertTrue(AuditEvent.objects.filter(action="admin_access.granted", target_id=access["id"]).exists())

    def test_during_an_access_the_administrator_reads_and_changes_every_sheet_drafts_included(self):
        draft = self.draft()
        self.grant()
        operator = self.client_for(self.admin)
        listed = [s["id"] for s in self.read(operator, f"characters?campaignId={self.campaign.pk}")["items"]]
        self.assertIn(str(draft.pk), listed)  # drafts included (owner, 14 November 2026)
        self.assertNotIn(str(draft.pk), [s["id"] for s in self.read(self.client_for(self.gm), f"characters?campaignId={self.campaign.pk}")["items"]])
        view = self.read(operator, f"characters/{self.sheet.pk}")
        self.assertIn("gm-secret-reputation", str(view))
        self.send(operator, f"characters/{self.sheet.pk}", {"expectedRevision": view["revision"],
                  "changes": [{"path": "concepto", "value": "Fixed by support"}]}, method="patch")
        self.read(operator, f"campaigns/{self.campaign.pk}/skill-catalogue")
        # Never the GM's decisions or tools.
        current = self.read(operator, f"characters/{self.sheet.pk}")
        self.send(operator, f"characters/{self.sheet.pk}/manage", {"expectedRevision": current["revision"], "archived": True}, status=404)
        self.read(operator, f"campaigns/{self.campaign.pk}/tables", status=404)
        self.send(operator, f"characters/{self.sheet.pk}/visibility/preview", {"expectedRevision": current["revision"], "defaultAudience": "gm"}, status=403)

    def test_private_notes_stay_excluded(self):
        PersonalNote.objects.create(author=self.alice, sheet=self.sheet, title="Fictional private", content="never-for-support")
        self.grant()
        operator = self.client_for(self.admin)
        self.assertNotIn("never-for-support", str(self.read(operator, f"personal-notes?sheetId={self.sheet.pk}")))
        self.assertNotIn("never-for-support", str(self.read(operator, f"characters/{self.sheet.pk}")))

    def test_the_gm_sees_a_log_of_what_was_opened_and_changed(self):
        self.grant()
        operator = self.client_for(self.admin)
        self.read(operator, f"characters/{self.sheet.pk}")
        view = self.read(operator, f"characters/{self.sheet.pk}")
        self.send(operator, f"characters/{self.sheet.pk}", {"expectedRevision": view["revision"],
                  "changes": [{"path": "concepto", "value": "Fixed"}]}, method="patch")
        self.read(self.client_for(self.gm), f"characters/{self.sheet.pk}")  # the GM's own reads are not logged
        events = self.read(self.client_for(self.gm), f"campaigns/{self.campaign.pk}/admin-access")["access"]["events"]
        summary = {(e["name"], e["action"], e["count"]) for e in events}
        self.assertEqual(summary, {("Fictional Luna", "read", 2), ("Fictional Luna", "write", 1)})
        self.read(self.client_for(self.alice), f"campaigns/{self.campaign.pk}/admin-access", status=403)

    def test_the_access_ends_when_withdrawn_solved_or_expired(self):
        operator = self.client_for(self.admin)
        access = self.grant()
        self.assertEqual([a["id"] for a in self.read(operator, "admin/accesses")["items"]], [access["id"]])
        self.send(self.client_for(self.gm), f"campaigns/{self.campaign.pk}/admin-access", method="delete")
        self.read(operator, f"characters/{self.sheet.pk}", status=404)
        access = self.grant()
        self.send(self.client_for(self.gm), f"admin/accesses/{access['id']}/solved", status=403)
        self.assertEqual(self.send(operator, f"admin/accesses/{access['id']}/solved")["access"]["endReason"], "solved")
        self.read(operator, f"characters/{self.sheet.pk}", status=404)
        access = self.grant()
        AdminAccess.objects.filter(pk=access["id"]).update(expires_at=timezone.now() - timedelta(seconds=1))
        self.read(operator, f"characters/{self.sheet.pk}", status=404)
        self.assertEqual(self.read(operator, "admin/accesses")["items"], [])

    def test_a_new_grant_replaces_the_previous_one(self):
        first = self.grant("First issue")
        second = self.grant("Second issue")
        self.assertEqual(AdminAccess.objects.get(pk=first["id"]).end_reason, "withdrawn")
        self.assertTrue(second["active"])
        self.assertEqual(AdminAccessEvent.objects.count(), 0)
