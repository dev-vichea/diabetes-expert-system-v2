import { useEffect, useState } from 'react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { DataTable, EmptyState, ErrorAlert, SectionCard, StatusBadge } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'

export function DiagnosisHistoryPage() {
  const { t, language } = useLanguage()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadResults() {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/diagnosis/mine')
      setResults(getApiData(response) || [])
    } catch (err) {
      setError(getApiErrorMessage(err, t('myResults.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [])

  const latest = results[0]

  return (
    <section className="space-y-5">
      <SectionCard title={t('myResults.title')} description={t('myResults.description')}>
        <DataTable
          className="mt-4"
          columns={[
            { key: 'diagnosis', label: t('myResults.columns.diagnosis') },
            { key: 'certainty', label: t('myResults.columns.certainty') },
            { key: 'urgent', label: t('myResults.columns.urgent') },
            { key: 'review-note', label: t('myResults.columns.reviewNote') },
            { key: 'recommendation', label: t('myResults.columns.recommendation') },
            { key: 'time', label: t('myResults.columns.time') },
          ]}
          loading={loading}
          isEmpty={!results.length}
          loadingMessage={t('myResults.loading')}
          emptyTitle={t('myResults.emptyTitle')}
        >
          {results.map((result) => (
            <tr key={result.id}>
              <td className="font-semibold text-slate-900">{result.diagnosis}</td>
              <td>{result.certainty}</td>
              <td>
                <StatusBadge tone={result.is_urgent ? 'danger' : 'success'}>
                  {result.is_urgent ? t('common.yes') : t('common.notAvailable')}
                </StatusBadge>
              </td>
              <td>{result.review_note || t('common.notAvailable')}</td>
              <td>{result.recommendation || t('common.notAvailable')}</td>
              <td>{formatDateTime(result.created_at, language, t('common.notAvailable'))}</td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>

      <SectionCard title={t('myResults.latestExplanation')}>
        {!latest ? (
          <EmptyState className="mt-4" title={t('myResults.noExplanationTitle')} description={t('myResults.noExplanationDesc')} />
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{t('myResults.topConclusion')}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {latest.explanation_trace?.confidence_calculation?.top_conclusion || t('common.notAvailable')}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{t('myResults.columns.certainty')}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{latest.explanation_trace?.confidence_calculation?.certainty ?? 0}</p>
            </div>
          </div>
        )}
      </SectionCard>

      <ErrorAlert message={error} />
    </section>
  )
}
