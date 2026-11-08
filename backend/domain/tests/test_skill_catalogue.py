"""Campaign skill catalogue (R3.2, docs/field-rules.md) and the version 2 to 3 skill conversion."""
import importlib
from copy import deepcopy
from django.test import Client, SimpleTestCase
from domain.catalogue import DEFAULT_CATALOGUE, default_catalogue, validate_catalogue
from domain.errors import APIError
from domain.models import Campaign
from .base import APICase

conversion = importlib.import_module("domain.migrations.0004_skill_catalogue")
empatia = importlib.import_module("domain.migrations.0005_empatia_social")


class DefaultCatalogueTests(SimpleTestCase):
    def test_owner_categories_and_skills(self):
        validate_catalogue(DEFAULT_CATALOGUE)
        categories = [c["id"] for c in DEFAULT_CATALOGUE["categorias"]]
        self.assertEqual(categories, ["fisicas", "mentales", "sociales", "conocimientos-magicos", "magia-elemental", "magia-esoterica"])
        self.assertEqual([c["id"] for c in DEFAULT_CATALOGUE["categorias"] if c["esoterica"]], ["magia-esoterica"])
        skills = DEFAULT_CATALOGUE["habilidades"]
        self.assertEqual(len(skills), 48)
        counts = {c: sum(1 for s in skills if s["categoria"] == c) for c in categories}
        self.assertEqual(list(counts.values()), [7, 3, 5, 12, 3, 18])
        by_id = {s["id"]: s for s in skills}
        self.assertEqual(by_id["magia-intuitiva"]["edadMaxima"], 14)
        self.assertEqual(by_id["espiritismo"]["categoria"], "magia-esoterica")  # moved from Mentales
        self.assertEqual([s["id"] for s in skills if s["categoria"] == "sociales"][-1], "empatia")  # moved from Mentales
        self.assertTrue(all(s["nombre"]["es"] and s["nombre"]["en"] for s in skills))

    def test_catalogue_validation(self):
        broken = default_catalogue()
        broken["habilidades"][0]["categoria"] = "missing"
        with self.assertRaises(APIError):
            validate_catalogue(broken)
        duplicate = default_catalogue()
        duplicate["categorias"].append(dict(duplicate["categorias"][0]))
        with self.assertRaises(APIError):
            validate_catalogue(duplicate)


class CatalogueEndpointTests(APICase):
    def test_members_read_it_and_others_cannot(self):
        result = self.read(self.client_for(self.alice), f"campaigns/{self.campaign.pk}/skill-catalogue")
        self.assertEqual((result["catalogue"], result["revision"]), (DEFAULT_CATALOGUE, 1))
        self.read(self.client_for(self.outsider), f"campaigns/{self.campaign.pk}/skill-catalogue", status=404)
        self.read(Client(), f"campaigns/{self.campaign.pk}/skill-catalogue", status=401)

    def test_new_campaigns_start_with_the_default(self):
        self.assertEqual(Campaign.objects.create(name="Fresh").skill_catalogue, DEFAULT_CATALOGUE)


