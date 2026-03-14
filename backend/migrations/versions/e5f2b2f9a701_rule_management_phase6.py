"""rule management phase6

Revision ID: e5f2b2f9a701
Revises: 59c3159870b9
Create Date: 2026-03-10 13:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e5f2b2f9a701'
down_revision = '59c3159870b9'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('rules', schema=None) as batch_op:
        batch_op.add_column(sa.Column('category', sa.String(length=40), nullable=False, server_default='diagnosis'))
        batch_op.add_column(sa.Column('explanation', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
        batch_op.create_index(batch_op.f('ix_rules_category'), ['category'], unique=False)

    op.create_table(
        'rule_versions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('rule_id', sa.Integer(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('change_type', sa.String(length=30), nullable=False),
        sa.Column('changed_by_user_id', sa.Integer(), nullable=True),
        sa.Column('snapshot_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['changed_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['rule_id'], ['rules.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    with op.batch_alter_table('rule_versions', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_rule_versions_changed_by_user_id'), ['changed_by_user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_rule_versions_rule_id'), ['rule_id'], unique=False)


def downgrade():
    with op.batch_alter_table('rule_versions', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_rule_versions_rule_id'))
        batch_op.drop_index(batch_op.f('ix_rule_versions_changed_by_user_id'))

    op.drop_table('rule_versions')

    with op.batch_alter_table('rules', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_rules_category'))
        batch_op.drop_column('version')
        batch_op.drop_column('explanation')
        batch_op.drop_column('category')
