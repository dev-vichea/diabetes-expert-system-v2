"""Tests for CarePlanService and Assessment Care Plan Endpoints."""

import pytest
from app.services.care_plan_service import CarePlanService


def test_care_plan_low_risk():
    """Verify care plan generation for normal/low risk case."""
    service = CarePlanService()
    result = {
        "id": 101,
        "diagnosis": "Normal Glucose Regulation — No Diabetes Indication",
        "certainty": 0.94,
        "is_urgent": False,
        "matched_symptoms": [],
        "matched_risk_factors": [],
        "facts": {
            "fasting_glucose": 84,
            "hba1c": 5.1,
            "age": 28,
            "bmi": 22.4,
            "gender": "male",
        },
    }

    plan = service.generate_care_plan(result)

    assert plan is not None
    assert "assessment_findings" in plan
    assert "recommendations" in plan
    assert "follow_up" in plan
    assert "safety_disclaimer" in plan

    # Assessment findings checks
    findings = plan["assessment_findings"]
    assert findings["risk_level"] == "low"
    assert findings["certainty_percent"] == 94
    assert findings["condition"] == "Normal Glucose Regulation — No Diabetes Indication"
    assert findings["demographics"]["age"] == 28
    assert findings["demographics"]["bmi"] == 22.4

    # Recommendations pillars
    recs = plan["recommendations"]
    assert "diet" in recs
    assert "physical_activity" in recs
    assert "lifestyle" in recs
    assert "monitoring" in recs

    assert recs["physical_activity"]["weekly_target_minutes"] >= 150
    assert len(recs["diet"]["action_items"]) > 0

    # Follow up
    follow_up = plan["follow_up"]
    assert follow_up["urgency"] == "routine"
    assert "12 Months" in follow_up["timeline"]

    # Safety Guardrails
    assert plan["metadata"]["guardrail_verification"]["no_new_diagnosis"] is True
    assert plan["metadata"]["guardrail_verification"]["no_pharmacotherapy_prescribed"] is True


def test_care_plan_prediabetes():
    """Verify care plan personalization for prediabetes case."""
    service = CarePlanService()
    result = {
        "id": 102,
        "diagnosis": "Prediabetes (Impaired Glucose)",
        "certainty": 0.85,
        "is_urgent": False,
        "matched_symptoms": ["Fatigue"],
        "matched_risk_factors": ["Overweight", "Sedentary lifestyle"],
        "facts": {
            "fasting_glucose": 108,
            "hba1c": 5.9,
            "age": 48,
            "bmi": 29.8,
            "gender": "male",
            "sedentary_lifestyle": True,
        },
    }

    plan = service.generate_care_plan(result)
    findings = plan["assessment_findings"]
    assert findings["risk_level"] == "moderate"
    assert findings["certainty_percent"] == 85

    recs = plan["recommendations"]
    # Diet should mention glycemic index or DPP
    assert any("Glycemic" in item["title"] or "Plate" in item["title"] or "Sugars" in item["title"] for item in recs["diet"]["action_items"])

    # Lifestyle should include weight loss target for overweight BMI
    assert any("Weight" in item["title"] for item in recs["lifestyle"]["action_items"])

    # Monitoring should recommend retest in 3-6 months
    assert any("3 to 6 months" in item.get("frequency", "") or "3-6 months" in item.get("description", "") for item in recs["monitoring"]["action_items"])


def test_care_plan_type2_high_risk():
    """Verify care plan for high-risk Type 2 diabetes case."""
    service = CarePlanService()
    result = {
        "id": 103,
        "diagnosis": "Likely Type 2 Diabetes",
        "certainty": 0.93,
        "is_urgent": False,
        "matched_symptoms": ["Frequent urination (polyuria)", "Excessive thirst (polydipsia)", "Tingling in feet"],
        "matched_risk_factors": ["Obesity", "Family history", "Hypertension"],
        "facts": {
            "fasting_glucose": 145,
            "hba1c": 7.4,
            "age": 56,
            "bmi": 31.8,
            "gender": "male",
            "hypertension": True,
        },
    }

    plan = service.generate_care_plan(result)
    findings = plan["assessment_findings"]
    assert findings["risk_level"] == "high"

    recs = plan["recommendations"]
    # Should include Diabetes Plate Method
    assert any("Plate" in item["title"] for item in recs["diet"]["action_items"])

    # Should include foot self-inspection for neuropathy/tingling
    assert any("Foot" in item["title"] for item in recs["lifestyle"]["action_items"])

    # Monitoring should include SMBG and quarterly HbA1c
    assert any("SMBG" in item["title"] or "Blood Glucose" in item["title"] for item in recs["monitoring"]["action_items"])
    assert any("HbA1c" in item["title"] for item in recs["monitoring"]["action_items"])

    # Follow-up should recommend visit within 1-2 weeks and eye/foot exam
    follow_up = plan["follow_up"]
    assert follow_up["urgency"] == "high"
    assert "1 to 2 Weeks" in follow_up["timeline"]
    assert any("Retinal" in item["title"] or "Eye" in item["title"] for item in follow_up["schedule"])


