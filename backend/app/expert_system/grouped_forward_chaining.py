from __future__ import annotations

from dataclasses import dataclass

from app.expert_system.forward_chaining import ForwardChainer
from app.expert_system.rule_loading import RuleSpec


DEFAULT_EXECUTION_ORDER = ("triage", "diagnosis", "classification", "recommendation")


@dataclass
class GroupedForwardChainingResult:
    final_facts: dict
    fired_rules: list[dict]
    rule_trace: list[dict]
    derived_facts: list[dict]
    conclusion_evidence: list[dict]
    recommendation_candidates: list[dict]
    iterations: int
    stage_execution: list[dict]


class GroupedForwardChainer:
    def __init__(self, execution_order: tuple[str, ...] = DEFAULT_EXECUTION_ORDER):
        self.execution_order = execution_order
        self.forward_chainer = ForwardChainer()

    def run(self, facts: dict, rules: list[RuleSpec]) -> GroupedForwardChainingResult:
        working_facts = dict(facts or {})
        iterations_total = 0
        fired_rules: list[dict] = []
        rule_trace: list[dict] = []
        derived_facts: list[dict] = []
        conclusion_evidence: list[dict] = []
        recommendation_candidates: list[dict] = []
        stage_execution: list[dict] = []

        grouped_rules = self._group_rules(rules)
        default_stages = list(self.execution_order)
        extra_stages = [stage for stage in grouped_rules.keys() if stage not in self.execution_order]
        stage_order = default_stages + sorted(extra_stages)

        for stage in stage_order:
            stage_rules = grouped_rules.get(stage, [])
            if not stage_rules and stage in self.execution_order:
                stage_execution.append(
                    {
                        "stage": stage,
                        "rule_count": 0,
                        "iterations": 0,
                        "fired_rules": 0,
                        "derived_facts": 0,
                    }
                )
                continue

            if not stage_rules:
                continue

            stage_result = self.forward_chainer.run(working_facts, stage_rules)
            working_facts = stage_result.final_facts
            iterations_total += stage_result.iterations

            stage_fired_rules = [self._with_stage(item, stage) for item in stage_result.fired_rules]
            stage_rule_trace = [self._with_stage(item, stage) for item in stage_result.rule_trace]
            stage_derived_facts = [self._with_stage(item, stage) for item in stage_result.derived_facts]
            stage_conclusions = [self._with_stage(item, stage) for item in stage_result.conclusion_evidence]
            stage_recommendations = [self._with_stage(item, stage) for item in stage_result.recommendation_candidates]

            fired_rules.extend(stage_fired_rules)
            rule_trace.extend(stage_rule_trace)
            derived_facts.extend(stage_derived_facts)
            conclusion_evidence.extend(stage_conclusions)
            recommendation_candidates.extend(stage_recommendations)

            stage_execution.append(
                {
                    "stage": stage,
                    "rule_count": len(stage_rules),
                    "iterations": stage_result.iterations,
                    "fired_rules": len(stage_result.fired_rules),
                    "derived_facts": len(stage_result.derived_facts),
                }
            )

        return GroupedForwardChainingResult(
            final_facts=working_facts,
            fired_rules=fired_rules,
            rule_trace=rule_trace,
            derived_facts=derived_facts,
            conclusion_evidence=conclusion_evidence,
            recommendation_candidates=recommendation_candidates,
            iterations=iterations_total,
            stage_execution=stage_execution,
        )

    @staticmethod
    def _group_rules(rules: list[RuleSpec]) -> dict[str, list[RuleSpec]]:
        grouped: dict[str, list[RuleSpec]] = {}
        for rule in rules:
            stage = str(rule.category or "diagnosis").strip().lower() or "diagnosis"
            grouped.setdefault(stage, []).append(rule)
        return grouped

    @staticmethod
    def _with_stage(item: dict, stage: str) -> dict:
        tagged = dict(item)
        tagged["stage"] = stage
        return tagged
