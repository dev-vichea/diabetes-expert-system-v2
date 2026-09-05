import { useEffect, useState, useMemo, useCallback } from 'react'
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
import { Activity, AlertTriangle, CalendarDays, Microscope, Pill, Users, ArrowRight, RefreshCw } from 'lucide-react'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  SectionCard,
  UserAvatar,
} from '@/components/ui'
import api, { getApiData } from '@/api/client'
import { formatDateTime } from '@/lib/datetime'
import { notify } from '@/lib/toast'
import { useLanguage } from '@/contexts/LanguageContext'

/* ------------------------------------------------------------------ */
/*  Date-range presets                                                  */
/* ------------------------------------------------------------------ */
const DATE_RANGE_CONFIG = [
  { key: 'dashboard.ranges.last7Days', fallback: 'Last 7 Days', value: 7 },
  { key: 'dashboard.ranges.last30Days', fallback: 'Last 30 Days', value: 30 },
  { key: 'dashboard.ranges.last90Days', fallback: 'Last 90 Days', value: 90 },
  { key: 'dashboard.ranges.thisYear', fallback: 'This Year', value: 365 },
  { key: 'dashboard.ranges.allTime', fallback: 'All Time', value: null },
]

function translateTrend(trend, t) {
  if (!trend) return ''
  const str = String(trend).trim()

  if (str === 'Total registered') {
    return t('dashboard.kpi.totalRegistered', 'Total registered')
  }
  if (str === 'Awaiting review') {
    return t('dashboard.kpi.awaitingReview', 'Awaiting review')
  }
  if (str === 'Recommendations issued') {
    return t('dashboard.kpi.recommendationsIssued', 'Recommendations issued')
  }

  // Matches "-25% from yesterday", "+10% from yesterday", "0% from yesterday"
  const yesterdayMatch = str.match(/^([+-]?\d+%)\s+from\s+yesterday$/i)
  if (yesterdayMatch) {
    return t('dashboard.kpi.trendYesterday', '{{pct}} from yesterday', { pct: yesterdayMatch[1] })
  }

  // Matches "+10% from prev 7d", "-5% from prev 30d"
  const prevDaysMatch = str.match(/^([+-]?\d+%)\s+from\s+prev\s+(\d+)d$/i)
  if (prevDaysMatch) {
    return t('dashboard.kpi.trendPrevDays', '{{pct}} from prev {{days}}d', { pct: prevDaysMatch[1], days: prevDaysMatch[2] })
  }

  // Matches "+3 new"
  const newMatch = str.match(/^\+(\d+)\s+new$/i)
  if (newMatch) {
    return t('dashboard.kpi.trendNew', '+{{count}} new', { count: newMatch[1] })
  }

  // Matches "+9 today"
  const todayMatch = str.match(/^\+(\d+)\s+today$/i)
  if (todayMatch) {
    return t('dashboard.kpi.trendToday', '+{{count}} today', { count: todayMatch[1] })
  }

  // Matches "Total conducted"
  if (/^total conducted$/i.test(str)) {
    return t('dashboard.kpi.totalConducted', 'Total conducted')
  }

  // Matches "No data in ..."
  if (/^no data in/i.test(str)) {
    return t('dashboard.kpi.trendNoData', 'No data in period')
  }

  return str
}

