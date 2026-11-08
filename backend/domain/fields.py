"""Version 3 server field registry: every stored field with its rule.

The rules are the owner's decisions in docs/field-rules.md (8 November 2026):
text lengths, whole-number ranges, choices and list sizes. The registry is
exported to the frontend (export_api_contract), so inputs use the same limits.

Repeated server values use stable item IDs, never array indices in policies.
Media values are private asset UUIDs; services validate their owning sheet/path.
"""
import json
import re
import uuid
from copy import deepcopy
from .catalogue import check_skills
from .errors import APIError, require

SCHEMA_VERSION = 4
MAX_SHEET_BYTES = 5 * 1024 * 1024  # stored text per sheet; images are separate files
B = {"type": "boolean"}
MEDIA = {"type": "media"}


def text(max_length, required=False):
    spec = {"type": "string", "maxLength": max_length}
    if required:
        spec["required"] = True
    return spec


def choice(*values):
    return {"type": "string", "choices": list(values)}


def whole(minimum, maximum):
    return {"type": "number", "integer": True, "minimum": minimum, "maximum": maximum}


def obj(fields):
    return {"type": "object", "fields": fields}


def items(fields, max_items, **extra):
    return {"type": "items", "fields": fields, "maxItems": max_items, **extra}


def values(max_items, max_length):
    return items({"value": text(max_length, required=True)}, max_items)


HOUSES = ["", "IRATI", "URANIA", "AL-KHWARIZMI", "CALANTES", "ALEIXIS"]
FIT = choice("cover", "contain")
DATE = whole(0, 8640000000000000)
GALLERY = items({"value": MEDIA}, 50)
CONSEQUENCES = items({"descripcion": text(1000, required=True), "gravedad": choice("leve", "moderada", "grave")}, 30)
STRESS = [("estresFisico", "estresFisicoMax"), ("estresMental", "estresMentalMax"), ("estresSocial", "estresSocialMax")]

CHARACTER = {
    "nombre": text(80, required=True),
    "characterType": choice("student", "adult_wizard"),
    "concepto": text(200), "jugador": text(80), "edad": whole(0, 999),
    "curso": text(20), "puestoClase": text(80), "casa": choice(*HOUSES),
    # One «Varita / Foco mágico» for every character; the adult profile's
    # magicalFocus merged into it in schema version 4 (migration 0006).
    "linaje": text(200), "economia": text(200), "varitaSintonia": text(200),
    "adultWizardProfile": obj({
        **{key: text(120) for key in ("role", "institution", "reputation")},
        "formerHouse": text(80), "isTeacher": B, "teachingSubjects": values(30, 120),
    }),
    "aspectosPersonales": values(30, 300), "complicaciones": values(30, 300),
    "camposPersonalizados": items({"nombre": text(60, required=True), "valor": text(500)}, 100),
    "puntosDestino": whole(0, 10), "pxs": whole(0, 1000000),
    **{current: whole(0, 10) for current, _ in STRESS},
    **{maximum: whole(1, 10) for _, maximum in STRESS},
    "aspectoTemporal": values(30, 300),
    "consecuenciasFisicas": CONSEQUENCES, "consecuenciasMentales": CONSEQUENCES, "consecuenciasSociales": CONSEQUENCES,
    # A default skill links to the campaign's catalogue (`catalogo`); a skill the
    # player invents has its own `nombre` and a catalogue `categoria`. Knowledge
    # (basic: alteration, medium: destruction, advanced: creation) is only for
    # esoteric categories. See domain/catalogue.py.
    "habilidades": items({"catalogo": text(64), "nombre": text(60), "categoria": text(64), "valor": whole(0, 5),
                          "conocimiento": choice("basico", "medio", "avanzado")}, 200, skillEntry=True),
    "conjuros": items({"nombre": text(100, required=True), "valor": whole(1, 5), "specialized": B}, 200),
    "pociones": items({"nombre": text(100, required=True), "valor": whole(1, 5), "specialized": B}, 200),
    "clubesList": items({"nombre": text(100, required=True)}, 50),
    "equipoList": items({"nombre": text(100, required=True), "cantidad": whole(1, 9999)}, 500),
    "notasList": items({"titulo": text(200), "contenido": text(50000, required=True), "fecha": DATE}, 5000),
    "avatarImage": MEDIA, "avatarFit": FIT, "galleryImages": GALLERY,
}
FAMILIAR = {
    "nombre": text(80, required=True), "especie": text(60, required=True), "descripcion": text(5000),
    "imagen": MEDIA, "imageFit": FIT,
    # A familiar's journal entry needs a title or a text (owner decision).
    "notasList": items({"titulo": text(200), "contenido": text(50000), "fecha": DATE}, 5000, requireOneOf=["titulo", "contenido"]),
    "galleryImages": GALLERY,
}
REGISTRY = {"character": CHARACTER, "familiar": FAMILIAR}
ITEM_ID = re.compile(r"[A-Za-z0-9_-]{1,64}\Z")


