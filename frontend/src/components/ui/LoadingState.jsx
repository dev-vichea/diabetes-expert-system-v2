import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

export function LoadingState({ label, className }) {
  const { t } = useLanguage()

  return (
    <div className={cn('state-box flex items-center justify-center gap-2', className)}>
      <Loader2 className="h-4 w-4 animate-spin text-slate-500" aria-hidden />
      <span>{label ?? t('common.loading')}</span>
    </div>
  )
}
