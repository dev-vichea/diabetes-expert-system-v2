import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  HeartPulse,
  ListTodo,
  Moon,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Sun,
  Sunrise,
  Sunset,
} from 'lucide-react'
import { SectionCard } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  buildCareChecklist,
  getActiveRoutinePhase,
  getUrgencyLabel,
  toPercentValue,
} from './patient-dashboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'

const ROUTINE_META = {
  morning: {
    icon: Sunrise,
    titleKey: 'patientDashboard.carePlanPage.routine.morningTitle',
    defaultTitle: 'Morning (6:00 – 9:00 AM)',
    actionKey: 'patientDashboard.carePlanPage.routine.morningAction',
    defaultAction: 'Fasting glucose check, fiber & protein breakfast, morning medication if prescribed.',
    accent: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400',
  },
  afternoon: {
    icon: Sun,
    titleKey: 'patientDashboard.carePlanPage.routine.afternoonTitle',
    defaultTitle: 'Midday (12:00 – 2:00 PM)',
    actionKey: 'patientDashboard.carePlanPage.routine.afternoonAction',
    defaultAction: 'Balanced lunch, 15–20 minute walk to reduce glucose spike, hydrate with water.',
    accent: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50 dark:text-sky-400',
  },
  evening: {
    icon: Sunset,
    titleKey: 'patientDashboard.carePlanPage.routine.eveningTitle',
    defaultTitle: 'Evening (6:00 – 8:00 PM)',
    actionKey: 'patientDashboard.carePlanPage.routine.eveningAction',
    defaultAction: 'Nutrient-dense dinner, light relaxation, post-dinner glucose check if advised.',
    accent: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400',
  },
  bedtime: {
    icon: Moon,
    titleKey: 'patientDashboard.carePlanPage.routine.bedtimeTitle',
    defaultTitle: 'Bedtime (9:30 – 10:30 PM)',
    actionKey: 'patientDashboard.carePlanPage.routine.bedtimeAction',
    defaultAction: 'Daily foot inspection (look for sores or blisters), prepare morning supplies.',
    accent: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400',
  },
}

function readDoneChecklistCount(resultId) {
  if (!resultId) return 0
  try {
    const raw = window.localStorage.getItem(`des-care-plan-done-v2-${resultId}`)
    if (!raw) {
      const legacyRaw = window.localStorage.getItem(`des-care-plan-done-${resultId}`)
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw)
        return Array.isArray(parsed) ? parsed.length : 0
      }
      return 0
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

export function PatientCarePanel({ latestResult }) {
  const { t } = useLanguage()

  if (!latestResult) {
    return (
      <SectionCard
        title={t('patientDashboard.carePlan.widgetTitle', "Care Plan & Today's Focus")}
        description={t('patientDashboard.carePlan.widgetDescription', "Quick overview of your active care plan, checklist progress, and today's routine.")}
      >
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {t('patientDashboard.carePlan.noActivePlan', 'No active assessment on record yet.')}
          </p>
          <p className="mt-1">
            {t('patientDashboard.carePlan.noActivePlanDesc', 'Take an assessment to generate your personalized care plan and daily routines.')}
          </p>
          <Link
            to="/diagnosis"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition"
          >
            <span>{t('patientDashboard.situation.newAssessment', 'New assessment')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </SectionCard>
    )
  }

  const isUrgent = Boolean(latestResult.is_urgent)
  const confidence = toPercentValue(latestResult.certainty)
  const activePhaseKey = getActiveRoutinePhase()
  const activePhase = ROUTINE_META[activePhaseKey] || ROUTINE_META.morning
  const PhaseIcon = activePhase.icon

  // Checklist items count
  const checklistItems = buildCareChecklist(latestResult, t)
  const doneCount = readDoneChecklistCount(latestResult.id)
  const totalCount = checklistItems.length
  const percentDone = totalCount ? Math.round((Math.min(doneCount, totalCount) / totalCount) * 100) : 0

  return (
    <SectionCard
      title={t('patientDashboard.carePlan.widgetTitle', "Care Plan & Today's Focus")}
      description={t('patientDashboard.carePlan.widgetDescription', "Quick overview of your active care plan, checklist progress, and today's routine.")}
      actions={
        <Link
          to="/care-plan"
          className="inline-flex min-h-9 items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <span>{t('patientDashboard.carePlan.openFull', 'Open care plan')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        {/* Card 1: Active Diagnosis & Priority */}
        <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-4.5 transition-all hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
              <HeartPulse className="h-4.5 w-4.5" />
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                isUrgent
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
              )}
            >
              {isUrgent ? <ShieldAlert className="h-3 w-3" /> : null}
              {getUrgencyLabel(latestResult, t)}
            </span>
          </div>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t('patientDashboard.carePlan.activePlan', 'Active Diagnosis')}
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            {latestResult.diagnosis}
          </h3>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-primary-500 shrink-0" />
            <span>{confidence}% {t('patientDashboard.carePlanPage.hero.confidence', 'Confidence')}</span>
          </div>

          <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              to={`/my-results/${latestResult.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              <span>{t('patientDashboard.carePlan.heroViewReport', 'View full report')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>

        {/* Card 2: Today's Scheduled Routine Checkpoint */}
        <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-4.5 transition-all hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', activePhase.accent)}>
              <PhaseIcon className="h-4.5 w-4.5" />
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Active Now
            </span>
          </div>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t('patientDashboard.carePlan.todayRoutine', "Today's Routine Focus")}
          </p>
          <h3 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
            {t(activePhase.titleKey, activePhase.defaultTitle)}
          </h3>

          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
            {t(activePhase.actionKey, activePhase.defaultAction)}
          </p>

          <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              to="/care-plan"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              <span>{t('patientDashboard.carePlan.openRoutine', 'View daily routine')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>

        {/* Card 3: Action Checklist Progress & Doctor Review */}
        <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-4.5 transition-all hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
              <ListTodo className="h-4.5 w-4.5" />
            </span>
            {latestResult.review_note ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                {t('patientDashboard.carePlan.reviewDone', 'Doctor reviewed')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Clock className="h-3 w-3" />
                {t('patientDashboard.carePlan.reviewPending', 'Pending clinician review')}
              </span>
            )}
          </div>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t('patientDashboard.carePlan.checklistProgress', 'Action Checklist')}
          </p>

          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {doneCount} / {totalCount} completed
            </span>
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
              {percentDone}%
            </span>
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-primary-600 transition-all duration-500"
              style={{ width: `${percentDone}%` }}
            />
          </div>

          <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              to="/care-plan"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              <span>{t('patientDashboard.carePlan.continueChecklist', 'View checklist')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>
      </div>
    </SectionCard>
  )
}
