#!/usr/bin/env bash
# Builds and activates a frontend release on the server. See deploy/README.md.
#
#   deploy/release.sh [--target T] <git-ref>        build <git-ref> (tag, branch or commit) and activate it
#   deploy/release.sh [--target T] --activate <id>  switch back to an existing release (rollback)
#   deploy/release.sh [--target T] --list           list releases, marking the active one
#
#   --target production  (default) the public site: local-storage build, deploy/releases/
#   --target staging     the account version: remote build, deploy/releases-staging/
#
# Each target's current release is deploy/<dir>/current, a relative symlink
# that Caddy follows on every request, so activation is atomic and needs no
# restart. Builds run in a pinned Node container: the server needs only Git
# and Docker.
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"
TARGET=production
if [[ "${1:-}" == "--target" ]]; then TARGET="${2:?target required}"; shift 2; fi
case "$TARGET" in
  production) RELEASES="$DEPLOY_DIR/releases"; BUILD_SCRIPT=build ;;          # VITE_STORAGE_MODE unset: local storage
  staging)    RELEASES="$DEPLOY_DIR/releases-staging"; BUILD_SCRIPT=build:remote ;;  # .env.remote: account version
  *) echo "Unknown target '$TARGET' (use production or staging)" >&2; exit 1 ;;
esac
KEEP="${KEEP_RELEASES:-5}"
mkdir -p "$RELEASES"
[[ -w "$RELEASES" ]] || { echo "$RELEASES is not writable by $(id -un); fix with: sudo chown $(id -un): $RELEASES" >&2; exit 1; }

active() { readlink "$RELEASES/current" 2>/dev/null || true; }

activate() {
  local id="$1"
  [[ "$id" =~ ^[A-Za-z0-9._-]+$ && -f "$RELEASES/$id/index.html" ]] || { echo "No complete release named '$id'" >&2; exit 1; }
  ln -sfn "$id" "$RELEASES/current.next"
  mv -Tf "$RELEASES/current.next" "$RELEASES/current"
  echo "Active release: $id"
}

list() {
  local current; current="$(active)"
  for dir in "$RELEASES"/*/; do
    [[ -d "$dir" && ! -L "${dir%/}" ]] || continue
    local id; id="$(basename "$dir")"
    echo "$([[ "$id" == "$current" ]] && echo '*' || echo ' ') $id  $(cat "$dir/version.txt" 2>/dev/null | head -1)"
  done
}

prune() {
  local current; current="$(active)"
  local old
  old="$(find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort | head -n -"$KEEP")"
  for id in $old; do [[ "$id" == "$current" ]] || rm -rf "${RELEASES:?}/$id"; done
}

build() {
  local ref="$1"
  git -C "$REPO_DIR" fetch --quiet --tags origin
  # Prefer the freshly fetched remote branch; fall back to tags and commits.
  local sha
  sha="$(git -C "$REPO_DIR" rev-parse --verify --quiet "origin/$ref^{commit}" || git -C "$REPO_DIR" rev-parse --verify "$ref^{commit}")"
  local id; id="$(date -u +%Y%m%d-%H%M%S)-${sha:0:7}"
  WORK="$(mktemp -d)"
  trap 'rm -rf "$WORK"' EXIT
  local work="$WORK"

  echo "Building $ref ($sha) for $TARGET as release $id"
  git -C "$REPO_DIR" archive "$sha" | tar -x -C "$work"
  local node_image="node:$(tr -d '[:space:]' < "$work/.node-version")-alpine"
  docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -e CI=true \
    -v "$work:/app" -w /app "$node_image" \
    sh -c "npm ci --no-audit --no-fund && npm run $BUILD_SCRIPT"
  [[ -f "$work/dist/index.html" ]] || { echo "Build produced no dist/index.html" >&2; exit 1; }

  printf '%s\n%s\nbuilt %s\ntarget %s\n' "$sha" "$ref" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$TARGET" > "$work/dist/version.txt"
  cp -a "$work/dist" "$RELEASES/$id.partial"
  mv "$RELEASES/$id.partial" "$RELEASES/$id"
  activate "$id"
  prune
}

case "${1:-}" in
  --activate) activate "${2:?release id required}" ;;
  --list) list ;;
  ""|-h|--help) sed -n '2,10p' "$0" ;;
  *) build "$1" ;;
esac
