import { Link } from 'react-router-dom'
import { Clock3 } from 'lucide-react'
import { EmptyState, LoadingState, SectionCard, StatusBadge } from '@/components/ui'
import { formatDateTime, toPercent } from './patient-dashboard-utils'

export function PatientRecentAssessments({ loading, results }) {
  return (
    <SectionCard
      className="h-full"
      title="Recent Assessments"
      description="Your latest diagnosis outcomes and recommendation summaries."
      actions={<Link to="/my-results" className="btn-secondary px-3 py-1.5 text-xs">See all</Link>}
    >
      {loading ? (
        <LoadingState label="Loading your assessments..." />
      ) : !results.length ? (
        <EmptyState
          title="No assessments yet"
          description="Submit your first assessment to unlock a personal diagnosis history and follow-up guidance."
        />
      ) : (
        <div className="space-y-3">
          {results.slice(0, 5).map((result) => (
            <article
              key={result.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {result.diagnosis || 'Unknown diagnosis'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4" />
                      {formatDateTime(result.created_at)}
                    </span>
                    <span>Confidence {toPercent(result.certainty)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge tone={result.is_urgent ? 'danger' : 'success'}>
                    {result.is_urgent ? 'Urgent' : 'Routine'}
                  </StatusBadge>
                  <Link to={`/diagnosis/result?diagnosis_result_id=${result.id}`} className="btn-secondary px-3 py-1.5 text-xs">
                    Open
                  </Link>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {result.recommendation || 'No recommendation provided.'}
              </p>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
