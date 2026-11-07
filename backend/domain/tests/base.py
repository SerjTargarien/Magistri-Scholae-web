import json
from django.test import Client, TestCase
from domain.models import Campaign, Membership, Sheet, User
from domain.permissions import projection

PASSWORD = "Fictional-test-password-42!"


class APICase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_superuser("operator", password=PASSWORD)
        cls.gm = User.objects.create_user("gamemaster", password=PASSWORD)
        cls.alice = User.objects.create_user("alice", password=PASSWORD)
        cls.bob = User.objects.create_user("bob", password=PASSWORD)
        cls.outsider = User.objects.create_user("outsider", password=PASSWORD)
        cls.campaign = Campaign.objects.create(name="Fictional academy")
        cls.other = Campaign.objects.create(name="Other fictional academy")
        for user, role in [(cls.gm, "gm"), (cls.alice, "player"), (cls.bob, "player")]:
            Membership.objects.create(campaign=cls.campaign, user=user, role=role)
        Membership.objects.create(campaign=cls.other, user=cls.gm, role="player")
        Membership.objects.create(campaign=cls.other, user=cls.outsider, role="gm")
        cls.sheet = Sheet.objects.create(campaign=cls.campaign, creator=cls.alice, assigned_player=cls.alice,
            kind="character", data={"nombre": "Fictional Luna", "notas": "ordinary-gm-visible-journal",
                "characterType": "student", "adultWizardProfile": {"reputation": "gm-secret-reputation", "role": "Apprentice"},
                "habilidades": [{"id": "skill-a", "nombre": "Magic", "valor": 3, "categoria": "Demo"}],
                "notasList": [{"id": "note-a", "titulo": "Demo title", "contenido": "secret-item-content", "fecha": 10}]})
        cls.familiar = Sheet.objects.create(campaign=cls.campaign, creator=cls.alice, assigned_player=cls.alice,
            kind="familiar", data={"nombre": "Demo Owl", "especie": "Owl", "descripcion": "demo-familiar-secret"})

    def client_for(self, user, csrf=False):
        client = Client(enforce_csrf_checks=csrf)
        client.force_login(user)
        session = client.session
        session["auth_epoch"] = user.auth_epoch
        session.save()
        return client

    def send(self, client, path, data=None, method="post", status=200):
        response = getattr(client, method)("/api/v1/" + path, data=json.dumps(data or {}), content_type="application/json")
        self.assertEqual(response.status_code, status, response.content.decode())
        return response.json()

    def read(self, client, path, status=200):
        response = client.get("/api/v1/" + path)
        self.assertEqual(response.status_code, status, response.content.decode())
        return response.json()

    def current(self, actor=None, sheet=None):
        target = sheet or self.sheet
        target.refresh_from_db()
        target.campaign.refresh_from_db()
        return projection(actor or self.alice, target)

    def policy(self, client, changes, sheet=None, plural="characters"):
        target = sheet or self.sheet
        current = self.read(client, f"{plural}/{target.pk}")
        preview = self.send(client, f"{plural}/{target.pk}/visibility/preview", {"expectedRevision": current["revision"], **changes})
        return self.send(client, f"{plural}/{target.pk}/visibility", {"expectedRevision": current["revision"], "previewToken": preview["previewToken"]})
