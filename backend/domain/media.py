"""Private filesystem storage. Every download rechecks the owning field."""
import base64
import binascii
import io
import uuid
import warnings
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import FileSystemStorage
from django.db import transaction
from django.http import FileResponse
from PIL import Image, ImageOps, UnidentifiedImageError
from .errors import APIError, keys, require, text
from .fields import REGISTRY, descriptor, leaf_paths, obj, replace_path
from .models import MediaAsset
from .permissions import can_read, can_write, check_revision, projection, sheet_for
from .services import touch

MAX_BYTES = 4 * 1024 * 1024
MAX_PIXELS = 16_000_000


def value_at(data, path):
    value = data
    for part in path.split("/"):
        if isinstance(value, list):
            value = next((item for item in value if item.get("id") == part), None)
        elif isinstance(value, dict):
            value = value.get(part)
        else:
            return None
    return value


def validate_references(sheet, data, kind):
    for path in leaf_paths(data, obj(REGISTRY[kind])):
        value = value_at(data, path)
        if descriptor(kind, path)["type"] == "media" and value:
            require(sheet is not None and MediaAsset.objects.filter(pk=value, sheet=sheet, field_path=path).exists(), "invalid_media")


def decode_image(encoded):
    try:
        require(isinstance(encoded, str) and len(encoded) <= (MAX_BYTES * 4 // 3 + 4), "image_too_large", 413)
        raw = base64.b64decode(encoded, validate=True)
        require(0 < len(raw) <= MAX_BYTES, "image_too_large", 413)
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(raw), formats=["PNG", "JPEG", "WEBP"]) as source:
                require(source.width * source.height <= MAX_PIXELS and max(source.size) <= 8192, "image_too_large", 413)
                require(getattr(source, "n_frames", 1) == 1, "animated_image_not_supported")
                source.load()
                image = ImageOps.exif_transpose(source).convert("RGBA")
                output = io.BytesIO()
                image.save(output, format="PNG")  # No filename, EXIF or supplied MIME survives.
                require(output.tell() <= MAX_BYTES, "image_too_large", 413)
                return output.getvalue(), image.size
    except (binascii.Error, UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise APIError("invalid_image") from None


@transaction.atomic
def upload(actor, sheet_id, kind, body):
    keys(body, ["expectedRevision", "path", "imageBase64"], ["expectedRevision", "path", "imageBase64"])
    sheet = sheet_for(actor, sheet_id, kind, lock=True)
    check_revision(actor, sheet, body["expectedRevision"])
    path = text(body["path"], 300)
    require(descriptor(kind, path)["type"] == "media", "invalid_media_path")
    require(can_write(actor, sheet, path), "field_forbidden", 403)
    raw, (width, height) = decode_image(body["imageBase64"])
    asset = MediaAsset(sheet=sheet, field_path=path, width=width, height=height)
    storage = FileSystemStorage(location=settings.PRIVATE_MEDIA_ROOT)
    name = storage.save(f"{asset.pk}.png", ContentFile(raw))
    try:
        asset.storage_name = name
        asset.save()
        sheet.data = replace_path(sheet.data, kind, path, str(asset.pk))
        touch(sheet, "media.attached", actor)
        return projection(actor, sheet)
    except Exception:
        storage.delete(name)
        raise


def download(actor, asset_id):
    # Read-only: no row locks, so loading portraits never waits on saves.
    asset = MediaAsset.objects.filter(pk=asset_id).select_related("sheet").first()
    require(asset is not None, "not_found", 404)
    sheet = sheet_for(actor, asset.sheet_id, asset.sheet.kind)
    require(can_read(actor, sheet, asset.field_path) and value_at(sheet.data, asset.field_path) == str(asset.pk), "not_found", 404)
    storage = FileSystemStorage(location=settings.PRIVATE_MEDIA_ROOT)
    try:
        response = FileResponse(storage.open(asset.storage_name, "rb"), content_type="image/png")
    except FileNotFoundError:
        raise APIError("not_found", 404) from None
    response["Content-Disposition"] = 'inline; filename="image.png"'
    response["Cross-Origin-Resource-Policy"] = "same-origin"
    return response
