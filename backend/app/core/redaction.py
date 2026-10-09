import re

_DATABASE_URL = re.compile(r"://[^\s/@:]+:[^\s/@]+@")


def redact(value: str) -> str:
    """Remove userinfo embedded in database URLs."""
    return _DATABASE_URL.sub("://***:***@", value)
