from app.models import AssessmentAnswer, AssessmentSession, DiagnosisResult, Patient, RevokedToken, Role, Rule, User


def _auth_header(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


def test_login_success(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "doctor@example.com", "password": "doctor123"},
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["success"] is True
    assert body["data"]["user"]["role"] == "doctor"
    assert "rule.manage" in body["data"]["user"]["permissions"]
    assert "access_token" in body["data"]
    assert "refresh_token" in body["data"]


def test_register_self_service_creates_patient_user(client, app):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "New Patient",
            "email": "new-patient@example.com",
            "password": "patient123",
        },
    )

    assert response.status_code == 201
    body = response.get_json()
    assert body["success"] is True
    assert body["data"]["user"]["role"] == "patient"
    assert body["data"]["user"]["roles"] == ["patient"]
    assert body["data"]["user"]["patient_id"] is not None
    assert "access_token" in body["data"]
    assert "refresh_token" in body["data"]

    with app.app_context():
        user = User.query.filter_by(email="new-patient@example.com").first()
        assert user is not None
        assert user.patient_profile is not None
        assert user.patient_profile.full_name == "New Patient"


def test_login_invalid_credentials(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "doctor@example.com", "password": "wrong"},
    )

    assert response.status_code == 401
    body = response.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "unauthorized"