def invalid(code, path, rule, limit=None):
    """A rejected value. The path and limit let the app say which rule was hit."""
    details = {"path": path, "rule": rule}
    if limit is not None:
        details["limit"] = limit
    return APIError(code, 400, details)


def validate(value, spec, path=""):
    kind = spec["type"]
    if kind == "string":
        if not isinstance(value, str) or "\x00" in value:
            raise invalid("invalid_field_value", path, "type")
        value.encode("utf-8")
        if "choices" in spec and value not in spec["choices"]:
            raise invalid("invalid_field_value", path, "choice", spec["choices"])
        if len(value) > spec.get("maxLength", 64000):
            raise invalid("field_too_long", path, "maxLength", spec.get("maxLength", 64000))
        if spec.get("required") and not value.strip():
            raise invalid("field_required", path, "required")
    elif kind == "number":
        allowed = (int,) if spec.get("integer") else (int, float)
        if type(value) not in allowed or (isinstance(value, float) and value != value):
            raise invalid("invalid_field_value", path, "integer" if spec.get("integer") else "type")
        if not spec.get("minimum", -1e12) <= value <= spec.get("maximum", 1e12):
            raise invalid("field_out_of_range", path, "range", [spec.get("minimum"), spec.get("maximum")])
    elif kind == "boolean":
        if type(value) is not bool:
            raise invalid("invalid_field_value", path, "type")
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
            validate(entry, spec["fields"][key], f"{path}/{key}".strip("/"))
    elif kind == "items":
        require(isinstance(value, list), "invalid_collection")
        if len(value) > spec["maxItems"]:
            raise invalid("too_many_items", path, "maxItems", spec["maxItems"])
        ids = set()
        for entry in value:
            require(isinstance(entry, dict) and isinstance(entry.get("id"), str) and ITEM_ID.fullmatch(entry["id"]), "invalid_item_id")
            require(entry["id"] not in ids, "duplicate_item_id")
            ids.add(entry["id"])
            validate_item({k: v for k, v in entry.items() if k != "id"}, spec, f"{path}/{entry['id']}")


def validate_item(fields, spec, path):
    """One list entry, without its id, against the list's spec."""
    validate(fields, obj(spec["fields"]), path)
    names = spec.get("requireOneOf")
    if names and not any(isinstance(fields.get(n), str) and fields[n].strip() for n in names):
        raise invalid("field_required", path, "requireOneOf", names)
    if spec.get("skillEntry"):
        linked = bool(fields.get("catalogo"))
        own = bool(str(fields.get("nombre", "")).strip()) and bool(fields.get("categoria"))
        if linked == own or (linked and ("nombre" in fields or "categoria" in fields)):
            raise invalid("field_required", path, "linkedOrOwn", ["catalogo", "nombre+categoria"])


def validate_sheet(kind, data, catalogue=None, only_skills=None):
    """With a campaign catalogue, also checks the character's skills against it
    (all of them, or only `only_skills`, the entries a save touched)."""
    require(kind in REGISTRY, "invalid_entity_kind")
    validate(data, obj(REGISTRY[kind]))
    require(isinstance(data.get("nombre"), str) and data["nombre"].strip(), "name_required")
    for current, maximum in STRESS:
        if current in data and data[current] > data.get(maximum, 10):
            raise invalid("field_out_of_range", current, "notAboveMaximum", maximum)
    if len(json.dumps(data, ensure_ascii=False).encode("utf-8")) > MAX_SHEET_BYTES:
        raise invalid("sheet_too_large", "", "maxSheetBytes", MAX_SHEET_BYTES)
    if catalogue is not None and kind == "character":
        check_skills(data.get("habilidades"), catalogue, only_skills)


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


def replace_path(data, kind, path, value, catalogue=None):
    spec = descriptor(kind, path)
    require(spec["type"] != "relation", "use_bond_operation")
    parent = descriptor(kind, path.rsplit("/", 1)[0]) if "/" in path else None
    item_path = parent is not None and parent["type"] == "items"
    if item_path and value is not None:
        validate_item(value, parent, path)
    elif not item_path:
        validate(value, spec, path)
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
    parts = path.split("/")
    touched = None
    if parts[0] == "habilidades":
        touched = {entry["id"] for entry in result.get("habilidades", [])} if len(parts) == 1 else {parts[1]}
    validate_sheet(kind, result, catalogue if touched else None, touched)
    return result
