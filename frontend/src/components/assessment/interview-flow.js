/**
 * Evidence-interview flow definition for the assessment workspace.
 *
 * The interview replaces the old static "Profile → Symptoms" grid with a
 * doctor-style adaptive question flow: one question at a time, where every
 * next question depends on the evidence collected so far (e.g. pregnancy
 * follow-ups for female patients, T1D/DKA suspicion banners).
 *
 * All answers map onto the SAME form fields the submit payload already uses,
 * so the backend inference pipeline is unchanged.
 */

/* ── Field groups (single source of truth, also used by the payload/summary) ── */
// 5 Cardinal Symptoms (Primary diagnostic path, asked one by one)
export const SYMPTOM_CORE_FIELDS = [
  'excessive_thirst',
  'frequent_urination',
  'excessive_hunger',
  'weight_loss',
  'fatigue',
]

// Secondary & Microvascular Warning Signs (Focused, clinically relevant signs)
export const SYMPTOM_SECONDARY_FIELDS = [
  'blurred_vision',
  'tingling_hands_feet',
  'burning_sensation',
  'slow_healing',
  'frequent_infections',
  'acanthosis_nigricans',
  'itchy_skin',
]

export const SYMPTOM_PROBE_FIELDS = ['bed_wetting']
export const SYMPTOM_OTHER_FIELDS = SYMPTOM_SECONDARY_FIELDS
export const SYMPTOM_ALL_FIELDS = [...SYMPTOM_CORE_FIELDS, ...SYMPTOM_SECONDARY_FIELDS, ...SYMPTOM_PROBE_FIELDS]
export const SAFETY_FIELDS = ['sweating', 'shaking', 'dizziness', 'vomiting', 'abdominal_pain', 'fruity_breath', 'deep_rapid_breathing']
export const RISK_FIELDS = ['family_history', 'obesity', 'hypertension', 'sedentary_lifestyle', 'gestational_history', 'smoking', 'high_cholesterol', 'pcos_history', 'ethnicity_high_risk']
export const METABOLIC_FIELDS = ['high_cholesterol', 'dyslipidemia_low_hdl', 'dyslipidemia_high_tg', 'cardiovascular_disease']
export const OBSTETRIC_FIELDS = ['gestational_history', 'macrosomia_history', 'pcos_history']
export const LIFESTYLE_HABIT_FIELDS = ['smoking', 'alcohol_frequent', 'sleep_apnea_history']

/* i18n group for each boolean field: assessment.fields.<group>.<camelKey> */
export const FIELD_GROUPS = {
  frequent_urination: 'symptoms', excessive_thirst: 'symptoms', weight_loss: 'symptoms',
  fatigue: 'symptoms', blurred_vision: 'symptoms', slow_healing: 'symptoms', nausea: 'symptoms',
  tingling_hands_feet: 'symptoms', frequent_infections: 'symptoms', acanthosis_nigricans: 'symptoms',
  excessive_hunger: 'symptoms', irritability: 'symptoms', recurrent_uti_yeast: 'symptoms', bed_wetting: 'symptoms',
  burning_sensation: 'symptoms', numbness: 'symptoms', itchy_skin: 'symptoms',
  nocturia: 'symptoms', unquenchable_thirst: 'symptoms', severe_fatigue: 'symptoms',
  sweating: 'safetySymptoms', shaking: 'safetySymptoms', dizziness: 'safetySymptoms',
  vomiting: 'safetySymptoms', abdominal_pain: 'safetySymptoms',
  fruity_breath: 'safetySymptoms', deep_rapid_breathing: 'safetySymptoms',
  family_history: 'riskFactors', obesity: 'riskFactors', hypertension: 'riskFactors',
  sedentary_lifestyle: 'riskFactors', gestational_history: 'riskFactors', smoking: 'riskFactors',
  high_cholesterol: 'riskFactors', pcos_history: 'riskFactors', ethnicity_high_risk: 'riskFactors',
  dyslipidemia_low_hdl: 'riskFactors', dyslipidemia_high_tg: 'riskFactors',
  cardiovascular_disease: 'riskFactors', macrosomia_history: 'riskFactors',
  sleep_apnea_history: 'riskFactors', alcohol_frequent: 'riskFactors',
}

/* English fallback labels (used when a translation key is missing) */
export const FIELD_FALLBACKS = {
  frequent_urination: 'Frequent urination (waking 2+ times at night or high volume)',
  excessive_thirst: 'Excessive thirst (unquenchable even after drinking)',
  fatigue: 'Constant tiredness (not relieved by sleep)',
  blurred_vision: 'Blurred vision',
  weight_loss: 'Unexplained weight loss',
  slow_healing: 'Slow wound healing',
  nausea: 'Nausea',
  tingling_hands_feet: 'Tingling / numbness in hands or feet',
  frequent_infections: 'Frequent infections',
  acanthosis_nigricans: 'Dark skin patches',
  excessive_hunger: 'Feeling very hungry (even after meals)',
  irritability: 'Irritability / mood changes',
  recurrent_uti_yeast: 'Recurring UTIs / yeast infections', bed_wetting: 'New bed-wetting (children)',
  burning_sensation: 'Burning sensation in feet or legs', numbness: 'Numbness or loss of feeling',
  itchy_skin: 'Persistent dry or itchy skin',
  nocturia: 'Waking 2+ times at night to urinate',
  unquenchable_thirst: 'Unquenchable thirst (>3L daily)',
  severe_fatigue: 'Severe physical exhaustion (scale ≥7/10)',
  sweating: 'Sweating episodes', shaking: 'Shaking / tremor', dizziness: 'Dizziness',
  vomiting: 'Vomiting', abdominal_pain: 'Stomach pain',
  fruity_breath: 'Fruity / acetone breath', deep_rapid_breathing: 'Deep, rapid breathing',
  family_history: 'Family history of diabetes (parent or sibling)', obesity: 'Obesity / overweight', hypertension: 'High blood pressure (≥130/80 mmHg)',
  sedentary_lifestyle: 'Inactive / sedentary (<150 min/week)', gestational_history: 'Gestational diabetes history', smoking: 'Current tobacco smoker',
  high_cholesterol: 'High cholesterol / lipids', pcos_history: 'PCOS History', ethnicity_high_risk: 'High-risk ethnicity',
  dyslipidemia_low_hdl: 'Low HDL ("good") cholesterol (<35 mg/dL)',
  dyslipidemia_high_tg: 'High triglycerides (≥250 mg/dL)',
  cardiovascular_disease: 'Heart attack, stroke, or artery disease',
  macrosomia_history: 'Delivered baby >9 lbs (4.1 kg)',
  sleep_apnea_history: 'Heavy snoring / sleep apnea',
  alcohol_frequent: 'Frequent alcohol intake (>1-2 drinks/day)',
}

