"""Empatía moves from Mentales to Sociales (owner decision, 8 November 2026).

Each campaign's catalogue moves the skill to the end of Sociales, but only while
it is still in Mentales, so a later GM choice is never overwritten. Sheets store
a link to the skill, not its category, so no sheet changes. Reversible.
"""
from django.db import migrations


def move(catalogue, source, target):
    skills = catalogue.get("habilidades") if isinstance(catalogue, dict) else None
    if not isinstance(skills, list):
        return False
    entry = next((s for s in skills if isinstance(s, dict) and s.get("id") == "empatia"), None)
    if entry is None or entry.get("categoria") != source:
        return False
    skills.remove(entry)
    entry["categoria"] = target
    last = max((i for i, s in enumerate(skills) if isinstance(s, dict) and s.get("categoria") == target), default=len(skills) - 1)
    skills.insert(last + 1, entry)
    return True


def forwards(apps, schema_editor, source="mentales", target="sociales"):
    Campaign = apps.get_model("domain", "Campaign")
    for campaign in Campaign.objects.all():
        if move(campaign.skill_catalogue, source, target):
            campaign.catalogue_revision += 1
            campaign.save(update_fields=["skill_catalogue", "catalogue_revision"])


def backwards(apps, schema_editor):
    forwards(apps, schema_editor, source="sociales", target="mentales")


class Migration(migrations.Migration):
    dependencies = [("domain", "0004_skill_catalogue")]
    operations = [migrations.RunPython(forwards, backwards)]
