import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Droplets,
  FileText,
  Footprints,
  HeartPulse,
  ListChecks,
  Pill,
  PlusCircle,
  Salad,
  ShieldCheck,
  Siren,
  Stethoscope,
  Target,
  UserCheck,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { ErrorAlert, Skeleton } from '@/components/ui'
import { MiniSparkline } from '@/components/ui/MiniSparkline'
import { cn } from '@/lib/utils'
import { getTreatmentPlans } from '@/lib/treatmentPlanStore'
import {
  extractMetricSeries,
  getDaysSinceCheck,
  getFastingGlucoseCategory,
  getLatestFacts,
  getRelativeCheckAge,
  toNumberOrNull,
} from '@/components/dashboard/patient/patient-dashboard-utils'

const TABS = ['Overview', 'Treatment Plan', 'Medications', 'Appointments']
const SAFETY_ITEM_KEYS = [1, 2, 3, 4].map((number) => `patientDashboard.carePlanPage.safety.item${number}`)

function CareCard({ children, className }) {
  return (
    <section className={cn('min-w-0 rounded-[18px] border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(31,85,120,0.045)] dark:border-slate-800 dark:bg-slate-900', className)}>
      {children}
    </section>
  )
}

function SectionTitle({ icon: Icon, title, description, action, tone = 'blue' }) {
  const iconTone = {
    blue: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
  }[tone]

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconTone)}><Icon className="h-4.5 w-4.5" aria-hidden /></span> : null}
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
          {description ? <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  )
}

function formatPlanDate(value) {
  if (!value) return null
  const date = new Date(String(value).length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function appointmentDateParts(value) {
  if (!value) return null
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return {
    month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date).toUpperCase(),
    day: new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(date),
    full: new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(date),
    timestamp: date.getTime(),
  }
}

function parseTargetRange(value) {
  const numbers = String(value || '').match(/\d+(?:\.\d+)?/g)?.map(Number) || []
  return numbers.length >= 2 ? { min: numbers[0], max: numbers[1] } : null
}

function getGlucoseStatus(value, target) {
  if (value === null) return null
  if (target) {
    if (value < target.min) return { label: 'Below target', tone: 'warning' }
    if (value > target.max) return { label: 'Above target', tone: 'danger' }
    return { label: 'In target', tone: 'success' }
  }
  const category = getFastingGlucoseCategory(value)
  if (category?.tone === 'danger') return { label: 'High reading', tone: 'danger' }
  if (category?.tone === 'warning') return { label: 'Above normal range', tone: 'warning' }
  return { label: 'In normal range', tone: 'success' }
}

function getTrendLabel(series) {
  if (series.length < 2) return null
  const previous = series.at(-2).value
  const latest = series.at(-1).value
  const threshold = Math.max(3, Math.abs(previous) * 0.05)
  if (Math.abs(latest - previous) <= threshold) return 'Stable'
  return latest > previous ? 'Rising' : 'Falling'
}

function statusPillClass(tone) {
  if (tone === 'danger') return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
  return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

function StatusPill({ children, tone = 'neutral', icon: Icon }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold', statusPillClass(tone))}>{Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}{children}</span>
}

function CarePlanLoading() {
  return (
    <div className="space-y-5 pb-10">
      <div className="rounded-[20px] border border-slate-200 bg-white p-5 sm:p-6"><Skeleton className="h-7 w-52" /><Skeleton className="mt-3 h-4 w-full max-w-xl" /><div className="mt-6 flex gap-2"><Skeleton className="h-10 w-32 rounded-xl" /><Skeleton className="h-10 w-28 rounded-xl" /></div></div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.8fr)]"><div className="space-y-4"><Skeleton className="h-72 rounded-[18px]" /><Skeleton className="h-40 rounded-[18px]" /></div><div className="space-y-4"><Skeleton className="h-44 rounded-[18px]" /><Skeleton className="h-56 rounded-[18px]" /></div></div>
    </div>
  )
}

