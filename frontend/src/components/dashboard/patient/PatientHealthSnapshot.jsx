import { Activity, CalendarCheck2, Droplets, Scale } from 'lucide-react'
import { EmptyState, SectionCard } from '@/components/ui'
import { Sparkline } from '@/components/ui/Sparkline'
import { cn } from '@/lib/utils'
import {
  extractMetricSeries,
  formatDateTime,
  getA1cCategory,
  getBmiCategory,
  getFastingGlucoseCategory,
  getLatestFacts,
  getRelativeCheckAge,
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

const categoryDots = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
}

const accents = {
  bmi: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
  glucose: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
  a1c: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
  assessments: 'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300',
}

function CategoryTag({ category, t }) {
  if (!category) {
    return (
      <span className="text-[11px] text-slate-400 dark:text-slate-500">
        {t('patientDashboard.health.notProvided', 'Not provided')}
      </span>
    )
  }

  const [key, fallback] = categoryLabelKeys[category.id]
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
      <span className={cn('h-1.5 w-1.5 rounded-full', categoryDots[category.tone])} />
      {t(key, fallback)}
    </span>
  )
}

function VitalRow({ t, accent, icon: Icon, label, value, unit, category, series, footnote }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', accents[accent])}>
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50">{value}</span>
          {unit ? <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{unit}</span> : null}
          <CategoryTag category={category} t={t} />
        </div>
        {footnote ? <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">{footnote}</p> : null}
      </div>
      {series && series.length > 1 ? <Sparkline data={series} height={30} className="w-20 shrink-0 sm:w-24" /> : null}
    </li>
  )
}

export function PatientHealthSnapshot({ results }) {
  const { language, t } = useLanguage()
  const hasResults = Array.isArray(results) && results.length > 0
  const facts = getLatestFacts(results)
  const latest = hasResults ? results[0] : null

  const bmi = toNumberOrNull(facts.bmi)
  const glucose = toNumberOrNull(facts.fasting_glucose ?? facts.fasting_plasma_glucose)
  const a1c = toNumberOrNull(facts.hba1c)
  const lastCheckLabel = latest ? getRelativeCheckAge(latest.created_at, t) : null

  return (
    <SectionCard
      className="h-full"
      bodyClassName="flex flex-1 flex-col"
      title={t('patientDashboard.health.title', 'Health snapshot')}
      description={latest
        ? t('patientDashboard.health.latestFrom', 'From your assessment on {{date}}', {
            date: formatDateTime(latest.created_at, language, t('common.notAvailable', 'N/A')),
          })
        : t('patientDashboard.health.description', 'Key body metrics from your latest assessment.')}
    >
      {!hasResults ? (
        <div className="flex flex-1 items-center">
          <EmptyState
            className="w-full"
            title={t('patientDashboard.health.emptyTitle', 'No health metrics yet')}
            description={t('patientDashboard.health.emptyDescription', 'Complete an assessment with your height, weight and lab values to see your BMI, glucose and HbA1c here.')}
          />
        </div>
      ) : (
        <>
          <ul className="flex flex-1 flex-col justify-center divide-y divide-slate-100 dark:divide-slate-800/70">
            <VitalRow
              t={t}
              accent="bmi"
              icon={Scale}
              label={t('patientDashboard.health.bmi', 'Body Mass Index (BMI)')}
              value={bmi !== null ? bmi.toFixed(1) : '—'}
              unit={bmi !== null ? 'kg/m²' : null}
              category={getBmiCategory(bmi)}
              series={extractMetricSeries(results, 'bmi')}
            />
            <VitalRow
              t={t}
              accent="glucose"
              icon={Droplets}
              label={t('patientDashboard.health.fastingGlucose', 'Fasting blood glucose')}
              value={glucose !== null ? String(Math.round(glucose)) : '—'}
              unit={glucose !== null ? t('patientDashboard.health.mgdlUnit', 'mg/dL') : null}
              category={getFastingGlucoseCategory(glucose)}
              series={extractMetricSeries(results, ['fasting_glucose', 'fasting_plasma_glucose'])}
            />
            <VitalRow
              t={t}
              accent="a1c"
              icon={Activity}
              label={t('patientDashboard.health.hba1c', 'HbA1c')}
              value={a1c !== null ? a1c.toFixed(1) : '—'}
              unit={a1c !== null ? '%' : null}
              category={getA1cCategory(a1c)}
              series={extractMetricSeries(results, 'hba1c')}
            />
            <VitalRow
              t={t}
              accent="assessments"
              icon={CalendarCheck2}
              label={t('patientDashboard.hero.assessments', 'Assessments')}
              value={results.length}
              category={null}
              footnote={lastCheckLabel ? `${t('patientDashboard.hero.lastCheck', 'Last check')}: ${lastCheckLabel}` : null}
            />
          </ul>
          <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-slate-800/70 dark:text-slate-500">
            {t('patientDashboard.health.disclaimer', 'Screening reference only — always confirm results with your clinician.')}
          </p>
        </>
      )}
    </SectionCard>
  )
}