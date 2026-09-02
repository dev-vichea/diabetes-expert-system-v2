"""Rule seed V2 — minimal seed aligned with the adaptive assessment engine.

DIABETES_RULE_SEED_V2 mirrors app.expert_system.adaptive_assessment: the lab
cutoffs, emergency clusters and type discriminators are the same numbers and
the same gates. These tests run the inference engine with the v2 seed over
the same personas the adaptive engine evaluates and assert the two pipelines
agree, plus check the RULES_SEED_VERSION seeding switch.
"""

import pytest

from app import create_app
from app.config import Config
from app.expert_system.adaptive_assessment import build_interview_state
from app.expert_system.inference_engine import run_inference
from app.expert_system.rule_loading import RuleLoader
from app.utils.diabetes_rule_seed_data_v2 import DIABETES_RULE_SEED_V2


V2_CODES = {rule["code"] for rule in DIABETES_RULE_SEED_V2}


def _engine_conclusions(result: dict) -> set:
    return {
        conclusion
        for rule in result.get("triggered_rules") or []
        for conclusion in (rule.get("conclusions") or [])
    }


def _adaptive_state(payload: dict) -> dict:
    """Run the adaptive interview loop to completion for this payload."""
    return build_interview_state(payload, skipped=[], answered=list(payload.keys()))


def test_v2_seed_compiles_with_zero_skipped():
    load_result = RuleLoader().load(DIABETES_RULE_SEED_V2)
    assert len(load_result.rules) == len(DIABETES_RULE_SEED_V2)
    assert load_result.skipped_rules == []


def test_v2_codes_are_prefixed_and_unique():
    assert all(code.startswith("v2-") for code in V2_CODES)
    assert len(V2_CODES) == len(DIABETES_RULE_SEED_V2)


# ── Persona cross-checks: rule engine (v2 seed) vs adaptive engine ──


def test_prediabetes_lab_agrees_with_adaptive_banding():
    payload = {"age": 45, "sex": "male", "hba1c": 6.1}
    result = run_inference(payload, DIABETES_RULE_SEED_V2)
    assert "prediabetes_possible" in _engine_conclusions(result)
    adaptive = _adaptive_state(payload)
    pattern_ids = {p["id"] for p in adaptive["patterns"]}
    # The adaptive T2-like pattern absorbs the same lab signal.
    assert "insulin_resistance_like" in pattern_ids


def test_diabetic_lab_agrees_with_adaptive_banding():
    payload = {"age": 52, "sex": "female", "hba1c": 7.2}
    result = run_inference(payload, DIABETES_RULE_SEED_V2)
    assert "diabetes_likely" in _engine_conclusions(result)
    assert result["urgency"] in {"urgent", "soon"}
    adaptive = _adaptive_state(payload)
    assert "insulin_resistance_like" in {p["id"] for p in adaptive["patterns"]}


def test_classic_symptoms_without_labs_screen_with_type2_pattern():
    payload = {
        "age": 50,
        "sex": "male",
        "frequent_urination": True,
        "excessive_thirst": True,
        "weight_loss": True,
        "rapid_onset": False,
    }
    result = run_inference(payload, DIABETES_RULE_SEED_V2)
    conclusions = _engine_conclusions(result)
    assert "symptom_only_screening" in conclusions
    assert result["suspected_type"]["type"] == "Type 2"
    adaptive = _adaptive_state(payload)
    assert adaptive["focus"] == "focus_t2_like"
    assert "insulin_resistance_like" in {p["id"] for p in adaptive["patterns"]}


def test_sudden_child_presentation_types_as_type1():
    payload = {
        "age": 10,
        "sex": "male",
        "frequent_urination": True,
        "excessive_thirst": True,
        "weight_loss": True,
        "rapid_onset": True,
    }
    result = run_inference(payload, DIABETES_RULE_SEED_V2)
    assert result["suspected_type"]["type"] == "Type 1"
    adaptive = _adaptive_state(payload)
    assert adaptive["focus"] == "focus_t1_like"
    assert "insulin_deficiency_like" in {p["id"] for p in adaptive["patterns"]}


def test_pregnant_with_symptoms_maps_to_gestational_pattern():
    payload = {
        "age": 28,
        "sex": "female",
        "currently_pregnant": True,
        "frequent_urination": True,
        "excessive_thirst": True,
    }
    result = run_inference(payload, DIABETES_RULE_SEED_V2)
    assert "gestational_diabetes_likely" in _engine_conclusions(result)
    assert result["suspected_type"]["type"] == "Gestational"
    adaptive = _adaptive_state(payload)
    assert "gestational_risk" in {p["id"] for p in adaptive["patterns"]}


def test_dka_cluster_is_emergency_in_both_engines():
    payload = {"vomiting": True, "abdominal_pain": True, "fruity_breath": True}
    result = run_inference(payload, DIABETES_RULE_SEED_V2)
    assert result["urgency"] == "emergency"
    adaptive = _adaptive_state(payload)
    # The adaptive engine treats this exact cluster as its emergency branch.
    evidence_emergency = adaptive["focus"] == "focus_urgent"
    assert evidence_emergency or adaptive["done"]


