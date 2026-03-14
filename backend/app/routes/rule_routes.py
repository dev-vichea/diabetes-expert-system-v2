from flask import Blueprint, g, request

from app.dependencies import get_rule_service
from app.utils.api_response import success_response
from app.utils.auth import require_auth

rule_bp = Blueprint("rules", __name__)


@rule_bp.get("/categories")
@require_auth(permissions=["rule.view"])
def get_rule_categories():
    categories = get_rule_service().list_categories()
    return success_response(data=categories)


@rule_bp.get("/")
@require_auth(permissions=["rule.view"])
def get_rules():
    category = request.args.get("category", default="", type=str).strip() or None
    status = request.args.get("status", default="", type=str).strip() or None
    include_archived = _parse_bool(request.args.get("include_archived", default="false", type=str))

    rules = get_rule_service().list_rules(
        category=category,
        status=status,
        include_archived=include_archived,
    )
    return success_response(data=rules)


@rule_bp.post("/")
@require_auth(permissions=["rule.manage"])
def create_rule():
    payload = request.get_json(silent=True) or {}
    created_by_user_id = int(g.current_user.get("sub")) if g.current_user.get("sub") else None
    new_rule = get_rule_service().create_rule(payload, created_by_user_id=created_by_user_id)
    return success_response(data=new_rule, message="Rule created.", status_code=201)


@rule_bp.get("/<int:rule_id>")
@require_auth(permissions=["rule.view"])
def get_rule(rule_id: int):
    rule = get_rule_service().get_rule(rule_id)
    return success_response(data=rule)


@rule_bp.patch("/<int:rule_id>")
@require_auth(permissions=["rule.manage"])
def update_rule(rule_id: int):
    payload = request.get_json(silent=True) or {}
    actor_user_id = int(g.current_user.get("sub")) if g.current_user.get("sub") else None
    updated_rule = get_rule_service().update_rule(rule_id, payload, actor_user_id=actor_user_id)
    return success_response(data=updated_rule, message="Rule updated.")


@rule_bp.delete("/<int:rule_id>")
@require_auth(permissions=["rule.manage"])
def archive_rule(rule_id: int):
    actor_user_id = int(g.current_user.get("sub")) if g.current_user.get("sub") else None
    archived_rule = get_rule_service().archive_rule(rule_id, actor_user_id=actor_user_id)
    return success_response(data=archived_rule, message="Rule archived.")


@rule_bp.get("/<int:rule_id>/versions")
@require_auth(permissions=["rule.view"])
def get_rule_versions(rule_id: int):
    limit = request.args.get("limit", default=50, type=int)
    versions = get_rule_service().list_rule_versions(rule_id, limit=limit)
    return success_response(data=versions)


@rule_bp.get("/<int:rule_id>/audit")
@require_auth(permissions=["rule.view"])
def get_rule_audit_logs(rule_id: int):
    limit = request.args.get("limit", default=100, type=int)
    logs = get_rule_service().list_rule_audit_logs(rule_id, limit=limit)
    return success_response(data=logs)


def _parse_bool(value: str) -> bool:
    normalized = str(value or "").strip().lower()
    return normalized in {"1", "true", "yes", "on", "y"}
