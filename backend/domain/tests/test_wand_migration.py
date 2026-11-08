"""Migration 0006: the adult profile's magicalFocus merges into varitaSintonia."""
import importlib
from types import SimpleNamespace
from django.test import SimpleTestCase

wand = importlib.import_module("domain.migrations.0006_one_wand_field")


def adult(wand_text, focus, **extra):
    return {"nombre": "A", "varitaSintonia": wand_text, "adultWizardProfile": {"role": "R", "magicalFocus": focus}, **extra}


class MergeValuesTests(SimpleTestCase):
    def merged(self, wand_text, focus, **extra):
        data, changed, moved = wand.merge_values(adult(wand_text, focus, **extra))
        self.assertTrue(changed)
        self.assertEqual(data["adultWizardProfile"], {"role": "R"})
        return data, moved

    def test_empty_or_contained_focus_keeps_the_wand(self):
        for focus in ("", "  ", None, "Bastón de nogal", "bastón DE nogal con remate de hueso"):
            data, moved = self.merged("Bastón de nogal con remate de hueso", focus)
            self.assertEqual(data["varitaSintonia"], "Bastón de nogal con remate de hueso")
            self.assertFalse(moved)

    def test_empty_wand_takes_the_focus(self):
        data, moved = self.merged("", " Báculo de saúco ")
        self.assertEqual(data["varitaSintonia"], "Báculo de saúco")
        self.assertTrue(moved)

    def test_different_values_are_both_kept(self):
        data, moved = self.merged("Abedul", "Runas y archivos")
        self.assertEqual(data["varitaSintonia"], "Abedul · Runas y archivos")
        self.assertTrue(moved)

    def test_too_long_goes_to_a_custom_field(self):
        data, moved = self.merged("w" * 195, "Runas", camposPersonalizados=[{"id": "c1", "nombre": "X", "valor": "Y"}])
        self.assertEqual(data["varitaSintonia"], "w" * 195)
        self.assertEqual(data["camposPersonalizados"][-1]["nombre"], "Foco mágico")
        self.assertEqual(data["camposPersonalizados"][-1]["valor"], "Runas")
        self.assertFalse(moved)

    def test_students_and_migrated_sheets_are_untouched(self):
        self.assertEqual(wand.merge_values({"nombre": "S", "varitaSintonia": "Abedul"})[1:], (False, False))
        self.assertEqual(wand.merge_values({"adultWizardProfile": {"role": "R"}})[1:], (False, False))


class ProtectTests(SimpleTestCase):
    def sheet(self, overrides=None, restrictions=None, default="inherit"):
        return SimpleNamespace(gm_overrides=dict(overrides or {}), player_restrictions=dict(restrictions or {}), gm_default=default)

    def test_a_hidden_focus_hides_the_wand(self):
        sheet = self.sheet({wand.FOCUS: "gm"})
        self.assertTrue(wand.protect(sheet, {}, wand.WAND))
        self.assertEqual(sheet.gm_overrides[wand.WAND], "gm")

    def test_a_hidden_adult_profile_from_the_campaign_hides_the_wand(self):
        sheet = self.sheet()
        self.assertTrue(wand.protect(sheet, {"adultWizardProfile": "gm", "*": "shared"}, wand.WAND))
        self.assertEqual(sheet.gm_overrides[wand.WAND], "gm")

    def test_never_opens_the_wand(self):
        sheet = self.sheet({wand.FOCUS: "shared", wand.WAND: "gm"})
        self.assertFalse(wand.protect(sheet, {}, wand.WAND))
        self.assertEqual(sheet.gm_overrides[wand.WAND], "gm")
        sheet = self.sheet({wand.FOCUS: "shared"})  # default audience "assigned" is stricter than "shared"
        self.assertFalse(wand.protect(sheet, {}, wand.WAND))
        self.assertNotIn(wand.WAND, sheet.gm_overrides)

    def test_player_restriction_carries_over(self):
        sheet = self.sheet(restrictions={"adultWizardProfile": True})
        self.assertTrue(wand.protect(sheet, {}, wand.WAND))
        self.assertTrue(sheet.player_restrictions[wand.WAND])

    def test_rules_on_the_removed_path_are_dropped(self):
        self.assertEqual(wand.drop_focus_rules({wand.FOCUS: "gm", "nombre": "gm"}), ({"nombre": "gm"}, True))
        self.assertEqual(wand.drop_focus_rules(None), ({}, False))
