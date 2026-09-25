import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Apple,
  ArrowRight,
  Award,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Droplets,
  FileText,
  Flame,
  Footprints,
  HeartPulse,
  Moon,
  Printer,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  Utensils,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const RISK_SCALE_BARS = [
  { num: 1, sub: 'Low', height: 32, group: 1 },
  { num: 2, sub: 'Mid', height: 38, group: 1 },
  { num: 3, sub: 'High', height: 44, group: 1 },
  { num: 4, sub: 'Low', height: 50, group: 2 },
  { num: 5, sub: 'Mid', height: 56, group: 2 },
  { num: 6, sub: 'High', height: 62, group: 2 },
  { num: 7, sub: 'Low', height: 68, group: 3 },
  { num: 8, sub: 'Mid', height: 74, group: 3 },
  { num: 9, sub: 'High', height: 82, group: 3 },
]

function getRiskBarStyles(group, isActive, isCurrent) {
  if (!isActive) {
    return {
      bg: 'bg-slate-100 dark:bg-slate-800/80',
      text: 'text-slate-400 dark:text-slate-500',
      sub: 'text-slate-400/80 dark:text-slate-600',
    }
  }

  // Group 1: Green (Emerald)
  if (group === 1) {
    return {
      bg: 'bg-emerald-500 dark:bg-emerald-500',
      text: 'text-white',
      sub: 'text-emerald-100',
    }
  }

  // Group 2: Amber / Orange
  if (group === 2) {
    return {
      bg: 'bg-amber-500 dark:bg-amber-500',
      text: 'text-white',
      sub: 'text-amber-100',
    }
  }

  // Group 3: Rose / Red
  return {
    bg: 'bg-rose-500 dark:bg-rose-500',
    text: 'text-white',
    sub: 'text-rose-100',
  }
}

function RiskProgressionBars({ percent = 0, isKhmer = false }) {
  const safePercent = Math.min(100, Math.max(0, Number(percent) || 0))
  // Map 0-100% to 1-9 level scale
  const currentLevel = Math.max(1, Math.min(9, Math.round((safePercent / 100) * 8) + 1))
  const activeGroup = currentLevel <= 3 ? 1 : currentLevel <= 6 ? 2 : 3

  return (
    <div className="flex flex-col w-full sm:w-[280px] md:w-[320px] select-none">
      {/* Header: Evidence Agreement & Score */}
      <div className="flex items-baseline justify-between gap-3 w-full pb-1.5">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {isKhmer ? 'ភាពស៊ីសង្វាក់ភស្តុតាង' : 'Evidence agreement'}
        </p>
        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {safePercent}%
        </span>
      </div>

      {/* 9 Stepped Progression Bars for Risk */}
      <div className="flex items-end gap-1.5 w-full justify-between pt-1 pb-1">
        {RISK_SCALE_BARS.map((bar) => {
          const isActive = bar.num <= currentLevel
          const isCurrent = bar.num === currentLevel
          const styles = getRiskBarStyles(bar.group, isActive, isCurrent)

          return (
            <div
              key={bar.num}
              style={{ height: `${bar.height}px` }}
              className={cn(
                'group/bar relative flex flex-1 flex-col items-center justify-between rounded-t-md px-0.5 py-1.5 transition-all duration-200',
                styles.bg,
                isCurrent && 'ring-2 ring-slate-900/60 ring-offset-1 ring-offset-white dark:ring-white dark:ring-offset-slate-900 shadow-sm scale-105 z-10'
              )}
              title={`Level ${bar.num} (${bar.sub}) · ${isActive ? 'Active' : 'Threshold'}`}
            >
              <span className={cn('text-[10px] font-black leading-none', styles.text)}>
                {bar.num}
              </span>
              <span className={cn('text-[7px] font-bold leading-none tracking-tighter uppercase', styles.sub)}>
                {bar.sub}
              </span>
            </div>
          )
        })}
      </div>

      {/* Tier range sublabels below the 9 bars */}
      <div className="flex items-center justify-between w-full px-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-1.5">
        <span className={cn(activeGroup === 1 ? 'text-emerald-600 dark:text-emerald-400 font-black' : '')}>
          {isKhmer ? '១-៣ ទាប' : '1–3 Low'}
        </span>
        <span className={cn(activeGroup === 2 ? 'text-amber-600 dark:text-amber-400 font-black' : '')}>
          {isKhmer ? '៤-៦ មធ្យម' : '4–6 Mid'}
        </span>
        <span className={cn(activeGroup === 3 ? 'text-rose-600 dark:text-rose-400 font-black' : '')}>
          {isKhmer ? '៧-៩ ខ្ពស់' : '7–9 High'}
        </span>
      </div>

      {/* Medical disclaimer note */}
      <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
        {isKhmer ? '(មិនមែនជាការធ្វើរោគវិនិច្ឆ័យ)' : '(not a diagnosis)'}
      </p>
    </div>
  )
}

