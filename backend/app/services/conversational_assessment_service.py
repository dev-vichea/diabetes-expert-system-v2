"""
Conversational Assessment Service

Provides an intelligent, doctor-like conversation experience for diabetes assessment.
Works entirely with symptoms - no lab results required.
"""

from app.expert_system.intelligent_interview import IntelligentInterview, generate_interview_questions
from app.expert_system.symptom_based_rules import generate_symptom_rules, get_symptom_based_assessment
from app.expert_system.symptom_confidence import calculate_symptom_confidence, get_confidence_explanation
from app.expert_system.symptom_database import apply_fact_overlay, clear_fact_overlay
from app.expert_system.enhanced_inference_engine import run_enhanced_inference
from app.expert_system.symptom_database import get_cardinal_symptoms, get_emergency_symptoms
from app.expert_system.patient_messaging import rewrite_recommendation_bilingual
from app.utils.i18n import bilingual, text

CT = "conversational_texts"


class ConversationalAssessmentService:
    """
    Service for conducting conversational diabetes assessments.
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
    
    def start_conversation(self) -> dict:
        """
        Start a new conversation.
        Returns the first question.
        """
        interview = IntelligentInterview()
        first_question = interview.get_next_question()
        
        return {
            "message": text(CT, "chat.greeting", lang="en"),
            "message_km": text(CT, "chat.greeting", lang="km"),
            "question": first_question,
            "progress": interview.get_interview_progress(),
            "session_id": None,  # Generated on first answer
        }
    
    def get_next_question(self, answers: dict) -> dict:
        """
        Get the next question based on previous answers.
        
        Args:
            answers: Dictionary of all answers so far
        
        Returns:
            Next question or assessment if complete
        """
        interview = IntelligentInterview()
        
        # Get next question
        next_q = interview.get_next_question(answers)
        progress = interview.get_interview_progress()
        
        # Check if we can make assessment
        can_assess = interview.can_make_assessment()
        
        if next_q is None or (can_assess and progress["questions_answered"] >= 8):
            # Interview complete - generate assessment
            return {
                "status": "complete",
                "message": text(CT, "chat.complete", lang="en"),
                "message_km": text(CT, "chat.complete", lang="km"),
                "assessment": self._generate_assessment(answers),
                "progress": progress,
            }
        
        # Continue interview
        conv_message = self._generate_conversational_message(answers, next_q)
        return {
            "status": "in_progress",
            "message": conv_message["en"],
            "message_km": conv_message["km"],
            "question": next_q,
            "progress": progress,
            "can_complete_now": can_assess,
        }
    
    def complete_assessment(self, answers: dict, current_user: dict = None) -> dict:
        """
        Complete the assessment and generate diagnosis.
        """
        assessment = self._generate_assessment(answers)
        
        # Save to database if user is authenticated
        if current_user:
            user_id = int(current_user.get("sub")) if current_user.get("sub") else None
            patient_id = self._resolve_patient_id(answers, current_user)
            
            # Create session
            session = self.assessment_repository.create_session(
                patient_id=patient_id,
                submitted_by_user_id=user_id,
                mode="conversational",
                status="submitted",
            )
            
            # Save answers
            answer_records = [
                {
                    "question_code": str(k),
                    "answer_value": str(v),
                    "answer_type": "boolean" if isinstance(v, bool) else "text"
                }
                for k, v in answers.items()
            ]
            self.assessment_repository.save_answers(session, answer_records)
            
            # Save diagnosis
            diagnosis_record = self.diagnosis_repository.create_result(
                assessment_session_id=session.id,
                patient_id=patient_id,
                diagnosed_by_user_id=user_id,
                diagnosis=assessment["diagnosis"],
                certainty=assessment["certainty"],
                recommendation=assessment.get("primary_recommendation", ""),
                facts=answers,
                questionnaire_answers={"conversational": True, "answers": answers},
                triggered_rules=[],
                explanation_trace=assessment,
                is_urgent=assessment.get("urgency") in ("emergency", "urgent"),
                urgent_reason=assessment.get("urgent_reason"),
            )
            
            self.assessment_repository.mark_completed(session)
            
            assessment["diagnosis_result_id"] = diagnosis_record.id
            assessment["assessment_session_id"] = session.id
        
        return assessment
    
    def _generate_assessment(self, answers: dict) -> dict:
        """Generate comprehensive assessment from answers."""
        # Extract symptoms and risk factors
        symptoms = {}
        risk_factors = {}
        demographics = {}
        
        for key, value in answers.items():
            if key in ["age", "sex"]:
                demographics[key] = value
            elif key in ["family_history", "obesity", "sedentary_lifestyle", "hypertension"]:
                risk_factors[key] = value
            else:
                symptoms[key] = value
        
        age = demographics.get("age")
        
        # Doctor-managed fact knowledge overlays the static catalog so edited
        # weights / type indications drive the confidence reasoning.
        try:
            from app.repositories import FactRepository
            apply_fact_overlay(FactRepository().get_active_fact_map())
        except Exception:
            clear_fact_overlay()

        # Calculate symptom-based confidence
        confidence_data = calculate_symptom_confidence(symptoms, age, risk_factors)
        
        # Get quick symptom assessment
        quick_assessment = get_symptom_based_assessment(symptoms)
        
        # Run symptom-based inference (without full rule engine)
        # The quick_assessment and confidence_data already provide comprehensive results
        inference_result = {
            "diagnosis": quick_assessment.get("diagnosis", "Unknown"),
            "certainty": confidence_data["confidence_score"],
            "all_conclusions": [
                {
                    "conclusion": quick_assessment.get("diagnosis", "Unknown"),
                    "certainty": confidence_data["confidence_score"]
                }
            ],
            "triggered_rules": [],
            "facts": answers,
        }
        
        # Determine final diagnosis
        diagnosis = self._determine_diagnosis(
            quick_assessment,
            confidence_data,
            inference_result,
            symptoms
        )
        
        # Determine urgency
        urgency, urgent_reason = self._determine_urgency(symptoms, diagnosis)
        
        # Build comprehensive assessment
        next_steps = self._generate_next_steps(confidence_data, symptoms)
        return {
            "diagnosis": diagnosis["label"],
            "diagnosis_km": diagnosis.get("label_km", ""),
            "certainty": confidence_data["confidence_score"],
            "confidence_level": confidence_data["confidence_level"],
            "confidence_explanation": get_confidence_explanation(confidence_data),
            
            "urgency": urgency,
            "urgent_reason": urgent_reason["en"] if isinstance(urgent_reason, dict) else urgent_reason,
            "urgent_reason_km": urgent_reason["km"] if isinstance(urgent_reason, dict) else None,
            
            "symptom_analysis": {
                "total_symptoms": len([s for s, v in symptoms.items() if v]),
                "cardinal_symptoms": sum(
                    1 for s in get_cardinal_symptoms() 
                    if symptoms.get(s) is True
                ),
                "emergency_symptoms": sum(
                    1 for s in get_emergency_symptoms() 
                    if symptoms.get(s) is True
                ),
                "symptom_score": quick_assessment.get("symptom_score", 0),
            },
            
            "type_indication": quick_assessment.get("type_indication"),
            
            "recommendations": confidence_data["recommendations"],
            "primary_recommendation": confidence_data["recommendations"][0] if confidence_data["recommendations"] else None,
            
            "confidence_breakdown": confidence_data["breakdown"],
            "contributing_factors": confidence_data["contributing_factors"],
            
            "assessment_quality": confidence_data["assessment_quality"],
            "quality_note": confidence_data["quality_note"],
            
            "next_steps": next_steps["en"],
            "next_steps_km": next_steps["km"],
            
            "note": text(CT, "chat.preliminary_note", lang="en"),
            "note_km": text(CT, "chat.preliminary_note", lang="km"),
        }
    
    def _determine_diagnosis(self, quick_assessment, confidence_data, inference_result, symptoms):
        """Determine final diagnosis label."""
        confidence = confidence_data["confidence_score"]
        cardinal_count = confidence_data["symptom_counts"]["cardinal_symptoms"]
        emergency_count = confidence_data["symptom_counts"]["emergency_symptoms"]
        
        if emergency_count > 0:
            return {
                "label": text(CT, "label.emergency", lang="en"),
                "label_km": text(CT, "label.emergency", lang="km"),
                "severity": "emergency"
            }
        
        if cardinal_count >= 3 and confidence >= 0.75:
            return {
                "label": text(CT, "label.high", lang="en"),
                "label_km": text(CT, "label.high", lang="km"),
                "severity": "high"
            }
        
        if cardinal_count >= 2 and confidence >= 0.60:
            return {
                "label": text(CT, "label.moderate_high", lang="en"),
                "label_km": text(CT, "label.moderate_high", lang="km"),
                "severity": "moderate_high"
            }
        
        if confidence >= 0.50:
            return {
                "label": text(CT, "label.moderate", lang="en"),
                "label_km": text(CT, "label.moderate", lang="km"),
                "severity": "moderate"
            }
        
        if confidence >= 0.35:
            return {
                "label": text(CT, "label.low_moderate", lang="en"),
                "label_km": text(CT, "label.low_moderate", lang="km"),
                "severity": "low_moderate"
            }
        
        return {
            "label": text(CT, "label.low", lang="en"),
            "label_km": text(CT, "label.low", lang="km"),
            "severity": "low"
        }
    
    def _determine_urgency(self, symptoms, diagnosis) -> tuple[str, dict | None]:
        """Determine urgency level."""
        emergency_symptoms = get_emergency_symptoms()
        has_emergency = any(symptoms.get(s) is True for s in emergency_symptoms)
        
        if has_emergency:
            return "emergency", bilingual(CT, "urgency.emergency")
        
        severity = diagnosis.get("severity", "low")
        
        if severity == "high":
            return "urgent", bilingual(CT, "urgency.high")
        elif severity == "moderate_high":
            return "soon", bilingual(CT, "urgency.moderate_high")
        elif severity == "moderate":
            return "routine", bilingual(CT, "urgency.moderate")
        else:
            return "routine", bilingual(CT, "urgency.routine")
    
    def _generate_next_steps(self, confidence_data, symptoms) -> dict:
        """Generate actionable next steps."""
        steps = []
        
        # Add primary recommendations
        steps.extend(confidence_data["recommendations"][:3])
        
        # Add symptom monitoring
        if confidence_data["confidence_score"] >= 0.40:
            steps.append(text(CT, "step.monitor_worsen", lang="en"))
        
        # Add lifestyle advice
        steps.append(text(CT, "step.lifestyle", lang="en"))
        
        # Add follow-up advice
        if confidence_data["confidence_score"] < 0.70:
            steps.append(text(CT, "step.track_new", lang="en"))
        
        steps_km = []
        for s in steps:
            for key in ("step.monitor_worsen", "step.lifestyle", "step.track_new"):
                if s == text(CT, key, lang="en"):
                    s = text(CT, key, lang="km")
                    break
            else:
                # Dynamic steps (rewritten clinical recommendations) translate
                # through the patient_messages catalog when known.
                s = rewrite_recommendation_bilingual(s)["km"]
            steps_km.append(s)
        
        return {"en": steps, "km": steps_km}
    
    def _generate_conversational_message(self, answers: dict, next_question: dict) -> dict:
        """Bilingual conversational transition message: {"en", "km"}."""
        """Generate friendly conversational messages between questions."""
        importance = next_question.get("importance", "medium")
        category = next_question.get("category", "")
        
        # Check what we know so far
        has_symptoms = any(
            answers.get(k) is True 
            for k in ["frequent_urination", "excessive_thirst", "excessive_hunger"]
        )
        
        if importance == "critical":
            return bilingual(CT, "chat.critical")
        elif importance == "high":
            if has_symptoms:
                return bilingual(CT, "chat.important_symptoms")
            else:
                return bilingual(CT, "chat.important_generic")
        elif category == "emergency":
            return bilingual(CT, "chat.emergency")
        elif category == "risk_factors":
            return bilingual(CT, "chat.risk_factors")
        else:
            return bilingual(CT, "chat.generic")
    
    def _resolve_patient_id(self, answers: dict, current_user: dict) -> int | None:
        """Resolve patient ID if available."""
        # For now, return None - can be extended
        return None
    
    def get_all_questions(self) -> list[dict]:
        """Get all possible interview questions (for frontend preloading)."""
        return generate_interview_questions()