def test_critical_random_glucose_is_emergency_in_both_engines():
    payload = {"age": 40, "sex": "male", "random_plasma_glucose": 320}
    result = run_inference(payload, DIABETES_RULE_SEED_V2)
    assert result["urgency"] == "emergency"
    adaptive = _adaptive_state(payload)
    assert adaptive["focus"] == "focus_urgent" or adaptive["done"]


def test_risk_cluster_without_labs_stays_preventive():
    payload = {
        "age": 50,
        "sex": "male",
        "family_history": True,
        "obesity": True,
        "hypertension": True,
        "sedentary_lifestyle": True,
    }
    result = run_inference(payload, DIABETES_RULE_SEED_V2)
    conclusions = _engine_conclusions(result)
    assert "type2_risk_increased" in conclusions
    assert result["urgency"] == "routine"
    adaptive = _adaptive_state(payload)
    top = adaptive["patterns"][0] if adaptive["patterns"] else None
    assert top is not None and top["id"] == "insulin_resistance_like"
    assert top["strength"] >= 0.45


def test_lone_stomach_ache_is_not_emergency_in_either_engine():
    payload = {"age": 33, "sex": "female", "abdominal_pain": True}
    result = run_inference(payload, DIABETES_RULE_SEED_V2)
    assert result["urgency"] != "emergency"
    adaptive = _adaptive_state(payload)
    assert adaptive["focus"] != "focus_urgent"


# ── Compound-condition semantics (regression guards) ──


def test_pregnancy_without_evidence_does_not_claim_gestational_diabetes():
    result = run_inference({"age": 28, "sex": "female", "currently_pregnant": True}, DIABETES_RULE_SEED_V2)
    assert "gestational_diabetes_likely" not in _engine_conclusions(result)


def test_lab_only_result_does_not_claim_type_or_healthy_or_gestational():
    result = run_inference({"age": 52, "sex": "female", "hba1c": 7.2}, DIABETES_RULE_SEED_V2)
    conclusions = _engine_conclusions(result)
    # diabetes + a Type-2 lean (the adaptive engine leans the same way from the
    # lab boost + age prior) — but never gestational/healthy/risk on top.
    assert "diabetes_likely" in conclusions
    assert "type2_pattern_likely" in conclusions
    assert "gestational_diabetes_likely" not in conclusions
    assert "healthy_normal" not in conclusions
    assert "type2_risk_increased" not in conclusions
    assert result["suspected_type"]["type"] == "Type 2"
    assert result["urgency"] == "urgent"


def test_risk_conclusion_requires_no_diagnostic_evidence():
    obese = {"age": 50, "sex": "male", "obesity": True}
    assert "type2_risk_increased" in _engine_conclusions(run_inference(obese, DIABETES_RULE_SEED_V2))
    diagnosed = {"age": 50, "sex": "male", "obesity": True, "hba1c": 7.4}
    assert "type2_risk_increased" not in _engine_conclusions(run_inference(diagnosed, DIABETES_RULE_SEED_V2))


def test_healthy_normal_requires_an_actual_normal_lab():
    no_labs = {"age": 30, "sex": "male"}
    assert "healthy_normal" not in _engine_conclusions(run_inference(no_labs, DIABETES_RULE_SEED_V2))
    normal_labs = {"age": 30, "sex": "male", "fasting_glucose": 88, "hba1c": 5.2}
    assert "healthy_normal" in _engine_conclusions(run_inference(normal_labs, DIABETES_RULE_SEED_V2))


# ── RULES_SEED_VERSION seeding switch (DB) ──


@pytest.fixture()
def v2_app(tmp_path):
    db_path = tmp_path / "test_v2_seed.db"

    class V2Config(Config):
        TESTING = True
        SECRET_KEY = "test-secret-key"
        CORS_ORIGINS = ["*"]
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{db_path}"
        DB_AUTO_CREATE = True
        SEED_DEMO_DATA = True
        RULES_SEED_VERSION = "v2"
        JWT_ACCESS_EXPIRES_SECONDS = 300
        JWT_REFRESH_EXPIRES_SECONDS = 1800

    return create_app(V2Config)


def test_v2_seeding_activates_only_v2_rules(v2_app):
    with v2_app.app_context():
        from app.models import Rule
        from app.repositories.rule_repository import RuleRepository

        active = {row.code for row in Rule.query.filter(Rule.status == "active").all()}
        # Every active structured rule belongs to the v2 seed (v1 rules are
        # archived by the version switch, never left running alongside it).
        assert active - V2_CODES == set()
        assert "v2-diabetes-hba1c" in active
        assert "diagnosis-hba1c-threshold" not in active
        # The engine compiles and runs with exactly the active DB rules —
        # same path the diagnosis service uses.
        load_result = RuleLoader().load(RuleRepository().list_rules(status="active"))
        assert not load_result.skipped_rules


def test_default_seeding_stays_v1(app):
    """The default app fixture keeps the v1 seed — existing behavior unchanged."""
    with app.app_context():
        from app.models import Rule

        active = {row.code for row in Rule.query.filter(Rule.status == "active").all()}
        assert "diagnosis-hba1c-threshold" in active
        assert "v2-diabetes-hba1c" not in active
        assert not any(code.startswith("v2-") for code in active)
