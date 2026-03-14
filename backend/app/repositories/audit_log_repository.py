from datetime import datetime, timedelta

from sqlalchemy import func

from app.extensions import db
from app.models import AuditLog, User


class AuditLogRepository:
    def create(
        self,
        *,
        action: str,
        entity_type: str,
        entity_id: str | None,
        actor_user_id: int | None,
        metadata: dict | None = None,
    ):
        log = AuditLog(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            actor_user_id=actor_user_id,
            metadata_json=metadata or {},
        )
        db.session.add(log)
        db.session.commit()
        return log

    def list_by_entity(self, *, entity_type: str, entity_id: str, limit: int = 100) -> list[dict]:
        return self.list_logs(entity_type=entity_type, entity_id=entity_id, limit=limit)

    def list_logs(
        self,
        *,
        action: str | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
        actor_user_id: int | None = None,
        limit: int = 100,
    ) -> list[dict]:
        query = AuditLog.query

        if action:
            query = query.filter(AuditLog.action == action)
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
        if entity_id:
            query = query.filter(AuditLog.entity_id == entity_id)
        if actor_user_id is not None:
            query = query.filter(AuditLog.actor_user_id == actor_user_id)

        safe_limit = max(1, min(int(limit or 100), 500))
        rows = query.order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).limit(safe_limit).all()
        return self._serialize_many(rows)

    def count_recent_events(self, *, hours: int = 24) -> int:
        since = datetime.utcnow() - timedelta(hours=max(1, int(hours or 24)))
        return AuditLog.query.filter(AuditLog.created_at >= since).count()

    def get_activity_summary(self, *, days: int = 7, top_limit: int = 10) -> dict:
        safe_days = max(1, min(int(days or 7), 90))
        safe_limit = max(1, min(int(top_limit or 10), 50))
        since = datetime.utcnow() - timedelta(days=safe_days)

        events_total = AuditLog.query.filter(AuditLog.created_at >= since).count()

        actions = (
            db.session.query(AuditLog.action, func.count(AuditLog.id))
            .filter(AuditLog.created_at >= since)
            .group_by(AuditLog.action)
            .order_by(func.count(AuditLog.id).desc(), AuditLog.action.asc())
            .limit(safe_limit)
            .all()
        )

        entities = (
            db.session.query(AuditLog.entity_type, func.count(AuditLog.id))
            .filter(AuditLog.created_at >= since)
            .group_by(AuditLog.entity_type)
            .order_by(func.count(AuditLog.id).desc(), AuditLog.entity_type.asc())
            .limit(safe_limit)
            .all()
        )

        unique_actor_count = (
            db.session.query(func.count(func.distinct(AuditLog.actor_user_id)))
            .filter(AuditLog.created_at >= since, AuditLog.actor_user_id.isnot(None))
            .scalar()
            or 0
        )

        return {
            "days": safe_days,
            "events_total": int(events_total),
            "active_actor_count": int(unique_actor_count),
            "top_actions": [{"action": action, "count": int(count)} for action, count in actions],
            "top_entities": [{"entity_type": entity_type, "count": int(count)} for entity_type, count in entities],
        }

    def _serialize_many(self, logs: list[AuditLog]) -> list[dict]:
        actor_ids = sorted({row.actor_user_id for row in logs if row.actor_user_id})
        users_by_id = {}
        if actor_ids:
            users = User.query.filter(User.id.in_(actor_ids)).all()
            users_by_id = {user.id: user for user in users}
        return [self._serialize(log, users_by_id=users_by_id) for log in logs]

    @staticmethod
    def _serialize(log: AuditLog, users_by_id: dict[int, User] | None = None) -> dict:
        users_by_id = users_by_id or {}
        actor = users_by_id.get(log.actor_user_id) if log.actor_user_id else None
        return {
            "id": log.id,
            "actor_user_id": log.actor_user_id,
            "actor_name": actor.name if actor else None,
            "actor_email": actor.email if actor else None,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "metadata": log.metadata_json or {},
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
