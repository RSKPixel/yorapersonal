import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import clear_session, ensure_csrf_cookie, issue_session
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, UpdateUserRequest, UserResponse
from app.services.auth import authenticate_user
from app.services.users import update_user_record

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> User:
    user = authenticate_user(db, payload.username, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    user.last_login_at = datetime.now(UTC).replace(tzinfo=None)
    db.flush()
    issue_session(response, user.id)
    logger.info("User %s signed in", user.id)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    clear_session(response)


@router.get("/me", response_model=UserResponse)
def me(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
) -> User:
    settings = get_settings()
    ensure_csrf_cookie(response, request.cookies.get(settings.csrf_cookie_name))
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    payload: UpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    user = update_user_record(db, current_user.id, payload)
    logger.info("User %s updated profile", user.id)
    return user
