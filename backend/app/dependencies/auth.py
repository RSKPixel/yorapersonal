import secrets

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories import user as user_repo


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    settings = get_settings()
    token = request.cookies.get(settings.cookie_name)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user = user_repo.get_by_id(db, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required")
    return current_user


def require_csrf(request: Request) -> None:
    if request.method.upper() in {"GET", "HEAD", "OPTIONS"}:
        return
    if request.method.upper() == "POST" and request.url.path.rstrip("/") == "/api/auth/login":
        return

    settings = get_settings()
    cookie_token = request.cookies.get(settings.csrf_cookie_name, "")
    header_token = request.headers.get("x-csrf-token", "")
    if (
        not cookie_token
        or not header_token
        or not secrets.compare_digest(cookie_token, header_token)
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed")
