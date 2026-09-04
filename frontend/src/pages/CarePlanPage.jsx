import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ClipboardPlus,
  Clock,
  FileText,
  HeartPulse,
  Plus,
  Printer,
  ShieldAlert,
  Siren,
  Sparkles,
  Stethoscope,
  UserCheck,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { ErrorAlert, LoadingState, StatusBadge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { CarePlanChecklist } from '@/components/dashboard/patient/CarePlanChecklist'
import { CarePlanRoutine } from '@/components/dashboard/patient/CarePlanRoutine'
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

const chipClass = 'inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-xs'

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
  const { isKhmer } = useLanguage()
  const isUrgent = Boolean(latestResult?.is_urgent)
  const reviewer = latestResult?.reviewed_by_user
  const reviewerName = reviewer?.name ? (reviewer.name.startsWith('Dr.') ? reviewer.name : `Dr. ${reviewer.name}`) : null

  return (
    <section className="surface min-w-0 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
            <Stethoscope className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="section-title text-base sm:text-lg">
              {t('patientDashboard.carePlanPage.doctorNote.title', "Doctor's note")}
            </h2>
            {reviewerName && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('patientDashboard.carePlanPage.doctorNote.reviewedBy', 'Reviewed by {{doctor}}', { doctor: reviewerName })}
              </p>
            )}
          </div>
        </div>

        {latestResult.review_note ? (
          <StatusBadge tone="success" size="sm" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{t('patientDashboard.carePlanPage.doctorNote.officialBadge', 'Verified Clinical Review')}</span>
          </StatusBadge>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5" />
            <span>{t('patientDashboard.carePlanPage.doctorNote.awaitingTitle', 'Awaiting Clinical Review')}</span>
          </span>
        )}
      </div>

      {latestResult.review_note ? (
        <div className="mt-4 rounded-2xl border border-primary-200/70 bg-gradient-to-br from-primary-50/50 to-sky-50/30 p-5 text-sm leading-7 text-slate-800 dark:border-primary-900/60 dark:from-primary-950/30 dark:to-slate-900/40 dark:text-slate-200">
          <div className="flex items-start gap-3">
            <UserCheck className="mt-1 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
            <div className="min-w-0 flex-1">
              <p className="font-serif italic text-slate-800 dark:text-slate-200">
                &ldquo;{latestResult.review_note}&rdquo;
              </p>
              {latestResult.reviewed_at && (
                <p className="mt-2 text-right text-[11px] font-sans font-medium text-slate-400 dark:text-slate-500">
                  {new Date(latestResult.reviewed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-xs leading-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
          {t('patientDashboard.carePlanPage.doctorNote.awaitingDescription', 'Your assessment is currently logged in the clinic review queue. When your physician reviews your case, their official notes, lab interpretations, and personalized guidance will appear here.')}
        </div>
      )}

      {/* Priority guidance box */}
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
              {t('patientDashboard.situation.urgentReason', 'Reason: {{reason}}', {
                reason: isKhmer ? (latestResult.urgent_reason_km || latestResult.urgent_reason) : latestResult.urgent_reason,
              })}
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
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <HeartPulse className="h-4 w-4" />
        </span>
        <h2 className="section-title text-base">{t('patientDashboard.carePlanPage.symptoms.title', 'Symptoms from your latest assessment')}</h2>
      </div>

      {symptoms.length ? (
        <div className="mt-3.5 flex flex-wrap gap-2">
          {symptoms.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
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
    <section className="min-w-0 rounded-2xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-900/50 dark:bg-rose-950/20">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
          <Siren className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-sm font-bold text-rose-900 dark:text-rose-200">
          {t('patientDashboard.carePlanPage.safety.title', 'Seek care urgently if')}
        </h2>
      </div>
      <ul className="mt-3.5 space-y-2.5">
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

function CertaintyRadialGauge({ value, label }) {
  const radius = 36
  const stroke = 6
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <svg className="h-24 w-24 -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-white/20"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-emerald-300 drop-shadow-[0_0_10px_rgba(110,231,183,0.7)] transition-all duration-1000 ease-out"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center text-center">
          <span className="text-xl font-black tracking-tight text-white">{value}%</span>
        </div>
      </div>
      <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/85">{label}</span>
    </div>
  )
}

function CareHero({ latestResult, resultCount, urgentCount, t }) {
  const { isKhmer } = useLanguage()
  const isUrgent = Boolean(latestResult?.is_urgent)
  const facts = getLatestFacts([latestResult])
  const age = toNumberOrNull(facts.age)
  const confidence = toPercentValue(latestResult?.certainty)

  const handlePrint = () => {
    window.print()
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8',
        isUrgent
          ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-red-950'
          : 'bg-gradient-to-br from-sky-700 via-primary-800 to-indigo-950'
      )}
    >
      {/* Decorative background blurs */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-12 h-52 w-52 rounded-full bg-sky-400/15 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left / Info Column */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              {t('patientDashboard.carePlanPage.hero.eyebrow', 'Your care plan')}
            </p>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]',
                isUrgent ? 'bg-rose-500/40 text-white ring-1 ring-white/30' : 'bg-white/20 text-white backdrop-blur-xs'
              )}
            >
              {isUrgent ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-200 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-100" />
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
              )}
              {getUrgencyLabel(latestResult, t)}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-[2rem]">
            {latestResult.diagnosis || t('patientDashboard.hero.noDiagnosisYet', 'No diagnosis result yet')}
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-white/90">
            {isUrgent
              ? t('patientDashboard.situation.urgent', 'Your latest assessment was flagged for urgent follow-up.')
              : t('patientDashboard.carePlan.description', 'What matters most after your latest assessment.')}
          </p>

          {isUrgent && latestResult.urgent_reason ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2 text-xs font-medium backdrop-blur-xs">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              <span>
                {t('patientDashboard.situation.urgentReason', 'Reason: {{reason}}', {
                  reason: isKhmer ? (latestResult.urgent_reason_km || latestResult.urgent_reason) : latestResult.urgent_reason,
                })}
              </span>
            </p>
          ) : null}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3 print:hidden">
            <Link
              to="/diagnosis"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-primary-900 shadow-md transition hover:bg-white/95 hover:shadow-lg"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              {t('patientDashboard.situation.newAssessment', 'New assessment')}
            </Link>

            <Link
              to={`/my-results/${latestResult.id}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              <FileText className="h-4 w-4" />
              {t('patientDashboard.carePlanPage.hero.viewFullReport', 'View Full Report')}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              <Printer className="h-4 w-4" />
              {t('patientDashboard.carePlanPage.hero.printPlan', 'Print Care Plan')}
            </button>
          </div>
        </div>

        {/* Right / Certainty Radial Ring */}
        {confidence > 0 && (
          <div className="flex shrink-0 items-center justify-center rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/15">
            <CertaintyRadialGauge
              value={confidence}
              label={t('patientDashboard.carePlanPage.hero.certaintyScore', 'Certainty')}
            />
          </div>
        )}
      </div>

      {/* Meta Bar */}
      <div className="relative mt-6 flex flex-wrap items-center gap-2.5 border-t border-white/15 pt-4">
        <span className={chipClass}>
          <ClipboardList className="h-3.5 w-3.5" />
          {resultCount} {t('patientDashboard.hero.assessments', 'Assessments')}
        </span>

        <span className={chipClass}>
          <CalendarClock className="h-3.5 w-3.5" />
          {t('patientDashboard.carePlanPage.hero.lastCheck', 'Last check')}: {getRelativeCheckAge(latestResult.created_at, t) ?? '—'}
        </span>

        {age !== null ? (
          <span className={chipClass}>
            {t('patientDashboard.situation.ageLabel', 'Age')}: {age}
          </span>
        ) : null}

        {urgentCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/30 px-3 py-1 text-xs font-semibold text-rose-100">
            <ShieldAlert className="h-3.5 w-3.5" />
            {urgentCount} {t('patientDashboard.recentAssessments.urgent', 'Urgent')}
          </span>
        ) : null}

        {latestResult.review_note ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t('patientDashboard.carePlanPage.history.reviewed', 'Doctor reviewed')}
          </span>
        ) : null}
      </div>
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
    <div className="space-y-6">
      <ErrorAlert message={error} />

      {!latestResult ? (
        <OnboardingState t={t} />
      ) : (
        <>
          <CareHero latestResult={latestResult} resultCount={results.length} urgentCount={urgentCount} t={t} />

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            {/* Main column */}
            <div className="flex min-w-0 flex-col gap-6">
              <CarePlanChecklist
                items={buildCareChecklist(latestResult, t)}
                resultId={latestResult.id}
                t={t}
              />
              <CarePlanRoutine t={t} />
              <PatientRecommendations recommendations={recommendations} t={t} variant="full" />
              <DoctorNoteCard latestResult={latestResult} t={t} />
              <SymptomsCard symptoms={getReportedSymptomLabels(latestResult, t)} t={t} />
            </div>

            {/* Side column */}
            <div className="flex min-w-0 flex-col gap-6">
              <CarePlanWatchlist results={results} t={t} />
              <SafetyCard t={t} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
