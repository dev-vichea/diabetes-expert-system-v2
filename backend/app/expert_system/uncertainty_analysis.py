"""
Uncertainty Analysis Module

Analyzes inference results to determine confidence levels,
identify conflicts, and assess the quality of conclusions.
"""

from __future__ import annotations

from app.utils.i18n import SUPPORTED_LANGUAGES, bilingual, text

UT = "uncertainty_texts"


def analyze_uncertainty(
    inference_result: dict,
    provided_facts: dict,
    missing_facts: dict
) -> dict:
    """
    Comprehensive uncertainty analysis.
    
    Returns:
        {
            "level": "low" | "moderate" | "high",
            "reasons": [...],
            "confidence_assessment": "sufficient" | "insufficient",
            "reliability_score": float  # 0-1
        }
    """
    reasons = []
    uncertainty_score = 0.0  # Higher = more uncertain
    
    # Get conclusions
    all_conclusions = inference_result.get("all_conclusions", [])
    top_conclusion = all_conclusions[0] if all_conclusions else {}
    second_conclusion = all_conclusions[1] if len(all_conclusions) > 1 else {}
    
    top_certainty = float(top_conclusion.get("certainty", 0))
    
    # Factor 1: Missing critical data
    critical_missing = missing_facts.get("critical", [])
    if critical_missing:
        uncertainty_score += 0.3
        reasons.append({
            "factor": "missing_critical_data",
            "description": text(UT, "factor.missing_critical_data", lang="en", count=len(critical_missing)),
            "description_km": text(UT, "factor.missing_critical_data", lang="km", count=len(critical_missing)),
            "impact": "high"
        })
    
    # Factor 2: Low completeness score
    completeness = missing_facts.get("completeness_score", 0)
    if completeness < 0.5:
        uncertainty_score += 0.2
        reasons.append({
            "factor": "low_data_completeness",
            "description": text(UT, "factor.low_data_completeness", lang="en", percent=int(completeness * 100)),
            "description_km": text(UT, "factor.low_data_completeness", lang="km", percent=int(completeness * 100)),
            "impact": "medium"
        })
    
    # Factor 3: No lab values (symptom-only assessment)
    has_labs = _has_lab_values(provided_facts)
    if not has_labs:
        uncertainty_score += 0.25
        reasons.append({
            "factor": "no_laboratory_confirmation",
            "description": text(UT, "factor.no_laboratory_confirmation", lang="en"),
            "description_km": text(UT, "factor.no_laboratory_confirmation", lang="km"),
            "impact": "high"
        })
    
    # Factor 4: Competing conclusions (close race)
    if second_conclusion:
        second_certainty = float(second_conclusion.get("certainty", 0))
        if top_certainty > 0 and second_certainty > 0:
            margin = top_certainty - second_certainty
            if margin < 0.15:
                uncertainty_score += 0.2
                reasons.append({
                    "factor": "competing_patterns",
                    "description": text(UT, "factor.competing_patterns", lang="en"),
                    "description_km": text(UT, "factor.competing_patterns", lang="km"),
                    "impact": "medium",
                    "details": {
                        "primary": top_conclusion.get("conclusion"),
                        "secondary": second_conclusion.get("conclusion"),
                        "margin": round(margin, 3)
                    }
                })
    
    # Factor 5: Low top conclusion certainty
    if top_certainty < 0.5:
        uncertainty_score += 0.2
        reasons.append({
            "factor": "low_conclusion_certainty",
            "description": text(UT, "factor.low_conclusion_certainty", lang="en", percent=int(top_certainty * 100)),
            "description_km": text(UT, "factor.low_conclusion_certainty", lang="km", percent=int(top_certainty * 100)),
            "impact": "high"
        })
    
    # Factor 6: Conflicting evidence
    conflicting = _count_conflicting_evidence(inference_result)
    if conflicting > 0:
        uncertainty_score += min(0.15, conflicting * 0.05)
        reasons.append({
            "factor": "conflicting_evidence",
            "description": text(UT, "factor.conflicting_evidence", lang="en", count=conflicting),
            "description_km": text(UT, "factor.conflicting_evidence", lang="km", count=conflicting),
            "impact": "low" if conflicting == 1 else "medium"
        })
    
    # Determine uncertainty level
    if uncertainty_score >= 0.6:
        level = "high"
    elif uncertainty_score >= 0.3:
        level = "moderate"
    else:
        level = "low"
    
    # Determine if we have sufficient confidence to conclude
    confidence_assessment = "sufficient" if (
        uncertainty_score < 0.5 and
        top_certainty >= 0.4 and
        len(critical_missing) == 0
    ) else "insufficient"
    
    # Calculate reliability score (inverse of uncertainty)
    reliability_score = max(0.0, min(1.0, 1.0 - uncertainty_score))
    
    return {
        "level": level,
        "reasons": reasons,
        "confidence_assessment": confidence_assessment,
        "reliability_score": round(reliability_score, 2),
        "uncertainty_score": round(uncertainty_score, 2)
    }


