from datetime import datetime

from app.extensions import db
from app.models import RevokedToken


class TokenRepository:
    def is_revoked(self, jti: str) -> bool:
        if not jti:
            return False
        return RevokedToken.query.filter_by(jti=jti).first() is not None

    def revoke_token(self, *, jti: str, token_type: str, user_id: int | None, expires_at: datetime):
        if not jti:
            return

        existing = RevokedToken.query.filter_by(jti=jti).first()
        if existing:
            return

        record = RevokedToken(
            jti=jti,
            token_type=token_type,
            user_id=user_id,
            expires_at=expires_at,
        )
        db.session.add(record)
        db.session.commit()
