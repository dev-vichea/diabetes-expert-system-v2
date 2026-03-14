import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ErrorAlert({ message, className }) {
  if (!message) return null

  return (
    <div className={cn('error-box flex items-start gap-2', className)} role="alert">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>{message}</p>
    </div>
  )
}
