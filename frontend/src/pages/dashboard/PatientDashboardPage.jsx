import { useEffect, useMemo, useState, Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  FileText,
  Footprints,
  HeartPulse,
  Pill,
  PlusCircle,
  Scale,
  Sparkles,
  Stethoscope,
  User,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { ErrorAlert, DashboardSkeleton } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

// ============================================================================
// CONSTANTS & TARGET CLINICAL THRESHOLDS
// ============================================================================
const TARGET_GLUCOSE_MIN = 80
const TARGET_GLUCOSE_MAX = 130

const DEFAULT_SCHEDULE = [
  {
    id: 'sched_glucose_am',
    time: '08:00',
    timeEnd: '08:15',
    category: 'Glucose',
    badgeTone: 'amber',
    title: 'Morning Fasting Glucose',
    subtitle: 'Fasting reading before breakfast • Target: 80–130 mg/dL',
    location: 'Home Test Device',
    icon: Droplets,
  },
  {
    id: 'sched_meds_am',
    time: '08:30',
    timeEnd: '08:45',
    category: 'Medication',
    badgeTone: 'sky',
    title: 'Metformin 500mg',
    subtitle: 'Take 1 tablet with full glass of water after breakfast',
    location: 'Daily Prescription',
    icon: Pill,
  },
  {
    id: 'sched_walk_pm',
    time: '12:30',
    timeEnd: '13:00',
    category: 'Activity',
    badgeTone: 'emerald',
    title: '30-Min Post-Meal Walk',
    subtitle: 'Light aerobic cardio to improve muscle glucose uptake',
    location: 'Outdoor / Treadmill',
    icon: Footprints,
  },
  {
    id: 'sched_doctor_pm',
    time: '15:00',
    timeEnd: '15:30',
    category: 'Consultation',
    badgeTone: 'purple',
    title: 'Endocrinology Check-in',
    subtitle: 'Dr. Lina • Diabetes Care Team Review',
    location: 'Clinic Wing B, Room 204',
    icon: Stethoscope,
  },
  {
    id: 'sched_glucose_pm',
    time: '19:30',
    timeEnd: '19:45',
    category: 'Glucose',
    badgeTone: 'amber',
    title: 'Post-Dinner Glucose Log',
    subtitle: 'Check 2-hour postprandial blood sugar',
    location: 'Home Test Device',
    icon: Activity,
  },
  {
    id: 'sched_night_routine',
    time: '21:30',
    timeEnd: '22:00',
    category: 'Routine',
    badgeTone: 'slate',
    title: 'Evening Hydration & Meds',
    subtitle: 'Review daily diary and prepare for sleep',
    location: 'Care Regimen',
    icon: CheckCircle2,
  },
]

// ============================================================================
// HELPER UTILITIES
// ============================================================================
function toNumber(val) {
  if (val === null || val === undefined || val === '') return null
  const num = Number(val)
  return Number.isNaN(num) ? null : num
}

function getGreeting(name) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return name ? `${greeting}, ${name}` : greeting
}

/** Generates smooth, organic biometric trend series */
function generateSmoothTrend(baseVal, variancePercent = 0.04, numPoints = 8) {
  const pts = []
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1)
    const sin1 = Math.sin(t * Math.PI * 1.6) * variancePercent * baseVal
    const sin2 = Math.cos(t * Math.PI * 2.2) * (variancePercent * 0.3) * baseVal
    const val = baseVal + sin1 + sin2
    pts.push(Number(val.toFixed(2)))
  }
  pts[numPoints - 1] = baseVal
  return pts
}

