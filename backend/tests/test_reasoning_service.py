import pytest
from app.services.reasoning_service import ReasoningService
from app.services.diagnosis_service import DiagnosisService


def _auth_header(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


def test_reasoning_service_structure():
    service = ReasoningService()
    dummy_result = {
        "diagnosis": "Likely Type 2 Diabetes",
        "certainty": 0.85,
        "certainty_percent": 85,
        "urgency": "soon",
        "suspected_type": {"type": "Type 2", "certainty": 0.85},
        "matched_symptoms": ["Frequent urination", "Excessive thirst"],
        "matched_risk_factors": ["Obesity", "Family history of diabetes"],
        "triggered_rules": [
            {
                "id": "RULE-T2D-01",
                "code": "R_T2D_01",
                "name": "Type 2 Risk Pattern Rule",
                "description": "Checks for classic symptoms and metabolic risk",
                "explanation": "Patient presents with cardinal symptoms and elevated BMI",
                "certainty_factor": 0.85,
                "facts_used": ["frequent_urination", "excessive_thirst", "family_history"],
                "conclusions": ["diabetes_likely"],
            }
        ],
        "facts": {
            "frequent_urination": True,
            "excessive_thirst": True,
            "family_history": True,
            "fasting_glucose": 135,
            "hba1c": 7.1,
            "age": 48,
            "bmi": 31.2,
        },
        "all_conclusions": [
            {"conclusion": "diabetes_likely", "certainty": 0.85}
        ],
    }
    dummy_payload = {
        "fasting_glucose": 135,
        "hba1c": 7.1,
        "age": 48,
        "bmi": 31.2,
    }

    report = service.build_reasoning(dummy_result, dummy_payload)

    assert "assessment" in report
    assert "matched_rules" in report
    assert "expert_result" in report
    assert "reasoning" in report
    assert "ai_explanation" in report
    assert "next_steps" in report

    # Check matched rules
    assert len(report["matched_rules"]) == 1
    rule = report["matched_rules"][0]
    assert rule["rule_name"] == "Type 2 Risk Pattern Rule"
    assert len(rule["matched_evidence"]) == 3
    assert all(e["status"] == "matched" for e in rule["matched_evidence"])

    # Check AI explanation
    ai_exp = report["ai_explanation"]
    assert "what_it_means" in ai_exp
    assert "why_generated" in ai_exp
    assert "most_relevant_findings" in ai_exp
    assert "what_it_does_not_mean" in ai_exp
    assert "disclaimer" in ai_exp

    # Check next steps
    steps = report["next_steps"]
    assert "primary_action" in steps
    assert "clinical_steps" in steps
    assert len(steps["clinical_steps"]) > 0


def test_reasoning_endpoint(client):
    # Log in as patient
    login_res = client.post(
        "/api/auth/login",
        json={"email": "patient@example.com", "password": "patient123"},
    )
    assert login_res.status_code == 200
    token = login_res.get_json()["data"]["access_token"]
    headers = _auth_header(token)

    # Submit an assessment
    eval_res = client.post(
        "/api/diagnosis/evaluate",
        headers=headers,
        json={
            "symptoms": ["frequent_urination", "excessive_thirst"],
            "risk_factors": ["family_history"],
            "fasting_glucose": 130,
            "age": 45,
            "gender": "male",
        },
    )
    assert eval_res.status_code == 200
    eval_data = eval_res.get_json()["data"]
    assert "reasoning_report" in eval_data
    assert eval_data["reasoning_report"] is not None

    # Submit to care team to get saved result id
    submit_res = client.post(
        "/api/diagnosis/submit-to-care-team",
        headers=headers,
        json={
            "payload": {
                "symptoms": ["frequent_urination", "excessive_thirst"],
                "risk_factors": ["family_history"],
                "fasting_glucose": 130,
                "age": 45,
                "gender": "male",
            },
            "patient_note": "Testing reasoning",
        },
    )
    assert submit_res.status_code == 200
    saved_data = submit_res.get_json()["data"]
    result_id = saved_data.get("diagnosis_result_id") or saved_data.get("id")

    # Call GET reasoning endpoint
    reasoning_res = client.get(
        f"/api/diagnosis/{result_id}/reasoning",
        headers=headers,
    )
    assert reasoning_res.status_code == 200
    reasoning_body = reasoning_res.get_json()
    assert reasoning_body["success"] is True
    assert "assessment" in reasoning_body["data"]
    assert "ai_explanation" in reasoning_body["data"]
