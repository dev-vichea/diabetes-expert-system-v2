import { cn } from '@/lib/utils'

/**
 * Base atomic Skeleton primitive with smooth pulse & shimmer styling.
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800/80',
        className
      )}
      {...props}
    />
  )
}

/**
 * Page Header Skeleton: Title, subtitle bar, and optional action buttons.
 */
export function PageHeaderSkeleton({ hasActions = true, className }) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6', className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64" />
        <Skeleton className="h-4 w-72 sm:w-96" />
      </div>
      {hasActions && (
        <div className="flex items-center gap-2.5 shrink-0">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      )}
    </div>
  )
}

/**
 * Stat Cards Skeleton: Grid of metric KPI cards with icon, numerical stat, and caption placeholders.
 */
export function StatCardsSkeleton({ count = 4, className }) {
  const cards = Array.from({ length: count })
  return (
    <div
      className={cn(
        'grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6',
        className
      )}
    >
      {cards.map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between"
        >
          <div className="space-y-2 flex-1 pr-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  )
}

/**
 * Table Skeleton: Structured table header and animated rows with realistic column widths.
 */
export function TableSkeleton({ rows = 5, columns = 5, className }) {
  const rowList = Array.from({ length: rows })
  const colList = Array.from({ length: columns })

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900', className)}>
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex items-center justify-between gap-4">
          {colList.map((_, idx) => (
            <Skeleton
              key={idx}
              className={cn(
                'h-3.5',
                idx === 0 ? 'w-28 sm:w-36' : idx === colList.length - 1 ? 'w-16' : 'w-20'
              )}
            />
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {rowList.map((_, rIdx) => (
          <div key={rIdx} className="flex items-center justify-between gap-4 px-5 py-4">
            {colList.map((_, cIdx) => (
              <Skeleton
                key={cIdx}
                className={cn(
                  'h-4',
                  cIdx === 0
                    ? 'w-32 sm:w-44'
                    : cIdx === 1
                    ? 'w-24'
                    : cIdx === colList.length - 1
                    ? 'w-16 rounded-lg'
                    : 'w-20'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Card List Skeleton: List of content cards (e.g. patients, protocols, diagnosis results).
 */
export function CardListSkeleton({ count = 4, className }) {
  const cards = Array.from({ length: count })

  return (
    <div className={cn('space-y-4', className)}>
      {cards.map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 space-y-4"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full shrink-0" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Two Column Page Skeleton: Master-detail layout (queue on left, details on right).
 */
export function TwoColumnPageSkeleton({ className }) {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-12 gap-6 items-start', className)}>
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <Skeleton className="h-9 w-full rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        </div>
        <CardListSkeleton count={4} />
      </div>

      <div className="lg:col-span-7 space-y-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3.5 w-64" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Dashboard Skeleton: Complete KPI stats + Chart wireframe + Recent items preview.
 */
export function DashboardSkeleton({ className }) {
  return (
    <div className={cn('space-y-6 animate-in fade-in duration-150', className)}>
      <PageHeaderSkeleton hasActions={true} />
      <StatCardsSkeleton count={4} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-7 w-28 rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>

        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-3 p-2">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-3 p-2">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Adaptive Route-Level Full Page Skeleton.
 */
export function PageSkeleton({ className }) {
  return (
    <div className={cn('space-y-6 pb-12 animate-in fade-in duration-150', className)}>
      <PageHeaderSkeleton hasActions={true} />
      <StatCardsSkeleton count={4} />
      <TableSkeleton rows={5} columns={5} />
    </div>
  )
}

/**
 * Table Skeleton Rows for direct placement inside <tbody>.
 */
export function TableSkeletonRows({ rows = 5, columns = 5 }) {
  const rowList = Array.from({ length: rows })
  const colList = Array.from({ length: columns })

  return (
    <>
      {rowList.map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
          {colList.map((_, cIdx) => (
            <td key={cIdx} className="py-3.5 px-3">
              <Skeleton
                className={cn(
                  'h-4',
                  cIdx === 0
                    ? 'w-32 sm:w-44'
                    : cIdx === 1
                    ? 'w-24'
                    : cIdx === colList.length - 1
                    ? 'w-16 ml-auto rounded-lg'
                    : 'w-20'
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/**
 * Form Skeleton with realistic field groups and buttons.
 */
export function FormSkeleton({ fields = 4, className }) {
  const items = Array.from({ length: fields })
  return (
    <div className={cn('space-y-5 animate-in fade-in duration-150', className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((_, idx) => (
          <div key={idx} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  )
}

/**
 * Specialized Skeleton for the Diagnosis Result Report page.
 */
export function DiagnosisResultSkeleton({ className }) {
  return (
    <div className={cn('space-y-6 pb-12 animate-in fade-in duration-150', className)}>
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48 sm:w-64" />
            <Skeleton className="h-3.5 w-36" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>

      {/* Hero Assessment Banner */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,0.75fr)] gap-6 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-56 sm:w-72" />
              </div>
            </div>
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-3/4 max-w-lg" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="pt-2">
              <Skeleton className="h-10 w-44 rounded-xl" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800/80 dark:bg-slate-800/40 flex flex-col items-center justify-center text-center space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-28 w-28 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>

      {/* Key Indicators / Labs */}
      <StatCardsSkeleton count={4} />

      {/* 2-Column Findings & Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

