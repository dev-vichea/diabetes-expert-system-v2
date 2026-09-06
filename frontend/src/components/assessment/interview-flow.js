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
// 8 CDC Common Symptoms (Primary Questionnaire Card)
export const SYMPTOM_CORE_FIELDS = [
  'frequent_urination',
  'excessive_thirst',
  'excessive_hunger',
  'fatigue',
  'blurred_vision',
  'tingling_hands_feet',
  'slow_healing',
  'weight_loss',
]

// Secondary / Adaptive Probe Symptoms (Triggered conditionally when a related symptom is chosen)
export const SYMPTOM_PROBE_FIELDS = [
  'burning_sensation',
  'numbness',
  'recurrent_uti_yeast',
  'frequent_infections',
  'itchy_skin',
  'acanthosis_nigricans',
  'bed_wetting',
]

export const SYMPTOM_OTHER_FIELDS = SYMPTOM_PROBE_FIELDS
export const SYMPTOM_ALL_FIELDS = [...SYMPTOM_CORE_FIELDS, ...SYMPTOM_PROBE_FIELDS]
export const SAFETY_FIELDS = ['sweating', 'shaking', 'dizziness', 'vomiting', 'abdominal_pain', 'fruity_breath', 'deep_rapid_breathing']
export const RISK_FIELDS = ['family_history', 'obesity', 'hypertension', 'sedentary_lifestyle', 'gestational_history', 'smoking', 'high_cholesterol', 'pcos_history', 'ethnicity_high_risk']

/* i18n group for each boolean field: assessment.fields.<group>.<camelKey> */
export const FIELD_GROUPS = {
  frequent_urination: 'symptoms', excessive_thirst: 'symptoms', weight_loss: 'symptoms',
  fatigue: 'symptoms', blurred_vision: 'symptoms', slow_healing: 'symptoms', nausea: 'symptoms',
  tingling_hands_feet: 'symptoms', frequent_infections: 'symptoms', acanthosis_nigricans: 'symptoms',
  excessive_hunger: 'symptoms', irritability: 'symptoms', recurrent_uti_yeast: 'symptoms', bed_wetting: 'symptoms',
  burning_sensation: 'symptoms', numbness: 'symptoms', itchy_skin: 'symptoms',
  sweating: 'safetySymptoms', shaking: 'safetySymptoms', dizziness: 'safetySymptoms',
  vomiting: 'safetySymptoms', abdominal_pain: 'safetySymptoms',
  fruity_breath: 'safetySymptoms', deep_rapid_breathing: 'safetySymptoms',
  family_history: 'riskFactors', obesity: 'riskFactors', hypertension: 'riskFactors',
  sedentary_lifestyle: 'riskFactors', gestational_history: 'riskFactors', smoking: 'riskFactors',
  high_cholesterol: 'riskFactors', pcos_history: 'riskFactors', ethnicity_high_risk: 'riskFactors',
}

