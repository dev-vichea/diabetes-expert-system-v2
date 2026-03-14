import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeStyles = cva('badge', {
  variants: {
    tone: {
      neutral: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-200',
      primary: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/70 dark:bg-cyan-950/45 dark:text-cyan-300',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/45 dark:text-emerald-300',
      warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/45 dark:text-amber-300',
      danger: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/45 dark:text-rose-300',
      info: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/45 dark:text-indigo-300',
      violet: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/45 dark:text-violet-300',
    },
    size: {
      sm: 'px-2 py-0.5 text-[11px]',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    },
  },
  defaultVariants: {
    tone: 'neutral',
    size: 'md',
  },
})

export function StatusBadge({ children, tone = 'neutral', size = 'md', className }) {
  return <span className={cn(badgeStyles({ tone, size }), className)}>{children}</span>
}
