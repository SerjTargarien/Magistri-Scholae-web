import json
from datetime import timedelta
from django.conf import settings
from django.test import Client, override_settings
from django.utils import timezone
from domain import accounts
from domain.models import AuditEvent, Invitation, Membership, PasswordReset, RateBucket, User
from .base import APICase, PASSWORD


class AuthenticationTests(APICase):
    def test_uninvited_registration_rejected(self):
        self.send(Client(), "auth/register", {"invitationToken": "invalid", "username": "newuser", "password": PASSWORD}, status=400)
        self.assertFalse(User.objects.filter(username="newuser").exists())

    def test_invitation_is_hashed_single_use_and_email_optional(self):
        gm = self.client_for(self.gm)
        invitation = self.send(gm, "auth/invitations", {"campaignId": str(self.campaign.pk), "role": "player"})
        stored = Invitation.objects.get(token_hash=accounts.digest(invitation["token"]))
        self.assertNotEqual(stored.token_hash, invitation["token"])
        body = {"invitationToken": invitation["token"], "username": "New_User", "password": PASSWORD}
        result = self.send(Client(), "auth/register", body)
        user = User.objects.get(pk=result["user"]["id"])
        self.assertEqual(user.username, "new_user")
        self.assertEqual(user.email, "")
        self.assertTrue(user.check_password(PASSWORD))
        self.assertNotEqual(user.password, PASSWORD)
        self.assertEqual(Membership.objects.get(user=user).role, "player")
        self.send(Client(), "auth/register", {**body, "username": "another"}, status=400)

    def test_expired_invitation_does_not_create_user(self):
        token, invite = accounts.issue_invitation(self.gm, self.campaign.pk, "player")
        invite.expires_at = timezone.now() - timedelta(seconds=1)
        invite.save()
        self.send(Client(), "auth/register", {"invitationToken": token, "username": "newuser", "password": PASSWORD}, status=400)

    def test_removed_issuer_cannot_leave_a_valid_invitation(self):
        token, _ = accounts.issue_invitation(self.gm, self.campaign.pk, "player")
        Membership.objects.filter(user=self.gm, campaign=self.campaign).delete()
        self.send(Client(), "auth/register", {"invitationToken": token, "username": "newuser", "password": PASSWORD}, status=400)

    def test_gm_invites_require_site_administrator(self):
        self.send(self.client_for(self.gm), "auth/invitations", {"campaignId": str(self.campaign.pk), "role": "gm"}, status=403)
        result = self.send(self.client_for(self.admin), "auth/invitations", {"campaignId": str(self.campaign.pk), "role": "gm"})
        self.assertIn("token", result)

    def test_gm_role_does_not_apply_in_other_campaign(self):
        self.send(self.client_for(self.gm), "auth/invitations", {"campaignId": str(self.other.pk), "role": "player"}, status=403)

    def test_weak_password_does_not_consume_invitation(self):
        token, invite = accounts.issue_invitation(self.gm, self.campaign.pk, "player")
        self.send(Client(), "auth/register", {"invitationToken": token, "username": "newuser", "password": "123"}, status=400)
        invite.refresh_from_db()
        self.assertIsNone(invite.consumed_at)

    def test_normalized_usernames_are_unique(self):
        token, _ = accounts.issue_invitation(self.gm, self.campaign.pk, "player")
        self.send(Client(), "auth/register", {"invitationToken": token, "username": "ALICE", "password": PASSWORD}, status=409)

    def test_login_csrf_cookie_rotation_and_logout(self):
        client = Client(enforce_csrf_checks=True)
        self.send(client, "auth/login", {"username": "alice", "password": PASSWORD}, status=403)
        token = self.read(client, "auth/csrf")["csrfToken"]
        response = client.post("/api/v1/auth/login", {"username": "ALICE", "password": PASSWORD}, content_type="application/json", HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(response.cookies[settings.SESSION_COOKIE_NAME]["httponly"])
        self.assertNotEqual(response.json()["csrfToken"], token)
        self.read(client, "auth/me")
        response = client.post("/api/v1/auth/logout", {}, content_type="application/json", HTTP_X_CSRFTOKEN=response.json()["csrfToken"])
        self.assertEqual(response.status_code, 200)
        self.read(client, "auth/me", status=401)

    def test_wrong_origin_rejected_even_with_csrf(self):
        client = Client(enforce_csrf_checks=True)
        token = self.read(client, "auth/csrf")["csrfToken"]
        response = client.post("/api/v1/auth/login", {"username": "alice", "password": PASSWORD}, content_type="application/json", HTTP_X_CSRFTOKEN=token, HTTP_ORIGIN="https://untrusted.invalid")
        self.assertEqual(response.status_code, 403)

    def test_reset_only_site_admin_and_code_hashed(self):
        self.send(self.client_for(self.gm), "auth/reset-codes", {"userId": str(self.alice.pk)}, status=403)
        result = self.send(self.client_for(self.admin), "auth/reset-codes", {"userId": str(self.alice.pk)})
        reset = PasswordReset.objects.get(user=self.alice)
        self.assertNotEqual(reset.code_hash, result["code"])
        self.assertEqual(reset.code_hash, accounts.digest(result["code"]))

    def test_reset_consumes_code_and_invalidates_all_sessions(self):
        first, second = self.client_for(self.alice), self.client_for(self.alice)
        code, _ = accounts.issue_reset(self.admin, self.alice.pk)
        self.send(Client(), "auth/password-reset", {"code": code, "newPassword": "Another-fictional-pass-43!"})
        self.read(first, "auth/me", status=401)
        self.read(second, "auth/me", status=401)
        self.send(Client(), "auth/password-reset", {"code": code, "newPassword": PASSWORD}, status=400)

    def test_expired_and_superseded_reset_codes_fail(self):
        code, reset = accounts.issue_reset(self.admin, self.alice.pk)
        reset.expires_at = timezone.now() - timedelta(seconds=1)
        reset.save()
        self.send(Client(), "auth/password-reset", {"code": code, "newPassword": PASSWORD}, status=400)
        old, _ = accounts.issue_reset(self.admin, self.alice.pk)
        accounts.issue_reset(self.admin, self.alice.pk)
        self.send(Client(), "auth/password-reset", {"code": old, "newPassword": PASSWORD}, status=400)

    def test_disable_then_reenable_does_not_restore_old_session(self):
        client = self.client_for(self.alice)
        operator = self.client_for(self.admin)
        self.send(operator, f"admin/users/{self.alice.pk}/state", {"active": False})
        self.read(client, "auth/me", status=401)
        self.send(operator, f"admin/users/{self.alice.pk}/state", {"active": True})
        self.read(client, "auth/me", status=401)

    def test_password_change_invalidates_second_session(self):
        client, other = self.client_for(self.alice), self.client_for(self.alice)
        self.send(client, "auth/password-change", {"currentPassword": PASSWORD, "newPassword": "Another-fictional-pass-43!"})
        self.read(other, "auth/me", status=401)

    def test_login_and_reset_attempts_are_database_rate_limited(self):
        for _ in range(10):
            self.send(Client(), "auth/login", {"username": "alice", "password": "incorrect-password"}, status=401)
        self.send(Client(), "auth/login", {"username": "alice", "password": PASSWORD}, status=429)
        for _ in range(20):
            self.send(Client(), "auth/password-reset", {"code": "invalid", "newPassword": PASSWORD}, status=400)
        self.send(Client(), "auth/password-reset", {"code": "invalid", "newPassword": PASSWORD}, status=429)
        self.assertTrue(RateBucket.objects.exists())

    def test_registration_rejects_role_forgery(self):
        token, _ = accounts.issue_invitation(self.gm, self.campaign.pk, "player")
        self.send(Client(), "auth/register", {"invitationToken": token, "username": "newuser", "password": PASSWORD, "is_superuser": True}, status=400)

    def test_all_api_responses_are_non_cacheable(self):
        for response in [Client().get("/api/v1/auth/me"), Client(enforce_csrf_checks=True).post("/api/v1/auth/login")]:
            self.assertIn("no-store", response["Cache-Control"])
            self.assertEqual(response["Content-Type"], "application/json")

    def test_audit_contains_no_plaintext_secrets(self):
        token, _ = accounts.issue_invitation(self.gm, self.campaign.pk, "player")
        code, _ = accounts.issue_reset(self.admin, self.alice.pk)
        events = str(list(AuditEvent.objects.values()))
        self.assertNotIn(token, events)
        self.assertNotIn(code, events)
        self.assertNotIn(PASSWORD, events)

    @override_settings(SESSION_COOKIE_SECURE=True, CSRF_COOKIE_SECURE=True)
    def test_non_development_cookie_security_attributes(self):
        client = Client(enforce_csrf_checks=True)
        csrf = client.get("/api/v1/auth/csrf", secure=True)
        self.assertTrue(csrf.cookies[settings.CSRF_COOKIE_NAME]["secure"])
        self.assertTrue(csrf.cookies[settings.CSRF_COOKIE_NAME]["httponly"])
        response = client.post("/api/v1/auth/login", {"username": "alice", "password": PASSWORD}, content_type="application/json",
                               secure=True, HTTP_ORIGIN="https://testserver", HTTP_X_CSRFTOKEN=csrf.json()["csrfToken"])
        self.assertEqual(response.status_code, 200, response.content)
        cookie = response.cookies[settings.SESSION_COOKIE_NAME]
        self.assertTrue(cookie["secure"])
        self.assertTrue(cookie["httponly"])
        self.assertEqual(cookie["samesite"], "Lax")

    @override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.PBKDF2PasswordHasher"])
    def test_production_password_hasher(self):
        user = User.objects.create_user("realhash", password=PASSWORD)
        self.assertTrue(user.password.startswith("pbkdf2_sha256$"))
        self.assertTrue(user.check_password(PASSWORD))


class AdministrationTests(APICase):
    """The administrator screens' server side (R4 a): users, unused invitations, member lists."""

    def test_reset_link_lasts_a_day(self):
        before = timezone.now()
        _, reset = accounts.issue_reset(self.admin, self.alice.pk)
        self.assertGreaterEqual(reset.expires_at, before + timedelta(hours=24))
        self.assertLess(reset.expires_at, before + timedelta(hours=24, minutes=1))

    def test_user_list_is_administrator_only_and_holds_no_sheet_content(self):
        for actor in (self.gm, self.alice):
            self.read(self.client_for(actor), "admin/users", status=403)
        items = self.read(self.client_for(self.admin), "admin/users?limit=100")["items"]
        by_name = {u["username"]: u for u in items}
        self.assertEqual(sorted(by_name), ["alice", "bob", "gamemaster", "operator", "outsider"])
        self.assertTrue(by_name["operator"]["isAdministrator"])
        self.assertEqual({(c["name"], c["role"]) for c in by_name["gamemaster"]["campaigns"]},
                         {("Fictional academy", "gm"), ("Other fictional academy", "player")})
        self.assertEqual(set(by_name["alice"]), {"id", "username", "displayName", "isAdministrator", "isActive", "campaigns"})
        self.assertNotIn("Fictional Luna", json.dumps(items))

    def test_user_list_shows_disabled_accounts(self):
        accounts.account_state(self.admin, self.bob.pk, False)
        items = self.read(self.client_for(self.admin), "admin/users")["items"]
        self.assertFalse(next(u for u in items if u["username"] == "bob")["isActive"])

    def test_unused_invitations_listed_and_cancelled(self):
        token, invite = accounts.issue_invitation(self.gm, self.campaign.pk, "player")
        used, _ = accounts.issue_invitation(self.admin, self.campaign.pk, "player")
        self.send(Client(), "auth/register", {"invitationToken": used, "username": "newcomer", "password": PASSWORD})
        expired_token, expired = accounts.issue_invitation(self.admin, self.other.pk, "gm")
        expired.expires_at = timezone.now() - timedelta(seconds=1)
        expired.save()
        self.read(self.client_for(self.gm), "admin/invitations", status=403)
        operator = self.client_for(self.admin)
        items = self.read(operator, "admin/invitations")["items"]
        self.assertEqual([i["id"] for i in items], [str(invite.pk)])
        self.assertEqual(items[0]["campaignName"], "Fictional academy")
        self.assertEqual(items[0]["issuer"], "gamemaster")
        self.assertNotIn(token, json.dumps(items))
        self.send(self.client_for(self.gm), f"admin/invitations/{invite.pk}", method="delete", status=403)
        self.send(operator, f"admin/invitations/{invite.pk}", method="delete")
        self.assertTrue(AuditEvent.objects.filter(action="invitation.revoked", target_id=str(invite.pk)).exists())
        self.send(Client(), "auth/register", {"invitationToken": token, "username": "latecomer", "password": PASSWORD}, status=400)
        self.send(operator, f"admin/invitations/{invite.pk}", method="delete", status=404)
        self.assertEqual(self.read(operator, "admin/invitations")["items"], [])

    def test_administrator_reads_any_member_list_without_being_gm(self):
        self.read(self.client_for(self.alice), f"campaigns/{self.campaign.pk}/members", status=403)
        items = self.read(self.client_for(self.admin), f"campaigns/{self.campaign.pk}/members")["items"]
        self.assertEqual({(m["username"], m["role"]) for m in items}, {("gamemaster", "gm"), ("alice", "player"), ("bob", "player")})
        self.assertEqual(set(items[0]), {"userId", "username", "displayName", "role"})
