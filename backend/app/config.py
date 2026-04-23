import os
import secrets
from pathlib import Path
from typing import List


def _as_bool(value: str, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _as_list(value: str, default: List[str]) -> List[str]:
    if value is None:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


def _default_fallback_sqlite_url() -> str:
    backend_dir = Path(__file__).resolve().parents[1]
    fallback_db_path = backend_dir / "instance" / "dev_fallback.db"
    return f"sqlite:///{fallback_db_path}"


def _resolve_secret_key() -> str:
    """Resolve SECRET_KEY: require it in production, auto-generate for dev."""
    key = os.getenv("SECRET_KEY")
    if key:
        return key
    if _as_bool(os.getenv("FLASK_DEBUG"), default=False):
        return f"dev-auto-{secrets.token_hex(16)}"
    raise RuntimeError(
        "SECRET_KEY environment variable is required in production. "
        "Set it in your .env file or system environment."
    )


def _resolve_database_url() -> str:
    """Resolve DATABASE_URL: require it or fallback in debug mode."""
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    if _as_bool(os.getenv("FLASK_DEBUG"), default=False):
        return _default_fallback_sqlite_url()
    raise RuntimeError(
        "DATABASE_URL environment variable is required in production. "
        "Set it in your .env file or system environment."
    )


class Config:
    DEBUG = _as_bool(os.getenv("FLASK_DEBUG"), default=False)

    SECRET_KEY = _resolve_secret_key()
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_EXPIRES_SECONDS = int(os.getenv("JWT_ACCESS_EXPIRES_SECONDS", os.getenv("JWT_EXPIRES_SECONDS", "3600")))
    JWT_REFRESH_EXPIRES_SECONDS = int(os.getenv("JWT_REFRESH_EXPIRES_SECONDS", "604800"))

    SQLALCHEMY_DATABASE_URI = _resolve_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = _as_bool(os.getenv("SQLALCHEMY_ECHO"), default=False)
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
        "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "1800")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
    }

    CORS_ORIGINS = _as_list(
        os.getenv("CORS_ORIGINS"),
        default=["http://127.0.0.1:5173", "http://localhost:5173"],
    )

    # Rate limiting
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "200 per minute")
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")

    DB_AUTO_CREATE = _as_bool(os.getenv("DB_AUTO_CREATE"), default=False)
    SEED_DEMO_DATA = _as_bool(os.getenv("SEED_DEMO_DATA"), default=True)

    DB_FALLBACK_ENABLED = _as_bool(os.getenv("DB_FALLBACK_ENABLED"), default=False)
    DB_FALLBACK_URL = os.getenv("DB_FALLBACK_URL", _default_fallback_sqlite_url())
    DB_FALLBACK_AUTO_CREATE = _as_bool(os.getenv("DB_FALLBACK_AUTO_CREATE"), default=True)
    DB_FALLBACK_SEED = _as_bool(os.getenv("DB_FALLBACK_SEED"), default=True)

    REPORT_CLINIC_NAME = os.getenv("REPORT_CLINIC_NAME", "General Diabetes Clinic")
    REPORT_CLINIC_ADDRESS = os.getenv("REPORT_CLINIC_ADDRESS", "Clinical Services Unit")
    REPORT_CLINIC_PHONE = os.getenv("REPORT_CLINIC_PHONE", "")
    REPORT_CLINIC_EMAIL = os.getenv("REPORT_CLINIC_EMAIL", "")

    DB_FALLBACK_ACTIVE = False
    DB_PRIMARY_DATABASE_URI = None
