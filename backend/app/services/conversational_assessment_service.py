"""
Conversational Assessment Service

Provides an intelligent, doctor-like conversation experience for diabetes assessment.
Works entirely with symptoms - no lab results required.
"""

from app.expert_system.intelligent_interview import IntelligentInterview, generate_interview_questions
from app.expert_system.symptom_based_rules import generate_symptom_rules, get_symptom_based_assessment
from app.expert_system.symptom_confidence import calculate_symptom_confidence, get_confidence_explanation
from app.expert_system.enhanced_inference_engine import run_enhanced_inference
from app.expert_system.symptom_database import get_cardinal_symptoms, get_emergency_symptoms


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
            "message": "Hello! I'm here to help assess your diabetes risk through a few questions. Let's start with some basic information.",
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
                "message": "Thank you for answering these questions. Here's my assessment:",
                "assessment": self._generate_assessment(answers),
                "progress": progress,
            }
        
        # Continue interview
        return {
            "status": "in_progress",
            "message": self._generate_conversational_message(answers, next_q),
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
        return {
            "diagnosis": diagnosis["label"],
            "certainty": confidence_data["confidence_score"],
            "confidence_level": confidence_data["confidence_level"],
            "confidence_explanation": get_confidence_explanation(confidence_data),
            
            "urgency": urgency,
            "urgent_reason": urgent_reason,
            
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
            
            "next_steps": self._generate_next_steps(confidence_data, symptoms),
            
            "note": "This is a preliminary assessment based on symptoms. A medical professional should confirm any diabetes diagnosis with appropriate testing.",
        }
    
    def _determine_diagnosis(self, quick_assessment, confidence_data, inference_result, symptoms):
        """Determine final diagnosis label."""
        confidence = confidence_data["confidence_score"]
        cardinal_count = confidence_data["symptom_counts"]["cardinal_symptoms"]
        emergency_count = confidence_data["symptom_counts"]["emergency_symptoms"]
        
        if emergency_count > 0:
            return {
                "label": "EMERGENCY - Possible Diabetic Crisis",
                "severity": "emergency"
            }
        
        if cardinal_count >= 3 and confidence >= 0.75:
            return {
                "label": "Highly Likely Diabetes - Immediate Evaluation Needed",
                "severity": "high"
            }
        
        if cardinal_count >= 2 and confidence >= 0.60:
            return {
                "label": "Likely Diabetes - Medical Evaluation Recommended",
                "severity": "moderate_high"
            }
        
        if confidence >= 0.50:
            return {
                "label": "Possible Diabetes - Screening Recommended",
                "severity": "moderate"
            }
        
        if confidence >= 0.35:
            return {
                "label": "Some Diabetes Risk - Consider Screening",
                "severity": "low_moderate"
            }
        
        return {
            "label": "Low Diabetes Indication - Routine Monitoring",
            "severity": "low"
        }
    
    def _determine_urgency(self, symptoms, diagnosis) -> tuple[str, str | None]:
        """Determine urgency level."""
        emergency_symptoms = get_emergency_symptoms()
        has_emergency = any(symptoms.get(s) is True for s in emergency_symptoms)
        
        if has_emergency:
            return "emergency", "Emergency symptoms detected requiring immediate medical attention"
        
        severity = diagnosis.get("severity", "low")
        
        if severity == "high":
            return "urgent", "Strong symptom pattern requires prompt medical evaluation"
        elif severity == "moderate_high":
            return "soon", "Multiple symptoms suggest medical evaluation within 1-2 weeks"
        elif severity == "moderate":
            return "routine", "Consider scheduling medical evaluation"
        else:
            return "routine", "Routine screening based on symptoms and risk factors"
    
    def _generate_next_steps(self, confidence_data, symptoms) -> list[str]:
        """Generate actionable next steps."""
        steps = []
        
        # Add primary recommendations
        steps.extend(confidence_data["recommendations"][:3])
        
        # Add symptom monitoring
        if confidence_data["confidence_score"] >= 0.40:
            steps.append("Monitor symptoms and seek care immediately if they worsen")
        
        # Add lifestyle advice
        steps.append("Maintain healthy diet and regular physical activity")
        
        # Add follow-up advice
        if confidence_data["confidence_score"] < 0.70:
            steps.append("Keep track of any new symptoms that develop")
        
        return steps
    
    def _generate_conversational_message(self, answers: dict, next_question: dict) -> str:
        """Generate friendly conversational messages between questions."""
        importance = next_question.get("importance", "medium")
        category = next_question.get("category", "")
        
        # Check what we know so far
        has_symptoms = any(
            answers.get(k) is True 
            for k in ["frequent_urination", "excessive_thirst", "excessive_hunger"]
        )
        
        if importance == "critical":
            return "This is an important question to ensure you get appropriate care."
        elif importance == "high":
            if has_symptoms:
                return "Based on what you've told me, this next question is important."
            else:
                return "Let me ask you about another key symptom."
        elif category == "emergency":
            return "I need to check for any urgent symptoms."
        elif category == "risk_factors":
            return "Now let's talk about your risk factors."
        else:
            return "Let me ask you one more question."
    
    def _resolve_patient_id(self, answers: dict, current_user: dict) -> int | None:
        """Resolve patient ID if available."""
        # For now, return None - can be extended
        return None
    
    def get_all_questions(self) -> list[dict]:
        """Get all possible interview questions (for frontend preloading)."""
        return generate_interview_questions()
