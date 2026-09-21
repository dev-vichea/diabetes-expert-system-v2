import pytest

from app.dependencies import get_fact_service, get_rule_service
from app.errors import ValidationError
from app.expert_system.condition_evaluator import evaluate_condition
from app.expert_system.inference_engine import run_inference
from app.expert_system.knowledge_integrity import audit_knowledge_base
from app.expert_system.patient_messaging import rewrite_recommendation_bilingual
from app.extensions import db
from app.models import Fact, Rule, RuleVersion
from app.utils.diabetes_fact_seed_data import FACT_CATALOG_SEED
from app.utils.diabetes_knowledge_extensions import KNOWLEDGE_MESSAGES
from app.utils.diabetes_rule_seed_data_v3 import DIABETES_RULE_SEED_V3, V3_PREVIOUS_DEFINITIONS
from app.utils.seed import _seed_structured_rules, sync_knowledge_base


def make_rule(key="fasting_glucose", value=126, operator=">=", **overrides):
    return {"code": "test-rule", "name": "Test rule", "category": "diagnosis", "status": "active",
            "conditions": [{"fact_key": key, "operator": operator, "expected_value": value}],
            "actions": [{"action_type": "recommendation", "action_value": "Clinical review"}], **overrides}


def test_seed_integrity_and_producer_consumer_links():
    report = audit_knowledge_base(DIABETES_RULE_SEED_V3, FACT_CATALOG_SEED)
    assert report["valid"], report["issues"]
    links = {row["key"]: row for row in report["fact_links"]}
    assert links["fasting_glucose"]["data_type"] == "number"
    assert links["fasting_glucose"]["unit"] == "mg/dL"
    assert "v3-discordant-fpg-high" in links["discordant_glycemic_tests"]["produced_by"]
    assert "v3-review-discordant-tests" in links["discordant_glycemic_tests"]["used_by"]


@pytest.mark.parametrize("rule,code", [
    (make_rule("fastng_glucose"), "unknown_fact"),
    (make_rule(value=True), "type_mismatch"),
    (make_rule("fatigue", 1, "=="), "type_mismatch"),
    (make_rule("fatigue", True, ">="), "type_mismatch"),
    (make_rule(value=float("nan")), "type_mismatch"),
    (make_rule(actions=[{"action_type": "assert_fact", "action_value": "unknown_result=true"}]), "unknown_output"),
    (make_rule("discordant_glycemic_tests", True, "=="), "missing_producer"),
])
def test_invalid_links_and_types(rule, code):
    assert code in {i["code"] for i in audit_knowledge_base([rule], FACT_CATALOG_SEED)["issues"]}


def test_late_producer():
    producer = make_rule(code="producer", category="recommendation", actions=[{"action_type": "assert_fact", "action_value": "discordant_glycemic_tests=true"}])
    consumer = make_rule("discordant_glycemic_tests", True, "==", code="consumer", category="triage")
    assert "late_producer" in {i["code"] for i in audit_knowledge_base([producer, consumer], FACT_CATALOG_SEED)["issues"]}


def test_unknown_boolean_is_not_an_explicit_no():
    condition = {"fact_key": "rapid_onset", "operator": "==", "expected_value": False}
    assert evaluate_condition(condition, {}) is False
    assert evaluate_condition(condition, {"rapid_onset": False}) is True
    assert evaluate_condition({**condition, "operator": "!=", "expected_value": True}, {}) is True


@pytest.mark.parametrize("payload", [
    {"fasting_glucose": 130, "hba1c": 6.1, "family_history": True},
    {"fasting_glucose": 110, "hba1c": 7.2},
])
def test_discordant_results_keep_diabetes_headline_and_confirmation(payload):
    result = run_inference(payload, DIABETES_RULE_SEED_V3)
    assert result["diagnosis"] == "Likely Diabetes Mellitus"
    assert result["facts"]["discordant_glycemic_tests"] is True
    assert result["facts"]["repeat_testing_recommended"] is True
    assert result["recommendation"] == KNOWLEDGE_MESSAGES["discordant"]["en"]


@pytest.mark.parametrize("payload", [{}, {"hba1c": 7}, {"fasting_glucose": 140}, {"fasting_glucose": 130, "hba1c": 7}])
def test_discordance_requires_both_tests_and_actual_disagreement(payload):
    assert run_inference(payload, DIABETES_RULE_SEED_V3)["facts"].get("discordant_glycemic_tests") is not True


