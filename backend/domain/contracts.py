from .fields import REGISTRY


def schema_contract():
    return {"schemaVersion": 1, "entities": REGISTRY,
            "audiences": ["gm", "assigned", "shared"], "collectionIdentity": "stable-id",
            "media": "private-field-bound-assets", "transfers": "separate-entities-deferred"}
