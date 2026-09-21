"""Evidence-review rules using facts already collected by the assessment.

These rules request clinical review/confirmation; they do not add diagnostic
certainty or infer a diabetes type from nonspecific symptoms.
"""

A1C_SOURCE = "https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test"
TEST_SOURCE = "https://www.niddk.nih.gov/health-information/professionals/clinical-tools-patient-management/diabetes/diabetes-prediabetes"
NERVE_SOURCE = "https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-problems/nerve-damage-diabetic-neuropathies/peripheral-neuropathy"

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
    _rule("v3-discordant-fpg-high", "V3 Evidence: Diabetes-range FPG with lower HbA1c", "classification",
          [_condition("fasting_glucose", ">=", 126), _condition("hba1c", "<", 6.5)], "discordant_glycemic_tests"),
    _rule("v3-discordant-hba1c-high", "V3 Evidence: Diabetes-range HbA1c with lower FPG", "classification",
          [_condition("hba1c", ">=", 6.5), _condition("fasting_glucose", "<", 126)], "discordant_glycemic_tests"),
    _rule("v3-review-discordant-tests", "V3 Follow-up: Review discordant laboratory results", "recommendation",
          [_condition("discordant_glycemic_tests", "==", True)], "repeat_testing_recommended", "discordant"),
    _rule("v3-review-confirmation", "V3 Follow-up: Confirm a threshold result without classic symptoms", "recommendation",
          [_condition("diabetes_diagnostic_criterion_met", "==", True),
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
    ])
]
