import { useState } from 'react'
import { ChevronDown, Code2, Info } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export function TechnicalDetailsSection({ children }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Code2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {t('diagnosisResult.technical.title', 'Technical details — how the engine decided')}
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Clinician / EMR
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              {t('diagnosisResult.technical.subtitle', 'The behind-the-scenes rules and data the expert system used. You can skip this — the summary above already tells the story.')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <span>{open ? 'Hide technical details' : 'View technical details'}</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open ? (
        <div className="space-y-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800/70 dark:bg-[#070b15] sm:p-6">
          <div className="flex items-start gap-2.5 border-b border-slate-100 pb-4 dark:border-slate-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {t('diagnosisResult.technical.plainNote', 'In simple words: the system compared the answers with known medical rules. Every rule that matched adds a small piece of evidence, and complete lab results make the conclusion more certain. Your doctor can read this section to double-check exactly why the system reached its conclusion.')}
            </p>
          </div>
          {children}
        </div>
      ) : null}
    </section>
  )
}
