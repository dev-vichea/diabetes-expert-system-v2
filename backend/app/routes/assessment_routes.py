from io import BytesIO
from flask import Blueprint, g, request, send_file

from app.dependencies import get_diagnosis_service, get_conversational_assessment_service
from app.utils.api_response import success_response
from app.utils.auth import require_auth, optional_auth

assessment_bp = Blueprint("assessment", __name__)


# ============================================================================
# Core Assessment & Diagnosis Endpoints
# ============================================================================


@assessment_bp.post("/")
@assessment_bp.post("/evaluate")
@require_auth(permissions=["diagnosis.run"])
def evaluate_assessment():
    """
    Unified Assessment Endpoint - accepts ANY combination of facts and returns
    intelligent diagnosis with confidence, evidence, missing facts analysis,
    and recommendations.
    """
    payload = request.get_json(silent=True) or {}
    result = get_diagnosis_service().evaluate(payload, current_user=g.current_user)
    return success_response(data=result)


@assessment_bp.get("/mine")
@require_auth(permissions=["diagnosis.view_own"])
def get_my_assessments():
    """List assessment results for the current patient user."""
    results = get_diagnosis_service().list_my_results(g.current_user)
    return success_response(data=results)


@assessment_bp.get("/recent")
@assessment_bp.get("/review")
@require_auth(permissions=["diagnosis.review_any"])
def get_recent_assessments():
    """List recent assessments for clinical review."""
    limit = request.args.get("limit", default=100, type=int)
    results = get_diagnosis_service().list_review_results(limit=limit)
    return success_response(data=results)


@assessment_bp.get("/<int:diagnosis_result_id>")
@require_auth(permissions=["diagnosis.run"])
def get_assessment_result(diagnosis_result_id: int):
    """Retrieve a saved assessment result by ID."""
    result = get_diagnosis_service().get_result(diagnosis_result_id)
    return success_response(data=result)


@assessment_bp.get("/<int:diagnosis_result_id>/report.pdf")
@require_auth(permissions=["diagnosis.run"])
def download_assessment_report(diagnosis_result_id: int):
    """Generate and download PDF assessment report."""
    pdf_bytes, file_name = get_diagnosis_service().generate_report_pdf(diagnosis_result_id)
    return send_file(
        BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=file_name,
    )


@assessment_bp.patch("/<int:diagnosis_result_id>/review")
@require_auth(permissions=["diagnosis.review_any"])
def review_assessment(diagnosis_result_id: int):
    """Annotate / review a diagnosis result (clinician view)."""
    payload = request.get_json(silent=True) or {}
    result = get_diagnosis_service().review_result(
        diagnosis_result_id=diagnosis_result_id,
        payload=payload,
        current_user=g.current_user,
    )
    return success_response(data=result, message="Diagnosis review updated.")


# ============================================================================
# Conversational Assessment Endpoints
# ============================================================================


@assessment_bp.get("/start")
@assessment_bp.post("/start")
@optional_auth
def start_assessment():
    """Start a new conversational assessment flow."""
    service = get_conversational_assessment_service()
    result = service.start_conversation()
    return success_response(data=result)


@assessment_bp.post("/next")
@optional_auth
def next_assessment_question():
    """Get the next question in the assessment flow."""
    payload = request.get_json(silent=True) or {}
    answers = payload.get("answers", {})
    if not answers:
        answers = {
            k: v for k, v in payload.items()
            if k not in ["session_id", "answered", "skipped", "needs_patient"]
        }

    service = get_conversational_assessment_service()
    if not answers:
        result = service.start_conversation()
        return success_response(data=result)

    result = service.get_next_question(answers)
    return success_response(data=result)


@assessment_bp.post("/complete")
@optional_auth
def complete_assessment_endpoint():
    """Complete assessment flow and return diagnosis."""
    payload = request.get_json(silent=True) or {}
    answers = payload.get("answers", {})
    if not answers:
        answers = {k: v for k, v in payload.items() if k not in ["session_id"]}

    service = get_conversational_assessment_service()
    current_user = getattr(g, "current_user", None)
    result = service.complete_assessment(answers, current_user)
    return success_response(data=result)


@assessment_bp.get("/questions")
def get_all_questions():
    """Get all possible interview questions."""
    service = get_conversational_assessment_service()
    questions = service.get_all_questions()
    return success_response(data={"questions": questions})
