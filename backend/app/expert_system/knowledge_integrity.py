"""Structural rule–fact checks, separate from clinical outcome validation."""

import math

from app.expert_system.condition_evaluator import coerce_expected_value, normalize_conditions
from app.expert_system.fact_normalizer import (
    LAB_FACT_ALIASES, MIRRORED_FACTS, NUMERIC_FACT_KEYS, SYMPTOM_FACT_ALIASES,
    normalize_fact_name,
)
from app.expert_system.forward_chaining import _parse_fact_assignment
from app.expert_system.grouped_forward_chaining import DEFAULT_EXECUTION_ORDER
from app.expert_system.rule_loading import RuleLoader

# These are prepared before rule execution, rather than asserted by a rule.
PREPARED_DERIVED_FACTS = {
    "family_history_diabetes", "is_obese", "classic_hyperglycemia_symptoms",
    "ketosis_signs_present", "diabetes_evidence_base", "no_lab_values_available",
    "type2_risk_increased", "hyperglycemia_present",
}
TEXT_FACTS = {"sex", "ethnicity", "pregnancy_stage", "sugary_diet_frequency"}
FACT_UNITS = {
    **{key: "mg/dL" for key in ("fasting_glucose", "fasting_plasma_glucose", "blood_glucose", "random_plasma_glucose", "2h_ogtt_75g")},
    "hba1c": "%", "age": "years", "bmi": "kg/m²", "waist_circumference": "cm",
}


class FactRegistry:
    def __init__(self, facts):
        self.facts = {normalize_fact_name(f["key"]): f for f in facts}
        self.aliases = {}
        for key, row in self.facts.items():
            for alias in row.get("aliases") or []:
                self.aliases.setdefault(normalize_fact_name(alias), set()).add(key)
        for alias, canonical in {**LAB_FACT_ALIASES, **SYMPTOM_FACT_ALIASES}.items():
            key = normalize_fact_name(canonical)
            if key in self.facts:
                self.aliases.setdefault(normalize_fact_name(alias), set()).add(key)
        for canonical, aliases in MIRRORED_FACTS.items():
            key = normalize_fact_name(canonical)
            if key in self.facts:
                for alias in aliases:
                    self.aliases.setdefault(normalize_fact_name(alias), set()).add(key)

    def resolve(self, key):
        key = normalize_fact_name(key)
        if key in self.facts:
            return self.facts[key]
        matches = self.aliases.get(key, set())
        return self.facts[next(iter(matches))] if len(matches) == 1 else None

    @staticmethod
    def metadata(fact):
        key = normalize_fact_name(fact["key"])
        kind = "number" if key in NUMERIC_FACT_KEYS else "text" if key in TEXT_FACTS else "boolean"
        source = "prepared" if key in PREPARED_DERIVED_FACTS else "rule" if fact.get("category") == "derived" else "input"
        return {"data_type": kind, "unit": FACT_UNITS.get(fact["key"]), "value_source": source}

    def canonical_key(self, key):
        row = self.resolve(key)
        return normalize_fact_name(row["key"]) if row else normalize_fact_name(key)


def _compatible(value, kind):
    if kind == "boolean":
        return isinstance(value, bool)
    if kind == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)
    return isinstance(value, str)


