import { cn } from '@/lib/utils'

export function AdminHeroCard({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  description,
  action,
  variant = 'default',
  className,
}) {
  if (variant === 'simple') {
    return (
      <section className={cn('surface p-5 sm:p-6', className)}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            {(eyebrow || EyebrowIcon) ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                {EyebrowIcon ? <EyebrowIcon className="h-4 w-4" /> : null}
                {eyebrow ? <span>{eyebrow}</span> : null}
              </div>
            ) : null}
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{title}</h2>
            {description ? (
              <p className="mt-2 max-w-2xl text-base text-slate-600 dark:text-slate-300">{description}</p>
            ) : null}
          </div>
          {action ? <div className="flex shrink-0 flex-wrap gap-3">{action}</div> : null}
        </div>
      </section>
    )
  }

  return (
    <section className={cn('surface overflow-hidden p-0', className)}>
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-sky-50/60 px-6 py-6 dark:from-[#070712] dark:via-[#0a1020] dark:to-[#081426]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-500/10" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-violet-200/25 blur-2xl dark:bg-violet-500/10" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            {(eyebrow || EyebrowIcon) ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                {EyebrowIcon ? <EyebrowIcon className="h-4 w-4" /> : null}
                {eyebrow ? <span>{eyebrow}</span> : null}
              </div>
            ) : null}
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{title}</h2>
            {description ? (
              <p className="mt-2 max-w-2xl text-base text-slate-600 dark:text-slate-300">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
    </section>
  )
}
