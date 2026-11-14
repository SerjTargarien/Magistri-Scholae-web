import json
import uuid
from functools import wraps
from django.contrib.auth import login, logout
from django.core.exceptions import ObjectDoesNotExist, RequestDataTooBig, ValidationError
from django.db import IntegrityError, transaction
from django.http import JsonResponse, HttpResponseBase
from django.middleware.csrf import get_token
from . import accounts, admin_access, notes, services, operations, media
from .errors import APIError, keys, require, text
from .fields import REGISTRY
from .contracts import schema_contract
from .models import Campaign, Membership, PersonalNote, Share
from .permissions import can_read, gm_of, is_gm, list_sheets, member, projection, sheet_for


def endpoint(methods, public=False, outcome=None):
    def decorate(function):
        @wraps(function)
        def wrapped(request, *args, **kwargs):
            try:
                require(request.method in methods, "method_not_allowed", 405)
                require(public or request.user.is_authenticated, "authentication_required", 401)
                body = {}
                if request.method in ("POST", "PATCH", "DELETE"):
                    require(request.content_type == "application/json", "json_required", 415)
                    require(len(request.body) <= (6 * 1024 * 1024 if function.__name__ == "asset_upload" else 1024 * 1024), "request_too_large", 413)
                    body = json.loads(request.body or b"{}", parse_constant=lambda _: (_ for _ in ()).throw(ValueError()))
                    require(isinstance(body, dict))
                if outcome and request.method != "GET":
                    result = operations.execute(request.user, request.method + ":" + request.path, body,
                        "deleted" if request.method == "DELETE" else outcome,
                        lambda clean: function(request, clean, *args, **kwargs), target_id=kwargs.get("sheet_id"))
                else:
                    result = function(request, body, *args, **kwargs)
                if isinstance(result, HttpResponseBase):
                    return result
                return JsonResponse(result, json_dumps_params={"ensure_ascii": False, "allow_nan": False})
            except APIError as error:
                response = JsonResponse({"error": {"code": error.code, **error.details}}, status=error.status)
                if error.status == 405:
                    response["Allow"] = ", ".join(methods)
                return response
            except ObjectDoesNotExist:
                return JsonResponse({"error": {"code": "not_found"}}, status=404)
            except IntegrityError:
                return JsonResponse({"error": {"code": "conflict"}}, status=409)
            except RequestDataTooBig:
                return JsonResponse({"error": {"code": "request_too_large"}}, status=413)
            except (ValueError, TypeError, ValidationError, UnicodeDecodeError):
                return JsonResponse({"error": {"code": "invalid_request"}}, status=400)
        return wrapped
    return decorate


def query_keys(request, allowed=()):
    require(not (request.GET.keys() - set(allowed)), "unsupported_query")


def pagination(request):
    limit, offset = int(request.GET.get("limit", "50")), int(request.GET.get("offset", "0"))
    require(1 <= limit <= 100 and 0 <= offset <= 100000)
    return limit, offset


def csrf_failure(request, reason=""):
    response = JsonResponse({"error": {"code": "csrf_failed"}}, status=403)
    response["Cache-Control"] = "no-store, private"
    return response


def not_found(request, exception=None):
    return JsonResponse({"error": {"code": "not_found"}}, status=404)


def server_error(request):
    return JsonResponse({"error": {"code": "server_error"}}, status=500)


@endpoint(["GET"], public=True)
def csrf(request, body):
    return {"csrfToken": get_token(request)}


@endpoint(["GET"])
def me(request, body):
    return accounts.user_view(request.user)


@endpoint(["POST"], public=True)
def sign_in(request, body):
    keys(body, ["username", "password"], ["username", "password"])
    user = accounts.login_account(request, body["username"], body["password"])
    login(request, user)
    request.session["auth_epoch"] = user.auth_epoch
    return {"user": accounts.user_view(user), "csrfToken": get_token(request)}


@endpoint(["POST"])
def sign_out(request, body):
    keys(body, [])
    logout(request)
    return {}


@endpoint(["POST"])
def invitations(request, body):
    keys(body, ["campaignId", "role"], ["campaignId", "role"])
    token, invite = accounts.issue_invitation(request.user, body["campaignId"], body["role"])
    return {"token": token, "expiresAt": invite.expires_at.isoformat()}


@endpoint(["POST"], public=True)
def register(request, body):
    keys(body, ["invitationToken", "username", "password", "displayName"], ["invitationToken", "username", "password"])
    accounts.throttle("register", request.META.get("REMOTE_ADDR", "unknown"), 30)
    user = accounts.register(body["invitationToken"], body["username"], body["password"], body.get("displayName", ""))
    # Registration does not silently log the account in; use the login endpoint.
    return {"user": accounts.user_view(user)}


@endpoint(["POST"])
def reset_codes(request, body):
    keys(body, ["userId"], ["userId"])
    code, reset = accounts.issue_reset(request.user, body["userId"])
    return {"code": code, "expiresAt": reset.expires_at.isoformat()}


