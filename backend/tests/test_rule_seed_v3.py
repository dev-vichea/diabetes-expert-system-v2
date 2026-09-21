"""Rule seed V3 - merged edition (V2 architecture + V1 gems + IADPSG fix).

V3 keeps V2's contract: every rule mirrors a branch of the adaptive engine and
uses only conclusions mapped in DIAGNOSIS_BY_CONCLUSION. It adds the pregnancy
logic V2 was missing (IADPSG thresholds existed only in text), guards the
healthy-normal conclusion, and restores the strongest V1 knowledge.
"""

import pytest

from app import create_app
from app.config import Config
from app.expert_system.inference_engine import run_inference
from app.expert_system.rule_loading import RuleLoader
from app.utils.diabetes_rule_seed_data_v3 import DIABETES_RULE_SEED_V3


V3_CODES = {rule["code"] for rule in DIABETES_RULE_SEED_V3}


def _engine_conclusions(result: dict) -> set:
    return {
        conclusion
        for rule in result.get("triggered_rules") or []
        for conclusion in (rule.get("conclusions") or [])
    }


# ── Structure ──


def test_v3_seed_compiles_with_zero_skipped():
    load_result = RuleLoader().load(DIABETES_RULE_SEED_V3)
    assert len(load_result.rules) == len(DIABETES_RULE_SEED_V3)
    assert load_result.skipped_rules == []


def test_v3_codes_are_prefixed_and_unique():
    assert all(code.startswith("v3-") for code in V3_CODES)
    assert len(V3_CODES) == len(DIABETES_RULE_SEED_V3)


def test_v3_has_the_iadpsg_rules_v2_lacked():
    assert "v3-gdm-fasting-high" in V3_CODES
    assert "v3-gdm-ogtt-high" in V3_CODES
    assert "v3-gdm-one-hour-ogtt-high" in V3_CODES
    assert "v3-gdm-screen-positive" in V3_CODES
    assert "v3-gdm-prior-early-test" in V3_CODES
    assert "v3-demographic-screening" in V3_CODES


# ── The two cases V2 got wrong (and V1 got half wrong) ──


def test_pregnant_with_iadpsg_fasting_is_gestational_not_normal():
    """Fasting 95 mg/dL in pregnancy = GDM range (>=92 IADPSG). V2 answered
    'Normal Glucose Regulation' (false reassurance); V1 answered 'emergency'.
    V3 must answer: gestational pathway, urgent, never healthy-normal."""
    payload = {"age": 30, "sex": "female", "currently_pregnant": True, "fasting_glucose": 95}
    result = run_inference(payload, DIABETES_RULE_SEED_V3)
    conclusions = _engine_conclusions(result)
    assert "gestational_diabetes_likely" in conclusions
    assert "healthy_normal" not in conclusions
    assert result["suspected_type"]["type"] == "Gestational"
    assert result["urgency"] in {"urgent", "soon"}
    assert result["urgency"] != "emergency"


def test_pregnant_with_symptoms_requests_review_without_claiming_gdm():
    payload = {
        "age": 28,
        "sex": "female",
        "currently_pregnant": True,
        "frequent_urination": True,
        "excessive_thirst": True,
    }
    result = run_inference(payload, DIABETES_RULE_SEED_V3)
    assert "gestational_diabetes_likely" not in _engine_conclusions(result)
    assert result["facts"]["pregnancy_glucose_review_needed"] is True
    assert result["facts"]["clinical_review_recommended"] is True
    assert not result.get("suspected_type") or result["suspected_type"]["type"] != "Gestational"


def test_pregnancy_alone_does_not_claim_gestational_diabetes():
    result = run_inference({"age": 28, "sex": "female", "currently_pregnant": True}, DIABETES_RULE_SEED_V3)
    assert "gestational_diabetes_likely" not in _engine_conclusions(result)


@pytest.mark.parametrize("value", [180, 220])
def test_pregnant_one_hour_75g_ogtt_at_threshold_is_gestational(value):
    result = run_inference(
        {"age": 30, "currently_pregnant": True, "one_hour_ogtt_75g": value},
        DIABETES_RULE_SEED_V3,
    )
    assert "gestational_diabetes_likely" in _engine_conclusions(result)
    assert result["facts"]["gestational_diabetes_suspected"] is True
    assert result["suspected_type"]["type"] == "Gestational"
    assert result["confidence_calibration"]["status"] == "pregnancy_criterion_met"


