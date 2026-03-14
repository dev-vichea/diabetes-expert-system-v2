export function formatDateTime(value) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString()
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

export function getUrgencyLabel(result) {
  if (!result) return 'No result yet'
  return result.is_urgent ? 'Needs attention' : 'Stable'
}

export function buildCareChecklist(latestResult) {
  if (!latestResult) {
    return [
      'Complete your first assessment to generate a diagnosis summary.',
      'Keep recent lab values nearby before you start the questionnaire.',
      'Return to the dashboard to track future result changes.',
    ]
  }

  const items = [
    latestResult.is_urgent
      ? 'Follow the urgent advice from your latest result as soon as possible.'
      : 'Follow the latest recommendation from your most recent result.',
    'Use your result history to compare changes in confidence and diagnosis over time.',
  ]

  const recommendation = String(latestResult.recommendation || '').toLowerCase()
  if (recommendation.includes('hba1c') || recommendation.includes('fasting glucose') || recommendation.includes('laboratory')) {
    items.push('Prepare missing lab tests before your next assessment to improve certainty.')
  } else {
    items.push('Start a new assessment whenever symptoms, labs, or medication status changes.')
  }

  return items
}
