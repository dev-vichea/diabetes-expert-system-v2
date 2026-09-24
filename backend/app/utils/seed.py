import json

from flask import current_app

from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import Fact, Notification, Permission, Patient, Role, Rule, RuleAction, RuleCategory, RuleCondition, RuleVersion, User
from app.utils.diabetes_rule_seed_data import DIABETES_RULE_SEED
from app.utils.diabetes_rule_seed_data_v2 import DIABETES_RULE_SEED_V2
from app.utils.diabetes_rule_seed_data_v3 import DIABETES_RULE_SEED_V3, V3_PREVIOUS_DEFINITIONS
from app.utils.diabetes_fact_seed_data import FACT_CATALOG_SEED

# Structured seed versions. v1 = full historical rule set; v2 = minimal rule
# set whose thresholds and clusters mirror the adaptive assessment engine
# (see app.utils.diabetes_rule_seed_data_v2). v3 merges both: v2's
# engine-mirroring architecture + the IADPSG pregnancy logic v2 was missing +
# the strongest clinical knowledge from v1. Select via the RULES_SEED_VERSION
# config value; v3 is the default for new databases.
STRUCTURED_RULE_SEEDS = {"v1": DIABETES_RULE_SEED, "v2": DIABETES_RULE_SEED_V2, "v3": DIABETES_RULE_SEED_V3}

DEFAULT_PERMISSIONS = [
    {"code": "user.view", "description": "View users"},
    {"code": "user.manage", "description": "Manage users"},
    {"code": "permission.view", "description": "View roles and permissions"},
    {"code": "permission.manage", "description": "Create and update roles"},
    {"code": "audit.view", "description": "View system audit logs"},
    {"code": "patient.view", "description": "View patient records"},
    {"code": "patient.manage", "description": "Create and update patient records"},
    {"code": "patient.view_own", "description": "View own patient record"},
    {"code": "symptom.view", "description": "View symptom history"},
    {"code": "symptom.manage", "description": "Create symptom records"},
    {"code": "lab.view", "description": "View lab history"},
    {"code": "lab.manage", "description": "Create lab records"},
    {"code": "rule.view", "description": "View rules"},
    {"code": "rule.manage", "description": "Create and manage rules"},
    {"code": "diagnosis.run", "description": "Run diagnosis"},
    {"code": "diagnosis.review_any", "description": "Review all diagnosis results"},
    {"code": "diagnosis.view_own", "description": "View own diagnosis results"},
    {"code": "assistant.use", "description": "Use AI diabetes assistant"},
    {"code": "treatment_plan.view", "description": "View treatment plans"},
    {"code": "treatment_plan.manage", "description": "Create and update treatment plans"},
    {"code": "care_plan.view_own", "description": "View own care plan"},
    {"code": "guide.view", "description": "View diabetes education guide"},
    {"code": "notification.view", "description": "View personal notifications"},
    {"code": "report.export", "description": "Export clinical reports and data"},
    {"code": "analytics.view", "description": "View clinic analytics and dashboards"},
]

DEFAULT_ROLES = {
    "admin": {
        "description": "System administrator",
        "permissions": [item["code"] for item in DEFAULT_PERMISSIONS],
    },
    "doctor": {
        "description": "Medical practitioner",
        "permissions": [
            "patient.view",
            "patient.manage",
            "symptom.view",
            "symptom.manage",
            "lab.view",
            "lab.manage",
            "rule.view",
            "rule.manage",
            "diagnosis.run",
            "diagnosis.review_any",
            "diagnosis.view_own",
            "treatment_plan.view",
            "treatment_plan.manage",
            "guide.view",
            "notification.view",
            "report.export",
            "analytics.view",
        ],
    },
    "patient": {
        "description": "Patient account",
        "permissions": [
            "patient.view_own",
            "diagnosis.run",
            "diagnosis.view_own",
            "assistant.use",
            "care_plan.view_own",
            "guide.view",
            "notification.view",
        ],
    },
}

DEMO_USERS = [
    {
        "email": "doctor@example.com",
        "password": "doctor123",
        "name": "Dr. Lina",
        "roles": ["doctor"],
    },
    {
        "email": "admin@example.com",
        "password": "admin123",
        "name": "Admin Kim",
        "roles": ["admin"],
    },
    {
        "email": "patient@example.com",
        "password": "patient123",
        "name": "John Patient",
        "roles": ["patient"],
    },
]

