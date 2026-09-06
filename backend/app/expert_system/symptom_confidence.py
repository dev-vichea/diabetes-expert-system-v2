"""
Symptom-Based Confidence Calculator

Enhanced confidence calculation specifically designed for symptom-only assessments.
Provides reliable confidence scores WITHOUT requiring lab results.
"""

from app.expert_system.symptom_database import (
    get_symptom_info,
    get_cardinal_symptoms,
    get_emergency_symptoms,
    calculate_symptom_score,
    get_type_indication,
)


def calculate_symptom_confidence(symptoms: dict, age: int = None, risk_factors: dict = None) -> dict:
    """
    Calculate confidence level for symptom-only assessment.
    
    Returns detailed confidence analysis including:
    - Overall confidence score (0-1)
    - Confidence level (low/moderate/high/very_high)
    - Factors contributing to confidence
    - Recommended actions
    """
    present_symptoms = [k for k, v in symptoms.items() if v is True]
    risk_factors = risk_factors or {}
    present_risks = [k for k, v in risk_factors.items() if v is True]
    
    # Convert age to int if it's a string
    if age is not None:
        try:
            age = int(age) if not isinstance(age, int) else age
        except (ValueError, TypeError):
            age = None
    
    # Distinct diabetes symptoms
    DIABETES_SPECIFIC_SYMPTOMS = {
        "frequent_urination", "polyuria",
        "excessive_thirst", "polydipsia",
        "excessive_hunger", "polyphagia", "increased_appetite",
        "weight_loss", "unexplained_weight_loss",
        "fatigue", "extreme_fatigue", "weakness",
        "blurred_vision", "difficulty_seeing",
        "tingling_hands_feet", "burning_sensation", "numbness",
        "slow_healing", "slow_healing_wounds",
        "acanthosis_nigricans", "frequent_infections", "recurrent_uti_yeast", "itchy_skin",
        "bed_wetting"
    }

    distinct_diabetes_syms = set()
    for s in present_symptoms:
        if s in DIABETES_SPECIFIC_SYMPTOMS:
            canonical = s
            if s == "polyuria": canonical = "frequent_urination"
            elif s == "polydipsia": canonical = "excessive_thirst"
            elif s in ("polyphagia", "increased_appetite"): canonical = "excessive_hunger"
            elif s == "unexplained_weight_loss": canonical = "weight_loss"
            elif s == "extreme_fatigue": canonical = "fatigue"
            elif s == "slow_healing_wounds": canonical = "slow_healing"
            distinct_diabetes_syms.add(canonical)

    d_count = len(distinct_diabetes_syms)

    categories = set()
    for s in present_symptoms:
        info = get_symptom_info(s)
        if info and info.get("category"):
            categories.add(info["category"])

    # Cardinal symptoms boost (3 Ps)
    cardinal_sets = [
        {"frequent_urination", "polyuria"},
        {"excessive_thirst", "polydipsia"},
        {"excessive_hunger", "polyphagia", "increased_appetite"},
    ]
    cardinal_count = sum(1 for cset in cardinal_sets if any(s in present_symptoms for s in cset))

    # Base confidence and cluster calibration
    if d_count == 0:
        base_confidence = 0.15 if present_symptoms else 0.05
        cardinal_boost = 0.0
        category_diversity = 0.0
    elif d_count == 1:
        # A single symptom alone is a screening signal, not a definitive cluster
        base_confidence = 0.28 if cardinal_count >= 1 else 0.22
        cardinal_boost = 0.0
        category_diversity = 0.0
    elif d_count == 2:
        # 2 symptoms: e.g. frequent urination + excessive thirst
        base_confidence = 0.45
        cardinal_boost = 0.12 if cardinal_count >= 2 else (0.05 if cardinal_count == 1 else 0.0)
        category_diversity = 0.0
    elif d_count == 3:
        # 3 symptoms: classic triad or multiple hallmarks
        base_confidence = 0.62
        cardinal_boost = 0.15 if cardinal_count >= 2 else 0.08
        category_diversity = 0.04
    else:
        # 4+ symptoms: strong multi-symptom alignment allows high scores (85% - 94%)
        base_confidence = 0.72 + min((d_count - 4) * 0.04, 0.12)
        cardinal_boost = 0.18 if cardinal_count >= 2 else 0.10
        category_diversity = 0.06

    # Risk factors boost
    risk_boost = min(len(present_risks) * 0.03, 0.08)

    # Age factor
    age_boost = 0.0
    if age:
        if age >= 60:
            age_boost = 0.05
        elif age >= 45:
            age_boost = 0.03
        elif age < 18 and cardinal_count >= 1:
            age_boost = 0.05

    # Acute emergency symptoms (ketosis/DKA)
    emergency_set = {"fruity_breath", "deep_rapid_breathing", "vomiting", "abdominal_pain"}
    emergency_count = sum(1 for s in present_symptoms if s in emergency_set)
    emergency_boost = min(emergency_count * 0.04, 0.08) if d_count >= 1 else 0.0

    # Calculate total confidence
    total_confidence = (
        base_confidence + cardinal_boost + category_diversity +
        risk_boost + age_boost + emergency_boost
    )
    if d_count <= 1:
        total_confidence = min(total_confidence, 0.38)
    else:
        total_confidence = min(total_confidence, 0.95)
    total_confidence = round(total_confidence, 2)
    
    # Determine confidence level
    if total_confidence >= 0.75:
        level = "very_high"
        level_description = "Very High Confidence"
        reliability = "The symptom pattern is very clear and consistent with diabetes."
    elif total_confidence >= 0.60:
        level = "high"
        level_description = "High Confidence"
        reliability = "Strong symptom pattern suggests diabetes is likely."
    elif total_confidence >= 0.45:
        level = "moderate"
        level_description = "Moderate Confidence"
        reliability = "Symptoms suggest possible diabetes. Medical evaluation recommended."
    elif total_confidence >= 0.30:
        level = "low_moderate"
        level_description = "Low-Moderate Confidence"
        reliability = "Some symptoms present. Screening may be appropriate."
    else:
        level = "low"
        level_description = "Low Confidence"
        reliability = "Limited symptom evidence. Consider routine screening based on risk factors."
    
    # Build contributing factors list
    factors = []
    
    if cardinal_count >= 3:
        factors.append({
            "factor": "All three cardinal symptoms present",
            "contribution": "very_high",
            "boost": cardinal_boost
        })
    elif cardinal_count >= 2:
        factors.append({
            "factor": f"{cardinal_count} cardinal symptoms present",
            "contribution": "high",
            "boost": cardinal_boost
        })
    elif cardinal_count >= 1:
        factors.append({
            "factor": f"{cardinal_count} cardinal symptom present",
            "contribution": "moderate",
            "boost": cardinal_boost
        })
    
    if emergency_count > 0:
        factors.append({
            "factor": f"{emergency_count} emergency symptom(s) detected",
            "contribution": "critical",
            "boost": emergency_boost
        })
    
    if len(present_symptoms) >= 5:
        factors.append({
            "factor": f"Multiple symptoms reported ({len(present_symptoms)} total)",
            "contribution": "moderate",
            "boost": 0.0  # Already in symptom_score
        })
    
    if len(present_risks) > 0:
        factors.append({
            "factor": f"{len(present_risks)} risk factor(s) present",
            "contribution": "moderate",
            "boost": risk_boost
        })
    
    if age:
        if age >= 45:
            factors.append({
                "factor": f"Age {age} (increased risk)",
                "contribution": "low",
                "boost": age_boost
            })
        elif age < 18:
            factors.append({
                "factor": f"Pediatric age {age} (higher concern)",
                "contribution": "moderate",
                "boost": age_boost
            })
    
    if len(categories) >= 3:
        factors.append({
            "factor": f"Symptoms across {len(categories)} categories",
            "contribution": "low",
            "boost": category_diversity
        })
    
    # Determine assessment quality
    if len(present_symptoms) >= 5 and cardinal_count >= 2:
        assessment_quality = "excellent"
        quality_note = "Comprehensive symptom data with clear pattern"
    elif len(present_symptoms) >= 3 and cardinal_count >= 1:
        assessment_quality = "good"
        quality_note = "Good symptom data for assessment"
    elif len(present_symptoms) >= 2:
        assessment_quality = "fair"
        quality_note = "Limited symptom data. More information would help"
    else:
        assessment_quality = "poor"
        quality_note = "Insufficient symptom data for reliable assessment"
    
    # Generate recommendations
    recommendations = _generate_confidence_based_recommendations(
        total_confidence, 
        cardinal_count, 
        emergency_count,
        len(present_symptoms)
    )
    
    return {
        "confidence_score": round(total_confidence, 3),
        "confidence_level": level,
        "confidence_description": level_description,
        "reliability_statement": reliability,
        "assessment_quality": assessment_quality,
        "quality_note": quality_note,
        "contributing_factors": factors,
        "breakdown": {
            "base_symptom_score": round(base_confidence, 3),
            "cardinal_boost": round(cardinal_boost, 3),
            "emergency_boost": round(emergency_boost, 3),
            "risk_factor_boost": round(risk_boost, 3),
            "age_boost": round(age_boost, 3),
            "category_diversity_boost": round(category_diversity, 3),
        },
        "symptom_counts": {
            "total_symptoms": len(present_symptoms),
            "cardinal_symptoms": cardinal_count,
            "emergency_symptoms": emergency_count,
            "risk_factors": len(present_risks),
        },
        "recommendations": recommendations,
    }


