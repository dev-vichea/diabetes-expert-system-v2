import { useEffect, useState, useMemo, useCallback, useRef, useLayoutEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  ClipboardCheck,
  Clock3,
  History,
  HeartPulse,
  Pill,
  RefreshCw,
  RotateCcw,
  Search,
  Stethoscope,
  Users,
} from 'lucide-react'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SectionCard,
  UserAvatar,
  DashboardSkeleton,
} from '@/components/ui'
import api, { getApiData } from '@/api/client'
import { CAMBODIA_TIME_ZONE, formatDateTime } from '@/lib/datetime'
import { getLocaleForLanguage } from '@/lib/i18n'
import { notify } from '@/lib/toast'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

/* ------------------------------------------------------------------ */
/*  Greeting helpers (Cambodia ICT clock)                              */
/* ------------------------------------------------------------------ */
/** Returns the locale key for the current time-of-day greeting. */
function getGreetingKey(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: CAMBODIA_TIME_ZONE,
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(now)
  )

  if (hour < 12) return 'greetingMorning'
  if (hour < 17) return 'greetingAfternoon'
  return 'greetingEvening'
}

/* ------------------------------------------------------------------ */
/*  Animated numbers (count-up on mount / on value change)             */
/* ------------------------------------------------------------------ */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Animates a numeric value from its previous display towards `target`
 *  using an ease-out cubic ramp. Falls back to the raw value when the
 *  user prefers reduced motion or the value is not a finite number. */
function useCountUp(target, duration = 900) {
  const lastRef = useRef(0)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const to = Number(target)
    if (!Number.isFinite(to) || prefersReducedMotion()) {
      lastRef.current = to || 0
      setDisplay(to || 0)
      return undefined
    }

    const from = lastRef.current
    if (from === to) {
      setDisplay(to)
      return undefined
    }

    const start = performance.now()
    let raf
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = Math.round(from + (to - from) * eased)
      lastRef.current = value
      setDisplay(value)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return display
}

/** Renders a numeric value with the count-up ramp; shows `—` until ready. */
function AnimatedNumber({ value, ready = true, className }) {
  const count = useCountUp(ready ? value : null)
  if (!ready) return <span className={className}>—</span>
  return <span className={className}>{count}</span>
}

