from app.expert_system.confidence import rank_conclusions
from app.expert_system.fact_preparation import prepare_facts
from app.expert_system.grouped_forward_chaining import GroupedForwardChainer
from app.expert_system.recommendations import select_recommendation
from app.expert_system.rule_loading import RuleLoader


DIAGNOSIS_BY_CONCLUSION = {
    # ── Laboratory-confirmed diagnoses ──
    "diabetes_confirmed": "Diabetes Mellitus (Confirmed)",
    "diabetes_likely": "Likely Diabetes Mellitus",
    "diabetes_possible": "Possible Diabetes — Further Testing Needed",
    "prediabetes_possible": "Prediabetes (Impaired Glucose Regulation)",
    "prediabetes_high_risk": "Prediabetes — High Progression Risk",
    # ── Symptom-based assessments ──
    "classic_symptoms": "Suspected Diabetes (Classic Symptom Presentation)",
    "symptom_only_screening": "Symptom-Based Screening — Laboratory Confirmation Required",
    # ── Complication screening ──
    "neuropathy_screening": "Possible Diabetic Neuropathy — Neurological Evaluation Needed",
    "metabolic_syndrome": "Metabolic Syndrome Profile — Cardiovascular Risk Elevated",
    # ── Risk stratification ──
    "type2_risk_increased": "Elevated Type 2 Diabetes Risk — Preventive Action Recommended",
    "demographic_screening": "Routine Diabetes Screening Recommended",
    # ── Normal / reassurance ──
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
    "healthy_normal": "routine",
}


def run_inference(payload, rules):
    prepared_facts = prepare_facts(payload)

    rule_loader = RuleLoader()
    load_result = rule_loader.load(rules)

    grouped_chainer = GroupedForwardChainer()
    inference_result = grouped_chainer.run(prepared_facts.facts, load_result.rules)

    ranked_conclusions = rank_conclusions(inference_result.conclusion_evidence)
    top_conclusion, certainty = _resolve_top_conclusion(ranked_conclusions)

    diagnosis = _resolve_diagnosis(top_conclusion, certainty)
    urgency = _resolve_urgency(top_conclusion, certainty, inference_result.final_facts)
    recommendation = select_recommendation(
        top_conclusion=top_conclusion,
        recommendation_candidates=inference_result.recommendation_candidates,
    )

    triggered_rules = [_serialize_triggered_rule(row) for row in inference_result.fired_rules]

    return {
        "facts": inference_result.final_facts,
        "diagnosis": diagnosis,
        "certainty": round(certainty, 2),
        "urgency": urgency,
        "triggered_rules": triggered_rules,
        "recommendation": recommendation,
        "all_conclusions": ranked_conclusions,
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
            "recommendations": {
                "selected_recommendation": recommendation,
                "candidates": inference_result.recommendation_candidates,
            },
        },
    }


def _resolve_top_conclusion(ranked_conclusions: list[dict]) -> tuple[str, float]:
    if not ranked_conclusions:
        return "", 0.0

    top = ranked_conclusions[0]
    conclusion = str(top.get("conclusion") or "")
    certainty = float(top.get("certainty") or 0)
    return conclusion, certainty


def _resolve_diagnosis(top_conclusion: str, certainty: float) -> str:
    if not top_conclusion or certainty < 0.3:
        return "No strong diabetes indication"
    return DIAGNOSIS_BY_CONCLUSION.get(top_conclusion, "No strong diabetes indication")


def _resolve_urgency(top_conclusion: str, certainty: float, facts: dict) -> str:
    """Determine urgency: emergency > urgent > soon > routine."""
    # Emergency overrides everything
    if facts.get("urgent_flag"):
        return "emergency"
    if facts.get("possible_dka") or facts.get("severe_hypoglycemia") or facts.get("critical_hyperglycemia"):
        return "emergency"
    if facts.get("level3_hypoglycemia"):
        return "emergency"

    # Map-based urgency
    base = URGENCY_MAP.get(top_conclusion, "routine")

    # Certainty boost: very high certainty on diabetes conclusions → urgent
    if certainty >= 0.85 and top_conclusion in ("diabetes_likely", "diabetes_confirmed"):
        return "urgent"

    return base


def _serialize_triggered_rule(fired_rule: dict) -> dict:
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
        "certainty_contribution": fired_rule.get("effective_certainty"),
        "conclusions": conclusions,
    }
