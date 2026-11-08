"""One «Varita / Foco mágico» field (owner decision, 8 November 2026): the adult
wizard profile's `magicalFocus` merges into `varitaSintonia`; schema version 4.

Nothing is lost. An empty focus changes nothing; an empty wand takes the focus;
a focus the wand already contains is dropped; otherwise the wand becomes
"wand · focus", or, if that exceeds the wand's 200 characters, the focus moves
to a custom field "Foco mágico". Whatever receives the focus gets at least the
focus's restrictions (GM audience, sheet or inherited campaign rule, on the
focus or the whole adult profile, and player restrictions), so merging never
reveals it; it is never opened up. Rules on the removed path are dropped.

Not reversible: restore the pre-migration backup instead.
"""
import uuid
from django.db import migrations, models

FOCUS = "adultWizardProfile/magicalFocus"
WAND = "varitaSintonia"
WAND_LENGTH = 200
TIERS = {"gm": 0, "assigned": 1, "shared": 2}


def merge_values(data):
    """Returns (data, changed, moved): moved is True when focus text went into the wand."""
    data = dict(data or {})
    profile = data.get("adultWizardProfile")
    if not isinstance(profile, dict) or "magicalFocus" not in profile:
        return data, False, False
    profile = dict(profile)
    focus = profile.pop("magicalFocus")
    data["adultWizardProfile"] = profile
    focus = focus.strip() if isinstance(focus, str) else ""
    wand = data.get(WAND) if isinstance(data.get(WAND), str) else ""
    if not focus or focus.casefold() in wand.casefold():
        return data, True, False
    if not wand.strip():
        data[WAND] = focus
    elif len(f"{wand} · {focus}") <= WAND_LENGTH:
        data[WAND] = f"{wand} · {focus}"
    else:
        fields = list(data.get("camposPersonalizados") or [])
        if len(fields) >= 100:
            raise RuntimeError("no room for the magical focus in a custom field; resolve this sheet by hand")
        fields.append({"id": str(uuid.uuid4()), "nombre": "Foco mágico", "valor": focus})
        data["camposPersonalizados"] = fields
        return data, True, False  # a new custom field: see protect() below
    return data, True, True


def audience(sheet, campaign_rules, path):
    """The explicit audience for path (sheet override first, then inherited campaign rule), or None."""
    if path in (sheet.gm_overrides or {}):
        return sheet.gm_overrides[path]
    if sheet.gm_default == "inherit" and path in campaign_rules:
        return campaign_rules[path]
    return None


def default_audience(sheet, campaign_rules):
    return sheet.gm_default if sheet.gm_default != "inherit" else campaign_rules.get("*", "assigned")


def protect(sheet, campaign_rules, target):
    """Gives target (the wand, or the new custom field) at least the focus's restrictions."""
    focus_rule = audience(sheet, campaign_rules, FOCUS) or audience(sheet, campaign_rules, "adultWizardProfile")
    current = audience(sheet, campaign_rules, target) or default_audience(sheet, campaign_rules)
    changed = False
    if focus_rule is not None and TIERS.get(focus_rule, 0) < TIERS.get(current, 0):
        sheet.gm_overrides = {**(sheet.gm_overrides or {}), target: focus_rule}
        changed = True
    restrictions = sheet.player_restrictions or {}
    if (restrictions.get(FOCUS) or restrictions.get("adultWizardProfile")) and not restrictions.get(target):
        sheet.player_restrictions = {**restrictions, target: True}
        changed = True
    return changed


def drop_focus_rules(policy):
    policy = dict(policy or {})
    return policy, policy.pop(FOCUS, None) is not None


def forwards(apps, schema_editor):
    Sheet = apps.get_model("domain", "Sheet")
    Campaign = apps.get_model("domain", "Campaign")
    for sheet in Sheet.objects.filter(schema_version__lt=4).select_related("campaign"):
        changed = False
        if sheet.kind == "character":
            campaign_rules = (sheet.campaign.visibility_defaults or {}).get("character", {})
            before = sheet.data
            sheet.data, changed, moved = merge_values(sheet.data)
            if moved:
                changed |= protect(sheet, campaign_rules, WAND)
            elif changed and len((sheet.data or {}).get("camposPersonalizados") or []) > len((before or {}).get("camposPersonalizados") or []):
                changed |= protect(sheet, campaign_rules, "camposPersonalizados/" + sheet.data["camposPersonalizados"][-1]["id"])
        sheet.gm_overrides, dropped = drop_focus_rules(sheet.gm_overrides)
        changed |= dropped
        sheet.player_restrictions, dropped = drop_focus_rules(sheet.player_restrictions)
        changed |= dropped
        if changed:
            sheet.revision += 1
        sheet.schema_version = 4
        sheet.save(update_fields=["data", "gm_overrides", "player_restrictions", "schema_version", "revision"])
    for campaign in Campaign.objects.all():
        defaults = dict(campaign.visibility_defaults or {})
        rules, dropped = drop_focus_rules(defaults.get("character"))
        if dropped:
            defaults["character"] = rules
            campaign.visibility_defaults = defaults
            campaign.policy_revision += 1
            campaign.save(update_fields=["visibility_defaults", "policy_revision"])


class Migration(migrations.Migration):
    dependencies = [("domain", "0005_empatia_social")]
    operations = [
        migrations.AlterField(model_name="sheet", name="schema_version", field=models.PositiveIntegerField(default=4)),
        migrations.RunPython(forwards),
    ]