def test_refresh_token_flow(client, doctor_auth):
    response = client.post(
        "/api/auth/refresh",
        json={"refresh_token": doctor_auth["refresh_token"]},
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["access_token"] != doctor_auth["access_token"]
    assert data["refresh_token"] != doctor_auth["refresh_token"]


def test_protected_route_requires_token(client):
    response = client.get("/api/rules/")

    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "unauthorized"


def test_patient_cannot_access_rules_page(client, patient_auth):
    response = client.get("/api/rules/", headers=_auth_header(patient_auth["access_token"]))

    assert response.status_code == 403
    assert response.get_json()["error"]["code"] == "forbidden"


def test_diagnosis_flow_for_doctor(client, doctor_auth):
    patient_id = doctor_auth["user"]["patient_id"]
    if not patient_id:
        patient_id = _get_demo_patient_id(client)

    response = client.post(
        "/api/diagnosis/",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "patient_id": patient_id,
            "fasting_glucose": 135,
            "hba1c": 6.8,
            "frequent_urination": True,
            "excessive_thirst": True,
        },
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["success"] is True
    assert body["data"]["diagnosis"] == "Likely Diabetes"
    assert body["data"]["certainty"] >= 0.9
    assert body["data"]["diagnosis_result_id"] > 0
    assert body["data"]["patient_id"] == patient_id
    assert isinstance(body["data"].get("explanation_trace"), dict)
    assert isinstance(body["data"].get("is_urgent"), bool)
    stage_names = [row["stage"] for row in body["data"]["explanation_trace"]["inference"]["stage_execution"]]
    assert stage_names[:4] == ["triage", "diagnosis", "classification", "recommendation"]


def test_diagnosis_persists_questionnaire_answers(client, doctor_auth, app):
    patient_id = doctor_auth["user"]["patient_id"]
    if not patient_id:
        patient_id = _get_demo_patient_id(client)

    questionnaire_answers = {
        "qcm": {
            "age_group": "31_45",
            "fasting_group": "diabetes",
        },
        "yes_no": {
            "symptoms": {
                "frequent_urination": True,
                "excessive_thirst": True,
            },
        },
    }

    response = client.post(
        "/api/diagnosis/",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "patient_id": patient_id,
            "fasting_glucose": 138,
            "hba1c": 6.9,
            "frequent_urination": True,
            "excessive_thirst": True,
            "questionnaire_version": "qcm_yesno_v1",
            "questionnaire_answers": questionnaire_answers,
        },
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["questionnaire_answers"]["version"] == "qcm_yesno_v1"
    assert data["questionnaire_answers"]["answers"]["qcm"]["age_group"] == "31_45"
    assert data["assessment_session_id"] > 0

    with app.app_context():
        diagnosis = DiagnosisResult.query.filter_by(id=data["diagnosis_result_id"]).first()
        assert diagnosis is not None
        assert diagnosis.questionnaire_answers_json is not None
        assert diagnosis.questionnaire_answers_json["version"] == "qcm_yesno_v1"
        assert diagnosis.questionnaire_answers_json["answers"]["qcm"]["fasting_group"] == "diabetes"
        assert diagnosis.assessment_session_id == data["assessment_session_id"]

        session = AssessmentSession.query.filter_by(id=data["assessment_session_id"]).first()
        assert session is not None
        assert session.mode in {"screening", "diagnostic"}
        assert session.status == "completed"
        assert session.submitted_by_user_id == doctor_auth["user"]["id"]
        answer_count = AssessmentAnswer.query.filter_by(session_id=session.id).count()
        assert answer_count > 0


def test_patient_can_submit_and_view_own_results(client, patient_auth):
    create_response = client.post(
        "/api/diagnosis/",
        headers=_auth_header(patient_auth["access_token"]),
        json={
            "fasting_glucose": 126,
            "hba1c": 6.6,
            "frequent_urination": True,
            "excessive_thirst": True,
        },
    )
    assert create_response.status_code == 200

    list_response = client.get(
        "/api/diagnosis/mine",
        headers=_auth_header(patient_auth["access_token"]),
    )
    assert list_response.status_code == 200
    results = list_response.get_json()["data"]
    assert len(results) >= 1
    assert all(row["patient_id"] == patient_auth["user"]["patient_id"] for row in results)


def test_patient_can_submit_without_labs_and_get_backend_summary(client, patient_auth):
    response = client.post(
        "/api/diagnosis/",
        headers=_auth_header(patient_auth["access_token"]),
        json={
            "frequent_urination": True,
            "excessive_thirst": True,
            "symptoms": {"fatigue": True},
            "risk_factors": {"family_history": True},
        },
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert "certainty_percent" in data
    assert isinstance(data["certainty_percent"], int)
    assert "confidence_level" in data
    assert isinstance(data["matched_symptoms"], list)
    assert "Frequent Urination" in data["matched_symptoms"]
    assert isinstance(data["matched_risk_factors"], list)
    assert "Family History" in data["matched_risk_factors"]
    assert sorted(data["missing_inputs"]) == ["fasting_glucose", "hba1c"]
    assert "result_summary" in data
    assert data["confidence_status"] in {"calculated", "insufficient_evidence"}
    assert isinstance(data.get("confidence_reason"), str)
    assert "missing" in data["confidence_reason"].lower()
    assert data["assessment_mode"] == "screening"
    assert data["evidence_completeness"]["level"] in {"low", "medium", "high"}
    assert isinstance(data.get("recommendations"), list)
    if data["recommendations"]:
        assert {"text", "urgency"}.issubset(set(data["recommendations"][0].keys()))


def test_diagnosis_flow_derives_normalized_and_computed_facts(client, patient_auth):
    response = client.post(
        "/api/diagnosis/",
        headers=_auth_header(patient_auth["access_token"]),
        json={
            "weight_kg": "95",
            "height_cm": "174",
            "polyuria": True,
            "polydipsia": True,
            "fasting_plasma_glucose": "130",
            "risk_factors": {
                "family_history_diabetes": True,
                "physical_activity_low": True,
            },
        },
    )

    assert response.status_code == 200
    facts = response.get_json()["data"]["facts"]
    assert facts["fasting_plasma_glucose"] == 130.0
    assert facts["fasting_glucose"] == 130.0
    assert facts["bmi"] > 31
    assert facts["is_obese"] is True
    assert facts["classic_hyperglycemia_symptoms"] is True
    assert facts["hyperglycemia_present"] is True
    assert facts["high_type2_risk_pattern"] is True


def test_doctor_diagnosis_requires_patient_id(client, doctor_auth):
    response = client.post(
        "/api/diagnosis/",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "fasting_glucose": 130,
            "hba1c": 6.4,
            "frequent_urination": False,
            "excessive_thirst": True,
        },
    )
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "validation_error"


def test_doctor_can_manage_patients_and_history(client, doctor_auth):
    create_patient_response = client.post(
        "/api/patients/",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "full_name": "Alice Newman",
            "gender": "female",
            "date_of_birth": "1990-05-02",
            "phone": "123456789",
            "notes": "New diabetes case",
        },
    )
    assert create_patient_response.status_code == 201
    patient = create_patient_response.get_json()["data"]
    patient_id = patient["id"]

    list_response = client.get(
        "/api/patients/?search=alice&gender=female&has_diagnosis=false&limit=20",
        headers=_auth_header(doctor_auth["access_token"]),
    )
    assert list_response.status_code == 200
    listed_ids = {row["id"] for row in list_response.get_json()["data"]}
    assert patient_id in listed_ids

    add_symptom_response = client.post(
        f"/api/patients/{patient_id}/symptoms",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "symptom_code": "fatigue",
            "symptom_name": "Fatigue",
            "severity": 7,
            "present": True,
            "notes": "Persistent fatigue",
        },
    )
    assert add_symptom_response.status_code == 201

    add_lab_response = client.post(
        f"/api/patients/{patient_id}/lab-results",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "test_name": "HbA1c",
            "test_value": 7.1,
            "unit": "%",
            "reference_range": "4.0-5.6",
        },
    )
    assert add_lab_response.status_code == 201

    diagnosis_response = client.post(
        "/api/diagnosis/",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "patient_id": patient_id,
            "fasting_glucose": 142,
            "hba1c": 7.1,
            "frequent_urination": True,
            "excessive_thirst": True,
        },
    )
    assert diagnosis_response.status_code == 200

    history_response = client.get(
        f"/api/patients/{patient_id}/history",
        headers=_auth_header(doctor_auth["access_token"]),
    )
    assert history_response.status_code == 200
    history = history_response.get_json()["data"]
    assert history["patient"]["id"] == patient_id
    assert len(history["symptoms"]) >= 1
    assert len(history["lab_results"]) >= 1
    assert len(history["diagnosis_history"]) >= 1