def test_care_plan_urgent_ketosis():
    """Verify care plan safety guardrails for urgent ketosis case."""
    service = CarePlanService()
    result = {
        "id": 104,
        "diagnosis": "Suspected Type 1 Diabetes",
        "certainty": 0.94,
        "is_urgent": True,
        "urgent_reason": "Rapid-onset hyperglycemia with catabolic signs",
        "matched_symptoms": ["Excessive thirst", "Rapid weight loss", "Frequent urination", "Fruity breath"],
        "matched_risk_factors": [],
        "facts": {
            "fasting_glucose": 240,
            "hba1c": 10.2,
            "age": 19,
            "bmi": 19.5,
            "gender": "male",
        },
    }

    plan = service.generate_care_plan(result)
    findings = plan["assessment_findings"]
    assert findings["risk_level"] == "urgent"
    assert findings["is_urgent"] is True

    # Physical activity should be paused or held
    pa = plan["recommendations"]["physical_activity"]
    assert pa["weekly_target_minutes"] == 0
    assert any("Rest" in item["title"] or "Precaution" in item["tag"] for item in pa["action_items"])

    # Follow up must be Immediate / Same-Day
    follow_up = plan["follow_up"]
    assert follow_up["urgency"] == "urgent"
    assert "Immediate" in follow_up["timeline"]


def test_care_plan_gestational_pregnancy():
    """Verify gestational diabetes care plan during pregnancy."""
    service = CarePlanService()
    result = {
        "id": 105,
        "diagnosis": "Gestational Diabetes Pattern",
        "certainty": 0.88,
        "is_urgent": False,
        "matched_symptoms": ["Excessive thirst", "Fatigue"],
        "matched_risk_factors": ["Currently pregnant"],
        "facts": {
            "fasting_glucose": 138,
            "hba1c": 6.2,
            "age": 31,
            "bmi": 28.5,
            "gender": "female",
            "currently_pregnant": True,
        },
    }

    plan = service.generate_care_plan(result)
    findings = plan["assessment_findings"]
    assert findings["is_pregnant"] is True

    # Diet should have pregnancy-specific guidance
    diet = plan["recommendations"]["diet"]
    assert "gestational" in diet["summary"].lower()

    # Monitoring targets must have pregnancy thresholds (<95 fasting)
    monitoring = plan["recommendations"]["monitoring"]
    assert "< 95" in monitoring["target_ranges"]["fasting_glucose"]

    # Specialists must include OB/GYN
    follow_up = plan["follow_up"]
    assert any("OB/GYN" in s or "Obstetric" in s for s in follow_up["specialists_to_consult"])


def test_safety_guardrails_no_prescriptions():
    """Verify no prescription drug dosages exist in the generated plan."""
    service = CarePlanService()
    result = {
        "id": 106,
        "diagnosis": "Confirmed Type 2 Diabetes",
        "certainty": 0.96,
        "is_urgent": False,
        "matched_symptoms": ["Frequent urination", "Blurred vision"],
        "matched_risk_factors": ["Obesity", "Hypertension"],
        "facts": {
            "fasting_glucose": 180,
            "hba1c": 8.5,
            "age": 55,
            "bmi": 32.0,
            "gender": "female",
        },
    }

    plan = service.generate_care_plan(result)
    plan_str = str(plan).lower()

    # Ensure no prescription instructions or dosages
    prohibited_prescriptions = [
        "prescribe metformin", "metformin 500mg", "metformin 850mg", "metformin 1000mg",
        "inject insulin", "units of insulin", "take glipizide", "prescribe ozempic",
        "take jardiance"
    ]
    for term in prohibited_prescriptions:
        assert term not in plan_str, f"Found prohibited prescription term: {term}"

    # Verify disclaimer is explicit
    disclaimer = plan["safety_disclaimer"]["content"]
    assert "does NOT constitute a confirmed medical diagnosis" in disclaimer
    assert "nor does it prescribe or adjust medications" in disclaimer


