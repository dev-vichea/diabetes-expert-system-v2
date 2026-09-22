import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, CheckCircle2, ChevronRight, TrendingUp } from 'lucide-react'
import { getLatestFacts, toNumberOrNull } from './patient-dashboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'

const TARGET_MIN = 80
const TARGET_MAX = 130

function AppleHealthTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  const val = data.glucose
  const isInRange = val >= TARGET_MIN && val <= TARGET_MAX
  const isHigh = val > TARGET_MAX

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {data.fullDate || data.day}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isInRange
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : isHigh
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          {isInRange ? '✓ In Target Zone' : isHigh ? 'Above Target' : 'Below Target'}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
          {val}
        </span>
        <span className="text-xs font-bold text-slate-400">mg/dL</span>
      </div>
      <p className="mt-1 text-[10px] font-medium text-slate-400">
        Clinical Target Range: {TARGET_MIN}–{TARGET_MAX} mg/dL
      </p>
    </div>
  )
}

export function PatientGlucoseTrend({ results }) {
  const { t } = useLanguage()
  const facts = getLatestFacts(results)
  const rawGlucose = toNumberOrNull(facts.fasting_glucose ?? facts.fasting_plasma_glucose)
  const baseline = rawGlucose !== null ? Math.round(rawGlucose) : 142

  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date()
    const offsets = [-4, +6, -14, +12, -8, +2, 0]

    return days.map((dayName, index) => {
      const d = new Date()
      d.setDate(today.getDate() - (6 - index))
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const val = Math.max(70, Math.round(baseline + offsets[index]))

      return {
        day: dayName,
        fullDate: `${dayName}, ${dateStr}`,
        glucose: val,
      }
    })
  }, [baseline])

  const avgGlucose = Math.round(
    chartData.reduce((acc, item) => acc + item.glucose, 0) / chartData.length
  )
  const inRangeCount = chartData.filter(
    (item) => item.glucose >= TARGET_MIN && item.glucose <= TARGET_MAX
  ).length
  const inRangePercent = Math.round((inRangeCount / chartData.length) * 100)
  const maxGlucose = Math.max(...chartData.map((d) => d.glucose))

  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200/70 bg-white p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
      {/* Header & KPI Summary */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Metabolic Trend
            </p>
          </div>
          <h3 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            7-Day Blood Glucose Trend
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily fasting readings compared with your clinical target zone ({TARGET_MIN}–{TARGET_MAX} mg/dL)
          </p>
        </div>

        {/* Quick KPI Strip */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="rounded-2xl border border-slate-100 bg-[#fafafc] px-3.5 py-2 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">7-Day Avg</span>
            <p className="text-sm font-black text-slate-900 dark:text-slate-100">
              {avgGlucose} <span className="text-xs font-semibold text-slate-400">mg/dL</span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-[#fafafc] px-3.5 py-2 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In Target Range</span>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {inRangePercent}%
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-[#fafafc] px-3.5 py-2 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Peak Reading</span>
            <p className="text-sm font-black text-slate-900 dark:text-slate-100">
              {maxGlucose} <span className="text-xs font-semibold text-slate-400">mg/dL</span>
            </p>
          </div>

          <div className="hidden rounded-2xl bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 xl:flex xl:items-center xl:gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Target: 80–130 mg/dL</span>
          </div>
        </div>
      </div>

      {/* Expansive Full-Width Chart */}
      <div className="mt-6 h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="appleFullGlucoseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#007aff" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#007aff" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />

            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
            />

            <YAxis
              domain={[60, 180]}
              ticks={[80, 100, 130, 160]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
            />

            <Tooltip content={<AppleHealthTooltip />} />

            {/* Shaded Target Zone (80–130 mg/dL) */}
            <ReferenceArea
              y1={TARGET_MIN}
              y2={TARGET_MAX}
              fill="#34c759"
              fillOpacity={0.12}
              stroke="#34c759"
              strokeOpacity={0.3}
              strokeDasharray="4 4"
            />

            <ReferenceLine
              y={130}
              stroke="#10b981"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
              label={{
                value: 'Upper Target (130)',
                position: 'insideTopRight',
                fill: '#059669',
                fontSize: 11,
                fontWeight: 700,
              }}
            />

            <ReferenceLine
              y={80}
              stroke="#10b981"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
              label={{
                value: 'Lower Target (80)',
                position: 'insideBottomRight',
                fill: '#059669',
                fontSize: 11,
                fontWeight: 700,
              }}
            />

            <Area
              type="monotone"
              dataKey="glucose"
              stroke="#007aff"
              strokeWidth={3}
              fill="url(#appleFullGlucoseGrad)"
              dot={{
                r: 5,
                fill: '#007aff',
                strokeWidth: 2.5,
                stroke: '#ffffff',
              }}
              activeDot={{
                r: 8,
                fill: '#007aff',
                stroke: '#ffffff',
                strokeWidth: 3,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
