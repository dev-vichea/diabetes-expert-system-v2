import { cn } from '@/lib/utils'

export function FilterBar({ className, children, ...props }) {
  return (
    <form className={cn('grid gap-3', className)} {...props}>
      {children}
    </form>
  )
}