export function camelField(key) {
  return key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
}


/* ── Insight banners: the system "getting suspicious" like a clinician ── */
export const INSIGHT_BANNERS = [
  {
    id: 'triad-classic',
    tone: 'info',
    when: (f) => [f.frequent_urination, f.excessive_thirst, f.excessive_hunger].filter(Boolean).length >= 2,
    titleKey: 'assessment.interview.insightTriadTitle',
    titleFallback: 'The classic diabetes pattern',
    textKey: 'assessment.interview.insightTriadText',
    textFallback: 'Intense thirst, frequent urination and constant hunger together are the classic trio (polydipsia, polyuria, polyphagia) — high blood sugar pulls water out of your body. The next questions help me tell which type fits.',
  },
  {
    id: 'pregnant-noted',
    tone: 'info',
    when: (f) => f.currently_pregnant === true,
    titleKey: 'assessment.interview.insightPregnantTitle',
    titleFallback: 'Pregnancy noted — adjusting what I check',
    textKey: 'assessment.interview.insightPregnantText',
    textFallback: 'Gestational diabetes is screened with stricter thresholds. A couple of pregnancy questions follow, and your labs will be read against pregnancy ranges.',
  },
  {
    id: 't1d-pattern',
    tone: 'warn',
    when: (f) => Boolean(f.weight_loss) && Boolean(f.frequent_urination || f.excessive_thirst),
    titleKey: 'assessment.interview.insightT1dTitle',
    titleFallback: 'This pattern gets my attention',
    textKey: 'assessment.interview.insightT1dText',
    textFallback: 'Weight loss together with intense thirst and frequent urination can point to type 1 diabetes, which can develop quickly. This will be flagged for clinician review.',
  },
  {
    id: 't2-slow',
    tone: 'info',
    when: (f, ctx) => {
      const core = ctx?.fieldGroups?.symptoms_core || SYMPTOM_CORE_FIELDS
      return f.rapid_onset === false && core.some((key) => Boolean(f[key]))
    },
    titleKey: 'assessment.interview.insightT2Title',
    titleFallback: 'Slow build-up — type 2 pattern',
    textKey: 'assessment.interview.insightT2Text',
    textFallback: 'Symptoms that build up over months usually point to type 2 diabetes, where the body still makes insulin but resists it. Signs like dark skin patches, tingling and slow healing matter most here.',
  },
  {
    id: 'child-sudden',
    tone: 'warn',
    when: (f) => f.rapid_onset === true && Number(f.age) > 0 && Number(f.age) < 18,
    titleKey: 'assessment.interview.insightChildTitle',
    titleFallback: 'In children this pattern is urgent',
    textKey: 'assessment.interview.insightChildText',
    textFallback: 'Sudden thirst and urination in a child — especially with new bed-wetting — is a strong type 1 signal. A finger-prick glucose check today is the fastest way to know.',
  },
  {
    /* One emergency-type sign on its own is a pattern to investigate, not a
       verdict — keep asking instead of screaming "emergency". */
    id: 'urgent-check',
    tone: 'warn',
    when: (f) => EMERGENCY_FIELDS.some((key) => f[key] === true) && !hasEmergencySigns(f),
    titleKey: 'assessment.interview.insightCheckTitle',
    titleFallback: 'Sign noted — the assessment keeps going',
    textKey: 'assessment.interview.insightCheckText',
    textFallback: 'Stomach pain, vomiting, fruity breath or deep breathing can have many causes, and one sign on its own is not an emergency. The next questions help me tell whether this fits a pattern that needs urgent care.',
  },
  {
    id: 'dka-urgent',
    tone: 'urgent',
    when: (f) => hasEmergencySigns(f) && Boolean(f.vomiting || f.abdominal_pain),
    titleKey: 'assessment.interview.insightDkaTitle',
    titleFallback: 'Possible emergency — please read',
    textKey: 'assessment.interview.insightDkaText',
    textFallback: 'Vomiting or stomach pain with high blood sugar can signal diabetic ketoacidosis (DKA) — a medical emergency. If you feel very unwell right now, seek urgent care first; this assessment can wait.',
  },
  {
    id: 'ketosis-warning',
    tone: 'urgent',
    when: (f) => Boolean(f.fruity_breath || f.deep_rapid_breathing),
    titleKey: 'assessment.interview.insightKetosisTitle',
    titleFallback: 'Ketone warning signs',
    textKey: 'assessment.interview.insightKetosisText',
    textFallback: 'Fruity breath or deep, rapid breathing can mean ketones are building up — a sign of insulin shortage. Combined with feeling unwell, this needs urgent medical attention.',
  },
  {
    id: 'hypo-pattern',
    tone: 'info',
    when: (f) => (f.sweating || f.shaking || f.dizziness) && !(f.vomiting || f.abdominal_pain),
    titleKey: 'assessment.interview.insightHypoTitle',
    titleFallback: 'Possible low blood sugar signs',
    textKey: 'assessment.interview.insightHypoText',
    textFallback: 'Shakiness, sweating or dizziness can mean low blood sugar. If you have a glucose meter, a reading taken now would be valuable evidence.',
  },
  {
    /* Explains WHY the lab questions disappear when emergency signs are present */
    id: 'emergency-shortcut',
    tone: 'urgent',
    when: (f) => hasEmergencySigns(f),
    titleKey: 'assessment.interview.insightShortcutTitle',
    titleFallback: 'Skipping the lab questions — here is why',
    textKey: 'assessment.interview.insightShortcutText',
    textFallback: 'With the signs you reported, the next step is the same no matter what a lab would say: get checked by a doctor today. I skipped the lab questions to save you time — finish the rest so your report is complete for the clinician.',
  },
]

