"""Catalog definitions for existing v3 inputs and derived rule facts.

These entries document the current engine contract; they do not introduce
new thresholds or independently contribute to symptom confidence.
"""

RULE_INPUT_FACT_SEED = [
    {
        "key": "age",
        "label": "Age (years)",
        "label_km": "អាយុ (ឆ្នាំ)",
        "category": "profile",
        "question": "How old are you in completed years?",
        "question_km": "តើអ្នកមានអាយុប៉ុន្មានឆ្នាំ?",
        "meaning": "Numeric age in years, used by screening and classification rules.",
        "weight": 0.0,
        "display_order": 700,
    },
    {
        "key": "bmi",
        "label": "Body Mass Index (kg/m²)",
        "label_km": "សន្ទស្សន៍ម៉ាសរាងកាយ (គីឡូក្រាម/ម៉ែត្រការ៉េ)",
        "category": "profile",
        "meaning": "Numeric BMI supplied directly or calculated from weight and height by fact preparation.",
        "weight": 0.0,
        "display_order": 710,
    },
    {
        "key": "blood_glucose",
        "label": "Blood Glucose (mg/dL)",
        "label_km": "ជាតិស្ករក្នុងឈាម (mg/dL)",
        "category": "lab",
        "question": "What is your measured blood glucose in mg/dL?",
        "question_km": "តើកម្រិតជាតិស្ករក្នុងឈាមដែលបានវាស់របស់អ្នកមានប៉ុន្មាន mg/dL?",
        "meaning": "Numeric glucose measurement used by the existing hypoglycemia triage rules. Fasting, random plasma and OGTT results retain their separate fact keys.",
        "weight": 0.0,
        "display_order": 720,
    },
]

