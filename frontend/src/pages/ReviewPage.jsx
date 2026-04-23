import { useEffect, useState, useMemo } from 'react'
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Search,
  FileText,
  Activity,
  User,
  CheckCircle
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { EmptyState, ErrorAlert } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'

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

  if (safePercent >= 85) return 'text-red-500'
  if (safePercent >= 70) return 'text-orange-500'
  if (safePercent >= 45) return 'text-amber-500'
  if (safePercent >= 25) return 'text-yellow-500'
  return 'text-emerald-500'
}

export function ReviewPage() {
  const { t, tExact } = useLanguage()
  const [results, setResults] = useState([])
  const [selectedResultId, setSelectedResultId] = useState(null)
  
  // Form State
  const [reviewNote, setReviewNote] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [urgentReason, setUrgentReason] = useState('')
  
  // UI State
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const selectedResult = results.find((result) => result.id === selectedResultId) || null

  async function loadResults() {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/diagnosis/review?limit=100')
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
    setSelectedResultId(result.id)
    setReviewNote(result.review_note || '')
    setIsUrgent(Boolean(result.is_urgent))
    setUrgentReason(result.urgent_reason || '')
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
      await loadResults()
    } catch (err) {
      setError(getApiErrorMessage(err, t('reviewPage.doctorReview.saveFailed', 'Failed to save diagnosis review')))
    } finally {
      setSaving(false)
    }
  }

  // Filtered inbox list
  const filteredResults = useMemo(() => {
    if (!searchQuery) return results
    const lowerQ = searchQuery.toLowerCase()
    return results.filter(r => 
      (r.patient_name || '').toLowerCase().includes(lowerQ) ||
      (r.diagnosis || '').toLowerCase().includes(lowerQ)
    )
  }, [results, searchQuery])

  // Split into pending vs reviewed for neatness
  const pendingCount = results.filter(r => !r.reviewed_at).length
  const selectedCertaintyPercent = selectedResult ? toCertaintyPercent(selectedResult.certainty) : 0
  const selectedBannerClasses = `${getRiskGradient(selectedCertaintyPercent)} ${getRiskShadow(selectedCertaintyPercent)}`
  
  return (
    <div className="flex h-[calc(100vh-6rem)] w-full gap-6 overflow-hidden">
      
      {/* ── Left Sidebar (Inbox Queue) ──────────────────────────────────────── */}
      <div className="surface flex w-full max-w-[380px] shrink-0 flex-col overflow-hidden p-0">
        
        {/* Inbox Header */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-4 dark:border-[#1b2342] dark:bg-[#070b1b]">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('reviewPage.queue.title', 'Patient Review Queue')}</h2>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>{t('reviewPage.queue.pendingCount', '{{count}} pending reviews', { count: pendingCount })}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> {t('reviewPage.queue.autoUpdating', 'Auto-updating')}</span>
          </div>
          
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={t('reviewPage.queue.searchPlaceholder', 'Search patients...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base w-full pl-9 py-2 text-sm"
            />
          </div>
        </div>

        {/* Inbox List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/30 dark:bg-transparent">
          {loading && !results.length && (
            <div className="p-4 text-center text-sm text-slate-500 flex justify-center items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
              {t('reviewPage.states.loading', 'Loading queue...')}
            </div>
          )}
          
          {!loading && filteredResults.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              {searchQuery ? t('reviewPage.states.noMatch', 'No patients match your search.') : t('reviewPage.states.empty', 'Queue is entirely empty. Great job!')}
            </div>
          )}

          {filteredResults.map((result) => {
            const isSelected = selectedResultId === result.id
            const isReviewed = Boolean(result.status === 'Reviewed' || result.reviewed_at)
            const isCritical = result.is_urgent
            const certaintyPercent = toCertaintyPercent(result.certainty)
            
            return (
              <button
                key={result.id}
                onClick={() => selectResult(result)}
                className={`w-full max-w-full truncate text-left rounded-xl p-4 transition-all duration-200 border ${
                  isSelected 
                    ? 'bg-cyan-50 border-cyan-200 shadow-sm dark:bg-[#0c132b] dark:border-cyan-900/50' 
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200 dark:bg-[#050816] dark:hover:bg-[#0c1024] dark:hover:border-[#1b2342]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    {isReviewed ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className={`h-4 w-4 shrink-0 ${isCritical ? 'text-amber-500 fill-amber-500/10' : 'text-cyan-500 fill-cyan-500/10'}`} />
                    )}
                    <span className={`truncate font-medium ${!isReviewed ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                      {result.patient_name || t('reviewPage.states.unknownPatient', 'Unknown Patient')}
                    </span>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-400">
                    {formatDateTime(result.created_at).split(',')[0]}
                  </span>
                </div>
                
                <div className="mt-1.5 pl-6">
                  <p className={`truncate text-xs ${isCritical ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                    {tExact(result.diagnosis)}
                  </p>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                      isCritical 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {isCritical ? t('reviewPage.states.urgent', 'URGENT') : t('reviewPage.states.standard', 'Standard')}
                    </span>
                    <span className={`text-[10px] font-medium ${getRiskTextColor(certaintyPercent)}`}>
                      {t('reviewPage.states.score', 'Score')}: {certaintyPercent}/100
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right Panel (Details & Review) ────────────────────────────────────── */}
      <div className="surface flex-1 overflow-y-auto p-0 relative">
        <ErrorAlert message={error} className="absolute top-4 right-4 z-10 max-w-sm shadow-lg border-rose-200" />

        {!selectedResult ? (
          <div className="flex h-full items-center justify-center p-8">
            <EmptyState 
              icon={FileText} 
              title={t('reviewPage.details.noPatientSelected', 'No Patient Selected')}
              description={t('reviewPage.details.noPatientSelectedDesc', 'Select a diagnosis from the queue on the left to review clinical output and append your notes.')}
            />
          </div>
        ) : (
          <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="bg-slate-50 p-8 border-b border-slate-200 dark:bg-[#070b1b] dark:border-[#1b2342]">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                    <User className="h-6 w-6 text-slate-400" />
                    {selectedResult.patient_name || t('reviewPage.states.unknownPatient', 'Patient')}
                  </h1>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <Activity className="h-4 w-4" /> {t('reviewPage.details.assessmentRecord', 'Assessment Record')} #{selectedResult.id}
                    <span className="mx-2 text-slate-300">|</span>
                    {t('reviewPage.details.generated', 'Generated')} {formatDateTime(selectedResult.created_at)}
                  </p>
                </div>
                
                <div className="shrink-0">
                  {selectedResult.reviewed_at ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                      <CheckCircle className="h-4 w-4" />
                      {t('reviewPage.details.reviewed', 'Reviewed')}
                    </div>
                  ) : (
                     <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                      <AlertCircle className="h-4 w-4" />
                      {t('reviewPage.details.pendingReview', 'Pending Doctor Review')}
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnostic Readout Banner */}
              <div className={`relative mt-6 overflow-hidden rounded-2xl p-6 text-white shadow-lg ${selectedBannerClasses}`}>
                {/* Decorative background overlay */}
                <div className="absolute -right-10 -top-24 opacity-10 blur-xl pointer-events-none">
                   <Activity className="w-64 h-64" />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                   <div>
                      <p className="text-sm font-medium uppercase tracking-wider opacity-80">{t('reviewPage.details.aiOutput', 'AI Diagnostic Output')}</p>
                      <h2 className="mt-1 text-3xl font-bold">{tExact(selectedResult.diagnosis)}</h2>
                   </div>
                   <div className="text-right flex flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black">{selectedCertaintyPercent}</span>
                        <span className="text-lg opacity-70">/100</span>
                      </div>
                      <p className="text-xs font-medium uppercase tracking-widest opacity-80">{t('reviewPage.details.confidenceScore', 'Confidence Score')}</p>
                   </div>
                </div>
                
                {selectedResult.is_urgent && (
                  <div className="mt-5 rounded-lg bg-white/20 p-3 text-sm font-medium backdrop-blur-sm border border-white/30 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div>
                      <strong>{t('reviewPage.details.criticalWarning', 'Critical Warning')}:</strong> {selectedResult.urgent_reason || t('reviewPage.details.defaultCriticalMsg', 'This case requires immediate attention.')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence & Annotation Grid */}
            <div className="grid flex-1 gap-8 p-8 lg:grid-cols-2">
              
              {/* Evidence Pane */}
              <div className="space-y-6">
                
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                    <FileText className="h-4 w-4" /> {t('reviewPage.evidence.title', 'Clinical Evidence')}
                  </h3>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1b2342] dark:bg-[#0c1024]">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{t('reviewPage.evidence.recommendations', 'Recommendations')}</h4>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {selectedResult.recommendation || t('reviewPage.evidence.noRecommendations', 'No specific recommendations provided by the engine.')}
                    </p>

                    {(selectedResult.triggered_rules || []).length > 0 && (
                      <>
                        <h4 className="mt-5 text-sm font-semibold text-slate-900 dark:text-white">{t('reviewPage.evidence.triggeredRules', 'Triggered Rules')}</h4>
                        <ul className="mt-2 space-y-2">
                          {selectedResult.triggered_rules.map((rule) => (
                            <li key={rule.id} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                              <span dangerouslySetInnerHTML={{__html: tExact(rule.name)}} />
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* Annotation Pane */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                  <CheckCircle2 className="h-4 w-4" /> {t('reviewPage.doctorReview.title', "Doctor's Review")}
                </h3>
                
                <form onSubmit={saveReview} className="mt-3 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1b2342] dark:bg-[#0c1024]">
                  
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('reviewPage.doctorReview.notesLabel', 'Clinical Notes & Addendum')}</span>
                    <textarea 
                      className="input-base min-h-[200px] resize-y text-sm" 
                      placeholder={t('reviewPage.doctorReview.notesPlaceholder', 'Add your own assessment notes, treatment plan adjustments, or patient follow-up instructions here...')}
                      value={reviewNote} 
                      onChange={(event) => setReviewNote(event.target.value)} 
                    />
                  </label>

                  <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 dark:border-rose-900/30 dark:bg-rose-900/10">
                    <label className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        className="h-5 w-5 rounded border-rose-300 text-rose-600 focus:ring-rose-600"
                        checked={isUrgent} 
                        onChange={(event) => setIsUrgent(event.target.checked)} 
                      />
                      <span className="font-semibold text-rose-800 dark:text-rose-400">{t('reviewPage.doctorReview.urgentFlag', 'Flag as Urgent Case')}</span>
                    </label>
                    
                    {isUrgent && (
                      <div className="mt-3 pl-8">
                        <textarea 
                          className="input-base border-rose-200 focus:border-rose-400 focus:ring-rose-400 text-sm bg-white dark:bg-[#050816]" 
                          placeholder={t('reviewPage.doctorReview.urgentReasonPlaceholder', 'Why is this urgent? (Required)')}
                          rows={4} 
                          value={urgentReason} 
                          onChange={(event) => setUrgentReason(event.target.value)} 
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-2 border-t border-slate-100 pt-4 dark:border-[#1b2342]">
                    <button type="submit" className="btn-primary w-full py-2.5 text-sm font-semibold shadow-md" disabled={saving}>
                      {saving ? t('reviewPage.doctorReview.saving', 'Saving Review...') : t('reviewPage.doctorReview.submit', 'Sign & Submit Review')}
                    </button>
                    {!selectedResult.reviewed_at && (
                      <p className="mt-2 text-center text-xs text-slate-500">
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
