"""add performance indexes across tables and ensure facts and notifications tables

Revision ID: f9a8b7c6d5e4
Revises: b9f2e3d4c5a6
Create Date: 2026-09-23 11:15:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f9a8b7c6d5e4"
down_revision = "b9f2e3d4c5a6"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    # Ensure facts table exists if not created by earlier migrations
    if "facts" not in existing_tables:
        op.create_table(
            "facts",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("key", sa.String(120), unique=True, nullable=False, index=True),
            sa.Column("label", sa.String(255), nullable=False),
            sa.Column("label_km", sa.String(255), nullable=True),
            sa.Column("medical_term", sa.String(120), nullable=True),
            sa.Column("category", sa.String(40), nullable=False, default="other", index=True),
            sa.Column("question", sa.Text(), nullable=True),
            sa.Column("question_km", sa.Text(), nullable=True),
            sa.Column("meaning", sa.Text(), nullable=True),
            sa.Column("meaning_km", sa.Text(), nullable=True),
            sa.Column("prevention", sa.Text(), nullable=True),
            sa.Column("prevention_km", sa.Text(), nullable=True),
            sa.Column("weight", sa.Float(), nullable=False, default=0.05),
            sa.Column("type_indication", sa.String(20), nullable=False, default="none"),
            sa.Column("is_cardinal", sa.Boolean(), nullable=False, default=False),
            sa.Column("is_emergency", sa.Boolean(), nullable=False, default=False),
            sa.Column("aliases", sa.JSON(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
            sa.Column("display_order", sa.Integer(), nullable=False, default=100, index=True),
            sa.Column("source", sa.String(20), nullable=False, default="seed"),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )
        existing_tables.add("facts")

    # Ensure notifications table exists if not created by earlier migrations
    if "notifications" not in existing_tables:
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("type", sa.String(50), nullable=False, default="info", index=True),
            sa.Column("link", sa.String(255), nullable=True),
            sa.Column("is_read", sa.Boolean(), nullable=False, default=False, index=True),
            sa.Column("read_at", sa.DateTime(), nullable=True),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, index=True),
        )
        existing_tables.add("notifications")

    def create_index_if_missing(table_name, index_name, columns):
        existing_indexes = {idx["name"] for idx in inspector.get_indexes(table_name)}
        if index_name not in existing_indexes:
            with op.batch_alter_table(table_name, schema=None) as batch_op:
                batch_op.create_index(index_name, columns, unique=False)

    # users
    create_index_if_missing("users", "ix_users_created_at", ["created_at"])
    create_index_if_missing("users", "ix_users_active_created", ["is_active", "created_at"])

    # patients
    create_index_if_missing("patients", "ix_patients_full_name", ["full_name"])
    create_index_if_missing("patients", "ix_patients_created_at", ["created_at"])
    create_index_if_missing("patients", "ix_patients_updated_at", ["updated_at"])

    # assessment_sessions
    create_index_if_missing("assessment_sessions", "ix_assessment_sessions_created_at", ["created_at"])
    create_index_if_missing("assessment_sessions", "ix_assessment_sessions_patient_created", ["patient_id", "created_at"])

    # symptoms
    create_index_if_missing("symptoms", "ix_symptoms_patient_recorded", ["patient_id", "recorded_at"])

    # lab_results
    create_index_if_missing("lab_results", "ix_lab_results_patient_measured", ["patient_id", "measured_at"])

    # facts
    create_index_if_missing("facts", "ix_facts_display_order", ["display_order"])
    create_index_if_missing("facts", "ix_facts_active_category", ["is_active", "category"])

    # diagnosis_results
    create_index_if_missing("diagnosis_results", "ix_diagnosis_results_created_at", ["created_at"])
    create_index_if_missing("diagnosis_results", "ix_diagnosis_results_urgent_review", ["is_urgent", "reviewed_at"])
    create_index_if_missing("diagnosis_results", "ix_diagnosis_results_patient_created", ["patient_id", "created_at"])
    create_index_if_missing("diagnosis_results", "ix_diagnosis_results_doctor_created", ["diagnosed_by_user_id", "created_at"])
    create_index_if_missing("diagnosis_results", "ix_diagnosis_results_reviewer_reviewed", ["reviewed_by_user_id", "reviewed_at"])

    # audit_logs
    create_index_if_missing("audit_logs", "ix_audit_logs_created_at", ["created_at"])
    create_index_if_missing("audit_logs", "ix_audit_logs_actor_created", ["actor_user_id", "created_at"])
    create_index_if_missing("audit_logs", "ix_audit_logs_action_created", ["action", "created_at"])
    create_index_if_missing("audit_logs", "ix_audit_logs_entity_created", ["entity_type", "created_at"])


def downgrade():
    with op.batch_alter_table("audit_logs", schema=None) as batch_op:
        batch_op.drop_index("ix_audit_logs_entity_created")
        batch_op.drop_index("ix_audit_logs_action_created")
        batch_op.drop_index("ix_audit_logs_actor_created")
        batch_op.drop_index("ix_audit_logs_created_at")

    with op.batch_alter_table("diagnosis_results", schema=None) as batch_op:
        batch_op.drop_index("ix_diagnosis_results_reviewer_reviewed")
        batch_op.drop_index("ix_diagnosis_results_doctor_created")
        batch_op.drop_index("ix_diagnosis_results_patient_created")
        batch_op.drop_index("ix_diagnosis_results_urgent_review")
        batch_op.drop_index("ix_diagnosis_results_created_at")

    with op.batch_alter_table("facts", schema=None) as batch_op:
        batch_op.drop_index("ix_facts_active_category")
        batch_op.drop_index("ix_facts_display_order")

    with op.batch_alter_table("lab_results", schema=None) as batch_op:
        batch_op.drop_index("ix_lab_results_patient_measured")

    with op.batch_alter_table("symptoms", schema=None) as batch_op:
        batch_op.drop_index("ix_symptoms_patient_recorded")

    with op.batch_alter_table("assessment_sessions", schema=None) as batch_op:
        batch_op.drop_index("ix_assessment_sessions_patient_created")
        batch_op.drop_index("ix_assessment_sessions_created_at")

    with op.batch_alter_table("patients", schema=None) as batch_op:
        batch_op.drop_index("ix_patients_updated_at")
        batch_op.drop_index("ix_patients_created_at")
        batch_op.drop_index("ix_patients_full_name")

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index("ix_users_active_created")
        batch_op.drop_index("ix_users_created_at")
