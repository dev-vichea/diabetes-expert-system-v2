import { useState, useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { SectionCard, StatusBadge } from '@/components/ui'
import { cn } from '@/lib/utils'

const NS = 'patientDashboard.recommendations'

const priorityMeta = {
  1: {
    label: (t) => t(`${NS}.priorityNow`, 'Act now'),
    badge: 'danger',
    chip: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  2: {
    label: (t) => t(`${NS}.prioritySoon`, 'This week'),
    badge: 'warning',
    chip: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  3: {
    label: (t) => t(`${NS}.priorityHabit`, 'Daily habit'),
    badge: 'success',
    chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
}

function RecommendationCard({ rec, t, isLastOdd }) {
  const meta = priorityMeta[rec.priority] || priorityMeta[3]
  const Icon = rec.icon
  const basisText = rec.basis || t(`${NS}.basisGeneral`, 'general lifestyle guidance')

  return (
    <article
      className={cn(
        'flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700',
        isLastOdd ? 'sm:col-span-2' : ''
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', meta.chip)}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <StatusBadge tone={meta.badge} size="sm">
          {meta.label(t)}
        </StatusBadge>
      </div>

      <h3 className="mt-3.5 text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">{rec.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{rec.text}</p>

      <div className="mt-auto pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-500" />
          <span className="truncate">{t(`${NS}.basisPrefix`, 'Based on: {{reason}}', { reason: basisText })}</span>
        </p>
      </div>
    </article>
  )
}

function RecommendationRow({ rec }) {
  const meta = priorityMeta[rec.priority] || priorityMeta[3]
  return (
    <li className="flex items-start gap-2.5 py-2.5">
      <span className={cn('mt-[7px] h-2 w-2 shrink-0 rounded-full', meta.dot)} />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold leading-5 text-slate-800 dark:text-slate-200">{rec.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{rec.text}</p>
      </div>
    </li>
  )
}

export function PatientRecommendations({ recommendations = [], t, variant = 'full', max }) {
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | '1' | '2' | '3'

  const counts = useMemo(() => {
    return {
      all: recommendations.length,
      1: recommendations.filter((r) => r.priority === 1).length,
      2: recommendations.filter((r) => r.priority === 2).length,
      3: recommendations.filter((r) => r.priority === 3).length,
    }
  }, [recommendations])

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return recommendations
    const priority = Number(activeFilter)
    return recommendations.filter((r) => r.priority === priority)
  }, [recommendations, activeFilter])

  const items = max ? filteredItems.slice(0, max) : filteredItems
  if (!recommendations.length) return null

  if (variant === 'compact') {
    return (
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {t(`${NS}.title`, 'Recommended for you')}
        </p>
        <ul className="mt-1.5 divide-y divide-slate-100 dark:divide-slate-800/70">
          {items.map((rec) => (
            <RecommendationRow key={rec.id} rec={rec} />
          ))}
        </ul>
      </div>
    )
  }

  const filterTabs = [
    { id: 'all', label: t(`${NS}.filterAll`, 'All'), count: counts.all },
    { id: '1', label: t(`${NS}.filterNow`, 'Act now'), count: counts[1] },
    { id: '2', label: t(`${NS}.filterSoon`, 'This week'), count: counts[2] },
    { id: '3', label: t(`${NS}.filterHabit`, 'Daily habit'), count: counts[3] },
  ].filter((f) => f.id === 'all' || f.count > 0)

  return (
    <SectionCard
      title={t(`${NS}.title`, 'Recommended for you')}
      description={t(`${NS}.description`, 'Generated automatically from your latest assessment data.')}
      actions={
        filterTabs.length > 2 ? (
          <div className="flex flex-wrap gap-1.5">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        ) : null
      }
    >
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          No recommendations found for this priority.
        </p>
      ) : (
        <div className="grid items-stretch gap-3.5 sm:grid-cols-2">
          {items.map((rec, index) => {
            const isLastOdd = index === items.length - 1 && items.length % 2 !== 0
            return (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                t={t}
                isLastOdd={isLastOdd}
              />
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
