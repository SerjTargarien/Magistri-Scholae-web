"""Skill catalogue (R3.2): every campaign gets the default catalogue, and stored
skills move from schema version 2 to 3.

A skill whose name matches a catalogue skill (Spanish or English, or the old
names "Historia del mundo mágico" and "Oráculo") becomes a link to it with its
value. Any other skill stays the player's own, filed under the catalogue
category its old category maps to ("Físicas", "Mentales", "Sociales"), or
"Habilidades y conocimientos mágicos" otherwise (the old "Asignaturas troncales"
and "optativas"). Repeated skills keep their first entry.

Not reversible: restore the pre-migration backup instead.
"""
import re
from django.db import migrations, models
import domain.catalogue

ITEM_ID = re.compile(r"[A-Za-z0-9_-]{1,64}\Z")
OLD_NAMES = {"historia del mundo mágico": "historia-de-la-magia", "oráculo": "oraculos-y-adivinacion",
             "oracle & divination": "oraculos-y-adivinacion"}
OLD_CATEGORIES = {"físicas": "fisicas", "mentales": "mentales", "sociales": "sociales"}
FALLBACK_CATEGORY = "conocimientos-magicos"


def convert_skills(skills, catalogue):
    names = {}
    for skill in catalogue["habilidades"]:
        for name in skill["nombre"].values():
            if name:
                names.setdefault(name.strip().casefold(), skill["id"])
    for old, target in OLD_NAMES.items():
        if any(s["id"] == target for s in catalogue["habilidades"]):
            names.setdefault(old, target)
    categories = {c["id"] for c in catalogue["categorias"]}
    result, ids, links, own = [], set(), set(), set()
    for entry in skills if isinstance(skills, list) else []:
        if not (isinstance(entry, dict) and isinstance(entry.get("id"), str) and ITEM_ID.fullmatch(entry["id"])) or entry["id"] in ids:
            continue
        name = entry.get("nombre") if isinstance(entry.get("nombre"), str) else ""
        value = entry.get("valor")
        value = min(max(round(value), 0), 5) if type(value) in (int, float) and value == value else 0
        key = name.strip().casefold()
        if key in names:
            if names[key] in links:
                continue
            links.add(names[key])
            converted = {"id": entry["id"], "catalogo": names[key], "valor": value}
        elif key and key not in own:
            own.add(key)
            old_category = str(entry.get("categoria", "")).strip().casefold()
            category = OLD_CATEGORIES.get(old_category, FALLBACK_CATEGORY)
            if category not in categories:
                category = catalogue["categorias"][0]["id"]
            converted = {"id": entry["id"], "nombre": name.strip()[:60], "categoria": category, "valor": value}
        else:
            continue
        ids.add(entry["id"])
        result.append(converted)
    return result[:200]


def forwards(apps, schema_editor):
    Sheet = apps.get_model("domain", "Sheet")
    for sheet in Sheet.objects.filter(schema_version__lt=3).select_related("campaign"):
        if sheet.kind == "character" and "habilidades" in (sheet.data or {}):
            sheet.data = {**sheet.data, "habilidades": convert_skills(sheet.data["habilidades"], sheet.campaign.skill_catalogue)}
            sheet.revision += 1
        sheet.schema_version = 3
        sheet.save(update_fields=["data", "schema_version", "revision"])


class Migration(migrations.Migration):
    dependencies = [("domain", "0003_field_rules")]
    operations = [
        migrations.AddField(model_name="campaign", name="skill_catalogue",
                            field=models.JSONField(default=domain.catalogue.default_catalogue)),
        migrations.AddField(model_name="campaign", name="catalogue_revision", field=models.PositiveIntegerField(default=1)),
        migrations.AlterField(model_name="sheet", name="schema_version", field=models.PositiveIntegerField(default=3)),
        migrations.RunPython(forwards),
    ]
