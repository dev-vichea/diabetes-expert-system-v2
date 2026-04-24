import { cn } from '@/lib/utils'

export function SectionCard({ title, description, actions, children, className, bodyClassName }) {
  return (
    <section className={cn('surface min-w-0 flex flex-col p-4 sm:p-6', className)}>
      {title || description || actions ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="section-title">{title}</h2> : null}
            {description ? <p className="section-subtitle mt-1">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn('min-h-0 min-w-0', bodyClassName)}>{children}</div>
    </section>
  )
}
