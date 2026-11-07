from django.contrib.auth import logout
from django.utils.cache import patch_vary_headers


class AccountEpochMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated and request.session.get("auth_epoch") != request.user.auth_epoch:
            logout(request)
        return self.get_response(request)


class PrivateResponsesMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith("/api/"):
            response["Cache-Control"] = "no-store, private"
            patch_vary_headers(response, ["Cookie"])
            response["X-Content-Type-Options"] = "nosniff"
        return response
