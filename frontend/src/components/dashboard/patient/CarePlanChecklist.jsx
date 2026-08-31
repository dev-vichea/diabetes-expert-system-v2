import { useCallback, useEffect, useState } from 'react'
import { Check, PartyPopper, RotateCcw } from 'lucide-react'
import { SectionCard } from '@/components/ui'
import { cn } from '@/lib/utils'

const STORAGE_PREFIX = 'des-care-plan-done'

function readDoneIndexes(resultId) {
  if (!resultId) return []
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}-${resultId}`)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((value) => Number.isInteger(value)) : []
  } catch {
    return []
  }
}

export function CarePlanChecklist({ items, resultId, t }) {
  const [doneIndexes, setDoneIndexes] = useState(() => new Set(readDoneIndexes(resultId)))

  // Reset local progress whenever the checklist belongs to a new assessment result.
  useEffect(() => {
    setDoneIndexes(new Set(readDoneIndexes(resultId)))
  }, [resultId])

  const toggle = useCallback(
    (index) => {
      setDoneIndexes((previous) => {
        const next = new Set(previous)
        if (next.has(index)) {
          next.delete(index)
        } else {
          next.add(index)
        }
        if (resultId) {
          try {
            window.localStorage.setItem(`${STORAGE_PREFIX}-${resultId}`, JSON.stringify([...next]))
          } catch {
            /* storage unavailable (private mode) — progress just won't persist */
          }
        }
        return next
      })
    },
    [resultId]
  )

  const reset = useCallback(() => {
    setDoneIndexes(new Set())
    if (resultId) {
      try {
        window.localStorage.removeItem(`${STORAGE_PREFIX}-${resultId}`)
      } catch {
        /* ignore */
      }
    }
  }, [resultId])

  const total = items.length
  const done = items.filter((_, index) => doneIndexes.has(index)).length
  const percent = total ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total

  return (
    <SectionCard
      title={t('patientDashboard.carePlanPage.checklist.title', 'Action checklist')}
      description={t('patientDashboard.carePlanPage.checklist.description', 'Practical next steps based on your latest assessment.')}
      actions={
        done > 0 ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('patientDashboard.carePlanPage.checklist.reset', 'Reset')}
          </button>
        ) : null
      }
    >
      {!total ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('patientDashboard.carePlanPage.checklist.empty', 'Complete an assessment to get your personal checklist.')}
        </p>
      ) : (
        <div>
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={cn('h-full rounded-full transition-all duration-500', allDone ? 'bg-emerald-500' : 'bg-primary-600')}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('patientDashboard.carePlanPage.checklist.progress', '{{done}} of {{total}} completed', { done, total })}
            </span>
          </div>
          {/* Items */}
          <ul className="mt-4 space-y-2.5">
            {items.map((item, index) => {
              const isDone = doneIndexes.has(index)
              return (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-pressed={isDone}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all',
                      isDone
                        ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                        : 'border-slate-200/80 bg-white hover:border-primary-200 hover:bg-primary-50/40 dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-primary-900 dark:hover:bg-primary-950/20'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-transparent text-transparent dark:border-slate-600'
                      )}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span
                      className={cn(
                        'pt-0.5 text-sm leading-6',
                        isDone
                          ? 'text-emerald-800 line-through decoration-emerald-400/60 dark:text-emerald-300'
                          : 'text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {item}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Celebration */}
          {allDone ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  {t('patientDashboard.carePlanPage.checklist.completedTitle', 'All done for now!')}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-emerald-700/90 dark:text-emerald-400">
                  {t('patientDashboard.carePlanPage.checklist.completedText', "You've completed every step. Check back after your next assessment.")}
                </p>
              </div>
            </div>
          ) : null}

        </div>
      )}
    </SectionCard>
  )
}

