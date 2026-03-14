import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SearchInput({ className, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input className="input-base pl-9" {...props} />
    </div>
  )
}
