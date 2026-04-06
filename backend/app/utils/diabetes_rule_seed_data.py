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
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_possible"},
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
        "certainty_factor": 0.50,
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
        "certainty_factor": 0.30,
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
    }
]