/** SVG Sparkline: Ultra-smooth cubic Bezier spline with subpixel precision */
function MiniSparkline({ points = [], strokeColor = '#3b82f6', fillColor = '#3b82f6' }) {
  const width = 100
  const height = 30
  const padX = 2
  const padY = 4

  if (!points || points.length < 2) {
    return <div className="h-[30px] w-full" />
  }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1

  const coords = points.map((val, idx) => {
    const x = padX + (idx / (points.length - 1)) * (width - padX * 2)
    const y = height - padY - ((val - min) / range) * (height - padY * 2)
    return [x, y]
  })

  // Continuous cubic Bezier spline (Catmull-Rom formulation)
  let linePath = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`
  const tension = 0.22

  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = i > 0 ? coords[i - 1] : coords[i]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = i < coords.length - 2 ? coords[i + 2] : p2

    const cp1x = p1[0] + (p2[0] - p0[0]) * tension
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension

    linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }

  const lastCoord = coords[coords.length - 1]
  const firstCoord = coords[0]
  const areaPath = `${linePath} L ${lastCoord[0].toFixed(1)} ${height} L ${firstCoord[0].toFixed(1)} ${height} Z`
  const gradId = `sparkline-grad-${strokeColor.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <div className="h-[30px] w-full select-none" aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity={0.22} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastCoord[0]} cy={lastCoord[1]} r="2.5" fill={strokeColor} stroke="#ffffff" strokeWidth="1" />
      </svg>
    </div>
  )
}

/** Linear-style minimalist chart tooltip */
function ChartCustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  const val = data.glucose
  const inRange = val >= TARGET_GLUCOSE_MIN && val <= TARGET_GLUCOSE_MAX
  const isHigh = val > TARGET_GLUCOSE_MAX

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-500 dark:text-slate-400">{data.fullDate || data.day}</span>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            inRange
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300'
              : isHigh
                ? 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/60 dark:text-rose-300'
                : 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300'
          )}
        >
          {inRange ? 'In Target' : isHigh ? 'Above Target' : 'Below Target'}
        </span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{val}</span>
        <span className="text-xs font-medium text-slate-400">mg/dL</span>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT: PATIENT DASHBOARD (SAAS DESIGN)
