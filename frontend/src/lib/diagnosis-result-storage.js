export const DIAGNOSIS_RESULT_STORAGE_VERSION = 1

function getUserStorageKey(user) {
  return String(user?.id || user?.sub || user?.email || 'guest')
}

export function getDiagnosisResultStorageKey(user) {
  return `diagnosis-latest-result:v${DIAGNOSIS_RESULT_STORAGE_VERSION}:${getUserStorageKey(user)}`
}

export function saveDiagnosisResultSnapshot({ user, result, context }) {
  if (typeof window === 'undefined') return
  if (!result || typeof result !== 'object') return

  const payload = {
    version: DIAGNOSIS_RESULT_STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    result,
    context: context && typeof context === 'object' ? context : {},
  }

  window.localStorage.setItem(getDiagnosisResultStorageKey(user), JSON.stringify(payload))
}

export function readDiagnosisResultSnapshot(user) {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(getDiagnosisResultStorageKey(user))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== DIAGNOSIS_RESULT_STORAGE_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function clearDiagnosisResultSnapshot(user) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(getDiagnosisResultStorageKey(user))
  window.localStorage.removeItem('diagnosisResultSnapshot')
}

export function clearAssessmentSession(user) {
  if (typeof window === 'undefined') return
  const uKey = getUserStorageKey(user)
  clearDiagnosisResultSnapshot(user)
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i)
      if (
        key &&
        (key.startsWith('diagnosis-assessment-draft:') ||
          key.startsWith('diagnosis-latest-result:') ||
          key === 'diagnosisResultSnapshot') &&
        (key.endsWith(`:${uKey}`) || key === 'diagnosisResultSnapshot')
      ) {
        window.localStorage.removeItem(key)
      }
    }
  } catch (err) {
    console.error('Failed to clear assessment session storage', err)
  }
}
