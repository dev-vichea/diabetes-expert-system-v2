import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoadingState({ label = 'Loading...', className }) {
  return (
    <div className={cn('state-box flex items-center justify-center gap-2', className)}>
      <Loader2 className="h-4 w-4 animate-spin text-slate-500" aria-hidden />
      <span>{label}</span>
    </div>
  )
}
