from app.expert_system.confidence import rank_conclusions
from app.expert_system.fact_preparation import prepare_facts
from app.expert_system.grouped_forward_chaining import GroupedForwardChainer
from app.expert_system.patient_messaging import LAB_NORMAL_BUT_SYMPTOMS_NOTE
from app.expert_system.recommendations import select_recommendation
from app.expert_system.rule_loading import RuleLoader


DIAGNOSIS_BY_CONCLUSION = {
    # ── Laboratory-confirmed diagnoses ──
    "diabetes_confirmed": "Diabetes Mellitus (Confirmed)",
    "diabetes_likely": "Likely Diabetes Mellitus",
    "diabetes_possible": "Possible Signs of Diabetes",
    "prediabetes_possible": "Prediabetes (Impaired Glucose Regulation)",
    "prediabetes_high_risk": "Prediabetes — Act Early to Prevent Type 2",
    # ── Symptom-based assessments ──
    "classic_symptoms": "Suspected Diabetes (Classic Symptoms)",
    "symptom_only_screening": "Possible Early Signs of Diabetes",
    # ── Complication screening ──
    "neuropathy_screening": "Possible Nerve Signs (Diabetic Neuropathy)",
    "metabolic_syndrome": "Metabolic Syndrome Pattern — Heart Check Advised",
    # ── Risk stratification ──
    "type2_risk_increased": "Elevated Type 2 Diabetes Risk — Preventive Action Recommended",
    "demographic_screening": "Routine Diabetes Screening Recommended",
    # ── Type discrimination (T1D vs T2D vs GDM patterns) ──
    "type1_pattern_likely": "Pattern Consistent with Type 1 Diabetes — Urgent Specialist Referral",
    "type2_pattern_likely": "Pattern Consistent with Type 2 Diabetes",
    "gestational_diabetes_likely": "Possible Diabetes in Pregnancy (Gestational Pattern)",
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
    "type1_pattern_likely": "urgent",
    "type2_pattern_likely": "soon",
    "gestational_diabetes_likely": "urgent",
    "healthy_normal": "routine",
}

# Conclusions that carry a *type* signal (which kind of diabetes the evidence fits)
TYPE_CONCLUSIONS = {
    "type1_pattern_likely": "Type 1",
    "type2_pattern_likely": "Type 2",
    "gestational_diabetes_likely": "Gestational",
}

# Conclusions that establish diabetes *presence* (typing only matters if present)
PRESENCE_CONCLUSIONS = {
    "diabetes_confirmed",
    "diabetes_likely",
    "diabetes_possible",
    "classic_symptoms",
    "symptom_only_screening",
    "gestational_diabetes_likely",
}

# T1/T2 pattern conclusions carry the *type* dimension (shown via suspected_type);
# when one outranks the presence conclusion, the headline stays about presence.
TYPE_HEADLINE_EXCLUDED = {"type1_pattern_likely", "type2_pattern_likely"}

MIN_TYPE_CERTAINTY = 0.5
# Symptom-only screening evidence routinely lands ~0.45–0.5 — low enough that
# the classic 3 Ps still earn a type commit, high enough to skip noise.
MIN_PRESENCE_CERTAINTY = 0.45


def run_inference(payload, rules):
    prepared_facts = prepare_facts(payload)

    rule_loader = RuleLoader()
    load_result = rule_loader.load(rules)

    grouped_chainer = GroupedForwardChainer()
    inference_result = grouped_chainer.run(prepared_facts.facts, load_result.rules)

    ranked_conclusions = rank_conclusions(inference_result.conclusion_evidence)
    top_conclusion, certainty, context_note = _resolve_headline(ranked_conclusions)

    diagnosis = _resolve_diagnosis(top_conclusion, certainty)
    suspected_type = _resolve_suspected_type(ranked_conclusions, inference_result.final_facts)
    urgency = _resolve_urgency(top_conclusion, certainty, inference_result.final_facts, suspected_type)
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
        "suspected_type": suspected_type,
        "context_note": context_note,
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
                "context_note": context_note,
            },
            "recommendations": {
                "selected_recommendation": recommendation,
                "candidates": inference_result.recommendation_candidates,
            },
        },
    }


