"""add questionnaire answers to diagnosis results

Revision ID: d8a7c2b1f4e3
Revises: 1c3f8c2e9b1a
Create Date: 2026-03-10 18:20:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d8a7c2b1f4e3"
down_revision = "1c3f8c2e9b1a"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("diagnosis_results", schema=None) as batch_op:
        batch_op.add_column(sa.Column("questionnaire_answers_json", sa.JSON(), nullable=True))


def downgrade():
    with op.batch_alter_table("diagnosis_results", schema=None) as batch_op:
        batch_op.drop_column("questionnaire_answers_json")
