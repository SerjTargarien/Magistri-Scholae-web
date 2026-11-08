from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from django.db import close_old_connections, connection
from django.test import TransactionTestCase
from domain import accounts, services
from domain import operations
import uuid
from domain.errors import APIError
from domain.models import Campaign, Membership, RateBucket, Sheet, User
from domain.permissions import projection
from .base import PASSWORD


class PostgreSQLConcurrencyTests(TransactionTestCase):
    def setUp(self):
        self.assertEqual(connection.vendor, "postgresql", "These lock tests must run on PostgreSQL")
        self.gm = User.objects.create_user("gmtest", password=PASSWORD)
        self.alice = User.objects.create_user("alicetest", password=PASSWORD)
        self.campaign = Campaign.objects.create(name="Concurrency fixture")
        Membership.objects.create(campaign=self.campaign, user=self.gm, role="gm")
        Membership.objects.create(campaign=self.campaign, user=self.alice, role="player")

    def race(self, jobs):
        barrier = Barrier(len(jobs))
        def run(job):
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                job()
                return "ok"
            except APIError as error:
                return error.code
            finally:
                close_old_connections()
        with ThreadPoolExecutor(max_workers=len(jobs)) as pool:
            return list(pool.map(run, jobs))

    def test_invitation_can_be_consumed_only_once_under_race(self):
        token, _ = accounts.issue_invitation(self.gm, self.campaign.pk, "player")
        results = self.race([lambda: accounts.register(token, "firstuser", PASSWORD, ""),
                             lambda: accounts.register(token, "seconduser", PASSWORD, "")])
        self.assertCountEqual(results, ["ok", "invalid_invitation"])
        self.assertEqual(User.objects.filter(username__in=["firstuser", "seconduser"]).count(), 1)

    def test_stale_simultaneous_mutation_cannot_overwrite_newer_data(self):
        sheet = Sheet.objects.create(campaign=self.campaign, creator=self.alice, assigned_player=self.alice,
                                      kind="character", data={"nombre": "Original", "linaje": "keep"})
        revision = projection(self.alice, sheet)["revision"]
        def update(value):
            actor = User.objects.get(pk=self.alice.pk)
            services.patch_sheet(actor, sheet.pk, "character", {"expectedRevision": revision, "changes": [{"path": "nombre", "value": value}]})
        results = self.race([lambda: update("First"), lambda: update("Second")])
        self.assertCountEqual(results, ["ok", "revision_conflict"])
        sheet.refresh_from_db()
        self.assertEqual(sheet.data["linaje"], "keep")
        self.assertEqual(sheet.revision, 2)

    def test_reset_code_is_single_use_under_race(self):
        operator = User.objects.create_superuser("operator", password=PASSWORD)
        code, _ = accounts.issue_reset(operator, self.alice.pk)
        results = self.race([lambda: accounts.reset_password(code, "First-fictional-pass-123!"),
                             lambda: accounts.reset_password(code, "Second-fictional-pass-123!")])
        self.assertCountEqual(results, ["ok", "invalid_reset_code"])

    def test_rate_limit_counts_concurrent_attempts_without_lost_updates(self):
        results = self.race([lambda: accounts.throttle("race", "fixture", limit=2) for _ in range(4)])
        self.assertEqual(results.count("ok"), 2)
        self.assertEqual(results.count("rate_limited"), 2)
        self.assertEqual(RateBucket.objects.get().attempts, 4)

    def test_same_operation_race_creates_only_one_entity(self):
        body = {"operationId": str(uuid.uuid4()), "campaignId": str(self.campaign.pk), "fields": {"nombre": "Once"}}
        def create():
            actor = User.objects.get(pk=self.alice.pk)
            operations.execute(actor, "POST:/api/v1/familiars", body, "sheet", lambda clean: services.create_sheet(actor, "familiar", clean))
        self.assertEqual(self.race([create, create]), ["ok", "ok"])
        self.assertEqual(Sheet.objects.count(), 1)
