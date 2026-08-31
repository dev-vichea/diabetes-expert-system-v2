import { cn } from '@/lib/utils'

const toneIconStyles = {
  default: { chip: 'bg-slate-100', icon: 'text-slate-500' },
  primary: { chip: 'bg-primary-50', icon: 'text-primary-600' },
  success: { chip: 'bg-emerald-50', icon: 'text-emerald-600' },
  warning: { chip: 'bg-amber-50', icon: 'text-amber-600' },
  danger: { chip: 'bg-rose-50', icon: 'text-rose-600' },
}

export function StatCard({ label, value, hint, tone = 'default', icon: Icon, className }) {
  const tones = toneIconStyles[tone] || toneIconStyles.default

  return (
    <article className={cn('surface min-w-0 p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {Icon ? (
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tones.chip)}>
            <Icon className={cn('h-4 w-4', tones.icon)} aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </article>
  )
}
