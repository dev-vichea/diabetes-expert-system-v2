from flask import Blueprint, g, request

from app.dependencies import get_diagnosis_service
from app.utils.api_response import success_response
from app.utils.auth import require_auth

diagnosis_bp = Blueprint("diagnosis", __name__)


@diagnosis_bp.post("/")
@require_auth(permissions=["diagnosis.run"])
def create_diagnosis():
    payload = request.get_json(silent=True) or {}
    result = get_diagnosis_service().evaluate(payload, current_user=g.current_user)
    return success_response(data=result)


@diagnosis_bp.get("/mine")
@require_auth(permissions=["diagnosis.view_own"])
def get_my_diagnoses():
    results = get_diagnosis_service().list_my_results(g.current_user)
    return success_response(data=results)


@diagnosis_bp.get("/review")
@require_auth(permissions=["diagnosis.review_any"])
def get_review_diagnoses():
    limit = request.args.get("limit", default=100, type=int)
    results = get_diagnosis_service().list_review_results(limit=limit)
    return success_response(data=results)


@diagnosis_bp.get("/<int:diagnosis_result_id>")
@require_auth(permissions=["diagnosis.run"])
def get_diagnosis_result(diagnosis_result_id: int):
    result = get_diagnosis_service().get_result(diagnosis_result_id)
    return success_response(data=result)


@diagnosis_bp.patch("/<int:diagnosis_result_id>/review")
@require_auth(permissions=["diagnosis.review_any"])
def review_diagnosis(diagnosis_result_id: int):
    payload = request.get_json(silent=True) or {}
    result = get_diagnosis_service().review_result(
        diagnosis_result_id=diagnosis_result_id,
        payload=payload,
        current_user=g.current_user,
    )
    return success_response(data=result, message="Diagnosis review updated.")
