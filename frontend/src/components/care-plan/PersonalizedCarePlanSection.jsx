import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Apple,
  ArrowRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Flame,
  Footprints,
  HeartPulse,
  Info,
  Moon,
  Printer,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Utensils,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

export function PersonalizedCarePlanSection({
  carePlan,
  latestResult,
  onRegenerate,
  regenerating = false,
  className = '',
}) {
  const { isKhmer, t } = useLanguage()
  const [activeRecTab, setActiveRecTab] = useState('all')

  if (!carePlan) {
    return null
  }

  const findings = carePlan.assessment_findings || {}
  const recs = carePlan.recommendations || {}
  const diet = recs.diet || {}
  const activity = recs.physical_activity || {}
  const lifestyle = recs.lifestyle || {}
  const monitoring = recs.monitoring || {}
  const followUp = carePlan.follow_up || {}
  const disclaimer = carePlan.safety_disclaimer || {}

  const conditionName = findings.condition || latestResult?.diagnosis || 'Diabetes Screening Assessment'
  const certaintyPct = findings.certainty_percent ?? latestResult?.certainty_percent ?? 0
  const riskLevel = findings.risk_level || 'moderate'
  const isUrgent = Boolean(findings.is_urgent || latestResult?.is_urgent)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={cn('space-y-6 animate-in fade-in duration-200', className)}>
      {/* ── TOP HEADER / ACTION BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-200/80 bg-primary-50/80 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-900/60 dark:bg-primary-950/40 dark:text-primary-300">
            <Sparkles className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
            <span>
              {isKhmer
                ? 'ផែនការថែទាំសុខភាពផ្ទាល់ខ្លួនផ្អែកលើការវាយតម្លៃ'
                : 'Evidence-Grounded AI Personalized Care Plan'}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50">
            {isKhmer ? 'ផែនការគ្រប់គ្រង និងថែទាំសុខភាពផ្ទាល់ខ្លួន' : 'Personalized Clinical Care Plan'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isKhmer
              ? 'បង្កើតឡើងដោយស្វ័យប្រវត្តិចេញពីរបាយការណ៍វាយតម្លៃ ដោយបែងចែកជា ៤ ផ្នែកយ៉ាងច្បាស់លាស់។'
              : 'Synthesized directly from your verified assessment result without re-asking questions.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 text-slate-500', regenerating && 'animate-spin')} />
              <span>{regenerating ? (isKhmer ? 'កំពុងបង្កើតឡើងវិញ...' : 'Regenerating...') : (isKhmer ? 'ធ្វើបច្ចុប្បន្នភាព' : 'Refresh Plan')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>{isKhmer ? 'បោះពុម្ពផែនការ' : 'Print Plan'}</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. SEPARATE SECTION: ASSESSMENT FINDINGS CONTEXT                     */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <FileText className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isKhmer ? 'ផ្នែកទី ១៖ ទិន្នន័យនៃការវាយតម្លៃ (Assessment Findings)' : 'Section 1 • Assessment Findings Context'}
            </span>
          </div>

          {/* Risk Level Badge */}
          {riskLevel === 'urgent' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              {isKhmer ? 'កម្រិតហានិភ័យ៖ បន្ទាន់ (Urgent)' : 'Risk Level: Urgent Attention'}
            </span>
          ) : riskLevel === 'high' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {isKhmer ? 'កម្រិតហានិភ័យ៖ ខ្ពស់ (High Risk)' : 'Risk Level: High Priority'}
            </span>
          ) : riskLevel === 'moderate' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-300">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              {isKhmer ? 'កម្រិតហានិភ័យ៖ មធ្យម (Moderate)' : 'Risk Level: Moderate / Elevated'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {isKhmer ? 'កម្រិតហានិភ័យ៖ ទាប (Normal / Low)' : 'Risk Level: Low / Normal'}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {isKhmer ? 'លទ្ធផលពីប្រព័ន្ធច្បាប់ជំនាញ (Expert System Classification)' : 'Authoritative Expert-System Condition'}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                {conditionName}
              </h3>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {findings.summary}
            </p>

            {/* Findings Evidence Chips */}
            <div className="pt-2 space-y-2">
              {/* Symptoms */}
              {findings.symptoms && findings.symptoms.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    {isKhmer ? 'រោគសញ្ញារាយការណ៍៖' : 'Symptoms:'}
                  </span>
                  {findings.symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Risk Factors */}
              {findings.risk_factors && findings.risk_factors.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    {isKhmer ? 'កត្តាហានិភ័យ៖' : 'Risk Factors:'}
                  </span>
                  {findings.risk_factors.map((r, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {r}
                    </span>
                  ))}
                </div>
              )}

              {/* Key Labs */}
              {findings.key_labs && Object.keys(findings.key_labs).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {Object.entries(findings.key_labs).map(([k, lab]) => (
                    <div
                      key={k}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800/80"
                    >
                      <span className="text-slate-500 dark:text-slate-400">{lab.label}:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {lab.value} {lab.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Demographics & Certainty Card */}
          <div className="lg:col-span-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                {isKhmer ? 'កម្រិតភាពប្រាកដ' : 'Certainty Factor'}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{certaintyPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${certaintyPct}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">
                  {isKhmer ? 'អាយុ' : 'Age'}
                </span>
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {findings.demographics?.age ? `${findings.demographics.age} yrs` : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">
                  {isKhmer ? 'សន្ទស្សន៍ម៉ាសរាងកាយ' : 'BMI'}
                </span>
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {findings.demographics?.bmi ? `${findings.demographics.bmi} kg/m²` : 'N/A'}
                </p>
              </div>
            </div>

            {latestResult?.id && (
              <div className="pt-2">
                <Link
                  to={`/diagnosis/result?diagnosis_result_id=${latestResult.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  <span>{isKhmer ? 'មើលរបាយការណ៍ពេញលេញ' : 'View Full Clinical Report'}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. SEPARATE SECTION: STRUCTURED RECOMMENDATIONS                      */}
      {/*    (Diet, Physical Activity, Lifestyle, Monitoring)                  */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isKhmer ? 'ផ្នែកទី ២៖ ការណែនាំជាក់លាក់តាមផ្នែក (Recommendations)' : 'Section 2 • Structured Actionable Recommendations'}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All Pillars', icon: Sparkles },
              { id: 'diet', label: isKhmer ? 'អាហារូបត្ថម្ភ' : 'Diet & Nutrition', icon: Utensils },
              { id: 'activity', label: isKhmer ? 'សកម្មភាពរាងកាយ' : 'Physical Activity', icon: Activity },
              { id: 'lifestyle', label: isKhmer ? 'របៀបរស់នៅ' : 'Lifestyle', icon: Moon },
              { id: 'monitoring', label: isKhmer ? 'ការតាមដាន' : 'Monitoring', icon: HeartPulse },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeRecTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveRecTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* PILLAR 1: DIET & NUTRITION */}
          {(activeRecTab === 'all' || activeRecTab === 'diet') && (
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <Utensils className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {isKhmer ? 'អាហារូបត្ថម្ភ និងរបបអាហារ' : diet.category || 'Diet & Nutrition Strategy'}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {isKhmer ? 'ការណែនាំអំពីកាបូអ៊ីដ្រាត និងកម្រិតជាតិស្ករ' : 'Glycemic load, fiber targets & portion balance'}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {diet.summary}
                </p>

                {/* Action Items */}
                <div className="mt-4 space-y-2.5">
                  {diet.action_items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800/80 dark:bg-slate-800/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.title}
                        </h4>
                        {item.tag && (
                          <span className="shrink-0 rounded-full bg-emerald-100/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foods to Prioritize & Foods to Limit */}
              {(diet.foods_to_prioritize || diet.foods_to_limit) && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {diet.foods_to_prioritize && (
                    <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{isKhmer ? 'អាហារគួរទទួលទាន' : 'Foods to Prioritize'}</span>
                      </div>
                      <ul className="mt-2 space-y-1 text-[11px] text-emerald-900/80 dark:text-emerald-200/80">
                        {diet.foods_to_prioritize.map((food, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                            <span>{food}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {diet.foods_to_limit && (
                    <div className="rounded-xl border border-rose-200/60 bg-rose-50/40 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{isKhmer ? 'អាហារគួរកាត់បន្ថយ/ចៀសវាង' : 'Foods to Limit / Avoid'}</span>
                      </div>
                      <ul className="mt-2 space-y-1 text-[11px] text-rose-900/80 dark:text-rose-200/80">
                        {diet.foods_to_limit.map((food, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-rose-500" />
                            <span>{food}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PILLAR 2: PHYSICAL ACTIVITY */}
          {(activeRecTab === 'all' || activeRecTab === 'activity') && (
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300">
                      <Activity className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {isKhmer ? 'សកម្មភាពរាងកាយ និងលំហាត់ប្រាណ' : activity.category || 'Physical Activity Regimen'}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {isKhmer ? 'បង្កើនការឆ្លើយតបអាំងស៊ុយលីន និងសុខភាពបេះដូង' : 'Aerobic conditioning, strength & glycemic control'}
                      </p>
                    </div>
                  </div>

                  {activity.weekly_target_minutes !== undefined && activity.weekly_target_minutes > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200/80 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300">
                      <Flame className="h-3.5 w-3.5 text-sky-500" />
                      <span>{activity.weekly_target_minutes} min/wk</span>
                    </span>
                  )}
                </div>

                <p className="mt-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {activity.summary}
                </p>

                {/* Action Items */}
                <div className="mt-4 space-y-2.5">
                  {activity.action_items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800/80 dark:bg-slate-800/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.title}
                        </h4>
                        {item.tag && (
                          <span className="shrink-0 rounded-full bg-sky-100/70 px-2 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Precautions Box */}
              {activity.safety_precautions && activity.safety_precautions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                      <Footprints className="h-3.5 w-3.5 text-amber-600" />
                      <span>{isKhmer ? 'ការប្រុងប្រយ័ត្នពេលហាត់ប្រាណ' : 'Safety & Foot Protection'}</span>
                    </div>
                    <ul className="mt-1.5 space-y-1 text-[11px] text-amber-900/80 dark:text-amber-200/80">
                      {activity.safety_precautions.map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PILLAR 3: LIFESTYLE & WELL-BEING */}
          {(activeRecTab === 'all' || activeRecTab === 'lifestyle') && (
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                      <Moon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {isKhmer ? 'របៀបរស់នៅ និងទម្លាប់ប្រចាំថ្ងៃ' : lifestyle.category || 'Lifestyle & Well-being Interventions'}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {isKhmer ? 'ការគ្រប់គ្រងទម្ងន់ ការគេង ភាពតានតឹង និងការថែទាំជើង' : 'Weight management, sleep, stress & foot exams'}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {lifestyle.summary}
                </p>

                {/* Action Items */}
                <div className="mt-4 space-y-2.5">
                  {lifestyle.action_items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800/80 dark:bg-slate-800/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.title}
                        </h4>
                        {item.tag && (
                          <span className="shrink-0 rounded-full bg-indigo-100/70 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PILLAR 4: BIOMARKER & GLYCEMIC MONITORING */}
          {(activeRecTab === 'all' || activeRecTab === 'monitoring') && (
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300">
                      <HeartPulse className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {isKhmer ? 'ការតាមដានជាតិស្ករ និងសូចនាករសុខភាព' : monitoring.category || 'Glycemic & Biomarker Monitoring'}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {isKhmer ? 'កាលវិភាគវាស់ជាតិស្ករ និងគោលដៅសុខភាព' : 'Self-monitoring protocol & clinical target ranges'}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {monitoring.summary}
                </p>

                {/* Action Items */}
                <div className="mt-4 space-y-2.5">
                  {monitoring.action_items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800/80 dark:bg-slate-800/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.title}
                        </h4>
                        {item.frequency && (
                          <span className="shrink-0 rounded-full bg-purple-100/70 px-2 py-0.5 text-[10px] font-semibold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                            {item.frequency}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Ranges Reference Box */}
              {monitoring.target_ranges && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-700/80 dark:bg-slate-800/50">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {isKhmer ? 'គោលដៅជាតិស្ករយោង (Target Ranges)' : 'Standard Glycemic Targets Reference'}
                    </span>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {Object.entries(monitoring.target_ranges).map(([k, range]) => (
                        <div key={k} className="flex flex-col">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
                            {k.replace(/_/g, ' ')}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {range}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. SEPARATE SECTION: CLINICAL FOLLOW-UP SCHEDULE & REFERRALS         */}
      {/* ==================================================================== */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
              <CalendarClock className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isKhmer ? 'ផ្នែកទី ៣៖ កាលវិភាគណាត់ជួប និងតាមដាន (Clinical Follow-up)' : 'Section 3 • Clinical Follow-up Schedule & Referrals'}
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/90 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-300">
            <Clock className="h-3.5 w-3.5" />
            <span>{isKhmer ? `កាលកំណត់៖ ${followUp.timeline}` : `Timeline: ${followUp.timeline || 'Recommended'}`}</span>
          </span>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 dark:border-sky-950/70 dark:bg-sky-950/20">
            <div className="flex items-start gap-3">
              <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />
              <div>
                <h4 className="text-sm font-bold text-sky-900 dark:text-sky-100">
                  {isKhmer ? 'សកម្មភាពចម្បងដែលត្រូវធ្វើ (Primary Action)' : 'Primary Milestone Action'}
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-sky-800 dark:text-sky-200 leading-relaxed">
                  {followUp.milestone_action}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline Milestones Stepper */}
          {followUp.schedule && followUp.schedule.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {followUp.schedule.map((item, idx) => (
                <div
                  key={idx}
                  className="relative rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-primary-700 dark:text-primary-300">
                    <Calendar className="h-3.5 w-3.5 text-primary-500" />
                    <span>{item.timeframe}</span>
                  </div>
                  <h5 className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {item.title}
                  </h5>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Specialist Referrals */}
          {followUp.specialists_to_consult && followUp.specialists_to_consult.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isKhmer ? 'អ្នកជំនាញវេជ្ជសាស្ត្រដែលគួរពិគ្រោះយោបល់៖' : 'Recommended Specialists to Consult:'}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {followUp.specialists_to_consult.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Stethoscope className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                    <span>{s}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. SEPARATE SECTION: SAFETY & MEDICAL DISCLAIMER                    */}
      {/* ==================================================================== */}
      <section className="rounded-2xl border border-rose-200/90 bg-rose-50/40 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] sm:p-6 dark:border-rose-900/60 dark:bg-rose-950/20">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-rose-900 dark:text-rose-100">
              {isKhmer ? 'ផ្នែកទី ៤៖ ការបញ្ជាក់សុវត្ថិភាព និងការទទួលខុសត្រូវវេជ្ជសាស្ត្រ' : disclaimer.title || 'Section 4 • Clinical Safety & Medical Disclaimer'}
            </h3>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
              {isKhmer ? 'ការណែនាំសុខភាពនេះមិនជំនួសវេជ្ជបញ្ជា ឬការវិនិច្ឆ័យផ្ទាល់ពីគ្រូពេទ្យឡើយ' : 'Strict clinical decision-support boundaries'}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs sm:text-sm leading-relaxed text-rose-900/90 dark:text-rose-200/90">
          {disclaimer.content}
        </p>

        {/* Emergency Red Flags */}
        {disclaimer.red_flags && disclaimer.red_flags.length > 0 && (
          <div className="mt-4 rounded-xl border border-rose-200/80 bg-white/70 p-4 dark:border-rose-900/50 dark:bg-slate-900/70">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>{isKhmer ? 'សញ្ញាអាសន្នដែលត្រូវទៅមន្ទីរពេទ្យជាបន្ទាន់ (Red-Flag Emergencies):' : 'Emergency Red Flags — Seek Urgent Medical Care If:'}</span>
            </div>
            <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-rose-900 dark:text-rose-200">
              {disclaimer.red_flags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span className="leading-snug">{flag}</span>
                </li>
              ))}
            </ul>
            {disclaimer.emergency_instruction && (
              <p className="mt-3 border-t border-rose-100 pt-2 text-[11px] font-semibold text-rose-700 dark:border-rose-900/50 dark:text-rose-300">
                {disclaimer.emergency_instruction}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default PersonalizedCarePlanSection
