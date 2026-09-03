import json

from flask import current_app

from app.errors import NotFoundError, ValidationError
from app.expert_system.final_assessment import generate_final_assessment
from app.expert_system.inference_engine import run_inference
from app.expert_system.symptom_confidence import calculate_symptom_confidence
from app.expert_system.symptom_database import apply_fact_overlay, clear_fact_overlay
from app.repositories import FactRepository
from app.expert_system.patient_messaging import (
    NOTE_NO_LABS_COMPLETENESS_KEY,
    NOTE_URGENT_SAFETY_KEY,
    note_bilingual,
    rewrite_recommendation,
    rewrite_recommendation_bilingual,
)
from app.models.entities import utc_now
from app.services.diagnosis_report_service import render_diagnosis_report_pdf
from app.utils.i18n import SUPPORTED_LANGUAGES, bilingual, join_bilingual, pick, text

# Bilingual generated-text catalogs ({en, km} entries under app/locales/).
DT = "diagnosis_texts"


class DiagnosisService:
    ALLOWED_ASSESSMENT_MODES = {"screening", "diagnostic"}

    def __init__(self, rule_repository, diagnosis_repository, assessment_repository, patient_repository, audit_log_repository=None):
        self.rule_repository = rule_repository
        self.diagnosis_repository = diagnosis_repository
        self.assessment_repository = assessment_repository
        self.patient_repository = patient_repository
        self.audit_log_repository = audit_log_repository

    def evaluate(self, payload: dict, current_user: dict) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError("A JSON object is required.")

        user_id = int(current_user.get("sub")) if current_user and current_user.get("sub") else None
        user_roles = set(current_user.get("roles") or [current_user.get("role")])

        normalized_payload = self._normalize_assessment_payload(payload)
        questionnaire_answers = self._extract_questionnaire_answers(payload)
        patient_id = self._resolve_patient_id(payload=payload, current_user=current_user, user_roles=user_roles)
        mode = self._resolve_assessment_mode(payload.get("mode"), normalized_payload)

        session = self.assessment_repository.create_session(
            patient_id=patient_id,
            submitted_by_user_id=user_id,
            mode=mode,
            status="submitted",
        )
        answer_records = self._build_assessment_answer_records(payload)
        self.assessment_repository.save_answers(session, answer_records)

        # Doctor-managed fact knowledge (weights / type indications / flags)
        # participates in the reasoning from this run onward.
        self._refresh_fact_overlay()

        try:
            result = run_inference(normalized_payload, self.rule_repository.list_rules())
            result = self._enrich_inference_result(result, normalized_payload)
            # Persist the type pattern inside the explanation trace so saved
            # results keep it (the DB has no dedicated suspected_type column).
            if result.get("suspected_type") is not None:
                result["explanation_trace"] = {
                    **(result.get("explanation_trace") or {}),
                    "suspected_type": result.get("suspected_type"),
                }
            # Adaptive final assessment (patterns / evidence / uncertainty /
            # next step) rides along in the response AND the persisted
            # explanation trace so saved results keep it.
            adaptive = generate_final_assessment(normalized_payload)
            result["adaptive_assessment"] = adaptive
            result["explanation_trace"] = {
                **(result.get("explanation_trace") or {}),
                "adaptive_assessment": adaptive,
            }
            is_urgent, urgent_reasons = self._derive_urgency(normalized_payload, result)
            urgent_reason_en = pick(urgent_reasons, lang="en") if urgent_reasons else None

            diagnosis_record = self.diagnosis_repository.create_result(
                assessment_session_id=session.id,
                patient_id=patient_id,
                diagnosed_by_user_id=user_id,
                diagnosis=result["diagnosis"],
                certainty=result["certainty"],
                recommendation=result["recommendation"],
                facts=result["facts"],
                questionnaire_answers=questionnaire_answers,
                triggered_rules=result["triggered_rules"],
                explanation_trace=result.get("explanation_trace"),
                is_urgent=is_urgent,
                urgent_reason=urgent_reason_en,
            )
            self.assessment_repository.mark_completed(session)
        except Exception:
            self.assessment_repository.mark_failed(session)
            raise

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="diagnosis.create",
                entity_type="diagnosis_result",
                entity_id=str(diagnosis_record.id),
                actor_user_id=user_id,
                metadata={
                    "diagnosis": result["diagnosis"],
                    "certainty": result["certainty"],
                    "patient_id": patient_id,
                    "assessment_session_id": session.id,
                    "assessment_mode": mode,
                    "is_urgent": is_urgent,
                },
            )

        response = dict(result)
        response["diagnosis_result_id"] = diagnosis_record.id
        response["assessment_session_id"] = session.id
        response["assessment_mode"] = mode
        response["patient_id"] = patient_id
        response["is_urgent"] = is_urgent
        response["urgent_reason"] = urgent_reason_en
        response["urgent_reason_km"] = pick(urgent_reasons, lang="km") if urgent_reasons else None
        response["questionnaire_answers"] = questionnaire_answers
        return response

    def list_my_results(self, current_user: dict) -> list[dict]:
        patient_id = self._resolve_patient_id(payload={}, current_user=current_user, user_roles={"patient"})
        return [
            self._normalize_persisted_texts(row)
            for row in self.diagnosis_repository.list_by_patient_id(patient_id)
        ]

    def list_review_results(self, limit: int = 100) -> list[dict]:
        safe_limit = max(1, min(int(limit or 100), 300))
        return [
            self._normalize_persisted_texts(row)
            for row in self.diagnosis_repository.list_recent(limit=safe_limit)
        ]

    def get_result(self, diagnosis_result_id: int) -> dict:
        result = self.diagnosis_repository.get_result(diagnosis_result_id)
        if not result:
            raise NotFoundError("Diagnosis result not found.")
        serialized = self.diagnosis_repository.serialize_result(result)
        return self._rebuild_persisted_response(serialized)

    def _rebuild_persisted_response(self, data: dict) -> dict:
        """Rebuild the full assessment response from a persisted result row so
        viewing a saved result (history / My Results → Medical Assessment
        Report) renders exactly the same derived fields the original evaluate
        response carried: matched symptoms, risk factors, key labs, evidence
        completeness, bilingual summaries and structured recommendations."""
        data = self._normalize_persisted_texts(data)

        facts = data.get("facts") if isinstance(data.get("facts"), dict) else {}
        trace = data.get("explanation_trace") if isinstance(data.get("explanation_trace"), dict) else {}
        normalized_payload = self._reconstruct_normalized_payload(facts, data.get("questionnaire_answers"))

        pseudo_result = {
            "diagnosis": data.get("diagnosis"),
            "certainty": data.get("certainty"),
            "recommendation": data.get("recommendation"),
            "facts": facts,
            "triggered_rules": data.get("triggered_rules") or [],
            "explanation_trace": trace,
        }
        enriched = self._apply_presentation_fields(pseudo_result, normalized_payload)

        # Persisted values are authoritative — rules or message catalogs may
        # have changed since the assessment originally ran.
        try:
            certainty = float(data.get("certainty") or 0)
        except (TypeError, ValueError):
            certainty = 0.0
        enriched["id"] = data.get("id")
        enriched["diagnosis"] = data.get("diagnosis")
        enriched["certainty"] = certainty
        enriched["certainty_percent"] = self._to_percent(certainty)
        enriched["confidence_level"] = self._resolve_confidence_level(enriched["certainty_percent"])
        enriched["recommendation"] = data.get("recommendation")
        enriched["is_urgent"] = bool(data.get("is_urgent"))
        enriched["urgent_reason"] = data.get("urgent_reason")
        if enriched["is_urgent"] and not data.get("urgent_reason_km"):
            _, urgent_reasons = self._derive_urgency(normalized_payload, enriched)
            if urgent_reasons:
                enriched["urgent_reason_km"] = pick(urgent_reasons, lang="km")

        # Values preserved inside the explanation trace at save time.
        enriched["suspected_type"] = trace.get("suspected_type")
        enriched["adaptive_assessment"] = trace.get("adaptive_assessment")
        confidence_trace = trace.get("confidence_calculation") if isinstance(trace.get("confidence_calculation"), dict) else {}
        if confidence_trace.get("context_note"):
            enriched["context_note"] = confidence_trace["context_note"]
        if confidence_trace.get("conclusion_scores"):
            enriched["all_conclusions"] = confidence_trace["conclusion_scores"]

        # Row metadata (ids, names, review state, session, timestamps…).
        for key in (
            "assessment_session_id",
            "assessment_session",
            "patient_id",
            "patient_name",
            "diagnosed_by_user_id",
            "diagnosed_by_name",
            "reviewed_by_user_id",
            "reviewed_by_name",
            "review_note",
            "reviewed_at",
            "created_at",
            "questionnaire_answers",
        ):
            if key in data:
                enriched[key] = data[key]
        if isinstance(enriched.get("assessment_session"), dict):
            enriched["assessment_mode"] = enriched["assessment_session"].get("mode")

        return enriched

    @staticmethod
    def _reconstruct_normalized_payload(facts: dict, questionnaire_answers) -> dict:
        """Approximate the normalized assessment payload the result was run
        with, from the persisted facts (normalized input + derived facts) and
        the raw questionnaire answers."""
        # Mirrored fact twins (fasting_glucose ↔ fasting_plasma_glucose,
        # family_history ↔ family_history_diabetes, …) describe the SAME input
        # fact — the fact preparer stores both. Keep only the canonical key so
        # lab counts / risk labels match what the original payload produced.
        mirrored_twin_keys = {
            "fasting_plasma_glucose": "fasting_glucose",
            "a1c": "hba1c",
            "two_hour_ogtt_75g": "2h_ogtt_75g",
            "polyuria": "frequent_urination",
            "polydipsia": "excessive_thirst",
            "no_lab_values_available": "no_labs_available",
            "family_history_diabetes": "family_history",
            "physical_activity_low": "sedentary_lifestyle",
        }
        payload = {}
        for key, value in (facts or {}).items():
            canonical = mirrored_twin_keys.get(key)
            if canonical and canonical in facts:
                continue
            payload[key] = value

        answers = questionnaire_answers.get("answers") if isinstance(questionnaire_answers, dict) else None
        if isinstance(answers, dict):
            for key, value in answers.items():
                if key not in payload and value not in (None, ""):
                    payload[str(key)] = value

        # The risk-factor collector expects the grouped `risk_factors` dict the
        # original payload carried; rebuild it from the flat booleans.
        risk_keys = (
            "family_history",
            "sedentary_lifestyle",
            "obesity",
            "hypertension",
            "gestational_history",
            "smoking",
            "high_cholesterol",
            "pcos_history",
            "ethnicity_high_risk",
        )
        risk_factors = {key: payload[key] for key in risk_keys if payload.get(key) not in (None, "", False)}
        if risk_factors:
            payload["risk_factors"] = risk_factors

        return payload

    def _normalize_persisted_texts(self, payload: dict) -> dict:
        """Rewrite clinical recommendation strings stored in older results so
        history records display with the same patient-friendly bilingual text
        as fresh assessments."""
        data = dict(payload or {})
        if data.get("recommendation"):
            data["recommendation"] = rewrite_recommendation(str(data["recommendation"]))

        if not data.get("recommendations"):
            trace_recommendations = ((data.get("explanation_trace") or {}).get("recommendations") or [])
            if isinstance(trace_recommendations, list) and trace_recommendations:
                data["recommendations"] = trace_recommendations

        data["recommendations"] = self._bilingualize_recommendations(data.get("recommendations"))

        trace = data.get("explanation_trace")
        if isinstance(trace, dict) and isinstance(trace.get("recommendations"), list):
            trace = dict(trace)
            trace["recommendations"] = self._bilingualize_recommendations(trace.get("recommendations"))
            data["explanation_trace"] = trace
        return data

    @staticmethod
    def _bilingualize_recommendations(items) -> list:
        """Attach Khmer `text_km` to every recommendation entry (idempotent —
        already-rewritten strings resolve through the catalog value index)."""
        out = []
        for item in items or []:
            if isinstance(item, dict):
                bi = rewrite_recommendation_bilingual(str(item.get("text") or ""))
                out.append({**item, "text": bi["en"], "text_km": bi.get("km", "")})
            elif isinstance(item, str):
                bi = rewrite_recommendation_bilingual(item)
                out.append({"text": bi["en"], "text_km": bi.get("km", "")})
            else:
                out.append(item)
        return out

    def generate_report_pdf(self, diagnosis_result_id: int) -> tuple[bytes, str]:
        result = self.diagnosis_repository.get_result(diagnosis_result_id)
        if not result:
            raise NotFoundError("Diagnosis result not found.")

        return render_diagnosis_report_pdf(
            result,
            config={
                "REPORT_CLINIC_NAME": current_app.config.get("REPORT_CLINIC_NAME"),
                "REPORT_CLINIC_ADDRESS": current_app.config.get("REPORT_CLINIC_ADDRESS"),
                "REPORT_CLINIC_PHONE": current_app.config.get("REPORT_CLINIC_PHONE"),
                "REPORT_CLINIC_EMAIL": current_app.config.get("REPORT_CLINIC_EMAIL"),
            },
        )

    def review_result(self, diagnosis_result_id: int, payload: dict, current_user: dict) -> dict:
        if not isinstance(payload, dict):
            raise ValidationError("A JSON object is required.")

        result = self.diagnosis_repository.get_result(diagnosis_result_id)
        if not result:
            raise NotFoundError("Diagnosis result not found.")

        reviewer_user_id = int(current_user.get("sub")) if current_user and current_user.get("sub") else None
        if not reviewer_user_id:
            raise ValidationError("Invalid reviewer context.")

        review_note = None
        if "review_note" in payload:
            review_note = str(payload.get("review_note") or "").strip() or None

        is_urgent = None
        if "is_urgent" in payload:
            is_urgent = self._as_bool(payload.get("is_urgent"))

        urgent_reason = None
        if "urgent_reason" in payload:
            urgent_reason = str(payload.get("urgent_reason") or "").strip() or None

        if is_urgent is True and not urgent_reason:
            raise ValidationError("urgent_reason is required when is_urgent is true.")

        if review_note is None and is_urgent is None and urgent_reason is None:
            raise ValidationError("At least one review field is required.")

        updated = self.diagnosis_repository.update_review(
            result,
            reviewed_by_user_id=reviewer_user_id,
            review_note=review_note,
            is_urgent=is_urgent,
            urgent_reason=urgent_reason,
            reviewed_at=utc_now(),
        )

        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="diagnosis.review",
                entity_type="diagnosis_result",
                entity_id=str(diagnosis_result_id),
                actor_user_id=reviewer_user_id,
                metadata={
                    "is_urgent": updated.is_urgent,
                    "review_note": bool(updated.review_note),
                },
            )

        return self.diagnosis_repository.serialize_result(updated)

    def _resolve_patient_id(self, payload: dict, current_user: dict, user_roles: set[str]) -> int:
        if "patient" in user_roles:
            patient_id = self._as_optional_int(current_user.get("patient_id"), field_name="patient_id")
            if not patient_id and current_user.get("sub"):
                patient = self.patient_repository.get_patient_by_user_id(int(current_user["sub"]))
                patient_id = patient.id if patient else None
            if not patient_id:
                raise ValidationError("Patient profile is not linked to this account.")
            return patient_id

        patient_id = self._as_optional_int(payload.get("patient_id"), field_name="patient_id")
        if not patient_id:
            raise ValidationError("patient_id is required for clinician assessments.")

        patient = self.patient_repository.get_patient(patient_id)
        if not patient:
            raise NotFoundError("Patient not found.")
        return patient_id

    def _normalize_assessment_payload(self, payload: dict) -> dict:
        fasting_glucose = payload.get("fasting_glucose")
        fasting_plasma_glucose = payload.get("fasting_plasma_glucose")
        hba1c = payload.get("hba1c")
        two_hour_ogtt = payload.get("2h_ogtt_75g", payload.get("two_hour_ogtt_75g", payload.get("ogtt_2h_75g")))
        random_plasma_glucose = payload.get("random_plasma_glucose", payload.get("random_glucose"))
        blood_glucose = payload.get("blood_glucose")

        labs = payload.get("labs") if payload.get("labs") is not None else payload.get("lab_results")
        if fasting_glucose in (None, ""):
            fasting_glucose = self._extract_numeric_from_labs(labs, keys={"fasting_glucose", "fpg", "fasting_blood_glucose", "glucose_fasting"})
        if fasting_plasma_glucose in (None, ""):
            fasting_plasma_glucose = self._extract_numeric_from_labs(
                labs,
                keys={"fasting_plasma_glucose", "fasting_glucose", "fpg", "fasting_blood_glucose", "glucose_fasting"},
            )
        if hba1c in (None, ""):
            hba1c = self._extract_numeric_from_labs(labs, keys={"hba1c", "a1c", "hba1c_percent"})
        if two_hour_ogtt in (None, ""):
            two_hour_ogtt = self._extract_numeric_from_labs(
                labs,
                keys={"2h_ogtt_75g", "two_hour_ogtt_75g", "ogtt_2h_75g"},
            )
        if random_plasma_glucose in (None, ""):
            random_plasma_glucose = self._extract_numeric_from_labs(
                labs,
                keys={"random_plasma_glucose", "random_glucose"},
            )
        if blood_glucose in (None, ""):
            blood_glucose = self._extract_numeric_from_labs(labs, keys={"blood_glucose", "glucose"})

        normalized = {}
        for key in {
            "frequent_urination",
            "excessive_thirst",
            "polyuria",
            "polydipsia",
            "weight_loss",
            "unexplained_weight_loss",
            "fatigue",
            "blurred_vision",
            "nausea",
            "vomiting",
            "abdominal_pain",
            "sweating",
            "shaking",
            "dizziness",
            "family_history_diabetes",
            "family_history",
            "physical_activity_low",
            "prediabetes_possible",
            "classic_hyperglycemia_symptoms",
            "type2_risk_increased",
            "only_symptoms_available",
            "no_lab_values_available",
            "no_labs_available",
            "crisis",
            "sedentary_lifestyle",
            "slow_healing",
            "tingling_hands_feet",
            "frequent_infections",
            "acanthosis_nigricans",
            "gestational_history",
            "smoking",
            "high_cholesterol",
            "hypertension",
            "obesity",
            "pcos_history",
            "ethnicity_high_risk",
            "currently_pregnant",
            "excessive_hunger",
            "irritability",
            "recurrent_uti_yeast",
            "bed_wetting",
            "fruity_breath",
            "deep_rapid_breathing",
            "dry_mouth",
            "heat_exposure",
            "intense_exercise",
            "new_medication",
            "rapid_onset",
        }:
            if key in payload and payload.get(key) not in (None, ""):
                normalized[key] = self._as_bool(payload.get(key))

        fasting_numeric = self._as_optional_float(
            fasting_glucose,
            field_name="fasting_glucose",
            min_value=40,
            max_value=600,
        )
        if fasting_numeric is not None:
            normalized["fasting_glucose"] = fasting_numeric

        fasting_plasma_numeric = self._as_optional_float(
            fasting_plasma_glucose,
            field_name="fasting_plasma_glucose",
            min_value=40,
            max_value=600,
        )
        if fasting_plasma_numeric is not None:
            normalized["fasting_plasma_glucose"] = fasting_plasma_numeric

        hba1c_numeric = self._as_optional_float(
            hba1c,
            field_name="hba1c",
            min_value=3,
            max_value=20,
        )
        if hba1c_numeric is not None:
            normalized["hba1c"] = hba1c_numeric

        two_hour_ogtt_numeric = self._as_optional_float(
            two_hour_ogtt,
            field_name="2h_ogtt_75g",
            min_value=30,
            max_value=1000,
        )
        if two_hour_ogtt_numeric is not None:
            normalized["2h_ogtt_75g"] = two_hour_ogtt_numeric

        random_plasma_numeric = self._as_optional_float(
            random_plasma_glucose,
            field_name="random_plasma_glucose",
            min_value=30,
            max_value=1000,
        )
        if random_plasma_numeric is not None:
            normalized["random_plasma_glucose"] = random_plasma_numeric

        blood_glucose_numeric = self._as_optional_float(
            blood_glucose,
            field_name="blood_glucose",
            min_value=20,
            max_value=1000,
        )
        if blood_glucose_numeric is not None:
            normalized["blood_glucose"] = blood_glucose_numeric

        if "age" in payload and payload.get("age") not in (None, ""):
            normalized["age"] = self._as_required_float(payload.get("age"), field_name="age", min_value=0, max_value=120)

        if "bmi" in payload and payload.get("bmi") not in (None, ""):
            normalized["bmi"] = self._as_required_float(payload.get("bmi"), field_name="bmi", min_value=10, max_value=80)

        if "waist_circumference" in payload and payload.get("waist_circumference") not in (None, ""):
            normalized["waist_circumference"] = self._as_required_float(
                payload.get("waist_circumference"),
                field_name="waist_circumference",
                min_value=30,
                max_value=250,
            )

        weight_kg = payload.get("weight_kg", payload.get("weight"))
        height_cm = payload.get("height_cm")
        height_m = payload.get("height_m")
        if height_cm in (None, "") and height_m in (None, "") and payload.get("height") not in (None, ""):
            raw_height = self._as_optional_float(payload.get("height"), field_name="height", min_value=0.8, max_value=260)
            if raw_height is not None:
                if raw_height <= 3:
                    height_m = raw_height
                else:
                    height_cm = raw_height

        if weight_kg not in (None, ""):
            normalized["weight_kg"] = self._as_required_float(
                weight_kg,
                field_name="weight_kg",
                min_value=20,
                max_value=400,
            )
        if height_cm not in (None, ""):
            normalized["height_cm"] = self._as_required_float(
                height_cm,
                field_name="height_cm",
                min_value=80,
                max_value=260,
            )
        if height_m not in (None, ""):
            normalized["height_m"] = self._as_required_float(
                height_m,
                field_name="height_m",
                min_value=0.8,
                max_value=2.6,
            )

        symptoms = self._normalize_symptoms(payload.get("symptoms"))
        labs_normalized = self._normalize_labs(labs)
        risk_factors = self._normalize_risk_factors(payload.get("risk_factors"))

        if symptoms is not None:
            normalized["symptoms"] = symptoms
        if labs_normalized is not None:
            normalized["labs"] = labs_normalized
        if risk_factors is not None:
            normalized["risk_factors"] = risk_factors

        no_labs_explicit = normalized.get("no_labs_available") is True or normalized.get("no_lab_values_available") is True
        has_core_labs = any(
            key in normalized for key in {"fasting_glucose", "fasting_plasma_glucose", "hba1c", "2h_ogtt_75g", "random_plasma_glucose", "blood_glucose"}
        )
        has_extra_labs = bool(labs_normalized)
        no_labs_available = bool(no_labs_explicit or not (has_core_labs or has_extra_labs))
        normalized["no_lab_values_available"] = no_labs_available

        symptoms_present = any(
            normalized.get(key) is True
            for key in {
                "frequent_urination",
                "excessive_thirst",
                "fatigue",
                "blurred_vision",
                "weight_loss",
                "nausea",
                "vomiting",
                "abdominal_pain",
                "sweating",
                "shaking",
                "dizziness",
            }
        )
        if not symptoms_present and isinstance(symptoms, dict):
            symptoms_present = any(self._as_bool(value) for value in symptoms.values())
        if not symptoms_present and isinstance(symptoms, list):
            symptoms_present = any(
                (item if isinstance(item, str) else (item.get("present", True) if isinstance(item, dict) else False))
                for item in symptoms
            )

        normalized["only_symptoms_available"] = bool(no_labs_available and symptoms_present)

        return normalized

    def _normalize_symptoms(self, symptoms):
        if symptoms is None:
            return None

        if isinstance(symptoms, dict):
            normalized = {}
            for key, value in symptoms.items():
                normalized[str(key)] = self._as_bool(value)
            return normalized

        if isinstance(symptoms, list):
            normalized = []
            for index, item in enumerate(symptoms, start=1):
                if isinstance(item, str):
                    value = item.strip()
                    if not value:
                        raise ValidationError(f"symptoms[{index}] must not be empty.")
                    normalized.append(value)
                    continue

                if not isinstance(item, dict):
                    raise ValidationError(f"symptoms[{index}] must be an object or string.")

                symptom_code = str(item.get("symptom_code") or item.get("code") or "").strip()
                symptom_name = str(item.get("symptom_name") or item.get("name") or "").strip()
                if not symptom_code and not symptom_name:
                    raise ValidationError(f"symptoms[{index}] requires symptom_code or symptom_name.")

                severity = item.get("severity")
                if severity not in (None, ""):
                    severity = int(self._as_required_float(severity, field_name=f"symptoms[{index}].severity", min_value=1, max_value=10))

                normalized.append(
                    {
                        "symptom_code": symptom_code or symptom_name,
                        "symptom_name": symptom_name or symptom_code,
                        "present": self._as_bool(item.get("present", True)),
                        "severity": severity,
                    }
                )
            return normalized

        raise ValidationError("symptoms must be an object or list.")

    def _normalize_labs(self, labs):
        if labs is None:
            return None

        if isinstance(labs, dict):
            normalized = {}
            for key, value in labs.items():
                normalized[str(key)] = self._as_required_float(value, field_name=f"labs.{key}", min_value=0, max_value=5000)
            return normalized

        if isinstance(labs, list):
            normalized = []
            for index, item in enumerate(labs, start=1):
                if not isinstance(item, dict):
                    raise ValidationError(f"lab_results[{index}] must be an object.")

                test_name = str(item.get("test_name") or item.get("name") or item.get("code") or "").strip()
                if not test_name:
                    raise ValidationError(f"lab_results[{index}] test_name is required.")

                value = item.get("test_value") if "test_value" in item else item.get("value")
                lab_value = self._as_required_float(value, field_name=f"lab_results[{index}].test_value", min_value=0, max_value=5000)

                normalized.append(
                    {
                        "test_name": test_name,
                        "test_value": lab_value,
                    }
                )
            return normalized

        raise ValidationError("labs/lab_results must be an object or list.")

    def _normalize_risk_factors(self, risk_factors):
        if risk_factors is None:
            return None

        if isinstance(risk_factors, dict):
            normalized = {}
            for key, value in risk_factors.items():
                normalized[str(key)] = self._normalize_risk_value(value, key)
            return normalized

        if isinstance(risk_factors, list):
            normalized = []
            for index, item in enumerate(risk_factors, start=1):
                if isinstance(item, str):
                    value = item.strip()
                    if not value:
                        raise ValidationError(f"risk_factors[{index}] must not be empty.")
                    normalized.append(value)
                    continue

                if not isinstance(item, dict):
                    raise ValidationError(f"risk_factors[{index}] must be an object or string.")

                key = item.get("code") or item.get("name") or item.get("risk_factor")
                if not str(key or "").strip():
                    raise ValidationError(f"risk_factors[{index}] requires code/name/risk_factor.")

                normalized.append(
                    {
                        "code": str(key).strip(),
                        "value": self._normalize_risk_value(item.get("value", item.get("present", True)), f"risk_factors[{index}]"),
                    }
                )
            return normalized

        raise ValidationError("risk_factors must be an object or list.")

    def _normalize_risk_value(self, value, field_name: str):
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            normalized = value.strip()
            if len(normalized) > 120:
                raise ValidationError(f"{field_name} is too long.")
            lower = normalized.lower()
            if lower in {"true", "false", "yes", "no", "1", "0", "on", "off", "y", "n"}:
                return self._as_bool(normalized)
            try:
                return float(normalized)
            except ValueError:
                return normalized
        raise ValidationError(f"{field_name} has unsupported value type.")

    def _extract_questionnaire_answers(self, payload: dict) -> dict | None:
        raw_answers = payload.get("questionnaire_answers")
        if raw_answers in (None, ""):
            return None

        if not isinstance(raw_answers, dict):
            raise ValidationError("questionnaire_answers must be an object.")

        answers_json = self._sanitize_json_like(raw_answers, field_name="questionnaire_answers")
        if answers_json is None:
            return None

        return {
            "version": str(payload.get("questionnaire_version") or "qcm_v1"),
            "answers": answers_json,
        }

    def _sanitize_json_like(self, value, *, field_name: str, depth: int = 0):
        if depth > 6:
            raise ValidationError(f"{field_name} is too deeply nested.")

        if value is None:
            return None
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return value
        if isinstance(value, str):
            normalized = value.strip()
            if len(normalized) > 300:
                raise ValidationError(f"{field_name} contains an item that is too long.")
            return normalized
        if isinstance(value, list):
            if len(value) > 200:
                raise ValidationError(f"{field_name} contains too many items.")
            return [self._sanitize_json_like(item, field_name=f"{field_name}[]", depth=depth + 1) for item in value]
        if isinstance(value, dict):
            if len(value) > 200:
                raise ValidationError(f"{field_name} contains too many keys.")
            normalized = {}
            for key, item in value.items():
                key_value = str(key).strip()
                if not key_value:
                    raise ValidationError(f"{field_name} contains an empty key.")
                if len(key_value) > 120:
                    raise ValidationError(f"{field_name} contains a key that is too long.")
                normalized[key_value] = self._sanitize_json_like(
                    item,
                    field_name=f"{field_name}.{key_value}",
                    depth=depth + 1,
                )
            return normalized

        raise ValidationError(f"{field_name} contains an unsupported value type.")

    @staticmethod
    def _extract_numeric_from_labs(labs, *, keys: set[str]):
        if isinstance(labs, dict):
            for key, value in labs.items():
                if str(key).strip().lower() in keys:
                    return value

        if isinstance(labs, list):
            for item in labs:
                if not isinstance(item, dict):
                    continue
                test_name = str(item.get("test_name") or item.get("name") or item.get("code") or "").strip().lower()
                if test_name in keys:
                    return item.get("test_value") if "test_value" in item else item.get("value")

        return None

    @staticmethod
    def _derive_urgency(normalized_payload: dict, result: dict) -> tuple[bool, dict | None]:
        """Collect urgency reasons as bilingual {en, km} fragments from the
        diagnosis_texts catalog and join them per language."""
        reasons = []

        fasting_glucose = float(normalized_payload.get("fasting_glucose", 0) or 0)
        random_plasma_glucose = float(normalized_payload.get("random_plasma_glucose", 0) or 0)
        hba1c = float(normalized_payload.get("hba1c", 0) or 0)
        certainty = float(result.get("certainty", 0) or 0)
        diagnosis = str(result.get("diagnosis") or "")

        if fasting_glucose >= 250:
            reasons.append(bilingual(DT, "urgency.critical_fasting"))
        if random_plasma_glucose >= 300:
            reasons.append(bilingual(DT, "urgency.critical_random"))
        if hba1c >= 10:
            reasons.append(bilingual(DT, "urgency.very_high_hba1c"))
        if bool(normalized_payload.get("crisis")):
            reasons.append(bilingual(DT, "urgency.acute_crisis"))
        if bool(normalized_payload.get("vomiting")) and bool(normalized_payload.get("abdominal_pain")):
            reasons.append(bilingual(DT, "urgency.metabolic_complication"))
        if diagnosis == "Likely Diabetes" and certainty >= 0.9:
            reasons.append(bilingual(DT, "urgency.high_certainty_diabetes"))
        suspected_type = str((result.get("suspected_type") or {}).get("type") or "") if isinstance(result.get("suspected_type"), dict) else ""
        if suspected_type == "Type 1":
            reasons.append(bilingual(DT, "urgency.type1_pattern"))
        if suspected_type == "Gestational":
            reasons.append(bilingual(DT, "urgency.gestational_criteria"))
        if bool((result.get("facts") or {}).get("ketosis_signs_present")):
            reasons.append(bilingual(DT, "urgency.ketosis_signs"))
        if bool((result.get("facts") or {}).get("urgent_flag")):
            reasons.append(bilingual(DT, "urgency.rule_asserted"))

        if not reasons:
            return False, None

        return True, join_bilingual(reasons)

    def _enrich_inference_result(self, result: dict, normalized_payload: dict) -> dict:
        enriched = dict(result or {})

        # ── Symptom-based confidence fallback for symptom-only / low-certainty assessments ──
        symptoms_dict = {
            key: True for key in [
                "frequent_urination", "excessive_thirst", "excessive_hunger", "weight_loss",
                "unexplained_weight_loss", "fatigue", "blurred_vision", "slow_healing", "nausea",
                "vomiting", "abdominal_pain", "sweating", "shaking", "dizziness",
                "tingling_hands_feet", "frequent_infections", "acanthosis_nigricans", "irritability",
                "recurrent_uti_yeast", "bed_wetting", "fruity_breath", "deep_rapid_breathing"
            ] if normalized_payload.get(key) is True
        }
        risk_dict = {
            key: True for key in [
                "family_history", "family_history_diabetes", "obesity", "hypertension",
                "sedentary_lifestyle", "gestational_history", "smoking", "high_cholesterol",
                "pcos_history", "ethnicity_high_risk"
            ] if normalized_payload.get(key) is True
        }

        current_certainty = float(enriched.get("certainty", 0) or 0)
        symptom_conf = calculate_symptom_confidence(
            symptoms=symptoms_dict,
            age=normalized_payload.get("age"),
            risk_factors=risk_dict,
        )
        symptom_score = float(symptom_conf.get("confidence_score", 0) or 0)

        # If symptom-based score is higher than rule engine output (e.g. no rule fired for symptoms alone),
        # upgrade certainty & diagnosis
        if (symptoms_dict or risk_dict) and symptom_score > current_certainty:
            current_certainty = symptom_score
            enriched["certainty"] = round(current_certainty, 2)
            if enriched.get("diagnosis") in (None, "", "No strong diabetes indication", "Insufficient evidence for diabetes indication"):
                if current_certainty >= 0.60:
                    enriched["diagnosis"] = "Suspected Diabetes (Classic Symptoms)"
                elif current_certainty >= 0.40:
                    enriched["diagnosis"] = "Possible Early Signs of Diabetes"
                elif current_certainty >= 0.25:
                    enriched["diagnosis"] = "Elevated Diabetes Risk — Screening Recommended"

        return self._apply_presentation_fields(enriched, normalized_payload)

    def _refresh_fact_overlay(self) -> None:
        """Overlay doctor-managed fact knowledge (Fact catalog) over the static
        symptom knowledge so edited weights / type indications / flags drive
        the reasoning. Falls back to the static catalog if the DB is not
        reachable (rule sandbox, bare test harness)."""
        try:
            apply_fact_overlay(FactRepository().get_active_fact_map())
        except Exception:
            clear_fact_overlay()

    def _fact_education(self, matched_symptoms, matched_risk_factors) -> list[dict]:
        """Doctor-managed education (meaning/prevention, EN + KM) for the
        symptoms and risk factors this assessment matched. Rendered by the
        report's symptom guide cards instead of the compiled locale strings.
        Rebuilt on every result load, so doctor edits show on old reports too."""
        try:
            rows = FactRepository().list_facts(status="active")
        except Exception:
            return []
        if not rows:
            return []
        wanted = {str(label or "").strip().lower() for label in list(matched_symptoms) + list(matched_risk_factors)}
        wanted.discard("")
        education = []
        for row in rows:
            match_labels = {str(row.get("label") or "").strip().lower()}
            for alias in row.get("aliases") or []:
                readable = self._to_readable_label(alias).strip().lower()
                if readable:
                    match_labels.add(readable)
            if match_labels & wanted:
                education.append({
                    "key": row.get("key"),
                    "label": row.get("label"),
                    "label_km": row.get("label_km"),
                    "medical_term": row.get("medical_term"),
                    "meaning": row.get("meaning"),
                    "meaning_km": row.get("meaning_km"),
                    "prevention": row.get("prevention"),
                    "prevention_km": row.get("prevention_km"),
                })
        education.sort(key=lambda item: str(item.get("label") or ""))
        return education

    def _apply_presentation_fields(self, enriched: dict, normalized_payload: dict) -> dict:
        """Compute every presentation field the result report renders — matched
        symptoms/risk factors, evidence completeness, bilingual summaries and
        structured recommendations. Runs at evaluate time AND when rebuilding a
        persisted result from the database, so a saved assessment displays
        exactly like the original assessment output."""
        matched_symptoms = self._collect_matched_symptoms(normalized_payload)
        matched_risk_factors = self._collect_matched_risk_factors(normalized_payload)

        current_certainty = float(enriched.get("certainty", 0) or 0)
        certainty_percent = self._to_percent(current_certainty)
        confidence_level = self._resolve_confidence_level(certainty_percent)

        completeness = self._calculate_evidence_completeness(
            normalized_payload=normalized_payload,
            matched_symptoms=matched_symptoms,
            matched_risk_factors=matched_risk_factors,
        )
        urgent_priority = self._should_apply_urgent_priority(enriched, normalized_payload)

        missing_inputs = []
        if "fasting_glucose" not in normalized_payload:
            missing_inputs.append("fasting_glucose")
        if "hba1c" not in normalized_payload:
            missing_inputs.append("hba1c")

        provided_inputs = {
            "fasting_glucose": "fasting_glucose" in normalized_payload,
            "hba1c": "hba1c" in normalized_payload,
            "2h_ogtt_75g": "2h_ogtt_75g" in normalized_payload,
            "random_plasma_glucose": "random_plasma_glucose" in normalized_payload,
            "symptoms": bool(matched_symptoms),
            "risk_factors": bool(matched_risk_factors),
        }

        confidence_status, confidence_reason_bi = self._resolve_confidence_context(
            result=enriched,
            certainty_percent=certainty_percent,
            missing_inputs=missing_inputs,
            matched_symptoms=matched_symptoms,
            matched_risk_factors=matched_risk_factors,
        )

        summary_bi = self._build_result_summary(
            diagnosis=enriched.get("diagnosis", ""),
            certainty_percent=certainty_percent,
            matched_symptoms=matched_symptoms,
            matched_risk_factors=matched_risk_factors,
            missing_inputs=missing_inputs,
            confidence_status=confidence_status,
            suspected_type=enriched.get("suspected_type"),
            normalized_payload=normalized_payload,
        )

        headline_bi = self._build_headline_explanation(
            diagnosis=enriched.get("diagnosis", ""),
            certainty_percent=certainty_percent,
            matched_symptoms=matched_symptoms,
            matched_risk_factors=matched_risk_factors,
            missing_inputs=missing_inputs,
            suspected_type=enriched.get("suspected_type"),
            normalized_payload=normalized_payload,
        )

        recommendation_items = self._build_structured_recommendations(
            result=enriched,
            normalized_payload=normalized_payload,
            completeness=completeness,
            urgent_priority=urgent_priority,
        )
        if recommendation_items:
            enriched["recommendation"] = recommendation_items[0]["text"]

        enriched["certainty_percent"] = certainty_percent
        enriched["confidence_level"] = confidence_level
        enriched["matched_symptoms"] = matched_symptoms
        enriched["matched_risk_factors"] = matched_risk_factors
        enriched["fact_education"] = self._fact_education(matched_symptoms, matched_risk_factors)
        enriched["missing_inputs"] = missing_inputs
        enriched["provided_inputs"] = provided_inputs
        enriched["confidence_status"] = confidence_status
        enriched["confidence_reason"] = confidence_reason_bi["en"]
        enriched["confidence_reason_km"] = confidence_reason_bi["km"]
        enriched["result_summary"] = summary_bi["en"]
        enriched["result_summary_km"] = summary_bi["km"]
        enriched["headline_explanation"] = headline_bi["en"]
        enriched["headline_explanation_km"] = headline_bi["km"]
        enriched["evidence_completeness"] = completeness
        enriched["recommendations"] = recommendation_items
        enriched["explanation"] = self._build_explanation_payload(enriched, normalized_payload)

        return enriched

    def _build_explanation_payload(self, result: dict, normalized_payload: dict) -> dict:
        triggered_rules = list(result.get("triggered_rules") or [])
        key_labs = {}
        for lab_key in {"fasting_glucose", "fasting_plasma_glucose", "hba1c", "2h_ogtt_75g", "random_plasma_glucose", "blood_glucose"}:
            if lab_key in normalized_payload:
                key_labs[lab_key] = normalized_payload[lab_key]

        derived_flags = []
        facts = result.get("facts") or {}
        for flag in {
            "is_obese",
            "classic_hyperglycemia_symptoms",
            "hyperglycemia_present",
            "hypoglycemia_present",
            "high_type2_risk_pattern",
            "urgent_flag",
            "ketosis_signs_present",
            "catabolic_pattern",
            "type1_pattern_evidence",
            "type2_pattern_evidence",
            "mixed_type_features",
        }:
            if facts.get(flag) is True:
                derived_flags.append(flag)

        recommendations = list(result.get("recommendations") or [])

        # Dedupe identical advice (same sentence rendered twice looked broken)
        _seen = set()
        _deduped = []
        for _rec in recommendations:
            _key = " ".join(str(_rec.get("text") if isinstance(_rec, dict) else _rec).lower().split())
            if _key and _key not in _seen:
                _seen.add(_key)
                _deduped.append(_rec)
        recommendations = _deduped

        return {
            "primary_assessment": {
                "diagnosis": result.get("diagnosis"),
                "certainty": result.get("certainty"),
                "certainty_percent": result.get("certainty_percent"),
                "confidence": result.get("confidence_level"),
                "confidence_status": result.get("confidence_status"),
                "confidence_reason": result.get("confidence_reason"),
                "suspected_type": result.get("suspected_type"),
            },
            "triggered_rules": triggered_rules,
            "key_findings": {
                "matched_symptoms": result.get("matched_symptoms") or [],
                "matched_risk_factors": result.get("matched_risk_factors") or [],
                "key_labs": key_labs,
                "derived_flags": sorted(derived_flags),
                "evidence_completeness": result.get("evidence_completeness"),
            },
            "recommendations": recommendations,
        }

    def _calculate_evidence_completeness(self, *, normalized_payload: dict, matched_symptoms: list[str], matched_risk_factors: list[str]) -> dict:
        lab_keys = ("fasting_glucose", "fasting_plasma_glucose", "hba1c", "2h_ogtt_75g", "random_plasma_glucose")
        available_labs = [key for key in lab_keys if key in normalized_payload]
        unique_available_labs = sorted(set(available_labs))

        lab_score = min(len(unique_available_labs), 3) * 25
        symptom_score = 15 if matched_symptoms else 0
        risk_score = 10 if matched_risk_factors else 0
        score = max(0, min(100, lab_score + symptom_score + risk_score))

        if score >= 70:
            level = "high"
        elif score >= 40:
            level = "medium"
        else:
            level = "low"
        note_bi = bilingual(DT, f"completeness.{level}")

        recommended_lab_keys = ["fasting_glucose", "hba1c", "2h_ogtt_75g", "random_plasma_glucose"]
        missing_recommended_labs = [key for key in recommended_lab_keys if key not in normalized_payload]

        return {
            "score": score,
            "level": level,
            "note": note_bi["en"],
            "note_km": note_bi["km"],
            "available_labs": unique_available_labs,
            "missing_recommended_labs": missing_recommended_labs,
        }

    @staticmethod
    def _resolve_confidence_context(
        *,
        result: dict,
        certainty_percent: int,
        missing_inputs: list[str],
        matched_symptoms: list[str],
        matched_risk_factors: list[str],
    ) -> tuple[str, dict]:
        """Returns (status, {"en": …, "km": …}) from the diagnosis_texts catalog."""
        trace = (result.get("explanation_trace") or {}).get("confidence_calculation") or {}
        conclusion_scores = trace.get("conclusion_scores") or []
        top_conclusion = str(trace.get("top_conclusion") or "").strip()

        if (conclusion_scores or matched_symptoms or matched_risk_factors) and certainty_percent > 0:
            if conclusion_scores:
                top_supporting_rules = conclusion_scores[0].get("supporting_rules") or []
                support_count = len(top_supporting_rules)
                reason = {
                    lang: text(DT, "conf.reason.rules", lang=lang, support_count=support_count, s="s" if support_count != 1 else "")
                    for lang in SUPPORTED_LANGUAGES
                }
                suffix_key = "conf.reason.linked" if top_conclusion else "conf.reason.period"
                suffix_params = {"top_conclusion": top_conclusion} if top_conclusion else {}
                reason = {
                    lang: reason[lang] + text(DT, suffix_key, lang=lang, **suffix_params)
                    for lang in SUPPORTED_LANGUAGES
                }
            else:
                reason = bilingual(DT, "conf.reason.symptoms", s_count=len(matched_symptoms), r_count=len(matched_risk_factors))

            if missing_inputs:
                missing_str = ", ".join(missing_inputs)
                reason = {
                    lang: reason[lang] + text(DT, "conf.reason.missing_labs", lang=lang, missing_inputs=missing_str)
                    for lang in SUPPORTED_LANGUAGES
                }
            return "calculated", reason

        reasons = []
        if missing_inputs:
            reasons.append(bilingual(DT, "conf.missing_core_labs", missing_inputs=", ".join(missing_inputs)))

        if not matched_symptoms and not matched_risk_factors:
            reasons.append(bilingual(DT, "conf.limited_evidence"))

        fired_rules = result.get("triggered_rules") or []
        has_diagnosis_output = any(
            output.get("type") == "conclusion"
            for rule in fired_rules
            for output in (rule.get("inferred_outputs") or [])
        )
        if fired_rules and not has_diagnosis_output:
            reasons.append(bilingual(DT, "conf.rules_no_conclusion"))
        elif not fired_rules:
            reasons.append(bilingual(DT, "conf.no_rule_matched"))

        if not reasons:
            reasons.append(bilingual(DT, "conf.insufficient_evidence"))

        joined = join_bilingual(reasons) or {}
        reason = {
            lang: text(DT, "conf.insufficient_prefix", lang=lang) + joined.get(lang, "") + text(DT, "conf.reason.period", lang=lang)
            for lang in SUPPORTED_LANGUAGES
        }
        return "insufficient_evidence", reason

    @staticmethod
    def _build_result_summary(
        *,
        diagnosis: str,
        certainty_percent: int,
        matched_symptoms: list[str],
        matched_risk_factors: list[str],
        missing_inputs: list[str],
        confidence_status: str,
        suspected_type,
        normalized_payload: dict,
    ) -> dict:
        """Bilingual summary sentence {"en": …, "km": …} from the diagnosis_texts
        catalog — changes based on the actual evidence and outcome."""
        diag = str(diagnosis or "").lower()
        s_count = len(matched_symptoms)
        r_count = len(matched_risk_factors)
        has_labs = not bool(missing_inputs)
        type_label = ""
        if isinstance(suspected_type, dict):
            type_label = str(suspected_type.get("type") or "")

        risk_part = {
            lang: text(DT, "part.risk_appendix", lang=lang, r_count=r_count) if r_count else ""
            for lang in SUPPORTED_LANGUAGES
        }

        def lab_str(lang: str) -> str:
            names = []
            if "fasting_glucose" in normalized_payload or "fasting_plasma_glucose" in normalized_payload:
                names.append(text(DT, "lab.fasting_glucose", lang=lang))
            if "hba1c" in normalized_payload:
                names.append(text(DT, "lab.hba1c", lang=lang))
            if not names:
                return text(DT, "lab.fallback", lang=lang)
            return text(DT, "join.and", lang=lang).join(names)

        # Emergency / urgent
        if any(normalized_payload.get(k) for k in ("vomiting", "abdominal_pain", "fruity_breath", "deep_rapid_breathing", "confusion")):
            return bilingual(DT, "summary.emergency")

        # Full labs + symptoms → strong assessment
        if has_labs and s_count >= 2 and certainty_percent >= 70:
            return {
                lang: text(
                    DT, "summary.strong_labs", lang=lang,
                    s_count=s_count, lab_str=lab_str(lang), risk_part=risk_part[lang],
                    certainty_percent=certainty_percent,
                )
                for lang in SUPPORTED_LANGUAGES
            }

        # Labs present but low certainty
        if has_labs and certainty_percent < 45:
            return bilingual(DT, "summary.labs_low_certainty")

        # Symptom-only with decent confidence
        if not has_labs and s_count >= 2 and certainty_percent >= 45:
            return {
                lang: text(
                    DT, "summary.symptom_only_ok", lang=lang,
                    s_count=s_count, risk_part=risk_part[lang], certainty_percent=certainty_percent,
                )
                for lang in SUPPORTED_LANGUAGES
            }

        # Symptom-only low confidence
        if not has_labs and s_count >= 1 and certainty_percent < 45:
            return bilingual(DT, "summary.symptom_only_low")

        # Risk factors only
        if s_count == 0 and r_count >= 1 and not has_labs:
            return bilingual(DT, "summary.risk_only")

        # Gestational
        if type_label == "Gestational":
            return bilingual(DT, "summary.gestational")

        # Type 1 pattern
        if type_label == "Type 1":
            return bilingual(DT, "summary.type1")

        # Insufficient evidence
        if confidence_status == "insufficient_evidence":
            return bilingual(DT, "summary.insufficient")

        # Generic fallback with actual numbers
        evidence_str = {}
        for lang in SUPPORTED_LANGUAGES:
            parts = []
            if s_count:
                parts.append(text(DT, "part.symptoms", lang=lang, s_count=s_count))
            if r_count:
                parts.append(text(DT, "part.risk_factors", lang=lang, r_count=r_count))
            if has_labs:
                parts.append(text(DT, "part.laboratory_data", lang=lang))
            evidence_str[lang] = ", ".join(parts) if parts else text(DT, "part.limited_data", lang=lang)
        return {
            lang: text(DT, "summary.generic", lang=lang, evidence_str=evidence_str[lang], certainty_percent=certainty_percent)
            for lang in SUPPORTED_LANGUAGES
        }

    @staticmethod
    def _build_headline_explanation(
        *,
        diagnosis: str,
        certainty_percent: int,
        matched_symptoms: list[str],
        matched_risk_factors: list[str],
        missing_inputs: list[str],
        suspected_type,
        normalized_payload: dict,
    ) -> dict:
        """Short, punchy hero explanation — bilingual {"en": …, "km": …} from the
        diagnosis_texts catalog. Each evidence combination gets a distinct sentence."""
        diag = str(diagnosis or "").lower()
        s_count = len(matched_symptoms)
        r_count = len(matched_risk_factors)
        has_labs = not bool(missing_inputs)
        type_label = ""
        if isinstance(suspected_type, dict):
            type_label = str(suspected_type.get("type") or "")

        # Emergency
        if any(normalized_payload.get(k) for k in ("vomiting", "fruity_breath", "deep_rapid_breathing", "confusion")):
            return bilingual(DT, "headline.emergency")

        # High certainty with labs
        if certainty_percent >= 85 and has_labs:
            return bilingual(DT, "headline.strong_labs")

        # High certainty symptom-only
        if certainty_percent >= 85 and not has_labs:
            return bilingual(DT, "headline.strong_symptoms", s_count=s_count)

        # Likely diabetes with labs
        if certainty_percent >= 70 and has_labs:
            return bilingual(DT, "headline.likely_labs")

        # Likely diabetes symptom-only
        if certainty_percent >= 70 and not has_labs:
            return bilingual(DT, "headline.likely_symptoms", certainty_percent=certainty_percent)

        # Moderate
        if certainty_percent >= 45:
            if has_labs:
                return bilingual(DT, "headline.moderate_labs")
            if s_count >= 2:
                return bilingual(DT, "headline.moderate_symptoms", s_count=s_count)
            return bilingual(DT, "headline.moderate_generic")

        # Low with risk factors
        if r_count >= 1 and s_count == 0:
            return bilingual(DT, "headline.risk_only", r_count=r_count)

        # Low with some symptoms
        if s_count >= 1 and certainty_percent < 45:
            return bilingual(DT, "headline.weak_symptoms")

        # Gestational
        if type_label == "Gestational":
            return bilingual(DT, "headline.gestational")

        # Type 1 pattern
        if type_label == "Type 1":
            return bilingual(DT, "headline.type1")

        # Very low / no evidence
        if certainty_percent <= 15:
            return bilingual(DT, "headline.very_low")

        return bilingual(DT, "headline.generic", certainty_percent=certainty_percent)

    @staticmethod
    def _should_apply_urgent_priority(result: dict, normalized_payload: dict) -> bool:
        facts = result.get("facts") or {}
        if bool(facts.get("urgent_flag")):
            return True
        if bool(facts.get("possible_dka")):
            return True
        if bool(normalized_payload.get("crisis")):
            return True

        fasting = float(normalized_payload.get("fasting_glucose", 0) or 0)
        random_glucose = float(normalized_payload.get("random_plasma_glucose", 0) or 0)
        hba1c = float(normalized_payload.get("hba1c", 0) or 0)
        if fasting >= 250 or random_glucose >= 300 or hba1c >= 10:
            return True
        return False

    def _build_structured_recommendations(
        self,
        *,
        result: dict,
        normalized_payload: dict,
        completeness: dict,
        urgent_priority: bool,
    ) -> list[dict]:
        candidates: list[dict] = []
        seen = set()

        def add(raw_text, urgency: str, source: str, bilingual_text: dict | None = None):
            bi = bilingual_text or rewrite_recommendation_bilingual(str(raw_text or "").strip())
            normalized_text = bi.get("en", "")
            if not normalized_text:
                return
            key = normalized_text.lower()
            if key in seen:
                return
            seen.add(key)
            candidates.append(
                {
                    "text": normalized_text,
                    "text_km": bi.get("km", ""),
                    "urgency": urgency,
                    "source": source,
                }
            )

        if result.get("recommendation"):
            add(str(result["recommendation"]), "routine", "inference")

        for rule in result.get("triggered_rules") or []:
            stage = str(rule.get("stage") or "rule")
            for output in rule.get("inferred_outputs") or []:
                if output.get("type") != "recommendation":
                    continue
                value = output.get("value")
                if not value:
                    continue
                urgency = "urgent" if stage == "triage" else "routine"
                add(str(value), urgency, f"rule:{stage}")

        if urgency := ("urgent" if urgent_priority else None):
            add(None, urgency, "safety", bilingual_text=note_bilingual(NOTE_URGENT_SAFETY_KEY))

        lab_keys = ("fasting_glucose", "fasting_plasma_glucose", "hba1c", "2h_ogtt_75g", "random_plasma_glucose")
        has_any_lab = any(key in normalized_payload for key in lab_keys)
        if not has_any_lab:
            # Gentle, non-alarming nudge — symptoms alone already give a signal.
            add(None, "routine", "completeness", bilingual_text=note_bilingual(NOTE_NO_LABS_COMPLETENESS_KEY))

        urgency_rank = {"urgent": 0, "high": 1, "routine": 2}
        candidates.sort(key=lambda item: (urgency_rank.get(item["urgency"], 9), item["text"]))

        if urgent_priority:
            candidates = [item for item in candidates if item["urgency"] in {"urgent", "high"}]

        return candidates[:4]

    def _collect_matched_symptoms(self, normalized_payload: dict) -> list[str]:
        labels = []
        seen = set()

        def add_label(raw):
            text = self._to_readable_label(raw)
            key = text.lower()
            if not text or key in seen:
                return
            seen.add(key)
            labels.append(text)

        if normalized_payload.get("frequent_urination"):
            add_label("frequent_urination")
        if normalized_payload.get("excessive_thirst"):
            add_label("excessive_thirst")

        symptoms = normalized_payload.get("symptoms")
        if isinstance(symptoms, dict):
            for key, value in symptoms.items():
                if self._as_bool(value):
                    add_label(key)
        elif isinstance(symptoms, list):
            for item in symptoms:
                if isinstance(item, str):
                    add_label(item)
                    continue
                if not isinstance(item, dict):
                    continue
                if self._as_bool(item.get("present", True)):
                    add_label(item.get("symptom_name") or item.get("symptom_code") or item.get("name") or item.get("code"))

        return labels

    def _collect_matched_risk_factors(self, normalized_payload: dict) -> list[str]:
        labels = []
        seen = set()

        def add_label(raw):
            text = self._to_readable_label(raw)
            key = text.lower()
            if not text or key in seen:
                return
            seen.add(key)
            labels.append(text)

        risk_factors = normalized_payload.get("risk_factors")
        if isinstance(risk_factors, dict):
            for key, value in risk_factors.items():
                if isinstance(value, bool):
                    if value:
                        add_label(key)
                elif isinstance(value, (int, float)) and float(value) > 0:
                    add_label(key)
                elif isinstance(value, str) and value.strip():
                    add_label(key)
        elif isinstance(risk_factors, list):
            for item in risk_factors:
                if isinstance(item, str):
                    add_label(item)
                    continue
                if not isinstance(item, dict):
                    continue
                value = item.get("value", item.get("present", True))
                if isinstance(value, bool):
                    if value:
                        add_label(item.get("code") or item.get("name") or item.get("risk_factor"))
                elif isinstance(value, (int, float)) and float(value) > 0:
                    add_label(item.get("code") or item.get("name") or item.get("risk_factor"))
                elif isinstance(value, str) and value.strip():
                    add_label(item.get("code") or item.get("name") or item.get("risk_factor"))

        return labels

    @staticmethod
    def _to_readable_label(value) -> str:
        raw = str(value or "").strip()
        if not raw:
            return ""
        return " ".join(part.capitalize() for part in raw.replace("-", "_").split("_") if part)

    def _resolve_assessment_mode(self, mode, normalized_payload: dict | None = None) -> str:
        normalized = str(mode or "").strip().lower()
        if normalized in self.ALLOWED_ASSESSMENT_MODES:
            return normalized

        payload = normalized_payload or {}
        has_labs = any(key in payload for key in ("fasting_glucose", "fasting_plasma_glucose", "hba1c", "2h_ogtt_75g", "random_plasma_glucose", "blood_glucose"))
        return "diagnostic" if has_labs else "screening"

    def _build_assessment_answer_records(self, payload: dict) -> list[dict]:
        entries = []
        excluded_keys = {"patient_id"}

        for key, value in (payload or {}).items():
            if key in excluded_keys:
                continue
            self._flatten_answer_entries(prefix=str(key), value=value, out=entries)

        answer_records = []
        seen = set()
        for path, value in entries:
            question_code = self._normalize_question_code(path)
            if not question_code or question_code in seen:
                continue
            seen.add(question_code)
            answer_records.append(
                {
                    "question_code": question_code,
                    "answer_value": self._serialize_answer_value(value),
                    "answer_type": self._resolve_answer_type(value),
                }
            )
        return answer_records

    def _flatten_answer_entries(self, *, prefix: str, value, out: list[tuple[str, object]], depth: int = 0):
        if depth > 8:
            return
        if isinstance(value, dict):
            for key, item in value.items():
                child = f"{prefix}.{key}"
                self._flatten_answer_entries(prefix=child, value=item, out=out, depth=depth + 1)
            return
        if isinstance(value, list):
            for index, item in enumerate(value):
                child = f"{prefix}[{index}]"
                self._flatten_answer_entries(prefix=child, value=item, out=out, depth=depth + 1)
            return
        out.append((prefix, value))

    @staticmethod
    def _normalize_question_code(path: str) -> str:
        normalized = str(path or "").strip().lower()
        normalized = normalized.replace(" ", "_")
        if len(normalized) > 120:
            normalized = normalized[:120]
        return normalized

    @staticmethod
    def _resolve_answer_type(value) -> str:
        if value is None:
            return "null"
        if isinstance(value, bool):
            return "boolean"
        if isinstance(value, (int, float)):
            return "number"
        if isinstance(value, (dict, list)):
            return "json"
        return "text"

    @staticmethod
    def _serialize_answer_value(value):
        if value is None:
            return None
        if isinstance(value, bool):
            return "true" if value else "false"
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, (dict, list)):
            return json.dumps(value, ensure_ascii=True)
        return str(value)

    @staticmethod
    def _to_percent(value) -> int:
        try:
            numeric = float(value)
        except (TypeError, ValueError):
            numeric = 0.0
        if numeric <= 1:
            numeric *= 100
        return max(0, min(100, round(numeric)))

    @staticmethod
    def _resolve_confidence_level(percent: int) -> dict:
        """Confidence level label + bilingual title/description from the catalog."""
        safe = max(0, min(100, int(percent)))
        if safe >= 85:
            level = "very_high"
        elif safe >= 70:
            level = "high"
        elif safe >= 45:
            level = "moderate"
        else:
            level = "low"
        return {
            "label": level,
            "title": text(DT, f"conf_level.{level}.title", lang="en"),
            "title_km": text(DT, f"conf_level.{level}.title", lang="km"),
            "description": text(DT, f"conf_level.{level}.description", lang="en"),
            "description_km": text(DT, f"conf_level.{level}.description", lang="km"),
        }

    @staticmethod
    def _as_required_float(value, *, field_name: str, min_value: float | None = None, max_value: float | None = None) -> float:
        if value in (None, ""):
            raise ValidationError(f"{field_name} is required.")
        try:
            numeric = float(value)
        except (TypeError, ValueError) as exc:
            raise ValidationError(f"{field_name} must be a valid number.") from exc

        if min_value is not None and numeric < min_value:
            raise ValidationError(f"{field_name} must be >= {min_value}.")
        if max_value is not None and numeric > max_value:
            raise ValidationError(f"{field_name} must be <= {max_value}.")

        return numeric

    @staticmethod
    def _as_optional_float(value, *, field_name: str, min_value: float | None = None, max_value: float | None = None) -> float | None:
        if value in (None, ""):
            return None
        try:
            numeric = float(value)
        except (TypeError, ValueError) as exc:
            raise ValidationError(f"{field_name} must be a valid number.") from exc

        if min_value is not None and numeric < min_value:
            raise ValidationError(f"{field_name} must be >= {min_value}.")
        if max_value is not None and numeric > max_value:
            raise ValidationError(f"{field_name} must be <= {max_value}.")

        return numeric

    @staticmethod
    def _as_bool(value) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.strip().lower() in {"1", "true", "yes", "y", "on"}
        return bool(value)

    @staticmethod
    def _as_optional_int(value, field_name: str) -> int | None:
        if value in (None, ""):
            return None
        try:
            return int(value)
        except (TypeError, ValueError) as exc:
            raise ValidationError(f"{field_name} must be an integer.") from exc
