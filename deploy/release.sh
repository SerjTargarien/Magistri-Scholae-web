#!/usr/bin/env bash
# Builds and activates a frontend release on the server. See deploy/README.md.
#
#   deploy/release.sh <git-ref>        build <git-ref> (a tag, branch or commit) and activate it
#   deploy/release.sh --activate <id>  switch back to an existing release (rollback)
#   deploy/release.sh --list           list releases, marking the active one
#
# Releases live in deploy/releases/<id>/ and deploy/releases/current is a
# relative symlink to the active one; Caddy follows it on every request, so
# activation is atomic and needs no restart. Builds run in a pinned Node
# container, so the server needs only Git and Docker.
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"
RELEASES="$DEPLOY_DIR/releases"
KEEP="${KEEP_RELEASES:-5}"
mkdir -p "$RELEASES"

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

  echo "Building $ref ($sha) as release $id"
  git -C "$REPO_DIR" archive "$sha" | tar -x -C "$work"
  local node_image="node:$(tr -d '[:space:]' < "$work/.node-version")-alpine"
  # Default mode: VITE_STORAGE_MODE unset means local browser storage (R1).
  docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -e CI=true \
    -v "$work:/app" -w /app "$node_image" \
    sh -c "npm ci --no-audit --no-fund && npm run build"
  [[ -f "$work/dist/index.html" ]] || { echo "Build produced no dist/index.html" >&2; exit 1; }

  printf '%s\n%s\nbuilt %s\n' "$sha" "$ref" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$work/dist/version.txt"
  cp -a "$work/dist" "$RELEASES/$id.partial"
  mv "$RELEASES/$id.partial" "$RELEASES/$id"
  activate "$id"
  prune
}

case "${1:-}" in
  --activate) activate "${2:?release id required}" ;;
  --list) list ;;
  ""|-h|--help) sed -n '2,7p' "$0" ;;
  *) build "$1" ;;
esac
