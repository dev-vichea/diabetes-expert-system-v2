import { cn } from '@/lib/utils'

export function PageHeader({ eyebrow, title, description, actions, className, contentClassName }) {
  return (
    <header className={cn('flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className={cn('min-w-0 space-y-1', contentClassName)}>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">{eyebrow}</p> : null}
        <h1 className="break-words text-2xl font-bold text-slate-900">{title}</h1>
        {description ? <p className="text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">{actions}</div> : null}
    </header>
  )
}
