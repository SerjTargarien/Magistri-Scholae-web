#!/usr/bin/env bash
# Restores a backup archive into one environment's database and media (R6).
#
#   deploy/restore.sh --target production|staging [--replace] [--media-store DIR] <archive.tar.gpg>
#
# Used to move the testers' data from staging to production (R6), and later to
# refresh staging's development copy from a production backup. The archive may
# come from either environment (backup.sh, R2.4). Steps: decrypt; stop the
# target's backend; if the target already holds data, refuse unless --replace,
# and then back it up first (backup.sh, uploaded like a nightly one); restore
# the database and media; apply migrations; start the backend; compare row and
# file counts with the archive. The database server keeps running throughout.
# Since R6 step 5 an archive lists its images (media.txt) and they come from the
# media store (default /opt/magistri/backups/media; --media-store for a media/
# folder downloaded from B2); older archives carry media.tar and still work.
set -euo pipefail
umask 077

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${MAGISTRI_APP_DIR:-$(cd "$DEPLOY_DIR/.." && pwd)}"
TARGET=""; REPLACE=0; ARCHIVE=""; MEDIA_STORE="${BACKUP_DIR:-/opt/magistri/backups}/media"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="${2:?target required}"; shift 2 ;;
    --replace) REPLACE=1; shift ;;
    --media-store) MEDIA_STORE="${2:?folder required}"; shift 2 ;;
    -*) echo "Unknown option $1" >&2; exit 1 ;;
    *) ARCHIVE="$1"; shift ;;
  esac
done
case "$TARGET" in
  staging) DB=db-staging; API=api-staging ;;
  production) DB=db-production; API=api-production ;;
  *) echo "Use --target staging or --target production" >&2; exit 1 ;;
esac
[[ -f "$ARCHIVE" ]] || { echo "No archive '$ARCHIVE'" >&2; exit 1; }
COMPOSE=(docker compose -f "$APP_DIR/deploy/compose.yaml")
set -a; . "$APP_DIR/deploy/.env.backup"; set +a
: "${BACKUP_PASSPHRASE:?missing in deploy/.env.backup}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
log() { echo "$(date '+%F %T') $*"; }
psql_target() { "${COMPOSE[@]}" exec -T "$DB" sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c "$0"' "$1" </dev/null; }

log "archive: $(basename "$ARCHIVE") -> $TARGET"
gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 3 --decrypt "$ARCHIVE" 3< <(printf '%s' "$BACKUP_PASSPHRASE") \
  | tar -C "$WORK" -xf -
sed 's/^/  /' "$WORK/manifest.txt"
if [[ ! -f "$WORK/media.tar" ]]; then
  # Rebuild the media folder from the store, checking every image, before anything stops.
  mkdir "$WORK/media"
  python3 "$DEPLOY_DIR/media_backup.py" restore --list "$WORK/media.txt" --store "$MEDIA_STORE" --dir "$WORK/media"
  tar -C "$WORK/media" -cf "$WORK/media.tar" .
fi

"${COMPOSE[@]}" up -d --wait "$DB" >/dev/null
tables="$(psql_target "select count(*) from information_schema.tables where table_schema = 'public'")"
if [[ "$tables" != "0" ]]; then
  [[ "$REPLACE" -eq 1 ]] || { echo "$TARGET already holds data ($tables tables); add --replace to back it up and replace it" >&2; exit 1; }
  log "backing up the current $TARGET data before replacing it"
  "$DEPLOY_DIR/backup.sh" --target "$TARGET"
fi

log "stopping $API"
"${COMPOSE[@]}" stop "$API" >/dev/null
psql_target "drop schema public cascade; create schema public;" >/dev/null
"${COMPOSE[@]}" exec -T "$DB" sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --exit-on-error' < "$WORK/database.dump"
# The backend's own image and user, with the media volume, while it is stopped.
"${COMPOSE[@]}" run --rm --no-deps -T "$API" sh -c 'find /data/media -mindepth 1 -delete && tar -C /data/media -xf -' \
  < "$WORK/media.tar"
"${COMPOSE[@]}" run --rm -T "$API" python manage.py migrate --no-input </dev/null
"${COMPOSE[@]}" up -d "$API" >/dev/null
log "started $API"

media_archive="$(tar -tf "$WORK/media.tar" | grep -vc '/$' || true)"
media_live="$("${COMPOSE[@]}" exec -T "$API" sh -c 'find /data/media -type f | wc -l' </dev/null)"
log "media files: archive $media_archive, $TARGET $media_live"
log "rows: $(psql_target "select (select count(*) from domain_user) || ' accounts, ' || (select count(*) from domain_sheet) || ' sheets, ' || (select count(*) from domain_personalnote) || ' personal notes'")"
[[ "$media_archive" == "$media_live" ]] || { log "media count differs"; exit 1; }
log "done"