/* ── Question nodes ──
   kind: patient | number | choice | yesno | multi | body | labs | text
   applies(ctx):   whether the question is relevant (ctx = { form, needsPatient })
   autoDone(ctx):  question can be skipped — the fact is already known
                   (from the saved health profile or a previous answer)       */
/* DKA-pattern emergency signs — the interview is only short-circuited (lab
   questions skipped) for a CLUSTER of signs, never for one nonspecific
   symptom: a lone stomach ache must not end the interview instantly.
   Mirrors the backend engine rule:
     crisis flag, or a keto sign + a GI sign, or vomiting + abdominal pain. */
const KETO_SIGN_FIELDS = ['fruity_breath', 'deep_rapid_breathing']
const GI_SIGN_FIELDS = ['vomiting', 'abdominal_pain']
const EMERGENCY_FIELDS = [...KETO_SIGN_FIELDS, ...GI_SIGN_FIELDS]

export function hasEmergencySigns(form) {
  if (form.crisis === true) return true
  const keto = KETO_SIGN_FIELDS.some((key) => form[key] === true)
  const gi = GI_SIGN_FIELDS.some((key) => form[key] === true)
  if (keto && gi) return true
  return form.vomiting === true && form.abdominal_pain === true
}

/* ── Grid shrink: fields owned by probe nodes ──
   When a probe question has been settled (answered OR consciously skipped)
   its fields count as "already asked" and must not reappear in the
   symptoms_other grid. Keyed by NODE ID on purpose: an earlier version
   filtered by form VALUES (`typeof form[key] !== 'boolean'`), so the moment
   a user tapped a choice in the grid the field turned boolean and the
   choice deleted itself mid-question. */
export const PROBE_CLAIMED_FIELDS = {
  child_probe: ['bed_wetting'],
}

/* ctx = { form, doneIds, skippedIds } — doneIds/skippedIds are the settled node ids */
export function claimedProbeFields(ctx = {}) {
  const done = ctx.doneIds || []
  const skipped = ctx.skippedIds || []
  const claimed = []
  for (const [nodeId, fields] of Object.entries(PROBE_CLAIMED_FIELDS)) {
    if (done.includes(nodeId) || skipped.includes(nodeId)) claimed.push(...fields)
  }
  return claimed
}

