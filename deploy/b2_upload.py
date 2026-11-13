#!/usr/bin/env python3
"""Upload one file to the Backblaze B2 bucket in deploy/.env.backup.

Usage: b2_upload.py <local-file> <remote-name>

Uses the B2 native API (v2) with only the Python standard library. Reads the
key from the environment (B2_KEY_ID, B2_APP_KEY, B2_BUCKET) and never prints
it. Retries with a fresh upload URL on transient errors, as B2 recommends.
"""
import base64
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.backblazeb2.com/b2api/v2"


def call(url, payload=None, headers=None, data=None):
    body = data if data is not None else (json.dumps(payload).encode() if payload is not None else None)
    request = urllib.request.Request(url, data=body, headers=headers or {}, method="POST" if body is not None else "GET")
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.load(response)


_session = None


def authorize(fresh=False):
    """One authorization per run (media_backup.py uploads many files)."""
    global _session
    if _session and not fresh:
        return _session
    credentials = base64.b64encode(f"{os.environ['B2_KEY_ID']}:{os.environ['B2_APP_KEY']}".encode()).decode()
    account = call(f"{API}/b2_authorize_account", headers={"Authorization": "Basic " + credentials})
    bucket_id = account["allowed"].get("bucketId")
    if not bucket_id or account["allowed"].get("bucketName") != os.environ["B2_BUCKET"]:
        raise SystemExit("The key is not restricted to the configured bucket; refusing to upload.")
    _session = account, bucket_id
    return _session


def upload(path, remote_name, attempts=5, quiet=False):
    content = open(path, "rb").read()
    sha1 = hashlib.sha1(content).hexdigest()
    account, bucket_id = authorize()
    for attempt in range(1, attempts + 1):
        try:
            target = call(f"{account['apiUrl']}/b2api/v2/b2_get_upload_url", {"bucketId": bucket_id},
                          {"Authorization": account["authorizationToken"]})
            result = call(target["uploadUrl"], data=content, headers={
                "Authorization": target["authorizationToken"],
                "X-Bz-File-Name": urllib.parse.quote(remote_name, safe="/"),
                "Content-Type": "application/octet-stream",
                "Content-Length": str(len(content)),
                "X-Bz-Content-Sha1": sha1,
            })
            if result.get("contentSha1") != sha1:
                raise SystemExit("Uploaded checksum does not match the local file.")
            if not quiet:
                print(f"uploaded {remote_name} ({len(content)} bytes, sha1 {sha1[:12]}…)")
            return
        except urllib.error.HTTPError as error:
            code = error.code
            if code == 401:
                account, bucket_id = authorize(fresh=True)
            elif code not in (408, 429) and code < 500:
                raise SystemExit(f"Upload rejected: HTTP {code} {json.load(error).get('code')}")
        except (urllib.error.URLError, TimeoutError):
            pass
        time.sleep(min(2 ** attempt, 30))
    raise SystemExit(f"Upload failed after {attempts} attempts.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__.strip().splitlines()[2])
    upload(sys.argv[1], sys.argv[2])