@pytest.mark.parametrize("glucose,urgency", [(69, "urgent"), (53, "emergency")])
def test_low_fasting_glucose_cannot_be_normal(glucose, urgency):
    result = run_inference({"fasting_glucose": glucose, "hba1c": 5.2}, DIABETES_RULE_SEED_V3)
    assert result["urgency"] == urgency
    assert "Normal Glucose Regulation" not in result["diagnosis"]
    assert result["facts"].get("normal_fasting_glucose") is not True


def test_followup_does_not_inflate_diagnosis_certainty():
    payload = {"tingling_hands_feet": True}
    baseline = [r for r in DIABETES_RULE_SEED_V3 if not r["code"].startswith("v3-review-")]
    result = run_inference(payload, DIABETES_RULE_SEED_V3)
    assert result["facts"]["clinical_review_recommended"] is True
    assert result["certainty"] == run_inference(payload, baseline)["certainty"]
    assert result["recommendation"] == KNOWLEDGE_MESSAGES["nerve_review"]["en"]


def test_patient_inputs_cannot_forge_rule_outputs():
    result = run_inference({"symptoms": {"diabetes_diagnostic_criterion_met": True, "type1_pattern_evidence": True, "urgent_flag": True}}, DIABETES_RULE_SEED_V3)
    assert result["facts"].get("diabetes_diagnostic_criterion_met") is not True
    assert result["facts"].get("type1_pattern_evidence") is not True
    assert result["urgency"] != "emergency"


def test_followup_messages_are_bilingual():
    for entry in KNOWLEDGE_MESSAGES.values():
        assert rewrite_recommendation_bilingual(entry["en"]) == entry


def test_rule_management_rejects_bad_links_and_resolves_aliases(app):
    with app.app_context():
        service = get_rule_service()
        with pytest.raises(ValidationError, match="not registered"):
            service.create_rule(make_rule("fastng_glucose"))
        with pytest.raises(ValidationError, match="expects number"):
            service.create_rule(make_rule(value=True))
        assert service.create_rule(make_rule("fpg"))["conditions"][0]["fact_key"] == "fasting_glucose"


def test_referenced_fact_cannot_be_deactivated(app):
    with app.app_context():
        fact = Fact.query.filter_by(key="fasting_glucose").one()
        with pytest.raises(ValidationError, match="break active rules"):
            get_fact_service().set_fact_active(fact.id, False)
        assert fact.is_active is True


def test_only_producer_cannot_be_archived(app):
    with app.app_context():
        app.config["RULES_SEED_VERSION"] = "v3"
        sync_knowledge_base()
        service = get_rule_service()
        first = Rule.query.filter_by(code="v3-discordant-fpg-high").one()
        second = Rule.query.filter_by(code="v3-discordant-hba1c-high").one()
        service.archive_rule(first.id)
        with pytest.raises(ValidationError, match="no other active rule"):
            service.archive_rule(second.id)


def test_upgrades_preserve_edits_and_record_previous_version(app):
    with app.app_context():
        _seed_structured_rules(list(V3_PREVIOUS_DEFINITIONS.values()))
        db.session.commit()
        edited = Rule.query.filter_by(code="v3-healthy-normal-labs").one()
        edited.explanation_text = "Clinician edit"
        db.session.commit()
        app.config["RULES_SEED_VERSION"] = "v3"
        sync_knowledge_base()
        normal = Rule.query.filter_by(code="v3-normal-glucose").one()
        assert any(c.operator == ">=" and c.expected_value == "70" for c in normal.conditions)
        assert RuleVersion.query.filter_by(rule_id=normal.id, change_type="before_seed_upgrade").count() == 1
        assert edited.explanation_text == "Clinician edit"
        sync_knowledge_base()
        assert RuleVersion.query.filter_by(rule_id=normal.id).count() == 1


def test_integrity_api(app, client, doctor_auth):
    assert client.get("/api/rules/integrity").status_code == 401
    with app.app_context():
        app.config["RULES_SEED_VERSION"] = "v3"
        sync_knowledge_base()
    response = client.get("/api/rules/integrity", headers={"Authorization": f"Bearer {doctor_auth['access_token']}"})
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["valid"], data["issues"]
    assert data["summary"]["active_rules"] == len(DIABETES_RULE_SEED_V3)
