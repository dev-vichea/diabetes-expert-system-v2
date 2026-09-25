"""Cross-workflow regressions using isolated databases, never local patient data."""
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from flask_migrate import upgrade
from sqlalchemy import inspect

from app import create_app
from app.config import Config
from app.extensions import db
from app.models import DiagnosisResult, Patient, Permission, Role, User


def headers(auth):
    return {"Authorization": f"Bearer {auth['access_token']}"}


@pytest.mark.parametrize("payload", [[1], "invalid", 42, True])
def test_non_object_json_is_validation_error(client, payload):
    response = client.post('/api/auth/login', json=payload)
    assert response.status_code == 400


def test_login_email_is_case_insensitive(client):
    response = client.post('/api/auth/login', json={
        'email': 'DOCTOR@EXAMPLE.COM', 'password': 'doctor123',
    })
    assert response.status_code == 200


def test_conversation_requires_permission_and_links_patient(client, app, patient_auth):
    answers = {'age': 45, 'sex': 'male', 'excessive_thirst': True}
    response = client.post('/api/conversation/complete', headers=headers(patient_auth), json={'answers': answers})
    assert response.status_code == 200
    result_id = response.get_json()['data']['diagnosis_result_id']
    with app.app_context():
        assert db.session.get(DiagnosisResult, result_id).patient_id == patient_auth['user']['patient_id']
        role = Role.query.filter_by(name='patient').one()
        role.permissions = [p for p in role.permissions if p.code != 'diagnosis.run']
        db.session.commit()
    for prefix in ('assessment', 'diagnosis', 'conversation', 'conversational'):
        response = client.post(f'/api/{prefix}/complete', headers=headers(patient_auth), json={'answers': answers})
        assert response.status_code == 403


def test_saved_result_read_does_not_require_assessment_write(client, app, patient_auth):
    with app.app_context():
        result = DiagnosisResult(patient_id=patient_auth['user']['patient_id'], diagnosis='Test', certainty=0.5,
                                 facts_json={}, triggered_rules_json=[])
        db.session.add(result)
        role = Role.query.filter_by(name='patient').one()
        role.permissions = [p for p in role.permissions if p.code != 'diagnosis.run']
        db.session.commit()
        result_id = result.id
    assert client.get(f'/api/assessment/{result_id}', headers=headers(patient_auth)).status_code == 200
    assert client.get(f'/api/assessment/{result_id}/reasoning', headers=headers(patient_auth)).status_code == 200


def test_diagnosis_only_custom_role_cannot_write_arbitrary_patient(client, app, patient_auth):
    with app.app_context():
        role = Role(name='assessment_only', description='Assessment without chart access')
        db.session.add(role)
        role.permissions = [Permission.query.filter_by(code='diagnosis.run').one()]
        user = db.session.get(User, patient_auth['user']['id'])
        user.roles = [role]
        db.session.commit()
    response = client.post('/api/assessment/evaluate', headers=headers(patient_auth), json={
        'patient_id': patient_auth['user']['patient_id'], 'age': 45, 'excessive_thirst': True,
    })
    assert response.status_code == 403


def test_fact_overlays_are_isolated_between_requests():
    from app.expert_system.symptom_database import apply_fact_overlay, clear_fact_overlay, get_symptom_info
    barrier = Barrier(2)

    def assess(weight):
        apply_fact_overlay({'excessive_thirst': {'weight': weight}})
        barrier.wait(timeout=5)
        actual = get_symptom_info('excessive_thirst')['weight']
        clear_fact_overlay()
        return actual

    with ThreadPoolExecutor(max_workers=2) as pool:
        assert list(pool.map(assess, [0.1, 0.9])) == [0.1, 0.9]


def test_migration_only_fresh_database_matches_models(tmp_path):
    class MigrationConfig(Config):
        TESTING = True
        SECRET_KEY = 'migration-test-secret'
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{tmp_path / "migrations.db"}'
        DB_AUTO_CREATE = False
        DB_FALLBACK_ENABLED = False
        SEED_DEMO_DATA = False

    app = create_app(MigrationConfig)
    with app.app_context():
        upgrade(directory='migrations')
        inspector = inspect(db.engine)
        for table in db.metadata.sorted_tables:
            assert table.name in inspector.get_table_names()
            assert set(table.columns.keys()) == {c['name'] for c in inspector.get_columns(table.name)}
        upgrade(directory='migrations')


