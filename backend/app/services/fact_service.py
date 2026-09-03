from __future__ import annotations

import re

from app.errors import NotFoundError, ValidationError

ALLOWED_CATEGORIES = {
    "cardinal", "metabolic", "vision", "skin", "nerve", "reproductive",
    "mental", "emergency", "pediatric", "other", "risk_factor", "lab", "profile",
}
ALLOWED_TYPE_INDICATIONS = {"none", "both", "type1", "type2", "gestational"}
_KEY_RE = re.compile(r"^[a-z][a-z0-9_]*$")


def _normalize_key(value) -> str:
    key = str(value or "").strip().lower().replace("-", "_")
    return re.sub(r"[^a-z0-9_]+", "_", key).strip("_")


def _normalize_alias_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        value = [part for part in re.split(r"[,;\s]+", value) if part]
    normalized = []
    for item in value:
        alias = _normalize_key(item)
        if alias and alias not in normalized:
            normalized.append(alias)
    return normalized


class FactService:
    """Doctor-facing CRUD for the fact/symptom knowledge catalog."""

    def __init__(self, fact_repository, audit_log_repository=None):
        self.fact_repository = fact_repository
        self.audit_log_repository = audit_log_repository

    def list_facts(self, *, category=None, status=None, search=None) -> list[dict]:
        normalized_status = None
        if status:
            normalized_status = str(status).strip().lower()
            if normalized_status not in {"active", "inactive"}:
                raise ValidationError("status must be one of: active, inactive.")
        return self.fact_repository.list_facts(
            category=str(category).strip().lower() if category else None,
            status=normalized_status,
            search=search,
        )

    def get_fact(self, fact_id: int) -> dict:
        fact = self.fact_repository.get_fact(fact_id)
        if not fact:
            raise NotFoundError("Fact not found.")
        return fact

    def create_fact(self, payload: dict, actor_user_id: int | None = None) -> dict:
        data = payload if isinstance(payload, dict) else {}
        key = _normalize_key(data.get("key"))
        if not key or not _KEY_RE.match(key):
            raise ValidationError("key is required: lowercase letters, digits and underscores, starting with a letter.")
        label = str(data.get("label") or "").strip()
        if not label:
            raise ValidationError("label is required.")
        if self.fact_repository.get_by_key(key):
            raise ValidationError(f"Fact key {key!r} already exists.")
        category = str(data.get("category") or "other").strip().lower()
        if category not in ALLOWED_CATEGORIES:
            raise ValidationError(f"category must be one of: {', '.join(sorted(ALLOWED_CATEGORIES))}.")
        type_indication = str(data.get("type_indication") or "none").strip().lower()
        if type_indication not in ALLOWED_TYPE_INDICATIONS:
            raise ValidationError(f"type_indication must be one of: {', '.join(sorted(ALLOWED_TYPE_INDICATIONS))}.")

        created = self.fact_repository.create({
            "key": key,
            "label": label,
            "label_km": self._optional_text(data.get("label_km"), 255),
            "medical_term": self._optional_text(data.get("medical_term"), 120),
            "category": category,
            "question": self._optional_text(data.get("question")),
            "meaning": self._optional_text(data.get("meaning")),
            "meaning_km": self._optional_text(data.get("meaning_km")),
            "prevention": self._optional_text(data.get("prevention")),
            "prevention_km": self._optional_text(data.get("prevention_km")),
            "weight": self._validated_weight(data.get("weight", 0.05)),
            "type_indication": type_indication,
            "is_cardinal": bool(data.get("is_cardinal", False)),
            "is_emergency": bool(data.get("is_emergency", False)),
            "aliases": _normalize_alias_list(data.get("aliases")),
            "is_active": bool(data.get("is_active", True)),
            "display_order": int(data.get("display_order", 100)),
            "source": "doctor",
        })

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="fact.create",
                entity_type="fact",
                entity_id=str(created["id"]),
                actor_user_id=actor_user_id,
                metadata={"key": created["key"], "label": created["label"],
                          "category": created["category"]},
            )
        return created

    def update_fact(self, fact_id: int, payload: dict, actor_user_id: int | None = None) -> dict:
        row = self.fact_repository.get_fact_model(fact_id)
        if not row:
            raise NotFoundError("Fact not found.")
        data = payload if isinstance(payload, dict) else {}

        # The fact key is the engine contract — immutable after creation.
        if "key" in data and _normalize_key(data.get("key")) != row.key:
            raise ValidationError("Fact keys are immutable (they are referenced by rules and reports).")
        if "label" in data and not str(data.get("label") or "").strip():
            raise ValidationError("label cannot be empty.")
        if "category" in data:
            category = str(data.get("category") or "").strip().lower()
            if category not in ALLOWED_CATEGORIES:
                raise ValidationError(f"category must be one of: {', '.join(sorted(ALLOWED_CATEGORIES))}.")
            data["category"] = category
        if "type_indication" in data:
            type_indication = str(data.get("type_indication") or "").strip().lower()
            if type_indication not in ALLOWED_TYPE_INDICATIONS:
                raise ValidationError(f"type_indication must be one of: {', '.join(sorted(ALLOWED_TYPE_INDICATIONS))}.")
            data["type_indication"] = type_indication
        if "weight" in data:
            data["weight"] = self._validated_weight(data.get("weight"))
        if "aliases" in data:
            data["aliases"] = _normalize_alias_list(data.get("aliases"))

        updated = self.fact_repository.update(row, data)
        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="fact.update",
                entity_type="fact",
                entity_id=str(updated["id"]),
                actor_user_id=actor_user_id,
                metadata={"key": updated["key"], "weight": updated["weight"],
                          "is_active": updated["is_active"]},
            )
        return updated

    def set_fact_active(self, fact_id: int, active: bool, actor_user_id: int | None = None) -> dict:
        return self.update_fact(fact_id, {"is_active": bool(active)}, actor_user_id=actor_user_id)

    def _validated_weight(self, value) -> float:
        try:
            weight = float(value)
        except (TypeError, ValueError):
            raise ValidationError("weight must be a number between 0 and 1.")
        if not 0 <= weight <= 1:
            raise ValidationError("weight must be a number between 0 and 1.")
        return weight

    def _optional_text(self, value, max_length: int | None = None):
        text = str(value).strip() if value is not None else None
        if not text:
            return None
        if max_length and len(text) > max_length:
            raise ValidationError(f"Text exceeds {max_length} characters.")
        return text
