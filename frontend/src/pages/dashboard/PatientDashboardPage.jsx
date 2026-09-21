import { useEffect, useState } from 'react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { ErrorAlert } from '@/components/ui'
import { PatientGlucoseTrend } from '@/components/dashboard/patient/PatientGlucoseTrend'
import { PatientHealthSnapshot } from '@/components/dashboard/patient/PatientHealthSnapshot'
import { PatientTodayCarePlan } from '@/components/dashboard/patient/PatientTodayCarePlan'
import { PatientUnifiedHeroBar } from '@/components/dashboard/patient/PatientUnifiedHeroBar'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'

export function PatientDashboardPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [patientResults, setPatientResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadPatientResults() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get('/diagnosis/mine')
        if (!cancelled) {
          setPatientResults(getApiData(response) || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('patientDashboard.errors.loadFailed')))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPatientResults()
    return () => {
      cancelled = true
    }
  }, [t])

  const latestResult = patientResults[0]

  return (
    <div className="space-y-6 pb-8">
      {/* SECTION 1: Unified Hero Status Bar (Full Width) */}
      <PatientUnifiedHeroBar user={user} latestResult={latestResult} />

      <ErrorAlert message={error} />

      {/* SECTION 2: Key Vitals Snapshot (Full-Width 3-Column Grid) */}
      <PatientHealthSnapshot results={patientResults} />

      {/* SECTION 3: 7-Day Glucose Trend Visualization (Full Width) */}
      <PatientGlucoseTrend results={patientResults} />

      {/* SECTION 4: Today's Habits & Care Plan Checklist (Full Width) */}
      <PatientTodayCarePlan latestResult={latestResult} />
    </div>
  )
}
