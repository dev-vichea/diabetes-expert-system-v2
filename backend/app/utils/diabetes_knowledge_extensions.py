"""Evidence-review rules using facts already collected by the assessment.

These rules request clinical review/confirmation; they do not add diagnostic
certainty or infer a diabetes type from nonspecific symptoms.
"""

A1C_SOURCE = "https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test"
TEST_SOURCE = "https://www.niddk.nih.gov/health-information/professionals/clinical-tools-patient-management/diabetes/diabetes-prediabetes"
NERVE_SOURCE = "https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-problems/nerve-damage-diabetic-neuropathies/peripheral-neuropathy"
ADA_DIAGNOSIS_SOURCE = "https://diabetesjournals.org/care/article/49/Supplement_1/S27/163926/2-Diagnosis-and-Classification-of-Diabetes"
ADA_PREGNANCY_SOURCE = "https://diabetesjournals.org/care/article/49/Supplement_1/S321/163918/15-Management-of-Diabetes-in-Pregnancy-Standards"

KNOWLEDGE_MESSAGES = {
    "discordant": {
        "en": "Your HbA1c and fasting glucose fall on different sides of the diabetes threshold. Ask a clinician to review the difference and repeat the abnormal test; one lower result does not cancel the higher result.",
        "km": "លទ្ធផល HbA1c និងជាតិស្ករពេលអត់អាហាររបស់អ្នកមិនស្របគ្នាតាមកម្រិតវិនិច្ឆ័យទឹកនោមផ្អែម។ សូមឱ្យគ្រូពេទ្យពិនិត្យភាពខុសគ្នា និងធ្វើតេស្តដែលខ្ពស់ឡើងវិញ។ លទ្ធផលទាបមួយមិនលុបចោលលទ្ធផលខ្ពស់មួយទៀតទេ។",
    },
    "confirmation": {
        "en": "A result reaches a diabetes testing threshold. Without clear symptoms, a clinician should confirm it with repeat testing before making a diagnosis. This assessment cannot establish whether confirmation has already been completed.",
        "km": "លទ្ធផលមួយដល់កម្រិតតេស្តទឹកនោមផ្អែម។ បើគ្មានរោគសញ្ញាច្បាស់លាស់ គ្រូពេទ្យគួរបញ្ជាក់ដោយធ្វើតេស្តឡើងវិញមុនធ្វើរោគវិនិច្ឆ័យ។ ការវាយតម្លៃនេះមិនអាចដឹងថាតើបានធ្វើតេស្តបញ្ជាក់រួចហើយឬនៅទេ។",
    },
    "nerve_review": {
        "en": "Tingling or burning in the feet can have several causes. Arrange a clinical examination and diabetes testing if it has not been done. These symptoms alone do not establish diabetic nerve damage.",
        "km": "ការស្ពឹកឬក្តៅឆេះនៅជើងអាចមានមូលហេតុច្រើន។ សូមណាត់ពិនិត្យជាមួយគ្រូពេទ្យ និងធ្វើតេស្តទឹកនោមផ្អែមបើមិនទាន់បានធ្វើ។ រោគសញ្ញាទាំងនេះតែមួយមុខមិនបញ្ជាក់ថាសរសៃប្រសាទខូចដោយទឹកនោមផ្អែមទេ។",
    },
    "symptoms_normal_labs": {
        "en": "Your reported symptoms still deserve review even though fasting glucose and HbA1c are below diabetes thresholds. Discuss persistent symptoms and other possible causes with a clinician; repeat testing may be appropriate.",
        "km": "រោគសញ្ញារបស់អ្នកនៅតែត្រូវការពិនិត្យ ទោះបីជាជាតិស្ករពេលអត់អាហារ និង HbA1c ទាបជាងកម្រិតទឹកនោមផ្អែមក៏ដោយ។ សូមពិភាក្សាជាមួយគ្រូពេទ្យអំពីរោគសញ្ញាបន្ត និងមូលហេតុផ្សេងៗ។ អាចត្រូវធ្វើតេស្តឡើងវិញ។",
    },
    "random_review": {
        "en": "Your random glucose is high. Without clear classic symptoms, this reading alone is not enough for this system to confirm diabetes. Arrange prompt clinical review with fasting glucose, HbA1c, or repeat testing.",
        "km": "ជាតិស្ករចៃដន្យរបស់អ្នកខ្ពស់។ បើគ្មានរោគសញ្ញាចម្បងច្បាស់លាស់ លទ្ធផលនេះតែមួយមិនគ្រប់គ្រាន់សម្រាប់ប្រព័ន្ធនេះបញ្ជាក់ទឹកនោមផ្អែមទេ។ សូមណាត់ពិនិត្យឆាប់ជាមួយគ្រូពេទ្យ ដោយធ្វើតេស្តជាតិស្ករពេលអត់អាហារ HbA1c ឬតេស្តឡើងវិញ។",
    },
    "near_threshold": {
        "en": "This result is close to a diabetes threshold. Watch for new hyperglycemia symptoms and arrange repeat testing in 3–6 months, or sooner if a clinician advises it.",
        "km": "លទ្ធផលនេះនៅជិតកម្រិតវិនិច្ឆ័យទឹកនោមផ្អែម។ សូមតាមដានរោគសញ្ញាជាតិស្ករខ្ពស់ថ្មីៗ និងរៀបចំធ្វើតេស្តឡើងវិញក្នុងរយៈពេល ៣–៦ ខែ ឬឆាប់ជាងនេះតាមការណែនាំរបស់គ្រូពេទ្យ។",
    },
    "pregnancy_review": {
        "en": "Symptoms during pregnancy need prompt obstetric review and pregnancy-appropriate glucose testing. Symptoms or HbA1c alone must not be used by this assessment to label gestational diabetes.",
        "km": "រោគសញ្ញាក្នុងអំឡុងពេលមានផ្ទៃពោះត្រូវការការពិនិត្យឆាប់រហ័សពីគ្រូពេទ្យសម្ភព និងតេស្តជាតិស្ករដែលសមស្របសម្រាប់ការមានផ្ទៃពោះ។ ការវាយតម្លៃនេះមិនត្រូវប្រើរោគសញ្ញា ឬ HbA1c តែមួយមុខដើម្បីសន្និដ្ឋានថាជាទឹកនោមផ្អែមពេលមានផ្ទៃពោះទេ។",
    },
}


