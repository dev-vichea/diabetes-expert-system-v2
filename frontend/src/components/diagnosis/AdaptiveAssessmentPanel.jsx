import { Dna, ShieldAlert, ShieldCheck, TrendingUp } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { FIELD_FALLBACKS, fieldLabelKey } from '@/components/assessment/interview-flow'

/* Human-readable labels for synthetic evidence keys the engine derives
   (they are not plain answer fields). */
const SYNTHETIC_EVIDENCE = {
  rapid_onset: 'Sudden onset of symptoms',
  gradual_onset: 'Gradual build-up of symptoms',
  age_under_18: 'Age under 18',
  age_35_plus: 'Age 35 or older',
  age_45_plus: 'Age 45 or older',
  elevated_bmi: 'Elevated BMI / overweight',
  lab_hyperglycemia: 'Lab-elevated blood glucose',
  critical_lab_values: 'Critically high lab values',
  crisis: 'Critical condition reported',
}

function prettyKey(key) {
  return String(key || '')
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function EvidenceChip({ children, tone = 'support' }) {
  const tones = {
    support: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    conflict: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.support}`}>
      {children}
    </span>
  )
}

export function getAdaptiveAssessment(result) {
  if (!result || typeof result !== 'object') return null
  if (result.adaptive_assessment && typeof result.adaptive_assessment === 'object') {
    return result.adaptive_assessment
  }
  const trace = result.explanation_trace
  if (trace && typeof trace === 'object' && trace.adaptive_assessment) {
    return trace.adaptive_assessment
  }
  return null
}

export function AdaptiveAssessmentPanel({ result }) {
  const { t, tExact } = useLanguage()
  const assessment = getAdaptiveAssessment(result)
  if (!assessment) return null

  const patterns = Array.isArray(assessment.patterns) ? assessment.patterns : []
  const uncertainty = assessment.uncertainty || {}
  const explanation = Array.isArray(assessment.explanation) ? assessment.explanation : []
  const sufficient = assessment.status === 'sufficient'

  const evidenceLabel = (key) => {
    if (SYNTHETIC_EVIDENCE[key]) {
      return t(`diagnosisResult.adaptive.evidence.${key}`, SYNTHETIC_EVIDENCE[key])
    }
    return tExact(key) || t(fieldLabelKey(key), FIELD_FALLBACKS[key] || prettyKey(key))
  }

  const explanationText = (item) => {
    const params = item.params || {}
    let text = t(`diagnosisResult.adaptive.exp.${item.key}`, prettyKey(item.key))
    Object.entries(params).forEach(([name, value]) => {
      const replacement = name === 'primary' || name === 'secondary'
        ? t(`diagnosisResult.adaptive.pattern.${value}`, prettyKey(value))
        : String(value)
      text = text.replaceAll(`{${name}}`, replacement)
    })
    return text
  }
// ── panel part 1 end ──
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-[#070b15] dark:ring-slate-800/60">
      <header className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 dark:border-slate-800 dark:bg-[#0a0f1c]/50">
        <div className="flex items-center gap-2.5">
          <Dna className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          <p className="text-sm font-extrabold uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">
            {t('diagnosisResult.adaptive.title', 'Detected patterns & evidence')}
          </p>
        </div>
      </header>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <div className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-48">
            <TrendingUp className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              {t('diagnosisResult.adaptive.patternsTitle', 'Pattern analysis')}
            </p>
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            {patterns.length ? patterns.map((pattern, index) => (
              <div key={pattern.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t(`diagnosisResult.adaptive.pattern.${pattern.id}`, prettyKey(pattern.id))}
                    {index === 0 && sufficient ? (
                      <span className="ml-2 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                        {t('diagnosisResult.adaptive.strongest', 'Strongest match')}
                      </span>
                    ) : null}
                  </p>
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                    {t('diagnosisResult.adaptive.strength', 'Strength')}: {Math.round((Number(pattern.strength) || 0) * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600"
                    style={{ width: `${Math.round((Number(pattern.strength) || 0) * 100)}%` }}
                  />
                </div>
                {Array.isArray(pattern.supporting) && pattern.supporting.length ? (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {t('diagnosisResult.adaptive.supporting', 'Supporting')}:
                    </span>
                    {pattern.supporting.map((key) => (
                      <EvidenceChip key={key}>{evidenceLabel(key)}</EvidenceChip>
                    ))}
                  </div>
                ) : null}
                {Array.isArray(pattern.conflicting) && pattern.conflicting.length ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {t('diagnosisResult.adaptive.conflicting', 'Conflicting')}:
                    </span>
                    {pattern.conflicting.map((key) => (
                      <EvidenceChip key={key} tone="conflict">{evidenceLabel(key)}</EvidenceChip>
                    ))}
                  </div>
                ) : null}
              </div>
            )) : (
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t('diagnosisResult.adaptive.noPatterns', 'No diabetes-like pattern was detected from the answers provided.')}
              </p>
            )}
          </div>
        </div>
// ── panel part 2 end ──

        <div className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-48">
            <ShieldAlert className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              {t('diagnosisResult.adaptive.uncertaintyTitle', 'Uncertainty')}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t(`diagnosisResult.adaptive.uncertainty.${uncertainty.level || 'moderate'}`, prettyKey(uncertainty.level || 'moderate'))}
            </p>
            {Array.isArray(uncertainty.reasons) && uncertainty.reasons.length ? (
              <ul className="mt-1.5 space-y-1">
                {uncertainty.reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/80 dark:bg-amber-400/80" />
                    <span>{t(`diagnosisResult.adaptive.reason.${reason}`, prettyKey(reason))}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-48">
            <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              {t('diagnosisResult.adaptive.explanationTitle', 'Why these patterns')}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <ul className="space-y-1.5">
              {explanation.map((item, i) => (
                <li key={`${item.key}-${i}`} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/80 dark:bg-cyan-400/80" />
                  <span>{explanationText(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-[#0a0f1c]/50">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {t('diagnosisResult.adaptive.nextStepTitle', 'Recommended next step')}:{' '}
          <span className="font-extrabold text-cyan-700 dark:text-cyan-300">
            {t(`diagnosisResult.adaptive.step.${assessment.recommended_next_step || 'routine_screening'}`, prettyKey(assessment.recommended_next_step))}
          </span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {sufficient
            ? t('diagnosisResult.adaptive.status.sufficient', 'Enough evidence was collected for a screening result.')
            : t('diagnosisResult.adaptive.status.insufficient', 'Insufficient evidence — no result is forced; treat this as guidance only.')}
          {' '}
          {t('diagnosisResult.adaptive.not_a_diagnosis', 'Pattern names are not diagnoses — only a clinician with lab tests can confirm anything.')}
        </p>
      </div>
    </section>
  )
}


