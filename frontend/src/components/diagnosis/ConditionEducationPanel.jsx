import { useMemo, useState } from 'react'
import { BookOpen, ChevronDown, ExternalLink, HeartPulse, Info, Pill } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

// Verified MedlinePlus reference pages (U.S. National Library of Medicine)
const MEDLINEPLUS_LINKS = {
  general: 'https://medlineplus.gov/diabetes.html',
  type1: 'https://medlineplus.gov/diabetestype1.html',
  type2: 'https://medlineplus.gov/diabetestype2.html',
  gestational: 'https://medlineplus.gov/ency/article/000896.htm',
  prediabetes: 'https://medlineplus.gov/prediabetes.html',
}

function toList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : []
}

export function resolveEducationCondition(result) {
  const rawSuspected = result?.suspected_type ?? result?.explanation_trace?.suspected_type
  const suspectedType = typeof rawSuspected === 'string' ? rawSuspected : String(rawSuspected?.type || '')
  const normalizedType = suspectedType.toLowerCase()

  if (normalizedType.includes('type 1')) return 'type1'
  if (normalizedType.includes('type 2')) return 'type2'
  if (normalizedType.includes('gestational')) return 'gestational'

  const diagnosis = String(result?.diagnosis || '').toLowerCase()
  if (diagnosis.includes('prediabetes')) return 'prediabetes'
  if (diagnosis.includes('gestational')) return 'gestational'

  return 'general'
}

function EducationBlock({ icon: Icon, title, bullets }) {
  if (!bullets.length) return null

  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/60">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200">{title}</p>
      </div>
      <ul className="mt-3 space-y-2">
        {bullets.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/70 dark:bg-cyan-400/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ConditionEducationPanel({ result, defaultOpen = false }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(defaultOpen)
  const condition = useMemo(() => resolveEducationCondition(result), [result])

  const content = t(`diagnosisResult.education.conditions.${condition}`, null)
  const name = typeof content?.name === 'string' ? content.name : ''
  const tagline = typeof content?.tagline === 'string' ? content.tagline : ''
  const whatBullets = toList(content?.what)
  const symptomBullets = toList(content?.symptoms)
  const careBullets = toList(content?.care)
  const link = MEDLINEPLUS_LINKS[condition] || MEDLINEPLUS_LINKS.general

  const hasContent = Boolean(name) && (whatBullets.length || symptomBullets.length || careBullets.length)
  if (!hasContent) return null

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-[#070b15] dark:ring-slate-800/60">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0a0f1c]/50 dark:hover:bg-[#0a0f1c]"
      >
        <BookOpen className="h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">
            {t('diagnosisResult.education.titlePrefix', 'Understanding')} {name}
          </span>
          {tagline ? (
            <span className="mt-0.5 block text-xs font-medium normal-case tracking-normal text-slate-500 dark:text-slate-400">
              {tagline}
            </span>
          ) : null}
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-3">
            <EducationBlock icon={Info} title={t('diagnosisResult.education.whatTitle', 'What is it?')} bullets={whatBullets} />
            <EducationBlock icon={HeartPulse} title={t('diagnosisResult.education.symptomsTitle', 'Common symptoms')} bullets={symptomBullets} />
            <EducationBlock icon={Pill} title={t('diagnosisResult.education.careTitle', 'Treatment & care')} bullets={careBullets} />
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {t('diagnosisResult.education.disclaimer', 'Educational background only — always follow your healthcare provider’s advice.')}
            </p>
            <a
              href={link}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-cyan-700 transition-colors hover:text-cyan-600 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              {t('diagnosisResult.education.learnMore', 'Full guide on MedlinePlus')}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      ) : null}
    </section>
  )
}