def generate_confidence_explanation(uncertainty: dict, top_certainty: float) -> dict:
    """
    Generate human-readable explanation of confidence level.
    Returns {"en": …, "km": …}.
    """
    level = uncertainty["level"]
    assessment = uncertainty["confidence_assessment"]

    if assessment == "sufficient" and level == "low":
        return bilingual(UT, "summary.sufficient_low", percent=int(top_certainty * 100))

    if assessment == "sufficient" and level == "moderate":
        return bilingual(UT, "summary.sufficient_moderate", percent=int(top_certainty * 100))

    if assessment == "insufficient":
        if not any(r["factor"] == "no_laboratory_confirmation" for r in uncertainty["reasons"]):
            return bilingual(UT, "summary.insufficient_no_labs")
        else:
            return bilingual(UT, "summary.insufficient_symptoms_only")

    return bilingual(UT, "summary.generic", level=level)


def _has_lab_values(facts: dict) -> bool:
    """Check if any lab values are present."""
    lab_fields = [
        "fasting_glucose", "fasting_plasma_glucose", "hba1c",
        "random_plasma_glucose", "blood_glucose", "2h_ogtt_75g"
    ]
    return any(facts.get(field) is not None for field in lab_fields)


def _count_conflicting_evidence(inference_result: dict) -> int:
    """Count pieces of conflicting evidence across all conclusions."""
    count = 0
    for conclusion in inference_result.get("all_conclusions", []):
        conflicting = conclusion.get("conflicting_evidence", [])
        if isinstance(conflicting, list):
            count += len(conflicting)
    return count


def assess_data_quality(provided_facts: dict) -> dict:
    """
    Assess the quality and completeness of provided data.
    """
    quality_score = 0.0
    issues = []
    
    # Check for essential demographics
    if provided_facts.get("age") is None:
        issues.append(text(UT, "quality.missing_age", lang="en"))
    else:
        quality_score += 0.2

    # Check for lab values
    has_labs = _has_lab_values(provided_facts)
    if has_labs:
        quality_score += 0.4
    else:
        issues.append(text(UT, "quality.no_labs", lang="en"))

    # Check for symptom information
    symptom_fields = ["frequent_urination", "excessive_thirst", "fatigue", "weight_loss"]
    symptom_count = sum(1 for field in symptom_fields if field in provided_facts)
    if symptom_count > 0:
        quality_score += min(0.2, symptom_count * 0.05)
    else:
        issues.append(text(UT, "quality.no_symptoms", lang="en"))
    
    # Check for risk factors
    risk_fields = ["family_history", "obesity", "bmi", "sedentary_lifestyle"]
    risk_count = sum(1 for field in risk_fields if provided_facts.get(field) is not None)
    if risk_count > 0:
        quality_score += min(0.2, risk_count * 0.05)
    
    quality_level = "high" if quality_score >= 0.7 else "moderate" if quality_score >= 0.4 else "low"

    return {
        "quality_level": quality_level,
        "quality_score": round(quality_score, 2),
        "issues": issues,
        "issues_km": [
            text(UT, key, lang="km") for key in [
                *(["quality.missing_age"] if provided_facts.get("age") is None else []),
                *([] if has_labs else ["quality.no_labs"]),
                *([] if symptom_count > 0 else ["quality.no_symptoms"]),
            ]
        ],
        "has_essential_data": provided_facts.get("age") is not None and (has_labs or symptom_count > 0)
    }
