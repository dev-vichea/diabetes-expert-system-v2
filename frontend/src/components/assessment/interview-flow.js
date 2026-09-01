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
export const SYMPTOM_CORE_FIELDS = ['frequent_urination', 'excessive_thirst', 'excessive_hunger', 'weight_loss']
export const SYMPTOM_OTHER_FIELDS = ['fatigue', 'blurred_vision', 'slow_healing', 'nausea', 'tingling_hands_feet', 'frequent_infections', 'acanthosis_nigricans', 'irritability', 'recurrent_uti_yeast', 'bed_wetting']
export const SYMPTOM_ALL_FIELDS = [...SYMPTOM_CORE_FIELDS, ...SYMPTOM_OTHER_FIELDS]
export const SAFETY_FIELDS = ['sweating', 'shaking', 'dizziness', 'vomiting', 'abdominal_pain', 'fruity_breath', 'deep_rapid_breathing']
/* Alternative-cause probes: NOT diabetes symptoms — the engine uses them to
   test differential explanations (e.g. thirst without extra urination). */
export const CONTEXT_FIELDS = ['dry_mouth', 'heat_exposure', 'intense_exercise', 'new_medication']
export const RISK_FIELDS = ['family_history', 'obesity', 'hypertension', 'sedentary_lifestyle', 'gestational_history', 'smoking', 'high_cholesterol', 'pcos_history', 'ethnicity_high_risk']

