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
  BookOpen,
  Calendar,
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
import { getTreatmentPlanForUser } from '@/lib/treatmentPlanStore'
import {
  getReportedSymptomLabels,
  getRelativeCheckAge,
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

function getGreeting(name) {
  const hour = new Date().getHours()
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

/** Builds real dynamic daily schedule from patient's treatment plan and assessments */
function buildPatientDailySchedule(patientPlan, latestResult, isNewUser = false, isKhmer = false) {
  // ========================================================================
  // CASE A: NEW USER (No clinical assessment yet, or first day onboarding)
  // ========================================================================
  if (isNewUser) {
    return [
      {
        id: 'new_sched_screening',
        time: '09:00',
        timeEnd: '09:30',
        category: isKhmer ? 'ការវាយតម្លៃ' : 'Assessment',
        badgeTone: 'purple',
        title: isKhmer ? 'បំពេញការវាយតម្លៃហានិភ័យទឹកនោមផ្អែម' : 'Complete Diabetes Risk Screening',
        subtitle: isKhmer
          ? 'ឆ្លើយសំណួរអំពី រោគសញ្ញា និងប្រវត្តិគ្រួសារ ដើម្បីទទួលបានការវិភាគ AI ភ្លាមៗ'
          : 'Answer quick questions about symptoms and family history for instant AI analysis',
        location: isKhmer ? 'ប្រព័ន្ធវិភាគរោគវិនិច្ឆ័យ' : 'AI Diagnostic Engine',
        icon: ClipboardList,
        actionLink: '/diagnosis',
        actionLabel: isKhmer ? 'ចាប់ផ្តើមឥឡូវនេះ' : 'Start Screening',
      },
      {
        id: 'new_sched_profile',
        time: '10:30',
        timeEnd: '11:00',
        category: isKhmer ? 'ប្រវត្តិរូប' : 'Profile',
        badgeTone: 'sky',
        title: isKhmer ? 'បំពេញប្រវត្តិរូបអ្នកជំងឺ និងទិន្នន័យសុខភាព' : 'Complete Health Profile & Vitals',
        subtitle: isKhmer
          ? 'បញ្ចូលអាយុ ទម្ងន់ កម្ពស់ ដើម្បីគណនាសន្ទស្សន៍ BMI និងកម្រិតហានិភ័យមូលដ្ឋាន'
          : 'Record age, height, and weight to establish your baseline BMI and risk category',
        location: isKhmer ? 'ការកំណត់ប្រវត្តិរូប' : 'Patient Profile Setup',
        icon: User,
        actionLink: '/profile-setup',
        actionLabel: isKhmer ? 'កំណត់ប្រវត្តិរូប' : 'Set Up Profile',
      },
      {
        id: 'new_sched_glucose',
        time: '12:00',
        timeEnd: '12:20',
        category: isKhmer ? 'កម្រិតជាតិស្ករ' : 'Biomarkers',
        badgeTone: 'amber',
        title: isKhmer ? 'កត់ត្រាកម្រិតជាតិស្ករក្នុងឈាមដំបូង' : 'Log Baseline Fasting Glucose',
        subtitle: isKhmer
          ? 'ប្រសិនបើមានលទ្ធផលតេស្តជាតិស្ករ ឬ HbA1c ថ្មីៗ សូមបញ្ចូលដើម្បីបង្កើនភាពជាក់លាក់'
          : 'Enter your recent fasting glucose or HbA1c lab result if available to sharpen results',
        location: isKhmer ? 'ឧបករណ៍តាមដានសុខភាព' : 'Biomarker Tracker',
        icon: Droplets,
        actionLink: '/diagnosis',
        actionLabel: isKhmer ? 'បញ្ចូលទិន្នន័យ' : 'Log Reading',
      },
      {
        id: 'new_sched_drbot',
        time: '15:00',
        timeEnd: '15:30',
        category: isKhmer ? 'ជំនួយការ AI' : 'Orientation',
        badgeTone: 'emerald',
        title: isKhmer ? 'ជជែកជាមួយ Dr. Bot AI Health Assistant' : 'Consult Dr. Bot AI Health Assistant',
        subtitle: isKhmer
          ? 'ស្វែងយល់ពីរបៀបរស់នៅដែលមានសុខភាពល្អ អាហារូបត្ថម្ភ និងការការពារជំងឺទឹកនោមផ្អែម'
          : 'Ask questions about diabetes prevention, nutrition tips, and symptom signs',
        location: isKhmer ? 'ជំនួយការ Dr. Bot' : 'Dr. Bot Assistant',
        icon: Sparkles,
      },
      {
        id: 'new_sched_guide',
        time: '18:30',
        timeEnd: '19:00',
        category: isKhmer ? 'របៀបរស់នៅ' : 'Lifestyle',
        badgeTone: 'slate',
        title: isKhmer ? 'អានមគ្គុទ្ទេសក៍អប់រំអំពីជំងឺទឹកនោមផ្អែម' : 'Review Diabetes Education Guide',
        subtitle: isKhmer
          ? 'ស្វែងយល់ពីសន្ទស្សន៍ Glycemic ការទទួលទានទឹក និងការធ្វើលំហាត់ប្រាណស្រាលៗ'
          : 'Learn foundational concepts on glycemic index, healthy hydration, and light cardio',
        location: isKhmer ? 'បណ្ណាល័យសុខភាព' : 'Care Library',
        icon: BookOpen,
        actionLink: '/diabetes-guide',
        actionLabel: isKhmer ? 'អានមគ្គុទ្ទេសក៍' : 'View Guide',
      },
    ]
  }

  // ========================================================================
  // CASE B: PATIENT WITH CLINICAL ASSESSMENT / ACTIVE CARE PLAN
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
      ? `តេស្តមុនអាហារពេលព្រឹក • គោលដៅ: ${patientPlan?.targetGlucose || '80–130 mg/dL'}`
      : `Fasting test before breakfast • Target: ${patientPlan?.targetGlucose || '80–130 mg/dL'}`,
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

  // 4. Clinical Consultation / Physician Review Follow-up
  const docName = latestResult?.reviewed_by_name
    ? (latestResult.reviewed_by_name.startsWith('Dr.') ? latestResult.reviewed_by_name : `Dr. ${latestResult.reviewed_by_name}`)
    : (patientPlan?.doctorName || 'Dr. Lina')

  items.push({
    id: 'sched_doctor_pm',
    time: '15:00',
    timeEnd: '15:30',
    category: isKhmer ? 'ការពិគ្រោះ' : 'Consultation',
    badgeTone: 'purple',
    title: latestResult?.review_note
      ? (isKhmer ? 'ការតាមដានការត្រួតពិនិត្យគ្លីនិក' : 'Clinical Review Follow-up')
      : (isKhmer ? 'ការពិនិត្យតាមដាន Endocrinology' : 'Endocrinology Check-in'),
    subtitle: `${docName} • ${isKhmer ? 'ក្រុមថែទាំជំងឺទឹកនោមផ្អែម' : 'Diabetes Care Team Review'}`,
    location: isKhmer ? 'វិបផតថលថែទាំគ្លីនិក' : 'Clinical Care Portal',
    icon: Stethoscope,
  })

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
    title: isKhmer ? 'ការទទួលទានទឹក និងការសម្រាក' : 'Evening Hydration & Meds',
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
      {data.diagnosis && (
        <p className="mt-1 text-[11px] text-slate-400 truncate max-w-[200px]">{data.diagnosis}</p>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT: PATIENT DASHBOARD (SAAS DESIGN)
// ============================================================================
export function PatientDashboardPage() {
  const { user } = useAuth()
  const { t, language, isKhmer } = useLanguage()
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
            console.error('Failed to load diagnosis records:', resultsRes.reason)
          }

          if (profileRes.status === 'fulfilled') {
            setPatientProfile(getApiData(profileRes.value) || null)
          } else {
            console.warn('Patient profile endpoint returned:', profileRes.reason)
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

  // Personalized Care Plan
  const patientPlan = useMemo(() => {
    return getTreatmentPlanForUser(user?.name, user?.email)
  }, [user])

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
      ? 'Baseline'
      : 'Pending'

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
        ? { label: 'High', color: 'rose' }
        : currentGlucose >= 100
        ? { label: 'Impaired / Pre-meal', color: 'amber' }
        : { label: 'In Range', color: 'emerald' }
      : { label: 'Not Tested', color: 'slate' }

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
      ? 'Baseline'
      : 'Pending'

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
        ? { label: 'Elevated', color: 'rose' }
        : currentA1c >= 5.7
        ? { label: 'Borderline', color: 'amber' }
        : { label: 'Optimal', color: 'emerald' }
      : { label: 'Not Tested', color: 'slate' }

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
      ? 'Baseline'
      : 'Pending'

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
        ? { label: 'Obese', color: 'rose' }
        : currentBmi >= 25
        ? { label: 'Overweight', color: 'amber' }
        : currentBmi < 18.5
        ? { label: 'Underweight', color: 'amber' }
        : { label: 'Normal', color: 'emerald' }
      : { label: 'Not Provided', color: 'slate' }

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
  const firstName = patientDisplayName.trim().split(/\s+/)[0] || 'Patient'
  const greeting = getGreeting(firstName)

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
    if (!raw) return 'Adult'
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
  }, [patientProfile, facts.gender])

  // 1-Sentence Diagnostic Note
  const diagnosticNote = useMemo(() => {
    if (!latestResult) {
      return 'Complete your initial health assessment to establish your personal metabolic baseline and target metrics.'
    }
    if (latestResult.review_note) {
      return latestResult.review_note
    }
    if (isUrgent) {
      return (
        latestResult.urgent_reason ||
        'Your recent metabolic indicators exceed standard target thresholds. Clinical check-in and medication adherence are recommended.'
      )
    }
    return (
      latestResult.recommendation?.split('.')[0] + '.' ||
      'Your latest metabolic indicators and fasting blood sugar levels remain stable within your personal target zones.'
    )
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

  // ============================================================================
  // REAL HISTORICAL GLUCOSE TREND DATA
  // ============================================================================
  const trendData = useMemo(() => {
    if (!glucoseHistory.length) return []

    // Take up to 10 most recent records and sort chronologically (oldest to newest)
    const recent = [...glucoseHistory.slice(0, 10)].reverse()

    // Deduplicate or label with time if on the same day
    const dayCounts = {}
    recent.forEach((item) => {
      const d = new Date(item.date)
      const dayKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1
    })

    const daySeen = {}
    return recent.map((item) => {
      const d = new Date(item.date)
      const dayKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const hasMultiple = dayCounts[dayKey] > 1
      daySeen[dayKey] = (daySeen[dayKey] || 0) + 1

      const label = hasMultiple
        ? `${dayKey} (#${daySeen[dayKey]})`
        : dayKey

      const fullDate = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })

      return {
        day: label,
        fullDate,
        glucose: Math.round(item.value),
        diagnosis: item.diagnosis,
      }
    })
  }, [glucoseHistory])

  const avgGlucose = useMemo(() => {
    if (!trendData.length) return currentGlucose ?? '--'
    return Math.round(trendData.reduce((acc, curr) => acc + curr.glucose, 0) / trendData.length)
  }, [trendData, currentGlucose])

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

  // Is this user a brand-new patient (no diagnosis results or assigned plan)
  const isNewUser = useMemo(() => {
    if (patientResults && patientResults.length > 0) return false
    if (patientPlan && patientPlan.patientName && user?.name &&
        patientPlan.patientName.toLowerCase().trim() === user.name.toLowerCase().trim()) {
      return false
    }
    return true
  }, [patientResults, patientPlan, user])

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
    // 1. Glucose Control Score (0 - 100)
    let glucoseScore = 80
    if (currentA1c !== null || currentGlucose !== null) {
      if ((currentA1c !== null && currentA1c < 5.7) && (currentGlucose !== null && currentGlucose < 100)) {
        glucoseScore = 95
      } else if ((currentA1c !== null && currentA1c <= 6.4) || (currentGlucose !== null && currentGlucose <= 125)) {
        glucoseScore = 82
      } else if ((currentA1c !== null && currentA1c <= 7.9) || (currentGlucose !== null && currentGlucose <= 160)) {
        glucoseScore = 65
      } else {
        glucoseScore = 48
      }
    } else if (isUrgent) {
      glucoseScore = 55
    }

    // 2. Diet Balance Score
    let dietScore = 85
    if (currentBmi && currentBmi >= 30) dietScore -= 18
    else if (currentBmi && currentBmi >= 25) dietScore -= 10
    if (facts.high_cholesterol || patientProfile?.high_cholesterol) dietScore -= 10
    if (facts.excessive_hunger || facts.symptom_excessive_hunger) dietScore -= 8
    dietScore = Math.max(40, Math.min(98, dietScore))

    // 3. Physical Activity Score
    let activityScore = 85
    if (facts.sedentary_lifestyle || facts.physical_activity_low || patientProfile?.sedentary_lifestyle) {
      activityScore = 52
    }

    // 4. Medication Adherence Score
    let medScore = 92
    if (patientPlan?.adherenceRate) {
      const parsed = parseInt(patientPlan.adherenceRate, 10)
      if (!Number.isNaN(parsed)) medScore = parsed
    }

    // 5. Sleep & Energy Score
    let sleepScore = 84
    if (facts.fatigue || facts.symptom_fatigue) sleepScore -= 14
    if (facts.dizziness || facts.symptom_dizziness) sleepScore -= 8
    sleepScore = Math.max(45, Math.min(95, sleepScore))

    // 6. Cardiovascular & Prevention Score
    let cardioScore = 90
    if (facts.hypertension || patientProfile?.hypertension) cardioScore -= 20
    if (facts.smoking || patientProfile?.smoking) cardioScore -= 15
    cardioScore = Math.max(45, Math.min(98, cardioScore))

    const overall = Math.round(
      (glucoseScore + dietScore + activityScore + medScore + sleepScore + cardioScore) / 6
    )

    return {
      data: [
        { metric: 'Glucose Control', value: glucoseScore, fullMark: 100 },
        { metric: 'Diet Balance', value: dietScore, fullMark: 100 },
        { metric: 'Activity', value: activityScore, fullMark: 100 },
        { metric: 'Medication', value: medScore, fullMark: 100 },
        { metric: 'Sleep Quality', value: sleepScore, fullMark: 100 },
        { metric: 'Cardiovascular', value: cardioScore, fullMark: 100 },
      ],
      overall,
      glucoseScore,
      dietScore,
      medScore,
    }
  }, [currentA1c, currentGlucose, currentBmi, isUrgent, facts, patientProfile, patientPlan])

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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
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

          {/* 2. TOP METRICS ROW: 3 Modern Vitals Cards (Connected to real clinical records) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: HbA1c */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-150 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">HbA1c Level</span>
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

          {/* 3. CHARTS ROW: Real Glucose Trend + Metabolic Balance Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Blood Glucose Trend (7 cols) */}
            <div className="lg:col-span-7 min-w-0 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      Glucose Trend History
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

                {trendData.length > 0 ? (
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
                          domain={[60, 200]}
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
                ) : (
                  <div className="flex h-56 sm:h-64 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50 mt-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400 mb-3">
                      <Droplets className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No Glucose Tests Logged Yet
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
                      Complete your first clinical assessment to start plotting real fasting glucose trends against the target zone.
                    </p>
                    <Link
                      to="/diagnosis"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 shadow-xs transition-colors"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Start Assessment</span>
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 dark:border-slate-800">
                <span>
                  {trendData.length > 0
                    ? `Showing ${trendData.length} recorded lab readings`
                    : 'Awaiting lab log'}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="inline-block h-2 w-2 rounded-xs bg-emerald-500/20 border border-emerald-500/50" />
                  Target zone (80–130)
                </span>
              </div>
            </div>

            {/* Metabolic Health Radar (5 cols - Dynamic from Real Facts) */}
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
                    {radarMetrics.overall} / 100
                  </span>
                </div>

                {/* Radar Chart */}
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
              </div>

              {/* Metric Breakdown Strip */}
              <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center dark:border-slate-800">
                <div className="rounded-lg bg-slate-50/70 dark:bg-slate-800/40 p-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Glucose</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {radarMetrics.glucoseScore}%
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50/70 dark:bg-slate-800/40 p-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Diet</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {radarMetrics.dietScore}%
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50/70 dark:bg-slate-800/40 p-1.5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Meds</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {radarMetrics.medScore}%
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
                  Latest Assessment Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Clinical expert system findings and physician notes
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">
                  {latestResult?.id
                    ? `#DIAG-${String(latestResult.id).padStart(4, '0')}`
                    : '#DIAG-BASELINE'}
                </span>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {latestResult?.reviewed_at ? 'Physician Verified' : 'Complete'}
                </span>
              </div>
            </div>

            {/* Patient Header & Symptoms Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {patientDisplayName || 'Patient Profile'}
                </h4>
                <p className="text-xs text-slate-500">
                  {patientAge ? `${patientAge} years` : 'Adult'} • {patientGender}
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
                    Routine Check
                  </span>
                )}
                {isUrgent ? (
                  <span className="rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-xs font-semibold dark:bg-rose-950/60 dark:text-rose-300">
                    High Risk
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold dark:bg-emerald-950/60 dark:text-emerald-300">
                    Stable
                  </span>
                )}
              </div>
            </div>

            {/* Structured Medical Record Rows */}
            <div className="mt-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1">
                <span className="sm:col-span-3 font-semibold text-slate-400">Last Checked</span>
                <span className="sm:col-span-9 font-medium text-slate-800 dark:text-slate-200">
                  {latestResult?.reviewed_by_name
                    ? (latestResult.reviewed_by_name.startsWith('Dr.')
                        ? latestResult.reviewed_by_name
                        : `Dr. ${latestResult.reviewed_by_name}`)
                    : latestResult?.diagnosed_by_name
                    ? `Evaluated by ${latestResult.diagnosed_by_name}`
                    : 'Diabetes Expert Clinical System'}{' '}
                  on {lastAssessmentDate || 'Recent Baseline'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="sm:col-span-3 font-semibold text-slate-400">Observation</span>
                <span className="sm:col-span-9 font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  Fasting plasma glucose recorded at{' '}
                  {currentGlucose !== null ? `${currentGlucose} mg/dL` : 'pending test'}. Recent HbA1c at{' '}
                  {currentA1c !== null ? `${currentA1c}%` : 'pending lab'}. Calculated BMI is{' '}
                  {currentBmi !== null ? `${currentBmi} kg/m²` : 'unspecified'}.
                  {reportedSymptoms.length > 0 &&
                    ` Patient reported symptoms including: ${reportedSymptoms.slice(0, 3).join(', ')}.`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="sm:col-span-3 font-semibold text-slate-400">Diagnosis</span>
                <span className="sm:col-span-9 font-semibold text-slate-900 dark:text-slate-100">
                  {latestResult?.diagnosis || 'Initial screening recommended'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="sm:col-span-3 font-semibold text-slate-400">Prescription / Protocol</span>
                <div className="sm:col-span-9 space-y-0.5 font-medium text-slate-800 dark:text-slate-200">
                  <p>
                    {patientPlan?.pharmacotherapy ||
                      (latestResult?.recommendation
                        ? latestResult.recommendation.split('.')[0] + '.'
                        : 'Routine dietary and physical activity maintenance.')}
                  </p>
                  <p className="text-slate-500">
                    Lifestyle: 30-min brisk walk daily • Target fasting glucose{' '}
                    {patientPlan?.targetGlucose || '80–130 mg/dL'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4 py-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="sm:col-span-3 font-semibold text-slate-400">Doctor Notes</span>
                <span className="sm:col-span-9 text-slate-600 dark:text-slate-300 leading-relaxed">
                  {latestResult?.review_note
                    ? `“${latestResult.review_note}”`
                    : latestResult?.explanation_trace?.evidence_summary ||
                      latestResult?.recommendation ||
                      'Assessment logged in clinical review queue. Official physician sign-off will appear upon review.'}
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
          {/* 1. CALENDAR STRIP */}
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
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {selectedDateLabel}
                </h3>
                {isNewUser && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                    {isKhmer ? 'ផែនការចាប់ផ្តើមដំបូង' : 'Onboarding Plan'}
                  </span>
                )}
              </div>
              {isNewUser && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {isKhmer ? 'បំពេញការពិនិត្យដំបូង ដើម្បីបើកកាលវិភាគថែទាំគ្លីនិកផ្ទាល់ខ្លួន' : 'Complete your initial screening to unlock personalized clinical care.'}
                </p>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="relative shrink-0">
              <select
                value={timelineFilter}
                onChange={(e) => setTimelineFilter(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 pr-6 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">{isKhmer ? 'ទាំងអស់' : 'All'}</option>
                <option value="glucose">{isKhmer ? 'ជាតិស្ករ' : 'Glucose'}</option>
                <option value="meds">{isKhmer ? 'ថ្នាំ/ប្រវត្តិរូប' : 'Meds'}</option>
                <option value="activity">{isKhmer ? 'សកម្មភាព' : 'Activity'}</option>
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
            </div>
          </div>

          {/* Timeline Bottom CTA */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {completedTasks.length} of {dailySchedule.length} completed
            </span>
            <Link
              to={isNewUser ? '/diagnosis' : '/care-plan'}
              className="font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              <span>{isNewUser ? (isKhmer ? 'ចាប់ផ្តើមវាយតម្លៃ' : 'Start Assessment') : (isKhmer ? 'ផែនការថែទាំពេញលេញ' : 'Full Care Plan')}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
