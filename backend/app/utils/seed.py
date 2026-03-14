import json

from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import Permission, Patient, Role, Rule, RuleAction, RuleCategory, RuleCondition, User
from app.utils.diabetes_rule_seed_data import DIABETES_RULE_SEED

DEFAULT_PERMISSIONS = [
    {"code": "user.view", "description": "View users"},
    {"code": "user.manage", "description": "Manage users"},
    {"code": "permission.view", "description": "View roles and permissions"},
    {"code": "permission.manage", "description": "Create and update roles"},
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
    _seed_rule_categories()
    _seed_permissions_roles_users()
    _seed_patient_profile()
    _archive_legacy_seed_rules()
    _seed_structured_rules()
    db.session.commit()


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


def _seed_structured_rules() -> None:
    categories = {row.code: row for row in RuleCategory.query.all()}

    for rule_data in DIABETES_RULE_SEED:
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


def _archive_legacy_seed_rules() -> None:
    for code in LEGACY_DEMO_RULE_CODES:
        row = Rule.query.filter_by(code=code).first()
        if row and row.status != "archived":
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
