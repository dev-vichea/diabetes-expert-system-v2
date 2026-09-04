from flask import Blueprint, g, request, send_from_directory

from app.dependencies import get_auth_service
from app.errors import ValidationError
from app.extensions import limiter
from app.utils.api_response import success_response
from app.utils.auth import require_auth

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/login")
@limiter.limit("10 per minute")
def login():
    payload = request.get_json(silent=True) or {}
    result = get_auth_service().login(
        email=str(payload.get("email", "")).strip(),
        password=str(payload.get("password", "")),
    )
    return success_response(data=result, message="Login successful.")


@auth_bp.post("/register")
@limiter.limit("5 per minute")
def register():
    payload = request.get_json(silent=True) or {}
    result = get_auth_service().register(payload)
    return success_response(data=result, message="Registration successful.", status_code=201)


@auth_bp.post("/refresh")
@limiter.limit("20 per minute")
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
    # JWT claims can go stale (e.g. profile completed after the token was issued),
    # so /me always re-serialize the current user from the database.
    user_id = g.current_user.get("sub") or g.current_user.get("id")
    fresh_user = get_auth_service().get_fresh_user(user_id)
    return success_response(data=fresh_user or g.current_user)


@auth_bp.patch("/me")
@require_auth()
def update_my_profile():
    payload = request.get_json(silent=True) or {}
    user_id = int(g.current_user.get("sub") or g.current_user.get("id"))
    updated_user = get_auth_service().update_profile(user_id, payload)
    return success_response(data=updated_user, message="Profile updated successfully.")


@auth_bp.post("/avatar")
@require_auth()
def upload_avatar():
    if "file" not in request.files:
        raise ValidationError("No file uploaded in the request.")
    file = request.files["file"]
    user_id = int(g.current_user.get("sub") or g.current_user.get("id"))
    updated_user = get_auth_service().save_avatar(user_id, file)
    return success_response(data=updated_user, message="Profile picture updated.")


@auth_bp.delete("/avatar")
@require_auth()
def delete_avatar():
    user_id = int(g.current_user.get("sub") or g.current_user.get("id"))
    updated_user = get_auth_service().delete_avatar(user_id)
    return success_response(data=updated_user, message="Profile picture removed.")


@auth_bp.get("/avatar/<path:filename>")
def serve_avatar(filename):
    avatar_dir = get_auth_service().get_avatar_dir()
    return send_from_directory(str(avatar_dir), filename)
