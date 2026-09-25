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
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Droplets,
  Eye,
  FileText,
  Flame,
  Footprints,
  HeartPulse,
  Info,
  Layers,
  Moon,
  Scale,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  User,
  Utensils,
  Zap,
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

function getActionItemMeta(item, category, isKhmer) {
  const title = (item.title || '').toLowerCase()
  const tag = (item.tag || item.frequency || '').toLowerCase()

  if (title.includes('water') || title.includes('hydrat') || tag.includes('hydrat')) {
    return {
      icon: Droplets,
      color: 'sky',
      keyStat: isKhmer ? '២.០–២.៥ លីត្រ / ថ្ងៃ' : '2.0–2.5L / Day',
    }
  }
  if (title.includes('plate') || tag.includes('plate')) {
    return {
      icon: Utensils,
      color: 'emerald',
      keyStat: isKhmer ? '៥០% បន្លែ · ២៥% សាច់ · ២៥% បាយ' : '50% Veg · 25% Protein · 25% Carbs',
    }
  }
  if (title.includes('sugar') || tag.includes('sugar')) {
    return {
      icon: Apple,
      color: 'amber',
      keyStat: isKhmer ? '< ២៥g ស្ករប្រចាំថ្ងៃ' : '< 25g Daily Added Sugar',
    }
  }
  if (title.includes('fiber') || tag.includes('fiber')) {
    return {
      icon: Apple,
      color: 'emerald',
      keyStat: isKhmer ? '≥ ៣០g ជាតិសរសៃ / ថ្ងៃ' : '≥ 30g Daily Fiber',
    }
  }
  if (title.includes('walk') || title.includes('aerobic') || tag.includes('aerobic')) {
    return {
      icon: Footprints,
      color: 'emerald',
      keyStat: isKhmer ? '៣០ នាទី / ថ្ងៃ' : '30 Min / Day',
    }
  }
  if (title.includes('resistance') || title.includes('strength') || tag.includes('muscle')) {
    return {
      icon: Activity,
      color: 'indigo',
      keyStat: isKhmer ? '២–៣ ដង / សប្តាហ៍' : '2–3x / Week',
    }
  }
  if (title.includes('post-meal') || title.includes('prandial') || tag.includes('post-meal')) {
    return {
      icon: Clock,
      color: 'sky',
      keyStat: isKhmer ? '១០–១៥ នាទីក្រោយអាហារ' : '10–15 Min Post-Meal Walk',
    }
  }
  if (title.includes('sedentary') || tag.includes('sedentary')) {
    return {
      icon: Zap,
      color: 'amber',
      keyStat: isKhmer ? 'សម្រាករៀងរាល់ ៣០ នាទី' : 'Stand / Walk Every 30m',
    }
  }
  if (title.includes('sleep') || tag.includes('sleep')) {
    return {
      icon: Moon,
      color: 'indigo',
      keyStat: isKhmer ? '៧–៨ ម៉ោង រៀងរាល់យប់' : '7–8 Hours Nightly',
    }
  }
  if (title.includes('foot') || tag.includes('foot') || title.includes('wound')) {
    return {
      icon: Footprints,
      color: 'rose',
      keyStat: isKhmer ? 'ពិនិត្យបាតជើងប្រចាំថ្ងៃ' : 'Daily Foot & Skin Check',
    }
  }
  if (title.includes('stress') || tag.includes('stress') || title.includes('cortisol')) {
    return {
      icon: HeartPulse,
      color: 'purple',
      keyStat: isKhmer ? '១០ នាទី ដកដង្ហើមវែងៗ' : '10 Min Daily Mindfulness',
    }
  }
  if (title.includes('smbg') || title.includes('fasting blood sugar') || title.includes('glucose check')) {
    return {
      icon: Droplets,
      color: 'amber',
      keyStat: isKhmer ? 'ពេលព្រឹកមុនអាហារ' : 'Fasting AM Target: 80–130',
    }
  }
  if (title.includes('hba1c') || tag.includes('hba1c')) {
    return {
      icon: Stethoscope,
      color: 'purple',
      keyStat: isKhmer ? 'រៀងរាល់ ៣–៦ ខែម្ដង' : 'Lab Test Every 3–6 Mo',
    }
  }
  if (title.includes('blood pressure') || title.includes('hypertension') || title.includes('dash')) {
    return {
      icon: HeartPulse,
      color: 'rose',
      keyStat: isKhmer ? 'រក្សា < ១៣០/៨០ mmHg' : 'Target: < 130/80 mmHg',
    }
  }
  if (title.includes('weight') || tag.includes('weight') || title.includes('caloric')) {
    return {
      icon: Scale,
      color: 'emerald',
      keyStat: isKhmer ? 'គោលដៅ ៥–៧% នៃទម្ងន់' : '5–7% Weight Target',
    }
  }

  // Fallback by category
  if (category === 'diet') return { icon: Utensils, color: 'emerald', keyStat: isKhmer ? 'អាហារមានតុល្យភាព' : 'Balanced Plate' }
  if (category === 'activity') return { icon: Activity, color: 'sky', keyStat: isKhmer ? 'លំហាត់ប្រាណទៀងទាត់' : 'Consistent Routine' }
  if (category === 'lifestyle') return { icon: Moon, color: 'indigo', keyStat: isKhmer ? 'ទម្លាប់ប្រចាំថ្ងៃ' : 'Daily Habit' }
  return { icon: HeartPulse, color: 'purple', keyStat: isKhmer ? 'ការតាមដានសុខភាព' : 'Clinical Monitoring' }
}

