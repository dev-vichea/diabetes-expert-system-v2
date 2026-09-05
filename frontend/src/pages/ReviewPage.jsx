import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  FileText,
  Activity,
  User,
  CheckCircle,
  MessageSquare,
  Users,
  Layers,
  ArrowUpDown,
  Download,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
  Droplet,
  HeartPulse,
  X,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { EmptyState, ErrorAlert, UserAvatar, AppSelect } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'
import { notify } from '@/lib/toast'

function toCertaintyPercent(certainty) {
  const numeric = Number(certainty)
  if (Number.isNaN(numeric)) return 0
  const raw = numeric <= 1 ? numeric * 100 : numeric
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function getRiskGradient(percent) {
  const safePercent = Number(percent) || 0
  if (safePercent >= 85) return 'bg-gradient-to-r from-red-700 to-red-600'
  if (safePercent >= 70) return 'bg-gradient-to-r from-orange-700 to-orange-600'
  if (safePercent >= 45) return 'bg-gradient-to-r from-amber-700 to-amber-600'
  if (safePercent >= 25) return 'bg-gradient-to-r from-yellow-700 to-yellow-600'
  return 'bg-gradient-to-r from-emerald-700 to-emerald-600'
}

function getRiskShadow(percent) {
  const safePercent = Number(percent) || 0
  if (safePercent >= 85) return 'shadow-red-500/20'
  if (safePercent >= 70) return 'shadow-orange-500/20'
  if (safePercent >= 45) return 'shadow-amber-500/20'
  if (safePercent >= 25) return 'shadow-yellow-500/20'
  return 'shadow-emerald-500/20'
}

function getRiskTextColor(percent) {
  const safePercent = Number(percent) || 0
  if (safePercent >= 85) return 'text-red-600 dark:text-red-400'
  if (safePercent >= 70) return 'text-orange-600 dark:text-orange-400'
  if (safePercent >= 45) return 'text-amber-600 dark:text-amber-400'
  if (safePercent >= 25) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

export function ReviewPage() {
  const { t, tExact, isKhmer } = useLanguage()
  const [results, setResults] = useState([])
  const [selectedResultId, setSelectedResultId] = useState(null)
  const [selectedPatientKey, setSelectedPatientKey] = useState(null)

  // View & Filter Controls
  const [viewMode, setViewMode] = useState('by-patient') // 'by-patient' | 'all-submissions'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'pending' | 'urgent' | 'reviewed'
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'risk-desc' | 'urgent-first' | 'name-asc'
  const [searchQuery, setSearchQuery] = useState('')

  const sortOptions = useMemo(
    () => [
      { value: 'newest', label: t('reviewPage.sorting.newest', 'Newest First') },
      { value: 'risk-desc', label: t('reviewPage.sorting.highestRisk', 'Highest Risk') },
      { value: 'urgent-first', label: t('reviewPage.sorting.urgentFirst', 'Urgent First') },
      { value: 'name-asc', label: t('reviewPage.sorting.patientName', 'Patient Name (A-Z)') },
    ],
    [t]
  )

  // Form State
  const [reviewNote, setReviewNote] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [urgentReason, setUrgentReason] = useState('')

  // UI State
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [error, setError] = useState('')

  const selectedResult = useMemo(() => {
    return results.find((result) => result.id === selectedResultId) || null
  }, [results, selectedResultId])

  async function loadResults() {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/diagnosis/review?limit=300')
      const loaded = getApiData(response) || []
      setResults(loaded)

      if (selectedResultId && !loaded.some((item) => item.id === selectedResultId)) {
        setSelectedResultId(null)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, t('reviewPage.states.loadingFailed', 'Failed to load diagnosis review list')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [])

  function selectResult(result) {
    if (!result) return
    setSelectedResultId(result.id)
    const pKey = result.patient_id ? String(result.patient_id) : (result.patient_name || 'unknown')
    setSelectedPatientKey(pKey)
    setReviewNote(result.review_note || '')
    setIsUrgent(Boolean(result.is_urgent))
    setUrgentReason(result.urgent_reason || '')
  }

  function selectPatientGroup(group) {
    if (!group || !group.items.length) return
    setSelectedPatientKey(group.key)
    // Default to the latest assessment or the first pending assessment
    const target = group.items.find(i => !i.reviewed_at) || group.items[0]
    selectResult(target)
  }

  async function saveReview(event) {
    if (event) event.preventDefault()
    if (!selectedResultId) return

    if (isUrgent && !urgentReason.trim()) {
      setError(t('reviewPage.doctorReview.urgentReasonRequired', 'Urgent reason is required when urgent flag is enabled.'))
      return
    }

    setSaving(true)
    setError('')

    try {
      await api.patch(`/diagnosis/${selectedResultId}/review`, {
        review_note: reviewNote,
        is_urgent: isUrgent,
        urgent_reason: urgentReason || null,
      })
      notify.success(isKhmer ? 'បានរក្សាទុកការពិនិត្យជោគជ័យ!' : 'Review signed and saved successfully!')
      await loadResults()
    } catch (err) {
      setError(getApiErrorMessage(err, t('reviewPage.doctorReview.saveFailed', 'Failed to save diagnosis review')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDownloadPdf(id) {
    if (!id) return
    setDownloadingPdf(true)
    try {
      const response = await api.get(`/diagnosis/${id}/report.pdf`, {
        responseType: 'blob',
      })
      const blob = response?.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `clinical-report-${id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      notify.success(isKhmer ? 'បានទាញយករបាយការណ៍ PDF' : 'PDF Report downloaded')
    } catch (err) {
      notify.error(getApiErrorMessage(err, isKhmer ? 'ទាញយករបាយការណ៍បរាជ័យ' : 'Failed to download report'))
    } finally {
      setDownloadingPdf(false)
    }
  }

  // ── Patient Groups Memo ──
  const patientGroups = useMemo(() => {
    const map = new Map()

    for (const r of results) {
      const key = r.patient_id ? String(r.patient_id) : (r.patient_name || 'unknown')
      if (!map.has(key)) {
        map.set(key, {
          key,
          patient_id: r.patient_id || null,
          patient_name: r.patient_name || t('reviewPage.states.unknownPatient', 'Unknown Patient'),
          items: [],
        })
      }
      map.get(key).items.push(r)
    }

    const groups = []
    for (const group of map.values()) {
      group.items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      const totalCount = group.items.length
      const pendingCount = group.items.filter((i) => !i.reviewed_at).length
      const urgentCount = group.items.filter((i) => i.is_urgent).length
      const latestItem = group.items[0]
      const maxCertainty = Math.max(...group.items.map((i) => toCertaintyPercent(i.certainty)))

      groups.push({
        ...group,
        totalCount,
        pendingCount,
        urgentCount,
        latestItem,
        maxCertainty,
        hasUrgent: urgentCount > 0,
        hasPending: pendingCount > 0,
        latestDate: latestItem?.created_at,
      })
    }

    return groups
  }, [results, t])

  // ── Auto-select first item if none selected ──
  useEffect(() => {
    if (!selectedResultId && results.length > 0) {
      if (viewMode === 'by-patient' && patientGroups.length > 0) {
        selectPatientGroup(patientGroups[0])
      } else {
        selectResult(results[0])
      }
    }
  }, [results, selectedResultId, viewMode, patientGroups])

  // ── Filter & Sort: Patient Groups ──
  const filteredPatientGroups = useMemo(() => {
    let list = [...patientGroups]

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (g) =>
          g.patient_name.toLowerCase().includes(q) ||
          g.items.some((i) => (i.diagnosis || '').toLowerCase().includes(q))
      )
    }

    // Status filter
    if (statusFilter === 'pending') {
      list = list.filter((g) => g.pendingCount > 0)
    } else if (statusFilter === 'urgent') {
      list = list.filter((g) => g.hasUrgent)
    } else if (statusFilter === 'reviewed') {
      list = list.filter((g) => g.pendingCount === 0)
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'risk-desc') return b.maxCertainty - a.maxCertainty
      if (sortBy === 'urgent-first') {
        if (a.hasUrgent && !b.hasUrgent) return -1
        if (!a.hasUrgent && b.hasUrgent) return 1
      }
      if (sortBy === 'name-asc') return a.patient_name.localeCompare(b.patient_name)
      // default 'newest'
      return new Date(b.latestDate || 0) - new Date(a.latestDate || 0)
    })

    return list
  }, [patientGroups, searchQuery, statusFilter, sortBy])

  // ── Filter & Sort: Individual Submissions ──
  const filteredSubmissions = useMemo(() => {
    let list = [...results]

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (r) =>
          (r.patient_name || '').toLowerCase().includes(q) ||
          (r.diagnosis || '').toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter === 'pending') {
      list = list.filter((r) => !r.reviewed_at)
    } else if (statusFilter === 'urgent') {
      list = list.filter((r) => r.is_urgent)
    } else if (statusFilter === 'reviewed') {
      list = list.filter((r) => Boolean(r.reviewed_at))
    }

    // Sorting
    list.sort((a, b) => {
      const certA = toCertaintyPercent(a.certainty)
      const certB = toCertaintyPercent(b.certainty)
      if (sortBy === 'risk-desc') return certB - certA
      if (sortBy === 'urgent-first') {
        if (a.is_urgent && !b.is_urgent) return -1
        if (!a.is_urgent && b.is_urgent) return 1
      }
      if (sortBy === 'name-asc') {
        return (a.patient_name || '').localeCompare(b.patient_name || '')
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })

    return list
  }, [results, searchQuery, statusFilter, sortBy])

  // Counts for status tabs
  const totalSubmissionsCount = results.length
  const pendingCount = results.filter((r) => !r.reviewed_at).length
  const urgentCount = results.filter((r) => r.is_urgent).length
  const reviewedCount = results.filter((r) => Boolean(r.reviewed_at)).length

  // Selected Patient's submissions list (for multi-assessment switcher)
  const currentPatientAssessments = useMemo(() => {
    if (!selectedResult) return []
    const pKey = selectedResult.patient_id
      ? String(selectedResult.patient_id)
      : (selectedResult.patient_name || 'unknown')
    const group = patientGroups.find((g) => g.key === pKey)
    return group ? group.items : [selectedResult]
  }, [selectedResult, patientGroups])

  // Active Assessment Extracted Clinical Facts
  const selectedFacts = selectedResult?.facts || {}
  const selectedCertaintyPercent = selectedResult ? toCertaintyPercent(selectedResult.certainty) : 0
  const selectedBannerClasses = `${getRiskGradient(selectedCertaintyPercent)} ${getRiskShadow(selectedCertaintyPercent)}`

  // Quick Preset Handlers
  function applyPresetNote(noteText) {
    if (!reviewNote.trim()) {
      setReviewNote(noteText)
    } else {
      setReviewNote((prev) => `${prev.trim()}\n• ${noteText}`)
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 overflow-visible xl:h-[calc(100dvh-7rem)] xl:flex-row xl:gap-6 xl:overflow-hidden">
      {/* ── Left Sidebar: Patient Review Queue ────────────────────────────────── */}
      <div className="surface flex w-full min-w-0 flex-col overflow-hidden p-0 xl:max-w-[400px] xl:shrink-0">
        {/* Queue Header & View Toggle */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-3.5 dark:border-[#1b2342] dark:bg-[#070b1b]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {t('reviewPage.queue.title', 'Patient Review Queue')}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t('reviewPage.queue.pendingCount', '{{count}} pending reviews', { count: pendingCount })} ·{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {patientGroups.length} {t('reviewPage.viewModes.byPatient', 'patients')}
                </span>
              </p>
            </div>
            <button
              onClick={loadResults}
              title={t('reviewPage.queue.autoUpdating', 'Refresh')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#1b2342] dark:bg-[#0c1024] dark:text-slate-300"
            >
              <Clock className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-600' : ''}`} />
            </button>
          </div>

          {/* View Mode Toggle: By Patient vs All Submissions */}
          <div className="mt-3 grid grid-cols-2 rounded-xl bg-slate-200/70 p-1 text-xs font-semibold text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setViewMode('by-patient')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition ${
                viewMode === 'by-patient'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#0c1024] dark:text-white'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>{t('reviewPage.viewModes.byPatient', 'By Patient')}</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {patientGroups.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all-submissions')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition ${
                viewMode === 'all-submissions'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#0c1024] dark:text-white'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{t('reviewPage.viewModes.allSubmissions', 'All Submissions')}</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {totalSubmissionsCount}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mt-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={t('reviewPage.queue.searchPlaceholder', 'Search patients...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base w-full pl-8 pr-8 py-1.5 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#0c1024] dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{t('reviewPage.filters.all', 'All')}</span>
              <span className="opacity-80">({totalSubmissionsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
              }`}
            >
              <span>{t('reviewPage.filters.pending', 'Pending')}</span>
              <span className="rounded-full bg-amber-500/20 px-1 text-[10px] font-bold">
                {pendingCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('urgent')}
              className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === 'urgent'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
              }`}
            >
              <span>{t('reviewPage.filters.urgent', 'Urgent')}</span>
              <span className="rounded-full bg-rose-500/20 px-1 text-[10px] font-bold">
                {urgentCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('reviewed')}
              className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === 'reviewed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
              }`}
            >
              <span>{t('reviewPage.filters.reviewed', 'Reviewed')}</span>
              <span className="opacity-80">({reviewedCount})</span>
            </button>
          </div>

          {/* Sort bar */}
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 shrink-0">
              <ArrowUpDown className="h-3 w-3" />
              <span>{t('reviewPage.sorting.label', 'Sort by')}:</span>
            </span>
            <AppSelect
              value={sortBy}
              onValueChange={setSortBy}
              options={sortOptions}
              className="h-7 w-auto min-w-[9.5rem] rounded-lg border-0 bg-transparent px-2 py-0 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            />
          </div>
        </div>

        {/* Queue Items List */}
        <div className="max-h-[50vh] flex-1 space-y-1.5 overflow-y-auto bg-slate-50/40 p-2 dark:bg-transparent xl:max-h-none">
          {loading && !results.length && (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
              {t('reviewPage.states.loading', 'Loading queue...')}
            </div>
          )}

          {/* Mode 1: By Patient */}
          {viewMode === 'by-patient' && (
            <>
              {!loading && filteredPatientGroups.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">
                  {searchQuery
                    ? t('reviewPage.states.noMatch', 'No patients match your search.')
                    : t('reviewPage.states.empty', 'Queue is entirely empty. Great job!')}
                </div>
              )}

              {filteredPatientGroups.map((group) => {
                const isSelected = selectedPatientKey === group.key
                const latest = group.latestItem
                const latestDate = latest ? formatDateTime(latest.created_at).split(',')[0] : ''

                return (
                  <button
                    key={group.key}
                    onClick={() => selectPatientGroup(group)}
                    className={`group relative w-full text-left rounded-xl border p-3 transition-all duration-150 ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-50/80 shadow-xs dark:border-cyan-800 dark:bg-cyan-950/40 ring-1 ring-cyan-400/50'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#050816] dark:hover:bg-[#0c1024]'
                    }`}
                  >
                    {/* Left active bar */}
                    {isSelected && (
                      <div className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-cyan-600" />
                    )}

                    <div className="flex items-start justify-between gap-2 pl-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <UserAvatar name={group.patient_name} size="xs" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                            {group.patient_name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {group.patient_id ? `ID: #${group.patient_id}` : 'Unregistered'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] font-medium text-slate-400">{latestDate}</span>
                        <span className="mt-1 inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {group.totalCount} {isKhmer ? 'កំណត់ត្រា' : 'tests'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pl-7">
                      <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                        {latest ? tExact(latest.diagnosis) : ''}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {group.hasUrgent ? (
                          <span className="inline-flex items-center rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-900/40 dark:text-rose-400">
                            {t('reviewPage.states.urgent', 'URGENT')}
                          </span>
                        ) : group.pendingCount > 0 ? (
                          <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-400">
                            {group.pendingCount} {t('reviewPage.patientCard.pendingBadge', 'pending')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                            {t('reviewPage.details.reviewed', 'Reviewed')}
                          </span>
                        )}

                        <span className={`text-[10px] font-bold ${getRiskTextColor(group.maxCertainty)}`}>
                          {t('reviewPage.states.score', 'Score')}: {group.maxCertainty}%
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </>
          )}

          {/* Mode 2: All Submissions (Flat Feed) */}
          {viewMode === 'all-submissions' && (
            <>
              {!loading && filteredSubmissions.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">
                  {searchQuery
                    ? t('reviewPage.states.noMatch', 'No patients match your search.')
                    : t('reviewPage.states.empty', 'Queue is entirely empty. Great job!')}
                </div>
              )}

              {filteredSubmissions.map((result) => {
                const isSelected = selectedResultId === result.id
                const isReviewed = Boolean(result.reviewed_at)
                const isCritical = result.is_urgent
                const certaintyPercent = toCertaintyPercent(result.certainty)

                return (
                  <button
                    key={result.id}
                    onClick={() => selectResult(result)}
                    className={`group relative w-full text-left rounded-xl border p-3 transition-all duration-150 ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-50/80 shadow-xs dark:border-cyan-800 dark:bg-cyan-950/40 ring-1 ring-cyan-400/50'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#050816] dark:hover:bg-[#0c1024]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-cyan-600" />
                    )}

                    <div className="flex items-start justify-between gap-2 pl-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <UserAvatar name={result.patient_name} size="xs" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                            {result.patient_name || t('reviewPage.states.unknownPatient', 'Unknown Patient')}
                          </p>
                          <p className="text-[10px] text-slate-400">Record #{result.id}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-medium text-slate-400">
                        {formatDateTime(result.created_at).split(',')[0]}
                      </span>
                    </div>

                    <div className="mt-1.5 pl-7">
                      <p className={`truncate text-xs ${isCritical ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {tExact(result.diagnosis)}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            isCritical
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                              : isReviewed
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                          }`}
                        >
                          {isCritical
                            ? t('reviewPage.states.urgent', 'URGENT')
                            : isReviewed
                            ? t('reviewPage.details.reviewed', 'Reviewed')
                            : t('reviewPage.filters.pending', 'Pending')}
                        </span>
                        <span className={`text-[10px] font-bold ${getRiskTextColor(certaintyPercent)}`}>
                          {t('reviewPage.states.score', 'Score')}: {certaintyPercent}/100
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* ── Right Panel: Details, Biomarkers & Clinical Review ────────────────── */}
      <div className="surface relative min-w-0 flex-1 overflow-y-auto p-0">
        <ErrorAlert
          message={error}
          className="m-4 max-w-sm border-rose-200 shadow-lg xl:absolute xl:right-4 xl:top-4 xl:z-10 xl:m-0"
        />

        {!selectedResult ? (
          <div className="flex h-full items-center justify-center p-8">
            <EmptyState
              icon={FileText}
              title={t('reviewPage.details.noPatientSelected', 'No Patient Selected')}
              description={t(
                'reviewPage.details.noPatientSelectedDesc',
                'Select a patient or diagnosis from the queue on the left to review clinical output and append your notes.'
              )}
            />
          </div>
        ) : (
          <div className="flex flex-col min-h-full">
            {/* Header: Patient Profile & Quick Actions */}
            <div className="border-b border-slate-200 bg-slate-50/70 p-4 dark:border-[#1b2342] dark:bg-[#070b1b] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <UserAvatar name={selectedResult.patient_name} size="md" />
                    <div>
                      <h1 className="break-words text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
                        {selectedResult.patient_name || t('reviewPage.states.unknownPatient', 'Patient')}
                      </h1>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>
                          <strong>{t('reviewPage.details.assessmentRecord', 'Assessment Record')}:</strong> #{selectedResult.id}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{t('reviewPage.details.generated', 'Generated')}:</strong> {formatDateTime(selectedResult.created_at)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {selectedResult.reviewed_at ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      {t('reviewPage.details.reviewed', 'Reviewed')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      {t('reviewPage.details.pendingReview', 'Pending Doctor Review')}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(selectedResult.id)}
                    disabled={downloadingPdf}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>{downloadingPdf ? '...' : t('reviewPage.actions.downloadPdf', 'Download PDF')}</span>
                  </button>

                  {selectedResult.patient_id && (
                    <Link
                      to={`/patients/${selectedResult.patient_id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <span>{t('reviewPage.actions.patientHistory', 'Patient Records')}</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Multi-Assessment History Timeline / Switcher */}
              {currentPatientAssessments.length > 1 && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-[#0c1024]">
                  <div className="flex items-center justify-between pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <span>
                      {t('reviewPage.timeline.title', 'Assessment History')} ({currentPatientAssessments.length})
                    </span>
                    <span className="text-[10px] font-normal lowercase opacity-70">
                      {t('reviewPage.timeline.switchHint', 'Click to switch assessment')}
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {currentPatientAssessments.map((item, idx) => {
                      const isItemActive = item.id === selectedResultId
                      const isItemReviewed = Boolean(item.reviewed_at)
                      const itemCert = toCertaintyPercent(item.certainty)

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectResult(item)}
                          className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${
                            isItemActive
                              ? 'border-cyan-500 bg-cyan-50 font-bold text-cyan-900 shadow-xs dark:bg-cyan-950/50 dark:text-cyan-200 ring-1 ring-cyan-500/50'
                              : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <span className="font-mono">#{item.id}</span>
                          {idx === 0 && (
                            <span className="rounded bg-cyan-100 px-1 text-[9px] font-extrabold text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                              {t('reviewPage.timeline.latest', 'LATEST')}
                            </span>
                          )}
                          <span className={`text-[10px] ${getRiskTextColor(itemCert)} font-bold`}>
                            {itemCert}%
                          </span>
                          {item.is_urgent ? (
                            <span className="h-2 w-2 rounded-full bg-rose-500" title="Urgent" />
                          ) : isItemReviewed ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-amber-400" title="Pending" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Diagnostic Readout Banner */}
              <div className={`relative mt-4 overflow-hidden rounded-2xl p-4 text-white shadow-md sm:p-6 ${selectedBannerClasses}`}>
                <div className="absolute -right-10 -top-24 opacity-10 blur-xl pointer-events-none">
                  <Activity className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-85">
                      {t('reviewPage.details.aiOutput', 'AI Diagnostic Output')}
                    </p>
                    <h2 className="mt-1 break-words text-xl font-black sm:text-2xl lg:text-3xl">
                      {tExact(selectedResult.diagnosis)}
                    </h2>
                  </div>
                  <div className="flex flex-col sm:items-end sm:text-right">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">{selectedCertaintyPercent}</span>
                      <span className="text-base opacity-75">/100</span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-85">
                      {t('reviewPage.details.confidenceScore', 'Confidence Score')}
                    </p>
                  </div>
                </div>

                {selectedResult.is_urgent && (
                  <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-white/30 bg-white/20 p-2.5 text-xs font-semibold backdrop-blur-md">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <div>
                      <strong>{t('reviewPage.details.criticalWarning', 'Critical Warning')}:</strong>{' '}
                      {(isKhmer && selectedResult.urgent_reason_km)
                        ? selectedResult.urgent_reason_km
                        : selectedResult.urgent_reason ||
                          t('reviewPage.details.defaultCriticalMsg', 'This case requires immediate attention.')}
                    </div>
                  </div>
                )}
              </div>

              {/* Clinical Biomarkers & Metrics Strip */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-[#0c1024]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('reviewPage.biomarkers.fastingGlucose', 'Fasting Glucose')}
                  </p>
                  <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedFacts.fasting_glucose ?? selectedFacts.fasting_plasma_glucose ?? '—'}{' '}
                    <span className="text-xs font-normal text-slate-500">mg/dL</span>
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-[#0c1024]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('reviewPage.biomarkers.hba1c', 'HbA1c')}
                  </p>
                  <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedFacts.hba1c ?? '—'} <span className="text-xs font-normal text-slate-500">%</span>
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-[#0c1024]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('reviewPage.biomarkers.bmi', 'BMI')}
                  </p>
                  <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedFacts.bmi ?? '—'} <span className="text-xs font-normal text-slate-500">kg/m²</span>
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-[#0c1024]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('reviewPage.biomarkers.ageSex', 'Age / Sex')}
                  </p>
                  <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white capitalize">
                    {selectedFacts.age ? `${selectedFacts.age} yrs` : '—'} / {selectedFacts.gender || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence & Annotation Grid */}
            <div className="grid flex-1 gap-5 p-4 sm:p-6 lg:grid-cols-2">
              {/* Evidence Pane */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <FileText className="h-4 w-4" /> {t('reviewPage.evidence.title', 'Clinical Evidence')}
                </h3>

                {/* Patient Note */}
                {(selectedResult.patient_note || selectedResult.explanation_trace?.patient_note) && (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 dark:border-sky-900/40 dark:bg-sky-950/30">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                      <MessageSquare className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <span>{t('reviewPage.evidence.patientNote', 'Patient Notes / Reported Symptoms')}</span>
                    </div>
                    <p className="mt-2 text-sm italic leading-relaxed text-slate-800 dark:text-slate-200">
                      "{selectedResult.patient_note || selectedResult.explanation_trace?.patient_note}"
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-[#1b2342] dark:bg-[#0c1024]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {t('reviewPage.evidence.recommendations', 'Recommendations')}
                  </h4>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {selectedResult.recommendation ||
                      t('reviewPage.evidence.noRecommendations', 'No specific recommendations provided by the engine.')}
                  </p>

                  {(selectedResult.triggered_rules || []).length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        {t('reviewPage.evidence.triggeredRules', 'Triggered Rules')} ({selectedResult.triggered_rules.length})
                      </h4>
                      <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                        {selectedResult.triggered_rules.map((rule) => (
                          <li key={rule.id} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                            <span dangerouslySetInnerHTML={{ __html: tExact(rule.name) }} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Review Pane */}
              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <CheckCircle2 className="h-4 w-4" /> {t('reviewPage.doctorReview.title', "Doctor's Review")}
                </h3>

                <form
                  onSubmit={saveReview}
                  className="mt-3 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-[#1b2342] dark:bg-[#0c1024]"
                >
                  {/* Quick Presets */}
                  <div>
                    <span className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <Sparkles className="h-3 w-3 text-cyan-600" />
                      <span>{t('reviewPage.quickNotes.title', 'Quick Presets')}</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          applyPresetNote(
                            t(
                              'reviewPage.quickNotes.routine',
                              'Routine findings — maintain healthy diet and annual checkup.'
                            )
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        ✓ Routine
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPresetNote(
                            t(
                              'reviewPage.quickNotes.followUp',
                              'Schedule 3-month fasting glucose & HbA1c lab repeat.'
                            )
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        ✓ 3-Mo Lab Repeat
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPresetNote(
                            t(
                              'reviewPage.quickNotes.lifestyle',
                              'Initiate medical nutrition therapy and 150 min/week exercise.'
                            )
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        ✓ Lifestyle Rx
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyPresetNote(
                            t(
                              'reviewPage.quickNotes.urgent',
                              'Immediate endocrinology referral and glycemic monitoring required.'
                            )
                          )
                        }
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
                      >
                        ⚠ Urgent Referral
                      </button>
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {t('reviewPage.doctorReview.notesLabel', 'Clinical Notes & Addendum')}
                    </span>
                    <textarea
                      className="input-base min-h-[160px] resize-y text-xs sm:text-sm"
                      placeholder={t(
                        'reviewPage.doctorReview.notesPlaceholder',
                        'Add your own assessment notes, treatment plan adjustments, or patient follow-up instructions here...'
                      )}
                      value={reviewNote}
                      onChange={(event) => setReviewNote(event.target.value)}
                    />
                  </label>

                  <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3.5 dark:border-rose-900/30 dark:bg-rose-900/10">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-600"
                        checked={isUrgent}
                        onChange={(event) => setIsUrgent(event.target.checked)}
                      />
                      <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                        {t('reviewPage.doctorReview.urgentFlag', 'Flag as Urgent Case')}
                      </span>
                    </label>

                    {isUrgent && (
                      <div className="mt-2.5">
                        <textarea
                          className="input-base border-rose-200 bg-white text-xs focus:border-rose-400 focus:ring-rose-400 dark:bg-[#050816]"
                          placeholder={t('reviewPage.doctorReview.urgentReasonPlaceholder', 'Why is this urgent? (Required)')}
                          rows={3}
                          value={urgentReason}
                          onChange={(event) => setUrgentReason(event.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3 dark:border-[#1b2342]">
                    <button
                      type="submit"
                      className="btn-primary w-full py-2.5 text-xs sm:text-sm font-bold shadow-md"
                      disabled={saving}
                    >
                      {saving
                        ? t('reviewPage.doctorReview.saving', 'Saving Review...')
                        : t('reviewPage.doctorReview.submit', 'Sign & Submit Review')}
                    </button>
                    {!selectedResult.reviewed_at && (
                      <p className="mt-1.5 text-center text-[10px] text-slate-500">
                        {t('reviewPage.doctorReview.submitNotice', 'Submitting this form will mark the assessment as Reviewed.')}
                      </p>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
