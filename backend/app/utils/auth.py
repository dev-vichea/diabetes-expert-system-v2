from functools import wraps

from flask import g, request

from app.dependencies import get_auth_service
from app.errors import ForbiddenError, UnauthorizedError


def require_auth(roles=None, permissions=None):
    roles = roles or []
    permissions = permissions or []

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                raise UnauthorizedError("Missing bearer token.")

            token = auth_header.split(" ", 1)[1].strip()
            if not token:
                raise UnauthorizedError("Missing bearer token.")

            user = get_auth_service().decode_access_token(token)
            token_roles = set(user.get("roles") or [user.get("role")])
            token_permissions = set(user.get("permissions") or [])

            if roles and token_roles.isdisjoint(set(roles)):
                raise ForbiddenError("You do not have the required role.")

            missing_permissions = [permission for permission in permissions if permission not in token_permissions]
            if missing_permissions:
                raise ForbiddenError(
                    "You do not have the required permission(s).",
                )

            g.current_user = user
            return fn(*args, **kwargs)

        return wrapper

    return decorator
