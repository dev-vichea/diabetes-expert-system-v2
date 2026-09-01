import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

function typeLabelKey(type) {
  if (type === 'Type 1') return 'diagnosisResult.type.type1'
  if (type === 'Type 2') return 'diagnosisResult.type.type2'
  if (type === 'Gestational') return 'diagnosisResult.type.gestational'
  if (type === 'Mixed features') return 'diagnosisResult.type.mixed'
  return 'diagnosisResult.type.undetermined'
}

export function PlainSummaryStrip({ result }) {
  const { t, tExact } = useLanguage()

  const symptoms = Array.isArray(result?.matched_symptoms) ? result.matched_symptoms : []
  const risks = Array.isArray(result?.matched_risk_factors) ? result.matched_risk_factors : []
  const keyLabs = result?.explanation?.key_findings?.key_labs
  const labCount = keyLabs && typeof keyLabs === 'object'
    ? Object.values(keyLabs).filter((value) => value !== null && value !== undefined && value !== '' && !Number.isNaN(Number(value))).length
    : 0
  const matchedCount = symptoms.length + risks.length + labCount

  const typeSentence = useMemo(() => {
    const st = result?.suspected_type
    if (!st || !st.type) return null

    const label = (value) => t(typeLabelKey(value), String(value))

    if (st.type === 'Undetermined' || st.type === 'Mixed features') {
      const pool = Array.isArray(st.candidates) && st.candidates.length ? st.candidates : (Array.isArray(st.matches) ? st.matches : [])
      const top = pool.slice(0, 2)
      if (top.length >= 2) {
        return t('diagnosisResult.plainSummary.couldFitTwo', 'The signs could fit {{first}} ({{firstPercent}}%) or {{second}} ({{secondPercent}}%) — the first steps are the same either way.', {
          first: label(top[0].type),
          firstPercent: Math.round(Number(top[0].certainty || 0) * 100),
          second: label(top[1].type),
          secondPercent: Math.round(Number(top[1].certainty || 0) * 100),
        })
      }
    }
    if (st.type !== 'Undetermined') {
      return t('diagnosisResult.plainSummary.typeFit', 'The pattern fits {{type}}.', { type: label(st.type) })
    }
    return t('diagnosisResult.plainSummary.noType', 'No single diabetes type pattern stood out yet.')
  }, [result, t, tExact])

  const matchedSentence = matchedCount > 0
    ? t('diagnosisResult.plainSummary.matchedMany', 'Your answers matched {{count}} common sign(s) associated with high blood sugar.', { count: matchedCount })
    : t('diagnosisResult.plainSummary.matchedFew', 'This run included little direct evidence — the result leans on general risk patterns.')

  const nextStep = result?.recommendations && Array.isArray(result.recommendations) && result.recommendations[0]?.text
    ? tExact(String(result.recommendations[0].text))
    : null

  return (
    <section className="rounded-2xl bg-cyan-50/70 px-5 py-4 ring-1 ring-cyan-100 dark:bg-cyan-500/5 dark:ring-cyan-500/20">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-cyan-800 dark:text-cyan-300">
            {t('diagnosisResult.plainSummary.title', 'In short')}
          </p>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            <li className="flex items-start gap-2">
              <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/70 dark:bg-cyan-400/70" />
              <span>{t('diagnosisResult.plainSummary.whatThisIs', 'This report compares your answers with common patterns of diabetes. It is a screening — not a final diagnosis. A doctor and a simple test can confirm.')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/70 dark:bg-cyan-400/70" />
              <span>{matchedSentence}</span>
            </li>
            {typeSentence ? (
              <li className="flex items-start gap-2">
                <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/70 dark:bg-cyan-400/70" />
                <span>{typeSentence}</span>
              </li>
            ) : null}
            {nextStep ? (
              <li className="flex items-start gap-2">
                <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/70 dark:bg-cyan-400/70" />
                <span>
                  {t('diagnosisResult.plainSummary.nextStep', 'Next step:')}{' '}
                  <strong className="font-bold text-slate-900 dark:text-white">{nextStep}</strong>
                </span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  )
}