export const INTERVIEW_NODES = [
  {
    /* Patient accounts: whose information is this assessment for? Rendered as
       the FIRST question of the interview itself (kind: 'subject').
       "Myself" lets the saved health profile pre-fill known facts;
       "someone else" forces every profile-derived question to be asked fresh.
       Staff accounts never see it — they get the `patient` selector instead. */
    id: 'subject',
    kind: 'subject',
    icon: 'Users',
    priority: () => -1,
    titleKey: 'assessment.subject.title',
    titleFallback: 'Who is this assessment for?',
    helperKey: 'assessment.subject.helper',
    helperFallback: 'Pick whose information this is — we will only ask what we do not already know.',
    applies: ({ needsPatient }) => !needsPatient,
    autoDone: ({ subject }) => subject === 'self' || subject === 'other',
  },
  {
    id: 'patient',
    kind: 'patient',
    icon: 'Building2',
    priority: () => 0,
    titleKey: 'assessment.interview.patientTitle',
    titleFallback: 'Who is this assessment for?',
    helperKey: 'assessment.interview.patientHelper',
    helperFallback: 'Select the patient — answers we already know will be pre-filled.',
    applies: ({ needsPatient }) => needsPatient,
    autoDone: ({ form }) => Boolean(form.patient_id),
  },
  {
    id: 'age',
    kind: 'number',
    field: 'age',
    qcm: 'age_group',
    icon: 'UserRound',
    priority: () => 1,
    titleKey: 'assessment.interview.ageTitle',
    titleFallback: 'How old are you?',
    helperKey: 'assessment.interview.ageHelper',
    helperFallback: 'Age changes the thresholds we screen with.',
  },
  {
    id: 'sex',
    kind: 'choice',
    field: 'sex',
    icon: 'UserRound',
    priority: () => 2,
    titleKey: 'assessment.interview.sexTitle',
    titleFallback: 'What is your sex?',
    helperKey: 'assessment.interview.sexHelper',
    helperFallback: 'Biological sex — it decides which questions and thresholds apply.',
    options: [
      { value: 'male', labelKey: 'assessment.interview.sexMale', labelFallback: 'Male' },
      { value: 'female', labelKey: 'assessment.interview.sexFemale', labelFallback: 'Female' },
      { value: 'other', labelKey: 'assessment.interview.sexOther', labelFallback: 'Other' },
    ],
    autoDone: ({ form }) => ['male', 'female', 'other'].includes(form.sex),
  },
  {
    id: 'ethnicity',
    kind: 'choice',
    field: 'ethnicity',
    icon: 'Globe',
    priority: () => 2.5,
    titleKey: 'assessment.interview.ethnicityTitle',
    titleFallback: 'What is your ethnic background?',
    helperKey: 'assessment.interview.ethnicityHelper',
    helperFallback: 'Ethnic background informs baseline risk; for Asian populations, diabetes risk and overweight begin at a lower BMI (≥23 kg/m²).',
    options: [
      { value: 'asian', labelKey: 'assessment.interview.ethnicityAsian', labelFallback: 'Asian (South, East, Southeast)' },
      { value: 'black', labelKey: 'assessment.interview.ethnicityBlack', labelFallback: 'Black / African American' },
      { value: 'hispanic', labelKey: 'assessment.interview.ethnicityHispanic', labelFallback: 'Hispanic / Latino' },
      { value: 'caucasian', labelKey: 'assessment.interview.ethnicityCaucasian', labelFallback: 'White / Caucasian' },
      { value: 'indigenous', labelKey: 'assessment.interview.ethnicityIndigenous', labelFallback: 'Indigenous / Pacific Islander' },
      { value: 'other', labelKey: 'assessment.interview.ethnicityOther', labelFallback: 'Other / Mixed background' },
    ],
    autoDone: ({ form }) => Boolean(form.ethnicity),
  },
  {
    /* 1. Excessive Thirst (Polydipsia) - Asked one-by-one right after demographics */
    id: 'symptom_thirst',
    kind: 'yesno',
    field: 'excessive_thirst',
    factKey: 'excessive_thirst',
    icon: 'GlassWater',
    priority: () => 3.0,
    titleKey: 'assessment.interview.thirstTitle',
    titleFallback: 'Do you feel unusually thirsty, even after drinking water?',
    helperKey: 'assessment.interview.thirstHelper',
    helperFallback: 'High blood sugar pulls fluid out of body tissues, causing persistent dry mouth and high fluid intake.',
  },
  {
    /* Probing follow-up: asked immediately if thirst is present */
    id: 'thirst_probe',
    kind: 'choice',
    field: 'water_intake_liters',
    factKey: 'water_intake_liters',
    icon: 'GlassWater',
    priority: () => 3.1,
    titleKey: 'assessment.interview.thirstVolumeTitle',
    titleFallback: 'Daily Fluid Intake & Thirst Intensity',
    helperKey: 'assessment.interview.thirstVolumeHelper',
    helperFallback: 'How much water do you drink per day, and does your mouth feel constantly unquenchable?',
    applies: (ctx) => Boolean(ctx?.form?.excessive_thirst),
    options: [
      { value: 1.5, labelKey: 'assessment.interview.thirstNormal', labelFallback: 'Normal fluid intake (< 2 liters)' },
      { value: 2.5, labelKey: 'assessment.interview.thirstElevated', labelFallback: '2 to 3 liters with persistent dry mouth' },
      { value: 4.0, labelKey: 'assessment.interview.thirstExtreme', labelFallback: 'Over 3 liters with unquenchable thirst' },
    ],
  },
  {
    /* 2. Frequent Urination (Polyuria) - Asked one-by-one */
    id: 'symptom_urination',
    kind: 'yesno',
    field: 'frequent_urination',
    factKey: 'frequent_urination',
    icon: 'Droplets',
    priority: () => 3.2,
    titleKey: 'assessment.interview.urinationTitle',
    titleFallback: 'Do you need to urinate more often than usual, especially at night?',
    helperKey: 'assessment.interview.urinationHelper',
    helperFallback: 'When glucose builds up in the blood, the kidneys filter extra water to flush it out (osmotic diuresis).',
  },
  {
    /* Probing follow-up: asked immediately if urination is present */
    id: 'nocturia_probe',
    kind: 'choice',
    field: 'nocturia_count',
    factKey: 'nocturia_count',
    icon: 'Droplets',
    priority: () => 3.3,
    titleKey: 'assessment.interview.nocturiaTitle',
    titleFallback: 'Night Urination: How many times do you wake up at night?',
    helperKey: 'assessment.interview.nocturiaHelper',
    helperFallback: 'Waking 2+ times at night to urinate (Nocturia) indicates persistent osmotic diuresis from high overnight glucose.',
    applies: (ctx) => Boolean(ctx?.form?.frequent_urination),
    options: [
      { value: 0, labelKey: 'assessment.interview.nocturia0to1', labelFallback: '0 to 1 time (Normal)' },
      { value: 2, labelKey: 'assessment.interview.nocturia2to3', labelFallback: '2 to 3 times (Moderate nocturia)' },
      { value: 4, labelKey: 'assessment.interview.nocturia4plus', labelFallback: '4 or more times (Severe nocturia)' },
    ],
  },
  {
    /* 3. Excessive Hunger (Polyphagia) - Asked one-by-one */
    id: 'symptom_hunger',
    kind: 'yesno',
    field: 'excessive_hunger',
    factKey: 'excessive_hunger',
    icon: 'Soup',
    priority: () => 3.4,
    titleKey: 'assessment.interview.hungerTitle',
    titleFallback: 'Do you feel hungry all the time, even after eating?',
    helperKey: 'assessment.interview.hungerHelper',
    helperFallback: 'Because cells cannot absorb glucose without adequate or effective insulin, the brain signals for more fuel.',
  },
  {
    /* 4. Unexplained Weight Loss - Asked one-by-one */
    id: 'symptom_weight_loss',
    kind: 'yesno',
    field: 'weight_loss',
    factKey: 'weight_loss',
    icon: 'TrendingDown',
    priority: () => 3.5,
    titleKey: 'assessment.interview.weightLossTitle',
    titleFallback: 'Have you lost weight without trying or without changing your diet?',
    helperKey: 'assessment.interview.weightLossHelper',
    helperFallback: 'When cells starve of glucose, the body rapidly breaks down muscle and fat stores for energy.',
  },
  {
    /* 5. Persistent Fatigue / Tiredness (Asthenia) - Asked one-by-one */
    id: 'symptom_fatigue',
    kind: 'yesno',
    field: 'fatigue',
    factKey: 'fatigue',
    icon: 'BatteryLow',
    priority: () => 3.6,
    titleKey: 'assessment.interview.fatigueTitle',
    titleFallback: 'Do you feel unusually tired or exhausted, even after resting?',
    helperKey: 'assessment.interview.fatigueHelper',
    helperFallback: 'Insufficient cellular glucose availability causes chronic physical and mental exhaustion not relieved by sleep.',
  },
  {
    /* Probing follow-up: asked immediately if fatigue is present */
    id: 'fatigue_probe',
    kind: 'choice',
    field: 'fatigue_severity_scale',
    factKey: 'fatigue_severity_scale',
    icon: 'BatteryLow',
    priority: () => 3.7,
    titleKey: 'assessment.interview.fatigueScaleTitle',
    titleFallback: 'Fatigue Severity: Rate your daily exhaustion',
    helperKey: 'assessment.interview.fatigueScaleHelper',
    helperFallback: 'Persistent exhaustion not relieved by sleep indicates cells may lack insulin to utilize glucose for energy.',
    applies: (ctx) => Boolean(ctx?.form?.fatigue),
    options: [
      { value: 3, labelKey: 'assessment.interview.fatigueMild', labelFallback: 'Mild (1–3): Occasionally tired after long days' },
      { value: 5, labelKey: 'assessment.interview.fatigueModerate', labelFallback: 'Moderate (4–6): Frequent low energy throughout the day' },
      { value: 8, labelKey: 'assessment.interview.fatigueSevere', labelFallback: 'Severe (7–10): Constant, overwhelming physical exhaustion' },
    ],
  },
  {
    /* Secondary & Microvascular Warning Signs (Comprehensive multi-choice card) */
    id: 'symptoms_secondary',
    kind: 'multi',
    fields: (ctx) => ctx?.fieldGroups?.symptoms_secondary || SYMPTOM_SECONDARY_FIELDS,
    icon: 'ShieldAlert',
    priority: () => 3.8,
    titleKey: 'assessment.interview.secondarySymptomsTitle',
    titleFallback: 'Have you noticed any of these nerve, vision, or skin warning signs?',
    helperKey: 'assessment.interview.secondarySymptomsHelper',
    helperFallback: 'High blood sugar can damage small blood vessels and nerves over time. Select all that apply, or choose None of these.',
  },
  {
    id: 'symptom_onset',
    kind: 'yesno',
    field: 'rapid_onset',
    icon: 'Timer',
    priority: () => 3.9,
    titleKey: 'assessment.interview.onsetTitle',
    titleFallback: 'Did these symptoms come on suddenly?',
    helperKey: 'assessment.interview.onsetHelper',
    helperFallback: 'Sudden onset (days to weeks) points to type 1 diabetes; a slow build-up over months or years points to type 2.',
    applies: (ctx) => {
      const form = ctx?.form || {}
      const core = ctx?.fieldGroups?.symptoms_core || SYMPTOM_CORE_FIELDS
      const sec = ctx?.fieldGroups?.symptoms_secondary || SYMPTOM_SECONDARY_FIELDS
      return core.some((key) => form[key] === true) || sec.some((key) => form[key] === true)
    },
  },
  {
    /* Type 1 in children: Asked if patient is pediatric (<18) and reported symptoms */
    id: 'child_probe',
    kind: 'yesno',
    field: 'bed_wetting',
    icon: 'Baby',
    priority: () => 3.95,
    titleKey: 'assessment.interview.childProbeTitle',
    titleFallback: 'Any new bed-wetting at night?',
    helperKey: 'assessment.interview.childProbeHelper',
    helperFallback: 'In children, new bed-wetting with extra thirst or urination is the strongest type 1 signal.',
    applies: (ctx) => {
      const form = ctx?.form || {}
      const age = Number(form.age)
      const core = ctx?.fieldGroups?.symptoms_core || SYMPTOM_CORE_FIELDS
      return age > 0 && age < 18 && core.some((key) => Boolean(form[key]))
    },
  },
  {
    id: 'body',
    kind: 'body',
    icon: 'Scale',
    priority: () => 4.0,
    titleKey: 'assessment.interview.bodyTitle',
    titleFallback: 'Body measurements & Waist',
    helperKey: 'assessment.interview.bodyHelper',
    helperFallback: 'Height, weight, and waist circumference — I will calculate your BMI and abdominal risk automatically.',
    skippable: true,
  },
  {
    id: 'currently_pregnant',
    kind: 'yesno',
    field: 'currently_pregnant',
    icon: 'Baby',
    priority: () => 5.0,
    titleKey: 'assessment.interview.pregnantTitle',
    titleFallback: 'Are you currently pregnant?',
    helperKey: 'assessment.interview.pregnantHelper',
    helperFallback: 'Pregnancy uses stricter blood-sugar thresholds — I will adjust if so.',
    applies: ({ form }) => {
      if (form.sex !== 'female') return false
      const age = Number(form.age)
      if (!form.age || Number.isNaN(age)) return true
      return age >= 10 && age <= 70
    },
  },
  {
    id: 'pregnancy_stage',
    kind: 'choice',
    field: 'pregnancy_stage',
    icon: 'CalendarHeart',
    priority: () => 5.1,
    titleKey: 'assessment.interview.stageTitle',
    titleFallback: 'How far along are you?',
    helperKey: 'assessment.interview.stageHelper',
    helperFallback: 'Gestational diabetes is usually screened between weeks 24–28.',
    applies: ({ form }) => form.currently_pregnant === true,
    options: [
      { value: 'first', labelKey: 'assessment.interview.stageFirst', labelFallback: '1st trimester (0–13 weeks)' },
      { value: 'second', labelKey: 'assessment.interview.stageSecond', labelFallback: '2nd trimester (14–27 weeks)' },
      { value: 'third', labelKey: 'assessment.interview.stageThird', labelFallback: '3rd trimester (28+ weeks)' },
      { value: 'unsure', labelKey: 'assessment.interview.stageUnsure', labelFallback: 'Not sure' },
    ],
  },
  {
    id: 'gdm_previous',
    kind: 'yesno',
    field: 'gestational_history',
    icon: 'Baby',
    priority: () => 5.2,
    titleKey: 'assessment.interview.gdmPrevTitle',
    titleFallback: 'Have you had gestational diabetes in a previous pregnancy?',
    helperKey: 'assessment.interview.gdmPrevHelper',
    helperFallback: 'A previous episode raises lifetime risk and means earlier testing this time.',
    applies: ({ form }) => form.currently_pregnant === true,
  },
  {
    /* Hypoglycemia gatekeeper: quick screening for low blood sugar spells */
    id: 'hypo_gate',
    kind: 'yesno',
    field: 'hypo_gate',
    icon: 'Activity',
    priority: () => 6.0,
    titleKey: 'assessment.interview.hypoGateTitle',
    titleFallback: 'Have you had sudden episodes of shakiness, cold sweating, or dizziness?',
    helperKey: 'assessment.interview.hypoGateHelper',
    helperFallback: 'Sudden episodes (especially when hungry or between meals) that improve after eating suggest blood sugar dips.',
  },
  {
    /* Hypoglycemia follow-up: asked only if hypo_gate is true */
    id: 'hypo_probe',
    kind: 'multi',
    fields: ['shaking', 'sweating', 'dizziness'],
    icon: 'Activity',
    priority: () => 6.1,
    titleKey: 'assessment.interview.hypoProbeTitle',
    titleFallback: 'Which sensations do you experience during those spells?',
    helperKey: 'assessment.interview.hypoProbeHelper',
    helperFallback: 'Select all that apply during these episodes.',
    applies: (ctx) => Boolean(
      ctx?.form?.hypo_gate === true ||
      ctx?.form?.shaking ||
      ctx?.form?.sweating ||
      ctx?.form?.dizziness
    ),
  },
  {
    /* Emergency signs gatekeeper: quick screening for acute emergency / DKA distress */
    id: 'emergency_gate',
    kind: 'yesno',
    field: 'emergency_gate',
    icon: 'AlertTriangle',
    priority: () => 7.0,
    titleKey: 'assessment.interview.emergencyGateTitle',
    titleFallback: 'Are you experiencing any acute emergency warning signs right now?',
    helperKey: 'assessment.interview.emergencyGateHelper',
    helperFallback: 'Such as severe stomach pain, persistent vomiting, or rapid/fruity breathing.',
  },
  {
    /* Emergency signs follow-up: asked only if emergency_gate is true */
    id: 'emergency_probe',
    kind: 'multi',
    fields: ['vomiting', 'abdominal_pain', 'fruity_breath', 'deep_rapid_breathing'],
    icon: 'AlertTriangle',
    priority: () => 7.1,
    titleKey: 'assessment.interview.emergencyProbeTitle',
    titleFallback: 'Emergency signs: Select all that apply right now',
    helperKey: 'assessment.interview.emergencyProbeHelper',
    helperFallback: 'These signs require prompt clinical or emergency room evaluation.',
    applies: (ctx) => Boolean(
      ctx?.form?.emergency_gate === true ||
      ctx?.form?.vomiting ||
      ctx?.form?.abdominal_pain ||
      ctx?.form?.fruity_breath ||
      ctx?.form?.deep_rapid_breathing
    ),
  },
  {
    id: 'family_history',
    kind: 'yesno',
    field: 'family_history',
    icon: 'Users',
    priority: () => 8.0,
    titleKey: 'assessment.interview.familyHistoryTitle',
    titleFallback: 'Do you have a parent or sibling with Type 2 diabetes?',
    helperKey: 'assessment.interview.familyHistoryHelper',
    helperFallback: 'First-degree genetic family history roughly doubles your baseline predisposition to insulin resistance.',
  },
  {
    id: 'blood_pressure',
    kind: 'choice',
    field: 'hypertension',
    icon: 'HeartPulse',
    priority: () => 9.0,
    titleKey: 'assessment.interview.bpTitle',
    titleFallback: 'What is your typical Blood Pressure level?',
    helperKey: 'assessment.interview.bpHelper',
    helperFallback: 'Blood pressure ≥130/80 mmHg or being treated for hypertension significantly increases diabetes and vascular complications.',
    options: [
      { value: false, labelKey: 'assessment.interview.bpNormal', labelFallback: 'Normal (< 130/80 mmHg)' },
      { value: true, labelKey: 'assessment.interview.bpHypertension', labelFallback: 'Elevated / High (≥ 130/80 mmHg or taking BP medicine)' },
    ],
  },
  {
    id: 'lipid_profile',
    kind: 'multi',
    fields: ['high_cholesterol', 'dyslipidemia_low_hdl', 'dyslipidemia_high_tg', 'cardiovascular_disease'],
    icon: 'HeartPulse',
    priority: () => 10.0,
    titleKey: 'assessment.interview.lipidTitle',
    titleFallback: 'Cholesterol & Cardiovascular History',
    helperKey: 'assessment.interview.lipidHelper',
    helperFallback: 'Low HDL (<35 mg/dL), high triglycerides (≥250 mg/dL), or past heart/stroke events are key cardiometabolic antecedents.',
  },
  {
    id: 'obstetric_history',
    kind: 'multi',
    fields: ['gestational_history', 'macrosomia_history', 'pcos_history'],
    icon: 'Baby',
    priority: () => 11.0,
    titleKey: 'assessment.interview.obstetricTitle',
    titleFallback: 'Obstetric & Women’s Health History',
    helperKey: 'assessment.interview.obstetricHelper',
    helperFallback: 'Gestational diabetes, delivering a baby over 9 lbs (4.1 kg), or PCOS reflect underlying insulin resistance.',
    applies: ({ form }) => form.sex === 'female',
  },
  {
    id: 'lifestyle_activity',
    kind: 'choice',
    field: 'physical_activity_minutes_week',
    icon: 'Armchair',
    priority: () => 12.0,
    titleKey: 'assessment.interview.activityTitle',
    titleFallback: 'Weekly Physical Activity Level',
    helperKey: 'assessment.interview.activityHelper',
    helperFallback: 'ADA clinical guidelines recommend at least 150 minutes of moderate-to-vigorous physical activity per week.',
    options: [
      { value: 180, labelKey: 'assessment.interview.activityActive', labelFallback: 'Active: 150+ minutes per week (Meets ADA goal)' },
      { value: 90, labelKey: 'assessment.interview.activityModerate', labelFallback: 'Somewhat active: 60–149 minutes per week' },
      { value: 30, labelKey: 'assessment.interview.activitySedentary', labelFallback: 'Sedentary: Less than 60 minutes per week' },
    ],
  },
  {
    id: 'lifestyle_diet',
    kind: 'choice',
    field: 'sugary_diet_frequency',
    icon: 'Soup',
    priority: () => 12.2,
    titleKey: 'assessment.interview.dietTitle',
    titleFallback: 'Sugary Drinks & Refined Carbohydrates',
    helperKey: 'assessment.interview.dietHelper',
    helperFallback: 'How frequently do you drink soda, sweet tea, energy drinks, or consume refined baked sweets?',
    options: [
      { value: 'rarely', labelKey: 'assessment.interview.dietRarely', labelFallback: 'Rarely / Less than once a week' },
      { value: '3_5_times', labelKey: 'assessment.interview.dietModerate', labelFallback: '2 to 4 times a week' },
      { value: 'daily', labelKey: 'assessment.interview.dietDaily', labelFallback: 'Daily or multiple times each day' },
    ],
  },
  {
    id: 'lifestyle_sleep',
    kind: 'choice',
    field: 'sleep_hours_night',
    icon: 'Activity',
    priority: () => 12.4,
    titleKey: 'assessment.interview.sleepTitle',
    titleFallback: 'Sleep Duration & Quality',
    helperKey: 'assessment.interview.sleepHelper',
    helperFallback: 'Averaging <6 hours of sleep or experiencing untreated obstructive sleep apnea increases morning cortisol and insulin resistance.',
    options: [
      { value: 7.5, labelKey: 'assessment.interview.sleepNormal', labelFallback: '7 to 9 hours of restorative sleep' },
      { value: 6.0, labelKey: 'assessment.interview.sleepBorderline', labelFallback: '6 to 7 hours per night' },
      { value: 5.0, labelKey: 'assessment.interview.sleepShort', labelFallback: 'Less than 6 hours per night (Sleep restricted)' },
    ],
  },
  {
    id: 'lifestyle_habits',
    kind: 'multi',
    fields: ['smoking', 'alcohol_frequent', 'sleep_apnea_history'],
    icon: 'Cigarette',
    priority: () => 12.6,
    titleKey: 'assessment.interview.habitsTitle',
    titleFallback: 'Smoking, Alcohol & Respiratory Habits',
    helperKey: 'assessment.interview.habitsHelper',
    helperFallback: 'Tobacco smoking and heavy alcohol intake compound microvascular complications and liver glucose regulation.',
  },
  {
    id: 'has_labs',
    kind: 'yesno',
    field: 'has_labs',
    icon: 'TestTube2',
    priority: () => 24,
    /* Emergency signs → lab questions are pointless; the advice is go now. */
    applies: ({ form }) => !hasEmergencySigns(form),
    titleKey: 'assessment.interview.hasLabsTitle',
    titleFallback: 'Do you have recent lab results?',
    helperKey: 'assessment.interview.hasLabsHelper',
    helperFallback: 'Lab values sharpen accuracy a lot — but the interview works without them.',
  },
  {
    id: 'labs',
    kind: 'labs',
    icon: 'FlaskConical',
    priority: () => 25,
    titleKey: 'assessment.interview.labsTitle',
    titleFallback: 'Enter the lab values you have',
    helperKey: 'assessment.interview.labsHelper',
    helperFallback: 'Any one of these helps — everything is optional, and ranges work too.',
    skippable: true,
    applies: ({ form }) => form.no_labs_available !== true && !hasEmergencySigns(form),
  },
  {
    id: 'extra',
    kind: 'text',
    field: 'extra_symptoms',
    icon: 'PenTool',
    priority: () => 30,
    titleKey: 'assessment.interview.extraTitle',
    titleFallback: 'Anything else to tell the clinician?',
    helperKey: 'assessment.interview.extraHelper',
    helperFallback: 'Something the questions did not cover — optional.',
    skippable: true,
  },
]

