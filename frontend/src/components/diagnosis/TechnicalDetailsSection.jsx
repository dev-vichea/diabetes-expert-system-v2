import { useState } from 'react'
import { ChevronDown, Code2, Info } from 'lucide-react'
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
            {t('diagnosisResult.technical.title', 'Technical details — how the engine decided')}
          </span>
          <span className="mt-0.5 block text-xs font-medium normal-case tracking-normal text-slate-500 dark:text-slate-400">
            {t('diagnosisResult.technical.subtitle', 'The behind-the-scenes rules and data the expert system used. You can skip this — the summary above already tells the story.')}
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-start gap-2.5 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3 dark:border-sky-900/50 dark:bg-sky-950/30">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />
            <p className="text-sm leading-relaxed text-sky-900 dark:text-sky-200">
              {t('diagnosisResult.technical.plainNote', 'In simple words: the system compared the answers with known medical rules. Every rule that matched adds a small piece of evidence, and complete lab results make the conclusion more certain. Your doctor can read this section to double-check exactly why the system reached its conclusion.')}
            </p>
          </div>
          {children}
        </div>
      ) : null}
    </section>
  )
}
