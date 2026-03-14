import time
from datetime import UTC, datetime
from uuid import uuid4

import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from werkzeug.security import check_password_hash, generate_password_hash

from app.errors import UnauthorizedError, ValidationError
from app.extensions import db


class AuthService:
    ACCESS_TOKEN_TYPE = "access"
    REFRESH_TOKEN_TYPE = "refresh"

    def __init__(
        self,
        user_repository,
        token_repository,
        secret_key: str,
        algorithm: str,
        access_token_expires_seconds: int,
        refresh_token_expires_seconds: int,
        audit_log_repository=None,
        patient_repository=None,
    ):
        self.user_repository = user_repository
        self.token_repository = token_repository
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expires_seconds = access_token_expires_seconds
        self.refresh_token_expires_seconds = refresh_token_expires_seconds
        self.audit_log_repository = audit_log_repository
        self.patient_repository = patient_repository

    def register(self, payload: dict) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError("A JSON object is required.")

        email = str(payload.get("email") or "").strip().lower()
        password = str(payload.get("password") or "").strip()
        name = str(payload.get("name") or "").strip()

        if not email or "@" not in email:
            raise ValidationError("A valid email is required.")
        if len(password) < 6:
            raise ValidationError("password must be at least 6 characters.")
        if not name:
            raise ValidationError("name is required.")
        if self.user_repository.get_by_email_case_insensitive(email):
            raise ValidationError("Email is already in use.")

        patient_role = self.user_repository.get_role_by_name("patient")
        if not patient_role:
            raise ValidationError("Patient self-registration is not available because the patient role is not configured.")

        try:
            user = self.user_repository.create_user(
                email=email,
                password_hash=generate_password_hash(password),
                name=name,
                is_active=True,
                role_names=["patient"],
                commit=False,
            )
            self.patient_repository.create_patient(
                {
                    "user_id": user.id,
                    "full_name": name,
                    "gender": "unknown",
                    "date_of_birth": None,
                    "phone": None,
                    "notes": "Created through self-registration.",
                },
                commit=False,
            )
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        public_user = self.user_repository.to_public_dict(user)
        tokens = self.issue_tokens(public_user)

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="auth.register",
                entity_type="user",
                entity_id=str(user.id),
                actor_user_id=user.id,
                metadata={"email": user.email, "roles": ["patient"]},
            )

        return {
            **tokens,
            "user": public_user,
        }

    def login(self, email: str, password: str) -> dict:
        if not email or not password:
            raise ValidationError("Email and password are required.")

        user = self.user_repository.get_by_email(email)
        if not user or not check_password_hash(user.password_hash, password):
            raise UnauthorizedError("Invalid credentials.")

        if not user.is_active:
            raise UnauthorizedError("User account is inactive.")

        public_user = self.user_repository.to_public_dict(user)
        tokens = self.issue_tokens(public_user)

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="auth.login",
                entity_type="user",
                entity_id=str(user.id),
                actor_user_id=user.id,
                metadata={"email": user.email},
            )

        return {
            **tokens,
            "user": public_user,
        }

    def refresh(self, refresh_token: str) -> dict:
        if not refresh_token:
            raise ValidationError("refresh_token is required.")

        payload = self.decode_token(refresh_token, expected_type=self.REFRESH_TOKEN_TYPE)
        user_id = int(payload["sub"])
        user = self.user_repository.get_by_id(user_id)

        if not user or not user.is_active:
            raise UnauthorizedError("User account is inactive.")

        self._revoke_from_payload(payload)

        public_user = self.user_repository.to_public_dict(user)
        tokens = self.issue_tokens(public_user)

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="auth.refresh",
                entity_type="user",
                entity_id=str(user.id),
                actor_user_id=user.id,
                metadata={"refresh_jti": payload.get("jti")},
            )

        return {
            **tokens,
            "user": public_user,
        }

    def logout(self, access_token: str | None, refresh_token: str | None, actor_user_id: int | None = None):
        if not access_token and not refresh_token:
            raise ValidationError("At least one token is required for logout.")

        revoked_jtis = []

        for token, expected_type in (
            (access_token, self.ACCESS_TOKEN_TYPE),
            (refresh_token, self.REFRESH_TOKEN_TYPE),
        ):
            if not token:
                continue

            payload = self.decode_token(
                token,
                expected_type=expected_type,
                verify_exp=False,
                check_revoked=False,
                check_user_active=False,
            )
            self._revoke_from_payload(payload)
            if payload.get("jti"):
                revoked_jtis.append(payload["jti"])

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="auth.logout",
                entity_type="token",
                entity_id=revoked_jtis[0] if revoked_jtis else None,
                actor_user_id=actor_user_id,
                metadata={"revoked_jtis": revoked_jtis},
            )

    def issue_tokens(self, user: dict) -> dict:
        access_token = self._create_token(
            user,
            token_type=self.ACCESS_TOKEN_TYPE,
            expires_seconds=self.access_token_expires_seconds,
        )
        refresh_token = self._create_token(
            user,
            token_type=self.REFRESH_TOKEN_TYPE,
            expires_seconds=self.refresh_token_expires_seconds,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": self.access_token_expires_seconds,
        }

    def decode_access_token(self, token: str) -> dict:
        return self.decode_token(token, expected_type=self.ACCESS_TOKEN_TYPE)

    def decode_token(
        self,
        token: str,
        *,
        expected_type: str | None = None,
        verify_exp: bool = True,
        check_revoked: bool = True,
        check_user_active: bool = True,
    ) -> dict:
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                options={"verify_exp": verify_exp},
            )
        except ExpiredSignatureError as exc:
            raise UnauthorizedError("Token has expired.") from exc
        except InvalidTokenError as exc:
            raise UnauthorizedError("Invalid token.") from exc

        token_type = payload.get("type")
        if expected_type and token_type != expected_type:
            raise UnauthorizedError(f"Invalid token type. Expected {expected_type}.")

        jti = payload.get("jti")
        if check_revoked and jti and self.token_repository.is_revoked(jti):
            raise UnauthorizedError("Token has been revoked.")

        if check_user_active:
            user_id = payload.get("sub")
            user = self.user_repository.get_by_id(int(user_id)) if user_id else None
            if not user or not user.is_active:
                raise UnauthorizedError("User account is inactive.")

        return payload

    def _create_token(self, user: dict, *, token_type: str, expires_seconds: int) -> str:
        issued_at = int(time.time())
        payload = {
            "jti": uuid4().hex,
            "type": token_type,
            "sub": str(user["id"]),
            "email": user["email"],
            "role": user["role"],
            "roles": user.get("roles", [user["role"]]),
            "permissions": user.get("permissions", []),
            "patient_id": user.get("patient_id"),
            "name": user["name"],
            "iat": issued_at,
            "exp": issued_at + expires_seconds,
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def _revoke_from_payload(self, payload: dict):
        jti = payload.get("jti")
        if not jti:
            return

        self.token_repository.revoke_token(
            jti=jti,
            token_type=payload.get("type", "unknown"),
            user_id=int(payload["sub"]) if payload.get("sub") else None,
            expires_at=datetime.fromtimestamp(int(payload.get("exp", int(time.time()))), UTC),
        )