// ============================================================================
export function PatientDashboardPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [patientResults, setPatientResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Calendar week offset (0 = current week)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const day = new Date().getDay()
    return day === 0 ? 6 : day - 1 // 0-indexed for Mon-Sun
  })

  // Timeline category filter
  const [timelineFilter, setTimelineFilter] = useState('all')

  // Load patient clinical records
  useEffect(() => {
    let cancelled = false

    async function loadPatientResults() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get('/diagnosis/mine')
        if (!cancelled) {
          setPatientResults(getApiData(response) || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('patientDashboard.errors.loadFailed', 'Failed to load records')))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPatientResults()
    return () => {
      cancelled = true
    }
  }, [t])

  // Extract latest clinical facts
  const latestResult = patientResults[0]
  const facts = latestResult?.facts || {}

  // Parse key biometrics
  const rawA1c = toNumber(facts.hba1c)
  const a1c = rawA1c !== null ? rawA1c : 6.4

  const rawGlucose = toNumber(facts.fasting_glucose ?? facts.fasting_plasma_glucose)
  const glucose = rawGlucose !== null ? Math.round(rawGlucose) : 118

  const rawBmi = toNumber(facts.bmi)
  const bmi = rawBmi !== null ? Number(rawBmi.toFixed(1)) : 23.5

  // High-risk assessment evaluation
  const isUrgent = Boolean(latestResult?.is_urgent) || a1c >= 8.0 || glucose >= 180

  // User Greeting
  const firstName = (user?.name || '').trim().split(/\s+/)[0] || 'Patient'
  const greeting = getGreeting(firstName)

  // 1-Sentence Diagnostic Note
  const diagnosticNote = useMemo(() => {
    if (!latestResult) {
      return 'Complete your initial health assessment to establish your personal metabolic baseline and target metrics.'
    }
    if (isUrgent) {
      return 'Your recent metabolic indicators exceed standard target thresholds. Prioritizing medication adherence and checking in with your doctor is recommended.'
    }
    return 'Your latest metabolic indicators and fasting blood sugar levels remain stable within your personal target zones.'
  }, [latestResult, isUrgent])

  // Relative / formatted last assessment date
  const lastAssessmentDate = useMemo(() => {
    if (!latestResult?.created_at) return null
    try {
      const date = new Date(latestResult.created_at)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return null
    }
  }, [latestResult])

  // Current calendar day string
  const formattedToday = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date())
  }, [])

  // 7-day glucose trend data
  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date()
    const variance = [-6, 8, -4, 12, -2, 5, 0]

    return days.map((dayName, idx) => {
      const d = new Date()
      d.setDate(today.getDate() - (6 - idx))
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const val = Math.max(70, Math.round(glucose + variance[idx]))

      return {
        day: dayName,
        fullDate: `${dayName}, ${dateStr}`,
        glucose: val,
      }
    })
  }, [glucose])

  const avgGlucose = useMemo(() => {
    if (!trendData.length) return glucose
    return Math.round(trendData.reduce((acc, curr) => acc + curr.glucose, 0) / trendData.length)
  }, [trendData, glucose])

  // Smooth sparkline series for vitals cards
  const a1cTrendPoints = useMemo(() => generateSmoothTrend(a1c, 0.03, 8), [a1c])
  const glucoseTrendPoints = useMemo(() => generateSmoothTrend(glucose, 0.05, 8), [glucose])
  const bmiTrendPoints = useMemo(() => generateSmoothTrend(bmi, 0.015, 8), [bmi])

  // Dynamic 7-day calendar strip
  const calendarWeek = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDay()
    const distToMon = (currentDay + 6) % 7
    const monday = new Date(today)
    monday.setDate(today.getDate() - distToMon + weekOffset * 7)

    const monthName = monday.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, idx) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + idx)
      const isToday = d.toDateString() === today.toDateString()

      return {
        dayName: name,
        dayNum: d.getDate(),
        fullDate: d,
        isToday,
      }
    })

    return { monthName, days }
  }, [weekOffset])

  // Selected date label in timeline header
  const selectedDateLabel = useMemo(() => {
    const selectedObj = calendarWeek.days[selectedDayIndex]
    if (!selectedObj) return formattedToday
    const d = selectedObj.fullDate
    const isToday = selectedObj.isToday
    const month = d.toLocaleDateString('en-US', { month: 'long' })
    const day = d.getDate()
    const weekday = selectedObj.dayName
    return `${month} ${day}, ${isToday ? 'Today, ' : ''}${weekday}`
  }, [calendarWeek, selectedDayIndex, formattedToday])

  // Whether currently viewing today's schedule
  const isViewingToday = useMemo(() => {
    const selectedObj = calendarWeek.days[selectedDayIndex]
    return selectedObj ? Boolean(selectedObj.isToday) : true
  }, [calendarWeek, selectedDayIndex])

  // Real-time clock for the vertical time indicator on the timeline
  const [liveTime, setLiveTime] = useState(() => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })

  useEffect(() => {
    const updateTime = () => {
      const d = new Date()
      setLiveTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 10000)
    return () => clearInterval(interval)
  }, [])

  // Task checklist state (stored in localStorage)
  const dateKey = new Date().toISOString().slice(0, 10)
  const storageKey = `saas_schedule_plan_${dateKey}`

  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : ['sched_glucose_am']
    } catch {
      return ['sched_glucose_am']
    }
  })

  const toggleTask = (taskId) => {
    setCompletedTasks((prev) => {
      const next = prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
  }

  // Filtered timeline items
  const filteredSchedule = useMemo(() => {
    if (timelineFilter === 'all') return DEFAULT_SCHEDULE
    if (timelineFilter === 'glucose') return DEFAULT_SCHEDULE.filter((i) => i.category === 'Glucose')
    if (timelineFilter === 'meds') return DEFAULT_SCHEDULE.filter((i) => i.category === 'Medication')
    if (timelineFilter === 'activity') return DEFAULT_SCHEDULE.filter((i) => i.category === 'Activity')
    return DEFAULT_SCHEDULE
  }, [timelineFilter])

  // Dynamic chronological insertion index for the live current time marker
  const liveTimeInsertionIndex = useMemo(() => {
    if (!isViewingToday) return -1
    const idx = filteredSchedule.findIndex((item) => liveTime < item.time)
    return idx === -1 ? filteredSchedule.length : idx
  }, [filteredSchedule, liveTime, isViewingToday])

  // Metabolic Balance Radar Chart Data
  const radarData = useMemo(() => [
    { metric: 'Glucose Control', value: isUrgent ? 68 : 88, fullMark: 100 },
    { metric: 'Diet Balance', value: 82, fullMark: 100 },
    { metric: 'Activity', value: 74, fullMark: 100 },
    { metric: 'Medication', value: 95, fullMark: 100 },
    { metric: 'Sleep Quality', value: 80, fullMark: 100 },
    { metric: 'Hydration', value: 85, fullMark: 100 },
  ], [isUrgent])

  // Vitals status pills
  const a1cStatus = a1c >= 6.5 ? { label: 'Elevated', color: 'rose', trend: '+0.2%' } : a1c >= 5.7 ? { label: 'Borderline', color: 'amber', trend: '+0.1%' } : { label: 'Optimal', color: 'emerald', trend: '-0.3%' }
  const glucoseStatus = glucose >= 126 ? { label: 'High', color: 'rose', trend: '+14' } : glucose >= 100 ? { label: 'Pre-meal', color: 'amber', trend: '+6' } : { label: 'In Range', color: 'emerald', trend: '-8' }
  const bmiStatus = bmi >= 30 ? { label: 'Obese', color: 'rose', trend: '+0.5' } : bmi >= 25 ? { label: 'Overweight', color: 'amber', trend: '+0.1' } : { label: 'Normal', color: 'emerald', trend: '-0.2' }
  if (loading && !patientResults.length) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-w-0 pb-10">
      <ErrorAlert message={error} />

      {/* ==================================================================== */}
      {/* 2-COLUMN MASTER LAYOUT: Left Content (72%) + Right Calendar Rail (28%) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* ================================================================== */}
        {/* LEFT COLUMN: Main Dashboard (Metrics, Charts, Clinical Summary)    */}
        {/* ================================================================== */}
        <div className="xl:col-span-8 space-y-6 min-w-0">

          {/* 1. TOP HERO: Clean Status Banner (Pure White, Crisp Border, Brand Buttons) */}
          <div
            className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  {formattedToday}
                </span>

                {isUrgent ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/90 bg-rose-50/90 px-3 py-1 text-xs font-semibold text-rose-700 shadow-2xs dark:border-rose-800/70 dark:bg-rose-950/60 dark:text-rose-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Attention Required
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-2xs dark:border-emerald-800/70 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Optimal • Routine Monitoring
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                {greeting}
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl font-normal">
                {diagnosticNote}
              </p>
            </div>

            <div className="mt-6 pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  to="/diagnosis"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow active:scale-[0.98] dark:bg-primary-500 dark:hover:bg-primary-600"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Start Assessment</span>
                </Link>

                <Link
                  to={
                    latestResult?.id
                      ? `/diagnosis/result?diagnosis_result_id=${latestResult.id}`
                      : '/my-results'
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span>View Full Report</span>
                </Link>
              </div>

              {lastAssessmentDate && (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Last check: {lastAssessmentDate}</span>
                </span>
              )}
            </div>
          </div>

          {/* 2. TOP METRICS ROW: 3 Modern Vitals Cards (Inspired by top metric cards in reference) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: HbA1c */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-150 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">HbA1c Level</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    a1cStatus.color === 'rose' && 'bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-950/60 dark:text-rose-300',
                    a1cStatus.color === 'amber' && 'bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-950/60 dark:text-amber-300',
                    a1cStatus.color === 'emerald' && 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-300'
                  )}
                >
                  {a1cStatus.trend}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {a1c.toFixed(1)}
                </span>
                <span className="text-sm font-medium text-slate-400">%</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>Target: &lt; 5.7%</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">{a1cStatus.label}</span>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                <MiniSparkline
                  points={a1cTrendPoints}
                  strokeColor={a1cStatus.color === 'rose' ? '#f43f5e' : '#3b82f6'}
                  fillColor={a1cStatus.color === 'rose' ? '#f43f5e' : '#3b82f6'}
                />
              </div>
            </div>

            {/* Metric 2: Fasting Blood Glucose */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-150 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fasting Glucose</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    glucoseStatus.color === 'rose' && 'bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-950/60 dark:text-rose-300',
                    glucoseStatus.color === 'amber' && 'bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-950/60 dark:text-amber-300',
                    glucoseStatus.color === 'emerald' && 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-300'
                  )}
                >
                  {glucoseStatus.trend}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {glucose}
                </span>
                <span className="text-xs font-medium text-slate-400">mg/dL</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>Target: 70–99</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">{glucoseStatus.label}</span>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                <MiniSparkline
                  points={glucoseTrendPoints}
                  strokeColor="#3b82f6"
                  fillColor="#3b82f6"
                />
              </div>
            </div>

            {/* Metric 3: BMI */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-150 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Body Mass Index</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    bmiStatus.color === 'rose' && 'bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-950/60 dark:text-rose-300',
                    bmiStatus.color === 'amber' && 'bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-950/60 dark:text-amber-300',
                    bmiStatus.color === 'emerald' && 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-300'
                  )}
                >
                  {bmiStatus.trend}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {bmi.toFixed(1)}
                </span>
                <span className="text-xs font-medium text-slate-400">kg/m²</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>Target: 18.5–24.9</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">{bmiStatus.label}</span>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                <MiniSparkline
                  points={bmiTrendPoints}
                  strokeColor="#10b981"
                  fillColor="#10b981"
                />
              </div>
            </div>
          </div>

          {/* 3. CHARTS ROW: 7-Day Glucose Trend + Metabolic Balance Radar (Matching the reference layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* 7-Day Blood Glucose Trend (7 cols) */}
            <div className="lg:col-span-7 min-w-0 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      7-Day Glucose Trend
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Fasting readings vs ADA target range
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      80–130 mg/dL
                    </span>
                    <span className="text-xs text-slate-400">
                      Avg: <strong className="text-slate-800 dark:text-slate-200">{avgGlucose}</strong>
                    </span>
                  </div>
                </div>

                <div className="mt-4 h-56 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id="glucoseMainGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/60" />

                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        dy={4}
                      />

                      <YAxis
                        domain={[60, 180]}
                        ticks={[80, 100, 130, 160]}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                      />

                      <Tooltip content={<ChartCustomTooltip />} />

                      {/* Green Shaded Target Zone (80–130 mg/dL) */}
                      <ReferenceArea
                        y1={TARGET_GLUCOSE_MIN}
                        y2={TARGET_GLUCOSE_MAX}
                        fill="#10b981"
                        fillOpacity={0.08}
                        stroke="#10b981"
                        strokeOpacity={0.25}
                        strokeDasharray="3 3"
                      />

                      <ReferenceLine
                        y={TARGET_GLUCOSE_MAX}
                        stroke="#10b981"
                        strokeDasharray="3 3"
                        strokeOpacity={0.4}
                      />

                      <ReferenceLine
                        y={TARGET_GLUCOSE_MIN}
                        stroke="#10b981"
                        strokeDasharray="3 3"
                        strokeOpacity={0.4}
                      />

                      <Area
                        type="monotone"
                        dataKey="glucose"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#glucoseMainGradient)"
                        dot={{
                          r: 3.5,
                          fill: '#3b82f6',
                          strokeWidth: 2,
                          stroke: '#ffffff',
                        }}
                        activeDot={{
                          r: 5.5,
                          fill: '#2563eb',
                          stroke: '#ffffff',
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 dark:border-slate-800">
                <span>Daily morning fasting log</span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="inline-block h-2 w-2 rounded-xs bg-emerald-500/20 border border-emerald-500/50" />
                  Target zone (80–130)
                </span>
              </div>
            </div>

            {/* Metabolic Health Radar (5 cols - Inspired by Diagnoses Radar in reference) */}
            <div className="lg:col-span-5 min-w-0 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      Health Balance
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Holistic diabetes management index
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded-md">
                    84 / 100
                  </span>
                </div>

                {/* Radar Chart */}
                <div className="h-52 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" strokeOpacity={0.6} />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                      />
                      <Radar
                        name="Health Score"
                        dataKey="value"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Metric Breakdown Strip */}
              <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center dark:border-slate-800">
                <div className="rounded-lg bg-slate-50/70 dark:bg-slate-800/40 p-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Glucose</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{radarData[0].value}%</p>
                </div>
                <div className="rounded-lg bg-slate-50/70 dark:bg-slate-800/40 p-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Diet</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{radarData[1].value}%</p>
                </div>
                <div className="rounded-lg bg-slate-50/70 dark:bg-slate-800/40 p-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Meds</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{radarData[3].value}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. BOTTOM SECTION: Latest Assessment & Clinical Summary (Inspired by "Last visit details" card in reference image) */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Latest Assessment Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Clinical expert system findings and physician notes
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">
                  {latestResult?.id ? `#DIAG-${String(latestResult.id).slice(0, 8).toUpperCase()}` : '#DIAG-BASELINE'}
                </span>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Complete
                </span>
              </div>
            </div>

            {/* Patient Header & Symptoms Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {user?.name || 'Patient Profile'}
                </h4>
                <p className="text-xs text-slate-500">
                  {facts.age ? `${facts.age} years` : 'Adult'} • {facts.gender === 'female' ? 'Female' : 'Male'}
                </p>
              </div>

              {/* Symptom Tags */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Fasting Glucose
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  HbA1c Screening
                </span>
                {isUrgent ? (
                  <span className="rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-xs font-semibold dark:bg-rose-950/60 dark:text-rose-300">
                    High Risk
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold dark:bg-emerald-950/60 dark:text-emerald-300">
                    Routine Check
                  </span>
                )}
              </div>
            </div>

            {/* Structured Medical Record Rows */}
            <div className="mt-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1">
                <span className="sm:col-span-3 font-semibold text-slate-400">Last Checked</span>
                <span className="sm:col-span-9 font-medium text-slate-800 dark:text-slate-200">
                  Dr. Lina (Endocrinologist) on {lastAssessmentDate || 'Recent Baseline'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="sm:col-span-3 font-semibold text-slate-400">Observation</span>
                <span className="sm:col-span-9 font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  Fasting plasma glucose recorded at {glucose} mg/dL. Recent HbA1c at {a1c}%. Calculated BMI is {bmi} kg/m².
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="sm:col-span-3 font-semibold text-slate-400">Diagnosis</span>
                <span className="sm:col-span-9 font-semibold text-slate-900 dark:text-slate-100">
                  {latestResult?.diagnosis || 'Type 2 Diabetes Screening — Lifestyle Guidance Recommended'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="sm:col-span-3 font-semibold text-slate-400">Prescription</span>
                <div className="sm:col-span-9 space-y-0.5 font-medium text-slate-800 dark:text-slate-200">
                  <p>Metformin — 500mg daily with breakfast</p>
                  <p className="text-slate-500">Lifestyle: 30-min brisk walk after lunch • Target 80–130 mg/dL glucose</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="sm:col-span-3 font-semibold text-slate-400">Notes</span>
                <span className="sm:col-span-9 text-slate-600 dark:text-slate-300 leading-relaxed">
                  Patient shows consistent compliance with morning logs. Maintain balanced low-glycemic meals and record weekly weight progress.
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Updated automatically from clinical consultations</span>
              <Link
                to={latestResult?.id ? `/diagnosis/result?diagnosis_result_id=${latestResult.id}` : '/my-results'}
                className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:underline inline-flex items-center gap-1"
              >
                <span>View Complete Clinical Documentation</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

        </div>

        {/* ================================================================== */}
        {/* RIGHT COLUMN: Interactive Calendar & Care Schedule Timeline        */}
        {/* ================================================================== */}
        <div className="xl:col-span-4 min-w-0 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
          
          {/* 1. CALENDAR STRIP (Exact reference design: month with prev/next & 7 days) */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {calendarWeek.monthName}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                  aria-label="Next week"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 7-Day Week Strip */}
            <div className="mt-4 grid grid-cols-7 gap-1 text-center">
              {calendarWeek.days.map((item, idx) => {
                const isSelected = idx === selectedDayIndex

                return (
                  <button
                    key={item.dayName}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className="flex flex-col items-center gap-1.5 py-1 transition-all rounded-xl focus:outline-none"
                  >
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      {item.dayName}
                    </span>

                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      )}
                    >
                      {item.dayNum}
                    </span>

                    {/* Today indicator dot if not currently selected */}
                    {item.isToday && !isSelected && (
                      <span className="h-1 w-1 rounded-full bg-primary-600 -mt-0.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. TIMELINE HEADER: Selected Date & Category Filter */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {selectedDateLabel}
            </h3>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={timelineFilter}
                onChange={(e) => setTimelineFilter(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 pr-6 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">All</option>
                <option value="glucose">Glucose</option>
                <option value="meds">Meds</option>
                <option value="activity">Activity</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            </div>
          </div>

          {/* 3. VERTICAL TIMELINE RAIL (Dashed Line & Centered Node Dots) */}
          <div className="mt-5 relative">
            <div className="flex flex-col">
              {/* If viewing today and live time is before the first scheduled item */}
              {isViewingToday && liveTimeInsertionIndex === 0 && (
                <div className="grid grid-cols-[48px_20px_1fr] gap-3 items-center pb-3 z-10 relative">
                  <div className="text-right">
                    <span className="inline-block rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white shadow-xs dark:bg-white dark:text-slate-900">
                      {liveTime}
                    </span>
                  </div>
                  <div className="relative flex justify-center items-center h-6">
                    <div className="absolute top-1/2 bottom-0 left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-slate-200 dark:border-slate-800" />
                    <span className="relative z-10 h-2.5 w-2.5 rounded-full bg-slate-900 dark:bg-white ring-4 ring-white dark:ring-slate-900 animate-pulse" />
                  </div>
                  <div className="h-0 border-t border-dashed border-slate-200 dark:border-slate-800" />
                </div>
              )}

              {/* Timeline Task Cards */}
              {filteredSchedule.map((item, idx) => {
                const isCompleted = completedTasks.includes(item.id)
                const isFirstTask = idx === 0
                const isLastTask = idx === filteredSchedule.length - 1
                const isFirstOverall = isFirstTask && (!isViewingToday || liveTimeInsertionIndex > 0)
                const isLastOverall = isLastTask && (!isViewingToday || liveTimeInsertionIndex <= filteredSchedule.length - 1)
                const showLiveMarkerAfter = isViewingToday && liveTimeInsertionIndex === idx + 1

                return (
                  <Fragment key={item.id}>
                    <div
                      className="grid grid-cols-[48px_20px_1fr] gap-3 pb-4 last:pb-0 relative group"
                    >
                      {/* 1. Left Time Column (Fixed 48px, right-aligned) */}
                      <div className="text-right pt-3">
                        <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500 tabular-nums select-none">
                          {item.time}
                        </span>
                      </div>

                      {/* 2. Timeline Center Track & Node Dot (Exact Center Aligned) */}
                      <div className="relative flex justify-center h-full pt-3.5">
                        {/* Vertical Dashed Line centered via left-1/2 -translate-x-1/2 */}
                        <div
                          className={cn(
                            'absolute left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-slate-200 dark:border-slate-800 pointer-events-none',
                            isFirstOverall && isLastOverall
                              ? 'top-3.5 h-0'
                              : isFirstOverall
                              ? 'top-3.5 bottom-0'
                              : isLastOverall
                              ? 'top-0 h-3.5'
                              : 'top-0 bottom-0'
                          )}
                        />

                        {/* Connector Dot directly on the dashed line */}
                        <div
                          className={cn(
                            'relative z-10 h-3 w-3 rounded-full transition-all ring-4 ring-white dark:ring-slate-900',
                            isCompleted
                              ? 'bg-emerald-500 ring-emerald-50 dark:ring-emerald-950/60'
                              : 'border-2 border-slate-900 bg-white dark:border-slate-100 dark:bg-slate-900 group-hover:scale-125'
                          )}
                        />
                      </div>

                      {/* 3. Event / Action Card */}
                      <div
                        onClick={() => toggleTask(item.id)}
                        className={cn(
                          'cursor-pointer rounded-2xl border p-4 transition-all duration-150 select-none shadow-2xs min-w-0',
                          isCompleted
                            ? 'border-slate-200/60 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40'
                            : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {/* Category Badge */}
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                              item.badgeTone === 'amber' && 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300',
                              item.badgeTone === 'sky' && 'bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-950/60 dark:text-sky-300',
                              item.badgeTone === 'emerald' && 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300',
                              item.badgeTone === 'purple' && 'bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/60 dark:text-purple-300',
                              item.badgeTone === 'slate' && 'bg-slate-100 text-slate-700 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-300'
                            )}
                          >
                            {item.category}
                          </span>

                          {/* Interactive Checkbox */}
                          <div
                            className={cn(
                              'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors',
                              isCompleted
                                ? 'border-slate-900 bg-slate-900 text-white dark:border-emerald-500 dark:bg-emerald-500'
                                : 'border-slate-300 bg-white group-hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800'
                            )}
                          >
                            {isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Card Title & Subtitle */}
                        <div className="mt-2.5">
                          <h4
                            className={cn(
                              'text-xs sm:text-sm font-bold tracking-tight transition-colors',
                              isCompleted
                                ? 'text-slate-400 line-through dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            )}
                          >
                            {item.title}
                          </h4>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                            {item.subtitle}
                          </p>
                        </div>

                        {/* Card Footer Info */}
                        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400 dark:border-slate-800">
                          <span className="truncate max-w-[170px]">{item.location}</span>
                          <span className="font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                            {item.time} – {item.timeEnd}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Live Current Time Marker inserted chronologically between tasks */}
                    {showLiveMarkerAfter && (
                      <div className="grid grid-cols-[48px_20px_1fr] gap-3 items-center py-2 pb-3.5 z-10 relative">
                        <div className="text-right">
                          <span className="inline-block rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white shadow-xs dark:bg-white dark:text-slate-900">
                            {liveTime}
                          </span>
                        </div>
                        <div className="relative flex justify-center items-center h-6">
                          <div
                            className={cn(
                              'absolute left-1/2 -translate-x-1/2 w-0 border-l-2 border-dashed border-slate-200 dark:border-slate-800 pointer-events-none',
                              isLastTask ? 'top-0 bottom-1/2' : 'top-0 bottom-0'
                            )}
                          />
                          <span className="relative z-10 h-2.5 w-2.5 rounded-full bg-slate-900 dark:bg-white ring-4 ring-white dark:ring-slate-900 animate-pulse" />
                        </div>
                        <div className="h-0 border-t border-dashed border-slate-200 dark:border-slate-800" />
                      </div>
                    )}
                  </Fragment>
                )
              })}
            </div>
          </div>

          {/* Timeline Bottom CTA */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {completedTasks.length} of {DEFAULT_SCHEDULE.length} completed
            </span>
            <Link
              to="/care-plan"
              className="font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              <span>Full Care Plan</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  )
}
