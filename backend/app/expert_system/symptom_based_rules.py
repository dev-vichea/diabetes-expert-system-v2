"""
Symptom-Based Inference Rules

These rules work WITHOUT lab results, using clinical symptom patterns
to assess diabetes likelihood. Based on ADA, Mayo Clinic, and WHO guidelines.
"""

from app.expert_system.symptom_database import (
    get_cardinal_symptoms,
    get_emergency_symptoms,
    calculate_symptom_score,
    get_type_indication,
)


def generate_symptom_rules() -> list[dict]:
    """
    Generate comprehensive symptom-based rules compatible with RuleLoader.
    """
    rules = []

    # ==================== EMERGENCY RULES (Highest Priority) ====================

    rules.append({
        "id": -1,
        "code": "emergency_dka_pattern",
        "name": "Possible Diabetic Ketoacidosis Pattern",
        "priority": "high",
        "category": "triage",
        "certainty_factor": 0.85,
        "status": "active",
        "condition": "(vomiting == True or nausea == True) and (abdominal_pain == True or fruity_breath == True or rapid_breathing == True)",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "emergency_diabetes_suspected",
                "recommendation": "URGENT: Seek immediate emergency medical care. These symptoms may indicate a serious complication.",
            },
            {
                "action_type": "assert_fact",
                "action_value": "urgent_flag=true",
            },
        ],
        "explanation": "Multiple emergency symptoms suggest possible DKA",
    })

    rules.append({
        "id": -2,
        "code": "severe_dehydration",
        "name": "Severe Dehydration Pattern",
        "priority": "high",
        "category": "triage",
        "certainty_factor": 0.75,
        "status": "active",
        "condition": "frequent_urination == True and excessive_thirst == True and (confusion == True or extreme_fatigue == True)",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "severe_hyperglycemia_suspected",
                "recommendation": "URGENT: Seek medical care today. Severe dehydration from high blood sugar needs immediate attention.",
            },
        ],
        "explanation": "Severe dehydration with confusion indicates urgent need",
    })

    # ==================== CARDINAL SYMPTOM RULES ====================

    rules.append({
        "id": -3,
        "code": "classic_triad",
        "name": "Classic Diabetes Triad (3 Ps)",
        "priority": "high",
        "category": "diagnosis",
        "certainty_factor": 0.80,
        "status": "active",
        "condition": "frequent_urination == True and excessive_thirst == True and excessive_hunger == True",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "diabetes_highly_likely",
                "recommendation": "Schedule medical evaluation within 1-2 weeks. The classic signs strongly suggest diabetes.",
            },
            {
                "action_type": "assert_fact",
                "action_value": "classic_triad_present=true",
            },
        ],
        "explanation": "All three cardinal symptoms (3 Ps) are present",
    })

    rules.append({
        "id": -4,
        "code": "two_cardinal_symptoms",
        "name": "Two Cardinal Symptoms Present",
        "priority": "high",
        "category": "diagnosis",
        "certainty_factor": 0.65,
        "status": "active",
        "condition": "(frequent_urination == True and excessive_thirst == True) or (frequent_urination == True and excessive_hunger == True) or (excessive_thirst == True and excessive_hunger == True)",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "diabetes_likely",
                "recommendation": "Medical evaluation recommended soon. Two major diabetes symptoms are present.",
            },
        ],
        "explanation": "Two of the three cardinal symptoms present",
    })

    # ==================== TYPE 1 PATTERN RULES ====================

    rules.append({
        "id": -5,
        "code": "type1_youth_pattern",
        "name": "Type 1 Pattern - Youth with Rapid Symptoms",
        "priority": "high",
        "category": "classification",
        "certainty_factor": 0.70,
        "status": "active",
        "condition": "age < 30 and (frequent_urination == True or excessive_thirst == True) and unexplained_weight_loss == True",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "type1_pattern_likely",
                "recommendation": "Urgent evaluation needed. This pattern suggests Type 1 diabetes, which requires immediate treatment.",
            },
        ],
        "explanation": "Young age + weight loss + cardinal symptoms suggest Type 1",
    })

    rules.append({
        "id": -6,
        "code": "rapid_onset_pattern",
        "name": "Rapid Symptom Onset",
        "priority": "high",
        "category": "classification",
        "certainty_factor": 0.65,
        "status": "active",
        "condition": "rapid_onset == True and (frequent_urination == True or excessive_thirst == True) and unexplained_weight_loss == True",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "type1_pattern_likely",
                "recommendation": "Seek medical care soon. Rapidly developing symptoms may indicate Type 1 diabetes.",
            },
        ],
        "explanation": "Rapid onset with weight loss suggests Type 1",
    })

    rules.append({
        "id": -7,
        "code": "pediatric_diabetes",
        "name": "Pediatric Diabetes Pattern",
        "priority": "high",
        "category": "diagnosis",
        "certainty_factor": 0.75,
        "status": "active",
        "condition": "age < 18 and (frequent_urination == True or excessive_thirst == True)",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "diabetes_highly_likely",
                "recommendation": "URGENT: Seek medical evaluation immediately. Diabetes in children requires prompt diagnosis and treatment.",
            },
        ],
        "explanation": "Child with diabetes symptoms - likely Type 1",
    })

    # ==================== TYPE 2 PATTERN RULES ====================

    rules.append({
        "id": -8,
        "code": "type2_adult_pattern",
        "name": "Type 2 Pattern - Adult with Risk Factors",
        "priority": "high",
        "category": "classification",
        "certainty_factor": 0.70,
        "status": "active",
        "condition": "age >= 40 and (frequent_urination == True or excessive_thirst == True) and (obesity == True or family_history == True)",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "type2_pattern_likely",
                "recommendation": "Medical evaluation recommended soon for Type 2 risk pattern.",
            },
        ],
        "explanation": "Age + risk factors + symptoms suggest Type 2",
    })

    rules.append({
        "id": -9,
        "code": "insulin_resistance_signs",
        "name": "Insulin Resistance Signs",
        "priority": "medium",
        "category": "classification",
        "certainty_factor": 0.60,
        "status": "active",
        "condition": "dark_skin_patches == True and (obesity == True or family_history == True)",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "type2_pattern_likely",
                "recommendation": "Signs of insulin resistance observed. Lifestyle interventions and medical screening recommended.",
            },
        ],
        "explanation": "Acanthosis nigricans indicates insulin resistance",
    })

    rules.append({
        "id": -10,
        "code": "neuropathy_pattern",
        "name": "Peripheral Neuropathy Pattern",
        "priority": "medium",
        "category": "classification",
        "certainty_factor": 0.60,
        "status": "active",
        "condition": "(tingling_hands_feet == True or numbness == True or burning_sensation == True) and age >= 40",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "neuropathy_screening",
                "recommendation": "Nerve symptoms may indicate diabetes-related nerve damage. Medical evaluation recommended.",
            },
        ],
        "explanation": "Neuropathy symptoms in adult suggest longstanding diabetes",
    })

    rules.append({
        "id": -11,
        "code": "slow_healing_pattern",
        "name": "Poor Healing and Infections",
        "priority": "medium",
        "category": "diagnosis",
        "certainty_factor": 0.50,
        "status": "active",
        "condition": "slow_healing_wounds == True and frequent_infections == True",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "diabetes_possible",
                "recommendation": "Slow-healing wounds and frequent infections warrant diabetes screening.",
            },
        ],
        "explanation": "Poor healing and infections are common in uncontrolled diabetes",
    })

    # ==================== EARLY WARNING RULES ====================

    rules.append({
        "id": -12,
        "code": "fatigue_with_vision",
        "name": "Fatigue with Vision Changes",
        "priority": "medium",
        "category": "diagnosis",
        "certainty_factor": 0.60,
        "status": "active",
        "condition": "extreme_fatigue == True and blurred_vision == True and (frequent_urination == True or excessive_thirst == True)",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "diabetes_likely",
                "recommendation": "Multiple symptoms suggest possible diabetes. Medical evaluation recommended.",
            },
        ],
        "explanation": "Fatigue + vision changes + urinary symptoms indicate diabetes",
    })

    rules.append({
        "id": -13,
        "code": "vision_only_warning",
        "name": "Vision Changes as Early Sign",
        "priority": "low",
        "category": "diagnosis",
        "certainty_factor": 0.40,
        "status": "active",
        "condition": "blurred_vision == True and age >= 40 and (obesity == True or family_history == True)",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "demographic_screening",
                "recommendation": "Vision changes in a high-risk individual warrant routine screening.",
            },
        ],
        "explanation": "Vision changes in high-risk person warrant screening",
    })

    # ==================== GESTATIONAL DIABETES RULES ====================

    rules.append({
        "id": -14,
        "code": "gestational_pattern",
        "name": "Gestational Diabetes Pattern",
        "priority": "high",
        "category": "classification",
        "certainty_factor": 0.60,
        "status": "active",
        "condition": "currently_pregnant == True and (frequent_urination == True or excessive_thirst == True or extreme_fatigue == True)",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "gestational_diabetes_likely",
                "recommendation": "Contact your OB/GYN for glucose testing. Symptoms during pregnancy require evaluation.",
            },
        ],
        "explanation": "Diabetes symptoms during pregnancy need evaluation",
    })

    # ==================== COMBINATION PATTERN RULES ====================

    rules.append({
        "id": -15,
        "code": "multiple_symptoms_high_risk",
        "name": "Multiple Symptoms with High Risk",
        "priority": "high",
        "category": "diagnosis",
        "certainty_factor": 0.65,
        "status": "active",
        "condition": "(frequent_urination == True or excessive_thirst == True or extreme_fatigue == True or blurred_vision == True) and age >= 45 and (obesity == True or family_history == True or hypertension == True)",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "diabetes_likely",
                "recommendation": "Your symptoms combined with risk factors suggest diabetes. Medical evaluation recommended soon.",
            },
        ],
        "explanation": "Symptoms + multiple risk factors increase likelihood",
    })

    rules.append({
        "id": -16,
        "code": "skin_symptoms_cluster",
        "name": "Skin Symptom Cluster",
        "priority": "medium",
        "category": "diagnosis",
        "certainty_factor": 0.55,
        "status": "active",
        "condition": "(itchy_skin == True or slow_healing_wounds == True or frequent_infections == True) and (frequent_urination == True or excessive_thirst == True)",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "diabetes_possible",
                "recommendation": "Skin symptoms with urinary/thirst symptoms suggest diabetes.",
            },
        ],
        "explanation": "Skin symptoms with urinary/thirst symptoms suggest diabetes",
    })

    # ==================== SINGLE SYMPTOM WARNING RULES ====================

    rules.append({
        "id": -17,
        "code": "single_cardinal_high_risk",
        "name": "Single Cardinal Symptom in High-Risk Person",
        "priority": "low",
        "category": "recommendation",
        "certainty_factor": 0.45,
        "status": "active",
        "condition": "(frequent_urination == True or excessive_thirst == True) and age >= 45 and (obesity == True or family_history == True)",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "type2_risk_increased",
                "recommendation": "Consider diabetes screening. You have risk factors and one warning symptom.",
            },
        ],
        "explanation": "Single symptom in high-risk person warrants screening",
    })

    # ==================== NO STRONG INDICATION ====================

    rules.append({
        "id": -18,
        "code": "risk_factors_only",
        "name": "Risk Factors Without Symptoms",
        "priority": "low",
        "category": "recommendation",
        "certainty_factor": 0.30,
        "status": "active",
        "condition": "(obesity == True or family_history == True or hypertension == True) and age >= 35",
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "type2_risk_increased",
                "recommendation": "Consider routine diabetes screening based on your risk factors.",
            },
        ],
        "explanation": "Risk factors present but no symptoms",
    })

    return rules