def test_medical_input_validation_and_review_annotation(client, doctor_auth):
    patient_list_response = client.get(
        "/api/patients/?limit=5",
        headers=_auth_header(doctor_auth["access_token"]),
    )
    assert patient_list_response.status_code == 200
    patient_id = patient_list_response.get_json()["data"][0]["id"]

    invalid_response = client.post(
        "/api/diagnosis/",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "patient_id": patient_id,
            "fasting_glucose": 900,
            "hba1c": 6.5,
            "frequent_urination": True,
            "excessive_thirst": True,
        },
    )
    assert invalid_response.status_code == 400
    assert invalid_response.get_json()["error"]["code"] == "validation_error"

    valid_response = client.post(
        "/api/diagnosis/",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "patient_id": patient_id,
            "fasting_glucose": 265,
            "hba1c": 10.5,
            "frequent_urination": True,
            "excessive_thirst": True,
            "symptoms": {"fatigue": True},
            "risk_factors": {"family_history": True},
        },
    )
    assert valid_response.status_code == 200
    data = valid_response.get_json()["data"]
    diagnosis_result_id = data["diagnosis_result_id"]
    assert data["is_urgent"] is True
    assert data["urgent_reason"]
    assert isinstance(data["explanation_trace"], dict)

    review_response = client.patch(
        f"/api/diagnosis/{diagnosis_result_id}/review",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "review_note": "Urgent referral arranged.",
            "is_urgent": True,
            "urgent_reason": "Severely uncontrolled values.",
        },
    )
    assert review_response.status_code == 200
    reviewed = review_response.get_json()["data"]
    assert reviewed["review_note"] == "Urgent referral arranged."
    assert reviewed["is_urgent"] is True
    assert reviewed["urgent_reason"] == "Severely uncontrolled values."
    assert reviewed["reviewed_by_user_id"] == doctor_auth["user"]["id"]
    assert reviewed["reviewed_at"] is not None


