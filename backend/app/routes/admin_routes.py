from flask import Blueprint, g, request

from app.dependencies import get_admin_service
from app.errors import ValidationError
from app.utils.api_response import success_response
from app.utils.auth import require_auth

admin_bp = Blueprint('admin', __name__)


@admin_bp.get('/users')
@require_auth(permissions=['user.view'])
def list_users():
    search = request.args.get('search', default='', type=str).strip() or None
    role = request.args.get('role', default='', type=str).strip() or None
    status = request.args.get('status', default='', type=str).strip() or None
    limit = request.args.get('limit', default=200, type=int)

    safe_users = get_admin_service().list_users(
        search=search,
        role=role,
        status=status,
        limit=limit,
    )
    return success_response(data=safe_users)


@admin_bp.get('/users/<int:user_id>')
@require_auth(permissions=['user.view'])
def get_user(user_id: int):
    user = get_admin_service().get_user(user_id)
    return success_response(data=user)


@admin_bp.post('/users')
@require_auth(permissions=['user.manage'])
def create_user():
    payload = request.get_json(silent=True) or {}
    actor_user_id = _current_actor_user_id()
    user = get_admin_service().create_user(
        payload,
        actor_user_id=actor_user_id,
        actor_claims=_current_actor_claims(),
    )
    return success_response(data=user, message='User created.', status_code=201)


@admin_bp.patch('/users/<int:user_id>')
@require_auth(permissions=['user.manage'])
def update_user(user_id: int):
    payload = request.get_json(silent=True) or {}
    actor_user_id = _current_actor_user_id()
    user = get_admin_service().update_user(
        user_id=user_id,
        payload=payload,
        actor_user_id=actor_user_id,
        actor_claims=_current_actor_claims(),
    )
    return success_response(data=user, message='User updated.')


@admin_bp.patch('/users/<int:user_id>/status')
@require_auth(permissions=['user.manage'])
def update_user_status(user_id: int):
    payload = request.get_json(silent=True) or {}
    actor_user_id = _current_actor_user_id()
    is_active = _parse_required_bool(payload.get('is_active'), field_name='is_active')

    user = get_admin_service().update_user_status(
        user_id=user_id,
        is_active=is_active,
        actor_user_id=actor_user_id,
        actor_claims=_current_actor_claims(),
    )
    return success_response(data=user, message='User status updated.')


@admin_bp.get('/roles')
@require_auth(permissions=['permission.view'])
def list_roles():
    roles = get_admin_service().list_roles()
    return success_response(data=roles)


@admin_bp.post('/roles')
@require_auth(permissions=['permission.manage'])
def create_role():
    payload = request.get_json(silent=True) or {}
    actor_user_id = _current_actor_user_id()
    role = get_admin_service().create_role(payload, actor_user_id=actor_user_id)
    return success_response(data=role, message='Role created.', status_code=201)


@admin_bp.patch('/roles/<int:role_id>')
@require_auth(permissions=['permission.manage'])
def update_role(role_id: int):
    payload = request.get_json(silent=True) or {}
    actor_user_id = _current_actor_user_id()
    role = get_admin_service().update_role(
        role_id=role_id,
        payload=payload,
        actor_user_id=actor_user_id,
    )
    return success_response(data=role, message='Role updated.')


@admin_bp.get('/permissions')
@require_auth(permissions=['permission.view'])
def list_permissions():
    permissions = get_admin_service().list_permissions()
    return success_response(data=permissions)


@admin_bp.patch('/users/<int:user_id>/roles')
@require_auth(permissions=['user.manage', 'permission.manage'])
def update_user_roles(user_id: int):
    payload = request.get_json(silent=True) or {}
    roles = payload.get('roles', [])
    actor_user_id = _current_actor_user_id()

    user = get_admin_service().update_user_roles(
        user_id=user_id,
        role_names=roles,
        actor_user_id=actor_user_id,
        actor_claims=_current_actor_claims(),
    )
    return success_response(data=user, message='User roles updated.')


@admin_bp.patch('/users/<int:user_id>/access-profile')
@require_auth(permissions=['user.manage', 'permission.manage'])
def save_user_access_profile(user_id: int):
    payload = request.get_json(silent=True) or {}
    actor_user_id = _current_actor_user_id()
    user = get_admin_service().save_user_access_profile(
        user_id=user_id,
        payload=payload,
        actor_user_id=actor_user_id,
        actor_claims=_current_actor_claims(),
    )
    return success_response(data=user, message='User access profile updated.')


@admin_bp.get('/audit-logs')
@require_auth(permissions=['user.view'])
def list_audit_logs():
    action = request.args.get('action', default='', type=str).strip() or None
    entity_type = request.args.get('entity_type', default='', type=str).strip() or None
    entity_id = request.args.get('entity_id', default='', type=str).strip() or None
    actor_user_id = request.args.get('actor_user_id', default=None, type=int)
    limit = request.args.get('limit', default=100, type=int)

    logs = get_admin_service().list_audit_logs(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        actor_user_id=actor_user_id,
        limit=limit,
    )
    return success_response(data=logs)


@admin_bp.get('/activity')
@require_auth(permissions=['user.view'])
def get_activity_overview():
    days = request.args.get('days', default=7, type=int)
    limit = request.args.get('limit', default=50, type=int)
    overview = get_admin_service().get_activity_overview(days=days, limit=limit)
    return success_response(data=overview)


@admin_bp.get('/stats')
@require_auth(permissions=['user.view', 'permission.view'])
def get_system_stats():
    stats = get_admin_service().get_system_stats()
    return success_response(data=stats)


def _current_actor_user_id() -> int | None:
    if not g.current_user:
        return None
    user_id = g.current_user.get('sub')
    if not user_id:
        return None
    return int(user_id)


def _current_actor_claims() -> dict | None:
    if not g.current_user:
        return None
    return g.current_user


def _parse_required_bool(value, *, field_name: str) -> bool:
    if isinstance(value, bool):
        return value

    normalized = str(value or '').strip().lower()
    if normalized in {'1', 'true', 'yes', 'y', 'on'}:
        return True
    if normalized in {'0', 'false', 'no', 'n', 'off'}:
        return False

    raise ValidationError(f'{field_name} must be a boolean.')