@endpoint(["POST"], public=True)
def password_reset(request, body):
    keys(body, ["code", "newPassword"], ["code", "newPassword"])
    accounts.throttle("reset-ip", request.META.get("REMOTE_ADDR", "unknown"), 20)
    accounts.reset_password(body["code"], body["newPassword"])
    logout(request)
    return {}


@endpoint(["POST"])
def password_change(request, body):
    keys(body, ["currentPassword", "newPassword"], ["currentPassword", "newPassword"])
    accounts.throttle("password-change", str(request.user.pk), 10)
    accounts.change_password(request.user, body["currentPassword"], body["newPassword"])
    logout(request)
    return {}


@endpoint(["POST"])
def user_state(request, body, user_id):
    keys(body, ["active"], ["active"])
    accounts.account_state(request.user, user_id, body["active"])
    return {}


@endpoint(["GET"])
def admin_users(request, body):
    query_keys(request, ["limit", "offset"])
    limit, offset = pagination(request)
    return {"items": accounts.list_users(request.user, limit, offset)}


@endpoint(["GET"])
def admin_invitations(request, body):
    query_keys(request, ["limit", "offset"])
    limit, offset = pagination(request)
    return {"items": accounts.list_invitations(request.user, limit, offset)}


@endpoint(["DELETE"])
def admin_invitation(request, body, invitation_id):
    keys(body, [])
    accounts.revoke_invitation(request.user, invitation_id)
    return {}


@endpoint(["GET", "POST"])
def campaigns(request, body):
    if request.method == "POST":
        keys(body, ["name"], ["name"])
        return accounts.create_campaign(request.user, body["name"])
    query_keys(request, ["limit", "offset"])
    limit, offset = pagination(request)
    query = Campaign.objects.all() if request.user.is_superuser else Campaign.objects.filter(membership__user=request.user)
    # The viewer's own role ("gm", "player", or None for an administrator who is not a member).
    roles = dict(Membership.objects.filter(user=request.user).values_list("campaign_id", "role"))
    return {"items": [{"id": str(c.pk), "name": c.name, "policyRevision": c.policy_revision, "role": roles.get(c.pk)}
                       for c in query.order_by("id")[offset:offset + limit]]}


@endpoint(["PATCH"])
def campaign(request, body, campaign_id):
    keys(body, ["name"], ["name"])
    return accounts.rename_campaign(request.user, campaign_id, body["name"])


@endpoint(["GET", "POST", "DELETE"])
def campaign_admin_access(request, body, campaign_id):
    """The GM's grant (R4 e): GET the current or last access with its log; POST {reason} grants;
    DELETE withdraws."""
    if request.method == "POST":
        return admin_access.grant(request.user, campaign_id, body)
    if request.method == "DELETE":
        keys(body, [])
        return admin_access.withdraw(request.user, campaign_id)
    query_keys(request)
    return admin_access.latest(request.user, campaign_id)


@endpoint(["GET"])
def admin_accesses(request, body):
    query_keys(request)
    return {"items": admin_access.administrator_accesses(request.user)}


@endpoint(["POST"])
def admin_access_solved(request, body, access_id):
    keys(body, [])
    return admin_access.solved(request.user, access_id)


@endpoint(["GET"])
def campaign_invitations(request, body, campaign_id):
    query_keys(request, ["limit", "offset"])
    limit, offset = pagination(request)
    return {"items": accounts.campaign_invitations(request.user, campaign_id, limit, offset)}


@endpoint(["DELETE"])
def campaign_invitation(request, body, campaign_id, invitation_id):
    keys(body, [])
    accounts.revoke_campaign_invitation(request.user, campaign_id, invitation_id)
    return {}


@endpoint(["GET", "POST"])
def memberships(request, body, campaign_id):
    if request.method == "POST":
        services.set_membership(request.user, campaign_id, body)
        return {}
    if request.user.is_superuser:
        # The site administrator reads any campaign's member list (usernames and roles only, R4),
        # without being its GM.
        accounts.administrator(request.user)
        campaign = Campaign.objects.get(pk=campaign_id)
    else:
        campaign = services.campaign_for(request.user, campaign_id, gm=True)
    query_keys(request, ["limit", "offset"])
    limit, offset = pagination(request)
    return {"items": [{"userId": str(m.user_id), "username": m.user.username, "displayName": m.user.display_name, "role": m.role}
                       for m in Membership.objects.filter(campaign=campaign).select_related("user").order_by("id")[offset:offset + limit]]}


@endpoint(["GET", "POST"])
def tables(request, body, campaign_id):
    if request.method == "POST":
        return services.create_table(request.user, campaign_id, body)
    query_keys(request)
    return {"items": services.list_tables(request.user, campaign_id)}


@endpoint(["PATCH", "DELETE"])
def table(request, body, campaign_id, table_id):
    if request.method == "DELETE":
        keys(body, [])
        services.remove_table(request.user, campaign_id, table_id)
        return {}
    return services.rename_table(request.user, campaign_id, table_id, body)


@endpoint(["GET", "POST"])
def skill_catalogue(request, body, campaign_id):
    if request.method == "POST":
        return services.save_catalogue(request.user, campaign_id, body)
    # Every member needs it to draw sheets: names, categories and order of linked skills.
    campaign = services.campaign_for(request.user, campaign_id)
    return {"catalogue": campaign.skill_catalogue, "revision": campaign.catalogue_revision}


