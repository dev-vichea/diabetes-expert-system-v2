"""
Missing Facts Detection Module

Analyzes provided facts and inference results to intelligently suggest
what additional information would improve diagnostic confidence.
"""

from __future__ import annotations


def detect_missing_facts(provided_facts: dict, inference_result: dict) -> dict:
    """
    Intelligently detect what facts are missing and prioritize by impact.
    
    Returns:
        {
            "critical": [...],  # Missing facts that would significantly improve confidence
            "helpful": [...],   # Additional facts that would help
            "has_sufficient_data": bool
        }
    """
    critical_missing = []
    helpful_missing = []
    
    # Check if we have ANY lab values
    has_labs = _has_any_lab_values(provided_facts)
    has_symptoms = _has_any_symptoms(provided_facts)
    has_core_symptoms = _has_core_diabetes_symptoms(provided_facts)
    
    # Critical: No lab values at all
    if not has_labs and has_symptoms:
        critical_missing.append({
            "category": "lab_tests",
            "field_suggestions": ["fasting_glucose", "hba1c", "random_plasma_glucose"],
            "impact": "high",
            "reason": "Lab values would confirm or rule out diabetes",
            "explanation": "Blood glucose or HbA1c testing is essential for diagnosis"
        })
    
    # Critical: Has labs but missing basic demographics
    if has_labs and not provided_facts.get("age"):
        critical_missing.append({
            "category": "demographics",
            "field_suggestions": ["age"],
            "impact": "high",
            "reason": "Age is crucial for risk assessment and type determination",
            "explanation": "Diabetes patterns differ significantly by age group"
        })
    
    # Helpful: Has core symptoms but no onset information
    if has_core_symptoms and "rapid_onset" not in provided_facts:
        helpful_missing.append({
            "category": "symptom_onset",
            "field_suggestions": ["rapid_onset"],
            "impact": "medium",
            "reason": "Onset speed helps distinguish Type 1 vs Type 2 diabetes",
            "explanation": "Sudden onset suggests Type 1, gradual suggests Type 2"
        })
    
    # Helpful: Has diabetes indication but no risk factor data
    if (has_labs or has_core_symptoms) and not _has_any_risk_factors(provided_facts):
        helpful_missing.append({
            "category": "risk_factors",
            "field_suggestions": ["family_history", "obesity", "sedentary_lifestyle", "hypertension"],
            "impact": "medium",
            "reason": "Risk factors help assess likelihood and type",
            "explanation": "Risk profile aids in determining diabetes type and progression"
        })
    
    # Helpful: Has high glucose but no BMI
    if _has_elevated_glucose(provided_facts) and not provided_facts.get("bmi"):
        helpful_missing.append({
            "category": "body_metrics",
            "field_suggestions": ["bmi", "weight_kg", "height_cm"],
            "impact": "medium",
            "reason": "BMI helps distinguish Type 1 vs Type 2 patterns",
            "explanation": "Type 2 diabetes is strongly associated with obesity"
        })
    
    # Helpful: Female patient without pregnancy status
    sex = str(provided_facts.get("sex", "")).lower()
    age = provided_facts.get("age")
    if sex == "female" and age and 15 <= age <= 50 and "currently_pregnant" not in provided_facts:
        helpful_missing.append({
            "category": "pregnancy_status",
            "field_suggestions": ["currently_pregnant"],
            "impact": "low",
            "reason": "Pregnancy requires different screening criteria",
            "explanation": "Gestational diabetes has specific diagnostic thresholds"
        })
    
    # Helpful: Has symptoms but no emergency signs checked
    if has_symptoms and not _has_emergency_assessment(provided_facts):
        helpful_missing.append({
            "category": "emergency_signs",
            "field_suggestions": ["vomiting", "abdominal_pain", "fruity_breath", "deep_rapid_breathing"],
            "impact": "medium",
            "reason": "Emergency signs indicate need for urgent care",
            "explanation": "DKA symptoms require immediate medical attention"
        })
    
    # Determine if we have sufficient data
    has_sufficient_data = (
        (has_labs or has_core_symptoms) and
        provided_facts.get("age") is not None and
        len(critical_missing) == 0
    )
    
    return {
        "critical": critical_missing,
        "helpful": helpful_missing,
        "has_sufficient_data": has_sufficient_data,
        "completeness_score": _calculate_completeness_score(provided_facts)
    }


def _has_any_lab_values(facts: dict) -> bool:
    """Check if any lab values are provided."""
    lab_fields = [
        "fasting_glucose", "fasting_plasma_glucose", "hba1c",
        "random_plasma_glucose", "blood_glucose", "2h_ogtt_75g", "ogtt_2h"
    ]
    return any(facts.get(field) is not None for field in lab_fields)


def _has_any_symptoms(facts: dict) -> bool:
    """Check if any symptoms are reported."""
    symptom_fields = [
        "frequent_urination", "excessive_thirst", "excessive_hunger",
        "weight_loss", "fatigue", "blurred_vision", "nausea",
        "slow_healing", "tingling_hands_feet"
    ]
    return any(facts.get(field) is True for field in symptom_fields)


