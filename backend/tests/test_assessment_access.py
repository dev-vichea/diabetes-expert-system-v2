from app.extensions import db
from app.models import DiagnosisResult, Patient


def test_clinical_dashboard_requires_clinical_permission(client, patient_auth, doctor_auth, admin_auth):
    patient_headers = {"Authorization": f"Bearer {patient_auth['access_token']}"}
    doctor_headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}
    assert client.get("/api/dashboard/clinical").status_code == 401
    assert client.get("/api/dashboard/clinical", headers=patient_headers).status_code == 403
    assert client.get("/api/dashboard/clinical", headers=doctor_headers).status_code == 200
    admin_headers = {"Authorization": f"Bearer {admin_auth['access_token']}"}
    assert client.get("/api/dashboard/clinical", headers=admin_headers).status_code == 200


def test_custom_role_permissions_work_without_a_builtin_role_name(client, patient_auth, admin_auth):
    admin_headers = {"Authorization": f"Bearer {admin_auth['access_token']}"}
    patient_headers = {"Authorization": f"Bearer {patient_auth['access_token']}"}

    create_role = client.post(
        "/api/admin/roles",
        headers=admin_headers,
        json={
            "name": "self_assessment_member",
            "description": "Custom self-service assessment access",
            "permissions": ["diagnosis.run", "diagnosis.view_own", "patient.view_own"],
        },
    )
    assert create_role.status_code == 201

    assign_role = client.patch(
        f"/api/admin/users/{patient_auth['user']['id']}/roles",
        headers=admin_headers,
        json={"roles": ["self_assessment_member"]},
    )
    assert assign_role.status_code == 200

    # The access token predates the role change. The backend must still use
    # the role's current permissions and resolve the user's own patient record.
    assessment = client.post(
        "/api/diagnosis/",
        headers=patient_headers,
        json={
            "save": False,
            "fasting_glucose": 135,
            "hba1c": 7.1,
            "frequent_urination": True,
            "excessive_thirst": True,
        },
    )
    assert assessment.status_code == 200
    assert assessment.get_json()["data"]["patient_id"] == patient_auth["user"]["patient_id"]


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
