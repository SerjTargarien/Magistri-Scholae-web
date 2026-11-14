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

# A recovery link is sent by text message, so it lasts a day (owner, 14 November 2026; was 15 minutes).
RESET_LIFETIME = timedelta(hours=24)
INVITATION_LIFETIME = timedelta(days=7)


def digest(value):
    return hmac.new(settings.HMAC_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()


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
                                       role=role, expires_at=timezone.now() + INVITATION_LIFETIME)
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
                                        expires_at=timezone.now() + RESET_LIFETIME)
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


def list_users(actor, limit, offset):
    """Every account with its campaigns and roles (R4): usernames and roles only, no sheet content."""
    administrator(actor)
    users = list(User.objects.order_by("username")[offset:offset + limit])
    memberships = {}
    for m in Membership.objects.filter(user__in=users).select_related("campaign").order_by("campaign__name", "campaign_id"):
        memberships.setdefault(m.user_id, []).append({"id": str(m.campaign_id), "name": m.campaign.name, "role": m.role})
    return [{**user_view(u), "isActive": u.is_active, "campaigns": memberships.get(u.pk, [])} for u in users]


def campaign_manager(actor, campaign):
    """The site administrator, or the campaign's GM (R4 d)."""
    require(actor.is_authenticated and actor.is_active, "authentication_required", 401)
    require(actor.is_superuser or is_gm(actor, campaign), "forbidden", 403)


@transaction.atomic
def create_campaign(actor, name):
    """The site administrator, or any GM (R4 d). A GM becomes the new campaign's GM; the
    administrator does not join it (he invites its GM)."""
    require(actor.is_authenticated and actor.is_active, "authentication_required", 401)
    gm_somewhere = Membership.objects.filter(user=actor, role="gm").exists()
    require(actor.is_superuser or gm_somewhere, "forbidden", 403)
    name = text(name, 120).strip()
    require(name, "field_required")
    campaign = Campaign.objects.create(name=name)
    role = None
    if not actor.is_superuser:
        Membership.objects.create(campaign=campaign, user=actor, role="gm")
        role = "gm"
    AuditEvent.objects.create(actor=actor, action="campaign.created", target_id=str(campaign.pk))
    return {"id": str(campaign.pk), "name": campaign.name, "policyRevision": campaign.policy_revision, "role": role}


@transaction.atomic
def rename_campaign(actor, campaign_id, name):
    campaign = Campaign.objects.select_for_update().get(pk=campaign_id)
    campaign_manager(actor, campaign)
    name = text(name, 120).strip()
    require(name, "field_required")
    campaign.name = name
    campaign.save(update_fields=["name"])
    AuditEvent.objects.create(actor=actor, action="campaign.renamed", target_id=str(campaign.pk))
    role = Membership.objects.filter(campaign=campaign, user=actor).values_list("role", flat=True).first()
    return {"id": str(campaign.pk), "name": campaign.name, "policyRevision": campaign.policy_revision, "role": role}


def invitation_view(invite):
    return {"id": str(invite.pk), "campaignId": str(invite.campaign_id), "campaignName": invite.campaign.name, "role": invite.role,
            "issuer": invite.issuer.username, "expiresAt": invite.expires_at.isoformat()}


def campaign_invitations(actor, campaign_id, limit, offset):
    """A campaign's unused invitations, for its GM or the administrator (R4 d)."""
    campaign = Campaign.objects.get(pk=campaign_id)
    campaign_manager(actor, campaign)
    pending = (Invitation.objects.filter(campaign=campaign, consumed_at__isnull=True, expires_at__gt=timezone.now())
               .select_related("campaign", "issuer").order_by("expires_at", "id")[offset:offset + limit])
    return [invitation_view(i) for i in pending]


@transaction.atomic
def revoke_campaign_invitation(actor, campaign_id, invitation_id):
    """The GM cancels his campaign's player invitations; GM invitations stay with the administrator."""
    campaign = Campaign.objects.select_for_update().get(pk=campaign_id)
    campaign_manager(actor, campaign)
    invite = Invitation.objects.select_for_update().filter(pk=invitation_id, campaign=campaign, consumed_at__isnull=True).first()
    require(invite is not None, "not_found", 404)
    require(actor.is_superuser or invite.role == "player", "forbidden", 403)
    AuditEvent.objects.create(actor=actor, action="invitation.revoked", target_id=str(invite.pk))
    invite.delete()


def list_invitations(actor, limit, offset):
    """Unused invitations that have not expired, soonest to expire first. The codes are stored
    hashed, so the list cannot show them again; an invitation can only be cancelled."""
    administrator(actor)
    pending = (Invitation.objects.filter(consumed_at__isnull=True, expires_at__gt=timezone.now())
               .select_related("campaign", "issuer").order_by("expires_at", "id")[offset:offset + limit])
    return [invitation_view(i) for i in pending]


@transaction.atomic
def revoke_invitation(actor, invitation_id):
    administrator(actor)
    invite = Invitation.objects.select_for_update().filter(pk=invitation_id, consumed_at__isnull=True).first()
    require(invite is not None, "not_found", 404)
    AuditEvent.objects.create(actor=actor, action="invitation.revoked", target_id=str(invite.pk))
    invite.delete()


def user_view(user):
    return {"id": str(user.pk), "username": user.username, "displayName": user.display_name, "isAdministrator": user.is_superuser}
