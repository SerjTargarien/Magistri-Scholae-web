"""Field rules (R3.2): converts stored sheets from schema version 1 to 2.

Version 2 removes lema, escudoText, notas, clubes, equipo and
estresMentalConsecuencia, stores age as a number, gives each consequence a
description and a severity, and enforces the rules in docs/field-rules.md.
Stored values that break a rule are brought within it (texts shortened,
numbers clamped, empty entries dropped), so every sheet validates afterwards
and players can keep saving. Privacy settings naming removed paths are dropped.

The registry is frozen below so later registry changes cannot alter what this
migration does. It is not reversible: restore the pre-migration backup instead.
"""
import json
import re
from django.db import migrations, models

REGISTRY = json.loads('{"character": {"adultWizardProfile": {"fields": {"formerHouse": {"maxLength": 80, "type": "string"}, "institution": {"maxLength": 120, "type": "string"}, "isTeacher": {"type": "boolean"}, "magicalFocus": {"maxLength": 120, "type": "string"}, "reputation": {"maxLength": 120, "type": "string"}, "role": {"maxLength": 120, "type": "string"}, "teachingSubjects": {"fields": {"value": {"maxLength": 120, "required": true, "type": "string"}}, "maxItems": 30, "type": "items"}}, "type": "object"}, "aspectoTemporal": {"fields": {"value": {"maxLength": 300, "required": true, "type": "string"}}, "maxItems": 30, "type": "items"}, "aspectosPersonales": {"fields": {"value": {"maxLength": 300, "required": true, "type": "string"}}, "maxItems": 30, "type": "items"}, "avatarFit": {"choices": ["cover", "contain"], "type": "string"}, "avatarImage": {"type": "media"}, "camposPersonalizados": {"fields": {"nombre": {"maxLength": 60, "required": true, "type": "string"}, "valor": {"maxLength": 500, "type": "string"}}, "maxItems": 100, "type": "items"}, "casa": {"choices": ["", "IRATI", "URANIA", "AL-KHWARIZMI", "CALANTES", "ALEIXIS"], "type": "string"}, "characterType": {"choices": ["student", "adult_wizard"], "type": "string"}, "clubesList": {"fields": {"nombre": {"maxLength": 100, "required": true, "type": "string"}}, "maxItems": 50, "type": "items"}, "complicaciones": {"fields": {"value": {"maxLength": 300, "required": true, "type": "string"}}, "maxItems": 30, "type": "items"}, "concepto": {"maxLength": 200, "type": "string"}, "conjuros": {"fields": {"nombre": {"maxLength": 100, "required": true, "type": "string"}, "specialized": {"type": "boolean"}, "valor": {"integer": true, "maximum": 5, "minimum": 1, "type": "number"}}, "maxItems": 200, "type": "items"}, "consecuenciasFisicas": {"fields": {"descripcion": {"maxLength": 1000, "required": true, "type": "string"}, "gravedad": {"choices": ["leve", "moderada", "grave"], "type": "string"}}, "maxItems": 30, "type": "items"}, "consecuenciasMentales": {"fields": {"descripcion": {"maxLength": 1000, "required": true, "type": "string"}, "gravedad": {"choices": ["leve", "moderada", "grave"], "type": "string"}}, "maxItems": 30, "type": "items"}, "consecuenciasSociales": {"fields": {"descripcion": {"maxLength": 1000, "required": true, "type": "string"}, "gravedad": {"choices": ["leve", "moderada", "grave"], "type": "string"}}, "maxItems": 30, "type": "items"}, "curso": {"maxLength": 20, "type": "string"}, "economia": {"maxLength": 200, "type": "string"}, "edad": {"integer": true, "maximum": 999, "minimum": 0, "type": "number"}, "equipoList": {"fields": {"cantidad": {"integer": true, "maximum": 9999, "minimum": 1, "type": "number"}, "nombre": {"maxLength": 100, "required": true, "type": "string"}}, "maxItems": 500, "type": "items"}, "estresFisico": {"integer": true, "maximum": 10, "minimum": 0, "type": "number"}, "estresFisicoMax": {"integer": true, "maximum": 10, "minimum": 1, "type": "number"}, "estresMental": {"integer": true, "maximum": 10, "minimum": 0, "type": "number"}, "estresMentalMax": {"integer": true, "maximum": 10, "minimum": 1, "type": "number"}, "estresSocial": {"integer": true, "maximum": 10, "minimum": 0, "type": "number"}, "estresSocialMax": {"integer": true, "maximum": 10, "minimum": 1, "type": "number"}, "galleryImages": {"fields": {"value": {"type": "media"}}, "maxItems": 50, "type": "items"}, "habilidades": {"fields": {"categoria": {"maxLength": 80, "type": "string"}, "nombre": {"maxLength": 60, "required": true, "type": "string"}, "valor": {"integer": true, "maximum": 5, "minimum": 0, "type": "number"}}, "maxItems": 200, "type": "items"}, "jugador": {"maxLength": 80, "type": "string"}, "linaje": {"maxLength": 200, "type": "string"}, "nombre": {"maxLength": 80, "required": true, "type": "string"}, "notasList": {"fields": {"contenido": {"maxLength": 50000, "required": true, "type": "string"}, "fecha": {"integer": true, "maximum": 8640000000000000, "minimum": 0, "type": "number"}, "titulo": {"maxLength": 200, "type": "string"}}, "maxItems": 5000, "type": "items"}, "pociones": {"fields": {"nombre": {"maxLength": 100, "required": true, "type": "string"}, "specialized": {"type": "boolean"}, "valor": {"integer": true, "maximum": 5, "minimum": 1, "type": "number"}}, "maxItems": 200, "type": "items"}, "puestoClase": {"maxLength": 80, "type": "string"}, "puntosDestino": {"integer": true, "maximum": 10, "minimum": 0, "type": "number"}, "pxs": {"integer": true, "maximum": 1000000, "minimum": 0, "type": "number"}, "varitaSintonia": {"maxLength": 200, "type": "string"}}, "familiar": {"descripcion": {"maxLength": 5000, "type": "string"}, "especie": {"maxLength": 60, "required": true, "type": "string"}, "galleryImages": {"fields": {"value": {"type": "media"}}, "maxItems": 50, "type": "items"}, "imageFit": {"choices": ["cover", "contain"], "type": "string"}, "imagen": {"type": "media"}, "nombre": {"maxLength": 80, "required": true, "type": "string"}, "notasList": {"fields": {"contenido": {"maxLength": 50000, "type": "string"}, "fecha": {"integer": true, "maximum": 8640000000000000, "minimum": 0, "type": "number"}, "titulo": {"maxLength": 200, "type": "string"}}, "maxItems": 5000, "requireOneOf": ["titulo", "contenido"], "type": "items"}}}')
ITEM_ID = re.compile(r"[A-Za-z0-9_-]{1,64}\Z")
STRESS = [("estresFisico", "estresFisicoMax"), ("estresMental", "estresMentalMax"), ("estresSocial", "estresSocialMax")]
CONSEQUENCES = ("consecuenciasFisicas", "consecuenciasMentales", "consecuenciasSociales")