def test_pregnant_one_hour_75g_ogtt_below_threshold_is_not_gestational():
    result = run_inference(
        {"age": 30, "currently_pregnant": True, "one_hour_ogtt_75g": 179},
        DIABETES_RULE_SEED_V3,
    )
    assert "gestational_diabetes_likely" not in _engine_conclusions(result)


def test_pregnant_hba1c_alone_does_not_get_mislabeled_as_gdm():
    result = run_inference(
        {"age": 30, "currently_pregnant": True, "hba1c": 7.0},
        DIABETES_RULE_SEED_V3,
    )
    conclusions = _engine_conclusions(result)
    assert "diabetes_likely" in conclusions
    assert "gestational_diabetes_likely" not in conclusions
    assert not result.get("suspected_type") or result["suspected_type"]["type"] != "Gestational"


@pytest.mark.parametrize(
    "payload",
    [
        {"fasting_glucose": 126, "hba1c": 6.5},
        {"fasting_glucose": 126, "2h_ogtt_75g": 200},
        {"hba1c": 6.5, "2h_ogtt_75g": 200},
    ],
)
def test_two_different_diabetes_range_tests_confirm_diabetes(payload):
    result = run_inference(payload, DIABETES_RULE_SEED_V3)
    assert result["diagnosis"] == "Diabetes Mellitus (Confirmed)"
    assert result["facts"]["diabetes_confirmed_by_two_tests"] is True
    assert result["confidence_calibration"]["status"] == "corroborated"
    assert result["confidence_calibration"]["requires_confirmation"] is False


def test_one_diabetes_range_test_stays_likely_and_needs_confirmation():
    result = run_inference({"hba1c": 6.5}, DIABETES_RULE_SEED_V3)
    assert result["diagnosis"] == "Likely Diabetes Mellitus"
    assert result["facts"].get("diabetes_confirmed_by_two_tests") is not True
    assert result["confidence_calibration"]["status"] == "confirmation_needed"


def test_random_glucose_with_classic_symptoms_confirms_but_glucose_alone_does_not():
    confirmed = run_inference(
        {"random_plasma_glucose": 200, "frequent_urination": True, "excessive_thirst": True},
        DIABETES_RULE_SEED_V3,
    )
    isolated = run_inference({"random_plasma_glucose": 200}, DIABETES_RULE_SEED_V3)
    assert confirmed["diagnosis"] == "Diabetes Mellitus (Confirmed)"
    assert confirmed["facts"]["unequivocal_hyperglycemia_or_crisis"] is True
    assert isolated["diagnosis"] != "Diabetes Mellitus (Confirmed)"


@pytest.mark.parametrize(
    "payload",
    [
        {"fasting_glucose": 120},
        {"hba1c": 6.3},
        {"2h_ogtt_75g": 190},
    ],
)
def test_near_threshold_results_request_repeat_testing(payload):
    result = run_inference(payload, DIABETES_RULE_SEED_V3)
    assert result["facts"]["near_diabetes_threshold"] is True
    assert result["facts"]["repeat_testing_recommended"] is True


@pytest.mark.parametrize(
    "payload",
    [
        {"fasting_glucose": 119},
        {"hba1c": 6.2},
        {"2h_ogtt_75g": 189},
    ],
)
def test_values_below_operational_near_threshold_band_do_not_set_flag(payload):
    result = run_inference(payload, DIABETES_RULE_SEED_V3)
    assert result["facts"].get("near_diabetes_threshold") is not True


# ── Emergency logic mirrors build_evidence (the path V1 missed) ──


def test_dka_cluster_is_emergency_without_labs():
    payload = {"vomiting": True, "abdominal_pain": True, "fruity_breath": True}
    result = run_inference(payload, DIABETES_RULE_SEED_V3)
    assert result["urgency"] == "emergency"


def test_critical_random_glucose_is_emergency():
    payload = {"age": 40, "sex": "male", "random_plasma_glucose": 320}
    result = run_inference(payload, DIABETES_RULE_SEED_V3)
    assert result["urgency"] == "emergency"

# ── Lab banding agrees with the adaptive engine ──


def test_prediabetes_lab_agrees_with_banding():
    payload = {"age": 45, "sex": "male", "hba1c": 6.1}
    result = run_inference(payload, DIABETES_RULE_SEED_V3)
    assert "prediabetes_possible" in _engine_conclusions(result)


