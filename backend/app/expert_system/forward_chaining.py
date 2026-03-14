from dataclasses import dataclass

from app.expert_system.confidence import get_priority_weight
from app.expert_system.condition_evaluator import ConditionEvaluationError, evaluate_conditions
from app.expert_system.fact_preparation import normalize_fact_name
from app.expert_system.rule_loading import RuleSpec


@dataclass
class ForwardChainingResult:
    final_facts: dict
    fired_rules: list[dict]
    rule_trace: list[dict]
    derived_facts: list[dict]
    conclusion_evidence: list[dict]
    recommendation_candidates: list[dict]
    iterations: int


class ForwardChainer:
    def run(self, facts: dict, rules: list[RuleSpec]) -> ForwardChainingResult:
        working_facts = dict(facts)
        fired_rule_ids = set()
        fired_rules = []
        rule_trace = []
        derived_facts = []
        conclusion_evidence = []
        recommendation_candidates = []
        iterations = 0

        max_iterations = max(len(rules), 1)

        for iteration in range(1, max_iterations + 1):
            fired_any_in_iteration = False

            for rule in rules:
                if rule.rule_id in fired_rule_ids:
                    continue

                trace_item = {
                    "iteration": iteration,
                    "rule_id": rule.rule_id,
                    "rule_name": rule.name,
                    "condition": rule.condition_expression,
                    "priority": rule.priority,
                }

                try:
                    matched = evaluate_conditions(list(rule.conditions), working_facts)
                except ConditionEvaluationError as exc:
                    trace_item.update(
                        {
                            "matched": False,
                            "fired": False,
                            "reason": str(exc),
                        }
                    )
                    rule_trace.append(trace_item)
                    continue

                if not matched:
                    trace_item.update({"matched": False, "fired": False})
                    rule_trace.append(trace_item)
                    continue

                fired_rule_ids.add(rule.rule_id)
                fired_any_in_iteration = True

                priority_weight = get_priority_weight(rule.priority)
                effective_certainty = _clamp(rule.certainty_factor * priority_weight)
                facts_used = _collect_facts_used(rule.conditions, working_facts)
                action_trace = []
                inferred_outputs = []

                for action in rule.actions:
                    if action.action_type == "diagnosis_conclusion":
                        conclusion = str(action.action_value).strip()
                        if conclusion:
                            evidence = {
                                "rule_id": rule.rule_id,
                                "rule_name": rule.name,
                                "priority": rule.priority,
                                "priority_rank": rule.priority_rank,
                                "certainty_factor": round(rule.certainty_factor, 4),
                                "effective_certainty": round(effective_certainty, 4),
                                "conclusion": conclusion,
                            }
                            conclusion_evidence.append(evidence)
                            action_trace.append({"action_type": action.action_type, "conclusion": conclusion})
                            inferred_outputs.append({"type": "conclusion", "key": "diagnosis_conclusion", "value": conclusion})

                            if action.recommendation:
                                recommendation_candidates.append(
                                    {
                                        "text": action.recommendation,
                                        "weight": effective_certainty,
                                        "priority_rank": rule.priority_rank,
                                        "rule_id": rule.rule_id,
                                    }
                                )
                                inferred_outputs.append(
                                    {
                                        "type": "recommendation",
                                        "key": "recommendation",
                                        "value": action.recommendation,
                                    }
                                )

                    elif action.action_type == "assert_fact":
                        fact_name, value = _parse_fact_assignment(action.action_value)
                        previous = working_facts.get(fact_name)
                        changed = previous != value
                        working_facts[fact_name] = value

                        if changed:
                            derived_facts.append(
                                {
                                    "iteration": iteration,
                                    "rule_id": rule.rule_id,
                                    "fact": fact_name,
                                    "value": value,
                                }
                            )

                        action_trace.append(
                            {
                                "action_type": action.action_type,
                                "fact": fact_name,
                                "value": value,
                                "changed": changed,
                            }
                        )
                        inferred_outputs.append({"type": "assert_fact", "key": fact_name, "value": value, "changed": changed})

                    elif action.action_type == "recommendation":
                        text = str(action.action_value).strip()
                        if text:
                            recommendation_candidates.append(
                                {
                                    "text": text,
                                    "weight": effective_certainty,
                                    "priority_rank": rule.priority_rank,
                                    "rule_id": rule.rule_id,
                                }
                            )
                        action_trace.append(
                            {
                                "action_type": action.action_type,
                                "text": text,
                            }
                        )
                        if text:
                            inferred_outputs.append({"type": "recommendation", "key": "recommendation", "value": text})

                    elif action.action_type == "urgent_flag":
                        urgent_value = _coerce_assignment_value(str(action.action_value))
                        urgent_bool = bool(urgent_value)
                        previous = working_facts.get("urgent_flag")
                        changed = previous != urgent_bool
                        working_facts["urgent_flag"] = urgent_bool

                        if changed:
                            derived_facts.append(
                                {
                                    "iteration": iteration,
                                    "rule_id": rule.rule_id,
                                    "fact": "urgent_flag",
                                    "value": urgent_bool,
                                }
                            )

                        action_trace.append(
                            {
                                "action_type": action.action_type,
                                "fact": "urgent_flag",
                                "value": urgent_bool,
                                "changed": changed,
                            }
                        )
                        inferred_outputs.append(
                            {
                                "type": "urgent_flag",
                                "key": "urgent_flag",
                                "value": urgent_bool,
                                "changed": changed,
                            }
                        )

                    else:
                        action_trace.append(
                            {
                                "action_type": action.action_type,
                                "ignored": True,
                            }
                        )

                fired_rules.append(
                    {
                        "id": rule.rule_id,
                        "code": rule.code,
                        "name": rule.name,
                        "priority": rule.priority,
                        "condition": rule.condition_expression,
                        "facts_used": facts_used,
                        "inferred_outputs": inferred_outputs,
                        "certainty_factor": round(rule.certainty_factor, 4),
                        "effective_certainty": round(effective_certainty, 4),
                        "actions": action_trace,
                        "iteration": iteration,
                    }
                )

                trace_item.update(
                    {
                        "matched": True,
                        "fired": True,
                        "facts_used": facts_used,
                        "inferred_outputs": inferred_outputs,
                        "effective_certainty": round(effective_certainty, 4),
                        "actions": action_trace,
                    }
                )
                rule_trace.append(trace_item)

            iterations = iteration
            if not fired_any_in_iteration:
                break

        return ForwardChainingResult(
            final_facts=working_facts,
            fired_rules=fired_rules,
            rule_trace=rule_trace,
            derived_facts=derived_facts,
            conclusion_evidence=conclusion_evidence,
            recommendation_candidates=recommendation_candidates,
            iterations=iterations,
        )


