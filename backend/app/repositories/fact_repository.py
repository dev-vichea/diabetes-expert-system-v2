from __future__ import annotations

from sqlalchemy import func, or_

from app.extensions import db
from app.models import Fact
from app.utils.datetime import serialize_datetime

# Fields exposed to the reasoning overlay (app.expert_system.symptom_database).
OVERLAY_FIELDS = ("weight", "type_indication", "is_cardinal", "is_emergency", "aliases")


class FactRepository:
    """CRUD + lookups for the doctor-managed fact/symptom knowledge catalog."""

    def list_facts(self, *, category=None, status=None, search=None) -> list[dict]:
        query = Fact.query
        if category:
            query = query.filter(Fact.category == str(category).strip().lower())
        if status == "active":
            query = query.filter(Fact.is_active.is_(True))
        elif status == "inactive":
            query = query.filter(Fact.is_active.is_(False))
        if search:
            like = f"%{str(search).strip().lower()}%"
            query = query.filter(or_(
                func.lower(Fact.key).like(like),
                func.lower(Fact.label).like(like),
                func.lower(Fact.medical_term).like(like),
            ))
        rows = query.order_by(Fact.display_order.asc(), Fact.key.asc()).all()
        return [self._serialize(row) for row in rows]

    def get_fact(self, fact_id: int) -> dict | None:
        row = self.get_fact_model(fact_id)
        return self._serialize(row) if row else None

    def get_fact_model(self, fact_id: int) -> Fact | None:
        return Fact.query.filter(Fact.id == fact_id).first()

    def get_by_key(self, key: str) -> Fact | None:
        return Fact.query.filter(Fact.key == str(key).strip().lower()).first()

    def get_active_fact_map(self) -> dict[str, dict]:
        """Active facts keyed by fact key — the reasoning-overlay contract."""
        rows = Fact.query.filter(Fact.is_active.is_(True)).all()
        return {
            row.key: {
                "weight": row.weight,
                "type_indication": row.type_indication,
                "is_cardinal": row.is_cardinal,
                "is_emergency": row.is_emergency,
                "aliases": list(row.aliases or []),
            }
            for row in rows
        }

    def create(self, data: dict) -> dict:
        row = Fact(
            key=data["key"],
            label=data["label"],
            label_km=data.get("label_km"),
            medical_term=data.get("medical_term"),
            category=data.get("category", "other"),
            question=data.get("question"),
            question_km=data.get("question_km"),
            meaning=data.get("meaning"),
            meaning_km=data.get("meaning_km"),
            prevention=data.get("prevention"),
            prevention_km=data.get("prevention_km"),
            weight=data.get("weight", 0.05),
            type_indication=data.get("type_indication", "none"),
            is_cardinal=bool(data.get("is_cardinal", False)),
            is_emergency=bool(data.get("is_emergency", False)),
            aliases=list(data.get("aliases") or []),
            is_active=bool(data.get("is_active", True)),
            display_order=int(data.get("display_order", 100)),
            source=data.get("source", "doctor"),
        )
        db.session.add(row)
        db.session.commit()
        return self._serialize(row)

    def update(self, row: Fact, data: dict) -> dict:
        fields = (
            "label", "label_km", "medical_term", "category", "question", "question_km",
            "meaning", "meaning_km", "prevention", "prevention_km",
        )
        for field in fields:
            if field in data:
                setattr(row, field, data[field])
        if "weight" in data:
            row.weight = float(data["weight"])
        if "type_indication" in data:
            row.type_indication = str(data["type_indication"])
        if "is_cardinal" in data:
            row.is_cardinal = bool(data["is_cardinal"])
        if "is_emergency" in data:
            row.is_emergency = bool(data["is_emergency"])
        if "aliases" in data:
            row.aliases = list(data["aliases"] or [])
        if "display_order" in data:
            row.display_order = int(data["display_order"])
        if "is_active" in data:
            row.is_active = bool(data["is_active"])
        if "source" in data:
            row.source = str(data["source"])
        db.session.commit()
        return self._serialize(row)

    def _serialize(self, row: Fact) -> dict:
        return {
            "id": row.id,
            "key": row.key,
            "label": row.label,
            "label_km": row.label_km,
            "medical_term": row.medical_term,
            "category": row.category,
            "question": row.question,
            "question_km": row.question_km,
            "meaning": row.meaning,
            "meaning_km": row.meaning_km,
            "prevention": row.prevention,
            "prevention_km": row.prevention_km,
            "weight": row.weight,
            "type_indication": row.type_indication,
            "is_cardinal": row.is_cardinal,
            "is_emergency": row.is_emergency,
            "aliases": list(row.aliases or []),
            "is_active": row.is_active,
            "display_order": row.display_order,
            "source": row.source,
            "created_at": serialize_datetime(row.created_at),
            "updated_at": serialize_datetime(row.updated_at),
        }
