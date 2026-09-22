"""add google_sub to users and make password_hash nullable

Revision ID: b9f2e3d4c5a6
Revises: a8f1e2d3c4b5
Create Date: 2026-09-21 17:50:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b9f2e3d4c5a6"
down_revision = "a8f1e2d3c4b5"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("google_sub", sa.String(length=255), nullable=True))
        batch_op.create_unique_constraint("uq_users_google_sub", ["google_sub"])
        batch_op.alter_column("password_hash", existing_type=sa.String(length=255), nullable=True)


def downgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.alter_column("password_hash", existing_type=sa.String(length=255), nullable=False)
        batch_op.drop_constraint("uq_users_google_sub", type_="unique")
        batch_op.drop_column("google_sub")
