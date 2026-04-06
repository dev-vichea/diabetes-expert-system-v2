import logging
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

from flask import Flask
from flask_cors import CORS
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError

from .config import Config
from .dependencies import init_dependencies
from .errors import register_error_handlers
from .extensions import db, limiter, migrate
from .routes.admin_routes import admin_bp
from .routes.auth_routes import auth_bp
from .routes.diagnosis_routes import diagnosis_bp
from .routes.patient_routes import patient_bp
from .routes.rule_routes import rule_bp
from .routes.dashboard_routes import dashboard_bp
from .utils.api_response import success_response
from .utils.seed import seed_demo_data


def _configure_logging(app: Flask):
    """Configure structured logging for the application."""
    log_level = logging.DEBUG if app.config["DEBUG"] else logging.INFO
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    stream_handler.setLevel(log_level)

    app.logger.handlers.clear()
    app.logger.addHandler(stream_handler)
    app.logger.setLevel(log_level)

    # Quiet noisy loggers
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("werkzeug").setLevel(logging.INFO)


def _add_security_headers(app: Flask):
    """Add security response headers to every response."""

    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if not app.config["DEBUG"]:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response


def _register_cli_commands(app: Flask):
    """Register custom CLI commands for maintenance tasks."""

    @app.cli.command("cleanup-tokens")
    def cleanup_tokens():
        """Remove expired revoked tokens from the database."""
        from .models.entities import RevokedToken

        cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(hours=1)
        deleted = RevokedToken.query.filter(
            RevokedToken.expires_at < cutoff
        ).delete()
        db.session.commit()
        app.logger.info("Cleaned up %d expired revoked tokens.", deleted)


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)
    _resolve_startup_database(app)

    # Core setup
    _configure_logging(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    _add_security_headers(app)

    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)

    # Ensure models are imported before migration autogeneration.
    from . import models  # noqa: F401

    with app.app_context():
        if app.config.get("DB_AUTO_CREATE", False):
            db.create_all()

        if app.config.get("SEED_DEMO_DATA", True):
            table_names = set(inspect(db.engine).get_table_names())
            required_seed_tables = {"users", "roles", "permissions", "rules", "rule_categories"}
            if required_seed_tables.issubset(table_names):
                seed_demo_data()

    @app.get("/")
    def root():
        return success_response(
            data={
                "message": "Diabetes Expert System backend is running.",
                "api_base": "/api",
                "cors_origins": app.config["CORS_ORIGINS"],
            }
        )

    @app.get("/health")
    def health():
        return success_response(data={"status": "ok"})

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(diagnosis_bp, url_prefix="/api/diagnosis")
    app.register_blueprint(rule_bp, url_prefix="/api/rules")
    app.register_blueprint(patient_bp, url_prefix="/api/patients")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    register_error_handlers(app)
    init_dependencies(app)
    _register_cli_commands(app)
    return app


def _resolve_startup_database(app: Flask):
    primary_uri = app.config.get("SQLALCHEMY_DATABASE_URI")
    app.config["DB_PRIMARY_DATABASE_URI"] = primary_uri
    app.config["DB_FALLBACK_ACTIVE"] = False

    if not app.config.get("DB_FALLBACK_ENABLED", False):
        return

    try:
        _check_database_connection(primary_uri)
    except SQLAlchemyError as exc:
        fallback_uri = app.config.get("DB_FALLBACK_URL")
        _ensure_sqlite_parent_dir_exists(fallback_uri)

        app.config["SQLALCHEMY_DATABASE_URI"] = fallback_uri
        app.config["DB_FALLBACK_ACTIVE"] = True
        app.config["DB_AUTO_CREATE"] = bool(app.config.get("DB_FALLBACK_AUTO_CREATE", True))
        app.config["SEED_DEMO_DATA"] = bool(app.config.get("DB_FALLBACK_SEED", True))

        # SQLite does not support connection pooling
        app.config.pop("SQLALCHEMY_ENGINE_OPTIONS", None)

        app.logger.warning(
            "Primary database unavailable. Falling back to SQLite. "
            "primary_uri=%s fallback_uri=%s error=%s",
            primary_uri,
            fallback_uri,
            exc,
        )
    else:
        app.logger.info("Primary database connection verified. Using configured primary database.")


def _check_database_connection(database_uri: str):
    connect_args = {}
    if str(database_uri).startswith("postgresql"):
        connect_args["connect_timeout"] = 2

    engine = create_engine(database_uri, connect_args=connect_args)
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    finally:
        engine.dispose()


def _ensure_sqlite_parent_dir_exists(database_uri: str):
    parsed_url = make_url(database_uri)
    if parsed_url.get_backend_name() != "sqlite":
        return

    database_path = parsed_url.database
    if not database_path or database_path == ":memory:":
        return

    Path(database_path).expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)
