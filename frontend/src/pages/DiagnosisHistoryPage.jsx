import { useEffect, useState } from 'react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { DataTable, EmptyState, ErrorAlert, SectionCard, StatusBadge } from '@/components/ui'

export function DiagnosisHistoryPage() {
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
      setError(getApiErrorMessage(err, 'Failed to load your diagnosis history'))
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
      <SectionCard title="My Results" description="Review diagnosis outcomes, certainty scores, and doctor annotations.">
        <DataTable
          className="mt-4"
          columns={[
            { key: 'diagnosis', label: 'Diagnosis' },
            { key: 'certainty', label: 'Certainty' },
            { key: 'urgent', label: 'Urgent' },
            { key: 'review-note', label: 'Review Note' },
            { key: 'recommendation', label: 'Recommendation' },
            { key: 'time', label: 'Time' },
          ]}
          loading={loading}
          isEmpty={!results.length}
          loadingMessage="Loading diagnosis history..."
          emptyTitle="No diagnosis submissions yet."
        >
          {results.map((result) => (
            <tr key={result.id}>
              <td className="font-semibold text-slate-900">{result.diagnosis}</td>
              <td>{result.certainty}</td>
              <td>
                <StatusBadge tone={result.is_urgent ? 'danger' : 'success'}>
                  {result.is_urgent ? 'Yes' : 'No'}
                </StatusBadge>
              </td>
              <td>{result.review_note || 'N/A'}</td>
              <td>{result.recommendation || 'N/A'}</td>
              <td>{formatDateTime(result.created_at)}</td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>

      <SectionCard title="Latest Explanation">
        {!latest ? (
          <EmptyState className="mt-4" title="No explanation yet" description="Explanation trace will appear after your first assessment." />
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Top Conclusion</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {latest.explanation_trace?.confidence_calculation?.top_conclusion || 'N/A'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Certainty</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{latest.explanation_trace?.confidence_calculation?.certainty ?? 0}</p>
            </div>
          </div>
        )}
      </SectionCard>

      <ErrorAlert message={error} />
    </section>
  )
}
