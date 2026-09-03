"""
Intelligent Interview System

Feels like talking to a real doctor - asks follow-up questions
based on previous answers, prioritizes important questions,
and adapts the conversation flow intelligently.
"""

from app.expert_system.symptom_database import ALL_SYMPTOMS, get_symptom_info


class IntelligentInterview:
    """
    Manages an intelligent, adaptive interview that feels like
    talking to a doctor.
    """
    
    def __init__(self):
        self.asked_questions = set()
        self.symptoms_reported = {}
        self.context = {}
    
    def get_next_question(self, answers: dict = None) -> dict | None:
        """
        Get the next most relevant question based on what we know.
        Returns None if interview is complete.
        """
        if answers:
            self.symptoms_reported.update(answers)
        
        # Priority 1: Basic demographics (always ask first)
        if "age" not in self.symptoms_reported:
            return {
                "id": "demographics_age",
                "question": "What is your age?",
                "type": "number",
                "required": True,
                "category": "demographics",
                "min": 0,
                "max": 120,
            }
        
        if "sex" not in self.symptoms_reported:
            return {
                "id": "demographics_sex",
                "question": "What is your sex?",
                "type": "choice",
                "required": True,
                "category": "demographics",
                "options": ["Male", "Female", "Other"],
            }
        
        # Priority 2: Cardinal symptoms (3 Ps) - most important!
        cardinal = self._ask_cardinal_symptoms()
        if cardinal:
            return cardinal
        
        # Priority 3: Emergency symptoms (if any cardinal symptom is present)
        if self._has_any_cardinal_symptom():
            emergency = self._ask_emergency_symptoms()
            if emergency:
                return emergency
        
        # Priority 4: Follow-up questions based on positive answers
        followup = self._ask_intelligent_followup()
        if followup:
            return followup
        
        # Priority 5: Type discrimination questions
        if self._has_diabetes_indicators():
            type_q = self._ask_type_discrimination()
            if type_q:
                return type_q
        
        # Priority 6: Risk factors
        risk = self._ask_risk_factors()
        if risk:
            return risk
        
        # Priority 7: Secondary symptoms
        secondary = self._ask_secondary_symptoms()
        if secondary:
            return secondary
        
        # Interview complete
        return None
    
    def _has_any_cardinal_symptom(self) -> bool:
        """Check if any cardinal symptom is reported."""
        cardinal = [
            "frequent_urination", "polyuria",
            "excessive_thirst", "polydipsia",
            "excessive_hunger", "polyphagia"
        ]
        return any(self.symptoms_reported.get(s) is True for s in cardinal)
    
    def _has_diabetes_indicators(self) -> bool:
        """Check if we have enough symptoms to assess type."""
        cardinal_sets = [
            {"frequent_urination", "polyuria"},
            {"excessive_thirst", "polydipsia"},
            {"excessive_hunger", "polyphagia"},
        ]
        cardinal_count = sum(
            1 for cset in cardinal_sets
            if any(self.symptoms_reported.get(s) is True for s in cset)
        )
        return cardinal_count >= 2
    
    def _ask_cardinal_symptoms(self) -> dict | None:
        """Ask about the 3 Ps in order of importance."""
        cardinal_order = [
            "frequent_urination",
            "excessive_thirst",
            "excessive_hunger"
        ]
        
        for symptom_code in cardinal_order:
            if symptom_code not in self.symptoms_reported:
                info = get_symptom_info(symptom_code)
                return {
                    "id": symptom_code,
                    "question": info["question"],
                    "type": "yes_no",
                    "required": True,
                    "category": "cardinal",
                    "importance": "high",
                    "explanation": "This is one of the classic signs of diabetes.",
                }
        return None
    
    def _ask_emergency_symptoms(self) -> dict | None:
        """Ask about emergency symptoms if diabetes is suspected."""
        emergency_symptoms = [
            "nausea",
            "vomiting",
            "abdominal_pain",
            "fruity_breath",
            "rapid_breathing",
            "confusion",
        ]
        
        for symptom_code in emergency_symptoms:
            if symptom_code not in self.symptoms_reported:
                info = get_symptom_info(symptom_code)
                if info:
                    return {
                        "id": symptom_code,
                        "question": info["question"],
                        "type": "yes_no",
                        "required": False,
                        "category": "emergency",
                        "importance": "critical",
                        "explanation": "This helps us determine if you need urgent care.",
                    }
        return None
    
    def _ask_intelligent_followup(self) -> dict | None:
        """
        Ask intelligent follow-up questions based on what was reported.
        This makes it feel like a real doctor conversation.
        """
        # If thirsty and urinating → ask about hunger (complete the triad)
        if (self.symptoms_reported.get("frequent_urination") or 
            self.symptoms_reported.get("excessive_thirst")):
            
            if "excessive_hunger" not in self.symptoms_reported:
                info = get_symptom_info("excessive_hunger")
                return {
                    "id": "excessive_hunger",
                    "question": info["question"],
                    "type": "yes_no",
                    "required": False,
                    "category": "cardinal",
                    "importance": "high",
                    "explanation": "Since you have urinary/thirst symptoms, hunger is also important to check.",
                }
        
        # If cardinal symptoms → ask about weight and energy
        if self._has_any_cardinal_symptom():
            if "unexplained_weight_loss" not in self.symptoms_reported:
                info = get_symptom_info("unexplained_weight_loss")
                return {
                    "id": "unexplained_weight_loss",
                    "question": info["question"],
                    "type": "yes_no",
                    "required": False,
                    "category": "metabolic",
                    "importance": "high",
                    "explanation": "Weight changes help us understand the type of diabetes.",
                }
            
            if "extreme_fatigue" not in self.symptoms_reported:
                info = get_symptom_info("extreme_fatigue")
                return {
                    "id": "extreme_fatigue",
                    "question": info["question"],
                    "type": "yes_no",
                    "required": False,
                    "category": "metabolic",
                    "importance": "medium",
                }
        
        # If young → ask about rapid onset
        age = self.symptoms_reported.get("age")
        if age and age < 30 and self._has_diabetes_indicators():
            if "rapid_onset" not in self.symptoms_reported:
                return {
                    "id": "rapid_onset",
                    "question": "Did your symptoms develop suddenly (over days to weeks) or gradually (over months)?",
                    "type": "choice",
                    "required": False,
                    "category": "type_discrimination",
                    "importance": "high",
                    "options": ["Suddenly", "Gradually", "Not sure"],
                    "explanation": "How quickly symptoms developed helps determine the type.",
                }
        
        # If child → ask about bed-wetting
        if age and age < 18 and self._has_diabetes_indicators():
            if "bed_wetting" not in self.symptoms_reported:
                info = get_symptom_info("bed_wetting")
                return {
                    "id": "bed_wetting",
                    "question": info["question"],
                    "type": "yes_no",
                    "required": False,
                    "category": "pediatric",
                    "importance": "medium",
                }
        
        # If female → ask about pregnancy
        sex = self.symptoms_reported.get("sex", "").lower()
        if "female" in sex and age and 15 <= age <= 50:
            if "currently_pregnant" not in self.symptoms_reported:
                return {
                    "id": "currently_pregnant",
                    "question": "Are you currently pregnant?",
                    "type": "yes_no",
                    "required": False,
                    "category": "gestational",
                    "importance": "high",
                    "explanation": "Pregnancy affects diabetes screening criteria.",
                }
        
        return None
    
    def _ask_type_discrimination(self) -> dict | None:
        """Ask questions that help distinguish Type 1 from Type 2."""
        # Already covered in follow-up, but add vision check
        if "blurred_vision" not in self.symptoms_reported:
            info = get_symptom_info("blurred_vision")
            return {
                "id": "blurred_vision",
                "question": info["question"],
                "type": "yes_no",
                "required": False,
                "category": "vision",
                "importance": "medium",
            }
        
        return None
    
    def _ask_risk_factors(self) -> dict | None:
        """Ask about major risk factors."""
        risk_questions = [
            {
                "id": "family_history",
                "question": "Does anyone in your immediate family (parents, siblings) have diabetes?",
                "explanation": "Family history significantly increases diabetes risk.",
            },
            {
                "id": "obesity",
                "question": "Would you consider yourself overweight or obese?",
                "explanation": "Weight is a major risk factor for Type 2 diabetes.",
            },
            {
                "id": "sedentary_lifestyle",
                "question": "Do you exercise less than 30 minutes per week?",
                "explanation": "Physical inactivity increases diabetes risk.",
            },
        ]
        
        for q in risk_questions:
            if q["id"] not in self.symptoms_reported:
                return {
                    **q,
                    "type": "yes_no",
                    "required": False,
                    "category": "risk_factors",
                    "importance": "medium",
                }
        
        return None
    
    def _ask_secondary_symptoms(self) -> dict | None:
        """Ask about secondary symptoms to refine assessment."""
        secondary = [
            "slow_healing_wounds",
            "tingling_hands_feet",
            "frequent_infections",
            "itchy_skin",
        ]
        
        for symptom_code in secondary:
            if symptom_code not in self.symptoms_reported:
                info = get_symptom_info(symptom_code)
                if info:
                    return {
                        "id": symptom_code,
                        "question": info["question"],
                        "type": "yes_no",
                        "required": False,
                        "category": info["category"],
                        "importance": "low",
                    }
        
        return None
    
    def get_interview_progress(self) -> dict:
        """Get progress through the interview."""
        total_critical = 10  # Rough estimate of critical questions
        answered = len(self.symptoms_reported)
        
        return {
            "questions_answered": answered,
            "estimated_completion": min(100, int((answered / total_critical) * 100)),
            "has_sufficient_data": answered >= 8 and self._has_any_cardinal_symptom(),
        }
    
    def can_make_assessment(self) -> bool:
        """Check if we have enough data to make an assessment."""
        # Need at least: age, sex, and some symptom data
        has_demographics = "age" in self.symptoms_reported
        has_symptoms = any(
            k for k, v in self.symptoms_reported.items()
            if k in ALL_SYMPTOMS and v is True
        )
        
        return has_demographics and (has_symptoms or len(self.symptoms_reported) >= 8)


