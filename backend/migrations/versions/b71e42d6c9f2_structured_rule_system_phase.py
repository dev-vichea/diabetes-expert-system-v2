"""structured rule system phase

Revision ID: b71e42d6c9f2
Revises: d8a7c2b1f4e3
Create Date: 2026-03-11 13:45:00.000000

"""

from datetime import datetime
import re

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b71e42d6c9f2"
down_revision = "d8a7c2b1f4e3"
branch_labels = None
depends_on = None


def _slugify(value: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9]+", "-", str(value or "").strip().lower()).strip("-")
    return text[:120] or "rule"


def upgrade():
    op.create_table(
        "rule_categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=40), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("rule_categories", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_rule_categories_code"), ["code"], unique=True)

    now = datetime.utcnow()
    category_table = sa.table(
        "rule_categories",
        sa.column("code", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
        sa.column("is_active", sa.Boolean),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )
    op.bulk_insert(
        category_table,
        [
            {
                "code": "triage",
                "name": "Triage",
                "description": "Initial symptom/risk triage rules.",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "code": "diagnosis",
                "name": "Diagnosis",
                "description": "Diagnostic inference rules.",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "code": "classification",
                "name": "Classification",
                "description": "Rules for patient/result stratification.",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "code": "recommendation",
                "name": "Recommendation",
                "description": "Care and follow-up recommendation rules.",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
        ],
    )

    with op.batch_alter_table("rules", schema=None) as batch_op:
        batch_op.add_column(sa.Column("code", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("category_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("explanation_text", sa.Text(), nullable=True))

    with op.batch_alter_table("rule_conditions", schema=None) as batch_op:
        batch_op.add_column(sa.Column("fact_key", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("operator", sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column("expected_value", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("sequence", sa.Integer(), nullable=False, server_default="1"))
        batch_op.add_column(sa.Column("group_key", sa.String(length=50), nullable=True))

    with op.batch_alter_table("rule_actions", schema=None) as batch_op:
        batch_op.add_column(sa.Column("metadata_json", sa.JSON(), nullable=True))

    connection = op.get_bind()
    category_rows = connection.execute(sa.text("SELECT id, code FROM rule_categories")).fetchall()
    category_ids = {row.code: row.id for row in category_rows}
    legacy_category_map = {
        "symptoms": "triage",
        "complications": "classification",
        "recommendations": "recommendation",
    }

    used_codes = set()
    rule_rows = connection.execute(
        sa.text("SELECT id, name, category, explanation FROM rules ORDER BY id ASC")
    ).fetchall()

    for row in rule_rows:
        normalized_category = str(row.category or "diagnosis").strip().lower()
        normalized_category = legacy_category_map.get(normalized_category, normalized_category)
        if normalized_category not in category_ids:
            connection.execute(
                sa.text(
                    """
                    INSERT INTO rule_categories (code, name, description, is_active, created_at, updated_at)
                    VALUES (:code, :name, :description, :is_active, :created_at, :updated_at)
                    """
                ),
                {
                    "code": normalized_category,
                    "name": normalized_category.replace("_", " ").title(),
                    "description": None,
                    "is_active": True,
                    "created_at": now,
                    "updated_at": now,
                },
            )
            category_ids[normalized_category] = connection.execute(
                sa.text("SELECT id FROM rule_categories WHERE code = :code"),
                {"code": normalized_category},
            ).scalar_one()

        base_code = _slugify(row.name)
        code_candidate = base_code
        suffix = 2
        while code_candidate in used_codes:
            code_candidate = f"{base_code}-{suffix}"
            suffix += 1
        used_codes.add(code_candidate)

        connection.execute(
            sa.text(
                """
                UPDATE rules
                SET code = :code,
                    category = :category,
                    category_id = :category_id,
                    explanation_text = COALESCE(explanation_text, explanation)
                WHERE id = :rule_id
                """
            ),
            {
                "code": code_candidate,
                "category": normalized_category,
                "category_id": category_ids[normalized_category],
                "rule_id": row.id,
            },
        )

    connection.execute(sa.text("UPDATE rule_conditions SET sequence = COALESCE(order_index, 1), group_key = COALESCE(group_key, 'default')"))

    with op.batch_alter_table("rules", schema=None) as batch_op:
        batch_op.alter_column("code", existing_type=sa.String(length=120), nullable=False)
        batch_op.create_index(batch_op.f("ix_rules_code"), ["code"], unique=True)
        batch_op.create_index(batch_op.f("ix_rules_category_id"), ["category_id"], unique=False)
        batch_op.create_foreign_key(
            "fk_rules_category_id_rule_categories",
            "rule_categories",
            ["category_id"],
            ["id"],
            ondelete="SET NULL",
        )

    with op.batch_alter_table("rule_conditions", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_rule_conditions_fact_key"), ["fact_key"], unique=False)
        batch_op.alter_column("sequence", existing_type=sa.Integer(), nullable=False)


def downgrade():
    with op.batch_alter_table("rule_conditions", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_rule_conditions_fact_key"))
        batch_op.drop_column("group_key")
        batch_op.drop_column("sequence")
        batch_op.drop_column("expected_value")
        batch_op.drop_column("operator")
        batch_op.drop_column("fact_key")

    with op.batch_alter_table("rule_actions", schema=None) as batch_op:
        batch_op.drop_column("metadata_json")

    with op.batch_alter_table("rules", schema=None) as batch_op:
        batch_op.drop_constraint("fk_rules_category_id_rule_categories", type_="foreignkey")
        batch_op.drop_index(batch_op.f("ix_rules_category_id"))
        batch_op.drop_index(batch_op.f("ix_rules_code"))
        batch_op.drop_column("explanation_text")
        batch_op.drop_column("category_id")
        batch_op.drop_column("code")

    with op.batch_alter_table("rule_categories", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_rule_categories_code"))

    op.drop_table("rule_categories")
