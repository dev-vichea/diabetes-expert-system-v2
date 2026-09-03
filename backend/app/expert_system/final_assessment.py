"""
Final Assessment Generator

Replacement for adaptive_assessment.generate_final_assessment()
Uses the new symptom-based system for generating final assessment summaries.
"""

from typing import Dict, List, Any


def generate_final_assessment(normalized_payload: dict) -> dict:
    """
    Generate final assessment summary from normalized facts.
    
    Replacement for the old adaptive_assessment module.
    Creates a structured summary with patterns, evidence, uncertainty, and next steps.
    
    Args:
        normalized_payload: Dictionary with patient facts (symptoms, labs, risk factors, demographics)
    
    Returns:
        Dictionary with:
        - patterns_identified: List of clinical patterns found
        - evidence_summary: Summary of available evidence
        - uncertainty_notes: Notes about data gaps
        - next_steps: Recommended actions
    """
    # Extract key information
    has_cardinal_symptoms = _check_cardinal_symptoms(normalized_payload)
    has_lab_results = _check_lab_results(normalized_payload)
    has_risk_factors = _check_risk_factors(normalized_payload)
    age = normalized_payload.get('age', 0)
    
    # Identify patterns
    patterns = []
    if has_cardinal_symptoms:
        count = sum([
            bool(normalized_payload.get('frequent_urination') or normalized_payload.get('polyuria')),
            bool(normalized_payload.get('excessive_thirst') or normalized_payload.get('polydipsia')),
            bool(normalized_payload.get('excessive_hunger') or normalized_payload.get('polyphagia')),
        ])
        if count >= 3:
            patterns.append("Classic diabetes triad (3 Ps) present")
        elif count >= 2:
            patterns.append("Multiple cardinal symptoms present")
        else:
            patterns.append("At least one cardinal symptom present")
    
    # Check for emergency symptoms
    emergency_symptoms = _check_emergency_symptoms(normalized_payload)
    if emergency_symptoms:
        patterns.append(f"Emergency symptoms detected: {', '.join(emergency_symptoms)}")
    
    # Check for metabolic symptoms
    metabolic = []
    if normalized_payload.get('unexplained_weight_loss'):
        metabolic.append("weight loss")
    if normalized_payload.get('extreme_fatigue') or normalized_payload.get('fatigue'):
        metabolic.append("fatigue")
    if normalized_payload.get('blurred_vision'):
        metabolic.append("vision changes")
    if metabolic:
        patterns.append(f"Metabolic symptoms: {', '.join(metabolic)}")
    
    # Type indication
    if age and age < 30 and normalized_payload.get('unexplained_weight_loss'):
        patterns.append("Pattern suggests possible Type 1 diabetes (young age + weight loss)")
    elif age and age >= 45 and has_risk_factors:
        patterns.append("Pattern suggests possible Type 2 diabetes (age + risk factors)")
    
    if normalized_payload.get('currently_pregnant'):
        patterns.append("Gestational diabetes screening recommended")
    
    # Evidence summary
    evidence = []
    if has_lab_results:
        lab_names = []
        if 'fasting_glucose' in normalized_payload or 'fasting_plasma_glucose' in normalized_payload:
            lab_names.append("fasting glucose")
        if 'hba1c' in normalized_payload:
            lab_names.append("HbA1c")
        if 'random_plasma_glucose' in normalized_payload:
            lab_names.append("random glucose")
        if '2h_ogtt_75g' in normalized_payload:
            lab_names.append("OGTT")
        evidence.append(f"Laboratory results available: {', '.join(lab_names)}")
    else:
        evidence.append("Assessment based on symptoms only (no lab results)")
    
    if has_cardinal_symptoms:
        evidence.append("Cardinal diabetes symptoms reported")
    
    if has_risk_factors:
        risk_list = []
        if normalized_payload.get('family_history') or normalized_payload.get('family_history_diabetes'):
            risk_list.append("family history")
        if normalized_payload.get('obesity'):
            risk_list.append("obesity")
        if normalized_payload.get('sedentary_lifestyle') or normalized_payload.get('physical_activity_low'):
            risk_list.append("sedentary lifestyle")
        if normalized_payload.get('hypertension'):
            risk_list.append("hypertension")
        if normalized_payload.get('gestational_history'):
            risk_list.append("previous gestational diabetes")
        if risk_list:
            evidence.append(f"Risk factors: {', '.join(risk_list)}")
    
    # Uncertainty notes
    uncertainty = []
    if not has_lab_results:
        uncertainty.append("Laboratory testing recommended for definitive diagnosis")
    
    if not has_cardinal_symptoms and not has_lab_results:
        uncertainty.append("Limited clinical evidence - more information needed")
    
    if age == 0 or not age:
        uncertainty.append("Age not provided - affects risk assessment")
    
    # Next steps
    next_steps = []
    
    if emergency_symptoms:
        next_steps.append({
            "priority": "urgent",
            "action": "Seek immediate medical attention",
            "reason": "Emergency symptoms detected"
        })
    elif has_lab_results:
        # Has labs - next step is clinical follow-up
        next_steps.append({
            "priority": "high",
            "action": "Schedule appointment with healthcare provider",
            "reason": "Discuss laboratory results and symptoms"
        })
    else:
        # No labs - get them first
        next_steps.append({
            "priority": "high",
            "action": "Get laboratory testing",
            "reason": "Fasting glucose and HbA1c needed for definitive diagnosis"
        })
    
    if has_cardinal_symptoms or has_lab_results:
        next_steps.append({
            "priority": "medium",
            "action": "Lifestyle modifications",
            "reason": "Healthy diet, regular exercise, weight management"
        })
    
    next_steps.append({
        "priority": "medium",
        "action": "Monitor symptoms",
        "reason": "Track frequency and severity of symptoms"
    })
    
    if not has_risk_factors and not has_cardinal_symptoms and not has_lab_results:
        next_steps.append({
            "priority": "low",
            "action": "Regular screening",
            "reason": "Periodic health check-ups as preventive measure"
        })
    
    return {
        "patterns_identified": patterns if patterns else ["No clear diabetes patterns identified"],
        "evidence_summary": evidence if evidence else ["Insufficient evidence for assessment"],
        "uncertainty_notes": uncertainty if uncertainty else ["Assessment based on available data"],
        "next_steps": next_steps,
        "assessment_basis": "symptom-based" if not has_lab_results else "combined",
        "has_sufficient_data": has_cardinal_symptoms or has_lab_results,
    }


