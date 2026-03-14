"""add assessment sessions and answers

Revision ID: f3c9a4d7b2e1
Revises: b71e42d6c9f2
Create Date: 2026-03-11 19:10:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f3c9a4d7b2e1"
down_revision = "b71e42d6c9f2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "assessment_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=True),
        sa.Column("submitted_by_user_id", sa.Integer(), nullable=True),
        sa.Column("mode", sa.String(length=30), nullable=False, server_default="diagnostic"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="submitted"),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["submitted_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("assessment_sessions", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_assessment_sessions_patient_id"), ["patient_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_assessment_sessions_submitted_by_user_id"), ["submitted_by_user_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_assessment_sessions_mode"), ["mode"], unique=False)
        batch_op.create_index(batch_op.f("ix_assessment_sessions_status"), ["status"], unique=False)

    op.create_table(
        "assessment_answers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("question_code", sa.String(length=120), nullable=False),
        sa.Column("answer_value", sa.Text(), nullable=True),
        sa.Column("answer_type", sa.String(length=20), nullable=False, server_default="text"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["session_id"], ["assessment_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("assessment_answers", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_assessment_answers_session_id"), ["session_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_assessment_answers_question_code"), ["question_code"], unique=False)

    with op.batch_alter_table("diagnosis_results", schema=None) as batch_op:
        batch_op.add_column(sa.Column("assessment_session_id", sa.Integer(), nullable=True))
        batch_op.create_index(batch_op.f("ix_diagnosis_results_assessment_session_id"), ["assessment_session_id"], unique=False)
        batch_op.create_foreign_key(
            "fk_diagnosis_results_assessment_session_id_assessment_sessions",
            "assessment_sessions",
            ["assessment_session_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade():
    with op.batch_alter_table("diagnosis_results", schema=None) as batch_op:
        batch_op.drop_constraint("fk_diagnosis_results_assessment_session_id_assessment_sessions", type_="foreignkey")
        batch_op.drop_index(batch_op.f("ix_diagnosis_results_assessment_session_id"))
        batch_op.drop_column("assessment_session_id")

    with op.batch_alter_table("assessment_answers", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_assessment_answers_question_code"))
        batch_op.drop_index(batch_op.f("ix_assessment_answers_session_id"))
    op.drop_table("assessment_answers")

    with op.batch_alter_table("assessment_sessions", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_assessment_sessions_status"))
        batch_op.drop_index(batch_op.f("ix_assessment_sessions_mode"))
        batch_op.drop_index(batch_op.f("ix_assessment_sessions_submitted_by_user_id"))
        batch_op.drop_index(batch_op.f("ix_assessment_sessions_patient_id"))
    op.drop_table("assessment_sessions")
