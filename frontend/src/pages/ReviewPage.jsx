import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  X,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { EmptyState, ErrorAlert, UserAvatar, AppSelect } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { notify } from '@/lib/toast'
import { cn } from '@/lib/utils'

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

function ClinicalReviewWorkspace({
  t,
  tExact,
  selectedResult,
  selectedResultId,
  selectedPatientKey,
  selectedFacts,
  selectedCertaintyPercent,
  selectedBannerClasses,
  currentPatientAssessments,
  filteredPatientGroups,
  filteredSubmissions,
  viewMode,
  setViewMode,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortOptions,
  searchQuery,
  setSearchQuery,
  loading,
  loadResults,
  totalSubmissionsCount,
  pendingCount,
  urgentCount,
  reviewedCount,
  selectPatientGroup,
  selectResult,
  error,
  downloadingPdf,
  handleDownloadPdf,
  saveReview,
  reviewNote,
  setReviewNote,
  quickPresetOptions,
  applyPresetNote,
  isUrgent,
  setIsUrgent,
  urgentReason,
  setUrgentReason,
  saving,
  navigate,
  user,
}) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 xl:flex-row xl:h-[calc(100vh-6.5rem)]">
      {/* ── Left Side: Scrollable Patient Queue ── */}
      <aside className="flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#070b1b] xl:w-[320px] xl:shrink-0 xl:h-full">
        {/* Sticky Header: Clean, compact, minimal unnecessary text */}
        <div className="shrink-0 border-b border-slate-100 p-3.5 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-950 dark:text-white">
                {t('reviewPage.queue.title', 'Patient Review Queue')}
              </h2>
              <p className="text-[11px] text-slate-500">
                {pendingCount} pending · {filteredPatientGroups.length} patients
              </p>
            </div>
            <button
              type="button"
              onClick={loadResults}
              title="Refresh queue"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/70 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <Clock className={loading ? 'h-3.5 w-3.5 animate-spin text-cyan-600' : 'h-3.5 w-3.5'} />
            </button>
          </div>

          {/* View Mode: By patient vs All records */}
          <div className="mt-2.5 flex rounded-lg bg-slate-100/80 p-0.5 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode('by-patient')}
              className={cn(
                'flex-1 rounded-md py-1 text-xs font-semibold transition-all',
                viewMode === 'by-patient'
                  ? 'bg-white font-bold text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              )}
            >
              By patient <span className="text-[10px] opacity-60">({filteredPatientGroups.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all-submissions')}
              className={cn(
                'flex-1 rounded-md py-1 text-xs font-semibold transition-all',
                viewMode === 'all-submissions'
                  ? 'bg-white font-bold text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              )}
            >
              All records <span className="text-[10px] opacity-60">({totalSubmissionsCount})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search patients..."
              className="h-8 w-full rounded-lg border border-slate-200/80 bg-slate-50/70 pl-8 pr-3 text-xs outline-none focus:border-cyan-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Status Filter Badges (Equal-width, zero horizontal overflow) */}
          <div className="mt-2.5 flex gap-1 no-scrollbar">
            {[
              ['all', t('reviewPage.filters.all', 'All')],
              ['pending', t('reviewPage.filters.pending', 'Pending')],
              ['urgent', t('reviewPage.filters.urgent', 'Urgent')],
              ['reviewed', t('reviewPage.filters.reviewed', 'Reviewed')],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={cn(
                  'flex-1 rounded-lg py-1 text-center text-xs font-semibold transition-all',
                  statusFilter === value
                    ? 'bg-cyan-600 font-bold text-white shadow-xs shadow-cyan-600/20 dark:bg-cyan-500 dark:text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:text-slate-400'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort Row */}
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-medium text-slate-400">
              <ArrowUpDown className="h-3 w-3" /> Sort
            </span>
            <AppSelect
              value={sortBy}
              onValueChange={setSortBy}
              options={sortOptions}
              className="h-6 w-auto border-0 bg-transparent px-1 text-[11px] font-medium text-slate-500 shadow-none dark:text-slate-400"
            />
          </div>
        </div>

        {/* Scrollable Patient Card List (no-scrollbar hides vertical bar while keeping smooth scrolling) */}
        <div className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto p-2 bg-slate-50/40 dark:bg-[#050816]/40">
          {loading && !selectedResult && Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-200/60 dark:bg-slate-800/50" />
          ))}

          {viewMode === 'by-patient' && filteredPatientGroups.map((group) => {
            const isSelected = selectedPatientKey === group.key
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => selectPatientGroup(group)}
                className={cn(
                  'group w-full rounded-xl p-2.5 text-left transition-all duration-150',
                  isSelected
                    ? 'bg-cyan-50/90 text-cyan-950 dark:bg-cyan-950/40 dark:text-cyan-100 shadow-xs ring-1 ring-cyan-500/25'
                    : 'bg-white/70 hover:bg-slate-100/80 text-slate-800 dark:bg-slate-900/30 dark:hover:bg-slate-800/50 dark:text-slate-200'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <UserAvatar name={group.patient_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {group.patient_name}
                      </p>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {group.latestDate ? formatDateTime(group.latestDate).split(',')[0] : ''}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                          group.hasUrgent
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : group.hasPending
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        )}
                      >
                        {group.hasUrgent
                          ? 'Urgent'
                          : group.hasPending
                          ? `${group.pendingCount} pending`
                          : 'Reviewed'}
                      </span>
                      <span className={cn('text-[10px] font-bold', getRiskTextColor(group.maxCertainty))}>
                        {group.maxCertainty}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}

          {viewMode === 'all-submissions' && filteredSubmissions.map((result) => {
            const isSelected = selectedResultId === result.id
            const certPercent = toCertaintyPercent(result.certainty)
            return (
              <button
                key={result.id}
                type="button"
                onClick={() => selectResult(result)}
                className={cn(
                  'group w-full rounded-xl p-2.5 text-left transition-all duration-150',
                  isSelected
                    ? 'bg-cyan-50/90 text-cyan-950 dark:bg-cyan-950/40 dark:text-cyan-100 shadow-xs ring-1 ring-cyan-500/25'
                    : 'bg-white/70 hover:bg-slate-100/80 text-slate-800 dark:bg-slate-900/30 dark:hover:bg-slate-800/50 dark:text-slate-200'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <UserAvatar name={result.patient_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {result.patient_name || 'Unknown patient'}
                      </p>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {formatDateTime(result.created_at).split(',')[0]}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                          result.is_urgent
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : !result.reviewed_at
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        )}
                      >
                        {result.is_urgent
                          ? 'Urgent'
                          : !result.reviewed_at
                          ? 'Pending'
                          : 'Reviewed'}
                      </span>
                      <span className={cn('text-[10px] font-bold', getRiskTextColor(certPercent))}>
                        {certPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}

          {!loading &&
            ((viewMode === 'by-patient' && !filteredPatientGroups.length) ||
              (viewMode === 'all-submissions' && !filteredSubmissions.length)) && (
              <div className="p-8 text-center text-xs text-slate-500">
                {searchQuery ? 'No records match your search.' : 'Your review queue is clear.'}
              </div>
            )}
        </div>
      </aside>

      {/* ── Right Side: Main Detail & Full Doctor Review ── */}
      <main className="custom-scrollbar min-w-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#070b1b] xl:h-full">
        {error && <ErrorAlert message={error} className="m-4 border-rose-200" />}

        {!selectedResult ? (
          <div className="flex min-h-[560px] items-center justify-center p-8">
            <EmptyState
              icon={FileText}
              title="No Patient Selected"
              description="Select a patient from the queue to review the clinical output."
            />
          </div>
        ) : (
          <div className="p-5 sm:p-7 space-y-6">
            {/* Header: Patient Info + Compact Assessment History Dropdown + Actions */}
            <header className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div className="flex min-w-0 items-center gap-3.5">
                <UserAvatar name={selectedResult.patient_name} size="lg" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                      {selectedResult.patient_name || 'Patient'}
                    </h1>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                        selectedResult.reviewed_at
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      )}
                    >
                      {selectedResult.reviewed_at ? 'Reviewed' : 'Pending review'}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Record #{selectedResult.id} · {formatDateTime(selectedResult.created_at)}</span>

                    {/* Compact Assessment History Selector (No wide horizontal scroll bar) */}
                    {currentPatientAssessments.length > 1 && (
                      <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 dark:border-slate-700">
                        <span className="text-[11px] font-semibold text-slate-400">History:</span>
                        <select
                          value={selectedResultId}
                          onChange={(e) => {
                            const found = currentPatientAssessments.find((a) => a.id === Number(e.target.value))
                            if (found) selectResult(found)
                          }}
                          aria-label="Select patient assessment history"
                          className="cursor-pointer rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {currentPatientAssessments.map((item) => (
                            <option key={item.id} value={item.id} className="dark:bg-slate-900">
                              #{item.id} • {toCertaintyPercent(item.certainty)}% ({item.created_at ? formatDateTime(item.created_at).split(',')[0] : ''})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: PDF & Patient Records */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedResult.id)}
                  disabled={downloadingPdf}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" /> PDF
                </button>
                {selectedResult.patient_id && (
                  <Link
                    to={`/patients/${selectedResult.patient_id}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <User className="h-3.5 w-3.5 text-slate-500" /> Records
                  </Link>
                )}
              </div>
            </header>

            {/* AI Diagnostic Output Banner */}
            <section className={cn(selectedBannerClasses, 'relative overflow-hidden rounded-2xl p-6 text-white shadow-md')}>
              <Activity className="absolute -right-5 -top-8 h-40 w-40 opacity-10" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">AI diagnostic output</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{tExact(selectedResult.diagnosis)}</h2>
                </div>
                <div className="sm:text-right">
                  <p className="text-4xl font-black">
                    {selectedCertaintyPercent}<span className="ml-1 text-base font-medium opacity-75">/100</span>
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-75">Confidence score</p>
                </div>
              </div>
              {selectedResult.is_urgent && (
                <div className="relative mt-4 flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 p-3 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {selectedResult.urgent_reason || 'Critical warning: prompt clinical attention required.'}
                </div>
              )}
            </section>

            {/* Biomarkers / Key Metrics */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Fasting glucose', selectedFacts.fasting_glucose ?? selectedFacts.fasting_plasma_glucose ?? '—', 'mg/dL'],
                ['HbA1c', selectedFacts.hba1c ?? '—', '%'],
                ['BMI', selectedFacts.bmi ?? '—', 'kg/m²'],
                ['Age / sex', selectedFacts.age ? `${selectedFacts.age} yrs` : '—', selectedFacts.gender || '—'],
              ].map(([label, value, unit]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">{label}</p>
                  <p className="mt-1.5 text-base font-bold text-slate-950 dark:text-white">
                    {value} <span className="text-xs font-medium text-slate-500">{unit}</span>
                  </p>
                </div>
              ))}
            </section>

            {/* Optional Patient Reported Note */}
            {(selectedResult.patient_note || selectedResult.explanation_trace?.patient_note) && (
              <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-3.5 text-xs text-slate-700 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-slate-300">
                <span className="font-bold text-cyan-800 dark:text-cyan-400">Patient reported: </span>
                “{selectedResult.patient_note || selectedResult.explanation_trace?.patient_note}”
              </div>
            )}

            {/* ── DOCTOR REVIEW - FULL WIDTH & CLEAN ── */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Doctor Review & Clinical Notes
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Provide official medical sign-off, treatment notes, and triage flag.
                    </p>
                  </div>
                </div>
                {selectedResult.reviewed_at && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Reviewed on {formatDateTime(selectedResult.reviewed_at).split(',')[0]}
                  </span>
                )}
              </div>

              <form onSubmit={saveReview} className="space-y-4">
                {/* Note Editor with Template Toolbar */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Clinical Note & Follow-up Instructions
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-400">Insert template:</span>
                      {quickPresetOptions.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => applyPresetNote(preset.note)}
                          className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-cyan-950/50"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    placeholder="Write your clinical evaluation, medical recommendations, medication adjustments, or next follow-up date..."
                    rows={6}
                    className="w-full rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 text-sm leading-relaxed text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white dark:focus:bg-slate-900"
                  />
                </div>

                {/* Urgent Case Triage */}
                <div
                  className={cn(
                    'rounded-xl border p-4 transition-all',
                    isUrgent
                      ? 'border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20'
                      : 'border-slate-100 bg-slate-50/60 dark:border-slate-800/80 dark:bg-slate-900/40'
                  )}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(event) => setIsUrgent(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Flag as urgent clinical case
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Elevates this assessment to high priority for immediate patient notification and medical follow-up.
                      </p>
                    </div>
                  </label>

                  {isUrgent && (
                    <div className="mt-3 pl-7">
                      <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-400 mb-1">
                        Urgency Justification (Required)
                      </label>
                      <textarea
                        rows={2}
                        value={urgentReason}
                        onChange={(event) => setUrgentReason(event.target.value)}
                        placeholder="e.g. Severely elevated fasting glucose (>200 mg/dL), requires immediate endocrinology evaluation..."
                        className="w-full rounded-lg border border-rose-300 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-rose-800 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Footer Controls: Sign button */}
                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="flex items-center gap-3 ml-auto">
                    {!selectedResult.reviewed_at && (
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        Signing marks this assessment as reviewed.
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-xs shadow-cyan-600/20"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Sign & Submit Review'}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export function ReviewPage() {
  const { t, tExact, isKhmer } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramResultId = searchParams.get('diagnosis_result_id') || searchParams.get('id')
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
      const response = await api.get('/diagnosis/review?limit=100')
      const loaded = getApiData(response) || []

      // If a specific diagnosis result was requested in the URL and isn't in recent results, fetch it directly
      if (paramResultId && !loaded.some((item) => String(item.id) === String(paramResultId))) {
        try {
          const singleRes = await api.get(`/diagnosis/${paramResultId}`)
          const singleItem = getApiData(singleRes)
          if (singleItem && singleItem.id) {
            loaded.unshift(singleItem)
          }
        } catch (_) {
          // If individual fetch fails, proceed with the loaded review list
        }
      }

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

  // ── Auto-select target from query param or first item ──
  useEffect(() => {
    if (results.length === 0) return

    if (paramResultId) {
      const match = results.find((r) => String(r.id) === String(paramResultId))
      if (match) {
        selectResult(match)
        return
      }
    }

    if (!selectedResultId) {
      if (viewMode === 'by-patient' && patientGroups.length > 0) {
        selectPatientGroup(patientGroups[0])
      } else {
        selectResult(results[0])
      }
    }
  }, [results, selectedResultId, viewMode, patientGroups, paramResultId])

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
      applyPresetNote={applyPresetNote}
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