/* ── Engine helpers ──
   applicableNodes orders the remaining questions by `priority(ctx)`, so the
   NEXT question depends on the evidence collected so far (like a clinician's
   differential): sudden onset pulls the ketone/emergency check forward, a
   slow build-up pulls the insulin-resistance probe forward, children get the
   bed-wetting probe, and grids shrink when answers are already known.     */
export function applicableNodes(nodes, ctx) {
  return nodes
    .filter((n) => !n.applies || n.applies(ctx))
    .map((node, index) => ({ node, index, rank: node.priority ? node.priority(ctx) : 100 }))
    .sort((a, b) => (a.rank === b.rank ? a.index - b.index : a.rank - b.rank))
    .map((entry) => entry.node)
}

/* fields can be a static array or a function of the collected evidence */
export function nodeFields(node, ctx) {
  if (typeof node.fields === 'function') return node.fields(ctx)
  return node.fields || []
}

export function isNodeDone(node, ctx, doneIds, skippedIds) {
  if (skippedIds.includes(node.id) || doneIds.includes(node.id)) return true
  return node.autoDone ? Boolean(node.autoDone(ctx)) : false
}

export function firstOpenNode(nodes, ctx, doneIds, skippedIds) {
  const open = applicableNodes(nodes, ctx).find((n) => !isNodeDone(n, ctx, doneIds, skippedIds))
  return open ? open.id : null
}

