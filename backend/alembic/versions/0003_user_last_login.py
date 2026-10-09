"""add user last_login_at

Revision ID: 0003_user_last_login
Revises: 0002_user_profile_fields
Create Date: 2026-10-09

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_user_last_login"
down_revision: Union[str, Sequence[str], None] = "0002_user_profile_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("last_login_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "last_login_at")
