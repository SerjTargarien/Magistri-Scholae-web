#!/usr/bin/env bash
# Nightly backup of one environment's database and media (release R2.4).
#
#   deploy/backup.sh [--target staging|production]   back up, verify, upload to Backblaze B2
#
# The archive (pg_dump custom format + a tar of the media volume) is encrypted
# with GnuPG (AES-256) using BACKUP_PASSPHRASE from deploy/.env.backup, checked
# by decrypting it again, uploaded with deploy/b2_upload.py, and kept locally
# (last KEEP_LOCAL archives) for quick restores. Nothing is printed from the
# secrets file. Retention in B2 is the bucket's lifecycle rule, not this script.
set -euo pipefail
umask 077   # archives and the backup folder are readable by the deploy user only

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${MAGISTRI_APP_DIR:-$(cd "$DEPLOY_DIR/.." && pwd)}"   # override to test a script copy against the live app
TARGET=staging
if [[ "${1:-}" == "--target" ]]; then TARGET="${2:?target required}"; fi
case "$TARGET" in
  staging) DB=db-staging; API=api-staging ;;
  production) DB=db-production; API=api-production ;;
  *) echo "Unknown target '$TARGET' (use staging or production)" >&2; exit 1 ;;
esac
BACKUP_DIR="${BACKUP_DIR:-/opt/magistri/backups}/$TARGET"
KEEP_LOCAL="${KEEP_LOCAL:-7}"
COMPOSE=(docker compose -f "$APP_DIR/deploy/compose.yaml")

set -a; . "$APP_DIR/deploy/.env.backup"; set +a
: "${BACKUP_PASSPHRASE:?missing in deploy/.env.backup}" "${B2_BUCKET:?}" "${B2_KEY_ID:?}" "${B2_APP_KEY:?}"

stamp="$(date -u +%Y%m%d-%H%M%S)"
name="magistri-$TARGET-$stamp.tar.gpg"
mkdir -p "$BACKUP_DIR"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
log() { echo "$(date '+%F %T') $*"; }

log "backing up $TARGET as $name"
"${COMPOSE[@]}" exec -T "$DB" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner' \
  </dev/null > "$WORK/database.dump"
# A one-off container with the backend's image and media volume, so this also
# works while the backend is stopped (the R6 move freezes writes that way).
"${COMPOSE[@]}" run --rm --no-deps -T "$API" tar -C /data/media -cf - . </dev/null > "$WORK/media.tar"
{
  echo "target=$TARGET"
  echo "created_utc=$stamp"
  echo "app_commit=$(git -C "$APP_DIR" rev-parse --short HEAD)"
  echo "database_bytes=$(stat -c %s "$WORK/database.dump")"
  echo "media_files=$(tar -tf "$WORK/media.tar" | grep -vc '/$' || true)"
} > "$WORK/manifest.txt"
sed 's/^/  /' "$WORK/manifest.txt"

# Encrypt; the passphrase goes through a file descriptor, never the command line.
tar -C "$WORK" -cf - manifest.txt database.dump media.tar \
  | gpg --batch --quiet --yes --pinentry-mode loopback --passphrase-fd 3 \
        --symmetric --cipher-algo AES256 --output "$BACKUP_DIR/$name.partial" \
        3< <(printf '%s' "$BACKUP_PASSPHRASE")

# Verify before uploading: it must decrypt and contain all three parts.
contents="$(gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 3 --decrypt "$BACKUP_DIR/$name.partial" \
  3< <(printf '%s' "$BACKUP_PASSPHRASE") | tar -tf - | sort | paste -sd' ')"
[[ "$contents" == "database.dump manifest.txt media.tar" ]] || { log "verification FAILED: $contents"; exit 1; }
mv "$BACKUP_DIR/$name.partial" "$BACKUP_DIR/$name"
log "encrypted and verified: $(stat -c %s "$BACKUP_DIR/$name") bytes"

python3 "$DEPLOY_DIR/b2_upload.py" "$BACKUP_DIR/$name" "$TARGET/$name"

# Keep only the newest local copies.
ls -1 "$BACKUP_DIR"/magistri-"$TARGET"-*.tar.gpg 2>/dev/null | sort | head -n -"$KEEP_LOCAL" | xargs -r rm -f
log "done; local copies: $(ls -1 "$BACKUP_DIR"/*.tar.gpg | wc -l)"
