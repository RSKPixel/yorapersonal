from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.repositories import user as user_repo
from app.schemas.auth import CreateUserRequest, UpdateUserRequest, UserResponse
from app.services.users import create_user_as_admin, update_user_record

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[User]:
    return user_repo.list_users(db)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: CreateUserRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> User:
    return create_user_as_admin(db, payload)


@router.put("/{user_pk}", response_model=UserResponse)
def update_user(
    user_pk: int,
    payload: UpdateUserRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> User:
    return update_user_record(db, user_pk, payload)
