import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  Tooltip,
} from 'recharts'
import { Activity, AlertTriangle, RefreshCw, ArrowRight, Zap, Target, BookOpen, Layers } from 'lucide-react'
import {
  ChartContainer,
  SectionCard,
} from '@/components/ui'
import api, { getApiData } from '@/api/client'
import { formatDateTime } from '@/lib/datetime'
import { notify } from '@/lib/toast'
import { useLanguage } from '@/contexts/LanguageContext'

const DATE_RANGE_KEYS = [
  { key: 'kbDashboard.ranges.last7Days', fallback: 'Last 7 Days', value: 7 },
  { key: 'kbDashboard.ranges.last30Days', fallback: 'Last 30 Days', value: 30 },
  { key: 'kbDashboard.ranges.last90Days', fallback: 'Last 90 Days', value: 90 },
  { key: 'kbDashboard.ranges.thisYear', fallback: 'This Year', value: 365 },
  { key: 'kbDashboard.ranges.allTime', fallback: 'All Time', value: null },
]

export function KnowledgeBaseDashboard() {
  const { t, tExact } = useLanguage()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState(null)

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

  const dateRanges = useMemo(() => DATE_RANGE_KEYS.map(r => ({ label: t(r.key, r.fallback), value: r.value })), [t])

  const statsCards = useMemo(() => {
    const rangeLabel = dateRanges.find((r) => r.value === selectedRange)?.label || t('kbDashboard.ranges.allTime', 'All Time')
    const assessments = stats?.assessments?.value || 0
    return [
      {
        title: t('kbDashboard.cards.engineExecutions.title', 'Engine Executions'),
        description: rangeLabel,
        value: assessments,
        trend: t('kbDashboard.cards.engineExecutions.trend', '+12% from previous'),
        icon: Zap,
        iconClass: 'bg-violet-100/20 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-900/10 dark:text-violet-300',
        chartColor: '#8b5cf6',
        chartData: [{ value: 2 }, { value: 5 }, { value: 3 }, { value: 6 }, { value: assessments }],
      },
      {
        title: t('kbDashboard.cards.avgRules.title', 'Avg. Rules Triggered'),
        description: t('kbDashboard.cards.avgRules.desc', 'Per assessment'),
        value: '5.2',
        trend: t('kbDashboard.cards.avgRules.trend', 'Stable'),
        icon: Target,
        iconClass: 'bg-cyan-100/20 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/10 dark:text-cyan-300',
        chartColor: '#06b6d4',
        chartData: [{ value: 5.1 }, { value: 5.0 }, { value: 5.3 }, { value: 5.2 }, { value: 5.2 }],
      },
      {
        title: t('kbDashboard.cards.activeRules.title', 'Active Rules'),
        description: t('kbDashboard.cards.activeRules.desc', 'System-wide logic'),
        value: '39',
        trend: t('kbDashboard.cards.activeRules.trend', '+2 this month'),
        icon: BookOpen,
        iconClass: 'bg-emerald-100/20 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/10 dark:text-emerald-300',
        chartColor: '#10b981',
        chartData: [{ value: 37 }, { value: 37 }, { value: 38 }, { value: 39 }, { value: 39 }],
      },
      {
        title: t('kbDashboard.cards.accuracy.title', 'System Accuracy'),
        description: t('kbDashboard.cards.accuracy.desc', 'Estimated match rate'),
        value: '98.5%',
        trend: t('kbDashboard.cards.accuracy.trend', '+0.5% optimization'),
        icon: Layers,
        iconClass: 'bg-amber-100/20 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/10 dark:text-amber-300',
        chartColor: '#f59e0b',
        chartData: [{ value: 95 }, { value: 96.5 }, { value: 97 }, { value: 98 }, { value: 98.5 }],
      },
    ]
  }, [stats, selectedRange, t, dateRanges])

  // Mock data for new charts
  const categoryData = [
    { name: 'Diagnosis', value: 15, color: '#f43f5e' },
    { name: 'Triage', value: 10, color: '#f59e0b' },
    { name: 'Classification', value: 8, color: '#06b6d4' },
    { name: 'Recommendation', value: 6, color: '#10b981' },
  ]

  const topRules = [
    { id: 1, name: 'Classification: Age-Related Risk (≥45 Years)', category: 'classification', hits: 142 },
    { id: 2, name: 'Classification: Obesity Class I (BMI 30–34.9)', category: 'classification', hits: 118 },
    { id: 3, name: 'Diagnosis: Fasting Plasma Glucose ≥126 mg/dL', category: 'diagnosis', hits: 89 },
    { id: 4, name: 'Recommendation: Comprehensive Diabetes Management', category: 'recommendation', hits: 85 },
    { id: 5, name: 'Triage: Symptomatic Hypoglycemia (Shaking)', category: 'triage', hits: 41 },
  ]

  return (
    <div className="w-full space-y-6">
      
      {/* ── Date range toolbar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm dark:border-[#1b2342] dark:bg-[#0c1024]">
            {dateRanges.map((range) => (
              <button
                key={range.label}
                type="button"
                onClick={() => setSelectedRange(range.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-md ${
                  selectedRange === range.value
                    ? 'bg-cyan-600 text-white shadow-sm'
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
            {t('kbDashboard.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center surface gap-3 text-slate-500">
          <Activity className="h-5 w-5 animate-spin" />
          {t('kbDashboard.loading', 'Loading analytics...')}
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
                  className="surface flex h-full flex-col p-5 cursor-default transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{card.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{card.description}</p>
                    </div>
                    <span className={`inline-flex rounded-lg p-2 ${card.iconClass}`}>
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
                </article>
              )
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
             <SectionCard title={t('kbDashboard.ruleDistribution', 'Rule Distribution')} className="lg:col-span-1">
               <div className="flex h-[200px] items-center justify-center">
                 <ChartContainer config={{}} className="h-full w-full">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#334155', fontWeight: 500 }}
                      />
                    </PieChart>
                 </ChartContainer>
               </div>
               <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                 {categoryData.map(c => (
                   <div key={c.name} className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                     <span className="text-slate-600 dark:text-slate-400">{c.name} ({c.value})</span>
                   </div>
                 ))}
               </div>
             </SectionCard>

             <SectionCard title={t('kbDashboard.topTriggeredRules', 'Top Triggered Rules')} className="lg:col-span-2 overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-[#0c1024]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{t('kbDashboard.columns.rank', 'Rank')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{t('kbDashboard.columns.ruleName', 'Rule Name')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">{t('kbDashboard.columns.category', 'Category')}</th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">{t('kbDashboard.columns.hits', 'Hits')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-[#050816]">
                      {topRules.map((rule, index) => (
                        <tr key={rule.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-[#0c1024]">
                           <td className="whitespace-nowrap px-6 py-4 font-bold text-slate-400">#{index + 1}</td>
                           <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{tExact(rule.name)}</td>
                           <td className="px-6 py-4">
                             <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                               {rule.category}
                             </span>
                           </td>
                           <td className="whitespace-nowrap px-6 py-4 text-right font-mono text-emerald-600">{rule.hits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </SectionCard>
          </div>

          {/* Recent Cases table */}
          <section className="surface overflow-hidden p-0 mt-5">
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-[#1b2342]">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('kbDashboard.recentCases.title', 'Recent Cases')}</h3>
                <p className="mt-1 text-sm text-slate-500">{t('kbDashboard.recentCases.desc', `Latest ${stats?.recent_cases?.length || 0} diagnoses evaluated by the system.`, { count: stats?.recent_cases?.length || 0 })}</p>
              </div>
              <Link to="/patients" className="btn-secondary text-xs px-3 py-1.5 h-8">
                {t('kbDashboard.recentCases.viewAll', 'View All')} <ArrowRight className="ml-1.5 h-3 w-3" />
              </Link>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-[#0c1024]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('kbDashboard.recentCases.columns.patient', 'Patient')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('kbDashboard.recentCases.columns.diagnosis', 'Diagnosis')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('kbDashboard.recentCases.columns.assessedBy', 'Assessed By')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('kbDashboard.recentCases.columns.time', 'Time')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('kbDashboard.recentCases.columns.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-[#1b2342] dark:bg-[#050816]">
                  {stats?.recent_cases?.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-[#0c1024]">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900 dark:text-white">
                        <Link to={`/patients/${row.patient_id}`} className="hover:underline hover:text-cyan-600">{row.patient_name || `Patient #${row.patient_id}`}</Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {row.is_critical && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />}
                          <span className={`line-clamp-1 ${row.is_critical ? 'text-amber-700 dark:text-amber-400 font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                            {tExact(row.diagnosis)}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-500 dark:text-slate-400">{row.doctor_name || row.created_by_user_id || t('kbDashboard.recentCases.system', 'System')}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-500 dark:text-slate-400">{formatDateTime(row.created_at)}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {row.reviewed_at ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {t('kbDashboard.recentCases.reviewed', 'Reviewed')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            {t('kbDashboard.recentCases.pending', 'Pending')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!stats?.recent_cases || stats.recent_cases.length === 0) && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        {t('kbDashboard.recentCases.noCases', 'No recent cases found in the selected timeframe.')}
                      </td>
                    </tr>
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
