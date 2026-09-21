import { useEffect, useMemo, useState } from 'react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { ErrorAlert } from '@/components/ui'
import { PatientDashboardHero } from '@/components/dashboard/patient/PatientDashboardHero'
import { PatientGlucoseTrend } from '@/components/dashboard/patient/PatientGlucoseTrend'
import { PatientHealthSnapshot } from '@/components/dashboard/patient/PatientHealthSnapshot'
import { PatientSituationPanel } from '@/components/dashboard/patient/PatientSituationPanel'
import { PatientTodayCarePlan } from '@/components/dashboard/patient/PatientTodayCarePlan'
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
    <div className="space-y-6">
      {/* 1. Greeting & Hero Header */}
      <PatientDashboardHero user={user} />

      <ErrorAlert message={error} />

      {/* 2. Top Row: Status Alert Card (Left) + Health Vitals Snapshot (Right) */}
      <div className="grid min-w-0 gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-5">
          <PatientSituationPanel
            latestResult={latestResult}
            patientResults={patientResults}
          />
        </div>
        <div className="min-w-0 xl:col-span-7">
          <PatientHealthSnapshot results={patientResults} />
        </div>
      </div>

      {/* 3. Lower Row (2-Column Layout): Today's Care Plan (Left) + 7-Day Glucose Trend (Right) */}
      <div className="grid min-w-0 gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-5">
          <PatientTodayCarePlan latestResult={latestResult} />
        </div>
        <div className="min-w-0 xl:col-span-7">
          <PatientGlucoseTrend results={patientResults} />
        </div>
      </div>
    </div>
  )
}
