"""Structured rule set V2 for the diabetes expert system — minimal edition.

Design contract
---------------
Every rule in this seed mirrors a branch of the adaptive assessment engine
(``app.expert_system.adaptive_assessment``) so the rule engine and the
interview pipeline always agree:

- Lab cutoffs copy ``LAB_SOURCES`` exactly:
    fasting glucose  100 (prediabetes) / 126 (diabetes) / 250 (critical)
    HbA1c             5.7 / 6.5 / 10.0
    random glucose    140 / 200 / 300
    2h OGTT           140 / 200 / 300
- The emergency cluster copies ``build_evidence``: crisis, keto sign + GI
  sign, vomiting + abdominal pain, or a critical lab value.
- Type-pattern rules copy the ``analyze_patterns`` discriminators:
    Type-1-like  → classic symptoms + sudden onset (or child presentation)
    Type-2-like  → diabetes evidence + gradual onset / BMI / acanthosis
    Gestational  → pregnancy + any diabetes evidence (or prior GDM)
- Conclusions use ONLY keys from ``DIAGNOSIS_BY_CONCLUSION`` so the results
  page can always map them to a headline.
- Recommendation strings reuse the V1 phrasings that already have
  patient-friendly rewrites in ``patient_messaging`` and translations in the
  frontend ``exactTextMap``; new strings are written patient-friendly.

Activate with ``RULES_SEED_VERSION=v2`` (see ``app.utils.seed``).
V1 remains the default seed.

NOTE: This system is a *screening and decision-support* tool.
      It does NOT replace clinical diagnosis by a qualified doctor.
"""

