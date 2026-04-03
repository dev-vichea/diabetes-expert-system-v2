from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.errors import ValidationError
from app.extensions import db
from app.models import DiagnosisResult, LabResult, Patient, Symptom
from app.utils.datetime import serialize_datetime


class PatientRepository:
    def count_patients(self) -> int:
        return Patient.query.count()

    def create_patient(self, payload: dict, *, commit: bool = True) -> Patient:
        patient = Patient(
            user_id=payload.get("user_id"),
            full_name=payload["full_name"],
            gender=payload.get("gender"),
            date_of_birth=payload.get("date_of_birth"),
            phone=payload.get("phone"),
            notes=payload.get("notes"),
        )
        db.session.add(patient)
        try:
            if commit:
                db.session.commit()
            else:
                db.session.flush()
        except IntegrityError as exc:
            db.session.rollback()
            raise ValidationError("Patient could not be created. Check unique fields and required values.") from exc
        except SQLAlchemyError as exc:
            db.session.rollback()
            raise ValidationError("Database error while creating patient.") from exc
        return patient

    def get_patient(self, patient_id: int) -> Patient | None:
        return db.session.get(Patient, patient_id)

    def get_patient_by_user_id(self, user_id: int) -> Patient | None:
        return Patient.query.filter_by(user_id=user_id).first()

    def update_patient(self, patient: Patient, payload: dict) -> Patient:
        if "user_id" in payload:
            patient.user_id = payload["user_id"]
        if "full_name" in payload:
            patient.full_name = payload["full_name"]
        if "gender" in payload:
            patient.gender = payload["gender"]
        if "date_of_birth" in payload:
            patient.date_of_birth = payload["date_of_birth"]
        if "phone" in payload:
            patient.phone = payload["phone"]
        if "notes" in payload:
            patient.notes = payload["notes"]
        try:
            db.session.commit()
        except IntegrityError as exc:
            db.session.rollback()
            raise ValidationError("Patient update failed. Check unique fields and input values.") from exc
        except SQLAlchemyError as exc:
            db.session.rollback()
            raise ValidationError("Database error while updating patient.") from exc
        return patient

    def list_patients(
        self,
        *,
        search: str | None = None,
        gender: str | None = None,
        has_diagnosis: bool | None = None,
        limit: int = 200,
    ) -> list[Patient]:
        query = Patient.query

        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                func.lower(Patient.full_name).like(search_term)
                | func.lower(func.coalesce(Patient.phone, "")).like(search_term)
            )

        if gender:
            query = query.filter(func.lower(func.coalesce(Patient.gender, "")) == gender.lower())

        if has_diagnosis is True:
            query = query.join(DiagnosisResult, DiagnosisResult.patient_id == Patient.id).distinct()
        elif has_diagnosis is False:
            query = query.outerjoin(DiagnosisResult, DiagnosisResult.patient_id == Patient.id).filter(
                DiagnosisResult.id.is_(None)
            )

        return query.order_by(Patient.updated_at.desc()).limit(limit).all()

    def add_symptom(self, patient_id: int, payload: dict) -> Symptom:
        symptom = Symptom(
            patient_id=patient_id,
            symptom_code=payload["symptom_code"],
            symptom_name=payload["symptom_name"],
            severity=payload.get("severity"),
            present=payload.get("present", True),
            notes=payload.get("notes"),
            recorded_at=payload.get("recorded_at"),
        )
        db.session.add(symptom)
        db.session.commit()
        return symptom

    def list_symptoms(self, patient_id: int, limit: int = 200) -> list[Symptom]:
        return (
            Symptom.query.filter_by(patient_id=patient_id)
            .order_by(Symptom.recorded_at.desc())
            .limit(limit)
            .all()
        )

    def add_lab_result(self, patient_id: int, payload: dict) -> LabResult:
        result = LabResult(
            patient_id=patient_id,
            test_name=payload["test_name"],
            test_value=payload["test_value"],
            unit=payload.get("unit"),
            reference_range=payload.get("reference_range"),
            notes=payload.get("notes"),
            measured_at=payload.get("measured_at"),
        )
        db.session.add(result)
        db.session.commit()
        return result

    def list_lab_results(self, patient_id: int, limit: int = 200) -> list[LabResult]:
        return (
            LabResult.query.filter_by(patient_id=patient_id)
            .order_by(LabResult.measured_at.desc())
            .limit(limit)
            .all()
        )

    def list_diagnoses(self, patient_id: int, limit: int = 200) -> list[DiagnosisResult]:
        return (
            DiagnosisResult.query.filter_by(patient_id=patient_id)
            .order_by(DiagnosisResult.created_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def serialize_patient(patient: Patient) -> dict:
        latest_diagnosis = (
            sorted(patient.diagnosis_results, key=lambda item: item.created_at or item.id, reverse=True)[0]
            if patient.diagnosis_results
            else None
        )

        return {
            "id": patient.id,
            "user_id": patient.user_id,
            "full_name": patient.full_name,
            "gender": patient.gender,
            "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
            "phone": patient.phone,
            "notes": patient.notes,
            "created_at": serialize_datetime(patient.created_at),
            "updated_at": serialize_datetime(patient.updated_at),
            "symptom_count": len(patient.symptoms),
            "lab_result_count": len(patient.lab_results),
            "diagnosis_count": len(patient.diagnosis_results),
            "latest_diagnosis_result_id": latest_diagnosis.id if latest_diagnosis else None,
            "latest_diagnosis": latest_diagnosis.diagnosis if latest_diagnosis else None,
            "latest_diagnosis_created_at": serialize_datetime(latest_diagnosis.created_at) if latest_diagnosis else None,
        }

    @staticmethod
    def serialize_symptom(symptom: Symptom) -> dict:
        return {
            "id": symptom.id,
            "patient_id": symptom.patient_id,
            "symptom_code": symptom.symptom_code,
            "symptom_name": symptom.symptom_name,
            "severity": symptom.severity,
            "present": symptom.present,
            "notes": symptom.notes,
            "recorded_at": serialize_datetime(symptom.recorded_at),
        }

    @staticmethod
    def serialize_lab_result(result: LabResult) -> dict:
        return {
            "id": result.id,
            "patient_id": result.patient_id,
            "test_name": result.test_name,
            "test_value": float(result.test_value),
            "unit": result.unit,
            "reference_range": result.reference_range,
            "notes": result.notes,
            "measured_at": serialize_datetime(result.measured_at),
        }

    @staticmethod
    def serialize_diagnosis(diagnosis: DiagnosisResult) -> dict:
        return {
            "id": diagnosis.id,
            "patient_id": diagnosis.patient_id,
            "diagnosed_by_user_id": diagnosis.diagnosed_by_user_id,
            "diagnosed_by_name": diagnosis.diagnosed_by_user.name if diagnosis.diagnosed_by_user else None,
            "reviewed_by_user_id": diagnosis.reviewed_by_user_id,
            "reviewed_by_name": diagnosis.reviewed_by_user.name if diagnosis.reviewed_by_user else None,
            "diagnosis": diagnosis.diagnosis,
            "certainty": float(diagnosis.certainty),
            "recommendation": diagnosis.recommendation,
            "facts": diagnosis.facts_json,
            "questionnaire_answers": diagnosis.questionnaire_answers_json,
            "triggered_rules": diagnosis.triggered_rules_json,
            "explanation_trace": diagnosis.explanation_trace_json,
            "review_note": diagnosis.review_note,
            "is_urgent": bool(diagnosis.is_urgent),
            "urgent_reason": diagnosis.urgent_reason,
            "reviewed_at": serialize_datetime(diagnosis.reviewed_at),
            "created_at": serialize_datetime(diagnosis.created_at),
        }
