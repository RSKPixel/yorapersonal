import os
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote_plus

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_ENV_FILE = _BACKEND_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=None if os.getenv("APP_ENV") == "test" else _ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Yora Personal"
    app_env: str = "development"
    database_url: str = ""
    db_host: str | None = None
    db_port: int = 3306
    db_user: str | None = None
    db_password: str | None = None
    db_name: str | None = None
    jwt_secret_key: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=30, ge=5, le=120)
    cors_origins: str = "http://127.0.0.1:5177"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    cookie_name: str = "access_token"
    csrf_cookie_name: str = "csrf_token"

    @field_validator("app_env")
    @classmethod
    def validate_app_env(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"development", "test", "production"}:
            raise ValueError("APP_ENV must be development, test, or production")
        return normalized

    @field_validator("jwt_algorithm")
    @classmethod
    def validate_jwt_algorithm(cls, value: str) -> str:
        if value not in {"HS256", "HS384", "HS512"}:
            raise ValueError("JWT_ALGORITHM must be HS256, HS384, or HS512")
        return value

    @field_validator("cookie_samesite")
    @classmethod
    def validate_samesite(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"lax", "strict", "none"}:
            raise ValueError("COOKIE_SAMESITE must be lax, strict, or none")
        return normalized

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        if not self.db_host or self.db_user is None or self.db_password is None or not self.db_name:
            raise RuntimeError(
                "Set DATABASE_URL, or set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME."
            )
        user = quote_plus(self.db_user)
        password = quote_plus(self.db_password)
        database = quote_plus(self.db_name)
        return (
            f"mysql+pymysql://{user}:{password}@{self.db_host}:{self.db_port}/"
            f"{database}?charset=utf8mb4"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
