import json

from app.errors import NotFoundError, ValidationError
from app.expert_system.inference_engine import run_inference
from app.models.entities import utc_now


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

        try:
            result = run_inference(normalized_payload, self.rule_repository.list_rules())
            result = self._enrich_inference_result(result, normalized_payload)
            is_urgent, urgent_reason = self._derive_urgency(normalized_payload, result)

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
                urgent_reason=urgent_reason,
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
        response["urgent_reason"] = urgent_reason
        response["questionnaire_answers"] = questionnaire_answers
        return response

    def list_my_results(self, current_user: dict) -> list[dict]:
        patient_id = self._resolve_patient_id(payload={}, current_user=current_user, user_roles={"patient"})
        return self.diagnosis_repository.list_by_patient_id(patient_id)

    def list_review_results(self, limit: int = 100) -> list[dict]:
        safe_limit = max(1, min(int(limit or 100), 300))
        return self.diagnosis_repository.list_recent(limit=safe_limit)

    def get_result(self, diagnosis_result_id: int) -> dict:
        result = self.diagnosis_repository.get_result(diagnosis_result_id)
        if not result:
            raise NotFoundError("Diagnosis result not found.")
        return self.diagnosis_repository.serialize_result(result)

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
    def _derive_urgency(normalized_payload: dict, result: dict) -> tuple[bool, str | None]:
        reasons = []

        fasting_glucose = float(normalized_payload.get("fasting_glucose", 0) or 0)
        random_plasma_glucose = float(normalized_payload.get("random_plasma_glucose", 0) or 0)
        hba1c = float(normalized_payload.get("hba1c", 0) or 0)
        certainty = float(result.get("certainty", 0) or 0)
        diagnosis = str(result.get("diagnosis") or "")

        if fasting_glucose >= 250:
            reasons.append("Critical fasting glucose level")
        if random_plasma_glucose >= 300:
            reasons.append("Critical random glucose level")
        if hba1c >= 10:
            reasons.append("Very high HbA1c")
        if bool(normalized_payload.get("crisis")):
            reasons.append("Patient appears in acute crisis")
        if bool(normalized_payload.get("vomiting")) and bool(normalized_payload.get("abdominal_pain")):
            reasons.append("Symptoms may indicate urgent metabolic complication")
        if diagnosis == "Likely Diabetes" and certainty >= 0.9:
            reasons.append("High-certainty likely diabetes")
        if bool((result.get("facts") or {}).get("urgent_flag")):
            reasons.append("Urgency asserted by rule action")

        if not reasons:
            return False, None

        return True, "; ".join(reasons)

    def _enrich_inference_result(self, result: dict, normalized_payload: dict) -> dict:
        enriched = dict(result or {})

        certainty_percent = self._to_percent(enriched.get("certainty", 0))
        confidence_level = self._resolve_confidence_level(certainty_percent)

        matched_symptoms = self._collect_matched_symptoms(normalized_payload)
        matched_risk_factors = self._collect_matched_risk_factors(normalized_payload)
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

        confidence_status, confidence_reason = self._resolve_confidence_context(
            result=enriched,
            certainty_percent=certainty_percent,
            missing_inputs=missing_inputs,
            matched_symptoms=matched_symptoms,
            matched_risk_factors=matched_risk_factors,
        )

        summary = "Assessment completed using symptoms, risk factors, and laboratory information."
        if missing_inputs:
            summary = "Assessment completed with limited laboratory evidence. Please add fasting glucose and HbA1c for a more reliable conclusion."
        if confidence_status == "insufficient_evidence" and not missing_inputs:
            summary = "Assessment completed, but there is not enough matching evidence to produce a reliable diabetes confidence score."

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
        enriched["missing_inputs"] = missing_inputs
        enriched["provided_inputs"] = provided_inputs
        enriched["confidence_status"] = confidence_status
        enriched["confidence_reason"] = confidence_reason
        enriched["result_summary"] = summary
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
        }:
            if facts.get(flag) is True:
                derived_flags.append(flag)

        recommendations = list(result.get("recommendations") or [])

        return {
            "primary_assessment": {
                "diagnosis": result.get("diagnosis"),
                "certainty": result.get("certainty"),
                "certainty_percent": result.get("certainty_percent"),
                "confidence": result.get("confidence_level"),
                "confidence_status": result.get("confidence_status"),
                "confidence_reason": result.get("confidence_reason"),
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
            note = "Evidence coverage is strong across symptoms and laboratory data."
        elif score >= 40:
            level = "medium"
            note = "Evidence coverage is moderate; additional labs can improve confidence."
        else:
            level = "low"
            note = "Evidence coverage is limited and the assessment may be less reliable."

        recommended_lab_keys = ["fasting_glucose", "hba1c", "2h_ogtt_75g", "random_plasma_glucose"]
        missing_recommended_labs = [key for key in recommended_lab_keys if key not in normalized_payload]

        return {
            "score": score,
            "level": level,
            "note": note,
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
    ) -> tuple[str, str]:
        trace = (result.get("explanation_trace") or {}).get("confidence_calculation") or {}
        conclusion_scores = trace.get("conclusion_scores") or []
        top_conclusion = str(trace.get("top_conclusion") or "").strip()

        if conclusion_scores and certainty_percent > 0:
            top_supporting_rules = conclusion_scores[0].get("supporting_rules") or []
            support_count = len(top_supporting_rules)
            reason = (
                f"Confidence score is calculated from {support_count} matched diagnosis "
                f"rule{'s' if support_count != 1 else ''}"
            )
            if top_conclusion:
                reason += f" linked to conclusion '{top_conclusion}'."
            else:
                reason += "."

            if missing_inputs:
                reason += f" Core lab inputs still missing: {', '.join(missing_inputs)}."
            return "calculated", reason

        reasons = []
        if missing_inputs:
            reasons.append(f"core lab inputs are missing ({', '.join(missing_inputs)})")

        if not matched_symptoms and not matched_risk_factors:
            reasons.append("very limited symptom and risk-factor evidence was provided")

        fired_rules = result.get("triggered_rules") or []
        has_diagnosis_output = any(
            output.get("type") == "conclusion"
            for rule in fired_rules
            for output in (rule.get("inferred_outputs") or [])
        )
        if fired_rules and not has_diagnosis_output:
            reasons.append("rules fired, but none produced a diagnosis conclusion")
        elif not fired_rules:
            reasons.append("no active rule was matched from the submitted facts")

        if not reasons:
            reasons.append("diagnosis evidence is insufficient")

        reason = "Confidence score could not be reliably calculated because " + "; ".join(reasons) + "."
        return "insufficient_evidence", reason

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

        def add(text: str, urgency: str, source: str):
            normalized_text = str(text or "").strip()
            if not normalized_text:
                return
            key = normalized_text.lower()
            if key in seen:
                return
            seen.add(key)
            candidates.append(
                {
                    "text": normalized_text,
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
            add(
                "Seek urgent in-person medical evaluation now. If severe symptoms worsen, go to emergency care immediately.",
                urgency,
                "safety",
            )

        if completeness.get("level") != "high":
            add(
                "Assessment confidence is limited because laboratory data is incomplete. Complete fasting glucose and HbA1c testing.",
                "high" if urgent_priority else "routine",
                "completeness",
            )

        urgency_rank = {"urgent": 0, "high": 1, "routine": 2}
        candidates.sort(key=lambda item: (urgency_rank.get(item["urgency"], 9), item["text"]))

        if urgent_priority:
            candidates = [item for item in candidates if item["urgency"] in {"urgent", "high"}]

        return candidates[:5]

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
        safe = max(0, min(100, int(percent)))
        if safe >= 85:
            return {
                "label": "very_high",
                "title": "Very high confidence",
                "description": "The pattern strongly matches diabetes indicators.",
            }
        if safe >= 70:
            return {
                "label": "high",
                "title": "High confidence",
                "description": "Most indicators point in the same direction.",
            }
        if safe >= 45:
            return {
                "label": "moderate",
                "title": "Moderate confidence",
                "description": "Some indicators match, but additional checks may help.",
            }
        return {
            "label": "low",
            "title": "Low confidence",
            "description": "Current data shows weak diabetes indication.",
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
