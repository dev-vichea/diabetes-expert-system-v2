import { cn } from '@/lib/utils'

const toneStyles = {
  default: 'bg-slate-50',
  primary: 'bg-primary-50',
  success: 'bg-emerald-50',
  warning: 'bg-amber-50',
  danger: 'bg-rose-50',
}

export function StatCard({ label, value, hint, tone = 'default', icon: Icon, className }) {
  return (
    <article className={cn('rounded-xl p-3', toneStyles[tone] || toneStyles.default, className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-slate-400" aria-hidden /> : null}
      </div>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </article>
  )
}
