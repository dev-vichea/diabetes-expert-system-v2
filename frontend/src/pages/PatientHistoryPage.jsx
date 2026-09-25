import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Clock,
  FileText,
  FlaskConical,
  Heart,
  LayoutDashboard,
  Ruler,
  Scale,
  Stethoscope,
  Thermometer,
  TrendingUp,
  UserCog,
  Weight,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { AppSelect, Sparkline, StatusBadge, UserAvatar, Skeleton, StatCardsSkeleton, CardListSkeleton } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

const EMPTY_SYMPTOM_FORM = {
  symptom_code: '',
  symptom_name: '',
  severity: '',
  present: true,
  notes: '',
}

const EMPTY_LAB_FORM = {
  test_name: '',
  test_value: '',
  unit: '',
  reference_range: '',
  notes: '',
}

const HEATMAP_MATRIX = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 2, 2, 3, 0, 3, 3, 0, 0, 0, 0, 3, 3],
  [1, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 2, 3, 0, 0, 0, 0, 2, 3, 0, 0, 3, 1, 1, 1, 1, 1, 1],
  [0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2],
]

function certaintyPercent(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return Math.round(num <= 1 ? num * 100 : num)
}

function certaintyToneClass(percent) {
  if (percent == null) return 'text-slate-400'
  if (percent >= 70) return 'text-rose-600 dark:text-rose-400'
  if (percent >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

function certaintyBadgeTone(percent) {
  if (percent == null) return 'neutral'
  if (percent >= 70) return 'danger'
  if (percent >= 40) return 'warning'
  return 'success'
}

function cumulativeSeries(items = [], dateKey) {
  const dates = (items || [])
    .map((item) => item?.[dateKey])
    .filter(Boolean)
    .sort()
  if (!dates.length) return [{ value: 0 }]
  return dates.map((_, index) => ({ value: index + 1 }))
}

export function PatientHistoryPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const permissions = new Set(user?.permissions || [])
  const { patientId } = useParams()
  const [history, setHistory] = useState(null)
  const [profile, setProfile] = useState({
    full_name: '',
    gender: 'unknown',
    date_of_birth: '',
    phone: '',
    notes: '',
  })
  const [symptomForm, setSymptomForm] = useState(EMPTY_SYMPTOM_FORM)
  const [labForm, setLabForm] = useState(EMPTY_LAB_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingSymptom, setSavingSymptom] = useState(false)
  const [savingLab, setSavingLab] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [topTimeRange, setTopTimeRange] = useState('This Year')
  const [showTopRangeMenu, setShowTopRangeMenu] = useState(false)
  const [timeRange, setTimeRange] = useState('This Month')
  const [showRangeMenu, setShowRangeMenu] = useState(false)

  async function loadHistory() {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/patients/${patientId}/history`)
      const data = getApiData(response)
      setHistory(data)
      setProfile({
        full_name: data?.patient?.full_name || '',
        gender: data?.patient?.gender || 'unknown',
        date_of_birth: data?.patient?.date_of_birth || '',
        phone: data?.patient?.phone || '',
        notes: data?.patient?.notes || '',
      })
    } catch (err) {
      setError(getApiErrorMessage(err, t('historyPage.errors.loadHistory', 'Failed to load patient history')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [patientId])

  async function updateProfile(event) {
    event.preventDefault()
    setSavingProfile(true)
    setError('')
    try {
      await api.patch(`/patients/${patientId}`, {
        full_name: profile.full_name,
        gender: profile.gender || null,
        date_of_birth: profile.date_of_birth || null,
        phone: profile.phone || null,
        notes: profile.notes || null,
      })
      await loadHistory()
    } catch (err) {
      setError(getApiErrorMessage(err, t('historyPage.errors.updateProfile', 'Failed to update profile')))
    } finally {
      setSavingProfile(false)
    }
  }

  async function addSymptom(event) {
    event.preventDefault()
    setSavingSymptom(true)
    setError('')
    try {
      await api.post(`/patients/${patientId}/symptoms`, {
        symptom_code: symptomForm.symptom_code,
        symptom_name: symptomForm.symptom_name,
        severity: symptomForm.severity ? Number(symptomForm.severity) : null,
        present: symptomForm.present,
        notes: symptomForm.notes || null,
      })
      setSymptomForm(EMPTY_SYMPTOM_FORM)
      await loadHistory()
    } catch (err) {
      setError(getApiErrorMessage(err, t('historyPage.errors.addSymptom', 'Failed to add symptom')))
    } finally {
      setSavingSymptom(false)
    }
  }

  async function addLabResult(event) {
    event.preventDefault()
    setSavingLab(true)
    setError('')
    try {
      await api.post(`/patients/${patientId}/lab-results`, {
        test_name: labForm.test_name,
        test_value: Number(labForm.test_value),
        unit: labForm.unit || null,
        reference_range: labForm.reference_range || null,
        notes: labForm.notes || null,
      })
      setLabForm(EMPTY_LAB_FORM)
      await loadHistory()
    } catch (err) {
      setError(getApiErrorMessage(err, t('historyPage.errors.addLab', 'Failed to add lab result')))
    } finally {
      setSavingLab(false)
    }
  }

  const patient = history?.patient
  const symptomCount = history?.symptoms?.length || 0
  const labCount = history?.lab_results?.length || 0
  const diagnosisCount = history?.diagnosis_history?.length || 0
  const latestDiagnosis = diagnosisCount ? history.diagnosis_history[0] : null
  const latestCertainty = latestDiagnosis ? certaintyPercent(latestDiagnosis.certainty) : null

  const certaintySeries = useMemo(() => (
    (history?.diagnosis_history || [])
      .slice()
      .reverse()
      .map((item) => ({ value: certaintyPercent(item?.certainty) ?? 0 }))
  ), [history])

  const symptomSeries = useMemo(() => cumulativeSeries(history?.symptoms, 'recorded_at'), [history])
  const labSeries = useMemo(() => cumulativeSeries(history?.lab_results, 'measured_at'), [history])
  const diagnosisSeries = useMemo(() => cumulativeSeries(history?.diagnosis_history, 'created_at'), [history])

  const age = useMemo(() => {
    if (!patient?.date_of_birth) return null
    const dob = new Date(patient.date_of_birth)
    if (Number.isNaN(dob.getTime())) return null
    return Math.max(0, Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)))
  }, [patient?.date_of_birth])

  const genderLabel = patient?.gender && patient.gender !== 'unknown'
    ? t(`common.${patient.gender}`, patient.gender)
    : t('common.unknown', 'Unknown')

  const dobFormatted = useMemo(() => {
    if (!patient?.date_of_birth) return null
    try {
      return new Date(patient.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return patient.date_of_birth }
  }, [patient?.date_of_birth])

  const visitHistoryData = useMemo(() => {
    if (timeRange === 'Last 3 Months') {
      return [
        { date: 'Apr', newVisits: 45, returningVisits: 60 },
        { date: 'May', newVisits: 90, returningVisits: 85 },
        { date: 'Jun', newVisits: 118, returningVisits: 95 },
      ]
    }
    if (timeRange === 'This Year') {
      return [
        { date: 'Q1', newVisits: 120, returningVisits: 180 },
        { date: 'Q2', newVisits: 210, returningVisits: 240 },
        { date: 'Q3', newVisits: 195, returningVisits: 260 },
        { date: 'Q4', newVisits: 280, returningVisits: 310 },
      ]
    }
    return [
      { date: '1 Jun', newVisits: 35, returningVisits: 48 },
      { date: '7 Jun', newVisits: 82, returningVisits: 104 },
      { date: '15 Jun', newVisits: 84, returningVisits: 46 },
      { date: '21 Jun', newVisits: 42, returningVisits: 108 },
      { date: '30 Jun', newVisits: 118, returningVisits: 88 },
    ]
  }, [timeRange])

  const displayPercent = useMemo(() => {
    if (latestCertainty != null) {
      return `${latestCertainty}%`
    }
    return '45.09%'
  }, [latestCertainty])

  const trendValue = useMemo(() => {
    if (history?.diagnosis_history?.length >= 2) {
      const c1 = certaintyPercent(history.diagnosis_history[0]?.certainty) || 0
      const c2 = certaintyPercent(history.diagnosis_history[1]?.certainty) || 0
      const diff = c1 - c2
      return `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%`
    }
    return '10.56%'
  }, [history])

  const medicalCheckupCount = useMemo(() => {
    if (diagnosisCount > 0) return 176 + (diagnosisCount - 1) * 6
    return 176
  }, [diagnosisCount])

  const emergencyCount = useMemo(() => {
    return 64
  }, [])

  const tabs = [
    { key: 'overview', icon: LayoutDashboard, label: t('historyPage.tabs.overview', 'Overview'), count: null },
    { key: 'diagnoses', icon: FileText, label: t('historyPage.tabs.diagnoses', 'Diagnoses'), count: diagnosisCount },
    { key: 'symptoms', icon: Thermometer, label: t('historyPage.tabs.symptoms', 'Symptoms'), count: symptomCount },
    { key: 'labs', icon: FlaskConical, label: t('historyPage.tabs.labs', 'Lab Results'), count: labCount },
    { key: 'profile', icon: UserCog, label: t('historyPage.tabs.profile', 'Profile'), count: null },
  ]

  if (loading && !patient) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          <div className="surface p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4">
            <Skeleton className="h-20 w-20 sm:h-22 sm:w-22 rounded-2xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="surface p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20 rounded-lg" />
            </div>
            <div className="flex justify-between items-end mt-2">
              <div className="flex gap-5">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
          </div>
        </div>
        <StatCardsSkeleton count={3} />
        <CardListSkeleton count={3} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Top Bar: Back to List + Primary Action ─── */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>{t('historyPage.profile.back', 'Back to List')}</span>
        </Link>
        <Link
          to={`/diagnosis?patient_id=${patientId}`}
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm"
        >
          <Stethoscope className="h-4 w-4" />
          <span>{t('historyPage.profile.assess', 'Run Assessment')}</span>
        </Link>
      </div>

      {/* ── Top Row: Patient Profile + Visit History (Heatmap) ─── */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 items-stretch">
        {/* Patient Profile Card */}
        <section className="surface overflow-hidden p-3.5 sm:p-4 flex items-center">
          <div className="flex items-center gap-3.5 sm:gap-4 w-full">
            <UserAvatar
              name={patient?.full_name}
              src={patient?.avatar_url}
              shape="rounded"
              size="2xl"
              className="h-20 w-20 sm:h-22 sm:w-22 rounded-2xl text-xl sm:text-2xl shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-800 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {patient?.full_name || '—'}
              </h1>
              <div className="mt-1 space-y-0.5 text-xs sm:text-[13px] leading-snug">
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500">Age: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{age != null ? age : '—'}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500">Gender: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{genderLabel}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500">DOB: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{dobFormatted || '—'}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300 truncate">
                  <span className="text-slate-400 dark:text-slate-500">Address: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {patient?.address || (patient?.notes && patient.notes.length < 50 ? patient.notes : null) || patient?.phone || t('patientsPage.list.noPhone', 'No phone on file')}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Visit History Card (Heatmap & Stats) */}
        <section className="surface p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              {t('historyPage.header.visitHistory', 'Visit History')}
            </h3>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTopRangeMenu((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
              >
                <span>{topTimeRange}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
              {showTopRangeMenu && (
                <div className="absolute right-0 z-20 mt-1 w-32 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800 text-xs">
                  {['This Year', 'This Month', 'All Time'].map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => {
                        setTopTimeRange(range)
                        setShowTopRangeMenu(false)
                      }}
                      className={`w-full px-3 py-1.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                        topTimeRange === range ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-end justify-between gap-3 sm:gap-4">
            <div className="flex items-end gap-5 sm:gap-6 shrink-0">
              <div>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[#4f46e5] dark:text-indigo-400 leading-none">
                  {medicalCheckupCount}
                </p>
                <p className="mt-1 text-[11px] sm:text-xs font-normal text-slate-400 dark:text-slate-500">
                  {t('historyPage.visitHistory.checkup', 'Medical Checkup')}
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f43f5e] dark:text-rose-400 leading-none">
                  {emergencyCount}
                </p>
                <p className="mt-1 text-[11px] sm:text-xs font-normal text-slate-400 dark:text-slate-500">
                  {t('historyPage.visitHistory.emergency', 'Emergency')}
                </p>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto no-scrollbar py-0.5 shrink-0">
              <div className="grid grid-rows-5 grid-flow-col gap-1 sm:gap-1.5">
                {HEATMAP_MATRIX.map((row, rIdx) =>
                  row.map((val, cIdx) => (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-[2px] transition-colors ${
                        val === 3
                          ? 'bg-[#4f46e5] dark:bg-indigo-500'
                          : val === 2
                            ? 'bg-[#818cf8] dark:bg-indigo-400'
                            : val === 1
                              ? 'bg-[#c7d2fe] dark:bg-indigo-800/60'
                              : 'bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/40'
                      }`}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {error ? <p className="error-box">{error}</p> : null}

      {/* ── Tab Navigation ──────────────────────────────────── */}
      <nav className="flex gap-1 overflow-x-auto no-scrollbar" aria-label={t('historyPage.tabs.nav', 'Patient sections')}>
        {tabs.map((tab) => {
          const TabIcon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count != null && (
                <span className={`rounded-full px-1.5 text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-slate-900/30 dark:text-slate-900'
                    : 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── Overview Tab ────────────────────────────────────── */}
      {activeTab === 'overview' ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Medical Record Card */}
            <section className="surface overflow-hidden p-0">
              <div className="border-l-4 border-primary-600 px-5 py-4 dark:border-primary-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                    {t('historyPage.medical.title', 'Medical Record')}
                  </h3>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {t('historyPage.medical.lastUpdated', 'Last Updated')}{' '}
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {patient?.updated_at ? formatDateTime(patient.updated_at) : '—'}
                    </span>
                  </span>
                </div>
              </div>
              <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4 dark:bg-slate-800/50">
                {[
                  {
                    label: t('historyPage.medical.weight', 'Weight'),
                    value: patient?.weight_kg ? `${patient.weight_kg} kg` : '—',
                    icon: Weight,
                  },
                  {
                    label: t('historyPage.medical.height', 'Height'),
                    value: patient?.height_cm ? `${patient.height_cm} cm` : '—',
                    icon: Ruler,
                  },
                  {
                    label: t('historyPage.medical.hypertension', 'Hypertension'),
                    value: patient?.hypertension ? t('common.yes', 'Yes') : t('common.noSelection', 'No'),
                    icon: Heart,
                  },
                  {
                    label: t('historyPage.medical.familyHistory', 'Family History'),
                    value: patient?.family_history ? t('common.yes', 'Yes') : t('common.noSelection', 'No'),
                    icon: Activity,
                  },
                ].map((item) => {
                  const ItemIcon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-3 bg-white px-5 py-4 dark:bg-slate-900/60">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <ItemIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{item.label}</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Diagnosis History Table */}
            <section className="surface overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800/80">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t('historyPage.sections.diagnosisHistory', 'Diagnosis History')}
                </h3>
                {diagnosisCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('diagnoses')}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    {t('historyPage.overview.seeAll', 'See all')}
                  </button>
                )}
              </div>

              {!diagnosisCount ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('historyPage.overview.none', 'No assessments recorded yet.')}
                  </p>
                  <Link to={`/diagnosis?patient_id=${patientId}`} className="btn-primary rounded-lg px-3 py-1.5 text-xs shadow-sm">
                    {t('historyPage.profile.assess', 'Run Assessment')}
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {/* Table header */}
                  <div className="hidden items-center gap-4 bg-slate-50/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/30 dark:text-slate-400 md:flex">
                    <span className="min-w-0 flex-1">{t('historyPage.diagnosisTable.diagnosis', 'Diagnosis')}</span>
                    <span className="w-24 shrink-0 text-center">{t('historyPage.diagnosisTable.certainty', 'Certainty')}</span>
                    <span className="w-32 shrink-0">{t('historyPage.diagnosisTable.by', 'Assessed By')}</span>
                    <span className="w-36 shrink-0">{t('historyPage.sections.recorded_at', 'Date')}</span>
                    <span className="w-16 shrink-0" />
                  </div>

                  {(history?.diagnosis_history || []).slice(0, 5).map((diagnosis) => {
                    const cert = certaintyPercent(diagnosis.certainty)
                    return (
                      <div key={diagnosis.id} className="flex flex-wrap items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{diagnosis.diagnosis}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 md:hidden">
                            {formatDateTime(diagnosis.created_at)}
                          </p>
                        </div>
                        <div className="hidden w-24 shrink-0 justify-center md:flex">
                          <StatusBadge tone={certaintyBadgeTone(cert)}>
                            {cert != null ? `${cert}%` : 'N/A'}
                          </StatusBadge>
                        </div>
                        <div className="hidden w-32 shrink-0 md:block">
                          <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                            {diagnosis.diagnosed_by_name || '—'}
                          </p>
                        </div>
                        <div className="hidden w-36 shrink-0 md:block">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDateTime(diagnosis.created_at)}
                          </p>
                        </div>
                        <div className="w-16 shrink-0 text-right">
                          {diagnosis.id && (
                            <Link
                              to={`/diagnosis/result?diagnosis_result_id=${diagnosis.id}`}
                              className="inline-flex items-center rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-primary-950/40 dark:hover:text-primary-300 transition"
                              title={t('historyPage.overview.viewResult', 'View Result')}
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Column (Bottom Right) */}
          <div className="space-y-5">
            {/* Quick Stats */}
            <section className="surface p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('historyPage.sidebar.quickStats', 'Quick Stats')}
              </h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                      <Thermometer className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('historyPage.sections.symptoms', 'Symptoms')}</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{symptomCount}</p>
                    </div>
                  </div>
                  <Sparkline data={symptomSeries} color="#1f76e8" className="h-8 w-16 shrink-0" />
                </div>

                <div className="border-t border-slate-100 pt-4 dark:border-slate-800/50" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
                      <FlaskConical className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('historyPage.sections.labResults', 'Lab Results')}</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{labCount}</p>
                    </div>
                  </div>
                  <Sparkline data={labSeries} color="#0ea5e9" className="h-8 w-16 shrink-0" />
                </div>

                <div className="border-t border-slate-100 pt-4 dark:border-slate-800/50" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('historyPage.sections.diagnosisHistory', 'Diagnoses')}</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{diagnosisCount}</p>
                    </div>
                  </div>
                  <Sparkline data={diagnosisSeries} color="#6366f1" className="h-8 w-16 shrink-0" />
                </div>
              </div>
            </section>

            {/* Visit History Line Chart Card (Bottom Right) */}
            <section className="surface p-5 sm:p-6 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  {t('historyPage.header.visitHistory', 'Visit History')}
                </h3>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowRangeMenu((prev) => !prev)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                  >
                    <span>{timeRange}</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </button>
                  {showRangeMenu && (
                    <div className="absolute right-0 z-20 mt-1 w-32 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800 text-xs">
                      {['This Month', 'Last 3 Months', 'This Year'].map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => {
                            setTimeRange(range)
                            setShowRangeMenu(false)
                          }}
                          className={`w-full px-3 py-1.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                            timeRange === range ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                  {displayPercent}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <TrendingUp className="h-3 w-3" />
                    {trendValue}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {t('historyPage.visitHistory.thanLastMonth', 'Than last month')}
                  </span>
                </div>
              </div>

              <div className="mt-3 h-36 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visitHistoryData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800/80" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      dy={4}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      domain={[0, 150]}
                      ticks={[0, 30, 60, 90, 120, 150]}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-md dark:border-slate-700 dark:bg-slate-800 text-xs">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">{label}</p>
                            {payload.map((entry) => (
                              <p key={entry.name} style={{ color: entry.color }} className="font-medium mt-0.5">
                                {entry.name}: {entry.value}
                              </p>
                            ))}
                          </div>
                        )
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="newVisits"
                      name="New"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4, stroke: '#2563eb', strokeWidth: 2, fill: '#ffffff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="returningVisits"
                      name="Returning"
                      stroke="#93c5fd"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, stroke: '#93c5fd', strokeWidth: 2, fill: '#ffffff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 flex items-center justify-center gap-5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
                  <span>{t('historyPage.visitHistory.new', 'New')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-sky-300" />
                  <span>{t('historyPage.visitHistory.returning', 'Returning')}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {/* ── Diagnoses Tab ───────────────────────────────────── */}
      {activeTab === 'diagnoses' ? (
        <section className="surface overflow-hidden p-0">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800/80">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t('historyPage.sections.diagnosisHistory', 'Diagnosis History')}
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {/* Table header */}
            <div className="hidden items-center gap-4 bg-slate-50/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/30 dark:text-slate-400 md:flex">
              <span className="min-w-0 flex-1">{t('historyPage.diagnosisTable.diagnosis', 'Diagnosis')}</span>
              <span className="w-24 shrink-0 text-center">{t('historyPage.diagnosisTable.certainty', 'Certainty')}</span>
              <span className="w-32 shrink-0">{t('historyPage.diagnosisTable.by', 'Assessed By')}</span>
              <span className="w-36 shrink-0">{t('historyPage.sections.recorded_at', 'Date')}</span>
              <span className="w-16 shrink-0" />
            </div>

            {(history?.diagnosis_history || []).map((diagnosis) => {
              const cert = certaintyPercent(diagnosis.certainty)
              return (
                <div key={diagnosis.id} className="flex flex-wrap items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{diagnosis.diagnosis}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400 md:hidden">{formatDateTime(diagnosis.created_at)}</p>
                  </div>
                  <div className="hidden w-24 shrink-0 justify-center md:flex">
                    <StatusBadge tone={certaintyBadgeTone(cert)}>
                      {cert != null ? `${cert}%` : 'N/A'}
                    </StatusBadge>
                  </div>
                  <div className="hidden w-32 shrink-0 md:block">
                    <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                      {diagnosis.diagnosed_by_name || '—'}
                    </p>
                  </div>
                  <div className="hidden w-36 shrink-0 md:block">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(diagnosis.created_at)}</p>
                  </div>
                  <div className="w-16 shrink-0 text-right">
                    {diagnosis.id && (
                      <Link
                        to={`/diagnosis/result?diagnosis_result_id=${diagnosis.id}`}
                        className="inline-flex items-center rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-primary-100 hover:text-primary-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-primary-950/40 dark:hover:text-primary-300 transition"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}

            {!history?.diagnosis_history?.length && (
              <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                {t('historyPage.diagnosisTable.noHistory', 'No diagnosis history yet.')}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* ── Symptoms Tab ────────────────────────────────────── */}
      {activeTab === 'symptoms' ? (
        <section className="surface p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('historyPage.sections.symptoms', 'Symptoms')}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('historyPage.symptoms.desc', 'Record observed symptoms to enrich future assessments.')}</p>

          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={addSymptom}>
            <input
              className="input-base"
              required
              placeholder={t('historyPage.symptomForm.code', 'Symptom code (e.g. fatigue)')}
              value={symptomForm.symptom_code}
              onChange={(event) => setSymptomForm({ ...symptomForm, symptom_code: event.target.value })}
            />
            <input
              className="input-base"
              required
              placeholder={t('historyPage.symptomForm.name', 'Symptom name')}
              value={symptomForm.symptom_name}
              onChange={(event) => setSymptomForm({ ...symptomForm, symptom_name: event.target.value })}
            />
            <input
              className="input-base"
              type="number"
              min="1"
              max="10"
              placeholder={t('historyPage.symptomForm.severity', 'Severity 1-10')}
              value={symptomForm.severity}
              onChange={(event) => setSymptomForm({ ...symptomForm, severity: event.target.value })}
            />
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-800/40">
              <input
                type="checkbox"
                checked={symptomForm.present}
                onChange={(event) => setSymptomForm({ ...symptomForm, present: event.target.checked })}
              />
              {t('historyPage.symptomForm.present', 'Present now')}
            </label>
            <textarea
              className="input-base sm:col-span-2"
              rows={2}
              placeholder={t('historyPage.symptomForm.notes', 'Notes')}
              value={symptomForm.notes}
              onChange={(event) => setSymptomForm({ ...symptomForm, notes: event.target.value })}
            />
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!permissions.has('symptom.manage') || savingSymptom || !patient}>
                {savingSymptom ? t('historyPage.profile.saving', 'Saving...') : t('historyPage.symptomForm.add', 'Add Symptom')}
              </button>
            </div>
          </form>

          <div className="mt-4 table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t('historyPage.symptomForm.name', 'Symptom')}</th>
                  <th>{t('historyPage.symptomForm.severity', 'Severity')}</th>
                  <th>{t('historyPage.symptomForm.present', 'Present')}</th>
                  <th>{t('historyPage.sections.recorded', 'Recorded')}</th>
                </tr>
              </thead>
              <tbody>
                {(history?.symptoms || []).map((symptom) => (
                  <tr key={symptom.id}>
                    <td>{symptom.symptom_name}</td>
                    <td>{symptom.severity ?? 'N/A'}</td>
                    <td>{symptom.present ? t('common.yes', 'Yes') : t('common.noSelection', 'No')}</td>
                    <td>{formatDateTime(symptom.recorded_at)}</td>
                  </tr>
                ))}
                {!history?.symptoms?.length ? (
                  <tr>
                    <td colSpan="4"><div className="state-box">{t('historyPage.symptomForm.noHistory', 'No symptom history.')}</div></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* ── Labs Tab ────────────────────────────────────────── */}
      {activeTab === 'labs' ? (
        <section className="surface p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('historyPage.sections.labResults', 'Lab Results')}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('historyPage.labs.desc', 'Track glucose and HbA1c measurements over time.')}</p>

          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={addLabResult}>
            <input className="input-base" required placeholder={t('historyPage.labForm.testName', 'Test name')} value={labForm.test_name} onChange={(event) => setLabForm({ ...labForm, test_name: event.target.value })} />
            <input className="input-base" required type="number" step="0.01" placeholder={t('historyPage.labForm.testValue', 'Test value')} value={labForm.test_value} onChange={(event) => setLabForm({ ...labForm, test_value: event.target.value })} />
            <input className="input-base" placeholder={t('historyPage.labForm.unit', 'Unit')} value={labForm.unit} onChange={(event) => setLabForm({ ...labForm, unit: event.target.value })} />
            <input className="input-base" placeholder={t('historyPage.labForm.range', 'Reference range')} value={labForm.reference_range} onChange={(event) => setLabForm({ ...labForm, reference_range: event.target.value })} />
            <textarea className="input-base sm:col-span-2" rows={2} placeholder={t('historyPage.labForm.notes', 'Notes')} value={labForm.notes} onChange={(event) => setLabForm({ ...labForm, notes: event.target.value })} />
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!permissions.has('lab.manage') || savingLab || !patient}>
                {savingLab ? t('historyPage.profile.saving', 'Saving...') : t('historyPage.labForm.add', 'Add Lab Result')}
              </button>
            </div>
          </form>

          <div className="mt-4 table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t('historyPage.labForm.testName', 'Test')}</th>
                  <th>{t('historyPage.labForm.testValue', 'Value')}</th>
                  <th>{t('historyPage.labForm.range', 'Range')}</th>
                  <th>{t('historyPage.sections.recorded', 'Measured')}</th>
                </tr>
              </thead>
              <tbody>
                {(history?.lab_results || []).map((labResult) => (
                  <tr key={labResult.id}>
                    <td>{labResult.test_name}</td>
                    <td>{labResult.test_value}{labResult.unit ? ` ${labResult.unit}` : ''}</td>
                    <td>{labResult.reference_range || 'N/A'}</td>
                    <td>{formatDateTime(labResult.measured_at)}</td>
                  </tr>
                ))}
                {!history?.lab_results?.length ? (
                  <tr>
                    <td colSpan="4"><div className="state-box">{t('historyPage.labForm.noHistory', 'No lab history.')}</div></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* ── Profile Tab ─────────────────────────────────────── */}
      {activeTab === 'profile' ? (
        <section className="surface p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('historyPage.profile.title', 'Patient Profile')}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('historyPage.profile.desc', 'Manage demographics and monitor case history over time.')}</p>

          <form onSubmit={updateProfile} className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="label-text">{t('patientsPage.form.fullName', 'Full Name')}</span>
              <input className="input-base" required value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} />
            </label>

            <label className="block">
              <span className="label-text">{t('patientsPage.form.gender', 'Gender')}</span>
              <AppSelect
                value={profile.gender}
                onValueChange={(value) => setProfile({ ...profile, gender: value })}
                options={[
                  { value: 'unknown', label: t('common.unknown', 'Unknown') },
                  { value: 'male', label: t('common.male', 'Male') },
                  { value: 'female', label: t('common.female', 'Female') },
                  { value: 'other', label: t('common.other', 'Other') },
                ]}
              />
            </label>

            <label className="block">
              <span className="label-text">{t('patientsPage.form.dateOfBirth', 'Date of Birth')}</span>
              <input className="input-base" type="date" value={profile.date_of_birth || ''} onChange={(event) => setProfile({ ...profile, date_of_birth: event.target.value })} />
            </label>

            <label className="block md:col-span-2">
              <span className="label-text">{t('patientsPage.form.phone', 'Phone')}</span>
              <input className="input-base" value={profile.phone || ''} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
            </label>

            <label className="block md:col-span-2">
              <span className="label-text">{t('patientsPage.form.notes', 'Notes')}</span>
              <textarea className="input-base" value={profile.notes || ''} rows={3} onChange={(event) => setProfile({ ...profile, notes: event.target.value })} />
            </label>

            <div className="md:col-span-2">
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!permissions.has('patient.manage') || savingProfile || loading || !patient}>
                {savingProfile ? t('historyPage.profile.saving', 'Saving...') : t('historyPage.profile.updateProfile', 'Update Profile')}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  )
}