def test_urgent_priority_overrides_routine_recommendations(client, doctor_auth):
    patient_id = doctor_auth["user"]["patient_id"]
    if not patient_id:
        patient_id = _get_demo_patient_id(client)

    response = client.post(
        "/api/diagnosis/",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "patient_id": patient_id,
            "fasting_glucose": 280,
            "hba1c": 10.8,
            "vomiting": True,
            "abdominal_pain": True,
            "frequent_urination": True,
            "excessive_thirst": True,
        },
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["is_urgent"] is True
    assert isinstance(data.get("recommendations"), list)
    assert len(data["recommendations"]) >= 1
    assert data["recommendations"][0]["urgency"] in {"urgent", "high"}
    assert data["recommendation"] == data["recommendations"][0]["text"]


def test_patient_can_view_own_profile_and_history(client, patient_auth):
    profile_response = client.get(
        "/api/patients/mine",
        headers=_auth_header(patient_auth["access_token"]),
    )
    assert profile_response.status_code == 200
    profile = profile_response.get_json()["data"]
    assert profile["id"] == patient_auth["user"]["patient_id"]

    history_response = client.get(
        "/api/patients/mine/history",
        headers=_auth_header(patient_auth["access_token"]),
    )
    assert history_response.status_code == 200
    history = history_response.get_json()["data"]
    assert history["patient"]["id"] == patient_auth["user"]["patient_id"]


def test_doctor_can_review_results(client, doctor_auth):
    response = client.get(
        "/api/diagnosis/review?limit=20",
        headers=_auth_header(doctor_auth["access_token"]),
    )

    assert response.status_code == 200
    assert isinstance(response.get_json()["data"], list)


def test_seeded_diabetes_rule_groups_exist(client, doctor_auth):
    response = client.get("/api/rules/?include_archived=true&limit=500", headers=_auth_header(doctor_auth["access_token"]))
    assert response.status_code == 200
    rows = response.get_json()["data"]
    assert len(rows) >= 10

    category_codes = {row["category"] for row in rows}
    assert {"triage", "diagnosis", "classification", "recommendation"}.issubset(category_codes)

    codes = {row["code"] for row in rows}
    expected_codes = {
        "triage-hypoglycemia-threshold",
        "triage-possible-dka-cluster",
        "diagnosis-fasting-glucose-threshold",
        "diagnosis-hba1c-threshold",
        "diagnosis-prediabetes-fasting-range",
        "diagnosis-prediabetes-hba1c-range",
        "classification-type2-risk-bmi-family-history",
        "recommendation-urgent-dka-referral",
        "recommendation-diabetes-clinical-referral",
    }
    assert expected_codes.issubset(codes)


def test_rule_categories_endpoint(client, doctor_auth):
    response = client.get("/api/rules/categories", headers=_auth_header(doctor_auth["access_token"]))
    assert response.status_code == 200
    rows = response.get_json()["data"]
    assert isinstance(rows, list)
    codes = {row["code"] for row in rows}
    assert {"triage", "diagnosis", "classification", "recommendation"}.issubset(codes)


def test_rule_pages_list_and_create(client, doctor_auth, app):
    with app.app_context():
        initial_db_rule_count = Rule.query.count()

    list_response = client.get("/api/rules/", headers=_auth_header(doctor_auth["access_token"]))
    assert list_response.status_code == 200
    initial_count = len(list_response.get_json()["data"])

    create_response = client.post(
        "/api/rules/",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "name": "Borderline HbA1c",
            "condition": "hba1c >= 6.0",
            "conclusion": "diabetes_possible",
            "certainty_factor": 0.6,
        },
    )
    assert create_response.status_code == 201

    after_response = client.get("/api/rules/", headers=_auth_header(doctor_auth["access_token"]))
    assert len(after_response.get_json()["data"]) == initial_count + 1

    with app.app_context():
        assert Rule.query.count() == initial_db_rule_count + 1