def _generate_confidence_based_recommendations(
    confidence: float,
    cardinal_count: int,
    emergency_count: int,
    total_symptoms: int
) -> list[str]:
    """Generate recommendations based on confidence level."""
    recommendations = []
    
    # Emergency first
    if emergency_count > 0:
        recommendations.append("URGENT: Seek immediate emergency medical care")
        recommendations.append("Emergency symptoms detected that require immediate attention")
        return recommendations
    
    # High confidence
    if confidence >= 0.70:
        recommendations.append("Schedule medical evaluation within 1-2 weeks")
        recommendations.append("Request diabetes blood test (fasting glucose or HbA1c)")
        if cardinal_count >= 3:
            recommendations.append("All classic diabetes symptoms present - testing strongly recommended")
    
    # Moderate-high confidence
    elif confidence >= 0.55:
        recommendations.append("Medical evaluation recommended soon")
        recommendations.append("Discuss diabetes screening with your doctor")
        if cardinal_count >= 2:
            recommendations.append("Multiple major symptoms warrant prompt evaluation")
    
    # Moderate confidence
    elif confidence >= 0.40:
        recommendations.append("Consider medical evaluation")
        recommendations.append("Diabetes screening may be appropriate")
        recommendations.append("Monitor symptoms and seek care if they worsen")
    
    # Low-moderate confidence
    elif confidence >= 0.25:
        recommendations.append("Consider diabetes screening at next checkup")
        if total_symptoms >= 2:
            recommendations.append("Track symptoms and discuss with doctor")
        recommendations.append("Maintain healthy lifestyle (diet, exercise)")
    
    # Low confidence
    else:
        recommendations.append("Routine health screening based on age and risk factors")
        recommendations.append("Maintain healthy lifestyle to prevent diabetes")
    
    return recommendations


