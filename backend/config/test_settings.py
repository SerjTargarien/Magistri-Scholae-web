import os
os.environ.setdefault("DJANGO_SECRET_KEY", "isolated-tests-only-never-use-this-key-for-deployment")
os.environ.setdefault("DJANGO_HMAC_KEY", "isolated-tests-only-separate-hmac-key-never-for-deployment")
from .settings import *  # noqa: F403

DEBUG = False
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
ALLOWED_HOSTS = ["testserver", "localhost", "127.0.0.1"]
# Test speed only; application defaults retain Django's production hashers.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
STATIC_URL = "/__test-static__/"
MEDIA_URL = "/__test-media__/"
