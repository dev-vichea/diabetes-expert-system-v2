import { useState } from 'react'
import { ChevronDown, Code2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export function TechnicalDetailsSection({ children }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-[#070b15] dark:ring-slate-800/60">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0a0f1c]/50 dark:hover:bg-[#0a0f1c]"
      >
        <Code2 className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold uppercase tracking-[0.1em] text-slate-700 dark:text-slate-200">
            {t('diagnosisResult.technical.title', 'Technical details — clinician view')}
          </span>
          <span className="mt-0.5 block text-xs font-medium normal-case tracking-normal text-slate-500 dark:text-slate-400">
            {t('diagnosisResult.technical.subtitle', 'Raw rule-matching trace used by the inference engine. Patients can safely ignore this section.')}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? <div className="space-y-4 p-4 sm:p-5">{children}</div> : null}
    </section>
  )
}
