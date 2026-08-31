import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Stethoscope } from 'lucide-react'
import { EmptyState, SectionCard, StatusBadge } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  formatDateTime,
  getDaysSinceCheck,
  getReportedSymptomLabels,
  getUrgencyLabel,
  getUrgencyTone,
  toPercentValue,
} from './patient-dashboard-utils'
import { buildAutoRecommendations } from './patient-recommendations'
import { PatientRecommendations } from './PatientRecommendations'
import { useLanguage } from '@/contexts/LanguageContext'

const panelBox = 'rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/30'
const eyebrow = 'flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400'

function ConfidenceBar({ percent, t }) {
  if (percent <= 0) return null
  const tone = percent >= 85 ? 'bg-rose-500' : percent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
        <span>{t('patientDashboard.carePlan.confidence', 'Confidence')}</span>
        <span>{percent}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export function PatientCarePanel({ latestResult, results = [] }) {
  const { language, t } = useLanguage()
  const confidencePercent = toPercentValue(latestResult?.certainty)
  const reportedSymptoms = latestResult ? getReportedSymptomLabels(latestResult, t) : []
  const recommendations = latestResult
    ? buildAutoRecommendations({ latestResult, results, t, daysSinceLastCheck: getDaysSinceCheck(latestResult.created_at) })
    : []

  return (
    <SectionCard
      title={t('patientDashboard.carePlan.title', 'Care Plan')}
      description={t('patientDashboard.carePlan.description', 'What matters most after your latest assessment.')}
      actions={
        <Link
          to="/care-plan"
          className="inline-flex min-h-9 items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          {t('patientDashboard.carePlan.openFull', 'Open care plan')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      {!latestResult ? (
        <EmptyState
          title={t('patientDashboard.carePlan.emptyTitle', 'No latest summary yet')}
          description={t('patientDashboard.carePlan.emptyDescription', 'Once you complete an assessment, your most recent diagnosis and follow-up plan will appear here.')}
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          {/* Column 1 — latest summary + priority */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className={panelBox}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={eyebrow}>{t('patientDashboard.carePlan.latestSummary', 'Latest Summary')}</p>
                <StatusBadge tone={getUrgencyTone(latestResult)} size="sm">
                  {getUrgencyLabel(latestResult, t)}
                </StatusBadge>
              </div>
              <p className="mt-2 text-lg font-bold leading-snug tracking-tight text-slate-950 dark:text-slate-50">
                {latestResult.diagnosis || t('patientDashboard.carePlan.noDiagnosisAvailable', 'No diagnosis available')}
              </p>
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                {formatDateTime(latestResult.created_at, language, t('common.notAvailable', 'N/A'))}
              </p>
              <ConfidenceBar percent={confidencePercent} t={t} />
            </div>

            <div
              className={cn(
                'flex items-start gap-3 rounded-2xl border p-4',
                latestResult.is_urgent
                  ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/20'
                  : 'border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40'
              )}
            >
              <AlertTriangle
                className={cn(
                  'mt-0.5 h-5 w-5 shrink-0',
                  latestResult.is_urgent ? 'text-rose-600 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'
                )}
              />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t('patientDashboard.carePlan.currentPriority', 'Current priority')}
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  {latestResult.is_urgent
                    ? t('patientDashboard.carePlan.urgentPriorityText', 'Your latest result includes an urgent flag. Follow the recommendation promptly and contact a clinician if symptoms are getting worse.')
                    : t('patientDashboard.carePlan.routinePriorityText', 'Your latest result does not show an urgent flag. Continue with the recommended follow-up and monitor any symptom changes.')}
                </p>
              </div>
            </div>
          </div>
          {/* Column 2 — doctor's note */}
          <div className={cn(panelBox, 'min-w-0')}>
            <p className={eyebrow}>
              <Stethoscope className="h-3.5 w-3.5" />
              {t('patientDashboard.carePlan.reviewNote', 'Review Note')}
            </p>
            {latestResult.review_note ? (
              <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">{latestResult.review_note}</p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-400 dark:text-slate-500">
                {t('patientDashboard.carePlanPage.doctorNote.empty', 'No note from your doctor yet — notes appear here after a clinician reviews your result.')}
              </p>
            )}
          </div>

          {/* Column 3 — auto recommendations + symptoms */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className={panelBox}>
              <PatientRecommendations recommendations={recommendations} t={t} variant="compact" max={3} />
            </div>

            <div className={panelBox}>
              <p className={eyebrow}>{t('patientDashboard.carePlan.reportedSymptoms', 'Symptoms you reported')}</p>
              {reportedSymptoms.length ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {reportedSymptoms.slice(0, 6).map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
                    >
                      {label}
                    </span>
                  ))}
                  {reportedSymptoms.length > 6 ? (
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                      {t('patientDashboard.carePlan.moreSymptoms', '+{{count}} more', { count: reportedSymptoms.length - 6 })}
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {t('patientDashboard.carePlan.noSymptoms', 'No symptoms reported in your latest assessment.')}
                </p>
              )}
            </div>
          </div>

        </div>
      )}
    </SectionCard>
  )
}
