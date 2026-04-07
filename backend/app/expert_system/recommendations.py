DEFAULT_RECOMMENDATIONS = {
    "diabetes_confirmed": (
        "Diabetes confirmed by concordant laboratory criteria. "
        "Please schedule an appointment with your physician within 1–2 weeks for: "
        "(1) Individualized HbA1c target setting. "
        "(2) First-line therapy initiation (typically metformin). "
        "(3) Retinal screening referral. "
        "(4) Comprehensive foot examination. "
        "(5) Lipid panel and cardiovascular risk assessment. "
        "(6) Diabetes self-management education enrollment."
    ),
    "diabetes_likely": (
        "Your test results are consistent with diabetes. "
        "A confirmatory test is recommended unless you have unequivocal hyperglycemia symptoms. "
        "Please see your healthcare provider within 1–2 weeks for confirmation and treatment planning."
    ),
    "diabetes_possible": (
        "Some of your results suggest possible diabetes, but a definitive diagnosis requires additional testing. "
        "Please schedule a follow-up within 2–4 weeks for: "
        "(1) Fasting plasma glucose or HbA1c confirmation. "
        "(2) Complete metabolic panel if not already done."
    ),
    "prediabetes_possible": (
        "Your results fall in the prediabetes range. This is an important window for prevention. "
        "Evidence-based recommendations: "
        "(1) Aim for ≥7% body weight loss through diet and exercise. "
        "(2) At least 150 minutes per week of moderate physical activity (e.g., brisk walking). "
        "(3) Limit refined carbohydrates and added sugars. "
        "(4) Repeat HbA1c and fasting glucose in 3–6 months. "
        "(5) Consider enrollment in a Diabetes Prevention Program (DPP)."
    ),
    "prediabetes_high_risk": (
        "You have prediabetes combined with additional risk factors, putting you at high risk for progression to diabetes. "
        "Intensive intervention recommended: "
        "(1) Structured lifestyle modification program. "
        "(2) Target ≥7% weight loss. "
        "(3) ≥150 min/week moderate exercise. "
        "(4) Discuss metformin with your doctor for chemoprevention (especially if BMI ≥35 or age <60). "
        "(5) Repeat testing every 6 months."
    ),
    "classic_symptoms": (
        "You have classic diabetes symptoms (increased urination, excessive thirst, unexplained weight loss). "
        "These warrant urgent laboratory testing: "
        "(1) Fasting plasma glucose. "
        "(2) HbA1c. "
        "(3) Random plasma glucose if fasting not possible. "
        "Please see a healthcare provider within 1 week."
    ),
    "symptom_only_screening": (
        "You have diabetes-related symptoms but no laboratory data was available. "
        "Symptoms alone cannot confirm or rule out diabetes. "
        "Priority action: Obtain fasting glucose and HbA1c within 1 week for definitive assessment."
    ),
    "neuropathy_screening": (
        "Signs of possible neuropathy have been detected. "
        "This may indicate longstanding undiagnosed diabetes. Recommended evaluations: "
        "(1) Comprehensive foot exam with monofilament testing. "
        "(2) HbA1c and fasting glucose (if not already done). "
        "(3) Nerve conduction study if symptoms persist. "
        "(4) Please see your doctor within 2 weeks."
    ),
    "metabolic_syndrome": (
        "Your profile is consistent with metabolic syndrome — a cluster of conditions "
        "that significantly increase cardiovascular and diabetes risk. Recommendations: "
        "(1) Blood pressure monitoring and control (target <130/80 mmHg). "
        "(2) Lipid management (consider statin therapy if LDL elevated). "
        "(3) Weight management (target 5–10% reduction). "
        "(4) Regular physical activity. "
        "(5) Annual cardiovascular risk assessment."
    ),
    "type2_risk_increased": (
        "You have one or more risk factors for Type 2 diabetes. "
        "Preventive recommendations: "
        "(1) Maintain a healthy weight (BMI <25). "
        "(2) Exercise at least 150 minutes per week. "
        "(3) Follow a balanced diet rich in whole grains, vegetables, and lean proteins. "
        "(4) Routine diabetes screening every 3 years (or annually if prediabetes identified). "
        "(5) Discuss family history and personal risk with your healthcare provider."
    ),
    "demographic_screening": (
        "Based on your age and demographic profile, routine diabetes screening is recommended. "
        "Please schedule: Fasting glucose or HbA1c test. "
        "If results are normal, repeat every 3 years."
    ),
    "healthy_normal": (
        "Good news — your assessment shows no indication of diabetes or prediabetes at this time. "
        "To maintain your health: "
        "(1) Continue a balanced diet and regular physical activity. "
        "(2) Schedule routine health check-ups as recommended by your doctor. "
        "(3) If you develop new symptoms (excessive thirst, frequent urination, unexplained weight loss), "
        "seek medical evaluation promptly."
    ),
    "no_strong_indication": (
        "Your assessment did not reveal strong indicators of diabetes. "
        "Continue routine health monitoring and maintain a healthy lifestyle. "
        "If new symptoms develop, consult your healthcare provider."
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