export function interviewProgress(nodes, ctx, doneIds, skippedIds) {
  const applicable = applicableNodes(nodes, ctx)
  if (!applicable.length) return 100
  const done = applicable.filter((n) => isNodeDone(n, ctx, doneIds, skippedIds)).length
  return Math.round((done / applicable.length) * 100)
}

export function interviewPosition(nodes, ctx, doneIds, skippedIds, cursorId) {
  const applicable = applicableNodes(nodes, ctx)
  const idx = applicable.findIndex((n) => n.id === cursorId)
  return idx === -1 ? applicable.length : idx + 1
}

export function fieldLabelKey(key) {
  return `assessment.fields.${FIELD_GROUPS[key] || 'symptoms'}.${camelField(key)}`
}

// Canonical answer->facts conversion: no interview answer can be dropped by the payload again.
export function buildFactsFromAnswers(answers) {
  const facts = {};
  if (!answers || typeof answers !== 'object') return facts;
  for (const [key, value] of Object.entries(answers)) {
    if (value === undefined || value === null || value === '') continue;
    if (value === 'yes' || value === 'true') { facts[key] = true; continue; }
    if (value === 'no' || value === 'false') { facts[key] = false; continue; }
    facts[key] = value;
  }
  return facts;
}

/**
 * Dynamically categorize database facts into interview field groups:
 * - cardinal / is_cardinal: true -> symptoms_core
 * - emergency / safety / is_emergency: true -> warning_signs
 * - risk_factor / risk -> risk_factors
 * - all other symptom categories (metabolic, vision, skin, nerve, etc.) -> symptoms_other
 *
 * Preserves built-in static defaults as offline/instant fallback and appends
 * any new active facts from the database catalog.
 */
