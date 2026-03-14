import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ConfirmDialog({
  open,
  title = 'Confirm action',
  description = 'This action cannot be undone.',
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  confirmTone = 'danger',
  loading = false,
  onCancel,
  onConfirm,
}) {
  const titleId = useId()
  const descriptionId = useId()
  const isDanger = confirmTone === 'danger'

  useEffect(() => {
    if (!open) return undefined

    function handleEscape(event) {
      if (event.key === 'Escape' && !loading) {
        onCancel?.()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, loading, onCancel])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-4 backdrop-blur-[2px] animate-in fade-in-0"
      onClick={() => {
        if (!loading) onCancel?.()
      }}
    >
      <div
        className="dark-hover-border w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1f2640] dark:bg-[#070712] animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-6 py-5 dark:border-[#1f2640]">
          <div className="flex items-start gap-4">
            <span
              className={cn(
                'mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full',
                isDanger ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/45 dark:text-rose-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-950/45 dark:text-sky-300'
              )}
            >
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
              <p id={descriptionId} className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end dark:bg-[#0c1324]">
          <button
            type="button"
            className="btn-secondary w-full sm:w-auto"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={cn(confirmTone === 'danger' ? 'btn-danger' : 'btn-primary', 'w-full sm:w-auto')}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
