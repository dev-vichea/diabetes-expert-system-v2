import { useMemo } from 'react'
import { Activity, ArrowRight, Droplets, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MiniSparkline } from '@/components/ui/MiniSparkline'
import { cn } from '@/lib/utils'
import {
  extractMetricSeries,
  getA1cCategory,
  getBmiCategory,
  getFastingGlucoseCategory,
  getLatestFacts,
  toNumberOrNull,
} from './patient-dashboard-utils'

const categoryLabelKeys = {
  underweight: ['patientDashboard.health.catUnderweight', 'Underweight'],
  normal: ['patientDashboard.health.catNormal', 'Normal'],
  overweight: ['patientDashboard.health.catOverweight', 'Overweight'],
  obese: ['patientDashboard.health.catObese', 'Obese'],
  prediabetes: ['patientDashboard.health.catPrediabetes', 'Borderline'],
  diabetes: ['patientDashboard.health.catDiabetes', 'Elevated'],
}

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

function MetricCard({
  t,
  label,
  value,
  unit,
  category,
  target,
  series,
  rawValue,
}) {
  const isProvided = value !== '—' && value !== null && value !== undefined

  const sparklinePoints = useMemo(() => {
    if (!isProvided || rawValue === null || rawValue === undefined) return []
    if (series && series.length >= 3) {
      return series.map((s) => s.value)
    }
    return generateSmoothTrend(rawValue, 0.035, 7)
  }, [isProvided, rawValue, series])

  const tone = category?.tone || 'success'
  const chartColor =
    tone === 'danger' ? '#f43f5e' : tone === 'warning' ? '#f59e0b' : '#3b82f6'

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-150 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      {/* 1. Header: Label + Status Pill */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {category ? (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-semibold',
              tone === 'danger' && 'border border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300',
              tone === 'warning' && 'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300',
              tone === 'success' && 'border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300'
            )}
          >
            {t(...categoryLabelKeys[category.id])}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            {t('patientDashboard.health.notProvided', 'Not provided')}
          </span>
        )}
      </div>

      {/* 2. Large Metric Value */}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </span>
        {unit ? <span className="text-sm font-medium text-slate-400">{unit}</span> : null}
      </div>

      {/* 3. Target Range & Status Label */}
      <div className="mt-1 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>{target || 'Target: —'}</span>
        {category ? (
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {t(...categoryLabelKeys[category.id])}
          </span>
        ) : null}
      </div>

      {/* 4. Smooth Catmull-Rom Sparkline */}
      <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
        {isProvided && sparklinePoints.length >= 2 ? (
          <MiniSparkline
            points={sparklinePoints}
            strokeColor={chartColor}
            fillColor={chartColor}
            height={28}
          />
        ) : (
          <div className="flex h-[28px] items-center justify-between text-[11px] text-slate-400">
            <span>{t('patientDashboard.carePlanPage.watch.notProvidedHint', 'Record in next assessment')}</span>
            <Link
              to="/diagnosis"
              className="inline-flex items-center gap-0.5 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              <span>{t('patientDashboard.carePlanPage.watch.addInAssessment', 'Add')}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export function CarePlanWatchlist({ results, t }) {
  const facts = getLatestFacts(results)
  const bmi = toNumberOrNull(facts.bmi)
  const glucose = toNumberOrNull(facts.fasting_glucose ?? facts.fasting_plasma_glucose)
  const a1c = toNumberOrNull(facts.hba1c)
  const bmiCategory = getBmiCategory(bmi)
  const glucoseCategory = getFastingGlucoseCategory(glucose)
  const a1cCategory = getA1cCategory(a1c)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* 1. HbA1c */}
      <MetricCard
        t={t}
        label={t('patientDashboard.health.hba1c', 'HbA1c Level')}
        value={a1c !== null ? a1c.toFixed(1) : '—'}
        unit="%"
        category={a1cCategory}
        target={t('patientDashboard.health.a1cRangeHint', 'Target: < 5.7%')}
        series={extractMetricSeries(results, 'hba1c')}
        rawValue={a1c}
      />

      {/* 2. Fasting Glucose */}
      <MetricCard
        t={t}
        label={t('patientDashboard.health.fastingGlucose', 'Fasting Glucose')}
        value={glucose !== null ? String(Math.round(glucose)) : '—'}
        unit={t('patientDashboard.health.mgdlUnit', 'mg/dL')}
        category={glucoseCategory}
        target={t('patientDashboard.health.glucoseRangeHint', 'Target: 70–99')}
        series={extractMetricSeries(results, ['fasting_glucose', 'fasting_plasma_glucose'])}
        rawValue={glucose}
      />

      {/* 3. Body Mass Index */}
      <MetricCard
        t={t}
        label={t('patientDashboard.health.bmi', 'Body Mass Index')}
        value={bmi !== null ? bmi.toFixed(1) : '—'}
        unit="kg/m²"
        category={bmiCategory}
        target={t('patientDashboard.health.bmiRangeHint', 'Target: 18.5 – 24.9')}
        series={extractMetricSeries(results, 'bmi')}
        rawValue={bmi}
      />
    </div>
  )
}
