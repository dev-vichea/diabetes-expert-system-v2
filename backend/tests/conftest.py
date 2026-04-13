import os
import sys
from pathlib import Path

import pytest
from dotenv import load_dotenv

# Load .env before importing Config — its class-level attributes call
# _resolve_secret_key / _resolve_database_url at import time, which
# raise RuntimeError when FLASK_DEBUG and SECRET_KEY are absent.
_backend_dir = Path(__file__).resolve().parents[1]
load_dotenv(_backend_dir / ".env")
os.environ.setdefault("FLASK_DEBUG", "1")

sys.path.insert(0, str(_backend_dir))

from app import create_app
from app.config import Config


@pytest.fixture()
def app(tmp_path):
    db_path = tmp_path / "test.db"

    class TestConfig(Config):
        TESTING = True
        SECRET_KEY = "test-secret-key"
        CORS_ORIGINS = ["*"]
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{db_path}"
        DB_AUTO_CREATE = True
        SEED_DEMO_DATA = True
        JWT_ACCESS_EXPIRES_SECONDS = 300
        JWT_REFRESH_EXPIRES_SECONDS = 1800

    app = create_app(TestConfig)
    yield app


@pytest.fixture()
def client(app):
    return app.test_client()


def login_and_get_auth(client, email: str, password: str) -> dict:
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    body = response.get_json()
    return body["data"]


@pytest.fixture()
def doctor_auth(client):
    return login_and_get_auth(client, "doctor@example.com", "doctor123")


@pytest.fixture()
def admin_auth(client):
    return login_and_get_auth(client, "admin@example.com", "admin123")


@pytest.fixture()
def patient_auth(client):
    return login_and_get_auth(client, "patient@example.com", "patient123")
