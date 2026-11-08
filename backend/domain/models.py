import re
import uuid
from django.contrib.auth.models import AbstractUser, UserManager
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.functions import Lower
from .catalogue import default_catalogue


def normalized_username(value):
    if not isinstance(value, str) or not re.fullmatch(r"[A-Za-z0-9_-]{3,30}", value):
        raise ValidationError("Use 3–30 ASCII letters, digits, underscores or hyphens")
    return value.lower()


class AccountManager(UserManager):
    def _create_user(self, username, email, password, **extra_fields):
        return super()._create_user(normalized_username(username), email, password, **extra_fields)


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    display_name = models.CharField(max_length=80, blank=True)
    auth_epoch = models.PositiveIntegerField(default=1)
    objects = AccountManager()
    REQUIRED_FIELDS = []

    class Meta:
        constraints = [models.UniqueConstraint(Lower("username"), name="username_case_insensitive")]

    def save(self, *args, **kwargs):
        self.username = normalized_username(self.username)
        super().save(*args, **kwargs)


class Campaign(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    visibility_defaults = models.JSONField(default=dict)
    policy_revision = models.PositiveIntegerField(default=1)
    # Skill categories and default skills (domain/catalogue.py); the GM edits it in R4.
    skill_catalogue = models.JSONField(default=default_catalogue)
    catalogue_revision = models.PositiveIntegerField(default=1)


class Membership(models.Model):
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=6, choices=[("gm", "GM"), ("player", "Player")])

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["campaign", "user"], name="unique_membership"),
            models.CheckConstraint(condition=models.Q(role__in=["gm", "player"]), name="valid_campaign_role"),
        ]


class Invitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token_hash = models.CharField(max_length=64, unique=True)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE)
    issuer = models.ForeignKey(User, on_delete=models.PROTECT)
    role = models.CharField(max_length=6, default="player")
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True)


class PasswordReset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    issuer = models.ForeignKey(User, on_delete=models.PROTECT, related_name="issued_resets")
    code_hash = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True)


class Sheet(models.Model):
    """Independent character or familiar; kind-specific endpoints and registries."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.PROTECT)
    kind = models.CharField(max_length=9, choices=[("character", "Character"), ("familiar", "Familiar")])
    creator = models.ForeignKey(User, on_delete=models.PROTECT, related_name="created_sheets")
    assigned_player = models.ForeignKey(User, on_delete=models.PROTECT, null=True, related_name="assigned_sheets")
    data = models.JSONField(default=dict)
    schema_version = models.PositiveIntegerField(default=3)  # fields.SCHEMA_VERSION
    revision = models.PositiveIntegerField(default=1)
    gm_default = models.CharField(max_length=8, default="inherit")
    gm_overrides = models.JSONField(default=dict)
    player_restrictions = models.JSONField(default=dict)
    archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(kind__in=["character", "familiar"]), name="valid_sheet_kind")]


class Share(models.Model):
    sheet = models.ForeignKey(Sheet, on_delete=models.CASCADE, related_name="shares")
    recipient = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["sheet", "recipient"], name="unique_read_only_share")]


class Bond(models.Model):
    character = models.OneToOneField(Sheet, on_delete=models.CASCADE, related_name="familiar_bond")
    familiar = models.OneToOneField(Sheet, on_delete=models.CASCADE, related_name="character_bond")

    class Meta:
        constraints = [models.CheckConstraint(condition=~models.Q(character=models.F("familiar")), name="different_bond_entities")]


class GMNote(models.Model):
    sheet = models.OneToOneField(Sheet, on_delete=models.CASCADE)
    content = models.TextField(blank=True)
    revision = models.PositiveIntegerField(default=1)


class PersonalNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    sheet = models.ForeignKey(Sheet, on_delete=models.SET_NULL, null=True)
    label = models.CharField(max_length=120, blank=True)
    title = models.CharField(max_length=200)
    content = models.TextField()
    revision = models.PositiveIntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)


class RateBucket(models.Model):
    key = models.CharField(max_length=64, primary_key=True)
    started_at = models.DateTimeField()
    attempts = models.PositiveIntegerField(default=0)


class AuditEvent(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=60)
    target_id = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    # Deliberately no request body, note body, username or secret-bearing metadata.


class ProcessedOperation(models.Model):
    actor = models.ForeignKey(User, on_delete=models.CASCADE)
    operation_id = models.UUIDField()
    fingerprint = models.CharField(max_length=64)
    outcome_kind = models.CharField(max_length=20)
    target_id = models.UUIDField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["actor", "operation_id"], name="unique_actor_operation")]


class MediaAsset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sheet = models.ForeignKey(Sheet, on_delete=models.CASCADE)
    field_path = models.CharField(max_length=300)
    storage_name = models.CharField(max_length=100)
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
