import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { EmptyState, ErrorAlert, LoadingState, SearchInput, StatCard, StatusBadge, UserAvatar } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { userHasStaffRole } from '@/lib/nav-config'
import { bilingualField } from '@/lib/i18n'
import { getRelativeCheckAge } from '@/components/dashboard/patient/patient-dashboard-utils'
import { cn } from '@/lib/utils'

function toCertaintyPercent(certainty) {
  const numeric = Number(certainty)
  if (Number.isNaN(numeric)) return 0
  const raw = numeric <= 1 ? numeric * 100 : numeric
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function getConfidenceBarClass(percent) {
  if (percent >= 85) return 'from-rose-500 via-red-500 to-red-600'
  if (percent >= 70) return 'from-orange-400 via-orange-500 to-amber-600'
  if (percent >= 45) return 'from-amber-400 via-yellow-500 to-amber-600'
  return 'from-emerald-400 via-emerald-500 to-teal-600'
}

function getHeroGradient(percent, isUrgent) {
  if (isUrgent) {
    return 'bg-gradient-to-br from-rose-600 via-rose-700 to-red-800'
  }
  if (percent >= 70) {
    return 'bg-gradient-to-br from-orange-600 via-amber-600 to-red-700'
  }
  if (percent >= 45) {
    return 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600'
  }
  return 'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700'
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
  const text = result?.recommendation || result?.recommendations?.[0]?.text
  const textKm = result?.recommendations?.[0]?.text_km
  if (text) return tExact(bilingualField(text, textKm))
  return t('common.notAvailable', 'No specific recommendation provided.')
}

function getHeroExplanation(result, percent, t, tExact) {
  if (result?.headline_explanation) {
    return tExact(bilingualField(result.headline_explanation, result.headline_explanation_km))
  }
  if (result?.result_summary) {
    return tExact(bilingualField(result.result_summary, result.result_summary_km))
  }
  const levelName = percent >= 85
    ? t('diagnosisResult.confidenceMeta.veryHigh.title', 'very high')
    : percent >= 70
      ? t('diagnosisResult.confidenceMeta.high.title', 'high')
      : percent >= 45
        ? t('diagnosisResult.confidenceMeta.moderate.title', 'moderate')
        : t('diagnosisResult.confidenceMeta.low.title', 'low')

  return t(
    'myResults.heroExplanation',
    'Based on all available clinical data, the inference engine calculated a {{level}} probability for this assessment.',
    { level: String(levelName).toLowerCase() }
  )
}

function CertaintyRing({ percent, size = 130, stroke = 11 }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0))
  const radius = (size - stroke * 2) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - safePercent / 100)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={center} cy={center} r={radius} strokeWidth={stroke} className="fill-none stroke-white/20" />
      <circle
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="fill-none stroke-white transition-all duration-700 ease-out"
      />
    </svg>
  )
}

