import os
import tempfile

_db_file = tempfile.NamedTemporaryFile(prefix="yora-test-", suffix=".db", delete=False)
_db_file.close()

os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = f"sqlite:///{_db_file.name}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-must-be-at-least-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
os.environ["CORS_ORIGINS"] = "http://127.0.0.1:5177"
os.environ["COOKIE_SECURE"] = "false"
os.environ["COOKIE_SAMESITE"] = "lax"
os.environ["APP_NAME"] = "Yora Personal"
os.environ["INITIAL_ADMIN_USERNAME"] = ""
os.environ["INITIAL_ADMIN_PASSWORD"] = ""

import pytest
from fastapi.testclient import TestClient

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.main import app
from app.repositories import user as user_repo


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_user(
    db,
    *,
    username="ada",
    password="correct-horse-battery",
    is_admin=False,
    is_active=True,
    email=None,
    pan=None,
    date_of_birth=None,
    gender=None,
):
    user = user_repo.create_user(
        db,
        username=username,
        full_name="Ada Admin" if is_admin else "Ada User",
        password=password,
        email=email,
        pan=pan,
        date_of_birth=date_of_birth,
        gender=gender,
        is_admin=is_admin,
    )
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def make_user(db_session):
    def _make(**kwargs):
        return create_user(db_session, **kwargs)

    return _make
