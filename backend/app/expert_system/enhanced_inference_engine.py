"""
Enhanced Inference Engine

Unified, intelligent inference engine that works with flexible input
and provides comprehensive analysis including missing facts detection
and uncertainty assessment.
"""

from __future__ import annotations

from app.expert_system.confidence import rank_conclusions
from app.expert_system.fact_preparation import prepare_facts
from app.expert_system.grouped_forward_chaining import GroupedForwardChainer
from app.expert_system.missing_facts_detector import (
    detect_missing_facts,
    generate_suggested_questions,
)
from app.expert_system.recommendations import select_recommendation
from app.expert_system.rule_loading import RuleLoader
from app.expert_system.uncertainty_analysis import (
    analyze_uncertainty,
    assess_data_quality,
    generate_confidence_explanation,
)


# Diagnosis labels by conclusion key
DIAGNOSIS_BY_CONCLUSION = {
    "diabetes_confirmed": "Diabetes Mellitus (Confirmed)",
    "diabetes_likely": "Likely Diabetes Mellitus",
    "diabetes_possible": "Possible Signs of Diabetes",
    "prediabetes_possible": "Prediabetes (Impaired Glucose Regulation)",
    "prediabetes_high_risk": "Prediabetes — Act Early to Prevent Type 2",
    "classic_symptoms": "Suspected Diabetes (Classic Symptoms)",
    "symptom_only_screening": "Possible Early Signs of Diabetes",
    "neuropathy_screening": "Possible Nerve Signs (Diabetic Neuropathy)",
    "metabolic_syndrome": "Metabolic Syndrome Pattern — Heart Check Advised",
    "type2_risk_increased": "Elevated Type 2 Diabetes Risk — Preventive Action Recommended",
    "demographic_screening": "Routine Diabetes Screening Recommended",
    "type1_pattern_likely": "Pattern Consistent with Type 1 Diabetes — Urgent Specialist Referral",
    "type2_pattern_likely": "Pattern Consistent with Type 2 Diabetes",
    "gestational_diabetes_likely": "Possible Diabetes in Pregnancy (Gestational Pattern)",
    "healthy_normal": "Normal Glucose Regulation — No Diabetes Indication",
}


URGENCY_MAP = {
    "diabetes_confirmed": "urgent",
    "diabetes_likely": "urgent",
    "diabetes_possible": "soon",
    "prediabetes_possible": "routine",
    "prediabetes_high_risk": "soon",
    "classic_symptoms": "soon",
    "symptom_only_screening": "soon",
    "neuropathy_screening": "urgent",
    "metabolic_syndrome": "soon",
    "type2_risk_increased": "routine",
    "demographic_screening": "routine",
    "type1_pattern_likely": "urgent",
    "type2_pattern_likely": "soon",
    "gestational_diabetes_likely": "urgent",
    "healthy_normal": "routine",
}


TYPE_CONCLUSIONS = {
    "type1_pattern_likely": "Type 1",
    "type2_pattern_likely": "Type 2",
    "gestational_diabetes_likely": "Gestational",
}


PRESENCE_CONCLUSIONS = {
    "diabetes_confirmed",
    "diabetes_likely",
    "diabetes_possible",
    "classic_symptoms",
    "symptom_only_screening",
    "gestational_diabetes_likely",
}


TYPE_HEADLINE_EXCLUDED = {"type1_pattern_likely", "type2_pattern_likely"}
MIN_TYPE_CERTAINTY = 0.5
MIN_PRESENCE_CERTAINTY = 0.45


