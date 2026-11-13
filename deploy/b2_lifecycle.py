#!/usr/bin/env python3
"""Show or set the backup bucket's lifecycle rules (R6 step 5).

  b2_lifecycle.py show    print the bucket's current rules
  b2_lifecycle.py set     archives' folders only: staging/ and production/ are
                          hidden 30 days after upload and deleted 30 days after
                          that; media/ (each image stored once) has no rule

Uses the server's key from deploy/.env.backup (environment), standard library
only, and never prints the key. Agreed with the owner on 13 November 2026.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from b2_upload import authorize, call  # noqa: E402

RULES = [{"fileNamePrefix": prefix, "daysFromUploadingToHiding": 30, "daysFromHidingToDeleting": 30}
         for prefix in ("production/", "staging/")]


def bucket(account, bucket_id):
    buckets = call(f"{account['apiUrl']}/b2api/v2/b2_list_buckets",
                   {"accountId": account["accountId"], "bucketId": bucket_id},
                   {"Authorization": account["authorizationToken"]})["buckets"]
    return buckets[0]


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ("show", "set"):
        raise SystemExit(__doc__.strip().splitlines()[2])
    account, bucket_id = authorize()
    current = bucket(account, bucket_id)
    print("current:", json.dumps(current["lifecycleRules"], sort_keys=True))
    if sys.argv[1] == "set":
        updated = call(f"{account['apiUrl']}/b2api/v2/b2_update_bucket",
                       # No ifRevisionMatches: the server's restricted key may change
                       # lifecycle rules, but B2 refuses that option without writeBuckets.
                       {"accountId": account["accountId"], "bucketId": bucket_id, "lifecycleRules": RULES},
                       {"Authorization": account["authorizationToken"]})
        print("now:    ", json.dumps(updated["lifecycleRules"], sort_keys=True))
        taken = sorted(({key: rule.get(key) for key in RULES[0]} for rule in updated["lifecycleRules"]),
                       key=lambda rule: rule["fileNamePrefix"])
        if taken != RULES:
            raise SystemExit("the bucket did not take the new rules")
