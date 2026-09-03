import { CAMBODIA_TIME_ZONE, formatDateTime as formatDateTimeInCambodia, getDateTimeTimestamp } from '@/lib/datetime'

export function formatDateTime(value, language, fallback) {
  return formatDateTimeInCambodia(value, fallback, language)
}

export function toPercent(certainty) {
  const numeric = Number(certainty)
  if (Number.isNaN(numeric)) return 'N/A'
  return numeric <= 1 ? `${Math.round(numeric * 100)}%` : `${Math.round(numeric)}%`
}

export function getUrgencyTone(result) {
  if (!result) return 'neutral'
  return result.is_urgent ? 'danger' : 'success'
}

export function getUrgencyLabel(result, t) {
  if (!result) return t('patientDashboard.status.noResultYet')
  return result.is_urgent ? t('patientDashboard.status.needsAttention') : t('patientDashboard.status.stable')
}

export function buildCareChecklist(latestResult, t) {
  if (!latestResult) {
    return [
      t('patientDashboard.checklist.firstAssessment1'),
      t('patientDashboard.checklist.firstAssessment2'),
      t('patientDashboard.checklist.firstAssessment3'),
    ]
  }

  const items = [
    latestResult.is_urgent
      ? t('patientDashboard.checklist.urgentRecommendation')
      : t('patientDashboard.checklist.routineRecommendation'),
    t('patientDashboard.checklist.compareHistory'),
  ]

  const recommendation = String(latestResult.recommendation || '').toLowerCase()
  if (recommendation.includes('hba1c') || recommendation.includes('fasting glucose') || recommendation.includes('laboratory')) {
    items.push(t('patientDashboard.checklist.prepareLabs'))
  } else {
    items.push(t('patientDashboard.checklist.startWhenChanged'))
  }

  return items
}

export function toPercentValue(certainty) {
  const numeric = Number(certainty)
  if (Number.isNaN(numeric)) return 0
  const percent = numeric <= 1 ? numeric * 100 : numeric
  return Math.min(100, Math.max(0, Math.round(percent)))
}

/** Returns 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' based on the ICT clock. */
export function getGreetingKey(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: CAMBODIA_TIME_ZONE,
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(now)
  )

  if (hour < 12) return 'greetingMorning'
  if (hour < 17) return 'greetingAfternoon'
  return 'greetingEvening'
}

function ictDayNumber(value) {
  // 'en-CA' renders as YYYY-MM-DD, which converts cleanly to a UTC day number.
  const dayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: CAMBODIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value)
  const [year, month, day] = dayKey.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

/** Human-friendly age of the latest assessment: Today / Yesterday / N days ago. */
export function getRelativeCheckAge(value, t) {
  const timestamp = getDateTimeTimestamp(value)
  if (Number.isNaN(timestamp)) return null

  const dayDifference = Math.round((ictDayNumber(new Date()) - ictDayNumber(new Date(timestamp))) / 86400000)

  if (dayDifference <= 0) return t('patientDashboard.hero.lastCheckToday', 'Today')
  if (dayDifference === 1) return t('patientDashboard.hero.lastCheckYesterday', 'Yesterday')
  return t('patientDashboard.hero.lastCheckDaysAgo', '{{count}} days ago', { count: dayDifference })
}

/** Whole days since the given assessment date (null when unknown). */
export function getDaysSinceCheck(value) {
  const timestamp = getDateTimeTimestamp(value)
  if (Number.isNaN(timestamp)) return null
  return Math.max(0, Math.round((ictDayNumber(new Date()) - ictDayNumber(new Date(timestamp))) / 86400000))
}

export function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isNaN(numeric) ? null : numeric
}

export function getLatestFacts(results) {
  const latest = Array.isArray(results) ? results[0] : null
  const facts = latest?.facts
  return facts && typeof facts === 'object' ? facts : {}
}

/** Chronological series of a fact across assessments (first matching key with a value wins). */
export function extractMetricSeries(results, factKeys) {
  const keys = Array.isArray(factKeys) ? factKeys : [factKeys]
  return [...(Array.isArray(results) ? results : [])]
    .reverse()
    .map((result) => {
      const facts = result?.facts || {}
      for (const key of keys) {
        const numeric = toNumberOrNull(facts[key])
        if (numeric !== null) return { value: numeric }
      }
      return null
    })
    .filter(Boolean)
}

// Category cut-offs mirror the assessment form's own ranges (WHO BMI / ADA glucose screening).
export function getBmiCategory(bmi) {
  if (bmi === null) return null
  if (bmi < 18.5) return { id: 'underweight', tone: 'warning' }
  if (bmi < 25) return { id: 'normal', tone: 'success' }
  if (bmi < 30) return { id: 'overweight', tone: 'warning' }
  return { id: 'obese', tone: 'danger' }
}

export function getFastingGlucoseCategory(value) {
  if (value === null) return null
  if (value < 100) return { id: 'normal', tone: 'success' }
  if (value < 126) return { id: 'prediabetes', tone: 'warning' }
  return { id: 'diabetes', tone: 'danger' }
}

export function getA1cCategory(value) {
  if (value === null) return null
  if (value < 5.7) return { id: 'normal', tone: 'success' }
  if (value < 6.5) return { id: 'prediabetes', tone: 'warning' }
  return { id: 'diabetes', tone: 'danger' }
}

