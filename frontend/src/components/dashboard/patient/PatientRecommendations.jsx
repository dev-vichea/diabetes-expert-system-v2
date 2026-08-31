import { Sparkles } from 'lucide-react'
import { SectionCard, StatusBadge } from '@/components/ui'
import { cn } from '@/lib/utils'

const NS = 'patientDashboard.recommendations'

const priorityMeta = {
  1: {
    label: t => t(`${NS}.priorityNow`, 'Act now'),
    badge: 'danger',
    chip: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  2: {
    label: t => t(`${NS}.prioritySoon`, 'This week'),
    badge: 'warning',
    chip: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  3: {
    label: t => t(`${NS}.priorityHabit`, 'Daily habit'),
    badge: 'success',
    chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
}

function RecommendationCard({ rec, t }) {
  const meta = priorityMeta[rec.priority] || priorityMeta[3]
  const Icon = rec.icon

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/30">
      <div className="flex items-start justify-between gap-2">
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', meta.chip)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <StatusBadge tone={meta.badge} size="sm">{meta.label(t)}</StatusBadge>
      </div>
      <h3 className="mt-2.5 text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">{rec.title}</h3>
      <p className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{rec.text}</p>
      {rec.basis ? (
        <p className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          <Sparkles className="h-3 w-3 shrink-0" />
          <span className="truncate">{t('patientDashboard.recommendations.basisPrefix', 'Based on: {{reason}}', { reason: rec.basis })}</span>
        </p>
      ) : null}
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

export function PatientRecommendations({ recommendations, t, variant = 'full', max }) {
  const items = max ? recommendations.slice(0, max) : recommendations
  if (!items.length) return null

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

  return (
    <SectionCard
      title={t(`${NS}.title`, 'Recommended for you')}
      description={t(`${NS}.description`, 'Generated automatically from your latest assessment data.')}
    >
      <div className="grid items-start gap-3 sm:grid-cols-2">
        {items.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec} t={t} />
        ))}
      </div>
    </SectionCard>
  )
}