def audit_knowledge_base(rules, facts):
    registry = FactRegistry(facts)
    active = [r for r in rules if r.get("status", "active") == "active"]
    issues, links, prepared = [], {}, []
    ranks = {stage: index for index, stage in enumerate(DEFAULT_EXECUTION_ORDER)}

    def issue(rule, code, key, message):
        issues.append({"severity": "error", "code": code, "rule_id": rule.get("id"),
                       "rule_code": rule.get("code") or rule.get("name"), "fact_key": key, "message": message})

    def link(key):
        canonical = registry.canonical_key(key)
        if canonical not in links:
            row = registry.resolve(key)
            links[canonical] = {"key": row["key"] if row else key, "label": row.get("label", key) if row else key,
                                "registered": bool(row), "used_by": [], "produced_by": [],
                                **(registry.metadata(row) if row else {})}
        return links[canonical]

    for rule in active:
        code = rule.get("code") or rule.get("name")
        loaded = RuleLoader().load([rule])
        if loaded.skipped_rules:
            issue(rule, "invalid_rule", None, loaded.skipped_rules[0]["reason"])
            continue
        spec = loaded.rules[0]
        prepared.append((rule, spec))
        for condition in spec.conditions:
            key, op = condition["fact_key"], condition["operator"]
            row = registry.resolve(key)
            dependency = link(key)
            if code not in dependency["used_by"]:
                dependency["used_by"].append(code)
            if not row:
                issue(rule, "unknown_fact", key, f"Fact '{key}' is not registered in the catalog.")
                continue
            if not row.get("is_active", True):
                issue(rule, "inactive_fact", key, f"Fact '{row['key']}' is inactive but this rule uses it.")
            kind = registry.metadata(row)["data_type"]
            value = coerce_expected_value(condition.get("expected_value"))
            allowed = {"==", "!=", "in"} | ({">", ">=", "<", "<="} if kind == "number" else {"contains"} if kind == "text" else set())
            valid = isinstance(value, list) and bool(value) and all(_compatible(v, kind) for v in value) if op == "in" else _compatible(value, kind)
            if op not in allowed or not valid:
                issue(rule, "type_mismatch", key, f"Fact '{row['key']}' expects {kind} values and a compatible operator (unit: {dependency.get('unit') or 'none'}).")
        for action in spec.actions:
            if action.action_type not in {"assert_fact", "urgent_flag", "diagnosis_conclusion", "recommendation"}:
                issue(rule, "unknown_action", None, f"Unsupported action '{action.action_type}'.")
            if action.action_type not in {"assert_fact", "urgent_flag"}:
                continue
            key, value = ("urgent_flag", coerce_expected_value(action.action_value)) if action.action_type == "urgent_flag" else _parse_fact_assignment(action.action_value)
            row = registry.resolve(key)
            link(key)["produced_by"].append(code)
            if not row:
                issue(rule, "unknown_output", key, f"Output fact '{key}' is not registered in the catalog.")
            elif not row.get("is_active", True):
                issue(rule, "inactive_output", key, f"Output fact '{row['key']}' is inactive.")
            elif not _compatible(value, registry.metadata(row)["data_type"]):
                issue(rule, "output_type_mismatch", key, f"Output fact '{row['key']}' has an incompatible value.")

    producers = {}
    for rule, spec in prepared:
        for action in spec.actions:
            if action.action_type == "assert_fact":
                key, _ = _parse_fact_assignment(action.action_value)
                producers.setdefault(registry.canonical_key(key), []).append((rule, spec))
            elif action.action_type == "urgent_flag":
                producers.setdefault("urgent_flag", []).append((rule, spec))
    for rule, spec in prepared:
        for condition in spec.conditions:
            row = registry.resolve(condition["fact_key"])
            # Negative guards intentionally accept an as-yet unasserted flag.
            if not row or registry.metadata(row)["value_source"] != "rule" or condition["operator"] != "==" or condition["expected_value"] is not True:
                continue
            key = registry.canonical_key(row["key"])
            available = [(r, s) for r, s in producers.get(key, []) if r is not rule]
            if not available:
                issue(rule, "missing_producer", row["key"], f"Derived fact '{row['key']}' has no other active rule producing it.")
            elif all(ranks.get(s.category, 99) > ranks.get(spec.category, 99) for _, s in available):
                issue(rule, "late_producer", row["key"], f"Derived fact '{row['key']}' is only produced after this rule's execution stage.")

    return {"valid": not issues, "summary": {"active_rules": len(active), "catalog_facts": len(facts),
            "referenced_facts": len(links), "errors": len(issues)}, "issues": issues,
            "fact_links": sorted(links.values(), key=lambda row: row["key"])}
