"""R2.1: running behind Caddy (proxy trust, client address, HTTPS), error
logging, the separate fingerprint key, lock-free reads and housekeeping."""
import ipaddress
import io
import tempfile
import uuid
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch
from django.conf import settings
from django.contrib.sessions.models import Session
from django.core.management import call_command
from django.db import connection
from django.test import Client, RequestFactory, override_settings
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from domain import accounts
from domain.middleware import TrustedProxyMiddleware
from domain.models import Invitation, MediaAsset, PasswordReset, ProcessedOperation, RateBucket
from domain.permissions import revision_for
from .base import APICase, PASSWORD
from .test_remote import image_bytes  # a helper function only; importing a TestCase would rerun its tests


class MediaCase(APICase):
    """Fictional clients plus an isolated temporary media folder."""

    def setUp(self):
        self.alice_client = self.client_for(self.alice)
        self.gm_client = self.client_for(self.gm)
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        override = override_settings(PRIVATE_MEDIA_ROOT=Path(temp.name))
        override.enable()
        self.addCleanup(override.disable)

    def upload(self):
        body = {"operationId": str(uuid.uuid4()), "expectedRevision": self.current()["revision"],
                "path": "avatarImage", "imageBase64": image_bytes()}
        return self.send(self.alice_client, f"characters/{self.sheet.pk}/assets", body), body


PROXY_NET = [ipaddress.ip_network("172.18.0.0/16")]
PROXY = "172.18.0.2"
VISITOR = "203.0.113.7"


def through_middleware(**meta):
    request = RequestFactory().get("/api/v1/auth/csrf", **meta)
    return TrustedProxyMiddleware(lambda r: r)(request)


