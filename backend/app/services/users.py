from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories import user as user_repo
from app.schemas.auth import CreateUserRequest, UpdateUserRequest


def create_user_as_admin(db: Session, payload: CreateUserRequest) -> User:
    if user_repo.get_by_username(db, payload.user_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User ID already exists")
    if user_repo.get_by_email(db, payload.user_email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    if user_repo.get_by_pan(db, payload.user_pan):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="PAN already exists")

    return user_repo.create_user(
        db,
        username=payload.user_id,
        full_name=payload.user_name,
        password=payload.user_password,
        email=payload.user_email,
        date_of_birth=payload.user_dob,
        pan=payload.user_pan,
        gender=payload.user_gender,
        is_admin=False,
    )


def update_user_record(db: Session, user_pk: int, payload: UpdateUserRequest) -> User:
    user = user_repo.get_by_id(db, user_pk)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing_username = user_repo.get_by_username(db, payload.user_id)
    if existing_username and existing_username.id != user.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User ID already exists")

    existing_email = user_repo.get_by_email(db, payload.user_email)
    if existing_email and existing_email.id != user.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    existing_pan = user_repo.get_by_pan(db, payload.user_pan)
    if existing_pan and existing_pan.id != user.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="PAN already exists")

    return user_repo.update_user(
        db,
        user,
        username=payload.user_id,
        full_name=payload.user_name,
        email=payload.user_email,
        date_of_birth=payload.user_dob,
        pan=payload.user_pan,
        gender=payload.user_gender,
        password=payload.user_password,
    )
