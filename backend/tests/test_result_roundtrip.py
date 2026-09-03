"""Round-trip test: an assessment must return the same presentation data when
fetched from the database (history → Medical Assessment Report) as the original
evaluate response — matched symptoms, risk factors, evidence completeness,
bilingual summaries and structured recommendations."""

import pytest


def _login(client, email, password):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    body = response.get_json()
    return {"Authorization": f"Bearer {body['data']['access_token']}"}


def _run_classic_symptom_assessment(client, headers):
    """Symptom-only screening (no labs) — the 'Suspected Diabetes (Classic
    Symptoms)' scenario from the manual assessment form."""
    payload = {
        "mode": "screening",
        "no_labs_available": True,
        "frequent_urination": True,
        "excessive_thirst": True,
        "fatigue": True,
        "blurred_vision": True,
        "weight_loss": True,
        "family_history": True,
        "obesity": True,
        "risk_factors": {"family_history": True, "obesity": True},
        "age": 45,
        "sex": "male",
        "questionnaire_version": "qcm_yesno_v1",
        "questionnaire_answers": {"frequent_urination": True, "excessive_thirst": True},
    }
    response = client.post("/api/diagnosis/", json=payload, headers=headers)
    assert response.status_code == 200
    return response.get_json()["data"]


def _assert_full_report_shape(data):
    assert isinstance(data.get("matched_symptoms"), list) and data["matched_symptoms"], "matched_symptoms missing/empty"
    assert isinstance(data.get("matched_risk_factors"), list), "matched_risk_factors missing"
    assert isinstance(data.get("certainty_percent"), int) and data["certainty_percent"] > 0
    assert isinstance(data.get("confidence_level"), dict) and data["confidence_level"].get("label")
    assert isinstance(data.get("evidence_completeness"), dict) and data["evidence_completeness"].get("score", 0) > 0
    assert isinstance(data.get("recommendations"), list) and data["recommendations"], "recommendations missing/empty"
    assert data.get("result_summary")
    assert data.get("headline_explanation")
    assert isinstance(data.get("explanation"), dict)
    assert "key_findings" in data["explanation"]


def test_fetched_result_matches_fresh_evaluate_response(client):
    headers = _login(client, "patient@example.com", "patient123")

    fresh = _run_classic_symptom_assessment(client, headers)
    assert fresh["diagnosis_result_id"] > 0
    _assert_full_report_shape(fresh)

    # View the saved result from the database — this is what "Medical
    # Assessment Report" from the history page fetches.
    response = client.get(f"/api/diagnosis/{fresh['diagnosis_result_id']}", headers=headers)
    assert response.status_code == 200
    fetched = response.get_json()["data"]
    _assert_full_report_shape(fetched)

    # The presentation data must match the original assessment output exactly.
    assert fetched["id"] == fresh["diagnosis_result_id"]
    assert fetched["diagnosis"] == fresh["diagnosis"]
    assert fetched["certainty"] == fresh["certainty"]
    assert fetched["certainty_percent"] == fresh["certainty_percent"]
    assert fetched["matched_symptoms"] == fresh["matched_symptoms"]
    assert fetched["matched_risk_factors"] == fresh["matched_risk_factors"]
    assert fetched["evidence_completeness"]["score"] == fresh["evidence_completeness"]["score"]
    assert fetched["result_summary"] == fresh["result_summary"]
    assert fetched["result_summary_km"] == fresh["result_summary_km"]
    assert fetched["headline_explanation"] == fresh["headline_explanation"]
    assert fetched["headline_explanation_km"] == fresh["headline_explanation_km"]
    assert fetched["confidence_level"]["label"] == fresh["confidence_level"]["label"]
    assert fetched["confidence_reason"] == fresh["confidence_reason"]
    assert fetched["confidence_status"] == fresh["confidence_status"]
    assert fetched["missing_inputs"] == fresh["missing_inputs"]
    assert [item["text"] for item in fetched["recommendations"]] == [item["text"] for item in fresh["recommendations"]]
    assert fetched["explanation"]["key_findings"]["key_labs"] == fresh["explanation"]["key_findings"]["key_labs"]
    assert fetched["patient_id"] == fresh["patient_id"]
    assert fetched["created_at"] is not None


def test_fetched_lab_result_keeps_key_labs(client):
    """A result with lab values must still show HbA1c / fasting glucose in the
    report when loaded from history."""
    headers = _login(client, "patient@example.com", "patient123")

    payload = {
        "mode": "diagnostic",
        "frequent_urination": True,
        "excessive_thirst": True,
        "hba1c": 8.4,
        "fasting_glucose": 158,
        "age": 52,
        "sex": "female",
    }
    response = client.post("/api/diagnosis/", json=payload, headers=headers)
    assert response.status_code == 200
    fresh = response.get_json()["data"]

    fetched = client.get(f"/api/diagnosis/{fresh['diagnosis_result_id']}", headers=headers).get_json()["data"]
    _assert_full_report_shape(fetched)
    key_labs = fetched["explanation"]["key_findings"]["key_labs"]
    assert key_labs.get("hba1c") == 8.4
    assert key_labs.get("fasting_glucose") == 158
    assert fetched["evidence_completeness"]["score"] == fresh["evidence_completeness"]["score"]
    assert fetched["matched_symptoms"] == fresh["matched_symptoms"]


def test_history_list_keeps_recommendations(client):
    headers = _login(client, "patient@example.com", "patient123")
    _run_classic_symptom_assessment(client, headers)

    response = client.get("/api/diagnosis/mine", headers=headers)
    assert response.status_code == 200
    rows = response.get_json()["data"]
    assert rows
    row = rows[0]
    assert row["diagnosis"]
    assert row["recommendation"]
