"""add direct user permissions

Revision ID: 0a1b2c3d4e5f
Revises: f9a8b7c6d5e4
Create Date: 2026-09-25 14:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "0a1b2c3d4e5f"
down_revision = "f9a8b7c6d5e4"
branch_labels = None
depends_on = None


def upgrade():
    if "user_permissions" not in sa.inspect(op.get_bind()).get_table_names():
        op.create_table(
            "user_permissions",
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("permission_id", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("user_id", "permission_id"),
        )


def downgrade():
    if "user_permissions" in sa.inspect(op.get_bind()).get_table_names():
        op.drop_table("user_permissions")
