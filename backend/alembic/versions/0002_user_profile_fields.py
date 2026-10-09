"""add user profile fields

Revision ID: 0002_user_profile_fields
Revises: 0001_create_users
Create Date: 2026-10-09

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_user_profile_fields"
down_revision: Union[str, Sequence[str], None] = "0001_create_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("users", sa.Column("pan", sa.String(length=10), nullable=True))
    op.add_column("users", sa.Column("gender", sa.String(length=16), nullable=True))
    op.create_unique_constraint("uq_users_email", "users", ["email"])
    op.create_unique_constraint("uq_users_pan", "users", ["pan"])


def downgrade() -> None:
    op.drop_constraint("uq_users_pan", "users", type_="unique")
    op.drop_constraint("uq_users_email", "users", type_="unique")
    op.drop_column("users", "gender")
    op.drop_column("users", "pan")
    op.drop_column("users", "date_of_birth")
    op.drop_column("users", "email")