function ActionItemRow({
  item,
  itemKey,
  category,
  isExpanded,
  onToggle,
  isCompleted = false,
  onToggleComplete,
  isKhmer,
  tExact,
}) {
  const meta = getActionItemMeta(item, category, isKhmer)
  const Icon = meta.icon

  const colorStyles = {
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40',
      hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-800/60',
    },
    sky: {
      iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
      badge: 'bg-sky-50 text-sky-700 border-sky-200/60 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/40',
      hoverBorder: 'hover:border-sky-200 dark:hover:border-sky-800/60',
    },
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/40',
      hoverBorder: 'hover:border-indigo-200 dark:hover:border-indigo-800/60',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
      badge: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/40',
      hoverBorder: 'hover:border-purple-200 dark:hover:border-purple-800/60',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      badge: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40',
      hoverBorder: 'hover:border-amber-200 dark:hover:border-amber-800/60',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
      badge: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/40',
      hoverBorder: 'hover:border-rose-200 dark:hover:border-rose-800/60',
    },
  }[meta.color] || {
    iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    hoverBorder: 'hover:border-slate-300',
  }

  const rawTitle = item.title || ''
  const displayTitle = tExact(rawTitle) || rawTitle
  const rawTag = item.tag || item.frequency || ''
  const displayTag = tExact(rawTag) || rawTag

  return (
    <div
      className={cn(
        'group rounded-xl border border-slate-100 bg-white p-3 shadow-2xs transition-all duration-150',
        colorStyles.hoverBorder,
        isCompleted && 'bg-emerald-50/25 border-emerald-200/60 dark:bg-emerald-950/15 dark:border-emerald-800/40',
        'dark:border-slate-800/80 dark:bg-slate-900/80 dark:hover:bg-slate-800/40'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Interactive Checkbox for Habit Tracking */}
          {onToggleComplete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleComplete()
              }}
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-150',
                isCompleted
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-2xs'
                  : 'border-slate-300 bg-transparent hover:border-slate-400 dark:border-slate-600'
              )}
              title={isCompleted ? (isKhmer ? 'ចុចដើម្បីដោះការធីក' : 'Mark as incomplete') : (isKhmer ? 'ចុចដើម្បីកត់ត្រាថាបានធ្វើរួច' : 'Mark as done for today')}
            >
              {isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
            </button>
          )}

          {/* Category Icon */}
          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', colorStyles.iconBg)}>
            <Icon className="h-4 w-4" />
          </div>

          {/* Title & Key Glanceable Stat */}
          <div className="min-w-0 flex-1 cursor-pointer select-none" onClick={onToggle}>
            <h4
              className={cn(
                'text-xs sm:text-sm font-semibold text-slate-900 truncate dark:text-slate-100 transition-colors',
                isCompleted && 'line-through text-slate-400 dark:text-slate-500'
              )}
            >
              {displayTitle}
            </h4>
            {meta.keyStat && !isExpanded && (
              <p className="text-[11px] font-medium text-slate-400 truncate dark:text-slate-500">
                {meta.keyStat}
              </p>
            )}
          </div>
        </div>

        {/* Right side Tag Badge & Chevron */}
        <div className="flex items-center gap-2 shrink-0 cursor-pointer select-none" onClick={onToggle}>
          {displayTag && (
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold border', colorStyles.badge)}>
              {displayTag}
            </span>
          )}
          <button
            type="button"
            className="p-0.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition"
          >
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isExpanded && 'rotate-180 text-slate-700 dark:text-slate-300'
              )}
            />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs leading-relaxed text-slate-600 dark:text-slate-300 animate-in fade-in duration-150">
          {item.description}
        </div>
      )}
    </div>
  )
}

