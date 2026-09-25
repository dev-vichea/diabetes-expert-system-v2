import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Apple,
  ArrowRight,
  BarChart2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Droplets,
  FileText,
  Footprints,
  HeartPulse,
  MessageSquare,
  Moon,
  Play,
  PlusCircle,
  Sparkles,
  Stethoscope,
  Target,
  User,
  UserCheck,
  Utensils,
  Zap,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { ErrorAlert, Skeleton, StatCardsSkeleton, CardListSkeleton } from '@/components/ui'
import { cn } from '@/lib/utils'
import { AppointmentCalendarCanvas } from '@/components/dashboard/patient/AppointmentCalendarCanvas'
import { PersonalizedCarePlanSection } from '@/components/care-plan/PersonalizedCarePlanSection'
import { CarePlanGlucoseChart } from '@/components/care-plan/CarePlanGlucoseChart'
import { getTreatmentPlanForUser } from '@/lib/treatmentPlanStore'
import {
  getLatestFacts,
  toNumberOrNull,
} from '@/components/dashboard/patient/patient-dashboard-utils'

const TABS = [
  { id: 'Overview', labelEn: 'Overview', labelKm: 'ទិដ្ឋភាពទូទៅ' },
  { id: 'Care Plan', labelEn: 'Care Plan', labelKm: 'ផែនការថែទាំ' },
  { id: 'Appointments', labelEn: 'Appointments', labelKm: 'ការណាត់ជួប' },
]

const TASK_TRANSLATIONS = {
  'task-glucose-am': {
    titleEn: 'Morning glucose check',
    titleKm: 'ពិនិត្យជាតិស្ករពេលព្រឹក',
    subEn: '08:00 AM · Fasting reading',
    subKm: '០៨:០០ ព្រឹក · ពិនិត្យមុនអាហារ',
  },
  'task-nutrition-am': {
    titleEn: 'Morning Hydration & Balanced Nutrition',
    titleKm: 'ជាតិទឹកពេលព្រឹក និងអាហារមានតុល្យភាព',
    subEn: '08:30 AM · Low glycemic breakfast',
    subKm: '០៨:៣០ ព្រឹក · អាហារពេលព្រឹកជាតិស្ករទាប',
  },
  'task-walk-pm': {
    titleEn: '30-min walk',
    titleKm: 'ដើរលឿន ៣០ នាទី',
    subEn: '12:30 PM · Light aerobic activity',
    subKm: '១២:៣០ ថ្ងៃត្រង់ · លំហាត់ប្រាណកម្រិតស្រាល',
  },
  'task-foot-pm': {
    titleEn: 'Foot & skin check',
    titleKm: 'ពិនិត្យស្បែក និងបាតជើង',
    subEn: '08:00 PM · Check for pressure spots',
    subKm: '០៨:០០ យប់ · ពិនិត្យស្នាមរបួស និងសម្ពាធ',
  },
}

const DEFAULT_TODAY_TASKS = [
  {
    id: 'task-glucose-am',
    title: 'Morning glucose check',
    subtitle: '08:00 AM · Fasting reading',
    completed: false,
    status: 'Scheduled',
  },
  {
    id: 'task-nutrition-am',
    title: 'Morning Hydration & Balanced Nutrition',
    subtitle: '08:30 AM · Low glycemic breakfast',
    completed: false,
    status: 'Scheduled',
  },
  {
    id: 'task-walk-pm',
    title: '30-min walk',
    subtitle: '12:30 PM · Light aerobic activity',
    completed: false,
    status: 'Scheduled',
  },
  {
    id: 'task-foot-pm',
    title: 'Foot & skin check',
    subtitle: '08:00 PM · Check for pressure spots',
    completed: false,
    status: 'Scheduled',
  },
]

