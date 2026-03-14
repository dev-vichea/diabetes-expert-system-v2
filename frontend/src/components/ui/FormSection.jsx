import { cn } from '@/lib/utils'

export function FormSection({ title, description, children, className, contentClassName }) {
  return (
    <section
      className={cn('dark-hover-border space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#070712]', className)}
    >
      {title || description ? (
        <div>
          {title ? <h3 className="text-sm font-semibold text-slate-900">{title}</h3> : null}
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
      ) : null}
      <div className={cn(contentClassName)}>{children}</div>
    </section>
  )
}
