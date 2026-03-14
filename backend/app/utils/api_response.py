from flask import jsonify


def success_response(data=None, message: str | None = None, status_code: int = 200):
    payload = {"success": True, "data": data if data is not None else {}}
    if message:
        payload["message"] = message
    return jsonify(payload), status_code