def test_diabetic_lab_agrees_with_banding():
    payload = {"age": 52, "sex": "female", "hba1c": 7.2}
    result = run_inference(payload, DIABETES_RULE_SEED_V3)
    conclusions = _engine_conclusions(result)
    assert "diabetes_likely" in conclusions
    assert result["urgency"] in {"urgent", "soon"}


def test_lab_only_result_does_not_claim_healthy_or_gestational():
    result = run_inference({"age": 52, "sex": "female", "hba1c": 7.2}, DIABETES_RULE_SEED_V3)
    conclusions = _engine_conclusions(result)
    assert "healthy_normal" not in conclusions
    assert "gestational_diabetes_likely" not in conclusions


def test_healthy_normal_requires_both_labs_normal_and_no_red_flags():
    no_labs = {"age": 30, "sex": "male"}
    assert "healthy_normal" not in _engine_conclusions(run_inference(no_labs, DIABETES_RULE_SEED_V3))
    both_normal = {"age": 30, "sex": "male", "fasting_glucose": 88, "hba1c": 5.2}
    assert "healthy_normal" in _engine_conclusions(run_inference(both_normal, DIABETES_RULE_SEED_V3))


# ── Restored V1 knowledge ──


def test_adult_35_gets_routine_screening_recommendation():
    result = run_inference({"age": 36, "sex": "male"}, DIABETES_RULE_SEED_V3)
    assert "demographic_screening" in _engine_conclusions(result)


def test_metabolic_cluster_flags_metabolic_syndrome():
    payload = {"age": 45, "sex": "female", "obesity": True, "hypertension": True, "high_cholesterol": True}
    assert "metabolic_syndrome" in _engine_conclusions(run_inference(payload, DIABETES_RULE_SEED_V3))


def test_risk_conclusion_requires_no_diagnostic_evidence():
    obese = {"age": 50, "sex": "male", "obesity": True}
    assert "type2_risk_increased" in _engine_conclusions(run_inference(obese, DIABETES_RULE_SEED_V3))
    diagnosed = {"age": 50, "sex": "male", "obesity": True, "hba1c": 7.4}
    assert "type2_risk_increased" not in _engine_conclusions(run_inference(diagnosed, DIABETES_RULE_SEED_V3))


def test_sudden_child_presentation_types_as_type1():
    payload = {
        "age": 10,
        "sex": "male",
        "frequent_urination": True,
        "excessive_thirst": True,
        "weight_loss": True,
        "rapid_onset": True,
    }
    result = run_inference(payload, DIABETES_RULE_SEED_V3)
    assert result["suspected_type"]["type"] == "Type 1"


def test_classic_symptoms_without_labs_stay_at_screening_level():
    payload = {
        "age": 50,
        "sex": "male",
        "frequent_urination": True,
        "excessive_thirst": True,
        "weight_loss": True,
        "rapid_onset": False,
    }
    result = run_inference(payload, DIABETES_RULE_SEED_V3)
    assert "symptom_only_screening" in _engine_conclusions(result)
    assert result["suspected_type"]["type"] == "Type 2"


# ── RULES_SEED_VERSION=v3 seeding switch (DB) ──


@pytest.fixture()
def v3_app(tmp_path):
    db_path = tmp_path / "test_v3_seed.db"

    class V3Config(Config):
        TESTING = True
        SECRET_KEY = "test-secret-key"
        CORS_ORIGINS = ["*"]
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{db_path}"
        DB_AUTO_CREATE = True
        SEED_DEMO_DATA = True
        RULES_SEED_VERSION = "v3"
        JWT_ACCESS_EXPIRES_SECONDS = 300
        JWT_REFRESH_EXPIRES_SECONDS = 1800

    return create_app(V3Config)


def test_v3_seeding_activates_only_v3_rules(v3_app):
    with v3_app.app_context():
        from app.models import Fact, Rule

        active = {row.code for row in Rule.query.filter(Rule.status == "active").all()}
        assert active - V3_CODES == set()
        assert "v3-diabetes-hba1c" in active
        assert "diagnosis-hba1c-threshold" not in active
        assert "v2-diabetes-hba1c" not in active

        # The doctor-managed fact catalog seeded alongside the rules.
        fact_keys = {row.key for row in Fact.query.all()}
        assert "frequent_urination" in fact_keys
        assert "excessive_thirst" in fact_keys
