import ipaddress
from django.conf import settings
from django.contrib.auth import logout
from django.utils.cache import patch_vary_headers

FORWARDED_HEADERS = ("HTTP_X_FORWARDED_PROTO", "HTTP_X_FORWARDED_FOR", "HTTP_X_FORWARDED_HOST",
                     "HTTP_X_FORWARDED_PORT", "HTTP_FORWARDED", "HTTP_X_REAL_IP")


def _address(value):
    try:
        return ipaddress.ip_address(value.strip())
    except ValueError:
        return None


def is_trusted_proxy(value):
    address = _address(value or "")
    return address is not None and any(address in network for network in settings.TRUSTED_PROXIES)


class TrustedProxyMiddleware:
    """Honour X-Forwarded-Proto/For only from configured proxies (Caddy).

    For a trusted peer, the scheme comes from X-Forwarded-Proto and the client
    address is the rightmost X-Forwarded-For entry that is not itself a trusted
    proxy; rate limits and logs then see the real visitor. Any other request has
    all forwarded headers removed, so a client cannot forge its address or
    claim HTTPS.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        meta = request.META
        if is_trusted_proxy(meta.get("REMOTE_ADDR")):
            proto = meta.get("HTTP_X_FORWARDED_PROTO", "").split(",")[-1].strip().lower()
            if proto in ("http", "https"):
                meta["wsgi.url_scheme"] = proto
            hops = [hop.strip() for hop in meta.get("HTTP_X_FORWARDED_FOR", "").split(",") if hop.strip()]
            for hop in reversed(hops):
                if _address(hop) is None:
                    break  # A malformed entry ends the trusted chain.
                if not is_trusted_proxy(hop):
                    meta["REMOTE_ADDR"] = str(_address(hop))
                    break
        else:
            for header in FORWARDED_HEADERS:
                meta.pop(header, None)
        return self.get_response(request)


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
