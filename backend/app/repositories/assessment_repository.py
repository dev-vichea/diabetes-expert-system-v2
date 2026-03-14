from __future__ import annotations

from datetime import datetime

from app.extensions import db
from app.models import AssessmentAnswer, AssessmentSession


class AssessmentRepository:
    ALLOWED_MODES = {"screening", "diagnostic"}
    ALLOWED_STATUSES = {"submitted", "completed", "failed"}

    def create_session(
        self,
        *,
        patient_id: int | None,
        submitted_by_user_id: int | None,
        mode: str = "diagnostic",
        status: str = "submitted",
    ) -> AssessmentSession:
        normalized_mode = str(mode or "diagnostic").strip().lower()
        if normalized_mode not in self.ALLOWED_MODES:
            normalized_mode = "diagnostic"

        normalized_status = str(status or "submitted").strip().lower()
        if normalized_status not in self.ALLOWED_STATUSES:
            normalized_status = "submitted"

        now = datetime.utcnow()
        session = AssessmentSession(
            patient_id=patient_id,
            submitted_by_user_id=submitted_by_user_id,
            mode=normalized_mode,
            status=normalized_status,
            started_at=now,
            submitted_at=now,
        )
        db.session.add(session)
        db.session.commit()
        return session

    def save_answers(self, session: AssessmentSession, answers: list[dict]) -> int:
        if not answers:
            return 0

        stored_count = 0
        for answer in answers:
            question_code = str(answer.get("question_code") or "").strip()
            if not question_code:
                continue
            answer_row = AssessmentAnswer(
                session_id=session.id,
                question_code=question_code[:120],
                answer_value=answer.get("answer_value"),
                answer_type=str(answer.get("answer_type") or "text").strip().lower()[:20] or "text",
            )
            db.session.add(answer_row)
            stored_count += 1

        db.session.commit()
        return stored_count

    def mark_completed(self, session: AssessmentSession) -> AssessmentSession:
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        db.session.commit()
        return session

    def mark_failed(self, session: AssessmentSession) -> AssessmentSession:
        session.status = "failed"
        db.session.commit()
        return session

    def serialize_session(self, session: AssessmentSession) -> dict:
        return {
            "id": session.id,
            "patient_id": session.patient_id,
            "submitted_by_user_id": session.submitted_by_user_id,
            "mode": session.mode,
            "status": session.status,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "submitted_at": session.submitted_at.isoformat() if session.submitted_at else None,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "updated_at": session.updated_at.isoformat() if session.updated_at else None,
            "answer_count": len(session.answers),
        }