def conform(value, spec):
    """Returns the value brought within spec, or None when nothing valid remains."""
    kind = spec["type"]
    if kind == "string":
        if not isinstance(value, str):
            return None
        value = value.replace("\x00", "")
        if "choices" in spec:
            return value if value in spec["choices"] else None
        value = value[:spec.get("maxLength", 64000)]
        return None if spec.get("required") and not value.strip() else value
    if kind == "number":
        if type(value) not in (int, float) or value != value or value in (float("inf"), float("-inf")):
            return None
        value = round(value) if spec.get("integer") else value
        return min(max(value, spec.get("minimum", -1e12)), spec.get("maximum", 1e12))
    if kind == "boolean":
        return value if type(value) is bool else None
    if kind == "media":
        return value if isinstance(value, str) or value is None else None
    if kind == "object":
        if not isinstance(value, dict):
            return None
        result = {}
        for key, entry in value.items():
            if key in spec["fields"]:
                kept = conform(entry, spec["fields"][key])
                if kept is not None:
                    result[key] = kept
        return result
    if kind == "items":
        if not isinstance(value, list):
            return None
        result, ids = [], set()
        for entry in value:
            if not (isinstance(entry, dict) and isinstance(entry.get("id"), str) and ITEM_ID.fullmatch(entry["id"])) or entry["id"] in ids:
                continue
            fields = conform({k: v for k, v in entry.items() if k != "id"}, {"type": "object", "fields": spec["fields"]})
            required = [k for k, s in spec["fields"].items() if s.get("required")]
            if any(k not in fields for k in required):
                continue
            names = spec.get("requireOneOf")
            if names and not any(str(fields.get(n, "")).strip() for n in names):
                continue
            ids.add(entry["id"])
            result.append({"id": entry["id"], **fields})
        return result[:spec["maxItems"]]
    return None