export function PersonalizedCarePlanSection({
  carePlan,
  latestResult,
  onRegenerate,
  regenerating = false,
  className = '',
}) {
  const { isKhmer, tExact } = useLanguage()
  const [activeRecTab, setActiveRecTab] = useState('all')
  const [viewMode, setViewMode] = useState('compact') // 'compact' | 'detailed'
  const [expandedItems, setExpandedItems] = useState({})
  const [isSafetyExpanded, setIsSafetyExpanded] = useState(false)
  const [showClinicalNotes, setShowClinicalNotes] = useState(false)

  // Interactive habit completion state (persisted per user & date)
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const habitStorageKey = `care_plan_actions_done_${todayKey}_${latestResult?.id || 'default'}`
  const [completedActions, setCompletedActions] = useState(() => {
    try {
      const saved = localStorage.getItem(habitStorageKey)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const toggleActionComplete = (itemKey) => {
    setCompletedActions((prev) => {
      const next = prev.includes(itemKey)
        ? prev.filter((k) => k !== itemKey)
        : [...prev, itemKey]
      try {
        localStorage.setItem(habitStorageKey, JSON.stringify(next))
      } catch {}
      return next
    })
  }

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

  const toggleItem = (key) => {
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const isItemExpanded = (key) => {
    return viewMode === 'detailed' || Boolean(expandedItems[key])
  }
  return (
    <div className={cn('space-y-6 animate-in fade-in duration-200', className)}>

      {/* ==================================================================== */}
      {/* 1. ASSESSMENT FINDINGS & HEALTH STATUS (STYLED LIKE RESULT HERO CARD) */}
      {/* ==================================================================== */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 relative overflow-hidden transition-all">
        {/* Droplet Illustration as Stylized Background Watermark */}
        <div className="pointer-events-none absolute -top-4 -left-4 sm:top-0 sm:left-0 h-28 w-28 sm:h-32 sm:w-32 opacity-10 dark:opacity-15 text-primary-500 select-none rotate-12 transition-transform duration-500">
          <DropletIllustration className="h-full w-full drop-shadow-xs" />
        </div>
        <div className="pointer-events-none absolute -left-6 -top-6 h-36 w-36 rounded-full bg-primary-500/8 blur-2xl dark:bg-primary-500/10" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Content */}
          <div className="flex-1 space-y-3 min-w-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight">
                  {conditionName}
                </h2>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-bold border',
                    riskLevel === 'high' || isUrgent
                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                      : riskLevel === 'moderate'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                  )}
                >
                  {riskLevel === 'high' || isUrgent
                    ? (isKhmer ? 'ហានិភ័យខ្ពស់' : 'High Risk')
                    : riskLevel === 'moderate'
                    ? (isKhmer ? 'ហានិភ័យមធ្យម' : 'Moderate Risk')
                    : (isKhmer ? 'ហានិភ័យទាប' : 'Low Risk')}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {isKhmer
                  ? 'ផែនការសកម្មភាពបែបបទរស់នៅ ដើម្បីរក្សាលំនឹងជាតិស្ករ និងបង្កើនសុខភាពរំលាយអាហារ។'
                  : 'Actionable lifestyle targets to stabilize glucose and boost metabolic health.'}
              </p>

              {/* Optional Collapsible Clinical Narrative */}
              <div className="mt-1.5">
                <button
                  type="button"
                  onClick={() => setShowClinicalNotes((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  <Info className="h-3 w-3" />
                  <span>
                    {showClinicalNotes
                      ? (isKhmer ? 'លាក់កំណត់សម្គាល់គ្លីនិក' : 'Hide Clinical Rationale')
                      : (isKhmer ? 'មើលកំណត់សម្គាល់គ្លីនិក' : 'View Clinical Rationale')}
                  </span>
                  <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', showClinicalNotes && 'rotate-180')} />
                </button>
                {showClinicalNotes && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/90 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed animate-in fade-in duration-150">
                    {localizedSummary}
                  </p>
                )}
              </div>
            </div>

            {/* Mini Stat Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {findings.demographics?.age && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 shadow-2xs">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100/80 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
                    <User className="h-3 w-3" />
                  </div>
                  <span>{findings.demographics.age} {isKhmer ? 'ឆ្នាំ' : 'yrs'}</span>
                </div>
              )}
              {findings.demographics?.bmi && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 shadow-2xs">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                    <Scale className="h-3 w-3" />
                  </div>
                  <span>BMI {findings.demographics.bmi} {bmiStatus ? `(${bmiStatus})` : ''}</span>
                </div>
              )}
              {findings.symptoms && findings.symptoms.length > 0 && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 shadow-2xs">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100/80 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400">
                    <ShieldCheck className="h-3 w-3" />
                  </div>
                  <span>{findings.symptoms.length} {isKhmer ? 'រោគសញ្ញា' : 'Symptoms'}</span>
                </div>
              )}
              {findings.risk_factors && findings.risk_factors.length > 0 && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 shadow-2xs">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100/80 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400">
                    <Award className="h-3 w-3" />
                  </div>
                  <span>{findings.risk_factors.length} {isKhmer ? 'កត្តាហានិភ័យ' : 'Risk factors'}</span>
                </div>
              )}
            </div>

            {/* Findings Evidence Chips (Symptoms, Risk Factors, Key Labs) */}
            <div className="pt-1 space-y-1.5">
              {/* Risk Factors */}
              {findings.risk_factors && findings.risk_factors.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-400 dark:text-slate-500 text-[11px]">
                    {isKhmer ? 'កត្តាហានិភ័យ៖' : 'Risk Factors:'}
                  </span>
                  {findings.risk_factors.map((r, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md border border-amber-200/60 bg-amber-50/70 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
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
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800"
                    >
                      <Droplets className="h-3 w-3 text-sky-500" />
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {getLabLabel(k, lab.label)}:
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-[11px]">
                        {lab.value} {lab.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {latestResult?.id && (
                <Link
                  to={`/diagnosis/result?diagnosis_result_id=${latestResult.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-700 transition active:scale-[0.98]"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{isKhmer ? 'មើលរបាយការណ៍គ្លីនិកពេញលេញ' : 'View Full Clinical Report'}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Right: Stepped Progression Risk Scale */}
          <div className="shrink-0 flex items-center justify-center pt-2 lg:pt-0">
            <RiskProgressionBars percent={certaintyPct} isKhmer={isKhmer} />
          </div>
        </div>
      </section>

      {/* Dynamic Provisional / Low-Confidence Banner */}
      {isProvisional && (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200">
                  {isKhmer ? 'ដំណាក់កាលពិនិត្យបឋម (កម្រិតទំនុកចិត្ត < ៥០%)' : 'Preliminary Screening Phase (Certainty < 50%)'}
                </h4>
                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/80 dark:text-amber-200 uppercase tracking-wider">
                  {isKhmer ? 'ផែនការបឋម' : 'Provisional Plan'}
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-900/85 dark:text-amber-300/85 leading-relaxed">
                {isKhmer
                  ? 'ផែនការនេះផ្តោតលើការបញ្ជាក់តាមតេស្តឈាមមន្ទីរពិសោធន៍ និងការរស់នៅប្រកបដោយសុខភាពល្អជាមូលដ្ឋាន។'
                  : 'This care plan prioritizes confirmatory laboratory blood tests and baseline healthy lifestyle habits.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. CARE RECOMMENDATIONS (CLEAN, FUNCTIONAL, MODERN DASHBOARD)        */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        {/* Controls Bar: Category Pills + View Mode Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Filter Pills */}
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

          {/* View Mode Toggle + Completion Progress Counter */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {completedActions.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/70 shadow-2xs dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40 animate-in fade-in duration-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {isKhmer
                    ? `បានអនុវត្ត ${completedActions.length} កិច្ចការថ្ងៃនេះ`
                    : `${completedActions.length} Done Today`}
                </span>
              </span>
            )}

            <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                  viewMode === 'compact'
                    ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <Zap className="h-3 w-3" />
                <span>{isKhmer ? 'ទិដ្ឋភាពសង្ខេប' : 'Compact'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                  viewMode === 'detailed'
                    ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <SlidersHorizontal className="h-3 w-3" />
                <span>{isKhmer ? 'ទិដ្ឋភាពលម្អិត' : 'Detailed'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* PILLAR 1: DIET & NUTRITION */}
          {(activeRecTab === 'all' || activeRecTab === 'diet') && (
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <Utensils className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {isKhmer ? 'អាហារូបត្ថម្ភ និងរបបអាហារ' : diet.category || 'Diet & Nutrition'}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {isKhmer ? 'តុល្យភាពជាតិស្ករ និងកាបូអ៊ីដ្រាត' : 'Low Glycemic · Plate Method'}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {isKhmer ? 'ជាតិស្ករទាប' : 'Low Glycemic'}
                  </span>
                </div>

                {/* Visual Metric Strip for Diet */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-emerald-50/70 p-2 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/30">
                    <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      50 / 25 / 25
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'ចានសុខភាព (បន្លែ/សាច់/បាយ)' : 'Plate (Veg/Prot/Carb)'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-amber-50/70 p-2 border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/30">
                    <span className="block text-xs font-bold text-amber-800 dark:text-amber-200">
                      &lt; 25g
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'កម្រិតស្ករប្រចាំថ្ងៃ' : 'Daily Added Sugar'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-sky-50/70 p-2 border border-sky-100 dark:bg-sky-950/30 dark:border-sky-900/30">
                    <span className="block text-xs font-bold text-sky-800 dark:text-sky-200">
                      2.0–2.5 L
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'ជាតិទឹកប្រចាំថ្ងៃ' : 'Water Hydration'}
                    </span>
                  </div>
                </div>

                {/* Compact Action Items */}
                <div className="space-y-2">
                  {diet.action_items?.map((item, idx) => {
                    const key = `diet_${idx}`
                    return (
                      <ActionItemRow
                        key={idx}
                        item={item}
                        itemKey={key}
                        category="diet"
                        isExpanded={isItemExpanded(key)}
                        onToggle={() => toggleItem(key)}
                        isCompleted={completedActions.includes(key)}
                        onToggleComplete={() => toggleActionComplete(key)}
                        isKhmer={isKhmer}
                        tExact={tExact}
                      />
                    )
                  })}
                </div>

                {/* Modern Food Chips (Prioritize & Limit) */}
                {(diet.foods_to_prioritize || diet.foods_to_limit) && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    {diet.foods_to_prioritize && diet.foods_to_prioritize.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{isKhmer ? 'អាហារគួរទទួលទាន' : 'Foods to Prioritize'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {diet.foods_to_prioritize.map((food, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-lg bg-emerald-50/80 px-2.5 py-1 text-[11px] font-medium text-emerald-800 border border-emerald-200/50 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-200"
                            >
                              + {tExact(food) || food}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {diet.foods_to_limit && diet.foods_to_limit.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300 mb-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                          <span>{isKhmer ? 'អាហារគួរកាត់បន្ថយ' : 'Foods to Limit / Avoid'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {diet.foods_to_limit.map((food, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-lg bg-rose-50/80 px-2.5 py-1 text-[11px] font-medium text-rose-800 border border-rose-200/50 dark:bg-rose-950/40 dark:border-rose-800/40 dark:text-rose-200"
                            >
                              – {tExact(food) || food}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PILLAR 2: PHYSICAL ACTIVITY */}
          {(activeRecTab === 'all' || activeRecTab === 'activity') && (
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300">
                      <Activity className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {isKhmer ? 'សកម្មភាពរាងកាយ និងលំហាត់ប្រាណ' : activity.category || 'Physical Activity'}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {isKhmer ? 'លំហាត់ប្រាណបេះដូង និងកម្លាំងសាច់ដុំ' : 'Aerobic & Muscle Sensitivity'}
                      </p>
                    </div>
                  </div>

                  {activity.weekly_target_minutes !== undefined && activity.weekly_target_minutes > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200/80 bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300">
                      <Flame className="h-3 w-3 text-sky-500" />
                      <span>{isKhmer ? `${activity.weekly_target_minutes} នាទី/សប្តាហ៍` : `${activity.weekly_target_minutes} min/wk`}</span>
                    </span>
                  )}
                </div>

                {/* Visual Metric Strip */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-sky-50/70 p-2 border border-sky-100 dark:bg-sky-950/30 dark:border-sky-900/30">
                    <span className="block text-xs font-bold text-sky-800 dark:text-sky-200">
                      {isKhmer ? '៣០ នាទី/ថ្ងៃ' : '30 Min / Day'}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'ដើរលឿន ៥ ថ្ងៃ' : 'Brisk Walk 5d/wk'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-indigo-50/70 p-2 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/30">
                    <span className="block text-xs font-bold text-indigo-800 dark:text-indigo-200">
                      {isKhmer ? '២–៣ ដង/សប្តាហ៍' : '2–3x / Week'}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'កម្លាំងសាច់ដុំ' : 'Strength Training'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-emerald-50/70 p-2 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/30">
                    <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      {isKhmer ? '១០–១៥ នាទី' : '10–15 Min'}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'ដើរក្រោយអាហារ' : 'Post-Meal Walk'}
                    </span>
                  </div>
                </div>

                {/* Compact Action Items */}
                <div className="space-y-2">
                  {activity.action_items?.map((item, idx) => {
                    const key = `activity_${idx}`
                    return (
                      <ActionItemRow
                        key={idx}
                        item={item}
                        itemKey={key}
                        category="activity"
                        isExpanded={isItemExpanded(key)}
                        onToggle={() => toggleItem(key)}
                        isCompleted={completedActions.includes(key)}
                        onToggleComplete={() => toggleActionComplete(key)}
                        isKhmer={isKhmer}
                        tExact={tExact}
                      />
                    )
                  })}
                </div>

                {/* Compact Safety Precautions Alert */}
                {activity.safety_precautions && activity.safety_precautions.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 rounded-xl bg-amber-50/60 border border-amber-200/50 p-2.5 text-[11px] text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-200">
                      <Footprints className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="font-medium">
                        {isKhmer
                          ? 'សុវត្ថិភាព៖ ប្រើប្រាស់ស្បែកជើងសមរម្យ កម្តៅសាច់ដុំ ៥ នាទី និងទទួលទានទឹកឱ្យបានគ្រប់គ្រាន់'
                          : 'Safety Tip: Wear supportive footwear, warm up for 5 mins, and stay hydrated.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PILLAR 3: LIFESTYLE & WELL-BEING */}
          {(activeRecTab === 'all' || activeRecTab === 'lifestyle') && (
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                      <Moon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {isKhmer ? 'របៀបរស់នៅ និងទម្លាប់ប្រចាំថ្ងៃ' : lifestyle.category || 'Lifestyle & Well-being'}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {isKhmer ? 'ការគេង ភាពតានតឹង និងការថែទាំជើង' : 'Sleep, Stress & Foot Vigilance'}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {isKhmer ? 'ទម្លាប់ប្រចាំថ្ងៃ' : 'Daily Habits'}
                  </span>
                </div>

                {/* Visual Metric Strip */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-indigo-50/70 p-2 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/30">
                    <span className="block text-xs font-bold text-indigo-800 dark:text-indigo-200">
                      {isKhmer ? '៧–៨ ម៉ោង' : '7–8 Hours'}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'គេងលក់ស្រួល' : 'Quality Sleep'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-rose-50/70 p-2 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/30">
                    <span className="block text-xs font-bold text-rose-800 dark:text-rose-200">
                      {isKhmer ? 'ប្រចាំថ្ងៃ' : 'Daily Check'}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'ពិនិត្យបាតជើង' : 'Foot & Skin Care'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-purple-50/70 p-2 border border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/30">
                    <span className="block text-xs font-bold text-purple-800 dark:text-purple-200">
                      {isKhmer ? '១០ នាទី' : '10 Min Daily'}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'កាត់បន្ថយស្ត្រេស' : 'Stress Reset'}
                    </span>
                  </div>
                </div>

                {/* Compact Action Items */}
                <div className="space-y-2">
                  {lifestyle.action_items?.map((item, idx) => {
                    const key = `lifestyle_${idx}`
                    return (
                      <ActionItemRow
                        key={idx}
                        item={item}
                        itemKey={key}
                        category="lifestyle"
                        isExpanded={isItemExpanded(key)}
                        onToggle={() => toggleItem(key)}
                        isCompleted={completedActions.includes(key)}
                        onToggleComplete={() => toggleActionComplete(key)}
                        isKhmer={isKhmer}
                        tExact={tExact}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PILLAR 4: BIOMARKER & GLYCEMIC MONITORING */}
          {(activeRecTab === 'all' || activeRecTab === 'monitoring') && (
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300">
                      <HeartPulse className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                        {isKhmer ? 'ការតាមដានជាតិស្ករ និងសូចនាករសុខភាព' : monitoring.category || 'Biomarker Monitoring'}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {isKhmer ? 'គោលដៅជាតិស្ករ និងកាលវិភាគតេស្ត' : 'Target Ranges & Testing Cadence'}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200/60 dark:bg-purple-950/60 dark:text-purple-300">
                    {isKhmer ? 'គោលដៅ ADA' : 'ADA Target'}
                  </span>
                </div>

                {/* Target Ranges Strip */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-emerald-50/70 p-2 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/30">
                    <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      80–130
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'ជាតិស្ករពេលព្រឹក' : 'Fasting (mg/dL)'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-sky-50/70 p-2 border border-sky-100 dark:bg-sky-950/30 dark:border-sky-900/30">
                    <span className="block text-xs font-bold text-sky-800 dark:text-sky-200">
                      &lt; 180
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isKhmer ? '២ ម៉ោងក្រោយអាហារ' : 'Post-Meal (mg/dL)'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-purple-50/70 p-2 border border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/30">
                    <span className="block text-xs font-bold text-purple-800 dark:text-purple-200">
                      &lt; 7.0%
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'កម្រិត HbA1c' : 'HbA1c Target'}
                    </span>
                  </div>
                </div>

                {/* Compact Action Items */}
                <div className="space-y-2">
                  {monitoring.action_items?.map((item, idx) => {
                    const key = `monitoring_${idx}`
                    return (
                      <ActionItemRow
                        key={idx}
                        item={item}
                        itemKey={key}
                        category="monitoring"
                        isExpanded={isItemExpanded(key)}
                        onToggle={() => toggleItem(key)}
                        isCompleted={completedActions.includes(key)}
                        onToggleComplete={() => toggleActionComplete(key)}
                        isKhmer={isKhmer}
                        tExact={tExact}
                      />
                    )
                  })}
                </div>
              </div>
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

        <div className="mt-4 space-y-3.5">
          {/* Primary Action Callout */}
          {followUp.milestone_action && (
            <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/50 p-3.5 dark:border-sky-950/70 dark:bg-sky-950/20">
              <Stethoscope className="h-4.5 w-4.5 shrink-0 text-sky-600 dark:text-sky-400" />
              <p className="text-xs font-medium text-sky-900 dark:text-sky-100 leading-relaxed">
                {followUp.milestone_action}
              </p>
            </div>
          )}

          {/* Timeline Milestones Stepper */}
          {followUp.schedule && followUp.schedule.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {followUp.schedule.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-primary-700 shadow-2xs border border-slate-200/60 dark:bg-slate-700 dark:text-primary-300 dark:border-slate-650">
                    <Calendar className="h-2.5 w-2.5" />
                    <span>{tExact(item.timeframe) || item.timeframe}</span>
                  </span>
                  <h5 className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {tExact(item.title) || item.title}
                  </h5>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Specialist Referrals */}
          {followUp.specialists_to_consult && followUp.specialists_to_consult.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {isKhmer ? 'អ្នកជំនាញពិគ្រោះ៖' : 'Specialists to Consult:'}
              </span>
              {followUp.specialists_to_consult.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <Stethoscope className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                  <span>{tExact(s) || s}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. CLINICAL SAFETY DISCLAIMER (CLEAN COLLAPSIBLE ACCORDION)          */}
      {/* ==================================================================== */}
      <section className="rounded-2xl border border-rose-200/90 bg-rose-50/40 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all dark:border-rose-900/60 dark:bg-rose-950/20">
        <button
          type="button"
          onClick={() => setIsSafetyExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-100">
                {isKhmer ? 'ការណែនាំសុវត្ថិភាពគ្លីនិក និងសញ្ញាអាសន្ន' : disclaimer.title || 'Clinical Safety & Emergency Disclaimer'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-rose-700/80 dark:text-rose-300/80">
                {isKhmer ? 'ជំនួយការសម្រេចចិត្តគ្លីនិក · ចុចដើម្បីមើលសញ្ញាអាសន្ន' : 'Decision-support only · Click to view emergency red flags'}
              </p>
            </div>
          </div>

          <ChevronDown
            className={cn(
              'h-4 w-4 text-rose-600 transition-transform duration-200 dark:text-rose-400',
              isSafetyExpanded ? 'rotate-180' : 'rotate-0'
            )}
          />
        </button>

        {isSafetyExpanded && (
          <div className="mt-3.5 pt-3.5 border-t border-rose-200/60 dark:border-rose-900/40 space-y-3 animate-in fade-in duration-150">
            <p className="text-xs leading-relaxed text-rose-900/90 dark:text-rose-200/90">
              {isKhmer
                ? 'ផែនការថែទាំផ្ទាល់ខ្លួននេះ ត្រូវបានបង្កើតឡើងដោយប្រព័ន្ធជំនួយការសម្រេចចិត្តគ្លីនិកឆ្លាតវៃ ដើម្បីជាការណែនាំអំពីរបៀបរស់នៅ និងការអប់រំសុខភាពផ្អែកលើការវាយតម្លៃរបស់អ្នក។ វាមិនជំនួសការវិនិច្ឆ័យរោគផ្លូវការ ឬការចេញវេជ្ជបញ្ជាថ្នាំឡើយ។'
                : disclaimer.content}
            </p>

            {disclaimer.red_flags && disclaimer.red_flags.length > 0 && (
              <div className="rounded-xl border border-rose-200/80 bg-white/80 p-3.5 dark:border-rose-900/50 dark:bg-slate-900/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                  <span>{isKhmer ? 'សញ្ញាអាសន្នដែលត្រូវទៅមន្ទីរពេទ្យបន្ទាន់៖' : 'Emergency Red Flags — Seek Urgent Medical Care If:'}</span>
                </div>
                <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-rose-900 dark:text-rose-200">
                  {disclaimer.red_flags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-rose-500" />
                      <span className="leading-snug text-[11px]">{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default PersonalizedCarePlanSection
