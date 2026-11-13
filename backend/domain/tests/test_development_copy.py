from datetime import timedelta
from io import StringIO
from django.contrib.sessions.models import Session
from django.core.management import CommandError, call_command
from django.test import override_settings
from django.utils import timezone
from domain.models import Invitation, PasswordReset, PersonalNote, Sheet, User
from .base import PASSWORD, APICase


class DevelopmentCopyTests(APICase):
    """R6: staging's copy of the testers' data, with only named accounts able to sign in."""

    def setUp(self):
        later = timezone.now() + timedelta(days=7)
        PersonalNote.objects.create(author=self.alice, title="Fictional private note", content="fictional-note-body")
        PersonalNote.objects.create(author=self.gm, title="Kept account's note")
        Invitation.objects.create(token_hash="a" * 64, campaign=self.campaign, issuer=self.admin, expires_at=later)
        Invitation.objects.create(token_hash="b" * 64, campaign=self.campaign, issuer=self.admin, expires_at=later,
                                  consumed_at=timezone.now())
        PasswordReset.objects.create(user=self.bob, issuer=self.admin, code_hash="c" * 64, expires_at=later)
        self.alice_client = self.client_for(self.alice)

    def run_command(self, *args):
        out = StringIO()
        call_command("make_development_copy", *args, stdout=out)
        return out.getvalue()

    @override_settings(ENVIRONMENT="staging")
    def test_locks_out_everyone_but_the_kept_accounts_and_keeps_the_sheets(self):
        sheets = {sheet.pk: sheet.data for sheet in Sheet.objects.all()}
        output = self.run_command("--keep", "Operator,gamemaster")
        self.assertIn("3 accounts locked out", output)
        self.assertNotIn("fictional-note-body", output)
        for name in ("alice", "bob", "outsider"):
            self.assertFalse(User.objects.get(username=name).has_usable_password())
        for name in ("operator", "gamemaster"):
            self.assertTrue(User.objects.get(username=name).check_password(PASSWORD))
        self.read(self.alice_client, "auth/me", status=401)
        self.assertEqual(Session.objects.count(), 0)
        self.assertEqual(list(PersonalNote.objects.values_list("author__username", flat=True)), ["gamemaster"])
        self.assertEqual(Invitation.objects.filter(consumed_at__isnull=True).count(), 0)
        self.assertEqual(Invitation.objects.count(), 1)
        self.assertEqual(PasswordReset.objects.count(), 0)
        self.assertEqual({sheet.pk: sheet.data for sheet in Sheet.objects.all()}, sheets)

    @override_settings(ENVIRONMENT="staging")
    def test_dry_run_changes_nothing(self):
        output = self.run_command("--keep", "operator", "--dry-run")
        self.assertIn("Dry run", output)
        self.assertTrue(User.objects.get(username="alice").check_password(PASSWORD))
        self.assertEqual(PersonalNote.objects.count(), 2)
        self.read(self.alice_client, "auth/me")

    @override_settings(ENVIRONMENT="staging")
    def test_refuses_an_unknown_kept_account(self):
        with self.assertRaises(CommandError):
            self.run_command("--keep", "operator,typo")
        self.assertTrue(User.objects.get(username="alice").check_password(PASSWORD))

    def test_refuses_outside_staging(self):
        for environment in ("production", ""):
            with override_settings(ENVIRONMENT=environment), self.assertRaises(CommandError):
                self.run_command("--keep", "operator")
        self.assertEqual(PersonalNote.objects.count(), 2)
        self.assertTrue(User.objects.get(username="alice").check_password(PASSWORD))