const defaultRiskData = [
  { name: 'Normal Risk', value: 44, fill: '#0ea5e9' },
  { name: 'Prediabetes', value: 33, fill: '#f59e0b' },
  { name: 'Diabetes', value: 23, fill: '#ef4444' },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function ClinicalDashboard({ activeRole }) {
  const navigate = useNavigate()
  const { t, tExact } = useLanguage()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState(null) // null = all-time

  const dateRanges = useMemo(
    () =>
      DATE_RANGE_CONFIG.map((r) => ({
        label: t(r.key, r.fallback),
        value: r.value,
      })),
    [t]
  )

  const areaChartConfig = useMemo(
    () => ({
      diagnosed: { label: t('dashboard.charts.diagnosed', 'Total Diagnosed'), color: '#2563eb' },
      pending: { label: t('dashboard.charts.pending', 'Pending Review'), color: '#f59e0b' },
      reviewed: { label: t('dashboard.charts.reviewed', 'Reviewed'), color: '#10b981' },
    }),
    [t]
  )

  const pieChartConfig = useMemo(
    () => ({
      value: { label: t('dashboard.charts.patients', 'Patients') },
    }),
    [t]
  )

  const fetchStats = useCallback(async (days) => {
    try {
      setLoading(true)
      const params = days ? { days } : {}
      const response = await api.get('/dashboard/clinical', { params })
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
    fetchStats(selectedRange)
  }, [selectedRange, fetchStats])

  const statsCards = useMemo(() => {
    if (!stats) return []
    const activeRange = dateRanges.find((r) => r.value === selectedRange)
    const rangeLabel = activeRange?.label || t('dashboard.kpi.allTime', 'All Time')
    return [
      {
        title: t('dashboard.kpi.assessments', 'Assessments'),
        description: rangeLabel,
        value: stats.assessments.value,
        trend: translateTrend(stats.assessments.trend, t),
        icon: Microscope,
        iconClass: 'bg-primary-100/20 text-primary-700 ring-1 ring-primary-200 dark:bg-primary-900/10 dark:text-primary-300 dark:ring-primary-500/30',
        chartColor: '#1f76e8',
        chartData: [{ value: 6 }, { value: 9 }, { value: 7 }, { value: 11 }, { value: 10 }, { value: Math.max(3, stats.assessments.value) }],
        href: '/my-results',
      },
      {
        title: t('dashboard.kpi.activePatients', 'Active Patients'),
        description: t('dashboard.kpi.totalRegistered', 'Total registered'),
        value: stats.active_patients.value,
        trend: translateTrend(stats.active_patients.trend, t),
        icon: Users,
        iconClass: 'bg-sky-100/20 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/10 dark:text-sky-300 dark:ring-sky-500/30',
        chartColor: '#0ea5e9',
        chartData: [{ value: 18 }, { value: 20 }, { value: 21 }, { value: 24 }, { value: 22 }, { value: Math.max(10, stats.active_patients.value) }],
        href: '/patients',
      },
      {
        title: t('dashboard.kpi.urgentCases', 'Urgent Cases'),
        description: t('dashboard.kpi.awaitingReview', 'Awaiting review'),
        value: stats.urgent_cases.value,
        trend: translateTrend(stats.urgent_cases.trend, t),
        icon: AlertTriangle,
        iconClass: 'bg-amber-100/20 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/10 dark:text-amber-300 dark:ring-amber-500/30',
        chartColor: '#d97706',
        chartData: [{ value: 5 }, { value: 8 }, { value: 7 }, { value: 9 }, { value: 8 }, { value: Math.max(2, stats.urgent_cases.value) }],
        href: '/review',
      },
      {
        title: t('dashboard.kpi.treatmentPlans', 'Treatment Plans'),
        description: rangeLabel,
        value: stats.treatment_plans.value,
        trend: translateTrend(stats.treatment_plans.trend, t),
        icon: Pill,
        iconClass: 'bg-emerald-100/20 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/10 dark:text-emerald-300 dark:ring-emerald-500/30',
        chartColor: '#059669',
        chartData: [{ value: 14 }, { value: 15 }, { value: 18 }, { value: 16 }, { value: 19 }, { value: Math.max(5, stats.treatment_plans.value) }],
        href: '/patients?has_diagnosis=true',
      },
    ]
  }, [stats, selectedRange, t, dateRanges])

  const riskClassificationData = useMemo(() => {
    const raw = stats?.risk_classification || defaultRiskData
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

  const throughputSummary = useMemo(() => {
    if (!monthlyTrendData?.length) return null
    const totalDiagnosed = monthlyTrendData.reduce((acc, curr) => acc + (curr.diagnosed || 0), 0)
    const totalPending = monthlyTrendData.reduce((acc, curr) => acc + (curr.pending || 0), 0)
    const totalReviewed = monthlyTrendData.reduce((acc, curr) => acc + (curr.reviewed || 0), 0)
    return { totalDiagnosed, totalPending, totalReviewed }
  }, [monthlyTrendData])

  return (
    <div className="w-full space-y-6">
      {/* ── Hero banner ────────────────────────────────────────── */}
      <section className="surface overflow-hidden p-0">
        <div className="relative min-h-[18rem] bg-cover bg-center bg-no-repeat sm:min-h-[18rem]" style={{ backgroundImage: 'url(/images/banner.png)' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent" />
          <div className="relative z-10 flex min-h-[18rem] items-center p-4 sm:p-8">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-200">{t('dashboard.hero.dashboardTitle', `${activeRole} dashboard`, { role: activeRole })}</p>
              <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">{t('dashboard.hero.title', 'Build Better Diabetes Care Pathways')}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                {t('dashboard.hero.desc', 'Monitor screening trends, review rule-driven outcomes, and coordinate medical follow-ups from one unified clinical dashboard.')}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/diagnosis" className="btn-primary">{t('dashboard.hero.startAssessment', 'Start Assessment')}</Link>
                <Link to="/patients" className="btn-secondary">{t('dashboard.hero.openPatients', 'Open Patients')}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Date range toolbar ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('dashboard.toolbar.dateRange', 'Date Range')}</span>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex max-w-full items-center overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-[#1b2342] dark:bg-[#0c1024]">
            {dateRanges.map((range) => (
              <button
                key={range.value ?? 'all'}
                type="button"
                onClick={() => setSelectedRange(range.value)}
                className={`min-h-10 shrink-0 px-3 py-1.5 text-xs font-medium transition-all duration-200 ${selectedRange === range.value
                    ? 'bg-primary-600 text-white shadow-inner'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#131a33]'
                  }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => fetchStats(selectedRange)}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-[#1b2342] dark:bg-[#0c1024] dark:text-slate-400 dark:hover:bg-[#131a33] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('dashboard.toolbar.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center surface gap-3 text-slate-500">
          <Activity className="h-5 w-5 animate-spin" />
          {t('dashboard.loading', 'Loading dashboard data...')}
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
            {statsCards.map((card) => {
              const Icon = card.icon
              return (
                <article
                  key={card.title}
                  onClick={() => navigate(card.href)}
                  className="surface flex h-full flex-col p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{card.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{card.description}</p>
                    </div>
                    <span className={`inline-flex rounded-lg p-2 ${card.iconClass} transition-transform group-hover:scale-110`}>
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                  <p className={`mt-1 text-xs ${String(card.trend).startsWith('-') ? 'text-rose-500' : 'text-emerald-600'}`}>{card.trend}</p>
                  <ChartContainer className="mt-auto h-16 w-full pt-4" config={{ value: { label: card.title, color: card.chartColor } }}>
                    <AreaChart data={card.chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <Area type="monotone" dataKey="value" stroke={card.chartColor} fill={card.chartColor} fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ChartContainer>
                  <p className="mt-2 text-[10px] font-medium text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">{t('dashboard.kpi.clickToView', 'Click to view details →')}</p>
                </article>
              )
            })}
          </div>

          {/* Charts row */}
          <div className="grid items-stretch gap-5 xl:grid-cols-2">
            <SectionCard
              className="h-full"
              title={t('dashboard.charts.volume', 'Diagnosis Volume vs. Pending Review')}
              description={t('dashboard.charts.volumeDesc', 'Clinical throughput: total evaluations conducted, cases awaiting review, and completed sign-offs.')}
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

            <SectionCard className="h-full" title={t('dashboard.charts.risk', 'Risk Classification')} description={t('dashboard.charts.riskDesc', 'Click a slice to filter patients by risk level.')}>
              <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={riskClassificationData}
                    cx="50%" cy="50%"
                    innerRadius={62} outerRadius={100}
                    paddingAngle={4}
                    dataKey="value" nameKey="name"
                    style={{ cursor: 'pointer' }}
                    onClick={(entry) => {
                      if (!entry || entry.rawName === 'No Data' || entry.name === 'No Data') return
                      const searchMap = {
                        'Normal Risk': 'search=low+risk',
                        'Prediabetes': 'search=prediabetes',
                        'Diabetes': 'search=diabetes',
                      }
                      const key = entry.rawName || entry.name
                      navigate(`/patients?has_diagnosis=true&${searchMap[key] || ''}`)
                    }}
                  >
                    {riskClassificationData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} className="transition-opacity hover:opacity-80" />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </SectionCard>
          </div>

          {/* Recent Cases table */}
          <section className="surface overflow-hidden p-0">
            <header className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 dark:border-[#1b2342] sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.recent.title', 'Recent Cases')}</h3>
                <p className="mt-1 text-sm text-slate-500">{t('dashboard.recent.desc', `Latest ${stats?.recent_cases?.length || 0} diagnoses awaiting review or recently completed.`, { count: stats?.recent_cases?.length || 0 })}</p>
              </div>
              <Link to="/patients" className="btn-secondary px-3 py-1.5 text-xs sm:h-8 sm:min-h-0">
                {t('dashboard.recent.viewAll', 'View All')} <ArrowRight className="ml-1.5 h-3 w-3" />
              </Link>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 dark:bg-[#0c1024]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('dashboard.recent.columns.patient', 'Patient')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('dashboard.recent.columns.diagnosis', 'Diagnosis')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('dashboard.recent.columns.assessedBy', 'Assessed By')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('dashboard.recent.columns.status', 'Status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('dashboard.recent.columns.date', 'Date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-[#1b2342] dark:bg-[#050816]">
                  {stats?.recent_cases?.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">{t('dashboard.recent.noDiagnoses', 'No diagnoses found for this period.')}</td></tr>
                  ) : (
                    stats?.recent_cases?.map((caseItem, index) => (
                      <tr
                        key={caseItem.id}
                        onClick={() => navigate(`/diagnosis/result?diagnosis_result_id=${caseItem.id}`)}
                        className={`transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-slate-50/70 dark:bg-[#070b1b]' : 'bg-white dark:bg-[#050816]'
                          } hover:bg-primary-50 dark:hover:bg-primary-900/10`}
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={caseItem.patient_name} size="sm" />
                            <span className="font-medium text-slate-900 dark:text-slate-200">{caseItem.patient_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="min-w-0 break-words text-slate-700 dark:text-slate-300">{tExact(caseItem.diagnosis)}</span>
                            {caseItem.is_urgent && (
                              <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                                {t('dashboard.recent.urgent', 'Urgent')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-700 dark:text-slate-400">{caseItem.assessed_by}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${caseItem.status === 'Reviewed'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                            {caseItem.status === 'Reviewed' ? t('dashboard.recent.reviewed', 'Reviewed') : t('dashboard.recent.pending', 'Pending')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                          {formatDateTime(caseItem.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </>
      )}
    </div>
  )
}
