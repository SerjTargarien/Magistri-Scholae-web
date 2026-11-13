#!/usr/bin/env python3
"""Backups that store each image once (R6 step 5, owner decision of 8 November 2026).

  media_backup.py backup  --dir DIR --store STORE --list OUT   [--no-upload]
  media_backup.py restore --list LIST --store STORE --dir DIR
  media_backup.py check   --list LIST --store STORE

backup:  writes LIST ("sha256 size path" per media file under DIR). Each image
         not yet in STORE is encrypted (GnuPG, AES-256, BACKUP_PASSPHRASE) and
         uploaded to B2 as media/<name>.gpg, then kept in STORE under the same
         name. The name is an HMAC of the image's SHA-256 keyed with the
         passphrase, so file names reveal nothing about the images. An image
         counts as stored only once its upload succeeded.
restore: rebuilds DIR from LIST and STORE (the server's store, or a media/
         folder downloaded from B2), checking every image's SHA-256.
check:   decrypts every image LIST names from STORE and checks its SHA-256
         (the restore drill).

The nightly archive (backup.sh) holds LIST, not the images. The bucket's
lifecycle rule hides only the archives' folders after 30 days; media/ is kept
(deploy/b2_lifecycle.py). Standard library only; secrets are never printed.
"""
import argparse
import hashlib
import hmac
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import b2_upload  # noqa: E402


def passphrase():
    value = os.environ.get("BACKUP_PASSPHRASE", "")
    if not value:
        raise SystemExit("BACKUP_PASSPHRASE is not set (deploy/.env.backup)")
    return value.encode()


def stored_name(digest):
    return hmac.new(passphrase(), digest.encode(), hashlib.sha256).hexdigest() + ".gpg"


def gpg(args, data):
    """Runs gpg with the passphrase on a pipe, never on the command line."""
    read_end, write_end = os.pipe()
    os.write(write_end, passphrase())
    os.close(write_end)
    try:
        result = subprocess.run(["gpg", "--batch", "--quiet", "--yes", "--pinentry-mode", "loopback",
                                 "--passphrase-fd", str(read_end), *args],
                                input=data, capture_output=True, pass_fds=(read_end,))
    finally:
        os.close(read_end)
    if result.returncode:
        raise SystemExit(f"gpg failed: {result.stderr.decode(errors='replace').strip()[:200]}")
    return result.stdout


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def read_list(path):
    entries = []
    for line in Path(path).read_text().splitlines():
        digest, size, name = line.split(" ", 2)
        entries.append((digest, int(size), name))
    return entries


def backup(directory, store, out, upload=True):
    root, store = Path(directory), Path(store)
    store.mkdir(mode=0o700, parents=True, exist_ok=True)
    entries = []
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        data = path.read_bytes()
        entries.append((sha256(data), len(data), path.relative_to(root).as_posix()))
    Path(out).write_text("".join(f"{d} {s} {n}\n" for d, s, n in entries))
    new = 0
    for digest in sorted({d for d, _, _ in entries}):
        target = store / stored_name(digest)
        if target.exists():
            continue
        data = (root / next(n for d, _, n in entries if d == digest)).read_bytes()
        encrypted = gpg(["--symmetric", "--cipher-algo", "AES256", "--compress-algo", "none"], data)
        if sha256(gpg(["--decrypt"], encrypted)) != digest:
            raise SystemExit("an encrypted image did not decrypt to the original; nothing uploaded")
        partial = target.with_suffix(".partial")
        partial.write_bytes(encrypted)
        if upload:
            b2_upload.upload(str(partial), "media/" + target.name, quiet=True)
        partial.rename(target)
        new += 1
    print(f"media: {len(entries)} files, {new} new images stored{' and uploaded' if upload else ''}, "
          f"{len({d for d, _, _ in entries}) - new} already stored")


def restore(listing, store, directory):
    root, store = Path(directory), Path(store)
    entries = read_list(listing)
    for _, _, name in entries:
        if not (root / name).resolve().is_relative_to(root.resolve()):
            raise SystemExit(f"refusing a path outside the media folder: {name}")
    missing = [d for d, _, _ in entries if not (store / stored_name(d)).exists()]
    if missing:
        raise SystemExit(f"{len(missing)} of {len(entries)} images are missing from {store}")
    for digest, size, name in entries:
        data = gpg(["--decrypt"], (store / stored_name(digest)).read_bytes())
        if sha256(data) != digest or len(data) != size:
            raise SystemExit(f"an image does not match its fingerprint ({name})")
        target = root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    print(f"media: {len(entries)} files restored and checked")


def check(listing, store):
    store = Path(store)
    entries = read_list(listing)
    bad = 0
    for digest, size, _ in entries:
        path = store / stored_name(digest)
        if not path.exists():
            bad += 1
            continue
        try:
            data = gpg(["--decrypt"], path.read_bytes())
        except SystemExit:
            bad += 1
            continue
        bad += sha256(data) != digest or len(data) != size
    print(f"media: {len(entries) - bad} of {len(entries)} images decrypt and match their fingerprints")
    if bad:
        raise SystemExit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0])
    parser.add_argument("action", choices=["backup", "restore", "check"])
    parser.add_argument("--dir")
    parser.add_argument("--store", required=True)
    parser.add_argument("--list", required=True)
    parser.add_argument("--no-upload", action="store_true", help="store locally only (tests)")
    args = parser.parse_args()
    if args.action == "backup":
        backup(args.dir, args.store, args.list, upload=not args.no_upload)
    elif args.action == "restore":
        restore(args.list, args.store, args.dir)
    else:
        check(args.list, args.store)
