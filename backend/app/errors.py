from dataclasses import dataclass

from flask import current_app, jsonify
from werkzeug.exceptions import HTTPException


@dataclass
class ApiError(Exception):
    status_code: int
    code: str
    message: str
    details: dict | None = None


class ValidationError(ApiError):
    def __init__(self, message: str, details: dict | None = None):
        super().__init__(status_code=400, code="validation_error", message=message, details=details)


class UnauthorizedError(ApiError):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(status_code=401, code="unauthorized", message=message)


class ForbiddenError(ApiError):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(status_code=403, code="forbidden", message=message)


class NotFoundError(ApiError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(status_code=404, code="not_found", message=message)


def _error_payload(code: str, message: str, details: dict | None = None):
    payload = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
        },
    }
    if details:
        payload["error"]["details"] = details
    return payload


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(error: ApiError):
        return jsonify(_error_payload(error.code, error.message, error.details)), error.status_code

    @app.errorhandler(HTTPException)
    def handle_http_error(error: HTTPException):
        return jsonify(_error_payload(code=error.name.lower().replace(" ", "_"), message=error.description)), error.code

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        current_app.logger.exception("Unhandled server error", exc_info=error)
        return jsonify(_error_payload(code="internal_server_error", message="An unexpected server error occurred.")), 500