def _check_cardinal_symptoms(payload: dict) -> bool:
    """Check if any cardinal symptoms (3 Ps) are present."""
    return any([
        payload.get('frequent_urination'),
        payload.get('polyuria'),
        payload.get('excessive_thirst'),
        payload.get('polydipsia'),
        payload.get('excessive_hunger'),
        payload.get('polyphagia'),
    ])


def _check_lab_results(payload: dict) -> bool:
    """Check if any lab results are available."""
    return any([
        'fasting_glucose' in payload,
        'fasting_plasma_glucose' in payload,
        'hba1c' in payload,
        'random_plasma_glucose' in payload,
        '2h_ogtt_75g' in payload,
        'blood_glucose' in payload,
    ])


def _check_risk_factors(payload: dict) -> bool:
    """Check if any risk factors are present."""
    return any([
        payload.get('family_history'),
        payload.get('family_history_diabetes'),
        payload.get('obesity'),
        payload.get('sedentary_lifestyle'),
        payload.get('physical_activity_low'),
        payload.get('hypertension'),
        payload.get('high_cholesterol'),
        payload.get('gestational_history'),
        payload.get('pcos_history'),
        payload.get('ethnicity_high_risk'),
        payload.get('smoking'),
    ])


def _check_emergency_symptoms(payload: dict) -> List[str]:
    """Check for emergency symptoms that require immediate attention."""
    emergency = []
    
    if payload.get('vomiting'):
        emergency.append("vomiting")
    if payload.get('abdominal_pain'):
        emergency.append("abdominal pain")
    if payload.get('fruity_breath'):
        emergency.append("fruity breath")
    if payload.get('deep_rapid_breathing'):
        emergency.append("rapid breathing")
    if payload.get('confusion'):
        emergency.append("confusion")
    if payload.get('dizziness'):
        emergency.append("severe dizziness")
    
    # Check for very high glucose if available
    if payload.get('fasting_glucose', 0) >= 250 or payload.get('random_plasma_glucose', 0) >= 300:
        emergency.append("critically high glucose")
    
    return emergency
