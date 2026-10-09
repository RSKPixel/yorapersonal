from app.repositories import user as user_repo
from app.scripts.create_admin import create_initial_admin


def test_login_me_and_logout(client, make_user):
    created = make_user(username="ada", password="correct-horse-battery", is_admin=True)

    denied = client.get("/api/auth/me")
    assert denied.status_code == 401

    logged_in = client.post(
        "/api/auth/login",
        json={"username": "Ada", "password": "correct-horse-battery"},
    )
    assert logged_in.status_code == 200
    body = logged_in.json()
    assert body["username"] == "ada"
    assert body["is_admin"] is True
    assert body["id"] == created.id
    assert "password_hash" not in body
    assert "access_token" in client.cookies
    assert "csrf_token" in client.cookies

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["id"] == created.id

    missing_csrf = client.post("/api/auth/logout")
    assert missing_csrf.status_code == 403
    assert client.get("/api/auth/me").status_code == 200

    logged_out = client.post(
        "/api/auth/logout",
        headers={"X-CSRF-Token": client.cookies["csrf_token"]},
    )
    assert logged_out.status_code == 204
    assert client.get("/api/auth/me").status_code == 401


def test_login_rejects_unknown_and_inactive_users(client, make_user):
    unknown = client.post(
        "/api/auth/login",
        json={"username": "missing", "password": "correct-horse-battery"},
    )
    assert unknown.status_code == 401
    assert unknown.json()["detail"] == "Invalid username or password"

    make_user(username="inactive", password="correct-horse-battery", is_active=False)
    inactive = client.post(
        "/api/auth/login",
        json={"username": "inactive", "password": "correct-horse-battery"},
    )
    assert inactive.status_code == 401
    assert inactive.json()["detail"] == "Invalid username or password"


def test_login_validation_error_stays_422(client):
    response = client.post("/api/auth/login", json={"username": "ab", "password": ""})
    assert response.status_code == 422


def test_tampered_session_is_rejected(client, make_user):
    make_user()
    client.cookies.set("access_token", "not-a-valid-token")
    assert client.get("/api/auth/me").status_code == 401


def test_create_initial_admin_runs_once(monkeypatch, db_session):
    monkeypatch.setenv("INITIAL_ADMIN_USERNAME", "admin")
    monkeypatch.setenv("INITIAL_ADMIN_PASSWORD", "correct-horse-battery")
    monkeypatch.setenv("INITIAL_ADMIN_NAME", "Ada Admin")

    assert create_initial_admin() == 0
    assert create_initial_admin() == 0
    assert user_repo.count_users(db_session) == 1


def test_create_initial_admin_rejects_short_password(monkeypatch, db_session):
    monkeypatch.setenv("INITIAL_ADMIN_USERNAME", "admin")
    monkeypatch.setenv("INITIAL_ADMIN_PASSWORD", "short")
    assert create_initial_admin() == 1
    assert user_repo.count_users(db_session) == 0
