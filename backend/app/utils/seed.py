import json

from flask import current_app

from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import Fact, Notification, Permission, Patient, Role, Rule, RuleAction, RuleCategory, RuleCondition, User
from app.utils.diabetes_rule_seed_data import DIABETES_RULE_SEED
from app.utils.diabetes_rule_seed_data_v2 import DIABETES_RULE_SEED_V2
from app.utils.diabetes_rule_seed_data_v3 import DIABETES_RULE_SEED_V3
from app.utils.diabetes_fact_seed_data import FACT_CATALOG_SEED

# Structured seed versions. v1 = full historical rule set; v2 = minimal rule
# set whose thresholds and clusters mirror the adaptive assessment engine
# (see app.utils.diabetes_rule_seed_data_v2). v3 merges both: v2's
# engine-mirroring architecture + the IADPSG pregnancy logic v2 was missing +
# the strongest clinical knowledge from v1. Select via the RULES_SEED_VERSION
# config value; v1 remains the default so existing deployments are unchanged.
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
    {"code": "report.export", "description": "Export clinical reports and data"},
    {"code": "analytics.view", "description": "View clinic analytics and dashboards"},
]

DEFAULT_ROLES = {
    "super_admin": {
        "description": "Platform super administrator",
        "permissions": [item["code"] for item in DEFAULT_PERMISSIONS],
    },
    "admin": {
        "description": "System administrator",
        "permissions": [
            "user.view",
            "user.manage",
            "permission.view",
            "permission.manage",
            "audit.view",
            "patient.view",
            "patient.manage",
            "patient.view_own",
            "symptom.view",
            "symptom.manage",
            "lab.view",
            "lab.manage",
            "rule.view",
            "rule.manage",
            "diagnosis.run",
            "diagnosis.review_any",
            "diagnosis.view_own",
            "report.export",
            "analytics.view",
        ],
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
            "report.export",
            "analytics.view",
        ],
    },
    "nurse": {
        "description": "Clinical care and triage nurse",
        "permissions": [
            "patient.view",
            "patient.manage",
            "symptom.view",
            "symptom.manage",
            "lab.view",
            "lab.manage",
            "diagnosis.run",
            "diagnosis.view_own",
            "report.export",
        ],
    },
    "patient": {
        "description": "Patient account",
        "permissions": [
            "patient.view_own",
            "diagnosis.run",
            "diagnosis.view_own",
        ],
    },
}

DEMO_USERS = [
    {
        "email": "superadmin@example.com",
        "password": "superadmin123",
        "name": "Super Admin",
        "roles": ["super_admin"],
    },
    {
        "email": "doctor@example.com",
        "password": "doctor123",
        "name": "Dr. Lina",
        "roles": ["doctor"],
    },
    {
        "email": "nurse@example.com",
        "password": "nurse123",
        "name": "Nurse Sarah",
        "roles": ["nurse"],
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

    # Nurse alerts
    nurse = users_by_email.get("nurse@example.com")
    if nurse:
        notifications_data.extend([
            {
                "user_id": nurse.id,
                "title": "New Assessment Pending Vitals",
                "message": "Patient John Patient submitted self-assessment. Fasting glucose verification needed.",
                "type": "diagnosis",
                "link": "/patients",
                "is_read": False,
            },
            {
                "user_id": nurse.id,
                "title": "Lab Schedule Reminder",
                "message": "Follow-up OGTT test scheduled for 2 patients tomorrow morning at 08:30 AM.",
                "type": "lab",
                "link": "/patients",
                "is_read": False,
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
                "title": "New Staff Member Registered",
                "message": "Nurse Sarah joined the clinic workspace with role 'nurse'.",
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

    # Super Admin alerts
    super_admin = users_by_email.get("superadmin@example.com")
    if super_admin:
        notifications_data.extend([
            {
                "user_id": super_admin.id,
                "title": "Platform Health Status: Optimal",
                "message": "Rule engine, database connections, and PDF export worker operating normally.",
                "type": "system",
                "link": "/admin/dashboard",
                "is_read": False,
            },
            {
                "user_id": super_admin.id,
                "title": "Security Audit Log Entry",
                "message": "Role permissions updated by administrator. 0 unauthorized attempts.",
                "type": "system",
                "link": "/roles-permissions",
                "is_read": True,
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
    """The structured rule seed selected by RULES_SEED_VERSION (default v1)."""
    version = str(current_app.config.get("RULES_SEED_VERSION") or "v1").strip().lower() or "v1"
    seed = STRUCTURED_RULE_SEEDS.get(version)
    if seed is None:
        raise ValueError(
            f"Unknown RULES_SEED_VERSION {version!r} (expected one of {sorted(STRUCTURED_RULE_SEEDS)})"
        )
    return seed


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


def _seed_structured_rules(active_seed=None) -> None:
    if active_seed is None:
        active_seed = _active_structured_seed()
    categories = {row.code: row for row in RuleCategory.query.all()}

    for rule_data in active_seed:
        code = str(rule_data["code"]).strip().lower()
        rule = Rule.query.filter_by(code=code).first()
        if not rule:
            rule = Rule.query.filter_by(name=rule_data["name"]).first()

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
        rule.status = str(rule_data.get("status", "active")).strip().lower() or "active"

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


def _archive_legacy_seed_rules(active_codes=None) -> None:
    for code in LEGACY_DEMO_RULE_CODES:
        row = Rule.query.filter_by(code=code).first()
        if row and row.status != "archived":
            row.status = "archived"

    if active_codes is None:
        return

    # Version switch: archive rules seeded by the OTHER seed version so exactly
    # one seed's rules run at a time. Only seeded prefixes are touched —
    # clinician-authored rules keep whatever status they have.
    seeded_prefixes = ("triage-", "diagnosis-", "classification-", "recommendation-", "v2-")
    for row in Rule.query.filter(Rule.status != "archived"):
        code = str(row.code or "").strip().lower()
        if code.startswith(seeded_prefixes) and code not in active_codes:
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
