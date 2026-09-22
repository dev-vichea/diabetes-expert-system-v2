from datetime import date

from flask import Blueprint, g, request

from app.dependencies import get_dashboard_service
from app.errors import ValidationError
from app.utils.api_response import success_response
from app.utils.auth import require_auth

dashboard_bp = Blueprint('dashboard', __name__)


def _parse_iso_date(value, field: str) -> date | None:
    """Parse a ``YYYY-MM-DD`` query parameter, raising on malformed input."""
    if value is None or not str(value).strip():
        return None
    try:
        return date.fromisoformat(str(value).strip()[:10])
    except ValueError as exc:
        raise ValidationError(f"'{field}' must be a date formatted as YYYY-MM-DD.") from exc


@dashboard_bp.get('/clinical')
@require_auth(permissions=["analytics.view", "patient.view"], permission_mode="any")
def get_clinical_dashboard():
    """Return clinical dashboard stats, optionally filtered by date range.

    Query parameters
    ----------------
    days : int, optional
        Restrict scoped metrics to the last *N* days.
        Supported presets on the frontend: 7, 30, 90, 365, or omitted (all-time).
    start, end : str, optional
        Custom reporting window as ``YYYY-MM-DD`` (``end`` is inclusive).
        Takes precedence over ``days`` when supplied.

    The payload also carries a ``doctor_workload`` block scoped to the
    signed-in clinician (pending sign-offs, urgent cases, personal activity).
    """
    days = request.args.get('days', default=None, type=int)
    start = _parse_iso_date(request.args.get('start'), 'start')
    end = _parse_iso_date(request.args.get('end'), 'end')

    if start and end and start > end:
        raise ValidationError("'end' must be on or after 'start'.")

    reviewer_user_id = None
    current_user = getattr(g, 'current_user', None) or {}
    raw_user_id = current_user.get('sub') or current_user.get('id')
    if raw_user_id is not None:
        try:
            reviewer_user_id = int(raw_user_id)
        except (TypeError, ValueError):
            reviewer_user_id = None

    stats = get_dashboard_service().get_clinical_stats(
        days=days,
        start=start,
        end=end,
        reviewer_user_id=reviewer_user_id,
    )
    return success_response(data=stats)