const EXCLUDED_FACT_KEYS = new Set([
  // Cardinal duplicates & depth probes (already asked individually in Steps 1-5):
  'increased_appetite', 'weakness', 'extreme_fatigue', 'severe_fatigue',
  'unquenchable_thirst', 'nocturia', 'polyuria', 'polydipsia', 'polyphagia',
  'unexplained_weight_loss', 'fatigue_severity_scale', 'water_intake_liters', 'nocturia_count',
  // Pediatric only (asked via child_probe when age < 18):
  'bed_wetting', 'diaper_rash', 'persistent_diaper_rash',
  // Obstetric (handled in female risk profile / obstetric questions):
  'macrosomia_history',
  // Sensitive or non-screening complications:
  'erectile_dysfunction', 'yeast_infections', 'recurrent_yeast_infections',
  // Non-specific neurocognitive / mood:
  'difficulty_concentrating', 'irritability',
  // Emergency / triage (handled via emergency gates):
  'sweating', 'shaking', 'dizziness', 'vomiting', 'abdominal_pain',
  'fruity_breath', 'deep_rapid_breathing', 'confusion', 'crisis', 'unable_to_keep_fluids',
  // Aliases & redundant:
  'rapid_breathing', 'slow_healing_wounds', 'difficulty_seeing', 'blurry_vision',
  'numbness', // covered under tingling_hands_feet
  'recurrent_uti_yeast', // covered under frequent_infections
])

