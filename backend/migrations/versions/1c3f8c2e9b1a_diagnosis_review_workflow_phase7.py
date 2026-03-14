"""diagnosis review workflow phase7

Revision ID: 1c3f8c2e9b1a
Revises: e5f2b2f9a701
Create Date: 2026-03-10 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1c3f8c2e9b1a'
down_revision = 'e5f2b2f9a701'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('diagnosis_results', schema=None) as batch_op:
        batch_op.add_column(sa.Column('reviewed_by_user_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('explanation_trace_json', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('review_note', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('reviewed_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('is_urgent', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        batch_op.add_column(sa.Column('urgent_reason', sa.Text(), nullable=True))
        batch_op.create_index(batch_op.f('ix_diagnosis_results_reviewed_by_user_id'), ['reviewed_by_user_id'], unique=False)
        batch_op.create_foreign_key(
            'fk_diagnosis_results_reviewed_by_user_id_users',
            'users',
            ['reviewed_by_user_id'],
            ['id'],
            ondelete='SET NULL',
        )


def downgrade():
    with op.batch_alter_table('diagnosis_results', schema=None) as batch_op:
        batch_op.drop_constraint('fk_diagnosis_results_reviewed_by_user_id_users', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_diagnosis_results_reviewed_by_user_id'))
        batch_op.drop_column('urgent_reason')
        batch_op.drop_column('is_urgent')
        batch_op.drop_column('reviewed_at')
        batch_op.drop_column('review_note')
        batch_op.drop_column('explanation_trace_json')
        batch_op.drop_column('reviewed_by_user_id')