def compare_with_lab_baseline(symptom_confidence: float) -> dict:
    """
    Compare symptom-only confidence with typical lab-confirmed confidence.
    Helps set expectations.
    """
    if symptom_confidence >= 0.75:
        comparison = "high"
        note = "This confidence level is comparable to having supporting lab evidence"
    elif symptom_confidence >= 0.60:
        comparison = "moderate_high"
        note = "Strong symptom pattern, though lab confirmation would increase certainty"
    elif symptom_confidence >= 0.45:
        comparison = "moderate"
        note = "Moderate confidence from symptoms alone. Lab tests would significantly help"
    else:
        comparison = "requires_more_data"
        note = "Current confidence is low. Either more symptoms or lab tests needed for reliable assessment"
    
    # Estimate what lab confirmation would add
    lab_boost_estimate = min(0.25, (1.0 - symptom_confidence) * 0.4)
    estimated_with_labs = min(symptom_confidence + lab_boost_estimate, 0.98)
    
    return {
        "comparison_level": comparison,
        "note": note,
        "current_confidence": symptom_confidence,
        "estimated_with_labs": round(estimated_with_labs, 3),
        "potential_improvement": round(lab_boost_estimate, 3),
    }


def get_confidence_explanation(confidence_data: dict) -> str:
    """
    Generate human-readable confidence explanation.
    """
    level = confidence_data["confidence_level"]
    score = confidence_data["confidence_score"]
    quality = confidence_data["assessment_quality"]
    
    # Build explanation
    explanation = f"Based on your symptoms, we have {confidence_data['confidence_description']} "
    explanation += f"({int(score * 100)}%) that diabetes may be present. "
    
    # Add quality note
    explanation += f"Assessment quality: {quality}. "
    explanation += confidence_data['quality_note'] + ". "
    
    # Add reliability
    explanation += confidence_data['reliability_statement']
    
    # Note about lab confirmation
    if score < 0.90:
        explanation += " Lab testing would provide additional confirmation."
    
    return explanation
