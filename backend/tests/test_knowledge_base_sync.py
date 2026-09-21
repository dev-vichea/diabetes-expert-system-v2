"""Existing-database upgrades must preserve edits and switch only bundled rules."""

import pytest

from app.extensions import db
from app.models import Fact, Rule, RuleAction, RuleCondition, User
from app.repositories import FactRepository
from app.utils.diabetes_fact_seed_data import FACT_CATALOG_SEED
from app.utils.diabetes_rule_seed_data_v3 import DIABETES_RULE_SEED_V3
from app.utils.seed import STRUCTURED_RULE_SEEDS, _active_structured_seed, sync_knowledge_base


def test_v3_catalog_covers_conditions_and_assertions():
    keys = [fact["key"] for fact in FACT_CATALOG_SEED]
    required = {c["fact_key"] for r in DIABETES_RULE_SEED_V3 for c in r["conditions"]}
    required.update(
        a["action_value"].split("=", 1)[0]
        for r in DIABETES_RULE_SEED_V3
        for a in r["actions"]
        if a["action_type"] == "assert_fact"
    )
    assert required <= set(keys)
    assert len(keys) == len(set(keys))


def test_seed_selection_defaults_to_v3(app):
    with app.app_context():
        app.config.pop("RULES_SEED_VERSION")
        assert _active_structured_seed() is DIABETES_RULE_SEED_V3


def test_sync_upgrades_v1_preserving_custom_rules_facts_and_users(app):
    with app.app_context():
        custom = Rule(code="diagnosis-custom-clinician-rule", name="Custom rule", status="active")
        db.session.add(custom)
        fatigue = Fact.query.filter_by(key="fatigue").one()
        fatigue.meaning = "Clinician-written explanation"
        fatigue.weight = 0.44
        fatigue.is_active = False
        user = User.query.filter_by(email="doctor@example.com").one()
        user.name = "Edited clinician name"
        db.session.commit()
        user_count = User.query.count()
        app.config["RULES_SEED_VERSION"] = "v3"

        result = sync_knowledge_base()

        active = {r.code for r in Rule.query.filter_by(status="active")}
        assert active == {r["code"] for r in DIABETES_RULE_SEED_V3} | {custom.code}
        assert result == {"rules": len(DIABETES_RULE_SEED_V3) + 1, "facts": len(FACT_CATALOG_SEED)}
        assert fatigue.meaning == "Clinician-written explanation"
        assert fatigue.weight == pytest.approx(0.44)
        assert fatigue.is_active is False
        assert User.query.count() == user_count
        assert user.name == "Edited clinician name"

        rule = Rule.query.filter_by(code="v3-diabetes-hba1c").one()
        rule.explanation_text = "Clinician-written rule explanation"
        rule.status = "inactive"
        rule.conditions[0].expected_value = "6.7"
        db.session.commit()
        counts = (Rule.query.count(), RuleCondition.query.count(), RuleAction.query.count())

        sync_knowledge_base()

        assert (Rule.query.count(), RuleCondition.query.count(), RuleAction.query.count()) == counts
        assert rule.explanation_text == "Clinician-written rule explanation"
        assert rule.status == "inactive"
        assert rule.conditions[0].expected_value == "6.7"


@pytest.mark.parametrize("version", ["v1", "v2"])
def test_switching_back_archives_v3_rules(app, version):
    with app.app_context():
        app.config["RULES_SEED_VERSION"] = "v3"
        sync_knowledge_base()
        app.config["RULES_SEED_VERSION"] = version
        sync_knowledge_base()
        assert {r.code for r in Rule.query.filter_by(status="active")} == {
            r["code"] for r in STRUCTURED_RULE_SEEDS[version]
        }
        app.config["RULES_SEED_VERSION"] = "v3"
        sync_knowledge_base()
        assert {r.code for r in Rule.query.filter_by(status="active")} == {
            r["code"] for r in DIABETES_RULE_SEED_V3
        }


def test_derived_facts_are_visible_but_excluded_from_symptom_overlay(app):
    with app.app_context():
        repo = FactRepository()
        derived = repo.list_facts(category="derived")
        assert derived
        assert "possible_dka" in {row["key"] for row in derived}
        assert {row["key"] for row in derived}.isdisjoint(repo.get_active_fact_map())
        assert "fatigue" in repo.get_active_fact_map()


def test_sync_command_upgrades_existing_database(app):
    result = app.test_cli_runner().invoke(args=["sync-knowledge-base", "--version", "v3"])
    assert result.exit_code == 0, result.output
    assert f"{len(DIABETES_RULE_SEED_V3)} active rules" in result.output
    assert f"{len(FACT_CATALOG_SEED)} facts" in result.output


def test_sync_rolls_back_partial_upgrade(app, monkeypatch):
    from app.utils import seed

    with app.app_context():
        before = {row.code for row in Rule.query.filter_by(status="active")}
        app.config["RULES_SEED_VERSION"] = "v3"

        def fail(*args, **kwargs):
            raise RuntimeError("Simulated write failure")

        monkeypatch.setattr(seed, "_seed_structured_rules", fail)
        with pytest.raises(RuntimeError, match="Simulated write failure"):
            sync_knowledge_base()
        assert {row.code for row in Rule.query.filter_by(status="active")} == before