@endpoint(["POST"])
def campaign_visibility_preview(request, body, campaign_id):
    return services.campaign_policy(request.user, campaign_id, body)


@endpoint(["POST"])
def campaign_visibility(request, body, campaign_id):
    return services.campaign_policy(request.user, campaign_id, body, apply=True)


@endpoint(["GET", "POST"], outcome="sheet")
def sheets(request, body, kind):
    if request.method == "POST":
        return services.create_sheet(request.user, kind, body)
    query_keys(request, ["campaignId", "limit", "offset"])
    require("campaignId" in request.GET)
    campaign = services.campaign_for(request.user, request.GET["campaignId"])
    limit, offset = pagination(request)
    query = list_sheets(request.user, campaign, kind)[offset:offset + limit]
    return {"items": [projection(request.user, s) for s in query]}


@endpoint(["GET", "PATCH", "DELETE"], outcome="sheet")
def sheet_detail(request, body, sheet_id, kind):
    if request.method == "PATCH":
        return services.patch_sheet(request.user, sheet_id, kind, body)
    if request.method == "DELETE":
        return services.delete_sheet(request.user, sheet_id, kind, body)
    query_keys(request)
    sheet = sheet_for(request.user, sheet_id, kind)
    admin_access.record(request.user, sheet, "read")
    return projection(request.user, sheet)


@endpoint(["POST"], outcome="sheet")
def sheet_manage(request, body, sheet_id, kind):
    return services.manage_sheet(request.user, sheet_id, kind, body)


@endpoint(["POST"])
def sheet_status(request, body, sheet_id, kind):
    return services.change_status(request.user, sheet_id, kind, body)


@endpoint(["GET", "POST"], outcome="sheet")
def sharing(request, body, sheet_id, kind):
    if request.method == "POST":
        return services.share_sheet(request.user, sheet_id, kind, body)
    sheet = sheet_for(request.user, sheet_id, kind)
    member(request.user, sheet.campaign, gm=True)
    query_keys(request, ["limit", "offset"])
    limit, offset = pagination(request)
    return {"items": [{"recipientId": str(s.recipient_id), "access": "read-only"}
                       for s in Share.objects.filter(sheet=sheet).order_by("id")[offset:offset + limit]]}


@endpoint(["POST"])
def visibility_preview(request, body, sheet_id, kind):
    return services.preview_policy(request.user, sheet_id, kind, body)


@endpoint(["GET", "POST"], outcome="sheet")
def visibility(request, body, sheet_id, kind):
    if request.method == "POST":
        return services.apply_policy(request.user, sheet_id, kind, body)
    sheet = sheet_for(request.user, sheet_id, kind)
    if gm_of(request.user, sheet):
        return {"defaultAudience": sheet.gm_default, "overrides": sheet.gm_overrides, "restrictions": sheet.player_restrictions}
    require(request.user.pk == sheet.assigned_player_id, "forbidden", 403)
    return {"restrictions": {p: v for p, v in sheet.player_restrictions.items() if can_read(request.user, sheet, p, gm=False)}}


@endpoint(["POST"], outcome="sheet")
def bond(request, body, sheet_id, kind):
    return services.set_bond(request.user, sheet_id, kind, body)


@endpoint(["GET", "POST"], outcome="personal")
def personal_notes(request, body):
    if request.method == "POST":
        return notes.create_personal(request.user, body)
    query_keys(request, ["limit", "offset", "sheetId"])
    limit, offset = pagination(request)
    found = PersonalNote.objects.filter(author=request.user)
    if "sheetId" in request.GET:
        try:
            found = found.filter(sheet_id=uuid.UUID(request.GET["sheetId"]))
        except ValueError:
            require(False)
    # Newest written first, like a diary (owner, 12 November 2026).
    return {"items": [notes.personal_view(n) for n in found.order_by("-created_at", "-id")[offset:offset + limit]]}


@endpoint(["GET", "PATCH", "DELETE"], outcome="personal")
def personal_note(request, body, note_id):
    if request.method != "GET":
        return notes.edit_personal(request.user, note_id, body, delete=request.method == "DELETE")
    query_keys(request)
    note = PersonalNote.objects.filter(pk=note_id, author=request.user).first()
    require(note is not None, "not_found", 404)
    return notes.personal_view(note)


@endpoint(["GET"])
def schema(request, body):
    return schema_contract()


@endpoint(["POST"], outcome="sheet")
def asset_upload(request, body, sheet_id, kind):
    return media.upload(request.user, sheet_id, kind, body)


@endpoint(["GET"])
def asset_download(request, body, asset_id):
    query_keys(request)
    return media.download(request.user, asset_id)


@endpoint(["POST"])
def promotion_preview(request, body, note_id):
    return notes.promote(request.user, note_id, body)


@endpoint(["POST"], outcome="sheet")
def promotion_apply(request, body, note_id):
    return notes.promote(request.user, note_id, body, apply=True)