def test_rule_creation_rejects_unsafe_condition(client, doctor_auth):
    response = client.post(
        "/api/rules/",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "name": "Unsafe condition",
            "condition": "__import__('os').system('echo bad')",
            "conclusion": "diabetes_possible",
            "certainty_factor": 0.5,
        },
    )

    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "validation_error"


def test_rule_creation_supports_structured_conditions_and_actions(client, doctor_auth):
    response = client.post(
        "/api/rules/",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "code": "triage-urgent-symptom-cluster",
            "name": "Urgent Symptom Cluster",
            "category": "triage",
            "conditions": [
                {
                    "fact_key": "frequent_urination",
                    "operator": "==",
                    "expected_value": True,
                    "sequence": 1,
                    "group": "g1",
                    "logical_operator": "and",
                },
                {
                    "fact_key": "excessive_thirst",
                    "operator": "==",
                    "expected_value": True,
                    "sequence": 2,
                    "group": "g1",
                    "logical_operator": "and",
                },
            ],
            "actions": [
                {"action_type": "urgent_flag", "action_value": True},
                {"action_type": "recommendation", "action_value": "Immediate physician review"},
            ],
            "certainty_factor": 0.8,
            "priority": "high",
            "status": "active",
            "explanation_text": "Concurrent classic symptoms should be triaged quickly.",
        },
    )

    assert response.status_code == 201
    data = response.get_json()["data"]
    assert data["category"] == "triage"
    assert data["code"] == "triage-urgent-symptom-cluster"
    assert len(data["conditions"]) == 2
    assert data["conditions"][0]["fact_key"] == "frequent_urination"
    action_types = {action["action_type"] for action in data["actions"]}
    assert "urgent_flag" in action_types
    assert "recommendation" in action_types


def test_rule_crud_versions_and_audit(client, doctor_auth):
    create_response = client.post(
        "/api/rules/",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "name": "Complication risk starter",
            "category": "classification",
            "conditions": [
                {"expression": "hba1c >= 7.5", "logical_operator": "and"},
                {"expression": "fasting_glucose >= 140", "logical_operator": "and"},
            ],
            "conclusion": "diabetes_possible",
            "certainty_factor": 0.72,
            "priority": "high",
            "status": "active",
            "explanation": "Early complication concern rule.",
            "recommendation": "Close monitoring and specialist referral.",
        },
    )
    assert create_response.status_code == 201
    created = create_response.get_json()["data"]
    rule_id = created["id"]
    assert created["version"] == 1
    assert created["category"] == "classification"
    assert created["code"]

    detail_response = client.get(
        f"/api/rules/{rule_id}",
        headers=_auth_header(doctor_auth["access_token"]),
    )
    assert detail_response.status_code == 200
    detail = detail_response.get_json()["data"]
    assert detail["id"] == rule_id
    assert len(detail["conditions"]) == 2

    update_response = client.patch(
        f"/api/rules/{rule_id}",
        headers=_auth_header(doctor_auth["access_token"]),
        json={
            "name": "Complication risk updated",
            "category": "recommendation",
            "conditions": [{"expression": "hba1c >= 7.0", "logical_operator": "and"}],
            "conclusion": "diabetes_possible",
            "certainty_factor": 0.68,
            "priority": "medium",
            "status": "inactive",
            "explanation": "Updated guidance rule.",
            "recommendation": "Follow-up in 2 weeks.",
        },
    )
    assert update_response.status_code == 200
    updated = update_response.get_json()["data"]
    assert updated["version"] == 2
    assert updated["status"] == "inactive"
    assert updated["category"] == "recommendation"

    versions_response = client.get(
        f"/api/rules/{rule_id}/versions?limit=20",
        headers=_auth_header(doctor_auth["access_token"]),
    )
    assert versions_response.status_code == 200
    versions = versions_response.get_json()["data"]
    assert len(versions) >= 2
    assert {"create", "update"}.issubset({row["change_type"] for row in versions})

    audit_response = client.get(
        f"/api/rules/{rule_id}/audit?limit=20",
        headers=_auth_header(doctor_auth["access_token"]),
    )
    assert audit_response.status_code == 200
    audit_logs = audit_response.get_json()["data"]
    actions = {row["action"] for row in audit_logs}
    assert "rule.create" in actions
    assert "rule.update" in actions

    archive_response = client.delete(
        f"/api/rules/{rule_id}",
        headers=_auth_header(doctor_auth["access_token"]),
    )
    assert archive_response.status_code == 200
    archived = archive_response.get_json()["data"]
    assert archived["status"] == "archived"
    assert archived["version"] == 3

    list_default_response = client.get(
        "/api/rules/",
        headers=_auth_header(doctor_auth["access_token"]),
    )
    assert list_default_response.status_code == 200
    assert rule_id not in {row["id"] for row in list_default_response.get_json()["data"]}

    list_archived_response = client.get(
        "/api/rules/?status=archived&include_archived=true",
        headers=_auth_header(doctor_auth["access_token"]),
    )
    assert list_archived_response.status_code == 200
    assert rule_id in {row["id"] for row in list_archived_response.get_json()["data"]}


