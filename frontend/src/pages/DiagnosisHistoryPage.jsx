import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, ArrowRight, ClipboardList, Clock3, FileText, Sparkles } from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { EmptyState, ErrorAlert, SectionCard, StatusBadge } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'

function toCertaintyPercent(certainty) {
  const numeric = Number(certainty)
  if (Number.isNaN(numeric)) return 0
  const raw = numeric <= 1 ? numeric * 100 : numeric
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function toReadableLabel(value) {
  const text = String(value || '').trim()
  if (!text) return 'N/A'
  return text
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getConfidenceTone(percent) {
  if (percent >= 85) return 'danger'
  if (percent >= 70) return 'warning'
  if (percent >= 45) return 'primary'
  return 'success'
}

function getConfidenceBarClass(percent) {
  if (percent >= 85) return 'from-rose-500 via-red-500 to-red-600'
  if (percent >= 70) return 'from-orange-400 via-orange-500 to-amber-600'
  if (percent >= 45) return 'from-amber-400 via-yellow-500 to-amber-600'
  return 'from-emerald-400 via-emerald-500 to-teal-600'
}

function getConfidenceCopy(percent, t) {
  if (percent >= 85) return t('diagnosisResult.probability.veryHigh', 'very high probability')
  if (percent >= 70) return t('diagnosisResult.probability.high', 'high probability')
  if (percent >= 45) return t('diagnosisResult.probability.moderate', 'moderate probability')
  return t('diagnosisResult.probability.low', 'low probability')
}

function getUrgencyMeta(result, t) {
  if (result?.is_urgent) {
    return {
      tone: 'danger',
      label: t('patientDashboard.status.needsAttention', 'Needs attention'),
    }
  }

  if (result?.review_note) {
    return {
      tone: 'primary',
      label: t('reviewPage.details.reviewed', 'Reviewed'),
    }
  }

  return {
    tone: 'success',
    label: t('patientDashboard.status.stable', 'Stable'),
  }
}

function getRecommendationPreview(result, t, tExact) {
  const recommendation = tExact(result?.recommendation)
  if (recommendation) return recommendation
  return t('common.notAvailable')
}

export function DiagnosisHistoryPage() {
  const { t, tExact, language } = useLanguage()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadResults() {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/diagnosis/mine')
      setResults(getApiData(response) || [])
    } catch (err) {
      setError(getApiErrorMessage(err, t('myResults.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [])

  const latest = results[0]
  const latestPercent = latest ? toCertaintyPercent(latest.certainty) : 0
  const latestUrgency = getUrgencyMeta(latest, t)
  const latestConclusion = latest?.explanation_trace?.confidence_calculation?.top_conclusion
    ? tExact(latest.explanation_trace.confidence_calculation.top_conclusion) || toReadableLabel(latest.explanation_trace.confidence_calculation.top_conclusion)
    : t('common.notAvailable')

  return (
    <section className="space-y-5">
      <SectionCard
        title={t('myResults.title')}
        description={t('myResults.description')}
        className="overflow-hidden"
      >
        {!latest ? (
          <EmptyState
            className="mt-2"
            icon={ClipboardList}
            title={t('myResults.emptyTitle')}
            description={t('myResults.noExplanationDesc')}
            action={(
              <Link to="/diagnosis" className="btn-primary gap-2">
                <Sparkles className="h-4 w-4" />
                {t('diagnosisResult.backToAssessment', 'Back to Assessment')}
              </Link>
            )}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr_1fr]">
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getConfidenceBarClass(latestPercent)} p-6 text-white shadow-lg`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_32%)]" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={latestUrgency.tone} size="sm" className="border-white/25 bg-white/15 text-white dark:border-white/25 dark:bg-white/15 dark:text-white">
                    {latestUrgency.label}
                  </StatusBadge>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                    {t('diagnosisResult.diagnosticOutput', 'Diagnostic Output')}
                  </span>
                </div>

                <h2 className="mt-4 max-w-3xl text-2xl font-black tracking-tight md:text-3xl">
                  {tExact(latest.diagnosis)}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                  {t('diagnosisResult.probabilityBase', 'Based on comprehensive clinical data, the inference engine calculates a ')}
                  <strong className="font-extrabold text-white"> {getConfidenceCopy(latestPercent, t)}</strong>
                  {t('diagnosisResult.probabilityOf', ' of this diagnosis.')}
                </p>

                <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                      {t('myResults.columns.time')}
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {formatDateTime(latest.created_at, language, t('common.notAvailable'))}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                      {t('diagnosisResult.overallScore', 'Overall Score')}
                    </p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-5xl font-black tracking-tight">{latestPercent}</span>
                      <span className="text-base font-semibold text-white/75">/100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Activity className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-[0.18em]">
                  {t('myResults.latestExplanation')}
                </p>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {t('myResults.topConclusion')}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                {latestConclusion}
              </p>
              <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {t('reviewPage.doctorReview.notesLabel', 'Clinical Notes & Addendum')}
              </p>
              <p className="mt-1 line-clamp-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {latest.review_note || t('common.notAvailable')}
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {t('myResults.columns.certainty')}
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {latestPercent}%
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getConfidenceBarClass(latestPercent)}`}
                    style={{ width: `${latestPercent}%` }}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {t('myResults.columns.recommendation')}
                </p>
                <p className="mt-2 line-clamp-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {getRecommendationPreview(latest, t, tExact)}
                </p>
                <Link
                  to={`/diagnosis/result?diagnosis_result_id=${latest.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                >
                  {t('diagnosisResult.pageTitle', 'Medical Assessment Report')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={t('myResults.title')}
        description={t('myResults.description')}
      >
        {loading ? (
          <div className="mt-2 rounded-3xl border border-dashed border-slate-200 p-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {t('myResults.loading')}
          </div>
        ) : !results.length ? null : (
          <div className="mt-2 space-y-3">
            {results.map((result) => {
              const certaintyPercent = toCertaintyPercent(result.certainty)
              const urgency = getUrgencyMeta(result, t)
              const reviewSummary = result.review_note || t('common.notAvailable')

              return (
                <article
                  key={result.id}
                  className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={urgency.tone} size="sm">{urgency.label}</StatusBadge>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatDateTime(result.created_at, language, t('common.notAvailable'))}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        {tExact(result.diagnosis)}
                      </h3>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {getRecommendationPreview(result, t, tExact)}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <FileText className="h-4 w-4" />
                          {t('myResults.columns.reviewNote')}: {reviewSummary === t('common.notAvailable') ? reviewSummary : t('reviewPage.details.reviewed', 'Reviewed')}
                        </span>
                        {result.is_urgent ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                            <AlertTriangle className="h-4 w-4" />
                            {result.urgent_reason || t('common.yes')}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[240px]">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            {t('myResults.columns.certainty')}
                          </p>
                          <StatusBadge tone={getConfidenceTone(certaintyPercent)} size="sm">
                            {certaintyPercent}%
                          </StatusBadge>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${getConfidenceBarClass(certaintyPercent)}`}
                            style={{ width: `${certaintyPercent}%` }}
                          />
                        </div>
                      </div>

                      <Link
                        to={`/diagnosis/result?diagnosis_result_id=${result.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-300 dark:hover:bg-cyan-950/40"
                      >
                        {t('diagnosisResult.pageTitle', 'Medical Assessment Report')}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </SectionCard>

      <ErrorAlert message={error} />
    </section>
  )
}
