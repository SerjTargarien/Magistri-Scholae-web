"""Retry receipts contain references and keyed fingerprints, never response bodies."""
import hashlib
import hmac
import json
import uuid
from django.conf import settings
from django.db import transaction
from .errors import require
from .models import PersonalNote, ProcessedOperation, Sheet, User
from .permissions import projection, sheet_for


@transaction.atomic
def execute(actor, scope, body, outcome_kind, apply, target_id=None):
    body = dict(body)
    operation_id = body.pop("operationId", None)
    # Version 1 clients without IDs remain compatible; the remote adapter always
    # supplies one and retains the exact request until its outcome is known.
    if operation_id is None:
        return apply(body)
    require(isinstance(operation_id, str), "invalid_operation_id")
    operation_id = uuid.UUID(operation_id)
    fingerprint = hmac.new(settings.HMAC_KEY.encode(), json.dumps(
        [scope, body], sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode(), hashlib.sha256).hexdigest()
    current_actor = User.objects.select_for_update().get(pk=actor.pk)
    require(current_actor.is_active and current_actor.auth_epoch == actor.auth_epoch, "authentication_required", 401)
    receipt = ProcessedOperation.objects.filter(actor=actor, operation_id=operation_id).first()
    if receipt:
        require(hmac.compare_digest(receipt.fingerprint, fingerprint), "operation_reused", 409)
        if receipt.outcome_kind == "sheet":
            target = Sheet.objects.get(pk=receipt.target_id)
            return projection(actor, sheet_for(actor, target.pk, target.kind, lock=True))
        if receipt.outcome_kind == "personal":
            from .notes import personal_view
            note = PersonalNote.objects.filter(pk=receipt.target_id, author=actor).first()
            require(note is not None, "not_found", 404)
            return personal_view(note)
        return {}
    result = apply(body)
    ProcessedOperation.objects.create(actor=actor, operation_id=operation_id, fingerprint=fingerprint,
        outcome_kind=outcome_kind, target_id=result.get("id") if outcome_kind in ("sheet", "personal") else target_id)
    return result