/* i18n group for each boolean field: assessment.fields.<group>.<camelKey> */
export const FIELD_GROUPS = {
  frequent_urination: 'symptoms', excessive_thirst: 'symptoms', weight_loss: 'symptoms',
  fatigue: 'symptoms', blurred_vision: 'symptoms', slow_healing: 'symptoms', nausea: 'symptoms',
  tingling_hands_feet: 'symptoms', frequent_infections: 'symptoms', acanthosis_nigricans: 'symptoms',
  excessive_hunger: 'symptoms', irritability: 'symptoms', recurrent_uti_yeast: 'symptoms', bed_wetting: 'symptoms',
  dry_mouth: 'symptoms', heat_exposure: 'symptoms', intense_exercise: 'symptoms', new_medication: 'symptoms',
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
  nausea: 'Nausea', tingling_hands_feet: 'Tingling hands / feet', frequent_infections: 'Frequent infections',
  acanthosis_nigricans: 'Dark skin patches',
  excessive_hunger: 'Feeling very hungry', irritability: 'Irritability / mood changes',
  recurrent_uti_yeast: 'Recurring UTIs / yeast infections', bed_wetting: 'New bed-wetting (children)',
  dry_mouth: 'Dry mouth', heat_exposure: 'Recent hot weather / heat exposure',
  intense_exercise: 'Intense exercise or heavy physical work', new_medication: 'Started a new medication recently',
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
    when: (f) => f.rapid_onset === false && SYMPTOM_CORE_FIELDS.some((key) => Boolean(f[key])),
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
    id: 'dka-urgent',
    tone: 'urgent',
    when: (f) => Boolean(f.vomiting || f.abdominal_pain),
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
/* DKA-pattern emergency signs — when present, the rest of the interview is
   short-circuited: lab questions are skipped because the recommendation is
   urgent care either way. */
const EMERGENCY_FIELDS = ['vomiting', 'abdominal_pain', 'fruity_breath', 'deep_rapid_breathing']

export function hasEmergencySigns(form) {
  return EMERGENCY_FIELDS.some((key) => form[key] === true)
}

export const INTERVIEW_NODES = [
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
    fields: SYMPTOM_CORE_FIELDS,
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
    /* Onset is the sharpest type discriminator, so it jumps the queue the
       moment a pattern (2+ core symptoms) exists — unless an alternative
       cause already explains the picture. */
    priority: (ctx) => {
      const m = buildEvidenceModel(ctx.form)
      if (m.alternativesExplain) return 18
      return m.coreCount >= 2 ? 11 : 13
    },
    titleKey: 'assessment.interview.onsetTitle',
    titleFallback: 'Did these symptoms come on suddenly?',
    helperKey: 'assessment.interview.onsetHelper',
    helperFallback: 'Sudden onset (days to weeks) points to type 1 diabetes; a slow build-up over months or years points to type 2.',
    applies: ({ form }) => {
      const m = buildEvidenceModel(form)
      return (m.coreCount > 0 || m.otherTrue.length > 0) && !m.alternativesExplain
    },
  },
  {
    /* Differential probe — the engine's "wait, is this even diabetes?" moment.
       Thirst WITHOUT extra urination often has another cause (heat, exertion,
       medication). Answering this decides whether the diabetes work-up
       continues at all or the interview wraps up early. */
    id: 'thirst_alternatives',
    kind: 'multi',
    fields: CONTEXT_FIELDS,
    icon: 'GlassWater',
    priority: (ctx) => (buildEvidenceModel(ctx.form).thirstWithoutUrination ? 11 : 16),
    applies: ({ form }) => {
      const m = buildEvidenceModel(form)
      return m.thirstWithoutUrination && !m.emergency
    },
    titleKey: 'assessment.interview.thirstAltTitle',
    titleFallback: 'Could something else explain the thirst?',
    helperKey: 'assessment.interview.thirstAltHelper',
    helperFallback: 'Thirst without extra urination often has other causes — heat, heavy exercise or a new medication. Your answers tell me where to look next.',
  },
  {
    /* Type 1 in children: the single strongest signal — asked the moment the
       patient is young with classic symptoms. */
    id: 'child_probe',
    kind: 'yesno',
    field: 'bed_wetting',
    icon: 'Baby',
    /* A sudden-onset child is the highest-priority type 1 signal there is. */
    priority: (ctx) => {
      const m = buildEvidenceModel(ctx.form)
      return m.sudden && m.age > 0 && m.age < 18 ? 11 : 14
    },
    titleKey: 'assessment.interview.childProbeTitle',
    titleFallback: 'Any new bed-wetting at night?',
    helperKey: 'assessment.interview.childProbeHelper',
    helperFallback: 'In children, new bed-wetting with extra thirst or urination is the strongest type 1 signal.',
    applies: ({ form }) => {
      const age = Number(form.age)
      return age > 0 && age < 18 && SYMPTOM_CORE_FIELDS.some((key) => Boolean(form[key]))
    },
  },
  {
    /* Slow build-up → the insulin-resistance (type 2) probe is the most
       discriminating next question. */
    id: 't2_probe',
    kind: 'multi',
    fields: ['acanthosis_nigricans', 'slow_healing', 'tingling_hands_feet', 'frequent_infections'],
    icon: 'Contrast',
    priority: (ctx) => (buildEvidenceModel(ctx.form).gradual ? 12 : 14),
    titleKey: 'assessment.interview.t2ProbeTitle',
    titleFallback: 'Any of these insulin-resistance signs?',
    helperKey: 'assessment.interview.t2ProbeHelper',
    helperFallback: 'With a slow build-up, these signs strongly point to the type 2 pattern.',
    applies: ({ form }) => form.rapid_onset === false && SYMPTOM_CORE_FIELDS.some((key) => Boolean(form[key])),
  },
  {
    id: 'symptoms_other',
    kind: 'multi',
    /* Shrink: fields answered by a probe are hidden so nothing is asked twice */
    fields: ({ form }) => SYMPTOM_OTHER_FIELDS.filter((key) => typeof form[key] !== 'boolean'),
    /* The long-tail symptom grid only earns its place when the engine is
       actively working a diabetes pattern — an emergency short-circuits it,
       and a confirmed alternative cause closes it. */
    applies: ({ form }) => {
      const m = buildEvidenceModel(form)
      if (m.emergency || m.alternativesExplain || !m.hasSignal) return false
      return SYMPTOM_OTHER_FIELDS.some((key) => typeof form[key] !== 'boolean')
    },
    icon: 'Stethoscope',
    priority: () => 17,
    titleKey: 'assessment.interview.otherSymptomsTitle',
    titleFallback: 'Any of these as well?',
    helperKey: 'assessment.interview.otherSymptomsHelper',
    helperFallback: 'Select all that apply — or tap "None of these".',
  },
  {
    id: 'warning_signs',
    kind: 'multi',
    fields: SAFETY_FIELDS,
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
    fields: RISK_FIELDS,
    icon: 'ClipboardList',
    /* Emergency pattern → the advice is "seek care now"; and when an
       alternative cause explains the picture, the whole diabetes work-up
       (risks, BMI, labs) de-escalates — the engine stops asking. */
    applies: ({ form }) => {
      const m = buildEvidenceModel(form)
      return !m.emergency && !m.alternativesExplain
    },
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
    /* BMI only feeds the type priors — with no signal to type, or with the
       picture explained by something else, there is nothing for it to change. */
    applies: ({ form }) => {
      const m = buildEvidenceModel(form)
      return m.hasSignal && !m.emergency && !m.alternativesExplain
    },
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
    /* Emergency signs → lab questions are pointless; the advice is go now.
       A confirmed alternative cause also closes the glucose work-up. */
    applies: ({ form }) => {
      const m = buildEvidenceModel(form)
      return !m.emergency && !m.alternativesExplain
    },
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
    applies: ({ form }) => {
      const m = buildEvidenceModel(form)
      return form.no_labs_available !== true && !m.emergency && !m.alternativesExplain
    },
  },
  {
    id: 'extra',
    kind: 'text',
    field: 'extra_symptoms',
    icon: 'PenTool',
    applies: ({ form }) => {
      const m = buildEvidenceModel(form)
      return m.hasSignal && !m.alternativesExplain
    },
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

/* ── The evidence model: the interview's live belief state ──
   ONE declarative function computes what the engine currently "believes"
   from the answers so far. Every node's relevance (priority) and every
   gate (applies) reads from this model, so after each answer the engine
   re-ranks the remaining questions and drops the ones that can no longer
   change the result. No fixed question list, no hardcoded order. */
export function buildEvidenceModel(form) {
  const coreTrue = SYMPTOM_CORE_FIELDS.filter((key) => form[key] === true)
  const otherTrue = SYMPTOM_OTHER_FIELDS.filter((key) => form[key] === true)
  const altTrue = CONTEXT_FIELDS.filter((key) => form[key] === true)
  const emergency = hasEmergencySigns(form)
  const age = Number(form.age) || 0
  const bmi = Number(form.bmi) || 0
  /* Thirst but normal urination — the classic trio is broken, so the
     engine pivots to differential causes before continuing. */
  const thirstWithoutUrination = form.excessive_thirst === true && form.frequent_urination === false
  const anyRisk = RISK_FIELDS.some((key) => form[key] === true)
  const hasSignal = coreTrue.length > 0 || otherTrue.length > 0 || emergency || anyRisk
  /* A second core symptom turns "a symptom" into "a pattern". */
  const glucosePattern = coreTrue.length >= 2
  /* A credible alternative cause (heat, medication, exertion, 2+ markers)
     de-escalates the diabetes work-up when the classic pattern is broken. */
  const alternativesExplain = thirstWithoutUrination && coreTrue.length <= 1 &&
    (altTrue.length >= 2 || form.heat_exposure === true || form.new_medication === true)
  return {
    coreTrue, coreCount: coreTrue.length, otherTrue, altTrue,
    emergency, age, bmi,
    thirstWithoutUrination, anyRisk, hasSignal,
    glucosePattern, alternativesExplain,
    sudden: form.rapid_onset === true,
    gradual: form.rapid_onset === false,
  }
}

/* One-line "what the engine is investigating" chip — makes the adaptive
   selection visible to the user instead of magical. */
export function interviewFocus(ctx) {
  const m = buildEvidenceModel(ctx.form)
  if (m.emergency) return { key: 'assessment.interview.focusUrgent', fallback: 'Warning signs detected — safety first' }
  if (m.alternativesExplain) return { key: 'assessment.interview.focusAlternative', fallback: 'Another cause looks likely — narrowing it down' }
  if (m.glucosePattern && m.sudden) return { key: 'assessment.interview.focusT1', fallback: 'Classic pattern with sudden onset — checking the type 1 profile' }
  if (m.glucosePattern && m.gradual) return { key: 'assessment.interview.focusT2', fallback: 'Classic pattern, slow build-up — checking the type 2 profile' }
  if (m.glucosePattern) return { key: 'assessment.interview.focusGlucose', fallback: 'Glucose-related pattern — telling the types apart' }
  if (m.thirstWithoutUrination) return { key: 'assessment.interview.focusThirst', fallback: 'Thirst without extra urination — checking other causes' }
  return { key: 'assessment.interview.focusBaseline', fallback: 'Building your baseline picture' }
}

/* The loop's exit rule, engine-side: after `answeredId` is confirmed (or
   skipped), these are the questions the engine STILL wants. An empty list
   means the evidence is sufficient — the result can be produced. There is
   no fixed question count anywhere: the interview simply ends when the
   engine runs out of relevant questions. */
export function remainingOpenNodes(nodes, ctx, doneIds, skippedIds, answeredId) {
  return applicableNodes(nodes, ctx)
    .filter((n) => n.id !== answeredId)
    .filter((n) => !isNodeDone(n, ctx, doneIds, skippedIds))
}