def test_admin_created_patient_can_complete_profile(client, admin_auth):
    response = client.post('/api/admin/users', headers=headers(admin_auth), json={
        'email': 'provisioned@example.com', 'password': 'provisioned-test-password',
        'name': 'Provisioned Patient', 'roles': ['patient'],
    })
    assert response.status_code == 201
    assert response.get_json()['data']['patient_id'] is not None
    auth = client.post('/api/auth/login', json={
        'email': 'provisioned@example.com', 'password': 'provisioned-test-password',
    }).get_json()['data']
    response = client.patch('/api/patients/mine', headers=headers(auth), json={'height_cm': 165, 'profile_complete': True})
    assert response.status_code == 200


@pytest.mark.parametrize('payload', [{'height_cm': 'bad'}, {'weight_kg': 'NaN'}, {'smoking': 'false'}])
def test_invalid_profile_input_is_rejected(client, patient_auth, payload):
    response = client.patch('/api/patients/mine', headers=headers(patient_auth), json=payload)
    assert response.status_code == 400


def test_migrations_adopt_complete_quickstart_schema_without_data_loss(app):
    with app.app_context():
        before = {user.id: user.email for user in User.query.all()}
        upgrade(directory='migrations')
        upgrade(directory='migrations')
        assert {user.id: user.email for user in User.query.all()} == before


def test_upgrade_after_restart_preserves_legacy_records(tmp_path):
    class MigrationConfig(Config):
        TESTING = True
        SECRET_KEY = 'migration-test-secret'
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{tmp_path / "legacy.db"}'
        DB_AUTO_CREATE = False
        DB_FALLBACK_ENABLED = False
        SEED_DEMO_DATA = False

    from sqlalchemy import text
    first = create_app(MigrationConfig)
    with first.app_context():
        upgrade(directory='migrations', revision='656d0bb80d29')
        db.session.execute(text("INSERT INTO patients (full_name, created_at, updated_at) VALUES ('Preserved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"))
        db.session.commit()
    restarted = create_app(MigrationConfig)
    with restarted.app_context():
        upgrade(directory='migrations')
        assert Patient.query.one().full_name == 'Preserved'


def test_care_plan_ownership_is_not_overridden_by_individual_clinical_grant(client, app, patient_auth, admin_auth, doctor_auth):
    with app.app_context():
        user = db.session.get(User, patient_auth['user']['id'])
        user.direct_permissions = [Permission.query.filter_by(code='patient.view').one()]
        other = Patient(full_name='Other', gender='unknown')
        db.session.add(other)
        db.session.flush()
        result = DiagnosisResult(patient_id=other.id, diagnosis='Test', certainty=0.5, facts_json={}, triggered_rules_json=[])
        db.session.add(result)
        db.session.commit()
        result_id = result.id
    for prefix in ('assessment', 'diagnosis', 'conversation', 'conversational'):
        for auth in (patient_auth, admin_auth, doctor_auth):
            response = client.get(f'/api/{prefix}/{result_id}/care-plan', headers=headers(auth))
            assert response.status_code == 403
        response = client.post(f'/api/{prefix}/{result_id}/care-plan', headers=headers(patient_auth), json={'result': {'diagnosis': 'Test'}})
        assert response.status_code == 403


def test_unexpected_error_logs_omit_exception_values(client, app, monkeypatch, caplog):
    from app.dependencies import get_auth_service
    with app.app_context():
        service = get_auth_service()
    def fail(*args, **kwargs):
        raise RuntimeError('private-request-body-sentinel')
    monkeypatch.setattr(service, 'login', fail)
    response = client.post('/api/auth/login', json={'email': 'test@example.com', 'password': 'test-value'})
    assert response.status_code == 500
    assert 'private-request-body-sentinel' not in caplog.text
    assert 'RuntimeError' in caplog.text


def test_optional_report_failures_do_not_log_clinical_values(client, patient_auth, monkeypatch, caplog):
    from app.services.reasoning_service import ReasoningService

    def fail(*args, **kwargs):
        raise RuntimeError('private-clinical-value-sentinel')

    monkeypatch.setattr(ReasoningService, 'build_reasoning', fail)
    response = client.post('/api/assessment/evaluate', headers=headers(patient_auth), json={
        'age': 45, 'excessive_thirst': True,
    })
    assert response.status_code == 200
    assert 'private-clinical-value-sentinel' not in caplog.text
    assert 'RuntimeError' in caplog.text


@pytest.mark.parametrize('age', ['invalid', {}, True, -1, 121])
def test_conversation_rejects_invalid_demographics(client, age):
    answers = {'age': age, 'sex': 'male', 'frequent_urination': False,
               'excessive_thirst': False, 'excessive_hunger': False}
    for endpoint in ('next', 'complete'):
        response = client.post(f'/api/conversation/{endpoint}', json={'answers': answers})
        assert response.status_code == 400