def test_care_plan_low_confidence_provisional():
    """Verify care plan dynamic adaptation for low confidence screening (<50% certainty)."""
    service = CarePlanService()
    result = {
        "id": 107,
        "diagnosis": "Prediabetes Risk Pattern",
        "certainty": 0.38,  # 38% < 50%
        "is_urgent": False,
        "matched_symptoms": ["Mild fatigue"],
        "matched_risk_factors": ["Overweight"],
        "facts": {
            "age": 30,
            "bmi": 26.5,
            "gender": "male",
        },
    }

    plan = service.generate_care_plan(result)
    findings = plan["assessment_findings"]

    # Must be marked provisional
    assert findings["is_provisional"] is True
    assert findings["plan_scope"] == "provisional_screening"
    assert findings["certainty_percent"] == 38

    recs = plan["recommendations"]

    # Diet should be baseline wellness, not strict diabetic plate counting
    assert recs["diet"]["category"] == "Diet & Nutrition Guidance"
    assert any("Hydration" in item.get("tag", "") or "Fresh" in item["title"] for item in recs["diet"]["action_items"])

    # Monitoring should prioritize laboratory confirmation (FPG / HbA1c) rather than capillary SMBG fingersticks
    monitoring = recs["monitoring"]
    assert monitoring["category"] == "Diagnostic Confirmatory Testing"
    assert any("Laboratory Blood Testing" in item["title"] for item in monitoring["action_items"])
    assert not any("SMBG" in item["title"] or "4x Daily" in item["title"] for item in monitoring["action_items"])

    # Follow-up must focus on confirmatory blood tests
    follow_up = plan["follow_up"]
    assert follow_up["urgency"] == "routine"
    assert "2 to 4 Weeks" in follow_up["timeline"]
    assert any("Confirmatory" in item["title"] for item in follow_up["schedule"])


def test_care_plan_api_endpoints(client):
    """Test GET and POST care plan API routes."""
    # 1. Login as patient to run an assessment
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "patient@example.com", "password": "patient123"},
    )
    assert login_resp.status_code == 200
    token = login_resp.get_json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Evaluate an assessment as patient
    eval_resp = client.post(
        "/api/diagnosis/",
        headers=headers,
        json={
            "age": 52,
            "gender": "male",
            "bmi": 30.5,
            "fasting_glucose": 150,
            "hba1c": 7.5,
            "frequent_urination": True,
            "excessive_thirst": True,
        },
    )
    assert eval_resp.status_code == 200
    eval_data = eval_resp.get_json()["data"]
    diagnosis_id = eval_data.get("diagnosis_result_id")

    # The evaluated result should carry care_plan automatically
    assert "care_plan" in eval_data
    assert eval_data["care_plan"]["assessment_findings"]["risk_level"] == "high"

    # 3. GET /api/assessment/<id>/care-plan
    if diagnosis_id:
        get_plan_resp = client.get(
            f"/api/assessment/{diagnosis_id}/care-plan",
            headers=headers,
        )
        assert get_plan_resp.status_code == 200
        plan = get_plan_resp.get_json()["data"]
        assert plan["assessment_findings"]["condition"] == eval_data["diagnosis"]
        assert "diet" in plan["recommendations"]
        assert "physical_activity" in plan["recommendations"]

        # 4. POST /api/assessment/<id>/care-plan (regenerate)
        post_plan_resp = client.post(
            f"/api/assessment/{diagnosis_id}/care-plan",
            headers=headers,
            json={"result": eval_data},
        )
        assert post_plan_resp.status_code == 200
        re_plan = post_plan_resp.get_json()["data"]
        assert re_plan["assessment_findings"]["condition"] == eval_data["diagnosis"]

    # 5. POST /api/assessment/care-plan/generate (direct generation)
    direct_resp = client.post(
        "/api/assessment/care-plan/generate",
        headers=headers,
        json={
            "result": {
                "diagnosis": "Prediabetes (Impaired Glucose)",
                "certainty": 0.82,
                "facts": {"fasting_glucose": 110, "hba1c": 6.0, "age": 45, "bmi": 28.0},
            }
        },
    )
    assert direct_resp.status_code == 200
    direct_plan = direct_resp.get_json()["data"]
    assert direct_plan["assessment_findings"]["risk_level"] == "moderate"
