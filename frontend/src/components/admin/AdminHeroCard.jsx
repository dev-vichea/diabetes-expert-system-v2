import { cn } from '@/lib/utils'

export function AdminHeroCard({
  title,
  description,
  action,
  className,
}) {
  return (
    <section className={cn(className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{title}</h2>
          {description ? <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
        </div>
        {action ? <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:shrink-0">{action}</div> : null}
      </div>
    </section>
  )
}