function TodayCareCard({ tasks, completedIds, onToggle }) {
  const completedCount = tasks.filter((task) => completedIds.has(task.id)).length
  const percent = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <CareCard className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
        <SectionTitle icon={ListChecks} title="Today's Care" description="Complete your daily tasks" tone="blue" />
        {tasks.length ? <div className="min-w-[150px] sm:text-right"><p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{completedCount} of {tasks.length} completed</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${percent}%` }} /></div><p className="mt-1 text-[11px] text-slate-400">{percent}%</p></div> : null}
      </div>
      {tasks.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{tasks.map((task, index) => {
        const done = completedIds.has(task.id)
        const Icon = task.icon
        return (
          <button key={task.id} type="button" onClick={() => onToggle(task.id)} className="group flex min-h-[66px] w-full items-center gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition', done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-slate-50 text-slate-500 group-hover:border-primary-300 group-hover:text-primary-600 dark:border-slate-700 dark:bg-slate-800')}>
              {done ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-4 w-4" />}
            </span>
            <span className="min-w-0 flex-1"><span className={cn('block truncate text-sm font-semibold', done ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900 dark:text-slate-100')}>{task.title}</span>{task.detail ? <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{task.detail}</span> : null}</span>
            <StatusPill tone={done ? 'success' : index === completedCount ? 'warning' : 'neutral'}>{done ? 'Completed' : index === completedCount ? 'Next' : 'Later'}</StatusPill>
          </button>
        )
      })}</div> : <div className="py-8 text-center"><ClipboardCheck className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-sm font-medium text-slate-600">No daily tasks are available yet.</p><p className="mt-1 text-xs text-slate-400">Your care tasks will appear when a treatment plan is assigned.</p></div>}
    </CareCard>
  )
}

function GlucoseCard({ value, targetLabel, status, trendLabel, series }) {
  if (value === null) return null
  const chartColor = status?.tone === 'danger' ? '#f43f5e' : status?.tone === 'warning' ? '#f59e0b' : '#2563eb'
  return (
    <CareCard className="p-4 sm:p-5">
      <SectionTitle icon={Droplets} title="Current Glucose" description="Latest fasting reading" tone="blue" />
      <div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{Math.round(value)} <span className="text-sm font-semibold text-slate-400">mg/dL</span></p><p className="mt-1 text-xs text-slate-500">Fasting glucose</p></div>{status ? <StatusPill tone={status.tone} icon={status.tone === 'success' ? CheckCircle2 : AlertCircle}>{status.label}</StatusPill> : null}</div>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target</p><p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{targetLabel || 'Not set'}</p></div>{trendLabel ? <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">7-day trend</p><p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{trendLabel}</p></div> : null}</div>
      {series.length >= 2 ? <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800"><MiniSparkline points={series.map((point) => point.value)} strokeColor={chartColor} fillColor={chartColor} height={54} /><div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>Earlier</span><span>Latest</span></div></div> : null}
    </CareCard>
  )
}

function MedicationSummary({ medication, onViewAll, wide }) {
  if (!medication) return null
  return (
    <CareCard className={cn('p-4 sm:p-5', wide && 'sm:col-span-2')}>
      <SectionTitle icon={Pill} title="Next Medication" description="Your active prescription" tone="violet" />
      <div className="mt-4"><h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{medication.name}</h3>{medication.dosage ? <p className="mt-0.5 text-sm font-semibold text-primary-600 dark:text-primary-400">{medication.dosage}</p> : null}{medication.frequency ? <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />{medication.frequency}</p> : null}</div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800"><StatusPill tone={String(medication.status).toLowerCase() === 'active' ? 'success' : 'neutral'}>{medication.status || 'Scheduled'}</StatusPill><button type="button" onClick={onViewAll} className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40">View all medications <ArrowRight className="h-3.5 w-3.5" /></button></div>
    </CareCard>
  )
}

function AppointmentSummary({ appointment, onViewAll, compact = false }) {
  if (!appointment) return null
  const date = appointmentDateParts(appointment.scheduledDate)
  if (!date) return null
  return (
    <CareCard className={cn('p-4 sm:p-5', compact && 'shadow-none')}>
      <SectionTitle icon={CalendarDays} title={compact ? 'Upcoming Appointment' : 'Next Appointment'} description={compact ? null : 'Your nearest scheduled visit'} tone="green" action={compact ? <button type="button" onClick={onViewAll} className="text-xs font-semibold text-primary-600 hover:text-primary-700">View all →</button> : null} />
      <div className="mt-4 flex gap-3"><div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300"><span className="text-[10px] font-bold tracking-wider">{date.month}</span><span className="text-xl font-extrabold leading-none">{date.day}</span></div><div className="min-w-0 flex-1"><h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900 dark:text-slate-100">{appointment.title}</h3>{appointment.doctorName ? <p className="mt-1 text-xs text-slate-500">{appointment.doctorName}</p> : null}{appointment.location ? <p className="mt-0.5 text-xs text-slate-400">{appointment.location}</p> : null}</div></div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800"><StatusPill tone={String(appointment.status).toLowerCase() === 'completed' ? 'success' : 'neutral'}>{appointment.status || 'Scheduled'}</StatusPill>{!compact ? <button type="button" onClick={onViewAll} className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700">View all appointments <ArrowRight className="h-3.5 w-3.5" /></button> : null}</div>
    </CareCard>
  )
}

function AttentionCard({ isUrgent, urgentReason, glucoseStatus, onViewWarnings }) {
  const needsAttention = isUrgent || ['danger', 'warning'].includes(glucoseStatus?.tone)
  if (!needsAttention) {
    return <CareCard className="border-emerald-200/70 bg-emerald-50/45 p-4 sm:p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300"><ShieldCheck className="h-4.5 w-4.5" /></span><div><h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">No active concerns</h2><p className="mt-1 text-xs leading-5 text-emerald-800/80 dark:text-emerald-200/80">Continue following your current care plan and complete your scheduled check-ins.</p></div></div></CareCard>
  }
  return (
    <CareCard className="border-rose-200/80 bg-rose-50/55 p-4 sm:p-5 dark:border-rose-900/50 dark:bg-rose-950/20">
      <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300"><AlertTriangle className="h-4.5 w-4.5" /></span><div className="min-w-0 flex-1"><h2 className="text-sm font-bold text-rose-900 dark:text-rose-100">Needs attention</h2><p className="mt-1 text-xs leading-5 text-rose-900/80 dark:text-rose-200/80">{urgentReason || (glucoseStatus?.label === 'Below target' ? 'Your latest fasting glucose result is below your recommended target.' : 'Your latest fasting glucose result is above your recommended target.')} Follow your current treatment plan and contact your care team if symptoms worsen.</p><button type="button" onClick={onViewWarnings} className="mt-3 inline-flex min-h-10 items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40">View warning signs <ArrowRight className="h-3.5 w-3.5" /></button></div></div>
    </CareCard>
  )
}

function DoctorReviewCard({ result }) {
  if (!result) return null
  const reviewerName = result.reviewed_by_name || result.reviewed_by_user?.name
  const reviewed = Boolean(result.review_note || result.reviewed_at)
  return (
    <CareCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3"><SectionTitle icon={Stethoscope} title="Doctor Review" description={reviewerName ? `Reviewed by ${reviewerName.startsWith('Dr.') ? reviewerName : `Dr. ${reviewerName}`}` : 'Clinical review status'} tone="amber" /><StatusPill tone={reviewed ? 'success' : 'warning'} icon={reviewed ? UserCheck : Clock3}>{reviewed ? 'Reviewed' : 'Awaiting review'}</StatusPill></div>
      {result.review_note ? <blockquote className="mt-4 rounded-xl border border-sky-100 bg-sky-50/50 p-4 text-sm leading-6 text-slate-700 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-slate-200">“{result.review_note}”{result.reviewed_at ? <footer className="mt-2 text-xs font-medium text-slate-400">Reviewed {formatPlanDate(result.reviewed_at)}</footer> : null}</blockquote> : <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Your doctor hasn't reviewed this care plan yet. You'll see their notes here once the review is complete.</p>}
    </CareCard>
  )
}

function QuickActions({ reportUrl, onTreatmentPlan }) {
  const items = [
    { icon: FileText, title: 'View Full Report', detail: 'See complete assessment details', to: reportUrl },
    { icon: PlusCircle, title: 'Start Assessment', detail: 'Record a new health check', to: '/diagnosis' },
  ]
  return (
    <CareCard className="p-4 sm:p-5"><h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Quick Actions</h2><div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">{items.map(({ icon: Icon, title, detail, to }) => <Link key={title} to={to} className="group flex min-h-[64px] items-center gap-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition group-hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300"><Icon className="h-4.5 w-4.5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</span><span className="mt-0.5 block text-xs text-slate-500">{detail}</span></span><ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary-500" /></Link>)}<button type="button" onClick={onTreatmentPlan} className="group flex min-h-[64px] w-full items-center gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300"><Target className="h-4.5 w-4.5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">View Treatment Plan</span><span className="mt-0.5 block text-xs text-slate-500">Goals, activity and health targets</span></span><ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary-500" /></button></div></CareCard>
  )
}

function ProgressCard({ rows }) {
  if (!rows.length) return null
  return (
    <CareCard className="p-4 sm:p-5"><SectionTitle icon={Activity} title="Your Progress" description="Current care-plan status" tone="green" /><div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{rows.map((row) => { const Icon = row.icon; return <div key={row.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', row.iconClass)}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{row.label}</span><StatusPill tone={row.tone}>{row.status}</StatusPill></div> })}</div></CareCard>
  )
}

function UrgentCareCard({ open, onToggle, t, cardRef }) {
  return (
    <CareCard className="border-rose-200/80 bg-rose-50/45 dark:border-rose-900/50 dark:bg-rose-950/20">
      <button ref={cardRef} type="button" aria-expanded={open} aria-controls="urgent-care-details" onClick={onToggle} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300"><Siren className="h-4 w-4" /></span><span className="flex-1 text-sm font-bold text-rose-900 dark:text-rose-100">Seek care urgently if</span><ChevronDown className={cn('h-4 w-4 text-rose-500 transition-transform', open && 'rotate-180')} /></button>
      {open ? <div id="urgent-care-details" className="border-t border-rose-200/70 px-4 py-4 dark:border-rose-900/50"><ul className="space-y-2.5">{SAFETY_ITEM_KEYS.map((key) => <li key={key} className="flex items-start gap-2 text-xs leading-5 text-rose-900/85 dark:text-rose-200/85"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />{t(key)}</li>)}</ul><p className="mt-3 text-[11px] leading-4 text-rose-700/80 dark:text-rose-300/80">{t('patientDashboard.carePlanPage.safety.footnote', "This list doesn't replace medical advice. In an emergency, call your local emergency number.")}</p></div> : null}
    </CareCard>
  )
}

function TreatmentPlanTab({ plan, latestResult }) {
  const procedures = plan?.procedures || []
  const matches = (pattern) => procedures.filter((item) => pattern.test(`${item.title} ${item.category} ${item.description}`.toLowerCase()))
  const nutrition = matches(/nutrition|diet|meal|carbohydrate|low-gi/)
  const activity = matches(/activity|exercise|walk|cardio|physical/)
  const covered = new Set([...nutrition, ...activity].map((item) => item.id))
  const otherActions = procedures.filter((item) => !covered.has(item.id))
  const cards = [
    nutrition.length ? { icon: Salad, title: 'Nutrition', description: 'Your meal and nutrition goals', items: nutrition, tone: 'green' } : null,
    activity.length ? { icon: Footprints, title: 'Physical Activity', description: 'Your exercise and movement goals', items: activity, tone: 'blue' } : null,
    plan?.targetGlucose || plan?.targetA1c ? { icon: Target, title: 'Health Targets', description: 'Your glucose and HbA1c goals', targets: [plan.targetGlucose && `Glucose: ${plan.targetGlucose}`, plan.targetA1c && `HbA1c: ${plan.targetA1c}`].filter(Boolean), tone: 'violet' } : null,
    plan?.milestones?.length ? { icon: CheckCircle2, title: 'Milestones', description: 'Progress through your care plan', milestones: plan.milestones, tone: 'amber' } : null,
    otherActions.length ? { icon: HeartPulse, title: 'Care Actions', description: 'Other actions in your active plan', items: otherActions, tone: 'blue' } : null,
  ].filter(Boolean)

  return (
    <div className="space-y-4"><div><h2 className="text-xl font-bold text-slate-950 dark:text-white">Treatment Plan</h2><p className="mt-1 text-sm text-slate-500">Open a section when you need more detail.</p></div>{cards.length ? <div className="grid items-start gap-4 md:grid-cols-2">{cards.map(({ icon, title, description, items, targets, milestones, tone }) => <CareCard key={title} className="overflow-hidden"><details className="group"><summary className="flex min-h-[92px] cursor-pointer list-none items-center gap-3 p-4 sm:p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"><SectionTitle icon={icon} title={title} description={description} tone={tone} /><ChevronDown className="ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" /></summary><div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">{items ? <div className="space-y-3">{items.map((item) => <div key={item.id || item.title} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</h3>{item.status ? <StatusPill tone={String(item.status).toLowerCase() === 'completed' ? 'success' : 'neutral'}>{item.status}</StatusPill> : null}</div>{item.description ? <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p> : null}</div>)}</div> : null}{targets ? <ul className="space-y-2">{targets.map((target) => <li key={target} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700 dark:bg-slate-800/50 dark:text-slate-200"><Target className="h-4 w-4 text-primary-500" />{target}</li>)}</ul> : null}{milestones ? <div className="space-y-3">{milestones.map((milestone) => <div key={`${milestone.title}-${milestone.date}`} className="flex items-start gap-3"><span className={cn('mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border', milestone.completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent dark:border-slate-600')}><Check className="h-3 w-3" /></span><div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{milestone.title}</p>{milestone.date ? <p className="text-xs text-slate-400">{milestone.date}</p> : null}</div></div>)}</div> : null}</div></details></CareCard>)}</div> : <CareCard className="p-6 text-center"><Target className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No treatment plan has been assigned yet.</p></CareCard>}{latestResult?.recommendation ? <CareCard className="p-4 sm:p-5"><SectionTitle icon={Stethoscope} title="Latest care guidance" description="From your most recent assessment" tone="blue" /><p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{latestResult.recommendation}</p></CareCard> : null}</div>
  )
}

function MedicationsTab({ medications }) {
  return (
    <div className="space-y-4"><div><h2 className="text-xl font-bold text-slate-950 dark:text-white">Medications</h2><p className="mt-1 text-sm text-slate-500">Your current medication schedule.</p></div>{medications.length ? <CareCard className="overflow-hidden"><div className="hidden overflow-x-auto md:block"><table className="w-full text-left"><thead className="bg-slate-50/80 dark:bg-slate-800/60"><tr>{['Medication', 'Dose', 'Time & instructions', 'Status'].map((label) => <th key={label} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{medications.map((medication, index) => <tr key={`${medication.name}-${index}`}><td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{medication.name}</td><td className="px-4 py-4 text-sm font-semibold text-primary-600 dark:text-primary-400">{medication.dosage || '—'}</td><td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">{medication.instructions || medication.frequency || '—'}</td><td className="px-4 py-4"><StatusPill tone={String(medication.status).toLowerCase() === 'active' ? 'success' : 'neutral'}>{medication.status || 'Scheduled'}</StatusPill></td></tr>)}</tbody></table></div><div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">{medications.map((medication, index) => <article key={`${medication.name}-${index}`} className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{medication.name}</h3>{medication.dosage ? <p className="mt-1 text-sm font-semibold text-primary-600">{medication.dosage}</p> : null}</div><StatusPill tone={String(medication.status).toLowerCase() === 'active' ? 'success' : 'neutral'}>{medication.status || 'Scheduled'}</StatusPill></div>{medication.instructions || medication.frequency ? <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />{medication.instructions || medication.frequency}</p> : null}</article>)}</div></CareCard> : <CareCard className="p-6 text-center"><Pill className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No medications are listed in your current plan.</p></CareCard>}</div>
  )
}

function AppointmentsTab({ appointments }) {
  return (
    <div className="space-y-4"><div><h2 className="text-xl font-bold text-slate-950 dark:text-white">Appointments</h2><p className="mt-1 text-sm text-slate-500">Scheduled care from your current treatment plan.</p></div>{appointments.length ? <div className="space-y-3">{appointments.map((appointment) => { const date = appointmentDateParts(appointment.scheduledDate); if (!date) return null; const status = String(appointment.status || 'Scheduled'); const lower = status.toLowerCase(); return <CareCard key={`${appointment.id}-${appointment.scheduledDate}`} className="p-4 sm:p-5"><div className="flex items-center gap-4"><div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"><span className="text-[10px] font-bold">{date.month}</span><span className="text-xl font-extrabold leading-none">{date.day}</span></div><div className="min-w-0 flex-1"><h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{appointment.title}</h3><p className="mt-1 text-xs text-slate-500">{date.full}{appointment.doctorName ? ` • ${appointment.doctorName}` : ''}</p>{appointment.location ? <p className="mt-0.5 text-xs text-slate-400">{appointment.location}</p> : null}</div><StatusPill tone={lower === 'completed' ? 'success' : lower === 'cancelled' ? 'danger' : 'neutral'}>{status}</StatusPill></div></CareCard> })}</div> : <CareCard className="p-6 text-center"><CalendarDays className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No appointments are scheduled in your current plan.</p><p className="mt-1 text-xs text-slate-400">New appointments will appear here when your care team adds them.</p></CareCard>}</div>
  )
}

export function CarePlanPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')
  const [urgentOpen, setUrgentOpen] = useState(false)
  const [completedTaskIds, setCompletedTaskIds] = useState(new Set())
  const urgentRef = useRef(null)

  const patientPlan = useMemo(() => {
    const normalizedName = String(user?.name || '').trim().toLowerCase()
    const patientId = String(user?.patient_id || '').trim().toLowerCase()
    if (!normalizedName && !patientId) return null
    return getTreatmentPlans().find((plan) => {
      const planName = String(plan.patientName || '').trim().toLowerCase()
      const planPatientId = String(plan.patientId || '').trim().toLowerCase()
      return (normalizedName && planName === normalizedName) || (patientId && planPatientId === patientId)
    }) || null
  }, [user])

  useEffect(() => {
    let cancelled = false
    async function loadResults() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get('/diagnosis/mine')
        if (!cancelled) setResults(getApiData(response) || [])
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, t('patientDashboard.carePlanPage.loadFailed')))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadResults()
    return () => { cancelled = true }
  }, [t])

  const latestResult = results[0] || null
  const latestFacts = getLatestFacts(results)
  const glucose = toNumberOrNull(latestFacts.fasting_glucose ?? latestFacts.fasting_plasma_glucose)
  const glucoseSeries = extractMetricSeries(results, ['fasting_glucose', 'fasting_plasma_glucose'])
  const glucoseTarget = parseTargetRange(patientPlan?.targetGlucose)
  const glucoseStatus = getGlucoseStatus(glucose, glucoseTarget)
  const glucoseTrend = getTrendLabel(glucoseSeries)
  const medications = patientPlan?.medications || []
  const activeMedication = medications.find((medication) => !['inactive', 'stopped', 'cancelled'].includes(String(medication.status).toLowerCase())) || medications[0] || null
  const appointments = useMemo(() => (patientPlan?.procedures || []).filter((item) => item.scheduledDate).map((item) => ({ ...item, doctorName: item.doctorName || patientPlan?.doctorName })).sort((left, right) => String(left.scheduledDate).localeCompare(String(right.scheduledDate))), [patientPlan])
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const nextAppointment = appointments.find((item) => {
    const date = appointmentDateParts(item.scheduledDate)
    return date && date.timestamp >= todayStart.getTime() && !['completed', 'cancelled'].includes(String(item.status).toLowerCase())
  }) || null

  const tasks = useMemo(() => {
    const next = []
    if (glucose !== null) next.push({ id: `glucose-${latestResult?.id || 'latest'}`, title: 'Fasting glucose check', detail: latestResult?.created_at ? `Last recorded ${getRelativeCheckAge(latestResult.created_at, t) || formatPlanDate(latestResult.created_at)}` : null, icon: Droplets, defaultCompleted: getDaysSinceCheck(latestResult?.created_at) === 0 })
    for (const [index, medication] of medications.entries()) {
      if (next.length >= 4) break
      next.push({ id: `medication-${index}-${medication.name}`, title: [medication.name, medication.dosage].filter(Boolean).join(' '), detail: medication.instructions || medication.frequency, icon: Pill, defaultCompleted: String(medication.status).toLowerCase() === 'completed' })
    }
    for (const procedure of patientPlan?.procedures || []) {
      if (next.length >= 4) break
      next.push({ id: `procedure-${procedure.id || procedure.title}`, title: procedure.title, detail: procedure.category || procedure.description, icon: Activity, defaultCompleted: String(procedure.status).toLowerCase() === 'completed' })
    }
    return next.slice(0, 4)
  }, [glucose, latestResult, medications, patientPlan, t])

  const todayKey = new Date().toLocaleDateString('en-CA')
  const taskStorageKey = `des-care-tasks-${user?.id || user?.email || 'patient'}-${patientPlan?.id || latestResult?.id || 'plan'}-${todayKey}`

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(taskStorageKey) || 'null')
      if (Array.isArray(stored)) setCompletedTaskIds(new Set(stored))
      else setCompletedTaskIds(new Set(tasks.filter((task) => task.defaultCompleted).map((task) => task.id)))
    } catch {
      setCompletedTaskIds(new Set(tasks.filter((task) => task.defaultCompleted).map((task) => task.id)))
    }
  }, [taskStorageKey, tasks])

  function toggleTask(taskId) {
    setCompletedTaskIds((current) => {
      const next = new Set(current)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      try { window.localStorage.setItem(taskStorageKey, JSON.stringify([...next])) } catch { /* local persistence is optional */ }
      return next
    })
  }

  const phaseProgress = useMemo(() => {
    const start = patientPlan?.startDate ? new Date(`${patientPlan.startDate}T00:00:00`) : null
    const end = patientPlan?.estimatedEnd ? new Date(`${patientPlan.estimatedEnd}T00:00:00`) : null
    if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start) {
      const totalDays = Math.max(1, Math.round((end - start) / 86400000) + 1)
      const day = Math.min(totalDays, Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000) + 1))
      return { percent: Math.round((day / totalDays) * 100), label: `Day ${day} / ${totalDays}` }
    }
    const milestones = patientPlan?.milestones || []
    if (!milestones.length) return { percent: 0, label: null }
    const completed = milestones.filter((item) => item.completed).length
    return { percent: Math.round((completed / milestones.length) * 100), label: `${completed} of ${milestones.length} milestones` }
  }, [patientPlan])

  const progressRows = useMemo(() => {
    const rows = []
    if (glucoseStatus) rows.push({ icon: Droplets, label: 'Blood Glucose', status: glucoseStatus.label, tone: glucoseStatus.tone, iconClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300' })
    if (medications.length) {
      const activeCount = medications.filter((item) => String(item.status).toLowerCase() === 'active').length
      rows.push({ icon: Pill, label: 'Medications', status: activeCount ? `${activeCount} active` : patientPlan?.status || 'Listed', tone: activeCount ? 'success' : 'neutral', iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300' })
    }
    if (patientPlan?.milestones?.length) {
      const completed = patientPlan.milestones.filter((item) => item.completed).length
      rows.push({ icon: CheckCircle2, label: 'Milestones', status: `${completed} of ${patientPlan.milestones.length}`, tone: completed === patientPlan.milestones.length ? 'success' : 'warning', iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300' })
    }
    return rows
  }, [glucoseStatus, medications, patientPlan])

  function showWarnings() {
    setUrgentOpen(true)
    window.setTimeout(() => urgentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  if (loading) return <CarePlanLoading />

  const updateDate = latestResult?.reviewed_at || patientPlan?.createdAt || latestResult?.created_at
  const reviewLabel = latestResult?.review_note ? 'Doctor reviewed' : latestResult ? 'Doctor review pending' : 'Assessment needed'
  const reportUrl = latestResult?.id ? `/diagnosis/result?diagnosis_result_id=${latestResult.id}` : '/my-results'
  const phaseParts = String(patientPlan?.phase || patientPlan?.status || 'Care plan').split(':')

  return (
    <div className="space-y-5 pb-10">
      <ErrorAlert message={error} />

      <CareCard className="overflow-hidden bg-gradient-to-r from-white via-sky-50/50 to-cyan-50/60 p-4 sm:p-6 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/25">
        <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-sm shadow-primary-600/20"><HeartPulse className="h-5 w-5" /></span><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">My Care Plan</h1><StatusPill tone={latestResult?.is_urgent ? 'danger' : latestResult?.review_note ? 'success' : 'warning'} icon={latestResult?.is_urgent ? AlertTriangle : latestResult?.review_note ? CheckCircle2 : Clock3}>{latestResult?.is_urgent ? 'Attention required' : reviewLabel}</StatusPill></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{updateDate ? `Updated ${formatPlanDate(updateDate)} • ` : ''}{reviewLabel}</p></div></div><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Your personalized care plan to help manage diabetes and stay healthy.</p><div className="mt-4 flex flex-wrap gap-2"><Link to="/diagnosis" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"><PlusCircle className="h-4 w-4" />Start Assessment</Link><Link to={reportUrl} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><FileText className="h-4 w-4" />Full Report</Link>{patientPlan ? <button type="button" onClick={() => setActiveTab('Treatment Plan')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300"><Stethoscope className="h-4 w-4" />Doctor's Plan</button> : null}</div></div>
          {patientPlan ? <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-600">{phaseParts[0]}</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{phaseParts.slice(1).join(':').trim() || patientPlan.protocolName || patientPlan.status}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-cyan-500 transition-[width] duration-500" style={{ width: `${phaseProgress.percent}%` }} /></div><div className="mt-2 flex justify-between text-[11px] font-medium text-slate-500"><span>{phaseProgress.label || 'Progress'}</span><span>{phaseProgress.percent}%</span></div></div> : null}
        </div>
      </CareCard>

      <nav aria-label="Care plan sections" className="sticky top-0 z-10 -mx-1 overflow-x-auto bg-[#f5f8fc]/90 px-1 py-1 backdrop-blur dark:bg-[#030309]/90"><div className="inline-flex min-w-full gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm sm:min-w-0 dark:border-slate-800 dark:bg-slate-900">{TABS.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={cn('min-h-10 flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 sm:flex-none', activeTab === tab ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800')}>{tab}</button>)}</div></nav>

      {activeTab === 'Overview' ? <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.8fr)]">
        <main className="min-w-0 space-y-4"><div className={cn('grid items-start gap-4', glucose !== null && 'lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.8fr)]')}><TodayCareCard tasks={tasks} completedIds={completedTaskIds} onToggle={toggleTask} /><GlucoseCard value={glucose} targetLabel={patientPlan?.targetGlucose} status={glucoseStatus} trendLabel={glucoseTrend} series={glucoseSeries} /></div><div className="grid items-start gap-4 sm:grid-cols-2"><MedicationSummary medication={activeMedication} onViewAll={() => setActiveTab('Medications')} wide={!nextAppointment} /><AppointmentSummary appointment={nextAppointment} onViewAll={() => setActiveTab('Appointments')} /></div><AttentionCard isUrgent={Boolean(latestResult?.is_urgent)} urgentReason={latestResult?.urgent_reason} glucoseStatus={glucoseStatus} onViewWarnings={showWarnings} /><DoctorReviewCard result={latestResult} /></main>
        <aside className="min-w-0 space-y-4 xl:sticky xl:top-16"><QuickActions reportUrl={reportUrl} onTreatmentPlan={() => setActiveTab('Treatment Plan')} />{nextAppointment ? <AppointmentSummary appointment={nextAppointment} onViewAll={() => setActiveTab('Appointments')} compact /> : null}<ProgressCard rows={progressRows} /><UrgentCareCard open={urgentOpen} onToggle={() => setUrgentOpen((current) => !current)} t={t} cardRef={urgentRef} /></aside>
      </div> : null}

      {activeTab === 'Treatment Plan' ? <TreatmentPlanTab plan={patientPlan} latestResult={latestResult} /> : null}
      {activeTab === 'Medications' ? <MedicationsTab medications={medications} /> : null}
      {activeTab === 'Appointments' ? <AppointmentsTab appointments={appointments} /> : null}
    </div>
  )
}
