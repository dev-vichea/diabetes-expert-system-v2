import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-auto flex-wrap items-center gap-2 rounded-2xl bg-slate-100/80 p-1.5 text-slate-500 dark:bg-slate-900/70 dark:text-slate-400',
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex min-h-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-[color,background-color,box-shadow,transform] duration-200 ease-out hover:bg-white/70 hover:text-slate-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 data-[state=active]:-translate-y-0.5 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-200 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 dark:data-[state=active]:bg-[#10182c] dark:data-[state=active]:text-slate-50 dark:data-[state=active]:ring-slate-700',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
