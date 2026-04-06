from datetime import UTC, datetime, timedelta

from sqlalchemy import extract, func

from app.extensions import db
from app.models.entities import AssessmentSession, DiagnosisResult, Patient, User


class DashboardService:
    """Compute real-time clinical dashboard metrics with optional date-range filtering."""

    # ------------------------------------------------------------------ #
    #  Public API                                                         #
    # ------------------------------------------------------------------ #

    def get_clinical_stats(self, *, days: int | None = None) -> dict:
        """Return dashboard payload.

        ``days`` narrows *scoped* metrics (assessments, treatment plans,
        recent cases, risk-classification) to the last N days.  Counts like
        *total patients* and *urgent (un-reviewed)* are always global.
        """
        now = datetime.now(UTC).replace(tzinfo=None)

        # --- date boundaries ------------------------------------------------
        if days and days > 0:
            range_start = (now - timedelta(days=days)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        else:
            range_start = None  # no filter → all-time

        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_start = today_start - timedelta(days=1)
        prev_range_start = (
            (range_start - timedelta(days=days))
            if range_start and days
            else None
        )

        # --- KPI cards -------------------------------------------------------
        assessments = self._count_assessments(range_start, now, yesterday_start, today_start, prev_range_start, days)
        active_patients = self._count_patients()
        urgent_cases = self._count_urgent()
        treatment_plans = self._count_treatments(range_start)

        # --- Recent cases table ----------------------------------------------
        recent_cases = self._recent_cases(range_start)

        # --- Risk classification pie chart -----------------------------------
        risk_classification = self._risk_classification(range_start)

        # --- Monthly trend area chart ----------------------------------------
        monthly_trend = self._monthly_diagnosis_trend(range_start)

        return {
            "assessments": assessments,
            "active_patients": active_patients,
            "urgent_cases": urgent_cases,
            "treatment_plans": treatment_plans,
            "recent_cases": recent_cases,
            "risk_classification": risk_classification,
            "monthly_trend": monthly_trend,
        }

    # ------------------------------------------------------------------ #
    #  Private helpers                                                    #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _count_assessments(range_start, now, yesterday_start, today_start, prev_range_start, days):
        """Build assessments KPI with trend text."""
        q = db.session.query(func.count(AssessmentSession.id))
        if range_start:
            count = q.filter(AssessmentSession.created_at >= range_start).scalar() or 0
            # compare to the same-length previous window
            prev_count = 0
            if prev_range_start:
                prev_count = q.filter(
                    AssessmentSession.created_at >= prev_range_start,
                    AssessmentSession.created_at < range_start,
                ).scalar() or 0
            trend = DashboardService._trend_text(count, prev_count, f"prev {days}d")
        else:
            count = q.filter(AssessmentSession.created_at >= today_start).scalar() or 0
            prev_count = q.filter(
                AssessmentSession.created_at >= yesterday_start,
                AssessmentSession.created_at < today_start,
            ).scalar() or 0
            trend = DashboardService._trend_text(count, prev_count, "yesterday")

        return {"value": count, "trend": trend}

    @staticmethod
    def _count_patients():
        total = db.session.query(func.count(Patient.id)).scalar() or 0
        return {"value": total, "trend": "Total registered"}

    @staticmethod
    def _count_urgent():
        count = (
            db.session.query(func.count(DiagnosisResult.id))
            .filter(
                DiagnosisResult.is_urgent == True,  # noqa: E712
                DiagnosisResult.reviewed_at.is_(None),
            )
            .scalar()
            or 0
        )
        return {"value": count, "trend": "Awaiting review"}

    @staticmethod
    def _count_treatments(range_start):
        q = db.session.query(func.count(DiagnosisResult.id)).filter(
            DiagnosisResult.recommendation.isnot(None),
            DiagnosisResult.recommendation != "",
        )
        if range_start:
            q = q.filter(DiagnosisResult.created_at >= range_start)
        count = q.scalar() or 0
        return {"value": count, "trend": "Recommendations issued"}

    @staticmethod
    def _recent_cases(range_start, limit: int = 10):
        q = (
            db.session.query(DiagnosisResult, Patient, User)
            .join(Patient, DiagnosisResult.patient_id == Patient.id)
            .outerjoin(User, DiagnosisResult.diagnosed_by_user_id == User.id)
        )
        if range_start:
            q = q.filter(DiagnosisResult.created_at >= range_start)
        rows = q.order_by(DiagnosisResult.created_at.desc()).limit(limit).all()

        return [
            {
                "id": r.id,
                "patient_name": p.full_name,
                "diagnosis": r.diagnosis,
                "certainty": r.certainty,
                "is_urgent": r.is_urgent,
                "created_at": r.created_at.isoformat(),
                "assessed_by": u.name if u else "System",
                "status": "Reviewed" if r.reviewed_at else "Pending",
            }
            for r, p, u in rows
        ]

    @staticmethod
    def _risk_classification(range_start):
        q = db.session.query(
            DiagnosisResult.diagnosis,
            func.count(DiagnosisResult.id),
        ).group_by(DiagnosisResult.diagnosis)
        if range_start:
            q = q.filter(DiagnosisResult.created_at >= range_start)
        rows = q.all()

        risk_map = {"Normal Risk": 0, "Prediabetes": 0, "Diabetes": 0}
        for diag, count in rows:
            d = str(diag).lower()
            if ("high risk" in d) or ("diabetes" in d and "pre" not in d):
                risk_map["Diabetes"] += count
            elif "moderate" in d or "prediabetes" in d:
                risk_map["Prediabetes"] += count
            else:
                risk_map["Normal Risk"] += count

        if sum(risk_map.values()) == 0:
            return [{"name": "No Data", "value": 1, "fill": "#e2e8f0"}]

        return [
            {"name": "Normal Risk", "value": risk_map["Normal Risk"], "fill": "#0ea5e9"},
            {"name": "Prediabetes", "value": risk_map["Prediabetes"], "fill": "#f59e0b"},
            {"name": "Diabetes", "value": risk_map["Diabetes"], "fill": "#ef4444"},
        ]

    @staticmethod
    def _monthly_diagnosis_trend(range_start):
        """Group diagnoses by month for the area chart."""
        q = db.session.query(
            extract("year", DiagnosisResult.created_at).label("yr"),
            extract("month", DiagnosisResult.created_at).label("mo"),
            func.count(DiagnosisResult.id).label("diagnosed"),
            func.sum(
                func.cast(DiagnosisResult.reviewed_at.is_(None), db.Integer)
            ).label("pending"),
        ).group_by("yr", "mo").order_by("yr", "mo")

        if range_start:
            q = q.filter(DiagnosisResult.created_at >= range_start)

        month_names = [
            "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ]
        rows = q.all()
        if not rows:
            return []

        return [
            {
                "month": month_names[int(r.mo)],
                "diagnosed": int(r.diagnosed or 0),
                "pending": int(r.pending or 0),
            }
            for r in rows
        ]

    @staticmethod
    def _trend_text(current: int, previous: int, label: str) -> str:
        if previous == 0:
            if current == 0:
                return f"No data in {label}"
            return f"+{current} new"
        pct = round(((current - previous) / previous) * 100)
        sign = "+" if pct >= 0 else ""
        return f"{sign}{pct}% from {label}"