def test_admin_can_manage_users_and_permissions(client, admin_auth, doctor_auth, app):
    forbidden_roles_response = client.get(
        "/api/admin/roles",
        headers=_auth_header(doctor_auth["access_token"]),
    )
    assert forbidden_roles_response.status_code == 403

    users_response = client.get(
        "/api/admin/users",
        headers=_auth_header(admin_auth["access_token"]),
    )
    assert users_response.status_code == 200

    roles_response = client.get(
        "/api/admin/roles",
        headers=_auth_header(admin_auth["access_token"]),
    )
    assert roles_response.status_code == 200
    assert len(roles_response.get_json()["data"]) >= 3

    permissions_response = client.get(
        "/api/admin/permissions",
        headers=_auth_header(admin_auth["access_token"]),
    )
    assert permissions_response.status_code == 200
    permission_codes = {row["code"] for row in permissions_response.get_json()["data"]}
    assert "user.manage" in permission_codes

    create_role_response = client.post(
        "/api/admin/roles",
        headers=_auth_header(admin_auth["access_token"]),
        json={
            "name": "triage_manager",
            "description": "Handles triage monitoring",
            "permissions": ["patient.view", "diagnosis.review_any"],
        },
    )
    assert create_role_response.status_code == 201
    role_id = create_role_response.get_json()["data"]["id"]

    create_user_response = client.post(
        "/api/admin/users",
        headers=_auth_header(admin_auth["access_token"]),
        json={
            "name": "QA Triage",
            "email": "triage.qa@example.com",
            "password": "triage123",
            "roles": ["triage_manager"],
            "is_active": True,
        },
    )
    assert create_user_response.status_code == 201
    created_user = create_user_response.get_json()["data"]
    created_user_id = created_user["id"]
    assert created_user["is_active"] is True
    assert "triage_manager" in created_user["roles"]

    filtered_users_response = client.get(
        "/api/admin/users?search=triage&role=triage_manager&status=active&limit=20",
        headers=_auth_header(admin_auth["access_token"]),
    )
    assert filtered_users_response.status_code == 200
    filtered_ids = {row["id"] for row in filtered_users_response.get_json()["data"]}
    assert created_user_id in filtered_ids

    disable_response = client.patch(
        f"/api/admin/users/{created_user_id}/status",
        headers=_auth_header(admin_auth["access_token"]),
        json={"is_active": False},
    )
    assert disable_response.status_code == 200
    assert disable_response.get_json()["data"]["is_active"] is False

    disabled_login_response = client.post(
        "/api/auth/login",
        json={"email": "triage.qa@example.com", "password": "triage123"},
    )
    assert disabled_login_response.status_code == 401

    enable_response = client.patch(
        f"/api/admin/users/{created_user_id}/status",
        headers=_auth_header(admin_auth["access_token"]),
        json={"is_active": True},
    )
    assert enable_response.status_code == 200
    assert enable_response.get_json()["data"]["is_active"] is True

    enabled_login_response = client.post(
        "/api/auth/login",
        json={"email": "triage.qa@example.com", "password": "triage123"},
    )
    assert enabled_login_response.status_code == 200

    update_role_response = client.patch(
        f"/api/admin/roles/{role_id}",
        headers=_auth_header(admin_auth["access_token"]),
        json={"permissions": ["patient.view", "diagnosis.review_any", "diagnosis.run"]},
    )
    assert update_role_response.status_code == 200
    assert "diagnosis.run" in update_role_response.get_json()["data"]["permissions"]

    with app.app_context():
        doctor_user = User.query.filter_by(email="doctor@example.com").first()

    update_response = client.patch(
        f"/api/admin/users/{doctor_user.id}/roles",
        headers=_auth_header(admin_auth["access_token"]),
        json={"roles": ["doctor"]},
    )
    assert update_response.status_code == 200

    stats_response = client.get(
        "/api/admin/stats",
        headers=_auth_header(admin_auth["access_token"]),
    )
    assert stats_response.status_code == 200
    stats = stats_response.get_json()["data"]
    assert stats["users"]["total"] >= 4
    assert stats["patients"]["total"] >= 1
    assert "events_24h" in stats["activity"]

    activity_response = client.get(
        "/api/admin/activity?days=7&limit=20",
        headers=_auth_header(admin_auth["access_token"]),
    )
    assert activity_response.status_code == 200
    activity_data = activity_response.get_json()["data"]
    assert "summary" in activity_data
    assert "recent_events" in activity_data

    audit_response = client.get(
        "/api/admin/audit-logs?action=user.status.update&limit=20",
        headers=_auth_header(admin_auth["access_token"]),
    )
    assert audit_response.status_code == 200
    audit_rows = audit_response.get_json()["data"]
    assert any(row["action"] == "user.status.update" for row in audit_rows)

    with app.app_context():
        assert Role.query.count() >= 3


