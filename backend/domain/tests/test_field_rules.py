"""Field rules (R3.2, docs/field-rules.md) and the version 1 to 2 conversion."""
import importlib
from django.test import SimpleTestCase
from domain.errors import APIError
from domain.fields import MAX_SHEET_BYTES, REGISTRY, validate_sheet
from domain.models import Sheet
from .base import APICase

conversion = importlib.import_module("domain.migrations.0003_field_rules")


class FieldRuleTests(APICase):
    def patch(self, client, path, value, status=200, sheet=None, plural="characters"):
        target = sheet or self.sheet
        current = self.read(client, f"{plural}/{target.pk}")
        return self.send(client, f"{plural}/{target.pk}", {"expectedRevision": current["revision"],
                         "changes": [{"path": path, "value": value}]}, method="patch", status=status)

    def setUp(self):
        self.alice_client = self.client_for(self.alice)

    def test_rejected_values_name_the_field_and_the_rule(self):
        cases = [
            ("nombre", "x" * 81, "field_too_long", "maxLength", 80),
            ("nombre", "   ", "field_required", "required", None),
            ("puntosDestino", 11, "field_out_of_range", "range", [0, 10]),
            ("puntosDestino", 2.5, "invalid_field_value", "integer", None),
            ("pxs", 1000001, "field_out_of_range", "range", [0, 1000000]),
            ("edad", "11 años", "invalid_field_value", "integer", None),
            ("casa", "HOGWARTS", "invalid_field_value", "choice", None),
            ("estresFisicoMax", 0, "field_out_of_range", "range", [1, 10]),
        ]
        for path, value, code, rule, limit in cases:
            with self.subTest(path=path, value=value):
                error = self.patch(self.alice_client, path, value, status=400)["error"]
                self.assertEqual((error["code"], error["path"], error["rule"]), (code, path, rule))
                if limit is not None:
                    self.assertEqual(error["limit"], limit)

    def test_accepted_values_at_the_limits(self):
        for path, value in [("nombre", "x" * 80), ("puntosDestino", 10), ("pxs", 1000000), ("edad", 999),
                            ("casa", "ALEIXIS"), ("casa", ""), ("estresFisicoMax", 10)]:
            with self.subTest(path=path):
                self.assertEqual(self.patch(self.alice_client, path, value)["fields"][path], value)

    def test_list_entries_follow_their_rules(self):
        entry = "skill-new"
        error = self.patch(self.alice_client, f"conjuros/{entry}", {"nombre": "Lumen", "valor": 0}, status=400)["error"]
        self.assertEqual((error["code"], error["path"], error["rule"]), ("field_out_of_range", f"conjuros/{entry}/valor", "range"))
        error = self.patch(self.alice_client, f"aspectosPersonales/{entry}", {"value": ""}, status=400)["error"]
        self.assertEqual((error["code"], error["path"]), ("field_required", f"aspectosPersonales/{entry}/value"))
        consequence = {"descripcion": "Tobillo torcido", "gravedad": "moderada"}
        result = self.patch(self.alice_client, f"consecuenciasFisicas/{entry}", consequence)
        self.assertEqual(result["fields"]["consecuenciasFisicas"], [{"id": entry, **consequence}])
        error = self.patch(self.alice_client, f"consecuenciasFisicas/{entry}/gravedad", "letal", status=400)["error"]
        self.assertEqual(error["rule"], "choice")

    def test_list_size_limit(self):
        self.sheet.data["clubesList"] = [{"id": f"club-{i}", "nombre": "Club"} for i in range(50)]
        self.sheet.save()
        error = self.patch(self.alice_client, "clubesList/club-extra", {"nombre": "One too many"}, status=400)["error"]
        self.assertEqual((error["code"], error["path"], error["limit"]), ("too_many_items", "clubesList", 50))

    def test_current_stress_cannot_exceed_its_maximum(self):
        self.patch(self.alice_client, "estresMentalMax", 4)
        error = self.patch(self.alice_client, "estresMental", 5, status=400)["error"]
        self.assertEqual((error["path"], error["rule"]), ("estresMental", "notAboveMaximum"))
        self.patch(self.alice_client, "estresMental", 4)

    def test_removed_fields_are_rejected(self):
        for path in ["lema", "escudoText", "notas", "clubes", "equipo", "estresMentalConsecuencia"]:
            with self.subTest(path=path):
                self.assertEqual(self.patch(self.alice_client, path, "old", status=400)["error"]["code"], "unknown_field")

    def test_familiar_journal_needs_a_title_or_a_text(self):
        path = "notasList/fnote-new"
        self.patch(self.alice_client, path, {"titulo": "Solo título", "contenido": "", "fecha": 1}, sheet=self.familiar, plural="familiars")
        error = self.patch(self.alice_client, f"{path}/titulo", "", status=400, sheet=self.familiar, plural="familiars")["error"]
        self.assertEqual((error["code"], error["rule"]), ("field_required", "requireOneOf"))
        error = self.patch(self.alice_client, "especie", "", status=400, sheet=self.familiar, plural="familiars")["error"]
        self.assertEqual(error["code"], "field_required")

    def test_invalid_stored_sheet_blocks_player_saves_without_naming_paths(self):
        Sheet.objects.filter(pk=self.sheet.pk).update(data={**self.sheet.data, "lema": "old field"})
        error = self.patch(self.alice_client, "nombre", "Renamed", status=409)["error"]
        self.assertEqual(error, {"code": "stored_sheet_invalid"})


