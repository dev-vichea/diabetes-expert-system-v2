from flask import Blueprint, request

from app.dependencies import get_dashboard_service
from app.utils.api_response import success_response
from app.utils.auth import require_auth

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.get('/clinical')
@require_auth()
def get_clinical_dashboard():
    """Return clinical dashboard stats, optionally filtered by date range.

    Query parameters
    ----------------
    days : int, optional
        Restrict scoped metrics to the last *N* days.
        Supported presets on the frontend: 7, 30, 90, 365, or omitted (all-time).
    """
    days = request.args.get('days', default=None, type=int)
    stats = get_dashboard_service().get_clinical_stats(days=days)
    return success_response(data=stats)