class SkillEntryTests(APICase):
    def setUp(self):
        self.alice_client = self.client_for(self.alice)
        self.gm_client = self.client_for(self.gm)

    def patch(self, path, value, status=200, client=None):
        client = client or self.alice_client
        current = self.read(client, f"characters/{self.sheet.pk}")
        return self.send(client, f"characters/{self.sheet.pk}", {"expectedRevision": current["revision"],
                         "changes": [{"path": path, "value": value}]}, method="patch", status=status)

    def rejected(self, value):
        return self.patch("habilidades/new-skill", value, status=400)["error"]

    def test_linked_and_own_skills(self):
        self.patch("habilidades/linked", {"catalogo": "cabala", "valor": 2, "conocimiento": "medio"})
        own = {"nombre": "Cetrería", "categoria": "fisicas", "valor": 1}
        result = self.patch("habilidades/own", own, client=self.gm_client)["fields"]["habilidades"]
        self.assertIn({"id": "own", **own}, result)
        self.patch("habilidades/own-esoteric", {"nombre": "Runas antiguas", "categoria": "magia-esoterica", "valor": 0, "conocimiento": "basico"},
                   client=self.gm_client)

    def test_only_the_gm_creates_renames_moves_or_removes_own_skills(self):
        """Owner decision, 8 November 2026: players pick catalogue skills and change values."""
        own = {"nombre": "Cetrería", "categoria": "fisicas", "valor": 1}
        self.assertEqual(self.patch("habilidades/own", own, status=403)["error"]["code"], "gm_only_skill")
        self.patch("habilidades/own", own, client=self.gm_client)
        for path, value in [("habilidades/own/nombre", "Halconería"), ("habilidades/own/categoria", "mentales"),
                            ("habilidades/own", None), ("habilidades/own", {"nombre": "Otra", "categoria": "fisicas", "valor": 1})]:
            with self.subTest(path=path, value=value):
                self.assertEqual(self.patch(path, value, status=403)["error"]["code"], "gm_only_skill")
        self.patch("habilidades/own/valor", 3)  # values stay the player's
        self.patch("habilidades/picked", {"catalogo": "cabala", "valor": 0})  # the + list
        self.patch("habilidades/picked", None)  # and removing it again
        capabilities = self.read(self.alice_client, f"characters/{self.sheet.pk}")["capabilities"]
        self.assertNotIn("habilidades/own", capabilities["removablePaths"])
        self.assertIn("habilidades/skill-a", capabilities["removablePaths"])
        self.assertNotIn("habilidades/own/nombre", capabilities["writablePaths"])
        self.assertIn("habilidades/own/valor", capabilities["writablePaths"])
        self.assertIn("habilidades", capabilities["collectionPaths"])
        self.assertIn("habilidades/own", self.read(self.gm_client, f"characters/{self.sheet.pk}")["capabilities"]["removablePaths"])
        self.patch("habilidades/own", None, client=self.gm_client)

    def test_players_create_characters_without_own_skills(self):
        body = {"campaignId": str(self.campaign.pk), "fields": {"nombre": "Nueva", "habilidades": [
            {"id": "a", "catalogo": "atletismo", "valor": 2}, {"id": "b", "nombre": "Cetrería", "categoria": "fisicas", "valor": 1}]}}
        self.assertEqual(self.send(self.alice_client, "characters", body, status=403)["error"]["code"], "gm_only_skill")
        self.send(self.gm_client, "characters", body)
        body["fields"]["habilidades"].pop()
        self.send(self.alice_client, "characters", body)

    def test_campaign_list_tells_the_viewer_their_role(self):
        roles = {c["id"]: c["role"] for c in self.read(self.alice_client, "campaigns")["items"]}
        self.assertEqual(roles[str(self.campaign.pk)], "player")
        roles = {c["id"]: c["role"] for c in self.read(self.gm_client, "campaigns")["items"]}
        self.assertEqual(roles[str(self.campaign.pk)], "gm")

    def test_entry_is_either_linked_or_own(self):
        for value in [{"valor": 1}, {"catalogo": "cabala", "nombre": "Cábala"}, {"nombre": "Sin categoría"}]:
            with self.subTest(value=value):
                self.assertEqual(self.rejected(value)["rule"], "linkedOrOwn")

    def test_catalogue_rules(self):
        cases = [
            ({"catalogo": "missing"}, "unknown_skill"),
            ({"nombre": "Algo", "categoria": "missing"}, "unknown_category"),
            ({"nombre": "herbología", "categoria": "mentales"}, "duplicate_skill"),  # a catalogue name, any case
            ({"nombre": "Wand Lore", "categoria": "mentales"}, "duplicate_skill"),  # its English name too
            ({"catalogo": "herbologia"}, "duplicate_skill"),  # already on the sheet as skill-a
            ({"catalogo": "astronomia", "conocimiento": "avanzado"}, "knowledge_not_allowed"),
            ({"nombre": "Algo", "categoria": "fisicas", "conocimiento": "basico"}, "knowledge_not_allowed"),
            ({"catalogo": "cabala", "conocimiento": "experto"}, "invalid_field_value"),
        ]
        for value, code in cases:
            with self.subTest(value=value):
                self.assertEqual(self.rejected(value)["code"], code)

    def test_a_gm_catalogue_change_never_blocks_untouched_skills(self):
        self.patch("habilidades/linked", {"catalogo": "cabala", "valor": 2, "conocimiento": "medio"})
        catalogue = deepcopy(self.campaign.skill_catalogue)
        for category in catalogue["categorias"]:
            category["esoterica"] = False
        Campaign.objects.filter(pk=self.campaign.pk).update(skill_catalogue=catalogue)
        self.patch("nombre", "Still saves")
        self.patch("habilidades/skill-a/valor", 4)
        self.assertEqual(self.patch("habilidades/linked/valor", 3, status=400)["error"]["code"], "knowledge_not_allowed")

    def test_creation_checks_every_skill(self):
        body = {"campaignId": str(self.campaign.pk), "fields": {"nombre": "Nueva", "habilidades": [
            {"id": "a", "catalogo": "atletismo", "valor": 0}, {"id": "b", "catalogo": "atletismo", "valor": 1}]}}
        self.assertEqual(self.send(self.alice_client, "characters", body, status=400)["error"]["code"], "duplicate_skill")


