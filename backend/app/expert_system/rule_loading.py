from dataclasses import dataclass

from app.expert_system.condition_evaluator import (
    ConditionValidationError,
    compose_condition_expression,
    normalize_conditions,
)


PRIORITY_RANK = {
    "low": 1,
    "medium": 2,
    "high": 3,
}

RULE_CATEGORY_ALIASES = {
    "symptoms": "triage",
    "complications": "classification",
    "recommendations": "recommendation",
}


@dataclass(frozen=True)
class RuleActionSpec:
    action_type: str
    action_value: str
    recommendation: str | None


@dataclass(frozen=True)
class RuleSpec:
    rule_id: int
    code: str
    name: str
    description: str
    category: str
    priority: str
    priority_rank: int
    certainty_factor: float
    condition_expression: str
    conditions: tuple[dict, ...]
    actions: tuple[RuleActionSpec, ...]


@dataclass
class RuleLoadResult:
    rules: list[RuleSpec]
    skipped_rules: list[dict]


class RuleLoader:
    def load(self, raw_rules: list[dict]) -> RuleLoadResult:
        compiled_rules = []
        skipped_rules = []

        for raw_rule in raw_rules:
            status = str(raw_rule.get("status", "active")).strip().lower()
            if status != "active":
                continue

            rule_id = int(raw_rule.get("id") or 0)
            code = str(raw_rule.get("code") or f"rule_{rule_id}").strip() or f"rule_{rule_id}"
            name = str(raw_rule.get("name") or f"rule_{rule_id}")
            condition_expression = str(raw_rule.get("condition") or "").strip()
            try:
                normalized_conditions = normalize_conditions(
                    conditions=raw_rule.get("conditions") or [],
                    condition_expression=condition_expression,
                    allow_legacy_aliases=True,
                )
            except ConditionValidationError as exc:
                skipped_rules.append(
                    {
                        "rule_id": rule_id,
                        "rule_name": name,
                        "reason": str(exc),
                    }
                )
                continue
            if not normalized_conditions:
                skipped_rules.append(
                    {
                        "rule_id": rule_id,
                        "rule_name": name,
                        "reason": "No executable conditions found.",
                    }
                )
                continue

            condition_expression = compose_condition_expression(normalized_conditions)

            actions = self._extract_actions(raw_rule)
            if not actions:
                skipped_rules.append(
                    {
                        "rule_id": rule_id,
                        "rule_name": name,
                        "reason": "No executable actions found.",
                    }
                )
                continue

            priority = str(raw_rule.get("priority", "medium")).strip().lower()
            priority_rank = PRIORITY_RANK.get(priority, PRIORITY_RANK["medium"])
            category = self._normalize_category(raw_rule.get("category"))

            certainty_factor = raw_rule.get("certainty_factor", 0.5)
            try:
                certainty_factor = float(certainty_factor)
            except (TypeError, ValueError):
                certainty_factor = 0.5

            certainty_factor = max(0.0, min(1.0, certainty_factor))

            compiled_rules.append(
                RuleSpec(
                    rule_id=rule_id,
                    code=code,
                    name=name,
                    description=str(raw_rule.get("description") or ""),
                    category=category,
                    priority=priority,
                    priority_rank=priority_rank,
                    certainty_factor=certainty_factor,
                    condition_expression=condition_expression,
                    conditions=tuple(normalized_conditions),
                    actions=tuple(actions),
                )
            )

        compiled_rules.sort(
            key=lambda item: (
                -item.priority_rank,
                -item.certainty_factor,
                item.rule_id,
            )
        )

        return RuleLoadResult(rules=compiled_rules, skipped_rules=skipped_rules)

    @staticmethod
    def _normalize_category(value) -> str:
        raw = str(value or "diagnosis").strip().lower()
        return RULE_CATEGORY_ALIASES.get(raw, raw or "diagnosis")

    @staticmethod
    def _extract_actions(raw_rule: dict) -> list[RuleActionSpec]:
        actions = raw_rule.get("actions") or []
        normalized_actions = []

        if actions:
            for raw_action in actions:
                action_type = str(raw_action.get("action_type") or "diagnosis_conclusion").strip().lower()
                action_value = str(raw_action.get("action_value") or "").strip()
                recommendation = str(raw_action.get("recommendation") or "").strip() or None

                if action_type == "recommendation" and not action_value and recommendation:
                    action_value = recommendation

                if not action_value:
                    continue

                normalized_actions.append(
                    RuleActionSpec(
                        action_type=action_type,
                        action_value=action_value,
                        recommendation=recommendation,
                    )
                )

        if not normalized_actions:
            conclusion = str(raw_rule.get("conclusion") or "").strip()
            recommendation = str(raw_rule.get("recommendation") or "").strip() or None
            if conclusion:
                normalized_actions.append(
                    RuleActionSpec(
                        action_type="diagnosis_conclusion",
                        action_value=conclusion,
                        recommendation=recommendation,
                    )
                )

        return normalized_actions
