"""Application service for the adaptive assessment pipeline.

Thin wrapper around the pure engine in
``app.expert_system.adaptive_assessment`` — the pipeline stages
(Evidence → Rule Engine → Pattern Analysis → Select Next Question →
Final Assessment) live in the engine; this service adapts HTTP payloads
to it and keeps the routes free of logic.
"""

from __future__ import annotations

from app.expert_system.adaptive_assessment import (
    build_interview_state,
    generate_final_assessment,
)


class AssessmentService:
    def next_question(self, payload: dict) -> dict:
        """Select Next Question: returns a question KEY (never text)."""
        payload = payload if isinstance(payload, dict) else {}
        return build_interview_state(
            payload.get("answers"),
            skipped=payload.get("skipped"),
            needs_patient=bool(payload.get("needs_patient")),
            answered=payload.get("answered"),
        )

    def final_assessment(self, payload: dict) -> dict:
        """Final Assessment: patterns, evidence, uncertainty, next step."""
        payload = payload if isinstance(payload, dict) else {}
        return generate_final_assessment(
            payload.get("answers"),
            skipped=payload.get("skipped"),
        )