function OnboardingEmptyState({ t }) {
  const steps = [
    {
      title: t('patientDashboard.carePlanPage.onboarding.step1', 'Complete a health assessment'),
      text: t('patientDashboard.carePlanPage.onboarding.step1Text', 'Answer quick questions about symptoms, risk factors, and lab values.'),
    },
    {
      title: t('patientDashboard.carePlanPage.onboarding.step2', 'Get your instant result'),
      text: t('patientDashboard.carePlanPage.onboarding.step2Text', 'The expert engine evaluates clinical rules and calculates certainty scores.'),
    },
    {
      title: t('patientDashboard.carePlanPage.onboarding.step3', 'Follow your personal plan'),
      text: t('patientDashboard.carePlanPage.onboarding.step3Text', 'Track progress over time and receive doctor review annotations.'),
    },
  ]

  return (
    <section className="surface mx-auto flex max-w-2xl flex-col items-center rounded-3xl border border-slate-200/80 p-8 text-center shadow-sm dark:border-slate-800 sm:p-12">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
        <ClipboardList className="h-8 w-8" aria-hidden />
      </span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {t('myResults.emptyTitle', 'No diagnosis submissions yet.')}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
        {t('myResults.noExplanationDesc', 'Explanation trace will appear after your first assessment.')}
      </p>

      <ol className="mt-8 w-full space-y-3.5 text-left">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{step.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <Link
        to="/diagnosis"
        className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
      >
        <Plus className="h-4 w-4" />
        {t('patientDashboard.hero.startAssessment', 'Start New Assessment')}
      </Link>
    </section>
  )
}

export function DiagnosisHistoryPage() {
  const { t, tExact, language } = useLanguage()
  const { user } = useAuth()
  const isStaff = userHasStaffRole(user)

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter & search state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'urgent' | 'reviewed' | 'stable'
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'oldest' | 'certainty'

  async function loadResults() {
    setLoading(true)
    setError('')
    try {
      const endpoint = isStaff ? '/diagnosis/recent?limit=100' : '/diagnosis/mine'
      const response = await api.get(endpoint)
      setResults(getApiData(response) || [])
    } catch (err) {
      setError(getApiErrorMessage(err, t('myResults.loadError', 'Failed to load your diagnosis history')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [])

  const latest = results[0]
  const previous = results[1]
  const latestPercent = latest ? toCertaintyPercent(latest.certainty) : 0
  const previousPercent = previous ? toCertaintyPercent(previous.certainty) : null
  const latestUrgency = getUrgencyMeta(latest, t)

  const reviewedCount = useMemo(() => results.filter((r) => Boolean(r.review_note)).length, [results])
  const urgentCount = useMemo(() => results.filter((r) => Boolean(r.is_urgent)).length, [results])
  const stableCount = useMemo(() => results.filter((r) => !r.is_urgent).length, [results])

  // Score progression
  const scoreDiff = previousPercent !== null ? latestPercent - previousPercent : null
  const trendLabel = scoreDiff !== null
    ? scoreDiff > 0
      ? `+${scoreDiff}%`
      : scoreDiff < 0
        ? `${scoreDiff}%`
        : '0%'
    : `${latestPercent}%`

  const pageTitle = isStaff ? t('page.patientResults.title', 'Patient Results') : t('myResults.title', 'My Results')
  const pageSubtitle = isStaff
    ? t('page.patientResults.subtitle', 'All patient assessment results across the clinic')
    : t('myResults.subtitle', 'Track your diagnosis history, certainty progression, and doctor feedback.')

  // Filtered & sorted historical items
  const filteredResults = useMemo(() => {
    return results
      .filter((item) => {
        if (statusFilter === 'urgent' && !item.is_urgent) return false
        if (statusFilter === 'reviewed' && !item.review_note) return false
        if (statusFilter === 'stable' && item.is_urgent) return false

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const diagnosis = String(item.diagnosis || '').toLowerCase()
          const recommendation = String(item.recommendation || '').toLowerCase()
          const note = String(item.review_note || '').toLowerCase()
          const patient = String(item.patient_name || '').toLowerCase()
          return (
            diagnosis.includes(q) ||
            recommendation.includes(q) ||
            note.includes(q) ||
            patient.includes(q)
          )
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') {
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        }
        if (sortBy === 'certainty') {
          return toCertaintyPercent(b.certainty) - toCertaintyPercent(a.certainty)
        }
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      })
  }, [results, statusFilter, searchQuery, sortBy])

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {pageSubtitle}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadResults}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            title={t('myResults.refresh', 'Refresh')}
          >
            <RotateCcw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            <span>{t('myResults.refresh', 'Refresh')}</span>
          </button>

          <Link
            to="/diagnosis"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            <span>{t('myResults.newAssessment', 'New Assessment')}</span>
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} />

      {loading && !results.length ? (
        <LoadingState label={t('myResults.loading', 'Loading diagnosis history...')} className="py-20" />
      ) : !results.length ? (
        <OnboardingEmptyState t={t} />
      ) : (
        <>
          {/* ── Stat Summary Cards ── */}
          <div className="grid min-w-0 grid-cols-2 gap-3.5 lg:grid-cols-4">
            <StatCard
              label={t('myResults.stats.latestScore', 'Latest Score')}
              value={`${latestPercent}%`}
              tone={latestUrgency.tone}
              icon={Activity}
              hint={latest ? `${latestUrgency.label} · ${getRelativeCheckAge(latest.created_at, t) || ''}` : null}
            />
            <StatCard
              label={t('myResults.stats.totalEvaluations', 'Total Evaluations')}
              value={results.length}
              tone="default"
              icon={ClipboardList}
              hint={t('myResults.stats.trackedOverTime', 'Tracked in history')}
            />
            <StatCard
              label={t('myResults.stats.clinicalReviews', 'Clinical Reviews')}
              value={`${reviewedCount}`}
              tone={reviewedCount > 0 ? 'primary' : 'default'}
              icon={Stethoscope}
              hint={reviewedCount > 0 ? t('myResults.stats.reviewedNotes', 'Doctor notes attached') : t('myResults.stats.awaitingReview', 'Awaiting doctor review')}
            />
            <StatCard
              label={t('myResults.stats.trend', 'Score Progression')}
              value={trendLabel}
              tone={scoreDiff !== null ? (scoreDiff > 0 ? 'warning' : 'success') : 'default'}
              icon={scoreDiff !== null && scoreDiff < 0 ? TrendingDown : TrendingUp}
              hint={previous ? t('myResults.stats.vsPrevious', 'vs previous') : t('myResults.stats.firstAssessment', 'Baseline established')}
            />
          </div>

          {/* ── Featured Latest Assessment Hero ── */}
          {latest && (
            <div className={cn('relative overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8', getHeroGradient(latestPercent, latest.is_urgent))}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_35%)]" />
              
              <div className="relative grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)] lg:items-center">
                {/* Left: Headline & Explanation */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={latestUrgency.tone} size="sm" className="border-white/30 bg-white/20 text-white backdrop-blur">
                      {latestUrgency.label}
                    </StatusBadge>
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white/90 backdrop-blur">
                      {t('myResults.hero.latestAssessment', 'Latest Assessment')}
                    </span>
                    <span className="text-xs font-medium text-white/80">
                      {formatDateTime(latest.created_at, t('common.notAvailable'), language)}
                      {getRelativeCheckAge(latest.created_at, t) ? ` · ${getRelativeCheckAge(latest.created_at, t)}` : ''}
                    </span>
                  </div>

                  <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                    {tExact(latest.diagnosis)}
                  </h2>

                  {/* Suspected type if identified */}
                  {(latest.suspected_type?.type || latest.explanation_trace?.suspected_type?.type) && (
                    <div className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      <span>
                        {t('diagnosisResult.suspectedType', 'Suspected type')}:{' '}
                        <strong>{latest.suspected_type?.type || latest.explanation_trace?.suspected_type?.type}</strong>
                      </span>
                    </div>
                  )}

                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
                    {getHeroExplanation(latest, latestPercent, t, tExact)}
                  </p>

                  {/* Quick recommendation pill */}
                  <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-black/15 p-3.5 backdrop-blur-md border border-white/15">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-white/90" />
                    <p className="line-clamp-2 text-xs leading-relaxed text-white/95 sm:text-sm">
                      {getRecommendationPreview(latest, t, tExact)}
                    </p>
                  </div>
                </div>

                {/* Right: Score Gauge + Doctor Feedback + CTA */}
                <div className="flex flex-col gap-4 rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/20 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-white/80">
                        {t('myResults.hero.confidenceScore', 'Screening Confidence')}
                      </p>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-4xl font-black tracking-tight sm:text-5xl">{latestPercent}</span>
                        <span className="text-sm font-bold text-white/75">/ 100</span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-white/85">
                        {latestUrgency.label}
                      </p>
                    </div>

                    <div className="relative flex shrink-0 items-center justify-center">
                      <CertaintyRing percent={latestPercent} size={100} stroke={9} />
                      <span className="absolute text-xl font-black">{latestPercent}%</span>
                    </div>
                  </div>

                  {/* Doctor's Addendum status */}
                  <div className="rounded-xl bg-black/20 p-3.5 border border-white/10 text-xs">
                    <div className="flex items-center gap-2 text-white/90">
                      <Stethoscope className="h-4 w-4 text-white" />
                      <span className="font-bold uppercase tracking-wider">
                        {latest.review_note ? t('myResults.hero.doctorNotes', "Doctor's Notes") : t('myResults.hero.pendingReview', 'Pending Clinician Review')}
                      </span>
                      {latest.review_note && (
                        <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-300" />
                      )}
                    </div>
                    {latest.review_note ? (
                      <p className="mt-2 line-clamp-3 text-white/95 italic leading-relaxed">
                        "{latest.review_note}"
                      </p>
                    ) : (
                      <p className="mt-1.5 text-white/75 leading-relaxed">
                        {t('myResults.hero.pendingReviewDesc', 'A clinician has not added notes to this screening yet.')}
                      </p>
                    )}
                  </div>

                  {/* Full Report CTA */}
                  <Link
                    to={`/diagnosis/result?diagnosis_result_id=${latest.id}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-900 shadow-md transition hover:bg-white/90 active:scale-[0.99]"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{t('myResults.hero.viewReport', 'View Full Medical Report')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ── Timeline & History Section ── */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {t('myResults.timeline.title', 'Assessment History & Timeline')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('myResults.timeline.subtitle', 'Chronological record of all completed assessments.')} ({results.length})
                </p>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="newest">{t('myResults.timeline.sortNewest', 'Newest first')}</option>
                  <option value="oldest">{t('myResults.timeline.sortOldest', 'Oldest first')}</option>
                  <option value="certainty">{t('myResults.timeline.sortHighestCertainty', 'Highest confidence')}</option>
                </select>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('myResults.timeline.searchPlaceholder', 'Search by diagnosis, recommendation, or notes…')}
                className="w-full sm:max-w-xs"
              />

              {/* Status filter tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: t('myResults.timeline.filterAll', 'All'), count: results.length },
                  { id: 'urgent', label: t('myResults.timeline.filterUrgent', 'Needs Attention'), count: urgentCount },
                  { id: 'reviewed', label: t('myResults.timeline.filterReviewed', 'Doctor Reviewed'), count: reviewedCount },
                  { id: 'stable', label: t('myResults.timeline.filterStable', 'Stable'), count: stableCount },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                      statusFilter === tab.id
                        ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.2 text-[10px] font-black',
                        statusFilter === tab.id
                          ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-900'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* List of Results */}
            {!filteredResults.length ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
                <Search className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t('myResults.timeline.noFilterMatches', 'No assessments match your current filters.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>{t('myResults.timeline.resetFilters', 'Reset filters')}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredResults.map((result) => {
                  const certaintyPercent = toCertaintyPercent(result.certainty)
                  const urgency = getUrgencyMeta(result, t)
                  const reviewSummary = result.review_note

                  return (
                    <article
                      key={result.id}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-[#070b15]"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          {/* Card header meta */}
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge tone={urgency.tone} size="sm">
                              {urgency.label}
                            </StatusBadge>

                            {reviewSummary && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-700 ring-1 ring-inset ring-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-800">
                                <Stethoscope className="h-3 w-3" />
                                {t('myResults.timeline.filterReviewed', 'Doctor Reviewed')}
                              </span>
                            )}

                            {isStaff && result.patient_name && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pl-1 pr-2.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                <UserAvatar name={result.patient_name} size="xs" className="h-4 w-4 text-[9px]" />
                                {result.patient_name}
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatDateTime(result.created_at, t('common.notAvailable'), language)}
                              {getRelativeCheckAge(result.created_at, t) ? ` · ${getRelativeCheckAge(result.created_at, t)}` : ''}
                            </span>
                          </div>

                          {/* Diagnosis Title */}
                          <h3 className="mt-2.5 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
                            {tExact(result.diagnosis)}
                          </h3>

                          {/* Suspected Type info */}
                          {(result.suspected_type?.type || result.explanation_trace?.suspected_type?.type) && (
                            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                              <span>
                                {t('diagnosisResult.suspectedType', 'Suspected type')}: {result.suspected_type?.type || result.explanation_trace?.suspected_type?.type}
                              </span>
                            </p>
                          )}

                          {/* Recommendation Preview */}
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {getRecommendationPreview(result, t, tExact)}
                          </p>

                          {/* Doctor review callout */}
                          {reviewSummary ? (
                            <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                              <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                              <div className="min-w-0 flex-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {result.reviewed_by_name ? `Dr. ${result.reviewed_by_name}: ` : `${t('myResults.timeline.doctorNote', 'Doctor Note')}: `}
                                </span>
                                <span className="italic">"{reviewSummary}"</span>
                              </div>
                            </div>
                          ) : null}

                          {result.is_urgent && result.urgent_reason && (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                              <span>{((language === 'km' && result.urgent_reason_km) ? result.urgent_reason_km : result.urgent_reason)}</span>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Score & Action */}
                        <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row sm:items-center lg:w-[220px] lg:flex-col lg:items-stretch">
                          <div className="flex-1 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {t('myResults.columns.certainty', 'Certainty')}
                              </p>
                              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                                {certaintyPercent}%
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${getConfidenceBarClass(certaintyPercent)}`}
                                style={{ width: `${certaintyPercent}%` }}
                              />
                            </div>
                          </div>

                          <Link
                            to={`/diagnosis/result?diagnosis_result_id=${result.id}`}
                            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                          >
                            <span>{t('diagnosisResult.pageTitle', 'Medical Assessment Report')}</span>
                            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
