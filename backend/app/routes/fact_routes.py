from flask import Blueprint, g, request

from app.dependencies import get_fact_service
from app.utils.api_response import success_response
from app.utils.auth import require_auth

fact_bp = Blueprint("facts", __name__)


@fact_bp.get("/")
@require_auth(permissions=["rule.view"])
def list_facts():
    facts = get_fact_service().list_facts(
        category=request.args.get("category", default="", type=str).strip() or None,
        status=request.args.get("status", default="", type=str).strip() or None,
        search=request.args.get("search", default="", type=str).strip() or None,
    )
    return success_response(data=facts)


@fact_bp.post("/")
@require_auth(permissions=["rule.manage"])
def create_fact():
    payload = request.get_json(silent=True) or {}
    actor_user_id = int(g.current_user.get("sub")) if g.current_user.get("sub") else None
    created = get_fact_service().create_fact(payload, actor_user_id=actor_user_id)
    return success_response(data=created, message="Fact created.", status_code=201)


@fact_bp.get("/<int:fact_id>")
@require_auth(permissions=["rule.view"])
def get_fact(fact_id: int):
    return success_response(data=get_fact_service().get_fact(fact_id))


@fact_bp.patch("/<int:fact_id>")
@require_auth(permissions=["rule.manage"])
def update_fact(fact_id: int):
    payload = request.get_json(silent=True) or {}
    actor_user_id = int(g.current_user.get("sub")) if g.current_user.get("sub") else None
    updated = get_fact_service().update_fact(fact_id, payload, actor_user_id=actor_user_id)
    return success_response(data=updated, message="Fact updated.")


@fact_bp.delete("/<int:fact_id>")
@require_auth(permissions=["rule.manage"])
def deactivate_fact(fact_id: int):
    """Facts are deactivated rather than deleted — rules and saved reports
    keep referencing their keys."""
    actor_user_id = int(g.current_user.get("sub")) if g.current_user.get("sub") else None
    updated = get_fact_service().set_fact_active(fact_id, False, actor_user_id=actor_user_id)
    return success_response(data=updated, message="Fact deactivated.")
