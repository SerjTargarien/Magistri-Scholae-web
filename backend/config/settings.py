import ipaddress
import os
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
DEBUG = os.getenv("DJANGO_DEBUG", "false").lower() == "true"
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "")
if not SECRET_KEY:
    raise ImproperlyConfigured("Set DJANGO_SECRET_KEY in backend/.env or the environment")
if not DEBUG and (len(SECRET_KEY) < 50 or SECRET_KEY.startswith("development-only")):
    raise ImproperlyConfigured("Non-development settings require a generated secret key of at least 50 characters")
# Keyed fingerprints (invitation/reset-code hashes, rate-limit keys, revision
# tokens, retry receipts) use their own key, so SECRET_KEY (sessions, signed
# previews) can be rotated without invalidating them, and vice versa.
HMAC_KEY = os.getenv("DJANGO_HMAC_KEY", "") or (SECRET_KEY if DEBUG else "")
if not DEBUG and (len(HMAC_KEY) < 50 or HMAC_KEY == SECRET_KEY):
    raise ImproperlyConfigured("Non-development settings require DJANGO_HMAC_KEY: at least 50 characters, different from DJANGO_SECRET_KEY")
# Reverse proxies (Caddy) allowed to set X-Forwarded-Proto/For, as IPs or
# CIDR networks. Empty means none: forwarded headers are then discarded.
TRUSTED_PROXIES = [ipaddress.ip_network(value.strip(), strict=False)
                   for value in os.getenv("DJANGO_TRUSTED_PROXIES", "").split(",") if value.strip()]
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
INSTALLED_APPS = ["django.contrib.auth", "django.contrib.contenttypes", "django.contrib.sessions", "domain"]
MIDDLEWARE = [
    # First: decides scheme and client address before anything relies on them.
    "domain.middleware.TrustedProxyMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "domain.middleware.PrivateResponsesMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "domain.middleware.AccountEpochMiddleware",
]
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
DATABASES = {"default": {
    "ENGINE": "django.db.backends.postgresql",
    "NAME": os.getenv("POSTGRES_DB", "magistri_dev"),
    "USER": os.getenv("POSTGRES_USER", "magistri"),
    "PASSWORD": os.getenv("POSTGRES_PASSWORD", ""),
    "HOST": os.getenv("POSTGRES_HOST", "127.0.0.1"),
    "PORT": os.getenv("POSTGRES_PORT", "55432"),
    "CONN_MAX_AGE": 0,
    "OPTIONS": {"connect_timeout": 5},
}}
AUTH_USER_MODEL = "domain.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 12}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
USE_TZ = True
TIME_ZONE = "UTC"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 12 * 60 * 60
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_FAILURE_VIEW = "domain.views.csrf_failure"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = False
PRIVATE_MEDIA_ROOT = Path(os.getenv("DJANGO_MEDIA_ROOT", "")) if os.getenv("DJANGO_MEDIA_ROOT") else BASE_DIR / "private-media"
# Only the bounded base64 image endpoint may exceed the ordinary JSON limit.
DATA_UPLOAD_MAX_MEMORY_SIZE = 6 * 1024 * 1024
CSRF_TRUSTED_ORIGINS = os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", "http://127.0.0.1:3002,http://localhost:3002").split(",") if DEBUG else []
APPEND_SLASH = False
# No CORS wildcard, public media route or admin data browser. Proxy headers
# are trusted only from TRUSTED_PROXIES (domain.middleware.TrustedProxyMiddleware).

# Errors must be visible with DEBUG off: Django's default console handler only
# runs in DEBUG. Messages and tracebacks go to stdout (the container log);
# request bodies are never logged.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"plain": {"format": "%(asctime)s %(levelname)s %(name)s: %(message)s"}},
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "plain"}},
    "root": {"handlers": ["console"], "level": "WARNING"},
    "loggers": {
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
        "django.security": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "domain": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}
