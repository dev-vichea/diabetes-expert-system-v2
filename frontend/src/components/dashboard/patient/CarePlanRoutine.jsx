import { useState, useEffect, useCallback } from 'react'
import { Check, Clock, Moon, Sun, Sunrise, Sunset } from 'lucide-react'
import { SectionCard } from '@/components/ui'
import { cn } from '@/lib/utils'

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

export function CarePlanRoutine({ t }) {
  const todayKey = getTodayKey()
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
      action: t('patientDashboard.carePlanPage.routine.morningAction', 'Fasting glucose check, fiber & protein breakfast, morning medication/insulin if prescribed.'),
      tone: 'from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      id: 'afternoon',
      icon: Sun,
      title: t('patientDashboard.carePlanPage.routine.afternoonTitle', 'Midday (12:00 – 2:00 PM)'),
      action: t('patientDashboard.carePlanPage.routine.afternoonAction', 'Balanced lunch, 15–20 minute gentle walk to reduce post-meal spikes, hydrate with water.'),
      tone: 'from-sky-500/20 to-blue-500/10 text-sky-600 dark:text-sky-400',
      badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    },
    {
      id: 'evening',
      icon: Sunset,
      title: t('patientDashboard.carePlanPage.routine.eveningTitle', 'Evening (6:00 – 8:00 PM)'),
      action: t('patientDashboard.carePlanPage.routine.eveningAction', 'Nutrient-dense dinner with complex carbohydrates, light relaxation, post-dinner glucose check if advised.'),
      tone: 'from-indigo-500/20 to-purple-500/10 text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
    },
    {
      id: 'bedtime',
      icon: Moon,
      title: t('patientDashboard.carePlanPage.routine.bedtimeTitle', 'Bedtime (9:30 – 10:30 PM)'),
      action: t('patientDashboard.carePlanPage.routine.bedtimeAction', 'Daily foot inspection (look for sores or blisters), prepare morning supplies, aim for 7–8 hours sleep.'),
      tone: 'from-purple-500/20 to-slate-500/10 text-purple-600 dark:text-purple-400',
      badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    },
  ]

  const doneCount = phases.filter((p) => donePhases.has(p.id)).length

  return (
    <SectionCard
      title={t('patientDashboard.carePlanPage.routine.title', 'Daily care routine')}
      description={t('patientDashboard.carePlanPage.routine.description', 'A structured schedule to manage blood sugar and sustain energy levels throughout the day.')}
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Clock className="h-3.5 w-3.5" />
          <span>{doneCount} / {phases.length} completed today</span>
        </span>
      }
    >
      <div className="relative space-y-4 before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {phases.map((phase) => {
          const Icon = phase.icon
          const isDone = donePhases.has(phase.id)

          return (
            <div
              key={phase.id}
              onClick={() => togglePhase(phase.id)}
              className={cn(
                'relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all',
                isDone
                  ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700'
              )}
            >
              {/* Icon Marker */}
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-xs transition-transform',
                  phase.tone,
                  isDone ? 'scale-95 ring-2 ring-emerald-500' : ''
                )}
              >
                {isDone ? (
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              {/* Text content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3
                    className={cn(
                      'text-sm font-bold',
                      isDone
                        ? 'text-emerald-900 line-through decoration-emerald-500/60 dark:text-emerald-200'
                        : 'text-slate-900 dark:text-slate-100'
                    )}
                  >
                    {phase.title}
                  </h3>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      isDone
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : phase.badgeBg
                    )}
                  >
                    {isDone ? 'Done' : 'Scheduled'}
                  </span>
                </div>
                <p
                  className={cn(
                    'mt-1 text-xs leading-5',
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
    </SectionCard>
  )
}
