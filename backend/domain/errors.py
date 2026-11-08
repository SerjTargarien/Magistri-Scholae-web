class APIError(Exception):
    def __init__(self, code, status=400, details=None):
        self.code = code
        self.status = status
        # Optional {"path", "rule", "limit"} naming the rule a submitted value broke.
        self.details = details or {}


def require(condition, code="invalid_request", status=400):
    if not condition:
        raise APIError(code, status)


def keys(data, allowed, required=()):
    require(isinstance(data, dict) and not (data.keys() - set(allowed)) and set(required) <= data.keys())


def text(value, maximum=200, empty=False):
    require(isinstance(value, str) and "\x00" not in value and len(value) <= maximum and (empty or bool(value.strip())))
    value.encode("utf-8")
    return value
