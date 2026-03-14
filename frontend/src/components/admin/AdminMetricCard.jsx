import { cn } from '@/lib/utils'

export function AdminMetricCard({
  title,
  description,
  value,
  loading = false,
  icon: Icon,
  iconClass,
  shellClass,
  glowClass,
  accentClass,
  className,
}) {
  return (
    <article
      className={cn(
        'surface dark-hover-border relative flex h-full overflow-hidden border border-slate-200 bg-gradient-to-br px-5 py-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800',
        shellClass,
        className
      )}
    >
      {glowClass ? <div className={cn('pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full blur-2xl', glowClass)} /> : null}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
      <div className="relative flex h-full w-full items-center gap-4">
        <div className={cn('h-11 w-1 shrink-0 rounded-full', accentClass)} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-[1.9rem] font-bold leading-none tracking-tight text-slate-950 dark:text-slate-100">
            {loading ? '...' : value}
          </p>
          {description ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
        </div>
        {Icon ? (
          <span className={cn('mb-6 inline-flex shrink-0 rounded-lg p-1.5', iconClass)}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
    </article>
  )
}
