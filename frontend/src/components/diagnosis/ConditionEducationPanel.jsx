import { useMemo, useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  HeartPulse,
  HelpCircle,
  Activity,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

// Verified MedlinePlus reference pages (U.S. National Library of Medicine)
const MEDLINEPLUS_LINKS = {
  general: 'https://medlineplus.gov/diabetes.html',
  no_strong_indication: 'https://medlineplus.gov/bloodsugar.html',
  type1: 'https://medlineplus.gov/diabetestype1.html',
  type2: 'https://medlineplus.gov/diabetestype2.html',
  gestational: 'https://medlineplus.gov/ency/article/000896.htm',
  prediabetes: 'https://medlineplus.gov/prediabetes.html',
}

function toList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : []
}

export function resolveEducationCondition(result) {
  if (result?.condition_key && MEDLINEPLUS_LINKS[result.condition_key]) {
    return result.condition_key
  }
  if (result?.education_condition && MEDLINEPLUS_LINKS[result.education_condition]) {
    return result.education_condition
  }

  const rawSuspected = result?.suspected_type ?? result?.explanation_trace?.suspected_type
  const suspectedType = typeof rawSuspected === 'string' ? rawSuspected : String(rawSuspected?.type || '')
  const normalizedType = suspectedType.toLowerCase()
  const diagnosis = String(result?.diagnosis || '').toLowerCase()

  if (
    diagnosis.includes('no strong') ||
    diagnosis.includes('healthy') ||
    diagnosis.includes('low risk') ||
    diagnosis.includes('insufficient') ||
    diagnosis.includes('normal') ||
    diagnosis.includes('គ្មានការចង្អុលបង្ហាញ') ||
    diagnosis.includes('ធម្មតា') ||
    diagnosis.includes('ហានិភ័យទាប')
  ) {
    return 'no_strong_indication'
  }

  if (normalizedType.includes('type 1') || diagnosis.includes('type 1') || diagnosis.includes('ប្រភេទ 1')) return 'type1'
  if (normalizedType.includes('type 2') || diagnosis.includes('type 2') || diagnosis.includes('ប្រភេទ 2')) return 'type2'
  if (normalizedType.includes('gestational') || diagnosis.includes('gestational') || diagnosis.includes('ពេលមានផ្ទៃពោះ')) return 'gestational'
  if (diagnosis.includes('prediabetes') || normalizedType.includes('prediabetes') || diagnosis.includes('មុនទឹកនោមផ្អែម')) return 'prediabetes'

  return 'general'
}

function EducationSection({ icon: Icon, title, bullets }) {
  if (!bullets.length) return null

  return (
    <div className="py-5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2.5 mb-3">
        <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </h4>
      </div>
      <ul className="space-y-2.5">
        {bullets.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/70 dark:bg-cyan-400/70" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ConditionEducationPanel({ result, defaultOpen = true }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(defaultOpen)
  const condition = useMemo(() => resolveEducationCondition(result), [result])

  const content = t(`diagnosisResult.education.conditions.${condition}`, null)
  const name = typeof content?.name === 'string' ? content.name : ''
  const tagline = typeof content?.tagline === 'string' ? content.tagline : ''
  const whatBullets = toList(content?.what)
  const causesBullets = toList(content?.causes)
  const symptomBullets = toList(content?.symptoms)
  const careBullets = toList(content?.care)
  const link = MEDLINEPLUS_LINKS[condition] || MEDLINEPLUS_LINKS.general

  const hasContent = Boolean(name) && (whatBullets.length || causesBullets.length || symptomBullets.length || careBullets.length)
  if (!hasContent) return null

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-100/70 text-cyan-700 ring-1 ring-cyan-200/60 dark:bg-cyan-900/40 dark:text-cyan-300 dark:ring-cyan-800/60">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {t('diagnosisResult.education.titlePrefix', 'Understanding')} {name}
              </h3>
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 ring-1 ring-cyan-200/60 dark:bg-cyan-950/60 dark:text-cyan-300 dark:ring-cyan-800/60">
                Patient Guide
              </span>
            </div>
            {tagline ? (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                {tagline}
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <span>{open ? 'Collapse guide' : 'Expand guide'}</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800/70 dark:bg-[#070b15] sm:p-6">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <EducationSection
              icon={HelpCircle}
              title={t('diagnosisResult.education.whatTitle', 'What is it?')}
              bullets={whatBullets}
            />
            <EducationSection
              icon={Activity}
              title={t('diagnosisResult.education.causesTitle', 'What causes it?')}
              bullets={causesBullets}
            />
            <EducationSection
              icon={HeartPulse}
              title={t('diagnosisResult.education.symptomsTitle', 'Common signs')}
              bullets={symptomBullets}
            />
            <EducationSection
              icon={Sparkles}
              title={t('diagnosisResult.education.careTitle', 'Can it be reversed / What to do')}
              bullets={careBullets}
            />
          </div>

          <div className="mt-6 flex flex-col gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {t('diagnosisResult.education.disclaimer', 'Educational background only — always follow your healthcare provider’s advice.')}
            </p>
            <a
              href={link}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-cyan-700 transition-colors hover:text-cyan-600 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300"
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