DEFAULT_RULE_CATEGORIES = {
    "triage": ("Triage", "Initial symptom/risk triage rules."),
    "diagnosis": ("Diagnosis", "Diagnostic inference rules."),
    "classification": ("Classification", "Rules for patient/result stratification."),
    "recommendation": ("Recommendation", "Care and follow-up recommendation rules."),
}

LEGACY_DEMO_RULE_CODES = {"triage-classic-symptoms"}


def sync_default_access_control() -> None:
    """Sync core access control and consolidate retired roles."""
    permission_by_code = {}
    newly_created_codes = set()
    for permission_data in DEFAULT_PERMISSIONS:
        permission = Permission.query.filter_by(code=permission_data["code"]).first()
        if not permission:
            permission = Permission(**permission_data)
            db.session.add(permission)
            newly_created_codes.add(permission_data["code"])
        permission.description = permission_data["description"]
        permission_by_code[permission_data["code"]] = permission

    db.session.flush()

    for role_name, role_data in DEFAULT_ROLES.items():
        role = Role.query.filter_by(name=role_name).first()
        role_was_created = role is None
        if not role:
            role = Role(name=role_name, description=role_data["description"])
            db.session.add(role)

        existing_codes = {permission.code for permission in role.permissions}
        codes_to_add = role_data["permissions"] if role_was_created else newly_created_codes
        role.permissions.extend(
            permission_by_code[code]
            for code in codes_to_add
            if code in role_data["permissions"] and code not in existing_codes
        )

    # Consolidate legacy built-in roles without deleting their user accounts.
    # Nurse is identified by the original built-in description so an admin can
    # still create a new custom role named "nurse" after this migration.
    for retired_name, replacement_name, legacy_description in (
        ("super_admin", "admin", None),
        ("nurse", "doctor", "Clinical care and triage nurse"),
    ):
        retired_role = Role.query.filter_by(name=retired_name).first()
        replacement_role = Role.query.filter_by(name=replacement_name).first()
        if not retired_role or not replacement_role:
            continue
        if legacy_description and retired_role.description != legacy_description:
            continue

        replacement_permission_ids = {permission.id for permission in replacement_role.permissions}
        replacement_role.permissions.extend(
            permission
            for permission in retired_role.permissions
            if permission.id not in replacement_permission_ids
        )
        for user in list(retired_role.users):
            remaining_roles = [role for role in user.roles if role.id != retired_role.id]
            if all(role.id != replacement_role.id for role in remaining_roles):
                remaining_roles.append(replacement_role)
            user.roles = remaining_roles
        retired_role.permissions = []
        db.session.delete(retired_role)

    db.session.flush()


def seed_demo_data():
    # Seed-time schema healing: create_all() is idempotent and only adds tables
    # that are missing, so a database created before a new model existed (e.g.
    # `facts`) is brought up to date here instead of crashing on the first
    # query — including deployments that run with DB_AUTO_CREATE=false.
    db.create_all()

    _seed_rule_categories()
    _seed_permissions_roles_users()
    _seed_patient_profile()
    _seed_fact_catalog()
    active_seed = _active_structured_seed()
    _archive_legacy_seed_rules(
        active_codes={str(rule["code"]).strip().lower() for rule in active_seed}
    )
    _seed_structured_rules(active_seed)
    _seed_notifications()
    db.session.commit()


