"""
Unified Assessment Service

Simplified service layer that acts as a thin wrapper around
the enhanced inference engine. Handles validation, persistence,
and audit logging.
"""

from __future__ import annotations

from flask import current_app

from app.errors import NotFoundError, ValidationError
from app.expert_system.enhanced_inference_engine import run_enhanced_inference
from app.models.entities import utc_now


class UnifiedAssessmentService:
    """
    Simplified assessment service that provides a single evaluation endpoint.
    
    This service:
    - Accepts flexible input (any combination of facts)
    - Validates input minimally (just check ranges)
    - Runs enhanced inference engine
    - Saves results to database
    - Returns comprehensive assessment
    """
    
    def __init__(
        self, 
        rule_repository, 
        diagnosis_repository, 
        assessment_repository,
        patient_repository, 
        audit_log_repository=None
    ):
        self.rule_repository = rule_repository
        self.diagnosis_repository = diagnosis_repository
        self.assessment_repository = assessment_repository
        self.patient_repository = patient_repository
        self.audit_log_repository = audit_log_repository
    
    def evaluate(self, payload: dict, current_user: dict) -> dict:
        """
        Main evaluation endpoint - accepts ANY facts and returns intelligent assessment.
        
        Args:
            payload: Dictionary containing any combination of:
                - symptoms (dict or list)
                - labs (dict or list)
                - risk_factors (dict or list)
                - demographics (age, sex, bmi, etc.)
                - patient_id (optional)
            current_user: Current authenticated user context
        
        Returns:
            Comprehensive assessment with diagnosis, confidence, evidence,
            missing facts, recommendations, and reasoning trace.
        """
        if not isinstance(payload, dict):
            raise ValidationError("A JSON object is required.")
        
        # Extract user context
        user_id = int(current_user.get("sub")) if current_user and current_user.get("sub") else None
        user_roles = set(current_user.get("roles") or [current_user.get("role")])
        
        # Resolve patient
        patient_id = self._resolve_patient_id(payload, current_user, user_roles)
        
        # Validate and normalize input (minimal processing)
        validated_facts = self._validate_input(payload)
        
        # Create assessment session
        session = self.assessment_repository.create_session(
            patient_id=patient_id,
            submitted_by_user_id=user_id,
            mode="diagnostic",
            status="submitted",
        )
        
        # Save raw answers for audit trail
        answer_records = self._extract_answer_records(payload)
        if answer_records:
            self.assessment_repository.save_answers(session, answer_records)
        
        try:
            # Run enhanced inference engine
            rules = self.rule_repository.list_rules()
            result = run_enhanced_inference(validated_facts, rules)
            
            # Determine urgency for triage
            is_urgent = result["urgency"] in ("emergency", "urgent")
            urgent_reason = self._format_urgent_reason(result) if is_urgent else None
            
            # Save diagnosis result
            diagnosis_record = self.diagnosis_repository.create_result(
                assessment_session_id=session.id,
                patient_id=patient_id,
                diagnosed_by_user_id=user_id,
                diagnosis=result["diagnosis"],
                certainty=result["certainty"],
                recommendation=result["recommendation"],
                facts=result["facts"],
                questionnaire_answers=None,  # Not used in flexible mode
                triggered_rules=result["triggered_rules"],
                explanation_trace=result["explanation_trace"],
                is_urgent=is_urgent,
                urgent_reason=urgent_reason,
            )
            
            # Mark session as completed
            self.assessment_repository.mark_completed(session)
            
        except Exception:
            self.assessment_repository.mark_failed(session)
            raise
        
        # Audit log
        if self.audit_log_repository:
            self.audit_log_repository.create(
                action="assessment.evaluate",
                entity_type="diagnosis_result",
                entity_id=str(diagnosis_record.id),
                actor_user_id=user_id,
                metadata={
                    "diagnosis": result["diagnosis"],
                    "certainty": result["certainty"],
                    "confidence_level": result["confidence_level"],
                    "urgency": result["urgency"],
                    "patient_id": patient_id,
                    "session_id": session.id,
                    "has_sufficient_data": result.get("can_conclude", False),
                },
            )
        
        # Return comprehensive response
        return {
            **result,
            "diagnosis_result_id": diagnosis_record.id,
            "assessment_session_id": session.id,
            "patient_id": patient_id,
            "is_urgent": is_urgent,
            "urgent_reason": urgent_reason,
        }
    
    def get_result(self, diagnosis_result_id: int) -> dict:
        """Retrieve a saved assessment result."""
        result = self.diagnosis_repository.get_result(diagnosis_result_id)
        if not result:
            raise NotFoundError("Assessment result not found.")
        return self.diagnosis_repository.serialize_result(result)
    
    def list_my_results(self, current_user: dict) -> list[dict]:
        """List assessment results for the current patient."""
        patient_id = self._resolve_patient_id({}, current_user, {"patient"})
        return self.diagnosis_repository.list_by_patient_id(patient_id)
    
    def list_recent_results(self, limit: int = 100) -> list[dict]:
        """List recent assessment results for clinical review."""
        safe_limit = max(1, min(int(limit or 100), 300))
        return self.diagnosis_repository.list_recent(limit=safe_limit)
    
    def _resolve_patient_id(
        self, 
        payload: dict, 
        current_user: dict, 
        user_roles: set[str]
    ) -> int | None:
        """Resolve patient ID from payload or current user context."""
        # Patient role: use their own profile
        if "patient" in user_roles:
            patient_id = current_user.get("patient_id")
            if not patient_id and current_user.get("sub"):
                patient = self.patient_repository.get_patient_by_user_id(
                    int(current_user["sub"])
                )
                patient_id = patient.id if patient else None
            if not patient_id:
                raise ValidationError("Patient profile is not linked to this account.")
            return patient_id
        
        # Clinician role: patient_id from payload (optional for screening)
        patient_id = payload.get("patient_id")
        if patient_id:
            patient_id = int(patient_id)
            patient = self.patient_repository.get_patient(patient_id)
            if not patient:
                raise NotFoundError("Patient not found.")
            return patient_id
        
        # Allow null patient_id for anonymous screening
        return None
    
    def _validate_input(self, payload: dict) -> dict:
        """
        Minimal validation - just check ranges and types.
        Much simpler than the old 500+ line normalization.
        """
        validated = {}
        
        # Demographics
        if "age" in payload and payload["age"] is not None:
            validated["age"] = self._validate_number(
                payload["age"], "age", min_val=0, max_val=120
            )
        
        if "sex" in payload and payload["sex"]:
            sex = str(payload["sex"]).strip().lower()
            if sex in ("male", "female", "other"):
                validated["sex"] = sex
        
        if "bmi" in payload and payload["bmi"] is not None:
            validated["bmi"] = self._validate_number(
                payload["bmi"], "bmi", min_val=10, max_val=80
            )
        
        # Lab values
        lab_fields = {
            "fasting_glucose": (40, 600),
            "fasting_plasma_glucose": (40, 600),
            "hba1c": (3, 20),
            "random_plasma_glucose": (30, 1000),
            "blood_glucose": (20, 1000),
            "2h_ogtt_75g": (30, 1000),
            "ogtt_2h": (30, 1000),
        }
        for field, (min_val, max_val) in lab_fields.items():
            if field in payload and payload[field] is not None:
                validated[field] = self._validate_number(
                    payload[field], field, min_val, max_val
                )
        
        # Boolean fields (symptoms, risk factors, etc.)
        bool_fields = [
            "frequent_urination", "excessive_thirst", "excessive_hunger",
            "weight_loss", "fatigue", "blurred_vision", "nausea", "vomiting",
            "abdominal_pain", "sweating", "shaking", "dizziness",
            "slow_healing", "tingling_hands_feet", "frequent_infections",
            "acanthosis_nigricans", "irritability", "recurrent_uti_yeast",
            "bed_wetting", "fruity_breath", "deep_rapid_breathing",
            "family_history", "obesity", "sedentary_lifestyle",
            "hypertension", "high_cholesterol", "gestational_history",
            "smoking", "pcos_history", "currently_pregnant",
            "rapid_onset", "crisis",
        ]
        for field in bool_fields:
            if field in payload and payload[field] is not None:
                validated[field] = self._to_bool(payload[field])
        
        # Complex structures (symptoms, labs, risk_factors as dicts/lists)
        if "symptoms" in payload and payload["symptoms"]:
            validated.update(self._normalize_symptoms(payload["symptoms"]))
        
        if "labs" in payload and payload["labs"]:
            validated.update(self._normalize_labs(payload["labs"]))
        
        if "risk_factors" in payload and payload["risk_factors"]:
            validated.update(self._normalize_risk_factors(payload["risk_factors"]))
        
        return validated
    
    def _normalize_symptoms(self, symptoms) -> dict:
        """Convert symptom dict/list to flat boolean fields."""
        result = {}
        
        if isinstance(symptoms, dict):
            for key, value in symptoms.items():
                result[str(key)] = self._to_bool(value)
        
        elif isinstance(symptoms, list):
            for item in symptoms:
                if isinstance(item, str):
                    result[item] = True
                elif isinstance(item, dict):
                    code = item.get("symptom_code") or item.get("code") or item.get("name")
                    if code:
                        result[str(code)] = item.get("present", True)
        
        return result
    
    def _normalize_labs(self, labs) -> dict:
        """Convert lab dict/list to flat numeric fields."""
        result = {}
        
        if isinstance(labs, dict):
            for key, value in labs.items():
                if value is not None:
                    result[str(key)] = float(value)
        
        elif isinstance(labs, list):
            for item in (labs if isinstance(labs, list) else []):
                if isinstance(item, dict):
                    name = item.get("test_name") or item.get("name") or item.get("code")
                    value = item.get("test_value") or item.get("value")
                    if name and value is not None:
                        result[str(name)] = float(value)
        
        return result
    
    def _normalize_risk_factors(self, risk_factors) -> dict:
        """Convert risk factor dict/list to flat boolean fields."""
        result = {}
        
        if isinstance(risk_factors, dict):
            for key, value in risk_factors.items():
                result[str(key)] = self._to_bool(value) if isinstance(value, (bool, str)) else value
        
        elif isinstance(risk_factors, list):
            for item in risk_factors:
                if isinstance(item, str):
                    result[item] = True
                elif isinstance(item, dict):
                    code = item.get("code") or item.get("name") or item.get("risk_factor")
                    if code:
                        result[str(code)] = item.get("value", True)
        
        return result
    
    def _extract_answer_records(self, payload: dict) -> list[dict]:
        """Extract answers for database storage (audit trail)."""
        records = []
        
        # Store all provided fields as answer records
        for key, value in payload.items():
            if key in ("patient_id", "mode", "questionnaire_answers"):
                continue
            if value is None or value == "":
                continue
            
            # Simple values
            if isinstance(value, (str, int, float, bool)):
                records.append({
                    "question_code": str(key),
                    "answer_value": str(value),
                    "answer_type": "text"
                })
        
        return records
    
    def _validate_number(
        self, 
        value, 
        field_name: str, 
        min_val: float, 
        max_val: float
    ) -> float:
        """Validate a numeric field."""
        try:
            num = float(value)
            if not (min_val <= num <= max_val):
                raise ValidationError(
                    f"{field_name} must be between {min_val} and {max_val}"
                )
            return num
        except (TypeError, ValueError):
            raise ValidationError(f"{field_name} must be a valid number")
    
    def _to_bool(self, value) -> bool:
        """Convert value to boolean."""
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(value)
        if isinstance(value, str):
            lower = value.strip().lower()
            return lower in ("true", "yes", "1", "y", "on")
        return False
    
    def _format_urgent_reason(self, result: dict) -> str:
        """Format urgent reason from result."""
        urgency = result.get("urgency")
        
        if urgency == "emergency":
            return "Emergency signs detected - immediate medical attention required"
        
        if urgency == "urgent":
            reasons = []
            if result.get("certainty", 0) >= 0.85:
                reasons.append("High confidence diabetes indication")
            if result.get("suspected_type", {}).get("type") == "Type 1":
                reasons.append("Type 1 diabetes pattern")
            if not reasons:
                reasons.append("Urgent medical evaluation recommended")
            return " - ".join(reasons)
        
        return None
