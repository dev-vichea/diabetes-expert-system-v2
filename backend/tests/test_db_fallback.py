from pathlib import Path

import pytest
from sqlalchemy.exc import OperationalError

from app import create_app
from app.config import Config


def _base_config(secret_key: str = 'test-secret-key'):
    class BaseConfig(Config):
        TESTING = True
        SECRET_KEY = secret_key
        CORS_ORIGINS = ['*']

    return BaseConfig


def test_startup_without_fallback_preserves_failure_on_unreachable_primary():
    BaseConfig = _base_config()

    class NoFallbackConfig(BaseConfig):
        SQLALCHEMY_DATABASE_URI = 'postgresql+psycopg://postgres:postgres@127.0.0.1:1/diabetes_expert_system'
        DB_FALLBACK_ENABLED = False
        DB_AUTO_CREATE = False
        SEED_DEMO_DATA = True

    with pytest.raises(OperationalError):
        create_app(NoFallbackConfig)


def test_fallback_enabled_uses_sqlite_when_primary_unreachable(tmp_path):
    fallback_db = tmp_path / 'fallback.db'
    BaseConfig = _base_config()

    class FallbackConfig(BaseConfig):
        SQLALCHEMY_DATABASE_URI = 'postgresql+psycopg://postgres:postgres@127.0.0.1:1/diabetes_expert_system'
        DB_FALLBACK_ENABLED = True
        DB_FALLBACK_URL = f'sqlite:///{fallback_db}'
        DB_FALLBACK_AUTO_CREATE = True
        DB_FALLBACK_SEED = True
        DB_AUTO_CREATE = False
        SEED_DEMO_DATA = False

    app = create_app(FallbackConfig)
    assert app.config['DB_FALLBACK_ACTIVE'] is True
    assert app.config['SQLALCHEMY_DATABASE_URI'] == f'sqlite:///{fallback_db}'
    assert app.config['DB_AUTO_CREATE'] is True
    assert app.config['SEED_DEMO_DATA'] is True

    client = app.test_client()

    health_response = client.get('/health')
    assert health_response.status_code == 200
    assert health_response.get_json()['data']['status'] == 'ok'

    login_response = client.post(
        '/api/auth/login',
        json={'email': 'doctor@example.com', 'password': 'doctor123'},
    )
    assert login_response.status_code == 200
    assert login_response.get_json()['data']['user']['role'] == 'doctor'


def test_primary_database_remains_active_when_reachable(tmp_path):
    primary_db = tmp_path / 'primary.db'
    fallback_db = tmp_path / 'fallback.db'
    BaseConfig = _base_config()

    class ReachablePrimaryConfig(BaseConfig):
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{primary_db}'
        DB_FALLBACK_ENABLED = True
        DB_FALLBACK_URL = f'sqlite:///{fallback_db}'
        DB_FALLBACK_AUTO_CREATE = True
        DB_FALLBACK_SEED = True
        DB_AUTO_CREATE = True
        SEED_DEMO_DATA = True

    app = create_app(ReachablePrimaryConfig)
    assert app.config['DB_FALLBACK_ACTIVE'] is False
    assert app.config['SQLALCHEMY_DATABASE_URI'] == f'sqlite:///{primary_db}'

    client = app.test_client()
    login_response = client.post(
        '/api/auth/login',
        json={'email': 'doctor@example.com', 'password': 'doctor123'},
    )
    assert login_response.status_code == 200

    assert Path(primary_db).exists()
