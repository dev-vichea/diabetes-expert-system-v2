import os
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


class Config:
    DEBUG = _as_bool(os.getenv("FLASK_DEBUG"), default=False)

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_EXPIRES_SECONDS = int(os.getenv("JWT_ACCESS_EXPIRES_SECONDS", os.getenv("JWT_EXPIRES_SECONDS", "3600")))
    JWT_REFRESH_EXPIRES_SECONDS = int(os.getenv("JWT_REFRESH_EXPIRES_SECONDS", "604800"))

    # PostgreSQL is the primary target database for this project.
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:vichea123@127.0.0.1:5432/diabetes_expert_system",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = _as_bool(os.getenv("SQLALCHEMY_ECHO"), default=False)

    CORS_ORIGINS = _as_list(
        os.getenv("CORS_ORIGINS"),
        default=["http://127.0.0.1:5173", "http://localhost:5173"],
    )

    DB_AUTO_CREATE = _as_bool(os.getenv("DB_AUTO_CREATE"), default=False)
    SEED_DEMO_DATA = _as_bool(os.getenv("SEED_DEMO_DATA"), default=True)

    DB_FALLBACK_ENABLED = _as_bool(os.getenv("DB_FALLBACK_ENABLED"), default=False)
    DB_FALLBACK_URL = os.getenv("DB_FALLBACK_URL", _default_fallback_sqlite_url())
    DB_FALLBACK_AUTO_CREATE = _as_bool(os.getenv("DB_FALLBACK_AUTO_CREATE"), default=True)
    DB_FALLBACK_SEED = _as_bool(os.getenv("DB_FALLBACK_SEED"), default=True)

    DB_FALLBACK_ACTIVE = False
    DB_PRIMARY_DATABASE_URI = None