def test_logout_revokes_tokens(client, doctor_auth, app):
    access_token = doctor_auth["access_token"]
    refresh_token = doctor_auth["refresh_token"]

    logout_response = client.post(
        "/api/auth/logout",
        headers=_auth_header(access_token),
        json={"refresh_token": refresh_token},
    )
    assert logout_response.status_code == 200

    reuse_access_response = client.get(
        "/api/rules/",
        headers=_auth_header(access_token),
    )
    assert reuse_access_response.status_code == 401

    with app.app_context():
        assert RevokedToken.query.count() >= 2
        assert DiagnosisResult.query.count() >= 0
        assert Patient.query.count() >= 1


def test_disabled_account_token_is_rejected(client, admin_auth, doctor_auth, app):
    with app.app_context():
        doctor_user = User.query.filter_by(email="doctor@example.com").first()
        doctor_user_id = doctor_user.id

    disable_response = client.patch(
        f"/api/admin/users/{doctor_user_id}/status",
        headers=_auth_header(admin_auth["access_token"]),
        json={"is_active": False},
    )
    assert disable_response.status_code == 200

    denied_response = client.get(
        "/api/rules/",
        headers=_auth_header(doctor_auth["access_token"]),
    )
    assert denied_response.status_code == 401

    reenable_response = client.patch(
        f"/api/admin/users/{doctor_user_id}/status",
        headers=_auth_header(admin_auth["access_token"]),
        json={"is_active": True},
    )
    assert reenable_response.status_code == 200


def _get_demo_patient_id(client):
    me_response = client.post(
        "/api/auth/login",
        json={"email": "patient@example.com", "password": "patient123"},
    )
    assert me_response.status_code == 200
    data = me_response.get_json()["data"]
    return data["user"]["patient_id"]
