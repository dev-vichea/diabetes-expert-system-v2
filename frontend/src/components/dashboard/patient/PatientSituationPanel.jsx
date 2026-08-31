import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock, ClipboardList, Plus, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLatestFacts, getRelativeCheckAge, getUrgencyLabel, toNumberOrNull } from './patient-dashboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'

export function PatientSituationPanel({ patientResults, latestResult, urgentCount }) {
  const { t } = useLanguage()
  const isUrgent = Boolean(latestResult?.is_urgent)
  const age = toNumberOrNull(getLatestFacts(patientResults).age)
  const chip = 'inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium'

  return (
    <section
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-3xl p-6 text-white shadow-[0_16px_40px_rgba(2,8,23,0.25)] sm:p-7',
        isUrgent ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-red-800' : 'bg-gradient-to-br from-primary-700 via-primary-800 to-sky-800'
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
          {t('patientDashboard.situation.title', 'Your situation')}
        </p>
        <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]', isUrgent ? 'bg-rose-500/30' : 'bg-white/15')}>
          {isUrgent ? <ShieldAlert className="h-3.5 w-3.5" /> : null}
          {latestResult ? getUrgencyLabel(latestResult, t) : t('patientDashboard.status.noResultYet', 'No result yet')}
        </span>
      </div>

      <h2 className="relative mt-4 text-2xl font-bold leading-tight tracking-tight sm:text-[1.7rem]">
        {latestResult?.diagnosis || t('patientDashboard.hero.noDiagnosisYet', 'No diagnosis result yet')}
      </h2>

      <p className="relative mt-2 max-w-xl text-sm leading-6 text-white/85">
        {latestResult
          ? isUrgent
            ? t('patientDashboard.situation.urgent', 'Your latest assessment was flagged for urgent follow-up.')
            : t('patientDashboard.situation.stable', 'Your latest assessment looks stable — keep up routine monitoring.')
          : t('patientDashboard.situation.noResult', "You haven't completed an assessment yet. Start your first one to see your situation here.")}
      </p>

      {isUrgent && latestResult?.urgent_reason ? (
        <p className="relative mt-3 inline-flex rounded-lg bg-black/25 px-2.5 py-1.5 text-xs font-medium">
          {t('patientDashboard.situation.urgentReason', 'Reason: {{reason}}', { reason: latestResult.urgent_reason })}
        </p>
      ) : null}

      <div className="relative mt-auto flex flex-wrap items-center gap-2.5 pt-5">
        <Link
          to="/diagnosis"
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-800 shadow-sm transition hover:bg-white/90"
        >
          <Plus className="h-4 w-4" />
          {t('patientDashboard.situation.newAssessment', 'New assessment')}
        </Link>
        <Link
          to="/my-results"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          {t('patientDashboard.situation.viewResults', 'View my results')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {latestResult ? (
        <div className="relative mt-6 flex flex-wrap items-center gap-2 border-t border-white/15 pt-4">
          <span className={chip}>
            <ClipboardList className="h-3.5 w-3.5" />
            {patientResults.length} {t('patientDashboard.hero.assessments', 'Assessments')}
          </span>
          <span className={chip}>
            <CalendarClock className="h-3.5 w-3.5" />
            {t('patientDashboard.hero.lastCheck', 'Last check')}: {getRelativeCheckAge(latestResult.created_at, t) ?? '—'}
          </span>
          {age !== null ? <span className={chip}>{t('patientDashboard.situation.ageLabel', 'Age')}: {age}</span> : null}
          {urgentCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium">
              {urgentCount} {t('patientDashboard.recentAssessments.urgent', 'Urgent')}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}