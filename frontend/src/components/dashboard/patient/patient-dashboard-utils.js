import { formatDateTime as formatDateTimeInCambodia } from '@/lib/datetime'

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