export function buildFieldGroupsFromFacts(facts = []) {
  const core = [...SYMPTOM_CORE_FIELDS]
  const secondary = [...SYMPTOM_SECONDARY_FIELDS]
  const warning = [...SAFETY_FIELDS]
  const risk = [...RISK_FIELDS]
  const probes = [...SYMPTOM_PROBE_FIELDS]

  if (!Array.isArray(facts) || facts.length === 0) {
    return {
      symptoms_core: core,
      symptoms_secondary: secondary,
      warning_signs: warning,
      risk_factors: risk,
      symptoms_probes: probes,
      symptoms_other: secondary,
    }
  }

  for (const fact of facts) {
    if (!fact || !fact.key || fact.is_active === false) continue
    const key = fact.key
    if (EXCLUDED_FACT_KEYS.has(key)) continue
    const cat = String(fact.category || '').toLowerCase()

    // Profile and lab facts are handled by dedicated question cards (age, sex, body, labs)
    if (cat === 'profile' || cat === 'lab') continue

    if (fact.is_cardinal || cat === 'cardinal') {
      if (!core.includes(key)) core.push(key)
    } else if (fact.is_emergency || cat === 'emergency' || cat === 'safety') {
      if (!warning.includes(key)) warning.push(key)
    } else if (cat === 'risk_factor' || cat === 'risk') {
      if (!risk.includes(key)) risk.push(key)
    } else if (cat === 'secondary' || cat === 'microvascular') {
      if (!secondary.includes(key)) secondary.push(key)
    }
  }

  return {
    symptoms_core: core,
    symptoms_secondary: secondary,
    warning_signs: warning,
    risk_factors: risk,
    symptoms_probes: probes,
    symptoms_other: secondary,
  }
}

/**
 * Resolves the display label for a fact key, honoring clean UI language & doctor edits:
 * - 1. Curated human-friendly translation key from en.json / km.json
 * - 2. Doctor custom database label if edited
 * - 3. Fallback to clean readable string
 */
export function getFactLabel(key, factsMap, language, t) {
  const i18nKey = fieldLabelKey(key)
  const i18nVal = t ? t(i18nKey, '') : ''
  if (i18nVal && i18nVal !== i18nKey) {
    return i18nVal
  }

  if (factsMap && typeof factsMap.get === 'function') {
    const fact = factsMap.get(key)
    if (fact) {
      const dbLabel = language === 'km' ? (fact.label_km || fact.label) : (fact.label || fact.label_km)
      if (dbLabel && dbLabel.trim()) return dbLabel.trim()
    }
  }

  const fallback = FIELD_FALLBACKS[key] || key.replace(/_/g, ' ')
  return fallback
}

/**
 * Resolves the question prompt for an interview node:
 * - Checks if the node maps to a database Fact (via node.factKey or node.field)
 * - Returns fact.question_km / fact.question dynamically so doctor DB updates are live!
 * - Falls back to i18n t(node.titleKey, node.titleFallback).
 */
export function getNodeQuestion(node, factsMap, language, t) {
  if (!node) return ''
  const factKey = node.factKey || (node.kind === 'yesno' ? node.field : null)
  if (factKey && factsMap && typeof factsMap.get === 'function') {
    const fact = factsMap.get(factKey)
    if (fact) {
      if (language === 'km') {
        if (fact.question_km && fact.question_km.trim()) return fact.question_km.trim()
      } else {
        if (fact.question && fact.question.trim()) return fact.question.trim()
      }
    }
  }
  const translated = t ? t(node.titleKey, node.titleFallback) : (node.titleFallback || '')
  if (translated) return translated
  if (factKey && factsMap && typeof factsMap.get === 'function') {
    const fact = factsMap.get(factKey)
    return fact?.question || fact?.question_km || node.titleFallback || ''
  }
  return node.titleFallback || ''
}

/**
 * Resolves the helper/educational prompt for an interview node:
 * - Checks if the database Fact has clinical meaning/guidance (fact.meaning / meaning_km)
 * - Falls back to i18n t(node.helperKey, node.helperFallback).
 */
export function getNodeHelper(node, factsMap, language, t) {
  if (!node) return ''
  const factKey = node.factKey || (node.kind === 'yesno' ? node.field : null)
  if (factKey && factsMap && typeof factsMap.get === 'function') {
    const fact = factsMap.get(factKey)
    if (fact) {
      if (language === 'km') {
        if (fact.meaning_km && fact.meaning_km.trim()) return fact.meaning_km.trim()
      } else {
        if (fact.meaning && fact.meaning.trim()) return fact.meaning.trim()
      }
    }
  }
  const translated = node.helperKey && t ? t(node.helperKey, node.helperFallback) : (node.helperFallback || '')
  if (translated) return translated
  if (factKey && factsMap && typeof factsMap.get === 'function') {
    const fact = factsMap.get(factKey)
    return fact?.meaning || fact?.meaning_km || node.helperFallback || ''
  }
  return node.helperFallback || ''
}

/**
 * Returns the formal medical/clinical term for a node if available in DB fact (e.g. Polyuria, Polydipsia).
 */
export function getNodeMedicalTerm(node, factsMap) {
  if (!node) return null
  const factKey = node.factKey || (node.kind === 'yesno' ? node.field : null)
  if (factKey && factsMap && typeof factsMap.get === 'function') {
    const fact = factsMap.get(factKey)
    return fact?.medical_term || null
  }
  return null
}