function formatRelativeTime(value) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return '—'
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (minutes < 60) return `${minutes || 1} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

/** Patient-list filters that back the risk-mix segments. */
const RISK_FILTER_MAP = {
  'Normal Risk': 'search=low+risk',
  Prediabetes: 'search=prediabetes',
  Diabetes: 'search=diabetes',
}

const QUEUE_RISK_STYLE = {
  high: { backgroundColor: '#ffe4e8', color: '#be123c', border: '1px solid #fecdd3' },
  medium: { backgroundColor: '#fff3d6', color: '#b45309', border: '1px solid #fde68a' },
  low: { backgroundColor: '#dff8ed', color: '#047857', border: '1px solid #a7f3d0' },
}

const QUEUE_STATUS_STYLE = {
  unreviewed: QUEUE_RISK_STYLE.high,
  pending: QUEUE_RISK_STYLE.medium,
  onTrack: QUEUE_RISK_STYLE.low,
}

/* ------------------------------------------------------------------ */
/*  Date-range presets + custom window helpers                          */
/* ------------------------------------------------------------------ */
const DATE_RANGE_CONFIG = [
  { key: '7', labelKey: 'dashboard.ranges.last7Days', fallback: 'Last 7 Days', days: 7, icon: CalendarDays },
  { key: '30', labelKey: 'dashboard.ranges.last30Days', fallback: 'Last 30 Days', days: 30, icon: CalendarRange },
  { key: '365', labelKey: 'dashboard.ranges.thisYear', fallback: 'This Year', days: 365, icon: CalendarClock },
  { key: 'all', labelKey: 'dashboard.ranges.allTime', fallback: 'All Time', days: null, icon: History },
]

const CUSTOM_RANGE_KEY = 'custom'

/** Shortcuts offered inside the custom-range popover. */
const CUSTOM_RANGE_QUICK_SPANS = [
  { key: '7', days: 7, labelKey: 'dashboard.ranges.last7Days', fallback: 'Last 7 Days' },
  { key: '30', days: 30, labelKey: 'dashboard.ranges.last30Days', fallback: 'Last 30 Days' },
  { key: '365', days: 365, labelKey: 'dashboard.ranges.thisYear', fallback: 'This Year' },
]

/** Today on the clinic clock (Cambodia) as ``YYYY-MM-DD``. */
function getTodayIsoDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CAMBODIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Shifts a ``YYYY-MM-DD`` string by whole days without timezone drift. */
function shiftIsoDate(isoDate, days) {
  const [year, month, day] = String(isoDate || '').split('-').map(Number)
  if (!year || !month || !day) return isoDate
  const shifted = new Date(Date.UTC(year, month - 1, day))
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted.toISOString().slice(0, 10)
}

/** Human label for one ``YYYY-MM-DD`` boundary in the active language. */
function formatRangeBoundary(isoDate, language) {
  const [year, month, day] = String(isoDate || '').split('-').map(Number)
  if (!year || !month || !day) return ''
  return new Intl.DateTimeFormat(getLocaleForLanguage(language), {
    timeZone: CAMBODIA_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

/* ------------------------------------------------------------------ */
/*  Doctor workload strip                                               */
/* ------------------------------------------------------------------ */
const WORKLOAD_TILE_STYLES = {
  pending: {
    tile: 'border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-white hover:border-amber-300 dark:border-amber-900/40 dark:from-amber-950/25 dark:via-[#070712] dark:to-[#070712]',
    iconClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    value: 'text-amber-700 dark:text-amber-300',
  },
  urgent: {
    tile: 'border-rose-200/70 bg-gradient-to-br from-rose-50 via-white to-white hover:border-rose-300 dark:border-rose-900/40 dark:from-rose-950/25 dark:via-[#070712] dark:to-[#070712]',
    iconClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    value: 'text-rose-700 dark:text-rose-300',
  },
  reviewed: {
    tile: 'border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-white hover:border-emerald-300 dark:border-emerald-900/40 dark:from-emerald-950/25 dark:via-[#070712] dark:to-[#070712]',
    iconClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    value: 'text-emerald-700 dark:text-emerald-300',
  },
  assessed: {
    tile: 'border-primary-200/70 bg-gradient-to-br from-primary-50 via-white to-white hover:border-primary-300 dark:border-primary-500/30 dark:from-primary-950/25 dark:via-[#070712] dark:to-[#070712]',
    iconClass: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
    value: 'text-primary-700 dark:text-primary-300',
  },
}

/** Exported so the workload tiles can be smoke-rendered in isolation. */
export function DoctorWorkloadStrip({ workload, ready, rangeLabel, t }) {
  const tiles = useMemo(() => {
    if (!workload) return []
    return [
      {
        key: 'pending',
        count: workload.pending_reviews,
        href: '/review',
        icon: ClipboardCheck,
        label: t('dashboard.workload.pending', 'Awaiting sign-off'),
        hint: t('dashboard.workload.pendingHint', 'Un-reviewed assessments in this window'),
      },
      {
        key: 'urgent',
        count: workload.urgent_pending,
        href: '/review',
        icon: AlertTriangle,
        pulse: true,
        label: t('dashboard.workload.urgent', 'Urgent awaiting sign-off'),
        hint: t('dashboard.workload.urgentHint', 'High-risk cases still waiting on you'),
      },
      {
        key: 'reviewed',
        count: workload.reviewed_by_me,
        href: '/review',
        icon: BadgeCheck,
        label: t('dashboard.workload.reviewedByMe', 'Signed off by you'),
        hint: t('dashboard.workload.reviewedByMeHint', 'Reviews you completed in this window'),
      },
      {
        key: 'assessed',
        count: workload.assessed_by_me,
        href: '/patients',
        icon: Stethoscope,
        label: t('dashboard.workload.assessedByMe', 'Assessed by you'),
        hint: t('dashboard.workload.assessedByMeHint', 'Assessments you created in this window'),
      },
    ]
  }, [t, workload])

  if (!workload) return null

  const share = Math.max(0, Math.min(100, Number(workload.signoff_share) || 0))

  return (
    <section className="dash-fade-up surface relative overflow-hidden p-0">
      <div className="dash-orb-drift-alt pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-emerald-100/50 blur-3xl dark:bg-emerald-900/10" aria-hidden />
      <div className="relative flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/25">
              <Stethoscope className="h-4.5 w-4.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('dashboard.workload.title', 'Your workload')}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t('dashboard.workload.desc', 'Cases that need your attention in {{range}}.', { range: rangeLabel })}
              </p>
            </div>
          </div>
          <span className="badge border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-900/20 dark:text-primary-300">
            {rangeLabel}
          </span>
        </div>

        <div className="dash-stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((tile) => {
            const Icon = tile.icon
            const style = WORKLOAD_TILE_STYLES[tile.key]
            return (
              <Link
                key={tile.key}
                to={tile.href}
                className={`dash-workload-tile dash-fade-up group flex min-w-0 flex-col rounded-2xl border p-4 ${style.tile} ${ready ? '' : 'opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.iconClass} ${tile.pulse ? 'dash-pulse-ring' : ''}`}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden />
                </div>
                <p className={`mt-3 text-2xl font-bold tabular-nums ${style.value}`}>
                  <AnimatedNumber value={tile.count} ready={ready} />
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">{tile.label}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{tile.hint}</p>
              </Link>
            )
          })}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1b2342] dark:bg-[#0c1024]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('dashboard.workload.signoff', 'Sign-off progress')}
              </span>
            </div>
            <span className="text-sm font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
              {ready ? `${share}%` : '—'}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#1b2342]">
            <div
              className="dash-shimmer relative h-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
              style={{ width: ready ? `${share}%` : '0%' }}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              {t('dashboard.workload.signoffValue', "{{percent}}% of this window's queue closed", { percent: share })}
            </span>
            <Link
              to="/review"
              className="inline-flex items-center gap-1 font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200"
            >
              {t('dashboard.workload.openQueue', 'Open review queue')}
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Custom range popover                                                */
/* ------------------------------------------------------------------ */
function CustomRangePopover({ isActive, value, onApply, onReset, triggerRef, t }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const [today, setToday] = useState(getTodayIsoDate)

  // Re-seed the draft each time the panel opens so cancelled edits are dropped.
  useEffect(() => {
    if (open) {
      setDraft(value)
      setToday(getTodayIsoDate())
    }
  }, [open, value])

  const invalid = Boolean(draft.start && draft.end && draft.start > draft.end)
  const canApply = Boolean(draft.start && draft.end) && !invalid

  const handleReset = () => {
    onReset()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={triggerRef}
        type="button"
        aria-pressed={isActive}
        className={`relative z-10 inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
      >
        <CalendarRange className="h-3.5 w-3.5" aria-hidden />
        {t('dashboard.toolbar.custom', 'Custom')}
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(92vw,23rem)] overflow-hidden p-0">
        <div className="dash-panel-in">
          <header className="flex items-start gap-3 border-b border-slate-200 px-4 py-3 dark:border-[#1b2342]">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md shadow-primary-500/25">
              <CalendarRange className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('dashboard.toolbar.customTitle', 'Custom reporting window')}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t('dashboard.toolbar.customDesc', 'Pick a start and end date — the end date is included.')}
              </p>
            </div>
          </header>

          <div className="space-y-3 px-4 py-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label-text">{t('dashboard.toolbar.from', 'From')}</span>
                <input
                  type="date"
                  value={draft.start}
                  max={draft.end || today}
                  onChange={(event) => setDraft((prev) => ({ ...prev, start: event.target.value }))}
                  className="input-base min-h-10 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="label-text">{t('dashboard.toolbar.to', 'To')}</span>
                <input
                  type="date"
                  value={draft.end}
                  min={draft.start || undefined}
                  max={today}
                  onChange={(event) => setDraft((prev) => ({ ...prev, end: event.target.value }))}
                  className="input-base min-h-10 py-2 text-sm"
                />
              </label>
            </div>

            {invalid ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('dashboard.toolbar.invalidRange', 'The end date must be on or after the start date.')}
              </p>
            ) : null}

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t('dashboard.toolbar.quickSpans', 'Quick spans')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CUSTOM_RANGE_QUICK_SPANS.map((span) => (
                  <button
                    key={span.key}
                    type="button"
                    onClick={() => setDraft({ start: shiftIsoDate(today, -(span.days - 1)), end: today })}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-[#1b2342] dark:bg-[#0c1024] dark:text-slate-300 dark:hover:border-primary-500/40 dark:hover:bg-primary-900/20 dark:hover:text-primary-300"
                  >
                    {t(span.labelKey, span.fallback)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-[#1b2342] dark:bg-[#0c1024]">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            >
              {t('dashboard.toolbar.reset', 'Reset')}
            </button>
            <button
              type="button"
              onClick={() => onApply(draft)}
              disabled={!canApply}
              className="btn-primary min-h-9 gap-1.5 px-3 py-1.5 text-xs"
            >
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              {t('dashboard.toolbar.apply', 'Apply')}
            </button>
          </footer>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function ClinicalDashboard({ activeRole }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canViewTreatmentPlans = user?.permissions?.includes('treatment_plan.view')
  const { language, t, tExact } = useLanguage()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState('all') // preset key or 'custom'
  const [customRange, setCustomRange] = useState({ start: '', end: '' })
  const [priorityFilter, setPriorityFilter] = useState('all')

  const dateRanges = useMemo(
    () =>
      DATE_RANGE_CONFIG.map((r) => ({
        key: r.key,
        label: t(r.labelKey, r.fallback),
        days: r.days,
        icon: r.icon,
      })),
    [t]
  )

  const isCustomRange = selectedRange === CUSTOM_RANGE_KEY
  const customRangeValid = Boolean(customRange.start && customRange.end && customRange.start <= customRange.end)

  /** Query parameters sent to ``GET /dashboard/clinical`` for the selection. */
  const rangeQuery = useMemo(() => {
    if (isCustomRange) {
      return customRangeValid ? { start: customRange.start, end: customRange.end } : {}
    }
    const preset = DATE_RANGE_CONFIG.find((r) => r.key === selectedRange)
    return preset?.days ? { days: preset.days } : {}
  }, [customRange.end, customRange.start, customRangeValid, isCustomRange, selectedRange])

  const activeRangeLabel = useMemo(() => {
    if (isCustomRange) {
      if (!customRangeValid) return t('dashboard.toolbar.custom', 'Custom')
      return `${formatRangeBoundary(customRange.start, language)} – ${formatRangeBoundary(customRange.end, language)}`
    }
    return dateRanges.find((r) => r.key === selectedRange)?.label || t('dashboard.kpi.allTime', 'All Time')
  }, [customRange.end, customRange.start, customRangeValid, dateRanges, isCustomRange, language, selectedRange, t])

  /* -- Sliding highlight that glides under the active range preset ----- */
  const presetBarRef = useRef(null)
  const presetButtonRefs = useRef(new Map())
  const [presetIndicator, setPresetIndicator] = useState({ left: 0, width: 0, ready: false })

  const syncPresetIndicator = useCallback(() => {
    const button = presetButtonRefs.current.get(selectedRange)
    if (!button) {
      setPresetIndicator((prev) => (prev.ready ? { ...prev, ready: false } : prev))
      return
    }
    setPresetIndicator({ left: button.offsetLeft, width: button.offsetWidth, ready: true })
  }, [selectedRange])

  /** Stable per-button ref callbacks so React does not re-attach them each render. */
  const presetButtonRefCallbacks = useMemo(() => {
    const register = (key) => (node) => {
      if (node) presetButtonRefs.current.set(key, node)
      else presetButtonRefs.current.delete(key)
    }
    const callbacks = new Map()
    DATE_RANGE_CONFIG.forEach((range) => callbacks.set(range.key, register(range.key)))
    callbacks.set(CUSTOM_RANGE_KEY, register(CUSTOM_RANGE_KEY))
    return callbacks
  }, [])

  useLayoutEffect(() => {
    syncPresetIndicator()
  }, [dateRanges, language, syncPresetIndicator])

  useEffect(() => {
    const bar = presetBarRef.current
    if (!bar || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(() => syncPresetIndicator())
    observer.observe(bar)
    presetButtonRefs.current.forEach((node) => node && observer.observe(node))
    return () => observer.disconnect()
  }, [dateRanges, syncPresetIndicator])

  const selectRange = useCallback((key) => setSelectedRange(key), [])

  const applyCustomRange = useCallback((next) => {
    if (!next?.start || !next?.end || next.start > next.end) return
    setCustomRange({ start: next.start, end: next.end })
    setSelectedRange(CUSTOM_RANGE_KEY)
  }, [])

  const resetRange = useCallback(() => {
    setSelectedRange('all')
    setCustomRange({ start: '', end: '' })
  }, [])

  const roleLabel = useMemo(
    () => t(`roles.${activeRole || 'user'}`, String(activeRole || 'user').replace(/_/g, ' ')),
    [activeRole, t]
  )

  const clinicianName = (user?.name || '').trim()
  const greetingText = t(`dashboard.hero.${getGreetingKey()}`, 'Good morning')

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'km' ? 'km-KH' : 'en-US', {
        timeZone: CAMBODIA_TIME_ZONE,
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(new Date()),
    [language]
  )

  const areaChartConfig = useMemo(
    () => ({
      diagnosed: { label: t('dashboard.charts.diagnosed', 'Total Diagnosed'), color: '#2563eb' },
      pending: { label: t('dashboard.charts.pending', 'Pending Review'), color: '#f59e0b' },
      reviewed: { label: t('dashboard.charts.reviewed', 'Reviewed'), color: '#10b981' },
    }),
    [t]
  )

  const fetchStats = useCallback(async (query = {}) => {
    try {
      setLoading(true)
      const response = await api.get('/dashboard/clinical', { params: query })
      const data = getApiData(response)
      setStats(data)
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
      notify.error(t('dashboard.errorLoad', 'Could not load dashboard statistics.'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchStats(rangeQuery)
  }, [fetchStats, rangeQuery])

  const riskClassificationData = useMemo(() => {
    const raw = stats?.risk_classification || []
    return raw.map((entry) => {
      let displayName = entry.name
      if (entry.name === 'Normal Risk') {
        displayName = t('dashboard.charts.normalRisk', 'Normal Risk')
      } else if (entry.name === 'Prediabetes') {
        displayName = t('dashboard.charts.prediabetes', 'Prediabetes')
      } else if (entry.name === 'Diabetes') {
        displayName = t('dashboard.charts.diabetes', 'Diabetes')
      } else if (entry.name === 'No Data') {
        displayName = t('dashboard.charts.noData', 'No Data')
      }
      return {
        ...entry,
        rawName: entry.name,
        name: displayName,
      }
    })
  }, [stats?.risk_classification, t])

  const monthlyTrendData = stats?.monthly_trend?.length ? stats.monthly_trend : null

  const patientMetrics = useMemo(() => {
    if (!stats) return []
    return [
      {
        key: 'urgent',
        label: t('dashboard.focus.urgentPatients', 'Urgent patients'),
        helper: t('dashboard.focus.urgentPatientsHint', 'Awaiting review'),
        action: t('dashboard.focus.reviewNow', 'Review now'),
        value: stats.doctor_workload?.urgent_pending ?? stats.urgent_cases.value,
        icon: HeartPulse,
        href: '/review',
        tone: 'rose',
      },
      {
        key: 'pending',
        label: t('dashboard.focus.needsReview', 'Needs review'),
        helper: t('dashboard.focus.needsReviewHint', 'Awaiting your attention'),
        action: t('dashboard.focus.openQueue', 'Open queue'),
        value: stats.doctor_workload?.pending_reviews ?? 0,
        icon: Clock3,
        href: '/review',
        tone: 'amber',
      },
      {
        key: 'plans',
        label: t('dashboard.focus.carePlans', 'Care plans'),
        helper: t('dashboard.focus.carePlansHint', 'Recommendations issued'),
        action: t('dashboard.focus.viewPlans', 'View plans'),
        value: stats.treatment_plans.value,
        icon: Pill,
        href: '/treatment-plans',
        tone: 'emerald',
      },
      {
        key: 'patients',
        label: t('dashboard.focus.totalPatients', 'Total patients'),
        helper: t('dashboard.focus.totalPatientsHint', 'In your clinic'),
        action: t('dashboard.focus.viewPatients', 'View patients'),
        value: stats.active_patients.value,
        icon: Users,
        href: '/patients',
        tone: 'blue',
      },
    ].filter((metric) => metric.key !== 'plans' || canViewTreatmentPlans)
  }, [canViewTreatmentPlans, stats, t])

  const priorityCases = useMemo(() => {
    const cases = [...(stats?.recent_cases || [])]
    return cases
      .sort((a, b) => {
        const priority = (item) => (item.is_urgent ? 0 : item.status === 'Pending' ? 1 : 2)
        return priority(a) - priority(b) || new Date(b.created_at) - new Date(a.created_at)
      })
      .slice(0, 6)
  }, [stats?.recent_cases])

  const visiblePriorityCases = useMemo(() => {
    if (priorityFilter === 'urgent') return priorityCases.filter((item) => item.is_urgent)
    if (priorityFilter === 'review') return priorityCases.filter((item) => item.status !== 'Reviewed')
    if (priorityFilter === 'plans') return priorityCases.filter((item) => item.has_care_plan)
    return priorityCases
  }, [priorityCases, priorityFilter])

  const throughputSummary = useMemo(() => {
    if (!monthlyTrendData?.length) return null
    const totalDiagnosed = monthlyTrendData.reduce((acc, curr) => acc + (curr.diagnosed || 0), 0)
    const totalPending = monthlyTrendData.reduce((acc, curr) => acc + (curr.pending || 0), 0)
    const totalReviewed = monthlyTrendData.reduce((acc, curr) => acc + (curr.reviewed || 0), 0)
    return { totalDiagnosed, totalPending, totalReviewed }
  }, [monthlyTrendData])

  /* -- Clinical snapshot (hero) derived values ------------------------- */
  const heroStatsReady = Boolean(stats)

  /** Patient risk mix for the snapshot strip — proportions are taken from the
   *  raw counts so the segmented bar never leaves a rounding gap. */
  const riskSummary = useMemo(() => {
    if (!stats?.risk_classification) return { total: 0, rows: [] }
    const classified = riskClassificationData.filter((entry) => (entry.rawName || entry.name) !== 'No Data')
    const total = classified.reduce((acc, entry) => acc + (Number(entry.value) || 0), 0)
    if (total === 0) return { total: 0, rows: [] }

    const source = new Map(classified.map((entry) => [entry.rawName || entry.name, Number(entry.value) || 0]))
    const categories = [
      { key: 'Diabetes', label: t('dashboard.focus.highRisk', 'High risk'), value: source.get('Diabetes') || 0, fill: '#f05d6c' },
      { key: 'Prediabetes', label: t('dashboard.focus.mediumRisk', 'Medium risk'), value: source.get('Prediabetes') || 0, fill: '#f5a63a' },
      { key: 'Normal Risk', label: t('dashboard.focus.lowRisk', 'Low risk'), value: source.get('Normal Risk') || 0, fill: '#32b79a' },
      { key: 'Stable', label: t('dashboard.focus.stable', 'Stable'), value: 0, fill: '#4388e8' },
    ]

    return {
      total,
      rows: categories.map((entry) => ({
        ...entry,
        percent: Math.round((entry.value / total) * 100),
      })),
    }
  }, [stats?.risk_classification, riskClassificationData, t])

  const goToRiskFilter = useCallback(
    (rawName) => {
      if (!rawName || rawName === 'No Data') return
      const query = RISK_FILTER_MAP[rawName]
      navigate(`/patients?has_diagnosis=true${query ? `&${query}` : ''}`)
    },
    [navigate]
  )

  const rulesAnalytics = stats?.rules_analytics || null
  const topTriggeredRules = rulesAnalytics?.top_triggered_rules || []
  const maxRuleHits = Math.max(1, ...topTriggeredRules.map((rule) => Number(rule.hits) || 0))
  const recentActivity = (stats?.recent_cases || []).slice(0, 5).map((item) => ({
    ...item,
    title: item.is_urgent
      ? t('dashboard.focus.activityHighRisk', 'Patient marked high risk')
      : item.has_care_plan
        ? t('dashboard.focus.activityPlan', 'Treatment plan updated')
        : item.status === 'Reviewed'
          ? t('dashboard.focus.activityCompleted', 'Assessment completed')
          : t('dashboard.focus.activityNew', 'New assessment completed'),
  }))

  return (
    <div className="w-full space-y-6">
      {/* ── Patient-first command header ────────────────────────── */}
      <section className="clinical-hero dash-fade-up relative overflow-hidden rounded-[1.5rem] border border-primary-100 bg-primary-50 text-slate-900 shadow-soft dark:border-primary-500/25 dark:bg-[#0b2944] dark:text-white">
        <div className="clinical-hero-image pointer-events-none absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/banner2.png')" }} aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/75 via-white/30 to-transparent dark:from-slate-950/55 dark:via-slate-950/15 dark:to-transparent" aria-hidden />
        <div className="dash-aurora absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-cyan-400 to-sky-400" aria-hidden />

        <div className="relative grid gap-7 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <UserAvatar name={clinicianName || roleLabel} size="lg" status="online" className="ring-4 ring-white/80 dark:ring-white/10" />
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-cyan-200">
                  <span className="dash-live-dot h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                  {greetingText}, {clinicianName || roleLabel} <span aria-hidden>👋</span>
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  {todayLabel}
                </p>
              </div>
            </div>

            <h1 className="mt-6 max-w-2xl text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {t('dashboard.focus.heroTitle', 'Patient care, clearly prioritized.')}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              {heroStatsReady
                ? t('dashboard.focus.heroDesc', '{{patients}} patients in your clinic. {{pending}} cases need review in {{range}}.', {
                    patients: stats.active_patients.value,
                    pending: stats.doctor_workload?.pending_reviews ?? 0,
                    range: activeRangeLabel,
                  })
                : t('dashboard.hero.loading', 'Loading patient statistics…')}
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link to="/review" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition hover:-translate-y-0.5 hover:bg-primary-700 active:translate-y-0">
                <ClipboardCheck className="h-4 w-4" aria-hidden />
                {t('dashboard.focus.reviewQueue', 'Review patient queue')}
              </Link>
              <Link to="/patients" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white/85 px-4 text-sm font-semibold text-primary-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white active:translate-y-0 dark:border-primary-400/30 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                <Search className="h-4 w-4" aria-hidden />
                {t('dashboard.focus.findPatient', 'Find patient')}
              </Link>
              <Link to="/rules" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary-200/80 bg-primary-100/70 px-4 text-sm font-semibold text-primary-700 transition hover:-translate-y-0.5 hover:bg-primary-100 active:translate-y-0 dark:border-cyan-300/20 dark:bg-cyan-200/10 dark:text-cyan-100 dark:hover:bg-cyan-200/20">
                <BookOpen className="h-4 w-4" aria-hidden />
                {t('dashboard.focus.knowledgeBase', 'Knowledge Base')}
              </Link>
            </div>
          </div>

          <div className="dash-fade-up rounded-3xl border border-white/80 bg-white/65 p-4 shadow-lg shadow-primary-900/5 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.08] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-700 dark:text-cyan-200">
                  {t('dashboard.focus.todaySnapshot', "Today's patient snapshot")}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{activeRangeLabel}</p>
              </div>
              <HeartPulse className="h-5 w-5 text-primary-500 dark:text-cyan-300" aria-hidden />
            </div>
            <div className="grid grid-cols-3 divide-x divide-primary-100 dark:divide-white/10">
              <div className="px-2 text-center first:pl-0 last:pr-0">
                <span className="mx-auto mb-2 block h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/40" aria-hidden />
                <p className="text-2xl font-bold text-slate-950 tabular-nums dark:text-white"><AnimatedNumber value={stats?.doctor_workload?.urgent_pending ?? stats?.urgent_cases?.value ?? 0} ready={heroStatsReady} /></p>
                <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-300">{t('dashboard.focus.urgent', 'Urgent')}</p>
              </div>
              <div className="px-2 text-center">
                <span className="mx-auto mb-2 block h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/40" aria-hidden />
                <p className="text-2xl font-bold text-slate-950 tabular-nums dark:text-white"><AnimatedNumber value={stats?.doctor_workload?.pending_reviews ?? 0} ready={heroStatsReady} /></p>
                <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-300">{t('dashboard.focus.needReview', 'Need review')}</p>
              </div>
              <div className="px-2 text-center first:pl-0 last:pr-0">
                <span className="mx-auto mb-2 block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" aria-hidden />
                <p className="text-2xl font-bold text-slate-950 tabular-nums dark:text-white"><AnimatedNumber value={stats?.treatment_plans?.value ?? 0} ready={heroStatsReady} /></p>
                <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-300">{t('dashboard.focus.carePlans', 'Care plans')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Doctor range bar: presets, custom window, live summary ── */}
      <section className="dash-fade-up relative overflow-visible">
        <div className="hidden dash-aurora pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500 via-sky-400 to-primary-500" aria-hidden />
        <div className="hidden dash-orb-drift pointer-events-none absolute -right-14 -top-20 h-44 w-44 rounded-full bg-primary-100/60 blur-3xl dark:bg-primary-900/20" aria-hidden />

        <div className="hidden relative flex flex-col gap-4 p-4 sm:p-5" style={{ display: 'none' }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/30">
                <span className="dash-range-halo pointer-events-none absolute inset-0 bg-primary-300/60 blur-md" aria-hidden />
                <CalendarRange className="relative h-4.5 w-4.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t('dashboard.toolbar.dateRange', 'Date Range')}
                </h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                    <span className="dash-live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    {activeRangeLabel}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600" aria-hidden>•</span>
                  <span>
                    {t('dashboard.toolbar.windowSummary', '{{assessments}} assessments · {{plans}} plans', {
                      assessments: stats?.assessments?.value ?? 0,
                      plans: stats?.treatment_plans?.value ?? 0,
                    })}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isCustomRange ? (
                <button
                  type="button"
                  onClick={resetRange}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-[#1b2342] dark:bg-[#0c1024] dark:text-slate-300 dark:hover:bg-[#131a33]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  {t('dashboard.toolbar.resetRange', 'Reset range')}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => fetchStats(rangeQuery)}
                disabled={loading}
                title={t('dashboard.toolbar.refresh', 'Refresh')}
                aria-label={t('dashboard.toolbar.refresh', 'Refresh')}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50 dark:border-[#1b2342] dark:bg-[#0c1024] dark:text-slate-300 dark:hover:border-primary-500/40 dark:hover:bg-primary-900/20 dark:hover:text-primary-300"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden />
                <span className="hidden sm:inline">{t('dashboard.toolbar.refresh', 'Refresh')}</span>
              </button>
            </div>
          </div>

          <div
            ref={presetBarRef}
            role="group"
            aria-label={t('dashboard.toolbar.dateRange', 'Date Range')}
            className="relative flex min-w-0 items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-100/70 p-1 dark:border-[#1b2342] dark:bg-[#0c1024]/80"
          >
            <span
              className="dash-range-glide"
              style={{
                transform: `translateX(${presetIndicator.left}px)`,
                width: presetIndicator.width,
                opacity: presetIndicator.ready ? 1 : 0,
              }}
              aria-hidden
            />
            {dateRanges.map((range) => {
              const Icon = range.icon
              const active = selectedRange === range.key
              return (
                <button
                  key={range.key}
                  ref={presetButtonRefCallbacks.get(range.key)}
                  type="button"
                  onClick={() => selectRange(range.key)}
                  aria-pressed={active}
                  className={`relative z-10 inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${active ? 'text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {range.label}
                </button>
              )
            })}

            <CustomRangePopover
              isActive={isCustomRange}
              value={customRange}
              onApply={applyCustomRange}
              onReset={resetRange}
              triggerRef={presetButtonRefCallbacks.get(CUSTOM_RANGE_KEY)}
              t={t}
            />
          </div>
        </div>

        {!loading ? (
          <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
            <div className="surface dash-stagger grid items-start gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
              {patientMetrics.map((metric) => {
                const Icon = metric.icon
                return (
                  <Link
                    key={metric.key}
                    to={metric.href}
                    className={`clinical-stat clinical-stat--${metric.tone} dash-fade-up group flex h-[9rem] min-h-0 flex-col rounded-2xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#080c1c]`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="clinical-stat__icon inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <p className="text-2xl font-bold tracking-tight text-slate-950 tabular-nums dark:text-white"><AnimatedNumber value={metric.value} /></p>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{metric.label}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{metric.helper}</p>
                    <span className="clinical-stat__action mt-auto inline-flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold transition duration-200 group-hover:brightness-[0.98]">{metric.action}<ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden /></span>
                  </Link>
                )
              })}
            </div>

            <aside className="clinical-activity surface px-4 py-4 sm:px-5 dark:border-[#1b2342]">
              <Link to="/review" className="mb-3 flex min-h-9 items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/30">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{t('dashboard.focus.highRiskSinceYesterday', '2 patients became high-risk since yesterday')}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300"><Activity className="h-4 w-4" aria-hidden /></span>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t('dashboard.focus.recentActivity', 'Recent Activity')}</h2>
                </div>
                <Link to="/review" className="text-[11px] font-semibold text-primary-600 hover:underline dark:text-primary-300">{t('dashboard.focus.viewAll', 'View all')} <ArrowRight className="inline h-3 w-3" aria-hidden /></Link>
              </div>
              <div className="mt-3 divide-y divide-slate-100 dark:divide-[#1b2342]">
                {recentActivity.length ? recentActivity.map((item) => (
                  <Link key={item.id} to={`/diagnosis/result?diagnosis_result_id=${item.id}`} className="flex items-center gap-2.5 py-2 transition hover:bg-primary-50/50 dark:hover:bg-primary-900/10">
                    <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.is_urgent ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/25 dark:text-rose-300' : item.has_care_plan ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300' : 'bg-primary-50 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300'}`}><CircleCheckBig className="h-3.5 w-3.5" aria-hidden /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{item.title}</span><span className="block truncate text-[11px] text-slate-400">{item.patient_name}</span></span>
                    <span className="shrink-0 text-[10px] text-slate-400">{formatRelativeTime(item.created_at)}</span>
                  </Link>
                )) : <p className="py-5 text-xs text-slate-500">{t('dashboard.focus.noRecentActivity', 'No recent activity')}</p>}
              </div>
            </aside>
          </div>
        ) : null}
      </section>

      {/* ── Main content ───────────────────────────────────────── */}
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
            {/* Priority patient queue */}
            <section className="dash-fade-up clinical-queue clinical-queue--elevated surface h-full min-w-0 overflow-hidden p-0">
              <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 dark:border-[#1b2342] sm:px-6 sm:py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300">
                      <Users className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        {t('dashboard.focus.priorityQueue', 'Patient Priority Queue')}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {t('dashboard.focus.priorityQueueDesc', 'Patients who need your attention first.')}
                      </p>
                    </div>
                  </div>
                  <div className="clinical-queue__filters flex w-full items-center gap-1 overflow-x-auto rounded-full bg-slate-100/80 p-1 lg:w-auto" role="tablist" aria-label={t('dashboard.focus.priorityQueue', 'Patient Priority Queue')}>
                    {[
                      ['all', t('dashboard.focus.filterAll', 'All')],
                      ['urgent', t('dashboard.focus.filterUrgent', 'Urgent')],
                      ['review', t('dashboard.focus.filterReview', 'Need Review')],
                      ['plans', t('dashboard.focus.filterPlans', 'Care Plans')],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={priorityFilter === key}
                        onClick={() => setPriorityFilter(key)}
                        className={`min-h-9 shrink-0 rounded-full px-3.5 text-xs font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${priorityFilter === key ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-primary-700 dark:text-slate-300 dark:hover:bg-[#18203b] dark:hover:text-primary-300'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </header>

              <div className="hidden overflow-hidden md:block">
                <table className="clinical-queue__table w-full table-fixed text-left">
                  <thead className="bg-primary-50/45 dark:bg-primary-900/10">
                    <tr className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                      <th className="w-[23%] px-3 py-3.5">{t('dashboard.focus.patient', 'Patient')}</th>
                      <th className="w-[13%] px-2 py-3.5">{t('dashboard.focus.riskLevel', 'Risk Level')}</th>
                      <th className="w-[21%] px-2 py-3.5">{t('dashboard.focus.latestFinding', 'Latest Finding')}</th>
                      <th className="w-[14%] px-2 py-3.5">{t('dashboard.focus.lastAssessment', 'Last Assessment')}</th>
                      <th className="w-[17%] px-2 py-3.5">{t('dashboard.focus.status', 'Status')}</th>
                      <th className="w-[12%] px-2 py-3.5">{t('dashboard.focus.action', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1b2342]">
                    {visiblePriorityCases.map((caseItem) => {
                      const risk = caseItem.is_urgent ? 'high' : /diabetes|high|elevated/i.test(String(caseItem.diagnosis || '')) ? 'medium' : 'low'
                      const status = caseItem.status === 'Reviewed' ? 'onTrack' : caseItem.is_urgent ? 'unreviewed' : 'pending'
                      return (
                        <tr key={caseItem.id} className="group transition-colors duration-150 hover:bg-primary-50/45 dark:hover:bg-primary-900/10">
                          <td className="px-3 py-4"><div className="flex min-w-0 items-center gap-2.5"><UserAvatar name={caseItem.patient_name} size="sm" /><div className="min-w-0"><p className="truncate font-semibold text-slate-900 dark:text-white">{caseItem.patient_name}</p><p className="mt-0.5 text-xs text-slate-400">#P{String(caseItem.id).padStart(5, '0')}</p></div></div></td>
                          <td className="px-3 py-4"><span className={`clinical-queue__badge clinical-queue__badge--${risk}`} style={QUEUE_RISK_STYLE[risk]}><span className="h-1.5 w-1.5 rounded-full bg-current" />{risk === 'high' ? 'High' : risk === 'medium' ? 'Medium' : 'Low'}</span></td>
                          <td className="px-2 py-4"><p className="truncate font-medium text-slate-700 dark:text-slate-200">{tExact(caseItem.diagnosis)}</p><p className="mt-0.5 truncate text-xs text-slate-400">{caseItem.recommendation || (Number.isFinite(Number(caseItem.certainty)) ? `${Math.round(Number(caseItem.certainty) * 100)}% certainty` : 'Clinical finding')}</p></td>
                          <td className="whitespace-nowrap px-2 py-4 text-sm text-slate-500 dark:text-slate-400">{formatRelativeTime(caseItem.created_at)}</td>
                          <td className="px-2 py-4"><span className={`clinical-queue__status clinical-queue__status--${status}`} style={QUEUE_STATUS_STYLE[status]}>{status === 'onTrack' ? 'On track' : status === 'unreviewed' ? 'Unreviewed' : 'Pending'}</span></td>
                          <td className="px-2 py-4"><Link to={`/diagnosis/result?diagnosis_result_id=${caseItem.id}`} className="clinical-queue__review">Review <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden dark:divide-[#1b2342]">
                {visiblePriorityCases.map((caseItem) => {
                  const risk = caseItem.is_urgent ? 'high' : /diabetes|high|elevated/i.test(String(caseItem.diagnosis || '')) ? 'medium' : 'low'
                  const status = caseItem.status === 'Reviewed' ? 'onTrack' : caseItem.is_urgent ? 'unreviewed' : 'pending'
                  return <article key={caseItem.id} className="space-y-3 p-4 transition hover:bg-primary-50/45"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><UserAvatar name={caseItem.patient_name} size="sm" /><div><p className="font-semibold text-slate-900 dark:text-white">{caseItem.patient_name}</p><p className="text-xs text-slate-400">#P{String(caseItem.id).padStart(5, '0')}</p></div></div><span className={`clinical-queue__badge clinical-queue__badge--${risk}`} style={QUEUE_RISK_STYLE[risk]}>{risk === 'high' ? 'High' : risk === 'medium' ? 'Medium' : 'Low'}</span></div><div><p className="font-medium text-slate-700 dark:text-slate-200">{tExact(caseItem.diagnosis)}</p><p className="mt-1 text-xs text-slate-500">{caseItem.recommendation || 'Clinical finding'} · Last assessment: {formatRelativeTime(caseItem.created_at)}</p></div><div className="flex items-center justify-between gap-3"><span className={`clinical-queue__status clinical-queue__status--${status}`} style={QUEUE_STATUS_STYLE[status]}>{status === 'onTrack' ? 'On track' : status === 'unreviewed' ? 'Unreviewed' : 'Pending'}</span><Link to={`/diagnosis/result?diagnosis_result_id=${caseItem.id}`} className="clinical-queue__review">Review <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link></div></article>
                })}
              </div>

              {!visiblePriorityCases.length ? <div className="px-6 py-12 text-center"><CircleCheckBig className="mx-auto h-8 w-8 text-emerald-500" aria-hidden /><p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{t('dashboard.focus.queueClear', 'The queue is clear')}</p><p className="mt-1 text-xs text-slate-500">{t('dashboard.recent.noDiagnoses', 'No diagnoses found for this period.')}</p></div> : null}
              <footer className="flex justify-end border-t border-slate-100 px-5 py-4 dark:border-[#1b2342] sm:px-6"><Link to="/review" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 transition hover:text-primary-800 hover:underline dark:text-primary-300 dark:hover:text-primary-200">{t('dashboard.focus.openFullQueue', 'View full patient queue')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></Link></footer>
            </section>

            {/* Patient risk mix */}
            <section className="dash-fade-up surface h-full min-w-0 p-5 sm:p-6">
              <header className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300">
                  <HeartPulse className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    {t('dashboard.hero.riskMix', 'Patient Risk Mix')}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {t('dashboard.focus.currentPopulation', 'Current patient population')}
                  </p>
                </div>
              </header>

              {riskSummary.total > 0 ? (
                <div className="mt-5 grid items-center gap-5 sm:grid-cols-[minmax(10rem,0.9fr)_minmax(11rem,1.1fr)]">
                  <div className="relative mx-auto h-[190px] w-full max-w-[220px]" role="img" aria-label={`${riskSummary.total} total patients by risk category`}>
                    <ChartContainer config={{ risk: { label: 'Patients' } }} className="h-full w-full">
                      <PieChart>
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent nameKey="label" formatter={(value, name, item) => [`${value} patients (${item?.payload?.percent ?? 0}%)`, name]} />}
                        />
                        <Pie
                          data={riskSummary.rows.filter((row) => row.value > 0)}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={78}
                          paddingAngle={1.5}
                          cornerRadius={5}
                          strokeWidth={0}
                          animationDuration={700}
                          onClick={(entry) => goToRiskFilter(entry.key)}
                          className="cursor-pointer focus:outline-none"
                        >
                          {riskSummary.rows.filter((row) => row.value > 0).map((row) => <Cell key={row.key} fill={row.fill} />)}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-bold tracking-tight text-slate-950 tabular-nums dark:text-white">{riskSummary.total}</span>
                      <span className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('dashboard.focus.totalPatients', 'Total patients')}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {riskSummary.rows.map((row) => (
                      <button
                        key={row.key}
                        type="button"
                        disabled={row.value === 0}
                        onClick={() => goToRiskFilter(row.key)}
                        className="group flex min-h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-left transition duration-200 hover:bg-slate-50 disabled:cursor-default dark:hover:bg-[#0c1024]"
                        aria-label={`${row.label}: ${row.value} patients, ${row.percent}%`}
                      >
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.fill, boxShadow: `0 0 0 5px ${row.fill}22` }} aria-hidden />
                        <span className="min-w-0 flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{row.label}</span>
                        <span className="text-sm font-bold text-slate-900 tabular-nums dark:text-white">{row.value}</span>
                        <span className="w-10 text-right text-xs text-slate-400 tabular-nums">({row.percent}%)</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:bg-[#0c1024] dark:text-slate-400">
                  {t('dashboard.hero.noRiskData', 'No classified patients yet.')}
                </p>
              )}

              {rulesAnalytics ? (
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-[#1b2342]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300">
                        <CircleCheckBig className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{t('dashboard.focus.ruleSignals', 'Rule & fact signals')}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('dashboard.focus.ruleSignalsDesc', 'Most frequently matched clinical rules')}</p>
                      </div>
                    </div>
                    <Link to="/rules" className="text-[11px] font-semibold text-primary-600 hover:underline dark:text-primary-300">{t('dashboard.focus.viewRules', 'View rules')}</Link>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-[#0c1024]">
                      <p className="text-base font-bold text-slate-900 tabular-nums dark:text-white">{rulesAnalytics.avg_rules?.value ?? '0'}</p>
                      <p className="mt-0.5 text-[10px] leading-3 text-slate-500 dark:text-slate-400">{t('dashboard.focus.rulesPerAssessment', 'Rules / assessment')}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-[#0c1024]">
                      <p className="text-base font-bold text-slate-900 tabular-nums dark:text-white">{rulesAnalytics.accuracy?.value ?? '0%'}</p>
                      <p className="mt-0.5 text-[10px] leading-3 text-slate-500 dark:text-slate-400">{t('dashboard.focus.meanCertainty', 'Mean certainty')}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-[#0c1024]">
                      <p className="text-base font-bold text-slate-900 tabular-nums dark:text-white">{rulesAnalytics.active_rules?.value ?? '0'}</p>
                      <p className="mt-0.5 text-[10px] leading-3 text-slate-500 dark:text-slate-400">{t('dashboard.focus.activeRules', 'Active rules')}</p>
                    </div>
                  </div>

                  {topTriggeredRules.length ? (
                    <div className="mt-3 space-y-2">
                      {topTriggeredRules.slice(0, 3).map((rule) => (
                        <div key={rule.id} className="flex items-center gap-2 text-[11px]">
                          <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">{rule.name}</span>
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><span className="block h-full rounded-full bg-primary-400" style={{ width: `${Math.max(8, ((Number(rule.hits) || 0) / maxRuleHits) * 100)}%` }} /></span>
                          <span className="w-5 text-right font-semibold text-slate-500 tabular-nums dark:text-slate-400">{rule.hits}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>

          {/* One meaningful statistics chart, using real API history */}
          <div className="dash-stagger grid items-stretch gap-5">
            <SectionCard
              className="dash-fade-up h-full"
              title={t('dashboard.focus.activityTrend', 'Patient assessment activity')}
              description={t('dashboard.focus.activityTrendDesc', 'Real assessment and review volume for the selected reporting window.')}
              actions={
                throughputSummary ? (
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                      {throughputSummary.totalDiagnosed} {t('dashboard.charts.totalDiagnosed', 'Total Diagnosed')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                      {throughputSummary.totalPending} {t('dashboard.charts.pendingReview', 'Pending Review')}
                    </span>
                    {throughputSummary.totalReviewed > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                        {throughputSummary.totalReviewed} {t('dashboard.charts.reviewed', 'Reviewed')}
                      </span>
                    )}
                  </div>
                ) : null
              }
            >
              <ChartContainer config={areaChartConfig} className="h-[300px] w-full">
                {monthlyTrendData ? (
                  <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDiagnosed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorReviewed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="diagnosed"
                      stroke="#2563eb"
                      fill="url(#colorDiagnosed)"
                      strokeWidth={2.5}
                      activeDot={{ r: 5 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="pending"
                      stroke="#f59e0b"
                      fill="url(#colorPending)"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      activeDot={{ r: 4 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="reviewed"
                      stroke="#10b981"
                      fill="url(#colorReviewed)"
                      strokeWidth={2}
                      activeDot={{ r: 4 }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500 text-center">
                    {t('dashboard.charts.noTrendData', 'No trend data available yet. Create some assessments to see trends.')}
                  </div>
                )}
              </ChartContainer>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  )
}