def upgrade(kind, data):
    data = dict(data or {})
    if kind == "character":
        if isinstance(data.get("casa"), str):
            data["casa"] = data["casa"].strip().upper()
        age = data.get("edad")
        if isinstance(age, str):
            digits = re.search(r"\d+", age)
            data["edad"] = int(digits.group()) if digits else None
        for key in CONSEQUENCES:
            if isinstance(data.get(key), list):
                data[key] = [{"id": e.get("id"), "descripcion": e.get("value"), "gravedad": "leve"} if isinstance(e, dict) and "value" in e else e
                             for e in data[key]]
    data = {k: v for k, v in data.items() if v is not None}
    result = conform(data, {"type": "object", "fields": REGISTRY[kind]}) or {}
    if not str(result.get("nombre", "")).strip():
        result["nombre"] = "—"
    for current, maximum in STRESS:
        if current in result:
            result[current] = min(result[current], result.get(maximum, 10))
    return result


def path_exists(kind, path):
    spec = {"type": "object", "fields": REGISTRY[kind]}
    for part in path.split("/"):
        if spec["type"] == "items":
            if not ITEM_ID.fullmatch(part):
                return False
            spec = {"type": "object", "fields": spec["fields"]}
        elif spec["type"] == "object" and part in spec["fields"]:
            spec = spec["fields"][part]
        else:
            return False
    return True


def upgrade_policy(kind, policy):
    result = {}
    for path, value in (policy or {}).items():
        parts = path.split("/")
        if len(parts) == 3 and parts[0] in CONSEQUENCES and parts[2] == "value":
            path = f"{parts[0]}/{parts[1]}/descripcion"
        if path == "*" or path == "bond" or path_exists(kind, path):
            result[path] = value
    return result


def forwards(apps, schema_editor):
    Sheet = apps.get_model("domain", "Sheet")
    Campaign = apps.get_model("domain", "Campaign")
    for sheet in Sheet.objects.filter(schema_version__lt=2):
        sheet.data = upgrade(sheet.kind, sheet.data)
        sheet.gm_overrides = upgrade_policy(sheet.kind, sheet.gm_overrides)
        sheet.player_restrictions = upgrade_policy(sheet.kind, sheet.player_restrictions)
        sheet.schema_version = 2
        sheet.revision += 1
        sheet.save(update_fields=["data", "gm_overrides", "player_restrictions", "schema_version", "revision"])
    for campaign in Campaign.objects.all():
        defaults = {kind: upgrade_policy(kind, rules) for kind, rules in (campaign.visibility_defaults or {}).items() if kind in REGISTRY}
        if defaults != campaign.visibility_defaults:
            campaign.visibility_defaults = defaults
            campaign.policy_revision += 1
            campaign.save(update_fields=["visibility_defaults", "policy_revision"])


class Migration(migrations.Migration):
    dependencies = [("domain", "0002_mediaasset_processedoperation")]
    operations = [
        migrations.AlterField(model_name="sheet", name="schema_version", field=models.PositiveIntegerField(default=2)),
        migrations.RunPython(forwards),
    ]