export function CarePlanPage() {
  const { user } = useAuth()
  const { t, isKhmer } = useLanguage()
  const location = useLocation()

  // Grab state if navigated directly from assessment result page
  const incomingResult = location.state?.result
  const incomingAssessmentId = location.state?.fromAssessmentId || incomingResult?.id || incomingResult?.diagnosis_result_id

  const [results, setResults] = useState([])
  const [carePlan, setCarePlan] = useState(incomingResult?.care_plan || null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')

  // Interactive Daily Checklist state with local persistence
  const [todayTasks, setTodayTasks] = useState(() => {
    try {
      const saved = window.localStorage.getItem('care_plan_daily_tasks:v3')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0 && !parsed.some((t) => String(t.title).toLowerCase().includes('metformin'))) {
          return parsed
        }
      }
    } catch {}
    return DEFAULT_TODAY_TASKS
  })

  // Safety guideline accordion & highlight trigger
  const [isSafetyExpanded, setIsSafetyExpanded] = useState(true)
  const [highlightSafety, setHighlightSafety] = useState(false)
  const safetySectionRef = useRef(null)

  const patientPlan = useMemo(() => {
    return getTreatmentPlanForUser(user?.name, user?.email)
  }, [user])

  const followUpDateMonth = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toLocaleDateString(isKhmer ? 'km-KH' : 'en-US', { month: 'short' }).toUpperCase()
  }, [isKhmer])

  const followUpDateDay = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return String(d.getDate()).padStart(2, '0')
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem('care_plan_daily_tasks:v3', JSON.stringify(todayTasks))
    } catch {}
  }, [todayTasks])

  useEffect(() => {
    if (incomingAssessmentId) {
      try {
        window.localStorage.setItem(`care_plan_generated_${incomingAssessmentId}`, 'true')
      } catch {}
    }
  }, [incomingAssessmentId])

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get('/diagnosis/mine')
        if (cancelled) return

        const myResults = getApiData(response) || []
        setResults(myResults)

        // Select authoritative target result
        const target = incomingResult || myResults[0]

        if (target) {
          if (target.care_plan) {
            setCarePlan(target.care_plan)
          } else {
            const targetId = target.id || target.diagnosis_result_id
            if (targetId) {
              try {
                const cpResp = await api.get(`/diagnosis/${targetId}/care-plan`)
                const cpData = getApiData(cpResp)
                if (!cancelled && cpData) {
                  setCarePlan(cpData)
                }
              } catch (cpErr) {
                console.warn('Failed to load care plan from backend, generating directly:', cpErr)
                try {
                  const genResp = await api.post(`/diagnosis/${targetId}/care-plan`, { result: target })
                  const genData = getApiData(genResp)
                  if (!cancelled && genData) {
                    setCarePlan(genData)
                  }
                } catch (genErr) {
                  console.error('Failed to generate care plan:', genErr)
                }
              }
            } else {
              try {
                const genResp = await api.post('/diagnosis/care-plan/generate', { result: target })
                const genData = getApiData(genResp)
                if (!cancelled && genData) {
                  setCarePlan(genData)
                }
              } catch (genErr) {
                console.error('Failed to generate care plan directly:', genErr)
              }
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('patientDashboard.carePlanPage.loadFailed', 'Failed to load your care plan')))
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
  }, [incomingResult, t])

  const handleRegenerateCarePlan = async () => {
    const target = incomingResult || results[0]
    if (!target) return

    setRegenerating(true)
    try {
      const targetId = target.id || target.diagnosis_result_id
      let resp
      if (targetId) {
        resp = await api.post(`/diagnosis/${targetId}/care-plan`, { result: target })
      } else {
        resp = await api.post('/diagnosis/care-plan/generate', { result: target })
      }
      const data = getApiData(resp)
      if (data) {
        setCarePlan(data)
      }
    } catch (err) {
      console.error('Failed to regenerate care plan:', err)
    } finally {
      setRegenerating(false)
    }
  }

  const toggleTask = (taskId) => {
    setTodayTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        const nextCompleted = !task.completed
        return {
          ...task,
          completed: nextCompleted,
          status: nextCompleted ? 'Completed' : (task.id === 'task-walk-pm' ? 'Next' : 'Later'),
        }
      })
    )
  }

  const scrollToSafetySection = () => {
    setIsSafetyExpanded(true)
    setHighlightSafety(true)
    safetySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      setHighlightSafety(false)
    }, 2500)
  }

  const handleAskQuestion = () => {
    window.dispatchEvent(new CustomEvent('open-diabetes-assistant'))
  }

  // Pre-calculate all display metrics and values unconditionally
  const latestResult = incomingResult || results[0]
  const facts = getLatestFacts(results)
  const rawGlucose = toNumberOrNull(facts.fasting_glucose ?? facts.fasting_plasma_glucose)
  const currentGlucose = rawGlucose !== null ? Math.round(rawGlucose) : null
  const isGlucoseElevated = currentGlucose !== null && currentGlucose > 130
  const isUrgent = Boolean(latestResult?.is_urgent) || isGlucoseElevated

  const reviewer = latestResult?.reviewed_by_user
  const reviewerName = latestResult?.reviewed_by_name
    ? (latestResult.reviewed_by_name.startsWith('Dr.') ? latestResult.reviewed_by_name : `Dr. ${latestResult.reviewed_by_name}`)
    : reviewer?.name
    ? (reviewer.name.startsWith('Dr.') ? reviewer.name : `Dr. ${reviewer.name}`)
    : patientPlan?.doctorName || null

  const followUpDoctor = reviewerName || (isKhmer ? 'ក្រុមថែទាំជំងឺទឹកនោមផ្អែម' : 'Diabetes Care Team')
  const followUpLocation = patientPlan?.doctorRole || (isKhmer ? 'វិបផតថលថែទាំគ្លីនិក' : 'Clinical Care Portal')

  const reportUrl = latestResult?.id
    ? `/diagnosis/result?diagnosis_result_id=${latestResult.id}`
    : '/my-results'

  const completedTasksCount = todayTasks.filter((t) => t.completed).length
  const progressPercent = Math.round((completedTasksCount / (todayTasks.length || 1)) * 100)

  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-150">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
        <StatCardsSkeleton count={4} />
        <CardListSkeleton count={3} />
      </div>
    )
  }

  // Empty state if user has never taken an assessment
  if (!latestResult && !carePlan) {
    return (
      <div className="space-y-6 pb-12">
        <ErrorAlert message={error} />
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center sm:p-12 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300">
            <HeartPulse className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-100">
            {t('patientDashboard.carePlanPage.onboarding.title', "Let's build your care plan")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {t('patientDashboard.carePlanPage.onboarding.description', 'Complete an assessment to generate your personalized clinical care plan, dietary recommendations, and monitoring schedule.')}
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/diagnosis"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98] dark:bg-primary-500"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{t('patientDashboard.carePlanPage.onboarding.cta', 'Start My First Assessment')}</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      <ErrorAlert message={error} />

      {/* ==================================================================== */}
      {/* 1. HERO BANNER: My Care Plan                                         */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-[0_2px_14px_rgba(0,0,0,0.02)] transition-all duration-200 dark:border-slate-800 dark:bg-slate-900">
        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-blue-100/50 to-sky-100/20 blur-2xl dark:from-blue-950/20 dark:to-transparent" />
        <div className="pointer-events-none absolute right-1/4 -bottom-12 h-40 w-40 rounded-full bg-gradient-to-tr from-sky-50/60 to-transparent blur-xl dark:from-sky-950/10 dark:to-transparent" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Block: Avatar, Title, Status & Actions */}
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            <div className="flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-blue-100/70 text-primary-600 shadow-2xs dark:bg-blue-950/70 dark:text-primary-300">
              <User className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {t('carePlanPage.overview.title', isKhmer ? 'ផែនការថែទាំរបស់ខ្ញុំ' : 'My Care Plan')}
                </h1>

                {isUrgent ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600 border border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/50">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{t('carePlanPage.overview.attentionRequired', isKhmer ? 'ត្រូវការការយកចិត្តទុកដាក់' : 'Attention Required')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{t('carePlanPage.overview.stable', isKhmer ? 'មានលំនឹង' : 'Stable')}</span>
                  </span>
                )}

                <span className="text-slate-300 dark:text-slate-600 hidden sm:inline select-none">•</span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {t('carePlanPage.overview.updatedToday', isKhmer ? 'បានធ្វើបច្ចុប្បន្នភាពថ្ងៃនេះ' : 'Updated today')}
                </span>

                <span className="text-slate-300 dark:text-slate-600 hidden sm:inline select-none">•</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {latestResult?.review_note
                    ? t('carePlanPage.overview.doctorReviewed', isKhmer ? 'បានពិនិត្យដោយវេជ្ជបណ្ឌិត' : 'Doctor reviewed')
                    : t('carePlanPage.overview.doctorReviewPending', isKhmer ? 'រង់ចាំការពិនិត្យពីវេជ្ជបណ្ឌិត' : 'Doctor review pending')}
                </span>
              </div>

              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                {t('carePlanPage.overview.heroDescription', isKhmer ? 'ផែនការថែទាំផ្ទាល់ខ្លួនដើម្បីជួយគ្រប់គ្រងជំងឺទឹកនោមផ្អែម និងរក្សាសុខភាពល្អ។' : 'Your personalized care plan to help manage diabetes and stay healthy.')}
              </p>

              {/* Action Buttons Row */}
              <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:gap-3">
                <Link
                  to="/diagnosis"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-primary-700 active:scale-[0.98] dark:bg-primary-500 dark:hover:bg-primary-600"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{t('carePlanPage.overview.startAssessment', isKhmer ? 'ចាប់ផ្តើមការវាយតម្លៃ' : 'Start Assessment')}</span>
                </Link>

                <Link
                  to={reportUrl}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <FileText className="h-4 w-4 text-slate-400 dark:text-slate-400" />
                  <span>{t('carePlanPage.overview.fullReport', isKhmer ? 'របាយការណ៍ពេញលេញ' : 'Full Report')}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setActiveTab('Care Plan')}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <HeartPulse className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                  <span>{t('carePlanPage.overview.carePlanDetails', isKhmer ? 'ផែនការថែទាំលម្អិត' : 'Care Plan Details')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Block: Phase 2 Active Intervention Widget */}
          <div className="shrink-0 lg:self-center">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 min-w-[200px] sm:min-w-[220px] shadow-2xs dark:border-slate-800/80 dark:bg-slate-800/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {t('carePlanPage.overview.phase2', isKhmer ? 'ដំណាក់កាលទី ២' : 'Phase 2')}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {t('carePlanPage.overview.activeIntervention', isKhmer ? 'ការអន្តរាគមន៍សកម្ម' : 'Active Intervention')}
              </p>

              {/* Progress bar */}
              <div className="mt-2.5 h-2 w-full rounded-full bg-slate-200/80 overflow-hidden dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: '47%' }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span>{t('carePlanPage.overview.dayProgress', isKhmer ? 'ថ្ងៃ ១៤ / ៣០' : 'Day 14 / 30')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. TAB NAVIGATION PILLS                                               */}
      {/* ==================================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-full px-5 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150',
                isActive
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
              )}
            >
              {isKhmer ? tab.labelKm : tab.labelEn}
            </button>
          )
        })}
      </div>

      {/* ==================================================================== */}
      {/* 3. TAB 1: OVERVIEW (MATCHING DESIGN LAYOUT)                           */}
      {/* ==================================================================== */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================================================================ */}
          {/* Left Column (8 cols): Today's Care, Glucose, Meds, Nutrition, Alert */}
          {/* ================================================================ */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            {/* Row 1: Today's Care + Current Glucose (2 columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Today's Care */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-primary-600 dark:bg-blue-950/60 dark:text-primary-400">
                        <Calendar className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {t('carePlanPage.overview.todaysCare.title', isKhmer ? 'ការថែទាំថ្ងៃនេះ' : "Today's Care")}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t('carePlanPage.overview.todaysCare.subtitle', isKhmer ? 'បំពេញកិច្ចការប្រចាំថ្ងៃរបស់អ្នក' : 'Complete your daily tasks')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {t(
                          'carePlanPage.overview.todaysCare.completedCount',
                          isKhmer ? 'បានបញ្ចប់ {{done}} ក្នុងចំណោម {{total}}' : '{{done}} of {{total}} completed',
                          { done: completedTasksCount, total: todayTasks.length }
                        )}
                      </span>
                      <div className="h-2 w-16 sm:w-20 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {progressPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="mt-3.5 space-y-2.5">
                    {todayTasks.map((task) => {
                      const tData = TASK_TRANSLATIONS[task.id]
                      const taskTitle = isKhmer ? (tData?.titleKm || task.title) : (tData?.titleEn || task.title)
                      const taskSubtitle = isKhmer ? (tData?.subKm || task.subtitle) : (tData?.subEn || task.subtitle)

                      return (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-100/90 bg-white p-2.5 transition hover:border-slate-200 hover:bg-slate-50/70 dark:border-slate-800/80 dark:bg-slate-900 dark:hover:bg-slate-800/40"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {task.completed ? (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xs">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </span>
                            ) : task.status === 'Next' ? (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary-500 bg-transparent" />
                            ) : (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-transparent dark:border-slate-600" />
                            )}

                            <div className="min-w-0">
                              <h3
                                className={cn(
                                  'text-sm font-semibold leading-tight text-slate-900 transition-colors dark:text-slate-100',
                                  task.completed && 'text-slate-700 line-through dark:text-slate-400'
                                )}
                              >
                                {taskTitle}
                              </h3>
                              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                                {taskSubtitle}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0 ml-2">
                            {task.completed ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40">
                                ✓ {t('carePlanPage.overview.todaysCare.completed', isKhmer ? 'បានបញ្ចប់' : 'Completed')}
                              </span>
                            ) : task.status === 'Next' ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 border border-primary-200/60 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-800/40">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                                {t('carePlanPage.overview.todaysCare.next', isKhmer ? 'បន្ទាប់' : 'Next')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                {t('carePlanPage.overview.todaysCare.later', isKhmer ? 'ពេលក្រោយ' : 'Later')}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Card 2: Current Glucose */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-primary-600 dark:bg-blue-950/60 dark:text-primary-400">
                        <Droplets className="h-4.5 w-4.5" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {t('carePlanPage.overview.currentGlucose.title', isKhmer ? 'ជាតិស្ករបច្ចុប្បន្ន' : 'Current Glucose')}
                      </h2>
                    </div>

                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {t('carePlanPage.overview.currentGlucose.trendStable', isKhmer ? 'និន្នាការ: មានលំនឹង' : 'Trend: Stable')}
                    </span>
                  </div>

                  {/* Top Metric Display */}
                  <div className="mt-3.5 flex items-baseline justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                          {currentGlucose !== null ? currentGlucose : '--'}
                        </span>
                        {currentGlucose !== null && (
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                            mg/dL
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {t('carePlanPage.overview.currentGlucose.fastingLabel', isKhmer ? 'ជាតិស្ករពេលព្រឹក' : 'Fasting glucose')}
                      </p>
                    </div>

                    <div className="text-right">
                      {currentGlucose !== null ? (
                        isGlucoseElevated ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600 border border-rose-200/60 dark:bg-rose-950/60 dark:text-rose-300">
                            {t('carePlanPage.overview.currentGlucose.aboveTarget', isKhmer ? '↑ លើសគោលដៅ' : '↑ Above target')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {t('carePlanPage.overview.currentGlucose.targetZone', isKhmer ? '✓ ក្នុងគោលដៅ' : '✓ Target zone')}
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-400">
                          {t('carePlanPage.overview.currentGlucose.pendingTest', isKhmer ? 'រង់ចាំតេស្ត' : 'Pending test')}
                        </span>
                      )}
                      <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {t('carePlanPage.overview.currentGlucose.targetRange', isKhmer ? 'គោលដៅ: 80 - 130 mg/dL' : 'Target: 80 - 130 mg/dL')}
                      </p>
                    </div>
                  </div>

                  {/* Sparkline Chart */}
                  <div className="mt-2 pt-1">
                    <CarePlanGlucoseChart
                      latestGlucose={currentGlucose}
                      targetMin={80}
                      targetMax={130}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Physical Activity & Fitness Guide + Nutrition & Meal Guide (2 columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 3: Physical Activity & Fitness Guide */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-primary-600 dark:bg-blue-950/60 dark:text-primary-400">
                        <Activity className="h-4.5 w-4.5" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t('carePlanPage.overview.activityGuide.title', isKhmer ? 'សកម្មភាពរាងកាយ និងលំហាត់ប្រាណ' : 'Physical Activity & Fitness Guide')}
                      </h2>
                    </div>

                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 border border-blue-200/60 dark:bg-blue-950/60 dark:text-primary-300">
                      {isKhmer ? '១៥០ នាទី/សប្តាហ៍' : '150 Min / Week'}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t('carePlanPage.overview.activityGuide.regimenTitle', isKhmer ? 'គោលដៅសកម្មភាពប្រចាំសប្តាហ៍' : 'Target Activity Regimen')}
                      </h3>
                      <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                        <div className="rounded-lg bg-emerald-50/80 p-1.5 border border-emerald-200/50 dark:bg-emerald-950/40 dark:border-emerald-900/40">
                          <span className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-200">
                            {isKhmer ? '៣០ នាទី/ថ្ងៃ' : '30 Min / Day'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-amber-50/80 p-1.5 border border-amber-200/50 dark:bg-amber-950/40 dark:border-amber-900/40">
                          <span className="block text-[11px] font-bold text-amber-800 dark:text-amber-200">
                            {isKhmer ? '២ ដង/សប្តាហ៍' : '2x / Week'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-sky-50/80 p-1.5 border border-sky-200/50 dark:bg-sky-950/40 dark:border-sky-900/40">
                          <span className="block text-[11px] font-bold text-sky-800 dark:text-sky-200">
                            {isKhmer ? 'ក្រោយអាហារ' : 'Post-Meal'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                      {carePlan?.recommendations?.physical_activity?.summary ||
                        (isKhmer
                          ? 'ដើរលឿន ៣០ នាទី ៥ ថ្ងៃ/សប្តាហ៍ រួមទាំងការដើរស្រាលៗ ១០ នាទីក្រោយអាហារ ដើម្បីជួយបន្ថយការកើនឡើងជាតិស្ករ'
                          : '30-min brisk walk 5 days/wk plus 10-min light post-meal walking to blunt glucose spikes')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('Care Plan')}
                  className="group mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-primary-600 transition hover:text-primary-700 dark:border-slate-800 dark:text-primary-400"
                >
                  <span>{t('carePlanPage.overview.activityGuide.viewPlan', isKhmer ? 'មើលផែនការថែទាំលម្អិត' : 'View full care plan')}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* Card 4: Nutrition & Meal Guide (Replaces Next Appointment) */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <Apple className="h-4.5 w-4.5" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t('carePlanPage.overview.nutritionGuide.title', isKhmer ? 'អាហារូបត្ថម្ភ និងរបបអាហារ' : 'Nutrition & Meal Guide')}
                      </h2>
                    </div>

                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {t('carePlanPage.overview.nutritionGuide.badge', isKhmer ? 'ជាតិស្ករទាប' : 'Low Glycemic')}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t('carePlanPage.overview.nutritionGuide.methodTitle', isKhmer ? 'វិធីសាស្ត្រចានសុខភាព (Plate Method)' : 'Healthy Plate Method')}
                      </h3>
                      <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                        <div className="rounded-lg bg-emerald-50/80 p-1.5 border border-emerald-200/50 dark:bg-emerald-950/40 dark:border-emerald-900/40">
                          <span className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-200">
                            {t('carePlanPage.overview.nutritionGuide.vegPlate', isKhmer ? '៥០% បន្លែគ្មានម្សៅ' : '50% Non-starchy veg')}
                          </span>
                        </div>
                        <div className="rounded-lg bg-amber-50/80 p-1.5 border border-amber-200/50 dark:bg-amber-950/40 dark:border-amber-900/40">
                          <span className="block text-[11px] font-bold text-amber-800 dark:text-amber-200">
                            {t('carePlanPage.overview.nutritionGuide.proteinPlate', isKhmer ? '២៥% ប្រូតេអ៊ីនស្អាត' : '25% Lean protein')}
                          </span>
                        </div>
                        <div className="rounded-lg bg-sky-50/80 p-1.5 border border-sky-200/50 dark:bg-sky-950/40 dark:border-sky-900/40">
                          <span className="block text-[11px] font-bold text-sky-800 dark:text-sky-200">
                            {t('carePlanPage.overview.nutritionGuide.grainPlate', isKhmer ? '២៥% គ្រាប់ធញ្ញជាតិ' : '25% Whole grains')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                      {t('carePlanPage.overview.nutritionGuide.targetNutrients', isKhmer ? 'កាបូអ៊ីដ្រាត: ៤៥–៦០g / ពេល · ជាតិសរសៃ ≥ ២៨g / ថ្ងៃ' : 'Carbs: 45–60g / meal · Fiber: ≥ 28g daily')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('Care Plan')}
                  className="group mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-primary-600 transition hover:text-primary-700 dark:border-slate-800 dark:text-primary-400"
                >
                  <span>{t('carePlanPage.overview.nutritionGuide.viewPlan', isKhmer ? 'មើលផែនការថែទាំលម្អិត' : 'View full care plan')}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>

            {/* Row 3: Needs Attention Alert Banner */}
            <div className="rounded-2xl border border-rose-200/90 bg-rose-50/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 dark:border-rose-900/60 dark:bg-rose-950/20">
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-rose-900 dark:text-rose-100">
                    {t('carePlanPage.overview.needsAttention.title', isKhmer ? 'ត្រូវការការយកចិត្តទុកដាក់' : 'Needs attention')}
                  </h3>
                  <p className="mt-0.5 text-xs text-rose-800/90 leading-relaxed dark:text-rose-200/90">
                    {t('carePlanPage.overview.needsAttention.description', isKhmer ? 'កម្រិតជាតិស្ករពេលព្រឹកចុងក្រោយរបស់អ្នកខ្ពស់ជាងគោលដៅដែលបានណែនាំ។ សូមបន្តអនុវត្តតាមផែនការថែទាំផ្ទាល់ខ្លួន និងទាក់ទងក្រុមថែទាំរបស់អ្នកប្រសិនបើរោគសញ្ញាកាន់តែធ្ងន់ធ្ងរ។' : 'Your latest fasting glucose result is above your recommended target. Follow your personalized care plan and contact your care team if symptoms worsen.')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={scrollToSafetySection}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-2xs transition hover:bg-rose-50 active:scale-[0.98] whitespace-nowrap dark:border-rose-800/70 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900/60"
              >
                <span>{t('carePlanPage.overview.needsAttention.warningSigns', isKhmer ? 'មើលសញ្ញាប្រុងប្រយ័ត្ន' : 'View warning signs')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Row 4: Doctor Review Card */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-primary-600 dark:bg-blue-950/60 dark:text-primary-400">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t('carePlanPage.overview.doctorReview.title', isKhmer ? 'ការពិនិត្យពីវេជ្ជបណ្ឌិត' : 'Doctor Review')}
                    </h2>
                    {reviewerName && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {t(
                          'carePlanPage.overview.doctorReview.reviewedBy',
                          isKhmer ? 'ពិនិត្យដោយ {{doctor}}' : 'Reviewed by {{doctor}}',
                          { doctor: reviewerName }
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {latestResult?.review_note ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{t('carePlanPage.overview.doctorReview.verified', isKhmer ? 'ការពិនិត្យផ្លូវការ' : 'Verified Review')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/70 dark:bg-amber-950/60 dark:text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>{t('carePlanPage.overview.doctorReview.awaiting', isKhmer ? 'រង់ចាំការពិនិត្យ' : 'Awaiting review')}</span>
                  </span>
                )}
              </div>

              {latestResult?.review_note ? (
                <div className="mt-3.5 rounded-xl border border-primary-200/60 bg-gradient-to-br from-primary-50/30 to-sky-50/20 p-4 text-xs leading-relaxed text-slate-800 dark:border-primary-900/50 dark:from-primary-950/30 dark:to-slate-900/40 dark:text-slate-200">
                  <div className="flex items-start gap-2.5">
                    <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                    <div className="min-w-0 flex-1">
                      <p className="font-serif italic">&ldquo;{latestResult.review_note}&rdquo;</p>
                      {latestResult.reviewed_at && (
                        <p className="mt-1 text-right text-[10px] font-sans text-slate-400">
                          {new Date(latestResult.reviewed_at).toLocaleDateString(isKhmer ? 'km-KH' : 'en-US')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-2.5 text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                  {t('carePlanPage.overview.doctorReview.empty', isKhmer ? 'វេជ្ជបណ្ឌិតរបស់អ្នកមិនទាន់បានពិនិត្យផែនការថែទាំនេះនៅឡើយទេ។ អ្នកនឹងឃើញកំណត់ចំណាំរបស់ពួកគេនៅទីនេះនៅពេលការពិនិត្យរួចរាល់។' : "Your doctor hasn't reviewed this care plan yet. You'll see their notes here once the review is complete.")}
                </p>
              )}
            </section>
          </div>

          {/* ================================================================ */}
          {/* Right Column (4 cols): Quick Actions, Lifestyle, Progress, Safety */}
          {/* ================================================================ */}
          <div className="lg:col-span-4 space-y-6 min-w-0">
            {/* Card 1: Quick Actions */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-primary-600 dark:bg-blue-950/60 dark:text-primary-400">
                  <Zap className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t('carePlanPage.overview.quickActions.title', isKhmer ? 'សកម្មភាពរហ័ស' : 'Quick Actions')}
                </h2>
              </div>

              <div className="mt-3.5 space-y-2.5">
                <Link
                  to={reportUrl}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 transition hover:border-primary-200 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-900/60 dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary-600 dark:bg-blue-950/60 dark:text-primary-400">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate dark:text-slate-100">
                        {t('carePlanPage.overview.quickActions.fullReport', isKhmer ? 'មើលរបាយការណ៍ពេញលេញ' : 'View Full Report')}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate dark:text-slate-400">
                        {t('carePlanPage.overview.quickActions.fullReportSub', isKhmer ? 'មើលព័ត៌មានលម្អិតទាំងអស់' : 'See complete details')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-primary-600 dark:text-slate-500" />
                </Link>

                <button
                  type="button"
                  onClick={handleAskQuestion}
                  className="group w-full flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 text-left transition hover:border-primary-200 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-900/60 dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary-600 dark:bg-blue-950/60 dark:text-primary-400">
                      <MessageSquare className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate dark:text-slate-100">
                        {t('carePlanPage.overview.quickActions.askQuestion', isKhmer ? 'សួរសំណួរ' : 'Ask a Question')}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate dark:text-slate-400">
                        {t('carePlanPage.overview.quickActions.askQuestionSub', isKhmer ? 'ទទួលជំនួយពីក្រុមថែទាំរបស់អ្នក' : 'Get help from your care team')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-primary-600 dark:text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('Care Plan')}
                  className="group w-full flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 text-left transition hover:border-primary-200 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-900/60 dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary-600 dark:bg-blue-950/60 dark:text-primary-400">
                      <HeartPulse className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate dark:text-slate-100">
                        {t('carePlanPage.overview.quickActions.carePlan', isKhmer ? 'មើលផែនការថែទាំ' : 'View Care Plan')}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate dark:text-slate-400">
                        {t('carePlanPage.overview.quickActions.carePlanSub', isKhmer ? 'អាហារូបត្ថម្ភ សកម្មភាព របៀបរស់នៅ និងការតាមដាន' : 'Nutrition, activity, lifestyle & monitoring')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-primary-600 dark:text-slate-500" />
                </button>
              </div>
            </div>

            {/* Card 2: Lifestyle & Activity Target (Replaces Upcoming Appointment) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-primary-600 dark:bg-blue-950/60 dark:text-primary-400">
                    <HeartPulse className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t('carePlanPage.overview.lifestyleTarget.title', isKhmer ? 'របៀបរស់នៅ និងទម្លាប់សុខភាព' : 'Lifestyle & Activity Target')}
                  </h2>
                </div>

                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-primary-300">
                  {t('carePlanPage.overview.lifestyleTarget.badge', isKhmer ? 'គោលដៅប្រចាំថ្ងៃ' : 'Daily Goals')}
                </span>
              </div>

              <div className="mt-3.5 space-y-3">
                {/* 1. Walk / Aerobic */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mt-0.5 dark:bg-emerald-950/50 dark:text-emerald-400">
                      <Footprints className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate dark:text-slate-100">
                        {t('carePlanPage.overview.lifestyleTarget.activityTitle', isKhmer ? 'ដើរលឿន ៣០ នាទី' : '30-Min Brisk Walk')}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate dark:text-slate-500">
                        {t('carePlanPage.overview.lifestyleTarget.activitySubtitle', isKhmer ? 'សកម្មភាពកម្រិតមធ្យម ៥ ថ្ងៃ/សប្តាហ៍' : 'Moderate aerobic activity · 5 days/wk')}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {t('carePlanPage.overview.lifestyleTarget.activityStatus', isKhmer ? 'បាន ៤/៥ ថ្ងៃ' : '4/5 days')}
                  </span>
                </div>

                {/* 2. Hydration */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 mt-0.5 dark:bg-sky-950/50 dark:text-sky-400">
                      <Droplets className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate dark:text-slate-100">
                        {t('carePlanPage.overview.lifestyleTarget.hydrationTitle', isKhmer ? 'ផឹកទឹកស្អាត ២.០ លីត្រ' : '2.0L Hydration')}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate dark:text-slate-500">
                        {t('carePlanPage.overview.lifestyleTarget.hydrationSubtitle', isKhmer ? 'កាត់បន្ថយភេសជ្ជៈផ្អែម និងតែមានស្ករ' : 'Zero sugary drinks · Boosts metabolism')}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 border border-sky-200/50 dark:bg-sky-950/50 dark:text-sky-300">
                    {t('carePlanPage.overview.lifestyleTarget.hydrationStatus', isKhmer ? '១.៦ / ២.០L' : '1.6 / 2.0L')}
                  </span>
                </div>

                {/* 3. Sleep */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 mt-0.5 dark:bg-indigo-950/50 dark:text-indigo-400">
                      <Moon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate dark:text-slate-100">
                        {t('carePlanPage.overview.lifestyleTarget.sleepTitle', isKhmer ? 'គេងលក់ស្រួល ៧–៨ ម៉ោង' : '7–8 Hours Sleep')}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate dark:text-slate-500">
                        {t('carePlanPage.overview.lifestyleTarget.sleepSubtitle', isKhmer ? 'ជួយកាត់បន្ថយអរម៉ូនស្ត្រេស និងជាតិស្ករ' : 'Regulates cortisol & insulin sensitivity')}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200/50 dark:bg-indigo-950/50 dark:text-indigo-300">
                    {t('carePlanPage.overview.lifestyleTarget.sleepStatus', isKhmer ? 'ល្អប្រសើរ' : 'Optimal')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('Care Plan')}
                className="group mt-4 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-primary-600 transition hover:text-primary-700 dark:border-slate-800 dark:text-primary-400"
              >
                <span>{t('carePlanPage.overview.lifestyleTarget.viewGuide', isKhmer ? 'ស្វែងយល់បន្ថែមអំពីការថែទាំ' : 'Explore lifestyle guide')}</span>
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Card 3: Your Progress */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-primary-600 dark:bg-blue-950/60 dark:text-primary-400">
                  <BarChart2 className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t('carePlanPage.overview.yourProgress.title', isKhmer ? 'វឌ្ឍនភាពរបស់អ្នក' : 'Your Progress')}
                </h2>
              </div>

              <div className="mt-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Droplets className="h-4 w-4 text-sky-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('carePlanPage.overview.yourProgress.glucose', isKhmer ? 'កម្រិតជាតិស្ករ' : 'Blood Glucose')}
                    </span>
                  </div>
                  {isGlucoseElevated ? (
                    <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600 border border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300">
                      {t('carePlanPage.overview.yourProgress.aboveTarget', isKhmer ? 'លើសគោលដៅ' : 'Above target')}
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                      {t('carePlanPage.overview.yourProgress.onTrack', isKhmer ? 'ក្នុងគោលដៅ' : 'Target zone')}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <HeartPulse className="h-4 w-4 text-primary-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('carePlanPage.overview.yourProgress.lifestyle', isKhmer ? 'ទម្លាប់រស់នៅ' : 'Lifestyle Habits')}
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {t('carePlanPage.overview.yourProgress.onTrack', isKhmer ? 'តាមផែនការ' : 'On track')}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('carePlanPage.overview.yourProgress.activity', isKhmer ? 'សកម្មភាពរាងកាយ' : 'Activity')}
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {t('carePlanPage.overview.yourProgress.onTrack', isKhmer ? 'តាមផែនការ' : 'On track')}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Apple className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('carePlanPage.overview.yourProgress.nutrition', isKhmer ? 'អាហារូបត្ថម្ភ' : 'Nutrition')}
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {t('carePlanPage.overview.yourProgress.onTrack', isKhmer ? 'តាមផែនការ' : 'On track')}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Seek Care Urgently If */}
            <section
              id="safety-guidelines"
              ref={safetySectionRef}
              className={cn(
                'rounded-2xl border border-rose-200/90 bg-rose-50/50 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-300 dark:border-rose-900/50 dark:bg-rose-950/20',
                highlightSafety && 'ring-4 ring-rose-400/50 ring-offset-2 animate-pulse'
              )}
            >
              <button
                type="button"
                onClick={() => setIsSafetyExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    {t('carePlanPage.overview.safety.title', isKhmer ? 'សូមស្វែងរកការថែទាំបន្ទាន់ ប្រសិនបើ' : 'Seek care urgently if')}
                  </h3>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-rose-600 transition-transform duration-200 dark:text-rose-400',
                    isSafetyExpanded ? 'rotate-180' : 'rotate-0'
                  )}
                />
              </button>

              {isSafetyExpanded && (
                <ul className="mt-3.5 space-y-2.5">
                  {(isKhmer
                    ? [
                        'អ្នកមានអាការៈច្របូកច្របល់ ងងុយដេកខ្លាំង ឬសន្លប់',
                        'ដង្ហើមញាប់ និងមានក្លិនស្ករជូរចេញពីមាត់ (Ketoacidosis)',
                        'ក្អួត ឬរាគខ្លាំងមិនអាចទទួលទានទឹកបាន',
                        'មានស្នាមរបួសក្រហម ហើម ឬមិនជាសះស្បើយ',
                      ]
                    : [
                        'You develop confusion, drowsiness or fainting',
                        'You have rapid breathing with fruity-smelling breath',
                        'Vomiting or diarrhea stops you keeping fluids down',
                        'A wound is red, swollen, or not healing',
                      ]
                  ).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500 dark:text-rose-400" />
                      <span className="text-xs leading-relaxed text-rose-900/90 dark:text-rose-200/90">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. TAB 2: CARE PLAN                                                  */}
      {/* ==================================================================== */}
      {activeTab === 'Care Plan' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <PersonalizedCarePlanSection
            carePlan={carePlan}
            latestResult={latestResult}
            onRegenerate={handleRegenerateCarePlan}
            regenerating={regenerating}
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. TAB 3: APPOINTMENTS                                               */}
      {/* ==================================================================== */}
      {activeTab === 'Appointments' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <AppointmentCalendarCanvas t={t} />
        </div>
      )}
    </div>
  )
}

export default CarePlanPage
