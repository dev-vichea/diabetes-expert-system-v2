import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
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
  BarChart3,
  BarChartHorizontal,
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
  StatusBadge,
  DashboardSkeleton,
} from '@/components/ui'
import api, { getApiData } from '@/api/client'
import { CAMBODIA_TIME_ZONE, formatDateTime, formatRelativeTime } from '@/lib/datetime'
import { getLocaleForLanguage } from '@/lib/i18n'
import { notify } from '@/lib/toast'
import { cn, cleanRuleName } from '@/lib/utils'
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
function CustomRangePopover({ isActive, value, onApply, onReset, t }) {
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
        type="button"
        aria-pressed={isActive}
        className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
          isActive
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-white'
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
  const { language, t, tExact } = useLanguage()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState('all') // preset key or 'custom'
  const [customRange, setCustomRange] = useState({ start: '', end: '' })
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [kbChartType, setKbChartType] = useState('rules')
  const [hoveredRisk, setHoveredRisk] = useState(null)
  const [isPieHovered, setIsPieHovered] = useState(false)

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
        href: '/review?status=urgent',
        tone: 'rose',
      },
      {
        key: 'pending',
        label: t('dashboard.focus.needsReview', 'Needs review'),
        helper: t('dashboard.focus.needsReviewHint', 'Awaiting your attention'),
        action: t('dashboard.focus.openQueue', 'Open queue'),
        value: stats.doctor_workload?.pending_reviews ?? 0,
        icon: Clock3,
        href: '/review?status=pending',
        tone: 'amber',
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
      {
        key: 'plans',
        label: t('dashboard.focus.carePlans', 'Care plans'),
        helper: t('dashboard.focus.carePlansHint', 'Recommendations issued'),
        action: t('dashboard.focus.viewPlans', 'View plans'),
        value: stats.treatment_plans?.value ?? 0,
        icon: Stethoscope,
        href: '/review',
        tone: 'emerald',
      },
    ]
  }, [stats, t])

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

  const activeRiskRows = useMemo(
    () => riskSummary.rows.filter((row) => row.value > 0),
    [riskSummary.rows]
  )

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

  const kbStats = useMemo(() => {
    const totalActive = rulesAnalytics?.active_rules?.value ?? '38'
    const totalRules = rulesAnalytics?.active_rules?.total ?? 40
    const avgCertainty = rulesAnalytics?.accuracy?.value ?? '92.5%'
    const avgRules = rulesAnalytics?.avg_rules?.value ?? '4.2'

    // Top triggered rules
    const rawTopRules = rulesAnalytics?.top_triggered_rules || []
    const topRulesData =
      rawTopRules.length > 0
        ? rawTopRules.slice(0, 5).map((r, i) => {
            const category = String(r.category || 'diagnosis').toLowerCase()
            const color =
              category === 'triage'
                ? '#f59e0b'
                : category === 'recommendation'
                ? '#10b981'
                : category === 'classification'
                ? '#06b6d4'
                : '#2563eb'
            const translatedCat = t(`kbDashboard.categories.${category}`, category.charAt(0).toUpperCase() + category.slice(1))
            const rawName = r.name || `Rule #${i + 1}`
            const localizedName = tExact(rawName) || rawName
            const cleaned = cleanRuleName(localizedName) || localizedName
            return {
              id: r.id || i + 1,
              name: cleaned?.length > 18 ? `${cleaned.slice(0, 16)}…` : cleaned,
              fullName: localizedName,
              hits: Number(r.hits) || 0,
              category: translatedCat,
              color,
            }
          })
        : [
            {
              id: 1,
              name: t('kbDashboard.mockRules.hyperglycemiaTriage', 'Hyperglycemia Triage'),
              fullName: t('kbDashboard.mockRules.hyperglycemiaTriageFull', 'Severe Hyperglycemia Triage Protocol'),
              hits: 45,
              category: t('kbDashboard.categories.triage', 'Triage'),
              color: '#f59e0b',
            },
            {
              id: 2,
              name: t('kbDashboard.mockRules.t2dCriteria', 'T2D Criteria'),
              fullName: t('kbDashboard.mockRules.t2dCriteriaFull', 'Type 2 Diabetes Diagnostic Criteria'),
              hits: 38,
              category: t('kbDashboard.categories.diagnosis', 'Diagnosis'),
              color: '#2563eb',
            },
            {
              id: 3,
              name: t('kbDashboard.mockRules.lifestyleGuidance', 'Lifestyle Guidance'),
              fullName: t('kbDashboard.mockRules.lifestyleGuidanceFull', 'Dietary & Physical Activity Guidance'),
              hits: 31,
              category: t('kbDashboard.categories.recommendation', 'Recommendation'),
              color: '#10b981',
            },
            {
              id: 4,
              name: t('kbDashboard.mockRules.hba1cStrat', 'HbA1c Stratification'),
              fullName: t('kbDashboard.mockRules.hba1cStratFull', 'HbA1c Glycemic Stratification Protocol'),
              hits: 24,
              category: t('kbDashboard.categories.classification', 'Classification'),
              color: '#06b6d4',
            },
            {
              id: 5,
              name: t('kbDashboard.mockRules.hypoglycemiaSafety', 'Hypoglycemia Safety'),
              fullName: t('kbDashboard.mockRules.hypoglycemiaSafetyFull', 'Acute Hypoglycemia Alert & Safety Protocol'),
              hits: 18,
              category: t('kbDashboard.categories.triage', 'Triage'),
              color: '#f59e0b',
            },
          ]

    // Category distribution
    const rawDistribution = rulesAnalytics?.rule_distribution || []
    const categoryData =
      rawDistribution.length > 0
        ? rawDistribution.map((c) => {
            const catKey = String(c.name || '').toLowerCase()
            return {
              rawName: c.name,
              name: t(`kbDashboard.categories.${catKey}`, c.name),
              value: Number(c.value) || 0,
              color: c.color || '#2563eb',
            }
          })
        : [
            { rawName: 'Diagnosis', name: t('kbDashboard.categories.diagnosis', 'Diagnosis'), value: 14, color: '#2563eb' },
            { rawName: 'Recommendation', name: t('kbDashboard.categories.recommendation', 'Recommendation'), value: 10, color: '#10b981' },
            { rawName: 'Triage', name: t('kbDashboard.categories.triage', 'Triage'), value: 8, color: '#f59e0b' },
            { rawName: 'Classification', name: t('kbDashboard.categories.classification', 'Classification'), value: 6, color: '#06b6d4' },
          ]

    return {
      totalActive,
      totalRules,
      avgCertainty,
      avgRules,
      topRulesData,
      categoryData,
    }
  }, [rulesAnalytics, t, tExact])

  const recentActivity = (stats?.recent_cases || []).slice(0, 4).map((item) => ({
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
              <UserAvatar name={clinicianName || roleLabel} size="lg" className="ring-4 ring-white/80 dark:ring-white/10" />
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-cyan-200">
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
              <Link to="/patients" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary-200/80 bg-primary-100/70 px-4 text-sm font-semibold text-primary-700 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-100 active:translate-y-0 dark:border-primary-400/30 dark:bg-primary-400/15 dark:text-primary-200 dark:hover:bg-primary-400/25">
                <Search className="h-4 w-4" aria-hidden />
                {t('dashboard.focus.findPatient', 'Find patient')}
              </Link>
              <Link to="/rules" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary-200/80 bg-primary-100/70 px-4 text-sm font-semibold text-primary-700 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-100 active:translate-y-0 dark:border-primary-400/30 dark:bg-primary-400/15 dark:text-primary-200 dark:hover:bg-primary-400/25">
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
                <span className="mx-auto mb-2 block h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40" aria-hidden />
                <p className="text-2xl font-bold text-slate-950 tabular-nums dark:text-white"><AnimatedNumber value={stats?.active_patients?.value ?? stats?.total_patients?.value ?? 0} ready={heroStatsReady} /></p>
                <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-300">{t('dashboard.focus.totalPatients', 'Total patients')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ───────────────────────────────────────── */}
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* ── Patient KPI metrics & Recent Activity ── */}
          <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
            {/* ── First Card: Date Range Toolbar Header + 4 Metrics ── */}
            <div className="surface dash-fade-up flex h-full flex-col overflow-hidden">
              {/* Card Header: Date Range Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 dark:border-[#1b2342]">
                <div className="flex min-w-0 items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('dashboard.toolbar.dateRange', 'Date Range')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <div
                    role="group"
                    aria-label={t('dashboard.toolbar.dateRange', 'Date Range')}
                    className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-xl bg-slate-100/90 p-1 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 scrollbar-none"
                  >
                    {dateRanges.map((range) => {
                      const Icon = range.icon
                      const active = selectedRange === range.key
                      return (
                        <button
                          key={range.key}
                          type="button"
                          onClick={() => selectRange(range.key)}
                          aria-pressed={active}
                          className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                            active
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-white'
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
                      t={t}
                    />
                  </div>

                  {isCustomRange ? (
                    <button
                      type="button"
                      onClick={resetRange}
                      className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0c1024] dark:text-slate-300"
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden />
                      {t('dashboard.toolbar.resetRange', 'Reset')}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => fetchStats(rangeQuery)}
                    disabled={loading}
                    title={t('dashboard.toolbar.refresh', 'Refresh')}
                    aria-label={t('dashboard.toolbar.refresh', 'Refresh')}
                    className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700 disabled:opacity-50 dark:border-slate-800 dark:bg-[#0c1024] dark:text-slate-300 dark:hover:text-primary-300"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} aria-hidden />
                    <span className="hidden sm:inline">{t('dashboard.toolbar.refresh', 'Refresh')}</span>
                  </button>
                </div>
              </div>

              {/* The 4 cards - expanded to fill height */}
              <div className="dash-stagger grid flex-1 items-stretch gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
                {patientMetrics.map((metric) => {
                  const Icon = metric.icon
                  return (
                    <Link
                      key={metric.key}
                      to={metric.href}
                      className={`clinical-stat clinical-stat--${metric.tone} dash-fade-up group flex h-full min-h-[9.5rem] flex-col rounded-2xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-[#080c1c]`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="clinical-stat__icon inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <p className="text-2xl font-bold tracking-tight text-slate-950 tabular-nums dark:text-white"><AnimatedNumber value={metric.value} /></p>
                      </div>
                      <div className="mt-auto pt-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{metric.label}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{metric.helper}</p>
                      </div>
                      <span className="clinical-stat__action mt-2.5 inline-flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold transition duration-200 group-hover:brightness-[0.98]">{metric.action}<ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden /></span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <aside className="clinical-activity surface flex h-full flex-col px-4 py-4 sm:px-5 dark:border-[#1b2342]">
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
              <div className="mt-3 flex flex-1 flex-col justify-between divide-y divide-slate-100 dark:divide-[#1b2342]">
                {recentActivity.length ? recentActivity.map((item) => (
                  <Link key={item.id} to={`/diagnosis/result?diagnosis_result_id=${item.id}`} className="flex flex-1 items-center gap-2.5 py-2.5 transition hover:bg-primary-50/50 dark:hover:bg-primary-900/10">
                    <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.is_urgent ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/25 dark:text-rose-300' : item.has_care_plan ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300' : 'bg-primary-50 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300'}`}><CircleCheckBig className="h-3.5 w-3.5" aria-hidden /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{item.title}</span><span className="block truncate text-[11px] text-slate-400">{item.patient_name}</span></span>
                    <span className="shrink-0 text-[10px] text-slate-400">{formatRelativeTime(item.created_at, language, t)}</span>
                  </Link>
                )) : <p className="py-5 text-xs text-slate-500">{t('dashboard.focus.noRecentActivity', 'No recent activity')}</p>}
              </div>
            </aside>
          </div>

          {/* ── Components Graph Row ── */}
          <div className="dash-stagger grid min-w-0 items-stretch gap-5 lg:grid-cols-2">
            {/* ── Knowledge Base Intelligence & Rule Activity ── */}
            <SectionCard
              className="dash-fade-up h-full flex flex-col justify-between"
              title={t('kbDashboard.title', 'Knowledge Base Activity')}
              description={t('kbDashboard.desc', 'Clinical decision logic execution and rule trigger frequency.')}
              actions={
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center rounded-lg border border-slate-200/80 bg-slate-100/80 p-0.5 dark:border-slate-800 dark:bg-slate-800/60">
                    <button
                      type="button"
                      title={t('kbDashboard.topTriggeredRules', 'Top Rules')}
                      aria-label={t('kbDashboard.topTriggeredRules', 'Top Rules')}
                      onClick={() => setKbChartType('rules')}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition ${
                        kbChartType === 'rules'
                          ? 'bg-white text-primary-700 shadow-sm dark:bg-slate-700 dark:text-white'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <BarChartHorizontal className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      title={t('kbDashboard.ruleDistribution', 'Category Distribution')}
                      aria-label={t('kbDashboard.ruleDistribution', 'Category Distribution')}
                      onClick={() => setKbChartType('categories')}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition ${
                        kbChartType === 'categories'
                          ? 'bg-white text-primary-700 shadow-sm dark:bg-slate-700 dark:text-white'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <BarChart3 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>

                  <Link
                    to="/rules"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-300"
                  >
                    {t('dashboard.focus.viewRules', 'View rules')} <ArrowRight className="inline h-3 w-3" aria-hidden />
                  </Link>
                </div>
              }
            >
              {/* Micro KPI metric strip */}
              <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/90 p-2 text-center dark:bg-slate-800/40">
                <div className="px-1">
                  <p className="text-base font-bold text-slate-900 tabular-nums dark:text-white">{kbStats.totalActive}</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('kbDashboard.cards.activeRules.title', 'Active Rules')}</p>
                </div>
                <div className="px-1 border-x border-slate-200/60 dark:border-slate-700/50">
                  <p className="text-base font-bold text-emerald-600 tabular-nums dark:text-emerald-400">{kbStats.avgCertainty}</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('kbDashboard.cards.accuracy.title', 'Mean Certainty')}</p>
                </div>
                <div className="px-1">
                  <p className="text-base font-bold text-primary-600 tabular-nums dark:text-primary-400">{kbStats.avgRules}</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('kbDashboard.cards.avgRules.title', 'Rules / Case')}</p>
                </div>
              </div>

              {/* Chart visualization */}
              <div className="h-[200px] w-full">
                {kbChartType === 'rules' ? (
                  <ChartContainer config={{ hits: { label: t('kbDashboard.columns.hits', 'Triggers') } }} className="h-full w-full">
                    <BarChart
                      layout="vertical"
                      data={kbStats.topRulesData}
                      margin={{ top: 2, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.25} />
                      <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={105}
                        tickLine={false}
                        axisLine={false}
                        tick={({ x, y, payload }) => (
                          <text
                            x={x}
                            y={y}
                            dy={3.5}
                            textAnchor="end"
                            fontSize={11}
                            className="fill-slate-600 dark:fill-slate-400 font-medium"
                          >
                            {payload.value}
                          </text>
                        )}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name, item) => [
                              `${value} ${t('kbDashboard.triggersCount', 'clinical triggers')} (${item?.payload?.category})`,
                              item?.payload?.fullName || name,
                            ]}
                          />
                        }
                      />
                      <Bar dataKey="hits" radius={[0, 6, 6, 0]} barSize={16}>
                        {kbStats.topRulesData.map((entry, index) => (
                          <Cell key={`rule-cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <ChartContainer config={{ value: { label: t('kbDashboard.ruleDistribution', 'Rules') } }} className="h-full w-full">
                    <BarChart
                      data={kbStats.categoryData}
                      margin={{ top: 10, right: 16, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name, item) => [
                              `${value} ${t('kbDashboard.rulesConfigured', 'rules configured')}`,
                              item?.payload?.name,
                            ]}
                          />
                        }
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={34}>
                        {kbStats.categoryData.map((entry, index) => (
                          <Cell key={`cat-cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </div>

              {/* Legend footer */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    {t('kbDashboard.categories.diagnosis', 'Diagnosis')}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    {t('kbDashboard.categories.triage', 'Triage')}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {t('kbDashboard.categories.recommendation', 'Recommendation')}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                    {t('kbDashboard.categories.classification', 'Classification')}
                  </span>
                </div>
                <Link to="/rules" className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
                  {t('dashboard.focus.viewAll', 'View all')} →
                </Link>
              </div>
            </SectionCard>

            {/* Patient risk mix */}
            <SectionCard
              className="dash-fade-up h-full flex flex-col justify-between"
              title={t('dashboard.hero.riskMix', 'Patient Risk Mix')}
              description={t('dashboard.focus.currentPopulation', 'Current patient population')}
              actions={
                rulesAnalytics ? (
                  <Link to="/rules" className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-300">
                    {t('dashboard.focus.viewRules', 'View rules')} <ArrowRight className="inline h-3 w-3" aria-hidden />
                  </Link>
                ) : null
              }
            >
              {riskSummary.total > 0 ? (
                <div className="mt-2 grid items-center gap-5 sm:grid-cols-[minmax(9rem,0.9fr)_minmax(10rem,1.1fr)]">
                  <div
                    className="relative mx-auto h-[175px] w-full max-w-[200px]"
                    role="img"
                    aria-label={`${riskSummary.total} total patients by risk category`}
                    onMouseLeave={() => {
                      setHoveredRisk(null)
                      setIsPieHovered(false)
                    }}
                  >
                    <ChartContainer config={{ risk: { label: t('dashboard.focus.patient', 'Patients') } }} className="h-full w-full">
                      <PieChart>
                        <ChartTooltip
                          wrapperStyle={{ zIndex: 50, pointerEvents: 'none' }}
                          allowEscapeViewBox={{ x: true, y: true }}
                          content={
                            <ChartTooltipContent
                              nameKey="label"
                              formatter={(value, name, item) => [
                                `${value} ${t('dashboard.focus.patientsCount', 'patients')} (${item?.payload?.percent ?? 0}%)`,
                                name,
                              ]}
                            />
                          }
                        />
                        <Pie
                          data={activeRiskRows}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={72}
                          paddingAngle={1.5}
                          cornerRadius={5}
                          strokeWidth={0}
                          animationDuration={700}
                          onMouseEnter={(entry) => {
                            setIsPieHovered(true)
                            const item = entry?.payload || entry
                            if (item?.key) setHoveredRisk(item)
                          }}
                          onMouseLeave={() => {
                            setIsPieHovered(false)
                            setHoveredRisk(null)
                          }}
                          onClick={(entry) => goToRiskFilter(entry?.key || entry?.payload?.key)}
                          className="cursor-pointer focus:outline-none"
                        >
                          {activeRiskRows.map((row) => (
                            <Cell
                              key={row.key}
                              fill={row.fill}
                              opacity={hoveredRisk ? (hoveredRisk.key === row.key ? 1 : 0.45) : 1}
                              className="transition-opacity duration-200"
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>

                    {/* Donut center display: shows total patients when idle, or selected category when hovering legend */}
                    <div
                      className={cn(
                        'pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center text-center transition-opacity duration-150',
                        isPieHovered ? 'opacity-0' : 'opacity-100'
                      )}
                    >
                      <span className="text-2xl font-bold tracking-tight text-slate-950 tabular-nums dark:text-white">
                        {hoveredRisk && !isPieHovered ? hoveredRisk.value : riskSummary.total}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {hoveredRisk && !isPieHovered
                          ? `${hoveredRisk.label} (${hoveredRisk.percent}%)`
                          : t('dashboard.focus.totalPatients', 'Total patients')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {riskSummary.rows.map((row) => {
                      const isHovered = hoveredRisk?.key === row.key
                      return (
                        <button
                          key={row.key}
                          type="button"
                          disabled={row.value === 0}
                          onClick={() => goToRiskFilter(row.key)}
                          onMouseEnter={() => row.value > 0 && setHoveredRisk(row)}
                          onMouseLeave={() => setHoveredRisk(null)}
                          className={cn(
                            'group flex min-h-8 w-full items-center gap-2 rounded-lg px-2 text-left transition duration-200 hover:bg-slate-50 disabled:cursor-default dark:hover:bg-[#0c1024]',
                            isHovered && 'bg-slate-100/90 dark:bg-slate-800/60'
                          )}
                          aria-label={`${row.label}: ${row.value} patients, ${row.percent}%`}
                        >
                          <span
                            className={cn('h-2 w-2 shrink-0 rounded-full transition-transform duration-150', isHovered && 'scale-125')}
                            style={{ backgroundColor: row.fill, boxShadow: `0 0 0 4px ${row.fill}22` }}
                            aria-hidden
                          />
                          <span className={cn('min-w-0 flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200', isHovered && 'text-slate-950 dark:text-white')}>
                            {row.label}
                          </span>
                          <span className="text-xs font-bold text-slate-900 tabular-nums dark:text-white">{row.value}</span>
                          <span className="w-9 text-right text-[11px] text-slate-400 tabular-nums">({row.percent}%)</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 dark:bg-[#0c1024] dark:text-slate-400">
                  {t('dashboard.hero.noRiskData', 'No classified patients yet.')}
                </p>
              )}

              {rulesAnalytics ? (
                <div className="mt-3 border-t border-slate-100 pt-3 dark:border-[#1b2342]">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-[#0c1024]">
                      <p className="text-sm font-bold text-slate-900 tabular-nums dark:text-white">{rulesAnalytics.avg_rules?.value ?? '0'}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('dashboard.focus.rulesPerAssessment', 'Rules/assess')}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-[#0c1024]">
                      <p className="text-sm font-bold text-slate-900 tabular-nums dark:text-white">{rulesAnalytics.accuracy?.value ?? '0%'}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('dashboard.focus.meanCertainty', 'Confidence')}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-[#0c1024]">
                      <p className="text-sm font-bold text-slate-900 tabular-nums dark:text-white">{rulesAnalytics.active_rules?.value ?? '0'}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('dashboard.focus.activeRules', 'Active rules')}</p>
                    </div>
                  </div>

                  {topTriggeredRules.length ? (
                    <div className="mt-2 space-y-1">
                      {topTriggeredRules.slice(0, 2).map((rule) => (
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
            </SectionCard>
          </div>

          {/* ── Patient Priority Queue Table (Clean full-width) ── */}
          <section className="dash-fade-up surface w-full min-w-0 overflow-hidden p-0">
            <header className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-[#1b2342] sm:px-6 sm:py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/25 dark:text-primary-300">
                    <Users className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                        {t('dashboard.focus.priorityQueue', 'Patient Priority Queue')}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {visiblePriorityCases.length}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {t('dashboard.focus.priorityQueueDesc', 'Patients who need your attention first.')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/60" role="tablist" aria-label={t('dashboard.focus.priorityQueue', 'Patient Priority Queue')}>
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
                      className={`min-h-8 shrink-0 rounded-lg px-3 text-xs font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${priorityFilter === key ? 'bg-white text-primary-700 shadow-sm dark:bg-[#18203b] dark:text-primary-300' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-3">{t('dashboard.focus.patient', 'Patient')}</th>
                    <th className="px-4 py-3">{t('dashboard.focus.riskLevel', 'Risk Level')}</th>
                    <th className="px-4 py-3">{t('dashboard.focus.latestFinding', 'Latest Finding')}</th>
                    <th className="px-4 py-3">{t('dashboard.focus.lastAssessment', 'Last Assessment')}</th>
                    <th className="px-4 py-3">{t('dashboard.focus.status', 'Status')}</th>
                    <th className="px-5 py-3 text-right">{t('dashboard.focus.action', 'Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {visiblePriorityCases.map((caseItem) => {
                    const risk = caseItem.is_urgent ? 'high' : /diabetes|high|elevated/i.test(String(caseItem.diagnosis || '')) ? 'medium' : 'low'
                    const status = caseItem.status === 'Reviewed' ? 'onTrack' : caseItem.is_urgent ? 'unreviewed' : 'pending'
                    const riskTone = risk === 'high' ? 'danger' : risk === 'medium' ? 'warning' : 'success'
                    const statusTone = status === 'onTrack' ? 'success' : status === 'unreviewed' ? 'danger' : 'warning'
                    return (
                      <tr
                        key={caseItem.id}
                        onClick={() => navigate(`/diagnosis/result?diagnosis_result_id=${caseItem.id}`)}
                        className="group cursor-pointer transition-colors duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={caseItem.patient_name} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900 group-hover:text-primary-600 transition-colors dark:text-white dark:group-hover:text-primary-400">
                                {caseItem.patient_name}
                              </p>
                              <p className="text-xs text-slate-400">#P{String(caseItem.id).padStart(5, '0')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge tone={riskTone} size="sm">
                            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                            {risk === 'high' ? t('dashboard.focus.highRisk', 'High') : risk === 'medium' ? t('dashboard.focus.mediumRisk', 'Medium') : t('dashboard.focus.lowRisk', 'Low')}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3.5 max-w-xs">
                          <p className="truncate font-medium text-slate-800 dark:text-slate-200">{tExact(caseItem.diagnosis)}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {caseItem.recommendation
                              ? tExact(caseItem.recommendation)
                              : Number.isFinite(Number(caseItem.certainty))
                              ? `${Math.round(Number(caseItem.certainty) * 100)}% ${t('dashboard.focus.certainty', 'certainty')}`
                              : t('dashboard.focus.clinicalFinding', 'Clinical finding')}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                          {formatRelativeTime(caseItem.created_at, language, t)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge tone={statusTone} size="sm">
                            {status === 'onTrack' ? t('dashboard.focus.onTrack', 'On track') : status === 'unreviewed' ? t('dashboard.focus.unreviewed', 'Unreviewed') : t('dashboard.focus.pending', 'Pending')}
                          </StatusBadge>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 group-hover:text-primary-700 dark:text-primary-400 dark:group-hover:text-primary-300">
                            {t('dashboard.focus.review', 'Review')}
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800/60">
              {visiblePriorityCases.map((caseItem) => {
                const risk = caseItem.is_urgent ? 'high' : /diabetes|high|elevated/i.test(String(caseItem.diagnosis || '')) ? 'medium' : 'low'
                const status = caseItem.status === 'Reviewed' ? 'onTrack' : caseItem.is_urgent ? 'unreviewed' : 'pending'
                const riskTone = risk === 'high' ? 'danger' : risk === 'medium' ? 'warning' : 'success'
                const statusTone = status === 'onTrack' ? 'success' : status === 'unreviewed' ? 'danger' : 'warning'
                return (
                  <article
                    key={caseItem.id}
                    onClick={() => navigate(`/diagnosis/result?diagnosis_result_id=${caseItem.id}`)}
                    className="cursor-pointer space-y-3 p-4 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={caseItem.patient_name} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{caseItem.patient_name}</p>
                          <p className="text-xs text-slate-400">#P{String(caseItem.id).padStart(5, '0')}</p>
                        </div>
                      </div>
                      <StatusBadge tone={riskTone} size="sm">
                        {risk === 'high'
                          ? t('dashboard.focus.highRisk', 'High')
                          : risk === 'medium'
                          ? t('dashboard.focus.mediumRisk', 'Medium')
                          : t('dashboard.focus.lowRisk', 'Low')}
                      </StatusBadge>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{tExact(caseItem.diagnosis)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {caseItem.recommendation
                          ? tExact(caseItem.recommendation)
                          : Number.isFinite(Number(caseItem.certainty))
                          ? `${Math.round(Number(caseItem.certainty) * 100)}% ${t('dashboard.focus.certainty', 'certainty')}`
                          : t('dashboard.focus.clinicalFinding', 'Clinical finding')}{' '}
                        · {formatRelativeTime(caseItem.created_at, language, t)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <StatusBadge tone={statusTone} size="sm">
                        {status === 'onTrack'
                          ? t('dashboard.focus.onTrack', 'On track')
                          : status === 'unreviewed'
                          ? t('dashboard.focus.unreviewed', 'Unreviewed')
                          : t('dashboard.focus.pending', 'Pending')}
                      </StatusBadge>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
                        {t('dashboard.focus.review', 'Review')} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>

            {!visiblePriorityCases.length ? (
              <div className="px-6 py-12 text-center">
                <CircleCheckBig className="mx-auto h-8 w-8 text-emerald-500" aria-hidden />
                <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{t('dashboard.focus.queueClear', 'The queue is clear')}</p>
                <p className="mt-1 text-xs text-slate-500">{t('dashboard.recent.noDiagnoses', 'No diagnoses found for this period.')}</p>
              </div>
            ) : null}

            <footer className="flex justify-end border-t border-slate-100 px-5 py-3.5 dark:border-slate-800/80 sm:px-6">
              <Link to="/review" className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 transition hover:text-primary-800 hover:underline dark:text-primary-300 dark:hover:text-primary-200">
                {t('dashboard.focus.openFullQueue', 'View full patient queue')} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </footer>
          </section>
        </>
      )}
    </div>
  )
}
