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
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Droplets,
  FileText,
  Footprints,
  HeartPulse,
  Pill,
  Play,
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
import {
  getReportedSymptomLabels,
  getRelativeCheckAge,
  getCarePlanConditionKey,
} from '@/components/dashboard/patient/patient-dashboard-utils'

// ============================================================================
// CONSTANTS & TARGET CLINICAL THRESHOLDS
// ============================================================================
const TARGET_GLUCOSE_MIN = 80
const TARGET_GLUCOSE_MAX = 130

// ============================================================================
// HELPER UTILITIES
// ============================================================================
function toNumber(val) {
  if (val === null || val === undefined || val === '') return null
  const num = Number(val)
  return Number.isNaN(num) ? null : num
}

function getGreeting(name, isKhmer = false) {
  const hour = new Date().getHours()
  if (isKhmer) {
    const greeting = hour < 12 ? 'អរុណសួស្តី' : hour < 17 ? 'ទិវាសួស្តី' : 'សាយណ្ហសួស្តី'
    return name ? `${greeting}, ${name}` : greeting
  }
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return name ? `${greeting}, ${name}` : greeting
}

/** Extracts all historical records for given keys (sorted newest first) */
function extractMetricHistory(results, keys) {
  const keyList = Array.isArray(keys) ? keys : [keys]
  const history = []

  for (const r of results || []) {
    const f = r?.facts || {}
    for (const k of keyList) {
      const val = toNumber(f[k])
      if (val !== null) {
        history.push({
          value: val,
          date: r.created_at,
          diagnosis: r.diagnosis,
          id: r.id,
        })
        break
      }
    }
  }
  return history
}

/** Builds real dynamic daily schedule from patient's clinical assessments */
function buildPatientDailySchedule(patientPlan, latestResult, isNewUser = false, isKhmer = false) {
  // If the patient is new or has no assessments, return empty schedule
  if (isNewUser || !latestResult) {
    return []
  }

  // ========================================================================
  // PATIENT WITH CLINICAL ASSESSMENT / ACTIVE CARE PLAN
  // ========================================================================
  const items = []

  // 1. Morning Fasting Glucose Test
  items.push({
    id: 'sched_glucose_am',
    time: '08:00',
    timeEnd: '08:15',
    category: isKhmer ? 'កម្រិតជាតិស្ករ' : 'Glucose',
    badgeTone: 'amber',
    title: isKhmer ? 'តេស្តជាតិស្ករពេលព្រឹកមុនអាហារ' : 'Morning Fasting Glucose',
    subtitle: isKhmer
      ? 'តេស្តមុនអាហារពេលព្រឹក • គោលដៅ: 80–130 mg/dL'
      : 'Fasting test before breakfast • Target: 80–130 mg/dL',
    location: isKhmer ? 'ឧបករណ៍តេស្តតាមផ្ទះ' : 'Home Test Device',
    icon: Droplets,
  })

  // 2. Prescribed Pharmacotherapy or Morning Nutrition
  if (patientPlan?.medications?.length) {
    patientPlan.medications.forEach((med, idx) => {
      const isBedtime =
        (med.frequency || '').toLowerCase().includes('bedtime') ||
        (med.frequency || '').toLowerCase().includes('night') ||
        (med.frequency || '').toLowerCase().includes('dinner')

      items.push({
        id: `sched_med_${idx}`,
        time: isBedtime ? '20:30' : idx === 0 ? '08:30' : '09:00',
        timeEnd: isBedtime ? '20:45' : idx === 0 ? '08:45' : '09:15',
        category: isKhmer ? 'ថ្នាំពេទ្យ' : 'Medication',
        badgeTone: 'sky',
        title: `${med.name} ${med.dosage || ''}`.trim(),
        subtitle: `${med.frequency || (isKhmer ? 'ពិសារជាមួយទឹក' : 'Take with water')} • ${med.status || 'Active Rx'}`,
        location: isKhmer ? 'វេជ្ជបញ្ជាប្រចាំថ្ងៃ' : 'Daily Prescription',
        icon: Pill,
      })
    })
  } else {
    items.push({
      id: 'sched_nutrition_am',
      time: '08:30',
      timeEnd: '08:45',
      category: isKhmer ? 'អាហារូបត្ថម្ភ' : 'Nutrition',
      badgeTone: 'sky',
      title: isKhmer ? 'ការទទួលទានទឹក និងអាហារពេលព្រឹកមានតុល្យភាព' : 'Morning Hydration & Balanced Breakfast',
      subtitle: isKhmer
        ? 'ទទួលទានទឹកមួយកែវពេញ និងអាហារសន្ទស្សន៍ Glycemic ទាប ដើម្បីរក្សាជាតិស្ករមានលំនឹង'
        : 'Start your day with a tall glass of water and balanced low-glycemic nutrients',
      location: isKhmer ? 'ទម្លាប់ប្រចាំថ្ងៃ' : 'Morning Routine',
      icon: HeartPulse,
    })
  }

  // 3. Physical Activity & Exercise
  const activityProc = patientPlan?.procedures?.find(
    (p) =>
      (p.category || '').toLowerCase().includes('physical') ||
      (p.category || '').toLowerCase().includes('lifestyle') ||
      (p.title || '').toLowerCase().includes('walk') ||
      (p.title || '').toLowerCase().includes('exercise')
  )

  if (activityProc) {
    items.push({
      id: 'sched_activity',
      time: '12:30',
      timeEnd: '13:00',
      category: isKhmer ? 'សកម្មភាព' : 'Activity',
      badgeTone: 'emerald',
      title: activityProc.title,
      subtitle: activityProc.description ? `${activityProc.description.slice(0, 80)}…` : (isKhmer ? 'ការដើរបន្ទាប់ពីអាហារ' : 'Postprandial physical exercise'),
      location: isKhmer ? 'ដើរបន្ទាប់ពីអាហារ' : 'Post-Meal Walk',
      icon: Footprints,
    })
  } else {
    items.push({
      id: 'sched_activity',
      time: '12:30',
      timeEnd: '13:00',
      category: isKhmer ? 'សកម្មភាព' : 'Activity',
      badgeTone: 'emerald',
      title: isKhmer ? 'ការដើរ ៣០ នាទីក្រោយអាហារ' : '30-Min Post-Meal Walk',
      subtitle: isKhmer ? 'ការហាត់ប្រាណស្រាលៗ ដើម្បីជួយកោសិកាប្រើប្រាស់ជាតិស្ករកាន់តែប្រសើរ' : 'Light aerobic cardio to improve muscle glucose uptake',
      location: isKhmer ? 'ខាងក្រៅ / ម៉ាស៊ីនដើរ' : 'Outdoor / Treadmill',
      icon: Footprints,
    })
  }

  // 4. Clinical Consultation / Care Follow-up / Afternoon Wellness Break
  const docName = latestResult?.reviewed_by_name
    ? (latestResult.reviewed_by_name.startsWith('Dr.') ? latestResult.reviewed_by_name : `Dr. ${latestResult.reviewed_by_name}`)
    : patientPlan?.doctorName
      ? (patientPlan.doctorName.startsWith('Dr.') ? patientPlan.doctorName : `Dr. ${patientPlan.doctorName}`)
      : null

  if (latestResult?.is_urgent) {
    items.push({
      id: 'sched_doctor_pm',
      time: '15:00',
      timeEnd: '15:30',
      category: isKhmer ? 'ការពិគ្រោះ' : 'Consultation',
      badgeTone: 'purple',
      title: isKhmer ? 'ការពិគ្រោះសុខភាពបន្ទាន់' : 'Urgent Clinical Consultation',
      subtitle: docName
        ? `${docName} • ${isKhmer ? 'ក្រុមថែទាំជំងឺទឹកនោមផ្អែម' : 'Diabetes Care Team'}`
        : (isKhmer ? 'ពិគ្រោះជាមួយគ្រូពេទ្យជំនាញ ឬផ្នែកសង្គ្រោះបន្ទាន់' : 'Consult attending endocrinologist or care team'),
      location: isKhmer ? 'វិបផតថលថែទាំគ្លីនិក' : 'Clinical Care Portal',
      icon: Stethoscope,
    })
  } else if (docName || latestResult?.review_note) {
    items.push({
      id: 'sched_doctor_pm',
      time: '15:00',
      timeEnd: '15:30',
      category: isKhmer ? 'ការពិគ្រោះ' : 'Consultation',
      badgeTone: 'purple',
      title: latestResult?.review_note
        ? (isKhmer ? 'ការតាមដានការត្រួតពិនិត្យគ្លីនិក' : 'Clinical Review Follow-up')
        : (isKhmer ? 'ការពិគ្រោះតាមដានសុខភាព' : 'Care Team Check-in'),
      subtitle: docName
        ? `${docName} • ${isKhmer ? 'ក្រុមថែទាំជំងឺទឹកនោមផ្អែម' : 'Diabetes Care Team'}`
        : (isKhmer ? 'ក្រុមថែទាំជំងឺទឹកនោមផ្អែម' : 'Diabetes Care Team Review'),
      location: isKhmer ? 'វិបផតថលថែទាំគ្លីនិក' : 'Clinical Care Portal',
      icon: Stethoscope,
    })
  } else {
    items.push({
      id: 'sched_wellness_pm',
      time: '15:00',
      timeEnd: '15:20',
      category: isKhmer ? 'សុខុមាលភាព' : 'Wellness',
      badgeTone: 'purple',
      title: isKhmer ? 'ការសម្រាក និងពិនិត្យកម្រិតជាតិទឹកពេលរសៀល' : 'Afternoon Hydration & Movement Break',
      subtitle: isKhmer
        ? 'ទទួលទានទឹក និងឈរសម្រាកដើម្បីចៀសវាងការអង្គុយយូរ និងជួយដល់ចរន្តឈាម'
        : 'Take a stretch break and hydrate to support healthy circulation',
      location: isKhmer ? 'ទម្លាប់ប្រចាំថ្ងៃ' : 'Daily Routine',
      icon: HeartPulse,
    })
  }

  // 5. Post-Dinner Glucose Log
  items.push({
    id: 'sched_glucose_pm',
    time: '19:30',
    timeEnd: '19:45',
    category: isKhmer ? 'កម្រិតជាតិស្ករ' : 'Glucose',
    badgeTone: 'amber',
    title: isKhmer ? 'កត់ត្រាជាតិស្ករក្រោយអាហារពេលល្ងាច' : 'Post-Dinner Glucose Log',
    subtitle: isKhmer ? 'ពិនិត្យកម្រិតជាតិស្ករ ២ ម៉ោងក្រោយអាហារពេលល្ងាច' : 'Check 2-hour postprandial blood sugar',
    location: isKhmer ? 'ឧបករណ៍តេស្តតាមផ្ទះ' : 'Home Test Device',
    icon: Activity,
  })

  // 6. Evening Routine
  items.push({
    id: 'sched_night_routine',
    time: '21:30',
    timeEnd: '22:00',
    category: isKhmer ? 'ទម្លាប់រាត្រី' : 'Routine',
    badgeTone: 'slate',
    title: isKhmer ? 'ការទទួលទានទឹក និងការសម្រាក' : 'Evening Hydration & Routine',
    subtitle: isKhmer ? 'ពិនិត្យសៀវភៅតាមដានប្រចាំថ្ងៃ និងរៀបចំចូលគេង' : 'Review daily diary and prepare for sleep',
    location: isKhmer ? 'ទម្លាប់ថែទាំសុខភាព' : 'Care Regimen',
    icon: CheckCircle2,
  })

  return items.sort((a, b) => a.time.localeCompare(b.time))
}

