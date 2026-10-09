import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.config import get_settings
from app.core.redaction import redact
from app.db.session import SessionLocal
from app.repositories import user as user_repo
from app.schemas.auth import MIN_PASSWORD_LENGTH, USERNAME_PATTERN

_BACKEND_ROOT = Path(__file__).resolve().parents[2]


def create_initial_admin() -> int:
    load_dotenv(_BACKEND_ROOT / ".env")
    raw_username = os.environ.get("INITIAL_ADMIN_USERNAME", "").strip()
    password = os.environ.get("INITIAL_ADMIN_PASSWORD", "")
    full_name = os.environ.get("INITIAL_ADMIN_NAME", "Administrator").strip() or "Administrator"

    if not raw_username and not password:
        print("INITIAL_ADMIN_USERNAME is unset; skipping administrator creation.")
        return 0
    if not raw_username or not password:
        print("Set both INITIAL_ADMIN_USERNAME and INITIAL_ADMIN_PASSWORD.", file=sys.stderr)
        return 1

    username = raw_username.lower()
    if not USERNAME_PATTERN.fullmatch(username):
        print(
            "INITIAL_ADMIN_USERNAME must be 3–64 characters and use only letters, numbers, '.', '_' or '-'.",
            file=sys.stderr,
        )
        return 1
    if password.startswith("replace_") or len(password) < MIN_PASSWORD_LENGTH:
        print(
            f"INITIAL_ADMIN_PASSWORD must be at least {MIN_PASSWORD_LENGTH} characters and must not be a placeholder.",
            file=sys.stderr,
        )
        return 1

    db = SessionLocal()
    try:
        if user_repo.count_users(db) > 0:
            print("Users already exist; administrator creation skipped.")
            return 0
        user = user_repo.create_user(
            db,
            username=username,
            full_name=full_name,
            password=password,
            is_admin=True,
        )
        db.commit()
        print(f"Created administrator id={user.id} username={user.username}")
        return 0
    except IntegrityError:
        db.rollback()
        print("A user with that username already exists.", file=sys.stderr)
        return 1
    except SQLAlchemyError as exc:
        db.rollback()
        print(f"Database error: {redact(str(exc))}", file=sys.stderr)
        return 1
    finally:
        db.close()


def main() -> None:
    get_settings()
    raise SystemExit(create_initial_admin())


if __name__ == "__main__":
    main()
