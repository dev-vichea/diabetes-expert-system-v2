"""Reasoning Service — Structured Explainable AI Reasoning for Assessment Results.

Takes the raw expert-system result (triggered rules, facts, certainty, etc.)
and builds a structured, explainable reasoning report that shows:
- Which rules matched and why
- Which patient findings supported each rule
- Primary, supporting, and conflicting evidence
- Patient-friendly AI-generated explanation
- Recommended next steps

IMPORTANT: This service does NOT replace the expert-system diagnosis logic.
The expert system remains responsible for calculating the result.
AI reasoning explains and summarizes the existing result.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


# ── Human-readable fact labels ──────────────────────────────────────────────────

FACT_LABELS = {
    # Symptoms
    "frequent_urination": "Frequent urination (polyuria)",
    "polyuria": "Frequent urination (polyuria)",
    "excessive_thirst": "Excessive thirst (polydipsia)",
    "polydipsia": "Excessive thirst (polydipsia)",
    "excessive_hunger": "Excessive hunger (polyphagia)",
    "polyphagia": "Excessive hunger (polyphagia)",
    "weight_loss": "Unexplained weight loss",
    "unexplained_weight_loss": "Unexplained weight loss",
    "fatigue": "Fatigue / tiredness",
    "blurred_vision": "Blurred vision",
    "slow_healing": "Slow-healing wounds",
    "tingling_hands_feet": "Tingling in hands/feet",
    "frequent_infections": "Frequent infections",
    "acanthosis_nigricans": "Dark skin patches (acanthosis nigricans)",
    "nausea": "Nausea",
    "vomiting": "Vomiting",
    "abdominal_pain": "Abdominal pain",
    "sweating": "Excessive sweating",
    "shaking": "Shaking / tremors",
    "dizziness": "Dizziness",
    "fruity_breath": "Fruity-smelling breath",
    "deep_rapid_breathing": "Deep, rapid breathing",
    "bed_wetting": "Bed-wetting (children)",
    "irritability": "Irritability",
    "recurrent_uti_yeast": "Recurrent UTI / yeast infections",
    "dry_mouth": "Dry mouth",
    # Risk factors
    "family_history": "Family history of diabetes",
    "family_history_diabetes": "Family history of diabetes",
    "risk_family_history_diabetes": "Family history of diabetes",
    "risk_family_history": "Family history of diabetes",
    "obesity": "Obesity / overweight",
    "is_obese": "Obesity (BMI ≥ 30)",
    "sedentary_lifestyle": "Sedentary lifestyle",
    "physical_activity_low": "Low physical activity",
    "hypertension": "High blood pressure",
    "high_cholesterol": "High cholesterol",
    "gestational_history": "Previous gestational diabetes",
    "pcos_history": "Polycystic ovary syndrome (PCOS)",
    "ethnicity_high_risk": "High-risk ethnicity",
    "smoking": "Smoking",
    "currently_pregnant": "Currently pregnant",
    # Labs
    "fasting_glucose": "Fasting blood glucose",
    "fasting_plasma_glucose": "Fasting plasma glucose",
    "hba1c": "HbA1c (3-month average blood sugar)",
    "random_plasma_glucose": "Random blood glucose",
    "2h_ogtt_75g": "2-hour oral glucose tolerance test",
    "one_hour_ogtt_75g": "1-hour oral glucose tolerance test",
    "blood_glucose": "Blood glucose",
    # Demographics
    "age": "Patient age",
    "bmi": "Body mass index (BMI)",
    "waist_circumference": "Waist circumference",
    "weight_kg": "Body weight",
    # Derived flags
    "classic_hyperglycemia_symptoms": "Classic high blood sugar symptoms present",
    "hyperglycemia_present": "High blood sugar detected",
    "hypoglycemia_present": "Low blood sugar detected",
    "high_type2_risk_pattern": "High Type 2 diabetes risk pattern",
    "ketosis_signs_present": "Signs of ketosis (ketone buildup)",
    "catabolic_pattern": "Catabolic (breakdown) pattern",
    "type1_pattern_evidence": "Type 1 diabetes pattern evidence",
    "type2_pattern_evidence": "Type 2 diabetes pattern evidence",
    "mixed_type_features": "Mixed-type features",
    "urgent_flag": "Urgent clinical attention needed",
    "rapid_onset": "Rapid onset of symptoms",
    "no_lab_values_available": "No laboratory test results available",
    "only_symptoms_available": "Assessment based on symptoms only",
    "diabetes_diagnostic_criterion_met": "Diabetes diagnostic criterion met",
    "discordant_glycemic_tests": "Discordant glycemic test results",
    "repeat_testing_recommended": "Repeat testing recommended",
}

# ── Risk level classification ───────────────────────────────────────────────────

RISK_LEVEL_MAP = {
    "diabetes_confirmed": "high",
    "diabetes_likely": "high",
    "diabetes_possible": "moderate",
    "prediabetes_possible": "moderate",
    "prediabetes_high_risk": "moderate",
    "classic_symptoms": "moderate",
    "symptom_only_screening": "moderate",
    "neuropathy_screening": "moderate",
    "metabolic_syndrome": "moderate",
    "type2_risk_increased": "elevated",
    "demographic_screening": "low",
    "type1_pattern_likely": "high",
    "type2_pattern_likely": "high",
    "gestational_diabetes_likely": "high",
    "healthy_normal": "low",
}

# ── Condition descriptions ──────────────────────────────────────────────────────

CONDITION_DESCRIPTIONS = {
    "diabetes_confirmed": "Diabetes Mellitus — laboratory values meet diagnostic criteria.",
    "diabetes_likely": "Likely Diabetes — strong evidence from lab results and/or symptoms.",
    "diabetes_possible": "Possible Diabetes — some indicators present but not conclusive.",
    "prediabetes_possible": "Prediabetes (Impaired Glucose) — blood sugar above normal but below diabetes range.",
    "prediabetes_high_risk": "Prediabetes High Risk — lifestyle changes can prevent progression.",
    "classic_symptoms": "Classic Diabetes Symptoms — the 'three Ps' pattern present.",
    "symptom_only_screening": "Symptom-Based Screening — symptoms suggest further investigation.",
    "neuropathy_screening": "Nerve Symptom Pattern — possible diabetic neuropathy signs.",
    "metabolic_syndrome": "Metabolic Syndrome Pattern — cardiovascular risk factors cluster.",
    "type2_risk_increased": "Elevated Type 2 Risk — multiple risk factors identified.",
    "demographic_screening": "Routine Screening Recommended — based on age/demographics.",
    "type1_pattern_likely": "Type 1 Diabetes Pattern — consistent with autoimmune diabetes.",
    "type2_pattern_likely": "Type 2 Diabetes Pattern — consistent with insulin resistance.",
    "gestational_diabetes_likely": "Gestational Diabetes Pattern — pregnancy-related glucose elevation.",
    "healthy_normal": "Normal Glucose — no diabetes indication at this time.",
}


def _get_fact_label(fact_key: str) -> str:
    """Human-readable label for a fact key."""
    return FACT_LABELS.get(fact_key, fact_key.replace("_", " ").title())


def _classify_fact_value(fact_key: str, value) -> str:
    """Classify a fact value for display."""
    if isinstance(value, bool):
        return "Present" if value else "Absent"
    if isinstance(value, (int, float)):
        return str(value)
    return str(value) if value is not None else "Unknown"


class ReasoningService:
    """Builds structured, explainable reasoning from expert-system results."""

    def build_reasoning(self, result: dict, normalized_payload: dict | None = None) -> dict:
        """Build the complete structured reasoning report.

        Args:
            result: The enriched expert-system result from DiagnosisService.evaluate()
            normalized_payload: The normalized assessment payload (optional, extracted from result if not provided)

        Returns:
            Structured reasoning report with assessment, matched_rules, expert_result, reasoning, ai_explanation, and next_steps
        """
        facts = result.get("facts") or {}
        triggered_rules = result.get("triggered_rules") or []
        explanation = result.get("explanation") or {}
        key_findings = explanation.get("key_findings") or {}
        all_conclusions = result.get("all_conclusions") or []

        # Extract evidence from the payload/facts
        assessment = self._build_assessment(result, normalized_payload or facts)
        matched_rules = self._build_matched_rules(triggered_rules, facts)
        expert_result = self._build_expert_result(result, all_conclusions)
        reasoning = self._build_reasoning_analysis(
            triggered_rules=triggered_rules,
            facts=facts,
            result=result,
            matched_symptoms=key_findings.get("matched_symptoms") or result.get("matched_symptoms") or [],
            matched_risk_factors=key_findings.get("matched_risk_factors") or result.get("matched_risk_factors") or [],
        )
        ai_explanation = self._generate_ai_explanation(
            result=result,
            assessment=assessment,
            matched_rules=matched_rules,
            reasoning=reasoning,
        )
        next_steps = self._build_next_steps(result, assessment, reasoning)

        return {
            "assessment": assessment,
            "matched_rules": matched_rules,
            "expert_result": expert_result,
            "reasoning": reasoning,
            "ai_explanation": ai_explanation,
            "next_steps": next_steps,
        }

    def _build_assessment(self, result: dict, payload: dict) -> dict:
        """Extract patient assessment context from the result."""
        matched_symptoms = result.get("matched_symptoms") or []
        matched_risk_factors = result.get("matched_risk_factors") or []

        # Collect actual lab values
        labs = {}
        for lab_key in ("fasting_glucose", "fasting_plasma_glucose", "hba1c",
                        "2h_ogtt_75g", "one_hour_ogtt_75g", "random_plasma_glucose", "blood_glucose"):
            val = payload.get(lab_key)
            if val is not None and val != "" and not isinstance(val, bool):
                labs[lab_key] = {
                    "label": _get_fact_label(lab_key),
                    "value": val,
                    "unit": "%" if lab_key == "hba1c" else "mg/dL",
                }

        # Collect demographic info
        demographics = {}
        for demo_key in ("age", "bmi", "waist_circumference", "weight_kg"):
            val = payload.get(demo_key)
            if val is not None and val != "":
                demographics[demo_key] = {
                    "label": _get_fact_label(demo_key),
                    "value": val,
                }

        return {
            "symptoms": [
                {"key": s, "label": s, "present": True}
                for s in matched_symptoms
            ],
            "risk_factors": [
                {"key": r, "label": r, "present": True}
                for r in matched_risk_factors
            ],
            "lab_results": labs,
            "demographics": demographics,
            "has_lab_evidence": bool(labs),
            "has_symptoms": bool(matched_symptoms),
            "has_risk_factors": bool(matched_risk_factors),
            "evidence_basis": (
                "combined" if labs and matched_symptoms else
                "lab_only" if labs else
                "symptom_only" if matched_symptoms else
                "risk_only" if matched_risk_factors else
                "insufficient"
            ),
        }

    def _build_matched_rules(self, triggered_rules: list, facts: dict) -> list[dict]:
        """Build structured matched rules with evidence details."""
        rules = []
        for rule in triggered_rules:
            facts_used = rule.get("facts_used") or []
            matched_evidence = []
            missing_evidence = []

            for item in facts_used:
                if isinstance(item, dict):
                    fact_key = item.get("fact_key") or item.get("fact") or ""
                    fact_value = item.get("value")
                    if fact_value is None:
                        fact_value = facts.get(fact_key)
                else:
                    fact_key = str(item)
                    fact_value = facts.get(fact_key)

                if not fact_key:
                    continue

                if fact_value is not None and fact_value != "" and fact_value is not False:
                    matched_evidence.append({
                        "fact": fact_key,
                        "label": _get_fact_label(fact_key),
                        "value": _classify_fact_value(fact_key, fact_value),
                        "status": "matched",
                    })
                else:
                    missing_evidence.append({
                        "fact": fact_key,
                        "label": _get_fact_label(fact_key),
                        "value": _classify_fact_value(fact_key, fact_value),
                        "status": "missing",
                    })

            certainty_factor = rule.get("effective_certainty") or rule.get("certainty_factor") or 0

            rules.append({
                "rule_id": rule.get("id") or rule.get("code") or "",
                "rule_code": rule.get("code") or "",
                "rule_name": rule.get("name") or "Unknown Rule",
                "description": rule.get("description") or "",
                "explanation": rule.get("explanation") or "",
                "stage": rule.get("stage") or "",
                "matched_evidence": matched_evidence,
                "missing_evidence": missing_evidence,
                "certainty_factor": round(float(certainty_factor), 4) if certainty_factor else 0,
                "conclusions": rule.get("conclusions") or [],
                "evidence_strength": (
                    "strong" if len(matched_evidence) >= 3 else
                    "moderate" if len(matched_evidence) >= 2 else
                    "weak" if len(matched_evidence) >= 1 else
                    "none"
                ),
            })

        # Sort by certainty factor descending
        rules.sort(key=lambda r: r["certainty_factor"], reverse=True)
        return rules

    def _build_expert_result(self, result: dict, all_conclusions: list) -> dict:
        """Build the expert system result summary."""
        diagnosis = result.get("diagnosis") or ""
        certainty = float(result.get("certainty") or 0)
        urgency = result.get("urgency") or "routine"
        suspected_type = result.get("suspected_type")

        # Determine the top conclusion key
        top_conclusion = ""
        if all_conclusions:
            top_conclusion = str(all_conclusions[0].get("conclusion") or "")

        risk_level = RISK_LEVEL_MAP.get(top_conclusion, "unknown")
        condition_description = CONDITION_DESCRIPTIONS.get(top_conclusion, "")

        return {
            "condition": diagnosis,
            "condition_key": top_conclusion,
            "condition_description": condition_description,
            "risk_level": risk_level,
            "certainty_factor": round(certainty, 4),
            "certainty_percent": max(0, min(100, round(certainty * 100 if certainty <= 1 else certainty))),
            "urgency": urgency,
            "suspected_type": suspected_type,
            "all_conclusions": [
                {
                    "conclusion": c.get("conclusion"),
                    "certainty": round(float(c.get("certainty") or 0), 4),
                    "supporting_rules": c.get("supporting_rules") or [],
                }
                for c in (all_conclusions or [])
            ],
        }

    def _build_reasoning_analysis(
        self,
        *,
        triggered_rules: list,
        facts: dict,
        result: dict,
        matched_symptoms: list,
        matched_risk_factors: list,
    ) -> dict:
        """Build the reasoning analysis with evidence classification."""
        primary_evidence = []
        supporting_evidence = []
        conflicting_evidence = []

        # Classify lab evidence
        lab_keys = {
            "fasting_glucose", "fasting_plasma_glucose", "hba1c",
            "2h_ogtt_75g", "random_plasma_glucose", "blood_glucose",
        }
        for lab_key in lab_keys:
            val = facts.get(lab_key)
            if val is not None and not isinstance(val, bool):
                primary_evidence.append({
                    "type": "lab_result",
                    "key": lab_key,
                    "label": _get_fact_label(lab_key),
                    "value": str(val),
                    "significance": self._assess_lab_significance(lab_key, val),
                })

        # Classify symptom evidence
        for symptom in matched_symptoms:
            fact_key = symptom.lower().replace(" ", "_")
            primary_evidence.append({
                "type": "symptom",
                "key": fact_key,
                "label": symptom,
                "value": "Present",
                "significance": "Cardinal diabetes symptom" if fact_key in {
                    "frequent_urination", "polyuria", "excessive_thirst",
                    "polydipsia", "excessive_hunger", "polyphagia",
                    "weight_loss", "unexplained_weight_loss",
                } else "Supporting symptom",
            })

        # Classify risk factor evidence
        for risk in matched_risk_factors:
            supporting_evidence.append({
                "type": "risk_factor",
                "key": risk.lower().replace(" ", "_"),
                "label": risk,
                "value": "Present",
                "significance": "Modifiable risk factor" if risk.lower() in {
                    "obesity", "sedentary lifestyle", "smoking", "high cholesterol",
                } else "Non-modifiable risk factor",
            })

        # Detect conflicting evidence
        certainty = float(result.get("certainty") or 0)
        if facts.get("discordant_glycemic_tests"):
            conflicting_evidence.append({
                "type": "discordance",
                "label": "Discordant glycemic tests",
                "detail": "Different glucose tests give conflicting results. Repeat testing is recommended.",
            })

        # Normal labs with symptoms present
        has_normal_labs = False
        fpg = facts.get("fasting_glucose") or facts.get("fasting_plasma_glucose")
        hba1c = facts.get("hba1c")
        if fpg is not None and not isinstance(fpg, bool):
            try:
                if float(fpg) < 100:
                    has_normal_labs = True
            except (TypeError, ValueError):
                pass
        if hba1c is not None and not isinstance(hba1c, bool):
            try:
                if float(hba1c) < 5.7:
                    has_normal_labs = True
            except (TypeError, ValueError):
                pass

        if has_normal_labs and matched_symptoms:
            conflicting_evidence.append({
                "type": "lab_symptom_mismatch",
                "label": "Normal labs but symptoms present",
                "detail": "Lab values are in normal range, but diabetes symptoms were reported. Symptoms can appear before blood sugar rises detectably.",
            })

        # Missing key evidence
        missing_evidence = []
        if not any(facts.get(k) is not None and not isinstance(facts.get(k), bool) for k in lab_keys):
            missing_evidence.append({
                "type": "missing_labs",
                "label": "No laboratory results available",
                "impact": "Without lab results, the assessment relies on symptoms and risk factors only. Lab confirmation is needed.",
            })
        if not matched_symptoms:
            missing_evidence.append({
                "type": "no_symptoms",
                "label": "No diabetes symptoms reported",
                "impact": "Absence of symptoms is reassuring but does not rule out diabetes (many cases are asymptomatic early on).",
            })

        # Build the narrative explanation
        explanation = self._build_reasoning_narrative(
            primary_evidence=primary_evidence,
            supporting_evidence=supporting_evidence,
            conflicting_evidence=conflicting_evidence,
            missing_evidence=missing_evidence,
            result=result,
        )

        return {
            "primary_evidence": primary_evidence,
            "supporting_evidence": supporting_evidence,
            "conflicting_evidence": conflicting_evidence,
            "missing_evidence": missing_evidence,
            "explanation": explanation,
            "evidence_summary": {
                "total_primary": len(primary_evidence),
                "total_supporting": len(supporting_evidence),
                "total_conflicting": len(conflicting_evidence),
                "total_missing": len(missing_evidence),
                "evidence_strength": (
                    "strong" if len(primary_evidence) >= 3 and not conflicting_evidence else
                    "moderate" if len(primary_evidence) >= 1 else
                    "weak" if supporting_evidence else
                    "insufficient"
                ),
            },
        }

    def _assess_lab_significance(self, lab_key: str, value) -> str:
        """Assess the clinical significance of a lab value."""
        try:
            v = float(value)
        except (TypeError, ValueError):
            return "Unable to assess"

        if lab_key in ("fasting_glucose", "fasting_plasma_glucose"):
            if v >= 126:
                return "Diabetic range (≥126 mg/dL) — meets diagnostic criterion"
            if v >= 100:
                return "Prediabetes range (100-125 mg/dL) — impaired fasting glucose"
            return "Normal range (<100 mg/dL)"

        if lab_key == "hba1c":
            if v >= 6.5:
                return "Diabetic range (≥6.5%) — meets diagnostic criterion"
            if v >= 5.7:
                return "Prediabetes range (5.7-6.4%)"
            return "Normal range (<5.7%)"

        if lab_key == "2h_ogtt_75g":
            if v >= 200:
                return "Diabetic range (≥200 mg/dL)"
            if v >= 140:
                return "Impaired glucose tolerance (140-199 mg/dL)"
            return "Normal range (<140 mg/dL)"

        if lab_key == "random_plasma_glucose":
            if v >= 200:
                return "Diabetic range with symptoms (≥200 mg/dL)"
            return "Below random glucose threshold"

        return f"Value: {v}"

    def _build_reasoning_narrative(
        self,
        *,
        primary_evidence: list,
        supporting_evidence: list,
        conflicting_evidence: list,
        missing_evidence: list,
        result: dict,
    ) -> str:
        """Build a structured narrative explaining the reasoning."""
        parts = []
        diagnosis = result.get("diagnosis") or "No strong indication"
        certainty = float(result.get("certainty") or 0)
        certainty_pct = max(0, min(100, round(certainty * 100 if certainty <= 1 else certainty)))

        # Opening
        parts.append(
            f"The expert system evaluated the available clinical evidence "
            f"and determined: \"{diagnosis}\" with {certainty_pct}% confidence."
        )

        # Primary evidence summary
        lab_evidence = [e for e in primary_evidence if e["type"] == "lab_result"]
        symptom_evidence = [e for e in primary_evidence if e["type"] == "symptom"]

        if lab_evidence:
            lab_parts = [f"{e['label']}: {e['value']} ({e['significance']})" for e in lab_evidence]
            parts.append(f"Laboratory findings: {'; '.join(lab_parts)}.")

        if symptom_evidence:
            symptom_names = [e["label"] for e in symptom_evidence]
            parts.append(f"Reported symptoms: {', '.join(symptom_names)}.")

        # Supporting evidence
        if supporting_evidence:
            risk_names = [e["label"] for e in supporting_evidence]
            parts.append(f"Risk factors present: {', '.join(risk_names)}.")

        # Conflicts
        if conflicting_evidence:
            for conflict in conflicting_evidence:
                parts.append(f"Note: {conflict['detail']}")

        # Missing evidence
        if missing_evidence:
            missing_labels = [e["label"] for e in missing_evidence]
            parts.append(
                f"Limitations: {'; '.join(e['impact'] for e in missing_evidence)}"
            )

        return " ".join(parts)

    def _generate_ai_explanation(
        self,
        *,
        result: dict,
        assessment: dict,
        matched_rules: list,
        reasoning: dict,
    ) -> dict:
        """Generate a patient-friendly AI explanation.

        IMPORTANT: This uses only the structured expert-system result and evidence.
        It does NOT invent symptoms, test results, medical history, or diagnoses.
        All claims are conservative and clearly distinguish screening from confirmed diagnosis.
        """
        diagnosis = result.get("diagnosis") or "Assessment complete"
        certainty = float(result.get("certainty") or 0)
        certainty_pct = max(0, min(100, round(certainty * 100 if certainty <= 1 else certainty)))
        suspected_type = result.get("suspected_type")
        urgency = result.get("urgency") or "routine"

        symptoms = [s["label"] for s in assessment.get("symptoms", [])]
        risk_factors = [r["label"] for r in assessment.get("risk_factors", [])]
        labs = assessment.get("lab_results", {})
        has_labs = assessment.get("has_lab_evidence", False)

        # What does this result mean?
        what_it_means = self._explain_what_it_means(
            diagnosis=diagnosis,
            certainty_pct=certainty_pct,
            has_labs=has_labs,
            urgency=urgency,
        )

        # Why was this result generated?
        why_generated = self._explain_why(
            symptoms=symptoms,
            risk_factors=risk_factors,
            labs=labs,
            matched_rules=matched_rules,
            reasoning=reasoning,
        )

        # Which findings were most relevant?
        most_relevant = self._explain_most_relevant(
            reasoning=reasoning,
            matched_rules=matched_rules,
        )

        # What does this result NOT mean?
        what_it_does_not_mean = self._explain_what_not(
            diagnosis=diagnosis,
            has_labs=has_labs,
            certainty_pct=certainty_pct,
        )

        return {
            "what_it_means": what_it_means,
            "why_generated": why_generated,
            "most_relevant_findings": most_relevant,
            "what_it_does_not_mean": what_it_does_not_mean,
            "disclaimer": (
                "This is a screening assessment generated by an expert clinical decision support system. "
                "It is not a confirmed medical diagnosis. Only a qualified healthcare professional can "
                "provide a definitive diagnosis after a thorough clinical evaluation."
            ),
        }

    def _explain_what_it_means(
        self, *, diagnosis: str, certainty_pct: int, has_labs: bool, urgency: str,
    ) -> str:
        diag = diagnosis.lower()

        if urgency in ("emergency", "urgent"):
            return (
                f"Your assessment shows '{diagnosis}' — some findings suggest you should "
                f"see a healthcare professional promptly. This does not mean you have a confirmed "
                f"emergency, but a doctor should evaluate your situation soon."
            )

        if "confirmed" in diag:
            return (
                f"Your laboratory results meet the standard diagnostic criteria for diabetes. "
                f"The expert system found {certainty_pct}% agreement among the clinical evidence. "
                f"This is a strong indication, but a doctor should confirm the finding and discuss next steps."
            )

        if "likely" in diag and certainty_pct >= 70:
            basis = "laboratory results and reported symptoms" if has_labs else "your reported symptoms"
            return (
                f"Based on {basis}, the pattern is consistent with diabetes "
                f"({certainty_pct}% confidence). While this is a meaningful signal, only a clinical "
                f"evaluation with confirmatory testing can establish a definitive diagnosis."
            )

        if "prediabetes" in diag:
            return (
                f"Your results suggest a prediabetes pattern — blood sugar levels are above normal "
                f"but not yet in the diabetes range. This is actually an opportunity: with lifestyle "
                f"changes, many people in this range can prevent or delay progression to type 2 diabetes."
            )

        if "possible" in diag or "early" in diag:
            return (
                f"Some signs in your assessment could indicate early or possible diabetes. "
                f"The confidence level is {certainty_pct}%, which means more information is needed. "
                f"A simple blood test can provide much clearer answers."
            )

        if "no strong" in diag or "normal" in diag or "healthy" in diag or "insufficient" in diag:
            return (
                f"Based on the available information, no strong diabetes indication was found. "
                f"This is reassuring, but it does not guarantee absence of diabetes — especially "
                f"if you have risk factors. Regular screening is still recommended."
            )

        if "elevated" in diag and "risk" in diag:
            return (
                f"Your risk profile is elevated for type 2 diabetes. This means you have "
                f"characteristics that make diabetes more likely in the future, but it does not "
                f"mean you have diabetes now. Preventive steps can significantly reduce this risk."
            )

        return (
            f"The assessment result is '{diagnosis}' with {certainty_pct}% confidence. "
            f"Please discuss this result with a healthcare professional who can explain "
            f"what it means for your specific situation."
        )

    def _explain_why(
        self,
        *,
        symptoms: list,
        risk_factors: list,
        labs: dict,
        matched_rules: list,
        reasoning: dict,
    ) -> str:
        parts = []
        parts.append("This result was generated because the expert system analyzed your assessment data and found:")

        if labs:
            lab_parts = []
            for key, info in labs.items():
                lab_parts.append(f"{info['label']}: {info['value']} {info['unit']}")
            parts.append(f"• Laboratory results: {', '.join(lab_parts)}")

        if symptoms:
            parts.append(f"• Reported symptoms: {', '.join(symptoms)}")

        if risk_factors:
            parts.append(f"• Risk factors: {', '.join(risk_factors)}")

        if matched_rules:
            rule_count = len(matched_rules)
            rule_word = "rule" if rule_count == 1 else "rules"
            parts.append(
                f"• {rule_count} clinical {rule_word} matched your data, "
                f"pointing toward the reported assessment."
            )

        if not labs and not symptoms and not risk_factors:
            parts.append("• Very limited information was available for this assessment.")

        return "\n".join(parts)

    def _explain_most_relevant(self, *, reasoning: dict, matched_rules: list) -> list[str]:
        """List the most relevant findings."""
        findings = []

        for evidence in reasoning.get("primary_evidence", [])[:5]:
            if evidence["type"] == "lab_result":
                findings.append(f"{evidence['label']}: {evidence['value']} — {evidence['significance']}")
            elif evidence["type"] == "symptom":
                findings.append(f"{evidence['label']} — {evidence['significance']}")

        for evidence in reasoning.get("supporting_evidence", [])[:3]:
            findings.append(f"{evidence['label']} (risk factor)")

        if not findings:
            findings.append("No strong individual findings — the assessment is based on the overall pattern of available data.")

        return findings

    def _explain_what_not(self, *, diagnosis: str, has_labs: bool, certainty_pct: int) -> list[str]:
        """Clarify what the result does NOT mean."""
        disclaimers = []

        disclaimers.append(
            "This is a screening result, not a confirmed medical diagnosis. "
            "Only a qualified healthcare professional can confirm a diagnosis."
        )

        if not has_labs:
            disclaimers.append(
                "Without laboratory blood test results, this assessment is based on "
                "symptoms and risk factors only. Blood tests are needed for a definitive evaluation."
            )

        if certainty_pct < 50:
            disclaimers.append(
                "The confidence level is below 50%, meaning the evidence is limited. "
                "This does not mean you definitely do or do not have diabetes."
            )

        if "normal" in diagnosis.lower() or "no strong" in diagnosis.lower():
            disclaimers.append(
                "A low-risk result does not guarantee the absence of diabetes. "
                "Type 2 diabetes can develop without obvious symptoms. "
                "Continue regular health checkups."
            )

        return disclaimers

    def _build_next_steps(self, result: dict, assessment: dict, reasoning: dict) -> list[dict]:
        """Build recommended next steps based on the assessment."""
        steps = []
        urgency = result.get("urgency") or "routine"
        diagnosis = (result.get("diagnosis") or "").lower()
        has_labs = assessment.get("has_lab_evidence", False)
        certainty = float(result.get("certainty") or 0)

        if urgency in ("emergency", "urgent"):
            steps.append({
                "priority": "urgent",
                "action": "Seek medical attention promptly",
                "reason": "Your assessment includes findings that need prompt clinical evaluation. Contact your healthcare provider or visit a clinic.",
                "icon": "alert",
            })

        if not has_labs:
            steps.append({
                "priority": "high",
                "action": "Get laboratory blood tests",
                "reason": "A fasting blood glucose test and/or HbA1c test will give a much clearer picture. These are simple, widely available blood tests.",
                "icon": "lab",
            })

        if "diabetes" in diagnosis or certainty >= 0.45:
            steps.append({
                "priority": "high",
                "action": "Schedule a clinical consultation",
                "reason": "Discuss these results with a healthcare professional who can provide personalized guidance and confirmatory testing.",
                "icon": "doctor",
            })

        if "prediabetes" in diagnosis or ("risk" in diagnosis and "elevated" in diagnosis):
            steps.append({
                "priority": "medium",
                "action": "Start preventive lifestyle changes",
                "reason": "Healthy eating, regular physical activity (150 min/week), and maintaining a healthy weight can significantly reduce diabetes risk.",
                "icon": "lifestyle",
            })

        steps.append({
            "priority": "routine",
            "action": "Continue regular health monitoring",
            "reason": "Regular checkups and periodic screening help catch changes early. Share this assessment with your healthcare team.",
            "icon": "monitor",
        })

        if assessment.get("has_risk_factors"):
            steps.append({
                "priority": "medium",
                "action": "Address modifiable risk factors",
                "reason": "Some of your identified risk factors can be improved through lifestyle changes. Ask your doctor about personalized recommendations.",
                "icon": "risk",
            })

        return {
            "steps": steps,
            "primary_action": steps[0]["action"] if steps else "Consult healthcare professional",
            "clinical_steps": [s for s in steps if s.get("priority") in ("urgent", "high")],
            "lifestyle_steps": [s for s in steps if s.get("icon") in ("lifestyle", "risk")],
            "monitoring_steps": [s for s in steps if s.get("icon") == "monitor"],
        }
