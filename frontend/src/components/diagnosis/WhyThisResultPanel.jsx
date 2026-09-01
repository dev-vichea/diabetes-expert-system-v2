import { useMemo } from 'react'
import { FlaskConical, HelpCircle, MessageSquareText, Microscope } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const FRIENDLY_LAB_NAMES = {
  hba1c: 'HbA1c',
  fasting_glucose: 'Fasting glucose',
  fasting_plasma_glucose: 'Fasting glucose',
  ogtt_2h: '2-hour glucose tolerance',
  oral_glucose_tolerance_test: '2-hour glucose tolerance',
  random_plasma_glucose: 'Random glucose',
  blood_glucose: 'Blood glucose',
}

function getFriendlyLabName(key) {
  return FRIENDLY_LAB_NAMES[String(key || '').toLowerCase()] || String(key || '')
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function EvidenceChip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
      {children}
    </span>
  )
}

function ResultRow({ icon: Icon, label, children }) {
  return (
    <div className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-start sm:gap-5">
      <div className="flex w-full shrink-0 items-center gap-2 sm:w-48">
        <Icon className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{label}</p>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export function WhyThisResultPanel({ result }) {
  const { t, tExact } = useLanguage()

  const symptoms = Array.isArray(result?.matched_symptoms) ? result.matched_symptoms : []
  const risks = Array.isArray(result?.matched_risk_factors) ? result.matched_risk_factors : []
  const keyLabs = result?.explanation?.key_findings?.key_labs
  const labEntries = useMemo(() => {
    if (!keyLabs || typeof keyLabs !== 'object') return []
    return Object.entries(keyLabs)
      .filter(([, value]) => value !== null && value !== undefined && value !== '' && !Number.isNaN(Number(value)))
      .map(([key, value]) => ({ key, value: Number(value) }))
  }, [keyLabs])

  const completeness = result?.evidence_completeness || result?.explanation?.key_findings?.evidence_completeness || {}
  const missingRaw = Array.isArray(result?.missing_inputs) && result.missing_inputs.length
    ? result.missing_inputs
    : (Array.isArray(completeness?.missing_recommended_labs) ? completeness.missing_recommended_labs : [])
  const missingLabs = missingRaw.map((key) => getFriendlyLabName(key))
  const completenessScore = Math.max(0, Math.min(100, Math.round(Number(completeness?.score) || 0)))

  const hasSymptoms = symptoms.length > 0
  const hasRisks = risks.length > 0
  const hasLabs = labEntries.length > 0
  const evidenceCount = symptoms.length + risks.length + labEntries.length

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-[#070b15] dark:ring-slate-800/60">
      <header className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 dark:border-slate-800 dark:bg-[#0a0f1c]/50">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          <p className="text-sm font-extrabold uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">
            {t('diagnosisResult.whyResult.title', 'Why this result?')}
          </p>
        </div>
      </header>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <ResultRow icon={MessageSquareText} label={t('diagnosisResult.whyResult.toldUs', 'What you told us')}>
            {hasSymptoms || hasRisks ? (
              <div className="flex flex-wrap gap-1.5">
                {symptoms.map((item) => (
                  <EvidenceChip key={item}>{tExact(item)}</EvidenceChip>
                ))}
                {risks.map((item) => (
                  <EvidenceChip key={item}>{tExact(item)}</EvidenceChip>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t('diagnosisResult.whyResult.noSymptoms', 'No symptoms or risk factors were reported in this assessment.')}
              </p>
            )}
        </ResultRow>

        <ResultRow icon={FlaskConical} label={t('diagnosisResult.whyResult.measured', 'Lab values you provided')}>
            {hasLabs ? (
              <ul className="space-y-1.5">
                {labEntries.map(({ key, value }) => (
                  <li key={key} className="flex items-center justify-between gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span>{getFriendlyLabName(key)}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{Number.isInteger(value) ? value : value.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t('diagnosisResult.whyResult.noLabs', 'No lab values were provided — the result is based on your reported answers only.')}
              </p>
            )}
        </ResultRow>

        <ResultRow icon={Microscope} label={t('diagnosisResult.whyResult.missingTitle', 'Checks that would help most')}>
            {missingLabs.length ? (
              <ul className="space-y-1.5">
                {missingLabs.map((name) => (
                  <li key={name} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/80 dark:bg-amber-400/80" />
                    <span>{name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t('diagnosisResult.whyResult.allProvided', 'All recommended checks were provided.')}
              </p>
            )}
        </ResultRow>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-[#0a0f1c]/50">
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {t('diagnosisResult.whyResult.summaryPrefix', 'The system matched')}{' '}
            <strong className="font-extrabold text-slate-900 dark:text-slate-100">{evidenceCount}</strong>{' '}
            {t('diagnosisResult.whyResult.summarySuffix', 'piece(s) of information from your assessment.')}
            {missingLabs.length && completenessScore < 85 ? (
              <>
                {' '}
                {t('diagnosisResult.whyResult.limitedNote', 'This result is based on limited information — the missing checks above would make it noticeably more reliable.')}
              </>
            ) : null}
          </p>
      </div>
    </section>
  )
}

