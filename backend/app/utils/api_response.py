import math
from flask import jsonify


def success_response(data=None, message: str | None = None, status_code: int = 200):
    payload = {"success": True, "data": data if data is not None else {}}
    if message:
        payload["message"] = message
    return jsonify(payload), status_code


def paginated_response(items: list, page: int, limit: int, total: int, message: str | None = None, status_code: int = 200):
    safe_limit = max(1, limit) if limit else 20
    safe_page = max(1, page) if page else 1
    total_pages = math.ceil(total / safe_limit) if total > 0 else 1
    payload = {
        "success": True,
        "data": items,
        "page": safe_page,
        "limit": safe_limit,
        "total": total,
        "total_pages": total_pages,
    }
    if message:
        payload["message"] = message
    return jsonify(payload), status_code

