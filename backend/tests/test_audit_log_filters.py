from app.extensions import db
from app.models import AuditLog, User


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_audit_log_hides_technical_rows_and_supports_human_categories(client, app, admin_auth, patient_auth):
    with app.app_context():
        admin = db.session.get(User, admin_auth["user"]["id"])
        patient = db.session.get(User, patient_auth["user"]["id"])
        patient_name = patient.name
        db.session.add_all([
            AuditLog(
                action="request.read",
                entity_type="admin",
                entity_id="admin.list_audit_logs",
                actor_user_id=admin.id,
                metadata_json={"method": "GET"},
            ),
            AuditLog(
                action="auth.refresh",
                entity_type="user",
                entity_id=str(admin.id),
                actor_user_id=admin.id,
                metadata_json={},
            ),
            AuditLog(
                action="assessment.evaluate",
                entity_type="diagnosis_result",
                entity_id="123",
                actor_user_id=patient.id,
                metadata_json={"patient_id": patient.patient_profile.id},
            ),
        ])
        db.session.commit()

    headers = _auth_header(admin_auth["access_token"])
    all_response = client.get("/api/admin/audit-logs?limit=200", headers=headers)
    assert all_response.status_code == 200
    all_rows = all_response.get_json()["data"]
    all_actions = {row["action"] for row in all_rows}
    assert "request.read" not in all_actions
    assert "auth.refresh" not in all_actions
    assert "assessment.evaluate" in all_actions

    assessment_response = client.get("/api/admin/audit-logs?category=assessments", headers=headers)
    assert assessment_response.status_code == 200
    assessment_rows = assessment_response.get_json()["data"]
    assert assessment_rows
    assert all(row["action"].startswith(("assessment.", "diagnosis.")) for row in assessment_rows)

    search_response = client.get(
        "/api/admin/audit-logs",
        query_string={"search": patient_name},
        headers=headers,
    )
    assert search_response.status_code == 200
    assert any(row["actor_name"] == patient_name for row in search_response.get_json()["data"])