// Mirrors the assessment form's symptom pills so labels stay consistent across screens.
export const SYMPTOM_LABELS = [
  ['frequent_urination', 'assessment.fields.symptoms.frequentUrination', 'Frequent urination'],
  ['excessive_thirst', 'assessment.fields.symptoms.excessiveThirst', 'Excessive thirst'],
  ['fatigue', 'assessment.fields.symptoms.fatigue', 'Constant tiredness'],
  ['blurred_vision', 'assessment.fields.symptoms.blurredVision', 'Blurred vision'],
  ['weight_loss', 'assessment.fields.symptoms.weightLoss', 'Unexplained weight loss'],
  ['slow_healing', 'assessment.fields.symptoms.slowHealing', 'Slow wound healing'],
  ['nausea', 'assessment.fields.symptoms.nausea', 'Nausea'],
  ['tingling_hands_feet', 'assessment.fields.symptoms.tinglingHandsFeet', 'Tingling hands / feet'],
  ['frequent_infections', 'assessment.fields.symptoms.frequentInfections', 'Frequent infections'],
  ['acanthosis_nigricans', 'assessment.fields.symptoms.acanthosisNigricans', 'Dark skin patches'],
  ['vomiting', 'assessment.fields.safetySymptoms.vomiting', 'Vomiting'],
  ['abdominal_pain', 'assessment.fields.safetySymptoms.abdominalPain', 'Abdominal pain'],
  ['dizziness', 'assessment.fields.safetySymptoms.dizziness', 'Dizziness'],
  ['sweating', 'assessment.fields.safetySymptoms.sweating', 'Sweating episodes'],
  ['shaking', 'assessment.fields.safetySymptoms.shaking', 'Shaking / tremor'],
]

// Mirrors the assessment form's risk-factor pills.
export const RISK_FACTOR_LABELS = [
  ['family_history', 'assessment.fields.riskFactors.familyHistory', 'Family history'],
  ['obesity', 'assessment.fields.riskFactors.obesity', 'Obesity / overweight'],
  ['hypertension', 'assessment.fields.riskFactors.hypertension', 'High blood pressure'],
  ['sedentary_lifestyle', 'assessment.fields.riskFactors.sedentaryLifestyle', 'Inactive / sedentary'],
  ['gestational_history', 'assessment.fields.riskFactors.gestationalHistory', 'Gestational diabetes history'],
  ['smoking', 'assessment.fields.riskFactors.smoking', 'Current smoker'],
  ['high_cholesterol', 'assessment.fields.riskFactors.highCholesterol', 'High cholesterol'],
  ['pcos_history', 'assessment.fields.riskFactors.pcosHistory', 'PCOS History'],
  ['ethnicity_high_risk', 'assessment.fields.riskFactors.ethnicityHighRisk', 'High-risk ethnicity'],
]

/** Translated labels for the symptoms reported in a result's `facts`. */
export function getReportedSymptomLabels(result, t) {
  const facts = result?.facts && typeof result.facts === 'object' ? result.facts : {}
  return SYMPTOM_LABELS.filter(([key]) => facts[key]).map(([, key, fallback]) => t(key, fallback))
}

/** Translated labels for the risk factors recorded in a result's `facts`. */
export function getRiskFactorLabels(result, t) {
  const facts = result?.facts && typeof result.facts === 'object' ? result.facts : {}
  return RISK_FACTOR_LABELS.filter(([key]) => facts[key]).map(([, key, fallback]) => t(key, fallback))
}

/**
 * Picks the plain-language "Understanding your result" education key from the
 * inference trace's top conclusion (with a keyword fallback on the diagnosis text).
 * Returns a suffix of `patientDashboard.carePlan.<key>`.
 */
export function getUnderstandingKey(result) {
  const conclusion = String(result?.explanation_trace?.confidence_calculation?.top_conclusion || '')
  const text = `${conclusion} ${String(result?.diagnosis || '')}`.toLowerCase()
  if (text.includes('gestational')) return 'understandingGestational'
  if (text.includes('mixed')) return 'understandingMixed'
  if (text.includes('type 1') || text.includes('type_1') || text.includes('type1') || text.includes('lada')) return 'understandingType1'
  if (text.includes('prediabetes') || text.includes('pre-diabetes') || text.includes('borderline')) return 'understandingPrediabetes'
  if (text.includes('confirmed')) return 'understandingConfirmed'
  if (text.includes('no strong') || text.includes('no signs') || text.includes('no evidence') || text.includes('negative') || text.includes('no indication') || text.includes('low risk')) return 'understandingLowRisk'
  if (text.includes('possible') || text.includes('signs') || text.includes('suspected') || text.includes('likely') || text.includes('pattern') || text.includes('probability')) return 'understandingPossible'
  return 'understandingFallback'
}

function ictMonthKey(value) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CAMBODIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).format(new Date(getDateTimeTimestamp(value)))
}

/**
 * Assessments-per-month buckets for the last `months` months (oldest → newest).
 * Returns [{ key: '2026-04', label: 'Apr', count: 2 }] — labels localised via `language`.
 */
export function buildMonthlyActivity(results, language = 'en', months = 6) {
  const locale = language === 'km' ? 'km-KH' : 'en-US'
  const now = new Date()
  const buckets = []
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit' }).format(date)
    const label = new Intl.DateTimeFormat(locale, { month: 'short' }).format(date)
    buckets.push({ key, label, count: 0 })
  }

  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))
  for (const result of Array.isArray(results) ? results : []) {
    if (!result?.created_at) continue
    const bucket = byKey.get(ictMonthKey(result.created_at))
    if (bucket) bucket.count += 1
  }

  return buckets
}

/** Chronological confidence series: [{ label: '#1', value: 42, urgent: false }] (oldest → newest). */
export function buildConfidenceSeries(results) {
  return (Array.isArray(results) ? [...results] : [])
    .reverse()
    .map((result, index) => ({
      label: `#${index + 1}`,
      value: toPercentValue(result?.certainty),
      urgent: Boolean(result?.is_urgent),
    }))
    .filter((point) => point.value > 0 || point.urgent)
}
