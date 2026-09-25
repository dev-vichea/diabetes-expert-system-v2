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
  Stethoscope,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { AppSelect, ErrorAlert, StatCard, StatusBadge, UserAvatar, StatCardsSkeleton, TableSkeleton } from '@/components/ui'
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

const SCALE_BARS = [
  { num: 1, sub: 'Low', height: 22, group: 1 },
  { num: 2, sub: 'Mid', height: 26, group: 1 },
  { num: 3, sub: 'High', height: 30, group: 1 },
  { num: 4, sub: 'Low', height: 34, group: 2 },
  { num: 5, sub: 'Mid', height: 38, group: 2 },
  { num: 6, sub: 'High', height: 42, group: 2 },
  { num: 7, sub: 'Low', height: 46, group: 3 },
  { num: 8, sub: 'Mid', height: 50, group: 3 },
  { num: 9, sub: 'High', height: 54, group: 3 },
]

function getBarStyles(group, isActive, isCurrent) {
  if (!isActive) {
    return {
      bg: 'bg-slate-100 dark:bg-slate-800/80',
      text: 'text-slate-400 dark:text-slate-500',
      sub: 'text-slate-400/80 dark:text-slate-600',
    }
  }

  // Group 1: Green (Emerald)
  if (group === 1) {
    return {
      bg: 'bg-emerald-500 dark:bg-emerald-500',
      text: 'text-white',
      sub: 'text-emerald-100',
    }
  }

  // Group 2: Amber / Orange
  if (group === 2) {
    return {
      bg: 'bg-amber-500 dark:bg-amber-500',
      text: 'text-white',
      sub: 'text-amber-100',
    }
  }

  // Group 3: Rose / Red
  return {
    bg: 'bg-rose-500 dark:bg-rose-500',
    text: 'text-white',
    sub: 'text-rose-100',
  }
}

