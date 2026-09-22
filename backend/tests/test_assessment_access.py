from app.extensions import db
from app.models import DiagnosisResult, Patient


def test_clinical_dashboard_requires_clinical_permission(client, patient_auth, doctor_auth):
    patient_headers = {"Authorization": f"Bearer {patient_auth['access_token']}"}
    doctor_headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}
    assert client.get("/api/dashboard/clinical").status_code == 401
    assert client.get("/api/dashboard/clinical", headers=patient_headers).status_code == 403
    assert client.get("/api/dashboard/clinical", headers=doctor_headers).status_code == 200
    nurse = client.post("/api/auth/login", json={"email": "nurse@example.com", "password": "nurse123"})
    assert nurse.status_code == 200
    nurse_headers = {"Authorization": f"Bearer {nurse.get_json()['data']['access_token']}"}
    assert client.get("/api/dashboard/clinical", headers=nurse_headers).status_code == 200


def test_patient_cannot_read_another_patients_assessment(client, app, patient_auth, doctor_auth):
    with app.app_context():
        other = Patient(full_name="Other patient", gender="unknown")
        db.session.add(other)
        db.session.flush()
        result = DiagnosisResult(
            patient_id=other.id,
            diagnosis="Test assessment",
            certainty=0.5,
            facts_json={},
            triggered_rules_json=[],
        )
        db.session.add(result)
        db.session.commit()
        result_id = result.id

    headers = {"Authorization": f"Bearer {patient_auth['access_token']}"}
    for prefix in ("assessment", "diagnosis", "conversational", "conversation"):
        for suffix in ("", "/report.pdf"):
            response = client.get(f"/api/{prefix}/{result_id}{suffix}", headers=headers)
            assert response.status_code == 403
        for action in ("submit", "submit-to-care-team"):
            response = client.post(
                f"/api/{prefix}/{action}",
                headers=headers,
                json={"diagnosis_result_id": result_id, "patient_note": "Unauthorized change"},
            )
            assert response.status_code == 403

    with app.app_context():
        assert not db.session.get(DiagnosisResult, result_id).explanation_trace_json

    clinician_headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}
    assert client.get(f"/api/assessment/{result_id}", headers=clinician_headers).status_code == 200

    with app.app_context():
        result = db.session.get(DiagnosisResult, result_id)
        result.patient_id = patient_auth["user"]["patient_id"]
        db.session.commit()
    assert client.get(f"/api/assessment/{result_id}", headers=headers).status_code == 200
    report = client.get(f"/api/assessment/{result_id}/report.pdf", headers=headers)
    assert report.status_code == 200
    assert report.data.startswith(b"%PDF")
