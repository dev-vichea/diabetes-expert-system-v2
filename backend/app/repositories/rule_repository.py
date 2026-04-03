from __future__ import annotations

import json
import re
from typing import Any

from sqlalchemy import func

from app.extensions import db
from app.models import Rule, RuleAction, RuleCategory, RuleCondition, RuleVersion
from app.utils.datetime import serialize_datetime


DEFAULT_RULE_CATEGORIES = {
    "triage": {
        "name": "Triage",
        "description": "Initial symptom/risk triage rules.",
    },
    "diagnosis": {
        "name": "Diagnosis",
        "description": "Diagnostic inference rules.",
    },
    "classification": {
        "name": "Classification",
        "description": "Rules for patient/result stratification.",
    },
    "recommendation": {
        "name": "Recommendation",
        "description": "Care and follow-up recommendation rules.",
    },
}

ALLOWED_ACTION_TYPES = {"diagnosis_conclusion", "assert_fact", "recommendation", "urgent_flag"}


class RuleRepository:
    def list_categories(self) -> list[dict]:
        rows = RuleCategory.query.order_by(RuleCategory.code.asc(), RuleCategory.id.asc()).all()
        return [
            {
                "id": row.id,
                "code": row.code,
                "name": row.name,
                "description": row.description,
                "is_active": bool(row.is_active),
                "created_at": serialize_datetime(row.created_at),
                "updated_at": serialize_datetime(row.updated_at),
            }
            for row in rows
        ]

    def is_empty(self) -> bool:
        return Rule.query.count() == 0

    def ensure_default_categories(self) -> None:
        for code, category_data in DEFAULT_RULE_CATEGORIES.items():
            category = RuleCategory.query.filter_by(code=code).first()
            if not category:
                category = RuleCategory(
                    code=code,
                    name=category_data["name"],
                    description=category_data["description"],
                    is_active=True,
                )
                db.session.add(category)
                continue

            category.name = category_data["name"]
            category.description = category_data["description"]
            category.is_active = True

        db.session.flush()

    def list_rules(
        self,
        *,
        category: str | None = None,
        status: str | None = None,
        include_archived: bool = False,
    ) -> list[dict]:
        query = Rule.query

        if category:
            query = query.filter_by(category=category)

        if status:
            query = query.filter_by(status=status)
        elif not include_archived:
            query = query.filter(Rule.status != "archived")

        rules = query.order_by(Rule.updated_at.desc(), Rule.id.asc()).all()
        return [self._serialize_rule(rule) for rule in rules]

    def get_rule(self, rule_id: int) -> dict | None:
        rule = db.session.get(Rule, rule_id)
        if not rule:
            return None
        return self._serialize_rule(rule)

    def get_rule_model(self, rule_id: int) -> Rule | None:
        return db.session.get(Rule, rule_id)

    def count_rules(self) -> int:
        return Rule.query.count()

    def count_rules_by_status(self) -> dict[str, int]:
        rows = (
            db.session.query(Rule.status, func.count(Rule.id))
            .group_by(Rule.status)
            .order_by(Rule.status.asc())
            .all()
        )
        return {status: int(count) for status, count in rows}

    def add_rule(self, payload: dict, created_by_user_id: int | None = None) -> dict:
        self.ensure_default_categories()

        rule = Rule(
            code=self._resolve_rule_code(payload),
            name=payload["name"],
            description=payload.get("description", ""),
            category=payload.get("category", "diagnosis"),
            explanation=payload.get("explanation"),
            explanation_text=payload.get("explanation_text"),
            certainty_factor=payload["certainty_factor"],
            priority=payload.get("priority", "medium"),
            status=payload.get("status", "active"),
            version=1,
            created_by_user_id=created_by_user_id,
        )

        self._assign_category(rule, payload.get("category", "diagnosis"))

        for index, condition_payload in enumerate(payload["conditions"], start=1):
            rule.conditions.append(
                RuleCondition(
                    expression=condition_payload["expression"],
                    fact_key=condition_payload.get("fact_key"),
                    operator=condition_payload.get("operator"),
                    expected_value=condition_payload.get("expected_value"),
                    sequence=condition_payload.get("sequence", index),
                    group_key=condition_payload.get("group"),
                    order_index=condition_payload.get("order_index", index),
                    logical_operator=condition_payload.get("logical_operator", "and"),
                )
            )

        for action_payload in self._normalize_actions(payload):
            rule.actions.append(
                RuleAction(
                    action_type=action_payload["action_type"],
                    action_value=action_payload["action_value"],
                    recommendation=action_payload.get("recommendation"),
                    metadata_json=action_payload.get("metadata"),
                )
            )

        db.session.add(rule)
        db.session.commit()
        return self._serialize_rule(rule)

    def update_rule(self, rule: Rule, payload: dict) -> dict:
        if "code" in payload:
            rule.code = self._resolve_rule_code(payload, fallback_name=rule.name, existing_rule_id=rule.id)
        if "name" in payload:
            rule.name = payload["name"]
        if "description" in payload:
            rule.description = payload["description"]
        if "category" in payload:
            self._assign_category(rule, payload["category"])
        if "explanation" in payload:
            rule.explanation = payload["explanation"]
        if "explanation_text" in payload:
            rule.explanation_text = payload["explanation_text"]
            rule.explanation = payload["explanation_text"] or rule.explanation
        if "certainty_factor" in payload:
            rule.certainty_factor = payload["certainty_factor"]
        if "priority" in payload:
            rule.priority = payload["priority"]
        if "status" in payload:
            rule.status = payload["status"]

        if "conditions" in payload:
            rule.conditions.clear()
            for index, condition_payload in enumerate(payload["conditions"], start=1):
                rule.conditions.append(
                    RuleCondition(
                        expression=condition_payload["expression"],
                        fact_key=condition_payload.get("fact_key"),
                        operator=condition_payload.get("operator"),
                        expected_value=condition_payload.get("expected_value"),
                        sequence=condition_payload.get("sequence", index),
                        group_key=condition_payload.get("group"),
                        order_index=condition_payload.get("order_index", index),
                        logical_operator=condition_payload.get("logical_operator", "and"),
                    )
                )

        if any(field in payload for field in {"conclusion", "recommendation", "actions"}):
            rule.actions.clear()
            for action_payload in self._normalize_actions(payload):
                rule.actions.append(
                    RuleAction(
                        action_type=action_payload["action_type"],
                        action_value=action_payload["action_value"],
                        recommendation=action_payload.get("recommendation"),
                        metadata_json=action_payload.get("metadata"),
                    )
                )

        rule.version = int(rule.version or 1) + 1
        db.session.commit()
        return self._serialize_rule(rule)

    def archive_rule(self, rule: Rule) -> dict:
        if rule.status != "archived":
            rule.status = "archived"
            rule.version = int(rule.version or 1) + 1
            db.session.commit()
        return self._serialize_rule(rule)

    def create_version_snapshot(
        self,
        *,
        rule: Rule,
        change_type: str,
        changed_by_user_id: int | None,
    ) -> dict:
        snapshot = self._serialize_rule(rule)
        version = RuleVersion(
            rule_id=rule.id,
            version_number=rule.version,
            change_type=change_type,
            changed_by_user_id=changed_by_user_id,
            snapshot_json=snapshot,
        )
        db.session.add(version)
        db.session.commit()
        return self._serialize_version(version)

    def list_rule_versions(self, rule_id: int, limit: int = 50) -> list[dict]:
        rows = (
            RuleVersion.query.filter_by(rule_id=rule_id)
            .order_by(RuleVersion.version_number.desc(), RuleVersion.id.desc())
            .limit(limit)
            .all()
        )
        return [self._serialize_version(row) for row in rows]

    def _assign_category(self, rule: Rule, category_code: str) -> None:
        normalized = str(category_code or "diagnosis").strip().lower()
        category = RuleCategory.query.filter_by(code=normalized).first()
        if not category:
            fallback_name = DEFAULT_RULE_CATEGORIES.get(normalized, {}).get("name") or normalized.replace("_", " ").title()
            category = RuleCategory(
                code=normalized,
                name=fallback_name,
                description=DEFAULT_RULE_CATEGORIES.get(normalized, {}).get("description"),
                is_active=True,
            )
            db.session.add(category)
            db.session.flush()

        rule.category = normalized
        rule.category_id = category.id
        rule.category_ref = category

    def _resolve_rule_code(self, payload: dict, *, fallback_name: str | None = None, existing_rule_id: int | None = None) -> str:
        preferred = str(payload.get("code") or "").strip().lower()
        seed_value = preferred or self._slugify(payload.get("name") or fallback_name or "rule")
        if not seed_value:
            seed_value = "rule"

        candidate = seed_value
        suffix = 2
        while True:
            existing = Rule.query.filter_by(code=candidate).first()
            if not existing or (existing_rule_id and existing.id == existing_rule_id):
                return candidate
            candidate = f"{seed_value}-{suffix}"
            suffix += 1

    @staticmethod
    def _slugify(value: str) -> str:
        text = re.sub(r"[^a-zA-Z0-9]+", "-", str(value or "").strip().lower()).strip("-")
        return text[:120]

    @staticmethod
    def _serialize_rule(rule: Rule) -> dict:
        sorted_conditions = sorted(rule.conditions, key=lambda c: (c.sequence or c.order_index or 1, c.id))
        condition_expression = RuleRepository._compose_condition_expression(sorted_conditions)
        primary_condition = condition_expression or (sorted_conditions[0].expression if sorted_conditions else "")

        primary_action = rule.actions[0] if rule.actions else None
        conclusion = primary_action.action_value if primary_action and primary_action.action_type == "diagnosis_conclusion" else ""
        recommendation = primary_action.recommendation if primary_action else None

        category_code = rule.category_ref.code if rule.category_ref else rule.category
        explanation_text = rule.explanation_text if rule.explanation_text is not None else rule.explanation

        return {
            "id": rule.id,
            "code": rule.code,
            "name": rule.name,
            "description": rule.description or "",
            "category": category_code,
            "rule_category": {
                "code": category_code,
                "name": rule.category_ref.name if rule.category_ref else None,
                "description": rule.category_ref.description if rule.category_ref else None,
            },
            "explanation": explanation_text,
            "explanation_text": explanation_text,
            "condition": primary_condition,
            "conditions": [
                {
                    "id": condition.id,
                    "fact_key": condition.fact_key,
                    "operator": condition.operator,
                    "expected_value": condition.expected_value,
                    "sequence": condition.sequence,
                    "group": condition.group_key,
                    "expression": condition.expression,
                    "order_index": condition.order_index,
                    "logical_operator": condition.logical_operator,
                }
                for condition in sorted_conditions
            ],
            "conclusion": conclusion,
            "recommendation": recommendation,
            "actions": [
                {
                    "id": action.id,
                    "action_type": action.action_type,
                    "action_value": action.action_value,
                    "recommendation": action.recommendation,
                    "metadata": action.metadata_json,
                }
                for action in rule.actions
            ],
            "certainty_factor": float(rule.certainty_factor),
            "priority": rule.priority,
            "status": rule.status,
            "version": int(rule.version or 1),
            "created_by_user_id": rule.created_by_user_id,
            "created_at": serialize_datetime(rule.created_at),
            "updated_at": serialize_datetime(rule.updated_at),
        }

    @staticmethod
    def _serialize_version(version: RuleVersion) -> dict:
        return {
            "id": version.id,
            "rule_id": version.rule_id,
            "version_number": version.version_number,
            "change_type": version.change_type,
            "changed_by_user_id": version.changed_by_user_id,
            "changed_by_name": version.changed_by_user.name if version.changed_by_user else None,
            "snapshot": version.snapshot_json,
            "created_at": serialize_datetime(version.created_at),
        }

    @staticmethod
    def _compose_condition_expression(conditions: list[RuleCondition]) -> str:
        if not conditions:
            return ""

        parts = []
        for condition in conditions:
            expression = str(condition.expression or "").strip()
            if not expression and condition.fact_key and condition.operator:
                expression = RuleRepository._build_expression_from_structured(
                    fact_key=condition.fact_key,
                    operator=condition.operator,
                    expected_value=condition.expected_value,
                )
            if not expression:
                continue
            parts.append((condition.logical_operator or "and", expression))

        if not parts:
            return ""

        expression = parts[0][1]
        for logical_operator, condition_expression in parts[1:]:
            op = str(logical_operator or "and").strip().lower()
            if op not in {"and", "or"}:
                op = "and"
            expression = f"({expression} {op} ({condition_expression}))"
        return expression

    @staticmethod
    def _build_expression_from_structured(*, fact_key: str, operator: str, expected_value: Any) -> str:
        key = str(fact_key or "").strip()
        op = str(operator or "").strip().lower()
        expected = RuleRepository._coerce_expected_value(expected_value)

        if op in {"exists"}:
            return key
        if op in {"not_exists"}:
            return f"(not {key})"
        if op in {"is_true"}:
            return key
        if op in {"is_false"}:
            return f"(not {key})"
        if op in {"==", "eq"}:
            if isinstance(expected, bool):
                return key if expected else f"(not {key})"
            return f"{key} == {RuleRepository._format_literal(expected)}"
        if op in {"!=", "neq"}:
            if isinstance(expected, bool):
                return f"(not {key})" if expected else key
            return f"{key} != {RuleRepository._format_literal(expected)}"
        if op in {">", "gt"}:
            return f"{key} > {RuleRepository._format_literal(expected)}"
        if op in {">=", "gte"}:
            return f"{key} >= {RuleRepository._format_literal(expected)}"
        if op in {"<", "lt"}:
            return f"{key} < {RuleRepository._format_literal(expected)}"
        if op in {"<=", "lte"}:
            return f"{key} <= {RuleRepository._format_literal(expected)}"
        if op in {"in"}:
            return f"{key} in {RuleRepository._format_literal(expected)}"
        if op in {"contains"}:
            return f"{key} contains {RuleRepository._format_literal(expected)}"

        return f"{key} == {RuleRepository._format_literal(expected)}"

    @staticmethod
    def _coerce_expected_value(raw_value: Any) -> Any:
        if isinstance(raw_value, (bool, int, float)):
            return raw_value
        text = str(raw_value or "").strip()
        if not text:
            return ""
        try:
            loaded = json.loads(text)
            if isinstance(loaded, (bool, int, float, str)):
                return loaded
        except (TypeError, ValueError):
            pass
        lowered = text.lower()
        if lowered in {"true", "yes", "1", "on", "y"}:
            return True
        if lowered in {"false", "no", "0", "off", "n"}:
            return False
        try:
            if "." in text:
                return float(text)
            return int(text)
        except ValueError:
            return text

    @staticmethod
    def _format_literal(value: Any) -> str:
        if isinstance(value, bool):
            return "True" if value else "False"
        if isinstance(value, (int, float)):
            return str(value)
        return repr(str(value))

    @staticmethod
    def _normalize_actions(payload: dict) -> list[dict]:
        actions = payload.get("actions") or []
        normalized_actions = []

        if actions:
            for action_payload in actions:
                action_type = str(action_payload.get("action_type") or "").strip().lower()
                if action_type not in ALLOWED_ACTION_TYPES:
                    continue

                recommendation = str(action_payload.get("recommendation") or "").strip() or None
                metadata = action_payload.get("metadata")
                action_value_raw = action_payload.get("action_value")

                if action_type == "recommendation" and (action_value_raw in (None, "")):
                    action_value_raw = recommendation or ""
                if action_type == "urgent_flag" and action_value_raw in (None, ""):
                    action_value_raw = True

                action_value = str(action_value_raw).strip()
                if not action_value:
                    continue

                normalized_actions.append(
                    {
                        "action_type": action_type,
                        "action_value": action_value,
                        "recommendation": recommendation,
                        "metadata": metadata if isinstance(metadata, (dict, list)) else None,
                    }
                )

            if normalized_actions:
                return normalized_actions

        conclusion = str(payload.get("conclusion") or "").strip()
        recommendation = str(payload.get("recommendation") or "").strip() or None
        if not conclusion:
            return []

        return [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": conclusion,
                "recommendation": recommendation,
                "metadata": None,
            }
        ]
