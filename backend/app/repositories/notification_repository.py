from app.extensions import db
from app.models import Notification
from app.models.entities import utc_now
from app.utils.datetime import serialize_datetime


class NotificationRepository:
    def create(
        self,
        *,
        user_id: int,
        title: str,
        message: str,
        type: str = "info",
        link: str | None = None,
        metadata: dict | None = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            title=title.strip(),
            message=message.strip(),
            type=type.strip().lower() or "info",
            link=link.strip() if link else None,
            metadata_json=metadata or {},
            is_read=False,
            created_at=utc_now(),
        )
        db.session.add(notification)
        db.session.commit()
        return notification

    def get_by_id(self, notification_id: int, user_id: int) -> Notification | None:
        return Notification.query.filter_by(id=notification_id, user_id=user_id).first()

    def list_for_user(
        self,
        *,
        user_id: int,
        unread_only: bool = False,
        notification_type: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Notification]:
        query = Notification.query.filter_by(user_id=user_id)
        if unread_only:
            query = query.filter_by(is_read=False)
        if notification_type:
            query = query.filter_by(type=notification_type.strip().lower())

        return (
            query.order_by(Notification.created_at.desc(), Notification.id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def count_unread(self, user_id: int) -> int:
        return Notification.query.filter_by(user_id=user_id, is_read=False).count()

    def count_total(self, user_id: int) -> int:
        return Notification.query.filter_by(user_id=user_id).count()

    def mark_as_read(self, notification_id: int, user_id: int) -> Notification | None:
        notification = self.get_by_id(notification_id, user_id)
        if not notification:
            return None

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = utc_now()
            db.session.commit()
        return notification

    def mark_all_as_read(self, user_id: int) -> int:
        updated = (
            Notification.query.filter_by(user_id=user_id, is_read=False).update(
                {"is_read": True, "read_at": utc_now()}, synchronize_session="fetch"
            )
        )
        db.session.commit()
        return updated

    def delete(self, notification_id: int, user_id: int) -> bool:
        notification = self.get_by_id(notification_id, user_id)
        if not notification:
            return False

        db.session.delete(notification)
        db.session.commit()
        return True

    def delete_all_read(self, user_id: int) -> int:
        deleted = (
            Notification.query.filter_by(user_id=user_id, is_read=True).delete(
                synchronize_session="fetch"
            )
        )
        db.session.commit()
        return deleted

    @staticmethod
    def to_dict(notification: Notification) -> dict:
        return {
            "id": notification.id,
            "user_id": notification.user_id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "link": notification.link,
            "is_read": bool(notification.is_read),
            "read_at": serialize_datetime(notification.read_at) if notification.read_at else None,
            "metadata": notification.metadata_json or {},
            "created_at": serialize_datetime(notification.created_at),
        }
