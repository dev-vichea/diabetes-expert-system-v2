from sqlalchemy import func
from sqlalchemy.orm import joinedload, selectinload

from app.extensions import db
from app.models import Permission, Role, User, user_roles
from app.utils.datetime import serialize_datetime


class UserRepository:
    def is_empty(self) -> bool:
        return User.query.count() == 0

    def get_by_email(self, email: str) -> User | None:
        return User.query.filter_by(email=email).first()

    def get_by_id(self, user_id: int) -> User | None:
        # Direct grants are consulted on every authenticated request. Loading
        # them with the user avoids adding a separate permission query to the
        # authorization path for every API call.
        return db.session.get(User, user_id, options=[joinedload(User.direct_permissions)])

    def paginate_users(
        self,
        *,
        search: str | None = None,
        role: str | None = None,
        is_active: bool | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[User], int]:
        query = User.query

        if search:
            term = f"%{search.lower()}%"
            query = query.filter(
                func.lower(User.name).like(term)
                | func.lower(User.email).like(term)
            )

        if role:
            query = query.join(User.roles).filter(func.lower(Role.name) == role.lower())

        if is_active is not None:
            query = query.filter(User.is_active.is_(bool(is_active)))

        total = query.distinct().order_by(None).count()

        safe_page = max(1, int(page or 1))
        safe_limit = max(1, min(int(limit or 20), 200))
        offset = (safe_page - 1) * safe_limit

        users = (
            query.options(
                selectinload(User.roles).selectinload(Role.permissions),
                selectinload(User.direct_permissions),
                joinedload(User.patient_profile),
            )
            .distinct()
            .order_by(User.created_at.desc(), User.id.desc())
            .offset(offset)
            .limit(safe_limit)
            .all()
        )
        return users, total

    def list_users(
        self,
        *,
        search: str | None = None,
        role: str | None = None,
        is_active: bool | None = None,
        limit: int = 200,
    ) -> list[User]:
        users, _ = self.paginate_users(search=search, role=role, is_active=is_active, page=1, limit=limit)
        return users

    def list_roles(self) -> list[Role]:
        return Role.query.order_by(Role.name.asc()).all()

    def list_permissions(self) -> list[Permission]:
        return Permission.query.order_by(Permission.code.asc()).all()

    def get_role_by_id(self, role_id: int) -> Role | None:
        return db.session.get(Role, role_id)

    def get_role_by_name(self, role_name: str) -> Role | None:
        return Role.query.filter(func.lower(Role.name) == role_name.lower()).first()

    def get_by_google_sub(self, google_sub: str) -> User | None:
        if not google_sub:
            return None
        return User.query.filter_by(google_sub=google_sub).first()

    def get_by_email_case_insensitive(self, email: str) -> User | None:
        return User.query.filter(func.lower(User.email) == email.lower()).first()

    def create_user(
        self,
        *,
        email: str,
        password_hash: str | None = None,
        name: str,
        is_active: bool,
        role_names: list[str],
        google_sub: str | None = None,
        commit: bool = True,
    ) -> User:
        user = User(
            email=email,
            password_hash=password_hash,
            name=name,
            is_active=is_active,
            google_sub=google_sub,
        )
        user.roles = Role.query.filter(Role.name.in_(role_names)).all()
        db.session.add(user)
        if commit:
            db.session.commit()
        else:
            db.session.flush()
        return user

    def link_google_sub(self, user: User, google_sub: str, commit: bool = True) -> User:
        user.google_sub = google_sub
        if commit:
            db.session.commit()
        else:
            db.session.flush()
        return user

    def update_user(self, user: User, payload: dict) -> User:
        if "email" in payload:
            user.email = payload["email"]
        if "name" in payload:
            user.name = payload["name"]
        if "is_active" in payload:
            user.is_active = bool(payload["is_active"])
        db.session.commit()
        return user

    def update_user_roles(self, user_id: int, role_names: list[str]) -> User | None:
        user = self.get_by_id(user_id)
        if not user:
            return None

        roles = Role.query.filter(Role.name.in_(role_names)).all()
        user.roles = roles
        db.session.commit()
        return user

    def update_user_direct_permissions(self, user_id: int, permission_codes: list[str]) -> User | None:
        user = self.get_by_id(user_id)
        if not user:
            return None

        user.direct_permissions = Permission.query.filter(Permission.code.in_(permission_codes)).all()
        db.session.commit()
        return user

    def update_user_status(self, user_id: int, is_active: bool) -> User | None:
        user = self.get_by_id(user_id)
        if not user:
            return None
        user.is_active = bool(is_active)
        db.session.commit()
        return user

    def create_role(self, *, name: str, description: str, permission_codes: list[str]) -> Role:
        role = Role(name=name, description=description)
        role.permissions = Permission.query.filter(Permission.code.in_(permission_codes)).all()
        db.session.add(role)
        db.session.commit()
        return role

    def update_role(self, role: Role, *, name: str | None, description: str | None, permission_codes: list[str] | None) -> Role:
        if name is not None:
            role.name = name
        if description is not None:
            role.description = description
        if permission_codes is not None:
            role.permissions = Permission.query.filter(Permission.code.in_(permission_codes)).all()
        db.session.commit()
        return role

    def delete_role(self, role: Role, replacement_role: Role | None = None) -> None:
        if replacement_role:
            for user in list(role.users):
                remaining_roles = [assigned_role for assigned_role in user.roles if assigned_role.id != role.id]
                if all(assigned_role.id != replacement_role.id for assigned_role in remaining_roles):
                    remaining_roles.append(replacement_role)
                user.roles = remaining_roles

        db.session.delete(role)
        db.session.commit()

    def count_users(self) -> int:
        return User.query.count()

    def count_active_users(self) -> int:
        return User.query.filter(User.is_active.is_(True)).count()

    def count_inactive_users(self) -> int:
        return User.query.filter(User.is_active.is_(False)).count()

    def count_users_by_role(self) -> dict[str, int]:
        rows = (
            db.session.query(Role.name, func.count(user_roles.c.user_id))
            .select_from(Role)
            .outerjoin(user_roles, user_roles.c.role_id == Role.id)
            .group_by(Role.name)
            .order_by(Role.name.asc())
            .all()
        )
        return {name: int(count or 0) for name, count in rows}

    @staticmethod
    def get_primary_role(user: User) -> str:
        role_names = sorted(role.name for role in user.roles)
        return role_names[0] if role_names else "patient"

    @staticmethod
    def get_permissions(user: User) -> list[str]:
        role_permissions = {permission.code for role in user.roles for permission in role.permissions}
        direct_permissions = {permission.code for permission in user.direct_permissions}
        return sorted(role_permissions | direct_permissions)

    @staticmethod
    def get_role_permissions(user: User) -> list[str]:
        return sorted({permission.code for role in user.roles for permission in role.permissions})

    @staticmethod
    def get_direct_permissions(user: User) -> list[str]:
        return sorted(permission.code for permission in user.direct_permissions)

    @staticmethod
    def to_role_dict(role: Role) -> dict:
        return {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": sorted(permission.code for permission in role.permissions),
            "user_count": len(role.users),
            "users": [
                {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "avatar_url": getattr(user, "avatar_url", None),
                }
                for user in role.users
            ],
            "created_at": serialize_datetime(role.created_at),
        }

    @staticmethod
    def to_permission_dict(permission: Permission) -> dict:
        return {
            "id": permission.id,
            "code": permission.code,
            "description": permission.description,
            "created_at": serialize_datetime(permission.created_at),
        }

    def update_profile(self, user: User, payload: dict) -> User:
        allowed_fields = (
            "name",
            "avatar_url",
            "phone",
            "department",
            "title",
            "hospital_affiliation",
            "license_number",
            "bio",
        )
        for field in allowed_fields:
            if field in payload:
                val = payload[field]
                if isinstance(val, str):
                    val = val.strip() or None
                setattr(user, field, val)
        db.session.commit()
        return user

    def to_public_dict(self, user: User) -> dict:
        role_names = sorted(role.name for role in user.roles)
        role_permissions = self.get_role_permissions(user)
        direct_permissions = self.get_direct_permissions(user)
        permissions = self.get_permissions(user)

        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": getattr(user, "avatar_url", None),
            "phone": getattr(user, "phone", None),
            "department": getattr(user, "department", None),
            "title": getattr(user, "title", None),
            "hospital_affiliation": getattr(user, "hospital_affiliation", None),
            "license_number": getattr(user, "license_number", None),
            "bio": getattr(user, "bio", None),
            "is_active": user.is_active,
            "roles": role_names,
            "role": role_names[0] if role_names else "patient",
            "permissions": permissions,
            "role_permissions": role_permissions,
            "direct_permissions": direct_permissions,
            "patient_id": user.patient_profile.id if user.patient_profile else None,
            "profile_completed": bool(user.patient_profile and user.patient_profile.profile_completed_at is not None),
            "created_at": serialize_datetime(user.created_at),
            "updated_at": serialize_datetime(user.updated_at),
        }
