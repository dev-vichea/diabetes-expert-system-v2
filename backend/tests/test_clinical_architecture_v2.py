import pytest
from app.expert_system.fact_preparation import prepare_facts
from app.expert_system.condition_evaluator import evaluate_conditions
from app.utils.diabetes_rule_seed_data import DIABETES_RULE_SEED


def _find_rule(code: str) -> dict:
    for rule in DIABETES_RULE_SEED:
        if rule.get("code") == code:
            return rule
    raise ValueError(f"Rule with code '{code}' not found in DIABETES_RULE_SEED")


def test_asian_bmi_cutoff_derivation():
    # Standard Caucasian BMI 23.5 is not overweight (threshold 25)
    facts_caucasian = prepare_facts({
        "ethnicity": "caucasian",
        "weight_kg": 65,
        "height_cm": 166, # BMI ~ 23.59
    }).facts
    assert facts_caucasian.get("asian_bmi_threshold_met") is not True
    assert facts_caucasian.get("is_overweight") is not True

    # Asian BMI 23.5 triggers Asian overweight threshold
    facts_asian = prepare_facts({
        "ethnicity": "asian",
        "weight_kg": 65,
        "height_cm": 166, # BMI ~ 23.59
    }).facts
    assert facts_asian.get("asian_bmi_threshold_met") is True
    assert facts_asian.get("is_overweight") is True

    # Rule evaluation
    rule = _find_rule("risk-asian-bmi-threshold")
    assert evaluate_conditions(rule["conditions"], facts_asian) is True
    assert evaluate_conditions(rule["conditions"], facts_caucasian) is False


def test_waist_circumference_central_obesity():
    # Asian male waist 92 cm (threshold 90 cm) -> central obesity
    facts = prepare_facts({
        "sex": "male",
        "ethnicity": "asian",
        "waist_circumference": 92.0,
    }).facts
    assert facts.get("central_obesity") is True

    # Asian female waist 75 cm (threshold 80 cm) -> no central obesity
    facts_female_normal = prepare_facts({
        "sex": "female",
        "ethnicity": "asian",
        "waist_circumference": 75.0,
    }).facts
    assert facts_female_normal.get("central_obesity") is not True


def test_ada_risk_score_calculation():
    # Asymptomatic adult: Age 52 (+2), Male (+1), Family history (+1), High BP (+1), Inactive (+1), BMI 26 Caucasian (+1)
    # Total score = 7 (High ADA risk >= 5)
    facts = prepare_facts({
        "age": 52,
        "sex": "male",
        "family_history": True,
        "systolic_bp": 135,
        "diastolic_bp": 85,
        "physical_activity_minutes_week": 60, # <150 min
        "bmi": 26.0,
        "ethnicity": "caucasian",
    }).facts
    assert facts.get("ada_risk_score") == 7.0
    assert facts.get("high_ada_risk") is True

    # Rule evaluation
    rule = _find_rule("risk-ada-score-high")
    assert evaluate_conditions(rule["conditions"], facts) is True


def test_metabolic_syndrome_cluster_rule():
    # Central obesity + Hypertension + Low HDL
    facts = prepare_facts({
        "obesity": True,
        "systolic_bp": 140,
        "dyslipidemia_low_hdl": True,
    }).facts
    assert facts.get("metabolic_syndrome") is True

    rule = _find_rule("metabolic-syndrome-cluster")
    assert evaluate_conditions(rule["conditions"], facts) is True


def test_lifestyle_driver_recommendation_rules():
    facts = prepare_facts({
        "physical_activity_minutes_week": 45,
        "sugary_diet_frequency": "daily",
        "sleep_hours_night": 5.0,
        "smoking": True,
        "alcohol_drinks_week": 16,
        "sex": "male",
    }).facts

    assert facts.get("physical_inactivity") is True
    assert facts.get("sugary_diet") is True
    assert facts.get("sleep_deprivation_apnea") is True
    assert facts.get("smoking") is True
    assert facts.get("alcohol_frequent") is True

    # Check that each lifestyle recommendation rule triggers
    for code in [
        "lifestyle-physical-inactivity",
        "lifestyle-sugary-diet",
        "lifestyle-sleep-deprivation-apnea",
        "lifestyle-smoking-cessation",
        "lifestyle-alcohol-moderation",
    ]:
        rule = _find_rule(code)
        assert evaluate_conditions(rule["conditions"], facts) is True, f"Rule {code} failed condition check"


def test_quantified_symptom_derivations():
    # Nocturia >= 2 times
    facts = prepare_facts({"nocturia_count": 3}).facts
    assert facts.get("nocturia") is True
    assert facts.get("frequent_urination") is True

    # Severe fatigue scale 8/10
    facts_fatigue = prepare_facts({"fatigue_severity_scale": 8}).facts
    assert facts_fatigue.get("severe_fatigue") is True
    assert facts_fatigue.get("fatigue") is True

    # High water intake 3.5 liters
    facts_thirst = prepare_facts({"water_intake_liters": 3.5}).facts
    assert facts_thirst.get("unquenchable_thirst") is True
    assert facts_thirst.get("excessive_thirst") is True
