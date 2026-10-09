"""create users table

Revision ID: 0001_create_users
Revises:
Create Date: 2026-10-09

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_create_users"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("is_admin", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("username", name="uq_users_username"),
    )


def downgrade() -> None:
    op.drop_table("users")
