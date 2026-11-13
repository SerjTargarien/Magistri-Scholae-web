#!/usr/bin/env bash
# Restore drill (release R2.4): prove that a backup can be brought back.
#
#   deploy/restore-check.sh [--target staging|production] [archive.tar.gpg]
#
# Decrypts the archive (default: the newest local one), restores the database
# into a throwaway PostgreSQL container on an isolated network, and compares
# every table's row count and the media file count with the live environment.
# For archives that list their images (R6 step 5), every listed image is also
# decrypted from the media store and checked against its SHA-256.
# Everything temporary is removed afterwards; the live environment is only read.
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${MAGISTRI_APP_DIR:-$(cd "$DEPLOY_DIR/.." && pwd)}"
TARGET=staging
if [[ "${1:-}" == "--target" ]]; then TARGET="${2:?target required}"; shift 2; fi
case "$TARGET" in
  staging) DB=db-staging; API=api-staging ;;
  production) DB=db-production; API=api-production ;;
  *) echo "Unknown target '$TARGET' (use staging or production)" >&2; exit 1 ;;
esac
BACKUP_DIR="${BACKUP_DIR:-/opt/magistri/backups}/$TARGET"
MEDIA_STORE="${MEDIA_STORE:-${BACKUP_DIR%/*}/media}"
ARCHIVE="${1:-$(ls -1 "$BACKUP_DIR"/magistri-"$TARGET"-*.tar.gpg | sort | tail -1)}"
COMPOSE=(docker compose -f "$APP_DIR/deploy/compose.yaml")
set -a; . "$APP_DIR/deploy/.env.backup"; set +a

WORK="$(mktemp -d)"; NET=magistri-restore-check; DBC=magistri-restore-db
cleanup() { docker rm -f -v "$DBC" >/dev/null 2>&1 || true; docker network rm "$NET" >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

echo "== archive: $(basename "$ARCHIVE")"
gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 3 --decrypt "$ARCHIVE" 3< <(printf '%s' "$BACKUP_PASSPHRASE") \
  | tar -C "$WORK" -xf -
sed 's/^/   /' "$WORK/manifest.txt"

echo "== restoring into a throwaway database"
docker network create --internal "$NET" >/dev/null
docker run -d --name "$DBC" --network "$NET" -e POSTGRES_DB=restore -e POSTGRES_USER=restore \
  -e POSTGRES_PASSWORD="$(openssl rand -hex 16)" postgres:18.6 >/dev/null
for _ in $(seq 1 60); do docker exec "$DBC" pg_isready -U restore -d restore >/dev/null 2>&1 && break; sleep 1; done
sleep 2  # first start restarts once after initialisation
for _ in $(seq 1 30); do docker exec "$DBC" pg_isready -U restore -d restore >/dev/null 2>&1 && break; sleep 1; done
docker exec -i "$DBC" pg_restore -U restore -d restore --no-owner --exit-on-error < "$WORK/database.dump"

COUNT_SQL="select table_name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text
           from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1"
docker exec "$DBC" psql -U restore -d restore -At -F ' ' -c "$COUNT_SQL" > "$WORK/restored.txt"
"${COMPOSE[@]}" exec -T "$DB" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -F " " -c "$0"' "$COUNT_SQL" </dev/null > "$WORK/live.txt"

echo "== table row counts (restored vs live)"
differences=0
while read -r table restored; do
  live="$(awk -v t="$table" '$1 == t {print $2}' "$WORK/live.txt")"
  marker=""; [[ "$restored" == "$live" ]] || { marker="  <-- differs (writes since the backup?)"; differences=$((differences + 1)); }
  printf '   %-34s %6s %6s%s\n' "$table" "$restored" "${live:-missing}" "$marker"
done < "$WORK/restored.txt"
echo "   tables restored: $(wc -l < "$WORK/restored.txt"), live: $(wc -l < "$WORK/live.txt")"

if [[ -f "$WORK/media.txt" ]]; then
  python3 "$DEPLOY_DIR/media_backup.py" check --list "$WORK/media.txt" --store "$MEDIA_STORE" | sed 's/^/== /'
  media_backup="$(wc -l < "$WORK/media.txt")"
else
  media_backup="$(tar -tf "$WORK/media.tar" | grep -vc '/$' || true)"
fi
media_live="$("${COMPOSE[@]}" exec -T "$API" sh -c 'find /data/media -type f | wc -l' </dev/null)"
echo "== media files: backup $media_backup, live $media_live"
[[ "$differences" -eq 0 && "$media_backup" == "$media_live" ]] && echo "RESULT: restore matches the live environment" \
  || echo "RESULT: restored, with differences listed above"
