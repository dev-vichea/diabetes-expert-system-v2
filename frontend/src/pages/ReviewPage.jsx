import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  FileText,
  Activity,
  User,
  ArrowUpDown,
  Download,
  ChevronRight,
  Stethoscope,
  X,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { EmptyState, ErrorAlert, UserAvatar, AppSelect } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
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

function ClinicalReviewWorkspace({ t, tExact, selectedResult, selectedResultId, selectedPatientKey, selectedFacts, selectedCertaintyPercent, selectedBannerClasses, currentPatientAssessments, filteredPatientGroups, filteredSubmissions, viewMode, setViewMode, statusFilter, setStatusFilter, sortBy, setSortBy, sortOptions, searchQuery, setSearchQuery, loading, loadResults, totalSubmissionsCount, pendingCount, urgentCount, reviewedCount, selectPatientGroup, selectResult, error, downloadingPdf, handleDownloadPdf, saveReview, reviewNote, setReviewNote, quickPresetOptions, isUrgent, setIsUrgent, urgentReason, setUrgentReason, saving, navigate, user }) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-5 xl:flex-row">
      <aside className="flex min-h-0 w-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#070b1b] xl:w-[330px] xl:shrink-0">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-600">Clinical workspace</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-white">{t('reviewPage.queue.title', 'Patient Review Queue')}</h2><p className="mt-1 text-xs text-slate-500">{pendingCount} pending · {filteredPatientGroups.length} patients</p></div><button type="button" onClick={loadResults} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900"><Clock className={loading ? 'h-4 w-4 animate-spin text-cyan-600' : 'h-4 w-4'} /></button></div>
          <div className="mt-5 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900"><button type="button" onClick={() => setViewMode('by-patient')} className={viewMode === 'by-patient' ? 'flex-1 rounded-lg bg-white py-2 text-xs font-bold text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'flex-1 py-2 text-xs font-semibold text-slate-500'}>By patient <span className="opacity-50">{filteredPatientGroups.length}</span></button><button type="button" onClick={() => setViewMode('all-submissions')} className={viewMode === 'all-submissions' ? 'flex-1 rounded-lg bg-white py-2 text-xs font-bold text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'flex-1 py-2 text-xs font-semibold text-slate-500'}>All records <span className="opacity-50">{totalSubmissionsCount}</span></button></div>
          <div className="relative mt-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search patients or diagnoses" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 text-xs outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></div>
          <div className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-100 pb-2 dark:border-slate-800">{[['all', 'All', totalSubmissionsCount], ['pending', 'Pending', pendingCount], ['urgent', 'Urgent', urgentCount], ['reviewed', 'Reviewed', reviewedCount]].map(([value, label, count]) => <button key={value} type="button" onClick={() => setStatusFilter(value)} className={statusFilter === value ? 'rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white dark:bg-white dark:text-slate-900' : 'rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-slate-500'}>{label} <span className="opacity-60">{count}</span></button>)}</div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400"><span className="flex items-center gap-1"><ArrowUpDown className="h-3 w-3" /> Sort</span><AppSelect value={sortBy} onValueChange={setSortBy} options={sortOptions} className="h-7 min-w-[9rem] border-0 bg-transparent px-1 text-[11px] font-bold shadow-none" /></div>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50/60 p-3 dark:bg-[#050816]">
          {loading && !selectedResult && Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />)}
          {viewMode === 'by-patient' && filteredPatientGroups.map((group) => <button key={group.key} type="button" onClick={() => selectPatientGroup(group)} className={selectedPatientKey === group.key ? 'w-full rounded-2xl border border-cyan-300 bg-cyan-50 p-3.5 text-left shadow-sm dark:border-cyan-800 dark:bg-cyan-950/40' : 'w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-left dark:border-slate-800 dark:bg-slate-900/70'}><div className="flex gap-3"><UserAvatar name={group.patient_name} size="sm" /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{group.patient_name}</p><span className="text-[10px] text-slate-400">{group.latestDate ? formatDateTime(group.latestDate).split(',')[0] : ''}</span></div><p className="mt-1 truncate text-xs text-slate-500">{group.latestItem ? tExact(group.latestItem.diagnosis) : ''}</p><div className="mt-2 flex gap-2"><span className="rounded-md bg-slate-100 px-1.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{group.hasUrgent ? 'Urgent' : group.hasPending ? group.pendingCount + ' pending' : 'Reviewed'}</span><span className={getRiskTextColor(group.maxCertainty) + ' text-[10px] font-bold'}>{group.maxCertainty}%</span></div></div></div></button>)}
          {viewMode === 'all-submissions' && filteredSubmissions.map((result) => <button key={result.id} type="button" onClick={() => selectResult(result)} className={selectedResultId === result.id ? 'w-full rounded-2xl border border-cyan-300 bg-cyan-50 p-3.5 text-left shadow-sm dark:border-cyan-800 dark:bg-cyan-950/40' : 'w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-left dark:border-slate-800 dark:bg-slate-900/70'}><div className="flex gap-3"><UserAvatar name={result.patient_name} size="sm" /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{result.patient_name || 'Unknown patient'}</p><span className="text-[10px] text-slate-400">{formatDateTime(result.created_at).split(',')[0]}</span></div><p className="mt-1 truncate text-xs text-slate-500">{tExact(result.diagnosis)}</p><div className="mt-2 flex gap-2"><span className="rounded-md bg-slate-100 px-1.5 py-1 text-[10px] font-bold text-slate-600">{result.is_urgent ? 'Urgent' : result.reviewed_at ? 'Reviewed' : 'Pending'}</span><span className={getRiskTextColor(toCertaintyPercent(result.certainty)) + ' text-[10px] font-bold'}>{toCertaintyPercent(result.certainty)}%</span></div></div></div></button>)}
          {!loading && ((viewMode === 'by-patient' && !filteredPatientGroups.length) || (viewMode === 'all-submissions' && !filteredSubmissions.length)) && <div className="p-8 text-center text-xs text-slate-500">{searchQuery ? 'No records match your search.' : 'Your review queue is clear.'}</div>}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#070b1b]">
        {error && <ErrorAlert message={error} className="m-4 border-rose-200" />}
        {!selectedResult ? <div className="flex min-h-[560px] items-center justify-center p-8"><EmptyState icon={FileText} title="No Patient Selected" description="Select a patient from the queue to review the clinical output." /></div> : <div className="p-5 sm:p-8">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800"><div className="flex min-w-0 items-center gap-3.5"><UserAvatar name={selectedResult.patient_name} size="lg" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{selectedResult.patient_name || 'Patient'}</h1><span className={selectedResult.reviewed_at ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700' : 'rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700'}>{selectedResult.reviewed_at ? 'Reviewed' : 'Pending review'}</span></div><p className="mt-1 text-xs text-slate-500">Record #{selectedResult.id} · {formatDateTime(selectedResult.created_at)}</p></div></div><div className="flex items-center gap-1"><button type="button" onClick={() => handleDownloadPdf(selectedResult.id)} disabled={downloadingPdf} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"><Download className="h-4 w-4" /> PDF</button>{selectedResult.patient_id && <Link to={'/patients/' + selectedResult.patient_id} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"><User className="h-4 w-4" /> Records</Link>}</div></header>
          {currentPatientAssessments.length > 1 && <div className="border-b border-slate-200 py-4"><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Assessment history</p><div className="flex gap-2 overflow-x-auto">{currentPatientAssessments.map((item) => <button key={item.id} type="button" onClick={() => selectResult(item)} className={item.id === selectedResultId ? 'shrink-0 rounded-xl border border-cyan-400 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-900' : 'shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600'}>#{item.id} · {toCertaintyPercent(item.certainty)}%</button>)}</div></div>}
          <section className={selectedBannerClasses + ' relative mt-6 overflow-hidden rounded-[1.5rem] p-6 text-white shadow-lg'}><Activity className="absolute -right-5 -top-8 h-40 w-40 opacity-10" /><div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">AI diagnostic output</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">{tExact(selectedResult.diagnosis)}</h2></div><div className="sm:text-right"><p className="text-5xl font-black">{selectedCertaintyPercent}<span className="ml-1 text-base font-medium opacity-75">/100</span></p><p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-75">Confidence score</p></div></div>{selectedResult.is_urgent && <div className="relative mt-5 flex gap-2 rounded-xl border border-white/30 bg-white/15 p-3 text-xs font-semibold"><AlertCircle className="h-4 w-4 shrink-0" />{selectedResult.urgent_reason || 'Critical warning: prompt clinical attention required.'}</div>}</section>
          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Fasting glucose', selectedFacts.fasting_glucose ?? selectedFacts.fasting_plasma_glucose ?? '—', 'mg/dL'], ['HbA1c', selectedFacts.hba1c ?? '—', '%'], ['BMI', selectedFacts.bmi ?? '—', 'kg/m²'], ['Age / sex', selectedFacts.age ? selectedFacts.age + ' yrs' : '—', selectedFacts.gender || '—']].map(([label, value, unit]) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">{label}</p><p className="mt-2 text-lg font-bold text-slate-950">{value} <span className="text-xs font-medium text-slate-500">{unit}</span></p></div>)}</section>
          <section className="mt-8 grid gap-7 lg:grid-cols-[1fr_0.9fr]"><div><div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-cyan-600" /><h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Clinical evidence</h3></div>{(selectedResult.patient_note || selectedResult.explanation_trace?.patient_note) && <div className="mb-3 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-cyan-700">Patient note</p><p className="mt-2 text-sm leading-relaxed text-slate-700">“{selectedResult.patient_note || selectedResult.explanation_trace?.patient_note}”</p></div>}<div className="rounded-2xl border border-slate-200 p-5"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Recommendations</p><p className="mt-2 text-sm leading-relaxed text-slate-700">{selectedResult.recommendation || 'No specific recommendations were provided.'}</p>{(selectedResult.triggered_rules || []).length > 0 && <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">{selectedResult.triggered_rules.map((rule) => <li key={rule.id} className="flex gap-2 text-xs text-slate-600"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500" />{tExact(rule.name)}</li>)}</ul>}</div></div>
            <div><div className="mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-600" /><h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Doctor review</h3></div><form onSubmit={saveReview} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-3"><label className="text-sm font-bold text-slate-900">Clinical note</label><AppSelect value="" onValueChange={(value) => { const preset = quickPresetOptions.find((option) => option.value === value); if (preset) setReviewNote((current) => current ? current + '\n• ' + preset.note : preset.note) }} options={quickPresetOptions} includeEmpty emptyLabel="Add template" className="h-8 min-w-[8.5rem] rounded-lg border-slate-200 bg-slate-50 px-2 text-[11px] shadow-none" /></div><textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Add assessment notes or follow-up instructions…" className="mt-3 min-h-[180px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm outline-none focus:border-cyan-400" /><div className={isUrgent ? 'mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5' : 'mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5'}><label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold text-slate-700"><input type="checkbox" checked={isUrgent} onChange={(event) => setIsUrgent(event.target.checked)} className="h-4 w-4 rounded text-rose-600" />Flag as urgent</label>{isUrgent && <textarea rows={2} value={urgentReason} onChange={(event) => setUrgentReason(event.target.value)} placeholder="Why is this urgent? (Required)" className="mt-3 w-full rounded-xl border border-rose-200 bg-white p-3 text-xs" />}</div><div className="mt-5 flex justify-end border-t border-slate-100 pt-4">{!selectedResult.reviewed_at && <span className="mr-auto max-w-[13rem] self-center text-[10px] text-slate-400">Saving marks this assessment reviewed.</span>}<button type="submit" disabled={saving} className="btn-primary px-5 py-2.5 text-xs font-bold">{saving ? 'Saving…' : 'Sign & submit review'}</button></div></form><button type="button" onClick={() => navigate('/treatment-plans/create', { state: { initialData: { patientName: selectedResult.patient_name || 'Patient', patientId: selectedResult.patient_id ? 'P-00' + selectedResult.patient_id : 'P-' + selectedResult.id, doctorName: user?.name || 'Doctor', diagnosis: selectedResult.diagnosis || 'Diabetes', procedures: [] } } })} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-cyan-700"><Stethoscope className="h-4 w-4" /> Open treatment planner <ChevronRight className="h-3.5 w-3.5" /></button></div></section>
        </div>}
      </main>
    </div>
  )
}

export function ReviewPage() {
  const { t, tExact, isKhmer } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
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

  const quickPresetOptions = useMemo(
    () => [
      {
        value: 'routine',
        label: t('reviewPage.quickNotes.routineLabel', 'Routine follow-up'),
        note: t(
          'reviewPage.quickNotes.routine',
          'Routine findings — maintain healthy diet and annual checkup.'
        ),
      },
      {
        value: 'follow-up',
        label: t('reviewPage.quickNotes.followUpLabel', '3-month lab repeat'),
        note: t('reviewPage.quickNotes.followUp', 'Schedule 3-month fasting glucose & HbA1c lab repeat.'),
      },
      {
        value: 'lifestyle',
        label: t('reviewPage.quickNotes.lifestyleLabel', 'Lifestyle plan'),
        note: t(
          'reviewPage.quickNotes.lifestyle',
          'Initiate medical nutrition therapy and 150 min/week exercise.'
        ),
      },
      {
        value: 'urgent',
        label: t('reviewPage.quickNotes.urgentLabel', 'Urgent referral'),
        note: t(
          'reviewPage.quickNotes.urgent',
          'Immediate endocrinology referral and glycemic monitoring required.'
        ),
      },
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
      const response = await api.get('/diagnosis/review?limit=50')
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
    <ClinicalReviewWorkspace
      t={t}
      tExact={tExact}
      selectedResult={selectedResult}
      selectedResultId={selectedResultId}
      selectedPatientKey={selectedPatientKey}
      selectedFacts={selectedFacts}
      selectedCertaintyPercent={selectedCertaintyPercent}
      selectedBannerClasses={selectedBannerClasses}
      currentPatientAssessments={currentPatientAssessments}
      filteredPatientGroups={filteredPatientGroups}
      filteredSubmissions={filteredSubmissions}
      viewMode={viewMode}
      setViewMode={setViewMode}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      sortBy={sortBy}
      setSortBy={setSortBy}
      sortOptions={sortOptions}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      loading={loading}
      loadResults={loadResults}
      totalSubmissionsCount={totalSubmissionsCount}
      pendingCount={pendingCount}
      urgentCount={urgentCount}
      reviewedCount={reviewedCount}
      selectPatientGroup={selectPatientGroup}
      selectResult={selectResult}
      error={error}
      downloadingPdf={downloadingPdf}
      handleDownloadPdf={handleDownloadPdf}
      saveReview={saveReview}
      reviewNote={reviewNote}
      setReviewNote={setReviewNote}
      quickPresetOptions={quickPresetOptions}
      isUrgent={isUrgent}
      setIsUrgent={setIsUrgent}
      urgentReason={urgentReason}
      setUrgentReason={setUrgentReason}
      saving={saving}
      navigate={navigate}
      user={user}
    />
  )
}