# Derived values are produced by fact normalization or rule actions. They
# have no interview questions, aliases or independent symptom weights.
_DERIVED_DEFINITIONS = [
    ("family_history_diabetes", "Family History of Diabetes (normalized)",
     "ប្រវត្តិគ្រួសារមានជំងឺទឹកនោមផ្អែម",
     "Normalized family-history flag used by rule conditions; sourced from the existing family_history input."),
    ("is_obese", "Obesity Flag (derived)", "សញ្ញាធាត់ដែលបានគណនា",
     "Boolean flag prepared from BMI, the reported obesity risk factor and the engine's existing ethnicity logic."),
    ("classic_hyperglycemia_symptoms", "Classic Symptom Pattern", "លំនាំរោគសញ្ញាជាតិស្ករខ្ពស់",
     "True when the normalizer finds at least two of frequent urination, excessive thirst, weight loss and excessive hunger."),
    ("ketosis_signs_present", "Ketosis Signs Present", "មានសញ្ញាគីតូស៊ីស",
     "Derived when fruity breath or deep, rapid breathing is reported; used by the existing emergency rules."),
    ("diabetes_evidence_base", "Diabetes Evidence Gate", "ភស្តុតាងសម្រាប់វាយតម្លៃទឹកនោមផ្អែម",
     "Derived from classic symptoms, neuropathy symptom clusters or hyperglycemia evidence to gate type-pattern rules."),
    ("no_lab_values_available", "No Lab Values Available", "មិនមានលទ្ធផលតេស្តមន្ទីរពិសោធន៍",
     "True when fact preparation finds no numeric glucose or HbA1c result; triggers the missing-labs pathway."),
    ("type2_risk_increased", "Increased Type 2 Risk (derived)", "ហានិភ័យទឹកនោមផ្អែមប្រភេទទី ២ កើនឡើង",
     "Risk flag produced by the existing BMI, family-history, activity, metabolic and risk-score logic."),
    ("hypoglycemia", "Hypoglycemia Rule Flag", "សញ្ញាជាតិស្ករក្នុងឈាមទាប",
     "Asserted by v3-triage-hypoglycemia when its blood-glucose condition matches."),
    ("severe_hypoglycemia", "Severe Hypoglycemia Rule Flag", "សញ្ញាជាតិស្ករក្នុងឈាមទាបធ្ងន់ធ្ងរ",
     "Asserted by the existing v3 severe-hypoglycemia or level-3 hypoglycemia rule."),
    ("possible_dka", "Possible DKA Rule Flag", "សញ្ញាសង្ស័យ DKA",
     "Asserted when an existing v3 DKA cluster rule matches; an inference flag, not a confirmed diagnosis."),
    ("critical_hyperglycemia", "Critical Glucose Rule Flag", "សញ្ញាជាតិស្ករក្នុងឈាមខ្ពស់ធ្ងន់ធ្ងរ",
     "Asserted by v3-triage-critical-lab-values when one of its assay conditions matches."),
    ("diabetes_diagnostic_criterion_met", "Diabetes Criterion Met", "ត្រូវនឹងលក្ខខណ្ឌវាយតម្លៃទឹកនោមផ្អែម",
     "Asserted by the existing v3 FPG, HbA1c, OGTT or symptomatic random-glucose rule; used by downstream referral rules."),
    ("prediabetes_possible", "Possible Prediabetes Rule Flag", "សញ្ញាសង្ស័យមុនទឹកនោមផ្អែម",
     "Asserted by an existing v3 prediabetes lab-band rule and consumed by prevention rules."),
    ("prediabetes_high_confidence", "Prediabetes Risk Escalation", "ការកើនឡើងនៃភស្តុតាងមុនទឹកនោមផ្អែម",
     "Asserted by v3-prediabetes-risk-factor-escalation when its combined evidence conditions match."),
    ("normal_fasting_glucose", "Normal Fasting Glucose Rule Flag", "សញ្ញាជាតិស្ករពេលអត់អាហារធម្មតា",
     "Asserted by v3-normal-glucose; the healthy-normal rule also requires normal HbA1c and its other guards."),
    ("normal_hba1c", "Normal HbA1c Rule Flag", "សញ្ញា HbA1c ធម្មតា",
     "Asserted by v3-normal-hba1c; does not by itself establish the healthy-normal conclusion."),
    ("type1_pattern_evidence", "Type 1 Pattern Evidence", "ភស្តុតាងលំនាំប្រភេទទី ១",
     "Asserted by existing v3 Type 1 pattern rules; represents pattern evidence rather than a confirmed diabetes type."),
    ("type2_pattern_evidence", "Type 2 Pattern Evidence", "ភស្តុតាងលំនាំប្រភេទទី ២",
     "Asserted by existing v3 Type 2 pattern rules; used with Type 1 evidence by the mixed-features rule."),
    ("age_risk_screening", "Age-Based Screening Flag", "សញ្ញាសម្រាប់ការពិនិត្យតាមអាយុ",
     "Asserted by v3-demographic-screening when the existing demographic conditions match."),
    ("mixed_type_features", "Mixed Type Features", "លក្ខណៈចម្រុះនៃប្រភេទទឹកនោមផ្អែម",
     "Asserted by v3-mixed-type-features when both Type 1 and Type 2 pattern evidence are present."),
    ("gestational_diabetes_suspected", "Gestational Diabetes Rule Flag", "សញ្ញាសង្ស័យទឹកនោមផ្អែមពេលមានផ្ទៃពោះ",
     "Asserted by the existing v3 pregnancy-specific fasting or OGTT rule; consumed by the gestational pathway."),
    ("early_gdm_testing", "Early Gestational Testing Flag", "សញ្ញាសម្រាប់ការពិនិត្យទឹកនោមផ្អែមពេលមានផ្ទៃពោះឆាប់",
     "Asserted by v3-gdm-prior-early-test when pregnancy and prior gestational-diabetes history are present."),
]

RULE_FACT_CATALOG_SEED = RULE_INPUT_FACT_SEED + [
    {
        "key": key,
        "label": label,
        "label_km": label_km,
        "category": "derived",
        "meaning": meaning,
        "weight": 0.0,
        "type_indication": "none",
        "is_cardinal": False,
        "is_emergency": False,
        "aliases": [],
        "display_order": 800 + index,
    }
    for index, (key, label, label_km, meaning) in enumerate(_DERIVED_DEFINITIONS)
]
