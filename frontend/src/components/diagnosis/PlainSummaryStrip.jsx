import { ArrowRight, CircleHelp, ListChecks, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export function PlainSummaryStrip({ result }) {
  const { t, tExact } = useLanguage()

  const symptoms = Array.isArray(result?.matched_symptoms) ? result.matched_symptoms : []
  const risks = Array.isArray(result?.matched_risk_factors) ? result.matched_risk_factors : []
  const keyLabs = result?.explanation?.key_findings?.key_labs
  const labCount = keyLabs && typeof keyLabs === 'object'
    ? Object.values(keyLabs).filter((value) => value !== null && value !== undefined && value !== '' && !Number.isNaN(Number(value))).length
    : 0
  const matchedCount = symptoms.length + risks.length + labCount

  const matchedSentence = matchedCount > 0
    ? t('diagnosisResult.plainSummary.matchedMany', 'Your answers matched {{count}} common sign(s) associated with high blood sugar.', { count: matchedCount })
    : t('diagnosisResult.plainSummary.matchedFew', 'This run included little direct evidence — the result leans on general risk patterns.')

  const nextStep = result?.recommendations && Array.isArray(result.recommendations) && result.recommendations[0]?.text
    ? tExact(String(result.recommendations[0].text))
    : null

  const summaryItems = [
    {
      title: t('diagnosisResult.plainSummary.meaningTitle', 'What this means'),
      text: t('diagnosisResult.plainSummary.meaningSimple', 'This is a screening result, not a final diagnosis. A clinician and a blood test can confirm it.'),
      icon: CircleHelp,
      tone: 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300',
    },
    {
      title: t('diagnosisResult.plainSummary.whyTitle', 'Why this result'),
      text: matchedSentence,
      icon: ListChecks,
      tone: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
    },
    {
      title: t('diagnosisResult.plainSummary.nextStepTitle', 'Next step'),
      text: nextStep || t('diagnosisResult.plainSummary.defaultNextStep', 'Discuss this result with a healthcare professional.'),
      icon: ArrowRight,
      tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    },
  ]

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5 px-1">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-100/70 text-cyan-700 ring-1 ring-cyan-200/60 dark:bg-cyan-900/40 dark:text-cyan-300 dark:ring-cyan-800/60">
          <Sparkles className="h-4 w-4" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
          {t('diagnosisResult.plainSummary.glanceTitle', 'Your result at a glance')}
        </h3>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {summaryItems.map(({ title, text, icon: Icon, tone }) => (
          <article key={title} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800/70 dark:bg-[#070b15] sm:p-5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-[18px] w-[18px]" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">{text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
