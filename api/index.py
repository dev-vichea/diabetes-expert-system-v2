import os
import sys
import traceback
from pathlib import Path
from flask import Flask, jsonify

CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
BACKEND_DIR = ROOT_DIR / "backend"

# Attempt to load local environment files if present
try:
    from dotenv import load_dotenv
    load_dotenv(ROOT_DIR / ".env")
    load_dotenv(BACKEND_DIR / ".env")
except ImportError:
    pass

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


class VercelPathFixMiddleware:
    """WSGI middleware ensuring Flask receives the intended route under Vercel rewrites."""

    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        matched_path = (
            environ.get("HTTP_X_MATCHED_PATH")
            or environ.get("HTTP_X_FORWARDED_URI")
            or environ.get("REQUEST_URI")
        )
        if matched_path:
            clean_path = matched_path.split("?")[0]
            if clean_path in ("/api/index.py", "/api/index", "/api/index.html", "/api/"):
                environ["PATH_INFO"] = "/api"
            else:
                environ["PATH_INFO"] = clean_path
        else:
            path_info = environ.get("PATH_INFO", "")
            if path_info in ("/api/index.py", "/api/index", "/api/"):
                environ["PATH_INFO"] = "/api"

        return self.wsgi_app(environ, start_response)


try:
    from app import create_app
    app = create_app()

    @app.get("/api")
    @app.get("/api/")
    @app.get("/api/index")
    @app.get("/api/index.py")
    def api_root():
        return jsonify({
            "success": True,
            "data": {
                "name": "Diabetes Expert System API",
                "version": "2.0",
                "status": "online"
            }
        })

    @app.get("/api/health")
    def api_health():
        return jsonify({
            "success": True,
            "data": {
                "status": "ok"
            }
        })

    app.wsgi_app = VercelPathFixMiddleware(app.wsgi_app)

except Exception as exc:
    err_trace = traceback.format_exc()
    app = Flask("fallback_error_app")

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def startup_error(path):
        return jsonify({
            "success": False,
            "error": {
                "code": "startup_failed",
                "message": f"Serverless Function failed to start: {str(exc)}",
                "trace": err_trace
            }
        }), 500
