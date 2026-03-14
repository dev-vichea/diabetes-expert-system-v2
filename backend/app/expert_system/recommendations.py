DEFAULT_RECOMMENDATIONS = {
    "diabetes_likely": "Schedule medical confirmation promptly and start a clinician-led diabetes management plan.",
    "diabetes_possible": "Repeat testing soon and consult a physician for confirmation.",
    "prediabetes_possible": "Begin lifestyle intervention and follow up for repeat metabolic testing.",
    "classic_symptoms": "Consult a clinician for diagnostic testing due to diabetes-related symptoms.",
    "no_strong_indication": "Maintain routine follow-up and healthy lifestyle habits.",
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
