import { cn } from '@/lib/utils'

export function SectionCard({ title, description, actions, children, className, bodyClassName }) {
  return (
    <section className={cn('surface flex flex-col p-5 sm:p-6', className)}>
      {title || description || actions ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="section-title">{title}</h2> : null}
            {description ? <p className="section-subtitle mt-1">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn('min-h-0', bodyClassName)}>{children}</div>
    </section>
  )
}