def run_enhanced_inference(payload: dict, rules: list) -> dict:
    """
    Enhanced inference engine that works with ANY combination of facts.
    
    This is the single entry point for all diagnostic assessments.
    It handles:
    - Flexible input (any facts provided)
    - Missing facts detection
    - Uncertainty analysis
    - Intelligent recommendations
    - Full reasoning transparency
    
    Args:
        payload: Dictionary of facts (symptoms, labs, demographics, etc.)
        rules: List of diagnostic rules
    
    Returns:
        Comprehensive assessment with conclusion, confidence, evidence,
        missing facts, recommendations, and full reasoning trace.
    """
    # 1. Prepare facts (minimal normalization)
    prepared_facts = prepare_facts(payload)
    
    # 2. Load and compile rules
    rule_loader = RuleLoader()
    load_result = rule_loader.load(rules)
    
    # 3. Run forward chaining inference
    grouped_chainer = GroupedForwardChainer()
    inference_result = grouped_chainer.run(prepared_facts.facts, load_result.rules)
    
    # 4. Rank conclusions by confidence
    ranked_conclusions = rank_conclusions(inference_result.conclusion_evidence)
    
    # 5. Resolve headline conclusion
    top_conclusion, certainty = _resolve_top_conclusion(ranked_conclusions)
    
    from app.expert_system.symptom_confidence import calculate_symptom_confidence
    symptoms_dict = {
        k: v for k, v in prepared_facts.facts.items()
        if v is True and k not in {"no_labs_available", "no_lab_values_available", "only_symptoms_available", "physical_activity_low"}
    }
    if symptoms_dict:
        symptom_conf = calculate_symptom_confidence(
            symptoms=symptoms_dict,
            age=prepared_facts.facts.get("age"),
        )
        symptom_score = float(symptom_conf.get("confidence_score", 0) or 0)
        if symptom_score > certainty:
            certainty = symptom_score
    
    # 6. Detect missing facts
    missing_facts_analysis = detect_missing_facts(
        provided_facts=prepared_facts.facts,
        inference_result={"all_conclusions": ranked_conclusions}
    )
    
    # 7. Analyze uncertainty
    uncertainty_analysis = analyze_uncertainty(
        inference_result={"all_conclusions": ranked_conclusions},
        provided_facts=prepared_facts.facts,
        missing_facts=missing_facts_analysis
    )
    
    # 8. Assess data quality
    data_quality = assess_data_quality(prepared_facts.facts)
    
    # 9. Resolve diagnosis label
    diagnosis = _resolve_diagnosis(top_conclusion, certainty, uncertainty_analysis)
    
    # 10. Resolve suspected type
    suspected_type = _resolve_suspected_type(ranked_conclusions, prepared_facts.facts)
    
    # 11. Resolve urgency
    urgency = _resolve_urgency(
        top_conclusion, 
        certainty, 
        prepared_facts.facts, 
        suspected_type
    )
    
    # 12. Generate recommendations
    recommendation = select_recommendation(
        top_conclusion=top_conclusion,
        recommendation_candidates=inference_result.recommendation_candidates,
    )
    
    # 13. Generate suggested questions
    suggested_questions = generate_suggested_questions(missing_facts_analysis)
    
    # 14. Generate confidence explanation
    confidence_explanation = generate_confidence_explanation(uncertainty_analysis, certainty)
    
    # 15. Serialize triggered rules
    triggered_rules = [_serialize_triggered_rule(row) for row in inference_result.fired_rules]
    
    # Build comprehensive response
    return {
        # Core conclusion
        "diagnosis": diagnosis,
        "certainty": round(certainty, 2),
        "confidence_level": uncertainty_analysis["level"],
        "confidence_explanation": confidence_explanation,
        
        # Evidence
        "facts": inference_result.final_facts,
        "supporting_evidence": _extract_supporting_evidence(ranked_conclusions, top_conclusion),
        "conflicting_evidence": _extract_conflicting_evidence(ranked_conclusions, top_conclusion),
        
        # Type and urgency
        "suspected_type": suspected_type,
        "urgency": urgency,
        
        # Recommendations
        "recommendation": recommendation,
        "recommendations": inference_result.recommendation_candidates,
        
        # Missing facts analysis
        "missing_facts": missing_facts_analysis,
        "suggested_questions": suggested_questions[:5],  # Top 5 most important
        "data_quality": data_quality,
        
        # Uncertainty analysis
        "uncertainty": uncertainty_analysis,
        
        # Additional conclusions
        "all_conclusions": ranked_conclusions,
        "triggered_rules": triggered_rules,
        
        # Full reasoning trace
        "explanation_trace": {
            "rule_loading": {
                "total_rules": len(rules),
                "compiled_rules": len(load_result.rules),
                "skipped_rules": load_result.skipped_rules,
            },
            "fact_preparation": {
                "prepared_facts": prepared_facts.trace,
            },
            "inference": {
                "iterations": inference_result.iterations,
                "stage_execution": inference_result.stage_execution,
                "fired_rules": inference_result.fired_rules,
                "rule_trace": inference_result.rule_trace,
                "derived_facts": inference_result.derived_facts,
            },
            "confidence_calculation": {
                "conclusion_scores": ranked_conclusions,
                "top_conclusion": top_conclusion,
                "certainty": round(certainty, 4),
            },
            "missing_facts_analysis": missing_facts_analysis,
            "uncertainty_analysis": uncertainty_analysis,
            "data_quality_assessment": data_quality,
        },
        
        # Assessment status
        "can_conclude": uncertainty_analysis["confidence_assessment"] == "sufficient",
        "needs_more_data": len(missing_facts_analysis.get("critical", [])) > 0,
    }


