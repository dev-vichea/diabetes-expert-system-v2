import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ClipboardPlus,
  ClipboardList,
  Plus,
  ShieldAlert,
  Siren,
  Stethoscope,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { ErrorAlert, LoadingState, StatusBadge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { CarePlanChecklist } from '@/components/dashboard/patient/CarePlanChecklist'
import { CarePlanHistory } from '@/components/dashboard/patient/CarePlanHistory'
import { CarePlanWatchlist } from '@/components/dashboard/patient/CarePlanWatchlist'
import { PatientRecommendations } from '@/components/dashboard/patient/PatientRecommendations'
import { buildAutoRecommendations } from '@/components/dashboard/patient/patient-recommendations'
import {
  buildCareChecklist,
  getDaysSinceCheck,
  getLatestFacts,
  getRelativeCheckAge,
  getReportedSymptomLabels,
  getUrgencyLabel,
  toNumberOrNull,
  toPercentValue,
} from '@/components/dashboard/patient/patient-dashboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'

const SAFETY_ITEM_KEYS = [1, 2, 3, 4, 5].map((n) => `patientDashboard.carePlanPage.safety.item${n}`)

const chipClass = 'inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium'

function OnboardingState({ t }) {
  const steps = [
    { title: t('patientDashboard.carePlanPage.onboarding.step1', 'Complete a health assessment'), text: t('patientDashboard.carePlanPage.onboarding.step1Text') },
    { title: t('patientDashboard.carePlanPage.onboarding.step2', 'Get your instant result'), text: t('patientDashboard.carePlanPage.onboarding.step2Text') },
    { title: t('patientDashboard.carePlanPage.onboarding.step3', 'Follow your personal plan'), text: t('patientDashboard.carePlanPage.onboarding.step3Text') },
  ]

  return (
    <section className="surface mx-auto flex max-w-2xl flex-col items-center p-6 text-center sm:p-10">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
        <ClipboardPlus className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
        {t('patientDashboard.carePlanPage.onboarding.title', "Let's build your care plan")}
      </h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
        {t('patientDashboard.carePlanPage.onboarding.description', 'Three quick steps and everything below fills in with your own results.')}
      </p>

      <ol className="mt-8 w-full space-y-4 text-left">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{step.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <Link
        to="/diagnosis"
        className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
      >
        <Plus className="h-4 w-4" />
        {t('patientDashboard.carePlanPage.onboarding.cta', 'Start my first assessment')}
      </Link>
    </section>
  )
}

function DoctorNoteCard({ latestResult, t }) {
  const isUrgent = Boolean(latestResult?.is_urgent)

  return (
    <section className="surface min-w-0 p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
          <Stethoscope className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="section-title">{t('patientDashboard.carePlanPage.doctorNote.title', "Doctor's note")}</h2>
        {latestResult.review_note ? (
          <StatusBadge tone="primary" size="sm" className="ml-auto">
            {t('patientDashboard.carePlanPage.history.reviewed', 'Doctor reviewed')}
          </StatusBadge>
        ) : null}
      </div>

      {latestResult.review_note ? (
        <p className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300">
          {latestResult.review_note}
        </p>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t('patientDashboard.carePlanPage.doctorNote.empty', 'No note from your doctor yet — notes appear here after a clinician reviews your result.')}
        </p>
      )}

      {/* Current priority */}
      <div
        className={cn(
          'mt-4 flex items-start gap-3 rounded-2xl border p-4',
          isUrgent
            ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/20'
            : 'border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40'
        )}
      >
        <AlertTriangle
          className={cn('mt-0.5 h-5 w-5 shrink-0', isUrgent ? 'text-rose-600 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400')}
        />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t('patientDashboard.carePlan.currentPriority', 'Current priority')}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {isUrgent
              ? t('patientDashboard.carePlan.urgentPriorityText')
              : t('patientDashboard.carePlan.routinePriorityText')}
          </p>
          {isUrgent && latestResult.urgent_reason ? (
            <p className="mt-2 text-xs font-medium text-rose-700 dark:text-rose-300">
              {t('patientDashboard.situation.urgentReason', 'Reason: {{reason}}', { reason: latestResult.urgent_reason })}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function SymptomsCard({ symptoms, t }) {
  return (
    <section className="surface min-w-0 p-4 sm:p-6">
      <h2 className="section-title">{t('patientDashboard.carePlanPage.symptoms.title', 'Symptoms from your latest assessment')}</h2>
      {symptoms.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {symptoms.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
            >
              {label}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {t('patientDashboard.carePlan.noSymptoms', 'No symptoms reported in your latest assessment.')}
        </p>
      )}
    </section>
  )
}

function SafetyCard({ t }) {
  return (
    <section className="min-w-0 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900/50 dark:bg-rose-950/20 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
          <Siren className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-sm font-bold text-rose-800 dark:text-rose-200">
          {t('patientDashboard.carePlanPage.safety.title', 'Seek care urgently if')}
        </h2>
      </div>
      <ul className="mt-3 space-y-2.5">
        {SAFETY_ITEM_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span className="text-xs leading-5 text-rose-900/90 dark:text-rose-200/90">{t(key)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-rose-200/70 pt-3 text-[11px] leading-4 text-rose-700/80 dark:border-rose-900/50 dark:text-rose-300/80">
        {t('patientDashboard.carePlanPage.safety.footnote', "This list doesn't replace medical advice. In an emergency, call your local emergency number.")}
      </p>
    </section>
  )
}

export function CarePlanPage() {
  const { t } = useLanguage()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadResults() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get('/diagnosis/mine')
        if (!cancelled) {
          setResults(getApiData(response) || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('patientDashboard.carePlanPage.loadFailed')))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadResults()
    return () => {
      cancelled = true
    }
  }, [t])

  if (loading) {
    return <LoadingState label={t('patientDashboard.carePlanPage.loading', 'Loading your care plan...')} className="py-16" />
  }

  const latestResult = results[0]
  const urgentCount = results.filter((item) => item.is_urgent).length
  const recommendations = latestResult
    ? buildAutoRecommendations({ latestResult, results, t, daysSinceLastCheck: getDaysSinceCheck(latestResult.created_at) })
    : []

  return (
    <div className="space-y-5">
      <ErrorAlert message={error} />

      {!latestResult ? (
        <OnboardingState t={t} />
      ) : (
        <>
          <CareHero latestResult={latestResult} resultCount={results.length} urgentCount={urgentCount} t={t} />

          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* Main column */}
            <div className="flex min-w-0 flex-col gap-5">
              <CarePlanChecklist
                items={buildCareChecklist(latestResult, t)}
                resultId={latestResult.id}
                t={t}
              />
              <PatientRecommendations recommendations={recommendations} t={t} variant="full" />
              <DoctorNoteCard latestResult={latestResult} t={t} />
              <SymptomsCard symptoms={getReportedSymptomLabels(latestResult, t)} t={t} />
              <CarePlanHistory results={results} t={t} />
            </div>

            {/* Side column */}
            <div className="flex min-w-0 flex-col gap-5">
              <CarePlanWatchlist results={results} t={t} />
              <SafetyCard t={t} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}


function CareHero({ latestResult, resultCount, urgentCount, t }) {
  const isUrgent = Boolean(latestResult?.is_urgent)
  const facts = getLatestFacts([latestResult])
  const age = toNumberOrNull(facts.age)
  const confidence = toPercentValue(latestResult?.certainty)

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl p-6 text-white shadow-[0_16px_40px_rgba(2,8,23,0.25)] sm:p-7',
        isUrgent ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-red-800' : 'bg-gradient-to-br from-primary-700 via-primary-800 to-sky-800'
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
          {t('patientDashboard.carePlanPage.hero.eyebrow', 'Your care plan')}
        </p>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
            isUrgent ? 'bg-rose-500/30' : 'bg-white/15'
          )}
        >
          {isUrgent ? <ShieldAlert className="h-3.5 w-3.5" /> : null}
          {getUrgencyLabel(latestResult, t)}
        </span>
      </div>

      <h1 className="relative mt-4 text-2xl font-bold leading-tight tracking-tight sm:text-[1.7rem]">
        {latestResult.diagnosis || t('patientDashboard.hero.noDiagnosisYet', 'No diagnosis result yet')}
      </h1>

      <p className="relative mt-2 max-w-xl text-sm leading-6 text-white/85">
        {isUrgent
          ? t('patientDashboard.situation.urgent', 'Your latest assessment was flagged for urgent follow-up.')
          : t('patientDashboard.carePlan.description', 'What matters most after your latest assessment.')}
      </p>

      {isUrgent && latestResult.urgent_reason ? (
        <p className="relative mt-3 inline-flex rounded-lg bg-black/25 px-2.5 py-1.5 text-xs font-medium">
          {t('patientDashboard.situation.urgentReason', 'Reason: {{reason}}', { reason: latestResult.urgent_reason })}
        </p>
      ) : null}

      <div className="relative mt-5 flex flex-wrap items-center gap-2.5">
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

      <div className="relative mt-6 flex flex-wrap items-center gap-2 border-t border-white/15 pt-4">
        <span className={chipClass}>
          <ClipboardList className="h-3.5 w-3.5" />
          {resultCount} {t('patientDashboard.hero.assessments', 'Assessments')}
        </span>
        <span className={chipClass}>
          <CalendarClock className="h-3.5 w-3.5" />
          {t('patientDashboard.carePlanPage.hero.lastCheck', 'Last check')}: {getRelativeCheckAge(latestResult.created_at, t) ?? '—'}
        </span>
        {confidence > 0 ? (
          <span className={chipClass}>
            {t('patientDashboard.carePlanPage.hero.confidence', 'Confidence')}: {confidence}%
          </span>
        ) : null}
        {age !== null ? (
          <span className={chipClass}>{t('patientDashboard.situation.ageLabel', 'Age')}: {age}</span>
        ) : null}
        {urgentCount > 0 ? (
          <span className="inline-flex items-center rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium">
            {urgentCount} {t('patientDashboard.recentAssessments.urgent', 'Urgent')}
          </span>
        ) : null}
      </div>
    </section>
  )
}