def _seed_notifications() -> None:
    """Seed initial clinical and administrative notifications for demo accounts."""
    if Notification.query.first():
        return

    users_by_email = {u.email: u for u in User.query.all()}
    notifications_data = []

    # Doctor alerts
    doctor = users_by_email.get("doctor@example.com")
    if doctor:
        notifications_data.extend([
            {
                "user_id": doctor.id,
                "title": "Urgent Triage Alert: Acute Symptoms",
                "message": "Patient John Patient presented with polydipsia, polyuria, and fatigue (Certainty 92%). Clinical review recommended.",
                "type": "urgent",
                "link": "/review",
                "is_read": False,
            },
            {
                "user_id": doctor.id,
                "title": "Lab Results Recorded",
                "message": "New HbA1c test (8.2%) recorded for patient John Patient. Requires treatment plan update.",
                "type": "lab",
                "link": "/patients",
                "is_read": False,
            },
            {
                "user_id": doctor.id,
                "title": "Clinical Review Completed",
                "message": "Your review for Gestational Diabetes screening session #104 has been finalized.",
                "type": "review",
                "link": "/patient-review",
                "is_read": True,
            },
        ])

    # Patient alerts
    patient = users_by_email.get("patient@example.com")
    if patient:
        notifications_data.extend([
            {
                "user_id": patient.id,
                "title": "Assessment Report Ready",
                "message": "Your diabetes risk evaluation report is ready to view and download as PDF.",
                "type": "diagnosis",
                "link": "/my-results",
                "is_read": False,
            },
            {
                "user_id": patient.id,
                "title": "Doctor Care Recommendations Added",
                "message": "Dr. Lina reviewed your health summary and recommended physical activity adjustments.",
                "type": "review",
                "link": "/care-plan",
                "is_read": False,
            },
            {
                "user_id": patient.id,
                "title": "Care Plan Routine Reminder",
                "message": "Daily 30-minute moderate walking and hydration routine recommended for today.",
                "type": "info",
                "link": "/care-plan",
                "is_read": True,
            },
        ])

    # Admin alerts
    admin = users_by_email.get("admin@example.com")
    if admin:
        notifications_data.extend([
            {
                "user_id": admin.id,
                "title": "Core Roles Synchronized",
                "message": "Admin, Doctor, and Patient roles are ready for access management.",
                "type": "system",
                "link": "/users",
                "is_read": False,
            },
            {
                "user_id": admin.id,
                "title": "Roles & Permissions Matrix Updated",
                "message": "System permissions matrix refreshed with 19 active capabilities.",
                "type": "system",
                "link": "/roles-permissions",
                "is_read": False,
            },
        ])

    for item in notifications_data:
        db.session.add(Notification(**item))
    db.session.flush()


def _seed_fact_catalog() -> None:
    """Insert fact-catalog rows that do not exist yet, and backfill any missing
    bilingual fields on existing rows while preserving doctor edits."""
    for entry in FACT_CATALOG_SEED:
        key = str(entry.get("key") or "").strip().lower()
        if not key:
            continue
        existing = Fact.query.filter_by(key=key).first()
        if existing:
            # Backfill only missing/empty fields so doctor edits are never overwritten
            for field in ("label_km", "medical_term", "question", "question_km", "meaning", "meaning_km", "prevention", "prevention_km"):
                val = entry.get(field)
                if val is not None and not getattr(existing, field):
                    setattr(existing, field, val)
            continue

        db.session.add(Fact(
            key=key,
            label=str(entry.get("label") or key),
            label_km=entry.get("label_km"),
            medical_term=entry.get("medical_term"),
            category=str(entry.get("category") or "other"),
            question=entry.get("question"),
            question_km=entry.get("question_km"),
            meaning=entry.get("meaning"),
            meaning_km=entry.get("meaning_km"),
            prevention=entry.get("prevention"),
            prevention_km=entry.get("prevention_km"),
            weight=float(entry.get("weight", 0.05)),
            type_indication=str(entry.get("type_indication") or "none"),
            is_cardinal=bool(entry.get("is_cardinal", False)),
            is_emergency=bool(entry.get("is_emergency", False)),
            aliases=list(entry.get("aliases") or []),
            is_active=True,
            display_order=int(entry.get("display_order", 100)),
            source="seed",
        ))
    db.session.flush()


def _active_structured_seed() -> list:
    """The structured rule seed selected by RULES_SEED_VERSION (default v3)."""
    version = str(current_app.config.get("RULES_SEED_VERSION") or "v3").strip().lower() or "v3"
    seed = STRUCTURED_RULE_SEEDS.get(version)
    if seed is None:
        raise ValueError(
            f"Unknown RULES_SEED_VERSION {version!r} (expected one of {sorted(STRUCTURED_RULE_SEEDS)})"
        )
    return seed


