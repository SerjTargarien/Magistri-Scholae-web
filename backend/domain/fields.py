"""Version 1 server field registry; local Dexie schema remains untouched.

Repeated server values use stable item IDs, never array indices in policies.
Media values are private asset UUIDs; services validate their owning sheet/path.
"""
import math
import re
import uuid
from copy import deepcopy
from .errors import require

S = {"type": "string"}
N = {"type": "number"}
B = {"type": "boolean"}
MEDIA = {"type": "media"}


def obj(fields):
    return {"type": "object", "fields": fields}


def items(fields):
    return {"type": "items", "fields": fields}


VALUES = items({"value": S})
JOURNAL = items({"titulo": S, "contenido": S, "fecha": {"type": "number", "maximum": 8640000000000000}})
CHARACTER = {key: S for key in (
    "nombre jugador edad casa curso puestoClase concepto lema escudoText linaje economia varitaSintonia clubes equipo notas"
).split()}
CHARACTER.update({key: N for key in (
    "puntosDestino estresFisico estresFisicoMax estresMental estresMentalMax estresSocial estresSocialMax pxs"
).split()})
CHARACTER.update({key: VALUES for key in (
    "complicaciones consecuenciasFisicas consecuenciasMentales consecuenciasSociales aspectoTemporal aspectosPersonales"
).split()})
CHARACTER.update({
    "characterType": {"type": "string", "choices": ["student", "adult_wizard"]},
    "adultWizardProfile": obj({
        **{k: S for k in "role institution formerHouse magicalFocus reputation".split()},
        "isTeacher": B, "teachingSubjects": VALUES,
    }),
    "estresMentalConsecuencia": S,
    "habilidades": items({"nombre": S, "valor": N, "categoria": S}),
    "conjuros": items({"nombre": S, "valor": N, "specialized": B}),
    "pociones": items({"nombre": S, "valor": N, "specialized": B}),
    "clubesList": items({"nombre": S}),
    "equipoList": items({"nombre": S, "cantidad": N}),
    "camposPersonalizados": items({"nombre": S, "valor": S}),
    "notasList": JOURNAL, "avatarImage": MEDIA,
    "avatarFit": {"type": "string", "choices": ["cover", "contain"]},
    "galleryImages": items({"value": MEDIA}),
})
FAMILIAR = {"nombre": S, "especie": S, "descripcion": S, "imagen": MEDIA,
            "imageFit": {"type": "string", "choices": ["cover", "contain"]},
            "notasList": JOURNAL, "galleryImages": items({"value": MEDIA})}
REGISTRY = {"character": CHARACTER, "familiar": FAMILIAR}
ITEM_ID = re.compile(r"[A-Za-z0-9_-]{1,64}\Z")


def validate(value, spec):
    kind = spec["type"]
    if kind == "string":
        require(isinstance(value, str) and "\x00" not in value and len(value) <= 64000, "invalid_field_value")
        value.encode("utf-8")
        require("choices" not in spec or value in spec["choices"], "invalid_field_value")
    elif kind == "number":
        require(type(value) in (int, float) and math.isfinite(value) and abs(value) <= spec.get("maximum", 1e12), "invalid_field_value")
    elif kind == "boolean":
        require(type(value) is bool, "invalid_field_value")
    elif kind == "media":
        if value not in (None, ""):
            require(isinstance(value, str), "invalid_media")
            try:
                require(str(uuid.UUID(value)) == value, "invalid_media")
            except ValueError:
                require(False, "invalid_media")
    elif kind == "object":
        require(isinstance(value, dict) and not (value.keys() - spec["fields"].keys()), "unknown_field")
        for key, entry in value.items():
            validate(entry, spec["fields"][key])
    elif kind == "items":
        require(isinstance(value, list) and len(value) <= 500, "invalid_collection")
        ids = set()
        for entry in value:
            require(isinstance(entry, dict) and isinstance(entry.get("id"), str) and ITEM_ID.fullmatch(entry["id"]), "invalid_item_id")
            require(entry["id"] not in ids, "duplicate_item_id")
            ids.add(entry["id"])
            validate({k: v for k, v in entry.items() if k != "id"}, obj(spec["fields"]))


def validate_sheet(kind, data):
    require(kind in REGISTRY, "invalid_entity_kind")
    validate(data, obj(REGISTRY[kind]))
    require(isinstance(data.get("nombre"), str) and 0 < len(data["nombre"].strip()) <= 200, "name_required")


def descriptor(kind, path):
    require(isinstance(path, str) and 0 < len(path) <= 300, "invalid_path")
    parts = path.split("/")
    if path == "bond":
        return {"type": "relation"}
    spec = obj(REGISTRY[kind])
    for part in parts:
        if spec["type"] == "items":
            require(ITEM_ID.fullmatch(part), "invalid_path")
            spec = obj(spec["fields"])
        else:
            require(spec["type"] == "object" and part in spec["fields"], "unknown_field")
            spec = spec["fields"][part]
    return spec


def leaf_paths(value, spec, prefix=""):
    if spec["type"] == "object":
        for key, entry in value.items():
            if key in spec["fields"]:
                yield from leaf_paths(entry, spec["fields"][key], f"{prefix}/{key}".strip("/"))
    elif spec["type"] == "items":
        for entry in value:
            yield from leaf_paths({k: v for k, v in entry.items() if k != "id"}, obj(spec["fields"]), f"{prefix}/{entry['id']}")
    else:
        yield prefix


def replace_path(data, kind, path, value):
    spec = descriptor(kind, path)
    require(spec["type"] != "relation", "use_bond_operation")
    item_path = len(path.split("/")) > 1 and descriptor(kind, path.rsplit("/", 1)[0])["type"] == "items"
    if not (item_path and value is None):
        validate(value, spec)
    result = deepcopy(data)
    target = result
    parts = path.split("/")
    for index, part in enumerate(parts[:-1]):
        if isinstance(target, list):
            matches = [item for item in target if item["id"] == part]
            require(len(matches) == 1, "item_not_found")
            target = matches[0]
        else:
            if part not in target:
                parent_spec = descriptor(kind, "/".join(parts[:index + 1]))
                require(parent_spec["type"] in ("object", "items"), "parent_not_found")
                target[part] = {} if parent_spec["type"] == "object" else []
            require(isinstance(target[part], (dict, list)), "parent_not_found")
            target = target[part]
    if isinstance(target, list):
        entry_id = parts[-1]
        existing = next((entry for entry in target if entry["id"] == entry_id), None)
        if value is None:
            require(existing is not None, "item_not_found")
            target.remove(existing)
        elif existing is None:
            target.append({"id": entry_id, **deepcopy(value)})
        else:
            existing.clear()
            existing.update({"id": entry_id, **deepcopy(value)})
    else:
        target[parts[-1]] = deepcopy(value)
    validate_sheet(kind, result)
    return result