/** SVG Sparkline: Ultra-smooth cubic Bezier spline with subpixel precision */
function MiniSparkline({ points = [], strokeColor = '#3b82f6', fillColor = '#3b82f6' }) {
  const width = 100
  const height = 30
  const padX = 2
  const padY = 4

  if (!points || points.length === 0) {
    return <div className="h-[30px] w-full" />
  }

  // If only 1 point, create a baseline
  const activePoints = points.length === 1 ? [points[0], points[0]] : points

  const min = Math.min(...activePoints)
  const max = Math.max(...activePoints)
  const range = max - min || 1

  const coords = activePoints.map((val, idx) => {
    const x = padX + (idx / (activePoints.length - 1)) * (width - padX * 2)
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

/** Linear-style minimalist chart tooltip for health assessment progression */
function ChartCustomTooltip({ active, payload, isKhmer = false }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  const score = data.score
  const isLowRisk = score < 35
  const isModerateRisk = score >= 35 && score < 65

  const statusLabel = isLowRisk
    ? (isKhmer ? 'ហានិភ័យទាប' : 'Low Risk')
    : isModerateRisk
      ? (isKhmer ? 'ហានិភ័យមធ្យម' : 'Moderate Risk')
      : (isKhmer ? 'ហានិភ័យខ្ពស់' : 'High Risk')

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95 min-w-[200px]">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-500 dark:text-slate-400">{data.fullDate || data.day}</span>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            isLowRisk
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300'
              : isModerateRisk
                ? 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/60 dark:text-rose-300'
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{score}%</span>
          <span className="text-xs font-medium text-slate-400">{isKhmer ? 'ហានិភ័យ' : 'Risk Score'}</span>
        </div>

        {data.delta != null ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-semibold',
              data.delta < 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : data.delta > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {data.delta < 0 ? (
              <>↓ {Math.abs(data.delta)}% {isKhmer ? 'ធ្លាក់ចុះ' : 'vs prev'}</>
            ) : data.delta > 0 ? (
              <>↑ +{data.delta}% {isKhmer ? 'កើនឡើង' : 'vs prev'}</>
            ) : (
              <>±0% {isKhmer ? 'មានលំនឹង' : 'vs prev'}</>
            )}
          </span>
        ) : (
          <span className="text-[10px] font-medium text-slate-400">
            {isKhmer ? 'កម្រិតគោលដំបូង' : 'Baseline'}
          </span>
        )}
      </div>

      {data.diagnosis && (
        <p className="mt-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[220px]">
          {data.diagnosis}
        </p>
      )}

      {(data.glucose != null || data.hba1c != null) && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[10px] text-slate-400">
          {data.glucose != null && (
            <span>{isKhmer ? 'ជាតិស្ករ៖' : 'Glucose:'} <strong className="text-slate-700 dark:text-slate-200">{data.glucose} mg/dL</strong></span>
          )}
          {data.glucose != null && data.hba1c != null && <span>•</span>}
          {data.hba1c != null && (
            <span>HbA1c: <strong className="text-slate-700 dark:text-slate-200">{data.hba1c}%</strong></span>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT: PATIENT DASHBOARD (SAAS DESIGN)
// ============================================================================
export function PatientDashboardPage() {
  const { user } = useAuth()
  const canViewOwnCarePlan = user?.permissions?.includes('care_plan.view_own')
  const { t, tExact, language, isKhmer } = useLanguage()
  const [patientResults, setPatientResults] = useState([])
  const [patientProfile, setPatientProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Calendar week offset (0 = current week)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const day = new Date().getDay()
    return day === 0 ? 6 : day - 1 // 0-indexed for Mon-Sun
  })

  // Timeline category filter
  const [timelineFilter, setTimelineFilter] = useState('all')

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

  // Load real patient clinical records & profile
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [resultsRes, profileRes] = await Promise.allSettled([
          api.get('/diagnosis/mine'),
          api.get('/patients/mine'),
        ])

        if (!cancelled) {
          if (resultsRes.status === 'fulfilled') {
            setPatientResults(getApiData(resultsRes.value) || [])
          } else {
            console.error('Failed to load diagnosis records:')
          }

          if (profileRes.status === 'fulfilled') {
            setPatientProfile(getApiData(profileRes.value) || null)
          } else {
            console.warn('Patient profile endpoint returned:')
          }
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

    loadData()
    return () => {
      cancelled = true
    }
  }, [t])

  // Personalized Care Plan (null when treatment planning module is removed)
  const patientPlan = null

  // Extract latest clinical facts
  const latestResult = patientResults[0]
  const facts = latestResult?.facts || {}

  // ============================================================================
  // REAL BIOMETRICS EXTRACTION ACROSS CLINICAL HISTORY
  // ============================================================================
  // 1. Fasting Glucose history
  const glucoseHistory = useMemo(() => {
    return extractMetricHistory(patientResults, [
      'fasting_glucose',
      'fasting_plasma_glucose',
      'random_blood_glucose',
      'blood_glucose',
    ])
  }, [patientResults])

  const latestGlucoseRecord = glucoseHistory[0]
  const prevGlucoseRecord = glucoseHistory.find(
    (item, idx) => idx > 0 && Math.abs(item.value - latestGlucoseRecord.value) > 0.01
  ) || glucoseHistory[1]

  const currentGlucose = latestGlucoseRecord ? Math.round(latestGlucoseRecord.value) : null
  const prevGlucose = prevGlucoseRecord ? Math.round(prevGlucoseRecord.value) : null
  const glucoseDelta = currentGlucose !== null && prevGlucose !== null ? currentGlucose - prevGlucose : null

  const glucoseDeltaText =
    glucoseDelta !== null
      ? glucoseDelta > 0
        ? `+${glucoseDelta}`
        : `${glucoseDelta}`
      : currentGlucose !== null
      ? (isKhmer ? 'កម្រិតគោល' : 'Baseline')
      : (isKhmer ? 'រង់ចាំ' : 'Pending')

  const glucoseDeltaTone =
    glucoseDelta !== null
      ? glucoseDelta > 0
        ? 'rose'
        : glucoseDelta < 0
        ? 'emerald'
        : 'slate'
      : 'slate'

  const glucoseStatus =
    currentGlucose !== null
      ? currentGlucose >= 126
        ? { label: isKhmer ? 'ខ្ពស់' : 'High', color: 'rose' }
        : currentGlucose >= 100
        ? { label: isKhmer ? 'លើសកម្រិត' : 'Impaired / Pre-meal', color: 'amber' }
        : { label: isKhmer ? 'ក្នុងកម្រិតធម្មតា' : 'In Range', color: 'emerald' }
      : { label: isKhmer ? 'មិនទាន់តេស្ត' : 'Not Tested', color: 'slate' }

  // 2. HbA1c history
  const a1cHistory = useMemo(() => {
    return extractMetricHistory(patientResults, ['hba1c', 'a1c'])
  }, [patientResults])

  const latestA1cRecord = a1cHistory[0]
  const prevA1cRecord = a1cHistory.find(
    (item, idx) => idx > 0 && Math.abs(item.value - latestA1cRecord.value) > 0.01
  ) || a1cHistory[1]

  const currentA1c = latestA1cRecord ? Number(latestA1cRecord.value.toFixed(1)) : null
  const prevA1c = prevA1cRecord ? Number(prevA1cRecord.value.toFixed(1)) : null
  const a1cDelta = currentA1c !== null && prevA1c !== null ? Number((currentA1c - prevA1c).toFixed(1)) : null

  const a1cDeltaText =
    a1cDelta !== null
      ? a1cDelta > 0
        ? `+${a1cDelta}%`
        : `${a1cDelta}%`
      : currentA1c !== null
      ? (isKhmer ? 'កម្រិតគោល' : 'Baseline')
      : (isKhmer ? 'រង់ចាំ' : 'Pending')

  const a1cDeltaTone =
    a1cDelta !== null
      ? a1cDelta > 0
        ? 'rose'
        : a1cDelta < 0
        ? 'emerald'
        : 'slate'
      : 'slate'

  const a1cStatus =
    currentA1c !== null
      ? currentA1c >= 6.5
        ? { label: isKhmer ? 'ខ្ពស់' : 'Elevated', color: 'rose' }
        : currentA1c >= 5.7
        ? { label: isKhmer ? 'ប្រឈម' : 'Borderline', color: 'amber' }
        : { label: isKhmer ? 'ល្អប្រសើរ' : 'Optimal', color: 'emerald' }
      : { label: isKhmer ? 'មិនទាន់តេស្ត' : 'Not Tested', color: 'slate' }

  // 3. BMI history & profile calculation
  const bmiHistory = useMemo(() => {
    return extractMetricHistory(patientResults, ['bmi'])
  }, [patientResults])

  const calculatedProfileBmi = useMemo(() => {
    if (patientProfile?.height_cm && patientProfile?.weight_kg) {
      const hMeters = patientProfile.height_cm / 100
      return Number((patientProfile.weight_kg / (hMeters * hMeters)).toFixed(1))
    }
    return null
  }, [patientProfile])

  const latestBmiRecord = bmiHistory[0]
  const prevBmiRecord = bmiHistory.find(
    (item, idx) => idx > 0 && Math.abs(item.value - latestBmiRecord.value) > 0.01
  ) || bmiHistory[1]

  const currentBmi = latestBmiRecord
    ? Number(latestBmiRecord.value.toFixed(1))
    : calculatedProfileBmi
  const prevBmi = prevBmiRecord ? Number(prevBmiRecord.value.toFixed(1)) : null
  const bmiDelta = currentBmi !== null && prevBmi !== null ? Number((currentBmi - prevBmi).toFixed(1)) : null

  const bmiDeltaText =
    bmiDelta !== null
      ? bmiDelta > 0
        ? `+${bmiDelta}`
        : `${bmiDelta}`
      : currentBmi !== null
      ? (isKhmer ? 'កម្រិតគោល' : 'Baseline')
      : (isKhmer ? 'រង់ចាំ' : 'Pending')

  const bmiDeltaTone =
    bmiDelta !== null
      ? bmiDelta > 0
        ? currentBmi >= 25
          ? 'rose'
          : 'slate'
        : 'emerald'
      : 'slate'

  const bmiStatus =
    currentBmi !== null
      ? currentBmi >= 30
        ? { label: isKhmer ? 'ធាត់លើសទម្ងន់ខ្លាំង' : 'Obese', color: 'rose' }
        : currentBmi >= 25
        ? { label: isKhmer ? 'លើសទម្ងន់' : 'Overweight', color: 'amber' }
        : currentBmi < 18.5
        ? { label: isKhmer ? 'ស្គមពេក' : 'Underweight', color: 'amber' }
        : { label: isKhmer ? 'ធម្មតា' : 'Normal', color: 'emerald' }
      : { label: isKhmer ? 'មិនបានផ្តល់' : 'Not Provided', color: 'slate' }

  // Real Sparkline Points from clinical history
  const a1cTrendPoints = useMemo(() => {
    if (!a1cHistory.length) return []
    const pts = [...a1cHistory].reverse().map((h) => h.value)
    return pts.length === 1 ? [pts[0], pts[0]] : pts
  }, [a1cHistory])

  const glucoseTrendPoints = useMemo(() => {
    if (!glucoseHistory.length) return []
    const pts = [...glucoseHistory].reverse().map((h) => h.value)
    return pts.length === 1 ? [pts[0], pts[0]] : pts
  }, [glucoseHistory])

  const bmiTrendPoints = useMemo(() => {
    if (!bmiHistory.length && currentBmi) return [currentBmi, currentBmi]
    const pts = [...bmiHistory].reverse().map((h) => h.value)
    return pts.length === 1 ? [pts[0], pts[0]] : pts
  }, [bmiHistory, currentBmi])

  // High-risk assessment evaluation
  const isUrgent =
    Boolean(latestResult?.is_urgent) ||
    (currentA1c !== null && currentA1c >= 8.0) ||
    (currentGlucose !== null && currentGlucose >= 180)

  // Patient Greeting & Name
  const patientDisplayName = patientProfile?.full_name || user?.name || ''
  const firstName = patientDisplayName.trim().split(/\s+/)[0] || (isKhmer ? 'អ្នកជំងឺ' : 'Patient')
  const greeting = getGreeting(firstName, isKhmer)

  // Patient Demographics (Age & Gender)
  const patientAge = useMemo(() => {
    if (patientProfile?.date_of_birth) {
      try {
        const dob = new Date(patientProfile.date_of_birth)
        const diffMs = Date.now() - dob.getTime()
        const ageYears = Math.floor(diffMs / (365.25 * 24 * 3600 * 1000))
        if (ageYears > 0 && ageYears < 125) return ageYears
      } catch {
        // ignore
      }
    }
    return facts.age ? Math.round(Number(facts.age)) : null
  }, [patientProfile, facts.age])

  const patientGender = useMemo(() => {
    const raw = patientProfile?.gender || facts.gender
    if (!raw) return isKhmer ? 'មនុស្សពេញវ័យ' : 'Adult'
    if (isKhmer) {
      const lower = raw.toLowerCase()
      if (lower.includes('female') || lower.includes('f') || lower.includes('ស្រី')) return 'ស្រី'
      if (lower.includes('male') || lower.includes('m') || lower.includes('ប្រុស')) return 'ប្រុស'
      return 'មនុស្សពេញវ័យ'
    }
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
  }, [patientProfile, facts.gender, isKhmer])

  // 1-Sentence Diagnostic Note
  const diagnosticNote = useMemo(() => {
    if (!latestResult) {
      return isKhmer
        ? 'បំពេញការវាយតម្លៃសុខភាពដំបូងរបស់អ្នក ដើម្បីកំណត់សូចនាករមូលដ្ឋាន និងគោលដៅសុខភាពផ្ទាល់ខ្លួន។'
        : 'Complete your initial health assessment to establish your personal metabolic baseline and target metrics.'
    }
    if (latestResult.review_note) {
      return latestResult.review_note
    }
    if (isUrgent) {
      return (
        latestResult.urgent_reason ||
        (isKhmer
          ? 'សូចនាករមេតាបូលីកថ្មីៗរបស់អ្នកលើសពីកម្រិតគោលដៅស្តង់ដារ។ សូមពិគ្រោះជាមួយគ្រូពេទ្យ និងអនុវត្តតាមការណែនាំថ្នាំ។'
          : 'Your recent metabolic indicators exceed standard target thresholds. Clinical check-in and medication adherence are recommended.')
      )
    }
    const recText = typeof latestResult.recommendation === 'string'
      ? latestResult.recommendation.split('.')[0] + '.'
      : Array.isArray(latestResult.recommendation) && latestResult.recommendation.length > 0
      ? String(latestResult.recommendation[0])
      : null
    return (
      recText ||
      (isKhmer
        ? 'សូចនាករមេតាបូលីក និងកម្រិតជាតិស្ករពេលព្រឹកចុងក្រោយរបស់អ្នកមានលំនឹងល្អក្នុងកម្រិតគោលដៅផ្ទាល់ខ្លួន។'
        : 'Your latest metabolic indicators and fasting blood sugar levels remain stable within your personal target zones.')
    )
  }, [latestResult, isUrgent, isKhmer])

  // Relative / formatted last assessment date
  const lastAssessmentDate = useMemo(() => {
    if (!latestResult?.created_at) return null
    try {
      const date = new Date(latestResult.created_at)
      return date.toLocaleDateString(isKhmer ? 'km-KH' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return null
    }
  }, [latestResult, isKhmer])

  // Current calendar day string
  const formattedToday = useMemo(() => {
    return new Intl.DateTimeFormat(isKhmer ? 'km-KH' : 'en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date())
  }, [isKhmer])

  // ============================================================================
  // REAL HISTORICAL HEALTH ASSESSMENT TREND & PROGRESSION DATA
  // ============================================================================
  const healthTrendData = useMemo(() => {
    if (!patientResults || patientResults.length === 0) return []

    // Take up to 10 most recent records and sort chronologically (oldest to newest)
    const chronological = [...patientResults.slice(0, 10)].reverse()

    // Deduplicate or label with time if on the same day
    const dayCounts = {}
    chronological.forEach((item) => {
      const d = item.created_at ? new Date(item.created_at) : new Date()
      const dayKey = d.toLocaleDateString(isKhmer ? 'km-KH' : 'en-US', { month: 'short', day: 'numeric' })
      dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1
    })

    const daySeen = {}
    return chronological.map((item, idx) => {
      const d = item.created_at ? new Date(item.created_at) : new Date()
      const dayKey = d.toLocaleDateString(isKhmer ? 'km-KH' : 'en-US', { month: 'short', day: 'numeric' })
      const hasMultiple = dayCounts[dayKey] > 1
      daySeen[dayKey] = (daySeen[dayKey] || 0) + 1

      const label = hasMultiple
        ? `${dayKey} (#${daySeen[dayKey]})`
        : dayKey

      const fullDate = d.toLocaleDateString(isKhmer ? 'km-KH' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })

      // Standardized assessment risk score (0-100%)
      const diagStr = String(item.diagnosis || '').toLowerCase()
      const rawCert = item.certainty_percent != null
        ? Number(item.certainty_percent)
        : Number(item.certainty != null ? item.certainty * 100 : 50)
      const cert = Math.max(0, Math.min(100, Math.round(Number.isNaN(rawCert) ? 50 : rawCert)))

      const isNormal = diagStr.includes('normal') || diagStr.includes('low risk') || diagStr.includes('healthy') || diagStr.includes('no strong') || diagStr.includes('negative')
      const isPrediabetes = diagStr.includes('prediabetes') || (diagStr.includes('elevated') && diagStr.includes('risk')) || diagStr.includes('early')
      const isUrgent = diagStr.includes('urgent') || diagStr.includes('emergency') || Boolean(item.is_urgent)

      let score = 50
      if (isNormal) {
        score = Math.max(5, Math.min(30, Math.round(100 - cert * 0.75)))
      } else if (isPrediabetes) {
        score = Math.max(35, Math.min(65, Math.round(cert * 0.55 + 20)))
      } else if (isUrgent) {
        score = Math.max(82, Math.min(98, Math.round(cert * 0.25 + 72)))
      } else {
        score = Math.max(68, Math.min(95, Math.round(cert * 0.45 + 50)))
      }

      const prevItem = idx > 0 ? chronological[idx - 1] : null
      let prevScore = null
      if (prevItem) {
        const prevDiag = String(prevItem.diagnosis || '').toLowerCase()
        const prevRawCert = prevItem.certainty_percent != null
          ? Number(prevItem.certainty_percent)
          : Number(prevItem.certainty != null ? prevItem.certainty * 100 : 50)
        const prevCert = Math.max(0, Math.min(100, Math.round(Number.isNaN(prevRawCert) ? 50 : prevRawCert)))
        if (prevDiag.includes('normal') || prevDiag.includes('low risk') || prevDiag.includes('healthy') || prevDiag.includes('no strong') || prevDiag.includes('negative')) {
          prevScore = Math.max(5, Math.min(30, Math.round(100 - prevCert * 0.75)))
        } else if (prevDiag.includes('prediabetes') || (prevDiag.includes('elevated') && prevDiag.includes('risk')) || prevDiag.includes('early')) {
          prevScore = Math.max(35, Math.min(65, Math.round(prevCert * 0.55 + 20)))
        } else if (prevDiag.includes('urgent') || prevDiag.includes('emergency') || Boolean(prevItem.is_urgent)) {
          prevScore = Math.max(82, Math.min(98, Math.round(prevCert * 0.25 + 72)))
        } else {
          prevScore = Math.max(68, Math.min(95, Math.round(prevCert * 0.45 + 50)))
        }
      }

      const delta = prevScore != null ? score - prevScore : null

      const facts = item.facts || {}
      const glucose = facts.fasting_glucose != null
        ? Math.round(Number(facts.fasting_glucose))
        : facts.blood_glucose != null
          ? Math.round(Number(facts.blood_glucose))
          : null
      const hba1c = facts.hba1c != null ? Number(Number(facts.hba1c).toFixed(1)) : null

      return {
        id: item.id,
        day: label,
        fullDate,
        score,
        delta,
        diagnosis: item.diagnosis,
        isReviewed: Boolean(item.is_reviewed),
        glucose,
        hba1c,
      }
    })
  }, [patientResults, isKhmer])

  const latestAssessmentPoint = healthTrendData[healthTrendData.length - 1] || null
  const prevAssessmentPoint = healthTrendData.length > 1 ? healthTrendData[healthTrendData.length - 2] : null

  const assessmentComparison = useMemo(() => {
    if (!latestAssessmentPoint) return null
    if (!prevAssessmentPoint) {
      return {
        isBaseline: true,
        text: isKhmer ? 'ការវាយតម្លៃដំបូង' : 'Initial Baseline',
      }
    }
    const delta = latestAssessmentPoint.score - prevAssessmentPoint.score
    return {
      isBaseline: false,
      delta,
      isImproved: delta < 0,
      isWorsened: delta > 0,
      isStable: delta === 0,
      text: delta < 0
        ? (isKhmer ? `↓ ${Math.abs(delta)}% ធៀបលើកមុន` : `↓ ${Math.abs(delta)}% vs previous`)
        : delta > 0
          ? (isKhmer ? `↑ +${delta}% ធៀបលើកមុន` : `↑ +${delta}% vs previous`)
          : (isKhmer ? `±0% ធៀបលើកមុន` : `±0% vs previous`),
    }
  }, [latestAssessmentPoint, prevAssessmentPoint, isKhmer])

  // Dynamic 7-day calendar strip
  const calendarWeek = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDay()
    const distToMon = (currentDay + 6) % 7
    const monday = new Date(today)
    monday.setDate(today.getDate() - distToMon + weekOffset * 7)

    const locale = isKhmer ? 'km-KH' : 'en-US'
    const monthName = monday.toLocaleDateString(locale, { month: 'short', year: 'numeric' })
    const dayNames = isKhmer
      ? ['ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហ', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    const days = dayNames.map((name, idx) => {
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
  }, [weekOffset, isKhmer])

  // Selected date label in timeline header
  const selectedDateLabel = useMemo(() => {
    const selectedObj = calendarWeek.days[selectedDayIndex]
    if (!selectedObj) return formattedToday
    const d = selectedObj.fullDate
    const isToday = selectedObj.isToday
    const locale = isKhmer ? 'km-KH' : 'en-US'
    const month = d.toLocaleDateString(locale, { month: 'long' })
    const day = d.getDate()
    const weekday = selectedObj.dayName
    if (isKhmer) {
      return `${weekday}, ${day} ${month}${isToday ? ' (ថ្ងៃនេះ)' : ''}`
    }
    return `${month} ${day}, ${isToday ? 'Today, ' : ''}${weekday}`
  }, [calendarWeek, selectedDayIndex, formattedToday, isKhmer])

  // Whether currently viewing today's schedule
  const isViewingToday = useMemo(() => {
    const selectedObj = calendarWeek.days[selectedDayIndex]
    return selectedObj ? Boolean(selectedObj.isToday) : true
  }, [calendarWeek, selectedDayIndex])

  // Is this user a brand-new patient (no diagnosis results yet)
  const isNewUser = useMemo(() => {
    return (!patientResults || patientResults.length === 0)
  }, [patientResults])

  // Real Dynamic Daily Care Schedule
  const dailySchedule = useMemo(() => {
    return buildPatientDailySchedule(patientPlan, latestResult, isNewUser, isKhmer)
  }, [patientPlan, latestResult, isNewUser, isKhmer])

  // Task checklist state (stored in localStorage keyed per user & date)
  const dateKey = new Date().toISOString().slice(0, 10)
  const storageKey = `saas_schedule_plan_${dateKey}_${user?.id || user?.email || 'guest'}`

  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
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
    if (timelineFilter === 'all') return dailySchedule
    if (timelineFilter === 'glucose') {
      return dailySchedule.filter((i) => {
        const cat = (i.category || '').toLowerCase()
        return cat.includes('glucose') || cat.includes('biomarker') || cat.includes('ជាតិស្ករ')
      })
    }
    if (timelineFilter === 'meds') {
      return dailySchedule.filter((i) => {
        const cat = (i.category || '').toLowerCase()
        return cat.includes('med') || cat.includes('ថ្នាំ') || cat.includes('profile') || cat.includes('ប្រវត្តិរូប')
      })
    }
    if (timelineFilter === 'activity') {
      return dailySchedule.filter((i) => {
        const cat = (i.category || '').toLowerCase()
        return cat.includes('activity') || cat.includes('lifestyle') || cat.includes('របៀបរស់នៅ') || cat.includes('assessment') || cat.includes('ការវាយតម្លៃ')
      })
    }
    return dailySchedule
  }, [dailySchedule, timelineFilter])

  // Dynamic chronological insertion index for the live current time marker
  const liveTimeInsertionIndex = useMemo(() => {
    if (!isViewingToday) return -1
    const idx = filteredSchedule.findIndex((item) => liveTime < item.time)
    return idx === -1 ? filteredSchedule.length : idx
  }, [filteredSchedule, liveTime, isViewingToday])

  // ============================================================================
  // REAL METABOLIC BALANCE RADAR CHART (COMPUTED DYNAMICALLY)
  // ============================================================================
  const radarMetrics = useMemo(() => {
    const hasClinicalData = Boolean(
      latestResult ||
      (patientResults && patientResults.length > 0) ||
      currentGlucose !== null ||
      currentA1c !== null ||
      currentBmi !== null
    )

    if (!hasClinicalData) {
      return {
        hasData: false,
        overall: null,
        glucoseScore: null,
        dietScore: null,
        medScore: null,
        data: [],
      }
    }

    // 1. Glucose Control Score (0 - 100)
    let glucoseScore = 75
    if (currentA1c !== null || currentGlucose !== null) {
      if ((currentA1c !== null && currentA1c < 5.7) && (currentGlucose !== null && currentGlucose < 100)) {
        glucoseScore = 95
      } else if ((currentA1c !== null && currentA1c <= 6.4) || (currentGlucose !== null && currentGlucose <= 125)) {
        glucoseScore = 78
      } else if ((currentA1c !== null && currentA1c <= 7.9) || (currentGlucose !== null && currentGlucose <= 160)) {
        glucoseScore = 58
      } else {
        glucoseScore = 38
      }
    } else if (latestResult) {
      const conditionKey = getCarePlanConditionKey(latestResult)
      const rawCert = latestResult.certainty_percent != null
        ? Number(latestResult.certainty_percent)
        : Number(latestResult.certainty != null ? latestResult.certainty * 100 : 50)
      const cert = Math.max(0, Math.min(100, Math.round(Number.isNaN(rawCert) ? 50 : rawCert)))

      if (conditionKey === 'type1' || conditionKey === 'type2' || isUrgent) {
        glucoseScore = Math.max(25, Math.min(50, Math.round(100 - cert * 0.65)))
      } else if (conditionKey === 'prediabetes' || conditionKey === 'gestational') {
        glucoseScore = Math.max(55, Math.min(75, Math.round(100 - cert * 0.45)))
      } else {
        glucoseScore = Math.max(82, Math.min(96, Math.round(75 + cert * 0.2)))
      }
    }

    // 2. Diet Balance Score
    let dietScore = 80
    if (currentBmi && currentBmi >= 30) {
      dietScore = 50
    } else if (currentBmi && currentBmi >= 25) {
      dietScore = 68
    } else if (currentBmi && currentBmi >= 18.5) {
      dietScore = 88
    } else if (latestResult) {
      const d = String(latestResult.diagnosis || '').toLowerCase()
      if (d.includes('normal') || d.includes('low risk')) dietScore = 86
      else if (d.includes('prediabetes')) dietScore = 72
      else dietScore = 60
    }
    if (facts.high_cholesterol || patientProfile?.high_cholesterol) dietScore -= 12
    if (facts.excessive_hunger || facts.symptom_excessive_hunger || facts.polyphagia) dietScore -= 10
    if (facts.excessive_thirst || facts.symptom_excessive_thirst || facts.polydipsia) dietScore -= 8
    dietScore = Math.max(30, Math.min(98, dietScore))

    // 3. Physical Activity Score
    let activityScore = 75
    if (facts.sedentary_lifestyle || facts.physical_activity_low || patientProfile?.sedentary_lifestyle) {
      activityScore = 45
    } else if (patientPlan?.procedures?.some((p) => (p.title || '').toLowerCase().includes('walk') || (p.title || '').toLowerCase().includes('exercise'))) {
      activityScore = 82
    } else if (latestResult) {
      const d = String(latestResult.diagnosis || '').toLowerCase()
      if (d.includes('normal') || d.includes('low risk')) activityScore = 85
      else activityScore = 68
    }

    // 4. Medication Adherence Score
    let medScore = 90
    if (patientPlan?.adherenceRate) {
      const parsed = parseInt(patientPlan.adherenceRate, 10)
      if (!Number.isNaN(parsed)) medScore = parsed
    } else if (patientPlan?.medications?.length) {
      medScore = 85
    } else if (latestResult) {
      const d = String(latestResult.diagnosis || '').toLowerCase()
      if (d.includes('normal') || d.includes('low risk') || d.includes('prediabetes')) {
        medScore = 95
      } else {
        medScore = 60
      }
    }

    // 5. Sleep & Energy Score
    let sleepScore = 85
    if (facts.fatigue || facts.symptom_fatigue) sleepScore -= 18
    if (facts.dizziness || facts.symptom_dizziness) sleepScore -= 10
    if (facts.frequent_urination || facts.symptom_frequent_urination || facts.polyuria) sleepScore -= 12
    sleepScore = Math.max(35, Math.min(95, sleepScore))

    // 6. Cardiovascular & Prevention Score
    let cardioScore = 88
    if (facts.hypertension || patientProfile?.hypertension) cardioScore -= 22
    if (facts.smoking || patientProfile?.smoking) cardioScore -= 18
    if (facts.high_cholesterol || patientProfile?.high_cholesterol) cardioScore -= 12
    if (facts.age && Number(facts.age) >= 55) cardioScore -= 8
    cardioScore = Math.max(30, Math.min(98, cardioScore))

    const overall = Math.round(
      (glucoseScore + dietScore + activityScore + medScore + sleepScore + cardioScore) / 6
    )

    return {
      hasData: true,
      data: [
        { metric: isKhmer ? 'កម្រិតជាតិស្ករ' : 'Glucose Control', value: glucoseScore, fullMark: 100 },
        { metric: isKhmer ? 'របបអាហារ' : 'Diet Balance', value: dietScore, fullMark: 100 },
        { metric: isKhmer ? 'សកម្មភាព' : 'Activity', value: activityScore, fullMark: 100 },
        { metric: isKhmer ? 'ថ្នាំពេទ្យ' : 'Medication', value: medScore, fullMark: 100 },
        { metric: isKhmer ? 'ការគេង' : 'Sleep Quality', value: sleepScore, fullMark: 100 },
        { metric: isKhmer ? 'បេះដូង' : 'Cardiovascular', value: cardioScore, fullMark: 100 },
      ],
      overall,
      glucoseScore,
      dietScore,
      medScore,
    }
  }, [currentA1c, currentGlucose, currentBmi, isUrgent, facts, patientProfile, patientPlan, latestResult, patientResults, isKhmer])

  // Reported symptoms for the latest assessment details card
  const reportedSymptoms = useMemo(() => {
    return getReportedSymptomLabels(latestResult, t)
  }, [latestResult, t])

  if (loading && !patientResults.length && !patientProfile) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-w-0 pb-10">
      <ErrorAlert message={error} />

      {/* ==================================================================== */}
      {/* 2-COLUMN MASTER LAYOUT: Left Content (72%) + Right Calendar Rail (28%) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start xl:items-stretch">
        {/* ================================================================== */}
        {/* LEFT COLUMN: Main Dashboard (Metrics, Charts, Clinical Summary)    */}
        {/* ================================================================== */}
        <div className="xl:col-span-8 space-y-6 min-w-0">
          {/* 1. TOP HERO: Clean Status Banner (Pure White, Crisp Border, Brand Buttons) */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  {formattedToday}
                </span>

                {isUrgent ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/90 bg-rose-50/90 px-3 py-1 text-xs font-semibold text-rose-700 shadow-2xs dark:border-rose-800/70 dark:bg-rose-950/60 dark:text-rose-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {isKhmer ? 'ត្រូវការការយកចិត្តទុកដាក់' : 'Attention Required'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-2xs dark:border-emerald-800/70 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {isKhmer ? 'ល្អប្រសើរ • ការតាមដានជាប្រចាំ' : 'Optimal • Routine Monitoring'}
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
                  <span>{isKhmer ? 'ចាប់ផ្តើមការវាយតម្លៃ' : 'Start Assessment'}</span>
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
                  <span>{isKhmer ? 'មើលរបាយការណ៍ពេញលេញ' : 'View Full Report'}</span>
                </Link>
              </div>

              {lastAssessmentDate && (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{isKhmer ? `ពិនិត្យចុងក្រោយ៖ ${lastAssessmentDate}` : `Last check: ${lastAssessmentDate}`}</span>
                </span>
              )}
            </div>
          </div>

          {/* 2. TOP METRICS ROW: 3 Modern Vitals Cards (Connected to real clinical records) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: HbA1c */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-150 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isKhmer ? 'កម្រិត HbA1c' : 'HbA1c Level'}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    a1cDeltaTone === 'rose' && 'bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-950/60 dark:text-rose-300',
                    a1cDeltaTone === 'amber' && 'bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-950/60 dark:text-amber-300',
                    a1cDeltaTone === 'emerald' && 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-300',
                    a1cDeltaTone === 'slate' && 'bg-slate-50 text-slate-600 border border-slate-200/70 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  {a1cDeltaText}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {currentA1c !== null ? currentA1c.toFixed(1) : '--'}
                </span>
                {currentA1c !== null && <span className="text-sm font-medium text-slate-400">%</span>}
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>{isKhmer ? 'គោលដៅ: < 5.7%' : 'Target: < 5.7%'}</span>
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
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isKhmer ? 'ជាតិស្ករពេលព្រឹក' : 'Fasting Glucose'}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    glucoseDeltaTone === 'rose' && 'bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-950/60 dark:text-rose-300',
                    glucoseDeltaTone === 'amber' && 'bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-950/60 dark:text-amber-300',
                    glucoseDeltaTone === 'emerald' && 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-300',
                    glucoseDeltaTone === 'slate' && 'bg-slate-50 text-slate-600 border border-slate-200/70 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  {glucoseDeltaText}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {currentGlucose !== null ? currentGlucose : '--'}
                </span>
                {currentGlucose !== null && <span className="text-xs font-medium text-slate-400">mg/dL</span>}
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>{isKhmer ? 'គោលដៅ: 70–99' : 'Target: 70–99'}</span>
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
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isKhmer ? 'សន្ទស្សន៍ម៉ាសរាងកាយ' : 'Body Mass Index'}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    bmiDeltaTone === 'rose' && 'bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-950/60 dark:text-rose-300',
                    bmiDeltaTone === 'amber' && 'bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-950/60 dark:text-amber-300',
                    bmiDeltaTone === 'emerald' && 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-300',
                    bmiDeltaTone === 'slate' && 'bg-slate-50 text-slate-600 border border-slate-200/70 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  {bmiDeltaText}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {currentBmi !== null ? currentBmi.toFixed(1) : '--'}
                </span>
                {currentBmi !== null && <span className="text-xs font-medium text-slate-400">kg/m²</span>}
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>{isKhmer ? 'គោលដៅ: 18.5–24.9' : 'Target: 18.5–24.9'}</span>
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

          {/* 3. CHARTS ROW: Real Glucose Trend + Metabolic Balance Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Health Assessment Trend (7 cols) */}
            <div className="lg:col-span-7 min-w-0 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      {isKhmer ? 'ប្រវត្តិនិន្នាការសុខភាព' : 'Health Assessment Trend'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'ការវិវត្តហានិភ័យ និងការប្រៀបធៀបតាមការវាយតម្លៃនីមួយៗ' : 'Risk progression & comparison across evaluations'}
                    </p>
                  </div>

                  {latestAssessmentPoint ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                          latestAssessmentPoint.score < 35
                            ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : latestAssessmentPoint.score < 65
                              ? 'border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'border-rose-200/70 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300'
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            latestAssessmentPoint.score < 35
                              ? 'bg-emerald-500'
                              : latestAssessmentPoint.score < 65
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                          )}
                        />
                        {latestAssessmentPoint.score < 35
                          ? (isKhmer ? 'ហានិភ័យទាប' : 'Low Risk')
                          : latestAssessmentPoint.score < 65
                            ? (isKhmer ? 'ហានិភ័យមធ្យម' : 'Moderate Risk')
                            : (isKhmer ? 'ហានិភ័យខ្ពស់' : 'High Risk')}{' '}
                        ({latestAssessmentPoint.score}%)
                      </span>

                      {assessmentComparison && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border',
                            assessmentComparison.isBaseline
                              ? 'bg-slate-100 text-slate-600 border-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              : assessmentComparison.isImproved
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : assessmentComparison.isWorsened
                                  ? 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                  : 'bg-slate-100 text-slate-600 border-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          )}
                        >
                          {assessmentComparison.text}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {isKhmer ? 'មិនទាន់មានទិន្នន័យ' : 'No evaluations yet'}
                    </span>
                  )}
                </div>

                {healthTrendData.length > 0 ? (
                  <div className="mt-4 h-56 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={healthTrendData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="healthMainGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.20} />
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
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tickFormatter={(v) => `${v}%`}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                        />

                        <Tooltip content={<ChartCustomTooltip isKhmer={isKhmer} />} />

                        {/* Green Shaded Target Low Risk Zone (0–35%) */}
                        <ReferenceArea
                          y1={0}
                          y2={35}
                          fill="#10b981"
                          fillOpacity={0.08}
                          stroke="#10b981"
                          strokeOpacity={0.25}
                          strokeDasharray="3 3"
                        />

                        {/* Red Alert Line (70%) */}
                        <ReferenceLine
                          y={70}
                          stroke="#f43f5e"
                          strokeDasharray="3 3"
                          strokeOpacity={0.45}
                        />

                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          fill="url(#healthMainGradient)"
                          dot={{
                            r: 4,
                            fill: '#3b82f6',
                            strokeWidth: 2,
                            stroke: '#ffffff',
                          }}
                          activeDot={{
                            r: 6,
                            fill: '#2563eb',
                            stroke: '#ffffff',
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-56 sm:h-64 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50 mt-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400 mb-3">
                      <HeartPulse className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {isKhmer ? 'មិនទាន់មានការវាយតម្លៃសុខភាពនៅឡើយទេ' : 'No Health Assessments Yet'}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
                      {isKhmer
                        ? 'បំពេញការវាយតម្លៃគ្លីនិកដំបូងរបស់អ្នក ដើម្បីចាប់ផ្តើមតាមដាននិន្នាការសុខភាព និងប្រៀបធៀបការវាយតម្លៃបន្តបន្ទាប់។'
                        : 'Complete your first clinical assessment to start plotting your health trend and compare future evaluations.'}
                    </p>
                    <Link
                      to="/diagnosis"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 shadow-xs transition-colors"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>{isKhmer ? 'ចាប់ផ្តើមការវាយតម្លៃ' : 'Start Assessment'}</span>
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 dark:border-slate-800">
                <span>
                  {healthTrendData.length > 0
                    ? (isKhmer ? `បង្ហាញការវាយតម្លៃសុខភាព ${healthTrendData.length} លើក` : `Showing ${healthTrendData.length} clinical evaluations`)
                    : (isKhmer ? 'រង់ចាំការវាយតម្លៃដំបូង' : 'Awaiting first evaluation')}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="inline-block h-2 w-2 rounded-xs bg-emerald-500/20 border border-emerald-500/50" />
                  {isKhmer ? 'តំបន់ហានិភ័យទាប (< ៣៥%)' : 'Low risk target zone (< 35%)'}
                </span>
              </div>
            </div>

            {/* Metabolic Health Radar (5 cols - Dynamic from Real Facts) */}
            <div className="lg:col-span-5 min-w-0 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      {isKhmer ? 'តុល្យភាពសុខភាព' : 'Health Balance'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'សន្ទស្សន៍គ្រប់គ្រងជំងឺទឹកនោមផ្អែមសរុប' : 'Holistic diabetes management index'}
                    </p>
                  </div>
                  {radarMetrics.hasData ? (
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded-md">
                      {radarMetrics.overall} / 100
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      -- / 100
                    </span>
                  )}
                </div>

                {/* Radar Chart or Clean Empty State */}
                {radarMetrics.hasData ? (
                  <div className="h-52 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarMetrics.data}>
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
                ) : (
                  <div className="flex h-52 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50 mt-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mb-2.5">
                      <Scale className="h-5 w-5" />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isKhmer ? 'មិនទាន់មានទិន្នន័យតុល្យភាព' : 'No Balance Data Yet'}
                    </h4>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 max-w-[220px] leading-relaxed">
                      {isKhmer
                        ? 'បំពេញការវាយតម្លៃគ្លីនិកដំបូងរបស់អ្នក ដើម្បីគណនាតុល្យភាពមេតាបូលីកលើកម្រិតជាតិស្ករ និងរបៀបរស់នៅ។'
                        : 'Complete your initial clinical assessment to calculate your holistic metabolic balance index.'}
                    </p>
                    <Link
                      to="/diagnosis"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 shadow-xs transition-colors"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>{isKhmer ? 'ចាប់ផ្តើមការវាយតម្លៃ' : 'Start Assessment'}</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Metric Breakdown Strip */}
              <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center dark:border-slate-800">
                <div className="rounded-lg bg-slate-50/70 dark:bg-slate-800/40 p-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{isKhmer ? 'ជាតិស្ករ' : 'Glucose'}</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {radarMetrics.hasData ? `${radarMetrics.glucoseScore}%` : '--'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50/70 dark:bg-slate-800/40 p-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{isKhmer ? 'របបអាហារ' : 'Diet'}</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {radarMetrics.hasData ? `${radarMetrics.dietScore}%` : '--'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50/70 dark:bg-slate-800/40 p-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{isKhmer ? 'ថ្នាំពេទ្យ' : 'Meds'}</p>
                  <p className={cn(
                    "text-xs font-bold",
                    radarMetrics.hasData ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"
                  )}>
                    {radarMetrics.hasData ? `${radarMetrics.medScore}%` : '--'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. BOTTOM SECTION: Latest Assessment & Clinical Summary (Real Data) */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {isKhmer ? 'ព័ត៌មានលម្អិតនៃការវាយតម្លៃចុងក្រោយ' : 'Latest Assessment Details'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isKhmer ? 'លទ្ធផលប្រព័ន្ធជំនាញគ្លីនិក និងកំណត់ចំណាំវេជ្ជបណ្ឌិត' : 'Clinical expert system findings and physician notes'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">
                  {latestResult?.id
                    ? `#DIAG-${String(latestResult.id).padStart(4, '0')}`
                    : '#DIAG-BASELINE'}
                </span>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {latestResult?.reviewed_at
                    ? (isKhmer ? 'បានផ្ទៀងផ្ទាត់ដោយគ្រូពេទ្យ' : 'Physician Verified')
                    : (isKhmer ? 'បានបញ្ចប់' : 'Complete')}
                </span>
              </div>
            </div>

            {/* Patient Header & Symptoms Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {patientDisplayName || (isKhmer ? 'ប្រវត្តិរូបអ្នកជំងឺ' : 'Patient Profile')}
                </h4>
                <p className="text-xs text-slate-500">
                  {patientAge ? (isKhmer ? `${patientAge} ឆ្នាំ` : `${patientAge} years`) : (isKhmer ? 'មនុស្សពេញវ័យ' : 'Adult')} • {patientGender}
                </p>
              </div>

              {/* Symptom Tags */}
              <div className="flex flex-wrap items-center gap-1.5">
                {reportedSymptoms.length > 0 ? (
                  reportedSymptoms.map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {isKhmer ? 'ការពិនិត្យតាមកាលកំណត់' : 'Routine Check'}
                  </span>
                )}
                {isUrgent ? (
                  <span className="rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-xs font-semibold dark:bg-rose-950/60 dark:text-rose-300">
                    {isKhmer ? 'ហានិភ័យខ្ពស់' : 'High Risk'}
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold dark:bg-emerald-950/60 dark:text-emerald-300">
                    {isKhmer ? 'មានលំនឹងល្អ' : 'Stable'}
                  </span>
                )}
              </div>
            </div>

            {/* Structured Medical Record Rows */}
            <div className="mt-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1">
                <span className="sm:col-span-3 font-semibold text-slate-400">{isKhmer ? 'ពិនិត្យចុងក្រោយ' : 'Last Checked'}</span>
                <span className="sm:col-span-9 font-medium text-slate-800 dark:text-slate-200">
                  {latestResult?.reviewed_by_name
                    ? (latestResult.reviewed_by_name.startsWith('Dr.')
                        ? latestResult.reviewed_by_name
                        : `Dr. ${latestResult.reviewed_by_name}`)
                    : latestResult?.diagnosed_by_name
                    ? (isKhmer ? `វាយតម្លៃដោយ ${latestResult.diagnosed_by_name}` : `Evaluated by ${latestResult.diagnosed_by_name}`)
                    : (isKhmer ? 'ប្រព័ន្ធជំនាញគ្លីនិកជំងឺទឹកនោមផ្អែម' : 'Diabetes Expert Clinical System')}{' '}
                  {isKhmer ? 'នៅថ្ងៃ ' : 'on '} {lastAssessmentDate || (isKhmer ? 'កម្រិតគោលថ្មីៗ' : 'Recent Baseline')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="sm:col-span-3 font-semibold text-slate-400">{isKhmer ? 'ការសង្កេត' : 'Observation'}</span>
                <span className="sm:col-span-9 font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {isKhmer ? (
                    <>
                      កម្រិតជាតិស្ករក្នុងប្លាស្មាពេលព្រឹកកត់ត្រាបាន {currentGlucose !== null ? `${currentGlucose} mg/dL` : 'រង់ចាំការធ្វើតេស្ត'}។ កម្រិត HbA1c ថ្មីៗ {currentA1c !== null ? `${currentA1c}%` : 'រង់ចាំលទ្ធផលមន្ទីរពិសោធន៍'}។ សន្ទស្សន៍ BMI គណនាបាន {currentBmi !== null ? `${currentBmi} kg/m²` : 'មិនបានបញ្ជាក់'}។
                      {reportedSymptoms.length > 0 &&
                        ` អ្នកជំងឺបានរាយការណ៍អំពីរោគសញ្ញារួមមាន៖ ${reportedSymptoms.slice(0, 3).join(', ')}.`}
                    </>
                  ) : (
                    <>
                      Fasting plasma glucose recorded at{' '}
                      {currentGlucose !== null ? `${currentGlucose} mg/dL` : 'pending test'}. Recent HbA1c at{' '}
                      {currentA1c !== null ? `${currentA1c}%` : 'pending lab'}. Calculated BMI is{' '}
                      {currentBmi !== null ? `${currentBmi} kg/m²` : 'unspecified'}.
                      {reportedSymptoms.length > 0 &&
                        ` Patient reported symptoms including: ${reportedSymptoms.slice(0, 3).join(', ')}.`}
                    </>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="sm:col-span-3 font-semibold text-slate-400">{isKhmer ? 'រោគវិនិច្ឆ័យ' : 'Diagnosis'}</span>
                <span className="sm:col-span-9 font-semibold text-slate-900 dark:text-slate-100">
                  {latestResult?.diagnosis
                    ? (tExact ? tExact(latestResult.diagnosis) : latestResult.diagnosis)
                    : (isKhmer ? 'ណែនាំឱ្យធ្វើការពិនិត្យដំបូង' : 'Initial screening recommended')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="sm:col-span-3 font-semibold text-slate-400">{isKhmer ? 'វេជ្ជបញ្ជា / ពិធីការ' : 'Prescription / Protocol'}</span>
                <div className="sm:col-span-9 space-y-0.5 font-medium text-slate-800 dark:text-slate-200">
                  <p>
                    {latestResult?.recommendation
                      ? (typeof latestResult.recommendation === 'string'
                          ? latestResult.recommendation.split('.')[0] + '.'
                          : Array.isArray(latestResult.recommendation) && latestResult.recommendation.length > 0
                          ? String(latestResult.recommendation[0])
                          : (isKhmer ? 'ការថែទាំរបបអាហារ និងលំហាត់ប្រាណជាប្រចាំ។' : 'Routine dietary and physical activity maintenance.'))
                      : (isKhmer ? 'ការថែទាំរបបអាហារ និងលំហាត់ប្រាណជាប្រចាំ។' : 'Routine dietary and physical activity maintenance.')}
                  </p>
                  <p className="text-slate-500">
                    {isKhmer
                      ? 'របៀបរស់នៅ៖ ដើរលឿន ៣០ នាទីរាល់ថ្ងៃ • គោលដៅជាតិស្ករពេលព្រឹក 80–130 mg/dL'
                      : 'Lifestyle: 30-min brisk walk daily • Target fasting glucose 80–130 mg/dL'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="sm:col-span-3 font-semibold text-slate-400">{isKhmer ? 'កំណត់ចំណាំគ្រូពេទ្យ' : 'Doctor Notes'}</span>
                <span className="sm:col-span-9 text-slate-600 dark:text-slate-300 leading-relaxed">
                  {latestResult?.review_note
                    ? `“${latestResult.review_note}”`
                    : latestResult?.explanation_trace?.evidence_summary ||
                      (typeof latestResult?.recommendation === 'string'
                        ? latestResult.recommendation
                        : Array.isArray(latestResult?.recommendation)
                        ? latestResult.recommendation.join(' ')
                        : (isKhmer
                            ? 'ការវាយតម្លៃត្រូវបានកត់ត្រាក្នុងបញ្ជីត្រួតពិនិត្យគ្លីនិក។ ការចុះហត្ថលេខាផ្លូវការរបស់គ្រូពេទ្យនឹងបង្ហាញនៅពេលពិនិត្យរួច។'
                            : 'Assessment logged in clinical review queue. Official physician sign-off will appear upon review.'))}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {isKhmer ? 'ធ្វើបច្ចុប្បន្នភាពដោយស្វ័យប្រវត្តិពីការពិគ្រោះគ្លីនិក' : 'Updated automatically from clinical consultations'}
              </span>
              <Link
                to={latestResult?.id ? `/diagnosis/result?diagnosis_result_id=${latestResult.id}` : '/my-results'}
                className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:underline inline-flex items-center gap-1"
              >
                <span>{isKhmer ? 'មើលឯកសារគ្លីនិកពេញលេញ' : 'View Complete Clinical Documentation'}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* RIGHT COLUMN: Interactive Calendar & Care Schedule Timeline        */}
        {/* ================================================================== */}
        <div className="xl:col-span-4 min-w-0 flex flex-col h-full rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
          {/* 1. CALENDAR STRIP */}
          <div className="shrink-0">
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
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {selectedDateLabel}
              </h3>
            </div>

            {/* Filter Dropdown (only when daily tasks exist) */}
            {dailySchedule.length > 0 && (
              <div className="relative shrink-0">
                <select
                  value={timelineFilter}
                  onChange={(e) => setTimelineFilter(e.target.value)}
                  className="appearance-none rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 pr-6 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">{isKhmer ? 'ទាំងអស់' : 'All'}</option>
                  <option value="glucose">{isKhmer ? 'ជាតិស្ករ' : 'Glucose'}</option>
                  <option value="meds">{isKhmer ? 'ថ្នាំ' : 'Meds'}</option>
                  <option value="activity">{isKhmer ? 'សកម្មភាព' : 'Activity'}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              </div>
            )}
          </div>

          {/* 3. TIMELINE BODY: Empty State for New Users vs Live Schedule Rail */}
          {dailySchedule.length === 0 ? (
            <div className="mt-5 flex-1 min-h-[280px] rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 sm:p-8 text-center dark:border-slate-800 dark:bg-slate-900/50 flex flex-col items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 mb-3">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {isNewUser
                  ? (isKhmer ? 'មិនទាន់មានកាលវិភាគថែទាំនៅឡើយទេ' : 'No Care Schedule Yet')
                  : (isKhmer ? 'មិនមានសកម្មភាពសម្រាប់ថ្ងៃនេះទេ' : 'No Activities Scheduled for This Day')}
              </h4>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                {isNewUser
                  ? (isKhmer
                      ? 'សូមបំពេញការវាយតម្លៃគ្លីនិកដំបូងរបស់អ្នក ដើម្បីបង្កើតកាលវិភាគថែទាំផ្ទាល់ខ្លួន ការរំលឹកថ្នាំ និងសកម្មភាពសុខភាពប្រចាំថ្ងៃ។'
                      : 'Complete your initial clinical assessment to generate your personalized daily care schedule, reminders, and health milestones.')
                  : (isKhmer
                      ? 'អ្នកមិនមានកិច្ចការថែទាំដែលបានកំណត់សម្រាប់កាលបរិច្ឆេទនេះទេ។ អ្នកអាចពិនិត្យមើលផែនការថែទាំទាំងមូលបានគ្រប់ពេល។'
                      : 'You have no scheduled care tasks for this date. You can review your overall care plan anytime.')}
              </p>
              {isNewUser ? (
                <Link
                  to="/diagnosis"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary-700 shadow-xs transition-colors"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isKhmer ? 'ចាប់ផ្តើមការវាយតម្លៃ' : 'Start Assessment'}</span>
                </Link>
              ) : canViewOwnCarePlan ? (
                <Link
                  to="/care-plan"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                >
                  <span>{isKhmer ? 'មើលផែនការថែទាំ' : 'View Care Plan'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="mt-5 flex-1 min-h-0 flex flex-col">
              {/* VERTICAL TIMELINE RAIL (Dashed Line & Centered Node Dots) */}
              <div className="relative flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                <div className="flex flex-col">
                  {filteredSchedule.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                      {isKhmer ? 'មិនមានកិច្ចការក្នុងប្រភេទនេះទេ' : 'No tasks in this category'}
                    </div>
                  ) : (
                    <>
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
                            <div className="grid grid-cols-[48px_20px_1fr] gap-3 pb-4 last:pb-0 relative group">
                              {/* 1. Left Time Column (Fixed 48px, right-aligned) */}
                              <div className="text-right pt-3">
                                <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500 tabular-nums select-none">
                                  {item.time}
                                </span>
                              </div>

                              {/* 2. Timeline Center Track & Node Dot (Exact Center Aligned) */}
                              <div className="relative flex justify-center h-full pt-3.5">
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
                                  {item.actionLink && !isCompleted ? (
                                    <Link
                                      to={item.actionLink}
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                                    >
                                      <span>{item.actionLabel || (isKhmer ? 'ចាប់ផ្តើម' : 'Start now')}</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </Link>
                                  ) : (
                                    <span className="truncate max-w-[170px]">{item.location}</span>
                                  )}
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
                    </>
                  )}
                </div>
              </div>

              {/* Timeline Bottom CTA */}
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
                <span className="text-slate-400">
                  {isKhmer
                    ? `បានបញ្ចប់ ${completedTasks.length} ក្នុងចំណោម ${dailySchedule.length}`
                    : `${completedTasks.length} of ${dailySchedule.length} completed`}
                </span>
                {canViewOwnCarePlan && (
                  <Link
                    to="/care-plan"
                    className="font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
                  >
                    <span>{isKhmer ? 'ផែនការថែទាំពេញលេញ' : 'Full Care Plan'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
