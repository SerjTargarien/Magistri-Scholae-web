# Backend image (release R2). Built on the server by deploy/compose.yaml.
# Same Python as the tested runtime (backend/.python-version).
FROM python:3.14.7-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_MEDIA_ROOT=/data/media

RUN groupadd --system --gid 10001 app \
 && useradd --system --uid 10001 --gid app --home-dir /app --shell /usr/sbin/nologin app

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY --chown=app:app . .
RUN mkdir -p /data/media && chown app:app /data/media

USER app
EXPOSE 8000

# Django's own middleware decides which proxy headers to trust
# (DJANGO_TRUSTED_PROXIES); gunicorn is told to trust none itself.
# Access logging is left to Caddy; gunicorn logs errors to stderr.
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "2", \
     "--timeout", "60", \
     "--forwarded-allow-ips", "", \
     "--error-logfile", "-"]
