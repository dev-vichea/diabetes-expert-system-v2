"""add user profile and staff fields

Revision ID: a8f1e2d3c4b5
Revises: c7d8e9f0a1b2
Create Date: 2026-09-04 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a8f1e2d3c4b5"
down_revision = "c7d8e9f0a1b2"
branch_labels = None
depends_on = None


USER_COLUMNS = [
    sa.Column("avatar_url", sa.Text(), nullable=True),
    sa.Column("phone", sa.String(length=40), nullable=True),
    sa.Column("department", sa.String(length=120), nullable=True),
    sa.Column("title", sa.String(length=120), nullable=True),
    sa.Column("hospital_affiliation", sa.String(length=255), nullable=True),
    sa.Column("license_number", sa.String(length=80), nullable=True),
    sa.Column("bio", sa.Text(), nullable=True),
]


def upgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        for column in USER_COLUMNS:
            batch_op.add_column(column)


def downgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        for column in reversed(USER_COLUMNS):
            batch_op.drop_column(column.name)