function DropletIllustration({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="dropletCarePlanGrad" x1="18" y1="5" x2="18" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <path
        d="M18 5 C18 5 9 16 9 22 C9 26.97 13.03 31 18 31 C22.97 31 27 26.97 27 22 C27 16 18 5 18 5 Z"
        fill="url(#dropletCarePlanGrad)"
      />
      <path
        d="M14 19 C14 17 16 14 18 11"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  )
}

export function PersonalizedCarePlanSection({
  carePlan,
  latestResult,
  onRegenerate,
  regenerating = false,
  className = '',
}) {
  const { isKhmer, t, tExact } = useLanguage()
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

  const rawConditionName = findings.condition || latestResult?.diagnosis || 'Diabetes Screening Assessment'
  const conditionName = isKhmer ? (tExact(rawConditionName) || rawConditionName) : rawConditionName
  const certaintyPct = findings.certainty_percent ?? latestResult?.certainty_percent ?? 0
  const riskLevel = findings.risk_level || 'moderate'
  const isUrgent = Boolean(findings.is_urgent || latestResult?.is_urgent)
  const isProvisional = Boolean(findings.is_provisional || (certaintyPct < 50 && !isUrgent))

  const bmiValue = findings.demographics?.bmi
  const bmiStatus = useMemo(() => {
    if (!bmiValue) return null
    if (bmiValue < 18.5) return isKhmer ? 'ស្គម' : 'Underweight'
    if (bmiValue < 25) return isKhmer ? 'ទម្ងន់ធម្មតា' : 'Normal weight'
    if (bmiValue < 30) return isKhmer ? 'លើសទម្ងន់' : 'Overweight'
    return isKhmer ? 'ធាត់' : 'Obese'
  }, [bmiValue, isKhmer])

  const localizedSummary = useMemo(() => {
    if (!isKhmer) return findings.summary

    const fpg = findings.key_labs?.fasting_glucose || findings.key_labs?.fasting_plasma_glucose
    const hba1c = findings.key_labs?.hba1c
    const labSnippets = []
    if (fpg?.value != null) labSnippets.push(`FPG ${fpg.value} mg/dL`)
    if (hba1c?.value != null) labSnippets.push(`HbA1c ${hba1c.value}%`)
    const labStr = labSnippets.length > 0 ? ` ជាមួយ ${labSnippets.join(', ')}` : ' (ការពិនិត្យរោគសញ្ញា និងកត្តាហានិភ័យ)'

    if (isUrgent) {
      return `ការវាយតម្លៃបង្ហាញពីស្ថានភាពគ្លីនិកបន្ទាន់ (${conditionName}, កម្រិតភាពប្រាកដ ${certaintyPct}%)។ តម្រូវឱ្យមានការពិគ្រោះ និងវាយតម្លៃវេជ្ជសាស្ត្រជាបន្ទាន់ ដោយសាររោគសញ្ញាស្រួចស្រាវ ឬសូចនាករជាតិស្ករខ្ពស់។`
    }
    if (isProvisional) {
      return `ការវាយតម្លៃបឋមបង្ហាញពីលំនាំ ${conditionName} ជាមួយនឹងកម្រិតភាពប្រាកដមានកម្រិត (${certaintyPct}%)${labStr}។ ដោយសារភស្តុតាងគ្លីនិកមិនទាន់ពេញលេញ (រង់ចាំការបញ្ជាក់តាមតេស្តឈាមមន្ទីរពិសោធន៍) ផែនការនេះផ្តោតលើការណែនាំសុខភាពជាមូលដ្ឋាន និងផ្តល់អាទិភាពដល់ការបញ្ជាក់តាមមន្ទីរពិសោធន៍ ជាជាងការព្យាបាលវេជ្ជសាស្ត្រធ្ងន់ធ្ងរ។`
    }
    if (riskLevel === 'high') {
      return `ការវាយតម្លៃឆ្លុះបញ្ចាំងពីហានិភ័យខ្ពស់សម្រាប់ ${conditionName} (កម្រិតភាពប្រាកដ ${certaintyPct}%)${labStr}។ ការណែនាំឱ្យមានការផ្លាស់ប្តូរបែបបទរស់នៅគ្រប់ជ្រុងជ្រោយ និងការពិគ្រោះយោបល់ជាមួយវេជ្ជបណ្ឌិតជំនាញ។`
    }
    if (riskLevel === 'moderate') {
      return `ការវាយតម្លៃបង្ហាញពីហានិភ័យកម្រិតមធ្យម (${conditionName}, កម្រិតភាពប្រាកដ ${certaintyPct}%)${labStr}។ អាហារូបត្ថម្ភចំគោលដៅ សកម្មភាពរាងកាយ និងការគ្រប់គ្រងទម្ងន់ អាចជួយពន្យារ ឬការពារការវិវត្តនៃជំងឺបានយ៉ាងមានប្រសិទ្ធភាព។`
    }
    return `ការវាយតម្លៃបង្ហាញពីកម្រិតជាតិស្ករក្នុងស្ថានភាពធម្មតា (កម្រិតភាពប្រាកដ ${certaintyPct}%)${labStr}។ ការណែនាំចម្បងគឺបន្តរក្សាទម្លាប់រស់នៅល្អប្រកបដោយសុខភាព និងការតាមដានជាប្រចាំតាមការកំណត់។`
  }, [isKhmer, findings, conditionName, certaintyPct, isUrgent, isProvisional, riskLevel])

  const getLabLabel = (key, defaultLabel) => {
    if (!isKhmer) return defaultLabel
    const LAB_LABELS_KM = {
      fasting_glucose: 'ជាតិស្ករពេលតមអាហារ (FPG)',
      fasting_plasma_glucose: 'ជាតិស្ករក្នុងប្លាស្មា (FPG)',
      hba1c: 'កម្រិតជាតិស្ករសរុប (HbA1c)',
      '2h_ogtt_75g': 'តេស្ត OGTT ២ ម៉ោង',
      random_plasma_glucose: 'ជាតិស្ករចៃដន្យ',
      blood_glucose: 'កម្រិតជាតិស្ករក្នុងឈាម',
    }
    return LAB_LABELS_KM[key] || tExact(defaultLabel) || defaultLabel
  }

  const localizeFrequency = (freq) => {
    if (!freq) return ''
    if (!isKhmer) return freq
    const freqMap = {
      '4 times daily': '៤ ដងក្នុងមួយថ្ងៃ',
      '1-2 times daily or as prescribed': '១-២ ដង/ថ្ងៃ (ឬតាមវេជ្ជបញ្ជា)',
      'Every 3 months': 'រៀងរាល់ ៣ ខែម្ដង',
      'Annually': 'រៀងរាល់ឆ្នាំ',
      'Every 3 to 6 months': 'រៀងរាល់ ៣–៦ ខែ',
      'Weekly': 'រៀងរាល់សប្តាហ៍',
      '2-3 times weekly': '២-៣ ដង/សប្តាហ៍',
      'Annually (every 12 months)': 'រៀងរាល់ ១២ ខែ',
    }
    return freqMap[freq] || tExact(freq) || freq
  }

  const localizeRedFlag = (flag) => {
    if (!isKhmer) return flag
    const flagMap = {
      'Persistent blood glucose above 250 mg/dL or below 70 mg/dL':
        'ជាតិស្ករក្នុងឈាមលើស ២៥០ mg/dL ជាប់ៗគ្នា ឬធ្លាក់ចុះក្រោម ៧០ mg/dL',
      'Persistent nausea, vomiting, or inability to retain fluids':
        'អាការៈចង្អោរ ក្អួតជាប់រហូត ឬមិនអាចទទួលទានជាតិទឹកបាន',
      'Deep, rapid breathing or distinct fruity-smelling breath (signs of ketosis)':
        'ដកដង្ហើមវែងៗ ញាប់ខុសធម្មតា ឬមានក្លិនផ្លែឈើជូរចេញពីមាត់ (សញ្ញា Ketosis)',
      'Confusion, extreme weakness, slurred speech, or loss of consciousness':
        'ការវង្វេងវង្វាន់ ខ្សោយកម្លាំងខ្លាំង និយាយមិនច្បាស់ ឬបាត់បង់ស្មារតី',
      'Non-healing foot sores, sudden severe numbness, swelling, or signs of localized infection':
        'ស្នាមរបួសបាតជើងមិនជាសះស្បើយ ស្ពឹកខ្លាំងភ្លាមៗ ហើម ឬមានសញ្ញាឆ្លងមេរោគ',
      'Chest pain, acute shortness of breath, or sudden vision changes':
        'ឈឺទ្រូង ពិបាកដកដង្ហើមស្រួចស្រាវ ឬស្រវាំងភ្នែកភ្លាមៗ',
      'Decreased fetal movement or severe headache with blurred vision during pregnancy':
        'ទារកកម្រើកតិចជាងមុន ឬឈឺក្បាលខ្លាំងរួមជាមួយស្រវាំងភ្នែកអំឡុងពេលមានផ្ទៃពោះ',
    }
    return flagMap[flag] || tExact(flag) || flag
  }

  const localizeTargetRangeKey = (key) => {
    if (!isKhmer) return key.replace(/_/g, ' ')
    const keyMap = {
      fasting_glucose: 'ជាតិស្ករពេលតមអាហារ (FPG)',
      post_meal_glucose: 'ជាតិស្ករក្រោយអាហារ (Post-meal)',
      hba1c: 'កម្រិតជាតិស្ករសរុប (HbA1c)',
      one_hour_post_meal: 'ជាតិស្ករ ១ ម៉ោងក្រោយអាហារ',
      two_hour_post_meal: 'ជាតិស្ករ ២ ម៉ោងក្រោយអាហារ',
    }
    return keyMap[key] || tExact(key) || key.replace(/_/g, ' ')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={cn('space-y-6 animate-in fade-in duration-200', className)}>
      {/* ── TOP HEADER / ACTION BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50">
            {isKhmer ? 'ផែនការថែទាំសុខភាពផ្ទាល់ខ្លួន' : 'Personalized Care Plan'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            {isKhmer
              ? 'ផែនការសកម្មភាពជាក់លាក់ របបអាហារ លំហាត់ប្រាណ និងកាលវិភាគតាមដានផ្ទាល់ខ្លួនរបស់អ្នក។'
              : 'Tailored clinical care recommendations, dietary strategies, physical activity, and follow-up timeline.'}
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
      {/* 1. ASSESSMENT FINDINGS & HEALTH STATUS (STYLED LIKE RESULT HERO CARD) */}
      {/* ==================================================================== */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 relative overflow-hidden transition-all">
        {/* Droplet Illustration as Stylized Background Watermark */}
        <div className="pointer-events-none absolute -top-4 -left-4 sm:top-0 sm:left-0 h-28 w-28 sm:h-32 sm:w-32 opacity-10 dark:opacity-15 text-primary-500 select-none rotate-12 transition-transform duration-500">
          <DropletIllustration className="h-full w-full drop-shadow-xs" />
        </div>
        {/* Ambient soft glow behind background icon */}
        <div className="pointer-events-none absolute -left-6 -top-6 h-36 w-36 rounded-full bg-primary-500/8 blur-2xl dark:bg-primary-500/10" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Content */}
          <div className="flex-1 space-y-3.5 min-w-0">
            {/* Condition Headline & Narrative Summary */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight">
                {conditionName}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                {localizedSummary}
              </p>
            </div>

            {/* Mini Stat Pills with Icon Backdrops (Styled Like Result Page) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {findings.demographics?.age && (
                <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 shadow-2xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100/80 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span>{findings.demographics.age} {isKhmer ? 'ឆ្នាំ' : 'yrs'}</span>
                </div>
              )}
              {findings.demographics?.bmi && (
                <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 shadow-2xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                    <Scale className="h-3.5 w-3.5" />
                  </div>
                  <span>BMI {findings.demographics.bmi} {bmiStatus ? `(${bmiStatus})` : ''}</span>
                </div>
              )}
              {findings.symptoms && findings.symptoms.length > 0 && (
                <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 shadow-2xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100/80 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <span>{findings.symptoms.length} {isKhmer ? 'រោគសញ្ញាត្រូវគ្នា' : 'Symptoms matched'}</span>
                </div>
              )}
              {findings.risk_factors && findings.risk_factors.length > 0 && (
                <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 shadow-2xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100/80 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                  <span>{findings.risk_factors.length} {isKhmer ? 'កត្តាហានិភ័យ' : 'Risk factors'}</span>
                </div>
              )}
            </div>

            {/* Findings Evidence Chips (Symptoms, Risk Factors, Key Labs) */}
            <div className="pt-1.5 space-y-2">
              {/* Symptoms */}
              {findings.symptoms && findings.symptoms.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    {isKhmer ? 'រោគសញ្ញា៖' : 'Symptoms:'}
                  </span>
                  {findings.symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200/60 bg-rose-50/70 px-2.5 py-0.5 text-[11px] font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                      {tExact(s)}
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
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200/60 bg-amber-50/70 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {tExact(r)}
                    </span>
                  ))}
                </div>
              )}

              {/* Key Labs */}
              {findings.key_labs && Object.keys(findings.key_labs).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {Object.entries(findings.key_labs).map(([k, lab]) => (
                    <div
                      key={k}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800"
                    >
                      <Droplets className="h-3.5 w-3.5 text-sky-500" />
                      <span className="text-slate-500 dark:text-slate-400">
                        {getLabLabel(k, lab.label)}:
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {lab.value} {lab.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {latestResult?.id && (
                <Link
                  to={`/diagnosis/result?diagnosis_result_id=${latestResult.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-primary-700 transition active:scale-[0.98]"
                >
                  <FileText className="h-4 w-4" />
                  <span>{isKhmer ? 'មើលរបាយការណ៍គ្លីនិកពេញលេញ' : 'View Full Clinical Report'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Right: Stepped Progression Risk Scale with Evidence Agreement */}
          <div className="shrink-0 flex items-center justify-center pt-2 lg:pt-0">
            <RiskProgressionBars
              percent={certaintyPct}
              isKhmer={isKhmer}
            />
          </div>
        </div>
      </section>

      {/* Dynamic Provisional / Low-Confidence Banner */}
      {isProvisional && (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 sm:p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  {isKhmer
                    ? 'ការណែនាំដំណាក់កាលពិនិត្យបឋម (កម្រិតទំនុកចិត្ត < ៥០%)'
                    : 'Preliminary Screening Phase (Certainty < 50%)'}
                </h4>
                <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/80 dark:text-amber-200 uppercase tracking-wider">
                  {isKhmer ? 'ផែនការបឋម' : 'Provisional Plan'}
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-900/85 dark:text-amber-300/85 leading-relaxed">
                {isKhmer
                  ? 'ដោយសារការវាយតម្លៃនេះមិនទាន់មានលទ្ធផលមន្ទីរពិសោធន៍ច្បាស់លាស់ (កម្រិតទំនុកចិត្ត < ៥០%) ប្រព័ន្ធបានកែសម្រួលផែនការថែទាំនេះដោយផ្តោតលើការបញ្ជាក់តាមតេស្តឈាមមន្ទីរពិសោធន៍ និងការរស់នៅប្រកបដោយសុខភាពល្អជាមូលដ្ឋាន ដោយមិនទាន់បង្ហាញផែនការព្យាបាលវេជ្ជសាស្ត្រធ្ងន់ធ្ងរនៅឡើយទេ។ ផែនការលម្អិតពេញលេញនឹងបើកដំណើរការនៅពេលមានលទ្ធផលតេស្តឈាម (HbA1c ឬ ជាតិស្ករពេលព្រឹក)។'
                  : 'Because clinical evidence from this screening is preliminary (< 50% certainty), this care plan is dynamically tailored for laboratory confirmation and baseline healthy living rather than aggressive medical intervention. Full comprehensive management protocols unlock once confirmatory laboratory tests (HbA1c / FPG) are recorded.'}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  to="/assessment"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-amber-700 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isKhmer ? 'បញ្ចូលលទ្ធផលតេស្តឈាម ដើម្បីទទួលបានផែនការពេញលេញ' : 'Retake with Lab Tests to Unlock Full Plan'}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic AI Personalization Insights */}
      {findings.tailored_insights?.length > 0 && (
        <section className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/60 via-white to-blue-50/40 p-5 shadow-xs dark:border-sky-950/60 dark:from-slate-900/90 dark:via-slate-900 dark:to-blue-950/20">
          <div className="flex items-center gap-2.5 pb-3 border-b border-sky-100/80 dark:border-slate-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isKhmer ? 'ការវិភាគ និងការកែសម្រួលផ្ទាល់ខ្លួនពី AI' : 'AI Clinical Personalization Insights'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isKhmer
                  ? 'ផែនការនេះត្រូវបានកែសម្រួលជាក់លាក់ផ្អែកលើរោគសញ្ញា កត្តាហានិភ័យ និងលទ្ធផលតេស្តរបស់អ្នក'
                  : 'Synthesized dynamically from your reported symptoms, clinical risk factors, and biometric metrics'}
              </p>
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {findings.tailored_insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-slate-100/80 bg-white/80 p-3 shadow-2xs dark:border-slate-800/60 dark:bg-slate-850/60"
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500 dark:text-sky-400" />
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {insight}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Target Chips */}
          {findings.personalized_metrics && (
            <div className="mt-3 pt-3 border-t border-sky-100/60 dark:border-slate-800/60 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {isKhmer ? 'គោលដៅសំខាន់ៗ:' : 'Key Targets:'}
              </span>
              {findings.personalized_metrics.daily_water_liters && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200/50 dark:bg-sky-950/50 dark:text-sky-300">
                  <Droplets className="h-3 w-3" />
                  {isKhmer ? `ទឹក ${findings.personalized_metrics.daily_water_liters}L/ថ្ងៃ` : `${findings.personalized_metrics.daily_water_liters}L Water/Day`}
                </span>
              )}
              {findings.personalized_metrics.daily_step_goal && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <Footprints className="h-3 w-3" />
                  {isKhmer ? `${findings.personalized_metrics.daily_step_goal.toLocaleString()} ជំហាន/ថ្ងៃ` : `${findings.personalized_metrics.daily_step_goal.toLocaleString()} Steps/Day`}
                </span>
              )}
              {findings.personalized_metrics.target_fasting_glucose && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/50 dark:bg-indigo-950/50 dark:text-indigo-300">
                  <HeartPulse className="h-3 w-3" />
                  {isKhmer ? `ជាតិស្ករពេលព្រឹក: ${findings.personalized_metrics.target_fasting_glucose}` : `Fasting: ${findings.personalized_metrics.target_fasting_glucose}`}
                </span>
              )}
              {findings.personalized_metrics.weight_management_goal && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/50 dark:bg-amber-950/50 dark:text-amber-300">
                  <Scale className="h-3 w-3" />
                  {findings.personalized_metrics.weight_management_goal}
                </span>
              )}
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* 2. CARE RECOMMENDATIONS                                              */}
      {/*    (Diet, Physical Activity, Lifestyle, Monitoring)                  */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isKhmer ? 'ផែនការសកម្មភាព និងការណែនាំសុខភាព' : 'Actionable Care Recommendations'}
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All Recommendations', icon: Sparkles },
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
                          {tExact(item.title) || item.title}
                        </h4>
                        {item.tag && (
                          <span className="shrink-0 rounded-full bg-emerald-100/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {tExact(item.tag) || item.tag}
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
                            <span>{tExact(food) || food}</span>
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
                            <span>{tExact(food) || food}</span>
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
                      <span>{isKhmer ? `${activity.weekly_target_minutes} នាទី/សប្តាហ៍` : `${activity.weekly_target_minutes} min/wk`}</span>
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
                          {tExact(item.title) || item.title}
                        </h4>
                        {item.tag && (
                          <span className="shrink-0 rounded-full bg-sky-100/70 px-2 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                            {tExact(item.tag) || item.tag}
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
                      <span>{isKhmer ? 'ការប្រុងប្រយ័ត្ន និងការការពារបាតជើង' : 'Safety & Foot Protection'}</span>
                    </div>
                    <ul className="mt-1.5 space-y-1 text-[11px] text-amber-900/80 dark:text-amber-200/80">
                      {activity.safety_precautions.map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                          <span>{tExact(p) || p}</span>
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
                          {tExact(item.title) || item.title}
                        </h4>
                        {item.tag && (
                          <span className="shrink-0 rounded-full bg-indigo-100/70 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                            {tExact(item.tag) || item.tag}
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
                          {tExact(item.title) || item.title}
                        </h4>
                        {item.frequency && (
                          <span className="shrink-0 rounded-full bg-purple-100/70 px-2 py-0.5 text-[10px] font-semibold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                            {localizeFrequency(item.frequency)}
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
                            {localizeTargetRangeKey(k)}
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
      {/* 3. CLINICAL FOLLOW-UP SCHEDULE & REFERRALS                           */}
      {/* ==================================================================== */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
              <CalendarClock className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isKhmer ? 'កាលវិភាគតាមដាន និងការពិគ្រោះយោបល់' : 'Clinical Follow-up & Milestones'}
            </h3>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/90 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-300">
            <Clock className="h-3.5 w-3.5" />
            <span>{isKhmer ? `កាលកំណត់៖ ${tExact(followUp.timeline) || followUp.timeline}` : `Timeline: ${followUp.timeline || 'Recommended'}`}</span>
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
                    <span>{tExact(item.timeframe) || item.timeframe}</span>
                  </div>
                  <h5 className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {tExact(item.title) || item.title}
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
                    <span>{tExact(s) || s}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. CLINICAL SAFETY & EMERGENCY GUIDANCE                              */}
      {/* ==================================================================== */}
      <section className="rounded-2xl border border-rose-200/90 bg-rose-50/40 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] sm:p-6 dark:border-rose-900/60 dark:bg-rose-950/20">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-rose-900 dark:text-rose-100">
              {isKhmer ? 'ការណែនាំសុវត្ថិភាព និងសញ្ញាអាសន្ន' : disclaimer.title || 'Clinical Safety & Emergency Guidance'}
            </h3>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
              {isKhmer
                ? 'ការណែនាំសុខភាពនេះមិនជំនួសវេជ្ជបញ្ជា ឬការពិគ្រោះផ្ទាល់ជាមួយគ្រូពេទ្យឡើយ'
                : 'Strict clinical decision-support boundaries'}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs sm:text-sm leading-relaxed text-rose-900/90 dark:text-rose-200/90">
          {isKhmer
            ? 'ផែនការថែទាំផ្ទាល់ខ្លួននេះ ត្រូវបានបង្កើតឡើងដោយប្រព័ន្ធជំនួយការសម្រេចចិត្តគ្លីនិកឆ្លាតវៃ ដើម្បីជាការណែនាំអំពីរបៀបរស់នៅ និងការអប់រំសុខភាពផ្អែកលើការវាយតម្លៃរបស់អ្នក។ វាមិនជំនួសការវិនិច្ឆ័យរោគផ្លូវការ ឬការចេញវេជ្ជបញ្ជាថ្នាំឡើយ។ រាល់ការសម្រេចចិត្តលើការព្យាបាលវេជ្ជសាស្ត្រ និងការប្រើប្រាស់ថ្នាំ ត្រូវតែធ្វើឡើងដោយមានការពិគ្រោះយោបល់ផ្ទាល់ជាមួយវេជ្ជបណ្ឌិតជំនាញ។'
            : disclaimer.content}
        </p>

        {/* Emergency Red Flags */}
        {disclaimer.red_flags && disclaimer.red_flags.length > 0 && (
          <div className="mt-4 rounded-xl border border-rose-200/80 bg-white/70 p-4 dark:border-rose-900/50 dark:bg-slate-900/70">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>
                {isKhmer
                  ? 'សញ្ញាអាសន្នដែលត្រូវទៅមន្ទីរពេទ្យជាបន្ទាន់ (Red-Flag Emergencies):'
                  : 'Emergency Red Flags — Seek Urgent Medical Care If:'}
              </span>
            </div>
            <ul className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-rose-900 dark:text-rose-200">
              {disclaimer.red_flags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span className="leading-snug">{localizeRedFlag(flag)}</span>
                </li>
              ))}
            </ul>
            {disclaimer.emergency_instruction && (
              <p className="mt-3 border-t border-rose-100 pt-2 text-[11px] font-semibold text-rose-700 dark:border-rose-900/50 dark:text-rose-300">
                {isKhmer
                  ? 'ប្រសិនបើអ្នកជួបប្រទះសញ្ញាអាសន្នណាមួយខាងលើ សូមស្វែងរកការព្យាបាលបន្ទាន់នៅមន្ទីរពេទ្យ ឬទាក់ទងលេខសង្គ្រោះបន្ទាន់ភ្លាមៗ។'
                  : disclaimer.emergency_instruction}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default PersonalizedCarePlanSection
