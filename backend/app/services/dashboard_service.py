from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import extract, func

from app.extensions import db
from app.models.entities import AssessmentSession, DiagnosisResult, Patient, Rule, User


class DashboardService:
    """Compute real-time clinical dashboard metrics with optional date-range filtering."""

    # ------------------------------------------------------------------ #
    #  Public API                                                         #
    # ------------------------------------------------------------------ #

    def get_clinical_stats(
        self,
        *,
        days: int | None = None,
        start: date | datetime | None = None,
        end: date | datetime | None = None,
        reviewer_user_id: int | None = None,
    ) -> dict:
        """Return dashboard payload.

        ``days`` narrows *scoped* metrics (assessments, treatment plans,
        recent cases, risk-classification) to the last N days.  An explicit
        ``start``/``end`` pair narrows them to a custom window instead (``end``
        is inclusive for the whole day) and takes precedence over ``days``.
        Counts like *total patients* and *urgent (un-reviewed)* are always
        global.  ``reviewer_user_id`` personalises the ``doctor_workload``
        block for the signed-in clinician.
        """
        now = datetime.now(UTC).replace(tzinfo=None)

        # --- date boundaries ------------------------------------------------
        range_start, range_end = self._resolve_bounds(days=days, start=start, end=end, now=now)
        window_days = self._window_days(range_start, range_end, days)

        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_start = today_start - timedelta(days=1)
        prev_range_start = (
            (range_start - timedelta(days=window_days))
            if range_start and window_days
            else None
        )

        # --- KPI cards -------------------------------------------------------
        assessments = self._count_assessments(range_start, range_end, now, yesterday_start, today_start, prev_range_start, window_days)
        active_patients = self._count_patients()
        urgent_cases = self._count_urgent()
        treatment_plans = self._count_treatments(range_start, range_end)

        # --- Recent cases table ----------------------------------------------
        recent_cases = self._recent_cases(range_start, range_end)

        # --- Risk classification pie chart -----------------------------------
        risk_classification = self._risk_classification(range_start, range_end)

        # --- Monthly trend area chart ----------------------------------------
        monthly_trend = self._throughput_trend(range_start, range_end, window_days, now)

        # --- Rules analytics ------------------------------------------------
        rules_analytics = self._rules_analytics(range_start, range_end)

        # --- Signed-in clinician workload ------------------------------------
        doctor_workload = self._doctor_workload(range_start, range_end, reviewer_user_id)

        return {
            "assessments": assessments,
            "active_patients": active_patients,
            "urgent_cases": urgent_cases,
            "treatment_plans": treatment_plans,
            "recent_cases": recent_cases,
            "risk_classification": risk_classification,
            "monthly_trend": monthly_trend,
            "rules_analytics": rules_analytics,
            "doctor_workload": doctor_workload,
            "range": {
                "days": days if days and days > 0 else None,
                "start": range_start.isoformat() if range_start else None,
                "end": (range_end or now).isoformat(),
                "is_custom": bool(start is not None or end is not None),
            },
        }

    # ------------------------------------------------------------------ #
    #  Private helpers                                                    #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _as_date(value):
        """Coerce a query-string / ``datetime`` / ``date`` value into a ``date``."""
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        return date.fromisoformat(str(value).strip()[:10])

    @classmethod
    def _resolve_bounds(cls, *, days, start, end, now):
        """Normalise preset/custom filters into an effective ``(start, end)`` window.

        ``None`` means *unbounded*, which preserves the original all-time
        behaviour.  A custom ``end`` covers the whole day (23:59:59.999999).
        """
        if start is not None or end is not None:
            range_start = datetime.combine(cls._as_date(start), time.min) if start is not None else None
            range_end = datetime.combine(cls._as_date(end), time.max) if end is not None else now
            return range_start, range_end

        if days and days > 0:
            range_start = (now - timedelta(days=days)).replace(hour=0, minute=0, second=0, microsecond=0)
            return range_start, None

        return None, None

    @classmethod
    def _window_days(cls, range_start, range_end, days):
        """Length of the active window in days (drives trend labels and buckets)."""
        if days and days > 0:
            return days
        if range_start and range_end:
            return max(1, (cls._as_date(range_end) - cls._as_date(range_start)).days + 1)
        return None

    @staticmethod
    def _count_assessments(range_start, range_end, now, yesterday_start, today_start, prev_range_start, days):
        """Build assessments KPI with trend text."""
        q = db.session.query(func.count(AssessmentSession.id))
        today_count = (
            db.session.query(func.count(AssessmentSession.id))
            .filter(AssessmentSession.created_at >= today_start)
            .scalar()
            or 0
        )
        if range_start:
            scoped = q.filter(AssessmentSession.created_at >= range_start)
            if range_end:
                scoped = scoped.filter(AssessmentSession.created_at <= range_end)
            count = scoped.scalar() or 0
            # compare to the same-length previous window
            prev_count = 0
            if prev_range_start:
                prev_count = q.filter(
                    AssessmentSession.created_at >= prev_range_start,
                    AssessmentSession.created_at < range_start,
                ).scalar() or 0
            trend = DashboardService._trend_text(count, prev_count, f"prev {days}d")
        else:
            if range_end:
                q = q.filter(AssessmentSession.created_at <= range_end)
            count = q.scalar() or 0
            if today_count > 0:
                trend = f"+{today_count} today"
            else:
                trend = "Total conducted"

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
    def _doctor_workload(range_start, range_end, reviewer_user_id):
        """Personal queue metrics for the signed-in clinician.

        ``pending_reviews`` / ``urgent_pending`` are keyed on *creation* date
        (what landed in the window and still needs a signature), while
        ``reviewed_by_me`` is keyed on the *review* date so sign-offs performed
        inside the window are counted even for older assessments.
        """
        def scoped(query, column):
            if range_start:
                query = query.filter(column >= range_start)
            if range_end:
                query = query.filter(column <= range_end)
            return query

        pending = scoped(
            db.session.query(func.count(DiagnosisResult.id)).filter(
                DiagnosisResult.reviewed_at.is_(None)
            ),
            DiagnosisResult.created_at,
        ).scalar() or 0

        urgent_pending = scoped(
            db.session.query(func.count(DiagnosisResult.id)).filter(
                DiagnosisResult.reviewed_at.is_(None),
                DiagnosisResult.is_urgent == True,  # noqa: E712
            ),
            DiagnosisResult.created_at,
        ).scalar() or 0

        reviewed_by_me = 0
        assessed_by_me = 0
        if reviewer_user_id:
            reviewed_by_me = scoped(
                db.session.query(func.count(DiagnosisResult.id)).filter(
                    DiagnosisResult.reviewed_by_user_id == reviewer_user_id
                ),
                DiagnosisResult.reviewed_at,
            ).scalar() or 0

            assessed_by_me = scoped(
                db.session.query(func.count(DiagnosisResult.id)).filter(
                    DiagnosisResult.diagnosed_by_user_id == reviewer_user_id
                ),
                DiagnosisResult.created_at,
            ).scalar() or 0

        closed = int(reviewed_by_me) + int(pending)
        signoff_share = round((int(reviewed_by_me) / closed) * 100) if closed else 0

        return {
            "pending_reviews": int(pending),
            "urgent_pending": int(urgent_pending),
            "reviewed_by_me": int(reviewed_by_me),
            "assessed_by_me": int(assessed_by_me),
            "signoff_share": int(signoff_share),
        }

    @staticmethod
    def _count_treatments(range_start, range_end=None):
        q = db.session.query(func.count(DiagnosisResult.id)).filter(
            DiagnosisResult.recommendation.isnot(None),
            DiagnosisResult.recommendation != "",
        )
        if range_start:
            q = q.filter(DiagnosisResult.created_at >= range_start)
        if range_end:
            q = q.filter(DiagnosisResult.created_at <= range_end)
        count = q.scalar() or 0
        return {"value": count, "trend": "Recommendations issued"}

    @staticmethod
    def _recent_cases(range_start, range_end=None, limit: int = 10):
        q = (
            db.session.query(DiagnosisResult, Patient, User)
            .join(Patient, DiagnosisResult.patient_id == Patient.id)
            .outerjoin(User, DiagnosisResult.diagnosed_by_user_id == User.id)
        )
        if range_start:
            q = q.filter(DiagnosisResult.created_at >= range_start)
        if range_end:
            q = q.filter(DiagnosisResult.created_at <= range_end)
        rows = q.order_by(DiagnosisResult.created_at.desc()).limit(limit).all()

        return [
            {
                "id": r.id,
                "patient_name": p.full_name,
                "diagnosis": r.diagnosis,
                "recommendation": r.recommendation,
                "has_care_plan": bool(r.recommendation and str(r.recommendation).strip()),
                "certainty": r.certainty,
                "is_urgent": r.is_urgent,
                "created_at": r.created_at.isoformat(),
                "assessed_by": u.name if u else "System",
                "status": "Reviewed" if r.reviewed_at else "Pending",
            }
            for r, p, u in rows
        ]

    @staticmethod
    def _risk_classification(range_start, range_end=None):
        q = db.session.query(
            DiagnosisResult.diagnosis,
            func.count(DiagnosisResult.id),
        ).group_by(DiagnosisResult.diagnosis)
        if range_start:
            q = q.filter(DiagnosisResult.created_at >= range_start)
        if range_end:
            q = q.filter(DiagnosisResult.created_at <= range_end)
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
    def _throughput_trend(range_start, range_end, days, now):
        """Build continuous clinical throughput trend for area chart.

        - If days <= 30 (e.g. 7 or 30 days): builds a continuous daily timeline
          (e.g., 'Aug 30', 'Aug 31', 'Sep 01'...) so short periods show rich daily movement.
        - If days > 30 or days is None (All Time, 90d, 365d): builds a continuous
          rolling monthly timeline of at least 6 months up to the current month
          (e.g., 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep').

        Guarantees that multiple data points are ALWAYS present so an AreaChart never
        renders an isolated single dot.
        """
        month_names = [
            "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ]

        anchor = range_end or now

        if days and days <= 30:
            start_date = (anchor - timedelta(days=days - 1)).date()
            start_dt = datetime.combine(start_date, datetime.min.time())
            day_filters = [DiagnosisResult.created_at >= start_dt]
            if range_end:
                day_filters.append(DiagnosisResult.created_at <= range_end)

            q = (
                db.session.query(
                    extract("year", DiagnosisResult.created_at).label("yr"),
                    extract("month", DiagnosisResult.created_at).label("mo"),
                    extract("day", DiagnosisResult.created_at).label("dy"),
                    func.count(DiagnosisResult.id).label("diagnosed"),
                    func.sum(
                        func.cast(DiagnosisResult.reviewed_at.is_(None), db.Integer)
                    ).label("pending"),
                )
                .filter(*day_filters)
                .group_by("yr", "mo", "dy")
                .all()
            )

            counts = {
                (int(r.yr), int(r.mo), int(r.dy)): (
                    int(r.diagnosed or 0),
                    int(r.pending or 0),
                )
                for r in q
            }

            trend = []
            for i in range(days):
                d = start_date + timedelta(days=i)
                diag, pend = counts.get((d.year, d.month, d.day), (0, 0))
                trend.append({
                    "month": d.strftime("%b %d"),
                    "diagnosed": diag,
                    "pending": pend,
                    "reviewed": max(0, diag - pend),
                })
            return trend

        # Monthly timeline: rolling window of at least 6 months up to current month
        num_months = 12 if (days and days >= 365) else 6
        months = []
        curr_y = anchor.year
        curr_m = anchor.month
        for i in range(num_months - 1, -1, -1):
            m = curr_m - i
            y = curr_y
            while m <= 0:
                m += 12
                y -= 1
            months.append((y, m))

        earliest_y, earliest_m = months[0]
        earliest_dt = datetime(earliest_y, earliest_m, 1)

        month_filters = []
        if range_end:
            month_filters.append(DiagnosisResult.created_at <= range_end)

        q = (
            db.session.query(
                extract("year", DiagnosisResult.created_at).label("yr"),
                extract("month", DiagnosisResult.created_at).label("mo"),
                func.count(DiagnosisResult.id).label("diagnosed"),
                func.sum(
                    func.cast(DiagnosisResult.reviewed_at.is_(None), db.Integer)
                ).label("pending"),
            )
            .filter(DiagnosisResult.created_at >= earliest_dt, *month_filters)
            .group_by("yr", "mo")
            .all()
        )

        counts = {
            (int(r.yr), int(r.mo)): (
                int(r.diagnosed or 0),
                int(r.pending or 0),
            )
            for r in q
        }

        trend = []
        for y, m in months:
            diag, pend = counts.get((y, m), (0, 0))
            trend.append({
                "month": month_names[m],
                "diagnosed": diag,
                "pending": pend,
                "reviewed": max(0, diag - pend),
            })
        return trend

    @staticmethod
    def _trend_text(current: int, previous: int, label: str) -> str:
        if previous == 0:
            if current == 0:
                return f"No data in {label}"
            return f"+{current} new"
        pct = round(((current - previous) / previous) * 100)
        sign = "+" if pct >= 0 else ""
        return f"{sign}{pct}% from {label}"

    @staticmethod
    def _rules_analytics(range_start, range_end=None):
        total_rules = db.session.query(func.count(Rule.id)).scalar() or 0
        active_rules = (
            db.session.query(func.count(Rule.id))
            .filter(Rule.status == "active")
            .scalar()
            or 0
        )

        cat_counts = (
            db.session.query(Rule.category, func.count(Rule.id))
            .group_by(Rule.category)
            .all()
        )
        cat_colors = {
            "diagnosis": "#f43f5e",
            "triage": "#f59e0b",
            "classification": "#06b6d4",
            "recommendation": "#10b981",
        }
        rule_distribution = [
            {
                "name": str(cat or "Other").capitalize(),
                "value": int(count),
                "color": cat_colors.get(str(cat or "").lower(), "#8b5cf6"),
            }
            for cat, count in cat_counts
        ]

        q = db.session.query(DiagnosisResult)
        if range_start:
            q = q.filter(DiagnosisResult.created_at >= range_start)
        if range_end:
            q = q.filter(DiagnosisResult.created_at <= range_end)
        diagnoses = q.order_by(DiagnosisResult.created_at.desc()).limit(300).all()

        n = len(diagnoses)
        total_triggered = 0
        rule_hits = {}
        cert_sum = 0.0

        for d in diagnoses:
            rules = d.triggered_rules_json or []
            total_triggered += len(rules)
            cert_sum += float(d.certainty or 0.0)
            for r in rules:
                code = r.get("code") or r.get("id") or r.get("name")
                if not code:
                    continue
                name = r.get("name") or code
                category = r.get("category") or "diagnosis"
                if code not in rule_hits:
                    rule_hits[code] = {
                        "id": code,
                        "name": name,
                        "category": category,
                        "hits": 0,
                    }
                rule_hits[code]["hits"] += 1

        avg_rules = round(total_triggered / n, 1) if n > 0 else 0.0
        avg_accuracy = round((cert_sum / n) * 100, 1) if n > 0 else 0.0

        all_rules = db.session.query(Rule).all()
        rule_models = {r.code: r for r in all_rules}

        top_rules = []
        for rank_idx, (code, data) in enumerate(
            sorted(rule_hits.items(), key=lambda x: x[1]["hits"], reverse=True)[:5],
            start=1,
        ):
            rule_obj = rule_models.get(code)
            top_rules.append({
                "id": rank_idx,
                "name": (rule_obj.name if rule_obj else data["name"]),
                "category": (rule_obj.category if rule_obj else data["category"]),
                "hits": data["hits"],
            })

        exec_points = []
        rule_points = []
        acc_points = []

        if diagnoses:
            chronological = list(reversed(diagnoses))
            chunk_size = max(1, len(chronological) // 5)
            for i in range(0, len(chronological), chunk_size):
                chunk = chronological[i : i + chunk_size]
                if not chunk:
                    continue
                chunk_rules = sum(len(c.triggered_rules_json or []) for c in chunk)
                chunk_avg = round(chunk_rules / len(chunk), 1)
                chunk_cert = round(
                    sum(float(c.certainty or 0.0) for c in chunk) / len(chunk) * 100, 1
                )
                exec_points.append({"value": len(chunk)})
                rule_points.append({"value": chunk_avg})
                acc_points.append({"value": chunk_cert})

        if not exec_points:
            exec_points = [{"value": 0}]
        if not rule_points:
            rule_points = [{"value": avg_rules}]
        if not acc_points:
            acc_points = [{"value": avg_accuracy}]

        return {
            "active_rules": {
                "value": str(active_rules),
                "total": total_rules,
                "trend": f"{active_rules} active of {total_rules} rules",
                "chart_data": [{"value": active_rules}] * 5,
            },
            "avg_rules": {
                "value": str(avg_rules),
                "trend": f"Avg over {n} evaluations" if n > 0 else "No evaluations yet",
                "chart_data": rule_points,
            },
            "accuracy": {
                "value": f"{avg_accuracy}%",
                "trend": f"Mean certainty ({n} cases)" if n > 0 else "No evaluations yet",
                "chart_data": acc_points,
            },
            "executions": {
                "chart_data": exec_points,
            },
            "rule_distribution": rule_distribution,
            "top_triggered_rules": top_rules,
        }
