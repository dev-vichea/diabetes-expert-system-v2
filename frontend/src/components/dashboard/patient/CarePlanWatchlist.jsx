import { Activity, Droplets, Scale } from 'lucide-react'
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
import { useLanguage } from '@/contexts/LanguageContext'

const categoryLabelKeys = {
  underweight: ['patientDashboard.health.catUnderweight', 'Underweight'],
  normal: ['patientDashboard.health.catNormal', 'Normal'],
  overweight: ['patientDashboard.health.catOverweight', 'Overweight'],
  obese: ['patientDashboard.health.catObese', 'Obese'],
  prediabetes: ['patientDashboard.health.catPrediabetes', 'Prediabetes range'],
  diabetes: ['patientDashboard.health.catDiabetes', 'Diabetes range'],
}

const toneStyles = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
}

const toneDots = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
}

const accents = {
  bmi: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
  glucose: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
  a1c: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
}

function WatchRow({ t, accent, icon: Icon, label, value, unit, category, target, series }) {
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', accents[accent])}>
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50">{value}</span>
          {unit ? <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{unit}</span> : null}
          {category ? (
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', toneStyles[category.tone])}>
              {t(...categoryLabelKeys[category.id])}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {t('patientDashboard.health.notProvided', 'Not provided')}
            </span>
          )}
        </div>
        {target ? <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">{target}</p> : null}
      </div>
      {series && series.length > 1 ? <Sparkline data={series} height={30} className="w-16 shrink-0 sm:w-20" /> : null}
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
      <ul className="divide-y divide-slate-100 dark:divide-slate-800/70">
        <WatchRow
          t={t}
          accent="bmi"
          icon={Scale}
          label={t('patientDashboard.health.bmi', 'Body Mass Index (BMI)')}
          value={bmi !== null ? bmi.toFixed(1) : '—'}
          unit={bmi !== null ? 'kg/m²' : null}
          category={bmiCategory}
          target={bmi !== null ? t('patientDashboard.health.bmiRangeHint', 'Healthy: 18.5 – 24.9') : null}
          series={extractMetricSeries(results, 'bmi')}
        />
        <WatchRow
          t={t}
          accent="glucose"
          icon={Droplets}
          label={t('patientDashboard.health.fastingGlucose', 'Fasting blood glucose')}
          value={glucose !== null ? String(Math.round(glucose)) : '—'}
          unit={glucose !== null ? t('patientDashboard.health.mgdlUnit', 'mg/dL') : null}
          category={glucoseCategory}
          target={glucose !== null ? t('patientDashboard.health.glucoseRangeHint', 'Healthy (fasting): below 100 mg/dL') : null}
          series={extractMetricSeries(results, ['fasting_glucose', 'fasting_plasma_glucose'])}
        />
        <WatchRow
          t={t}
          accent="a1c"
          icon={Activity}
          label={t('patientDashboard.health.hba1c', 'HbA1c')}
          value={a1c !== null ? a1c.toFixed(1) : '—'}
          unit={a1c !== null ? '%' : null}
          category={a1cCategory}
          target={a1c !== null ? t('patientDashboard.health.a1cRangeHint', 'Healthy: below 5.7%') : null}
          series={extractMetricSeries(results, 'hba1c')}
        />
      </ul>
    </SectionCard>
  )
}