/* English fallback labels (used when a translation key is missing) */
export const FIELD_FALLBACKS = {
  frequent_urination: 'Frequent urination', excessive_thirst: 'Excessive thirst', weight_loss: 'Unexplained weight loss',
  fatigue: 'Constant tiredness', blurred_vision: 'Blurred vision', slow_healing: 'Slow wound healing',
  nausea: 'Nausea', tingling_hands_feet: 'Tingling / numbness in hands or feet', frequent_infections: 'Frequent infections',
  acanthosis_nigricans: 'Dark skin patches',
  excessive_hunger: 'Feeling very hungry', irritability: 'Irritability / mood changes',
  recurrent_uti_yeast: 'Recurring UTIs / yeast infections', bed_wetting: 'New bed-wetting (children)',
  burning_sensation: 'Burning sensation in feet or legs', numbness: 'Numbness or loss of feeling',
  itchy_skin: 'Persistent dry or itchy skin',
  sweating: 'Sweating episodes', shaking: 'Shaking / tremor', dizziness: 'Dizziness',
  vomiting: 'Vomiting', abdominal_pain: 'Stomach pain',
  fruity_breath: 'Fruity / acetone breath', deep_rapid_breathing: 'Deep, rapid breathing',
  family_history: 'Family history of diabetes', obesity: 'Obesity / overweight', hypertension: 'High blood pressure',
  sedentary_lifestyle: 'Inactive / sedentary', gestational_history: 'Gestational diabetes history', smoking: 'Current smoker',
  high_cholesterol: 'High cholesterol / lipids', pcos_history: 'PCOS History', ethnicity_high_risk: 'High-risk ethnicity',
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
  t2_probe: ['acanthosis_nigricans'],
  nerve_probe: ['burning_sensation', 'numbness'],
  skin_probe: ['recurrent_uti_yeast', 'frequent_infections', 'itchy_skin'],
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
    id: 'currently_pregnant',
    kind: 'yesno',
    field: 'currently_pregnant',
    icon: 'Baby',
    priority: () => 3,
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
    priority: () => 4,
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
    priority: () => 5,
    titleKey: 'assessment.interview.gdmPrevTitle',
    titleFallback: 'Have you had gestational diabetes in a previous pregnancy?',
    helperKey: 'assessment.interview.gdmPrevHelper',
    helperFallback: 'A previous episode raises lifetime risk and means earlier testing this time.',
    applies: ({ form }) => form.currently_pregnant === true,
  },
  {
    id: 'symptoms_core',
    kind: 'multi',
    fields: (ctx) => ctx?.fieldGroups?.symptoms_core || SYMPTOM_CORE_FIELDS,
    icon: 'Droplets',
    priority: () => 10,
    titleKey: 'assessment.interview.coreSymptomsTitle',
    titleFallback: 'Which of these have you noticed recently?',
    helperKey: 'assessment.interview.coreSymptomsHelper',
    helperFallback: 'Select all that apply — or tap "None of these" if you feel fine.',
  },
  {
    id: 'symptom_onset',
    kind: 'yesno',
    field: 'rapid_onset',
    icon: 'Timer',
    priority: () => 13,
    titleKey: 'assessment.interview.onsetTitle',
    titleFallback: 'Did these symptoms come on suddenly?',
    helperKey: 'assessment.interview.onsetHelper',
    helperFallback: 'Sudden onset (days to weeks) points to type 1 diabetes; a slow build-up over months or years points to type 2.',
    applies: (ctx) => {
      const form = ctx?.form || {}
      const core = ctx?.fieldGroups?.symptoms_core || SYMPTOM_CORE_FIELDS
      const other = ctx?.fieldGroups?.symptoms_other || SYMPTOM_OTHER_FIELDS
      return core.some((key) => form[key] === true) || other.some((key) => form[key] === true)
    },
  },
  {
    /* Type 1 in children: Asked if patient is pediatric (<18) and reported symptoms */
    id: 'child_probe',
    kind: 'yesno',
    field: 'bed_wetting',
    icon: 'Baby',
    priority: () => 14,
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
    /* Nerve follow-up: Asked only when patient noted tingling / numbness in hands or feet */
    id: 'nerve_probe',
    kind: 'multi',
    fields: ['burning_sensation', 'numbness'],
    icon: 'Activity',
    priority: () => 14,
    titleKey: 'assessment.interview.nerveProbeTitle',
    titleFallback: 'Follow-up: Nerve sensations',
    helperKey: 'assessment.interview.nerveProbeHelper',
    helperFallback: 'Because you noted numbness or tingling in your hands or feet, do you also experience either of these?',
    applies: (ctx) => Boolean(ctx?.form?.tingling_hands_feet),
  },
  {
    /* Skin & infection follow-up: Asked only when patient noted slow-healing sores */
    id: 'skin_probe',
    kind: 'multi',
    fields: ['recurrent_uti_yeast', 'frequent_infections', 'itchy_skin'],
    icon: 'ShieldAlert',
    priority: () => 14,
    titleKey: 'assessment.interview.skinProbeTitle',
    titleFallback: 'Follow-up: Infections & skin changes',
    helperKey: 'assessment.interview.skinProbeHelper',
    helperFallback: 'High blood sugar slows healing and weakens defense against infections. Have you experienced any of these?',
    applies: (ctx) => Boolean(ctx?.form?.slow_healing),
  },
  {
    /* Insulin resistance probe: Asked when slow build-up or overweight/obesity */
    id: 't2_probe',
    kind: 'multi',
    fields: ['acanthosis_nigricans'],
    icon: 'Contrast',
    priority: () => 14,
    titleKey: 'assessment.interview.t2ProbeTitle',
    titleFallback: 'Any dark skin patches?',
    helperKey: 'assessment.interview.t2ProbeHelper',
    helperFallback: 'Dark, velvety patches of skin (e.g. around neck folds or armpits) strongly suggest insulin resistance.',
    applies: (ctx) => {
      const form = ctx?.form || {}
      return form.rapid_onset === false || Number(form.bmi) >= 25 || Boolean(form.obesity)
    },
  },
  {
    id: 'warning_signs',
    kind: 'multi',
    fields: (ctx) => ctx?.fieldGroups?.warning_signs || SAFETY_FIELDS,
    icon: 'AlertTriangle',
    /* Safety check always comes right after the symptom probes — before
       risk factors and labs — because sudden-onset + ketone signs change
       what the very next question should be. */
    priority: () => 15,
    titleKey: 'assessment.interview.warningTitle',
    titleFallback: 'Any of these warning signs right now?',
    helperKey: 'assessment.interview.warningHelper',
    helperFallback: 'These help detect low blood sugar or emergencies.',
  },
  {
    id: 'risk_factors',
    kind: 'multi',
    fields: (ctx) => ctx?.fieldGroups?.risk_factors || RISK_FIELDS,
    icon: 'ClipboardList',
    priority: () => 20,
    titleKey: 'assessment.interview.riskTitle',
    titleFallback: 'Do any of these apply to you?',
    helperKey: 'assessment.interview.riskHelper',
    helperFallback: 'Answers already known from your health profile are pre-ticked — you can change them.',
  },
  {
    id: 'body',
    kind: 'body',
    icon: 'Scale',
    priority: () => 22,
    titleKey: 'assessment.interview.bodyTitle',
    titleFallback: 'Height & weight',
    helperKey: 'assessment.interview.bodyHelper',
    helperFallback: 'I will calculate BMI automatically — or enter it directly if you know it.',
    skippable: true,
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
  'crisis',
  'rapid_breathing',
  'polyuria',
  'polydipsia',
  'polyphagia',
  'unexplained_weight_loss',
  'extreme_fatigue',
  'slow_healing_wounds',
  'difficulty_seeing',
  'confusion',
  'unable_to_keep_fluids',
])

