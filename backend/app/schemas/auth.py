import re
from datetime import UTC, date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_serializer, field_validator

USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9._-]{3,64}$")
PAN_PATTERN = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
MIN_PASSWORD_LENGTH = 8
Gender = Literal["male", "female", "other"]


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        username = value.strip().lower()
        if not USERNAME_PATTERN.fullmatch(username):
            raise ValueError(
                "User ID must be 3–64 characters and use only letters, numbers, '.', '_' or '-'."
            )
        return username


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    email: EmailStr | None = None
    date_of_birth: date | None = None
    pan: str | None = None
    gender: str | None = None
    is_active: bool
    is_admin: bool
    last_login_at: datetime | None = None
    created_at: datetime

    @field_serializer("last_login_at", "created_at")
    def serialize_utc_datetime(self, value: datetime | None) -> str | None:
        if value is None:
            return None
        aware = value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
        return aware.isoformat().replace("+00:00", "Z")


class CreateUserRequest(BaseModel):
    user_id: str = Field(min_length=3, max_length=64)
    user_name: str = Field(min_length=1, max_length=255)
    user_dob: date
    user_pan: str = Field(min_length=10, max_length=10)
    user_gender: Gender
    user_password: str = Field(min_length=MIN_PASSWORD_LENGTH, max_length=128)
    user_email: EmailStr

    @field_validator("user_id")
    @classmethod
    def normalize_user_id(cls, value: str) -> str:
        user_id = value.strip().lower()
        if not USERNAME_PATTERN.fullmatch(user_id):
            raise ValueError(
                "User ID must be 3–64 characters and use only letters, numbers, '.', '_' or '-'."
            )
        return user_id

    @field_validator("user_name")
    @classmethod
    def normalize_user_name(cls, value: str) -> str:
        name = " ".join(value.split())
        if not name:
            raise ValueError("User name is required.")
        return name

    @field_validator("user_pan")
    @classmethod
    def normalize_pan(cls, value: str) -> str:
        pan = value.strip().upper()
        if not PAN_PATTERN.fullmatch(pan):
            raise ValueError("PAN must look like ABCDE1234F.")
        return pan

    @field_validator("user_email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("user_password")
    @classmethod
    def reject_placeholder_password(cls, value: str) -> str:
        if value.startswith("replace_"):
            raise ValueError("Choose a real password.")
        return value

    @field_validator("user_dob")
    @classmethod
    def validate_dob(cls, value: date) -> date:
        return _validate_dob(value)


class UpdateUserRequest(BaseModel):
    user_id: str = Field(min_length=3, max_length=64)
    user_name: str = Field(min_length=1, max_length=255)
    user_dob: date
    user_pan: str = Field(min_length=10, max_length=10)
    user_gender: Gender
    user_email: EmailStr
    user_password: str | None = Field(default=None, max_length=128)

    @field_validator("user_id")
    @classmethod
    def normalize_user_id(cls, value: str) -> str:
        return CreateUserRequest.normalize_user_id(value)

    @field_validator("user_name")
    @classmethod
    def normalize_user_name(cls, value: str) -> str:
        return CreateUserRequest.normalize_user_name(value)

    @field_validator("user_pan")
    @classmethod
    def normalize_pan(cls, value: str) -> str:
        return CreateUserRequest.normalize_pan(value)

    @field_validator("user_email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return CreateUserRequest.normalize_email(value)

    @field_validator("user_password")
    @classmethod
    def normalize_optional_password(cls, value: str | None) -> str | None:
        if value is None:
            return None
        password = value.strip()
        if not password:
            return None
        if password.startswith("replace_"):
            raise ValueError("Choose a real password.")
        if len(password) < MIN_PASSWORD_LENGTH:
            raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters.")
        return password

    @field_validator("user_dob")
    @classmethod
    def validate_dob(cls, value: date) -> date:
        return _validate_dob(value)


def _validate_dob(value: date) -> date:
    today = date.today()
    if value > today:
        raise ValueError("Date of birth cannot be in the future.")
    age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
    if age < 18 or age > 120:
        raise ValueError("Date of birth must be for someone between 18 and 120 years old.")
    return value
