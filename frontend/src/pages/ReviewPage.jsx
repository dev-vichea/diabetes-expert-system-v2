import { useEffect, useState } from 'react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { DataTable, EmptyState, ErrorAlert, FormSection, SectionCard, StatusBadge } from '@/components/ui'

function formatDateTime(value) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString()
}

export function ReviewPage() {
  const [results, setResults] = useState([])
  const [selectedResultId, setSelectedResultId] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [urgentReason, setUrgentReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedResult = results.find((result) => result.id === selectedResultId) || null

  async function loadResults() {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/diagnosis/review?limit=100')
      const loaded = getApiData(response) || []
      setResults(loaded)

      if (selectedResultId && !loaded.some((item) => item.id === selectedResultId)) {
        setSelectedResultId(null)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load diagnosis review list'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [])

  function selectResult(result) {
    setSelectedResultId(result.id)
    setReviewNote(result.review_note || '')
    setIsUrgent(Boolean(result.is_urgent))
    setUrgentReason(result.urgent_reason || '')
  }

  async function saveReview(event) {
    event.preventDefault()
    if (!selectedResultId) return

    if (isUrgent && !urgentReason.trim()) {
      setError('Urgent reason is required when urgent flag is enabled.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await api.patch(`/diagnosis/${selectedResultId}/review`, {
        review_note: reviewNote,
        is_urgent: isUrgent,
        urgent_reason: urgentReason || null,
      })
      await loadResults()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save diagnosis review'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <SectionCard title="Patient Review Queue" description="Select a diagnosis run to annotate and triage urgency.">
        <DataTable
          className="mt-4"
          columns={[
            { key: 'patient', label: 'Patient' },
            { key: 'diagnosis', label: 'Diagnosis' },
            { key: 'certainty', label: 'Certainty' },
            { key: 'urgent', label: 'Urgent' },
            { key: 'by', label: 'By' },
            { key: 'time', label: 'Time' },
          ]}
          loading={loading}
          isEmpty={!results.length}
          loadingMessage="Loading review queue..."
          emptyTitle="No diagnosis results available for review."
        >
          {results.map((result) => (
            <tr
              key={result.id}
              onClick={() => selectResult(result)}
              className={`table-row-hover ${selectedResultId === result.id ? 'table-row-selected' : ''}`}
            >
              <td>{result.patient_name || result.patient_id || 'N/A'}</td>
              <td className="font-semibold text-slate-900">{result.diagnosis}</td>
              <td>{result.certainty}</td>
              <td>
                <StatusBadge tone={result.is_urgent ? 'danger' : 'success'}>
                  {result.is_urgent ? 'Urgent' : 'Normal'}
                </StatusBadge>
              </td>
              <td>{result.diagnosed_by_name || result.diagnosed_by_user_id || 'N/A'}</td>
              <td>{formatDateTime(result.created_at)}</td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>

      <SectionCard title="Review & Annotation">

        {!selectedResult ? (
          <EmptyState className="mt-4" title="No diagnosis selected" description="Select a diagnosis result to annotate and save review feedback." />
        ) : (
          <>
            <FormSection className="mt-4" title="Result Snapshot">
              <div className="space-y-2 text-sm">
                <p><strong>Diagnosis:</strong> {selectedResult.diagnosis}</p>
                <p><strong>Certainty:</strong> {selectedResult.certainty}</p>
                <p><strong>Recommendation:</strong> {selectedResult.recommendation || 'N/A'}</p>
                <p><strong>Urgent Reason:</strong> {selectedResult.urgent_reason || 'N/A'}</p>
              </div>
            </FormSection>

            <form className="mt-4 space-y-3" onSubmit={saveReview}>
              <label className="block">
                <span className="label-text">Review Note</span>
                <textarea className="input-base" rows={4} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <input type="checkbox" checked={isUrgent} onChange={(event) => setIsUrgent(event.target.checked)} />
                Flag as urgent
              </label>

              <label className="block">
                <span className="label-text">Urgent Reason</span>
                <textarea className="input-base" rows={2} value={urgentReason} onChange={(event) => setUrgentReason(event.target.value)} />
              </label>

              <button type="submit" className="btn-primary w-full" disabled={saving}>{saving ? 'Saving...' : 'Save Review'}</button>
            </form>

            <FormSection className="mt-4" title="Triggered Rules">
              {(selectedResult.triggered_rules || []).length ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {(selectedResult.triggered_rules || []).map((rule) => (
                    <li key={rule.id} className="rounded-lg bg-slate-50 px-3 py-2">{rule.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No triggered rules recorded.</p>
              )}
            </FormSection>

            {selectedResult.explanation_trace ? (
              <FormSection className="mt-4 text-sm text-slate-600" title="Explanation Trace">
                <p className="mt-2">Top conclusion: {selectedResult.explanation_trace.confidence_calculation?.top_conclusion || 'N/A'}</p>
                <p>Certainty: {selectedResult.explanation_trace.confidence_calculation?.certainty || 0}</p>
                <p>Iterations: {selectedResult.explanation_trace.inference?.iterations || 0}</p>
              </FormSection>
            ) : null}
          </>
        )}

        <ErrorAlert message={error} className="mt-4" />
      </SectionCard>
    </div>
  )
}
