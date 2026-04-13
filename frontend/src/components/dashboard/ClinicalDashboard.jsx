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
} from '@/components/ui'
import api, { getApiData } from '@/api/client'
import { formatDateTime } from '@/lib/datetime'
import { notify } from '@/lib/toast'
import { useLanguage } from '@/contexts/LanguageContext'

/* ------------------------------------------------------------------ */
/*  Date-range presets                                                  */
/* ------------------------------------------------------------------ */
const DATE_RANGES = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
  { label: 'This Year', value: 365 },
  { label: 'All Time', value: null },
]

/* ------------------------------------------------------------------ */
/*  Chart configs (static)                                             */
/* ------------------------------------------------------------------ */
const areaChartConfig = {
  diagnosed: { label: 'Diagnosed', color: '#0891b2' },
  pending: { label: 'Pending', color: '#64748b' },
}

const pieChartConfig = {
  value: { label: 'Patients' },
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

  const fetchStats = useCallback(async (days) => {
    try {
      setLoading(true)
      const params = days ? { days } : {}
      const response = await api.get('/dashboard/clinical', { params })
      const data = getApiData(response)
      setStats(data)
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
      notify.error('Could not load dashboard statistics.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats(selectedRange)
  }, [selectedRange, fetchStats])

  const statsCards = useMemo(() => {
    if (!stats) return []
    const rangeLabel = DATE_RANGES.find((r) => r.value === selectedRange)?.label || t('dashboard.kpi.allTime', 'All Time')
    return [
      {
        title: t('dashboard.kpi.assessments', 'Assessments'),
        description: rangeLabel,
        value: stats.assessments.value,
        trend: stats.assessments.trend,
        icon: Microscope,
        iconClass: 'bg-cyan-100/20 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/10 dark:text-cyan-300 dark:ring-cyan-500/30',
        chartColor: '#0891b2',
        chartData: [{ value: 6 }, { value: 9 }, { value: 7 }, { value: 11 }, { value: 10 }, { value: Math.max(3, stats.assessments.value) }],
        href: '/my-results',
      },
      {
        title: t('dashboard.kpi.activePatients', 'Active Patients'),
        description: t('dashboard.kpi.totalRegistered', 'Total registered'),
        value: stats.active_patients.value,
        trend: stats.active_patients.trend,
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
        trend: stats.urgent_cases.trend,
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
        trend: stats.treatment_plans.trend,
        icon: Pill,
        iconClass: 'bg-emerald-100/20 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/10 dark:text-emerald-300 dark:ring-emerald-500/30',
        chartColor: '#059669',
        chartData: [{ value: 14 }, { value: 15 }, { value: 18 }, { value: 16 }, { value: 19 }, { value: Math.max(5, stats.treatment_plans.value) }],
        href: '/patients?has_diagnosis=true',
      },
    ]
  }, [stats, selectedRange])

  const monthlyTrendData = stats?.monthly_trend?.length ? stats.monthly_trend : null

  return (
    <div className="w-full space-y-6">
      {/* ── Hero banner ────────────────────────────────────────── */}
      <section className="surface overflow-hidden p-0">
        <div className="relative h-64 bg-cover bg-top bg-no-repeat sm:h-72" style={{ backgroundImage: 'url(/images/banner.png)' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent" />
          <div className="relative z-10 flex h-full items-center p-6 sm:p-8">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{t('dashboard.hero.dashboardTitle', `${activeRole} dashboard`, { role: activeRole })}</p>
              <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{t('dashboard.hero.title', 'Build Better Diabetes Care Pathways')}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                {t('dashboard.hero.desc', 'Monitor screening trends, review rule-driven outcomes, and coordinate medical follow-ups from one unified clinical dashboard.')}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/diagnosis" className="btn-primary">{t('dashboard.hero.startAssessment', 'Start Assessment')}</Link>
                <Link to="/patients" className="btn-secondary">{t('dashboard.hero.openPatients', 'Open Patients')}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Date range toolbar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('dashboard.toolbar.dateRange', 'Date Range')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-[#1b2342] dark:bg-[#0c1024]">
            {DATE_RANGES.map((range) => (
              <button
                key={range.label}
                type="button"
                onClick={() => setSelectedRange(range.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  selectedRange === range.value
                    ? 'bg-cyan-600 text-white shadow-inner'
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-[#1b2342] dark:bg-[#0c1024] dark:text-slate-400 dark:hover:bg-[#131a33] disabled:opacity-50"
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
          Loading dashboard data...
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

          {/* Recent Cases table */}
          <section className="surface overflow-hidden p-0">
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-[#1b2342]">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.recent.title', 'Recent Cases')}</h3>
                <p className="mt-1 text-sm text-slate-500">{t('dashboard.recent.desc', `Latest ${stats?.recent_cases?.length || 0} diagnoses awaiting review or recently completed.`, { count: stats?.recent_cases?.length || 0 })}</p>
              </div>
              <Link to="/patients" className="btn-secondary text-xs px-3 py-1.5 h-8">
                {t('dashboard.recent.viewAll', 'View All')} <ArrowRight className="ml-1.5 h-3 w-3" />
              </Link>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
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
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No diagnoses found for this period.</td></tr>
                  ) : (
                    stats?.recent_cases?.map((caseItem, index) => (
                      <tr
                        key={caseItem.id}
                        onClick={() => navigate(`/diagnosis/result?diagnosis_result_id=${caseItem.id}`)}
                        className={`transition-colors cursor-pointer ${
                          index % 2 === 0 ? 'bg-slate-50/70 dark:bg-[#070b1b]' : 'bg-white dark:bg-[#050816]'
                        } hover:bg-cyan-50 dark:hover:bg-cyan-900/10`}
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="font-medium text-slate-900 dark:text-slate-200">{caseItem.patient_name}</span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-700 dark:text-slate-300">{tExact(caseItem.diagnosis)}</span>
                            {caseItem.is_urgent && (
                              <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                                {t('dashboard.recent.urgent', 'Urgent')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-700 dark:text-slate-400">{caseItem.assessed_by}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            caseItem.status === 'Reviewed'
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

          {/* Charts row */}
          <div className="grid items-stretch gap-5 xl:grid-cols-2">
            <SectionCard className="h-full" title={t('dashboard.charts.volume', 'Diagnosis Volume vs Pending')} description={t('dashboard.charts.volumeDesc', 'Monthly clinical throughput (live data).')}>
              <ChartContainer config={areaChartConfig} className="h-[300px] w-full">
                {monthlyTrendData ? (
                  <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="diagnosed" stroke="var(--color-diagnosed)" fill="var(--color-diagnosed)" fillOpacity={0.2} strokeWidth={2} />
                    <Area type="monotone" dataKey="pending" stroke="var(--color-pending)" fill="var(--color-pending)" fillOpacity={0.12} strokeWidth={2} />
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
                    data={stats?.risk_classification || defaultRiskData}
                    cx="50%" cy="50%"
                    innerRadius={62} outerRadius={100}
                    paddingAngle={4}
                    dataKey="value" nameKey="name"
                    style={{ cursor: 'pointer' }}
                    onClick={(entry) => {
                      if (!entry || entry.name === 'No Data') return
                      const searchMap = {
                        'Normal Risk': 'search=low+risk',
                        'Prediabetes': 'search=prediabetes',
                        'Diabetes': 'search=diabetes',
                      }
                      navigate(`/patients?has_diagnosis=true&${searchMap[entry.name] || ''}`)
                    }}
                  >
                    {(stats?.risk_classification || defaultRiskData).map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} className="transition-opacity hover:opacity-80" />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  )
}