class SkillConversionTests(SimpleTestCase):
    def test_version_two_skills_become_links_or_own_skills(self):
        old = [
            {"id": "s1", "nombre": "Atletismo", "valor": 2, "categoria": "Físicas"},
            {"id": "s2", "nombre": "Historia del mundo mágico", "valor": 3, "categoria": "Asignaturas Troncales"},
            {"id": "s3", "nombre": "Oráculo", "valor": 1, "categoria": "Asignaturas Optativas"},
            {"id": "s4", "nombre": "Potions", "valor": 9, "categoria": "Asignaturas Troncales"},
            {"id": "s5", "nombre": "Cetrería", "valor": 1, "categoria": "Físicas"},
            {"id": "s6", "nombre": "Alquimia", "valor": 2, "categoria": "Asignaturas Optativas"},
            {"id": "s7", "nombre": "atletismo", "valor": 5, "categoria": "Físicas"},
            {"id": "s8", "nombre": "  ", "valor": 1, "categoria": "Físicas"},
            {"nombre": "No id", "valor": 1},
        ]
        self.assertEqual(conversion.convert_skills(old, DEFAULT_CATALOGUE), [
            {"id": "s1", "catalogo": "atletismo", "valor": 2},
            {"id": "s2", "catalogo": "historia-de-la-magia", "valor": 3},
            {"id": "s3", "catalogo": "oraculos-y-adivinacion", "valor": 1},
            {"id": "s4", "catalogo": "pociones", "valor": 5},
            {"id": "s5", "nombre": "Cetrería", "categoria": "fisicas", "valor": 1},
            {"id": "s6", "nombre": "Alquimia", "categoria": "conocimientos-magicos", "valor": 2},
        ])


class EmpatiaMigrationTests(SimpleTestCase):
    def old_catalogue(self):
        catalogue = default_catalogue()
        skills = catalogue["habilidades"]
        entry = next(s for s in skills if s["id"] == "empatia")
        skills.remove(entry)
        entry["categoria"] = "mentales"
        skills.insert(next(i for i, s in enumerate(skills) if s["id"] == "voluntad") + 1, entry)
        return catalogue

    def test_moves_to_the_end_of_social_skills_and_back(self):
        catalogue = self.old_catalogue()
        self.assertTrue(empatia.move(catalogue, "mentales", "sociales"))
        self.assertEqual(catalogue, DEFAULT_CATALOGUE)
        self.assertFalse(empatia.move(catalogue, "mentales", "sociales"))  # already moved
        self.assertTrue(empatia.move(catalogue, "sociales", "mentales"))
        self.assertEqual(catalogue, self.old_catalogue())

    def test_a_gm_choice_is_left_alone(self):
        catalogue = self.old_catalogue()
        next(s for s in catalogue["habilidades"] if s["id"] == "empatia")["categoria"] = "conocimientos-magicos"
        before = deepcopy(catalogue)
        self.assertFalse(empatia.move(catalogue, "mentales", "sociales"))
        self.assertEqual(catalogue, before)
        self.assertFalse(empatia.move({"habilidades": None}, "mentales", "sociales"))