DIABETES_RULE_SEED_V2 = [
    # ================================================================== #
    #  TRIAGE — mirrors build_evidence()'s emergency logic               #
    # ================================================================== #
    {
        "code": "v2-triage-hypoglycemia",
        "name": "V2 Triage: Hypoglycemia (<70 mg/dL)",
        "description": "Blood glucose below 70 mg/dL requires immediate fast-acting carbohydrate per ADA Level 1 hypoglycemia.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.95,
        "status": "active",
        "explanation_text": "Blood glucose below 70 mg/dL is ADA Level 1 hypoglycemia and needs prompt treatment with fast-acting carbohydrates.",
        "conditions": [
            {"fact_key": "blood_glucose", "operator": "<", "expected_value": 70},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "hypoglycemia=true"},
            {
                "action_type": "recommendation",
                "action_value": "Take 15–20 g of fast-acting glucose (e.g., glucose tablets, juice). Recheck blood glucose in 15 minutes and repeat if still below 70 mg/dL.",
            },
        ],
    },
    {
        "code": "v2-triage-severe-hypoglycemia",
        "name": "V2 Triage: Severe Hypoglycemia (<54 mg/dL)",
        "description": "Blood glucose below 54 mg/dL is clinically significant (ADA Level 2) hypoglycemia.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.97,
        "status": "active",
        "explanation_text": "Below 54 mg/dL is clinically significant hypoglycemia — immediate intervention and emergency escalation if swallowing is not safe.",
        "conditions": [
            {"fact_key": "blood_glucose", "operator": "<", "expected_value": 54},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "severe_hypoglycemia=true"},
            {"action_type": "urgent_flag", "action_value": "true"},
            {
                "action_type": "recommendation",
                "action_value": "Clinically significant hypoglycemia. Administer fast-acting glucose immediately. If the patient is unable to swallow safely, administer glucagon and seek emergency medical care.",
            },
        ],
    },
    {
        "code": "v2-triage-dka-keto-with-vomiting",
        "name": "V2 Triage: DKA Cluster (Keto Sign + Vomiting)",
        "description": "A ketone sign (fruity breath / Kussmaul breathing) together with vomiting mirrors the adaptive emergency cluster.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.95,
        "status": "active",
        "explanation_text": "A ketone breath sign with vomiting matches the DKA-like emergency cluster — emergency evaluation is required.",
        "conditions": [
            {"fact_key": "ketosis_signs_present", "operator": "==", "expected_value": True},
            {"fact_key": "vomiting", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "possible_dka=true"},
            {"action_type": "urgent_flag", "action_value": "true"},
            {
                "action_type": "recommendation",
                "action_value": "Possible diabetic ketoacidosis detected. Go to emergency care immediately. Do NOT delay. Blood ketone measurement, arterial blood gas, and IV fluids are likely needed.",
            },
        ],
    },
    {
        "code": "v2-triage-dka-keto-with-abdominal-pain",
        "name": "V2 Triage: DKA Cluster (Keto Sign + Abdominal Pain)",
        "description": "A ketone sign together with abdominal pain mirrors the adaptive emergency cluster.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.95,
        "status": "active",
        "explanation_text": "A ketone breath sign with abdominal pain matches the DKA-like emergency cluster — emergency evaluation is required.",
        "conditions": [
            {"fact_key": "ketosis_signs_present", "operator": "==", "expected_value": True},
            {"fact_key": "abdominal_pain", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "possible_dka=true"},
            {"action_type": "urgent_flag", "action_value": "true"},
            {
                "action_type": "recommendation",
                "action_value": "Possible diabetic ketoacidosis detected. Go to emergency care immediately. Do NOT delay. Blood ketone measurement, arterial blood gas, and IV fluids are likely needed.",
            },
        ],
    },
    {
        "code": "v2-triage-dka-gi-cluster",
        "name": "V2 Triage: DKA Cluster (Vomiting + Abdominal Pain)",
        "description": "Two distinct emergency-type GI signs mirror the adaptive emergency cluster.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.93,
        "status": "active",
        "explanation_text": "Vomiting plus abdominal pain is the classic DKA GI cluster — emergency evaluation is required.",
        "conditions": [
            {"fact_key": "vomiting", "operator": "==", "expected_value": True},
            {"fact_key": "abdominal_pain", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "possible_dka=true"},
            {"action_type": "urgent_flag", "action_value": "true"},
            {
                "action_type": "recommendation",
                "action_value": "Possible diabetic ketoacidosis detected. Go to emergency care immediately. Do NOT delay. Blood ketone measurement, arterial blood gas, and IV fluids are likely needed.",
            },
        ],
    },
    {
        "code": "v2-triage-patient-crisis",
        "name": "V2 Triage: Patient-Reported Crisis",
        "description": "The patient explicitly flagged feeling in crisis — mirrors build_evidence's crisis branch.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.95,
        "status": "active",
        "explanation_text": "An explicit crisis flag is treated as an emergency signal on its own.",
        "conditions": [
            {"fact_key": "crisis", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {"action_type": "urgent_flag", "action_value": "true"},
            {
                "action_type": "recommendation",
                "action_value": "You reported feeling in crisis. Seek emergency medical care now — do not wait for test results or appointments.",
            },
        ],
    },
    {
        "code": "v2-triage-critical-lab-values",
        "name": "V2 Triage: Critical Lab Values (Any Assay)",
        "description": "Any lab at/above the adaptive critical cutoff: FPG ≥250, HbA1c ≥10%, random PG ≥300, or 2h OGTT ≥300.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.96,
        "status": "active",
        "explanation_text": "A critical lab value flips the adaptive session into emergency the same way — HHS/DKA risk needs emergency care.",
        "conditions": [
            {"fact_key": "fasting_glucose", "operator": ">=", "expected_value": 250},
            {"fact_key": "hba1c", "operator": ">=", "expected_value": 10, "logical_operator": "or"},
            {"fact_key": "random_plasma_glucose", "operator": ">=", "expected_value": 300, "logical_operator": "or"},
            {"fact_key": "2h_ogtt_75g", "operator": ">=", "expected_value": 300, "logical_operator": "or"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "critical_hyperglycemia=true"},
            {"action_type": "urgent_flag", "action_value": "true"},
            {
                "action_type": "recommendation",
                "action_value": "Critical blood glucose level. Seek emergency medical care immediately. Monitor for signs of dehydration, confusion, or loss of consciousness.",
            },
        ],
    },
    # ================================================================== #
    #  DIAGNOSIS — lab cutoffs mirror LAB_SOURCES exactly                 #
    # ================================================================== #
    {
        "code": "v2-diabetes-fpg",
        "name": "V2 Diagnosis: Fasting Glucose ≥126 mg/dL",
        "description": "ADA criterion — mirrors the adaptive 'diabetic' cutoff for fasting glucose.",
        "category": "diagnosis",
        "priority": "high",
        "certainty_factor": 0.9,
        "status": "active",
        "explanation_text": "Fasting plasma glucose at or above 126 mg/dL meets the ADA diabetes diagnostic threshold.",
        "conditions": [
            {"fact_key": "fasting_glucose", "operator": ">=", "expected_value": 126},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "diabetes_diagnostic_criterion_met=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"},
        ],
    },
    {
        "code": "v2-diabetes-hba1c",
        "name": "V2 Diagnosis: HbA1c ≥6.5%",
        "description": "ADA criterion — mirrors the adaptive 'diabetic' cutoff for HbA1c.",
        "category": "diagnosis",
        "priority": "high",
        "certainty_factor": 0.93,
        "status": "active",
        "explanation_text": "HbA1c ≥6.5% reflects chronic hyperglycemia over 2–3 months and meets the ADA diabetes diagnostic threshold.",
        "conditions": [
            {"fact_key": "hba1c", "operator": ">=", "expected_value": 6.5},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "diabetes_diagnostic_criterion_met=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"},
        ],
    },
    {
        "code": "v2-diabetes-random-glucose-with-symptoms",
        "name": "V2 Diagnosis: Random Glucose ≥200 + Classic Symptoms",
        "description": "ADA criterion (diagnostic without confirmation) — mirrors the adaptive random-glucose 'diabetic' cutoff combined with the classic symptom gate.",
        "category": "diagnosis",
        "priority": "high",
        "certainty_factor": 0.92,
        "status": "active",
        "explanation_text": "Random plasma glucose ≥200 mg/dL with classic hyperglycemic symptoms is diagnostic per ADA without a confirmatory test.",
        "conditions": [
            {"fact_key": "random_plasma_glucose", "operator": ">=", "expected_value": 200},
            {"fact_key": "classic_hyperglycemia_symptoms", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "diabetes_diagnostic_criterion_met=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"},
        ],
    },
    {
        "code": "v2-diabetes-ogtt",
        "name": "V2 Diagnosis: 2-Hour OGTT ≥200 mg/dL",
        "description": "ADA criterion — mirrors the adaptive 'diabetic' cutoff for the 2-hour OGTT.",
        "category": "diagnosis",
        "priority": "high",
        "certainty_factor": 0.91,
        "status": "active",
        "explanation_text": "A 2-hour plasma glucose ≥200 mg/dL during a 75-g OGTT meets the ADA diabetes diagnostic threshold.",
        "conditions": [
            {"fact_key": "2h_ogtt_75g", "operator": ">=", "expected_value": 200},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "diabetes_diagnostic_criterion_met=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"},
        ],
    },
    {
        "code": "v2-prediabetes-fpg",
        "name": "V2 Diagnosis: Prediabetes Fasting Range (100–125 mg/dL)",
        "description": "Mirrors the adaptive 'prediabetes' cutoff for fasting glucose.",
        "category": "diagnosis",
        "priority": "medium",
        "certainty_factor": 0.75,
        "status": "active",
        "explanation_text": "Fasting glucose 100–125 mg/dL is impaired fasting glucose (prediabetes) — a reversible warning stage.",
        "conditions": [
            {"fact_key": "fasting_glucose", "operator": ">=", "expected_value": 100},
            {"fact_key": "fasting_glucose", "operator": "<", "expected_value": 126, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "prediabetes_possible=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "prediabetes_possible"},
        ],
    },
    {
        "code": "v2-prediabetes-hba1c",
        "name": "V2 Diagnosis: Prediabetes HbA1c Range (5.7–6.4%)",
        "description": "Mirrors the adaptive 'prediabetes' cutoff for HbA1c.",
        "category": "diagnosis",
        "priority": "medium",
        "certainty_factor": 0.75,
        "status": "active",
        "explanation_text": "HbA1c 5.7–6.4% is prediabetes — a reversible warning stage.",
        "conditions": [
            {"fact_key": "hba1c", "operator": ">=", "expected_value": 5.7},
            {"fact_key": "hba1c", "operator": "<", "expected_value": 6.5, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "prediabetes_possible=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "prediabetes_possible"},
        ],
    },
    {
        "code": "v2-prediabetes-ogtt",
        "name": "V2 Diagnosis: Prediabetes OGTT Range (140–199 mg/dL)",
        "description": "Mirrors the adaptive 'prediabetes' cutoff for the 2-hour OGTT.",
        "category": "diagnosis",
        "priority": "medium",
        "certainty_factor": 0.72,
        "status": "active",
        "explanation_text": "2-hour OGTT 140–199 mg/dL is impaired glucose tolerance (prediabetes) — the highest short-term conversion risk.",
        "conditions": [
            {"fact_key": "2h_ogtt_75g", "operator": ">=", "expected_value": 140},
            {"fact_key": "2h_ogtt_75g", "operator": "<", "expected_value": 200, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "prediabetes_possible=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "prediabetes_possible"},
        ],
    },
    {
        "code": "v2-prediabetes-risk-factor-escalation",
        "name": "V2 Diagnosis: Prediabetes with Additional Risk Factor",
        "description": "Prediabetes lab values plus a type-2 risk factor raise progression risk — mirrors the adaptive lab+risk boost combining into one pattern.",
        "category": "diagnosis",
        "priority": "medium",
        "certainty_factor": 0.8,
        "status": "active",
        "explanation_text": "Prediabetes together with obesity, family history, hypertension or inactivity substantially raises the risk of progressing to type 2 diabetes.",
        "conditions": [
            {"fact_key": "type2_risk_increased", "operator": "==", "expected_value": True, "logical_operator": "or"},
            {"fact_key": "is_obese", "operator": "==", "expected_value": True, "logical_operator": "or"},
            {"fact_key": "family_history_diabetes", "operator": "==", "expected_value": True, "logical_operator": "or"},
            {"fact_key": "prediabetes_possible", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "prediabetes_high_confidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "prediabetes_possible"},
        ],
    },
    {
        "code": "v2-normal-glucose",
        "name": "V2 Diagnosis: Normal Fasting Glucose (<100 mg/dL)",
        "description": "Mirrors the adaptive banding — below the prediabetes cutoff is normal glycemia.",
        "category": "diagnosis",
        "priority": "low",
        "certainty_factor": 0.65,
        "status": "active",
        "explanation_text": "Fasting plasma glucose below 100 mg/dL is normal glycemia per ADA standards.",
        "conditions": [
            {"fact_key": "fasting_glucose", "operator": "<", "expected_value": 100},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "normal_fasting_glucose=true"},
        ],
    },
    {
        "code": "v2-normal-hba1c",
        "name": "V2 Diagnosis: Normal HbA1c (<5.7%)",
        "description": "Mirrors the adaptive banding — below the prediabetes cutoff is normal glycemia.",
        "category": "diagnosis",
        "priority": "low",
        "certainty_factor": 0.65,
        "status": "active",
        "explanation_text": "HbA1c below 5.7% is considered normal.",
        "conditions": [
            {"fact_key": "hba1c", "operator": "<", "expected_value": 5.7},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "normal_hba1c=true"},
        ],
    },
    {
        "code": "v2-symptom-only-screening",
        "name": "V2 Diagnosis: Classic Symptoms Without Labs",
        "description": "The adaptive engine flags core-symptom evidence even without labs — this is its symptom-only screening path.",
        "category": "diagnosis",
        "priority": "medium",
        "certainty_factor": 0.6,
        "status": "active",
        "explanation_text": "Classic symptoms without lab data give a real signal but cannot confirm diabetes — a simple blood test is the priority next step.",
        "conditions": [
            {"fact_key": "classic_hyperglycemia_symptoms", "operator": "==", "expected_value": True},
            {"fact_key": "no_lab_values_available", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "diagnosis_conclusion", "action_value": "symptom_only_screening"},
            {
                "action_type": "recommendation",
                "action_value": "Classic diabetes symptoms present but no laboratory data available. Urgently obtain: (1) Fasting plasma glucose. (2) HbA1c. (3) Random plasma glucose if fasting not possible. These tests are required for definitive diagnosis.",
            },
        ],
    },
    {
        "code": "v2-healthy-normal-labs",
        "name": "V2 Diagnosis: Normal Labs, No Symptoms — Healthy",
        "description": "Normal labs with no classic symptoms mirror the adaptive low-signal state.",
        "category": "diagnosis",
        "priority": "low",
        "certainty_factor": 0.72,
        "status": "active",
        "explanation_text": "Normal glucose values with no reported classic symptoms indicate normal glucose regulation at assessment time.",
        "conditions": [
            {"fact_key": "normal_fasting_glucose", "operator": "==", "expected_value": True, "logical_operator": "or"},
            {"fact_key": "normal_hba1c", "operator": "==", "expected_value": True, "logical_operator": "or"},
            {"fact_key": "classic_hyperglycemia_symptoms", "operator": "!=", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "diagnosis_conclusion", "action_value": "healthy_normal"},
            {
                "action_type": "recommendation",
                "action_value": "Your fasting glucose and HbA1c are both within normal ranges. No diabetes or prediabetes detected at this time. Continue healthy lifestyle habits and schedule routine screening as recommended by your doctor.",
            },
        ],
    },
    # ================================================================== #
    #  CLASSIFICATION — mirrors analyze_patterns() discriminators         #
    # ================================================================== #
    {
        "code": "v2-type1-sudden-onset",
        "name": "V2 Type 1 Pattern: Sudden Onset with Classic Symptoms",
        "description": "Classic symptoms appearing over days-to-weeks mirror the adaptive T1-like tempo discriminator (rapid_onset=True).",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.75,
        "status": "active",
        "explanation_text": "Type 1 diabetes usually presents abruptly — symptoms appear over days to weeks. Sudden onset with the classic signs fits the Type 1 pattern.",
        "conditions": [
            {"fact_key": "classic_hyperglycemia_symptoms", "operator": "==", "expected_value": True},
            {"fact_key": "rapid_onset", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type1_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type1_pattern_likely"},
        ],
    },
    {
        "code": "v2-type1-child-catabolic",
        "name": "V2 Type 1 Pattern: Young Age with Weight Loss",
        "description": "Age <18 with classic symptoms and weight loss mirrors the adaptive age<18 penalty that pushes evidence away from the T2-like pattern.",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.78,
        "status": "active",
        "explanation_text": "New classic symptoms with unexplained weight loss in a child or teenager fit the Type 1 pattern — same-day glucose testing is required.",
        "conditions": [
            {"fact_key": "classic_hyperglycemia_symptoms", "operator": "==", "expected_value": True},
            {"fact_key": "age", "operator": "<", "expected_value": 18, "logical_operator": "and"},
            {"fact_key": "weight_loss", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type1_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type1_pattern_likely"},
        ],
    },
    {
        "code": "v2-type2-gradual-onset",
        "name": "V2 Type 2 Pattern: Gradual Onset with Diabetes Evidence",
        "description": "Diabetes evidence with a months-to-years build-up mirrors the adaptive T2-like tempo discriminator (rapid_onset=False).",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.62,
        "status": "active",
        "explanation_text": "A slow build-up of symptoms over months to years is the natural history of insulin resistance (Type 2 pattern).",
        "conditions": [
            {"fact_key": "diabetes_evidence_base", "operator": "==", "expected_value": True},
            {"fact_key": "rapid_onset", "expression": "rapid_onset == false", "operator": "==", "expected_value": False, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type2_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type2_pattern_likely"},
        ],
    },
    {
        "code": "v2-type2-acanthosis",
        "name": "V2 Type 2 Pattern: Acanthosis Nigricans",
        "description": "Acanthosis nigricans mirrors the adaptive insulin-resistance sign (+0.2 to the T2-like pattern).",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.65,
        "status": "active",
        "explanation_text": "Acanthosis nigricans is a visible marker of long-standing insulin resistance — a strong Type 2 pattern signal.",
        "conditions": [
            {"fact_key": "diabetes_evidence_base", "operator": "==", "expected_value": True},
            {"fact_key": "acanthosis_nigricans", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type2_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type2_pattern_likely"},
        ],
    },
    {
        "code": "v2-type2-metabolic-cluster",
        "name": "V2 Type 2 Pattern: Middle Age with Overweight",
        "description": "Age ≥40 with BMI ≥25 and diabetes evidence mirrors the adaptive age and BMI boosts to the T2-like pattern.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.6,
        "status": "active",
        "explanation_text": "Type 2 typically develops silently over years and is most often diagnosed from middle age, usually alongside overweight.",
        "conditions": [
            {"fact_key": "diabetes_evidence_base", "operator": "==", "expected_value": True},
            {"fact_key": "age", "operator": ">=", "expected_value": 40, "logical_operator": "and"},
            {"fact_key": "bmi", "operator": ">=", "expected_value": 25, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type2_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type2_pattern_likely"},
        ],
    },
    {
        "code": "v2-type2-risk-increased",
        "name": "V2 Classification: Elevated Type 2 Risk (No Diabetes Evidence Yet)",
        "description": "Risk cluster without hyperglycemia mirrors the adaptive risk-cluster-only state — preventive action, not diagnosis.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.6,
        "status": "active",
        "explanation_text": "Risk factors alone do not diagnose diabetes, but they justify preventive action and routine screening every 1–3 years.",
        "conditions": [
            {"fact_key": "type2_risk_increased", "operator": "==", "expected_value": True, "logical_operator": "or"},
            {"fact_key": "is_obese", "operator": "==", "expected_value": True, "logical_operator": "or"},
            {"fact_key": "diabetes_diagnostic_criterion_met", "operator": "!=", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "diagnosis_conclusion", "action_value": "type2_risk_increased"},
        ],
    },
    {
        "code": "v2-gestational-pattern",
        "name": "V2 Gestational Pattern: Pregnancy with Diabetes Evidence",
        "description": "Pregnancy with any diabetes evidence mirrors the adaptive gestational_risk pattern (base 0.45 + boosts).",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.8,
        "status": "active",
        "explanation_text": "During pregnancy, diabetes-like evidence maps to the gestational pattern — stricter glucose thresholds apply and obstetric review is needed.",
        "conditions": [
            {"fact_key": "classic_hyperglycemia_symptoms", "operator": "==", "expected_value": True, "logical_operator": "or"},
            {"fact_key": "prediabetes_possible", "operator": "==", "expected_value": True, "logical_operator": "or"},
            {"fact_key": "diabetes_diagnostic_criterion_met", "operator": "==", "expected_value": True, "logical_operator": "or"},
            {"fact_key": "currently_pregnant", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "diagnosis_conclusion", "action_value": "gestational_diabetes_likely"},
        ],
    },
    # ================================================================== #
    #  RECOMMENDATION — mirrors the adaptive screening outcomes           #
    # ================================================================== #
    {
        "code": "v2-recommend-prediabetes-prevention",
        "name": "V2 Recommendation: Prediabetes Prevention Program",
        "description": "DPP evidence-based prevention guidance when the prediabetes pattern is the outcome — the adaptive 'act early to prevent type 2' message.",
        "category": "recommendation",
        "priority": "medium",
        "certainty_factor": 0.8,
        "status": "active",
        "explanation_text": "The Diabetes Prevention Program (DPP) showed lifestyle intervention (≥7% weight loss, 150 min/week activity) reduces diabetes incidence by 58%; metformin is an option for high-risk adults.",
        "conditions": [
            {"fact_key": "prediabetes_possible", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "High risk of diabetes progression. Enroll in a structured lifestyle intervention program (target: ≥7% weight loss and ≥150 min/week moderate physical activity). Consider metformin for chemoprevention (especially if BMI ≥35 or age <60).",
            },
        ],
    },
    {
        "code": "v2-recommend-diabetes-referral",
        "name": "V2 Recommendation: Diabetes Clinical Evaluation",
        "description": "Formal clinical evaluation when the diabetes-diagnostic fact is asserted — mirrors the adaptive diabetic-lab outcome.",
        "category": "recommendation",
        "priority": "high",
        "certainty_factor": 0.85,
        "status": "active",
        "explanation_text": "When diagnostic criteria are met, ADA recommends a comprehensive care plan: glycemic targets, complication screening, and structured follow-up.",
        "conditions": [
            {"fact_key": "diabetes_diagnostic_criterion_met", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "Test results meet the diabetes diagnostic threshold. See a healthcare provider promptly to start treatment and a monitoring plan — bring these results with you.",
            },
        ],
    },
    {
        "code": "v2-recommend-type2-prevention",
        "name": "V2 Recommendation: Type 2 Risk Prevention",
        "description": "Risk-cluster outcome without diabetes evidence — mirrors the adaptive risk-only screening state with routine-interval re-screening.",
        "category": "recommendation",
        "priority": "medium",
        "certainty_factor": 0.7,
        "status": "active",
        "explanation_text": "ADA recommends individuals with type 2 risk factors screen at least every 3 years (every 1–2 years with prediabetes), alongside weight and activity targets.",
        "conditions": [
            {"fact_key": "type2_risk_increased", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "You have one or more risk factors for Type 2 diabetes. Preventive recommendations: (1) Maintain a healthy weight (BMI <25). (2) Exercise at least 150 minutes per week. (3) Follow a balanced diet rich in whole grains, vegetables, and lean proteins. (4) Routine diabetes screening every 3 years (or annually if prediabetes identified). (5) Discuss family history and personal risk with your healthcare provider.",
            },
        ],
    },
    {
        "code": "v2-recommend-gestational-pathway",
        "name": "V2 Recommendation: Gestational Screening Pathway",
        "description": "Pregnancy routes to the GDM screening pathway — mirrors the adaptive pregnant branch and its stricter thresholds.",
        "category": "recommendation",
        "priority": "high",
        "certainty_factor": 0.78,
        "status": "active",
        "explanation_text": "GDM is screened with a 75-g OGTT (ideally weeks 24–28, earlier with risk factors). Pregnancy thresholds are stricter: fasting ≥92, 1h ≥180, or 2h ≥153 mg/dL (IADPSG).",
        "conditions": [
            {"fact_key": "currently_pregnant", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "Pregnancy detected. Screen for gestational diabetes with a 75g OGTT (ideally between weeks 24-28; earlier if risk factors such as prior GDM, obesity, or family history are present). Pregnancy glucose thresholds are stricter: fasting >= 92 mg/dL, 1h >= 180 mg/dL, or 2h >= 153 mg/dL on OGTT indicates GDM (IADPSG criteria).",
            },
        ],
    },
    {
        "code": "v2-recommend-no-labs-completeness",
        "name": "V2 Recommendation: Lab Completion Nudge",
        "description": "Symptoms without labs — mirrors the adaptive 'labs available?' probe and the service completeness note.",
        "category": "recommendation",
        "priority": "low",
        "certainty_factor": 0.6,
        "status": "active",
        "explanation_text": "Symptom evidence alone gives a useful signal; a fasting glucose or HbA1c test sharpens it substantially.",
        "conditions": [
            {"fact_key": "no_lab_values_available", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "You have diabetes-related symptoms but no laboratory data was available. Symptoms alone cannot confirm or rule out diabetes. Priority action: Obtain fasting glucose and HbA1c within 1 week for definitive assessment.",
            },
        ],
    },
    # ── end recommendation ──
    # ── end classification ──
    # ── end diagnosis ──
    # ── end triage ──
]
