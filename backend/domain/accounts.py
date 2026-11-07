import hashlib
import hmac
import secrets
from datetime import timedelta
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from .errors import APIError, require, text
from .models import AuditEvent, Campaign, Invitation, Membership, PasswordReset, RateBucket, User, normalized_username
from .permissions import is_gm


def digest(value):
    return hmac.new(settings.SECRET_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()


def throttle(scope, identity, limit=10, seconds=900):
    """Database-backed limits survive multiple processes and restarts."""
    now = timezone.now()
    with transaction.atomic():
        bucket, _ = RateBucket.objects.select_for_update().get_or_create(
            key=digest(f"{scope}:{identity}"), defaults={"started_at": now})
        if bucket.started_at <= now - timedelta(seconds=seconds):
            bucket.started_at, bucket.attempts = now, 0
        bucket.attempts += 1
        bucket.save()
        exceeded = bucket.attempts > limit
    # Raise after commit, so unsuccessful attempts are not rolled back.
    require(not exceeded, "rate_limited", 429)


def administrator(actor):
    require(actor.is_authenticated and actor.is_active and actor.is_superuser, "forbidden", 403)


def password(value, user):
    text(value, 256)
    try:
        validate_password(value, user)
    except ValidationError:
        raise APIError("invalid_password") from None


def login_account(request, username, raw_password):
    text(username, 30)
    text(raw_password, 256)
    try:
        username = normalized_username(username)
    except ValidationError:
        username = "invalid-username"
    throttle("login-ip", request.META.get("REMOTE_ADDR", "unknown"), 100)
    throttle("login-user", username, 10)
    user = authenticate(request, username=username, password=raw_password)
    require(user is not None, "invalid_credentials", 401)
    return user


@transaction.atomic
def issue_invitation(actor, campaign_id, role):
    campaign = Campaign.objects.select_for_update().get(pk=campaign_id)
    require(actor.is_active and (actor.is_superuser or is_gm(actor, campaign)), "forbidden", 403)
    require(role in ("gm", "player"), "invalid_role")
    require(role != "gm" or actor.is_superuser, "forbidden", 403)
    token = secrets.token_urlsafe(32)
    invite = Invitation.objects.create(token_hash=digest(token), campaign=campaign, issuer=actor,
                                       role=role, expires_at=timezone.now() + timedelta(days=7))
    AuditEvent.objects.create(actor=actor, action="invitation.issued", target_id=str(invite.pk))
    return token, invite


@transaction.atomic
def register(token, username, raw_password, display_name):
    text(token, 100)
    token_hash = digest(token)
    # Lock campaign before invitation, matching all campaign-domain operations.
    candidate = Invitation.objects.filter(token_hash=token_hash).first()
    require(candidate is not None, "invalid_invitation")
    Campaign.objects.select_for_update().get(pk=candidate.campaign_id)
    invite = Invitation.objects.select_for_update().select_related("issuer", "campaign").get(pk=candidate.pk)
    require(invite.consumed_at is None and invite.expires_at > timezone.now() and invite.issuer.is_active, "invalid_invitation")
    require(invite.issuer.is_superuser or (invite.role == "player" and is_gm(invite.issuer, invite.campaign)), "invalid_invitation")
    try:
        username = normalized_username(username)
    except ValidationError:
        raise APIError("invalid_username") from None
    require(not User.objects.filter(username__iexact=username).exists(), "username_unavailable", 409)
    user = User(username=username, display_name=text(display_name, 80, empty=True))
    password(raw_password, user)
    user.set_password(raw_password)
    user.save()
    Membership.objects.create(user=user, campaign=invite.campaign, role=invite.role)
    invite.consumed_at = timezone.now()
    invite.save(update_fields=["consumed_at"])
    AuditEvent.objects.create(actor=user, action="invitation.accepted", target_id=str(invite.pk))
    return user


@transaction.atomic
def issue_reset(actor, user_id):
    administrator(actor)
    user = User.objects.select_for_update().get(pk=user_id)
    require(user.is_active, "not_found", 404)
    PasswordReset.objects.filter(user=user, consumed_at__isnull=True).update(consumed_at=timezone.now())
    code = secrets.token_urlsafe(32)
    reset = PasswordReset.objects.create(user=user, issuer=actor, code_hash=digest(code),
                                        expires_at=timezone.now() + timedelta(minutes=15))
    AuditEvent.objects.create(actor=actor, action="password_reset.issued", target_id=str(user.pk))
    return code, reset


@transaction.atomic
def reset_password(code, new_password):
    text(code, 100)
    candidate = PasswordReset.objects.filter(code_hash=digest(code)).first()
    require(candidate is not None, "invalid_reset_code")
    user = User.objects.select_for_update().get(pk=candidate.user_id)
    reset = PasswordReset.objects.select_for_update().get(pk=candidate.pk)
    require(user.is_active and reset.consumed_at is None and reset.expires_at > timezone.now(), "invalid_reset_code")
    password(new_password, user)
    user.set_password(new_password)
    user.auth_epoch += 1
    user.save(update_fields=["password", "auth_epoch"])
    PasswordReset.objects.filter(user=user, consumed_at__isnull=True).update(consumed_at=timezone.now())
    AuditEvent.objects.create(actor=user, action="password_reset.used", target_id=str(user.pk))


@transaction.atomic
def change_password(actor, current_password, new_password):
    user = User.objects.select_for_update().get(pk=actor.pk)
    require(user.check_password(text(current_password, 256)), "invalid_credentials", 401)
    password(new_password, user)
    user.set_password(new_password)
    user.auth_epoch += 1
    user.save(update_fields=["password", "auth_epoch"])
    AuditEvent.objects.create(actor=user, action="password.changed", target_id=str(user.pk))


@transaction.atomic
def account_state(actor, user_id, active):
    administrator(actor)
    require(type(active) is bool and (str(actor.pk) != str(user_id) or active), "invalid_account_state")
    user = User.objects.select_for_update().get(pk=user_id)
    user.is_active = active
    user.auth_epoch += 1
    user.save(update_fields=["is_active", "auth_epoch"])
    AuditEvent.objects.create(actor=actor, action="account.enabled" if active else "account.disabled", target_id=str(user.pk))


def user_view(user):
    return {"id": str(user.pk), "username": user.username, "displayName": user.display_name, "isAdministrator": user.is_superuser}
