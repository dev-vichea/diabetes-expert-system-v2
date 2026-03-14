import { cn } from '@/lib/utils'

export function AdminInsightPanel({
  title,
  description,
  icon: Icon,
  iconClass,
  glowClass,
  actions,
  children,
  className,
  bodyClassName,
}) {
  return (
    <section className={cn('surface dark-hover-border relative overflow-hidden border border-slate-200 p-4 dark:border-slate-800', className)}>
      {glowClass ? <div className={cn('pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full blur-2xl', glowClass)} /> : null}
      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon ? <Icon className={cn('h-4 w-4', iconClass)} /> : null}
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          </div>
          {description ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className={cn('relative min-h-0 flex-1', bodyClassName)}>{children}</div>
    </section>
  )
}
