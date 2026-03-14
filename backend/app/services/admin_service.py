from werkzeug.security import generate_password_hash

from app.errors import ForbiddenError, NotFoundError, ValidationError


class AdminService:
    BUILT_IN_ROLE_NAMES = {'patient', 'doctor', 'admin', 'super_admin'}

    def __init__(
        self,
        user_repository,
        audit_log_repository=None,
        patient_repository=None,
        rule_repository=None,
        diagnosis_repository=None,
    ):
        self.user_repository = user_repository
        self.audit_log_repository = audit_log_repository
        self.patient_repository = patient_repository
        self.rule_repository = rule_repository
        self.diagnosis_repository = diagnosis_repository

    def list_users(
        self,
        *,
        search: str | None = None,
        role: str | None = None,
        status: str | None = None,
        limit: int = 200,
    ) -> list[dict]:
        is_active = self._parse_status_filter(status)
        users = self.user_repository.list_users(
            search=search,
            role=role,
            is_active=is_active,
            limit=limit,
        )
        return [self.user_repository.to_public_dict(user) for user in users]

    def get_user(self, user_id: int) -> dict:
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError('User not found.')
        return self.user_repository.to_public_dict(user)

    def create_user(self, payload: dict, actor_user_id: int | None = None, actor_claims: dict | None = None) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError('A JSON object is required.')

        email = str(payload.get('email') or '').strip().lower()
        password = str(payload.get('password') or '').strip()
        name = str(payload.get('name') or '').strip()
        role_names = payload.get('roles') or ['patient']
        is_active = self._as_bool(payload.get('is_active', True))

        if not email or '@' not in email:
            raise ValidationError('A valid email is required.')
        if len(password) < 6:
            raise ValidationError('password must be at least 6 characters.')
        if not name:
            raise ValidationError('name is required.')

        role_names = self._normalize_role_names(role_names)
        self._validate_role_names(role_names)
        self._validate_assignable_role_names(role_names, actor_claims)

        existing = self.user_repository.get_by_email_case_insensitive(email)
        if existing:
            raise ValidationError('Email is already in use.')

        user = self.user_repository.create_user(
            email=email,
            password_hash=generate_password_hash(password),
            name=name,
            is_active=is_active,
            role_names=role_names,
        )
        created = self.user_repository.to_public_dict(user)

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action='user.create',
                entity_type='user',
                entity_id=str(user.id),
                actor_user_id=actor_user_id,
                metadata={'roles': role_names, 'is_active': is_active},
            )

        return created

    def update_user(
        self,
        user_id: int,
        payload: dict,
        actor_user_id: int | None = None,
        actor_claims: dict | None = None,
    ) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError('A JSON object is required.')

        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError('User not found.')
        self._ensure_target_editable(user, actor_claims)

        updates = {}

        if 'email' in payload:
            email = str(payload.get('email') or '').strip().lower()
            if not email or '@' not in email:
                raise ValidationError('A valid email is required.')
            existing = self.user_repository.get_by_email_case_insensitive(email)
            if existing and existing.id != user_id:
                raise ValidationError('Email is already in use.')
            updates['email'] = email

        if 'name' in payload:
            name = str(payload.get('name') or '').strip()
            if not name:
                raise ValidationError('name is required.')
            updates['name'] = name

        if not updates:
            raise ValidationError('At least one updatable field is required.')

        updated_user = self.user_repository.update_user(user, updates)
        safe_user = self.user_repository.to_public_dict(updated_user)

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action='user.update',
                entity_type='user',
                entity_id=str(user_id),
                actor_user_id=actor_user_id,
                metadata={'fields': sorted(updates.keys())},
            )

        return safe_user

    def list_roles(self) -> list[dict]:
        roles = self.user_repository.list_roles()
        return [self.user_repository.to_role_dict(role) for role in roles]

    def list_permissions(self) -> list[dict]:
        permissions = self.user_repository.list_permissions()
        return [self.user_repository.to_permission_dict(permission) for permission in permissions]

    def create_role(self, payload: dict, actor_user_id: int | None = None) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError('A JSON object is required.')

        name = str(payload.get('name') or '').strip().lower()
        description = str(payload.get('description') or '').strip()
        permission_codes = self._normalize_permission_codes(payload.get('permissions'))

        if not name:
            raise ValidationError('name is required.')
        if not description:
            raise ValidationError('description is required.')
        if name in self.BUILT_IN_ROLE_NAMES:
            raise ValidationError('Built-in role names are reserved.')

        existing = self.user_repository.get_role_by_name(name)
        if existing:
            raise ValidationError('Role already exists.')

        self._validate_permission_codes(permission_codes)
        role = self.user_repository.create_role(
            name=name,
            description=description,
            permission_codes=permission_codes,
        )

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action='role.create',
                entity_type='role',
                entity_id=str(role.id),
                actor_user_id=actor_user_id,
                metadata={'permissions': permission_codes},
            )

        return self.user_repository.to_role_dict(role)

    def update_role(self, role_id: int, payload: dict, actor_user_id: int | None = None) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError('A JSON object is required.')

        role = self.user_repository.get_role_by_id(role_id)
        if not role:
            raise NotFoundError('Role not found.')
        if role.name in self.BUILT_IN_ROLE_NAMES:
            raise ForbiddenError('Built-in roles cannot be edited.')

        name = None
        description = None
        permission_codes = None

        if 'name' in payload:
            name = str(payload.get('name') or '').strip().lower()
            if not name:
                raise ValidationError('name is required.')
            existing = self.user_repository.get_role_by_name(name)
            if existing and existing.id != role_id:
                raise ValidationError('Role name already exists.')

        if 'description' in payload:
            description = str(payload.get('description') or '').strip()
            if not description:
                raise ValidationError('description is required.')

        if 'permissions' in payload:
            permission_codes = self._normalize_permission_codes(payload.get('permissions'))
            self._validate_permission_codes(permission_codes)

        if name is None and description is None and permission_codes is None:
            raise ValidationError('At least one updatable role field is required.')

        updated = self.user_repository.update_role(
            role,
            name=name,
            description=description,
            permission_codes=permission_codes,
        )

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action='role.update',
                entity_type='role',
                entity_id=str(role_id),
                actor_user_id=actor_user_id,
                metadata={
                    'name_updated': name is not None,
                    'description_updated': description is not None,
                    'permissions_updated': permission_codes is not None,
                },
            )

        return self.user_repository.to_role_dict(updated)

    def update_user_roles(
        self,
        user_id: int,
        role_names: list[str],
        actor_user_id: int | None = None,
        actor_claims: dict | None = None,
    ) -> dict:
        role_names = self._normalize_role_names(role_names)
        self._validate_role_names(role_names)
        self._validate_assignable_role_names(role_names, actor_claims)

        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError('User not found.')

        self._ensure_target_editable(user, actor_claims)

        user = self.user_repository.update_user_roles(user_id=user_id, role_names=role_names)
        if not user:
            raise NotFoundError('User not found.')

        updated = self.user_repository.to_public_dict(user)

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action='user.roles.update',
                entity_type='user',
                entity_id=str(user_id),
                actor_user_id=actor_user_id,
                metadata={'roles': role_names},
            )

        return updated

    def save_user_access_profile(
        self,
        user_id: int,
        payload: dict,
        actor_user_id: int | None = None,
        actor_claims: dict | None = None,
    ) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError('A JSON object is required.')

        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError('User not found.')
        self._ensure_target_editable(user, actor_claims)

        name = str(payload.get('name') or '').strip()
        email = str(payload.get('email') or '').strip().lower()
        role_name = str(payload.get('role_name') or '').strip().lower()
        description = str(payload.get('role_description') or '').strip()
        permission_codes = self._normalize_permission_codes(payload.get('permissions'))
        is_active = self._as_bool(payload.get('is_active', user.is_active))

        if not name:
            raise ValidationError('name is required.')
        if not email or '@' not in email:
            raise ValidationError('A valid email is required.')
        if not role_name:
            raise ValidationError('role_name is required.')
        if role_name == 'custom':
            raise ValidationError('Please enter a real name for the custom role.')

        existing_user = self.user_repository.get_by_email_case_insensitive(email)
        if existing_user and existing_user.id != user_id:
            raise ValidationError('Email is already in use.')

        self._validate_permission_codes(permission_codes)

        role = self.user_repository.get_role_by_name(role_name)
        if role:
            self._validate_assignable_role_names([role_name], actor_claims)
            existing_permissions = sorted(permission.code for permission in role.permissions)
            if existing_permissions != permission_codes:
                raise ValidationError(
                    'Role name already exists with different permissions. Use another role name or select the existing role permissions.'
                )
        else:
            self._validate_assignable_role_names([role_name], actor_claims)
            role_description = description or f'Custom role created from user editor for {name}'
            role = self.user_repository.create_role(
                name=role_name,
                description=role_description,
                permission_codes=permission_codes,
            )
            if self.audit_log_repository:
                self.audit_log_repository.create(
                    action='role.create',
                    entity_type='role',
                    entity_id=str(role.id),
                    actor_user_id=actor_user_id,
                    metadata={'permissions': permission_codes, 'source': 'user_access_profile'},
                )

        updated_user = self.user_repository.update_user(user, {'name': name, 'email': email, 'is_active': is_active})
        updated_user = self.user_repository.update_user_roles(user_id=updated_user.id, role_names=[role.name])
        safe_user = self.user_repository.to_public_dict(updated_user)

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action='user.access_profile.save',
                entity_type='user',
                entity_id=str(user_id),
                actor_user_id=actor_user_id,
                metadata={'role': role.name, 'permissions': permission_codes, 'is_active': is_active},
            )

        return safe_user

    def update_user_status(
        self,
        user_id: int,
        is_active: bool,
        actor_user_id: int | None = None,
        actor_claims: dict | None = None,
    ) -> dict:
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError('User not found.')
        self._ensure_target_editable(user, actor_claims)

        user = self.user_repository.update_user_status(user_id=user_id, is_active=is_active)
        if not user:
            raise NotFoundError('User not found.')

        updated = self.user_repository.to_public_dict(user)

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action='user.status.update',
                entity_type='user',
                entity_id=str(user_id),
                actor_user_id=actor_user_id,
                metadata={'is_active': bool(is_active)},
            )

        return updated

    def list_audit_logs(
        self,
        *,
        action: str | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
        actor_user_id: int | None = None,
        limit: int = 100,
    ) -> list[dict]:
        if not self.audit_log_repository:
            return []

        return self.audit_log_repository.list_logs(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            actor_user_id=actor_user_id,
            limit=limit,
        )

    def get_activity_overview(self, *, days: int = 7, limit: int = 50) -> dict:
        if not self.audit_log_repository:
            return {
                'summary': {'days': days, 'events_total': 0, 'active_actor_count': 0, 'top_actions': [], 'top_entities': []},
                'recent_events': [],
            }

        summary = self.audit_log_repository.get_activity_summary(days=days)
        recent_events = self.audit_log_repository.list_logs(limit=limit)
        return {
            'summary': summary,
            'recent_events': recent_events,
        }

    def get_system_stats(self) -> dict:
        users_total = self.user_repository.count_users()
        users_active = self.user_repository.count_active_users()
        users_inactive = self.user_repository.count_inactive_users()
        users_by_role = self.user_repository.count_users_by_role()

        patients_total = self.patient_repository.count_patients() if self.patient_repository else 0
        rules_total = self.rule_repository.count_rules() if self.rule_repository else 0
        rules_by_status = self.rule_repository.count_rules_by_status() if self.rule_repository else {}

        diagnosis_total = self.diagnosis_repository.count_results() if self.diagnosis_repository else 0
        diagnosis_urgent = self.diagnosis_repository.count_urgent_results() if self.diagnosis_repository else 0
        diagnosis_reviewed = self.diagnosis_repository.count_reviewed_results() if self.diagnosis_repository else 0
        diagnosis_recent_7d = self.diagnosis_repository.count_recent_results(days=7) if self.diagnosis_repository else 0

        events_24h = self.audit_log_repository.count_recent_events(hours=24) if self.audit_log_repository else 0

        return {
            'users': {
                'total': users_total,
                'active': users_active,
                'inactive': users_inactive,
                'by_role': users_by_role,
            },
            'patients': {
                'total': patients_total,
            },
            'rules': {
                'total': rules_total,
                'by_status': rules_by_status,
            },
            'diagnosis': {
                'total': diagnosis_total,
                'urgent': diagnosis_urgent,
                'reviewed': diagnosis_reviewed,
                'recent_7d': diagnosis_recent_7d,
            },
            'activity': {
                'events_24h': events_24h,
            },
        }

    def _validate_role_names(self, role_names: list[str]) -> None:
        available_roles = {role['name'] for role in self.list_roles()}
        unknown_roles = sorted(set(role_names) - available_roles)
        if unknown_roles:
            raise ValidationError('Unknown role(s).', details={'unknown_roles': unknown_roles})

    def _validate_permission_codes(self, permission_codes: list[str]) -> None:
        available_permissions = {item['code'] for item in self.list_permissions()}
        unknown = sorted(set(permission_codes) - available_permissions)
        if unknown:
            raise ValidationError('Unknown permission(s).', details={'unknown_permissions': unknown})

    @staticmethod
    def _normalize_role_names(role_names) -> list[str]:
        if not isinstance(role_names, list):
            raise ValidationError('roles must be a list.')

        normalized = sorted({str(role_name or '').strip().lower() for role_name in role_names if str(role_name or '').strip()})
        if not normalized:
            raise ValidationError('roles is required.')
        return normalized

    @staticmethod
    def _normalize_permission_codes(permission_codes) -> list[str]:
        if permission_codes is None:
            return []

        if not isinstance(permission_codes, list):
            raise ValidationError('permissions must be a list.')

        normalized = sorted({str(code or '').strip() for code in permission_codes if str(code or '').strip()})
        return normalized

    @staticmethod
    def _parse_status_filter(status: str | None) -> bool | None:
        if not status:
            return None

        normalized = str(status).strip().lower()
        if normalized in {'active', 'enabled', 'true', '1'}:
            return True
        if normalized in {'inactive', 'disabled', 'false', '0'}:
            return False
        if normalized in {'all', 'any'}:
            return None

        raise ValidationError('status must be one of: active, inactive, or all.')

    @staticmethod
    def _as_bool(value) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.strip().lower() in {'1', 'true', 'yes', 'y', 'on'}
        return bool(value)

    @staticmethod
    def _get_actor_roles(actor_claims: dict | None) -> set[str]:
        if not actor_claims:
            return set()

        roles = actor_claims.get('roles')
        if isinstance(roles, list):
            return {str(role or '').strip().lower() for role in roles if str(role or '').strip()}

        role = str(actor_claims.get('role') or '').strip().lower()
        return {role} if role else set()

    def _is_super_admin(self, actor_claims: dict | None) -> bool:
        return 'super_admin' in self._get_actor_roles(actor_claims)

    def _ensure_target_editable(self, user, actor_claims: dict | None) -> None:
        target_roles = {role.name for role in user.roles}
        if 'super_admin' in target_roles and not self._is_super_admin(actor_claims):
            raise ForbiddenError('Only super admins can edit super admin accounts.')

    def _validate_assignable_role_names(self, role_names: list[str], actor_claims: dict | None) -> None:
        role_set = set(role_names)
        if 'super_admin' in role_set and not self._is_super_admin(actor_claims):
            raise ForbiddenError('Only super admins can assign the super_admin role.')