class SheetSizeTests(SimpleTestCase):
    def test_whole_sheet_text_limit(self):
        entry = {"titulo": "", "contenido": "x" * 50000, "fecha": 1}
        count = MAX_SHEET_BYTES // 50000 + 1
        data = {"nombre": "Big", "notasList": [{"id": f"n{i}", **entry} for i in range(count)]}
        with self.assertRaises(APIError) as caught:
            validate_sheet("character", data)
        self.assertEqual((caught.exception.code, caught.exception.details["rule"]), ("sheet_too_large", "maxSheetBytes"))


class ConversionTests(SimpleTestCase):
    def test_version_one_character_becomes_valid(self):
        old = {
            "nombre": "Luna", "edad": "11 años", "lema": "Creer es ver", "escudoText": "IRATI", "notas": "old journal",
            "clubes": "Coro", "equipo": "3x Frascos", "estresMentalConsecuencia": "Pesadillas", "casa": "Irati",
            "puntosDestino": 3.0, "pxs": -4, "estresFisico": 7, "estresFisicoMax": 3, "concepto": "x" * 500,
            "consecuenciasFisicas": [{"id": "c1", "value": "Tobillo torcido"}, {"id": "c2", "value": "  "}],
            "aspectosPersonales": [{"id": "a1", "value": "Curiosa"}, {"id": "a1", "value": "Duplicate id"}, {"value": "No id"}],
            "conjuros": [{"id": "s1", "nombre": "Lumen", "valor": 0, "specialized": True}],
        }
        new = conversion.upgrade("character", old)
        validate_sheet("character", new)
        self.assertEqual(new["edad"], 11)
        for removed in ["lema", "escudoText", "notas", "clubes", "equipo", "estresMentalConsecuencia"]:
            self.assertNotIn(removed, new)
        self.assertEqual(new["casa"], "IRATI")  # written "Irati" in an old record
        self.assertEqual((new["puntosDestino"], new["pxs"], new["estresFisico"]), (3, 0, 3))
        self.assertEqual(len(new["concepto"]), 200)
        self.assertEqual(new["consecuenciasFisicas"], [{"id": "c1", "descripcion": "Tobillo torcido", "gravedad": "leve"}])
        self.assertEqual(new["aspectosPersonales"], [{"id": "a1", "value": "Curiosa"}])
        self.assertEqual(new["conjuros"][0]["valor"], 1)

    def test_unreadable_age_and_empty_name(self):
        new = conversion.upgrade("character", {"nombre": " ", "edad": "joven"})
        validate_sheet("character", new)
        self.assertNotIn("edad", new)
        self.assertEqual(new["nombre"], "—")

    def test_familiar_and_privacy_settings(self):
        new = conversion.upgrade("familiar", {"nombre": "Ámbar", "especie": "Mochuelo", "descripcion": "d",
                                              "notasList": [{"id": "n1", "titulo": "", "contenido": "", "fecha": 1}]})
        validate_sheet("familiar", new)
        self.assertEqual(new["notasList"], [])
        policy = conversion.upgrade_policy("character", {"*": "assigned", "lema": "gm", "notas": "shared",
                                                         "consecuenciasFisicas/c1/value": "gm", "linaje": "gm", "bond": "gm"})
        self.assertEqual(policy, {"*": "assigned", "consecuenciasFisicas/c1/descripcion": "gm", "linaje": "gm", "bond": "gm"})
