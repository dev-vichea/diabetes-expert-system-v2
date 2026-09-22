import { PageSkeleton } from '@/components/ui/Skeleton'

/**
 * RouteLoading – Suspense fallback for lazy-loaded route chunks.
 *
 * Renders a full content-aware PageSkeleton inside the app shell
 * so navigation context stays visible and layout shift is eliminated.
 */
export function RouteLoading() {
  return (
    <div className="w-full flex-1" role="status" aria-live="polite">
      <PageSkeleton />
    </div>
  )
}