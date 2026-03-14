import { useEffect, useMemo, useState } from 'react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { ErrorAlert } from '@/components/ui'
import { PatientCarePanel } from '@/components/dashboard/patient/PatientCarePanel'
import { PatientDashboardHero } from '@/components/dashboard/patient/PatientDashboardHero'
import { PatientRecentAssessments } from '@/components/dashboard/patient/PatientRecentAssessments'

export function PatientDashboardPage({ user }) {
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
          setError(getApiErrorMessage(err, 'Failed to load your dashboard data'))
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
  }, [])

  const latestResult = patientResults[0]
  const urgentCount = useMemo(() => patientResults.filter((item) => item.is_urgent).length, [patientResults])

  return (
    <div className="space-y-6">
      <PatientDashboardHero
        user={user}
        patientResults={patientResults}
        latestResult={latestResult}
        urgentCount={urgentCount}
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <PatientRecentAssessments loading={loading} results={patientResults} />
        <PatientCarePanel latestResult={latestResult} />
      </div>

      <ErrorAlert message={error} />
    </div>
  )
}
