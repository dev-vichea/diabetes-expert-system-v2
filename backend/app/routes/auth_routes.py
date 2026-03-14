from flask import Blueprint, g, request

from app.dependencies import get_auth_service
from app.utils.api_response import success_response
from app.utils.auth import require_auth

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    result = get_auth_service().login(
        email=str(payload.get("email", "")).strip(),
        password=str(payload.get("password", "")),
    )
    return success_response(data=result, message="Login successful.")


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    result = get_auth_service().register(payload)
    return success_response(data=result, message="Registration successful.", status_code=201)


@auth_bp.post("/refresh")
def refresh():
    payload = request.get_json(silent=True) or {}
    result = get_auth_service().refresh(str(payload.get("refresh_token", "")).strip())
    return success_response(data=result, message="Token refreshed.")


@auth_bp.post("/logout")
@require_auth()
def logout():
    payload = request.get_json(silent=True) or {}

    auth_header = request.headers.get("Authorization", "")
    access_token = auth_header.split(" ", 1)[1].strip() if auth_header.startswith("Bearer ") else None
    refresh_token = str(payload.get("refresh_token", "")).strip() or None

    actor_user_id = int(g.current_user.get("sub")) if g.current_user and g.current_user.get("sub") else None
    get_auth_service().logout(
        access_token=access_token,
        refresh_token=refresh_token,
        actor_user_id=actor_user_id,
    )
    return success_response(data={}, message="Logged out.")


@auth_bp.get("/me")
@require_auth()
def me():
    return success_response(data=g.current_user)
