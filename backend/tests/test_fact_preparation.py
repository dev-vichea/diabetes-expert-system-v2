from app.expert_system.fact_preparation import prepare_facts


def test_prepare_facts_normalizes_values_and_derives_expected_facts():
    prepared = prepare_facts(
        {
            "weight_kg": "92",
            "height_cm": "175",
            "polyuria": "true",
            "polydipsia": True,
            "fasting_plasma_glucose": "132",
            "blood_glucose": "66",
            "risk_factors": {
                "family_history_diabetes": True,
                "physical_activity_low": "yes",
            },
        }
    )
    facts = prepared.facts

    assert facts["weight_kg"] == 92.0
    assert facts["height_cm"] == 175.0
    assert round(facts["bmi"], 2) == 30.04
    assert facts["is_obese"] is True
    assert facts["classic_hyperglycemia_symptoms"] is True
    assert facts["hyperglycemia_present"] is True
    assert facts["hypoglycemia_present"] is True
    assert facts["high_type2_risk_pattern"] is True


def test_prepare_facts_treats_empty_values_as_unknown():
    prepared = prepare_facts(
        {
            "fasting_glucose": "",
            "hba1c": None,
            "risk_factors": {"family_history_diabetes": ""},
            "labs": {"random_plasma_glucose": ""},
        }
    )
    facts = prepared.facts

    assert "fasting_glucose" not in facts
    assert "hba1c" not in facts
    assert "family_history_diabetes" not in facts
    assert "random_plasma_glucose" not in facts
