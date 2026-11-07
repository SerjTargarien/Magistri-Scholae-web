"""Explicit fictional loopback preview; never uses the development database."""
from .settings import *  # noqa: F403

ISOLATED_PREVIEW = True
DEBUG = True
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]
DATABASES = {"default": {**DATABASES["default"], "NAME": "magistri_preview"}}
PRIVATE_MEDIA_ROOT = BASE_DIR / ".tmp" / "preview-media"
