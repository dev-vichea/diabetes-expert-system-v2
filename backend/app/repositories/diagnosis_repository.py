from datetime import datetime, timedelta

from sqlalchemy import func

from app.extensions import db
from app.models import DiagnosisResult


class DiagnosisRepository:
    def count_results(self) -> int:
        return DiagnosisResult.query.count()

    def count_urgent_results(self) -> int:
        return DiagnosisResult.query.filter(DiagnosisResult.is_urgent.is_(True)).count()

    def count_reviewed_results(self) -> int:
        return DiagnosisResult.query.filter(DiagnosisResult.reviewed_at.isnot(None)).count()

    def count_recent_results(self, *, days: int = 7) -> int:
        safe_days = max(1, min(int(days or 7), 90))
        since = datetime.utcnow() - timedelta(days=safe_days)
        return db.session.query(func.count(DiagnosisResult.id)).filter(DiagnosisResult.created_at >= since).scalar() or 0

    def create_result(
        self,
        *,
        assessment_session_id: int | None = None,
        patient_id: int | None,
        diagnosed_by_user_id: int | None,
        diagnosis: str,
        certainty: float,
        recommendation: str,
        facts: dict,
        questionnaire_answers: dict | None = None,
        triggered_rules: list[dict],
        explanation_trace: dict | None = None,
        is_urgent: bool = False,
        urgent_reason: str | None = None,
    ) -> DiagnosisResult:
        result = DiagnosisResult(
            assessment_session_id=assessment_session_id,
            patient_id=patient_id,
            diagnosed_by_user_id=diagnosed_by_user_id,
            diagnosis=diagnosis,
            certainty=certainty,
            recommendation=recommendation,
            facts_json=facts,
            questionnaire_answers_json=questionnaire_answers,
            triggered_rules_json=triggered_rules,
            explanation_trace_json=explanation_trace,
            is_urgent=bool(is_urgent),
            urgent_reason=urgent_reason,
        )
        db.session.add(result)
        db.session.commit()
        return result

    def get_result(self, diagnosis_result_id: int) -> DiagnosisResult | None:
        return db.session.get(DiagnosisResult, diagnosis_result_id)

    def update_review(
        self,
        result: DiagnosisResult,
        *,
        reviewed_by_user_id: int,
        review_note: str | None,
        is_urgent: bool | None,
        urgent_reason: str | None,
        reviewed_at,
    ) -> DiagnosisResult:
        result.reviewed_by_user_id = reviewed_by_user_id
        result.reviewed_at = reviewed_at

        if review_note is not None:
            result.review_note = review_note

        if is_urgent is not None:
            result.is_urgent = bool(is_urgent)

        if urgent_reason is not None:
            result.urgent_reason = urgent_reason
        elif is_urgent is False:
            result.urgent_reason = None

        db.session.commit()
        return result

    def list_by_patient_id(self, patient_id: int, limit: int = 100) -> list[dict]:
        rows = (
            DiagnosisResult.query.filter_by(patient_id=patient_id)
            .order_by(DiagnosisResult.created_at.desc())
            .limit(limit)
            .all()
        )
        return [self._serialize(row) for row in rows]

    def list_recent(self, limit: int = 100) -> list[dict]:
        rows = DiagnosisResult.query.order_by(DiagnosisResult.created_at.desc()).limit(limit).all()
        return [self._serialize(row) for row in rows]

    def serialize_result(self, row: DiagnosisResult) -> dict:
        return self._serialize(row)

    @staticmethod
    def _serialize(row: DiagnosisResult) -> dict:
        patient_name = row.patient.full_name if row.patient else None
        diagnosed_by_name = row.diagnosed_by_user.name if row.diagnosed_by_user else None
        reviewed_by_name = row.reviewed_by_user.name if row.reviewed_by_user else None
        session = row.assessment_session
        return {
            "id": row.id,
            "assessment_session_id": row.assessment_session_id,
            "assessment_session": {
                "id": session.id,
                "mode": session.mode,
                "status": session.status,
                "started_at": session.started_at.isoformat() if session.started_at else None,
                "submitted_at": session.submitted_at.isoformat() if session.submitted_at else None,
                "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            }
            if session
            else None,
            "patient_id": row.patient_id,
            "patient_name": patient_name,
            "diagnosed_by_user_id": row.diagnosed_by_user_id,
            "diagnosed_by_name": diagnosed_by_name,
            "reviewed_by_user_id": row.reviewed_by_user_id,
            "reviewed_by_name": reviewed_by_name,
            "diagnosis": row.diagnosis,
            "certainty": float(row.certainty),
            "recommendation": row.recommendation,
            "facts": row.facts_json,
            "questionnaire_answers": row.questionnaire_answers_json,
            "triggered_rules": row.triggered_rules_json,
            "explanation_trace": row.explanation_trace_json,
            "review_note": row.review_note,
            "reviewed_at": row.reviewed_at.isoformat() if row.reviewed_at else None,
            "is_urgent": bool(row.is_urgent),
            "urgent_reason": row.urgent_reason,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
