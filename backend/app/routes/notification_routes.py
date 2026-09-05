from flask import Blueprint, g, request

from app.dependencies import get_notification_repository
from app.errors import NotFoundError, ValidationError
from app.utils.api_response import success_response
from app.utils.auth import require_auth

notification_bp = Blueprint("notifications", __name__)


def _current_user_id() -> int:
    if not g.current_user:
        raise ValidationError("User not authenticated.")
    user_id = g.current_user.get("sub")
    if not user_id:
        raise ValidationError("User ID missing from authentication context.")
    return int(user_id)


@notification_bp.get("")
@notification_bp.get("/")
@require_auth()
def list_notifications():
    user_id = _current_user_id()
    unread_only = request.args.get("unread_only", default="false", type=str).strip().lower() in ("true", "1", "yes")
    notification_type = request.args.get("type", default="", type=str).strip() or None
    limit = min(request.args.get("limit", default=50, type=int), 100)
    offset = max(request.args.get("offset", default=0, type=int), 0)

    repo = get_notification_repository()
    notifications = repo.list_for_user(
        user_id=user_id,
        unread_only=unread_only,
        notification_type=notification_type,
        limit=limit,
        offset=offset,
    )
    unread_count = repo.count_unread(user_id)
    total_count = repo.count_total(user_id)

    return success_response(
        data={
            "notifications": [repo.to_dict(n) for n in notifications],
            "unread_count": unread_count,
            "total": total_count,
        }
    )


@notification_bp.get("/unread-count")
@require_auth()
def get_unread_count():
    user_id = _current_user_id()
    repo = get_notification_repository()
    unread_count = repo.count_unread(user_id)
    return success_response(data={"unread_count": unread_count})


@notification_bp.patch("/<int:notification_id>/read")
@require_auth()
def mark_notification_as_read(notification_id: int):
    user_id = _current_user_id()
    repo = get_notification_repository()
    notification = repo.mark_as_read(notification_id, user_id)
    if not notification:
        raise NotFoundError("Notification not found.")

    unread_count = repo.count_unread(user_id)
    return success_response(
        data={
            "notification": repo.to_dict(notification),
            "unread_count": unread_count,
        },
        message="Notification marked as read.",
    )


@notification_bp.post("/mark-all-read")
@require_auth()
def mark_all_notifications_as_read():
    user_id = _current_user_id()
    repo = get_notification_repository()
    count = repo.mark_all_as_read(user_id)
    return success_response(
        data={"marked_count": count, "unread_count": 0},
        message=f"{count} notification(s) marked as read.",
    )


@notification_bp.delete("/<int:notification_id>")
@require_auth()
def delete_notification(notification_id: int):
    user_id = _current_user_id()
    repo = get_notification_repository()
    deleted = repo.delete(notification_id, user_id)
    if not deleted:
        raise NotFoundError("Notification not found.")

    unread_count = repo.count_unread(user_id)
    return success_response(
        data={"unread_count": unread_count},
        message="Notification deleted.",
    )


@notification_bp.delete("/clear-read")
@require_auth()
def clear_read_notifications():
    user_id = _current_user_id()
    repo = get_notification_repository()
    count = repo.delete_all_read(user_id)
    return success_response(
        data={"deleted_count": count},
        message="Read notifications cleared.",
    )
