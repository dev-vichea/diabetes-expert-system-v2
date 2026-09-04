import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  PartyPopper,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { SectionCard } from '@/components/ui'
import { cn } from '@/lib/utils'

const STORAGE_DONE_PREFIX = 'des-care-plan-done-v2'
const STORAGE_CUSTOM_PREFIX = 'des-care-plan-custom-goals'

function readStoredDone(resultId) {
  if (!resultId) return []
  try {
    const raw = window.localStorage.getItem(`${STORAGE_DONE_PREFIX}-${resultId}`)
    if (!raw) {
      const legacyRaw = window.localStorage.getItem(`des-care-plan-done-${resultId}`)
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw)
        if (Array.isArray(legacyParsed)) {
          return legacyParsed.map((idx) => `step-${idx}`)
        }
      }
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readStoredCustomGoals(resultId) {
  if (!resultId) return []
  try {
    const raw = window.localStorage.getItem(`${STORAGE_CUSTOM_PREFIX}-${resultId}`)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CarePlanChecklist({ items = [], resultId, t }) {
  const [activeTab, setActiveTab] = useState('clinical') // 'clinical' | 'custom' | 'all'
  const [doneIds, setDoneIds] = useState(() => new Set(readStoredDone(resultId)))
  const [customGoals, setCustomGoals] = useState(() => readStoredCustomGoals(resultId))
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [newGoalText, setNewGoalText] = useState('')

  useEffect(() => {
    setDoneIds(new Set(readStoredDone(resultId)))
    setCustomGoals(readStoredCustomGoals(resultId))
  }, [resultId])

  const persistDone = useCallback(
    (nextSet) => {
      if (!resultId) return
      try {
        window.localStorage.setItem(`${STORAGE_DONE_PREFIX}-${resultId}`, JSON.stringify([...nextSet]))
      } catch {
        /* storage unavailable */
      }
    },
    [resultId]
  )

  const persistCustomGoals = useCallback(
    (nextGoals) => {
      if (!resultId) return
      try {
        window.localStorage.setItem(`${STORAGE_CUSTOM_PREFIX}-${resultId}`, JSON.stringify(nextGoals))
      } catch {
        /* storage unavailable */
      }
    },
    [resultId]
  )

  const toggleTask = useCallback(
    (taskId) => {
      setDoneIds((prev) => {
        const next = new Set(prev)
        if (next.has(taskId)) {
          next.delete(taskId)
        } else {
          next.add(taskId)
        }
        persistDone(next)
        return next
      })
    },
    [persistDone]
  )

  const resetAll = useCallback(() => {
    setDoneIds(new Set())
    if (resultId) {
      try {
        window.localStorage.removeItem(`${STORAGE_DONE_PREFIX}-${resultId}`)
        window.localStorage.removeItem(`des-care-plan-done-${resultId}`)
      } catch {
        /* ignore */
      }
    }
  }, [resultId])

  const handleAddGoal = (e) => {
    e?.preventDefault?.()
    const trimmed = newGoalText.trim()
    if (!trimmed) return

    const newGoal = {
      id: `custom-${Date.now()}`,
      text: trimmed,
      createdAt: new Date().toISOString(),
    }
    const nextGoals = [...customGoals, newGoal]
    setCustomGoals(nextGoals)
    persistCustomGoals(nextGoals)
    setNewGoalText('')
    setIsAddingGoal(false)
  }

  const handleDeleteGoal = (goalId) => {
    const nextGoals = customGoals.filter((g) => g.id !== goalId)
    setCustomGoals(nextGoals)
    persistCustomGoals(nextGoals)

    if (doneIds.has(goalId)) {
      setDoneIds((prev) => {
        const next = new Set(prev)
        next.delete(goalId)
        persistDone(next)
        return next
      })
    }
  }

  const clinicalTasks = useMemo(() => {
    return items.map((text, index) => ({
      id: `step-${index}`,
      type: 'clinical',
      text,
      badge: t('patientDashboard.carePlanPage.checklist.tabClinical', 'Clinical Steps'),
    }))
  }, [items, t])

  const customTasks = useMemo(() => {
    return customGoals.map((goal) => ({
      id: goal.id,
      type: 'custom',
      text: goal.text,
      badge: t('patientDashboard.carePlanPage.checklist.tabCustom', 'My Goals'),
      isCustom: true,
    }))
  }, [customGoals, t])

  const allTasks = useMemo(() => {
    return [...clinicalTasks, ...customTasks]
  }, [clinicalTasks, customTasks])

  const visibleTasks = useMemo(() => {
    if (activeTab === 'custom') return customTasks
    if (activeTab === 'all') return allTasks
    return clinicalTasks
  }, [activeTab, clinicalTasks, customTasks, allTasks])

  const totalCount = visibleTasks.length
  const doneCount = visibleTasks.filter((task) => doneIds.has(task.id)).length
  const percent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0
  const isAllDone = totalCount > 0 && doneCount === totalCount

  const tabs = [
    { id: 'clinical', label: t('patientDashboard.carePlanPage.checklist.tabClinical', 'Clinical Steps'), count: clinicalTasks.length },
    { id: 'custom', label: t('patientDashboard.carePlanPage.checklist.tabCustom', 'My Goals'), count: customTasks.length },
    ...(customTasks.length > 0 ? [{ id: 'all', label: t('patientDashboard.carePlanPage.checklist.tabAll', 'All Tasks'), count: allTasks.length }] : []),
  ]

  return (
    <SectionCard
      title={t('patientDashboard.carePlanPage.checklist.title', 'Action checklist')}
      description={t('patientDashboard.carePlanPage.checklist.description', 'Practical next steps based on your latest assessment.')}
      actions={
        doneCount > 0 ? (
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('patientDashboard.carePlanPage.checklist.reset', 'Reset')}
          </button>
        ) : null
      }
    >
      {/* Sleek Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {t('patientDashboard.carePlanPage.checklist.progress', '{{done}} of {{total}} completed', { done: doneCount, total: totalCount })}
          </span>
          <span className="font-bold text-primary-600 dark:text-primary-400">{percent}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isAllDone ? 'bg-emerald-500' : 'bg-primary-600'
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="mb-3.5 flex flex-wrap gap-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                    isActive ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-200/80 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Unified List Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-950/40">
        {visibleTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            {activeTab === 'custom'
              ? t('patientDashboard.carePlanPage.checklist.customEmpty', 'No personal goals added yet. Add one below!')
              : t('patientDashboard.carePlanPage.checklist.empty', 'Complete an assessment to get your personal checklist.')}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {visibleTasks.map((task) => {
              const isDone = doneIds.has(task.id)
              return (
                <div
                  key={task.id}
                  className={cn(
                    'group flex items-center justify-between gap-3.5 px-4 py-3.5 transition-colors',
                    isDone
                      ? 'bg-slate-50/40 dark:bg-slate-900/20'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/40'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className="flex flex-1 items-start gap-3.5 text-left focus:outline-none"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                          : 'border-slate-300 bg-white group-hover:border-primary-500 dark:border-slate-600 dark:bg-slate-900'
                      )}
                    >
                      {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>

                    <span
                      className={cn(
                        'text-sm leading-6 transition-colors',
                        isDone
                          ? 'text-slate-400 line-through decoration-slate-300 dark:text-slate-500 dark:decoration-slate-600'
                          : 'text-slate-800 dark:text-slate-200'
                      )}
                    >
                      {task.text}
                    </span>
                  </button>

                  {task.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(task.id)}
                      aria-label={t('patientDashboard.carePlanPage.checklist.deleteGoal', 'Remove goal')}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Inline Add Goal Row at bottom */}
        {isAddingGoal ? (
          <form
            onSubmit={handleAddGoal}
            className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800/80 dark:bg-slate-900/40"
          >
            <input
              type="text"
              autoFocus
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              placeholder={t('patientDashboard.carePlanPage.checklist.addGoalPlaceholder', 'Add a personal health goal...')}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!newGoalText.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('patientDashboard.carePlanPage.checklist.addGoalButton', 'Add Goal')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingGoal(false)
                setNewGoalText('')
              }}
              className="rounded-xl p-1.5 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingGoal(true)}
            className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-3 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50/50 dark:border-slate-800/60 dark:text-primary-400 dark:hover:bg-primary-950/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('patientDashboard.carePlanPage.checklist.addGoalPlaceholder', 'Add a personal health goal...')}</span>
          </button>
        )}
      </div>

      {/* Celebration Banner */}
      {isAllDone && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
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
      )}
    </SectionCard>
  )
}
