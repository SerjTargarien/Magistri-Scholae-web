import json
import uuid
import tempfile
from http.cookiejar import CookieJar
from urllib.error import HTTPError
from urllib.request import HTTPCookieProcessor, Request, build_opener
from django.test import LiveServerTestCase
from domain.models import Campaign, Membership, User
from .base import PASSWORD


class LiveHTTPTests(LiveServerTestCase):
    def test_real_http_cookie_csrf_login_create_patch_and_logout(self):
        user = User.objects.create_user("httpfixture", password=PASSWORD)
        campaign = Campaign.objects.create(name="HTTP fixture")
        Membership.objects.create(user=user, campaign=campaign, role="player")
        opener = build_opener(HTTPCookieProcessor(CookieJar()))

        def request(path, body=None, method=None, csrf=None):
            headers = {"Content-Type": "application/json"}
            if csrf:
                headers["X-CSRFToken"] = csrf
            query = Request(self.live_server_url + "/api/v1/" + path, data=json.dumps(body).encode() if body is not None else None,
                            headers=headers, method=method)
            return opener.open(query, timeout=10)

        token = json.load(request("auth/csrf"))["csrfToken"]
        result = json.load(request("auth/login", {"username": "httpfixture", "password": PASSWORD}, csrf=token))
        token = result["csrfToken"]
        response = request("auth/me")
        self.assertIn("no-store", response.headers["Cache-Control"])
        self.assertEqual(json.load(response)["id"], str(user.pk))
        created = json.load(request("familiars", {"campaignId": str(campaign.pk), "fields": {"nombre": "HTTP owl"}}, csrf=token))
        patched = json.load(request(f"familiars/{created['id']}", {"expectedRevision": created["revision"],
                            "changes": [{"path": "nombre", "value": "HTTP edited owl"}]}, method="PATCH", csrf=token))
        self.assertEqual(patched["fields"]["nombre"], "HTTP edited owl")
        from .test_remote import image_bytes
        with tempfile.TemporaryDirectory() as directory, self.settings(PRIVATE_MEDIA_ROOT=directory):
            upload_body = {"operationId": str(uuid.uuid4()), "expectedRevision": patched["revision"], "path": "imagen", "imageBase64": image_bytes()}
            attached = json.load(request(f"familiars/{created['id']}/assets", upload_body, csrf=token))
            replay = json.load(request(f"familiars/{created['id']}/assets", upload_body, csrf=token))
            self.assertEqual(attached["revision"], replay["revision"])
            with request(f"assets/{attached['fields']['imagen']}") as image:
                self.assertEqual(image.headers["Content-Type"], "image/png")
                self.assertIn("no-store", image.headers["Cache-Control"])
                self.assertTrue(image.read().startswith(b"\x89PNG"))
            note = json.load(request("personal-notes", {"title": "HTTP private note", "content": "Fictional content"}, csrf=token))
            promotion = {"sheetId": created["id"], "expectedRevision": attached["revision"], "noteRevision": note["revision"]}
            preview = json.load(request(f"personal-notes/{note['id']}/promote/preview", promotion, csrf=token))
            promotion.update(previewToken=preview["previewToken"], operationId=str(uuid.uuid4()))
            moved = json.load(request(f"personal-notes/{note['id']}/promote", promotion, csrf=token))
            self.assertEqual(moved["fields"]["notasList"][0]["contenido"], "Fictional content")
            with self.assertRaises(HTTPError) as removed:
                request(f"personal-notes/{note['id']}")
            self.assertEqual(removed.exception.code, 404)
        with self.assertRaises(HTTPError) as denied:
            request("auth/logout", {})
        self.assertEqual(denied.exception.code, 403)
        request("auth/logout", {}, csrf=token).close()
        with self.assertRaises(HTTPError) as expired:
            request("auth/me")
        self.assertEqual(expired.exception.code, 401)
