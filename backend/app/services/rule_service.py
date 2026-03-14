from __future__ import annotations

import json
from typing import Any

from app.errors import NotFoundError, ValidationError
from app.expert_system.condition_evaluator import (
    ConditionValidationError,
    SUPPORTED_OPERATORS,
    normalize_conditions,
)


class RuleService:
    ALLOWED_PRIORITIES = {"low", "medium", "high"}
    ALLOWED_STATUSES = {"active", "inactive", "archived"}
    ALLOWED_CATEGORIES = {"triage", "diagnosis", "classification", "recommendation"}
    LEGACY_CATEGORY_MAP = {
        "symptoms": "triage",
        "complications": "classification",
        "recommendations": "recommendation",
    }
    ALLOWED_LOGICAL_OPERATORS = {"and", "or"}
    ALLOWED_OPERATORS = set(SUPPORTED_OPERATORS)
    ALLOWED_ACTION_TYPES = {"diagnosis_conclusion", "assert_fact", "recommendation", "urgent_flag"}

    def __init__(self, rule_repository, audit_log_repository=None):
        self.rule_repository = rule_repository
        self.audit_log_repository = audit_log_repository

    def list_categories(self) -> list[dict]:
        self.rule_repository.ensure_default_categories()
        return self.rule_repository.list_categories()

    def list_rules(
        self,
        *,
        category: str | None = None,
        status: str | None = None,
        include_archived: bool = False,
    ) -> list[dict]:
        normalized_category = self._normalize_category(category) if category else None

        normalized_status = None
        if status:
            normalized_status = str(status).strip().lower()
            if normalized_status not in self.ALLOWED_STATUSES:
                raise ValidationError("status must be one of: active, inactive, archived.")

        return self.rule_repository.list_rules(
            category=normalized_category,
            status=normalized_status,
            include_archived=include_archived,
        )

    def get_rule(self, rule_id: int) -> dict:
        rule = self.rule_repository.get_rule(rule_id)
        if not rule:
            raise NotFoundError("Rule not found.")
        return rule

    def create_rule(self, payload: dict, created_by_user_id: int | None = None) -> dict:
        self.rule_repository.ensure_default_categories()

        normalized = self._normalize_rule_payload(payload, partial=False)
        new_rule = self.rule_repository.add_rule(normalized, created_by_user_id=created_by_user_id)

        rule_model = self.rule_repository.get_rule_model(new_rule["id"])
        if rule_model:
            self.rule_repository.create_version_snapshot(
                rule=rule_model,
                change_type="create",
                changed_by_user_id=created_by_user_id,
            )

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="rule.create",
                entity_type="rule",
                entity_id=str(new_rule["id"]),
                actor_user_id=created_by_user_id,
                metadata={
                    "name": new_rule["name"],
                    "status": new_rule["status"],
                    "category": new_rule["category"],
                    "version": new_rule["version"],
                },
            )

        return new_rule

    def update_rule(self, rule_id: int, payload: dict, actor_user_id: int | None = None) -> dict:
        rule = self.rule_repository.get_rule_model(rule_id)
        if not rule:
            raise NotFoundError("Rule not found.")

        normalized = self._normalize_rule_payload(payload, partial=True)
        if not normalized:
            raise ValidationError("At least one updatable field is required.")

        updated_rule = self.rule_repository.update_rule(rule, normalized)

        self.rule_repository.create_version_snapshot(
            rule=rule,
            change_type="update",
            changed_by_user_id=actor_user_id,
        )

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="rule.update",
                entity_type="rule",
                entity_id=str(rule_id),
                actor_user_id=actor_user_id,
                metadata={
                    "updated_fields": sorted(normalized.keys()),
                    "status": updated_rule["status"],
                    "version": updated_rule["version"],
                },
            )

        return updated_rule

    def archive_rule(self, rule_id: int, actor_user_id: int | None = None) -> dict:
        rule = self.rule_repository.get_rule_model(rule_id)
        if not rule:
            raise NotFoundError("Rule not found.")

        archived_rule = self.rule_repository.archive_rule(rule)

        self.rule_repository.create_version_snapshot(
            rule=rule,
            change_type="archive",
            changed_by_user_id=actor_user_id,
        )

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="rule.archive",
                entity_type="rule",
                entity_id=str(rule_id),
                actor_user_id=actor_user_id,
                metadata={
                    "status": archived_rule["status"],
                    "version": archived_rule["version"],
                },
            )

        return archived_rule

    def list_rule_versions(self, rule_id: int, limit: int = 50) -> list[dict]:
        rule = self.rule_repository.get_rule_model(rule_id)
        if not rule:
            raise NotFoundError("Rule not found.")

        safe_limit = max(1, min(limit, 200))
        return self.rule_repository.list_rule_versions(rule_id=rule_id, limit=safe_limit)

    def list_rule_audit_logs(self, rule_id: int, limit: int = 100) -> list[dict]:
        rule = self.rule_repository.get_rule_model(rule_id)
        if not rule:
            raise NotFoundError("Rule not found.")

        if not self.audit_log_repository:
            return []

        safe_limit = max(1, min(limit, 300))
        return self.audit_log_repository.list_by_entity(entity_type="rule", entity_id=str(rule_id), limit=safe_limit)

    def _normalize_rule_payload(self, payload: dict, *, partial: bool) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError("A JSON object is required.")

        normalized = {}

        if (not partial) or ("code" in payload):
            raw_code = str(payload.get("code", "")).strip().lower()
            if raw_code:
                normalized["code"] = raw_code

        if (not partial) or ("name" in payload):
            name = str(payload.get("name", "")).strip()
            if not name:
                raise ValidationError("name is required.")
            normalized["name"] = name

        if "description" in payload or not partial:
            normalized["description"] = str(payload.get("description", "")).strip()

        if "explanation_text" in payload:
            normalized["explanation_text"] = str(payload.get("explanation_text", "")).strip() or None
            normalized["explanation"] = normalized["explanation_text"]
        elif "explanation" in payload:
            normalized["explanation"] = str(payload.get("explanation", "")).strip() or None
            normalized["explanation_text"] = normalized["explanation"]
        elif not partial:
            normalized["explanation"] = None
            normalized["explanation_text"] = None

        if "category" in payload or not partial:
            normalized["category"] = self._normalize_category(payload.get("category", "diagnosis"))

        if "certainty_factor" in payload or not partial:
            try:
                certainty_factor = float(payload.get("certainty_factor", 0.5))
            except (TypeError, ValueError) as exc:
                raise ValidationError("certainty_factor must be a valid number.") from exc

            if not 0 <= certainty_factor <= 1:
                raise ValidationError("certainty_factor must be between 0 and 1.")

            normalized["certainty_factor"] = round(certainty_factor, 2)

        if "priority" in payload or not partial:
            priority = str(payload.get("priority", "medium")).strip().lower()
            if priority not in self.ALLOWED_PRIORITIES:
                raise ValidationError("priority must be one of: low, medium, high.")
            normalized["priority"] = priority

        if "status" in payload or not partial:
            status = str(payload.get("status", "active")).strip().lower()
            if status not in self.ALLOWED_STATUSES:
                raise ValidationError("status must be one of: active, inactive, archived.")
            normalized["status"] = status

        if ("conditions" in payload) or ("condition" in payload) or (not partial):
            conditions = self._normalize_conditions(payload)
            if not conditions and not partial:
                raise ValidationError("At least one condition is required.")
            if conditions:
                normalized["conditions"] = conditions

        if any(field in payload for field in {"actions", "conclusion", "recommendation"}) or not partial:
            actions = self._normalize_actions(payload)
            if not actions:
                if not partial:
                    raise ValidationError("At least one action is required.")
                if any(field in payload for field in {"actions", "conclusion", "recommendation"}):
                    raise ValidationError("At least one valid action is required.")
            if actions:
                normalized["actions"] = actions

        return normalized

    def _normalize_conditions(self, payload: dict) -> list[dict]:
        raw_conditions = payload.get("conditions")
        raw_expression = None

        if raw_conditions is None:
            raw_expression = str(payload.get("condition", "")).strip()
            if not raw_expression:
                return []
        elif not isinstance(raw_conditions, list):
            raise ValidationError("conditions must be a list.")

        try:
            runtime_conditions = normalize_conditions(
                conditions=raw_conditions,
                condition_expression=raw_expression,
                allow_legacy_aliases=True,
            )
        except ConditionValidationError as exc:
            raise ValidationError(str(exc)) from exc

        serialized = []
        for index, condition in enumerate(runtime_conditions, start=1):
            operator = str(condition.get("operator") or "").strip().lower()
            if operator not in self.ALLOWED_OPERATORS:
                supported = ", ".join(sorted(self.ALLOWED_OPERATORS))
                raise ValidationError(f"operator must be one of: {supported}.")

            expected_value = condition.get("expected_value")
            expected_value_serialized = None
            if expected_value is not None:
                expected_value_serialized = self._serialize_expected_value(expected_value, index=index)

            serialized.append(
                {
                    "expression": str(condition.get("expression") or "").strip(),
                    "fact_key": condition.get("fact_key"),
                    "operator": operator,
                    "expected_value": expected_value_serialized,
                    "sequence": int(condition.get("sequence", index)),
                    "group": str(condition.get("group") or "default"),
                    "order_index": int(condition.get("order_index", index)),
                    "logical_operator": str(condition.get("logical_operator") or "and"),
                }
            )

        return serialized

    def _normalize_actions(self, payload: dict) -> list[dict]:
        raw_actions = payload.get("actions")
        normalized = []

        if raw_actions is None:
            conclusion = str(payload.get("conclusion") or "").strip()
            recommendation = str(payload.get("recommendation") or "").strip() or None
            if conclusion:
                return [
                    {
                        "action_type": "diagnosis_conclusion",
                        "action_value": conclusion,
                        "recommendation": recommendation,
                        "metadata": None,
                    }
                ]
            return []

        if not isinstance(raw_actions, list):
            raise ValidationError("actions must be a list.")

        for index, raw_action in enumerate(raw_actions, start=1):
            if not isinstance(raw_action, dict):
                raise ValidationError(f"actions[{index}] must be an object.")

            action_type = str(raw_action.get("action_type") or "").strip().lower()
            if action_type not in self.ALLOWED_ACTION_TYPES:
                raise ValidationError("action_type must be one of: diagnosis_conclusion, assert_fact, recommendation, urgent_flag.")

            recommendation = str(raw_action.get("recommendation") or "").strip() or None
            metadata = raw_action.get("metadata")
            if metadata is not None and not isinstance(metadata, (dict, list)):
                raise ValidationError(f"actions[{index}].metadata must be an object or list.")

            raw_action_value = raw_action.get("action_value")
            if action_type == "urgent_flag" and raw_action_value in (None, ""):
                raw_action_value = True
            if action_type == "recommendation" and raw_action_value in (None, "") and recommendation:
                raw_action_value = recommendation

            if raw_action_value in (None, ""):
                raise ValidationError(f"actions[{index}].action_value is required.")

            normalized.append(
                {
                    "action_type": action_type,
                    "action_value": str(raw_action_value).strip(),
                    "recommendation": recommendation,
                    "metadata": metadata,
                }
            )

        return normalized

    def _normalize_category(self, category: Any) -> str:
        normalized = str(category or "").strip().lower()
        if not normalized:
            raise ValidationError("category is required.")

        normalized = self.LEGACY_CATEGORY_MAP.get(normalized, normalized)
        if normalized not in self.ALLOWED_CATEGORIES:
            raise ValidationError("category must be one of: triage, diagnosis, classification, recommendation.")

        return normalized

    @staticmethod
    def _serialize_expected_value(value: Any, *, index: int) -> str:
        try:
            return json.dumps(value)
        except (TypeError, ValueError) as exc:
            raise ValidationError(f"Condition #{index} expected_value must be JSON-serializable.") from exc
