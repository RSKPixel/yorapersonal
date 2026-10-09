from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_by_username(db: Session, username: str) -> User | None:
    return db.scalar(select(User).where(User.username == username.strip().lower()))


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.strip().lower()))


def get_by_pan(db: Session, pan: str) -> User | None:
    return db.scalar(select(User).where(User.pan == pan.strip().upper()))


def count_users(db: Session) -> int:
    return int(db.scalar(select(func.count()).select_from(User)) or 0)


def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc(), User.id.desc())))


def create_user(
    db: Session,
    *,
    username: str,
    full_name: str,
    password: str,
    email: str | None = None,
    date_of_birth: date | None = None,
    pan: str | None = None,
    gender: str | None = None,
    is_admin: bool = False,
) -> User:
    user = User(
        username=username.strip().lower(),
        full_name=full_name.strip(),
        email=email.strip().lower() if email else None,
        date_of_birth=date_of_birth,
        pan=pan.strip().upper() if pan else None,
        gender=gender,
        password_hash=hash_password(password),
        is_active=True,
        is_admin=is_admin,
    )
    db.add(user)
    db.flush()
    db.refresh(user)
    return user


def update_user(
    db: Session,
    user: User,
    *,
    username: str,
    full_name: str,
    email: str,
    date_of_birth: date,
    pan: str,
    gender: str,
    password: str | None = None,
) -> User:
    user.username = username.strip().lower()
    user.full_name = full_name.strip()
    user.email = email.strip().lower()
    user.date_of_birth = date_of_birth
    user.pan = pan.strip().upper()
    user.gender = gender
    if password:
        user.password_hash = hash_password(password)
    db.add(user)
    db.flush()
    db.refresh(user)
    return user