def generate_interview_questions() -> list[dict]:
    """
    Generate a complete list of all possible interview questions.
    Useful for frontend to pre-load questions.
    """
    questions = []
    
    # Add all symptom questions
    for symptom_code, info in ALL_SYMPTOMS.items():
        questions.append({
            "id": symptom_code,
            "question": info["question"],
            "type": "yes_no",
            "category": info["category"],
            "weight": info["weight"],
        })
    
    # Add demographic questions
    questions.extend([
        {
            "id": "age",
            "question": "What is your age?",
            "type": "number",
            "category": "demographics",
            "required": True,
        },
        {
            "id": "sex",
            "question": "What is your sex?",
            "type": "choice",
            "category": "demographics",
            "options": ["Male", "Female", "Other"],
            "required": True,
        },
    ])
    
    # Add risk factor questions
    questions.extend([
        {
            "id": "family_history",
            "question": "Does anyone in your immediate family have diabetes?",
            "type": "yes_no",
            "category": "risk_factors",
        },
        {
            "id": "obesity",
            "question": "Would you consider yourself overweight?",
            "type": "yes_no",
            "category": "risk_factors",
        },
        {
            "id": "sedentary_lifestyle",
            "question": "Do you exercise less than 30 minutes per week?",
            "type": "yes_no",
            "category": "risk_factors",
        },
        {
            "id": "hypertension",
            "question": "Do you have high blood pressure?",
            "type": "yes_no",
            "category": "risk_factors",
        },
    ])
    
    # Add special questions
    questions.extend([
        {
            "id": "currently_pregnant",
            "question": "Are you currently pregnant?",
            "type": "yes_no",
            "category": "gestational",
            "condition": "sex==female AND age>=15 AND age<=50",
        },
        {
            "id": "rapid_onset",
            "question": "Did your symptoms develop suddenly or gradually?",
            "type": "choice",
            "category": "type_discrimination",
            "options": ["Suddenly", "Gradually", "Not sure"],
        },
    ])
    
    return questions