def _condition(key, operator, value, logical="and"):
    return {"fact_key": key, "operator": operator, "expected_value": value, "logical_operator": logical}


def _rule(code, name, category, conditions, output, message=None, source=A1C_SOURCE):
    actions = [{"action_type": "assert_fact", "action_value": f"{output}=true"}]
    if message:
        actions.append({"action_type": "recommendation", "action_value": KNOWLEDGE_MESSAGES[message]["en"],
                        "metadata": {"source_url": source, "reviewed_on": "2026-09-21"}})
    return {"code": code, "name": name, "category": category, "priority": "medium",
            "status": "active", "certainty_factor": 0.8,
            "description": f"Evidence review only; no additional diagnosis confidence. Reference: {source}",
            "explanation_text": name + ". Review the linked facts and obtain clinical confirmation where needed.",
            "conditions": conditions, "actions": actions}


DIABETES_KNOWLEDGE_EXTENSION_RULES = [
    _rule("v3-confirm-fpg-hba1c", "V3 Confirmation: Diabetes-range FPG and HbA1c", "diagnosis",
          [_condition("fasting_glucose", ">=", 126), _condition("hba1c", ">=", 6.5)],
          "diabetes_confirmed_by_two_tests", source=ADA_DIAGNOSIS_SOURCE),
    _rule("v3-confirm-fpg-ogtt", "V3 Confirmation: Diabetes-range FPG and 2-hour OGTT", "diagnosis",
          [_condition("fasting_glucose", ">=", 126), _condition("2h_ogtt_75g", ">=", 200)],
          "diabetes_confirmed_by_two_tests", source=ADA_DIAGNOSIS_SOURCE),
    _rule("v3-confirm-hba1c-ogtt", "V3 Confirmation: Diabetes-range HbA1c and 2-hour OGTT", "diagnosis",
          [_condition("hba1c", ">=", 6.5), _condition("2h_ogtt_75g", ">=", 200)],
          "diabetes_confirmed_by_two_tests", source=ADA_DIAGNOSIS_SOURCE),
    {
        "code": "v3-conclude-two-test-confirmation",
        "name": "V3 Diagnosis: Two independent diabetes-range tests",
        "category": "diagnosis",
        "priority": "high",
        "status": "active",
        "certainty_factor": 0.98,
        "description": f"Two different diabetes tests above their diagnostic thresholds confirm diabetes under ADA criteria. Reference: {ADA_DIAGNOSIS_SOURCE}",
        "explanation_text": "Two independent diabetes-range tests agree, satisfying the ADA confirmation requirement.",
        "conditions": [_condition("diabetes_confirmed_by_two_tests", "==", True)],
        "actions": [{"action_type": "diagnosis_conclusion", "action_value": "diabetes_confirmed"}],
    },
    {
        "code": "v3-confirm-random-glucose-classic-symptoms",
        "name": "V3 Diagnosis: Random glucose with classic symptoms",
        "category": "diagnosis",
        "priority": "high",
        "status": "active",
        "certainty_factor": 0.96,
        "description": f"Random plasma glucose >=200 mg/dL with classic hyperglycemia symptoms is a clear clinical diagnostic criterion. Reference: {ADA_DIAGNOSIS_SOURCE}",
        "explanation_text": "Random plasma glucose at or above 200 mg/dL together with classic hyperglycemia symptoms meets the ADA clinical diagnosis criterion.",
        "conditions": [_condition("random_plasma_glucose", ">=", 200),
                       _condition("classic_hyperglycemia_symptoms", "==", True)],
        "actions": [
            {"action_type": "assert_fact", "action_value": "unequivocal_hyperglycemia_or_crisis=true"},
            {"action_type": "diagnosis_conclusion", "action_value": "diabetes_confirmed"},
        ],
    },
    {
        "code": "v3-gdm-one-hour-ogtt-high",
        "name": "V3 Gestational Triage: Pregnancy 1-hour 75-g OGTT >=180 mg/dL",
        "category": "triage",
        "priority": "high",
        "status": "active",
        "certainty_factor": 0.9,
        "description": f"At 24–28 weeks, a 1-hour value >=180 mg/dL during a 75-g OGTT meets the ADA one-step GDM criterion. Reference: {ADA_PREGNANCY_SOURCE}",
        "explanation_text": "A pregnancy 1-hour 75-g OGTT result at or above 180 mg/dL meets the one-step gestational diabetes threshold.",
        "conditions": [_condition("currently_pregnant", "==", True),
                       _condition("one_hour_ogtt_75g", ">=", 180)],
        "actions": [
            {"action_type": "assert_fact", "action_value": "gestational_diabetes_suspected=true"},
            {"action_type": "recommendation", "action_value": "The 1-hour 75-g OGTT result meets the pregnancy threshold for gestational diabetes (>=180 mg/dL). Arrange prompt obstetric review for a management plan.",
             "metadata": {"source_url": ADA_PREGNANCY_SOURCE, "reviewed_on": "2026-09-21"}},
        ],
    },
    _rule("v3-near-threshold-fpg", "V3 Follow-up: FPG close to diabetes threshold", "diagnosis",
          [_condition("fasting_glucose", ">=", 120), _condition("fasting_glucose", "<", 126)],
          "near_diabetes_threshold", source=ADA_DIAGNOSIS_SOURCE),
    _rule("v3-near-threshold-hba1c", "V3 Follow-up: HbA1c close to diabetes threshold", "diagnosis",
          [_condition("hba1c", ">=", 6.3), _condition("hba1c", "<", 6.5)],
          "near_diabetes_threshold", source=ADA_DIAGNOSIS_SOURCE),
    _rule("v3-near-threshold-ogtt", "V3 Follow-up: 2-hour OGTT close to diabetes threshold", "diagnosis",
          [_condition("2h_ogtt_75g", ">=", 190), _condition("2h_ogtt_75g", "<", 200)],
          "near_diabetes_threshold", source=ADA_DIAGNOSIS_SOURCE),
    _rule("v3-review-near-threshold", "V3 Follow-up: Repeat a near-threshold result", "recommendation",
          [_condition("near_diabetes_threshold", "==", True)], "repeat_testing_recommended",
          "near_threshold", ADA_DIAGNOSIS_SOURCE),
    _rule("v3-discordant-fpg-high", "V3 Evidence: Diabetes-range FPG with lower HbA1c", "classification",
          [_condition("fasting_glucose", ">=", 126), _condition("hba1c", "<", 6.5)], "discordant_glycemic_tests"),
    _rule("v3-discordant-hba1c-high", "V3 Evidence: Diabetes-range HbA1c with lower FPG", "classification",
          [_condition("hba1c", ">=", 6.5), _condition("fasting_glucose", "<", 126)], "discordant_glycemic_tests"),
    _rule("v3-review-discordant-tests", "V3 Follow-up: Review discordant laboratory results", "recommendation",
          [_condition("discordant_glycemic_tests", "==", True)], "repeat_testing_recommended", "discordant"),
    _rule("v3-review-confirmation", "V3 Follow-up: Confirm a threshold result without classic symptoms", "recommendation",
          [_condition("diabetes_diagnostic_criterion_met", "==", True),
           _condition("diabetes_confirmed_by_two_tests", "!=", True),
           _condition("classic_hyperglycemia_symptoms", "!=", True),
           _condition("urgent_flag", "!=", True)], "repeat_testing_recommended", "confirmation"),
    _rule("v3-review-nerve-symptoms", "V3 Follow-up: Nerve symptoms need examination and testing", "recommendation",
          [_condition("tingling_hands_feet", "==", True), _condition("burning_sensation", "==", True, "or"),
           _condition("no_lab_values_available", "==", True)], "clinical_review_recommended", "nerve_review", NERVE_SOURCE),
    _rule("v3-review-symptoms-with-normal-labs", "V3 Follow-up: Persistent symptom pattern despite normal labs", "recommendation",
          [_condition("classic_hyperglycemia_symptoms", "==", True),
           _condition("fasting_glucose", ">=", 70), _condition("fasting_glucose", "<", 100),
           _condition("hba1c", "<", 5.7), _condition("currently_pregnant", "!=", True)],
          "clinical_review_recommended", "symptoms_normal_labs"),
    _rule("v3-review-random-glucose", "V3 Follow-up: High random glucose without classic symptoms", "recommendation",
          [_condition("random_plasma_glucose", ">=", 200),
           _condition("classic_hyperglycemia_symptoms", "!=", True), _condition("urgent_flag", "!=", True)],
          "clinical_review_recommended", "random_review", TEST_SOURCE),
]

