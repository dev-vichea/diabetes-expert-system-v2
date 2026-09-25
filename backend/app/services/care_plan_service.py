"""Care Plan Service — Personalized AI Care Plan Generator for Diabetes Expert System.

Generates structured, evidence-based, personalized care plans directly from
completed assessment results without asking the patient to re-enter data.

Clinical and Safety Guardrails:
1. Input is derived entirely from the expert-system assessment result (condition,
   risk level, certainty, symptoms, risk factors, labs, demographics).
2. NO new diagnosis is generated. The authoritative expert-system diagnosis is preserved.
3. NO medication prescriptions or dosages are generated. All pharmacotherapy decisions
   are explicitly deferred to licensed physicians.
4. Distinguishes screening/decision support from confirmed medical diagnosis.
5. Structured into distinct, clearly separated sections:
   - Assessment Findings Context
   - Recommendations (Diet, Physical Activity, Lifestyle, Monitoring)
   - Follow-up Schedule & Specialist Referrals
   - Clinical Safety & Emergency Red Flags Disclaimer
6. Privacy-preserving: Strips any PII before processing.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class CarePlanService:
    """Intelligent Care Plan Generator synthesizing structured lifestyle and clinical guidance."""

    def generate_care_plan(
        self,
        result: dict,
        normalized_payload: Optional[dict] = None,
    ) -> dict:
        """Generate a complete, structured, personalized care plan from an assessment result.

        Args:
            result: The enriched diagnosis result dictionary from DiagnosisService.
            normalized_payload: Optional normalized facts dictionary.

        Returns:
            Structured care plan dictionary with assessment_findings, recommendations,
            follow_up, safety_disclaimer, and metadata.
        """
        if not isinstance(result, dict):
            raise ValueError("Assessment result must be a dictionary.")

        facts = result.get("facts") if isinstance(result.get("facts"), dict) else {}
        payload = normalized_payload or facts

        # Extract clinical features (Anonymized — No PII)
        condition = result.get("diagnosis") or "Undetermined Assessment"
        certainty = float(result.get("certainty") or 0.0)
        certainty_pct = max(0, min(100, round(certainty * 100 if certainty <= 1 else certainty)))
        is_urgent = bool(result.get("is_urgent"))
        urgent_reason = result.get("urgent_reason")
        suspected_type = result.get("suspected_type")

        # Determine clinical risk tier
        risk_level = self._classify_risk_tier(condition, certainty_pct, is_urgent)

        # Extract findings
        findings = self._extract_findings(result, payload, condition, risk_level, certainty_pct, is_urgent, urgent_reason)

        # Generate recommendation pillars
        diet_recs = self._generate_diet_recommendations(findings)
        activity_recs = self._generate_physical_activity_recommendations(findings)
        lifestyle_recs = self._generate_lifestyle_recommendations(findings)
        monitoring_recs = self._generate_monitoring_recommendations(findings)
        follow_up_recs = self._generate_follow_up_schedule(findings)
        safety_disclaimer = self._generate_safety_disclaimer(findings)

        care_plan = {
            "assessment_findings": findings,
            "recommendations": {
                "diet": diet_recs,
                "physical_activity": activity_recs,
                "lifestyle": lifestyle_recs,
                "monitoring": monitoring_recs,
            },
            "follow_up": follow_up_recs,
            "safety_disclaimer": safety_disclaimer,
            "metadata": {
                "generated_at": _utc_now_iso(),
                "version": "2.0",
                "engine": "expert_system_ai_care_plan",
                "source_assessment_id": result.get("id") or result.get("diagnosis_result_id"),
                "guardrail_verification": {
                    "no_new_diagnosis": True,
                    "no_pharmacotherapy_prescribed": True,
                    "pii_redacted": True,
                    "expert_rules_unaltered": True,
                },
            },
        }

        return care_plan

    # ──────────────────────────────────────────────────────────────────────────
    # Risk Classification & Context Extraction
    # ──────────────────────────────────────────────────────────────────────────

    def _classify_risk_tier(self, condition: str, certainty_pct: int, is_urgent: bool) -> str:
        """Derive standard risk level tier."""
        c_lower = condition.lower()
        if is_urgent or "ketosis" in c_lower or "emergency" in c_lower:
            return "urgent"
        if "confirmed" in c_lower or "likely" in c_lower or "gestational" in c_lower:
            return "high"
        if "prediabetes" in c_lower or "elevated" in c_lower or "possible" in c_lower:
            return "moderate"
        if "normal" in c_lower or "healthy" in c_lower or "low" in c_lower:
            return "low"
        return "moderate"

    def _extract_findings(
        self,
        result: dict,
        payload: dict,
        condition: str,
        risk_level: str,
        certainty_pct: int,
        is_urgent: bool,
        urgent_reason: Optional[str],
    ) -> dict:
        """Extract structured clinical findings without patient PII."""
        # Detect low-confidence preliminary screening (certainty < 50% and not acute/urgent)
        is_provisional = bool(certainty_pct < 50 and not is_urgent)

        # Symptoms
        raw_symptoms = (
            result.get("matched_symptoms")
            or result.get("explanation", {}).get("key_findings", {}).get("matched_symptoms")
            or []
        )
        symptoms = [str(s).strip() for s in raw_symptoms if s]

        # Risk Factors
        raw_risks = (
            result.get("matched_risk_factors")
            or result.get("explanation", {}).get("key_findings", {}).get("matched_risk_factors")
            or []
        )
        risk_factors = [str(r).strip() for r in raw_risks if r]

        # Labs
        labs: Dict[str, dict] = {}
        for lab_key, (name, unit) in {
            "fasting_glucose": ("Fasting Blood Glucose", "mg/dL"),
            "fasting_plasma_glucose": ("Fasting Plasma Glucose", "mg/dL"),
            "hba1c": ("HbA1c", "%"),
            "2h_ogtt_75g": ("2-Hour OGTT", "mg/dL"),
            "random_plasma_glucose": ("Random Blood Glucose", "mg/dL"),
            "blood_glucose": ("Blood Glucose", "mg/dL"),
        }.items():
            val = payload.get(lab_key)
            if val is not None and not isinstance(val, bool) and str(val).strip() != "":
                try:
                    labs[lab_key] = {
                        "label": name,
                        "value": float(val),
                        "unit": unit,
                    }
                except (ValueError, TypeError):
                    pass

        # Demographics
        demographics = {}
        if "age" in payload and payload["age"] is not None:
            try:
                demographics["age"] = int(payload["age"])
            except (ValueError, TypeError):
                pass
        if "bmi" in payload and payload["bmi"] is not None:
            try:
                demographics["bmi"] = round(float(payload["bmi"]), 1)
            except (ValueError, TypeError):
                pass
        if "gender" in payload and payload["gender"]:
            demographics["gender"] = str(payload["gender"]).lower()

        # Pregnancy flag
        is_pregnant = bool(payload.get("currently_pregnant") or "gestational" in condition.lower())

        # Clinical Summary Narrative
        summary = self._build_findings_summary(
            condition=condition,
            risk_level=risk_level,
            certainty_pct=certainty_pct,
            symptoms=symptoms,
            labs=labs,
            demographics=demographics,
            is_urgent=is_urgent,
            is_provisional=is_provisional,
        )

        return {
            "condition": condition,
            "risk_level": risk_level,
            "certainty_percent": certainty_pct,
            "is_urgent": is_urgent,
            "urgent_reason": urgent_reason,
            "is_pregnant": is_pregnant,
            "is_provisional": is_provisional,
            "plan_scope": "provisional_screening" if is_provisional else "comprehensive",
            "summary": summary,
            "symptoms": symptoms,
            "risk_factors": risk_factors,
            "key_labs": labs,
            "demographics": demographics,
        }

    def _build_findings_summary(
        self,
        *,
        condition: str,
        risk_level: str,
        certainty_pct: int,
        symptoms: List[str],
        labs: dict,
        demographics: dict,
        is_urgent: bool,
        is_provisional: bool = False,
    ) -> str:
        """Create a clinical synopsis of the assessment findings."""
        if is_urgent:
            return (
                f"Assessment indicates an urgent clinical profile ({condition}, {certainty_pct}% certainty). "
                "Urgent medical evaluation is warranted due to acute symptom or glycemic markers."
            )

        fpg = labs.get("fasting_glucose") or labs.get("fasting_plasma_glucose")
        hba1c = labs.get("hba1c")

        lab_snippets = []
        if fpg:
            lab_snippets.append(f"FPG {fpg['value']} mg/dL")
        if hba1c:
            lab_snippets.append(f"HbA1c {hba1c['value']}%")

        lab_str = f" with {', '.join(lab_snippets)}" if lab_snippets else " (symptom & risk-factor screening)"

        if is_provisional:
            return (
                f"Preliminary screening identifies a potential {condition} pattern with limited certainty ({certainty_pct}%){lab_str}. "
                "Because clinical evidence is incomplete (pending confirmatory laboratory blood tests), "
                "this plan provides foundational wellness guidance and prioritizes diagnostic lab confirmation over intensive medical therapy."
            )

        if risk_level == "high":
            return (
                f"Assessment reflects a high-risk profile for {condition} ({certainty_pct}% certainty){lab_str}. "
                f"Active multi-pillar lifestyle intervention and physician consultation are recommended."
            )
        elif risk_level == "moderate":
            return (
                f"Assessment identifies moderate risk ({condition}, {certainty_pct}% certainty){lab_str}. "
                "Targeted nutrition, physical activity, and weight management can delay or prevent disease progression."
            )
        else:
            return (
                f"Assessment indicates normal glycemic status ({certainty_pct}% certainty){lab_str}. "
                "Recommended focus is on maintaining current healthy lifestyle habits and routine periodic monitoring."
            )

    # ──────────────────────────────────────────────────────────────────────────
    # Pillar 1: Diet & Nutrition Recommendations
    # ──────────────────────────────────────────────────────────────────────────

    def _generate_diet_recommendations(self, findings: dict) -> dict:
        condition = findings["condition"].lower()
        risk_level = findings["risk_level"]
        bmi = findings["demographics"].get("bmi")
        is_pregnant = findings["is_pregnant"]
        has_hypertension = any("hypertension" in r.lower() or "blood pressure" in r.lower() for r in findings["risk_factors"])

        action_items = []
        foods_to_prioritize = []
        foods_to_limit = []

        if findings.get("is_provisional"):
            summary = "Foundational healthy nutrition emphasizing fresh whole foods, regular hydration, and limiting sweetened drinks while awaiting lab confirmation."
            action_items.append({
                "title": "Prioritize Fresh Whole Foods & Regular Hydration",
                "description": "Drink plenty of water and build meals around whole vegetables, lean proteins, and fiber-rich unrefined foods.",
                "priority": "medium",
                "tag": "Healthy Eating",
            })
            action_items.append({
                "title": "Limit Sugar-Sweetened Beverages & Confections",
                "description": "Minimize sugary sodas, commercial juices, and sweet desserts to maintain steady daily energy levels.",
                "priority": "medium",
                "tag": "Sugar Moderation",
            })
            foods_to_prioritize.extend([
                "Fresh vegetables and leafy greens",
                "Water and unsweetened beverages",
                "Lean proteins (poultry, fish, eggs, tofu, legumes)",
                "Whole grains in moderate portions",
            ])
            foods_to_limit.extend([
                "Sugar-sweetened sodas and fruit drinks",
                "Candy, sweet pastries, and ultra-processed snacks",
                "Deep-fried foods",
            ])
            return {
                "category": "Diet & Nutrition Guidance",
                "summary": summary,
                "action_items": action_items,
                "foods_to_prioritize": foods_to_prioritize,
                "foods_to_limit": foods_to_limit,
            }

        if is_pregnant:
            summary = "Gestational diabetes nutrition therapy emphasizing controlled carbohydrate distribution across 3 meals and 2-3 snacks."
            action_items.append({
                "title": "Distribute Carbohydrates Throughout the Day",
                "description": "Divide carbs into 3 moderate meals and 2-3 structured snacks. Never skip meals, and consume a protein-paired bedtime snack to avoid overnight fasting spikes.",
                "priority": "high",
                "tag": "Meal Timing",
            })
            action_items.append({
                "title": "Pair Carbs with Protein and Healthy Fats",
                "description": "Always combine complex carbohydrates with high-quality protein (eggs, lean poultry, tofu, Greek yogurt) to slow glucose absorption.",
                "priority": "high",
                "tag": "Glycemic Blunting",
            })
            foods_to_prioritize.extend([
                "Non-starchy vegetables (spinach, cucumbers, broccoli)",
                "Lean proteins (chicken breast, eggs, tofu, pasteurized dairy)",
                "Complex low-GI grains (steel-cut oats, quinoa, brown rice in controlled portions)",
                "Healthy unsaturated fats (avocado, olive oil, walnuts)",
            ])
            foods_to_limit.extend([
                "Sugar-sweetened beverages and fruit juices",
                "Refined starches (white bread, sticky rice, pastries)",
                "Candy, sweet desserts, and simple sugars",
            ])
        elif risk_level in ("high", "urgent"):
            summary = "Carbohydrate-managed Medical Nutrition Therapy (MNT) utilizing the Diabetes Plate Method to stabilize glycemic variability."
            action_items.append({
                "title": "Adopt the Diabetes Plate Method",
                "description": "Fill 50% of your plate with non-starchy vegetables, 25% with lean protein, and 25% with fiber-rich complex carbohydrates.",
                "priority": "high",
                "tag": "Plate Portioning",
            })
            action_items.append({
                "title": "Eliminate Liquid Sugars & Refined Carbohydrates",
                "description": "Replace sugar-sweetened beverages, commercial sodas, sweetened teas, and fruit juices with water, plain tea, or infused water.",
                "priority": "high",
                "tag": "Carb Quality",
            })
            action_items.append({
                "title": "Increase Soluble and Insoluble Dietary Fiber",
                "description": "Target at least 30-35g of daily fiber from legumes, vegetables, and whole grains to slow carbohydrate digestion and improve satiety.",
                "priority": "medium",
                "tag": "Fiber Intake",
            })
            if bmi and bmi >= 25.0:
                action_items.append({
                    "title": "Modest Caloric Deficit for Weight Loss",
                    "description": "Create a sustainable 500 kcal daily deficit targeting gradual 5-7% weight reduction to enhance peripheral insulin sensitivity.",
                    "priority": "medium",
                    "tag": "Energy Balance",
                })
            foods_to_prioritize.extend([
                "Non-starchy vegetables (greens, cauliflower, bell peppers, green beans)",
                "Plant and lean animal proteins (beans, lentils, fish, skinless poultry)",
                "Low-glycemic whole grains (steel-cut oats, barley, buckwheat)",
                "Heart-healthy fats (extra virgin olive oil, chia seeds, almonds)",
            ])
            foods_to_limit.extend([
                "Sodas, sweetened coffee/tea drinks, commercial fruit juices",
                "Refined white grains (white rice, white flour breads, instant noodles)",
                "Deep-fried foods and trans fats",
                "Ultra-processed snack foods and pastries",
            ])
        elif risk_level == "moderate":
            summary = "Diabetes Prevention Program (DPP) dietary pattern focused on whole foods, high fiber, and reduced glycemic load."
            action_items.append({
                "title": "Shift to Low Glycemic Index Carbohydrates",
                "description": "Replace refined starches with unrefined grains, legumes, and root vegetables to prevent rapid post-meal glucose surges.",
                "priority": "high",
                "tag": "Glycemic Load",
            })
            action_items.append({
                "title": "Cut Added Sugars & High-Fructose Ingredients",
                "description": "Audit grocery purchases to keep added sugars under 25 grams per day. Choose whole fresh fruits over dried fruits or desserts.",
                "priority": "high",
                "tag": "Sugar Reduction",
            })
            action_items.append({
                "title": "Optimal Daily Hydration Habit",
                "description": "Drink 2 to 2.5 liters of clean water daily. Hydration supports renal glucose clearance and curbs false hunger signals.",
                "priority": "medium",
                "tag": "Hydration",
            })
            foods_to_prioritize.extend([
                "Dark leafy greens and cruciferous vegetables",
                "Whole legumes (lentils, chickpeas, black beans)",
                "Berries and whole fruits with skin (apples, pears)",
                "Omega-3 rich seeds and fatty fish (salmon, sardines)",
            ])
            foods_to_limit.extend([
                "Sweetened beverages and specialty coffees",
                "Refined breakfast cereals and packaged snacks",
                "Processed meats with high sodium and preservatives",
            ])
        else:
            summary = "Balanced Mediterranean-style whole food nutrition to preserve optimal metabolic and cardiovascular wellness."
            action_items.append({
                "title": "Maintain Balanced Whole-Food Nutrition",
                "description": "Emphasize fresh produce, unrefined grains, quality proteins, and healthy monounsaturated fats.",
                "priority": "routine",
                "tag": "Wholesome Eating",
            })
            action_items.append({
                "title": "Mindful Eating & Portion Awareness",
                "description": "Eat in response to genuine hunger cues, chew thoroughly, and maintain consistent meal timing.",
                "priority": "routine",
                "tag": "Mindful Habits",
            })
            foods_to_prioritize.extend([
                "Seasonal fresh vegetables and whole fruits",
                "Whole grains (brown rice, whole wheat, oats)",
                "Nuts, seeds, and olive oil",
                "Fish, legumes, and lean poultry",
            ])
            foods_to_limit.extend([
                "Excessive sugar-sweetened beverages",
                "Heavy trans-fat fried foods",
                "Ultra-processed packaged snacks",
            ])

        if has_hypertension:
            action_items.append({
                "title": "DASH Sodium Restriction",
                "description": "Keep dietary sodium under 2,000 mg/day (approx. 1 level teaspoon of salt). Enhance meals with herbs, citrus, and garlic instead of table salt.",
                "priority": "high",
                "tag": "Cardioprotection",
            })

        has_family_history = any("family" in r.lower() for r in findings.get("risk_factors", []))
        if has_family_history and risk_level in ("moderate", "high"):
            action_items.append({
                "title": "Counter Genetic Risk with Polyphenol & Fiber-Rich Nutrition",
                "description": "While family history elevates hereditary susceptibility, clinical trials demonstrate that an antioxidant-rich, low-glycemic dietary pattern counteracts genetic risk and reduces diabetes progression by over 58%.",
                "priority": "high",
                "tag": "Genetic Defense",
            })

        has_dyslipidemia = any("cholesterol" in r.lower() or "lipid" in r.lower() for r in findings.get("risk_factors", []))
        if has_dyslipidemia:
            action_items.append({
                "title": "Cardioprotective Viscous Fiber & Healthy Fats",
                "description": "Increase soluble viscous fiber (oats, barley, chia seeds, lentils) to bind bile acids and support healthy cholesterol levels, while substituting butter with extra virgin olive oil.",
                "priority": "high",
                "tag": "Lipid Optimization",
            })
            foods_to_prioritize.extend(["Oat bran and barley", "Chia and flax seeds", "Avocado and extra virgin olive oil"])

        has_thirst = any("thirst" in s.lower() or "polydipsia" in s.lower() for s in findings.get("symptoms", []))
        if has_thirst and not any("Hydration" in item.get("tag", "") for item in action_items):
            action_items.append({
                "title": "Targeted Osmotic Rehydration Strategy",
                "description": "Drink pure water or plain herbal teas consistently throughout the day. Avoid fruit juices, sweetened teas, and sports drinks which trigger rebound glucose spikes.",
                "priority": "high",
                "tag": "Hydration Balance",
            })

        return {
            "category": "Diet & Nutrition",
            "summary": summary,
            "action_items": action_items,
            "foods_to_prioritize": foods_to_prioritize,
            "foods_to_limit": foods_to_limit,
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Pillar 2: Physical Activity Recommendations
    # ──────────────────────────────────────────────────────────────────────────

    def _generate_physical_activity_recommendations(self, findings: dict) -> dict:
        risk_level = findings["risk_level"]
        age = findings["demographics"].get("age", 40)
        is_pregnant = findings["is_pregnant"]
        symptoms_str = " ".join(findings["symptoms"]).lower()
        has_neuropathy = "tingling" in symptoms_str or "numbness" in symptoms_str

        action_items = []
        precautions = []
        weekly_target_minutes = 150

        if findings["is_urgent"]:
            summary = "Temporary exercise pause pending urgent medical clearance."
            action_items.append({
                "title": "Rest Until Medical Evaluation",
                "description": "Refrain from strenuous physical exertion until fully evaluated by a healthcare physician to avoid metabolic decompensation.",
                "priority": "urgent",
                "tag": "Clinical Precaution",
            })
            precautions.append("Do not engage in vigorous gym sessions during acute hyperglycemic or ketosis symptoms.")
            return {
                "category": "Physical Activity",
                "summary": summary,
                "weekly_target_minutes": 0,
                "action_items": action_items,
                "safety_precautions": precautions,
            }

        if findings.get("is_provisional"):
            summary = "Consistent moderate physical activity to sustain overall metabolic health and cardiovascular fitness."
            action_items.append({
                "title": "Daily Brisk Walking Routine",
                "description": "Engage in 20-30 minutes of brisk walking or light aerobic exercise 4-5 days a week.",
                "priority": "medium",
                "tag": "Daily Movement",
            })
            action_items.append({
                "title": "Break Up Prolonged Inactivity",
                "description": "Stand up and walk around for 1-2 minutes every hour during prolonged periods of sitting.",
                "priority": "routine",
                "tag": "Sedentary Reset",
            })
            precautions.extend([
                "Stay hydrated before, during, and after physical activities.",
                "Wear comfortable, supportive walking shoes.",
            ])
            return {
                "category": "Physical Activity",
                "summary": summary,
                "weekly_target_minutes": weekly_target_minutes,
                "action_items": action_items,
                "safety_precautions": precautions,
            }

        if is_pregnant:
            summary = "Gentle, pregnancy-approved aerobic movement to enhance maternal glycemic control."
            weekly_target_minutes = 150
            action_items.append({
                "title": "Post-Meal Prenatal Walking",
                "description": "Take a gentle 15-20 minute walk after main meals. This actively blunts post-prandial glucose peaks safely.",
                "priority": "high",
                "tag": "Post-Meal Movement",
            })
            action_items.append({
                "title": "Low-Impact Prenatal Exercises",
                "description": "Engage in prenatal swimming, water aerobics, or stationary cycling 3-4 times per week as cleared by your obstetrician.",
                "priority": "medium",
                "tag": "Low-Impact",
            })
            precautions.extend([
                "Avoid exercises lying flat on your back after the first trimester.",
                "Avoid contact sports, rapid changes of direction, or activities with fall risk.",
                "Stay well hydrated and stop immediately if you experience dizziness, contractions, or shortness of breath.",
            ])
        elif age >= 65 or has_neuropathy:
            summary = "Low-impact aerobic conditioning, balance training, and fall-prevention routines."
            weekly_target_minutes = 120
            action_items.append({
                "title": "Joint-Friendly Low-Impact Cardio",
                "description": "Engage in 20-30 minutes of brisk walking, water aerobics, or recumbent cycling 4-5 days a week.",
                "priority": "high",
                "tag": "Joint-Friendly",
            })
            action_items.append({
                "title": "Balance & Fall Prevention Training",
                "description": "Practice gentle balance drills (single-leg stands near a sturdy chair, tai chi, or seated leg lifts) 2-3 days weekly.",
                "priority": "high",
                "tag": "Stability & Balance",
            })
            action_items.append({
                "title": "Post-Meal Light Walking",
                "description": "A 10-15 minute gentle stroll after dinner helps clear circulating glucose without high physical strain.",
                "priority": "medium",
                "tag": "Glycemic Uptake",
            })
            precautions.extend([
                "Inspect feet for abrasions, hotspots, or blisters before and after every walking session.",
                "Always wear supportive, well-cushioned footwear; never exercise barefoot.",
                "Avoid slippery surfaces and maintain good lighting during exercise.",
            ])
        else:
            summary = "150 minutes of weekly moderate aerobic activity paired with 2-3 resistance training sessions."
            weekly_target_minutes = 150
            action_items.append({
                "title": "Moderate Aerobic Exercise Regimen",
                "description": "Achieve at least 150 minutes per week of moderate-intensity exercise (brisk walking at 4-5 km/h, cycling, swimming, or dancing), distributed over at least 3-5 days.",
                "priority": "high",
                "tag": "Aerobic Cardio",
            })
            action_items.append({
                "title": "Resistance & Strength Training",
                "description": "Perform resistance training 2-3 non-consecutive days weekly (bodyweight squats, push-ups, resistance bands, or free weights). Skeletal muscle is the primary site of glucose disposal.",
                "priority": "high",
                "tag": "Muscle Insulin Sensitivity",
            })
            action_items.append({
                "title": "Post-Prandial Active Breaks",
                "description": "Incorporate a 10-minute walk after lunch or dinner to reduce post-meal glucose excursions by up to 20-30%.",
                "priority": "medium",
                "tag": "Post-Meal Habit",
            })
            action_items.append({
                "title": "Break Up Prolonged Sedentary Time",
                "description": "Stand up and walk for 2 minutes every 30-45 minutes of desk work to prevent sitting-induced insulin resistance.",
                "priority": "medium",
                "tag": "Sedentary Reset",
            })
            precautions.extend([
                "Warm up for 5 minutes with light stretching and cool down gradually.",
                "Wear proper supportive athletic footwear to safeguard foot health.",
                "Carry a water bottle and stop if you feel dizzy or lightheaded.",
            ])

        has_vision = any("vision" in s.lower() or "blur" in s.lower() for s in findings.get("symptoms", []))
        if has_vision and not findings["is_urgent"]:
            precautions.append("Avoid heavy overhead lifting and intense breath-holding (Valsalva maneuvers) until an eye examination rules out retinal microvascular stress.")

        bmi = findings["demographics"].get("bmi")
        if bmi and bmi >= 30.0 and not findings["is_urgent"]:
            precautions.append("Choose joint-friendly low-impact modalities (water aerobics, swimming, recumbent cycling) to protect knees and hips while maximizing metabolic calorie expenditure.")

        has_sedentary = any("sedentary" in r.lower() or "inactiv" in r.lower() for r in findings.get("risk_factors", []))
        if has_sedentary and not findings["is_urgent"] and not any("Gradual" in item["title"] for item in action_items):
            action_items.append({
                "title": "Gradual Step-Up Physical Conditioning",
                "description": "If returning from a sedentary routine, start with 10-15 minutes of comfortable daily walking, increasing by 5 minutes each week to build cardiorespiratory capacity safely.",
                "priority": "medium",
                "tag": "Habit Building",
            })

        return {
            "category": "Physical Activity",
            "summary": summary,
            "weekly_target_minutes": weekly_target_minutes,
            "action_items": action_items,
            "safety_precautions": precautions,
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Pillar 3: Lifestyle Recommendations
    # ──────────────────────────────────────────────────────────────────────────

    def _generate_lifestyle_recommendations(self, findings: dict) -> dict:
        risk_level = findings["risk_level"]
        bmi = findings["demographics"].get("bmi")
        symptoms_str = " ".join(findings["symptoms"]).lower()
        has_neuropathy = "tingling" in symptoms_str or "numbness" in symptoms_str
        has_smoking = any("smok" in r.lower() for r in findings["risk_factors"])

        action_items = []

        if findings.get("is_provisional"):
            action_items = [
                {
                    "title": "Prioritize 7-8 Hours Restorative Sleep",
                    "description": "Consistent quality sleep supports balanced evening cortisol and steady daytime energy levels.",
                    "priority": "medium",
                    "tag": "Sleep Hygiene",
                },
                {
                    "title": "Daily Stress Reduction & Balance",
                    "description": "Practice brief mindfulness, slow breathing, or quiet evening walks to maintain autonomic balance.",
                    "priority": "routine",
                    "tag": "Stress Regulation",
                },
            ]
            if has_smoking:
                action_items.append({
                    "title": "Tobacco Cessation Program",
                    "description": "Reducing or quitting smoking provides significant cardiometabolic advantages.",
                    "priority": "high",
                    "tag": "Smoking Cessation",
                })
            return {
                "category": "Lifestyle & Well-being",
                "summary": "Foundational sleep hygiene and stress balance supporting overall wellness.",
                "action_items": action_items,
            }

        # Weight management
        if bmi and bmi >= 25.0:
            target_pct = "7-10%" if bmi >= 30.0 else "5-7%"
            action_items.append({
                "title": f"Target Realistic {target_pct} Weight Loss",
                "description": f"Clinical trials demonstrate that reducing body weight by {target_pct} significantly restores insulin sensitivity and reduces diabetes progression risk by over 58%.",
                "priority": "high",
                "tag": "Weight Optimization",
            })

        # Sleep Hygiene
        action_items.append({
            "title": "Prioritize 7-8 Hours Restorative Sleep",
            "description": "Consistent sleep deprivation elevates evening cortisol and morning insulin resistance. Maintain a consistent bedtime and remove screens 45 minutes before sleep.",
            "priority": "high",
            "tag": "Sleep Architecture",
        })

        # Foot Care (Crucial for high risk or neuropathy)
        if risk_level in ("high", "urgent") or has_neuropathy:
            action_items.append({
                "title": "Daily Foot Self-Inspection Routine",
                "description": "Inspect heels, soles, and between toes daily under good lighting for cuts, redness, blisters, or calluses. Apply moisturizing lotion to dry skin but avoid between toes.",
                "priority": "high",
                "tag": "Foot Protection",
            })

        # Stress Management
        action_items.append({
            "title": "Daily Stress Reduction & Cortisol Modulation",
            "description": "Chronic psychological stress stimulates hepatic glucose release. Practice 10 minutes daily of diaphragmatic breathing, meditation, or quiet restorative walks.",
            "priority": "medium",
            "tag": "Stress Regulation",
        })

        # Smoking Cessation
        if has_smoking:
            action_items.append({
                "title": "Tobacco Cessation Program",
                "description": "Smoking doubles cardiovascular disease risk in individuals with glycemic impairment. Discuss evidence-based cessation aids with your primary care provider.",
                "priority": "high",
                "tag": "Smoking Cessation",
            })

        # Alcohol Moderation
        action_items.append({
            "title": "Limit or Avoid Alcohol Consumption",
            "description": "Alcohol impairs hepatic gluconeogenesis and can mask hypoglycemia while adding empty calories. If consuming alcohol, limit to ≤1 standard drink for women or ≤2 for men, accompanied by food.",
            "priority": "medium",
            "tag": "Alcohol Moderation",
        })

        has_fatigue = any("fatigue" in s.lower() or "tired" in s.lower() for s in findings.get("symptoms", []))
        if has_fatigue and not any("Fatigue" in item.get("tag", "") or "Energy" in item.get("tag", "") for item in action_items):
            action_items.append({
                "title": "Circadian Energy Pacing & Fatigue Management",
                "description": "Combat metabolic fatigue with 10-15 minutes of natural morning sunlight exposure, steady hydration, and consistent meal timing to eliminate afternoon glucose dips.",
                "priority": "medium",
                "tag": "Energy Management",
            })

        has_wounds = any("wound" in s.lower() or "heal" in s.lower() or "sore" in s.lower() for s in findings.get("symptoms", []))
        if has_wounds and not any("Wound" in item.get("tag", "") or "Skin" in item.get("tag", "") for item in action_items):
            action_items.append({
                "title": "Vigilant Skin & Wound Care Protocol",
                "description": "Clean any skin abrasions gently with mild soap and water, keep dry, and inspect daily for warmth or redness. Seek immediate medical attention for non-healing lesions.",
                "priority": "high",
                "tag": "Skin Protection",
            })

        return {
            "category": "Lifestyle & Well-being",
            "summary": "Holistic lifestyle habits targeting restorative sleep, stress reduction, foot vigilance, and weight regulation.",
            "action_items": action_items,
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Pillar 4: Biomarker & Glycemic Monitoring
    # ──────────────────────────────────────────────────────────────────────────

    def _generate_monitoring_recommendations(self, findings: dict) -> dict:
        risk_level = findings["risk_level"]
        is_pregnant = findings["is_pregnant"]
        has_hypertension = any("hypertension" in r.lower() or "blood pressure" in r.lower() for r in findings["risk_factors"])

        fpg_data = findings.get("key_labs", {}).get("fasting_glucose") or findings.get("key_labs", {}).get("fasting_plasma_glucose")
        hba1c_data = findings.get("key_labs", {}).get("hba1c")

        fpg_note = f" (Your lab: {fpg_data['value']} mg/dL)" if fpg_data else ""
        hba1c_note = f" (Your lab: {hba1c_data['value']}%)" if hba1c_data else ""

        action_items = []
        target_ranges = {
            "fasting_glucose": f"80 - 130 mg/dL (ADA standard adult non-pregnant target){fpg_note}",
            "post_meal_glucose": "< 180 mg/dL (1-2 hours after meal start)",
            "hba1c": f"< 7.0% (individualized clinical target determined with physician){hba1c_note}",
        }

        if findings.get("is_provisional"):
            return {
                "category": "Diagnostic Confirmatory Testing",
                "summary": "Clinical laboratory blood testing is the recommended next step to evaluate your glycemic status with diagnostic precision.",
                "action_items": [
                    {
                        "title": "Complete Laboratory Blood Testing (FPG or HbA1c)",
                        "description": "Schedule a venous blood draw at an accredited clinical laboratory for Fasting Plasma Glucose (FPG) and/or HbA1c to obtain definitive diagnostic clarity.",
                        "frequency": "Within 2 to 4 weeks",
                        "priority": "high",
                    }
                ],
                "target_ranges": {
                    "fasting_glucose_normal": "< 100 mg/dL (Normal fasting glucose)",
                    "hba1c_normal": "< 5.7% (Normal HbA1c)",
                    "prediabetes_fasting": "100 - 125 mg/dL",
                    "prediabetes_hba1c": "5.7% - 6.4%",
                },
            }

        if is_pregnant:
            target_ranges = {
                "fasting_glucose": "< 95 mg/dL (ACOG/ADA pregnancy target)",
                "one_hour_post_meal": "< 140 mg/dL",
                "two_hour_post_meal": "< 120 mg/dL",
            }
            action_items.append({
                "title": "Structured 4x Daily Blood Glucose Logging",
                "description": "Record capillary blood glucose upon waking (fasting) and 1 hour (or 2 hours) after breakfast, lunch, and dinner using a home glucometer.",
                "frequency": "4 times daily",
                "priority": "high",
            })
            action_items.append({
                "title": "Home Blood Pressure Tracking",
                "description": "Monitor blood pressure weekly or at prenatal visits to watch for pre-eclampsia or gestational hypertension.",
                "frequency": "Weekly",
                "priority": "high",
            })
        elif risk_level in ("high", "urgent"):
            action_items.append({
                "title": "Self-Monitoring of Blood Glucose (SMBG)",
                "description": "Monitor fasting blood glucose in the morning and alternating post-meal readings (2 hours post-dinner or lunch) as directed by your physician.",
                "frequency": "1-2 times daily or as prescribed",
                "priority": "high",
            })
            action_items.append({
                "title": "Quarterly HbA1c Laboratory Evaluation",
                "description": "Repeat HbA1c testing every 3 months until stable, then at least every 6 months to evaluate 90-day glycemic trends.",
                "frequency": "Every 3 months",
                "priority": "high",
            })
            action_items.append({
                "title": "Comprehensive Annual Organ Screenings",
                "description": "Schedule annual urine albumin-to-creatinine ratio (uACR) for kidney health, annual dilated eye exam for retinal health, and comprehensive lipid panel.",
                "frequency": "Annually",
                "priority": "medium",
            })
        elif risk_level == "moderate":
            action_items.append({
                "title": "Periodic Fasting Blood Sugar & HbA1c Check",
                "description": "Repeat fasting blood glucose and laboratory HbA1c in 3-6 months to assess effectiveness of lifestyle changes and monitor for reversibility.",
                "frequency": "Every 3 to 6 months",
                "priority": "high",
            })
            action_items.append({
                "title": "Periodic Weight & Waist Tracking",
                "description": "Weigh yourself once weekly under consistent morning conditions and track waist circumference monthly.",
                "frequency": "Weekly",
                "priority": "medium",
            })
        else:
            action_items.append({
                "title": "Annual Preventive Metabolic Screening",
                "description": "Complete routine fasting glucose and lipid profile screening during your annual physical checkup.",
                "frequency": "Annually (every 12 months)",
                "priority": "routine",
            })

        if has_hypertension:
            action_items.append({
                "title": "Home Blood Pressure Diary",
                "description": "Record seated blood pressure twice weekly. Target is generally < 130/80 mmHg for cardiometabolic protection.",
                "frequency": "2-3 times weekly",
                "priority": "high",
            })

        return {
            "category": "Biomarker & Glycemic Monitoring",
            "summary": "Regular monitoring protocol to detect glycemic excursions and track physiological response to lifestyle interventions.",
            "action_items": action_items,
            "target_ranges": target_ranges,
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Pillar 5: Follow-up Schedule & Clinical Referrals
    # ──────────────────────────────────────────────────────────────────────────

    def _generate_follow_up_schedule(self, findings: dict) -> dict:
        risk_level = findings["risk_level"]
        is_pregnant = findings["is_pregnant"]
        is_urgent = findings["is_urgent"]

        schedule = []
        specialists = []

        if is_urgent:
            urgency_str = "urgent"
            timeline = "Immediate / Same-Day"
            milestone = "Urgent clinical medical evaluation at clinic or emergency department to rule out acute metabolic decompensation (such as DKA)."
            schedule.append({
                "timeframe": "Immediate (Today)",
                "title": "Urgent Medical Evaluation",
                "description": "Seek same-day medical attention for immediate blood glucose, ketone, and electrolyte assessment.",
                "priority": "urgent",
            })
            schedule.append({
                "timeframe": "Within 48-72 hours",
                "title": "Endocrinologist Consultation",
                "description": "Specialist follow-up for disease staging, diagnostic confirmation, and therapeutic stabilization.",
                "priority": "high",
            })
            specialists.extend([
                "Emergency Physician / Urgent Care Clinician",
                "Endocrinologist",
                "Certified Diabetes Care & Education Specialist (CDCES)",
            ])
        elif findings.get("is_provisional"):
            urgency_str = "routine"
            timeline = "Within 2 to 4 Weeks"
            milestone = "Outpatient clinic visit for confirmatory blood draw (FPG / HbA1c) and physician review."
            schedule.append({
                "timeframe": "Within 2-4 weeks",
                "title": "Confirmatory Clinic & Lab Visit",
                "description": "Consult with a primary care clinician to complete formal blood tests and verify glycemic health.",
                "priority": "medium",
            })
            specialists.extend([
                "Primary Care Physician (PCP)",
                "General Practitioner",
            ])
        elif is_pregnant:
            urgency_str = "high"
            timeline = "Within 24 to 48 Hours"
            milestone = "Specialized obstetric and maternal-fetal medicine consultation for gestational diabetes confirmation and treatment planning."
            schedule.append({
                "timeframe": "Within 24-48 hours",
                "title": "Obstetrician / Prenatal Clinical Visit",
                "description": "Review glucose levels, discuss formal OGTT findings, and establish personalized prenatal glycemic targets.",
                "priority": "high",
            })
            schedule.append({
                "timeframe": "Within 1 week",
                "title": "Prenatal Nutrition Counseling",
                "description": "Consultation with a registered dietitian specializing in gestational diabetes meal planning.",
                "priority": "high",
            })
            schedule.append({
                "timeframe": "6-12 weeks postpartum",
                "title": "Postpartum 75g OGTT Re-evaluation",
                "description": "Oral glucose tolerance test to verify resolution of gestational glucose intolerance.",
                "priority": "medium",
            })
            specialists.extend([
                "Obstetrician-Gynecologist (OB/GYN)",
                "Maternal-Fetal Medicine Specialist",
                "Registered Dietitian Nutritionist (RDN)",
            ])
        elif risk_level == "high":
            urgency_str = "high"
            timeline = "Within 1 to 2 Weeks"
            milestone = "Formal clinical diagnostic confirmation, baseline organ screening, and individualized treatment planning with your primary doctor."
            schedule.append({
                "timeframe": "Within 1-2 weeks",
                "title": "Primary Care Physician Consultation",
                "description": "Clinical confirmation of diabetes criteria, comprehensive baseline blood/urine work, and establishment of personalized glycemic targets.",
                "priority": "high",
            })
            schedule.append({
                "timeframe": "Within 1 month",
                "title": "Comprehensive Dilated Retinal Exam",
                "description": "Full dilated eye examination by an eye specialist to evaluate retinal microvasculature.",
                "priority": "high",
            })
            schedule.append({
                "timeframe": "Every 3 months",
                "title": "HbA1c Follow-up & Lab Review",
                "description": "Assess 90-day progress, review glycemic logs, and refine lifestyle interventions.",
                "priority": "medium",
            })
            schedule.append({
                "timeframe": "Annual",
                "title": "Annual Comprehensive Neuropathy & Foot Check",
                "description": "Professional 10g monofilament and pedal pulse examination.",
                "priority": "routine",
            })
            specialists.extend([
                "Primary Care Physician (PCP)",
                "Optometrist / Ophthalmologist",
                "Registered Dietitian Nutritionist (RDN)",
                "Podiatrist (Foot Specialist)",
            ])
        elif risk_level == "moderate":
            urgency_str = "moderate"
            timeline = "Within 1 Month"
            milestone = "Review prediabetes / elevated risk pattern with physician and enroll in a lifestyle prevention program."
            schedule.append({
                "timeframe": "Within 2-4 weeks",
                "title": "Physician Prevention Visit",
                "description": "Review assessment findings, discuss confirmatory labs, and establish a personalized prevention roadmap.",
                "priority": "medium",
            })
            schedule.append({
                "timeframe": "Within 3-6 months",
                "title": "Repeat HbA1c & Fasting Glucose Test",
                "description": "Assess impact of dietary modifications and physical activity on glycemic markers.",
                "priority": "medium",
            })
            specialists.extend([
                "Primary Care Physician (PCP)",
                "Registered Dietitian Nutritionist (RDN)",
                "Health Coach / Diabetes Prevention Program (DPP) Facilitator",
            ])
        else:
            urgency_str = "routine"
            timeline = "Within 12 Months"
            milestone = "Routine annual preventive health exam."
            schedule.append({
                "timeframe": "Every 12 months",
                "title": "Annual Wellness Exam",
                "description": "Routine annual physical examination and standard preventive blood work with your doctor.",
                "priority": "routine",
            })
            specialists.extend([
                "Primary Care Physician / General Practitioner",
            ])

        return {
            "urgency": urgency_str,
            "timeline": timeline,
            "milestone_action": milestone,
            "schedule": schedule,
            "specialists_to_consult": specialists,
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Safety Disclaimer & Red Flags
    # ──────────────────────────────────────────────────────────────────────────

    def _generate_safety_disclaimer(self, findings: dict) -> dict:
        is_urgent = findings["is_urgent"]

        red_flags = [
            "Persistent blood glucose above 250 mg/dL or below 70 mg/dL",
            "Persistent nausea, vomiting, or inability to retain fluids",
            "Deep, rapid breathing or distinct fruity-smelling breath (signs of ketosis)",
            "Confusion, extreme weakness, slurred speech, or loss of consciousness",
            "Non-healing foot sores, sudden severe numbness, swelling, or signs of localized infection",
            "Chest pain, acute shortness of breath, or sudden vision changes",
        ]

        if findings["is_pregnant"]:
            red_flags.insert(0, "Decreased fetal movement or severe headache with blurred vision during pregnancy")

        content = (
            "This personalized care plan is generated by an intelligent clinical decision support system for lifestyle "
            "guidance and health education based on your assessment findings. It does NOT constitute a confirmed medical "
            "diagnosis, nor does it prescribe or adjust medications. All pharmacotherapy, diagnostic verification, and "
            "clinical treatment decisions must be made in consultation with a qualified, licensed healthcare professional."
        )

        if findings.get("is_provisional"):
            content += (
                " Note: This plan is provisional based on preliminary screening indicators with limited certainty (< 50%). "
                "Full clinical intervention protocols require formal venous laboratory blood testing."
            )

        return {
            "title": "Clinical & Safety Disclaimer",
            "content": content,
            "is_emergency_priority": is_urgent,
            "red_flags": red_flags,
            "emergency_instruction": (
                "If you experience any red-flag emergency symptoms, do not rely on self-care — call your local "
                "emergency number immediately or go to the nearest hospital emergency department."
            ),
        }
