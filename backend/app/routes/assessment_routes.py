from flask import Blueprint, request

from app.dependencies import get_assessment_service
from app.utils.api_response import success_response
from app.utils.auth import require_auth

assessment_bp = Blueprint("assessment", __name__)


@assessment_bp.post("/next")
@require_auth(permissions=["diagnosis.run"])
def next_assessment_question():
    """Select Next Question — the backend picks the most clinically useful
    question and returns its KEY; the frontend maps the key to its hardcoded
    question definition. An empty key means the interview is complete."""
    payload = request.get_json(silent=True) or {}
    return success_response(data=get_assessment_service().next_question(payload))


@assessment_bp.post("/result")
@require_auth(permissions=["diagnosis.run"])
def assessment_result():
    """Final Assessment — detected patterns with supporting/conflicting
    evidence, uncertainty, explanation keys and the recommended next step."""
    payload = request.get_json(silent=True) or {}
    return success_response(data=get_assessment_service().final_assessment(payload))
