/**
 * Synthetic Training Dataset for AI Reasoning/Report Generation
 * ==============================================================
 *
 * ⚠️  SYNTHETIC / DEMO DATA — NOT REAL PATIENT DATA
 *
 * This dataset contains 100 diverse synthetic examples for training
 * and testing the AI reasoning and report generation system.
 *
 * Each example contains:
 * - Patient assessment context (demographics, symptoms, risk factors, labs)
 * - Matched rules and evidence
 * - Expert system result
 * - Expected reasoning and patient-friendly explanation
 * - Recommended next steps
 *
 * Coverage:
 * - Low risk (20 examples)
 * - Moderate risk (20 examples)
 * - High risk (15 examples)
 * - Type 1 diabetes patterns (10 examples)
 * - Type 2 diabetes patterns (10 examples)
 * - Gestational diabetes patterns (10 examples)
 * - Multiple possible matches (5 examples)
 * - Weak evidence (5 examples)
 * - Conflicting evidence (3 examples)
 * - No significant match (2 examples)
 *
 * IMPORTANT:
 * - All data is synthetic and does not represent real patients
 * - Medical claims are conservative and distinguish screening from diagnosis
 * - This dataset is for system development and testing only
 */

export const REASONING_TRAINING_DATASET = [
  // ═══════════════════════════════════════════════════════════════════════════
  // LOW RISK EXAMPLES (1-20)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "SYNTH-LR-001",
    category: "low_risk",
    assessment: {
      demographics: { age: 28, gender: "male", bmi: 22.5 },
      symptoms: [],
      risk_factors: [],
      lab_results: { fasting_glucose: 85, hba1c: 5.1 },
    },
    matched_rules: [],
    expert_result: {
      condition: "Normal Glucose Regulation — No Diabetes Indication",
      condition_key: "healthy_normal",
      risk_level: "low",
      certainty_factor: 0.92,
    },
    expected_reasoning: {
      primary_evidence: [
        { type: "lab_result", label: "Fasting blood glucose", value: "85", significance: "Normal range (<100 mg/dL)" },
        { type: "lab_result", label: "HbA1c", value: "5.1", significance: "Normal range (<5.7%)" },
      ],
      supporting_evidence: [],
      conflicting_evidence: [],
      explanation: "Both fasting glucose and HbA1c are within normal ranges. No symptoms or risk factors were reported.",
    },
    expected_explanation: {
      what_it_means: "Based on the available information, no strong diabetes indication was found. Your lab values are in the healthy range.",
      why_generated: "Normal fasting glucose (85 mg/dL) and normal HbA1c (5.1%) — both well within healthy ranges.",
      what_it_does_not_mean: ["A normal result today does not guarantee you will never develop diabetes. Continue regular checkups."],
    },
    next_steps: [
      { priority: "routine", action: "Continue regular health monitoring" },
    ],
  },
  {
    id: "SYNTH-LR-002",
    category: "low_risk",
    assessment: {
      demographics: { age: 35, gender: "female", bmi: 23.0 },
      symptoms: ["Fatigue"],
      risk_factors: [],
      lab_results: { fasting_glucose: 92, hba1c: 5.3 },
    },
    matched_rules: [],
    expert_result: {
      condition: "Normal Glucose Regulation — No Diabetes Indication",
      condition_key: "healthy_normal",
      risk_level: "low",
      certainty_factor: 0.88,
    },
    expected_reasoning: {
      primary_evidence: [
        { type: "lab_result", label: "Fasting blood glucose", value: "92", significance: "Normal range (<100 mg/dL)" },
        { type: "lab_result", label: "HbA1c", value: "5.3", significance: "Normal range (<5.7%)" },
      ],
      supporting_evidence: [],
      conflicting_evidence: [],
      explanation: "Fatigue alone is a non-specific symptom. Lab values are normal. Consider other causes of fatigue.",
    },
    expected_explanation: {
      what_it_means: "Your blood sugar levels are normal. Fatigue can have many causes unrelated to diabetes.",
      why_generated: "Lab values are within normal range despite reported fatigue.",
      what_it_does_not_mean: ["Fatigue is non-specific and may indicate other conditions like sleep issues, anemia, or stress."],
    },
    next_steps: [
      { priority: "routine", action: "Consider other causes of fatigue" },
      { priority: "routine", action: "Continue regular health monitoring" },
    ],
  },
  {
    id: "SYNTH-LR-003",
    category: "low_risk",
    assessment: {
      demographics: { age: 22, gender: "male", bmi: 21.0 },
      symptoms: [],
      risk_factors: ["Family History"],
      lab_results: { fasting_glucose: 88 },
    },
    matched_rules: [{ rule_id: "DEMO-SCREEN-01", rule_name: "Demographic Screening", certainty_factor: 0.15 }],
    expert_result: {
      condition: "Routine Diabetes Screening Recommended",
      condition_key: "demographic_screening",
      risk_level: "low",
      certainty_factor: 0.15,
    },
    expected_reasoning: {
      primary_evidence: [
        { type: "lab_result", label: "Fasting blood glucose", value: "88", significance: "Normal range" },
      ],
      supporting_evidence: [
        { type: "risk_factor", label: "Family history of diabetes" },
      ],
      conflicting_evidence: [],
      explanation: "Normal glucose with family history. Periodic screening recommended due to genetic predisposition.",
    },
    expected_explanation: {
      what_it_means: "Your current blood sugar is normal. Having a family history means periodic screening is wise.",
      why_generated: "Family history of diabetes with normal current lab values.",
      what_it_does_not_mean: ["Family history increases risk but does not mean you will develop diabetes."],
    },
    next_steps: [
      { priority: "routine", action: "Screen every 1-3 years due to family history" },
    ],
  },
  {
    id: "SYNTH-LR-004",
    category: "low_risk",
    assessment: {
      demographics: { age: 45, gender: "female", bmi: 24.0 },
      symptoms: [],
      risk_factors: [],
      lab_results: { hba1c: 5.4 },
    },
    matched_rules: [],
    expert_result: {
      condition: "Normal Glucose Regulation — No Diabetes Indication",
      condition_key: "healthy_normal",
      risk_level: "low",
      certainty_factor: 0.90,
    },
    expected_reasoning: {
      primary_evidence: [
        { type: "lab_result", label: "HbA1c", value: "5.4", significance: "Normal range (<5.7%)" },
      ],
      supporting_evidence: [],
      conflicting_evidence: [],
      explanation: "HbA1c well within normal range. No symptoms or risk factors.",
    },
    expected_explanation: {
      what_it_means: "Your HbA1c shows normal blood sugar control over the past 3 months.",
      why_generated: "HbA1c of 5.4% is in the normal range.",
      what_it_does_not_mean: ["Normal HbA1c is reassuring but regular screening is still recommended after age 45."],
    },
    next_steps: [
      { priority: "routine", action: "Routine screening every 3 years" },
    ],
  },
  {
    id: "SYNTH-LR-005",
    category: "low_risk",
    assessment: {
      demographics: { age: 30, gender: "male", bmi: 23.5 },
      symptoms: ["Dizziness"],
      risk_factors: [],
      lab_results: {},
    },
    matched_rules: [],
    expert_result: {
      condition: "Routine Diabetes Screening Recommended",
      condition_key: "demographic_screening",
      risk_level: "low",
      certainty_factor: 0.10,
    },
    expected_reasoning: {
      primary_evidence: [],
      supporting_evidence: [],
      conflicting_evidence: [],
      explanation: "Dizziness alone without lab results is insufficient for diabetes assessment. Many conditions cause dizziness.",
    },
    expected_explanation: {
      what_it_means: "Dizziness is non-specific. Without blood tests, we cannot assess diabetes risk.",
      why_generated: "Single non-specific symptom without supporting evidence.",
      what_it_does_not_mean: ["Dizziness is rarely caused by diabetes alone. Other causes are more likely."],
    },
    next_steps: [
      { priority: "high", action: "Get laboratory blood tests" },
    ],
  },
  {
    id: "SYNTH-LR-006",
    category: "low_risk",
    assessment: {
      demographics: { age: 50, gender: "male", bmi: 24.8 },
      symptoms: [],
      risk_factors: ["Sedentary Lifestyle"],
      lab_results: { fasting_glucose: 95, hba1c: 5.5 },
    },
    matched_rules: [{ rule_id: "DEMO-SCREEN-02", rule_name: "Risk Factor Screening", certainty_factor: 0.12 }],
    expert_result: {
      condition: "Routine Diabetes Screening Recommended",
      condition_key: "demographic_screening",
      risk_level: "low",
      certainty_factor: 0.12,
    },
    expected_reasoning: {
      primary_evidence: [
        { type: "lab_result", label: "Fasting blood glucose", value: "95", significance: "Normal range" },
        { type: "lab_result", label: "HbA1c", value: "5.5", significance: "Normal range" },
      ],
      supporting_evidence: [
        { type: "risk_factor", label: "Sedentary lifestyle" },
      ],
      conflicting_evidence: [],
      explanation: "Labs are normal despite sedentary lifestyle. Increasing activity is recommended as preventive measure.",
    },
    expected_explanation: {
      what_it_means: "Blood sugar is normal. A sedentary lifestyle increases future risk but current levels are fine.",
      why_generated: "Normal labs with one modifiable risk factor.",
      what_it_does_not_mean: ["Current normal levels do not mean sedentary lifestyle is harmless long-term."],
    },
    next_steps: [
      { priority: "medium", action: "Increase physical activity to 150 min/week" },
      { priority: "routine", action: "Annual screening" },
    ],
  },
  {
    id: "SYNTH-LR-007",
    category: "low_risk",
    assessment: {
      demographics: { age: 19, gender: "female", bmi: 20.5 },
      symptoms: [],
      risk_factors: [],
      lab_results: { fasting_glucose: 78 },
    },
    matched_rules: [],
    expert_result: {
      condition: "Normal Glucose Regulation — No Diabetes Indication",
      condition_key: "healthy_normal",
      risk_level: "low",
      certainty_factor: 0.95,
    },
    expected_reasoning: {
      primary_evidence: [
        { type: "lab_result", label: "Fasting blood glucose", value: "78", significance: "Normal range" },
      ],
      supporting_evidence: [],
      conflicting_evidence: [],
      explanation: "Young patient with normal glucose and no risk factors.",
    },
    expected_explanation: {
      what_it_means: "Your fasting glucose is well within the normal range. No diabetes concern at this time.",
      why_generated: "Normal fasting glucose in a young, healthy patient.",
      what_it_does_not_mean: ["This does not mean future screening is unnecessary."],
    },
    next_steps: [
      { priority: "routine", action: "Standard age-appropriate screening schedule" },
    ],
  },
  {
    id: "SYNTH-LR-008",
    category: "low_risk",
    assessment: {
      demographics: { age: 40, gender: "male", bmi: 25.0 },
      symptoms: ["Slow Healing"],
      risk_factors: [],
      lab_results: { fasting_glucose: 90, hba1c: 5.2 },
    },
    matched_rules: [],
    expert_result: {
      condition: "Normal Glucose Regulation — No Diabetes Indication",
      condition_key: "healthy_normal",
      risk_level: "low",
      certainty_factor: 0.85,
    },
    expected_reasoning: {
      primary_evidence: [
        { type: "lab_result", label: "Fasting blood glucose", value: "90", significance: "Normal range" },
        { type: "lab_result", label: "HbA1c", value: "5.2", significance: "Normal range" },
      ],
      supporting_evidence: [],
      conflicting_evidence: [
        { type: "lab_symptom_mismatch", label: "Normal labs but symptoms present", detail: "Slow healing reported but lab values are normal." },
      ],
      explanation: "Labs are normal. Slow healing can be caused by nutrition, circulation, or other factors.",
    },
    expected_explanation: {
      what_it_means: "Your blood sugar is normal. Slow healing may have other causes.",
      why_generated: "Normal labs with isolated slow healing symptom.",
      what_it_does_not_mean: ["Slow healing alone does not indicate diabetes when labs are normal."],
    },
    next_steps: [
      { priority: "routine", action: "Investigate other causes of slow healing" },
    ],
  },
  {
    id: "SYNTH-LR-009",
    category: "low_risk",
    assessment: {
      demographics: { age: 55, gender: "female", bmi: 23.0 },
      symptoms: [],
      risk_factors: ["High Cholesterol"],
      lab_results: { fasting_glucose: 94, hba1c: 5.5 },
    },
    matched_rules: [{ rule_id: "DEMO-SCREEN-03", rule_name: "Metabolic Risk Screen", certainty_factor: 0.18 }],
    expert_result: {
      condition: "Routine Diabetes Screening Recommended",
      condition_key: "demographic_screening",
      risk_level: "low",
      certainty_factor: 0.18,
    },
    expected_reasoning: {
      primary_evidence: [
        { type: "lab_result", label: "Fasting blood glucose", value: "94", significance: "Normal range" },
        { type: "lab_result", label: "HbA1c", value: "5.5", significance: "Normal range" },
      ],
      supporting_evidence: [
        { type: "risk_factor", label: "High cholesterol" },
      ],
      conflicting_evidence: [],
      explanation: "Normal glucose with high cholesterol — cardiovascular risk should be addressed separately.",
    },
    expected_explanation: {
      what_it_means: "Blood sugar is normal. High cholesterol is a separate risk worth managing.",
      why_generated: "Normal glucose labs with one metabolic risk factor.",
      what_it_does_not_mean: ["High cholesterol does not mean you have diabetes."],
    },
    next_steps: [
      { priority: "medium", action: "Manage cholesterol with healthcare provider" },
      { priority: "routine", action: "Continue diabetes screening every 1-3 years" },
    ],
  },
  {
    id: "SYNTH-LR-010",
    category: "low_risk",
    assessment: {
      demographics: { age: 32, gender: "male", bmi: 24.0 },
      symptoms: [],
      risk_factors: [],
      lab_results: {},
    },
    matched_rules: [],
    expert_result: {
      condition: "Routine Diabetes Screening Recommended",
      condition_key: "demographic_screening",
      risk_level: "low",
      certainty_factor: 0.05,
    },
    expected_reasoning: {
      primary_evidence: [],
      supporting_evidence: [],
      conflicting_evidence: [],
      missing_evidence: [{ type: "missing_labs", label: "No laboratory results available" }],
      explanation: "No symptoms, risk factors, or lab results provided. Insufficient data for assessment.",
    },
    expected_explanation: {
      what_it_means: "Without any symptoms, risk factors, or lab results, we cannot assess your diabetes risk.",
      why_generated: "Insufficient data provided for assessment.",
      what_it_does_not_mean: ["Lack of data does not mean you are healthy — it means we need more information."],
    },
    next_steps: [
      { priority: "high", action: "Get basic blood tests (fasting glucose, HbA1c)" },
    ],
  },
  // More low risk examples (11-20)
  {
    id: "SYNTH-LR-011",
    category: "low_risk",
    assessment: { demographics: { age: 25, gender: "female", bmi: 21.0 }, symptoms: [], risk_factors: [], lab_results: { fasting_glucose: 82 } },
    matched_rules: [],
    expert_result: { condition: "Normal Glucose Regulation", condition_key: "healthy_normal", risk_level: "low", certainty_factor: 0.93 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "82", significance: "Normal" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Normal glucose, young healthy female." },
    expected_explanation: { what_it_means: "Blood sugar is normal.", why_generated: "Normal FPG with no risk factors.", what_it_does_not_mean: ["This is a snapshot; continue periodic screening."] },
    next_steps: [{ priority: "routine", action: "Routine screening" }],
  },
  {
    id: "SYNTH-LR-012",
    category: "low_risk",
    assessment: { demographics: { age: 38, gender: "male", bmi: 24.5 }, symptoms: ["Tingling Hands Feet"], risk_factors: [], lab_results: { fasting_glucose: 91, hba1c: 5.3 } },
    matched_rules: [],
    expert_result: { condition: "Normal Glucose Regulation", condition_key: "healthy_normal", risk_level: "low", certainty_factor: 0.82 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "91", significance: "Normal" }], supporting_evidence: [], conflicting_evidence: [{ type: "lab_symptom_mismatch", label: "Normal labs but neuropathy symptom" }], explanation: "Tingling with normal glucose — consider other neurological causes." },
    expected_explanation: { what_it_means: "Labs normal. Tingling may have non-diabetic causes.", why_generated: "Normal labs despite neuropathy-like symptom.", what_it_does_not_mean: ["Tingling can be from vitamin deficiency, nerve compression, etc."] },
    next_steps: [{ priority: "routine", action: "Investigate non-diabetic causes of tingling" }],
  },
  {
    id: "SYNTH-LR-013",
    category: "low_risk",
    assessment: { demographics: { age: 60, gender: "female", bmi: 22.0 }, symptoms: [], risk_factors: [], lab_results: { fasting_glucose: 96, hba1c: 5.6 } },
    matched_rules: [],
    expert_result: { condition: "Normal Glucose Regulation", condition_key: "healthy_normal", risk_level: "low", certainty_factor: 0.80 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "96", significance: "Normal range (upper)" }, { type: "lab_result", label: "HbA1c", value: "5.6", significance: "Normal (near boundary)" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Values normal but near prediabetes threshold. Age-appropriate monitoring advised." },
    expected_explanation: { what_it_means: "Your blood sugar is still normal but near the upper boundary.", why_generated: "Labs normal but approaching prediabetes thresholds.", what_it_does_not_mean: ["Being near the boundary is not prediabetes."] },
    next_steps: [{ priority: "routine", action: "Annual monitoring given age and borderline values" }],
  },
  {
    id: "SYNTH-LR-014",
    category: "low_risk",
    assessment: { demographics: { age: 42, gender: "male", bmi: 26.0 }, symptoms: [], risk_factors: ["Smoking"], lab_results: { fasting_glucose: 89 } },
    matched_rules: [],
    expert_result: { condition: "Routine Screening Recommended", condition_key: "demographic_screening", risk_level: "low", certainty_factor: 0.14 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "89", significance: "Normal" }], supporting_evidence: [{ type: "risk_factor", label: "Smoking" }], conflicting_evidence: [], explanation: "Normal glucose. Smoking increases cardiovascular and diabetes risk." },
    expected_explanation: { what_it_means: "Blood sugar is normal. Quitting smoking reduces many health risks.", why_generated: "Normal FPG with smoking as a risk factor.", what_it_does_not_mean: ["Smoking increases risk but doesn't cause diabetes directly."] },
    next_steps: [{ priority: "medium", action: "Consider smoking cessation" }, { priority: "routine", action: "Annual screening" }],
  },
  {
    id: "SYNTH-LR-015",
    category: "low_risk",
    assessment: { demographics: { age: 33, gender: "female", bmi: 22.0 }, symptoms: [], risk_factors: ["Ethnicity High Risk"], lab_results: { hba1c: 5.0 } },
    matched_rules: [],
    expert_result: { condition: "Routine Screening Recommended", condition_key: "demographic_screening", risk_level: "low", certainty_factor: 0.12 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "HbA1c", value: "5.0", significance: "Normal" }], supporting_evidence: [{ type: "risk_factor", label: "High-risk ethnicity" }], conflicting_evidence: [], explanation: "Normal HbA1c. Ethnic background warrants periodic screening." },
    expected_explanation: { what_it_means: "HbA1c is well within normal range.", why_generated: "Normal labs with ethnicity-based risk.", what_it_does_not_mean: ["Ethnic predisposition does not mean diabetes is inevitable."] },
    next_steps: [{ priority: "routine", action: "Screen every 1-3 years" }],
  },
  {
    id: "SYNTH-LR-016",
    category: "low_risk",
    assessment: { demographics: { age: 27, gender: "male", bmi: 23.0 }, symptoms: ["Excessive Hunger"], risk_factors: [], lab_results: { fasting_glucose: 84 } },
    matched_rules: [],
    expert_result: { condition: "Normal Glucose Regulation", condition_key: "healthy_normal", risk_level: "low", certainty_factor: 0.86 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "84", significance: "Normal" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Increased hunger with normal glucose. May relate to diet, activity, or metabolism." },
    expected_explanation: { what_it_means: "Blood sugar is normal. Increased appetite alone is non-specific.", why_generated: "Normal glucose despite polyphagia.", what_it_does_not_mean: ["Hunger alone does not indicate diabetes when labs are normal."] },
    next_steps: [{ priority: "routine", action: "Review diet and activity level" }],
  },
  {
    id: "SYNTH-LR-017",
    category: "low_risk",
    assessment: { demographics: { age: 48, gender: "female", bmi: 24.0 }, symptoms: [], risk_factors: [], lab_results: { fasting_glucose: 93, hba1c: 5.4, "2h_ogtt_75g": 128 } },
    matched_rules: [],
    expert_result: { condition: "Normal Glucose Regulation", condition_key: "healthy_normal", risk_level: "low", certainty_factor: 0.87 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "93", significance: "Normal" }, { type: "lab_result", label: "HbA1c", value: "5.4", significance: "Normal" }, { type: "lab_result", label: "2h OGTT", value: "128", significance: "Normal (<140)" }], supporting_evidence: [], conflicting_evidence: [], explanation: "All three lab values in normal range. Comprehensive normal result." },
    expected_explanation: { what_it_means: "All glucose tests are in the normal range — reassuring result.", why_generated: "Comprehensive normal lab panel.", what_it_does_not_mean: ["Normal today does not guarantee normal in the future."] },
    next_steps: [{ priority: "routine", action: "Standard screening schedule" }],
  },
  {
    id: "SYNTH-LR-018",
    category: "low_risk",
    assessment: { demographics: { age: 36, gender: "male", bmi: 25.5 }, symptoms: [], risk_factors: ["Hypertension"], lab_results: { fasting_glucose: 97 } },
    matched_rules: [],
    expert_result: { condition: "Routine Screening Recommended", condition_key: "demographic_screening", risk_level: "low", certainty_factor: 0.16 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "97", significance: "Normal (upper)" }], supporting_evidence: [{ type: "risk_factor", label: "Hypertension" }], conflicting_evidence: [], explanation: "FPG near upper normal with hypertension — monitor both conditions." },
    expected_explanation: { what_it_means: "Blood sugar is normal but on the higher end. Hypertension management is important.", why_generated: "Near-boundary glucose with cardiovascular risk factor.", what_it_does_not_mean: ["Hypertension and diabetes are related risks but distinct conditions."] },
    next_steps: [{ priority: "medium", action: "Manage blood pressure" }, { priority: "routine", action: "Annual glucose monitoring" }],
  },
  {
    id: "SYNTH-LR-019",
    category: "low_risk",
    assessment: { demographics: { age: 29, gender: "female", bmi: 21.5 }, symptoms: ["Blurred Vision"], risk_factors: [], lab_results: { fasting_glucose: 80, hba1c: 5.0 } },
    matched_rules: [],
    expert_result: { condition: "Normal Glucose Regulation", condition_key: "healthy_normal", risk_level: "low", certainty_factor: 0.88 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "80", significance: "Normal" }], supporting_evidence: [], conflicting_evidence: [{ type: "lab_symptom_mismatch", label: "Normal labs but vision symptom" }], explanation: "Blurred vision with normal glucose — likely non-diabetic cause." },
    expected_explanation: { what_it_means: "Blood sugar is normal. Blurred vision should be evaluated by an eye specialist.", why_generated: "Normal labs despite visual symptom.", what_it_does_not_mean: ["Blurred vision can be from eye strain, refractive error, or other conditions."] },
    next_steps: [{ priority: "medium", action: "Get an eye examination" }],
  },
  {
    id: "SYNTH-LR-020",
    category: "low_risk",
    assessment: { demographics: { age: 52, gender: "male", bmi: 24.0 }, symptoms: [], risk_factors: [], lab_results: { random_plasma_glucose: 115 } },
    matched_rules: [],
    expert_result: { condition: "Normal Glucose Regulation", condition_key: "healthy_normal", risk_level: "low", certainty_factor: 0.78 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "Random glucose", value: "115", significance: "Below threshold (<200)" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Random glucose below diagnostic threshold. Fasting test recommended for more accurate assessment." },
    expected_explanation: { what_it_means: "Random glucose is below the diabetes threshold.", why_generated: "Random glucose normal but fasting test more informative.", what_it_does_not_mean: ["Random glucose is less precise than fasting glucose or HbA1c."] },
    next_steps: [{ priority: "medium", action: "Consider fasting glucose or HbA1c test for better assessment" }],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODERATE RISK EXAMPLES (21-40)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "SYNTH-MR-001",
    category: "moderate_risk",
    assessment: {
      demographics: { age: 52, gender: "male", bmi: 28.5 },
      symptoms: ["Frequent Urination", "Excessive Thirst"],
      risk_factors: ["Family History", "Obesity"],
      lab_results: {},
    },
    matched_rules: [
      { rule_id: "T2D-RISK-03", rule_name: "Type 2 Diabetes Risk Pattern", certainty_factor: 0.55 },
    ],
    expert_result: {
      condition: "Possible Early Signs of Diabetes",
      condition_key: "symptom_only_screening",
      risk_level: "moderate",
      certainty_factor: 0.55,
    },
    expected_reasoning: {
      primary_evidence: [
        { type: "symptom", label: "Frequent urination", significance: "Cardinal diabetes symptom" },
        { type: "symptom", label: "Excessive thirst", significance: "Cardinal diabetes symptom" },
      ],
      supporting_evidence: [
        { type: "risk_factor", label: "Family history of diabetes" },
        { type: "risk_factor", label: "Obesity" },
      ],
      conflicting_evidence: [],
      missing_evidence: [{ type: "missing_labs", label: "No laboratory results available" }],
      explanation: "Two cardinal symptoms with strong risk factors, but no lab confirmation available yet.",
    },
    expected_explanation: {
      what_it_means: "Your symptoms and risk factors suggest possible early diabetes signs. Lab tests are needed to confirm.",
      why_generated: "Cardinal symptoms (polyuria, polydipsia) combined with family history and obesity.",
      what_it_does_not_mean: ["Without blood tests, this is a screening result, not a diagnosis."],
    },
    next_steps: [
      { priority: "high", action: "Get fasting glucose and HbA1c tests" },
      { priority: "high", action: "Schedule a clinical consultation" },
    ],
  },
  {
    id: "SYNTH-MR-002",
    category: "moderate_risk",
    assessment: {
      demographics: { age: 45, gender: "female", bmi: 27.0 },
      symptoms: [],
      risk_factors: ["Family History", "Sedentary Lifestyle"],
      lab_results: { fasting_glucose: 108, hba1c: 5.8 },
    },
    matched_rules: [
      { rule_id: "PRE-DM-01", rule_name: "Prediabetes Fasting Glucose", certainty_factor: 0.65 },
    ],
    expert_result: {
      condition: "Prediabetes (Impaired Glucose Regulation)",
      condition_key: "prediabetes_possible",
      risk_level: "moderate",
      certainty_factor: 0.65,
    },
    expected_reasoning: {
      primary_evidence: [
        { type: "lab_result", label: "Fasting blood glucose", value: "108", significance: "Prediabetes range (100-125 mg/dL)" },
        { type: "lab_result", label: "HbA1c", value: "5.8", significance: "Prediabetes range (5.7-6.4%)" },
      ],
      supporting_evidence: [
        { type: "risk_factor", label: "Family history" },
        { type: "risk_factor", label: "Sedentary lifestyle" },
      ],
      conflicting_evidence: [],
      explanation: "Both FPG and HbA1c fall in the prediabetes range, supported by risk factors.",
    },
    expected_explanation: {
      what_it_means: "Your blood sugar is above normal but not yet at diabetes levels. This is called prediabetes — an important opportunity to prevent progression.",
      why_generated: "Both fasting glucose (108) and HbA1c (5.8%) are in the prediabetes range.",
      what_it_does_not_mean: ["Prediabetes is NOT diabetes. With lifestyle changes, many people can reverse this."],
    },
    next_steps: [
      { priority: "high", action: "Start preventive lifestyle changes" },
      { priority: "medium", action: "Follow up with healthcare provider" },
      { priority: "medium", action: "Increase physical activity" },
    ],
  },
  {
    id: "SYNTH-MR-003",
    category: "moderate_risk",
    assessment: {
      demographics: { age: 55, gender: "male", bmi: 31.0 },
      symptoms: ["Fatigue", "Slow Healing"],
      risk_factors: ["Obesity", "Hypertension", "High Cholesterol"],
      lab_results: { fasting_glucose: 115 },
    },
    matched_rules: [
      { rule_id: "PRE-DM-02", rule_name: "Prediabetes Pattern", certainty_factor: 0.62 },
      { rule_id: "MET-SYN-01", rule_name: "Metabolic Syndrome Pattern", certainty_factor: 0.58 },
    ],
    expert_result: {
      condition: "Prediabetes — Act Early to Prevent Type 2",
      condition_key: "prediabetes_high_risk",
      risk_level: "moderate",
      certainty_factor: 0.68,
    },
    expected_reasoning: {
      primary_evidence: [
        { type: "lab_result", label: "FPG", value: "115", significance: "Prediabetes range" },
        { type: "symptom", label: "Fatigue", significance: "Supporting symptom" },
        { type: "symptom", label: "Slow healing", significance: "Supporting symptom" },
      ],
      supporting_evidence: [
        { type: "risk_factor", label: "Obesity" },
        { type: "risk_factor", label: "Hypertension" },
        { type: "risk_factor", label: "High cholesterol" },
      ],
      conflicting_evidence: [],
      explanation: "Impaired fasting glucose with metabolic syndrome pattern. Multiple risk factors compound the concern.",
    },
    expected_explanation: {
      what_it_means: "Your fasting glucose is elevated and you have a cluster of metabolic risk factors. Action now can prevent progression to diabetes.",
      why_generated: "Elevated FPG (115) with obesity, hypertension, and high cholesterol — a metabolic syndrome pattern.",
      what_it_does_not_mean: ["This is not diabetes yet. Lifestyle changes can be very effective at this stage."],
    },
    next_steps: [
      { priority: "high", action: "Schedule clinical consultation" },
      { priority: "high", action: "Start lifestyle modifications" },
      { priority: "medium", action: "Address metabolic syndrome components" },
    ],
  },
  {
    id: "SYNTH-MR-004",
    category: "moderate_risk",
    assessment: {
      demographics: { age: 48, gender: "female", bmi: 29.0 },
      symptoms: ["Frequent Urination", "Fatigue"],
      risk_factors: ["Family History"],
      lab_results: { hba1c: 6.0 },
    },
    matched_rules: [
      { rule_id: "PRE-DM-03", rule_name: "HbA1c Prediabetes Range", certainty_factor: 0.60 },
    ],
    expert_result: {
      condition: "Prediabetes (Impaired Glucose Regulation)",
      condition_key: "prediabetes_possible",
      risk_level: "moderate",
      certainty_factor: 0.60,
    },
    expected_reasoning: {
      primary_evidence: [
        { type: "lab_result", label: "HbA1c", value: "6.0", significance: "Prediabetes range (5.7-6.4%)" },
        { type: "symptom", label: "Frequent urination", significance: "Cardinal diabetes symptom" },
      ],
      supporting_evidence: [
        { type: "risk_factor", label: "Family history" },
      ],
      conflicting_evidence: [],
      explanation: "HbA1c in prediabetes range with cardinal symptom and family history.",
    },
    expected_explanation: {
      what_it_means: "Your HbA1c indicates prediabetes, and your symptoms are consistent with elevated blood sugar.",
      why_generated: "HbA1c of 6.0% (prediabetes) with polyuria and family history.",
      what_it_does_not_mean: ["Prediabetes can often be reversed with lifestyle changes."],
    },
    next_steps: [
      { priority: "high", action: "Confirm with fasting glucose test" },
      { priority: "high", action: "Begin preventive lifestyle changes" },
    ],
  },
  {
    id: "SYNTH-MR-005",
    category: "moderate_risk",
    assessment: {
      demographics: { age: 62, gender: "male", bmi: 26.5 },
      symptoms: ["Tingling Hands Feet", "Blurred Vision"],
      risk_factors: ["Family History", "Hypertension"],
      lab_results: { fasting_glucose: 105, hba1c: 5.9 },
    },
    matched_rules: [
      { rule_id: "NEURO-01", rule_name: "Neuropathy Screening", certainty_factor: 0.52 },
      { rule_id: "PRE-DM-04", rule_name: "Prediabetes with Complications", certainty_factor: 0.58 },
    ],
    expert_result: {
      condition: "Possible Nerve Signs (Diabetic Neuropathy)",
      condition_key: "neuropathy_screening",
      risk_level: "moderate",
      certainty_factor: 0.58,
    },
    expected_reasoning: {
      primary_evidence: [
        { type: "lab_result", label: "FPG", value: "105", significance: "Prediabetes range" },
        { type: "lab_result", label: "HbA1c", value: "5.9", significance: "Prediabetes range" },
        { type: "symptom", label: "Tingling hands/feet", significance: "Possible neuropathy sign" },
        { type: "symptom", label: "Blurred vision", significance: "Possible microvascular sign" },
      ],
      supporting_evidence: [
        { type: "risk_factor", label: "Family history" },
        { type: "risk_factor", label: "Hypertension" },
      ],
      conflicting_evidence: [],
      explanation: "Prediabetes range labs with symptoms suggesting possible early diabetic complications.",
    },
    expected_explanation: {
      what_it_means: "Your labs show prediabetes, and your symptoms (tingling, blurred vision) could indicate early nerve or eye changes.",
      why_generated: "Prediabetes labs with neuropathy and vision symptoms.",
      what_it_does_not_mean: ["These symptoms can also have non-diabetic causes. A specialist can determine the actual cause."],
    },
    next_steps: [
      { priority: "high", action: "See a healthcare provider — neuropathy screening needed" },
      { priority: "high", action: "Eye examination recommended" },
    ],
  },
  // Moderate risk 6-20 (condensed format)
  {
    id: "SYNTH-MR-006", category: "moderate_risk",
    assessment: { demographics: { age: 50, gender: "male", bmi: 30.0 }, symptoms: ["Excessive Thirst", "Fatigue"], risk_factors: ["Obesity", "Sedentary Lifestyle"], lab_results: {} },
    matched_rules: [{ rule_id: "T2D-RISK-04", rule_name: "T2 Risk Pattern", certainty_factor: 0.52 }],
    expert_result: { condition: "Possible Early Signs of Diabetes", condition_key: "symptom_only_screening", risk_level: "moderate", certainty_factor: 0.52 },
    expected_reasoning: { primary_evidence: [{ type: "symptom", label: "Excessive thirst" }, { type: "symptom", label: "Fatigue" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }], conflicting_evidence: [], explanation: "Cardinal symptom with risk factors but no lab confirmation." },
    expected_explanation: { what_it_means: "Symptoms and risk factors suggest possible diabetes. Blood tests needed.", why_generated: "Polydipsia with obesity and sedentary lifestyle.", what_it_does_not_mean: ["Without labs, this is screening only."] },
    next_steps: [{ priority: "high", action: "Get lab tests" }],
  },
  {
    id: "SYNTH-MR-007", category: "moderate_risk",
    assessment: { demographics: { age: 44, gender: "female", bmi: 27.5 }, symptoms: [], risk_factors: ["Family History", "Gestational History", "Obesity"], lab_results: { fasting_glucose: 102 } },
    matched_rules: [{ rule_id: "T2D-RISK-05", rule_name: "Post-GDM Risk", certainty_factor: 0.48 }],
    expert_result: { condition: "Elevated Type 2 Diabetes Risk", condition_key: "type2_risk_increased", risk_level: "elevated", certainty_factor: 0.48 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "102", significance: "Prediabetes range" }], supporting_evidence: [{ type: "risk_factor", label: "Gestational history" }, { type: "risk_factor", label: "Family history" }], conflicting_evidence: [], explanation: "Borderline FPG with strong risk factor profile including prior gestational diabetes." },
    expected_explanation: { what_it_means: "Your fasting glucose is slightly elevated and your history of gestational diabetes increases future risk.", why_generated: "Borderline FPG with post-GDM risk.", what_it_does_not_mean: ["Not all women with GDM history develop Type 2 diabetes."] },
    next_steps: [{ priority: "high", action: "Annual screening recommended" }, { priority: "medium", action: "Lifestyle modifications" }],
  },
  {
    id: "SYNTH-MR-008", category: "moderate_risk",
    assessment: { demographics: { age: 58, gender: "male", bmi: 32.0 }, symptoms: ["Frequent Urination"], risk_factors: ["Obesity", "Hypertension"], lab_results: { hba1c: 6.2 } },
    matched_rules: [{ rule_id: "PRE-DM-05", rule_name: "HbA1c Prediabetes High", certainty_factor: 0.68 }],
    expert_result: { condition: "Prediabetes — Act Early", condition_key: "prediabetes_high_risk", risk_level: "moderate", certainty_factor: 0.68 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "HbA1c", value: "6.2", significance: "Upper prediabetes range" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }], conflicting_evidence: [], explanation: "HbA1c approaching diabetes threshold with metabolic risk factors." },
    expected_explanation: { what_it_means: "Your HbA1c is in the upper prediabetes range. Prompt lifestyle changes recommended.", why_generated: "HbA1c 6.2% with obesity and hypertension.", what_it_does_not_mean: ["Not yet diabetes. Aggressive lifestyle changes can reverse this."] },
    next_steps: [{ priority: "high", action: "Clinical consultation" }, { priority: "high", action: "Intensive lifestyle program" }],
  },
  {
    id: "SYNTH-MR-009", category: "moderate_risk",
    assessment: { demographics: { age: 39, gender: "female", bmi: 26.0 }, symptoms: ["Weight Loss", "Fatigue"], risk_factors: [], lab_results: {} },
    matched_rules: [{ rule_id: "SCREEN-SYMP-01", rule_name: "Symptom Screen", certainty_factor: 0.45 }],
    expert_result: { condition: "Possible Early Signs", condition_key: "symptom_only_screening", risk_level: "moderate", certainty_factor: 0.45 },
    expected_reasoning: { primary_evidence: [{ type: "symptom", label: "Unexplained weight loss" }, { type: "symptom", label: "Fatigue" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Unexplained weight loss with fatigue — could indicate metabolic issue but labs needed." },
    expected_explanation: { what_it_means: "Weight loss and fatigue together warrant investigation including blood glucose testing.", why_generated: "Two concerning symptoms without lab data.", what_it_does_not_mean: ["These symptoms have many possible causes beyond diabetes."] },
    next_steps: [{ priority: "high", action: "Get comprehensive blood work" }],
  },
  {
    id: "SYNTH-MR-010", category: "moderate_risk",
    assessment: { demographics: { age: 47, gender: "male", bmi: 28.0 }, symptoms: ["Acanthosis Nigricans"], risk_factors: ["Obesity", "Ethnicity High Risk"], lab_results: { fasting_glucose: 110 } },
    matched_rules: [{ rule_id: "T2D-RISK-06", rule_name: "Insulin Resistance Pattern", certainty_factor: 0.55 }],
    expert_result: { condition: "Elevated Type 2 Diabetes Risk", condition_key: "type2_risk_increased", risk_level: "moderate", certainty_factor: 0.55 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "110", significance: "Prediabetes range" }, { type: "symptom", label: "Acanthosis nigricans", significance: "Sign of insulin resistance" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }, { type: "risk_factor", label: "High-risk ethnicity" }], conflicting_evidence: [], explanation: "Impaired fasting glucose with clinical sign of insulin resistance." },
    expected_explanation: { what_it_means: "Your fasting glucose is elevated and acanthosis nigricans suggests insulin resistance.", why_generated: "FPG 110 with insulin resistance sign and risk factors.", what_it_does_not_mean: ["Insulin resistance is not the same as diabetes but can lead to it."] },
    next_steps: [{ priority: "high", action: "Comprehensive metabolic evaluation" }, { priority: "medium", action: "Weight management" }],
  },
  {
    id: "SYNTH-MR-011", category: "moderate_risk",
    assessment: { demographics: { age: 53, gender: "female", bmi: 29.5 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Fatigue"], risk_factors: ["Family History"], lab_results: {} },
    matched_rules: [{ rule_id: "CLASSIC-01", rule_name: "Classic Symptoms", certainty_factor: 0.60 }],
    expert_result: { condition: "Suspected Diabetes (Classic Symptoms)", condition_key: "classic_symptoms", risk_level: "moderate", certainty_factor: 0.60 },
    expected_reasoning: { primary_evidence: [{ type: "symptom", label: "Frequent urination" }, { type: "symptom", label: "Excessive thirst" }, { type: "symptom", label: "Fatigue" }], supporting_evidence: [{ type: "risk_factor", label: "Family history" }], conflicting_evidence: [], explanation: "Three classic diabetes symptoms with family history but no lab confirmation." },
    expected_explanation: { what_it_means: "You have classic diabetes symptoms. Lab tests are urgently needed.", why_generated: "Classic triad symptoms present.", what_it_does_not_mean: ["Classic symptoms don't confirm diabetes — only blood tests can do that."] },
    next_steps: [{ priority: "high", action: "Urgent blood tests" }, { priority: "high", action: "Clinical consultation" }],
  },
  {
    id: "SYNTH-MR-012", category: "moderate_risk",
    assessment: { demographics: { age: 41, gender: "male", bmi: 27.0 }, symptoms: [], risk_factors: ["Family History", "Obesity", "Sedentary Lifestyle", "Hypertension"], lab_results: { fasting_glucose: 99 } },
    matched_rules: [{ rule_id: "T2D-RISK-07", rule_name: "Multi-Risk Pattern", certainty_factor: 0.50 }],
    expert_result: { condition: "Elevated Type 2 Diabetes Risk", condition_key: "type2_risk_increased", risk_level: "moderate", certainty_factor: 0.50 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "99", significance: "Upper normal range" }], supporting_evidence: [{ type: "risk_factor", label: "Family history" }, { type: "risk_factor", label: "Obesity" }, { type: "risk_factor", label: "Sedentary lifestyle" }, { type: "risk_factor", label: "Hypertension" }], conflicting_evidence: [], explanation: "Normal but borderline FPG with multiple modifiable risk factors." },
    expected_explanation: { what_it_means: "Blood sugar is normal but borderline, and you have multiple risk factors for Type 2 diabetes.", why_generated: "Borderline FPG with 4 risk factors.", what_it_does_not_mean: ["Blood sugar is technically still normal. Prevention can keep it that way."] },
    next_steps: [{ priority: "medium", action: "Lifestyle modifications targeting all risk factors" }, { priority: "routine", action: "Annual monitoring" }],
  },
  {
    id: "SYNTH-MR-013", category: "moderate_risk",
    assessment: { demographics: { age: 35, gender: "female", bmi: 25.0 }, symptoms: ["Recurrent UTI/Yeast"], risk_factors: [], lab_results: { fasting_glucose: 104 } },
    matched_rules: [{ rule_id: "SCREEN-INF-01", rule_name: "Infection Pattern", certainty_factor: 0.42 }],
    expert_result: { condition: "Possible Early Signs of Diabetes", condition_key: "symptom_only_screening", risk_level: "moderate", certainty_factor: 0.42 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "104", significance: "Prediabetes range" }, { type: "symptom", label: "Recurrent UTI/yeast infections" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Recurrent infections can be an early diabetes sign; borderline FPG supports further investigation." },
    expected_explanation: { what_it_means: "Recurrent infections combined with slightly elevated blood sugar warrant further investigation.", why_generated: "Borderline FPG with recurrent infections.", what_it_does_not_mean: ["Recurrent infections have many non-diabetic causes."] },
    next_steps: [{ priority: "high", action: "HbA1c test for confirmation" }, { priority: "medium", action: "Treat underlying infections" }],
  },
  {
    id: "SYNTH-MR-014", category: "moderate_risk",
    assessment: { demographics: { age: 46, gender: "male", bmi: 33.0 }, symptoms: [], risk_factors: ["Obesity", "Smoking", "Family History"], lab_results: { hba1c: 5.7 } },
    matched_rules: [{ rule_id: "PRE-DM-06", rule_name: "Borderline HbA1c", certainty_factor: 0.48 }],
    expert_result: { condition: "Prediabetes (Impaired Glucose Regulation)", condition_key: "prediabetes_possible", risk_level: "moderate", certainty_factor: 0.48 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "HbA1c", value: "5.7", significance: "Borderline prediabetes (5.7%)" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }, { type: "risk_factor", label: "Smoking" }, { type: "risk_factor", label: "Family history" }], conflicting_evidence: [], explanation: "HbA1c at the prediabetes threshold with strong risk factor profile." },
    expected_explanation: { what_it_means: "Your HbA1c is right at the prediabetes boundary. With your risk factors, preventive action is strongly recommended.", why_generated: "HbA1c 5.7% — the prediabetes threshold — with multiple risk factors.", what_it_does_not_mean: ["Being at exactly 5.7% is borderline — small changes can bring it down."] },
    next_steps: [{ priority: "high", action: "Weight management and smoking cessation" }, { priority: "medium", action: "Fasting glucose confirmation" }],
  },
  {
    id: "SYNTH-MR-015", category: "moderate_risk",
    assessment: { demographics: { age: 60, gender: "female", bmi: 28.0 }, symptoms: ["Excessive Thirst", "Blurred Vision"], risk_factors: ["Hypertension"], lab_results: { fasting_glucose: 118 } },
    matched_rules: [{ rule_id: "PRE-DM-07", rule_name: "Elevated FPG with Symptoms", certainty_factor: 0.65 }],
    expert_result: { condition: "Prediabetes — Act Early", condition_key: "prediabetes_high_risk", risk_level: "moderate", certainty_factor: 0.65 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "118", significance: "Upper prediabetes range" }, { type: "symptom", label: "Excessive thirst" }, { type: "symptom", label: "Blurred vision" }], supporting_evidence: [{ type: "risk_factor", label: "Hypertension" }], conflicting_evidence: [], explanation: "Upper prediabetes FPG with cardinal symptoms and vision changes." },
    expected_explanation: { what_it_means: "Elevated fasting glucose with diabetes symptoms suggests action is needed promptly.", why_generated: "FPG 118 with polydipsia and blurred vision.", what_it_does_not_mean: ["Not confirmed diabetes yet, but warrants prompt clinical attention."] },
    next_steps: [{ priority: "high", action: "Prompt clinical evaluation" }, { priority: "high", action: "HbA1c confirmation" }],
  },
  {
    id: "SYNTH-MR-016", category: "moderate_risk",
    assessment: { demographics: { age: 38, gender: "male", bmi: 26.0 }, symptoms: ["Weight Loss", "Frequent Urination"], risk_factors: [], lab_results: {} },
    matched_rules: [{ rule_id: "CLASSIC-02", rule_name: "Classic Pattern Partial", certainty_factor: 0.48 }],
    expert_result: { condition: "Possible Early Signs", condition_key: "symptom_only_screening", risk_level: "moderate", certainty_factor: 0.48 },
    expected_reasoning: { primary_evidence: [{ type: "symptom", label: "Weight loss" }, { type: "symptom", label: "Frequent urination" }], supporting_evidence: [], conflicting_evidence: [], missing_evidence: [{ type: "missing_labs" }], explanation: "Two concerning symptoms without lab data. Age and normal BMI could suggest Type 1 if onset is rapid." },
    expected_explanation: { what_it_means: "Weight loss with frequent urination needs investigation — blood tests are essential.", why_generated: "Two cardinal symptoms without labs.", what_it_does_not_mean: ["Cannot determine diabetes type without lab tests."] },
    next_steps: [{ priority: "high", action: "Urgent blood tests (FPG, HbA1c)" }],
  },
  {
    id: "SYNTH-MR-017", category: "moderate_risk",
    assessment: { demographics: { age: 55, gender: "female", bmi: 30.5 }, symptoms: ["Slow Healing", "Frequent Infections"], risk_factors: ["Obesity", "PCOS History"], lab_results: { fasting_glucose: 112, hba1c: 6.1 } },
    matched_rules: [{ rule_id: "PRE-DM-08", rule_name: "Prediabetes Dual Confirmed", certainty_factor: 0.70 }],
    expert_result: { condition: "Prediabetes — Act Early", condition_key: "prediabetes_high_risk", risk_level: "moderate", certainty_factor: 0.70 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "112", significance: "Prediabetes" }, { type: "lab_result", label: "HbA1c", value: "6.1", significance: "Prediabetes" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }, { type: "risk_factor", label: "PCOS history" }], conflicting_evidence: [], explanation: "Both labs in prediabetes range with complications suggestive symptoms." },
    expected_explanation: { what_it_means: "Both blood sugar tests confirm prediabetes with symptoms of possible complications.", why_generated: "Dual lab confirmation of prediabetes with supporting symptoms and PCOS history.", what_it_does_not_mean: ["Prediabetes is reversible with prompt lifestyle changes."] },
    next_steps: [{ priority: "high", action: "Comprehensive clinical evaluation" }, { priority: "high", action: "Structured lifestyle intervention" }],
  },
  {
    id: "SYNTH-MR-018", category: "moderate_risk",
    assessment: { demographics: { age: 43, gender: "male", bmi: 27.0 }, symptoms: ["Frequent Urination", "Excessive Hunger"], risk_factors: ["Family History"], lab_results: { fasting_glucose: 106 } },
    matched_rules: [{ rule_id: "T2D-RISK-08", rule_name: "Symptom + Lab Pattern", certainty_factor: 0.55 }],
    expert_result: { condition: "Possible Diabetes", condition_key: "diabetes_possible", risk_level: "moderate", certainty_factor: 0.55 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "106", significance: "Prediabetes range" }, { type: "symptom", label: "Frequent urination" }, { type: "symptom", label: "Excessive hunger" }], supporting_evidence: [{ type: "risk_factor", label: "Family history" }], conflicting_evidence: [], explanation: "Borderline FPG with two cardinal symptoms and family history." },
    expected_explanation: { what_it_means: "Slightly elevated blood sugar with diabetes symptoms — further testing recommended.", why_generated: "FPG 106 with polyuria, polyphagia, and family history.", what_it_does_not_mean: ["Not confirmed diabetes — HbA1c needed for clarification."] },
    next_steps: [{ priority: "high", action: "HbA1c test" }, { priority: "high", action: "Clinical consultation" }],
  },
  {
    id: "SYNTH-MR-019", category: "moderate_risk",
    assessment: { demographics: { age: 50, gender: "female", bmi: 31.0 }, symptoms: [], risk_factors: ["Obesity", "Family History", "Gestational History"], lab_results: { "2h_ogtt_75g": 155 } },
    matched_rules: [{ rule_id: "PRE-DM-09", rule_name: "OGTT Impaired", certainty_factor: 0.58 }],
    expert_result: { condition: "Prediabetes (Impaired Glucose Tolerance)", condition_key: "prediabetes_possible", risk_level: "moderate", certainty_factor: 0.58 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "2h OGTT", value: "155", significance: "Impaired glucose tolerance (140-199)" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }, { type: "risk_factor", label: "Gestational history" }], conflicting_evidence: [], explanation: "OGTT in impaired range with strong risk profile." },
    expected_explanation: { what_it_means: "Your glucose tolerance test shows impaired glucose handling — prediabetes pattern.", why_generated: "2h OGTT 155 mg/dL (impaired range) with risk factors.", what_it_does_not_mean: ["Impaired glucose tolerance is not diabetes yet."] },
    next_steps: [{ priority: "high", action: "Lifestyle intervention" }, { priority: "medium", action: "Repeat OGTT in 3-6 months" }],
  },
  {
    id: "SYNTH-MR-020", category: "moderate_risk",
    assessment: { demographics: { age: 65, gender: "male", bmi: 27.5 }, symptoms: ["Fatigue", "Dry Mouth"], risk_factors: ["Hypertension", "High Cholesterol"], lab_results: { fasting_glucose: 120, hba1c: 6.3 } },
    matched_rules: [{ rule_id: "PRE-DM-10", rule_name: "Prediabetes Advanced", certainty_factor: 0.72 }],
    expert_result: { condition: "Prediabetes — Act Early", condition_key: "prediabetes_high_risk", risk_level: "moderate", certainty_factor: 0.72 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "120", significance: "Upper prediabetes" }, { type: "lab_result", label: "HbA1c", value: "6.3", significance: "Upper prediabetes" }], supporting_evidence: [{ type: "risk_factor", label: "Hypertension" }, { type: "risk_factor", label: "High cholesterol" }], conflicting_evidence: [], explanation: "Both labs in upper prediabetes range — near diabetes threshold." },
    expected_explanation: { what_it_means: "Your blood sugar is at the upper end of prediabetes, very close to diabetes range.", why_generated: "FPG 120 and HbA1c 6.3% — both near diabetes threshold.", what_it_does_not_mean: ["Not diabetes yet but urgent preventive action needed."] },
    next_steps: [{ priority: "high", action: "Immediate clinical consultation" }, { priority: "high", action: "Aggressive lifestyle intervention" }],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HIGH RISK EXAMPLES (41-55)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "SYNTH-HR-001", category: "high_risk",
    assessment: { demographics: { age: 58, gender: "male", bmi: 32.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Weight Loss", "Fatigue", "Blurred Vision"], risk_factors: ["Obesity", "Family History", "Hypertension"], lab_results: { fasting_glucose: 145, hba1c: 7.2 } },
    matched_rules: [{ rule_id: "DM-CONF-01", rule_name: "Diabetes Confirmed FPG", certainty_factor: 0.92 }, { rule_id: "DM-CONF-02", rule_name: "Diabetes Confirmed HbA1c", certainty_factor: 0.90 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.92 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "145", significance: "Diabetic range (≥126)" }, { type: "lab_result", label: "HbA1c", value: "7.2", significance: "Diabetic range (≥6.5%)" }, { type: "symptom", label: "Frequent urination" }, { type: "symptom", label: "Excessive thirst" }, { type: "symptom", label: "Weight loss" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }, { type: "risk_factor", label: "Family history" }], conflicting_evidence: [], explanation: "Both FPG and HbA1c meet diabetes diagnostic criteria with full classic symptom triad." },
    expected_explanation: { what_it_means: "Your laboratory results meet the standard diagnostic criteria for diabetes, supported by classic diabetes symptoms.", why_generated: "FPG 145 and HbA1c 7.2% — both in diabetic range — with classic symptoms.", what_it_does_not_mean: ["This is a strong indication but your doctor will confirm and start a treatment plan."] },
    next_steps: [{ priority: "urgent", action: "See a doctor promptly" }, { priority: "high", action: "Start diabetes management plan" }],
  },
  {
    id: "SYNTH-HR-002", category: "high_risk",
    assessment: { demographics: { age: 50, gender: "female", bmi: 35.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Fatigue"], risk_factors: ["Obesity", "Sedentary Lifestyle"], lab_results: { fasting_glucose: 132, hba1c: 6.8 } },
    matched_rules: [{ rule_id: "DM-CONF-03", rule_name: "Diabetes FPG Confirmed", certainty_factor: 0.88 }],
    expert_result: { condition: "Likely Diabetes Mellitus", condition_key: "diabetes_likely", risk_level: "high", certainty_factor: 0.85 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "132", significance: "Diabetic range" }, { type: "lab_result", label: "HbA1c", value: "6.8", significance: "Diabetic range" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }], conflicting_evidence: [], explanation: "Both labs exceed diabetes thresholds with supporting symptoms." },
    expected_explanation: { what_it_means: "Your blood sugar levels meet diabetes criteria. A doctor should confirm and start treatment.", why_generated: "FPG 132 and HbA1c 6.8% with classic symptoms.", what_it_does_not_mean: ["Diabetes is manageable. Early treatment leads to better outcomes."] },
    next_steps: [{ priority: "urgent", action: "Clinical consultation within days" }, { priority: "high", action: "Begin lifestyle modifications immediately" }],
  },
  {
    id: "SYNTH-HR-003", category: "high_risk",
    assessment: { demographics: { age: 62, gender: "male", bmi: 30.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Blurred Vision", "Slow Healing", "Tingling Hands Feet"], risk_factors: ["Obesity", "Family History", "Hypertension", "High Cholesterol"], lab_results: { fasting_glucose: 180, hba1c: 8.5 } },
    matched_rules: [{ rule_id: "DM-CONF-04", rule_name: "Diabetes Severe", certainty_factor: 0.95 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.95 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "180", significance: "Significantly elevated" }, { type: "lab_result", label: "HbA1c", value: "8.5", significance: "Poorly controlled" }], supporting_evidence: [{ type: "risk_factor", label: "Multiple metabolic risk factors" }], conflicting_evidence: [], explanation: "Severely elevated glucose with multiple complications and metabolic syndrome." },
    expected_explanation: { what_it_means: "Your blood sugar is significantly elevated with signs of possible complications. Prompt treatment is important.", why_generated: "FPG 180, HbA1c 8.5% with complications (neuropathy, retinopathy signs).", what_it_does_not_mean: ["With proper treatment, diabetes can be managed effectively."] },
    next_steps: [{ priority: "urgent", action: "Urgent medical appointment" }, { priority: "urgent", action: "Complication screening (eyes, kidneys, feet)" }],
  },
  {
    id: "SYNTH-HR-004", category: "high_risk",
    assessment: { demographics: { age: 45, gender: "female", bmi: 29.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Weight Loss"], risk_factors: ["Family History"], lab_results: { random_plasma_glucose: 250 } },
    matched_rules: [{ rule_id: "DM-CONF-05", rule_name: "Random Glucose with Symptoms", certainty_factor: 0.88 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.88 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "Random glucose", value: "250", significance: "Diabetic range (≥200 with symptoms)" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Random glucose ≥200 with classic symptoms meets diagnostic criteria." },
    expected_explanation: { what_it_means: "A random blood glucose of 250 mg/dL with classic symptoms meets diabetes diagnostic criteria.", why_generated: "Random glucose ≥200 with polyuria, polydipsia, and weight loss.", what_it_does_not_mean: ["Your doctor will confirm with fasting glucose or HbA1c and start a management plan."] },
    next_steps: [{ priority: "urgent", action: "Medical consultation" }],
  },
  {
    id: "SYNTH-HR-005", category: "high_risk",
    assessment: { demographics: { age: 55, gender: "male", bmi: 28.0 }, symptoms: ["Frequent Urination", "Excessive Thirst"], risk_factors: ["Family History", "Sedentary Lifestyle"], lab_results: { fasting_glucose: 128, hba1c: 6.6 } },
    matched_rules: [{ rule_id: "DM-LIKELY-01", rule_name: "Diabetes Likely", certainty_factor: 0.82 }],
    expert_result: { condition: "Likely Diabetes Mellitus", condition_key: "diabetes_likely", risk_level: "high", certainty_factor: 0.82 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "128", significance: "Diabetic range" }, { type: "lab_result", label: "HbA1c", value: "6.6", significance: "Diabetic range" }], supporting_evidence: [{ type: "risk_factor", label: "Family history" }], conflicting_evidence: [], explanation: "Both labs just over diabetes thresholds with cardinal symptoms." },
    expected_explanation: { what_it_means: "Both your fasting glucose and HbA1c exceed diabetes thresholds.", why_generated: "FPG 128 and HbA1c 6.6% — both above diagnostic cutoffs.", what_it_does_not_mean: ["Being just over the threshold means early treatment is especially effective."] },
    next_steps: [{ priority: "urgent", action: "See a doctor soon" }, { priority: "high", action: "Repeat confirmatory testing" }],
  },
  {
    id: "SYNTH-HR-006", category: "high_risk",
    assessment: { demographics: { age: 48, gender: "male", bmi: 31.0 }, symptoms: ["Nausea", "Vomiting", "Abdominal Pain", "Fruity Breath"], risk_factors: [], lab_results: { fasting_glucose: 320 } },
    matched_rules: [{ rule_id: "EMERG-DKA-01", rule_name: "Possible DKA", certainty_factor: 0.95 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.95 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "320", significance: "Critically elevated" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Critically high glucose with DKA symptoms — medical emergency." },
    expected_explanation: { what_it_means: "Your blood sugar is critically high with symptoms suggesting DKA. This needs emergency medical attention.", why_generated: "FPG 320 with nausea, vomiting, abdominal pain, and fruity breath.", what_it_does_not_mean: ["DKA is treatable but requires immediate hospital care."] },
    next_steps: [{ priority: "urgent", action: "Seek emergency medical care NOW" }],
  },
  {
    id: "SYNTH-HR-007", category: "high_risk",
    assessment: { demographics: { age: 70, gender: "female", bmi: 27.0 }, symptoms: ["Fatigue", "Blurred Vision", "Slow Healing"], risk_factors: ["Hypertension", "High Cholesterol"], lab_results: { fasting_glucose: 155, hba1c: 7.8 } },
    matched_rules: [{ rule_id: "DM-CONF-06", rule_name: "Diabetes with Complications", certainty_factor: 0.90 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.90 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "155" }, { type: "lab_result", label: "HbA1c", value: "7.8" }], supporting_evidence: [{ type: "risk_factor", label: "Hypertension" }], conflicting_evidence: [], explanation: "Diabetes-range labs with complication symptoms in elderly patient." },
    expected_explanation: { what_it_means: "Lab values confirm diabetes with symptoms suggesting possible complications.", why_generated: "FPG 155, HbA1c 7.8% with microvascular symptoms.", what_it_does_not_mean: ["Complications are treatable, especially when caught early."] },
    next_steps: [{ priority: "urgent", action: "Comprehensive diabetes evaluation" }, { priority: "urgent", action: "Eye and kidney screening" }],
  },
  {
    id: "SYNTH-HR-008", category: "high_risk",
    assessment: { demographics: { age: 52, gender: "male", bmi: 34.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Excessive Hunger", "Weight Loss", "Fatigue"], risk_factors: ["Obesity", "Family History"], lab_results: { "2h_ogtt_75g": 215 } },
    matched_rules: [{ rule_id: "DM-OGTT-01", rule_name: "OGTT Diabetes Range", certainty_factor: 0.85 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.85 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "2h OGTT", value: "215", significance: "Diabetic range (≥200)" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }], conflicting_evidence: [], explanation: "OGTT in diabetes range with full classic symptom set." },
    expected_explanation: { what_it_means: "Your oral glucose tolerance test exceeds the diabetes threshold with classic symptoms.", why_generated: "2h OGTT 215 with all three cardinal symptoms plus weight loss and fatigue.", what_it_does_not_mean: ["OGTT confirms diagnosis. Treatment can start immediately."] },
    next_steps: [{ priority: "urgent", action: "Begin diabetes management" }],
  },
  {
    id: "SYNTH-HR-009", category: "high_risk",
    assessment: { demographics: { age: 40, gender: "female", bmi: 29.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Fatigue", "Blurred Vision"], risk_factors: ["Family History"], lab_results: { fasting_glucose: 138, hba1c: 7.0 } },
    matched_rules: [{ rule_id: "DM-CONF-07", rule_name: "Diabetes Confirmed Dual", certainty_factor: 0.90 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.90 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "138" }, { type: "lab_result", label: "HbA1c", value: "7.0" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Dual lab confirmation with multiple diabetes symptoms." },
    expected_explanation: { what_it_means: "Both lab tests confirm diabetes. Early treatment gives the best outcomes.", why_generated: "FPG 138 and HbA1c 7.0% with classic symptoms.", what_it_does_not_mean: ["Diabetes is a manageable condition with proper care."] },
    next_steps: [{ priority: "urgent", action: "Start treatment plan with healthcare provider" }],
  },
  {
    id: "SYNTH-HR-010", category: "high_risk",
    assessment: { demographics: { age: 56, gender: "male", bmi: 26.5 }, symptoms: ["Sweating", "Shaking", "Dizziness", "Irritability"], risk_factors: [], lab_results: { blood_glucose: 55 } },
    matched_rules: [{ rule_id: "HYPO-01", rule_name: "Hypoglycemia Pattern", certainty_factor: 0.88 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.88 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "Blood glucose", value: "55", significance: "Hypoglycemic range" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Low blood glucose with classic hypoglycemia symptoms — may indicate treated diabetes or reactive hypoglycemia." },
    expected_explanation: { what_it_means: "Your blood sugar is abnormally low, which can be dangerous. This needs medical evaluation.", why_generated: "Blood glucose 55 mg/dL with hypoglycemia symptoms.", what_it_does_not_mean: ["Hypoglycemia can occur in diabetes or in non-diabetic conditions."] },
    next_steps: [{ priority: "urgent", action: "Treat hypoglycemia immediately (eat fast-acting sugar)" }, { priority: "urgent", action: "Seek medical evaluation" }],
  },
  {
    id: "SYNTH-HR-011", category: "high_risk",
    assessment: { demographics: { age: 63, gender: "female", bmi: 33.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Tingling Hands Feet", "Frequent Infections"], risk_factors: ["Obesity", "Family History", "Hypertension", "PCOS History"], lab_results: { fasting_glucose: 162, hba1c: 7.5 } },
    matched_rules: [{ rule_id: "DM-CONF-08", rule_name: "Diabetes with Neuropathy", certainty_factor: 0.93 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.93 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "162" }, { type: "lab_result", label: "HbA1c", value: "7.5" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }, { type: "risk_factor", label: "Family history" }], conflicting_evidence: [], explanation: "Confirmed diabetes with possible neuropathy and immune compromise signs." },
    expected_explanation: { what_it_means: "Diabetes is confirmed with signs of possible nerve damage and weakened immune response.", why_generated: "FPG 162, HbA1c 7.5% with tingling and recurrent infections.", what_it_does_not_mean: ["Neuropathy can be slowed with good blood sugar control."] },
    next_steps: [{ priority: "urgent", action: "Comprehensive diabetes care" }, { priority: "urgent", action: "Nerve function testing" }],
  },
  {
    id: "SYNTH-HR-012", category: "high_risk",
    assessment: { demographics: { age: 47, gender: "male", bmi: 30.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Fatigue"], risk_factors: ["Obesity", "Smoking"], lab_results: { hba1c: 9.0 } },
    matched_rules: [{ rule_id: "DM-CONF-09", rule_name: "Severely Elevated HbA1c", certainty_factor: 0.95 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.95 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "HbA1c", value: "9.0", significance: "Severely elevated" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }], conflicting_evidence: [], explanation: "HbA1c 9.0% is significantly above diabetes threshold." },
    expected_explanation: { what_it_means: "HbA1c of 9.0% indicates blood sugar has been consistently elevated for months. Treatment is urgently needed.", why_generated: "Severely elevated HbA1c with classic symptoms.", what_it_does_not_mean: ["High HbA1c can be improved with treatment and lifestyle changes."] },
    next_steps: [{ priority: "urgent", action: "Immediate medical treatment" }, { priority: "urgent", action: "Stop smoking" }],
  },
  {
    id: "SYNTH-HR-013", category: "high_risk",
    assessment: { demographics: { age: 42, gender: "female", bmi: 28.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Weight Loss", "Fatigue"], risk_factors: [], lab_results: { fasting_glucose: 200, hba1c: 8.2 } },
    matched_rules: [{ rule_id: "DM-CONF-10", rule_name: "Diabetes Confirmed Severe", certainty_factor: 0.95 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.95 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "200" }, { type: "lab_result", label: "HbA1c", value: "8.2" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Very high glucose levels with full classic symptoms." },
    expected_explanation: { what_it_means: "Blood sugar is significantly elevated. Immediate medical attention is recommended.", why_generated: "FPG 200 and HbA1c 8.2%.", what_it_does_not_mean: ["With treatment, glucose can be brought under control."] },
    next_steps: [{ priority: "urgent", action: "See doctor immediately" }],
  },
  {
    id: "SYNTH-HR-014", category: "high_risk",
    assessment: { demographics: { age: 60, gender: "male", bmi: 32.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Blurred Vision", "Slow Healing"], risk_factors: ["Obesity", "Family History", "Hypertension"], lab_results: { fasting_glucose: 148, hba1c: 7.4, "2h_ogtt_75g": 230 } },
    matched_rules: [{ rule_id: "DM-CONF-11", rule_name: "Triple Lab Confirmation", certainty_factor: 0.96 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.96 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "148" }, { type: "lab_result", label: "HbA1c", value: "7.4" }, { type: "lab_result", label: "2h OGTT", value: "230" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }], conflicting_evidence: [], explanation: "All three glucose tests confirm diabetes with complication symptoms." },
    expected_explanation: { what_it_means: "All three blood sugar tests confirm diabetes. Comprehensive management is needed.", why_generated: "Triple lab confirmation with complications.", what_it_does_not_mean: ["Diabetes is a lifelong condition but well-manageable with proper care."] },
    next_steps: [{ priority: "urgent", action: "Comprehensive diabetes management plan" }],
  },
  {
    id: "SYNTH-HR-015", category: "high_risk",
    assessment: { demographics: { age: 35, gender: "male", bmi: 25.0 }, symptoms: ["Deep Rapid Breathing", "Nausea", "Vomiting", "Abdominal Pain", "Fruity Breath", "Weight Loss"], risk_factors: [], lab_results: { random_plasma_glucose: 400 } },
    matched_rules: [{ rule_id: "EMERG-DKA-02", rule_name: "DKA Emergency", certainty_factor: 0.98 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.98 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "Random glucose", value: "400", significance: "Critically elevated" }], supporting_evidence: [], conflicting_evidence: [], explanation: "EMERGENCY: Critically high glucose with DKA presentation." },
    expected_explanation: { what_it_means: "This is a medical emergency. Seek immediate emergency care.", why_generated: "Random glucose 400 with DKA symptoms.", what_it_does_not_mean: ["DKA is treatable in a hospital setting."] },
    next_steps: [{ priority: "urgent", action: "EMERGENCY: Go to hospital immediately" }],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 1 DIABETES PATTERNS (56-65)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "SYNTH-T1-001", category: "type1_pattern",
    assessment: { demographics: { age: 14, gender: "male", bmi: 18.5 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Weight Loss", "Fatigue", "Bed Wetting"], risk_factors: [], lab_results: { fasting_glucose: 220 } },
    matched_rules: [{ rule_id: "T1D-01", rule_name: "Type 1 Pattern Young", certainty_factor: 0.88 }],
    expert_result: { condition: "Pattern Consistent with Type 1 Diabetes", condition_key: "type1_pattern_likely", risk_level: "high", certainty_factor: 0.88, suspected_type: { type: "Type 1", certainty: 0.85 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "220", significance: "Severely elevated" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Young patient with rapid onset, weight loss, and bed-wetting — classic Type 1 presentation." },
    expected_explanation: { what_it_means: "The pattern strongly suggests Type 1 diabetes — an autoimmune condition. Urgent specialist referral needed.", why_generated: "Young age, rapid onset, weight loss, bed-wetting with very high glucose.", what_it_does_not_mean: ["Type 1 diabetes requires insulin but is highly manageable with modern treatment."] },
    next_steps: [{ priority: "urgent", action: "Urgent pediatric endocrinologist referral" }, { priority: "urgent", action: "Autoantibody testing" }],
  },
  {
    id: "SYNTH-T1-002", category: "type1_pattern",
    assessment: { demographics: { age: 22, gender: "female", bmi: 19.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Weight Loss", "Fruity Breath", "Deep Rapid Breathing"], risk_factors: [], lab_results: { random_plasma_glucose: 350 } },
    matched_rules: [{ rule_id: "T1D-02", rule_name: "Type 1 with DKA Signs", certainty_factor: 0.92 }],
    expert_result: { condition: "Pattern Consistent with Type 1 Diabetes", condition_key: "type1_pattern_likely", risk_level: "high", certainty_factor: 0.92, suspected_type: { type: "Type 1", certainty: 0.90 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "Random glucose", value: "350", significance: "Critically elevated" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Young lean patient with DKA symptoms — emergency Type 1 presentation." },
    expected_explanation: { what_it_means: "EMERGENCY: Symptoms suggest diabetic ketoacidosis (DKA), a serious complication of Type 1 diabetes.", why_generated: "Very high glucose with fruity breath and rapid breathing in young lean patient.", what_it_does_not_mean: ["DKA is treatable in hospital. With insulin therapy, Type 1 diabetes is manageable."] },
    next_steps: [{ priority: "urgent", action: "EMERGENCY: Hospital immediately" }],
  },
  {
    id: "SYNTH-T1-003", category: "type1_pattern",
    assessment: { demographics: { age: 10, gender: "male", bmi: 16.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Excessive Hunger", "Weight Loss", "Bed Wetting"], risk_factors: [], lab_results: {} },
    matched_rules: [{ rule_id: "T1D-03", rule_name: "Pediatric Type 1 Symptoms", certainty_factor: 0.75 }],
    expert_result: { condition: "Suspected Diabetes (Classic Symptoms)", condition_key: "classic_symptoms", risk_level: "high", certainty_factor: 0.75, suspected_type: { type: "Type 1", certainty: 0.80 } },
    expected_reasoning: { primary_evidence: [{ type: "symptom", label: "Complete classic triad" }], supporting_evidence: [], conflicting_evidence: [], missing_evidence: [{ type: "missing_labs" }], explanation: "Child with complete 3 Ps plus bed-wetting and weight loss — highly suspicious for Type 1." },
    expected_explanation: { what_it_means: "A child with all classic diabetes symptoms plus bed-wetting and weight loss needs urgent evaluation.", why_generated: "Complete cardinal symptom triad in a child.", what_it_does_not_mean: ["Urgent blood test will confirm. Type 1 is the most common diabetes in children."] },
    next_steps: [{ priority: "urgent", action: "Urgent blood glucose test" }, { priority: "urgent", action: "Pediatric referral" }],
  },
  {
    id: "SYNTH-T1-004", category: "type1_pattern",
    assessment: { demographics: { age: 28, gender: "male", bmi: 21.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Weight Loss", "Fatigue"], risk_factors: [], lab_results: { fasting_glucose: 185, hba1c: 8.0 } },
    matched_rules: [{ rule_id: "T1D-04", rule_name: "Type 1 Adult Onset", certainty_factor: 0.82 }],
    expert_result: { condition: "Pattern Consistent with Type 1 Diabetes", condition_key: "type1_pattern_likely", risk_level: "high", certainty_factor: 0.82, suspected_type: { type: "Type 1", certainty: 0.78 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "185" }, { type: "lab_result", label: "HbA1c", value: "8.0" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Young lean adult with rapid-onset diabetes symptoms — LADA (latent autoimmune diabetes) possible." },
    expected_explanation: { what_it_means: "Diabetes confirmed in a young, lean adult — pattern suggests Type 1 or LADA.", why_generated: "High glucose in lean young adult without Type 2 risk factors.", what_it_does_not_mean: ["Autoantibody testing will determine the type. Both types are treatable."] },
    next_steps: [{ priority: "urgent", action: "Specialist referral for typing" }, { priority: "urgent", action: "Autoantibody panel" }],
  },
  {
    id: "SYNTH-T1-005", category: "type1_pattern",
    assessment: { demographics: { age: 16, gender: "female", bmi: 17.5 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Weight Loss", "Irritability"], risk_factors: [], lab_results: { fasting_glucose: 195 } },
    matched_rules: [{ rule_id: "T1D-05", rule_name: "Adolescent T1D", certainty_factor: 0.85 }],
    expert_result: { condition: "Pattern Consistent with Type 1 Diabetes", condition_key: "type1_pattern_likely", risk_level: "high", certainty_factor: 0.85, suspected_type: { type: "Type 1", certainty: 0.82 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "195" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Adolescent with classic Type 1 presentation." },
    expected_explanation: { what_it_means: "Pattern strongly suggests Type 1 diabetes in an adolescent.", why_generated: "Very high FPG in lean adolescent.", what_it_does_not_mean: ["Type 1 is well-managed with insulin. Many adolescents thrive with it."] },
    next_steps: [{ priority: "urgent", action: "Urgent pediatric endocrinology referral" }],
  },
  {
    id: "SYNTH-T1-006", category: "type1_pattern",
    assessment: { demographics: { age: 8, gender: "male", bmi: 15.5 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Bed Wetting", "Fatigue"], risk_factors: [], lab_results: { random_plasma_glucose: 280 } },
    matched_rules: [{ rule_id: "T1D-06", rule_name: "Child T1D", certainty_factor: 0.90 }],
    expert_result: { condition: "Pattern Consistent with Type 1 Diabetes", condition_key: "type1_pattern_likely", risk_level: "high", certainty_factor: 0.90, suspected_type: { type: "Type 1", certainty: 0.88 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "Random glucose", value: "280" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Child with very high glucose and bed-wetting — classic Type 1." },
    expected_explanation: { what_it_means: "Very likely Type 1 diabetes in a child. Urgent medical care needed.", why_generated: "Random glucose 280 in 8-year-old.", what_it_does_not_mean: ["Children do very well with modern insulin therapy."] },
    next_steps: [{ priority: "urgent", action: "Emergency care" }],
  },
  {
    id: "SYNTH-T1-007", category: "type1_pattern",
    assessment: { demographics: { age: 25, gender: "female", bmi: 20.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Weight Loss"], risk_factors: [], lab_results: { fasting_glucose: 168 } },
    matched_rules: [{ rule_id: "T1D-07", rule_name: "Young Adult T1D", certainty_factor: 0.78 }],
    expert_result: { condition: "Pattern Consistent with Type 1 Diabetes", condition_key: "type1_pattern_likely", risk_level: "high", certainty_factor: 0.78, suspected_type: { type: "Type 1", certainty: 0.75 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "168" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Young lean female with diabetes — Type 1 or LADA suspected." },
    expected_explanation: { what_it_means: "Diabetes confirmed in young lean adult — testing for Type 1 autoantibodies recommended.", why_generated: "FPG 168 in lean young adult.", what_it_does_not_mean: ["Autoantibody results will clarify the type."] },
    next_steps: [{ priority: "urgent", action: "Autoantibody testing" }],
  },
  {
    id: "SYNTH-T1-008", category: "type1_pattern",
    assessment: { demographics: { age: 12, gender: "female", bmi: 17.0 }, symptoms: ["Weight Loss", "Fatigue", "Excessive Thirst"], risk_factors: [], lab_results: {} },
    matched_rules: [{ rule_id: "T1D-08", rule_name: "Pediatric Screening", certainty_factor: 0.65 }],
    expert_result: { condition: "Suspected Diabetes (Classic Symptoms)", condition_key: "classic_symptoms", risk_level: "moderate", certainty_factor: 0.65, suspected_type: { type: "Type 1", certainty: 0.70 } },
    expected_reasoning: { primary_evidence: [{ type: "symptom", label: "Weight loss" }, { type: "symptom", label: "Excessive thirst" }], supporting_evidence: [], conflicting_evidence: [], missing_evidence: [{ type: "missing_labs" }], explanation: "Child with concerning symptoms but no labs. Blood test urgently needed." },
    expected_explanation: { what_it_means: "Symptoms in a child suggest possible Type 1 diabetes. Blood test urgently needed.", why_generated: "Weight loss and polydipsia in adolescent without lab confirmation.", what_it_does_not_mean: ["Cannot confirm without blood tests."] },
    next_steps: [{ priority: "urgent", action: "Immediate blood glucose test" }],
  },
  {
    id: "SYNTH-T1-009", category: "type1_pattern",
    assessment: { demographics: { age: 30, gender: "male", bmi: 22.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Weight Loss", "Fatigue", "Blurred Vision"], risk_factors: [], lab_results: { fasting_glucose: 240, hba1c: 10.2 } },
    matched_rules: [{ rule_id: "T1D-09", rule_name: "Severe T1D Presentation", certainty_factor: 0.95 }],
    expert_result: { condition: "Pattern Consistent with Type 1 Diabetes", condition_key: "type1_pattern_likely", risk_level: "high", certainty_factor: 0.95, suspected_type: { type: "Type 1", certainty: 0.92 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "240" }, { type: "lab_result", label: "HbA1c", value: "10.2" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Very severe presentation in lean young adult — urgent Type 1 management needed." },
    expected_explanation: { what_it_means: "Blood sugar is dangerously high. Urgent medical care and insulin therapy needed.", why_generated: "FPG 240 and HbA1c 10.2% in lean adult.", what_it_does_not_mean: ["With insulin treatment, blood sugar can be controlled."] },
    next_steps: [{ priority: "urgent", action: "Emergency medical care" }],
  },
  {
    id: "SYNTH-T1-010", category: "type1_pattern",
    assessment: { demographics: { age: 18, gender: "female", bmi: 19.5 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Weight Loss"], risk_factors: [], lab_results: { fasting_glucose: 175 } },
    matched_rules: [{ rule_id: "T1D-10", rule_name: "Late Adolescent T1D", certainty_factor: 0.82 }],
    expert_result: { condition: "Pattern Consistent with Type 1 Diabetes", condition_key: "type1_pattern_likely", risk_level: "high", certainty_factor: 0.82, suspected_type: { type: "Type 1", certainty: 0.78 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "175" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Late adolescent with classic Type 1 features." },
    expected_explanation: { what_it_means: "Diabetes confirmed in young lean patient — Type 1 pattern.", why_generated: "FPG 175 in lean 18-year-old.", what_it_does_not_mean: ["Modern insulin therapy gives excellent quality of life."] },
    next_steps: [{ priority: "urgent", action: "Endocrinology referral" }],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 2 DIABETES PATTERNS (66-75)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "SYNTH-T2-001", category: "type2_pattern",
    assessment: { demographics: { age: 55, gender: "male", bmi: 32.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Fatigue"], risk_factors: ["Obesity", "Family History", "Sedentary Lifestyle", "Hypertension"], lab_results: { fasting_glucose: 140, hba1c: 7.0 } },
    matched_rules: [{ rule_id: "T2D-01", rule_name: "Type 2 Pattern Classic", certainty_factor: 0.88 }],
    expert_result: { condition: "Pattern Consistent with Type 2 Diabetes", condition_key: "type2_pattern_likely", risk_level: "high", certainty_factor: 0.88, suspected_type: { type: "Type 2", certainty: 0.85 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "140" }, { type: "lab_result", label: "HbA1c", value: "7.0" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }, { type: "risk_factor", label: "Family history" }], conflicting_evidence: [], explanation: "Classic Type 2 presentation — middle-aged, obese, with multiple risk factors and gradual onset." },
    expected_explanation: { what_it_means: "The pattern is consistent with Type 2 diabetes — the most common type. Treatment is effective.", why_generated: "Diabetes labs with classic Type 2 risk profile.", what_it_does_not_mean: ["Type 2 diabetes is often manageable with lifestyle changes and/or medication."] },
    next_steps: [{ priority: "urgent", action: "Start diabetes management" }, { priority: "high", action: "Lifestyle modifications" }],
  },
  {
    id: "SYNTH-T2-002", category: "type2_pattern",
    assessment: { demographics: { age: 50, gender: "female", bmi: 34.0 }, symptoms: ["Fatigue", "Acanthosis Nigricans"], risk_factors: ["Obesity", "Family History", "PCOS History"], lab_results: { fasting_glucose: 135, hba1c: 6.9 } },
    matched_rules: [{ rule_id: "T2D-02", rule_name: "Insulin Resistance T2", certainty_factor: 0.85 }],
    expert_result: { condition: "Pattern Consistent with Type 2 Diabetes", condition_key: "type2_pattern_likely", risk_level: "high", certainty_factor: 0.85, suspected_type: { type: "Type 2", certainty: 0.88 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "135" }, { type: "lab_result", label: "HbA1c", value: "6.9" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }, { type: "risk_factor", label: "PCOS history" }], conflicting_evidence: [], explanation: "Insulin resistance pattern with acanthosis nigricans and PCOS history — classic Type 2." },
    expected_explanation: { what_it_means: "Diabetes with insulin resistance features. PCOS and obesity compound the risk.", why_generated: "FPG 135, HbA1c 6.9% with insulin resistance signs.", what_it_does_not_mean: ["Type 2 responds well to lifestyle changes and metformin."] },
    next_steps: [{ priority: "urgent", action: "Medical treatment plan" }, { priority: "high", action: "Weight management program" }],
  },
  {
    id: "SYNTH-T2-003", category: "type2_pattern",
    assessment: { demographics: { age: 60, gender: "male", bmi: 30.0 }, symptoms: ["Frequent Urination", "Slow Healing", "Tingling Hands Feet"], risk_factors: ["Obesity", "Hypertension", "High Cholesterol", "Family History"], lab_results: { fasting_glucose: 155, hba1c: 7.8 } },
    matched_rules: [{ rule_id: "T2D-03", rule_name: "T2D with Complications", certainty_factor: 0.90 }],
    expert_result: { condition: "Pattern Consistent with Type 2 Diabetes", condition_key: "type2_pattern_likely", risk_level: "high", certainty_factor: 0.90, suspected_type: { type: "Type 2", certainty: 0.92 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "155" }, { type: "lab_result", label: "HbA1c", value: "7.8" }], supporting_evidence: [{ type: "risk_factor", label: "Metabolic syndrome cluster" }], conflicting_evidence: [], explanation: "Type 2 with metabolic syndrome and possible early complications." },
    expected_explanation: { what_it_means: "Type 2 diabetes with metabolic syndrome and possible nerve involvement.", why_generated: "Classic Type 2 profile with metabolic risk cluster.", what_it_does_not_mean: ["Complications can be slowed with good management."] },
    next_steps: [{ priority: "urgent", action: "Comprehensive diabetes care" }],
  },
  {
    id: "SYNTH-T2-004", category: "type2_pattern",
    assessment: { demographics: { age: 48, gender: "female", bmi: 33.0 }, symptoms: ["Excessive Thirst", "Fatigue"], risk_factors: ["Obesity", "Family History", "Gestational History"], lab_results: { fasting_glucose: 130, hba1c: 6.7 } },
    matched_rules: [{ rule_id: "T2D-04", rule_name: "Post-GDM Type 2", certainty_factor: 0.82 }],
    expert_result: { condition: "Pattern Consistent with Type 2 Diabetes", condition_key: "type2_pattern_likely", risk_level: "high", certainty_factor: 0.82, suspected_type: { type: "Type 2", certainty: 0.80 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "130" }, { type: "lab_result", label: "HbA1c", value: "6.7" }], supporting_evidence: [{ type: "risk_factor", label: "Gestational history" }], conflicting_evidence: [], explanation: "Previous gestational diabetes has progressed to Type 2 — a known risk trajectory." },
    expected_explanation: { what_it_means: "Diabetes has developed after a previous gestational diabetes history — this is a known pattern.", why_generated: "Diabetes labs in woman with prior GDM.", what_it_does_not_mean: ["Early treatment in post-GDM Type 2 is especially effective."] },
    next_steps: [{ priority: "urgent", action: "Start diabetes treatment" }],
  },
  {
    id: "SYNTH-T2-005", category: "type2_pattern",
    assessment: { demographics: { age: 65, gender: "male", bmi: 29.0 }, symptoms: ["Frequent Urination", "Blurred Vision", "Fatigue"], risk_factors: ["Family History", "Hypertension"], lab_results: { fasting_glucose: 145, hba1c: 7.2 } },
    matched_rules: [{ rule_id: "T2D-05", rule_name: "Elderly T2D", certainty_factor: 0.86 }],
    expert_result: { condition: "Pattern Consistent with Type 2 Diabetes", condition_key: "type2_pattern_likely", risk_level: "high", certainty_factor: 0.86, suspected_type: { type: "Type 2", certainty: 0.85 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "145" }, { type: "lab_result", label: "HbA1c", value: "7.2" }], supporting_evidence: [{ type: "risk_factor", label: "Hypertension" }], conflicting_evidence: [], explanation: "Typical Type 2 in elderly male with comorbidities." },
    expected_explanation: { what_it_means: "Type 2 diabetes in elderly patient with hypertension — comprehensive management needed.", why_generated: "Classic Type 2 in older adult.", what_it_does_not_mean: ["Age-appropriate management targets may differ from younger patients."] },
    next_steps: [{ priority: "urgent", action: "Diabetes and hypertension management" }],
  },
  {
    id: "SYNTH-T2-006", category: "type2_pattern",
    assessment: { demographics: { age: 45, gender: "male", bmi: 35.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Excessive Hunger"], risk_factors: ["Obesity", "Sedentary Lifestyle", "Smoking"], lab_results: { fasting_glucose: 150, hba1c: 7.5 } },
    matched_rules: [{ rule_id: "T2D-06", rule_name: "T2D Metabolic", certainty_factor: 0.90 }],
    expert_result: { condition: "Pattern Consistent with Type 2 Diabetes", condition_key: "type2_pattern_likely", risk_level: "high", certainty_factor: 0.90, suspected_type: { type: "Type 2", certainty: 0.90 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "150" }, { type: "lab_result", label: "HbA1c", value: "7.5" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }, { type: "risk_factor", label: "Smoking" }], conflicting_evidence: [], explanation: "Severe metabolic risk profile with confirmed diabetes." },
    expected_explanation: { what_it_means: "Type 2 diabetes with severe metabolic risk factors. Urgent lifestyle and medical intervention.", why_generated: "High glucose with classic triad and metabolic risk factors.", what_it_does_not_mean: ["Stopping smoking and weight loss can dramatically improve outcomes."] },
    next_steps: [{ priority: "urgent", action: "Diabetes treatment + smoking cessation" }],
  },
  {
    id: "SYNTH-T2-007", category: "type2_pattern",
    assessment: { demographics: { age: 52, gender: "female", bmi: 31.0 }, symptoms: ["Fatigue", "Slow Healing", "Frequent Infections"], risk_factors: ["Obesity", "Family History", "Ethnicity High Risk"], lab_results: { fasting_glucose: 132, hba1c: 6.8 } },
    matched_rules: [{ rule_id: "T2D-07", rule_name: "T2D Ethnic Risk", certainty_factor: 0.84 }],
    expert_result: { condition: "Pattern Consistent with Type 2 Diabetes", condition_key: "type2_pattern_likely", risk_level: "high", certainty_factor: 0.84, suspected_type: { type: "Type 2", certainty: 0.82 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "132" }, { type: "lab_result", label: "HbA1c", value: "6.8" }], supporting_evidence: [{ type: "risk_factor", label: "High-risk ethnicity" }], conflicting_evidence: [], explanation: "Type 2 diabetes with ethnic predisposition and immune-related symptoms." },
    expected_explanation: { what_it_means: "Diabetes confirmed with ethnic risk factor and complications signs.", why_generated: "Diabetes labs with ethnic risk and complication symptoms.", what_it_does_not_mean: ["Ethnicity increases risk but treatment is equally effective."] },
    next_steps: [{ priority: "urgent", action: "Start diabetes treatment" }],
  },
  {
    id: "SYNTH-T2-008", category: "type2_pattern",
    assessment: { demographics: { age: 58, gender: "male", bmi: 28.0 }, symptoms: ["Frequent Urination", "Excessive Thirst"], risk_factors: ["Family History", "Sedentary Lifestyle"], lab_results: { fasting_glucose: 128, hba1c: 6.6 } },
    matched_rules: [{ rule_id: "T2D-08", rule_name: "T2D Borderline", certainty_factor: 0.80 }],
    expert_result: { condition: "Likely Diabetes Mellitus", condition_key: "diabetes_likely", risk_level: "high", certainty_factor: 0.80, suspected_type: { type: "Type 2", certainty: 0.78 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "128" }, { type: "lab_result", label: "HbA1c", value: "6.6" }], supporting_evidence: [{ type: "risk_factor", label: "Family history" }], conflicting_evidence: [], explanation: "Just-over-threshold diabetes with typical Type 2 risk profile." },
    expected_explanation: { what_it_means: "Labs just exceed diabetes thresholds with classic Type 2 features.", why_generated: "FPG 128, HbA1c 6.6% — both above diabetic cutoffs.", what_it_does_not_mean: ["Early detection means best chance for effective management."] },
    next_steps: [{ priority: "urgent", action: "Confirm and start management" }],
  },
  {
    id: "SYNTH-T2-009", category: "type2_pattern",
    assessment: { demographics: { age: 70, gender: "female", bmi: 27.5 }, symptoms: ["Blurred Vision", "Fatigue"], risk_factors: ["Hypertension", "High Cholesterol"], lab_results: { fasting_glucose: 138, hba1c: 7.1 } },
    matched_rules: [{ rule_id: "T2D-09", rule_name: "Elderly T2D", certainty_factor: 0.85 }],
    expert_result: { condition: "Pattern Consistent with Type 2 Diabetes", condition_key: "type2_pattern_likely", risk_level: "high", certainty_factor: 0.85, suspected_type: { type: "Type 2", certainty: 0.83 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "138" }, { type: "lab_result", label: "HbA1c", value: "7.1" }], supporting_evidence: [{ type: "risk_factor", label: "Hypertension" }], conflicting_evidence: [], explanation: "Elderly female with confirmed diabetes and cardiovascular risk." },
    expected_explanation: { what_it_means: "Type 2 diabetes in elderly patient with eye symptoms and cardiovascular risk.", why_generated: "Diabetes labs with age-related comorbidities.", what_it_does_not_mean: ["Age-appropriate targets and gentle management approach."] },
    next_steps: [{ priority: "urgent", action: "Comprehensive geriatric diabetes management" }],
  },
  {
    id: "SYNTH-T2-010", category: "type2_pattern",
    assessment: { demographics: { age: 42, gender: "male", bmi: 36.0 }, symptoms: ["Excessive Thirst", "Frequent Urination", "Acanthosis Nigricans"], risk_factors: ["Obesity", "Family History", "Sedentary Lifestyle"], lab_results: { fasting_glucose: 160, hba1c: 7.8 } },
    matched_rules: [{ rule_id: "T2D-10", rule_name: "Severe T2D", certainty_factor: 0.92 }],
    expert_result: { condition: "Pattern Consistent with Type 2 Diabetes", condition_key: "type2_pattern_likely", risk_level: "high", certainty_factor: 0.92, suspected_type: { type: "Type 2", certainty: 0.92 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "160" }, { type: "lab_result", label: "HbA1c", value: "7.8" }], supporting_evidence: [{ type: "risk_factor", label: "Severe obesity (BMI 36)" }], conflicting_evidence: [], explanation: "Severe Type 2 with extreme insulin resistance markers." },
    expected_explanation: { what_it_means: "Severe Type 2 diabetes with strong insulin resistance. Aggressive management needed.", why_generated: "High glucose with severe obesity and acanthosis nigricans.", what_it_does_not_mean: ["Weight loss can dramatically improve insulin sensitivity."] },
    next_steps: [{ priority: "urgent", action: "Aggressive diabetes management + weight loss program" }],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTATIONAL DIABETES PATTERNS (76-85)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "SYNTH-GDM-001", category: "gestational",
    assessment: { demographics: { age: 32, gender: "female", bmi: 30.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Fatigue"], risk_factors: ["Obesity", "Family History"], lab_results: { "2h_ogtt_75g": 165 }, additional: { currently_pregnant: true } },
    matched_rules: [{ rule_id: "GDM-01", rule_name: "Gestational Diabetes OGTT", certainty_factor: 0.85 }],
    expert_result: { condition: "Possible Gestational Diabetes", condition_key: "gestational_diabetes_likely", risk_level: "high", certainty_factor: 0.85, suspected_type: { type: "Gestational", certainty: 0.85 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "2h OGTT", value: "165", significance: "Impaired glucose tolerance" }], supporting_evidence: [{ type: "risk_factor", label: "Pregnancy" }, { type: "risk_factor", label: "Obesity" }], conflicting_evidence: [], explanation: "Impaired OGTT during pregnancy with risk factors — gestational diabetes pattern." },
    expected_explanation: { what_it_means: "Your glucose tolerance test during pregnancy suggests gestational diabetes. This can be managed.", why_generated: "Elevated OGTT in pregnant patient with risk factors.", what_it_does_not_mean: ["GDM usually resolves after delivery but increases future Type 2 risk."] },
    next_steps: [{ priority: "urgent", action: "Obstetric team management" }, { priority: "high", action: "Dietary counseling" }],
  },
  {
    id: "SYNTH-GDM-002", category: "gestational",
    assessment: { demographics: { age: 28, gender: "female", bmi: 27.0 }, symptoms: ["Fatigue", "Excessive Thirst"], risk_factors: ["Gestational History"], lab_results: { fasting_glucose: 105 }, additional: { currently_pregnant: true } },
    matched_rules: [{ rule_id: "GDM-02", rule_name: "GDM Previous History", certainty_factor: 0.72 }],
    expert_result: { condition: "Possible Gestational Diabetes", condition_key: "gestational_diabetes_likely", risk_level: "high", certainty_factor: 0.72, suspected_type: { type: "Gestational", certainty: 0.75 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "105", significance: "Borderline" }], supporting_evidence: [{ type: "risk_factor", label: "Previous GDM" }], conflicting_evidence: [], explanation: "Pregnant with previous GDM and borderline glucose — high recurrence risk." },
    expected_explanation: { what_it_means: "With a history of GDM and current borderline glucose, close monitoring during this pregnancy is essential.", why_generated: "Previous GDM history with borderline FPG in current pregnancy.", what_it_does_not_mean: ["Monitoring does not mean GDM has recurred — the OGTT at 24-28 weeks will confirm."] },
    next_steps: [{ priority: "high", action: "Early OGTT screening" }, { priority: "high", action: "Dietary management" }],
  },
  {
    id: "SYNTH-GDM-003", category: "gestational",
    assessment: { demographics: { age: 35, gender: "female", bmi: 32.0 }, symptoms: ["Frequent Urination", "Excessive Thirst"], risk_factors: ["Obesity", "Family History", "Ethnicity High Risk"], lab_results: { "2h_ogtt_75g": 180 }, additional: { currently_pregnant: true } },
    matched_rules: [{ rule_id: "GDM-03", rule_name: "GDM High Risk", certainty_factor: 0.88 }],
    expert_result: { condition: "Possible Gestational Diabetes", condition_key: "gestational_diabetes_likely", risk_level: "high", certainty_factor: 0.88, suspected_type: { type: "Gestational", certainty: 0.88 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "2h OGTT", value: "180", significance: "Impaired" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }, { type: "risk_factor", label: "Ethnic risk" }], conflicting_evidence: [], explanation: "OGTT significantly elevated in pregnant patient with multiple risk factors." },
    expected_explanation: { what_it_means: "Strong gestational diabetes pattern. Active management will protect you and your baby.", why_generated: "Elevated OGTT with obesity and ethnic risk during pregnancy.", what_it_does_not_mean: ["GDM is very manageable with proper obstetric care."] },
    next_steps: [{ priority: "urgent", action: "Gestational diabetes management plan" }],
  },
  {
    id: "SYNTH-GDM-004", category: "gestational",
    assessment: { demographics: { age: 30, gender: "female", bmi: 25.0 }, symptoms: [], risk_factors: [], lab_results: { "2h_ogtt_75g": 148 }, additional: { currently_pregnant: true } },
    matched_rules: [{ rule_id: "GDM-04", rule_name: "GDM Borderline", certainty_factor: 0.58 }],
    expert_result: { condition: "Possible Gestational Diabetes", condition_key: "gestational_diabetes_likely", risk_level: "moderate", certainty_factor: 0.58, suspected_type: { type: "Gestational", certainty: 0.60 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "2h OGTT", value: "148", significance: "Borderline impaired" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Borderline OGTT in pregnancy — monitoring recommended." },
    expected_explanation: { what_it_means: "Your OGTT is slightly above normal during pregnancy. This may or may not be gestational diabetes.", why_generated: "Borderline OGTT at 148 during pregnancy.", what_it_does_not_mean: ["Borderline results may resolve or may need closer monitoring."] },
    next_steps: [{ priority: "high", action: "Repeat OGTT in 2-4 weeks" }, { priority: "medium", action: "Dietary management" }],
  },
  {
    id: "SYNTH-GDM-005", category: "gestational",
    assessment: { demographics: { age: 38, gender: "female", bmi: 28.0 }, symptoms: ["Frequent Urination", "Fatigue"], risk_factors: ["Family History"], lab_results: { fasting_glucose: 110, "2h_ogtt_75g": 170 }, additional: { currently_pregnant: true } },
    matched_rules: [{ rule_id: "GDM-05", rule_name: "GDM Dual Confirmed", certainty_factor: 0.82 }],
    expert_result: { condition: "Possible Gestational Diabetes", condition_key: "gestational_diabetes_likely", risk_level: "high", certainty_factor: 0.82, suspected_type: { type: "Gestational", certainty: 0.82 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "110" }, { type: "lab_result", label: "2h OGTT", value: "170" }], supporting_evidence: [{ type: "risk_factor", label: "Family history" }], conflicting_evidence: [], explanation: "Both FPG and OGTT elevated during pregnancy — GDM likely." },
    expected_explanation: { what_it_means: "Both fasting and post-load glucose are elevated during pregnancy — gestational diabetes confirmed.", why_generated: "Dual glucose elevation during pregnancy.", what_it_does_not_mean: ["With proper management, GDM outcomes are excellent."] },
    next_steps: [{ priority: "urgent", action: "Begin GDM management" }],
  },
  {
    id: "SYNTH-GDM-006", category: "gestational",
    assessment: { demographics: { age: 25, gender: "female", bmi: 26.0 }, symptoms: ["Excessive Thirst"], risk_factors: [], lab_results: { "2h_ogtt_75g": 155 }, additional: { currently_pregnant: true } },
    matched_rules: [{ rule_id: "GDM-06", rule_name: "GDM Moderate", certainty_factor: 0.68 }],
    expert_result: { condition: "Possible Gestational Diabetes", condition_key: "gestational_diabetes_likely", risk_level: "moderate", certainty_factor: 0.68, suspected_type: { type: "Gestational", certainty: 0.65 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "2h OGTT", value: "155" }], supporting_evidence: [], conflicting_evidence: [], explanation: "OGTT in impaired range during pregnancy." },
    expected_explanation: { what_it_means: "OGTT suggests impaired glucose tolerance during pregnancy.", why_generated: "OGTT 155 during pregnancy.", what_it_does_not_mean: ["Many young women with GDM have normal glucose after delivery."] },
    next_steps: [{ priority: "high", action: "Dietary management and monitoring" }],
  },
  {
    id: "SYNTH-GDM-007", category: "gestational",
    assessment: { demographics: { age: 40, gender: "female", bmi: 35.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Fatigue"], risk_factors: ["Obesity", "Gestational History", "Family History"], lab_results: { fasting_glucose: 118, "2h_ogtt_75g": 195 }, additional: { currently_pregnant: true } },
    matched_rules: [{ rule_id: "GDM-07", rule_name: "GDM Severe", certainty_factor: 0.92 }],
    expert_result: { condition: "Possible Gestational Diabetes", condition_key: "gestational_diabetes_likely", risk_level: "high", certainty_factor: 0.92, suspected_type: { type: "Gestational", certainty: 0.90 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "118" }, { type: "lab_result", label: "2h OGTT", value: "195" }], supporting_evidence: [{ type: "risk_factor", label: "Previous GDM" }, { type: "risk_factor", label: "Severe obesity" }], conflicting_evidence: [], explanation: "Severe GDM pattern with high-risk profile. May need insulin." },
    expected_explanation: { what_it_means: "Severe gestational diabetes pattern. Insulin therapy may be needed alongside dietary management.", why_generated: "Very elevated glucose during pregnancy with extreme risk factors.", what_it_does_not_mean: ["Insulin during pregnancy is safe and effective."] },
    next_steps: [{ priority: "urgent", action: "Urgent obstetric diabetes management" }],
  },
  {
    id: "SYNTH-GDM-008", category: "gestational",
    assessment: { demographics: { age: 33, gender: "female", bmi: 24.0 }, symptoms: [], risk_factors: [], lab_results: { "2h_ogtt_75g": 142 }, additional: { currently_pregnant: true } },
    matched_rules: [{ rule_id: "GDM-08", rule_name: "GDM Minimal", certainty_factor: 0.50 }],
    expert_result: { condition: "Possible Gestational Diabetes", condition_key: "gestational_diabetes_likely", risk_level: "moderate", certainty_factor: 0.50, suspected_type: { type: "Gestational", certainty: 0.52 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "2h OGTT", value: "142", significance: "Minimally impaired" }], supporting_evidence: [], conflicting_evidence: [], explanation: "OGTT barely above the 140 threshold — close monitoring needed." },
    expected_explanation: { what_it_means: "Your OGTT is just above the normal cutoff. Dietary management and re-testing recommended.", why_generated: "OGTT 142 (threshold is 140) during pregnancy.", what_it_does_not_mean: ["Borderline results often respond well to dietary changes alone."] },
    next_steps: [{ priority: "medium", action: "Dietary counseling" }, { priority: "medium", action: "Re-test in 2-4 weeks" }],
  },
  {
    id: "SYNTH-GDM-009", category: "gestational",
    assessment: { demographics: { age: 29, gender: "female", bmi: 31.0 }, symptoms: ["Fatigue"], risk_factors: ["Obesity"], lab_results: { one_hour_ogtt_75g: 185 }, additional: { currently_pregnant: true } },
    matched_rules: [{ rule_id: "GDM-09", rule_name: "GDM 1h Screen", certainty_factor: 0.72 }],
    expert_result: { condition: "Possible Gestational Diabetes", condition_key: "gestational_diabetes_likely", risk_level: "high", certainty_factor: 0.72, suspected_type: { type: "Gestational", certainty: 0.70 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "1h OGTT", value: "185", significance: "Elevated" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }], conflicting_evidence: [], explanation: "Elevated 1-hour glucose screening test during pregnancy." },
    expected_explanation: { what_it_means: "Your 1-hour glucose screening is elevated. A full 2-hour OGTT is needed to confirm.", why_generated: "1h OGTT 185 during pregnancy with obesity.", what_it_does_not_mean: ["Elevated 1-hour screen does not confirm GDM — confirmatory testing needed."] },
    next_steps: [{ priority: "high", action: "Full 2-hour OGTT" }],
  },
  {
    id: "SYNTH-GDM-010", category: "gestational",
    assessment: { demographics: { age: 36, gender: "female", bmi: 29.0 }, symptoms: ["Frequent Urination", "Excessive Thirst"], risk_factors: ["Family History", "Ethnicity High Risk"], lab_results: { fasting_glucose: 100, "2h_ogtt_75g": 160 }, additional: { currently_pregnant: true } },
    matched_rules: [{ rule_id: "GDM-10", rule_name: "GDM Ethnic Risk", certainty_factor: 0.78 }],
    expert_result: { condition: "Possible Gestational Diabetes", condition_key: "gestational_diabetes_likely", risk_level: "high", certainty_factor: 0.78, suspected_type: { type: "Gestational", certainty: 0.76 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "2h OGTT", value: "160" }], supporting_evidence: [{ type: "risk_factor", label: "Ethnic risk" }, { type: "risk_factor", label: "Family history" }], conflicting_evidence: [], explanation: "GDM with ethnic predisposition and family history." },
    expected_explanation: { what_it_means: "Gestational diabetes pattern confirmed with ethnic and family risk factors.", why_generated: "Elevated OGTT with ethnic and family risk during pregnancy.", what_it_does_not_mean: ["Ethnicity and family history increase risk but management is equally effective."] },
    next_steps: [{ priority: "urgent", action: "Gestational diabetes management" }],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MULTIPLE POSSIBLE MATCHES (86-90)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "SYNTH-MM-001", category: "multiple_matches",
    assessment: { demographics: { age: 35, gender: "male", bmi: 23.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Weight Loss", "Fatigue"], risk_factors: ["Family History"], lab_results: { fasting_glucose: 165, hba1c: 7.5 } },
    matched_rules: [{ rule_id: "DM-CONF-12", rule_name: "Diabetes Confirmed", certainty_factor: 0.88 }, { rule_id: "T1D-11", rule_name: "Type 1 Pattern", certainty_factor: 0.62 }, { rule_id: "T2D-11", rule_name: "Type 2 Pattern", certainty_factor: 0.55 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.88, suspected_type: { type: "Mixed features", certainty: 0.70 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "165" }, { type: "lab_result", label: "HbA1c", value: "7.5" }], supporting_evidence: [{ type: "risk_factor", label: "Family history" }], conflicting_evidence: [{ type: "type_ambiguity", label: "Both Type 1 and Type 2 patterns match", detail: "Age and weight loss suggest Type 1, but family history and age could suggest Type 2." }], explanation: "Diabetes confirmed but type is ambiguous — autoantibody testing needed." },
    expected_explanation: { what_it_means: "Diabetes is confirmed but the type is unclear. Both Type 1 and Type 2 patterns partially match.", why_generated: "Age (35) is borderline — could be late-onset Type 1 or early Type 2.", what_it_does_not_mean: ["The initial treatment is similar. Autoantibody testing will clarify the type."] },
    next_steps: [{ priority: "urgent", action: "Autoantibody testing" }, { priority: "urgent", action: "Start treatment (works for both types)" }],
  },
  {
    id: "SYNTH-MM-002", category: "multiple_matches",
    assessment: { demographics: { age: 50, gender: "female", bmi: 28.0 }, symptoms: ["Fatigue", "Tingling Hands Feet", "Slow Healing"], risk_factors: ["Hypertension", "High Cholesterol", "Obesity"], lab_results: { fasting_glucose: 112, hba1c: 6.0 } },
    matched_rules: [{ rule_id: "PRE-DM-11", rule_name: "Prediabetes", certainty_factor: 0.62 }, { rule_id: "MET-SYN-02", rule_name: "Metabolic Syndrome", certainty_factor: 0.58 }, { rule_id: "NEURO-02", rule_name: "Neuropathy Screen", certainty_factor: 0.45 }],
    expert_result: { condition: "Prediabetes (Impaired Glucose Regulation)", condition_key: "prediabetes_possible", risk_level: "moderate", certainty_factor: 0.62 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "112" }, { type: "lab_result", label: "HbA1c", value: "6.0" }], supporting_evidence: [{ type: "risk_factor", label: "Metabolic syndrome triad" }], conflicting_evidence: [], explanation: "Multiple overlapping patterns: prediabetes + metabolic syndrome + possible neuropathy." },
    expected_explanation: { what_it_means: "Multiple interrelated conditions detected: prediabetes, metabolic syndrome, and possible early nerve changes.", why_generated: "Overlapping prediabetes, metabolic syndrome, and neuropathy patterns.", what_it_does_not_mean: ["These conditions are all related to insulin resistance and respond to the same lifestyle changes."] },
    next_steps: [{ priority: "high", action: "Comprehensive metabolic evaluation" }, { priority: "high", action: "Neuropathy testing" }],
  },
  {
    id: "SYNTH-MM-003", category: "multiple_matches",
    assessment: { demographics: { age: 30, gender: "female", bmi: 32.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Fatigue"], risk_factors: ["Obesity", "Family History", "PCOS History"], lab_results: { fasting_glucose: 130, hba1c: 6.7 }, additional: { currently_pregnant: true } },
    matched_rules: [{ rule_id: "GDM-11", rule_name: "Gestational Pattern", certainty_factor: 0.78 }, { rule_id: "T2D-12", rule_name: "Pre-existing T2D", certainty_factor: 0.65 }],
    expert_result: { condition: "Possible Gestational Diabetes", condition_key: "gestational_diabetes_likely", risk_level: "high", certainty_factor: 0.78, suspected_type: { type: "Gestational", certainty: 0.78 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "130" }, { type: "lab_result", label: "HbA1c", value: "6.7" }], supporting_evidence: [{ type: "risk_factor", label: "PCOS history" }], conflicting_evidence: [{ type: "type_ambiguity", label: "Could be pre-existing Type 2 or new GDM", detail: "High glucose during pregnancy could be new GDM or previously undiagnosed Type 2." }], explanation: "Pregnancy with diabetes-level glucose — could be GDM or undiagnosed pre-existing Type 2." },
    expected_explanation: { what_it_means: "Your glucose levels during pregnancy are in the diabetes range. This could be gestational diabetes or previously undiagnosed Type 2.", why_generated: "Diabetes-level glucose during pregnancy with PCOS and obesity.", what_it_does_not_mean: ["Post-delivery testing will clarify whether this is gestational or pre-existing diabetes."] },
    next_steps: [{ priority: "urgent", action: "Obstetric diabetes management" }, { priority: "high", action: "Post-delivery glucose testing" }],
  },
  {
    id: "SYNTH-MM-004", category: "multiple_matches",
    assessment: { demographics: { age: 25, gender: "male", bmi: 22.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Weight Loss", "Fatigue"], risk_factors: ["Family History"], lab_results: { fasting_glucose: 180 } },
    matched_rules: [{ rule_id: "T1D-12", rule_name: "Type 1 Pattern", certainty_factor: 0.75 }, { rule_id: "DM-CONF-13", rule_name: "Diabetes Confirmed", certainty_factor: 0.85 }],
    expert_result: { condition: "Diabetes Mellitus (Confirmed)", condition_key: "diabetes_confirmed", risk_level: "high", certainty_factor: 0.85, suspected_type: { type: "Type 1", certainty: 0.75 } },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "180" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Young lean male with rapid-onset diabetes — most likely Type 1 but LADA possible." },
    expected_explanation: { what_it_means: "Diabetes confirmed in a young, lean male. Pattern most consistent with Type 1.", why_generated: "Very high FPG in lean young adult with rapid symptoms.", what_it_does_not_mean: ["Autoantibody testing will confirm. Treatment starts the same way."] },
    next_steps: [{ priority: "urgent", action: "Urgent specialist referral and autoantibody testing" }],
  },
  {
    id: "SYNTH-MM-005", category: "multiple_matches",
    assessment: { demographics: { age: 45, gender: "female", bmi: 27.0 }, symptoms: ["Fatigue", "Blurred Vision", "Frequent Urination"], risk_factors: ["Family History", "Hypertension"], lab_results: { fasting_glucose: 125, hba1c: 6.4 } },
    matched_rules: [{ rule_id: "PRE-DM-12", rule_name: "Prediabetes Borderline", certainty_factor: 0.58 }, { rule_id: "DM-LIKELY-02", rule_name: "Diabetes Borderline", certainty_factor: 0.52 }],
    expert_result: { condition: "Likely Diabetes Mellitus", condition_key: "diabetes_likely", risk_level: "high", certainty_factor: 0.58 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "125" }, { type: "lab_result", label: "HbA1c", value: "6.4" }], supporting_evidence: [{ type: "risk_factor", label: "Family history" }], conflicting_evidence: [{ type: "diagnostic_boundary", label: "At the prediabetes/diabetes boundary", detail: "FPG 125 is at the boundary (126 = diabetes). HbA1c 6.4 is upper prediabetes (6.5 = diabetes)." }], explanation: "Both values at the exact boundary between prediabetes and diabetes — repeat testing essential." },
    expected_explanation: { what_it_means: "Your values are right at the boundary between prediabetes and diabetes. A repeat test will clarify.", why_generated: "FPG 125 and HbA1c 6.4% — both at the diagnostic boundary.", what_it_does_not_mean: ["Being at the boundary means the distinction is very fine. Treatment approach is similar."] },
    next_steps: [{ priority: "high", action: "Repeat fasting glucose and HbA1c in 2-4 weeks" }, { priority: "high", action: "Start preventive lifestyle changes now" }],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WEAK EVIDENCE (91-95)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "SYNTH-WE-001", category: "weak_evidence",
    assessment: { demographics: { age: 40, gender: "male", bmi: 25.0 }, symptoms: ["Fatigue"], risk_factors: [], lab_results: {} },
    matched_rules: [],
    expert_result: { condition: "Routine Screening Recommended", condition_key: "demographic_screening", risk_level: "low", certainty_factor: 0.12 },
    expected_reasoning: { primary_evidence: [], supporting_evidence: [], conflicting_evidence: [], missing_evidence: [{ type: "missing_labs" }], explanation: "Single non-specific symptom (fatigue) with no labs or risk factors. Insufficient for diabetes assessment." },
    expected_explanation: { what_it_means: "Fatigue alone is very non-specific. Without blood tests, we cannot assess diabetes risk.", why_generated: "Insufficient evidence.", what_it_does_not_mean: ["Fatigue usually has non-diabetic causes."] },
    next_steps: [{ priority: "medium", action: "Basic blood work if fatigue persists" }],
  },
  {
    id: "SYNTH-WE-002", category: "weak_evidence",
    assessment: { demographics: { age: 55, gender: "female", bmi: 24.0 }, symptoms: ["Dizziness", "Sweating"], risk_factors: [], lab_results: {} },
    matched_rules: [],
    expert_result: { condition: "Routine Screening Recommended", condition_key: "demographic_screening", risk_level: "low", certainty_factor: 0.15 },
    expected_reasoning: { primary_evidence: [], supporting_evidence: [], conflicting_evidence: [], missing_evidence: [{ type: "missing_labs" }], explanation: "Dizziness and sweating could indicate many conditions. Labs needed." },
    expected_explanation: { what_it_means: "These symptoms are non-specific for diabetes without blood tests.", why_generated: "Non-specific symptoms without labs.", what_it_does_not_mean: ["Could indicate blood pressure changes, inner ear issues, or anxiety."] },
    next_steps: [{ priority: "medium", action: "Blood glucose test" }, { priority: "routine", action: "Investigate other causes" }],
  },
  {
    id: "SYNTH-WE-003", category: "weak_evidence",
    assessment: { demographics: { age: 30, gender: "male", bmi: 22.0 }, symptoms: [], risk_factors: ["Family History"], lab_results: {} },
    matched_rules: [{ rule_id: "DEMO-SCREEN-04", rule_name: "Family History Screen", certainty_factor: 0.10 }],
    expert_result: { condition: "Routine Screening Recommended", condition_key: "demographic_screening", risk_level: "low", certainty_factor: 0.10 },
    expected_reasoning: { primary_evidence: [], supporting_evidence: [{ type: "risk_factor", label: "Family history" }], conflicting_evidence: [], missing_evidence: [{ type: "missing_labs" }], explanation: "Family history alone provides very weak evidence. Screening recommended but not urgent." },
    expected_explanation: { what_it_means: "Family history means screening is wise, but without symptoms or labs, risk is very low at this time.", why_generated: "Single risk factor without supporting evidence.", what_it_does_not_mean: ["Most people with family history never develop diabetes."] },
    next_steps: [{ priority: "routine", action: "Periodic screening (every 3 years)" }],
  },
  {
    id: "SYNTH-WE-004", category: "weak_evidence",
    assessment: { demographics: { age: 45, gender: "female", bmi: 26.0 }, symptoms: ["Frequent Urination"], risk_factors: [], lab_results: {} },
    matched_rules: [],
    expert_result: { condition: "Possible Early Signs", condition_key: "symptom_only_screening", risk_level: "low", certainty_factor: 0.25 },
    expected_reasoning: { primary_evidence: [{ type: "symptom", label: "Frequent urination" }], supporting_evidence: [], conflicting_evidence: [], missing_evidence: [{ type: "missing_labs" }], explanation: "Single cardinal symptom without labs. Many non-diabetic causes exist." },
    expected_explanation: { what_it_means: "Frequent urination alone is non-specific. A blood test would determine if it's related to blood sugar.", why_generated: "Single cardinal symptom without supporting evidence.", what_it_does_not_mean: ["Most cases of frequent urination are not caused by diabetes."] },
    next_steps: [{ priority: "high", action: "Get fasting glucose test" }],
  },
  {
    id: "SYNTH-WE-005", category: "weak_evidence",
    assessment: { demographics: { age: 50, gender: "male", bmi: 27.0 }, symptoms: [], risk_factors: ["Sedentary Lifestyle", "Smoking"], lab_results: {} },
    matched_rules: [{ rule_id: "RISK-SCREEN-01", rule_name: "Lifestyle Risk", certainty_factor: 0.15 }],
    expert_result: { condition: "Elevated Type 2 Diabetes Risk", condition_key: "type2_risk_increased", risk_level: "low", certainty_factor: 0.15 },
    expected_reasoning: { primary_evidence: [], supporting_evidence: [{ type: "risk_factor", label: "Sedentary lifestyle" }, { type: "risk_factor", label: "Smoking" }], conflicting_evidence: [], missing_evidence: [{ type: "missing_labs" }], explanation: "Lifestyle risk factors without symptoms or labs. Risk is theoretical at this point." },
    expected_explanation: { what_it_means: "Your lifestyle puts you at somewhat elevated risk but without blood tests, we can't assess current status.", why_generated: "Two modifiable risk factors without other evidence.", what_it_does_not_mean: ["Having risk factors does not mean you have diabetes."] },
    next_steps: [{ priority: "medium", action: "Improve lifestyle (exercise, stop smoking)" }, { priority: "medium", action: "Get baseline blood tests" }],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFLICTING EVIDENCE (96-98)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "SYNTH-CE-001", category: "conflicting_evidence",
    assessment: { demographics: { age: 48, gender: "male", bmi: 29.0 }, symptoms: ["Frequent Urination", "Excessive Thirst", "Fatigue"], risk_factors: ["Obesity", "Family History"], lab_results: { fasting_glucose: 90, hba1c: 5.3 } },
    matched_rules: [{ rule_id: "CONFLICT-01", rule_name: "Symptom-Lab Discordance", certainty_factor: 0.35 }],
    expert_result: { condition: "Normal Glucose Regulation — No Diabetes Indication", condition_key: "healthy_normal", risk_level: "low", certainty_factor: 0.50 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "90", significance: "Normal" }, { type: "lab_result", label: "HbA1c", value: "5.3", significance: "Normal" }], supporting_evidence: [], conflicting_evidence: [{ type: "lab_symptom_mismatch", label: "Classic symptoms present but labs are normal", detail: "Patient reports polyuria, polydipsia, and fatigue, but both FPG and HbA1c are well within normal range. Symptoms may have non-diabetic causes." }], explanation: "Strong symptoms with completely normal labs — classic discordance pattern." },
    expected_explanation: { what_it_means: "Your blood tests are normal despite having diabetes-like symptoms. The symptoms likely have another cause.", why_generated: "Normal labs (FPG 90, HbA1c 5.3%) with classic diabetes symptoms.", what_it_does_not_mean: ["Normal labs are reassuring. Consider UTI, fluid intake, stress, or other causes for your symptoms."] },
    next_steps: [{ priority: "medium", action: "Investigate non-diabetic causes of symptoms" }, { priority: "routine", action: "Re-test in 6-12 months if symptoms persist" }],
  },
  {
    id: "SYNTH-CE-002", category: "conflicting_evidence",
    assessment: { demographics: { age: 55, gender: "female", bmi: 28.0 }, symptoms: [], risk_factors: ["Family History"], lab_results: { fasting_glucose: 130, hba1c: 5.6 } },
    matched_rules: [{ rule_id: "CONFLICT-02", rule_name: "Discordant Lab Tests", certainty_factor: 0.50 }],
    expert_result: { condition: "Likely Diabetes Mellitus", condition_key: "diabetes_likely", risk_level: "moderate", certainty_factor: 0.55 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "130", significance: "Diabetic range (≥126)" }, { type: "lab_result", label: "HbA1c", value: "5.6", significance: "Normal (<5.7%)" }], supporting_evidence: [{ type: "risk_factor", label: "Family history" }], conflicting_evidence: [{ type: "discordance", label: "Discordant glycemic tests", detail: "FPG suggests diabetes (130) but HbA1c is normal (5.6%). This can occur when diabetes is very recent or the FPG was a one-time elevation." }], explanation: "Conflicting lab results — FPG in diabetes range but HbA1c normal. Repeat testing critical." },
    expected_explanation: { what_it_means: "Your two blood tests give different results. The fasting glucose is high but HbA1c is normal. This needs clarification.", why_generated: "FPG 130 (diabetes) vs HbA1c 5.6% (normal) — discordant results.", what_it_does_not_mean: ["Discordant results can occur from recent changes, stress, or lab variability. Repeat testing will clarify."] },
    next_steps: [{ priority: "high", action: "Repeat both tests on a separate day" }, { priority: "medium", action: "Consider 2h OGTT for additional data" }],
  },
  {
    id: "SYNTH-CE-003", category: "conflicting_evidence",
    assessment: { demographics: { age: 42, gender: "male", bmi: 31.0 }, symptoms: ["Weight Loss"], risk_factors: ["Obesity"], lab_results: { fasting_glucose: 98, hba1c: 6.6 } },
    matched_rules: [{ rule_id: "CONFLICT-03", rule_name: "FPG-HbA1c Discordance", certainty_factor: 0.55 }],
    expert_result: { condition: "Likely Diabetes Mellitus", condition_key: "diabetes_likely", risk_level: "moderate", certainty_factor: 0.55 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "98", significance: "Normal (<100)" }, { type: "lab_result", label: "HbA1c", value: "6.6", significance: "Diabetic range (≥6.5%)" }], supporting_evidence: [{ type: "risk_factor", label: "Obesity" }], conflicting_evidence: [{ type: "discordance", label: "FPG normal but HbA1c diabetic", detail: "FPG is normal (98) but HbA1c suggests diabetes (6.6%). Possible post-meal glucose spikes not captured by fasting test." }], explanation: "FPG normal but HbA1c in diabetes range — suggests post-meal glucose elevations." },
    expected_explanation: { what_it_means: "Your fasting glucose is normal but your HbA1c (3-month average) is elevated. This suggests your blood sugar may spike after meals.", why_generated: "Normal FPG (98) but diabetic HbA1c (6.6%) — discordant pattern.", what_it_does_not_mean: ["This pattern can occur in early diabetes where fasting glucose hasn't risen yet but post-meal spikes average out to high HbA1c."] },
    next_steps: [{ priority: "high", action: "2-hour oral glucose tolerance test (OGTT)" }, { priority: "high", action: "Clinical consultation" }],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NO SIGNIFICANT MATCH (99-100)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "SYNTH-NS-001", category: "no_significant_match",
    assessment: { demographics: { age: 25, gender: "male", bmi: 22.0 }, symptoms: [], risk_factors: [], lab_results: {} },
    matched_rules: [],
    expert_result: { condition: "Routine Diabetes Screening Recommended", condition_key: "demographic_screening", risk_level: "low", certainty_factor: 0.02 },
    expected_reasoning: { primary_evidence: [], supporting_evidence: [], conflicting_evidence: [], missing_evidence: [{ type: "missing_labs" }, { type: "no_symptoms" }], explanation: "No symptoms, risk factors, or lab data provided. Cannot perform meaningful assessment." },
    expected_explanation: { what_it_means: "Without any clinical data, we cannot assess your diabetes risk. Please provide symptoms, risk factors, or blood test results.", why_generated: "No input data provided.", what_it_does_not_mean: ["Lack of data does not mean you are healthy or unhealthy."] },
    next_steps: [{ priority: "medium", action: "Complete the assessment with your health information" }, { priority: "routine", action: "Consider a basic health checkup" }],
  },
  {
    id: "SYNTH-NS-002", category: "no_significant_match",
    assessment: { demographics: { age: 60, gender: "female", bmi: 22.0 }, symptoms: [], risk_factors: [], lab_results: { fasting_glucose: 80, hba1c: 4.9 } },
    matched_rules: [],
    expert_result: { condition: "Normal Glucose Regulation — No Diabetes Indication", condition_key: "healthy_normal", risk_level: "low", certainty_factor: 0.95 },
    expected_reasoning: { primary_evidence: [{ type: "lab_result", label: "FPG", value: "80", significance: "Well within normal" }, { type: "lab_result", label: "HbA1c", value: "4.9", significance: "Well within normal" }], supporting_evidence: [], conflicting_evidence: [], explanation: "Excellent lab values with no symptoms or risk factors. Very low diabetes risk." },
    expected_explanation: { what_it_means: "Your blood sugar levels are excellent. No diabetes concern at all.", why_generated: "Normal FPG (80) and HbA1c (4.9%) with no risk factors.", what_it_does_not_mean: ["Continue routine health checkups appropriate for your age."] },
    next_steps: [{ priority: "routine", action: "Continue routine age-appropriate screening" }],
  },
]

export default REASONING_TRAINING_DATASET
