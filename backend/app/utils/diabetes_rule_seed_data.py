"""Structured rule set for the diabetes expert system.

Medical references
------------------
- ADA Standards of Care in Diabetes (2025/2026)
- WHO Classification of Diabetes Mellitus (2019)
- IDF Clinical Practice Recommendations (2024)

NOTE: This system is a *screening and decision-support* tool.
      It does NOT replace clinical diagnosis by a qualified doctor.
"""

DIABETES_RULE_SEED = [
    # ================================================================== #
    #  TRIAGE RULES — Emergency & Immediate-Action Detection              #
    # ================================================================== #
    {
        "code": "triage-hypoglycemia-threshold",
        "name": "Triage: Hypoglycemia Threshold",
        "description": "Detects blood glucose below 70 mg/dL, requiring immediate action per ADA hypoglycemia classification (Level 1: <70 mg/dL).",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.95,
        "status": "active",
        "explanation_text": "Blood glucose below 70 mg/dL is classified as Level 1 hypoglycemia by ADA and requires prompt treatment with fast-acting carbohydrates.",
        "conditions": [
            {"fact_key": "blood_glucose", "operator": "<", "expected_value": 70},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "hypoglycemia=true"},
            {"action_type": "assert_fact", "action_value": "take_action_now=true"},
            {
                "action_type": "recommendation",
                "action_value": "Take 15–20 g of fast-acting glucose (e.g., glucose tablets, juice). Recheck blood glucose in 15 minutes and repeat if still below 70 mg/dL.",
            },
        ],
    },
    {
        "code": "triage-severe-hypoglycemia",
        "name": "Triage: Severe Hypoglycemia (<54 mg/dL)",
        "description": "Detects blood glucose below 54 mg/dL, classified as Level 2 (clinically significant) hypoglycemia per ADA.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.97,
        "status": "active",
        "explanation_text": "Blood glucose below 54 mg/dL is Level 2 hypoglycemia per ADA — clinically significant and requiring immediate intervention.",
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
        "code": "triage-symptomatic-hypoglycemia-sweating",
        "name": "Triage: Symptomatic Hypoglycemia (Sweating)",
        "description": "Flags symptomatic hypoglycemia when sweating is present alongside low glucose.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.88,
        "status": "active",
        "explanation_text": "Sweating is an adrenergic symptom of hypoglycemia, indicating the body's counter-regulatory response to low blood sugar.",
        "conditions": [
            {"fact_key": "hypoglycemia", "operator": "==", "expected_value": True},
            {"fact_key": "sweating", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "symptomatic_hypoglycemia=true"},
        ],
    },
    {
        "code": "triage-symptomatic-hypoglycemia-shaking",
        "name": "Triage: Symptomatic Hypoglycemia (Shaking)",
        "description": "Flags symptomatic hypoglycemia when shaking/tremor is present.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.88,
        "status": "active",
        "explanation_text": "Tremor/shaking is an adrenergic symptom of hypoglycemia caused by epinephrine release.",
        "conditions": [
            {"fact_key": "hypoglycemia", "operator": "==", "expected_value": True},
            {"fact_key": "shaking", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "symptomatic_hypoglycemia=true"},
        ],
    },
    {
        "code": "triage-symptomatic-hypoglycemia-dizziness",
        "name": "Triage: Symptomatic Hypoglycemia (Dizziness)",
        "description": "Flags symptomatic hypoglycemia when dizziness is present.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.86,
        "status": "active",
        "explanation_text": "Dizziness with hypoglycemia is a neuroglycopenic symptom indicating insufficient glucose supply to the brain.",
        "conditions": [
            {"fact_key": "hypoglycemia", "operator": "==", "expected_value": True},
            {"fact_key": "dizziness", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "symptomatic_hypoglycemia=true"},
        ],
    },
    {
        "code": "triage-possible-dka-cluster",
        "name": "Triage: Possible DKA Symptom Cluster",
        "description": "Flags possible diabetic ketoacidosis (DKA) when hyperglycemia is combined with vomiting and abdominal pain — classic DKA presentation.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.93,
        "status": "active",
        "explanation_text": "Hyperglycemia with nausea/vomiting and abdominal pain may indicate DKA — a life-threatening complication requiring emergency evaluation.",
        "conditions": [
            {"fact_key": "hyperglycemia_present", "operator": "==", "expected_value": True},
            {"fact_key": "vomiting", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "abdominal_pain", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "possible_dka=true"},
            {"action_type": "urgent_flag", "action_value": "true"},
        ],
    },
    {
        "code": "triage-possible-dka-nausea-fatigue",
        "name": "Triage: Possible DKA (Nausea + Fatigue + Hyperglycemia)",
        "description": "Flags possible DKA when hyperglycemia, severe fatigue, and nausea occur together.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.85,
        "status": "active",
        "explanation_text": "The combination of hyperglycemia, nausea, and severe fatigue can be an early presentation of DKA before vomiting develops.",
        "conditions": [
            {"fact_key": "hyperglycemia_present", "operator": "==", "expected_value": True},
            {"fact_key": "nausea", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "fatigue", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "possible_dka=true"},
        ],
    },
    {
        "code": "triage-critical-hyperglycemia",
        "name": "Triage: Critical Hyperglycemia (>300 mg/dL)",
        "description": "Detects critically high blood glucose above 300 mg/dL, which may indicate HHS or DKA risk.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.96,
        "status": "active",
        "explanation_text": "Blood glucose above 300 mg/dL is a medical emergency risk. Patients may develop hyperosmolar hyperglycemic state (HHS) or DKA.",
        "conditions": [
            {"fact_key": "random_plasma_glucose", "operator": ">=", "expected_value": 300},
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
    {
        "code": "triage-classic-symptom-cluster",
        "name": "Triage: Classic Hyperglycemia Symptom Cluster",
        "description": "Identifies the classic triad: polyuria, polydipsia, and unexplained weight loss — hallmarks of undiagnosed diabetes.",
        "category": "triage",
        "priority": "medium",
        "certainty_factor": 0.76,
        "status": "active",
        "explanation_text": "The classic symptom cluster (frequent urination, excessive thirst, unexplained weight loss) strongly suggests uncontrolled hyperglycemia and warrants laboratory confirmation.",
        "conditions": [
            {"fact_key": "frequent_urination", "operator": "==", "expected_value": True},
            {"fact_key": "excessive_thirst", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "weight_loss", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "classic_hyperglycemia_symptoms=true"},
            {"action_type": "assert_fact", "action_value": "classic_symptom_cluster=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "classic_symptoms"},
        ],
    },
    {
        "code": "triage-polyuria-polydipsia-fatigue",
        "name": "Triage: Polyuria + Polydipsia + Fatigue",
        "description": "Detects a common undiagnosed diabetes presentation: frequent urination, excessive thirst, and persistent fatigue.",
        "category": "triage",
        "priority": "medium",
        "certainty_factor": 0.72,
        "status": "active",
        "explanation_text": "Polyuria, polydipsia, and unexplained fatigue are common initial symptoms of type 2 diabetes, even before weight loss occurs.",
        "conditions": [
            {"fact_key": "frequent_urination", "operator": "==", "expected_value": True},
            {"fact_key": "excessive_thirst", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "fatigue", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "classic_hyperglycemia_symptoms=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "classic_symptoms"},
        ],
    },
    {
        "code": "triage-blurred-vision-with-thirst",
        "name": "Triage: Blurred Vision + Excessive Thirst",
        "description": "Detects blurred vision combined with polydipsia — a common diabetes red flag caused by lens swelling from hyperglycemia.",
        "category": "triage",
        "priority": "medium",
        "certainty_factor": 0.68,
        "status": "active",
        "explanation_text": "Blurred vision in the context of polydipsia suggests osmotic changes in the eye lens due to sustained hyperglycemia.",
        "conditions": [
            {"fact_key": "blurred_vision", "operator": "==", "expected_value": True},
            {"fact_key": "excessive_thirst", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "vision_and_thirst_flag=true"},
        ],
    },
    {
        "code": "triage-slow-healing-with-fatigue",
        "name": "Triage: Slow Wound Healing + Fatigue",
        "description": "Detects slow wound healing and fatigue — subtle signs often seen in undiagnosed type 2 diabetes.",
        "category": "triage",
        "priority": "low",
        "certainty_factor": 0.62,
        "status": "active",
        "explanation_text": "Impaired wound healing and fatigue can indicate chronic hyperglycemia impairing immune function and cellular energy metabolism.",
        "conditions": [
            {"fact_key": "slow_healing", "operator": "==", "expected_value": True},
            {"fact_key": "fatigue", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "subtle_diabetes_signs=true"},
        ],
    },

    # ================================================================== #
    #  DIAGNOSIS RULES — ADA Laboratory Threshold Criteria                #
    # ================================================================== #
    {
        "code": "diagnosis-fasting-glucose-threshold",
        "name": "Diagnosis: Fasting Plasma Glucose ≥126 mg/dL",
        "description": "ADA diagnostic criterion: FPG ≥126 mg/dL (7.0 mmol/L) after ≥8 hours fasting indicates diabetes.",
        "category": "diagnosis",
        "priority": "high",
        "certainty_factor": 0.9,
        "status": "active",
        "explanation_text": "Fasting plasma glucose at or above 126 mg/dL meets the ADA diabetes diagnostic threshold. A confirmatory second test is recommended unless unequivocal hyperglycemia is present.",
        "conditions": [
            {"fact_key": "fasting_glucose", "operator": ">=", "expected_value": 126},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "diabetes_diagnostic_criterion_met=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"},
        ],
    },
    {
        "code": "diagnosis-hba1c-threshold",
        "name": "Diagnosis: HbA1c ≥6.5%",
        "description": "ADA diagnostic criterion: HbA1c ≥6.5% (48 mmol/mol) indicates chronic hyperglycemia consistent with diabetes.",
        "category": "diagnosis",
        "priority": "high",
        "certainty_factor": 0.93,
        "status": "active",
        "explanation_text": "HbA1c ≥6.5% reflects average blood glucose over 2–3 months and meets the ADA diabetes diagnostic threshold. Must be performed using an NGSP-certified method.",
        "conditions": [
            {"fact_key": "hba1c", "operator": ">=", "expected_value": 6.5},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "diabetes_diagnostic_criterion_met=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"},
        ],
    },
    {
        "code": "diagnosis-ogtt-diabetes-threshold",
        "name": "Diagnosis: 2-Hour OGTT ≥200 mg/dL",
        "description": "ADA diagnostic criterion: 2-hour plasma glucose ≥200 mg/dL during 75-g OGTT indicates diabetes.",
        "category": "diagnosis",
        "priority": "high",
        "certainty_factor": 0.91,
        "status": "active",
        "explanation_text": "A 2-hour plasma glucose ≥200 mg/dL during a standardized 75-g oral glucose tolerance test meets the ADA diabetes diagnostic threshold.",
        "conditions": [
            {"fact_key": "2h_ogtt_75g", "operator": ">=", "expected_value": 200},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "diabetes_diagnostic_criterion_met=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"},
        ],
    },
    {
        "code": "diagnosis-random-glucose-classic-symptoms",
        "name": "Diagnosis: Random Glucose ≥200 + Classic Symptoms",
        "description": "ADA diagnostic criterion: Random PG ≥200 mg/dL with classic hyperglycemic symptoms is diagnostic without need for confirmation.",
        "category": "diagnosis",
        "priority": "high",
        "certainty_factor": 0.92,
        "status": "active",
        "explanation_text": "Random plasma glucose ≥200 mg/dL in a patient with classic symptoms of hyperglycemia (polyuria, polydipsia, weight loss) is sufficient for diabetes diagnosis per ADA guidelines without additional confirmatory testing.",
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
        "code": "diagnosis-dual-criterion-fpg-hba1c",
        "name": "Diagnosis: Dual Criterion (FPG ≥126 + HbA1c ≥6.5%)",
        "description": "When both FPG and HbA1c exceed diagnostic thresholds, diabetes is established with high confidence per ADA guidelines.",
        "category": "diagnosis",
        "priority": "high",
        "certainty_factor": 0.96,
        "status": "active",
        "explanation_text": "Two concordant abnormal test results from the same sample establish the diagnosis of diabetes without requiring further confirmation (ADA 2025).",
        "conditions": [
            {"fact_key": "fasting_glucose", "operator": ">=", "expected_value": 126},
            {"fact_key": "hba1c", "operator": ">=", "expected_value": 6.5, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "diabetes_confirmed=true"},
            {"action_type": "assert_fact", "action_value": "diabetes_diagnostic_criterion_met=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"},
        ],
    },
    {
        "code": "diagnosis-very-high-hba1c",
        "name": "Diagnosis: Very High HbA1c ≥10%",
        "description": "HbA1c ≥10% indicates severe, prolonged hyperglycemia. Insulin therapy consideration is warranted per ADA.",
        "category": "diagnosis",
        "priority": "high",
        "certainty_factor": 0.97,
        "status": "active",
        "explanation_text": "HbA1c ≥10% reflects severely uncontrolled diabetes with average glucose likely exceeding 240 mg/dL. ADA recommends considering early insulin therapy.",
        "conditions": [
            {"fact_key": "hba1c", "operator": ">=", "expected_value": 10},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "severe_hyperglycemia=true"},
            {"action_type": "urgent_flag", "action_value": "true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"},
            {
                "action_type": "recommendation",
                "action_value": "Severely elevated HbA1c. Consider early insulin therapy and urgent endocrine referral. Evaluate for DKA risk factors.",
            },
        ],
    },

    # ── Prediabetes Detection Rules ──────────────────────────────────── #
    {
        "code": "diagnosis-prediabetes-fasting-range",
        "name": "Diagnosis: Prediabetes FPG Range (100–125 mg/dL)",
        "description": "ADA prediabetes criterion: FPG 100–125 mg/dL (5.6–6.9 mmol/L) indicates impaired fasting glucose (IFG).",
        "category": "diagnosis",
        "priority": "medium",
        "certainty_factor": 0.7,
        "status": "active",
        "explanation_text": "Fasting plasma glucose between 100 and 125 mg/dL indicates impaired fasting glucose (IFG), a prediabetes category per ADA. Lifestyle intervention is recommended.",
        "conditions": [
            {"fact_key": "fasting_glucose", "operator": ">=", "expected_value": 100},
            {"fact_key": "fasting_glucose", "operator": "<=", "expected_value": 125, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "prediabetes_possible=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "prediabetes_possible"},
        ],
    },
    {
        "code": "diagnosis-prediabetes-hba1c-range",
        "name": "Diagnosis: Prediabetes HbA1c Range (5.7–6.4%)",
        "description": "ADA prediabetes criterion: HbA1c 5.7–6.4% indicates increased risk for diabetes.",
        "category": "diagnosis",
        "priority": "medium",
        "certainty_factor": 0.72,
        "status": "active",
        "explanation_text": "HbA1c between 5.7% and 6.4% places the individual in the prediabetes range per ADA. Annual monitoring and lifestyle modification are recommended.",
        "conditions": [
            {"fact_key": "hba1c", "operator": ">=", "expected_value": 5.7},
            {"fact_key": "hba1c", "operator": "<=", "expected_value": 6.4, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "prediabetes_possible=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "prediabetes_possible"},
        ],
    },
    {
        "code": "diagnosis-prediabetes-ogtt-range",
        "name": "Diagnosis: Prediabetes OGTT Range (140–199 mg/dL)",
        "description": "ADA prediabetes criterion: 2-hour OGTT 140–199 mg/dL indicates impaired glucose tolerance (IGT).",
        "category": "diagnosis",
        "priority": "medium",
        "certainty_factor": 0.72,
        "status": "active",
        "explanation_text": "A 2-hour OGTT between 140 and 199 mg/dL indicates impaired glucose tolerance (IGT), a prediabetes category. IGT carries highest short-term diabetes conversion risk.",
        "conditions": [
            {"fact_key": "2h_ogtt_75g", "operator": ">=", "expected_value": 140},
            {"fact_key": "2h_ogtt_75g", "operator": "<=", "expected_value": 199, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "prediabetes_possible=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "prediabetes_possible"},
        ],
    },
    {
        "code": "diagnosis-prediabetes-dual-criteria",
        "name": "Diagnosis: Prediabetes Dual Criteria (FPG + HbA1c)",
        "description": "Both FPG and HbA1c in prediabetes range increases confidence of prediabetes diagnosis.",
        "category": "diagnosis",
        "priority": "medium",
        "certainty_factor": 0.82,
        "status": "active",
        "explanation_text": "When both fasting glucose (100–125 mg/dL) and HbA1c (5.7–6.4%) are in the prediabetes range, the risk of progression to diabetes is substantially higher.",
        "conditions": [
            {"fact_key": "fasting_glucose", "operator": ">=", "expected_value": 100},
            {"fact_key": "fasting_glucose", "operator": "<=", "expected_value": 125, "logical_operator": "and"},
            {"fact_key": "hba1c", "operator": ">=", "expected_value": 5.7, "logical_operator": "and"},
            {"fact_key": "hba1c", "operator": "<=", "expected_value": 6.4, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "prediabetes_possible=true"},
            {"action_type": "assert_fact", "action_value": "prediabetes_high_confidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "prediabetes_possible"},
        ],
    },
    {
        "code": "diagnosis-normal-glucose",
        "name": "Diagnosis: Normal Fasting Glucose (<100 mg/dL)",
        "description": "Fasting glucose below 100 mg/dL is within the normal range per ADA criteria.",
        "category": "diagnosis",
        "priority": "low",
        "certainty_factor": 0.65,
        "status": "active",
        "explanation_text": "Fasting plasma glucose below 100 mg/dL is classified as normal glycemia per ADA standards. Continue routine screening if risk factors are present.",
        "conditions": [
            {"fact_key": "fasting_glucose", "operator": "<", "expected_value": 100},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "normal_fasting_glucose=true"},
        ],
    },
    {
        "code": "diagnosis-normal-hba1c",
        "name": "Diagnosis: Normal HbA1c (<5.7%)",
        "description": "HbA1c below 5.7% is within the normal range per ADA criteria.",
        "category": "diagnosis",
        "priority": "low",
        "certainty_factor": 0.65,
        "status": "active",
        "explanation_text": "HbA1c below 5.7% is considered normal. Routine screening every 3 years is recommended for adults with risk factors.",
        "conditions": [
            {"fact_key": "hba1c", "operator": "<", "expected_value": 5.7},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "normal_hba1c=true"},
        ],
    },

    # ================================================================== #
    #  CLASSIFICATION RULES — Risk Stratification                         #
    # ================================================================== #
    {
        "code": "classification-type2-risk-bmi-family-history",
        "name": "Classification: Type 2 Risk (BMI ≥25 + Family History)",
        "description": "Classifies elevated type 2 diabetes risk when BMI ≥25 and first-degree family history of diabetes are present.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.74,
        "status": "active",
        "explanation_text": "Overweight/obesity (BMI ≥25) combined with a first-degree family history of diabetes is a well-established type 2 risk pattern per ADA screening criteria.",
        "conditions": [
            {"fact_key": "bmi", "operator": ">=", "expected_value": 25},
            {"fact_key": "family_history", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type2_risk_increased=true"},
            {"action_type": "assert_fact", "action_value": "high_type2_risk_pattern=true"},
        ],
    },
    {
        "code": "classification-type2-risk-bmi-activity",
        "name": "Classification: Type 2 Risk (BMI ≥25 + Sedentary Lifestyle)",
        "description": "Classifies elevated type 2 diabetes risk when BMI ≥25 and the patient has low physical activity.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.72,
        "status": "active",
        "explanation_text": "Physical inactivity combined with overweight/obesity significantly increases insulin resistance and type 2 diabetes risk per ADA risk factors.",
        "conditions": [
            {"fact_key": "bmi", "operator": ">=", "expected_value": 25},
            {"fact_key": "sedentary_lifestyle", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type2_risk_increased=true"},
            {"action_type": "assert_fact", "action_value": "high_type2_risk_pattern=true"},
        ],
    },
    {
        "code": "classification-obesity-class1",
        "name": "Classification: Obesity Class I (BMI 30–34.9)",
        "description": "BMI 30–34.9 classifies as Class I obesity — an independent risk factor for type 2 diabetes.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.7,
        "status": "active",
        "explanation_text": "Class I obesity (BMI 30–34.9) approximately doubles the risk of developing type 2 diabetes compared to normal weight.",
        "conditions": [
            {"fact_key": "bmi", "operator": ">=", "expected_value": 30},
            {"fact_key": "bmi", "operator": "<", "expected_value": 35, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "obesity_class1=true"},
            {"action_type": "assert_fact", "action_value": "type2_risk_increased=true"},
        ],
    },
    {
        "code": "classification-obesity-class2-3",
        "name": "Classification: Severe Obesity (BMI ≥35)",
        "description": "BMI ≥35 classifies as Class II/III obesity — strongly associated with type 2 diabetes and metabolic syndrome.",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.78,
        "status": "active",
        "explanation_text": "Severe obesity (BMI ≥35) increases type 2 diabetes risk by 5–12 fold. ADA recommends screening for diabetes in all adults with BMI ≥25, with increased vigilance for BMI ≥35.",
        "conditions": [
            {"fact_key": "bmi", "operator": ">=", "expected_value": 35},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "severe_obesity=true"},
            {"action_type": "assert_fact", "action_value": "type2_risk_increased=true"},
            {"action_type": "assert_fact", "action_value": "high_type2_risk_pattern=true"},
        ],
    },
    {
        "code": "classification-age-risk-45plus",
        "name": "Classification: Age-Related Risk (≥45 Years)",
        "description": "ADA recommends diabetes screening for all adults aged ≥45, regardless of other risk factors.",
        "category": "classification",
        "priority": "low",
        "certainty_factor": 0.6,
        "status": "active",
        "explanation_text": "Age ≥45 is an independent diabetes risk factor. ADA recommends screening all adults at age 45, with repeat testing every 3 years if results are normal.",
        "conditions": [
            {"fact_key": "age", "operator": ">=", "expected_value": 45},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "age_risk_screening=true"},
        ],
    },
    {
        "code": "classification-central-obesity-waist",
        "name": "Classification: Central Obesity by Waist Circumference",
        "description": "Waist circumference >102 cm (men) or >88 cm (women) indicates central obesity — a metabolic syndrome risk marker.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.68,
        "status": "active",
        "explanation_text": "Central (abdominal) obesity measured by waist circumference is an independent predictor of insulin resistance, metabolic syndrome, and type 2 diabetes.",
        "conditions": [
            {"fact_key": "waist_circumference", "operator": ">", "expected_value": 102},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "central_obesity=true"},
            {"action_type": "assert_fact", "action_value": "type2_risk_increased=true"},
        ],
    },
    {
        "code": "classification-prediabetes-with-risk-factors",
        "name": "Classification: Prediabetes + Risk Pattern = High Progression Risk",
        "description": "Prediabetes combined with existing type 2 risk factors indicates high risk of progression to diabetes within 5 years.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.8,
        "status": "active",
        "explanation_text": "Individuals with prediabetes and additional risk factors (obesity, family history, inactivity) have up to 70% lifetime risk of developing type 2 diabetes. Intensive lifestyle intervention can reduce this risk by 58% (DPP trial).",
        "conditions": [
            {"fact_key": "prediabetes_possible", "operator": "==", "expected_value": True},
            {"fact_key": "type2_risk_increased", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "high_progression_risk=true"},
            {
                "action_type": "recommendation",
                "action_value": "High risk of diabetes progression. Enroll in a structured lifestyle intervention program (target: ≥7% weight loss and ≥150 min/week moderate physical activity). Consider metformin for chemoprevention (especially if BMI ≥35 or age <60).",
            },
        ],
    },

    # ================================================================== #
    #  RECOMMENDATION RULES — Clinical Action Guidance                    #
    # ================================================================== #
    {
        "code": "recommendation-urgent-dka-referral",
        "name": "Recommendation: Emergency DKA Referral",
        "description": "Escalates to urgent emergency referral when DKA pattern is detected.",
        "category": "recommendation",
        "priority": "high",
        "certainty_factor": 0.95,
        "status": "active",
        "explanation_text": "Diabetic ketoacidosis (DKA) is a life-threatening emergency. Prompt recognition and treatment in a hospital setting is critical to prevent cerebral edema, multi-organ failure, and death.",
        "conditions": [
            {"fact_key": "possible_dka", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {"action_type": "urgent_flag", "action_value": "true"},
            {
                "action_type": "recommendation",
                "action_value": "Possible diabetic ketoacidosis detected. Go to emergency care immediately. Do NOT delay. Blood ketone measurement, arterial blood gas, and IV fluids are likely needed.",
            },
        ],
    },
    {
        "code": "recommendation-hypoglycemia-follow-up",
        "name": "Recommendation: Hypoglycemia Follow-Up",
        "description": "Provides immediate hypoglycemia correction guidance and medication review recommendation.",
        "category": "recommendation",
        "priority": "high",
        "certainty_factor": 0.9,
        "status": "active",
        "explanation_text": "Recurrent or symptomatic hypoglycemia requires medication review (especially insulin or sulfonylureas), reassessment of glycemic targets, and patient education on the 15/15 rule.",
        "conditions": [
            {"fact_key": "symptomatic_hypoglycemia", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "Treat hypoglycemia with the 15/15 rule: take 15 g of fast-acting carbohydrate, wait 15 minutes, recheck glucose. Review diabetes medications with your doctor. If receiving insulin or sulfonylurea, dose adjustment may be needed.",
            },
        ],
    },
    {
        "code": "recommendation-prediabetes-lifestyle-followup",
        "name": "Recommendation: Prediabetes Lifestyle Intervention",
        "description": "Provides evidence-based lifestyle intervention guidance for prediabetes based on the Diabetes Prevention Program (DPP) trial.",
        "category": "recommendation",
        "priority": "medium",
        "certainty_factor": 0.78,
        "status": "active",
        "explanation_text": "The Diabetes Prevention Program (DPP) demonstrated that intensive lifestyle intervention (≥7% weight loss and 150 min/week of moderate physical activity) reduces diabetes incidence by 58%.",
        "conditions": [
            {"fact_key": "prediabetes_possible", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "Prediabetes detected. Recommendations: (1) Aim for ≥7% body weight loss through dietary changes. (2) Engage in ≥150 minutes per week of moderate-intensity physical activity. (3) Repeat HbA1c and fasting glucose in 3–6 months. (4) Consider referral to a Diabetes Prevention Program (DPP).",
            },
        ],
    },
    {
        "code": "recommendation-diabetes-clinical-referral",
        "name": "Recommendation: Diabetes Clinical Evaluation Referral",
        "description": "Advises formal clinical evaluation and care plan initiation when diabetes diagnostic criteria are met.",
        "category": "recommendation",
        "priority": "high",
        "certainty_factor": 0.84,
        "status": "active",
        "explanation_text": "When diabetes diagnostic criteria are met, ADA recommends comprehensive diabetes care including: A1c target setting, retinal screening, foot examination, blood pressure and lipid management, and diabetes self-management education.",
        "conditions": [
            {"fact_key": "diabetes_diagnostic_criterion_met", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "Diabetes diagnostic criteria met. Schedule clinical evaluation including: (1) Confirmatory lab test if single abnormal result. (2) HbA1c target goal setting. (3) Retinal and foot examination. (4) Lipid panel and blood pressure assessment. (5) Diabetes self-management education and support (DSMES).",
            },
        ],
    },
    {
        "code": "recommendation-limited-evidence-lab-completion",
        "name": "Recommendation: Complete Laboratory Testing",
        "description": "Advises lab completion when assessment lacks laboratory values for definitive diagnosis.",
        "category": "recommendation",
        "priority": "medium",
        "certainty_factor": 0.72,
        "status": "active",
        "explanation_text": "Diabetes diagnosis requires laboratory confirmation. Symptom-only screening has limited sensitivity. ADA recommends FPG, HbA1c, or OGTT for proper diagnosis.",
        "conditions": [
            {"fact_key": "no_lab_values_available", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "Assessment lacks laboratory data. A definitive diabetes diagnosis requires at least one of: (1) Fasting plasma glucose (≥8h fast). (2) HbA1c (NGSP-certified lab). (3) 75-g oral glucose tolerance test (2-hour value). Complete these tests to improve assessment reliability.",
            },
        ],
    },
    {
        "code": "recommendation-type2-risk-screening",
        "name": "Recommendation: Type 2 Diabetes Screening Schedule",
        "description": "Provides screening frequency guidance for individuals with identified type 2 risk factors.",
        "category": "recommendation",
        "priority": "medium",
        "certainty_factor": 0.7,
        "status": "active",
        "explanation_text": "ADA recommends that individuals with risk factors for type 2 diabetes be screened at least every 3 years, and every 1–2 years if prediabetes is identified.",
        "conditions": [
            {"fact_key": "type2_risk_increased", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "Type 2 diabetes risk factors identified. ADA recommends: (1) Routine diabetes screening every 3 years. (2) If prediabetes, repeat testing every 1–2 years. (3) Maintain healthy weight (BMI <25). (4) Exercise ≥150 min/week. (5) Follow a balanced diet rich in whole grains, vegetables, and lean proteins.",
            },
        ],
    },
    {
        "code": "recommendation-obesity-weight-management",
        "name": "Recommendation: Obesity Weight Management",
        "description": "Provides weight management guidance for obese patients to reduce diabetes risk.",
        "category": "recommendation",
        "priority": "medium",
        "certainty_factor": 0.72,
        "status": "active",
        "explanation_text": "In obese individuals, even modest weight loss (5–10%) significantly improves insulin sensitivity and reduces diabetes risk. ADA recommends structured weight management programs.",
        "conditions": [
            {"fact_key": "is_obese", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "Obesity identified (BMI ≥30). Weight management recommendations: (1) Target initial weight loss of 5–10% of body weight. (2) Caloric deficit through reduced portions and healthier food choices. (3) At least 150 minutes per week of moderate-intensity exercise. (4) Consider referral to dietitian or weight management program. (5) Screen for obstructive sleep apnea and metabolic syndrome.",
            },
        ],
    },
    {
        "code": "recommendation-confirmed-diabetes-comprehensive",
        "name": "Recommendation: Comprehensive Diabetes Management",
        "description": "Provides comprehensive management guidance when diabetes is confirmed with both FPG and HbA1c criteria.",
        "category": "recommendation",
        "priority": "high",
        "certainty_factor": 0.88,
        "status": "active",
        "explanation_text": "Confirmed diabetes requires a structured, multidisciplinary care plan including glycemic targets, complication screening, and ongoing self-management support.",
        "conditions": [
            {"fact_key": "diabetes_confirmed", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "Diabetes confirmed by dual criteria. Comprehensive management plan: (1) Set individualized HbA1c target (generally <7% for most adults). (2) Initiate metformin as first-line therapy unless contraindicated. (3) Retinal screening within 5 years of diagnosis for T2D (at diagnosis for T1D). (4) Annual foot exam. (5) Lipid panel and statin therapy if indicated. (6) Blood pressure target <130/80 mmHg. (7) Diabetes self-management education. (8) Psychological well-being assessment.",
            },
        ],
    },
    {
        "code": "triage-insulin-resistance-signs",
        "name": "Triage: Insulin Resistance Signs (Acanthosis / PCOS)",
        "description": "Flags patients exhibiting strong clinical markers of underlying insulin resistance.",
        "category": "triage",
        "priority": "medium",
        "certainty_factor": 0.65,
        "status": "active",
        "explanation_text": "Acanthosis nigricans and PCOS are widely recognized clinical signs of profound insulin resistance, which strongly predisposes patients to prediabetes and Type 2 Diabetes.",
        "conditions": [
            {"fact_key": "acanthosis_nigricans", "operator": "==", "expected_value": True, "logical_operator": "or"},
            {"fact_key": "pcos_history", "operator": "==", "expected_value": True, "logical_operator": "or"},
        ],
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "diabetes_possible",
                "conclusion": "High Risk of Insulin Resistance",
            },
        ],
    },
    {
        "code": "triage-neuropathy-warning",
        "name": "Triage: Potential Neuropathy (Tingling Extremities)",
        "description": "Flags potential peripheral neuropathy common in prolonged untreated diabetes.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.72,
        "status": "active",
        "explanation_text": "Tingling, burning, or numbness in the hands and feet is highly suspect for diabetic peripheral neuropathy, suggesting that hyperglycemia may have been present undetected for years.",
        "conditions": [
            {"fact_key": "tingling_hands_feet", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "diabetes_possible",
                "conclusion": "Possible Diabetic Neuropathy Screen",
            },
            {
                "action_type": "recommendation",
                "action_value": "Neuropathy Warning: Patient reports tingling in extremities. Recommend comprehensive foot exam, checking for peripheral pulse, and tuning fork/monofilament sensory assessment.",
            },
        ],
    },
    {
        "code": "classification-metabolic-syndrome",
        "name": "Classification: Metabolic Syndrome Criteria Met",
        "description": "Classifies the patient as having suspected metabolic syndrome due to high BMI, lipids, and hypertension.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.85,
        "status": "active",
        "explanation_text": "The simultaneous presence of obesity, high blood pressure, and dyslipidemia highly correlates with Metabolic Syndrome, sharply increasing cardiovascular and diabetes risks.",
        "conditions": [
            {"fact_key": "is_obese", "operator": "==", "expected_value": True},
            {"fact_key": "high_cholesterol", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "hypertension", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "metabolic_syndrome",
                "conclusion": "Metabolic Syndrome Profile",
            },
            {
                "action_type": "recommendation",
                "action_value": "Metabolic Syndrome identified. Recommend intensive lifestyle intervention, lipid panel monitoring, cardiovascular risk stratification, and aggressive blood pressure control.",
            },
        ],
    },
    {
        "code": "classification-gestational-risk",
        "name": "Classification: Prior Gestational Diabetes",
        "description": "Identifies lifetime elevated risk based on maternal history of GDM.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.60,
        "status": "active",
        "explanation_text": "Women with a history of gestational diabetes mellitus (GDM) have up to a 50% chance of developing type 2 diabetes later in life.",
        "conditions": [
            {"fact_key": "gestational_history", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "type2_risk_increased",
                "conclusion": "Post-GDM Elevated Risk",
            },
            {
                "action_type": "recommendation",
                "action_value": "Patient has a history of Gestational Diabetes. ADA mandates lifelong screening for Type 2 Diabetes at least every 3 years, regardless of other risk factors.",
            },
        ],
    },
    {
        "code": "classification-high-risk-demographics",
        "name": "Classification: Core Demographic Risk Factor",
        "description": "Flags patients who meet basic ADA age or ethnicity screening criteria.",
        "category": "classification",
        "priority": "low",
        "certainty_factor": 0.45,
        "status": "active",
        "explanation_text": "Current ADA guidelines recommend broad diabetes screening beginning at age 35, or earlier for adults from high-risk ethnic backgrounds.",
        "conditions": [
            {"fact_key": "age", "operator": ">=", "expected_value": 35, "logical_operator": "or"},
            {"fact_key": "ethnicity_high_risk", "operator": "==", "expected_value": True, "logical_operator": "or"},
            {"fact_key": "smoking", "operator": "==", "expected_value": True, "logical_operator": "or"},
        ],
        "actions": [
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "demographic_screening",
                "conclusion": "Demographic Screening Indicated",
            },
        ],
    },

    # ================================================================== #
    #  NEW RULES — Symptom-Only, Compound Risk, and Young At-Risk         #
    # ================================================================== #
    {
        "code": "diagnosis-symptom-only-screening",
        "name": "Diagnosis: Symptom-Only Screening (No Labs)",
        "description": "When classic diabetes symptoms are present but no lab values are available, flag as symptom-based screening requiring lab confirmation.",
        "category": "diagnosis",
        "priority": "medium",
        "certainty_factor": 0.55,
        "status": "active",
        "explanation_text": "Classic diabetes symptoms (polyuria, polydipsia, weight loss, fatigue) without laboratory data suggest possible diabetes but cannot be confirmed without testing. ADA requires lab confirmation for diagnosis.",
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
        "code": "diagnosis-symptom-cluster-no-labs",
        "name": "Diagnosis: Multiple Symptoms Without Labs",
        "description": "When 3+ diabetes-related symptoms are present without labs, provide stronger screening indication.",
        "category": "diagnosis",
        "priority": "medium",
        "certainty_factor": 0.60,
        "status": "active",
        "explanation_text": "Multiple concurrent diabetes symptoms (fatigue, blurred vision, slow healing, tingling, infections) significantly increase pre-test probability of diabetes, even without laboratory confirmation.",
        "conditions": [
            {"fact_key": "no_lab_values_available", "operator": "==", "expected_value": True},
            {"fact_key": "neuropathy_infection_cluster", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "diagnosis_conclusion", "action_value": "symptom_only_screening"},
            {
                "action_type": "recommendation",
                "action_value": "Multiple diabetes-associated symptoms detected (neuropathy signs + frequent infections). Priority laboratory testing recommended: HbA1c and fasting glucose within 1 week.",
            },
        ],
    },
    {
        "code": "classification-young-at-risk",
        "name": "Classification: Young At-Risk (<35 with Risk Factors)",
        "description": "ADA recommends screening adults under 35 if BMI ≥25 and one or more additional risk factors present.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.65,
        "status": "active",
        "explanation_text": "ADA Standards of Care (2025): Screen for prediabetes/diabetes in adults of any age with BMI ≥25 kg/m² AND one or more additional risk factors. Do not wait until age 35/45.",
        "conditions": [
            {"fact_key": "age", "operator": "<", "expected_value": 35},
            {"fact_key": "bmi", "operator": ">=", "expected_value": 25, "logical_operator": "and"},
            {"fact_key": "type2_risk_increased", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "early_screening_indicated=true"},
            {
                "action_type": "recommendation",
                "action_value": "Young patient with overweight/obesity and diabetes risk factors. ADA recommends screening regardless of age when BMI ≥25 with risk factors. Complete fasting glucose and HbA1c testing.",
            },
        ],
    },
    {
        "code": "classification-gestational-obesity-combo",
        "name": "Classification: Post-GDM + Obesity = Very High Risk",
        "description": "Women with prior gestational diabetes AND current obesity have very high (>60%) lifetime risk of Type 2 diabetes.",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.82,
        "status": "active",
        "explanation_text": "Prior gestational diabetes combined with obesity creates a compounding risk. Studies show >60% lifetime risk of developing Type 2 diabetes. Annual screening and intensive lifestyle intervention are critical.",
        "conditions": [
            {"fact_key": "gestational_obesity_high_risk", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type2_risk_increased=true"},
            {"action_type": "assert_fact", "action_value": "high_type2_risk_pattern=true"},
            {
                "action_type": "recommendation",
                "action_value": "Very high diabetes risk: Prior gestational diabetes + current obesity. Recommend: (1) Annual HbA1c and fasting glucose screening. (2) Target ≥7% weight loss. (3) ≥150 min/week moderate exercise. (4) Consider metformin for prevention (ADA grade A recommendation).",
            },
        ],
    },
    {
        "code": "triage-level3-hypoglycemia",
        "name": "Triage: Level 3 Hypoglycemia (Requires Assistance)",
        "description": "ADA Level 3 hypoglycemia: severe event requiring third-party assistance, with altered consciousness or seizure.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.98,
        "status": "active",
        "explanation_text": "ADA Level 3 hypoglycemia is a severe event characterized by altered mental and/or physical function requiring assistance from another person for recovery. This is a medical emergency.",
        "conditions": [
            {"fact_key": "blood_glucose", "operator": "<", "expected_value": 40},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "level3_hypoglycemia=true"},
            {"action_type": "assert_fact", "action_value": "severe_hypoglycemia=true"},
            {"action_type": "urgent_flag", "action_value": "true"},
            {
                "action_type": "recommendation",
                "action_value": "EMERGENCY: Level 3 severe hypoglycemia (<40 mg/dL). Call emergency services immediately. Administer glucagon if available. Do NOT attempt to give oral glucose if patient is unconscious or unable to swallow safely.",
            },
        ],
    },
    {
        "code": "diagnosis-neuropathy-with-diabetes-labs",
        "name": "Diagnosis: Neuropathy + Diabetic Lab Values",
        "description": "Tingling extremities combined with lab-confirmed hyperglycemia strongly suggests established diabetic neuropathy.",
        "category": "diagnosis",
        "priority": "high",
        "certainty_factor": 0.85,
        "status": "active",
        "explanation_text": "Peripheral neuropathy symptoms (tingling, numbness) in the setting of confirmed hyperglycemia (FPG ≥126 or HbA1c ≥6.5%) strongly indicates diabetic peripheral neuropathy, suggesting diabetes may have been undiagnosed for years.",
        "conditions": [
            {"fact_key": "tingling_hands_feet", "operator": "==", "expected_value": True},
            {"fact_key": "diabetes_diagnostic_criterion_met", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "diabetic_neuropathy_likely=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"},
            {
                "action_type": "recommendation",
                "action_value": "Diabetic neuropathy likely: Tingling extremities with confirmed hyperglycemia. Urgent referrals needed: (1) Comprehensive foot examination with monofilament testing. (2) Nerve conduction study. (3) Tight glycemic control to prevent progression. (4) Neuropathic pain management if symptomatic.",
            },
        ],
    },
    {
        "code": "classification-compound-smoking-obesity-family",
        "name": "Classification: Compound Risk (Smoking + Obesity + Family History)",
        "description": "Triple compound risk pattern that dramatically increases cardiovascular and diabetes risk.",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.80,
        "status": "active",
        "explanation_text": "Smoking, obesity, and family history of diabetes together create a compound risk that is greater than the sum of individual factors. Each independently increases insulin resistance and beta-cell dysfunction.",
        "conditions": [
            {"fact_key": "compound_risk_smoking_obesity_family", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type2_risk_increased=true"},
            {"action_type": "assert_fact", "action_value": "high_type2_risk_pattern=true"},
            {
                "action_type": "recommendation",
                "action_value": "High compound risk identified (smoking + obesity + family history). Urgent recommendations: (1) Smoking cessation program. (2) Weight management target 5-10% reduction. (3) Annual HbA1c and lipid monitoring. (4) CardioVascular risk assessment. (5) Consider aspirin therapy if CVD risk >10%.",
            },
        ],
    },
    {
        "code": "classification-pcos-prediabetes",
        "name": "Classification: PCOS + Prediabetes = Accelerated Risk",
        "description": "PCOS with concurrent prediabetes carries very high diabetes conversion rate requiring aggressive intervention.",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.78,
        "status": "active",
        "explanation_text": "Women with PCOS and prediabetes have a significantly accelerated rate of conversion to Type 2 diabetes due to underlying insulin resistance. Metformin may serve dual purpose.",
        "conditions": [
            {"fact_key": "pcos_prediabetes_risk", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type2_risk_increased=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "prediabetes_possible"},
            {
                "action_type": "recommendation",
                "action_value": "PCOS + prediabetes: Accelerated diabetes risk. Recommend: (1) Metformin therapy (addresses both PCOS and diabetes prevention). (2) Weight management. (3) HbA1c monitoring every 6 months. (4) Endocrine referral for comprehensive PCOS management.",
            },
        ],
    },
    {
        "code": "triage-neuropathy-infection-fatigue-cluster",
        "name": "Triage: Hidden Diabetes Pattern (Neuropathy + Infections + Fatigue)",
        "description": "Tingling extremities, frequent infections, and fatigue together form a strong hidden diabetes pattern often missed in primary care.",
        "category": "triage",
        "priority": "medium",
        "certainty_factor": 0.70,
        "status": "active",
        "explanation_text": "This symptom triad (peripheral neuropathy, recurrent infections, persistent fatigue) is a classic 'hidden diabetes' presentation. Hyperglycemia impairs immune function and nerve health simultaneously.",
        "conditions": [
            {"fact_key": "neuropathy_infection_cluster", "operator": "==", "expected_value": True},
            {"fact_key": "fatigue", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "hidden_diabetes_pattern=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_possible"},
            {
                "action_type": "recommendation",
                "action_value": "Hidden diabetes pattern detected (tingling + frequent infections + fatigue). This combination suggests possible longstanding undiagnosed diabetes. Priority: Obtain HbA1c, fasting glucose, and complete blood count. Schedule comprehensive foot and neurological exam.",
            },
        ],
    },
    {
        "code": "recommendation-pcos-obesity-screening",
        "name": "Recommendation: PCOS + Obesity Screening",
        "description": "Provides targeted screening guidance for women with PCOS and obesity.",
        "category": "recommendation",
        "priority": "medium",
        "certainty_factor": 0.75,
        "status": "active",
        "explanation_text": "Women with PCOS and obesity have 4-8x higher risk of developing Type 2 diabetes. ADA and Endocrine Society recommend regular metabolic screening.",
        "conditions": [
            {"fact_key": "pcos_obesity_risk", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "PCOS + obesity: Elevated metabolic risk. Recommendations: (1) Annual OGTT preferred over HbA1c (PCOS affects HbA1c accuracy). (2) Lipid panel and liver function tests. (3) Weight management with target 5-10% reduction. (4) Screen for obstructive sleep apnea. (5) Consider myo-inositol supplementation.",
            },
        ],
    },
    {
        "code": "recommendation-young-type2-prevention",
        "name": "Recommendation: Type 2 Prevention for Young Adults",
        "description": "Provides early prevention guidance for young adults (18-35) with identified risk factors.",
        "category": "recommendation",
        "priority": "medium",
        "certainty_factor": 0.70,
        "status": "active",
        "explanation_text": "Type 2 diabetes in young adults is rising rapidly. Early intervention during this window is highly effective because beta-cell function is usually still preserved.",
        "conditions": [
            {"fact_key": "early_screening_indicated", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "Young adult with diabetes risk factors. Prevention plan: (1) Target BMI <25 through sustainable lifestyle changes. (2) 150-300 min/week of moderate-to-vigorous exercise. (3) Limit added sugars and ultra-processed foods. (4) Annual fasting glucose and HbA1c screening. (5) Consider genetic counseling if strong family history.",
            },
        ],
    },

    # ================================================================== #
    #  NEW RULES — Enhanced Clinical Accuracy & Reassurance               #
    # ================================================================== #
    {
        "code": "diagnosis-healthy-normal-labs",
        "name": "Diagnosis: Normal Lab Results — Healthy Assessment",
        "description": "When fasting glucose is normal (<100) AND HbA1c is normal (<5.7%) AND no classic symptoms are present, classify as healthy normal.",
        "category": "diagnosis",
        "priority": "low",
        "certainty_factor": 0.75,
        "status": "active",
        "explanation_text": "Both fasting glucose and HbA1c are within normal ranges, and no classic diabetes symptoms are reported. This indicates normal glucose regulation at the time of assessment.",
        "conditions": [
            {"fact_key": "normal_fasting_glucose", "operator": "==", "expected_value": True},
            {"fact_key": "normal_hba1c", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "diagnosis_conclusion", "action_value": "healthy_normal"},
            {
                "action_type": "recommendation",
                "action_value": "Your fasting glucose and HbA1c are both within normal ranges. No diabetes or prediabetes detected at this time. Continue healthy lifestyle habits and schedule routine screening as recommended by your doctor.",
            },
        ],
    },
    {
        "code": "diagnosis-healthy-normal-single-lab",
        "name": "Diagnosis: Single Normal Lab — Reassurance",
        "description": "When at least one lab is normal and no diabetes symptoms are present, provide reassurance while recommending follow-up.",
        "category": "diagnosis",
        "priority": "low",
        "certainty_factor": 0.60,
        "status": "active",
        "explanation_text": "At least one laboratory value is in the normal range and the patient reports no classic diabetes symptoms. While a single normal test is reassuring, ADA recommends periodic re-screening if risk factors are present.",
        "conditions": [
            {"fact_key": "normal_fasting_glucose", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {"action_type": "diagnosis_conclusion", "action_value": "healthy_normal"},
            {
                "action_type": "recommendation",
                "action_value": "Your fasting glucose is within the normal range. Continue maintaining a healthy lifestyle. If you have risk factors (family history, obesity, etc.), schedule HbA1c testing for a more complete assessment.",
            },
        ],
    },
    {
        "code": "diagnosis-prediabetes-with-classic-symptoms",
        "name": "Diagnosis: Prediabetes + Classic Symptoms = Elevated Concern",
        "description": "Prediabetes lab values combined with classic diabetes symptoms warrant more aggressive follow-up than prediabetes alone.",
        "category": "diagnosis",
        "priority": "medium",
        "certainty_factor": 0.80,
        "status": "active",
        "explanation_text": "Prediabetes laboratory values in a patient with classic hyperglycemia symptoms (polyuria, polydipsia, weight loss) suggest more rapid glycemic deterioration than typical prediabetes.",
        "conditions": [
            {"fact_key": "prediabetes_possible", "operator": "==", "expected_value": True},
            {"fact_key": "classic_hyperglycemia_symptoms", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "prediabetes_high_confidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "prediabetes_possible"},
            {
                "action_type": "recommendation",
                "action_value": "Prediabetes with classic diabetes symptoms detected. This combination suggests faster progression risk. Recommendations: (1) Repeat fasting glucose and HbA1c in 1–3 months (not 6 months). (2) Begin intensive lifestyle intervention immediately. (3) Discuss metformin with your doctor. (4) Monitor symptoms closely.",
            },
        ],
    },
    {
        "code": "diagnosis-triple-lab-confirmation",
        "name": "Diagnosis: Triple Lab Confirmation (FPG + HbA1c + OGTT)",
        "description": "When all three primary lab markers exceed diabetes threshold, this represents the strongest possible diagnostic evidence.",
        "category": "diagnosis",
        "priority": "high",
        "certainty_factor": 0.98,
        "status": "active",
        "explanation_text": "Three concordant abnormal results (FPG ≥126, HbA1c ≥6.5%, 2h-OGTT ≥200) establish diabetes with the highest possible confidence. No further confirmatory testing is needed.",
        "conditions": [
            {"fact_key": "fasting_glucose", "operator": ">=", "expected_value": 126},
            {"fact_key": "hba1c", "operator": ">=", "expected_value": 6.5, "logical_operator": "and"},
            {"fact_key": "2h_ogtt_75g", "operator": ">=", "expected_value": 200, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "diabetes_confirmed=true"},
            {"action_type": "assert_fact", "action_value": "diabetes_diagnostic_criterion_met=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"},
            {
                "action_type": "recommendation",
                "action_value": "Diabetes confirmed by all three diagnostic criteria (FPG, HbA1c, OGTT). Immediate action: (1) Schedule endocrinology or primary care appointment within 1-2 weeks. (2) Begin diabetes self-management education. (3) Comprehensive screening for complications (eyes, feet, kidneys, cardiovascular). (4) Treatment initiation based on clinical presentation.",
            },
        ],
    },
    {
        "code": "diagnosis-labs-normal-symptoms-present",
        "name": "Diagnosis: Normal Labs but Symptoms Present",
        "description": "When lab values are normal but diabetes-like symptoms exist, recommend monitoring and additional investigations.",
        "category": "diagnosis",
        "priority": "low",
        "certainty_factor": 0.50,
        "status": "active",
        "explanation_text": "Normal glucose metabolism with diabetes-like symptoms may indicate early/fluctuating hyperglycemia, or symptoms may be attributable to other conditions. Close monitoring is warranted.",
        "conditions": [
            {"fact_key": "normal_fasting_glucose", "operator": "==", "expected_value": True},
            {"fact_key": "classic_hyperglycemia_symptoms", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "Your lab values are currently normal, but you report symptoms associated with diabetes. Recommendations: (1) Repeat fasting glucose in 1–3 months. (2) Request HbA1c if not already tested. (3) Consider OGTT for more sensitive detection. (4) Investigate other potential causes of your symptoms with your doctor. (5) Monitor symptom changes.",
            },
        ],
    },
    {
        "code": "classification-borderline-prediabetes-alert",
        "name": "Classification: Borderline High-Normal Glucose (95–99 mg/dL)",
        "description": "FPG 95-99 mg/dL is technically normal but approaching the prediabetes threshold. Proactive awareness is beneficial.",
        "category": "classification",
        "priority": "low",
        "certainty_factor": 0.45,
        "status": "active",
        "explanation_text": "While technically normal, fasting glucose between 95-99 mg/dL sits at the upper boundary. Studies show that even high-normal glucose increases future diabetes risk compared to glucose <90 mg/dL.",
        "conditions": [
            {"fact_key": "fasting_glucose", "operator": ">=", "expected_value": 95},
            {"fact_key": "fasting_glucose", "operator": "<", "expected_value": 100, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "borderline_glucose=true"},
            {
                "action_type": "recommendation",
                "action_value": "Your fasting glucose is in the high-normal range (95-99 mg/dL). While technically normal, this is approaching the prediabetes threshold. Proactive steps: (1) Adopt a low-glycemic diet. (2) Regular physical activity. (3) Re-test in 6-12 months to track trends.",
            },
        ],
    },
    {
        "code": "diagnosis-ogtt-with-symptoms",
        "name": "Diagnosis: OGTT ≥200 + Symptoms = Strong Diabetes Evidence",
        "description": "Abnormal OGTT combined with classic symptoms provides very strong diagnostic evidence.",
        "category": "diagnosis",
        "priority": "high",
        "certainty_factor": 0.94,
        "status": "active",
        "explanation_text": "A 2-hour OGTT ≥200 mg/dL in a patient with classic hyperglycemia symptoms is very strong evidence for diabetes. This combination rarely requires additional confirmatory testing.",
        "conditions": [
            {"fact_key": "2h_ogtt_75g", "operator": ">=", "expected_value": 200},
            {"fact_key": "classic_hyperglycemia_symptoms", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "diabetes_diagnostic_criterion_met=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_likely"},
            {
                "action_type": "recommendation",
                "action_value": "OGTT result combined with classic symptoms strongly indicates diabetes. Please schedule a comprehensive diabetes evaluation within 1-2 weeks. Treatment initiation should not be delayed.",
            },
        ],
    },
    {
        "code": "recommendation-diabetes-confirmed-comprehensive-v2",
        "name": "Recommendation: Confirmed Diabetes — Comprehensive Action Plan",
        "description": "Enhanced comprehensive management guidance when diabetes is confirmed by multiple criteria.",
        "category": "recommendation",
        "priority": "high",
        "certainty_factor": 0.90,
        "status": "active",
        "explanation_text": "Confirmed diabetes requires a structured, multidisciplinary care plan following ADA Standards of Care 2025.",
        "conditions": [
            {"fact_key": "diabetes_confirmed", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "Diabetes confirmed. Your comprehensive care plan should include: (1) Individualized HbA1c target (generally <7% for most adults, <6.5% if low hypoglycemia risk). (2) Metformin as first-line therapy unless contraindicated. (3) SGLT2 inhibitor or GLP-1 receptor agonist if cardiovascular or renal disease risk. (4) Retinal screening within 5 years (or at diagnosis for T2D). (5) Annual foot exam and vaccination schedule. (6) Lipid panel — statin therapy if indicated. (7) Blood pressure target <130/80 mmHg. (8) Diabetes self-management education. (9) Psychological well-being assessment. (10) Ongoing HbA1c monitoring every 3 months until stable, then every 6 months.",
            },
        ],
    },

    # ================================================================== #
    #  PREGNANCY / GESTATIONAL DIABETES RULES                             #
    #  Reference: ADA Standards of Care; IADPSG pregnancy thresholds      #
    # ================================================================== #
    {
        "code": "classification-pregnancy-screening",
        "name": "Classification: Pregnancy — Gestational Screening Pathway",
        "description": "A currently pregnant patient is routed to the gestational diabetes screening pathway (OGTT 75g between weeks 24-28, or earlier with risk factors).",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.75,
        "status": "active",
        "explanation_text": "Gestational diabetes mellitus (GDM) is usually symptomless and is screened with an oral glucose tolerance test, typically between weeks 24-28 of pregnancy. Blood-sugar thresholds during pregnancy are stricter than for the general population.",
        "conditions": [
            {"fact_key": "currently_pregnant", "operator": "==", "expected_value": True},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "pregnancy_screening_recommended=true"},
            {
                "action_type": "diagnosis_conclusion",
                "action_value": "gestational_screening",
                "conclusion": "Gestational Diabetes Screening Pathway",
            },
            {
                "action_type": "recommendation",
                "action_value": "Pregnancy detected. Screen for gestational diabetes with a 75g OGTT (ideally between weeks 24-28; earlier if risk factors such as prior GDM, obesity, or family history are present). Pregnancy glucose thresholds are stricter: fasting >= 92 mg/dL, 1h >= 180 mg/dL, or 2h >= 153 mg/dL on OGTT indicates GDM (IADPSG criteria).",
            },
        ],
    },
    {
        "code": "triage-pregnant-fasting-high",
        "name": "Triage: Pregnancy with Elevated Fasting Glucose (IADPSG)",
        "description": "Flags possible gestational diabetes when a pregnant patient has fasting glucose >= 92 mg/dL — urgent obstetric review per IADPSG.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.9,
        "status": "active",
        "explanation_text": "During pregnancy, a fasting glucose of 92 mg/dL or higher meets IADPSG criteria for gestational diabetes and requires prompt obstetric review because unmanaged GDM risks both mother and baby.",
        "conditions": [
            {"fact_key": "currently_pregnant", "operator": "==", "expected_value": True},
            {"fact_key": "fasting_glucose", "operator": ">=", "expected_value": 92, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "gestational_diabetes_suspected=true"},
            {"action_type": "urgent_flag", "action_value": "true"},
            {
                "action_type": "recommendation",
                "action_value": "Fasting glucose meets pregnancy thresholds for gestational diabetes (>= 92 mg/dL per IADPSG). Schedule obstetric review within 1 week. Management starts with diet and glucose monitoring; insulin if targets are not met. Untreated GDM increases risks of macrosomia, pre-eclampsia, and neonatal hypoglycemia.",
            },
        ],
    },
    {
        "code": "triage-pregnant-ogtt-high",
        "name": "Triage: Pregnancy with Elevated OGTT (IADPSG)",
        "description": "Flags possible gestational diabetes when a pregnant patient has 2-hour OGTT >= 153 mg/dL — urgent obstetric review per IADPSG.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.9,
        "status": "active",
        "explanation_text": "During pregnancy, a 2-hour OGTT of 153 mg/dL or higher meets IADPSG criteria for gestational diabetes and requires prompt obstetric review.",
        "conditions": [
            {"fact_key": "currently_pregnant", "operator": "==", "expected_value": True},
            {"fact_key": "2h_ogtt_75g", "operator": ">=", "expected_value": 153, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "gestational_diabetes_suspected=true"},
            {"action_type": "urgent_flag", "action_value": "true"},
            {
                "action_type": "recommendation",
                "action_value": "OGTT result meets pregnancy thresholds for gestational diabetes (2h >= 153 mg/dL per IADPSG). Schedule obstetric review within 1 week for confirmation and a management plan.",
            },
        ],
    },
    {
        "code": "triage-pregnant-prior-gdm-early-test",
        "name": "Triage: Pregnant with Prior GDM — Test Early",
        "description": "Pregnant patient with previous gestational diabetes should be tested at the first prenatal visit, not only at weeks 24-28.",
        "category": "triage",
        "priority": "medium",
        "certainty_factor": 0.82,
        "status": "active",
        "explanation_text": "A previous episode of gestational diabetes is one of the strongest risk factors for recurrence. ADA recommends early testing at the first prenatal visit in addition to routine week 24-28 screening.",
        "conditions": [
            {"fact_key": "currently_pregnant", "operator": "==", "expected_value": True},
            {"fact_key": "gestational_history", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {
                "action_type": "recommendation",
                "action_value": "Prior gestational diabetes with current pregnancy: arrange glucose testing at the first prenatal visit (not only at weeks 24-28), plus lifestyle counselling. Recurrence risk is high (30-70%).",
            },
        ],
    },

    # ================================================================== #
    #  TYPE-DISCRIMINATION RULES — T1D vs T2D vs GDM evidence patterns    #
    #  Diabetes types share the same classic symptoms, so typing relies   #
    #  on *discriminating* evidence: onset tempo, body habitus, age,      #
    #  catabolism, ketosis signs, insulin-resistance markers.             #
    #  Each rule contributes certainty to a type-pattern conclusion;      #
    #  the engine ranks patterns and reports Mixed/Undetermined honestly. #
    # ================================================================== #

    {
        "code": "triage-polyphagia-triad",
        "name": "Triage: Classic Triad with Polyphagia",
        "description": "Excessive hunger (polyphagia) with frequent urination and thirst forms the classic hyperglycemic triad — strengthens the classic symptom cluster.",
        "category": "triage",
        "priority": "medium",
        "certainty_factor": 0.78,
        "status": "active",
        "explanation_text": "Polyphagia together with polyuria and polydipsia is the classic hyperglycemic triad: the body is starved of glucose at the cellular level while blood glucose rises.",
        "conditions": [
            {"fact_key": "excessive_hunger", "operator": "==", "expected_value": True},
            {"fact_key": "frequent_urination", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "excessive_thirst", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "classic_hyperglycemia_symptoms=true"},
            {"action_type": "assert_fact", "action_value": "symptom_strength=high"},
        ],
    },
    {
        "code": "triage-child-bedwetting-red-flag",
        "name": "Triage: Child with New Bed-Wetting",
        "description": "New-onset bed-wetting in a child with frequent urination is a pediatric diabetes red flag requiring prompt clinical review.",
        "category": "triage",
        "priority": "high",
        "certainty_factor": 0.85,
        "status": "active",
        "explanation_text": "In children, new bed-wetting after previous dryness with increased urination is a classic Type 1 diabetes warning sign. Children progress to DKA faster than adults — same-day clinical review is advised.",
        "conditions": [
            {"fact_key": "age", "operator": "<", "expected_value": 18},
            {"fact_key": "bed_wetting", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "frequent_urination", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "urgent_flag", "action_value": "true"},
            {
                "action_type": "recommendation",
                "action_value": "New bed-wetting with increased urination in a child is a diabetes red flag. Arrange same-day clinical review with a finger-prick glucose test.",
            },
        ],
    },
    {
        "code": "triage-irritability-hypoglycemia",
        "name": "Triage: Irritability with Hypoglycemia",
        "description": "Irritability is a neuroglycopenic symptom that strengthens hypoglycemia evidence.",
        "category": "triage",
        "priority": "medium",
        "certainty_factor": 0.7,
        "status": "active",
        "explanation_text": "Irritability and mood changes accompany low blood glucose as the brain responds to fuel shortage.",
        "conditions": [
            {"fact_key": "hypoglycemia", "operator": "==", "expected_value": True},
            {"fact_key": "irritability", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "symptomatic_hypoglycemia=true"},
        ],
    },
    {
        "code": "triage-infection-glucose-link",
        "name": "Triage: Recurrent UTI/Yeast Infections with Hyperglycemia",
        "description": "Recurrent genitourinary infections in the presence of hyperglycemia suggest glucose-driven infection risk (CDC recognized sign).",
        "category": "triage",
        "priority": "medium",
        "certainty_factor": 0.75,
        "status": "active",
        "explanation_text": "High glucose in urine feeds bacterial and yeast growth. Recurrent UTIs or yeast infections are a recognized diabetes sign (CDC) and often precede diagnosis in adults with Type 2.",
        "conditions": [
            {"fact_key": "recurrent_uti_yeast", "operator": "==", "expected_value": True},
            {"fact_key": "hyperglycemia_present", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "infection_glucose_link=true"},
            {
                "action_type": "recommendation",
                "action_value": "Recurrent infections with elevated glucose suggest glucose-driven infection risk. Treat the infection and improve glycemic control — discuss with the clinical team.",
            },
        ],
    },

    # ── Type 1 pattern: insulin-deficiency / autoimmune presentation ── #
    {
        "code": "classification-type1-sudden-onset",
        "name": "Type 1 Pattern: Sudden Symptom Onset with Catabolism",
        "description": "Classic symptoms that appeared suddenly (days to weeks) with unexplained weight loss fits the Type 1 insulin-deficiency tempo.",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.75,
        "status": "active",
        "explanation_text": "Type 1 diabetes usually presents abruptly: symptoms appear over days to weeks as autoimmune beta-cell destruction crosses the insulin-deficiency threshold, and weight is lost despite normal eating. Type 2 develops gradually over years.",
        "conditions": [
            {"fact_key": "classic_hyperglycemia_symptoms", "operator": "==", "expected_value": True},
            {"fact_key": "rapid_onset", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "weight_loss", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type1_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type1_pattern_likely"},
            {
                "action_type": "recommendation",
                "action_value": "Sudden onset with weight loss fits a Type 1 pattern. This can progress to diabetic ketoacidosis quickly — urgent same-week medical review is required, do not wait for routine appointments.",
            },
        ],
    },
    {
        "code": "classification-type1-young-catabolic",
        "name": "Type 1 Pattern: Young Age with Catabolic Features",
        "description": "Age ≤35 with classic symptoms and weight loss raises Type 1 probability — T1D incidence peaks in childhood and young adulthood.",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.7,
        "status": "active",
        "explanation_text": "Although Type 2 is common in adults, new classic symptoms with weight loss under age 35 warrant considering Type 1 diabetes and prompt full workup.",
        "conditions": [
            {"fact_key": "classic_hyperglycemia_symptoms", "operator": "==", "expected_value": True},
            {"fact_key": "age", "operator": "<=", "expected_value": 35, "logical_operator": "and"},
            {"fact_key": "weight_loss", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type1_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type1_pattern_likely"},
        ],
    },
    {
        "code": "classification-type1-child-presentation",
        "name": "Type 1 Pattern: Pediatric Presentation",
        "description": "Classic symptoms in a child under 18 — especially with bed-wetting — is the most common Type 1 presentation.",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.78,
        "status": "active",
        "explanation_text": "Type 1 is the dominant diabetes type in children. New polyuria/polydipsia (±bed-wetting) in a child requires same-day glucose testing — children decompensate into DKA faster than adults.",
        "conditions": [
            {"fact_key": "age", "operator": "<", "expected_value": 18},
            {"fact_key": "classic_hyperglycemia_symptoms", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "bed_wetting", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type1_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type1_pattern_likely"},
        ],
    },
    {
        "code": "classification-type1-ketosis-with-hyperglycemia",
        "name": "Type 1 Pattern: Ketosis Signs with Hyperglycemia",
        "description": "Fruity breath or deep rapid breathing with documented hyperglycemia signals ketosis — strongly associated with Type 1 / insulin deficiency.",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.8,
        "status": "active",
        "explanation_text": "Fruity (acetone) breath and deep, rapid breathing (Kussmaul respiration) occur when the body burns fat for fuel because insulin is absent. With high glucose this may be evolving DKA — an emergency.",
        "conditions": [
            {"fact_key": "ketosis_signs_present", "operator": "==", "expected_value": True},
            {"fact_key": "hyperglycemia_present", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type1_pattern_evidence=true"},
            {"action_type": "urgent_flag", "action_value": "true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type1_pattern_likely"},
            {
                "action_type": "recommendation",
                "action_value": "Ketosis signs with high blood glucose can indicate DKA. Seek emergency care now — do not wait for lab confirmation.",
            },
        ],
    },
    {
        "code": "classification-type1-ketosis-symptom-only",
        "name": "Type 1 Pattern: Ketosis Signs without Lab Values",
        "description": "Ketosis signs reported alongside classic symptoms, even without labs, fit the Type 1 insulin-deficiency pattern.",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.7,
        "status": "active",
        "explanation_text": "Acetone breath or deep rapid breathing together with classic symptoms suggests significant insulin deficiency even before labs are available.",
        "conditions": [
            {"fact_key": "ketosis_signs_present", "operator": "==", "expected_value": True},
            {"fact_key": "classic_hyperglycemia_symptoms", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "no_lab_values_available", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type1_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type1_pattern_likely"},
        ],
    },
    {
        "code": "classification-type1-lean-catabolic",
        "name": "Type 1 Pattern: Lean Adult with Catabolic State",
        "description": "Confirmed hyperglycemia in a lean adult (BMI <25) who is eating normally but losing weight fits insulin deficiency rather than insulin resistance.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.72,
        "status": "active",
        "explanation_text": "Type 2 usually accompanies overweight/obesity. Diabetes in a lean adult with catabolic weight loss (eating normally while losing) is atypical for Type 2 and suggests insulin deficiency — consider T1D, LADA, or other specific types.",
        "conditions": [
            {"fact_key": "diabetes_evidence_base", "operator": "==", "expected_value": True},
            {"fact_key": "catabolic_pattern", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "bmi", "operator": "<", "expected_value": 25, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type1_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type1_pattern_likely"},
            {
                "action_type": "recommendation",
                "action_value": "Lean body habitus with catabolic weight loss is atypical for Type 2. Ask the clinician about autoantibody (GAD) and C-peptide testing to distinguish Type 1 / LADA.",
            },
        ],
    },

    # ── Type 2 pattern: insulin-resistance / gradual metabolic presentation ── #
    {
        "code": "classification-type2-acanthosis",
        "name": "Type 2 Pattern: Acanthosis Nigricans (Insulin-Resistance Marker)",
        "description": "Dark velvety skin patches with confirmed hyperglycemia are a near-direct marker of insulin resistance — the mechanism behind Type 2.",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.7,
        "status": "active",
        "explanation_text": "Acanthosis nigricans is a visible skin marker of long-standing insulin resistance and is strongly associated with Type 2 diabetes, not Type 1.",
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
        "code": "classification-type2-metabolic-cluster",
        "name": "Type 2 Pattern: Metabolic Cluster",
        "description": "Hypertension + high cholesterol + overweight BMI alongside confirmed hyperglycemia forms the classic Type 2 metabolic profile.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.68,
        "status": "active",
        "explanation_text": "Type 2 diabetes rarely travels alone: elevated blood pressure, dyslipidemia and excess weight share the same insulin-resistance root. This cluster is typical of Type 2 and drives cardiovascular risk management.",
        "conditions": [
            {"fact_key": "diabetes_evidence_base", "operator": "==", "expected_value": True},
            {"fact_key": "hypertension", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "high_cholesterol", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "bmi", "operator": ">=", "expected_value": 25, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type2_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type2_pattern_likely"},
        ],
    },
    {
        "code": "classification-type2-gradual-adult",
        "name": "Type 2 Pattern: Gradual Onset in Middle Age",
        "description": "Confirmed hyperglycemia at age ≥40 with overweight BMI fits the slow, metabolic Type 2 tempo.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.6,
        "status": "active",
        "explanation_text": "Type 2 diabetes typically develops silently over years and is most often diagnosed from middle age onwards, usually alongside overweight. Sudden catabolic onset would point away from this pattern.",
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
        "code": "classification-type2-explicit-gradual",
        "name": "Type 2 Pattern: Explicitly Gradual Symptom Build-Up",
        "description": "When the patient reports symptoms built up gradually over months to years, that tempo supports Type 2 over Type 1.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.55,
        "status": "active",
        "explanation_text": "A slow, months-to-years build-up of symptoms is the natural history of insulin resistance (Type 2). Type 1, by contrast, appears within days to weeks.",
        "conditions": [
            {"fact_key": "diabetes_evidence_base", "operator": "==", "expected_value": True},
            {"fact_key": "rapid_onset", "operator": "==", "expected_value": False, "logical_operator": "and"},
            {"fact_key": "age", "operator": ">=", "expected_value": 30, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type2_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type2_pattern_likely"},
        ],
    },
    {
        "code": "classification-type2-complications-herald",
        "name": "Type 2 Pattern: Complication Herald Signs",
        "description": "Tingling/numbness with slow-healing wounds alongside confirmed hyperglycemia suggests years of silent hyperglycemia — the typical Type 2 discovery pattern.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.66,
        "status": "active",
        "explanation_text": "Neuropathy and delayed wound healing take months to years of high glucose to develop. Finding them at first diagnosis implies long-standing undetected hyperglycemia — a hallmark of silently progressing Type 2.",
        "conditions": [
            {"fact_key": "diabetes_evidence_base", "operator": "==", "expected_value": True},
            {"fact_key": "tingling_hands_feet", "operator": "==", "expected_value": True, "logical_operator": "and"},
            {"fact_key": "slow_healing", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type2_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type2_pattern_likely"},
        ],
    },
    {
        "code": "classification-type2-recurrent-infections",
        "name": "Type 2 Pattern: Recurrent Genitourinary Infections",
        "description": "Recurrent UTIs or yeast infections with confirmed hyperglycemia commonly accompany Type 2 presentations in adults.",
        "category": "classification",
        "priority": "low",
        "certainty_factor": 0.6,
        "status": "active",
        "explanation_text": "Recurrent genitourinary infections are a recognized CDC diabetes sign and are frequently part of the Type 2 presentation in adults, driven by glucosuria and immune impairment.",
        "conditions": [
            {"fact_key": "diabetes_evidence_base", "operator": "==", "expected_value": True},
            {"fact_key": "recurrent_uti_yeast", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "type2_pattern_evidence=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "type2_pattern_likely"},
        ],
    },

    # ── Gestational pattern ── #
    {
        "code": "classification-gdm-pattern",
        "name": "Gestational Pattern: Diagnostic Criteria Met During Pregnancy",
        "description": "Any ADA diagnostic glucose criterion met during pregnancy fits gestational diabetes (or pre-existing diabetes unmasked by pregnancy).",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.78,
        "status": "active",
        "explanation_text": "Glucose criteria met during pregnancy follow the gestational diabetes pathway. Very high values in the first trimester may instead reflect previously undiagnosed Type 2 — the obstetric team will distinguish.",
        "conditions": [
            {"fact_key": "currently_pregnant", "operator": "==", "expected_value": True},
            {"fact_key": "diabetes_diagnostic_criterion_met", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "gestational_diabetes_suspected=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "gestational_diabetes_likely"},
        ],
    },
    {
        "code": "classification-gdm-screen-positive",
        "name": "Gestational Pattern: Pregnancy Threshold Breached",
        "description": "Pregnancy-specific triage thresholds breached (e.g. fasting ≥92 mg/dL) fit the gestational diabetes pattern even below general diabetes criteria.",
        "category": "classification",
        "priority": "high",
        "certainty_factor": 0.72,
        "status": "active",
        "explanation_text": "Pregnancy uses stricter glucose thresholds (IADPSG): fasting ≥92 mg/dL already meets the gestational diabetes range even though it is normal outside pregnancy.",
        "conditions": [
            {"fact_key": "currently_pregnant", "operator": "==", "expected_value": True},
            {"fact_key": "gestational_diabetes_suspected", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "diagnosis_conclusion", "action_value": "gestational_diabetes_likely"},
        ],
    },

    # ── Mixed-type features ── #
    {
        "code": "classification-mixed-type-features",
        "name": "Mixed Pattern: Evidence Fits More Than One Type",
        "description": "Both Type 1 and Type 2 pattern evidence present — screening alone cannot assign a type; specialist typing required.",
        "category": "classification",
        "priority": "medium",
        "certainty_factor": 0.8,
        "status": "active",
        "explanation_text": "The evidence contains features of more than one diabetes type (e.g. young onset AND insulin-resistance signs). This is seen in LADA and other overlapping presentations — only clinical typing (autoantibodies, C-peptide) can resolve it.",
        "conditions": [
            {"fact_key": "type1_pattern_evidence", "operator": "==", "expected_value": True},
            {"fact_key": "type2_pattern_evidence", "operator": "==", "expected_value": True, "logical_operator": "and"},
        ],
        "actions": [
            {"action_type": "assert_fact", "action_value": "mixed_type_features=true"},
            {
                "action_type": "recommendation",
                "action_value": "The evidence pattern mixes features of Type 1 and Type 2. Ask about autoantibody (GAD) and C-peptide testing — overlapping presentations such as LADA are easily missed and are treated differently.",
            },
        ],
    },
]

