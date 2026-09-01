DEFAULT_RECOMMENDATIONS = {
    "diabetes_confirmed": (
        "Diabetes is confirmed by two matching tests. Book your doctor within 1–2 weeks: "
        "sugar targets, metformin first (usually), plus eye and foot checks."
    ),
    "diabetes_likely": (
        "Your results fit diabetes. A quick confirmatory test plus a doctor visit within 1–2 weeks "
        "settles it and starts treatment."
    ),
    "diabetes_possible": (
        "Some results suggest possible diabetes. A fasting glucose or HbA1c test within 2–4 weeks "
        "will settle it."
    ),
    "prediabetes_possible": (
        "Prediabetes — a warning stage you can reverse. Lose about 7% of body weight, move 150 minutes "
        "a week, cut sugary drinks, and re-test in 3–6 months."
    ),
    "prediabetes_high_risk": (
        "Prediabetes with extra risk factors — act now: structured lifestyle change, ask your doctor "
        "about metformin, and re-check every 6 months."
    ),
    "classic_symptoms": (
        "Your symptoms are the classic diabetes signs, but a blood test is still needed to confirm. "
        "Book one this week — it takes minutes."
    ),
    "symptom_only_screening": (
        "Your answers match common diabetes signs. A simple blood test (fasting glucose or HbA1c) "
        "will confirm — any lab, results usually the same day."
    ),
    "neuropathy_screening": (
        "Nerve signs with confirmed high sugar mean early diabetic neuropathy. You need a foot exam "
        "and steadier sugar control — see your doctor within 2 weeks."
    ),
    "metabolic_syndrome": (
        "Your blood pressure, weight and cholesterol pattern raise heart and diabetes risk. Move more, "
        "eat plainer, and treat blood pressure and cholesterol with your doctor."
    ),
    "type2_risk_increased": (
        "You carry type 2 risk factors. Keep a healthy weight, move 150 minutes a week, eat more whole "
        "foods, and screen every 1–3 years."
    ),
    "demographic_screening": (
        "Routine check: one fasting glucose or HbA1c test now — repeat every 3 years if normal."
    ),
    "healthy_normal": (
        "Good news — no signs of diabetes today. Keep your habits, re-screen routinely, and come back "
        "if new symptoms appear."
    ),
    "no_strong_indication": (
        "No strong diabetes signs in this assessment. Keep healthy routines and re-check if anything changes."
    ),
}


def select_recommendation(
    *,
    top_conclusion: str,
    recommendation_candidates: list[dict],
) -> str:
    if recommendation_candidates:
        ordered = sorted(
            recommendation_candidates,
            key=lambda item: (float(item.get("weight", 0)), int(item.get("priority_rank", 0))),
            reverse=True,
        )
        top_text = str(ordered[0].get("text", "")).strip()
        if top_text:
            return top_text

    if top_conclusion and top_conclusion in DEFAULT_RECOMMENDATIONS:
        return DEFAULT_RECOMMENDATIONS[top_conclusion]

    return DEFAULT_RECOMMENDATIONS["no_strong_indication"]
