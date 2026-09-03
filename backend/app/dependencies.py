from flask import current_app

from app.repositories import (
    AssessmentRepository,
    AuditLogRepository,
    DiagnosisRepository,
    FactRepository,
    PatientRepository,
    RuleRepository,
    TokenRepository,
    UserRepository,
)
from app.services.admin_service import AdminService
from app.services.auth_service import AuthService
from app.services.diagnosis_service import DiagnosisService
from app.services.fact_service import FactService
from app.services.patient_service import PatientService
from app.services.rule_service import RuleService
from app.services.dashboard_service import DashboardService
from app.services.unified_assessment_service import UnifiedAssessmentService
from app.services.conversational_assessment_service import ConversationalAssessmentService

SERVICE_KEYS = {
    "auth": "auth_service",
    "unified_assessment": "unified_assessment_service",
    "conversational": "conversational_assessment_service",
    "rule": "rule_service",
    "fact": "fact_service",
    "diagnosis": "diagnosis_service",
    "admin": "admin_service",
    "patient": "patient_service",
    "dashboard": "dashboard_service",
}


def init_dependencies(app):
    user_repository = UserRepository()
    rule_repository = RuleRepository()
    diagnosis_repository = DiagnosisRepository()
    assessment_repository = AssessmentRepository()
    patient_repository = PatientRepository()
    audit_log_repository = AuditLogRepository()
    token_repository = TokenRepository()
    fact_repository = FactRepository()

    services = {
        SERVICE_KEYS["auth"]: AuthService(
            user_repository=user_repository,
            token_repository=token_repository,
            secret_key=app.config["SECRET_KEY"],
            algorithm=app.config["JWT_ALGORITHM"],
            access_token_expires_seconds=app.config["JWT_ACCESS_EXPIRES_SECONDS"],
            refresh_token_expires_seconds=app.config["JWT_REFRESH_EXPIRES_SECONDS"],
            audit_log_repository=audit_log_repository,
            patient_repository=patient_repository,
        ),
        SERVICE_KEYS["unified_assessment"]: UnifiedAssessmentService(
            rule_repository=rule_repository,
            diagnosis_repository=diagnosis_repository,
            assessment_repository=assessment_repository,
            patient_repository=patient_repository,
            audit_log_repository=audit_log_repository,
        ),
        SERVICE_KEYS["conversational"]: ConversationalAssessmentService(
            rule_repository=rule_repository,
            diagnosis_repository=diagnosis_repository,
            assessment_repository=assessment_repository,
            patient_repository=patient_repository,
            audit_log_repository=audit_log_repository,
        ),
        SERVICE_KEYS["rule"]: RuleService(
            rule_repository=rule_repository,
            audit_log_repository=audit_log_repository,
        ),
        SERVICE_KEYS["fact"]: FactService(
            fact_repository=fact_repository,
            audit_log_repository=audit_log_repository,
        ),
        SERVICE_KEYS["diagnosis"]: DiagnosisService(
            rule_repository=rule_repository,
            diagnosis_repository=diagnosis_repository,
            assessment_repository=assessment_repository,
            patient_repository=patient_repository,
            audit_log_repository=audit_log_repository,
        ),
        SERVICE_KEYS["admin"]: AdminService(
            user_repository=user_repository,
            audit_log_repository=audit_log_repository,
            patient_repository=patient_repository,
            rule_repository=rule_repository,
            diagnosis_repository=diagnosis_repository,
        ),
        SERVICE_KEYS["patient"]: PatientService(
            patient_repository=patient_repository,
            audit_log_repository=audit_log_repository,
        ),
        SERVICE_KEYS["dashboard"]: DashboardService(),
    }

    app.extensions["services"] = services


def _get_service(key: str):
    services = current_app.extensions.get("services", {})
    return services[key]


def get_auth_service() -> AuthService:
    return _get_service(SERVICE_KEYS["auth"])


def get_rule_service() -> RuleService:
    return _get_service(SERVICE_KEYS["rule"])


def get_fact_service() -> FactService:
    return _get_service(SERVICE_KEYS["fact"])


def get_unified_assessment_service() -> UnifiedAssessmentService:
    return _get_service(SERVICE_KEYS["unified_assessment"])


def get_diagnosis_service() -> DiagnosisService:
    return _get_service(SERVICE_KEYS["diagnosis"])


def get_admin_service() -> AdminService:
    return _get_service(SERVICE_KEYS["admin"])


def get_patient_service() -> PatientService:
    return _get_service(SERVICE_KEYS["patient"])

def get_conversational_assessment_service() -> ConversationalAssessmentService:
    return _get_service(SERVICE_KEYS["conversational"])


def get_dashboard_service() -> DashboardService:
    return _get_service(SERVICE_KEYS["dashboard"])