def _resolve_top_conclusion(ranked_conclusions: list[dict]) -> tuple[str, float]:
    """Headline conclusion: if a T1/T2 type pattern outranks the presence
    conclusion, keep the headline about *presence* — the type is reported
    separately via suspected_type (it is a pattern match, not a diagnosis)."""
    if not ranked_conclusions:
        return "", 0.0

    top = ranked_conclusions[0]
    conclusion = str(top.get("conclusion") or "")
    certainty = float(top.get("certainty") or 0)

    if conclusion in TYPE_HEADLINE_EXCLUDED:
        for item in ranked_conclusions[1:]:
            item_conclusion = str(item.get("conclusion") or "")
            item_certainty = float(item.get("certainty") or 0)
            if item_conclusion in PRESENCE_CONCLUSIONS and item_certainty >= 0.3:
                return item_conclusion, item_certainty

    return conclusion, certainty


def _resolve_headline(ranked_conclusions: list[dict]) -> tuple[str, float, str | None]:
    """Headline + optional context note.

    Reconciles lab evidence against symptom evidence so the report can never
    say both "no diabetes indication" and "diabetes signs present":
    - normal-lab conclusion cannot headline when real presence evidence exists
      (symptoms can appear *before* blood sugar rises — the note explains it);
    - a presence headline with normal labs keeps the reassuring lab context.
    """
    top_conclusion, certainty = _resolve_top_conclusion(ranked_conclusions)
    if not ranked_conclusions:
        return top_conclusion, certainty, None

    by_conclusion = {
        str(item.get("conclusion") or ""): float(item.get("certainty") or 0)
        for item in ranked_conclusions
    }

    best_presence, presence_certainty = None, 0.0
    for name in PRESENCE_CONCLUSIONS:
        value = by_conclusion.get(name, 0.0)
        if value > presence_certainty:
            best_presence, presence_certainty = name, value

    normal_certainty = by_conclusion.get("healthy_normal", 0.0)

    if top_conclusion == "healthy_normal" and best_presence and presence_certainty >= 0.3:
        return best_presence, presence_certainty, LAB_NORMAL_BUT_SYMPTOMS_NOTE
    if top_conclusion in PRESENCE_CONCLUSIONS and normal_certainty >= 0.5:
        return top_conclusion, certainty, LAB_NORMAL_BUT_SYMPTOMS_NOTE
    return top_conclusion, certainty, None


def _resolve_diagnosis(top_conclusion: str, certainty: float) -> str:
    if not top_conclusion or certainty < 0.3:
        return "No strong diabetes indication"
    return DIAGNOSIS_BY_CONCLUSION.get(top_conclusion, "No strong diabetes indication")


def _as_number(value) -> float | None:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _first_true_fact(facts: dict, *keys: str) -> bool:
    return any(facts.get(key) is True for key in keys)


def _type_priors(facts: dict) -> tuple[float, float]:
    """Clinical priors from the ADA/NIDDK discriminators between type 1 and
    type 2 diabetes. Small nudges (never proof) that let the engine commit to
    the more likely type even when rule evidence alone is thin:
    - type 1: children/young adults, sudden onset, unexplained weight loss,
      bed-wetting in children, ketosis signs, lean body
    - type 2: age 40+, overweight/BMI ≥ 25, slow build-up, insulin-resistance
      signs (acanthosis nigricans), strong family history, BP/cholesterol
    """
    t1 = 0.0
    t2 = 0.0

    age = _as_number(facts.get("age"))
    if age is not None:
        if age < 18:
            t1 += 0.20
        elif age <= 35:
            t1 += 0.10
        elif age >= 40:
            t2 += 0.10

    bmi = _as_number(facts.get("bmi"))
    if bmi is not None:
        if bmi >= 25:
            t2 += 0.15
        elif bmi < 23:
            t1 += 0.10

    if facts.get("rapid_onset") is True:
        t1 += 0.15
    elif facts.get("rapid_onset") is False:
        t2 += 0.10

    if _first_true_fact(facts, "weight_loss", "unexplained_weight_loss"):
        t1 += 0.10
    if facts.get("bed_wetting") is True:
        t1 += 0.10
    if _first_true_fact(facts, "fruity_breath", "deep_rapid_breathing"):
        t1 += 0.10
    if facts.get("acanthosis_nigricans") is True:
        t2 += 0.15
    if _first_true_fact(facts, "family_history_diabetes", "family_history", "risk_family_history_diabetes", "risk_family_history"):
        t2 += 0.10
    if _first_true_fact(facts, "hypertension", "high_cholesterol"):
        t2 += 0.05

    return round(min(t1, 0.45), 4), round(min(t2, 0.45), 4)


