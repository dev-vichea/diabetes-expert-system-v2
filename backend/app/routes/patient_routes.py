from flask import Blueprint, g, request

from app.dependencies import get_patient_service
from app.utils.api_response import success_response
from app.utils.auth import require_auth

patient_bp = Blueprint("patients", __name__)


@patient_bp.get("/")
@require_auth(permissions=["patient.view"])
def list_patients():
    search = request.args.get("search", default="", type=str).strip() or None
    gender = request.args.get("gender", default="", type=str).strip() or None
    has_diagnosis_raw = request.args.get("has_diagnosis", default="", type=str).strip()
    has_diagnosis = _parse_optional_bool(has_diagnosis_raw)
    limit = request.args.get("limit", default=200, type=int)

    patients = get_patient_service().list_patients(
        search=search,
        gender=gender,
        has_diagnosis=has_diagnosis,
        limit=limit,
    )
    return success_response(data=patients)


@patient_bp.post("/")
@require_auth(permissions=["patient.manage"])
def register_patient():
    payload = request.get_json(silent=True) or {}
    actor_user_id = _get_actor_user_id()
    patient = get_patient_service().register_patient(payload, actor_user_id=actor_user_id)
    return success_response(data=patient, message="Patient created.", status_code=201)


@patient_bp.get("/mine")
@require_auth(permissions=["patient.view_own"])
def get_my_profile():
    patient = get_patient_service().get_my_profile(g.current_user)
    return success_response(data=patient)


@patient_bp.get("/mine/history")
@require_auth(permissions=["patient.view_own", "diagnosis.view_own"])
def get_my_history():
    history = get_patient_service().get_my_history(g.current_user)
    return success_response(data=history)


@patient_bp.get("/<int:patient_id>")
@require_auth(permissions=["patient.view"])
def get_patient_profile(patient_id: int):
    patient = get_patient_service().get_patient_profile(patient_id)
    return success_response(data=patient)


@patient_bp.patch("/<int:patient_id>")
@require_auth(permissions=["patient.manage"])
def update_patient_profile(patient_id: int):
    payload = request.get_json(silent=True) or {}
    actor_user_id = _get_actor_user_id()
    patient = get_patient_service().update_patient_profile(patient_id, payload, actor_user_id=actor_user_id)
    return success_response(data=patient, message="Patient profile updated.")


@patient_bp.get("/<int:patient_id>/history")
@require_auth(permissions=["patient.view"])
def get_patient_history(patient_id: int):
    history = get_patient_service().get_patient_history(patient_id)
    return success_response(data=history)


@patient_bp.get("/<int:patient_id>/symptoms")
@require_auth(permissions=["symptom.view"])
def get_patient_symptoms(patient_id: int):
    limit = request.args.get("limit", default=200, type=int)
    symptoms = get_patient_service().list_symptoms(patient_id, limit=limit)
    return success_response(data=symptoms)


@patient_bp.post("/<int:patient_id>/symptoms")
@require_auth(permissions=["symptom.manage"])
def add_patient_symptom(patient_id: int):
    payload = request.get_json(silent=True) or {}
    actor_user_id = _get_actor_user_id()
    symptom = get_patient_service().add_symptom(patient_id, payload, actor_user_id=actor_user_id)
    return success_response(data=symptom, message="Symptom added.", status_code=201)


@patient_bp.get("/<int:patient_id>/lab-results")
@require_auth(permissions=["lab.view"])
def get_patient_lab_results(patient_id: int):
    limit = request.args.get("limit", default=200, type=int)
    lab_results = get_patient_service().list_lab_results(patient_id, limit=limit)
    return success_response(data=lab_results)


@patient_bp.post("/<int:patient_id>/lab-results")
@require_auth(permissions=["lab.manage"])
def add_patient_lab_result(patient_id: int):
    payload = request.get_json(silent=True) or {}
    actor_user_id = _get_actor_user_id()
    lab_result = get_patient_service().add_lab_result(patient_id, payload, actor_user_id=actor_user_id)
    return success_response(data=lab_result, message="Lab result added.", status_code=201)


def _parse_optional_bool(value: str) -> bool | None:
    if not value:
        return None
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "y", "on"}:
        return True
    if normalized in {"0", "false", "no", "n", "off"}:
        return False
    return None


def _get_actor_user_id() -> int | None:
    if not g.current_user:
        return None

    sub = g.current_user.get("sub")
    if sub in (None, ""):
        return None

    try:
        return int(sub)
    except (TypeError, ValueError):
        return None
