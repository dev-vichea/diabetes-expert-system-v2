import { Link } from 'react-router-dom'
import { ArrowUpRight, ClipboardList, HeartPulse, ShieldAlert, Sparkles } from 'lucide-react'
import { StatCard, StatusBadge } from '@/components/ui'
import { getUrgencyLabel, getUrgencyTone, toPercent } from './patient-dashboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'

export function PatientDashboardHero({ user, patientResults, latestResult, urgentCount }) {
  const { t } = useLanguage()

  return (
    <section className="surface overflow-hidden p-0">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.08),_transparent_22%)]" />
        <div className="relative grid gap-6 p-6 sm:p-8 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {t('patientDashboard.hero.eyebrow')}
              </p>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
                  {t('patientDashboard.hero.welcomeBack', {
                    name: user?.name || t('patientDashboard.hero.fallbackName'),
                  })}
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                  {t('patientDashboard.hero.description')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/diagnosis" className="btn-primary">{t('patientDashboard.hero.startAssessment')}</Link>
              <Link to="/my-results" className="btn-secondary">{t('patientDashboard.hero.viewHistory')}</Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <StatCard
                label={t('patientDashboard.hero.assessments')}
                value={patientResults.length}
                hint={t('patientDashboard.hero.assessmentsHint')}
                icon={ClipboardList}
                className="border border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/40"
              />
              <StatCard
                label={t('patientDashboard.hero.latestConfidence')}
                value={latestResult ? toPercent(latestResult.certainty) : t('common.notAvailable')}
                hint={latestResult?.diagnosis || t('patientDashboard.hero.latestConfidenceHintFallback')}
                icon={HeartPulse}
                className="border border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/40"
              />
              <article className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{t('patientDashboard.hero.urgentFollowUp')}</p>
                  <ShieldAlert className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{urgentCount}</p>
                <div className="mt-2">
                  <StatusBadge tone={getUrgencyTone(latestResult)}>
                    {getUrgencyLabel(latestResult, t)}
                  </StatusBadge>
                </div>
              </article>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {t('patientDashboard.hero.latestSnapshot')}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
                  {latestResult?.diagnosis || t('patientDashboard.hero.noDiagnosisYet')}
                </h3>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                <Sparkles className="h-5 w-5" />
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {latestResult?.review_note
                || latestResult?.recommendation
                || t('patientDashboard.hero.snapshotFallback')}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <StatusBadge tone={getUrgencyTone(latestResult)}>
                {getUrgencyLabel(latestResult, t)}
              </StatusBadge>
              {latestResult?.id ? (
                <Link
                  to={`/diagnosis/result?diagnosis_result_id=${latestResult.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 dark:text-primary-300"
                >
                  {t('patientDashboard.hero.openFullResult')}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
