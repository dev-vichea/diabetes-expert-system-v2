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
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{title}</h2>
          {description ? <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-3">{action}</div> : null}
      </div>
    </section>
  )
}
