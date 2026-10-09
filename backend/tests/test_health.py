from app.core.config import Settings
from app.core.redaction import redact


def test_health_and_ready(client):
    health = client.get("/health")
    ready = client.get("/ready")
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    assert ready.status_code == 200
    assert ready.json() == {"status": "ready"}


def test_database_url_encodes_reserved_characters(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "")
    monkeypatch.setenv("DB_HOST", "db.example")
    monkeypatch.setenv("DB_PORT", "3306")
    monkeypatch.setenv("DB_USER", "yora")
    monkeypatch.setenv("DB_PASSWORD", "p@ss/word")
    monkeypatch.setenv("DB_NAME", "yora personal")
    url = Settings().sqlalchemy_database_url
    assert url == (
        "mysql+pymysql://yora:p%40ss%2Fword@db.example:3306/yora+personal?charset=utf8mb4"
    )


def test_redact_strips_database_userinfo():
    raw = "Can't connect to mysql+pymysql://yora:secret@db:3306/yorapersonal"
    assert "secret" not in redact(raw)
    assert "://***:***@" in redact(raw)