export function buildFieldGroupsFromFacts(facts = []) {
  const core = [...SYMPTOM_CORE_FIELDS]
  const warning = [...SAFETY_FIELDS]
  const risk = [...RISK_FIELDS]
  const probes = [...SYMPTOM_PROBE_FIELDS]

  if (!Array.isArray(facts) || facts.length === 0) {
    return {
      symptoms_core: core,
      warning_signs: warning,
      risk_factors: risk,
      symptoms_probes: probes,
      symptoms_other: probes,
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
    } else {
      // General symptoms & doctor custom facts
      if (!core.includes(key) && !warning.includes(key) && !risk.includes(key) && !probes.includes(key)) {
        probes.push(key)
      }
    }
  }

  return {
    symptoms_core: core,
    warning_signs: warning,
    risk_factors: risk,
    symptoms_probes: probes,
    symptoms_other: probes,
  }
}

/**
 * Resolves the display label for a fact key, honoring database edits and UI language:
 * - If in DB and KM active: fact.label_km (or i18n / fact.label)
 * - If in DB and EN active: fact.label (or i18n)
 * - Fallback: i18n key or static fallback or humanized key
 */
export function getFactLabel(key, factsMap, language, t) {
  if (factsMap && typeof factsMap.get === 'function') {
    const fact = factsMap.get(key)
    if (fact) {
      const dbLabel = language === 'km' ? (fact.label_km || fact.label) : (fact.label || fact.label_km)
      if (dbLabel && dbLabel.trim()) return dbLabel.trim()
    }
  }
  const fallback = FIELD_FALLBACKS[key] || key.replace(/_/g, ' ')
  return t ? t(fieldLabelKey(key), fallback) : fallback
}

