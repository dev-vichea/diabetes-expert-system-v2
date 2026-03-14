import { cn } from '@/lib/utils'

export function PageHeader({ eyebrow, title, description, actions, className, contentClassName }) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className={cn('space-y-1', contentClassName)}>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">{eyebrow}</p> : null}
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}
