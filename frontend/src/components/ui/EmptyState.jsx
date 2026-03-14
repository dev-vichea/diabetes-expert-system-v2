import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmptyState({ title = 'No data', description, action, icon: Icon = Inbox, className }) {
  return (
    <div className={cn('state-box flex flex-col items-center gap-2', className)}>
      {Icon ? <Icon className="h-5 w-5 text-slate-400" aria-hidden /> : null}
      <p className="font-semibold text-slate-700">{title}</p>
      {description ? <p className="max-w-lg text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
