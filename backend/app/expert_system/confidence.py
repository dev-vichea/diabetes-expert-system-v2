from dataclasses import dataclass


PRIORITY_WEIGHT = {
    "high": 1.0,
    "medium": 0.9,
    "low": 0.8,
}


@dataclass
class RankedConclusion:
    conclusion: str
    certainty: float
    supporting_rules: list[dict]


def get_priority_weight(priority: str) -> float:
    return PRIORITY_WEIGHT.get(str(priority or "").lower(), 0.9)


def combine_certainty(current: float, incoming: float) -> float:
    current = _clamp(current)
    incoming = _clamp(incoming)
    return _clamp(current + incoming * (1 - current))


def rank_conclusions(conclusion_evidence: list[dict]) -> list[dict]:
    scores = {}

    for evidence in conclusion_evidence:
        conclusion = str(evidence.get("conclusion", "")).strip()
        if not conclusion:
            continue

        if conclusion not in scores:
            scores[conclusion] = RankedConclusion(conclusion=conclusion, certainty=0.0, supporting_rules=[])

        ranked = scores[conclusion]
        ranked.certainty = combine_certainty(ranked.certainty, float(evidence.get("effective_certainty", 0)))
        ranked.supporting_rules.append(
            {
                "rule_id": evidence.get("rule_id"),
                "rule_name": evidence.get("rule_name"),
                "priority": evidence.get("priority"),
                "certainty_factor": evidence.get("certainty_factor"),
                "effective_certainty": round(float(evidence.get("effective_certainty", 0)), 4),
            }
        )

    ordered = sorted(scores.values(), key=lambda item: item.certainty, reverse=True)
    return [
        {
            "conclusion": item.conclusion,
            "certainty": round(item.certainty, 4),
            "supporting_rules": item.supporting_rules,
        }
        for item in ordered
    ]


def calibrate_conclusion_certainty(top_conclusion: str, raw_certainty: float, facts: dict) -> dict:
    """Calibrate rule certainty from independent evidence agreement.

    The result is an evidence-agreement score, not a statistical probability
    of disease. Diagnostic thresholds receive stronger support when separate
    assays agree and are capped when confirmation is still needed.
    """
    facts = facts if isinstance(facts, dict) else {}
    raw = _clamp(float(raw_certainty or 0))
    conclusion = str(top_conclusion or "")

    def number(*keys):
        for key in keys:
            value = facts.get(key)
            try:
                if value is not None:
                    return float(value)
            except (TypeError, ValueError):
                continue
        return None

    fasting = number("fasting_glucose")
    hba1c = number("hba1c")
    ogtt = number("2h_ogtt_75g", "fact_2h_ogtt_75g", "two_hour_ogtt_75g")
    one_hour_ogtt = number("one_hour_ogtt_75g")
    random_glucose = number("random_plasma_glucose")
    classic = facts.get("classic_hyperglycemia_symptoms") is True

    diabetes_evidence = []
    if fasting is not None and fasting >= 126:
        diabetes_evidence.append("fasting_glucose")
    if hba1c is not None and hba1c >= 6.5:
        diabetes_evidence.append("hba1c")
    if ogtt is not None and ogtt >= 200:
        diabetes_evidence.append("2h_ogtt_75g")
    if random_glucose is not None and random_glucose >= 200 and classic:
        diabetes_evidence.append("random_glucose_with_classic_symptoms")

    prediabetes_evidence = []
    if fasting is not None and 100 <= fasting < 126:
        prediabetes_evidence.append("fasting_glucose")
    if hba1c is not None and 5.7 <= hba1c < 6.5:
        prediabetes_evidence.append("hba1c")
    if ogtt is not None and 140 <= ogtt < 200:
        prediabetes_evidence.append("2h_ogtt_75g")

    normal_evidence = []
    if fasting is not None and 70 <= fasting < 100:
        normal_evidence.append("fasting_glucose")
    if hba1c is not None and hba1c < 5.7:
        normal_evidence.append("hba1c")
    if ogtt is not None and ogtt < 140:
        normal_evidence.append("2h_ogtt_75g")

    score = raw
    status = "rule_supported" if raw > 0 else "insufficient"
    evidence = []
    limiting_factors = []

    if conclusion == "gestational_diabetes_likely":
        pregnancy_evidence = []
        if facts.get("currently_pregnant") is True:
            if fasting is not None and fasting >= 92:
                pregnancy_evidence.append("pregnancy_fasting_glucose")
            if one_hour_ogtt is not None and one_hour_ogtt >= 180:
                pregnancy_evidence.append("pregnancy_one_hour_75g_ogtt")
            if ogtt is not None and ogtt >= 153:
                pregnancy_evidence.append("pregnancy_two_hour_75g_ogtt")
        evidence = pregnancy_evidence
        if evidence:
            score = min(max(raw, 0.9), 0.95)
            status = "pregnancy_criterion_met"
        else:
            score = min(raw, 0.65)
            status = "limited"
            limiting_factors.append("no_pregnancy_specific_glucose_criterion")
    elif conclusion in {"diabetes_confirmed", "diabetes_likely"}:
        evidence = diabetes_evidence
        if facts.get("discordant_glycemic_tests") is True:
            score = min(raw, 0.76)
            status = "discordant"
            limiting_factors.append("conflicting_lab_categories")
        elif "random_glucose_with_classic_symptoms" in evidence:
            score = min(max(raw, 0.94), 0.97)
            status = "corroborated"
        elif len(evidence) >= 2:
            score = min(max(raw, 0.95), 0.98)
            status = "corroborated"
        elif len(evidence) == 1:
            score = min(raw, 0.82)
            status = "confirmation_needed"
            limiting_factors.append("single_diabetes_range_measure")
    elif conclusion == "prediabetes_possible":
        evidence = prediabetes_evidence
        if len(evidence) >= 2:
            score = min(max(raw, 0.88), 0.94)
            status = "corroborated"
        elif len(evidence) == 1:
            score = min(raw, 0.78)
            status = "confirmation_needed"
            limiting_factors.append("single_prediabetes_range_measure")
    elif conclusion == "healthy_normal":
        evidence = normal_evidence
        if len(evidence) >= 2 and not classic:
            score = min(max(raw, 0.85), 0.92)
            status = "corroborated"
        else:
            score = min(raw, 0.68)
            status = "limited"
            limiting_factors.append("limited_normal_evidence")
    elif conclusion in {"classic_symptoms", "symptom_only_screening"}:
        score = min(raw, 0.72)
        status = "screening_only"
        limiting_factors.append("no_laboratory_confirmation")
    elif conclusion in {"type2_risk_increased", "demographic_screening"}:
        score = min(raw, 0.65)
        status = "risk_screening"
        limiting_factors.append("risk_factors_are_not_diagnostic")

    return {
        "method": "evidence_agreement_v1",
        "raw_rule_score": round(raw, 4),
        "calibrated_score": round(_clamp(score), 4),
        "status": status,
        "independent_evidence_count": len(evidence),
        "evidence": evidence,
        "limiting_factors": limiting_factors,
        "requires_confirmation": status in {"confirmation_needed", "discordant", "screening_only"},
        "meaning": "Evidence agreement score; not measured clinical accuracy or disease probability.",
    }


def _clamp(value: float) -> float:
    if value < 0:
        return 0.0
    if value > 1:
        return 1.0
    return value
