import { LoadingState } from '@/components/ui/LoadingState'

/**
 * RouteLoading – Suspense fallback for lazy-loaded route chunks.
 *
 * Rendered inside the app shell (or public route trees) so navigation
 * context stays visible while a page chunk is being fetched.
 */
export function RouteLoading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center" role="status" aria-live="polite">
      <LoadingState />
    </div>
  )
}