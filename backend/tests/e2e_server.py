"""Disposable server for browser regressions; never opens the local database."""
import os
import logging
import secrets
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

os.environ.setdefault('FLASK_DEBUG', '1')
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app
from app.config import Config
from app.dependencies import get_auth_service, get_diagnosis_service
from app.extensions import db
from app.models import Patient, Permission, Role, User
from app.models.entities import utc_now
from werkzeug.security import generate_password_hash


if __name__ == '__main__':
    with TemporaryDirectory(prefix='diabetes-e2e-') as directory:
        class BrowserTestConfig(Config):
            DEBUG = False
            SECRET_KEY = secrets.token_hex(32)
            SQLALCHEMY_DATABASE_URI = f'sqlite:///{directory}/browser.db'
            DB_AUTO_CREATE = True
            DB_FALLBACK_ENABLED = False
            SEED_DEMO_DATA = True
            RATELIMIT_ENABLED = False
            GOOGLE_CLIENT_ID = None

        app = create_app(BrowserTestConfig)
        logging.getLogger('werkzeug').setLevel(logging.WARNING)
        with app.app_context():
            role = Role(name='observer', description='Read-only patient records')
            role.permissions = Permission.query.filter(Permission.code.in_(['patient.view', 'guide.view'])).all()
            user = User(name='Test Observer', email='observer@example.com', password_hash=generate_password_hash('observer123'), is_active=True, roles=[role])
            db.session.add(user)
            patient = Patient.query.first()
            patient.profile_completed_at = utc_now()
            db.session.commit()
            patient_user = get_auth_service().get_fresh_user(patient.user_id)
            get_diagnosis_service().evaluate(
                {'age': 45, 'fasting_glucose': 135, 'hba1c': 6.7, 'excessive_thirst': True},
                {**patient_user, 'sub': str(patient.user_id)},
            )
        app.run(host='127.0.0.1', port=5002, use_reloader=False)
