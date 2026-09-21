"""Evidence confidence must reward agreement without pretending to be accuracy."""

import pytest

from app.expert_system.inference_engine import run_inference
from app.utils.diabetes_rule_seed_data_v3 import DIABETES_RULE_SEED_V3


def infer(payload):
    return run_inference(payload, DIABETES_RULE_SEED_V3)


def test_two_independent_diabetes_range_tests_are_stronger_than_one():
    single = infer({"hba1c": 7.2})
    concordant = infer({"hba1c": 7.2, "fasting_glucose": 140})

    assert single["confidence_calibration"]["status"] == "confirmation_needed"
    assert single["confidence_calibration"]["independent_evidence_count"] == 1
    assert single["certainty"] <= 0.82
    assert concordant["confidence_calibration"]["status"] == "corroborated"
    assert concordant["confidence_calibration"]["independent_evidence_count"] == 2
    assert concordant["certainty"] >= 0.95
    assert concordant["certainty"] > single["certainty"]


@pytest.mark.parametrize(
    "payload",
    [
        {"fasting_glucose": 130, "hba1c": 6.1},
        {"fasting_glucose": 110, "hba1c": 7.2},
    ],
)
def test_discordant_tests_reduce_confidence_and_require_confirmation(payload):
    result = infer(payload)
    calibration = result["confidence_calibration"]
    assert calibration["status"] == "discordant"
    assert calibration["requires_confirmation"] is True
    assert result["certainty"] <= 0.76
    assert "conflicting_lab_categories" in calibration["limiting_factors"]


def test_random_glucose_with_classic_symptoms_is_strong_corroborated_evidence():
    result = infer({
        "random_plasma_glucose": 220,
        "frequent_urination": True,
        "excessive_thirst": True,
    })
    assert result["diagnosis"] == "Diabetes Mellitus (Confirmed)"
    assert result["confidence_calibration"]["status"] == "corroborated"
    assert result["certainty"] >= 0.94


def test_symptom_only_result_is_capped_as_screening_confidence():
    result = infer({
        "frequent_urination": True,
        "excessive_thirst": True,
        "weight_loss": True,
    })
    calibration = result["confidence_calibration"]
    assert calibration["status"] == "screening_only"
    assert calibration["requires_confirmation"] is True
    assert result["certainty"] <= 0.72


def test_two_normal_measures_support_normal_result_without_overclaiming_accuracy():
    result = infer({"fasting_glucose": 88, "hba1c": 5.2})
    calibration = result["confidence_calibration"]
    assert result["diagnosis"] == "Normal Glucose Regulation — No Diabetes Indication"
    assert calibration["status"] == "corroborated"
    assert calibration["independent_evidence_count"] == 2
    assert 0.85 <= result["certainty"] <= 0.92
    assert "not measured clinical accuracy" in calibration["meaning"]


def test_duplicate_rules_on_one_measure_do_not_create_false_independence():
    duplicate_rules = [
        {
            "id": index,
            "code": f"duplicate-{index}",
            "name": f"Duplicate {index}",
            "category": "diagnosis",
            "status": "active",
            "priority": "high",
            "certainty_factor": 0.9,
            "conditions": [{"fact_key": "hba1c", "operator": ">=", "expected_value": 6.5}],
            "actions": [{"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"}],
        }
        for index in (1, 2)
    ]
    result = run_inference({"hba1c": 7.2}, duplicate_rules)
    assert result["explanation_trace"]["confidence_calculation"]["raw_rule_certainty"] > 0.95
    assert result["confidence_calibration"]["independent_evidence_count"] == 1
    assert result["certainty"] == 0.82
