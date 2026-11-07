"""Scheduled housekeeping. Deletes only expired or obsolete bookkeeping rows;
media files are reported, never deleted (reclamation is a separate decision)."""
from datetime import timedelta
from pathlib import Path
from django.conf import settings
from django.contrib.sessions.models import Session
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from domain.media import value_at
from domain.models import Invitation, MediaAsset, PasswordReset, ProcessedOperation, RateBucket

# Retention after expiry or use. Retry receipts only matter for minutes; a
# month keeps any slow client retry safe. Rate windows are at most 15 minutes.
KEEP_USED_CODES = timedelta(days=30)
KEEP_RECEIPTS = timedelta(days=30)
KEEP_RATE_BUCKETS = timedelta(days=1)


class Command(BaseCommand):
    help = "Remove expired sessions, codes, rate counters and old retry receipts; report unused media"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Count what would be removed without deleting")

    def handle(self, *args, dry_run=False, **options):
        now = timezone.now()
        old_codes = now - KEEP_USED_CODES
        targets = [
            ("expired sessions", Session.objects.filter(expire_date__lt=now)),
            ("old invitations", Invitation.objects.filter(Q(expires_at__lt=old_codes) | Q(consumed_at__lt=old_codes))),
            ("old reset codes", PasswordReset.objects.filter(Q(expires_at__lt=old_codes) | Q(consumed_at__lt=old_codes))),
            ("stale rate counters", RateBucket.objects.filter(started_at__lt=now - KEEP_RATE_BUCKETS)),
            ("old retry receipts", ProcessedOperation.objects.filter(created_at__lt=now - KEEP_RECEIPTS)),
        ]
        prefix = "would remove" if dry_run else "removed"
        with transaction.atomic():
            for label, query in targets:
                count = query.count() if dry_run else query.delete()[0]
                self.stdout.write(f"{prefix} {count} {label}")
        detached, missing, stray = self.media_report()
        self.stdout.write(f"media: {detached} detached assets, {missing} assets without a file, "
                          f"{stray} files without an asset (reported only, nothing deleted)")

    def media_report(self):
        root = Path(settings.PRIVATE_MEDIA_ROOT)
        files = {path.name for path in root.iterdir() if path.is_file()} if root.is_dir() else set()
        detached = missing = 0
        known = set()
        for asset in MediaAsset.objects.select_related("sheet").iterator():
            known.add(asset.storage_name)
            if value_at(asset.sheet.data, asset.field_path) != str(asset.pk):
                detached += 1
            if asset.storage_name not in files:
                missing += 1
        return detached, missing, len(files - known)
