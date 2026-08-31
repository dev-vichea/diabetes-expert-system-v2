import { Link } from 'react-router-dom'
import { ChevronRight, Clock3, FileCheck2 } from 'lucide-react'
import { EmptyState, SectionCard, StatusBadge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { formatDateTime, toPercent } from './patient-dashboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'

export function CarePlanHistory({ results, t }) {
  const { language } = useLanguage()

  return (
    <SectionCard
      title={t('patientDashboard.carePlanPage.history.title', 'Assessment history')}
      description={t('patientDashboard.carePlanPage.history.description', "Every assessment you've completed, newest first.")}
      actions={
        <Link to="/my-results" className="text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200">
          {t('common.seeAll', 'See all')}
        </Link>
      }
    >
      {!results.length ? (
        <EmptyState
          icon={FileCheck2}
          title={t('patientDashboard.recentAssessments.emptyTitle', 'No assessments yet')}
          description={t('patientDashboard.recentAssessments.emptyDescription', 'Submit your first assessment to unlock a personal diagnosis history and follow-up guidance.')}
        />
      ) : (
        <ol className="relative ml-2 space-y-1 border-l border-slate-200 pl-5 dark:border-slate-800">
          {results.map((result) => (
            <li key={result.id}>
              <Link
                to={`/diagnosis/result?diagnosis_result_id=${result.id}`}
                className="group relative block rounded-xl py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <span
                  className={cn(
                    'absolute -left-[1.72rem] top-[1.2rem] h-2.5 w-2.5 rounded-full ring-4 ring-white transition-colors dark:ring-slate-900',
                    result.is_urgent ? 'bg-rose-500' : 'bg-emerald-500'
                  )}
                />
                <div className="flex items-start justify-between gap-3 pr-2">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-primary-700 dark:text-slate-100 dark:group-hover:text-primary-300">
                      {result.diagnosis || t('patientDashboard.recentAssessments.unknownDiagnosis', 'Unknown diagnosis')}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDateTime(result.created_at, language, t('common.notAvailable', 'N/A'))}
                      </span>
                      <span>
                        {t('patientDashboard.recentAssessments.confidence', 'Confidence')} {toPercent(result.certainty)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {result.is_urgent ? (
                      <StatusBadge size="sm" tone="danger">
                        {t('patientDashboard.recentAssessments.urgent', 'Urgent')}
                      </StatusBadge>
                    ) : null}
                    {result.review_note ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        <FileCheck2 className="h-3 w-3" />
                        {t('patientDashboard.carePlanPage.history.reviewed', 'Doctor reviewed')}
                      </span>
                    ) : null}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 self-center text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary-600 dark:text-slate-600 dark:group-hover:text-primary-300" />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  )
}
