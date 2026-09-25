import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { Check, Clock, Moon, Sun, Sunrise, Sunset } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCarePlanConditionKey, getConditionRoutineAction } from './patient-dashboard-utils'

const ROUTINE_STORAGE_PREFIX = 'des-care-routine'

function getTodayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function readRoutineDone(dateKey) {
  try {
    const raw = window.localStorage.getItem(`${ROUTINE_STORAGE_PREFIX}-${dateKey}`)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CarePlanRoutine({ latestResult, t }) {
  const { user } = useAuth()
  const conditionKey = getCarePlanConditionKey(latestResult)
  const todayKey = `${user.id}-${getTodayKey()}`
  const [donePhases, setDonePhases] = useState(() => new Set(readRoutineDone(todayKey)))

  useEffect(() => {
    setDonePhases(new Set(readRoutineDone(todayKey)))
  }, [todayKey])

  const togglePhase = useCallback(
    (phaseId) => {
      setDonePhases((prev) => {
        const next = new Set(prev)
        if (next.has(phaseId)) {
          next.delete(phaseId)
        } else {
          next.add(phaseId)
        }
        try {
          window.localStorage.setItem(`${ROUTINE_STORAGE_PREFIX}-${todayKey}`, JSON.stringify([...next]))
        } catch {
          /* ignore */
        }
        return next
      })
    },
    [todayKey]
  )

  const phases = [
    {
      id: 'morning',
      icon: Sunrise,
      title: t('patientDashboard.carePlanPage.routine.morningTitle', 'Morning (6:00 – 9:00 AM)'),
      action: getConditionRoutineAction(conditionKey, 'morning', t),
      tone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
      badgeBg: 'border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      id: 'afternoon',
      icon: Sun,
      title: t('patientDashboard.carePlanPage.routine.afternoonTitle', 'Midday (12:00 – 2:00 PM)'),
      action: getConditionRoutineAction(conditionKey, 'afternoon', t),
      tone: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
      badgeBg: 'border-sky-200/80 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/60 dark:text-sky-300',
    },
    {
      id: 'evening',
      icon: Sunset,
      title: t('patientDashboard.carePlanPage.routine.eveningTitle', 'Evening (6:00 – 8:00 PM)'),
      action: getConditionRoutineAction(conditionKey, 'evening', t),
      tone: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
      badgeBg: 'border-indigo-200/80 bg-indigo-50 text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-300',
    },
    {
      id: 'bedtime',
      icon: Moon,
      title: t('patientDashboard.carePlanPage.routine.bedtimeTitle', 'Bedtime (9:30 – 10:30 PM)'),
      action: getConditionRoutineAction(conditionKey, 'bedtime', t),
      tone: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
      badgeBg: 'border-purple-200/80 bg-purple-100 text-purple-800 dark:border-purple-900/60 dark:bg-purple-950/60 dark:text-purple-300',
    },
  ]

  const doneCount = phases.filter((p) => donePhases.has(p.id)).length

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-slate-100">
            {t('patientDashboard.carePlanPage.routine.title', 'Daily care routine')}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {t('patientDashboard.carePlanPage.routine.description', 'A structured schedule to manage blood sugar and sustain energy levels throughout the day.')}
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{doneCount} / {phases.length} completed today</span>
        </span>
      </div>

      <div className="relative space-y-3.5 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-0 before:border-l-2 before:border-dashed before:border-slate-200 dark:before:border-slate-800">
        {phases.map((phase) => {
          const Icon = phase.icon
          const isDone = donePhases.has(phase.id)

          return (
            <div
              key={phase.id}
              onClick={() => togglePhase(phase.id)}
              className={cn(
                'group relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all duration-150',
                isDone
                  ? 'border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60 hover:shadow-2xs dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
              )}
            >
              {/* Icon Marker */}
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-2xs transition-transform',
                  isDone ? 'bg-emerald-500 text-white shadow-xs' : phase.tone
                )}
              >
                {isDone ? (
                  <Check className="h-5 w-5 text-white stroke-[3]" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              {/* Text content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3
                    className={cn(
                      'text-sm font-bold tracking-tight',
                      isDone
                        ? 'text-emerald-900 line-through decoration-emerald-500/60 dark:text-emerald-200'
                        : 'text-slate-900 dark:text-slate-100'
                    )}
                  >
                    {phase.title}
                  </h3>
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                      isDone
                        ? 'border-emerald-200/80 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : phase.badgeBg
                    )}
                  >
                    {isDone ? 'Done' : 'Scheduled'}
                  </span>
                </div>
                <p
                  className={cn(
                    'mt-1.5 text-xs leading-relaxed',
                    isDone
                      ? 'text-emerald-700/80 dark:text-emerald-400/80'
                      : 'text-slate-600 dark:text-slate-300'
                  )}
                >
                  {phase.action}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