def _resolve_top_conclusion(ranked_conclusions: list[dict]) -> tuple[str, float]:
    """Get the top conclusion, handling type pattern exclusions."""
    if not ranked_conclusions:
        return "", 0.0
    
    top = ranked_conclusions[0]
    conclusion = str(top.get("conclusion") or "")
    certainty = float(top.get("certainty") or 0)
    
    # If top is a type pattern, check if there's a stronger presence conclusion
    if conclusion in TYPE_HEADLINE_EXCLUDED:
        for item in ranked_conclusions[1:]:
            item_conclusion = str(item.get("conclusion") or "")
            item_certainty = float(item.get("certainty") or 0)
            if item_conclusion in PRESENCE_CONCLUSIONS and item_certainty >= 0.3:
                return item_conclusion, item_certainty
    
    return conclusion, certainty


def _resolve_diagnosis(
    top_conclusion: str, 
    certainty: float, 
    uncertainty_analysis: dict
) -> str:
    """Resolve the final diagnosis label."""
    if not top_conclusion or certainty < 0.3:
        if certainty >= 0.60:
            return "Suspected Diabetes (Classic Symptoms)"
        elif certainty >= 0.40:
            return "Possible Early Signs of Diabetes"
        elif certainty >= 0.25:
            return "Elevated Diabetes Risk — Screening Recommended"
        return "Insufficient evidence for diabetes indication"
    
    if uncertainty_analysis["confidence_assessment"] == "insufficient":
        base_diagnosis = DIAGNOSIS_BY_CONCLUSION.get(
            top_conclusion, 
            "Possible diabetes-related pattern"
        )
        return f"{base_diagnosis} (Requires confirmation)"
    
    return DIAGNOSIS_BY_CONCLUSION.get(
        top_conclusion, 
        "No strong diabetes indication"
    )


def _resolve_suspected_type(ranked_conclusions: list[dict], facts: dict) -> dict | None:
    """Resolve diabetes type with clinical priors."""
    by_conclusion = {
        str(item.get("conclusion") or ""): float(item.get("certainty") or 0)
        for item in ranked_conclusions
    }
    
    # Check if there's enough presence evidence
    presence = max(
        (by_conclusion.get(name, 0.0) for name in PRESENCE_CONCLUSIONS),
        default=0.0,
    )
    if facts.get("diabetes_diagnostic_criterion_met") is True:
        presence = max(presence, 0.9)
    if presence < MIN_PRESENCE_CERTAINTY:
        return None
    
    type_note = (
        "Pattern match from provided data — not a final diagnosis. "
        "Clinical testing can confirm the type."
    )
    
    pregnant = facts.get("currently_pregnant") is True
    gdm = by_conclusion.get("gestational_diabetes_likely", 0.0)
    t1_raw = by_conclusion.get("type1_pattern_likely", 0.0)
    t2_raw = by_conclusion.get("type2_pattern_likely", 0.0)
    
    # Get clinical priors
    t1_prior, t2_prior = _type_priors(facts)
    t1 = t1_raw + t1_prior
    t2 = t2_raw + t2_prior
    
    # Gestational pattern during pregnancy
    if pregnant and gdm >= MIN_TYPE_CERTAINTY:
        return {
            "type": "Gestational",
            "certainty": round(min(max(gdm, presence * 0.85), 0.95), 4),
            "note": type_note,
        }
    
    # Mixed features (both strongly supported)
    if t1_raw >= MIN_TYPE_CERTAINTY and t2_raw >= MIN_TYPE_CERTAINTY and abs(t1_raw - t2_raw) < 0.08:
        return {
            "type": "Mixed features",
            "certainty": round(min(max(t1, t2) + 0.05, 0.95), 4),
            "note": "Signs could fit more than one type. Clinical tests can distinguish.",
        }
    
    # Commit to the leader
    leader_is_t1 = t1 >= t2
    leader = t1 if leader_is_t1 else t2
    label = "Type 1" if leader_is_t1 else "Type 2"
    
    # Only report if there's meaningful evidence
    if leader < 0.3:
        return None
    
    return {
        "type": label,
        "certainty": round(min(max(0.50, leader), 0.95), 4),
        "note": type_note,
    }


