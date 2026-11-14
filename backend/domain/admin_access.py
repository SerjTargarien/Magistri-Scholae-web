"""Administrator access with the GM's permission (R4 e; owner decisions of 9 and 14 November 2026).

The GM grants the site administrator access to his campaign for an issue he describes. While it
lasts (24 hours, until the GM withdraws it, or until the administrator marks it solved) the
administrator reads and changes every sheet of the campaign as its GM would, players' drafts
included, but takes none of the GM's decisions (proposals, archive, assignment, visibility).
Private notes stay excluded: they are never sheet data. Each sheet he opens or changes is logged
for the GM.
"""
from datetime import timedelta
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from .errors import keys, require, text
from .models import AdminAccess, AdminAccessEvent, AuditEvent, Campaign, Membership

LIFETIME = timedelta(hours=24)


def active_access(actor, campaign):
    """The administrator's live access to this campaign, if any."""
    if not (getattr(actor, "is_authenticated", False) and actor.is_active and actor.is_superuser):
        return None
    return AdminAccess.objects.filter(campaign=campaign, ended_at__isnull=True, expires_at__gt=timezone.now()).first()


def by_access(actor, sheet):
    """True when the actor reaches this sheet only through an administrator access (to log it)."""
    access = active_access(actor, sheet.campaign)
    if not access:
        return None
    entitled = Membership.objects.filter(campaign=sheet.campaign, user=actor, role="gm").exists() or sheet.assigned_player_id == actor.pk
    return None if entitled else access


def record(actor, sheet, action):
    access = by_access(actor, sheet)
    if not access:
        return
    event, created = AdminAccessEvent.objects.get_or_create(access=access, sheet=sheet, action=action)
    if not created:
        AdminAccessEvent.objects.filter(pk=event.pk).update(count=F("count") + 1, last_at=timezone.now())


def view(access, with_events=False):
    result = {"id": str(access.pk), "campaignId": str(access.campaign_id), "campaignName": access.campaign.name,
              "reason": access.reason, "grantedBy": access.granted_by.username, "grantedAt": access.created_at.isoformat(),
              "expiresAt": access.expires_at.isoformat(), "endedAt": access.ended_at.isoformat() if access.ended_at else None,
              "endReason": access.end_reason or None,
              "active": access.ended_at is None and access.expires_at > timezone.now()}
    if with_events:
        result["events"] = [{"sheetId": str(e.sheet_id) if e.sheet_id else None, "kind": e.sheet.kind if e.sheet else None,
                             "name": (e.sheet.data or {}).get("nombre", "") if e.sheet else "", "action": e.action, "count": e.count,
                             "firstAt": e.first_at.isoformat(), "lastAt": e.last_at.isoformat()}
                            for e in access.events.select_related("sheet").order_by("first_at", "id")]
    return result


def gm_campaign(actor, campaign_id, lock=False):
    query = Campaign.objects.select_for_update() if lock else Campaign.objects
    campaign = query.filter(pk=campaign_id).first()
    require(campaign is not None, "not_found", 404)
    require(actor.is_authenticated and actor.is_active and Membership.objects.filter(campaign=campaign, user=actor, role="gm").exists(), "forbidden", 403)
    return campaign


def latest(actor, campaign_id):
    """The GM's view: the current or last access, with its log."""
    campaign = gm_campaign(actor, campaign_id)
    access = campaign.admin_accesses.select_related("campaign", "granted_by").order_by("-created_at").first()
    return {"access": view(access, with_events=True) if access else None}


@transaction.atomic
def grant(actor, campaign_id, body):
    keys(body, ["reason"], ["reason"])
    campaign = gm_campaign(actor, campaign_id, lock=True)
    reason = text(body["reason"], 300).strip()
    require(reason, "field_required")
    now = timezone.now()
    for old in AdminAccess.objects.select_for_update().filter(campaign=campaign, ended_at__isnull=True):
        old.ended_at, old.end_reason = now, "withdrawn"
        old.save(update_fields=["ended_at", "end_reason"])
    access = AdminAccess.objects.create(campaign=campaign, granted_by=actor, reason=reason, expires_at=now + LIFETIME)
    AuditEvent.objects.create(actor=actor, action="admin_access.granted", target_id=str(access.pk))
    return {"access": view(access, with_events=True)}


@transaction.atomic
def withdraw(actor, campaign_id):
    campaign = gm_campaign(actor, campaign_id, lock=True)
    access = AdminAccess.objects.select_for_update().filter(campaign=campaign, ended_at__isnull=True, expires_at__gt=timezone.now()).first()
    require(access is not None, "not_found", 404)
    access.ended_at, access.end_reason = timezone.now(), "withdrawn"
    access.save(update_fields=["ended_at", "end_reason"])
    AuditEvent.objects.create(actor=actor, action="admin_access.withdrawn", target_id=str(access.pk))
    return {"access": view(access, with_events=True)}


def administrator_accesses(actor):
    """The administrator's live accesses, in any campaign."""
    require(actor.is_authenticated and actor.is_active and actor.is_superuser, "forbidden", 403)
    live = AdminAccess.objects.filter(ended_at__isnull=True, expires_at__gt=timezone.now()).select_related("campaign", "granted_by").order_by("expires_at")
    return [view(a) for a in live]


@transaction.atomic
def solved(actor, access_id):
    require(actor.is_authenticated and actor.is_active and actor.is_superuser, "forbidden", 403)
    access = AdminAccess.objects.select_for_update().filter(pk=access_id, ended_at__isnull=True).first()
    require(access is not None, "not_found", 404)
    access.ended_at, access.end_reason = timezone.now(), "solved"
    access.save(update_fields=["ended_at", "end_reason"])
    AuditEvent.objects.create(actor=actor, action="admin_access.solved", target_id=str(access.pk))
    return {"access": view(access)}
