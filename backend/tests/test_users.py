from datetime import date

from tests.conftest import create_user


def _login(client, username="admin", password="correct-horse-battery"):
    response = client.post("/api/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200
    return client.cookies["csrf_token"]


def _payload(**overrides):
    body = {
        "user_id": "jdoe",
        "user_name": "Jane Doe",
        "user_dob": "1990-05-15",
        "user_pan": "ABCDE1234F",
        "user_gender": "female",
        "user_password": "correct-horse-battery",
        "user_email": "jane@example.com",
    }
    body.update(overrides)
    return body


def test_admin_can_create_and_list_users(client, make_user):
    make_user(username="admin", password="correct-horse-battery", is_admin=True)
    csrf = _login(client)

    created = client.post(
        "/api/users",
        headers={"X-CSRF-Token": csrf},
        json=_payload(),
    )
    assert created.status_code == 201
    body = created.json()
    assert body["username"] == "jdoe"
    assert body["full_name"] == "Jane Doe"
    assert body["email"] == "jane@example.com"
    assert body["date_of_birth"] == "1990-05-15"
    assert body["pan"] == "ABCDE1234F"
    assert body["gender"] == "female"
    assert body["is_admin"] is False
    assert "password_hash" not in body

    listed = client.get("/api/users")
    assert listed.status_code == 200
    usernames = {item["username"] for item in listed.json()}
    assert {"admin", "jdoe"} <= usernames


def test_non_admin_cannot_create_users(client, make_user):
    make_user(username="member", password="correct-horse-battery", is_admin=False)
    csrf = _login(client, username="member")
    response = client.post(
        "/api/users",
        headers={"X-CSRF-Token": csrf},
        json=_payload(),
    )
    assert response.status_code == 403


def test_anonymous_cannot_create_users(client):
    response = client.post("/api/users", json=_payload())
    # CSRF is checked before authentication on state-changing /api routes.
    assert response.status_code == 403
    assert response.json()["detail"] == "CSRF validation failed"


def test_create_user_rejects_duplicates(client, make_user, db_session):
    make_user(username="admin", password="correct-horse-battery", is_admin=True)
    create_user(
        db_session,
        username="jdoe",
        password="correct-horse-battery",
        email="jane@example.com",
        pan="ABCDE1234F",
    )
    csrf = _login(client)

    duplicate_id = client.post(
        "/api/users",
        headers={"X-CSRF-Token": csrf},
        json=_payload(user_email="other@example.com", user_pan="ZZZZZ1234Z"),
    )
    assert duplicate_id.status_code == 409
    assert duplicate_id.json()["detail"] == "User ID already exists"

    duplicate_email = client.post(
        "/api/users",
        headers={"X-CSRF-Token": csrf},
        json=_payload(user_id="other", user_pan="ZZZZZ1234Z"),
    )
    assert duplicate_email.status_code == 409
    assert duplicate_email.json()["detail"] == "Email already exists"

    duplicate_pan = client.post(
        "/api/users",
        headers={"X-CSRF-Token": csrf},
        json=_payload(user_id="other2", user_email="other2@example.com"),
    )
    assert duplicate_pan.status_code == 409
    assert duplicate_pan.json()["detail"] == "PAN already exists"


def test_create_user_validates_pan_and_dob(client, make_user):
    make_user(username="admin", password="correct-horse-battery", is_admin=True)
    csrf = _login(client)

    bad_pan = client.post(
        "/api/users",
        headers={"X-CSRF-Token": csrf},
        json=_payload(user_pan="bad-pan"),
    )
    assert bad_pan.status_code == 422

    future = date.today().replace(year=date.today().year + 1).isoformat()
    bad_dob = client.post(
        "/api/users",
        headers={"X-CSRF-Token": csrf},
        json=_payload(user_dob=future),
    )
    assert bad_dob.status_code == 422


def test_admin_can_update_admin_user(client, make_user):
    admin = make_user(username="admin", password="correct-horse-battery", is_admin=True)
    csrf = _login(client)

    updated = client.put(
        f"/api/users/{admin.id}",
        headers={"X-CSRF-Token": csrf},
        json={
            "user_id": "admin",
            "user_name": "Site Administrator",
            "user_dob": "1985-01-20",
            "user_pan": "AAAAA1234A",
            "user_gender": "male",
            "user_email": "admin@example.com",
        },
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["full_name"] == "Site Administrator"
    assert body["email"] == "admin@example.com"
    assert body["pan"] == "AAAAA1234A"
    assert body["is_admin"] is True

    # Password unchanged when omitted.
    still_ok = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "correct-horse-battery"},
    )
    assert still_ok.status_code == 200


def test_admin_can_change_password_on_update(client, make_user):
    admin = make_user(username="admin", password="correct-horse-battery", is_admin=True)
    csrf = _login(client)

    response = client.put(
        f"/api/users/{admin.id}",
        headers={"X-CSRF-Token": csrf},
        json={
            "user_id": "admin",
            "user_name": "Administrator",
            "user_dob": "1985-01-20",
            "user_pan": "BBBBB1234B",
            "user_gender": "other",
            "user_email": "admin2@example.com",
            "user_password": "new-secret",
        },
    )
    assert response.status_code == 200

    denied = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "correct-horse-battery"},
    )
    assert denied.status_code == 401

    allowed = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "new-secret"},
    )
    assert allowed.status_code == 200


def test_update_missing_user_returns_404(client, make_user):
    make_user(username="admin", password="correct-horse-battery", is_admin=True)
    csrf = _login(client)
    response = client.put(
        "/api/users/9999",
        headers={"X-CSRF-Token": csrf},
        json={
            "user_id": "ghost",
            "user_name": "Ghost",
            "user_dob": "1985-01-20",
            "user_pan": "CCCCC1234C",
            "user_gender": "female",
            "user_email": "ghost@example.com",
        },
    )
    assert response.status_code == 404


def test_member_can_update_own_profile(client, make_user):
    make_user(username="member", password="correct-horse-battery", is_admin=False)
    csrf = _login(client, username="member")

    response = client.put(
        "/api/auth/me",
        headers={"X-CSRF-Token": csrf},
        json={
            "user_id": "member",
            "user_name": "Member Person",
            "user_dob": "1992-03-10",
            "user_pan": "DDDDD1234D",
            "user_gender": "female",
            "user_email": "member@example.com",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["full_name"] == "Member Person"
    assert body["email"] == "member@example.com"
    assert body["is_admin"] is False

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["full_name"] == "Member Person"


def test_member_cannot_update_other_users(client, make_user):
    admin = make_user(username="admin", password="correct-horse-battery", is_admin=True)
    make_user(username="member", password="correct-horse-battery", is_admin=False)
    csrf = _login(client, username="member")

    response = client.put(
        f"/api/users/{admin.id}",
        headers={"X-CSRF-Token": csrf},
        json={
            "user_id": "admin",
            "user_name": "Hijacked",
            "user_dob": "1985-01-20",
            "user_pan": "EEEEE1234E",
            "user_gender": "male",
            "user_email": "hijack@example.com",
        },
    )
    assert response.status_code == 403