class ProxyTrustTests(APICase):
    @override_settings(TRUSTED_PROXIES=PROXY_NET)
    def test_trusted_proxy_sets_https_and_real_client_address(self):
        request = through_middleware(REMOTE_ADDR=PROXY, HTTP_X_FORWARDED_PROTO="https", HTTP_X_FORWARDED_FOR=VISITOR)
        self.assertTrue(request.is_secure())
        self.assertEqual(request.META["REMOTE_ADDR"], VISITOR)

    @override_settings(TRUSTED_PROXIES=PROXY_NET)
    def test_rightmost_untrusted_hop_wins_and_spoofed_left_entries_are_ignored(self):
        request = through_middleware(REMOTE_ADDR=PROXY, HTTP_X_FORWARDED_FOR=f"198.51.100.9, {VISITOR}, 172.18.0.9")
        self.assertEqual(request.META["REMOTE_ADDR"], VISITOR)

    @override_settings(TRUSTED_PROXIES=PROXY_NET)
    def test_malformed_hop_ends_the_chain_without_trusting_it(self):
        request = through_middleware(REMOTE_ADDR=PROXY, HTTP_X_FORWARDED_FOR=f"{VISITOR}, not-an-ip")
        self.assertEqual(request.META["REMOTE_ADDR"], PROXY)

    @override_settings(TRUSTED_PROXIES=PROXY_NET)
    def test_untrusted_peer_cannot_forge_https_or_address(self):
        request = through_middleware(REMOTE_ADDR=VISITOR, HTTP_X_FORWARDED_PROTO="https", HTTP_X_FORWARDED_FOR="10.0.0.1")
        self.assertFalse(request.is_secure())
        self.assertEqual(request.META["REMOTE_ADDR"], VISITOR)
        self.assertNotIn("HTTP_X_FORWARDED_FOR", request.META)
        self.assertNotIn("HTTP_X_FORWARDED_PROTO", request.META)

    def test_no_configured_proxies_means_nothing_is_trusted(self):
        self.assertEqual(settings.TRUSTED_PROXIES, [])
        request = through_middleware(REMOTE_ADDR="127.0.0.1", HTTP_X_FORWARDED_PROTO="https", HTTP_X_FORWARDED_FOR=VISITOR)
        self.assertFalse(request.is_secure())
        self.assertEqual(request.META["REMOTE_ADDR"], "127.0.0.1")

    @override_settings(TRUSTED_PROXIES=PROXY_NET, SECURE_SSL_REDIRECT=True)
    def test_https_redirect_trusts_only_the_proxy(self):
        via_proxy = Client(REMOTE_ADDR=PROXY, HTTP_X_FORWARDED_PROTO="https", HTTP_X_FORWARDED_FOR=VISITOR)
        self.assertEqual(via_proxy.get("/api/v1/auth/csrf").status_code, 200)
        forged = Client(REMOTE_ADDR=VISITOR, HTTP_X_FORWARDED_PROTO="https")
        self.assertEqual(forged.get("/api/v1/auth/csrf").status_code, 301)

    @override_settings(TRUSTED_PROXIES=PROXY_NET)
    def test_csrf_origin_check_accepts_https_only_through_the_proxy(self):
        headers = {"HTTP_ORIGIN": "https://testserver"}
        via_proxy = Client(enforce_csrf_checks=True, REMOTE_ADDR=PROXY, HTTP_X_FORWARDED_PROTO="https", HTTP_X_FORWARDED_FOR=VISITOR)
        token = via_proxy.get("/api/v1/auth/csrf").json()["csrfToken"]
        response = via_proxy.post("/api/v1/auth/login", data={"username": "alice", "password": PASSWORD},
                                  content_type="application/json", HTTP_X_CSRFTOKEN=token, **headers)
        self.assertEqual(response.status_code, 200, response.content)
        direct = Client(enforce_csrf_checks=True, REMOTE_ADDR=VISITOR, HTTP_X_FORWARDED_PROTO="https")
        token = direct.get("/api/v1/auth/csrf").json()["csrfToken"]
        response = direct.post("/api/v1/auth/login", data={"username": "alice", "password": PASSWORD},
                               content_type="application/json", HTTP_X_CSRFTOKEN=token, **headers)
        self.assertEqual(response.status_code, 403)

    @override_settings(TRUSTED_PROXIES=PROXY_NET)
    def test_rate_limits_count_each_visitor_separately_behind_the_proxy(self):
        for visitor in ("203.0.113.7", "203.0.113.8"):
            Client(REMOTE_ADDR=PROXY, HTTP_X_FORWARDED_FOR=visitor).post(
                "/api/v1/auth/login", data={"username": "alice", "password": "wrong-password-xx"}, content_type="application/json")
        keys = set(RateBucket.objects.values_list("key", flat=True))
        self.assertIn(accounts.digest("login-ip:203.0.113.7"), keys)
        self.assertIn(accounts.digest("login-ip:203.0.113.8"), keys)
        self.assertNotIn(accounts.digest(f"login-ip:{PROXY}"), keys)


class ErrorLoggingTests(APICase):
    def test_unexpected_server_error_is_logged_with_debug_off(self):
        self.assertFalse(settings.DEBUG)
        client = Client(raise_request_exception=False)
        client.force_login(self.alice)
        session = client.session
        session["auth_epoch"] = self.alice.auth_epoch
        session.save()
        with patch("domain.views.accounts.user_view", side_effect=RuntimeError("fictional failure")), \
                self.assertLogs("django.request", level="ERROR") as logs:
            response = client.get("/api/v1/auth/me")
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"error": {"code": "server_error"}})
        self.assertIn("/api/v1/auth/me", "\n".join(logs.output))

    def test_configured_handlers_write_to_the_console(self):
        self.assertEqual(settings.LOGGING["loggers"]["django.request"]["handlers"], ["console"])
        self.assertEqual(settings.LOGGING["handlers"]["console"]["class"], "logging.StreamHandler")


