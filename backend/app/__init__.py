import logging
import os
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

import click
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
from .routes.assessment_routes import assessment_bp
from .routes.auth_routes import auth_bp
from .routes.fact_routes import fact_bp
from .routes.notification_routes import notification_bp
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

    @app.cli.command("sync-knowledge-base")
    @click.option("--version", type=click.Choice(["v1", "v2", "v3"]), default=None)
    def sync_knowledge_base_command(version):
        """Synchronize the selected rules and fact catalog, preserving accounts."""
        from .utils.seed import sync_knowledge_base

        if version:
            app.config["RULES_SEED_VERSION"] = version
        result = sync_knowledge_base()
        click.echo(
            f"Knowledge base synchronized ({app.config['RULES_SEED_VERSION']}): "
            f"{result['rules']} active rules, {result['facts']} facts."
        )

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

    @app.cli.command("seed-db")
    def seed_db():
        """Seed the database with medical rules, roles, and demo users."""
        from .utils.seed import seed_demo_data
        app.logger.info("Starting database seeding...")
        try:
            seed_demo_data()
            app.logger.info("Database seeded successfully.")
        except Exception as e:
            app.logger.error("Error during seeding: %s", e)
            db.session.rollback()


def _ensure_user_profile_columns():
    """Ensure newly added columns to users table exist in existing database schemas."""
    try:
        inspector = inspect(db.engine)
        if "users" not in inspector.get_table_names():
            return
        existing_cols = {col["name"] for col in inspector.get_columns("users")}
        columns_to_add = [
            ("avatar_url", "TEXT"),
            ("phone", "VARCHAR(40)"),
            ("department", "VARCHAR(120)"),
            ("title", "VARCHAR(120)"),
            ("hospital_affiliation", "VARCHAR(255)"),
            ("license_number", "VARCHAR(80)"),
            ("bio", "TEXT"),
        ]
        with db.engine.connect() as conn:
            for col_name, col_type in columns_to_add:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
            conn.commit()
    except Exception as e:
        logging.getLogger(__name__).warning("Could not auto-add user columns: %s", e)


def _ensure_fact_columns():
    """Ensure newly added columns to facts table exist in existing database schemas."""
    try:
        inspector = inspect(db.engine)
        if "facts" not in inspector.get_table_names():
            return
        existing_cols = {col["name"] for col in inspector.get_columns("facts")}
        if "question_km" not in existing_cols:
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE facts ADD COLUMN question_km TEXT"))
                conn.commit()
    except Exception as e:
        logging.getLogger(__name__).warning("Could not auto-add fact columns: %s", e)


def _ensure_patient_profile_columns():
    """Bring older SQLite patient tables up to date without replacing data."""
    try:
        inspector = inspect(db.engine)
        if "patients" not in inspector.get_table_names():
            return

        existing_cols = {col["name"] for col in inspector.get_columns("patients")}
        columns_to_add = [
            ("height_cm", "FLOAT"),
            ("weight_kg", "FLOAT"),
            ("waist_circumference", "FLOAT"),
            ("smoking", "BOOLEAN"),
            ("sedentary_lifestyle", "BOOLEAN"),
            ("family_history", "BOOLEAN"),
            ("hypertension", "BOOLEAN"),
            ("high_cholesterol", "BOOLEAN"),
            ("profile_completed_at", "DATETIME"),
        ]

        with db.engine.connect() as conn:
            for col_name, col_type in columns_to_add:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE patients ADD COLUMN {col_name} {col_type}"))
            conn.commit()
    except Exception as e:
        logging.getLogger(__name__).warning("Could not auto-add patient profile columns: %s", e)


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)
    _resolve_startup_database(app)

    # Core setup
    _configure_logging(app)
    cors_origins = list(app.config.get("CORS_ORIGINS", []))
    default_cors_patterns = [
        r"https://.*\.vercel\.app",
        r"http://localhost(:\d+)?",
        r"http://127\.0\.0\.1(:\d+)?",
    ]
    for pattern in default_cors_patterns:
        if pattern not in cors_origins:
            cors_origins.append(pattern)
    CORS(app, resources={r"/api/*": {"origins": cors_origins}})
    _add_security_headers(app)

    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)

    # Ensure models are imported before migration autogeneration.
    from . import models  # noqa: F401

    with app.app_context():
        if app.config.get("DB_AUTO_CREATE", False):
            db.create_all()

        _ensure_user_profile_columns()
        _ensure_fact_columns()
        _ensure_patient_profile_columns()

        if app.config.get("SEED_DEMO_DATA", True):
            # Only run automatic seed if database has not been seeded yet
            from app.models.entities import User
            try:
                if not User.query.first():
                    table_names = set(inspect(db.engine).get_table_names())
                    required_seed_tables = {"users", "roles", "permissions", "rules", "rule_categories"}
                    if required_seed_tables.issubset(table_names):
                        app.logger.info("Database not yet seeded; initializing demo data...")
                        seed_demo_data()
                elif "facts" not in inspect(db.engine).get_table_names():
                    # Older databases may have users and rules but no catalog.
                    # Heal that table without resetting the existing seed data.
                    from .models import Fact
                    from .utils.seed import _seed_fact_catalog

                    Fact.__table__.create(db.engine, checkfirst=True)
                    _seed_fact_catalog()
                    db.session.commit()
            except Exception as e:
                db.session.rollback()
                app.logger.warning("Could not check seed status: %s", e)

    from flask import redirect, render_template, url_for

    @app.get("/")
    def root():
        return redirect(url_for("start"))

    @app.get("/start")
    def start():
        return render_template("start.html")

    @app.get("/health")
    @app.get("/api/health")
    def health():
        return success_response(data={"status": "ok"})

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(assessment_bp, url_prefix="/api/assessment")
    app.register_blueprint(assessment_bp, url_prefix="/api/diagnosis", name="diagnosis")
    app.register_blueprint(assessment_bp, url_prefix="/api/conversational", name="conversational")
    app.register_blueprint(assessment_bp, url_prefix="/api/conversation", name="conversation")
    app.register_blueprint(rule_bp, url_prefix="/api/rules")
    app.register_blueprint(fact_bp, url_prefix="/api/facts")
    app.register_blueprint(patient_bp, url_prefix="/api/patients")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(notification_bp, url_prefix="/api/notifications")

    register_error_handlers(app)
    init_dependencies(app)
    _register_cli_commands(app)
    return app


def _resolve_startup_database(app: Flask):
    primary_uri = app.config.get("SQLALCHEMY_DATABASE_URI")
    app.config["DB_PRIMARY_DATABASE_URI"] = primary_uri
    app.config["DB_FALLBACK_ACTIVE"] = False

    if str(primary_uri).startswith("sqlite"):
        app.config.pop("SQLALCHEMY_ENGINE_OPTIONS", None)
        _ensure_sqlite_parent_dir_exists(primary_uri)
        app.logger.info("Using local SQLite database: %s", primary_uri)
        return

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
        timeout = int(os.getenv("DB_CONNECT_TIMEOUT", "10"))
        connect_args["connect_timeout"] = timeout

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