def _parse_fact_assignment(raw_value: str) -> tuple[str, object]:
    text = str(raw_value or "").strip()
    if not text:
        return "derived_fact", True

    if "=" in text:
        left, right = text.split("=", 1)
        fact_name = normalize_fact_name(left)
        return fact_name or "derived_fact", _coerce_assignment_value(right)

    fact_name = normalize_fact_name(text)
    return fact_name or "derived_fact", True


def _coerce_assignment_value(raw_value: str):
    normalized = str(raw_value).strip()
    lowered = normalized.lower()

    if lowered in {"true", "yes", "1", "on", "y"}:
        return True
    if lowered in {"false", "no", "0", "off", "n"}:
        return False

    try:
        if "." in normalized:
            return float(normalized)
        return int(normalized)
    except ValueError:
        return normalized.strip("\"'")


def _clamp(value: float) -> float:
    if value < 0:
        return 0.0
    if value > 1:
        return 1.0
    return value


def _collect_facts_used(conditions: tuple[dict, ...] | list[dict], working_facts: dict) -> list[dict]:
    facts = []
    seen = set()
    for condition in conditions:
        fact_key = str(condition.get("fact_key") or "").strip()
        if not fact_key or fact_key in seen:
            continue
        seen.add(fact_key)
        facts.append({"fact_key": fact_key, "value": working_facts.get(fact_key)})
    return facts
