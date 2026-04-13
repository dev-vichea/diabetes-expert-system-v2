import pytest

from app.expert_system.condition_evaluator import (
    ConditionValidationError,
    UnsupportedOperatorError,
    evaluate_conditions,
    normalize_conditions,
)


def test_evaluate_supported_numeric_and_boolean_operators():
    conditions = normalize_conditions(
        conditions=[
            {"fact_key": "hba1c", "operator": ">=", "expected_value": 6.5, "sequence": 1},
            {"fact_key": "fasting_glucose", "operator": ">", "expected_value": 125, "sequence": 2, "logical_operator": "and"},
            {"fact_key": "frequent_urination", "operator": "==", "expected_value": True, "sequence": 3, "logical_operator": "and"},
            {"fact_key": "weight_loss", "operator": "!=", "expected_value": False, "sequence": 4, "logical_operator": "and"},
        ]
    )
    facts = {
        "hba1c": 7.1,
        "fasting_glucose": 138,
        "frequent_urination": True,
        "weight_loss": True,
    }

    assert evaluate_conditions(conditions, facts) is True


def test_evaluate_in_and_contains_operators():
    conditions = normalize_conditions(
        conditions=[
            {"fact_key": "risk_bucket", "operator": "in", "expected_value": ["high", "very_high"], "sequence": 1},
            {"fact_key": "matched_symptoms", "operator": "contains", "expected_value": "excessive_thirst", "sequence": 2, "logical_operator": "and"},
        ]
    )
    facts = {
        "risk_bucket": "high",
        "matched_symptoms": ["fatigue", "excessive_thirst"],
    }

    assert evaluate_conditions(conditions, facts) is True


def test_normalize_conditions_rejects_unsupported_operator():
    with pytest.raises(UnsupportedOperatorError):
        normalize_conditions(
            conditions=[{"fact_key": "hba1c", "operator": "is_true", "expected_value": True}],
            allow_legacy_aliases=False,
        )


def test_normalize_conditions_parses_legacy_expression_without_eval():
    conditions = normalize_conditions(
        condition_expression="frequent_urination and hba1c >= 6.5",
        allow_legacy_aliases=False,
    )

    assert len(conditions) == 2
    assert conditions[0]["fact_key"] == "frequent_urination"
    assert conditions[1]["operator"] == ">="
    assert evaluate_conditions(conditions, {"frequent_urination": True, "hba1c": 6.7}) is True


def test_evaluate_conditions_returns_false_for_unknown_fact():
    conditions = normalize_conditions(
        conditions=[{"fact_key": "hba1c", "operator": ">=", "expected_value": 6.5}],
        allow_legacy_aliases=False,
    )
    # Missing facts are not an error — the condition simply evaluates to False.
    assert evaluate_conditions(conditions, {}) is False


def test_normalize_conditions_rejects_unsafe_expression_pattern():
    with pytest.raises(ConditionValidationError):
        normalize_conditions(condition_expression="__import__('os').system('echo bad')")
