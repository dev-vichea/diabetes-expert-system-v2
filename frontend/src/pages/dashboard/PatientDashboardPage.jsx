import { useEffect, useMemo, useState } from 'react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { ErrorAlert } from '@/components/ui'
import { PatientCarePanel } from '@/components/dashboard/patient/PatientCarePanel'
import { PatientDashboardHero } from '@/components/dashboard/patient/PatientDashboardHero'
import { PatientHealthSnapshot } from '@/components/dashboard/patient/PatientHealthSnapshot'
import { PatientReportPanel } from '@/components/dashboard/patient/PatientReportPanel'
import { PatientSituationPanel } from '@/components/dashboard/patient/PatientSituationPanel'
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
  const urgentCount = useMemo(() => patientResults.filter((item) => item.is_urgent).length, [patientResults])

  return (
    <div className="space-y-5">
      <PatientDashboardHero user={user} />

      <ErrorAlert message={error} />

      <div className="grid min-w-0 gap-5 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-5">
          <PatientSituationPanel
            patientResults={patientResults}
            latestResult={latestResult}
            urgentCount={urgentCount}
          />
        </div>
        <div className="min-w-0 xl:col-span-7">
          <PatientHealthSnapshot results={patientResults} />
        </div>
      </div>

      <PatientReportPanel results={patientResults} loading={loading} />

      <PatientCarePanel latestResult={latestResult} results={patientResults} />
    </div>
  )
}
