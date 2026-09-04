import { Droplets, Flame, FlaskConical, Footprints, Gauge, HeartPulse, ListChecks, Salad, ShieldAlert, Siren, Stethoscope, Syringe, TrendingDown } from 'lucide-react'
import { SYMPTOM_LABELS, getLatestFacts, toNumberOrNull } from './patient-dashboard-utils'

const CLASSIC_SYMPTOMS = [
  'frequent_urination', 'excessive_thirst', 'fatigue', 'blurred_vision', 'weight_loss',
  'slow_healing', 'nausea', 'tingling_hands_feet', 'frequent_infections', 'acanthosis_nigricans',
]
const CRISIS_SYMPTOMS = ['vomiting', 'abdominal_pain', 'rapid_breathing', 'unable_to_keep_fluids', 'crisis']
const HYPO_SYMPTOMS = ['shaking', 'sweating', 'dizziness', 'hypo_confusion', 'hypo_palpitations', 'hypo_improves_with_sugar']

const NS = 'patientDashboard.recommendations'

function symptomNames(keys, t) {
  return keys
    .slice(0, 3)
    .map((key) => {
      const entry = SYMPTOM_LABELS.find(([code]) => code === key)
      return entry ? t(entry[1], entry[2]) : key.replaceAll('_', ' ')
    })
    .join(', ')
}

/**
 * Rule-based recommendation engine — derives personalised advice automatically
 * from whatever the latest assessment contains (labs, BMI, symptoms, flags).
 * Priority: 1 = act now, 2 = this week, 3 = daily habit.
 */
export function buildAutoRecommendations({ latestResult, results = [], t, daysSinceLastCheck }) {
  if (!latestResult) return []

  const facts = getLatestFacts([latestResult])
  const flag = (key) => Boolean(facts[key])
  const num = (key) => toNumberOrNull(facts[key])

  const recs = []
  const push = (id, priority, icon, titleKey, textKey, textParams, basisKey, basisParams) => {
    recs.push({
      id,
      priority,
      icon,
      title: t(`${NS}.${titleKey}`),
      text: t(`${NS}.${textKey}`, textParams),
      basis: basisKey ? t(`${NS}.${basisKey}`, basisParams) : null,
    })
  }

  const activeCrisis = CRISIS_SYMPTOMS.filter(flag)
  const activeHypo = HYPO_SYMPTOMS.filter(flag)
  const activeClassic = CLASSIC_SYMPTOMS.filter(flag)
  const fasting = num('fasting_glucose')
  const randomGlucose = num('random_plasma_glucose')
  const ogtt = num('ogtt_2h')
  const a1c = num('hba1c')
  const bmi = num('bmi')
  const anyLab = fasting !== null || randomGlucose !== null || ogtt !== null || a1c !== null

  /* ---- Priority 1 · act now ---- */
  if (latestResult.is_urgent) {
    push('urgentFollowUp', 1, ShieldAlert, 'urgentFollowUpTitle', 'urgentFollowUpText', null, 'basisUrgentFlag')
  }
  if (activeCrisis.length) {
    push('crisisSigns', 1, Siren, 'crisisSignsTitle', 'crisisSignsText', { symptoms: symptomNames(activeCrisis, t) }, 'basisSymptoms', { symptoms: symptomNames(activeCrisis, t) })
  }
  if (activeHypo.length) {
    push('hypoSigns', 1, Gauge, 'hypoSignsTitle', 'hypoSignsText', null, 'basisSymptoms', { symptoms: symptomNames(activeHypo, t) })
  }
  if (fasting !== null && fasting >= 180) {
    push('veryHighGlucose', 1, Droplets, 'veryHighGlucoseTitle', 'veryHighGlucoseText', { value: Math.round(fasting) }, 'basisGlucose', { value: Math.round(fasting) })
  }

  /* ---- Priority 2 · this week ---- */
  if (!anyLab) {
    push('missingLabs', 2, FlaskConical, 'missingLabsTitle', 'missingLabsText', null, 'basisNoLabs')
  } else if (fasting !== null && fasting >= 126 && fasting < 180) {
    push('diabetesRangeGlucose', 2, Stethoscope, 'diabetesRangeGlucoseTitle', 'diabetesRangeGlucoseText', { value: Math.round(fasting) }, 'basisGlucose', { value: Math.round(fasting) })
  }
  if (fasting !== null && fasting >= 100 && fasting < 126) {
    push('prediabetesGlucose', 2, TrendingDown, 'prediabetesGlucoseTitle', 'prediabetesGlucoseText', { value: Math.round(fasting) }, 'basisGlucose', { value: Math.round(fasting) })
  }
  if (a1c !== null && a1c >= 5.7) {
    push('a1cElevated', 2, FlaskConical, 'a1cElevatedTitle', 'a1cElevatedText', { value: a1c.toFixed(1) }, 'basisHba1c', { value: a1c.toFixed(1) })
  }
  if ((bmi !== null && bmi >= 25) || flag('obesity')) {
    push('weightManagement', 2, TrendingDown, 'weightManagementTitle', 'weightManagementText', { value: bmi !== null ? bmi.toFixed(1) : '' }, 'basisBmi', { value: bmi !== null ? bmi.toFixed(1) : '' })
  } else if (bmi !== null && bmi < 18.5) {
    push('underweight', 2, Salad, 'underweightTitle', 'underweightText', { value: bmi.toFixed(1) }, 'basisBmi', { value: bmi.toFixed(1) })
  }
  if (activeClassic.length >= 2) {
    push('symptomDiary', 2, ListChecks, 'symptomDiaryTitle', 'symptomDiaryText', { count: activeClassic.length, symptoms: symptomNames(activeClassic, t) }, 'basisSymptoms', { symptoms: symptomNames(activeClassic, t) })
  }
  if (flag('smoking')) {
    push('quitSmoking', 2, Flame, 'quitSmokingTitle', 'quitSmokingText', null, 'basisSmoking')
  }
  if (Number.isFinite(daysSinceLastCheck) && daysSinceLastCheck >= 14) {
    push('reassessSoon', 2, Syringe, 'reassessSoonTitle', 'reassessSoonText', { days: daysSinceLastCheck }, 'basisLastCheck', { days: daysSinceLastCheck })
  }

  /* ---- Priority 3 · habits ---- */
  if (flag('hypertension')) {
    push('bpMonitor', 3, HeartPulse, 'bpMonitorTitle', 'bpMonitorText', null, 'basisHypertension')
  }
  if (flag('family_history') || flag('ethnicity_high_risk') || flag('gestational_history') || flag('pcos_history')) {
    push('yearlyScreening', 3, Stethoscope, 'yearlyScreeningTitle', 'yearlyScreeningText', null, 'basisRiskFactor')
  }
  if (results.length < 3) {
    push('buildHistory', 3, ListChecks, 'buildHistoryTitle', 'buildHistoryText', { count: results.length }, 'basisAssessmentCount', { count: results.length })
  }
  if (flag('sedentary_lifestyle')) {
    push('stayActive', 3, Footprints, 'stayActiveTitle', 'stayActiveText', null, 'basisRiskFactor')
  }
  push('balancedDiet', 3, Salad, 'balancedDietTitle', 'balancedDietText', null, 'basisDietGuidelines')

  recs.sort((a, b) => a.priority - b.priority)
  return recs
}