function ScoreLevelScale({ percent, t }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0))
  // Map 0-100% to 1-9 level scale
  const currentLevel = Math.max(1, Math.min(9, Math.round((safePercent / 100) * 8) + 1))
  const activeGroup = currentLevel <= 3 ? 1 : currentLevel <= 6 ? 2 : 3

  return (
    <div className="flex flex-col gap-1.5 select-none w-full">
      {/* Header: Label + Score */}
      <div className="flex items-baseline justify-between gap-2 w-full">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {t('myResults.columns.certainty', 'Certainty')}
        </span>
        <span className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
          {safePercent}%
        </span>
      </div>

      {/* 9 Stepped Ascending Bars */}
      <div className="flex items-end gap-1 w-full justify-between pt-0.5">
        {SCALE_BARS.map((bar) => {
          const isActive = bar.num <= currentLevel
          const isCurrent = bar.num === currentLevel
          const styles = getBarStyles(bar.group, isActive, isCurrent)

          return (
            <div
              key={bar.num}
              style={{ height: `${bar.height}px` }}
              className={cn(
                'group/bar relative flex flex-1 flex-col items-center justify-between rounded-t-[5px] px-0.5 py-1 transition-all duration-200',
                styles.bg,
                isCurrent && 'ring-2 ring-slate-900/60 ring-offset-1 ring-offset-white dark:ring-white dark:ring-offset-[#070b1b] shadow-xs scale-105 z-10'
              )}
              title={`Level ${bar.num} (${bar.sub}) · ${isActive ? 'Reached' : 'Pending'}`}
            >
              <span className={cn('text-[9px] font-black leading-none', styles.text)}>
                {bar.num}
              </span>
              <span className={cn('text-[6.5px] font-bold leading-none tracking-tighter uppercase', styles.sub)}>
                {bar.sub}
              </span>
            </div>
          )
        })}
      </div>

      {/* Tier range sublabels below the 9 bars */}
      <div className="flex items-center justify-between w-full px-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <span className={cn(activeGroup === 1 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : '')}>
          1–3 Low
        </span>
        <span className={cn(activeGroup === 2 ? 'text-amber-600 dark:text-amber-400 font-extrabold' : '')}>
          4–6 Mid
        </span>
        <span className={cn(activeGroup === 3 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : '')}>
          7–9 High
        </span>
      </div>
    </div>
  )
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
        <div className="space-y-6 animate-in fade-in duration-150">
          <StatCardsSkeleton count={4} />
          <TableSkeleton rows={6} columns={5} />
        </div>
      ) : !results.length ? (
        <OnboardingEmptyState t={t} />
      ) : (
        <>
          {/* ── Stat Summary Cards ── */}
          <div className="grid min-w-0 grid-cols-2 gap-3.5 lg:grid-cols-4">
            {isStaff ? (
              <>
                <StatCard
                  label={t('myResults.stats.totalEvaluations', 'Total Evaluations')}
                  value={results.length}
                  tone="default"
                  icon={ClipboardList}
                  hint={t('myResults.stats.trackedOverTime', 'Tracked in clinic history')}
                />
                <StatCard
                  label={t('myResults.timeline.filterUrgent', 'Needs Attention')}
                  value={urgentCount}
                  tone={urgentCount > 0 ? 'danger' : 'default'}
                  icon={AlertTriangle}
                  hint={urgentCount > 0 ? t('reviewPage.states.urgent', 'Urgent triage required') : t('reviewPage.states.standard', 'All critical flags cleared')}
                />
                <StatCard
                  label={t('myResults.stats.clinicalReviews', 'Clinical Reviews')}
                  value={`${reviewedCount}`}
                  tone={reviewedCount > 0 ? 'primary' : 'default'}
                  icon={Stethoscope}
                  hint={reviewedCount > 0 ? t('myResults.stats.reviewedNotes', 'Doctor notes attached') : t('myResults.stats.awaitingReview', 'Awaiting doctor review')}
                />
                <StatCard
                  label={t('myResults.timeline.filterStable', 'Stable Cases')}
                  value={stableCount}
                  tone="success"
                  icon={CheckCircle2}
                  hint={`${results.length ? Math.round((stableCount / results.length) * 100) : 0}% of cohort`}
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* ── Timeline & History Section ── */}
          <div className="space-y-4">
            {/* Header & Controls Toolbar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-[#070b1b]">
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('myResults.timeline.searchPlaceholder', 'Search by diagnosis, notes, or patient…')}
                  className="h-9 w-full rounded-xl border border-slate-200/80 bg-slate-50/70 pl-9 pr-3 text-xs outline-none focus:border-cyan-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              {/* Status filter tabs & Sort selector */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-xl bg-slate-100/80 p-1 dark:bg-slate-900">
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
                        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                        statusFilter === tab.id
                          ? 'bg-cyan-600 font-bold text-white shadow-xs shadow-cyan-600/20 dark:bg-cyan-500'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                      )}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          'rounded-md px-1 py-0.2 text-[10px] font-bold',
                          statusFilter === tab.id
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <AppSelect
                    value={sortBy}
                    onValueChange={setSortBy}
                    options={[
                      { value: 'newest', label: t('myResults.timeline.sortNewest', 'Newest first') },
                      { value: 'oldest', label: t('myResults.timeline.sortOldest', 'Oldest first') },
                      { value: 'certainty', label: t('myResults.timeline.sortHighestCertainty', 'Highest confidence') },
                    ]}
                    className="h-8 w-auto min-w-[8.5rem] rounded-xl border-slate-200/80 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* List of Results */}
            {!filteredResults.length ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-10 text-center dark:border-slate-800 dark:bg-[#070b1b]/50">
                <Search className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t('myResults.timeline.noFilterMatches', 'No assessments match your current filters.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>{t('myResults.timeline.resetFilters', 'Reset filters')}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredResults.map((result) => {
                  const certaintyPercent = toCertaintyPercent(result.certainty)
                  const urgency = getUrgencyMeta(result, t)
                  const reviewSummary = result.review_note

                  const displayName = isStaff
                    ? (result.patient_name || 'Patient')
                    : (user?.full_name || result.patient_name || 'Patient')

                  return (
                    <article
                      key={result.id}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-[#070b1b]"
                    >
                      <div className="space-y-3">
                        {/* Card Header: Avatar + Patient info + Action Icon Button */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <UserAvatar
                              name={displayName}
                              src={result.patient_avatar || result.avatar_url}
                              size="md"
                              className="shrink-0 ring-2 ring-slate-100/90 shadow-2xs dark:ring-slate-800"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {isStaff && result.patient_name ? (
                                  <span className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {result.patient_name}
                                  </span>
                                ) : null}
                                <StatusBadge tone={urgency.tone} size="sm">
                                  {urgency.label}
                                </StatusBadge>
                              </div>
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                <Clock3 className="h-3 w-3 shrink-0" />
                                <span className="truncate">{formatDateTime(result.created_at, t('common.notAvailable'), language)}</span>
                                {getRelativeCheckAge(result.created_at, t) ? ` · ${getRelativeCheckAge(result.created_at, t)}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Action Icon-only Button */}
                          <Link
                            to={`/diagnosis/result?diagnosis_result_id=${result.id}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-500 shadow-2xs transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-cyan-500/50 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-300"
                            title={t('myResults.hero.viewReport', 'View Full Medical Report')}
                            aria-label={t('myResults.hero.viewReport', 'View Full Medical Report')}
                          >
                            <FileText className="h-4 w-4" />
                          </Link>
                        </div>

                        {/* Diagnosis Title & Suspected Type */}
                        <div>
                          <Link
                            to={`/diagnosis/result?diagnosis_result_id=${result.id}`}
                            className="text-base font-bold tracking-tight text-slate-900 hover:text-cyan-600 transition dark:text-slate-100 dark:hover:text-cyan-400 line-clamp-2"
                          >
                            {tExact(result.diagnosis)}
                          </Link>

                          {(result.suspected_type?.type || result.explanation_trace?.suspected_type?.type) && (
                            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                              <span>
                                {t('diagnosisResult.suspectedType', 'Suspected type')}: {result.suspected_type?.type || result.explanation_trace?.suspected_type?.type}
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Recommendation Preview */}
                        <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {getRecommendationPreview(result, t, tExact)}
                        </p>

                        {/* Doctor review callout */}
                        {reviewSummary && (
                          <div className="flex items-start gap-2 rounded-xl border border-cyan-100 bg-cyan-50/60 p-2.5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                            <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                            <div className="min-w-0 flex-1 text-xs leading-snug text-slate-700 dark:text-slate-300">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {result.reviewed_by_name ? `Dr. ${result.reviewed_by_name}: ` : `${t('myResults.timeline.doctorNote', 'Doctor Note')}: `}
                              </span>
                              <span className="italic line-clamp-2">"{reviewSummary}"</span>
                            </div>
                          </div>
                        )}

                        {result.is_urgent && result.urgent_reason && (
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-1">{((language === 'km' && result.urgent_reason_km) ? result.urgent_reason_km : result.urgent_reason)}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Benchmark Score Scale */}
                      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                        <ScoreLevelScale percent={certaintyPercent} t={t} />
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