def get_symptom_based_assessment(symptoms: dict) -> dict:
    """
    Direct symptom-based assessment without rule engine.
    Useful for quick screening.
    """
    present_symptoms = [k for k, v in symptoms.items() if v is True]

    if not present_symptoms:
        return {
            "assessment": "insufficient_data",
            "certainty": 0.0,
            "message": "No symptoms reported. Cannot assess diabetes likelihood.",
        }

    # Calculate symptom score
    score = calculate_symptom_score(present_symptoms)

    # Get type indication
    type_info = get_type_indication(present_symptoms)

    # Check for emergency
    emergency_present = any(s in get_emergency_symptoms() for s in present_symptoms)

    # Check for cardinal symptoms
    cardinal_present = sum(1 for s in get_cardinal_symptoms() if s in present_symptoms)

    # Determine assessment
    if emergency_present:
        assessment = "emergency_suspected"
        certainty = 0.85
        message = "URGENT: Emergency symptoms detected. Seek immediate medical care."
    elif cardinal_present >= 3:
        assessment = "diabetes_highly_likely"
        certainty = 0.80
        message = "All three classic diabetes symptoms present. Medical evaluation strongly recommended."
    elif cardinal_present >= 2:
        assessment = "diabetes_likely"
        certainty = 0.65
        message = "Multiple major diabetes symptoms present. Medical evaluation recommended."
    elif score >= 0.5:
        assessment = "diabetes_possible"
        certainty = 0.55
        message = "Several diabetes-related symptoms present. Consider medical evaluation."
    elif score >= 0.3:
        assessment = "diabetes_screening_recommended"
        certainty = 0.40
        message = "Some symptoms present. Diabetes screening may be appropriate."
    else:
        assessment = "low_concern"
        certainty = 0.20
        message = "Few symptoms present. Routine screening based on age and risk factors."

    return {
        "assessment": assessment,
        "certainty": certainty,
        "message": message,
        "symptom_score": score,
        "type_indication": type_info,
        "cardinal_symptoms_count": cardinal_present,
        "emergency_detected": emergency_present,
        "total_symptoms": len(present_symptoms),
    }