def _type_priors(facts: dict) -> tuple[float, float]:
    """Clinical priors for Type 1 vs Type 2."""
    t1, t2 = 0.0, 0.0
    
    age = facts.get("age")
    if isinstance(age, (int, float)):
        if age < 18:
            t1 += 0.20
        elif age <= 35:
            t1 += 0.10
        elif age >= 40:
            t2 += 0.10
    
    bmi = facts.get("bmi")
    if isinstance(bmi, (int, float)):
        if bmi >= 25:
            t2 += 0.15
        elif bmi < 23:
            t1 += 0.10
    
    if facts.get("rapid_onset") is True:
        t1 += 0.15
    elif facts.get("rapid_onset") is False:
        t2 += 0.10
    
    if facts.get("obesity") is True:
        t2 += 0.15
    
    if facts.get("family_history") is True:
        t2 += 0.10
    
    return round(min(t1, 0.45), 4), round(min(t2, 0.45), 4)


def _resolve_urgency(
    top_conclusion: str, 
    certainty: float, 
    facts: dict, 
    suspected_type: dict | None
) -> str:
    """Determine urgency level."""
    # Emergency overrides
    if facts.get("urgent_flag") or facts.get("crisis"):
        return "emergency"
    if facts.get("possible_dka") or facts.get("severe_hypoglycemia"):
        return "emergency"
    
    # Base urgency from conclusion
    base = URGENCY_MAP.get(top_conclusion, "routine")
    
    # Escalate for Type 1 patterns
    if suspected_type and suspected_type.get("type") == "Type 1" and base == "routine":
        base = "urgent"
    
    # Escalate for high certainty diabetes
    if certainty >= 0.85 and top_conclusion in ("diabetes_likely", "diabetes_confirmed"):
        return "urgent"
    
    return base


def _extract_supporting_evidence(
    ranked_conclusions: list[dict], 
    top_conclusion: str
) -> list[str]:
    """Extract supporting evidence for the top conclusion."""
    for item in ranked_conclusions:
        if item.get("conclusion") == top_conclusion:
            return item.get("supporting_evidence", [])
    return []


def _extract_conflicting_evidence(
    ranked_conclusions: list[dict], 
    top_conclusion: str
) -> list[str]:
    """Extract conflicting evidence for the top conclusion."""
    for item in ranked_conclusions:
        if item.get("conclusion") == top_conclusion:
            return item.get("conflicting_evidence", [])
    return []


def _serialize_triggered_rule(fired_rule: dict) -> dict:
    """Serialize a fired rule for output."""
    conclusions = [
        action.get("conclusion")
        for action in fired_rule.get("actions", [])
        if action.get("action_type") == "diagnosis_conclusion" and action.get("conclusion")
    ]
    
    return {
        "id": fired_rule.get("id"),
        "code": fired_rule.get("code"),
        "name": fired_rule.get("name"),
        "stage": fired_rule.get("stage"),
        "priority": fired_rule.get("priority"),
        "condition": fired_rule.get("condition"),
        "facts_used": fired_rule.get("facts_used") or [],
        "inferred_outputs": fired_rule.get("inferred_outputs") or [],
        "certainty_factor": fired_rule.get("certainty_factor"),
        "effective_certainty": fired_rule.get("effective_certainty"),
        "conclusions": conclusions,
    }