class FingerprintKeyTests(APICase):
    def test_fingerprints_follow_the_hmac_key_not_the_secret_key(self):
        sheet = self.sheet
        with override_settings(HMAC_KEY="a" * 50):
            digest_a, revision_a = accounts.digest("code"), revision_for(self.alice, sheet)
        with override_settings(HMAC_KEY="b" * 50):
            digest_b, revision_b = accounts.digest("code"), revision_for(self.alice, sheet)
        with override_settings(HMAC_KEY="a" * 50, SECRET_KEY="c" * 60):
            digest_c, revision_c = accounts.digest("code"), revision_for(self.alice, sheet)
        self.assertNotEqual(digest_a, digest_b)
        self.assertNotEqual(revision_a, revision_b)
        self.assertEqual((digest_a, revision_a), (digest_c, revision_c))

    def test_test_settings_use_distinct_keys(self):
        self.assertNotEqual(settings.HMAC_KEY, settings.SECRET_KEY)
        self.assertGreaterEqual(len(settings.HMAC_KEY), 50)


class LockFreeReadTests(MediaCase):
    def test_image_and_gm_note_reads_take_no_row_locks(self):
        result, _ = self.upload()
        asset_id = result["fields"]["avatarImage"]
        with CaptureQueriesContext(connection) as queries:
            response = self.alice_client.get(f"/api/v1/assets/{asset_id}")
            b"".join(response.streaming_content)
        self.assertEqual(response.status_code, 200)
        self.assertFalse([q for q in queries.captured_queries if "FOR UPDATE" in q["sql"]])
        with CaptureQueriesContext(connection) as queries:
            self.read(self.gm_client, f"characters/{self.sheet.pk}/gm-notes")
        self.assertFalse([q for q in queries.captured_queries if "FOR UPDATE" in q["sql"]])
        with CaptureQueriesContext(connection) as queries:
            self.send(self.gm_client, f"characters/{self.sheet.pk}/gm-notes", {"expectedRevision": 0, "content": "Fictional"}, "patch")
        self.assertTrue([q for q in queries.captured_queries if "FOR UPDATE" in q["sql"]])


class MaintenanceTests(MediaCase):
    def run_command(self, *args):
        out = io.StringIO()
        call_command("maintenance", *args, stdout=out)
        return out.getvalue()

    def test_removes_only_expired_bookkeeping_and_reports_media(self):
        now = timezone.now()
        long_ago = now - timedelta(days=40)
        old_invite = Invitation.objects.create(token_hash="old", campaign=self.campaign, issuer=self.gm, expires_at=long_ago)
        fresh_invite = Invitation.objects.create(token_hash="fresh", campaign=self.campaign, issuer=self.gm, expires_at=now + timedelta(days=7))
        old_reset = PasswordReset.objects.create(user=self.bob, issuer=self.admin, code_hash="old", expires_at=long_ago)
        RateBucket.objects.create(key="stale", started_at=now - timedelta(days=2))
        RateBucket.objects.create(key="current", started_at=now)
        old_receipt = ProcessedOperation.objects.create(actor=self.alice, operation_id="00000000-0000-0000-0000-000000000001",
                                                        fingerprint="x", outcome_kind="sheet")
        ProcessedOperation.objects.filter(pk=old_receipt.pk).update(created_at=long_ago)
        Session.objects.create(session_key="expired-session-key-0001", session_data="", expire_date=now - timedelta(hours=1))
        result, _ = self.upload()
        (settings.PRIVATE_MEDIA_ROOT / "stray.png").write_bytes(b"not referenced")

        dry = self.run_command("--dry-run")
        self.assertIn("would remove 1 old invitations", dry)
        self.assertTrue(Invitation.objects.filter(pk=old_invite.pk).exists())

        output = self.run_command()
        self.assertFalse(Invitation.objects.filter(pk=old_invite.pk).exists())
        self.assertTrue(Invitation.objects.filter(pk=fresh_invite.pk).exists())
        self.assertFalse(PasswordReset.objects.filter(pk=old_reset.pk).exists())
        self.assertEqual(set(RateBucket.objects.values_list("key", flat=True)), {"current"})
        self.assertFalse(ProcessedOperation.objects.filter(pk=old_receipt.pk).exists())
        self.assertFalse(Session.objects.filter(session_key="expired-session-key-0001").exists())
        self.assertIn("0 detached assets", output)
        self.assertIn("1 files without an asset", output)
        self.assertTrue((settings.PRIVATE_MEDIA_ROOT / "stray.png").exists())
        self.assertEqual(MediaAsset.objects.count(), 1)
