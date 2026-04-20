from datetime import UTC, datetime

from app.extensions import db


def utc_now() -> datetime:
    # The current schema stores naive timestamps, so keep UTC values naive
    # while avoiding the deprecated datetime.utcnow() API.
    return datetime.now(UTC).replace(tzinfo=None)


user_roles = db.Table(
    "user_roles",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    db.Column("role_id", db.Integer, db.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

role_permissions = db.Table(
    "role_permissions",
    db.Column("role_id", db.Integer, db.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    db.Column("permission_id", db.Integer, db.ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    permissions = db.relationship("Permission", secondary=role_permissions, back_populates="roles")
    users = db.relationship("User", secondary=user_roles, back_populates="roles")


class Permission(db.Model):
    __tablename__ = "permissions"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(80), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    roles = db.relationship("Role", secondary=role_permissions, back_populates="permissions")


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(db.DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    roles = db.relationship("Role", secondary=user_roles, back_populates="users")
    diagnoses_made = db.relationship(
        "DiagnosisResult",
        back_populates="diagnosed_by_user",
        foreign_keys="DiagnosisResult.diagnosed_by_user_id",
    )
    diagnoses_reviewed = db.relationship(
        "DiagnosisResult",
        back_populates="reviewed_by_user",
        foreign_keys="DiagnosisResult.reviewed_by_user_id",
    )
    assessment_sessions_submitted = db.relationship(
        "AssessmentSession",
        back_populates="submitted_by_user",
        foreign_keys="AssessmentSession.submitted_by_user_id",
    )
    patient_profile = db.relationship("Patient", back_populates="user", uselist=False)


class Patient(db.Model):
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)
    full_name = db.Column(db.String(120), nullable=False)
    gender = db.Column(db.String(20), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    phone = db.Column(db.String(40), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(db.DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    user = db.relationship("User", back_populates="patient_profile")
    symptoms = db.relationship("Symptom", back_populates="patient", cascade="all, delete-orphan")
    lab_results = db.relationship("LabResult", back_populates="patient", cascade="all, delete-orphan")
    diagnosis_results = db.relationship("DiagnosisResult", back_populates="patient")
    assessment_sessions = db.relationship("AssessmentSession", back_populates="patient")


class AssessmentSession(db.Model):
    __tablename__ = "assessment_sessions"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="SET NULL"), nullable=True, index=True)
    submitted_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    mode = db.Column(db.String(30), nullable=False, default="diagnostic", index=True)
    status = db.Column(db.String(20), nullable=False, default="submitted", index=True)
    started_at = db.Column(db.DateTime, nullable=True)
    submitted_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(db.DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    patient = db.relationship("Patient", back_populates="assessment_sessions")
    submitted_by_user = db.relationship("User", back_populates="assessment_sessions_submitted", foreign_keys=[submitted_by_user_id])
    answers = db.relationship("AssessmentAnswer", back_populates="session", cascade="all, delete-orphan")
    diagnosis_results = db.relationship("DiagnosisResult", back_populates="assessment_session")


class AssessmentAnswer(db.Model):
    __tablename__ = "assessment_answers"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("assessment_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_code = db.Column(db.String(120), nullable=False, index=True)
    answer_value = db.Column(db.Text, nullable=True)
    answer_type = db.Column(db.String(20), nullable=False, default="text")
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    session = db.relationship("AssessmentSession", back_populates="answers")


class Symptom(db.Model):
    __tablename__ = "symptoms"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    symptom_code = db.Column(db.String(80), nullable=False, index=True)
    symptom_name = db.Column(db.String(255), nullable=False)
    severity = db.Column(db.Integer, nullable=True)
    present = db.Column(db.Boolean, nullable=False, default=True)
    recorded_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    notes = db.Column(db.Text, nullable=True)

    patient = db.relationship("Patient", back_populates="symptoms")


class LabResult(db.Model):
    __tablename__ = "lab_results"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    test_name = db.Column(db.String(120), nullable=False)
    test_value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(40), nullable=True)
    reference_range = db.Column(db.String(120), nullable=True)
    measured_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    notes = db.Column(db.Text, nullable=True)

    patient = db.relationship("Patient", back_populates="lab_results")


class Rule(db.Model):
    __tablename__ = "rules"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(120), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(40), nullable=False, default="diagnosis", index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("rule_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    explanation = db.Column(db.Text, nullable=True)
    explanation_text = db.Column(db.Text, nullable=True)
    certainty_factor = db.Column(db.Float, nullable=False, default=0.5)
    priority = db.Column(db.String(20), nullable=False, default="medium")
    status = db.Column(db.String(20), nullable=False, default="active")
    version = db.Column(db.Integer, nullable=False, default=1)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(db.DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    category_ref = db.relationship("RuleCategory", back_populates="rules")
    conditions = db.relationship("RuleCondition", back_populates="rule", cascade="all, delete-orphan")
    actions = db.relationship("RuleAction", back_populates="rule", cascade="all, delete-orphan")
    versions = db.relationship("RuleVersion", back_populates="rule", cascade="all, delete-orphan")


class RuleCategory(db.Model):
    __tablename__ = "rule_categories"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(40), unique=True, nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(db.DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    rules = db.relationship("Rule", back_populates="category_ref")


class RuleCondition(db.Model):
    __tablename__ = "rule_conditions"

    id = db.Column(db.Integer, primary_key=True)
    rule_id = db.Column(db.Integer, db.ForeignKey("rules.id", ondelete="CASCADE"), nullable=False, index=True)
    expression = db.Column(db.Text, nullable=False)
    fact_key = db.Column(db.String(120), nullable=True, index=True)
    operator = db.Column(db.String(20), nullable=True)
    expected_value = db.Column(db.Text, nullable=True)
    sequence = db.Column(db.Integer, nullable=False, default=1)
    group_key = db.Column(db.String(50), nullable=True, default="default")
    order_index = db.Column(db.Integer, nullable=False, default=1)
    logical_operator = db.Column(db.String(10), nullable=False, default="and")
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    rule = db.relationship("Rule", back_populates="conditions")


class RuleAction(db.Model):
    __tablename__ = "rule_actions"

    id = db.Column(db.Integer, primary_key=True)
    rule_id = db.Column(db.Integer, db.ForeignKey("rules.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = db.Column(db.String(50), nullable=False, default="diagnosis_conclusion")
    action_value = db.Column(db.Text, nullable=False)
    recommendation = db.Column(db.Text, nullable=True)
    metadata_json = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    rule = db.relationship("Rule", back_populates="actions")


class RuleVersion(db.Model):
    __tablename__ = "rule_versions"

    id = db.Column(db.Integer, primary_key=True)
    rule_id = db.Column(db.Integer, db.ForeignKey("rules.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = db.Column(db.Integer, nullable=False)
    change_type = db.Column(db.String(30), nullable=False)
    changed_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    snapshot_json = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    rule = db.relationship("Rule", back_populates="versions")
    changed_by_user = db.relationship("User", foreign_keys=[changed_by_user_id])


class DiagnosisResult(db.Model):
    __tablename__ = "diagnosis_results"

    id = db.Column(db.Integer, primary_key=True)
    assessment_session_id = db.Column(db.Integer, db.ForeignKey("assessment_sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id", ondelete="SET NULL"), nullable=True, index=True)
    diagnosed_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reviewed_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    diagnosis = db.Column(db.String(255), nullable=False)
    certainty = db.Column(db.Float, nullable=False)
    recommendation = db.Column(db.Text, nullable=True)
    facts_json = db.Column(db.JSON, nullable=False)
    questionnaire_answers_json = db.Column(db.JSON, nullable=True)
    triggered_rules_json = db.Column(db.JSON, nullable=False)
    explanation_trace_json = db.Column(db.JSON, nullable=True)
    review_note = db.Column(db.Text, nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    is_urgent = db.Column(db.Boolean, nullable=False, default=False)
    urgent_reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    assessment_session = db.relationship("AssessmentSession", back_populates="diagnosis_results")
    patient = db.relationship("Patient", back_populates="diagnosis_results")
    diagnosed_by_user = db.relationship("User", back_populates="diagnoses_made", foreign_keys=[diagnosed_by_user_id])
    reviewed_by_user = db.relationship("User", back_populates="diagnoses_reviewed", foreign_keys=[reviewed_by_user_id])


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    actor_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = db.Column(db.String(120), nullable=False, index=True)
    entity_type = db.Column(db.String(120), nullable=False, index=True)
    entity_id = db.Column(db.String(120), nullable=True)
    metadata_json = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)


class RevokedToken(db.Model):
    __tablename__ = "revoked_tokens"

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(64), nullable=False, unique=True, index=True)
    token_type = db.Column(db.String(20), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    revoked_at = db.Column(db.DateTime, nullable=False, default=utc_now)