def _resolve_suspected_type(ranked_conclusions: list[dict], facts: dict) -> dict | None:
    """Resolve which diabetes TYPE the evidence pattern fits — always decisive.

    The engine never answers "Undetermined" for type 1 vs type 2: rule votes
    are combined with clinical priors and the leader is committed to with a
    displayed certainty. "Mixed features" is kept only for genuine, near-tied
    overlap, and a gestational pattern wins outright during pregnancy.
    """
    by_conclusion = {
        str(item.get("conclusion") or ""): float(item.get("certainty") or 0)
        for item in ranked_conclusions
    }

    # Presence gate: typing is meaningless without diabetes evidence
    presence = max(
        (by_conclusion.get(name, 0.0) for name in PRESENCE_CONCLUSIONS),
        default=0.0,
    )
    if facts.get("diabetes_diagnostic_criterion_met") is True:
        presence = max(presence, 0.9)
    if presence < MIN_PRESENCE_CERTAINTY:
        return None

    type_note = (
        "Pattern match from your answers — not a final diagnosis. "
        "A simple blood test can confirm the type, and the first steps are the same either way."
    )
    pregnant = facts.get("currently_pregnant") is True
    gdm = by_conclusion.get("gestational_diabetes_likely", 0.0)
    t1_raw = by_conclusion.get("type1_pattern_likely", 0.0)
    t2_raw = by_conclusion.get("type2_pattern_likely", 0.0)
    t1_prior, t2_prior = _type_priors(facts)
    t1 = t1_raw + t1_prior
    t2 = t2_raw + t2_prior

    # Gestational pattern wins outright during pregnancy
    if pregnant and gdm >= MIN_TYPE_CERTAINTY:
        return {
            "type": "Gestational",
            "certainty": round(min(max(gdm, presence * 0.85), 0.95), 4),
            "note": type_note,
            "matches": [{"type": "Gestational", "certainty": round(gdm, 4)}],
            "candidates": [{"type": "Gestational", "certainty": round(min(max(gdm, presence * 0.85), 0.95), 4)}],
        }

    # Genuine overlap: both patterns strongly supported and nearly tied
    if t1_raw >= MIN_TYPE_CERTAINTY and t2_raw >= MIN_TYPE_CERTAINTY and abs(t1_raw - t2_raw) < 0.08:
        matches = sorted(
            (
                {"type": "Type 1", "certainty": round(t1, 4)},
                {"type": "Type 2", "certainty": round(t2, 4)},
            ),
            key=lambda item: item["certainty"],
            reverse=True,
        )
        return {
            "type": "Mixed features",
            "certainty": round(min(max(t1, t2) + 0.05, 0.95), 4),
            "note": "Your signs could fit more than one type. The first steps are the same either way — see a doctor soon; simple tests can tell the types apart.",
            "matches": matches,
            "candidates": matches,
        }

    # Commit to the leader — with the margin folded into the displayed share
    leader_is_t1 = t1 >= t2
    leader = t1 if leader_is_t1 else t2
    trailing = t2 if leader_is_t1 else t1
    label = "Type 1" if leader_is_t1 else "Type 2"
    other_label = "Type 2" if leader_is_t1 else "Type 1"
    share = leader / (leader + trailing) if trailing > 0 else 1.0
    display = round(min(max(0.35 + 0.5 * leader + 0.15 * share, 0.52), 0.95), 4)

    candidates = [{"type": label, "certainty": display}]
    if trailing >= 0.25:
        candidates.append({"type": other_label, "certainty": round(min(trailing, 0.9), 4)})

    return {
        "type": label,
        "certainty": display,
        "note": type_note,
        "matches": [{"type": label, "certainty": round(leader, 4)}],
        "candidates": candidates,
    }


def _resolve_urgency(top_conclusion: str, certainty: float, facts: dict, suspected_type: dict | None = None) -> str:
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

    # Ketone signs without lab values: same-day care, never routine
    if facts.get("ketosis_signs_present") and base in ("routine", "soon"):
        base = "urgent"

    # A Type 1 pattern escalates fast (days, not years) — never let it sit at routine
    if (facts.get("type1_pattern_evidence") or (suspected_type and suspected_type.get("type") == "Type 1")) and base == "routine":
        base = "urgent"

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
