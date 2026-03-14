from app.expert_system.inference_engine import run_inference


def test_forward_chaining_derives_fact_and_fires_dependent_rule():
    rules = [
        {
            "id": 1,
            "name": "Identify high-risk profile",
            "status": "active",
            "condition": "risk_family_history and fasting_glucose >= 110",
            "certainty_factor": 0.6,
            "priority": "medium",
            "actions": [
                {
                    "action_type": "assert_fact",
                    "action_value": "high_risk_patient = true",
                }
            ],
        },
        {
            "id": 2,
            "name": "High-risk diabetes likelihood",
            "status": "active",
            "condition": "high_risk_patient and hba1c >= 6.5",
            "certainty_factor": 0.8,
            "priority": "high",
            "actions": [
                {
                    "action_type": "diagnosis_conclusion",
                    "action_value": "diabetes_likely",
                    "recommendation": "Immediate confirmatory testing",
                }
            ],
        },
    ]

    result = run_inference(
        {
            "fasting_glucose": 120,
            "hba1c": 6.6,
            "risk_factors": {"family_history": True},
        },
        rules,
    )

    assert result["diagnosis"] == "Likely Diabetes"
    assert result["certainty"] >= 0.8
    fired_ids = [item["id"] for item in result["triggered_rules"]]
    assert fired_ids == [2, 1] or fired_ids == [1, 2]

    derived_facts = result["explanation_trace"]["inference"]["derived_facts"]
    assert any(row["fact"] == "high_risk_patient" and row["value"] is True for row in derived_facts)


def test_rule_parser_skips_unsafe_expression():
    rules = [
        {
            "id": 99,
            "name": "Unsafe rule",
            "status": "active",
            "condition": "__import__('os').system('echo no')",
            "certainty_factor": 1.0,
            "priority": "high",
            "conclusion": "diabetes_likely",
        }
    ]

    result = run_inference({"fasting_glucose": 150, "hba1c": 7.2}, rules)

    assert result["diagnosis"] == "No strong diabetes indication"
    loading_trace = result["explanation_trace"]["rule_loading"]
    assert loading_trace["compiled_rules"] == 0
    assert len(loading_trace["skipped_rules"]) == 1
    assert "not allowed" in loading_trace["skipped_rules"][0]["reason"].lower()


def test_priority_weight_is_applied_in_certainty_combination():
    rules = [
        {
            "id": 10,
            "name": "High priority glucose rule",
            "status": "active",
            "condition": "fasting_glucose >= 126",
            "certainty_factor": 0.7,
            "priority": "high",
            "conclusion": "diabetes_possible",
        },
        {
            "id": 11,
            "name": "Low priority hba1c rule",
            "status": "active",
            "condition": "hba1c >= 6.5",
            "certainty_factor": 0.7,
            "priority": "low",
            "conclusion": "diabetes_possible",
        },
    ]

    result = run_inference({"fasting_glucose": 130, "hba1c": 6.8}, rules)

    assert result["diagnosis"] == "Possible Diabetes"
    assert result["certainty"] == 0.87

    confidence_trace = result["explanation_trace"]["confidence_calculation"]
    assert confidence_trace["top_conclusion"] == "diabetes_possible"
    assert confidence_trace["conclusion_scores"][0]["certainty"] == 0.868


def test_grouped_forward_chaining_executes_stages_in_order_with_shared_memory():
    rules = [
        {
            "id": 1,
            "name": "Triage hyperglycemia",
            "category": "triage",
            "status": "active",
            "condition": "fasting_glucose >= 126",
            "priority": "high",
            "certainty_factor": 0.8,
            "actions": [{"action_type": "assert_fact", "action_value": "hyperglycemia_present = true"}],
        },
        {
            "id": 2,
            "name": "Diagnosis from triage",
            "category": "diagnosis",
            "status": "active",
            "condition": "hyperglycemia_present == true",
            "priority": "high",
            "certainty_factor": 0.8,
            "actions": [{"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"}],
        },
        {
            "id": 3,
            "name": "Classification high risk",
            "category": "classification",
            "status": "active",
            "condition": "hyperglycemia_present == true",
            "priority": "medium",
            "certainty_factor": 0.6,
            "actions": [{"action_type": "assert_fact", "action_value": "high_type2_risk_pattern = true"}],
        },
        {
            "id": 4,
            "name": "Recommendation escalation",
            "category": "recommendation",
            "status": "active",
            "condition": "high_type2_risk_pattern == true",
            "priority": "medium",
            "certainty_factor": 0.7,
            "actions": [{"action_type": "recommendation", "action_value": "Schedule urgent endocrinology follow-up."}],
        },
    ]

    result = run_inference({"fasting_glucose": 132}, rules)

    assert result["diagnosis"] == "Likely Diabetes"
    assert result["recommendation"] == "Schedule urgent endocrinology follow-up."
    assert result["facts"]["hyperglycemia_present"] is True
    assert result["facts"]["high_type2_risk_pattern"] is True

    stage_execution = result["explanation_trace"]["inference"]["stage_execution"]
    stage_names = [stage["stage"] for stage in stage_execution]
    assert stage_names[:4] == ["triage", "diagnosis", "classification", "recommendation"]

    fired_stages = [row["stage"] for row in result["explanation_trace"]["inference"]["fired_rules"]]
    assert fired_stages == ["triage", "diagnosis", "classification", "recommendation"]
