import { useState } from 'react'
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Footprints,
  Gauge,
  Lightbulb,
  Salad,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import { SectionCard } from '@/components/ui'
import { cn } from '@/lib/utils'
import { getCarePlanConditionKey } from './patient-dashboard-utils'

export function CarePlanPrevention({ latestResult, t }) {
  if (!latestResult) return null

  const conditionKey = getCarePlanConditionKey(latestResult)
  const [activeTab, setActiveTab] = useState('nutrition') // 'nutrition' | 'activity' | 'biomarkers' | 'milestones'

  const conditionTitle = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.title`, latestResult.diagnosis || 'Care Plan')
  const conditionTagline = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.tagline`, '')
  const goalBadge = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.goalBadge`, '')
  const insight = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.insight`, '')

  // Nutrition data
  const nutritionTitle = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.nutrition.title`, 'Nutritional Strategy')
  const nutritionFocus = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.nutrition.focus`, '')
  const rawNutritionItems = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.nutrition.items`)
  const nutritionItems = Array.isArray(rawNutritionItems) ? rawNutritionItems : []

  // Activity data
  const activityTitle = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.activity.title`, 'Physical Activity Protocol')
  const activityFocus = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.activity.focus`, '')
  const rawActivityItems = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.activity.items`)
  const activityItems = Array.isArray(rawActivityItems) ? rawActivityItems : []

  // Biomarkers data
  const fastingTarget = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.biomarkers.fasting`, 'Normal')
  const postMealTarget = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.biomarkers.postMeal`, 'Normal')
  const hba1cTarget = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.biomarkers.hba1c`, '< 5.7%')
  const bmiTarget = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.biomarkers.bmi`, '18.5 – 24.9 kg/m²')

  // Milestones data
  const day30 = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.milestones.day30`, '')
  const day90 = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.milestones.day90`, '')
  const month6 = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.milestones.month6`, '')
  const year1 = t(`patientDashboard.carePlanPage.conditions.${conditionKey}.milestones.year1`, '')

  const tabs = [
    {
      id: 'nutrition',
      label: t('patientDashboard.carePlanPage.prevention.tabNutrition', 'Nutrition & Diet'),
      icon: Salad,
      badge: nutritionItems.length,
      tone: 'emerald',
    },
    {
      id: 'activity',
      label: t('patientDashboard.carePlanPage.prevention.tabActivity', 'Physical Activity'),
      icon: Footprints,
      badge: activityItems.length,
      tone: 'sky',
    },
    {
      id: 'biomarkers',
      label: t('patientDashboard.carePlanPage.prevention.tabBiomarkers', 'Target Goals'),
      icon: Target,
      badge: '4 KPIs',
      tone: 'amber',
    },
    {
      id: 'milestones',
      label: t('patientDashboard.carePlanPage.prevention.tabMilestones', 'Milestone Timeline'),
      icon: CalendarClock,
      badge: '4 Checks',
      tone: 'indigo',
    },
  ]

  const milestoneList = [
    { label: t('patientDashboard.carePlanPage.prevention.day30Label', '30 Days'), text: day30 },
    { label: t('patientDashboard.carePlanPage.prevention.day90Label', '90 Days (3 Months)'), text: day90 },
    { label: t('patientDashboard.carePlanPage.prevention.month6Label', '6 Months'), text: month6 },
    { label: t('patientDashboard.carePlanPage.prevention.year1Label', '1 Year'), text: year1 },
  ]

  return (
    <SectionCard
      title={t('patientDashboard.carePlanPage.prevention.sectionTitle', 'Prevention & Care Strategy')}
      description={t(
        'patientDashboard.carePlanPage.prevention.sectionSubtitle',
        'Evidence-based lifestyle interventions and clinical goals tailored to your result.'
      )}
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{t('patientDashboard.carePlanPage.prevention.evidenceBadge', 'Evidence-based (ADA / DPP)')}</span>
        </span>
      }
    >
      {/* Condition Focus Callout Banner */}
      <div className="mb-5 rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50/70 via-sky-50/40 to-emerald-50/30 p-4 sm:p-5 dark:border-primary-900/50 dark:from-primary-950/30 dark:via-sky-950/20 dark:to-emerald-950/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-600 text-white shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {conditionTitle}
              </h3>
            </div>
            {conditionTagline && (
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {conditionTagline}
              </p>
            )}
          </div>

          {goalBadge && (
            <div className="shrink-0 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs backdrop-blur-xs dark:border-emerald-800/80 dark:bg-slate-900/90 dark:text-emerald-300">
                <Target className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{goalBadge}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all',
                isActive
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800'
              )}
            >
              <Icon
                className={cn(
                  'h-3.5 w-3.5 transition-transform group-hover:scale-110',
                  isActive ? 'text-emerald-300 dark:text-emerald-600' : 'text-slate-400 dark:text-slate-400'
                )}
              />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panel Content */}
      <div className="min-h-[160px]">
        {/* TAB 1: NUTRITION */}
        {activeTab === 'nutrition' && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-950/30">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <Salad className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{nutritionTitle}</h4>
                  {nutritionFocus && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{nutritionFocus}</p>
                  )}
                </div>
              </div>
            </div>

            <ul className="mt-4 space-y-3">
              {nutritionItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-xs leading-6 text-slate-700 dark:text-slate-300">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* TAB 2: PHYSICAL ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-950/30">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                  <Footprints className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{activityTitle}</h4>
                  {activityFocus && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{activityFocus}</p>
                  )}
                </div>
              </div>
            </div>

            <ul className="mt-4 space-y-3">
              {activityItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-xs leading-6 text-slate-700 dark:text-slate-300">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* TAB 3: TARGET GOALS & BIOMARKERS */}
        {activeTab === 'biomarkers' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Fasting Glucose */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-950/30">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Gauge className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <span className="text-xs font-semibold">
                  {t('patientDashboard.carePlanPage.prevention.targetFasting', 'Fasting Glucose')}
                </span>
              </div>
              <p className="mt-2 text-base font-extrabold text-slate-900 dark:text-slate-100">
                {fastingTarget}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {t('patientDashboard.health.glucoseRangeHint', 'Healthy: below 100 mg/dL')}
              </p>
            </div>

            {/* Post-Meal Glucose */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-950/30">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold">
                  {t('patientDashboard.carePlanPage.prevention.targetPostMeal', 'Post-Meal Glucose')}
                </span>
              </div>
              <p className="mt-2 text-base font-extrabold text-slate-900 dark:text-slate-100">
                {postMealTarget}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                2 hours after main meals
              </p>
            </div>

            {/* Target HbA1c */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-950/30">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Target className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-semibold">
                  {t('patientDashboard.carePlanPage.prevention.targetHba1c', 'Target HbA1c')}
                </span>
              </div>
              <p className="mt-2 text-base font-extrabold text-slate-900 dark:text-slate-100">
                {hba1cTarget}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {t('patientDashboard.health.a1cRangeHint', 'Healthy: below 5.7%')}
              </p>
            </div>

            {/* Target Weight / BMI */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-950/30">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold">
                  {t('patientDashboard.carePlanPage.prevention.targetBmi', 'Weight & BMI Target')}
                </span>
              </div>
              <p className="mt-2 text-base font-extrabold text-slate-900 dark:text-slate-100">
                {bmiTarget}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {t('patientDashboard.health.bmiRangeHint', 'Healthy: 18.5 – 24.9')}
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: MILESTONE TIMELINE */}
        {activeTab === 'milestones' && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-950/30">
            <div className="relative space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {milestoneList.map((m, idx) => (
                <div key={idx} className="relative flex items-start gap-4 pl-1">
                  <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-4 ring-white dark:ring-slate-950">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{m.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reversal / Clinical Insight Callout */}
      {insight && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
              {t('patientDashboard.carePlanPage.prevention.reversalCalloutTitle', 'Clinical Insight & Reversal Guidance')}
            </h4>
            <p className="mt-1 text-xs leading-6 text-emerald-950/90 dark:text-emerald-300/90">
              {insight}
            </p>
          </div>
        </div>
      )}
    </SectionCard>
  )
}