def sync_knowledge_base() -> dict:
    """Upgrade rules and facts without reseeding accounts or patient data.

    Existing definitions and inactive rules are preserved. Archived rules in
    the selected set are reactivated to support switching seed versions.
    """
    active_seed = _active_structured_seed()
    try:
        Fact.__table__.create(db.engine, checkfirst=True)
        _seed_rule_categories()
        _seed_fact_catalog()
        _archive_legacy_seed_rules(active_codes={rule["code"] for rule in active_seed})
        _seed_structured_rules(active_seed, preserve_existing=True)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return {
        "rules": Rule.query.filter_by(status="active").count(),
        "facts": Fact.query.count(),
    }


def _seed_rule_categories() -> None:
    for category_code, (category_name, category_description) in DEFAULT_RULE_CATEGORIES.items():
        category = RuleCategory.query.filter_by(code=category_code).first()
        if not category:
            category = RuleCategory(code=category_code, name=category_name, description=category_description, is_active=True)
            db.session.add(category)
        else:
            category.name = category_name
            category.description = category_description
            category.is_active = True

    db.session.flush()


def _seed_permissions_roles_users() -> None:
    permission_by_code = {}
    for permission_data in DEFAULT_PERMISSIONS:
        permission = Permission.query.filter_by(code=permission_data["code"]).first()
        if not permission:
            permission = Permission(**permission_data)
            db.session.add(permission)
        permission.description = permission_data["description"]
        permission_by_code[permission_data["code"]] = permission

    db.session.flush()

    role_by_name = {}
    for role_name, role_data in DEFAULT_ROLES.items():
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            role = Role(name=role_name, description=role_data["description"])
            db.session.add(role)
        role.description = role_data["description"]
        role.permissions = [permission_by_code[code] for code in role_data["permissions"]]
        role_by_name[role_name] = role

    db.session.flush()

    for user_data in DEMO_USERS:
        user = User.query.filter_by(email=user_data["email"]).first()
        if not user:
            user = User(
                email=user_data["email"],
                password_hash=generate_password_hash(user_data["password"]),
                name=user_data["name"],
                is_active=True,
            )
            db.session.add(user)
        user.name = user_data["name"]
        user.roles = [role_by_name[role_name] for role_name in user_data["roles"]]

    db.session.flush()


def _seed_patient_profile() -> None:
    patient_user = User.query.filter_by(email="patient@example.com").first()
    if patient_user and not patient_user.patient_profile:
        db.session.add(
            Patient(
                user_id=patient_user.id,
                full_name=patient_user.name,
                gender="male",
                notes="Demo patient profile",
            )
        )


