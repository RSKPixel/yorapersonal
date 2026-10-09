import secrets
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from fastapi import Response

from app.core.config import get_settings

_hasher = PasswordHasher()
DUMMY_PASSWORD_HASH = _hasher.hash("not-a-real-password")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def create_access_token(user_id: int) -> str:
    settings = get_settings()
    expires = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "exp": expires, "type": "access"}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int | None:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.PyJWTError:
        return None
    if payload.get("type") != "access":
        return None
    subject = payload.get("sub")
    try:
        return int(subject)
    except (TypeError, ValueError):
        return None


def _write_cookie(response: Response, name: str, value: str, *, httponly: bool) -> None:
    settings = get_settings()
    response.set_cookie(
        key=name,
        value=value,
        httponly=httponly,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )


def issue_session(response: Response, user_id: int) -> None:
    settings = get_settings()
    _write_cookie(response, settings.cookie_name, create_access_token(user_id), httponly=True)
    _write_cookie(response, settings.csrf_cookie_name, secrets.token_urlsafe(32), httponly=False)


def ensure_csrf_cookie(response: Response, existing: str | None) -> None:
    settings = get_settings()
    token = existing or secrets.token_urlsafe(32)
    if existing:
        return
    _write_cookie(response, settings.csrf_cookie_name, token, httponly=False)


def clear_session(response: Response) -> None:
    settings = get_settings()
    for name, httponly in (
        (settings.cookie_name, True),
        (settings.csrf_cookie_name, False),
    ):
        response.delete_cookie(
            key=name,
            path="/",
            secure=settings.cookie_secure,
            httponly=httponly,
            samesite=settings.cookie_samesite,
        )
