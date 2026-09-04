import { Activity, ArrowRight, Droplets, Plus, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionCard } from '@/components/ui'
import { Sparkline } from '@/components/ui/Sparkline'
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
  prediabetes: ['patientDashboard.health.catPrediabetes', 'Prediabetes range'],
  diabetes: ['patientDashboard.health.catDiabetes', 'Diabetes range'],
}

const toneStyles = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60',
}

const accents = {
  bmi: {
    bg: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
    marker: 'bg-violet-600 ring-violet-200 dark:ring-violet-900',
  },
  glucose: {
    bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
    marker: 'bg-amber-600 ring-amber-200 dark:ring-amber-900',
  },
  a1c: {
    bg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
    marker: 'bg-sky-600 ring-sky-200 dark:ring-sky-900',
  },
}

function calculateGaugePercent(value, min, max) {
  if (value === null || value === undefined) return null
  const clamped = Math.min(Math.max(value, min), max)
  return Math.round(((clamped - min) / (max - min)) * 100)
}

function ClinicalGauge({ percent, tone, t }) {
  if (percent === null) return null

  const markerColor =
    tone === 'success'
      ? 'bg-emerald-600 ring-emerald-200 dark:ring-emerald-900'
      : tone === 'warning'
        ? 'bg-amber-500 ring-amber-200 dark:ring-amber-900'
        : 'bg-rose-500 ring-rose-200 dark:ring-rose-900'

  return (
    <div className="mt-3">
      {/* 3-tier spectrum bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="grid h-full w-full grid-cols-3 gap-0.5">
          <div className="bg-emerald-400/80 dark:bg-emerald-500/60" />
          <div className="bg-amber-400/80 dark:bg-amber-500/60" />
          <div className="bg-rose-400/80 dark:bg-rose-500/60" />
        </div>
      </div>

      {/* Needle Pointer */}
      <div className="relative -mt-1 h-3 w-full">
        <div
          className="absolute -translate-x-1/2 transition-all duration-500"
          style={{ left: `${Math.max(4, Math.min(96, percent))}%` }}
        >
          <div className={cn('h-2.5 w-2.5 rounded-full ring-4 shadow-sm', markerColor)} />
        </div>
      </div>

      {/* Spectrum Labels */}
      <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500">
        <span>{t('patientDashboard.carePlanPage.watch.rangeNormal', 'Normal')}</span>
        <span>{t('patientDashboard.carePlanPage.watch.rangeBorderline', 'Borderline')}</span>
        <span>{t('patientDashboard.carePlanPage.watch.rangeHigh', 'High')}</span>
      </div>
    </div>
  )
}

function WatchCard({ t, accent, icon: Icon, label, value, unit, category, target, series, gaugeConfig }) {
  const isProvided = value !== '—' && value !== null && value !== undefined
  const gaugePercent = isProvided && gaugeConfig ? calculateGaugePercent(gaugeConfig.rawValue, gaugeConfig.min, gaugeConfig.max) : null

  return (
    <li className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/30 dark:hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', accents[accent].bg)}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </h3>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{value}</span>
              {unit ? <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{unit}</span> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {category ? (
            <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', toneStyles[category.tone])}>
              {t(...categoryLabelKeys[category.id])}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              {t('patientDashboard.health.notProvided', 'Not provided')}
            </span>
          )}
          {series && series.length > 1 ? (
            <div className="mt-1">
              <Sparkline data={series} height={26} className="w-16 sm:w-20" />
            </div>
          ) : null}
        </div>
      </div>

      {isProvided ? (
        <>
          <ClinicalGauge percent={gaugePercent} tone={category?.tone || 'success'} t={t} />
          {target ? (
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px] text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
              <span className="font-medium">{target}</span>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-white/60 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
          <span className="text-[11px]">
            {t('patientDashboard.carePlanPage.watch.notProvidedHint', 'Record in next assessment for visual tracking')}
          </span>
          <Link
            to="/diagnosis"
            className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            <span>{t('patientDashboard.carePlanPage.watch.addInAssessment', 'Add')}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </li>
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
    <SectionCard
      title={t('patientDashboard.carePlanPage.watch.title', 'Numbers to watch')}
      description={t('patientDashboard.carePlanPage.watch.description', 'Latest values from your assessments with healthy targets.')}
    >
      <ul className="space-y-3.5">
        <WatchCard
          t={t}
          accent="bmi"
          icon={Scale}
          label={t('patientDashboard.health.bmi', 'Body Mass Index (BMI)')}
          value={bmi !== null ? bmi.toFixed(1) : '—'}
          unit={bmi !== null ? 'kg/m²' : null}
          category={bmiCategory}
          target={bmi !== null ? t('patientDashboard.health.bmiRangeHint', 'Healthy: 18.5 – 24.9') : null}
          series={extractMetricSeries(results, 'bmi')}
          gaugeConfig={{ rawValue: bmi, min: 15, max: 40 }}
        />
        <WatchCard
          t={t}
          accent="glucose"
          icon={Droplets}
          label={t('patientDashboard.health.fastingGlucose', 'Fasting blood glucose')}
          value={glucose !== null ? String(Math.round(glucose)) : '—'}
          unit={glucose !== null ? t('patientDashboard.health.mgdlUnit', 'mg/dL') : null}
          category={glucoseCategory}
          target={glucose !== null ? t('patientDashboard.health.glucoseRangeHint', 'Healthy (fasting): below 100 mg/dL') : null}
          series={extractMetricSeries(results, ['fasting_glucose', 'fasting_plasma_glucose'])}
          gaugeConfig={{ rawValue: glucose, min: 60, max: 240 }}
        />
        <WatchCard
          t={t}
          accent="a1c"
          icon={Activity}
          label={t('patientDashboard.health.hba1c', 'HbA1c')}
          value={a1c !== null ? a1c.toFixed(1) : '—'}
          unit={a1c !== null ? '%' : null}
          category={a1cCategory}
          target={a1c !== null ? t('patientDashboard.health.a1cRangeHint', 'Healthy: below 5.7%') : null}
          series={extractMetricSeries(results, 'hba1c')}
          gaugeConfig={{ rawValue: a1c, min: 4.0, max: 12.0 }}
        />
      </ul>
    </SectionCard>
  )
}