def _seed_structured_rules(active_seed=None, *, preserve_existing=False) -> None:
    if active_seed is None:
        active_seed = _active_structured_seed()
    categories = {row.code: row for row in RuleCategory.query.all()}

    for rule_data in active_seed:
        code = str(rule_data["code"]).strip().lower()
        rule = Rule.query.filter_by(code=code).first()
        if not rule and not preserve_existing:
            rule = Rule.query.filter_by(name=rule_data["name"]).first()

        if rule and preserve_existing:
            if rule.status == "archived":
                rule.status = str(rule_data.get("status", "active"))
            previous = V3_PREVIOUS_DEFINITIONS.get(code)
            if not previous or not _matches_seed_definition(rule, previous):
                continue
            from app.repositories.rule_repository import RuleRepository
            db.session.add(RuleVersion(
                rule_id=rule.id, version_number=rule.version, change_type="before_seed_upgrade",
                snapshot_json=RuleRepository._serialize_rule(rule),
            ))
            rule.version += 1

        preserved_status = rule.status if rule and preserve_existing else None

        category_code = str(rule_data.get("category", "diagnosis")).strip().lower() or "diagnosis"
        category_ref = categories.get(category_code)

        if not rule:
            rule = Rule(code=code, version=1)
            db.session.add(rule)

        rule.code = code
        rule.name = rule_data["name"]
        rule.description = rule_data.get("description", "")
        rule.category = category_code
        rule.category_id = category_ref.id if category_ref else None
        rule.explanation_text = str(rule_data.get("explanation_text") or "").strip() or None
        rule.explanation = rule.explanation_text
        rule.certainty_factor = float(rule_data.get("certainty_factor", 0.5))
        rule.priority = str(rule_data.get("priority", "medium")).strip().lower() or "medium"
        rule.status = preserved_status or str(rule_data.get("status", "active")).strip().lower() or "active"

        rule.conditions.clear()
        for index, condition_data in enumerate(rule_data.get("conditions") or [], start=1):
            expected_value = condition_data.get("expected_value")
            expression = str(condition_data.get("expression") or "").strip()
            if not expression:
                expression = _build_condition_expression(
                    fact_key=condition_data.get("fact_key"),
                    operator=condition_data.get("operator"),
                    expected_value=expected_value,
                )
            rule.conditions.append(
                RuleCondition(
                    expression=expression,
                    fact_key=str(condition_data.get("fact_key") or "").strip() or None,
                    operator=str(condition_data.get("operator") or "").strip() or None,
                    expected_value=_serialize_expected_value(expected_value),
                    sequence=int(condition_data.get("sequence", index)),
                    group_key=str(condition_data.get("group") or "default"),
                    order_index=int(condition_data.get("order_index", index)),
                    logical_operator=str(condition_data.get("logical_operator") or "and"),
                )
            )

        rule.actions.clear()
        for action_data in rule_data.get("actions") or []:
            action_type = str(action_data.get("action_type") or "").strip().lower()
            action_value = _serialize_action_value(action_data.get("action_value"))
            if not action_type or not action_value:
                continue

            rule.actions.append(
                RuleAction(
                    action_type=action_type,
                    action_value=action_value,
                    recommendation=str(action_data.get("recommendation") or "").strip() or None,
                    metadata_json=action_data.get("metadata") if isinstance(action_data.get("metadata"), (dict, list)) else None,
                )
            )


def _matches_seed_definition(rule, previous) -> bool:
    """Compare executable content and editable text, independent of DB IDs."""
    from app.expert_system.rule_loading import RuleLoader
    from app.repositories.rule_repository import RuleRepository

    current = RuleRepository._serialize_rule(rule)
    left = RuleLoader().load([{**current, "status": "active"}]).rules
    right = RuleLoader().load([{**previous, "status": "active"}]).rules
    if not left or not right:
        return False
    def signature(spec):
        return (spec.name, spec.description, spec.explanation, spec.category, spec.priority,
                spec.certainty_factor,
                [(c["fact_key"], c["operator"], c["expected_value"], c["logical_operator"]) for c in spec.conditions],
                [(a.action_type, a.action_value, a.recommendation) for a in spec.actions])
    return signature(left[0]) == signature(right[0])


def _archive_legacy_seed_rules(active_codes=None) -> None:
    for code in LEGACY_DEMO_RULE_CODES:
        row = Rule.query.filter_by(code=code).first()
        if row and row.status != "archived":
            row.status = "archived"

    if active_codes is None:
        return

    # Match exact seed codes, including v3, so custom rules with a similar
    # prefix survive version switches in either direction.
    seeded_codes = {
        str(rule["code"]).strip().lower()
        for seed in STRUCTURED_RULE_SEEDS.values()
        for rule in seed
    }
    for row in Rule.query.filter(Rule.status != "archived"):
        code = str(row.code or "").strip().lower()
        if code in seeded_codes and code not in active_codes:
            row.status = "archived"


def _build_condition_expression(*, fact_key, operator, expected_value) -> str:
    key = str(fact_key or "").strip()
    op = str(operator or "").strip().lower()

    if not key:
        return "true == true"

    if op in {"==", "eq"}:
        if isinstance(expected_value, bool):
            return key if expected_value else f"not {key}"
        return f"{key} == {_format_literal(expected_value)}"
    if op in {"!=", "neq"}:
        if isinstance(expected_value, bool):
            return f"not {key}" if expected_value else key
        return f"{key} != {_format_literal(expected_value)}"
    if op in {">", "<", ">=", "<=", "in", "contains"}:
        return f"{key} {op} {_format_literal(expected_value)}"

    return f"{key} == {_format_literal(expected_value)}"


def _serialize_expected_value(value):
    if value is None:
        return None
    return json.dumps(value)


def _format_literal(value) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    return repr(str(value))


def _serialize_action_value(value) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value).strip()