def _has_core_diabetes_symptoms(facts: dict) -> bool:
    """Check if core diabetes symptoms (3 Ps) are present."""
    core_symptoms = ["frequent_urination", "excessive_thirst", "excessive_hunger"]
    count = sum(1 for symptom in core_symptoms if facts.get(symptom) is True)
    return count >= 2


def _has_any_risk_factors(facts: dict) -> bool:
    """Check if any risk factors are provided."""
    risk_fields = [
        "family_history", "obesity", "sedentary_lifestyle",
        "hypertension", "high_cholesterol", "gestational_history"
    ]
    return any(facts.get(field) is not None for field in risk_fields)


def _has_elevated_glucose(facts: dict) -> bool:
    """Check if any glucose values are elevated."""
    fasting = facts.get("fasting_glucose") or facts.get("fasting_plasma_glucose")
    random = facts.get("random_plasma_glucose") or facts.get("blood_glucose")
    hba1c = facts.get("hba1c")
    
    if fasting and float(fasting) >= 100:
        return True
    if random and float(random) >= 140:
        return True
    if hba1c and float(hba1c) >= 5.7:
        return True
    return False


def _has_emergency_assessment(facts: dict) -> bool:
    """Check if emergency signs have been assessed."""
    emergency_fields = ["vomiting", "abdominal_pain", "fruity_breath", "deep_rapid_breathing"]
    return any(field in facts for field in emergency_fields)


def _calculate_completeness_score(facts: dict) -> float:
    """
    Calculate a 0-1 score indicating how complete the provided data is.
    """
    score = 0.0
    total_weight = 0.0
    
    # Demographics (weight: 0.15)
    if facts.get("age") is not None:
        score += 0.10
    if facts.get("sex"):
        score += 0.05
    total_weight += 0.15
    
    # Lab values (weight: 0.40)
    lab_count = sum(1 for field in ["fasting_glucose", "hba1c", "random_plasma_glucose"] 
                    if facts.get(field) is not None)
    score += min(0.40, lab_count * 0.15)
    total_weight += 0.40
    
    # Symptoms (weight: 0.25)
    symptom_fields = ["frequent_urination", "excessive_thirst", "excessive_hunger", 
                      "weight_loss", "fatigue", "blurred_vision"]
    symptom_count = sum(1 for field in symptom_fields if field in facts)
    score += min(0.25, symptom_count * 0.05)
    total_weight += 0.25
    
    # Risk factors (weight: 0.10)
    risk_fields = ["family_history", "obesity", "bmi"]
    risk_count = sum(1 for field in risk_fields if facts.get(field) is not None)
    score += min(0.10, risk_count * 0.04)
    total_weight += 0.10
    
    # Onset information (weight: 0.10)
    if "rapid_onset" in facts:
        score += 0.10
    total_weight += 0.10
    
    return round(score, 2)


def generate_suggested_questions(missing_facts: dict) -> list[dict]:
    """
    Convert missing facts into user-friendly questions.
    """
    questions = []
    
    # Process critical missing facts first
    for item in missing_facts.get("critical", []):
        questions.extend(_category_to_questions(item, priority="high"))
    
    # Then helpful missing facts
    for item in missing_facts.get("helpful", [])[:3]:  # Limit to top 3
        questions.extend(_category_to_questions(item, priority="medium"))
    
    return questions


def _category_to_questions(missing_item: dict, priority: str) -> list[dict]:
    """Convert a missing fact category to specific questions."""
    category = missing_item["category"]
    
    question_map = {
        "lab_tests": [
            {
                "question": "Do you have recent blood glucose test results?",
                "fields": ["fasting_glucose", "random_plasma_glucose"],
                "priority": priority
            },
            {
                "question": "Do you have an HbA1c (glycated hemoglobin) test result?",
                "fields": ["hba1c"],
                "priority": priority
            }
        ],
        "demographics": [
            {
                "question": "What is your age?",
                "fields": ["age"],
                "priority": priority
            }
        ],
        "symptom_onset": [
            {
                "question": "Did your symptoms develop suddenly (days/weeks) or gradually (months/years)?",
                "fields": ["rapid_onset"],
                "priority": priority
            }
        ],
        "risk_factors": [
            {
                "question": "Do you have a family history of diabetes?",
                "fields": ["family_history"],
                "priority": priority
            },
            {
                "question": "Are you overweight or obese?",
                "fields": ["obesity", "bmi"],
                "priority": priority
            }
        ],
        "body_metrics": [
            {
                "question": "What is your height and weight (to calculate BMI)?",
                "fields": ["height_cm", "weight_kg", "bmi"],
                "priority": priority
            }
        ],
        "pregnancy_status": [
            {
                "question": "Are you currently pregnant?",
                "fields": ["currently_pregnant"],
                "priority": priority
            }
        ],
        "emergency_signs": [
            {
                "question": "Are you experiencing any of these symptoms: severe vomiting, abdominal pain, fruity-smelling breath, or rapid breathing?",
                "fields": ["vomiting", "abdominal_pain", "fruity_breath", "deep_rapid_breathing"],
                "priority": priority
            }
        ]
    }
    
    return question_map.get(category, [])
