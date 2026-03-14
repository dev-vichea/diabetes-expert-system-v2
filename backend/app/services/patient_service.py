from datetime import datetime

from app.errors import NotFoundError, ValidationError


class PatientService:
    ALLOWED_GENDERS = {"male", "female", "other", "unknown"}

    def __init__(self, patient_repository, audit_log_repository=None):
        self.patient_repository = patient_repository
        self.audit_log_repository = audit_log_repository

    def register_patient(self, payload: dict, actor_user_id: int | None = None) -> dict:
        normalized = self._normalize_patient_payload(payload, require_full_name=True)
        self._validate_user_link(normalized.get("user_id"))
        patient = self.patient_repository.create_patient(normalized)

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="patient.create",
                entity_type="patient",
                entity_id=str(patient.id),
                actor_user_id=actor_user_id,
                metadata={"full_name": patient.full_name},
            )

        return self.patient_repository.serialize_patient(patient)

    def list_patients(
        self,
        *,
        search: str | None,
        gender: str | None,
        has_diagnosis: bool | None,
        limit: int,
    ) -> list[dict]:
        patients = self.patient_repository.list_patients(
            search=search,
            gender=gender,
            has_diagnosis=has_diagnosis,
            limit=limit,
        )
        return [self.patient_repository.serialize_patient(patient) for patient in patients]

    def get_patient_profile(self, patient_id: int) -> dict:
        patient = self.patient_repository.get_patient(patient_id)
        if not patient:
            raise NotFoundError("Patient not found.")
        return self.patient_repository.serialize_patient(patient)

    def update_patient_profile(self, patient_id: int, payload: dict, actor_user_id: int | None = None) -> dict:
        patient = self.patient_repository.get_patient(patient_id)
        if not patient:
            raise NotFoundError("Patient not found.")

        normalized = self._normalize_patient_payload(payload, require_full_name=False)
        if "user_id" in normalized:
            self._validate_user_link(normalized.get("user_id"), current_patient_id=patient_id)
        updated_patient = self.patient_repository.update_patient(patient, normalized)

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="patient.update",
                entity_type="patient",
                entity_id=str(updated_patient.id),
                actor_user_id=actor_user_id,
                metadata={"fields": sorted(normalized.keys())},
            )

        return self.patient_repository.serialize_patient(updated_patient)

    def get_patient_history(self, patient_id: int) -> dict:
        patient = self.patient_repository.get_patient(patient_id)
        if not patient:
            raise NotFoundError("Patient not found.")

        symptoms = self.patient_repository.list_symptoms(patient_id)
        lab_results = self.patient_repository.list_lab_results(patient_id)
        diagnoses = self.patient_repository.list_diagnoses(patient_id)

        return {
            "patient": self.patient_repository.serialize_patient(patient),
            "symptoms": [self.patient_repository.serialize_symptom(item) for item in symptoms],
            "lab_results": [self.patient_repository.serialize_lab_result(item) for item in lab_results],
            "diagnosis_history": [self.patient_repository.serialize_diagnosis(item) for item in diagnoses],
        }

    def get_my_profile(self, current_user: dict) -> dict:
        user_id = self._current_user_id(current_user)
        patient = self.patient_repository.get_patient_by_user_id(user_id)
        if not patient:
            raise NotFoundError("Patient profile not found.")

        return self.patient_repository.serialize_patient(patient)

    def get_my_history(self, current_user: dict) -> dict:
        user_id = self._current_user_id(current_user)
        patient = self.patient_repository.get_patient_by_user_id(user_id)
        if not patient:
            raise NotFoundError("Patient profile not found.")

        return self.get_patient_history(patient.id)

    def add_symptom(self, patient_id: int, payload: dict, actor_user_id: int | None = None) -> dict:
        patient = self.patient_repository.get_patient(patient_id)
        if not patient:
            raise NotFoundError("Patient not found.")

        normalized = self._normalize_symptom_payload(payload)
        symptom = self.patient_repository.add_symptom(patient_id=patient_id, payload=normalized)

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="symptom.create",
                entity_type="symptom",
                entity_id=str(symptom.id),
                actor_user_id=actor_user_id,
                metadata={"patient_id": patient_id, "symptom_code": symptom.symptom_code},
            )

        return self.patient_repository.serialize_symptom(symptom)

    def list_symptoms(self, patient_id: int, limit: int = 200) -> list[dict]:
        patient = self.patient_repository.get_patient(patient_id)
        if not patient:
            raise NotFoundError("Patient not found.")

        symptoms = self.patient_repository.list_symptoms(patient_id=patient_id, limit=limit)
        return [self.patient_repository.serialize_symptom(item) for item in symptoms]

    def add_lab_result(self, patient_id: int, payload: dict, actor_user_id: int | None = None) -> dict:
        patient = self.patient_repository.get_patient(patient_id)
        if not patient:
            raise NotFoundError("Patient not found.")

        normalized = self._normalize_lab_result_payload(payload)
        lab_result = self.patient_repository.add_lab_result(patient_id=patient_id, payload=normalized)

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="lab_result.create",
                entity_type="lab_result",
                entity_id=str(lab_result.id),
                actor_user_id=actor_user_id,
                metadata={"patient_id": patient_id, "test_name": lab_result.test_name},
            )

        return self.patient_repository.serialize_lab_result(lab_result)

    def list_lab_results(self, patient_id: int, limit: int = 200) -> list[dict]:
        patient = self.patient_repository.get_patient(patient_id)
        if not patient:
            raise NotFoundError("Patient not found.")

        lab_results = self.patient_repository.list_lab_results(patient_id=patient_id, limit=limit)
        return [self.patient_repository.serialize_lab_result(item) for item in lab_results]

    def ensure_patient_exists(self, patient_id: int | None) -> bool:
        if patient_id is None:
            return False
        return self.patient_repository.get_patient(patient_id) is not None

    def get_my_patient_id(self, current_user: dict) -> int | None:
        user_id = self._current_user_id(current_user)
        patient = self.patient_repository.get_patient_by_user_id(user_id)
        return patient.id if patient else None

    @staticmethod
    def _current_user_id(current_user: dict) -> int:
        user_id = current_user.get("sub") if current_user else None
        if user_id in (None, ""):
            raise ValidationError("Invalid authenticated user context.")
        try:
            return int(user_id)
        except (TypeError, ValueError) as exc:
            raise ValidationError("Invalid authenticated user context.") from exc

    def _normalize_patient_payload(self, payload: dict, require_full_name: bool) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError("A JSON object is required.")

        normalized = {}

        if require_full_name or "full_name" in payload:
            full_name = str(payload.get("full_name", "")).strip()
            if not full_name:
                raise ValidationError("full_name is required.")
            normalized["full_name"] = full_name

        if "user_id" in payload and payload.get("user_id") not in (None, ""):
            normalized["user_id"] = self._as_int(payload.get("user_id"), "user_id")

        if "gender" in payload:
            gender = str(payload.get("gender") or "").strip().lower() or None
            if gender and gender not in self.ALLOWED_GENDERS:
                raise ValidationError(
                    "gender must be one of: male, female, other, unknown.",
                )
            normalized["gender"] = gender

        if "date_of_birth" in payload:
            date_raw = str(payload.get("date_of_birth") or "").strip()
            normalized["date_of_birth"] = self._parse_date(date_raw) if date_raw else None

        if "phone" in payload:
            normalized["phone"] = str(payload.get("phone") or "").strip() or None

        if "notes" in payload:
            normalized["notes"] = str(payload.get("notes") or "").strip() or None

        return normalized

    def _normalize_symptom_payload(self, payload: dict) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError("A JSON object is required.")

        symptom_code = str(payload.get("symptom_code", "")).strip().lower()
        symptom_name = str(payload.get("symptom_name", "")).strip()
        if not symptom_code:
            raise ValidationError("symptom_code is required.")
        if not symptom_name:
            raise ValidationError("symptom_name is required.")

        severity_raw = payload.get("severity")
        severity = None
        if severity_raw not in (None, ""):
            severity = self._as_int(severity_raw, "severity")
            if severity < 1 or severity > 10:
                raise ValidationError("severity must be between 1 and 10.")

        recorded_at_raw = str(payload.get("recorded_at") or "").strip()

        return {
            "symptom_code": symptom_code,
            "symptom_name": symptom_name,
            "severity": severity,
            "present": bool(payload.get("present", True)),
            "notes": str(payload.get("notes") or "").strip() or None,
            "recorded_at": self._parse_datetime(recorded_at_raw) if recorded_at_raw else None,
        }

    def _normalize_lab_result_payload(self, payload: dict) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError("A JSON object is required.")

        test_name = str(payload.get("test_name", "")).strip()
        if not test_name:
            raise ValidationError("test_name is required.")

        test_value_raw = payload.get("test_value")
        if test_value_raw in (None, ""):
            raise ValidationError("test_value is required.")

        try:
            test_value = float(test_value_raw)
        except (TypeError, ValueError) as exc:
            raise ValidationError("test_value must be a valid number.") from exc

        measured_at_raw = str(payload.get("measured_at") or "").strip()

        return {
            "test_name": test_name,
            "test_value": test_value,
            "unit": str(payload.get("unit") or "").strip() or None,
            "reference_range": str(payload.get("reference_range") or "").strip() or None,
            "notes": str(payload.get("notes") or "").strip() or None,
            "measured_at": self._parse_datetime(measured_at_raw) if measured_at_raw else None,
        }

    @staticmethod
    def _as_int(value, field_name: str) -> int:
        try:
            return int(value)
        except (TypeError, ValueError) as exc:
            raise ValidationError(f"{field_name} must be an integer.") from exc

    @staticmethod
    def _parse_date(value: str):
        normalized = value.strip()
        supported_formats = ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y")
        for date_format in supported_formats:
            try:
                return datetime.strptime(normalized, date_format).date()
            except ValueError:
                continue
        raise ValidationError("date_of_birth must use YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY format.")

    @staticmethod
    def _parse_datetime(value: str):
        iso_value = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(iso_value)
        except ValueError as exc:
            raise ValidationError("Datetime fields must use ISO 8601 format.") from exc

    def _validate_user_link(self, user_id: int | None, current_patient_id: int | None = None) -> None:
        if user_id is None:
            return

        existing = self.patient_repository.get_patient_by_user_id(user_id)
        if existing and existing.id != current_patient_id:
            raise ValidationError("This user is already linked to another patient profile.")
