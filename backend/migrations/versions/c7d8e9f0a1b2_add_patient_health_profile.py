"""add patient health profile fields

Revision ID: c7d8e9f0a1b2
Revises: 656d0bb80d29
Create Date: 2026-03-14 10:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c7d8e9f0a1b2"
down_revision = "656d0bb80d29"
branch_labels = None
depends_on = None


PROFILE_COLUMNS = [
    sa.Column("height_cm", sa.Float(), nullable=True),
    sa.Column("weight_kg", sa.Float(), nullable=True),
    sa.Column("waist_circumference", sa.Float(), nullable=True),
    sa.Column("smoking", sa.Boolean(), nullable=True),
    sa.Column("sedentary_lifestyle", sa.Boolean(), nullable=True),
    sa.Column("family_history", sa.Boolean(), nullable=True),
    sa.Column("hypertension", sa.Boolean(), nullable=True),
    sa.Column("high_cholesterol", sa.Boolean(), nullable=True),
    sa.Column("profile_completed_at", sa.DateTime(), nullable=True),
]


def upgrade():
    with op.batch_alter_table("patients", schema=None) as batch_op:
        for column in PROFILE_COLUMNS:
            batch_op.add_column(column)


def downgrade():
    with op.batch_alter_table("patients", schema=None) as batch_op:
        for column in reversed(PROFILE_COLUMNS):
            batch_op.drop_column(column.name)
