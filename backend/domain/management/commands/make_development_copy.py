"""Turns a copy of the testers' data on staging into a development copy (R6).

After the testers' data moves to production, staging keeps a copy of it so
later migrations are rehearsed on real data first (owner decision, 13 November
2026). On that copy only the accounts named with --keep can sign in: every
other account loses its password and sessions, unused invitations and reset
codes are removed (their links would otherwise work on staging), and the other
accounts' personal notes are deleted, since they are author-only. Sheets,
campaigns, memberships and images are kept. Output gives counts only.
"""
from django.conf import settings
from django.contrib.sessions.models import Session
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from domain.models import AuditEvent, Invitation, PasswordReset, PersonalNote, RateBucket, User, normalized_username


class Command(BaseCommand):
    help = "Staging only: lock every account except --keep out of the copy and delete their personal notes"

    def add_arguments(self, parser):
        parser.add_argument("--keep", required=True,
                            help="Comma-separated usernames that keep signing in (the administrator, fictional test accounts)")
        parser.add_argument("--dry-run", action="store_true", help="Count what would change without changing it")

    def handle(self, *args, keep, dry_run=False, **options):
        if settings.ENVIRONMENT != "staging":
            raise CommandError("Runs only on staging (MAGISTRI_ENVIRONMENT=staging); never on production")
        try:
            names = {normalized_username(name.strip()) for name in keep.split(",") if name.strip()}
        except ValidationError as error:
            raise CommandError(f"--keep: {error.messages[0]}") from error
        kept = User.objects.filter(username__in=names)
        missing = names - set(kept.values_list("username", flat=True))
        if not names or missing:
            raise CommandError(f"--keep must name existing accounts; {len(missing)} not found")
        locked = User.objects.exclude(pk__in=kept)
        notes = PersonalNote.objects.filter(author__in=locked)
        invitations = Invitation.objects.filter(consumed_at__isnull=True)
        resets = PasswordReset.objects.filter(consumed_at__isnull=True)
        counts = [("accounts locked out", locked.count()), ("accounts kept", kept.count()),
                  ("personal notes deleted", notes.count()), ("unused invitations deleted", invitations.count()),
                  ("unused reset codes deleted", resets.count()), ("sessions ended", Session.objects.count())]
        if not dry_run:
            with transaction.atomic():
                for user in locked.select_for_update():
                    user.set_unusable_password()
                    user.auth_epoch += 1
                    user.save(update_fields=["password", "auth_epoch"])
                notes.delete()
                invitations.delete()
                resets.delete()
                Session.objects.all().delete()
                RateBucket.objects.all().delete()
                AuditEvent.objects.create(actor=None, action="development_copy", target_id="staging")
        self.stdout.write("Dry run, nothing changed:" if dry_run else "Development copy made:")
        for label, count in counts:
            self.stdout.write(f"  {count} {label}")
