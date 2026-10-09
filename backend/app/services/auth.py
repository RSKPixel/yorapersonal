import logging

from sqlalchemy.orm import Session

from app.core.security import DUMMY_PASSWORD_HASH, verify_password
from app.models.user import User
from app.repositories import user as user_repo

logger = logging.getLogger(__name__)


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = user_repo.get_by_username(db, username)
    if user is None:
        verify_password(password, DUMMY_PASSWORD_HASH)
        logger.info("Authentication failed")
        return None
    password_ok = verify_password(password, user.password_hash)
    if not user.is_active or not password_ok:
        logger.info("Authentication failed")
        return None
    return user
