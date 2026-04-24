import { cn } from '@/lib/utils'

export function FilterBar({ className, children, ...props }) {
  return (
    <form className={cn('grid min-w-0 gap-3 [&_button]:w-full sm:[&_button]:w-auto', className)} {...props}>
      {children}
    </form>
  )
}