KNOWLEDGE_EXTENSION_FACTS = [
    {"key": key, "label": label, "label_km": label_km, "category": "derived", "meaning": meaning,
     "weight": 0.0, "type_indication": "none", "is_cardinal": False, "is_emergency": False,
     "display_order": 900 + index}
    for index, (key, label, label_km, meaning) in enumerate([
        ("urgent_flag", "Emergency escalation", "សញ្ញាត្រូវការសង្គ្រោះបន្ទាន់", "Boolean output of triage rules; escalates the result to emergency care."),
        ("discordant_glycemic_tests", "Discordant glycemic tests", "លទ្ធផលតេស្តជាតិស្ករមិនស្របគ្នា", "Produced when FPG and HbA1c disagree across the diabetes threshold; consumed by the repeat-testing rule."),
        ("repeat_testing_recommended", "Confirmation testing recommended", "ណែនាំឱ្យធ្វើតេស្តបញ្ជាក់", "Output requesting confirmation or review of discordant tests. It is not proof of diabetes."),
        ("clinical_review_recommended", "Clinical review recommended", "ណែនាំឱ្យពិនិត្យជាមួយគ្រូពេទ្យ", "Output requesting review of symptoms or an isolated glucose result; adds no diagnostic certainty."),
        ("diabetes_confirmed_by_two_tests", "Diabetes confirmed by two tests", "ទឹកនោមផ្អែមបានបញ្ជាក់ដោយតេស្តពីរ", "Produced only when two different diabetes tests are both at or above their diagnostic thresholds."),
        ("near_diabetes_threshold", "Result near diabetes threshold", "លទ្ធផលនៅជិតកម្រិតទឹកនោមផ្អែម", "Operational follow-up flag for a result just below a diabetes threshold; it requests repeat testing and is not a diagnosis."),
        ("pregnancy_glucose_review_needed", "Pregnancy glucose review needed", "ត្រូវការពិនិត្យជាតិស្ករពេលមានផ្ទៃពោះ", "Symptoms in pregnancy require pregnancy-appropriate glucose testing; this fact does not diagnose gestational diabetes."),
        ("unequivocal_hyperglycemia_or_crisis", "Unequivocal hyperglycemia or crisis", "ជាតិស្ករខ្ពស់ច្បាស់លាស់ ឬស្ថានភាពធ្ងន់ធ្ងរ", "Produced when random plasma glucose is at least 200 mg/dL together with classic hyperglycemia symptoms."),
    ])
]

# Numeric input used by the ADA one-step 75-g OGTT pathway. Keeping a word-led
# canonical key avoids identifier normalization ambiguity for keys beginning
# with a digit; common 1-hour spellings are registered as aliases.
KNOWLEDGE_EXTENSION_FACTS.append({
    "key": "one_hour_ogtt_75g",
    "label": "1-hour 75-g OGTT",
    "label_km": "តេស្ត OGTT 75 ក្រាម រយៈពេល ១ ម៉ោង",
    "category": "lab",
    "meaning": "Plasma glucose one hour after a 75-g oral glucose load; used with pregnancy status in the ADA one-step GDM pathway.",
    "weight": 0.0,
    "type_indication": "gestational",
    "is_cardinal": False,
    "is_emergency": False,
    "display_order": 520,
    "aliases": ["1h_ogtt_75g", "fact_1h_ogtt_75g", "one_hour_ogtt", "ogtt_1h_75g"],
})
