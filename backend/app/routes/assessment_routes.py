from io import BytesIO
from flask import Blueprint, g, request, send_file

from app.dependencies import get_diagnosis_service, get_conversational_assessment_service
from app.utils.api_response import paginated_response, success_response
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


@assessment_bp.post("/submit-to-care-team")
@assessment_bp.post("/submit")
@require_auth(permissions=["diagnosis.run"])
def submit_assessment_to_care_team():
    """
    Official Care Team Submission Endpoint - persists diagnosis result, attaches
    patient notes, and triggers care team alert.
    """
    payload = request.get_json(silent=True) or {}
    result = get_diagnosis_service().submit_to_care_team(payload, current_user=g.current_user)
    return success_response(data=result)


@assessment_bp.get("/mine")
@require_auth(permissions=["diagnosis.view_own"])
def get_my_assessments():
    """List assessment results for the current patient user."""
    limit = min(max(1, request.args.get("limit", default=100, type=int)), 200)
    results = get_diagnosis_service().list_my_results(g.current_user, limit=limit)
    return success_response(data=results)


@assessment_bp.get("/recent")
@assessment_bp.get("/review")
@require_auth(permissions=["diagnosis.review_any"])
def get_recent_assessments():
    """List recent assessments for clinical review."""
    page = max(1, request.args.get("page", default=1, type=int))
    limit = min(max(1, request.args.get("limit", default=100, type=int)), 300)
    results, total = get_diagnosis_service().list_review_results(limit=limit, page=page)
    return paginated_response(items=results, page=page, limit=limit, total=total)


@assessment_bp.get("/<int:diagnosis_result_id>")
@require_auth(permissions=["diagnosis.run", "diagnosis.view_own", "diagnosis.review_any"], permission_mode="any")
def get_assessment_result(diagnosis_result_id: int):
    """Retrieve a saved assessment result by ID."""
    result = get_diagnosis_service().get_result(diagnosis_result_id, current_user=g.current_user)
    return success_response(data=result)


@assessment_bp.get("/<int:diagnosis_result_id>/report.pdf")
@require_auth(permissions=["diagnosis.run", "diagnosis.view_own", "report.export"], permission_mode="any")
def download_assessment_report(diagnosis_result_id: int):
    """Generate and download PDF assessment report."""
    lang = request.args.get("lang", "en").lower().strip()
    pdf_bytes, file_name = get_diagnosis_service().generate_report_pdf(
        diagnosis_result_id, current_user=g.current_user, lang=lang
    )
    return send_file(
        BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=file_name,
    )


@assessment_bp.get("/<int:diagnosis_result_id>/reasoning")
@require_auth(permissions=["diagnosis.run", "diagnosis.view_own", "diagnosis.review_any"], permission_mode="any")
def get_assessment_reasoning(diagnosis_result_id: int):
    """Generate structured AI reasoning report for a saved assessment result.

    Returns explainable evidence: which rules matched, which patient findings
    supported each rule, primary/supporting/conflicting evidence, patient-friendly
    AI explanation, and recommended next steps.

    The reasoning is generated from the existing expert-system result — no new
    diagnosis logic is introduced. AI explains and summarizes, not invents.
    """
    result = get_diagnosis_service().get_result(diagnosis_result_id, current_user=g.current_user)
    from app.services.reasoning_service import ReasoningService
    reasoning = ReasoningService().build_reasoning(result)
    return success_response(data=reasoning)


@assessment_bp.post("/<int:diagnosis_result_id>/reasoning")
@require_auth(permissions=["diagnosis.run"])
def generate_assessment_reasoning(diagnosis_result_id: int):
    """Generate structured AI reasoning report from a live assessment result.

    Accepts the result payload in the request body (used when the result
    hasn't been saved yet, e.g. preview mode).
    """
    payload = request.get_json(silent=True) or {}
    result = payload.get("result")
    if not result:
        result = get_diagnosis_service().get_result(diagnosis_result_id, current_user=g.current_user)
    from app.services.reasoning_service import ReasoningService
    reasoning = ReasoningService().build_reasoning(result)
    return success_response(data=reasoning)


# ============================================================================
# Personalized AI Care Plan Endpoints
# ============================================================================


@assessment_bp.get("/<int:diagnosis_result_id>/care-plan")
@require_auth(roles=["patient"], permissions=["care_plan.view_own"])
def get_assessment_care_plan(diagnosis_result_id: int):
    """Retrieve or generate structured personalized AI care plan for an assessment result.

    Uses the structured assessment report (condition, certainty, symptoms,
    risk factors, and key labs) as context. Returns recommendations categorized into:
    - Diet / Nutrition
    - Physical Activity
    - Lifestyle
    - Monitoring
    - Follow-up Schedule
    - Safety / Medical Disclaimer
    """
    result = get_diagnosis_service().get_result(diagnosis_result_id, current_user=g.current_user, own_only=True)
    care_plan = result.get("care_plan")
    if not care_plan:
        from app.services.care_plan_service import CarePlanService
        care_plan = CarePlanService().generate_care_plan(result)
    return success_response(data=care_plan)


@assessment_bp.post("/<int:diagnosis_result_id>/care-plan")
@require_auth(roles=["patient"], permissions=["care_plan.view_own"])
def generate_assessment_care_plan(diagnosis_result_id: int):
    """Generate or regenerate structured personalized AI care plan from an assessment result.

    Accepts the assessment result payload in request body (for draft/preview mode)
    or loads it from the database if not provided in the body.
    """
    payload = request.get_json(silent=True) or {}
    result = payload.get("result")
    if diagnosis_result_id > 0 or not result:
        result = get_diagnosis_service().get_result(diagnosis_result_id, current_user=g.current_user, own_only=True)
    from app.services.care_plan_service import CarePlanService
    care_plan = CarePlanService().generate_care_plan(result)
    return success_response(data=care_plan)


@assessment_bp.post("/care-plan/generate")
@require_auth(roles=["patient"], permissions=["care_plan.view_own"])
def generate_care_plan_direct():
    """Generate structured personalized care plan directly from an assessment result payload."""
    payload = request.get_json(silent=True) or {}
    result = payload.get("result") or payload
    from app.services.care_plan_service import CarePlanService
    care_plan = CarePlanService().generate_care_plan(result)
    return success_response(data=care_plan)


@assessment_bp.get("/rule-explanation/<path:rule_identifier>")
@optional_auth
def get_rule_explanation(rule_identifier: str):
    """Retrieve explanation/doctor guidance for a rule by ID, code, or name."""
    rule_info = get_diagnosis_service().get_rule_explanation(rule_identifier)
    return success_response(data=rule_info)


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
    if current_user and "diagnosis.run" not in current_user.get("permissions", []):
        from app.errors import ForbiddenError
        raise ForbiddenError("You do not have the required permission(s).")
    result = service.complete_assessment(answers, current_user)
    return success_response(data=result)


@assessment_bp.get("/questions")
def get_all_questions():
    """Get all possible interview questions."""
    service = get_conversational_assessment_service()
    questions = service.get_all_questions()
    return success_response(data={"questions": questions})
