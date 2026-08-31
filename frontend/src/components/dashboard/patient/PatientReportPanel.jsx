import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Activity, CalendarClock, ClipboardPlus, ShieldAlert } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState, LoadingState, SectionCard } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  buildConfidenceSeries,
  buildMonthlyActivity,
  getRelativeCheckAge,
  toPercentValue,
} from './patient-dashboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'

const BRAND = '#1f76e8'
const URGENT = '#e11d48'

function ChartTooltip({ active, payload, label, suffix }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">
        {payload[0].value}
        {suffix}
      </p>
    </div>
  )
}

function ReportStat({ icon: Icon, tone, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/30">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          tone === 'danger'
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300'
            : tone === 'success'
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300'
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50">{value}</p>
      </div>
    </div>
  )
}

function confidenceDot(dotProps) {
  const { cx, cy, index, payload } = dotProps
  if (cx === undefined || cy === undefined) return null
  return (
    <circle
      key={`dot-${index}`}
      cx={cx}
      cy={cy}
      r={payload?.urgent ? 4 : 3}
      fill={payload?.urgent ? URGENT : BRAND}
      stroke="#fff"
      strokeWidth={1.5}
    />
  )
}

function useMonthlyActivity(results, language) {
  return useMemo(() => buildMonthlyActivity(results, language), [results, language])
}

function useConfidenceSeries(results) {
  return useMemo(() => buildConfidenceSeries(results), [results])
}

export function PatientReportPanel({ results, loading }) {
  const { language, t } = useLanguage()
  const hasResults = Array.isArray(results) && results.length > 0
  const activity = useMonthlyActivity(results, language)
  const confidenceSeries = useConfidenceSeries(results)

  const latest = hasResults ? results[0] : null
  const urgentCount = hasResults ? results.filter((item) => item.is_urgent).length : 0

  return (
    <SectionCard
      title={t('patientDashboard.report.title', 'Health report')}
      description={t('patientDashboard.report.description', 'What your assessments show over time.')}
    >
      {loading ? (
        <LoadingState label={t('patientDashboard.recentAssessments.loading', 'Loading your assessments...')} />
      ) : !hasResults ? (
        <EmptyState
          icon={Activity}
          title={t('patientDashboard.report.emptyTitle', 'Your report is waiting for data')}
          description={t(
            'patientDashboard.report.emptyDescription',
            'Complete assessments and this report fills itself in — activity, confidence trends, and key numbers over time.'
          )}
          action={
            <Link
              to="/diagnosis"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <ClipboardPlus className="h-4 w-4" />
              {t('patientDashboard.report.emptyCta', 'Start my first assessment')}
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {/* Summary stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ReportStat
              icon={ClipboardPlus}
              label={t('patientDashboard.report.totalAssessments', 'Total assessments')}
              value={results.length}
            />
            <ReportStat
              icon={ShieldAlert}
              tone={urgentCount > 0 ? 'danger' : 'success'}
              label={t('patientDashboard.report.urgentFlags', 'Urgent flags')}
              value={urgentCount}
            />
            <ReportStat
              icon={CalendarClock}
              label={t('patientDashboard.report.lastCheck', 'Last check')}
              value={getRelativeCheckAge(latest?.created_at, t) ?? t('patientDashboard.hero.lastCheckNever', 'No checks yet')}
            />
            <ReportStat
              icon={Activity}
              label={t('patientDashboard.report.latestConfidence', 'Latest confidence')}
              value={`${toPercentValue(latest?.certainty)}%`}
            />
          </div>
          {/* Charts */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/30">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t('patientDashboard.report.activityTitle', 'Assessment activity')}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {t('patientDashboard.report.activityHint', 'Assessments completed per month — last 6 months')}
                </p>
              </div>
              <div className="mt-3 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activity} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#94a3b8" strokeOpacity={0.25} strokeDasharray="4 4" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={4} />
                    <YAxis hide allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(31, 118, 232, 0.08)' }}
                      content={<ChartTooltip suffix={` ${t('patientDashboard.hero.assessments', 'Assessments')}`} />}
                    />
                    <Bar dataKey="count" fill={BRAND} radius={[6, 6, 2, 2]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/30">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t('patientDashboard.report.trendTitle', 'Confidence trend')}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {t('patientDashboard.report.trendHint', 'Expert-system confidence for each assessment')}
                </p>
              </div>
              {confidenceSeries.length ? (
                <div className="mt-3 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={confidenceSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="confidence-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={BRAND} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#94a3b8" strokeOpacity={0.25} strokeDasharray="4 4" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={4} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip cursor={{ stroke: '#94a3b8', strokeOpacity: 0.4 }} content={<ChartTooltip suffix="%" />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={BRAND}
                        strokeWidth={2}
                        fill="url(#confidence-fill)"
                        dot={confidenceDot}
                        activeDot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-44 items-center justify-center px-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  {t('patientDashboard.report.noTrendData', 'Confidence appears once an assessment produces a diagnosis.')}
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {t('patientDashboard.health.disclaimer', 'Screening reference only — always confirm results with your clinician.')}
          </p>

        </div>
      )}
    </SectionCard>
  )
}

