import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Beaker,
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardList,
  Dna,
  FlaskConical,
  ShieldCheck,
  Droplet,
  Info,
  TestTube,
  Heart,
  HeartPulse,
  Zap,
  RotateCcw,
  FileText,
  FileDown,
  Printer,
  ChevronDown,
  Stethoscope,
  History,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  HelpCircle,
  Brain,
  Sparkles,
  User,
  MoreHorizontal,
  TrendingUp,
  Smartphone,
  ClipboardCheck,
  X,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import {
  EmptyState,
  ErrorAlert,
  StatusBadge,
  ConfirmDialog,
  LoadingState,
  DiagnosisResultSkeleton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui'
import { ConditionEducationPanel } from '@/components/diagnosis/ConditionEducationPanel'
import { getSymptomGuideKey } from '@/lib/symptom-guide'
import { getRiskGuideKey } from '@/lib/risk-factor-guide'
import { bilingualField } from '@/lib/i18n'
import { TechnicalDetailsSection } from '@/components/diagnosis/TechnicalDetailsSection'
import { ExplainableEvidenceSection } from '@/components/diagnosis/ExplainableEvidenceSection'
import { AiReasoningReportSection } from '@/components/diagnosis/AiReasoningReportSection'
import { CarePlanCalloutBanner } from '@/components/diagnosis/CarePlanCalloutBanner'
import PrintableClinicalReport from '@/components/assessment/PrintableClinicalReport'
import { readDiagnosisResultSnapshot, saveDiagnosisResultSnapshot, clearAssessmentSession } from '@/lib/diagnosis-result-storage'
import { notify } from '@/lib/toast'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { userHasStaffRole } from '@/lib/nav-config'
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

function RiskProgressionBars({ percent = 0, isKhmer = false, t }) {
  const safePercent = Math.min(100, Math.max(0, Number(percent) || 0))
  // Map 0-100% to 1-9 level scale
  const currentLevel = Math.max(1, Math.min(9, Math.round((safePercent / 100) * 8) + 1))
  const activeGroup = currentLevel <= 3 ? 1 : currentLevel <= 6 ? 2 : 3

  return (
    <div className="flex flex-col w-full sm:w-[280px] md:w-[320px] select-none">
      {/* Header: Evidence Agreement & Score (no 'certainty' text, no outer bg) */}
      <div className="flex items-baseline justify-between gap-3 w-full pb-1.5">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {isKhmer ? 'ភាពស៊ីសង្វាក់ភស្តុតាង' : 'Evidence agreement'}
        </p>
        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {safePercent}%
        </span>
      </div>

      {/* 9 Stepped Progression Bars for Risk - Larger size */}
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
        <linearGradient id="dropletHeroGrad" x1="18" y1="5" x2="18" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB7185" />
          <stop offset="1" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      <path
        d="M18 5 C18 5 9 16 9 22 C9 26.97 13.03 31 18 31 C22.97 31 27 26.97 27 22 C27 16 18 5 18 5 Z"
        fill="url(#dropletHeroGrad)"
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

function ClinicalReportIllustration({ className = 'h-20 w-20' }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="docShadow" x="12" y="10" width="76" height="96" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#93c5fd" floodOpacity="0.25" />
        </filter>
        <linearGradient id="docBg" x1="24" y1="14" x2="76" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F0F7FF" />
        </linearGradient>
        <linearGradient id="glassFill" x1="60" y1="52" x2="96" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0F2FE" stopOpacity="0.6" />
          <stop offset="1" stopColor="#BAE6FD" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="handleGrad" x1="84" y1="84" x2="108" y2="108" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Background Soft Shadow & Paper Sheet */}
      <g filter="url(#docShadow)">
        <rect x="22" y="14" width="58" height="78" rx="10" fill="url(#docBg)" stroke="#BFDBFE" strokeWidth="1.5" />
      </g>

      {/* Clinical Data Lines (Soft Cyan and Pastel Blue) */}
      <rect x="31" y="26" width="28" height="4" rx="2" fill="#60A5FA" />
      <rect x="31" y="35" width="40" height="3.5" rx="1.75" fill="#93C5FD" />
      <rect x="31" y="43" width="34" height="3.5" rx="1.75" fill="#BFDBFE" />
      <rect x="31" y="51" width="38" height="3.5" rx="1.75" fill="#DBEAFE" />
      <rect x="31" y="59" width="24" height="3.5" rx="1.75" fill="#DBEAFE" />
      <rect x="31" y="67" width="30" height="3.5" rx="1.75" fill="#E2E8F0" />

      {/* Modern SaaS Magnifying Glass */}
      <g className="transition-transform duration-300 hover:rotate-6">
        <line x1="82" y1="82" x2="104" y2="104" stroke="url(#handleGrad)" strokeWidth="7" strokeLinecap="round" />
        <line x1="82" y1="82" x2="104" y2="104" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
        <circle cx="70" cy="70" r="20" fill="url(#glassFill)" stroke="#38BDF8" strokeWidth="3.5" />
        <circle cx="70" cy="70" r="17.5" stroke="#93C5FD" strokeWidth="1.2" opacity="0.7" />
        <path d="M62 60 C66 56 74 56 78 60" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      </g>
    </svg>
  )
}

function toCertaintyPercent(certainty) {
  const numeric = Number(certainty)
  if (Number.isNaN(numeric)) return 0
  const raw = numeric <= 1 ? numeric * 100 : numeric
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function toReadableLabel(value) {
  const text = String(value || '').trim()
  if (!text) return 'N/A'
  return text
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function normalizeSnapshot(payload) {
  if (!payload || typeof payload !== 'object') return null
  if (!payload.result || typeof payload.result !== 'object') return null
  return {
    result: payload.result,
    context: payload.context && typeof payload.context === 'object' ? payload.context : {},
    savedAt: payload.savedAt || null,
  }
}

function getDownloadFilename(headerValue, fallbackName) {
  if (!headerValue) return fallbackName

  const utf8Match = headerValue.match(/filename\\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const basicMatch = headerValue.match(/filename=\"?([^\";]+)\"?/i)
  if (basicMatch?.[1]) {
    return basicMatch[1]
  }

  return fallbackName
}

async function getDownloadErrorMessage(error, fallbackMessage) {
  const blobData = error?.response?.data
  if (blobData instanceof Blob) {
    try {
      const text = await blobData.text()
      const parsed = JSON.parse(text)
      const serverMessage = parsed?.error?.message
      if (serverMessage) return serverMessage
    } catch {
      return fallbackMessage
    }
  }

  return getApiErrorMessage(error, fallbackMessage)
}

function getConfidenceMeta(result, percent, t, tExact) {
  const getKey = (pct) => pct >= 85 ? 'veryHigh' : pct >= 70 ? 'high' : pct >= 45 ? 'moderate' : 'low'
  const key = getKey(percent)

  const fallbackTitle = percent >= 85 ? 'Very high confidence' : percent >= 70 ? 'High confidence' : percent >= 45 ? 'Moderate confidence' : 'Low confidence'
  const fallbackDesc = percent >= 85
    ? 'Multiple strong indicators align — lab values and symptoms both point toward diabetes.'
    : percent >= 70
      ? 'Most evidence points in the same direction. A clinical follow-up can confirm.'
      : percent >= 45
        ? 'Some warning signs are present. Additional lab work would sharpen this assessment.'
        : 'Limited evidence available — the data does not strongly point toward diabetes at this time.'

  const fallback = {
    title: t ? t(`diagnosisResult.confidenceMeta.${key}.title`, fallbackTitle) : fallbackTitle,
    description: t ? t(`diagnosisResult.confidenceMeta.${key}.description`, fallbackDesc) : fallbackDesc,
  }

  if (!result?.confidence_level || typeof result.confidence_level !== 'object') return fallback
  return {
    title: result.confidence_level.title
      ? (tExact ? tExact(bilingualField(result.confidence_level.title, result.confidence_level.title_km)) : result.confidence_level.title)
      : fallback.title,
    description: result.confidence_level.description
      ? (tExact ? tExact(bilingualField(result.confidence_level.description, result.confidence_level.description_km)) : result.confidence_level.description)
      : fallback.description,
  }
}

function getLabStatus(labKey, rawValue) {
  const numeric = Number(rawValue)
  if (Number.isNaN(numeric)) return { label: 'Unknown', tone: 'neutral' }

  if (labKey === 'hba1c') {
    if (numeric >= 6.5) return { label: 'High', tone: 'danger' }
    if (numeric >= 5.7) return { label: 'Elevated', tone: 'warning' }
    return { label: 'Normal', tone: 'success' }
  }

  if (numeric >= 126) return { label: 'High', tone: 'danger' }
  if (numeric >= 100) return { label: 'Elevated', tone: 'warning' }
  return { label: 'Normal', tone: 'success' }
}

function formatLabValue(labKey, rawValue) {
  const numeric = Number(rawValue)
  if (Number.isNaN(numeric)) return 'N/A'
  if (labKey === 'hba1c') return `${numeric.toFixed(1)}%`
  return `${numeric.toFixed(1)} mg/dL`
}

function getTypeLabelKey(type) {
  if (type === 'Type 1') return 'type1'
  if (type === 'Type 2') return 'type2'
  if (type === 'Gestational') return 'gestational'
  if (type === 'Mixed features') return 'mixed'
  return 'undetermined'
}

function getRiskCategory(diagnosis, percent) {
  const d = String(diagnosis || '').toLowerCase()
  if (
    d.includes('no strong') ||
    d.includes('healthy') ||
    d.includes('normal') ||
    d.includes('low risk') ||
    d.includes('insufficient') ||
    d.includes('negative')
  ) {
    return 'normal'
  }
  if (d.includes('prediabetes') || d.includes('early')) {
    return 'prediabetes'
  }
  if (d.includes('elevated') && d.includes('risk')) {
    return 'prediabetes'
  }
  if (d.includes('urgent') || d.includes('emergency')) {
    return 'urgent'
  }
  if (d.includes('type 1') || d.includes('type 2') || d.includes('likely') || d.includes('gestational')) {
    return 'diabetes'
  }
  const p = Number(percent) || 0
  if (p >= 80) return 'urgent'
  if (p >= 50) return 'prediabetes'
  return 'normal'
}

function getGaugeColor(score, diagnosis) {
  const category = getRiskCategory(diagnosis, score)
  if (category === 'normal') {
    return { light: 'stroke-emerald-600', dark: 'stroke-emerald-400' }
  }
  if (category === 'prediabetes') {
    return { light: 'stroke-amber-600', dark: 'stroke-amber-400' }
  }
  if (category === 'urgent') {
    return { light: 'stroke-red-600', dark: 'stroke-red-400' }
  }
  return { light: 'stroke-rose-600', dark: 'stroke-rose-400' }
}

function formatCertaintyContribution(rule) {
  return Number(rule?.effective_certainty ?? rule?.certainty_factor ?? 0).toFixed(2)
}

import { cleanRuleName } from '@/lib/utils'
export { cleanRuleName }

function getPrimaryHeadline(result, percent, t, tExact) {
  const diagnosis = String(result?.diagnosis || '').toLowerCase()
  const typeLabel = result?.suspected_type?.type || ''

  const translateKey = (k, fb) => t ? t(`diagnosisResult.headlines.${k}`, fb) : fb

  if (diagnosis.includes('emergency') || diagnosis.includes('urgent')) return translateKey('urgent', 'Urgent Diabetes Evaluation — Seek Care Now')
  if (diagnosis.includes('highly likely') || (diagnosis.includes('likely') && percent >= 80)) return translateKey('diabetesLikely', 'Diabetes Likely')
  if (diagnosis.includes('likely diabetes') || diagnosis.includes('likely')) return translateKey('diabetesLikely', 'Diabetes Likely')
  if (diagnosis.includes('suspected') && diagnosis.includes('classic')) return translateKey('classicSymptoms', 'Classic Diabetes Symptoms')
  if (diagnosis.includes('prediabetes')) return translateKey('prediabetes', 'Prediabetes Risk Pattern')
  if (diagnosis.includes('possible early')) return translateKey('earlySigns', 'Possible Early Signs of Diabetes')
  if (diagnosis.includes('elevated') && diagnosis.includes('risk')) return translateKey('elevatedRisk', 'Elevated Diabetes Risk')
  if (diagnosis.includes('no strong') || diagnosis.includes('insufficient')) return translateKey('noStrongIndication', 'No Strong Diabetes Indication')

  if (typeLabel === 'Type 1') return translateKey('type1Detected', 'Type 1 Diabetes Pattern Detected')
  if (typeLabel === 'Gestational') return translateKey('gestational', 'Gestational Diabetes Screening')

  if (percent >= 70) return translateKey('highSignal', 'High Diabetes Signal')
  if (percent >= 45) return translateKey('moderateSignal', 'Moderate Diabetes Signal Detected')
  if (percent <= 20) return translateKey('lowRisk', 'Low Risk of Diabetes')

  return result?.diagnosis ? (tExact ? tExact(result.diagnosis) : result.diagnosis) : translateKey('complete', 'Diabetes Assessment Complete')
}

function getScalePercent(labKey, rawValue) {
  const value = Number(rawValue)
  if (Number.isNaN(value)) return null

  if (labKey === 'hba1c') {
    if (value < 5.7) {
      const min = 4
      const max = 5.7
      const zone = Math.max(0, Math.min(1, (value - min) / (max - min)))
      return zone * 33.3333
    }

    if (value <= 6.4) {
      const min = 5.7
      const max = 6.4
      const zone = Math.max(0, Math.min(1, (value - min) / (max - min)))
      return 33.3333 + zone * 33.3333
    }

    const min = 6.5
    const max = 10
    const zone = Math.max(0, Math.min(1, (value - min) / (max - min)))
    return 66.6666 + zone * 33.3334
  }

  if (value < 100) {
    const min = 70
    const max = 100
    const zone = Math.max(0, Math.min(1, (value - min) / (max - min)))
    return zone * 33.3333
  }

  if (value <= 125) {
    const min = 100
    const max = 125
    const zone = Math.max(0, Math.min(1, (value - min) / (max - min)))
    return 33.3333 + zone * 33.3333
  }

  const min = 126
  const max = 220
  const zone = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return 66.6666 + zone * 33.3334
}

function EvidenceRangeGauge({ score = 0, level = 'low' }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0))
  const gaugeColor = getGaugeColor(safeScore)
  const arcPath = 'M 10 66 A 54 54 0 0 1 118 66'

  return (
    <div className="w-full shrink-0 sm:w-[150px]">
      <svg viewBox="0 0 128 80" className="h-[80px] w-[128px]">
        <path
          d={arcPath}
          pathLength="100"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <path
          d={arcPath}
          pathLength="100"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className={`${gaugeColor.light} dark:${gaugeColor.dark}`}
          strokeDasharray={`${safeScore} 100`}
        />
      </svg>
      <div className="-mt-8 text-center mr-4">
        <p className="text-xl font-extrabold leading-none text-slate-900 dark:text-slate-100">{safeScore} / 100</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{toReadableLabel(level)}</p>
      </div>
    </div>
  )
}

function LabIndicatorCard({ title, valueLabel, status, subtitle, pointerPercent, ticks, icon: Icon }) {
  const markerPercent = pointerPercent == null
    ? null
    : Math.max(1.5, Math.min(98.5, Number(pointerPercent)))
  return (
    <div className="py-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" />}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</span>
              <StatusBadge tone={status.tone} size="sm">{status.label}</StatusBadge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{valueLabel}</span>
        </div>
      </div>

      <div className="mt-2.5 max-w-md">
        <div className="relative h-2 rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="h-full w-1/3 bg-emerald-500" />
            <div className="absolute left-1/3 top-0 h-full w-1/3 bg-amber-400" />
            <div className="absolute right-0 top-0 h-full w-1/3 bg-red-500" />
          </div>
          {markerPercent != null ? (
            <span
              className="pointer-events-none absolute -top-4 -translate-x-1/2 text-base leading-none text-red-600 drop-shadow-xs dark:text-red-400"
              style={{ left: `${markerPercent}%` }}
            >
              ▼
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReportSection({ title, subtitle, children, icon: Icon, action, className = '', id }) {
  return (
    <section id={id} className={`pt-8 border-t border-slate-200/80 dark:border-slate-800 space-y-4 ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {Icon && (
              <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400 shrink-0" />
            )}
            <div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children && (
        <div className={Icon ? 'pl-3 sm:pl-9 space-y-4' : 'space-y-4'}>
          {children}
        </div>
      )}
    </section>
  )
}

export function DiagnosisResultPage() {
  const { user } = useAuth()
  const canViewOwnCarePlan = user?.permissions?.includes('care_plan.view_own')
  const { t, tExact, isKhmer, language } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const [loadError, setLoadError] = useState('')
  const diagnosisResultId = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('diagnosis_result_id')
  }, [location.search])
  const [loadingRemote, setLoadingRemote] = useState(() => Boolean(new URLSearchParams(location.search).get('diagnosis_result_id')))
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [snapshot, setSnapshot] = useState(() => {
    const fromState = normalizeSnapshot(location.state)
    if (fromState) return fromState
    // Viewing a specific saved result — start empty and fetch it from the
    // database instead of falling back to a possibly stale local snapshot.
    if (diagnosisResultId) return null
    return readDiagnosisResultSnapshot(user)
  })

  const [expandedRules, setExpandedRules] = useState({})
  const [ruleExplanations, setRuleExplanations] = useState({})
  const [loadingRuleExplanations, setLoadingRuleExplanations] = useState({})

  const [submittingToCareTeam, setSubmittingToCareTeam] = useState(false)
  const [patientNote, setPatientNote] = useState(() => location.state?.patientNote || '')
  const [submittedCareTeamResult, setSubmittedCareTeamResult] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showSummaryDetails, setShowSummaryDetails] = useState(false)
  const [showConditionGuideModal, setShowConditionGuideModal] = useState(false)
  const [showDoctorConsultModal, setShowDoctorConsultModal] = useState(false)

  const toggleRuleExplanation = async (ruleKey, rule) => {
    const isCurrentlyExpanded = Boolean(expandedRules[ruleKey])
    setExpandedRules((prev) => ({ ...prev, [ruleKey]: !isCurrentlyExpanded }))

    // If opening and not yet fetched
    if (!isCurrentlyExpanded && !ruleExplanations[ruleKey]) {
      if (rule?.explanation) {
        setRuleExplanations((prev) => ({ ...prev, [ruleKey]: rule.explanation }))
      }

      const identifier = rule?.id || rule?.code || rule?.name
      if (identifier) {
        if (!rule?.explanation) {
          setLoadingRuleExplanations((prev) => ({ ...prev, [ruleKey]: true }))
        }
        try {
          const response = await api.get(`/diagnosis/rule-explanation/${encodeURIComponent(identifier)}`)
          const data = getApiData(response)
          if (data?.explanation) {
            setRuleExplanations((prev) => ({ ...prev, [ruleKey]: data.explanation }))
          } else if (!rule?.explanation && data?.description) {
            setRuleExplanations((prev) => ({ ...prev, [ruleKey]: data.description }))
          }
        } catch (err) {
          console.warn('Failed to fetch rule explanation:')
        } finally {
          setLoadingRuleExplanations((prev) => ({ ...prev, [ruleKey]: false }))
        }
      }
    }
  }

  useEffect(() => {
    // DB-first: when a specific result is requested, ALWAYS fetch it from the
    // database so the report reflects the saved record — including later
    // doctor annotations. A location.state snapshot (straight from a fresh
    // assessment) may paint first and is then replaced by the fetched data.
    if (diagnosisResultId) {
      let cancelled = false

      async function loadDiagnosisResult() {
        setLoadingRemote(true)
        setLoadError('')
        try {
          const response = await api.get(`/diagnosis/${diagnosisResultId}`)
          const result = getApiData(response)
          if (cancelled) return
          const nextSnapshot = {
            result,
            context: {
              patient_id: result?.patient_id ?? null,
              patient_name: result?.patient_name ?? null,
              assessment_mode: result?.assessment_session?.mode ?? null,
            },
            savedAt: result?.created_at || null,
          }
          setSnapshot(nextSnapshot)
          saveDiagnosisResultSnapshot({ user, result, context: nextSnapshot.context })
        } catch (err) {
          if (cancelled) return
          setLoadError(getApiErrorMessage(err, 'Failed to load diagnosis result'))
        } finally {
          if (!cancelled) {
            setLoadingRemote(false)
          }
        }
      }

      loadDiagnosisResult()
      return () => {
        cancelled = true
      }
    }

    setLoadingRemote(false)
    // No specific result requested — fall back to the local snapshot of the
    // latest assessment for this account.
    const fromState = normalizeSnapshot(location.state)
    if (fromState) {
      setSnapshot(fromState)
      return
    }

    setSnapshot(readDiagnosisResultSnapshot(user))
  }, [diagnosisResultId, location.state, user])

  const activeResult = submittedCareTeamResult || snapshot?.result
  const result = activeResult
  const context = snapshot?.context || {}

  useEffect(() => {
    if (activeResult?.patient_note && !patientNote) {
      setPatientNote(activeResult.patient_note)
    }
  }, [activeResult?.patient_note])

  const [remoteReasoning, setRemoteReasoning] = useState(null)
  const targetResultId = diagnosisResultId || activeResult?.id || activeResult?.diagnosis_result_id || null

  const [hasOpenedCarePlan, setHasOpenedCarePlan] = useState(() => {
    if (!targetResultId) return false
    try {
      return window.localStorage.getItem(`care_plan_generated_${targetResultId}`) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!targetResultId) return
    try {
      const generated = window.localStorage.getItem(`care_plan_generated_${targetResultId}`) === 'true'
      setHasOpenedCarePlan(generated)
    } catch {}
  }, [targetResultId])

  const handleCarePlanNavigation = () => {
    if (targetResultId) {
      try {
        window.localStorage.setItem(`care_plan_generated_${targetResultId}`, 'true')
      } catch {}
      setHasOpenedCarePlan(true)
    }
  }

  useEffect(() => {
    if (activeResult?.reasoning_report) {
      setRemoteReasoning(activeResult.reasoning_report)
      return
    }
    if (!targetResultId) return

    let cancelled = false
    api.get(`/diagnosis/${targetResultId}/reasoning`)
      .then((res) => {
        if (!cancelled) {
          const data = getApiData(res)
          if (data) setRemoteReasoning(data)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [targetResultId, activeResult?.reasoning_report])

  const effectiveReasoningReport = activeResult?.reasoning_report || remoteReasoning || null

  const isStaff = userHasStaffRole(user)
  const userRoles = useMemo(
    () => (user?.roles || (user?.role ? [user.role] : [])).map((r) => String(r).toLowerCase()),
    [user]
  )
  const isDoctor =
    isStaff ||
    userRoles.includes('doctor') ||
    userRoles.includes('clinician') ||
    userRoles.includes('admin') ||
    Boolean(user?.permissions?.includes('diagnosis.review_any'))

  const reviewUrl = targetResultId ? `/review?diagnosis_result_id=${targetResultId}` : '/review'
  const patientRecordId = activeResult?.patient_id || snapshot?.context?.patient_id || null
  const patientProfileUrl = patientRecordId ? `/patients/${patientRecordId}` : '/patients'

  const isClinicianAssessment = Boolean(
    activeResult?.is_clinician_assessment ||
    (isStaff && !activeResult?.is_submitted_to_care_team && activeResult?.diagnosed_by_user_id === user?.id) ||
    (activeResult?.diagnosed_by_user_id && activeResult?.patient_user_id && activeResult.diagnosed_by_user_id !== activeResult.patient_user_id)
  )

  const isSubmittedToCareTeam = Boolean(
    isClinicianAssessment ||
    activeResult?.is_submitted_to_care_team ||
    submittedCareTeamResult ||
    activeResult?.explanation_trace?.submitted_to_care_team
  )
  const submittedAt = activeResult?.submitted_to_care_team_at || submittedCareTeamResult?.submitted_to_care_team_at || (isSubmittedToCareTeam ? activeResult?.created_at : null)
  const patientNoteSaved = activeResult?.patient_note || submittedCareTeamResult?.patient_note || (isSubmittedToCareTeam ? patientNote.trim() : '')

  // Doctor-managed fact education (Knowledge Base → Facts) rides on the result.
  // It wins over the compiled locale guide so doctor edits reach patients even
  // on previously saved reports; missing texts fall back to the locale strings.
  const factEducationByLabel = useMemo(() => {
    const map = {}
    for (const item of Array.isArray(result?.fact_education) ? result.fact_education : []) {
      if (item?.label) map[String(item.label).trim().toLowerCase()] = item
    }
    return map
  }, [result?.fact_education])

  if (loadingRemote && !result) {
    return <DiagnosisResultSkeleton />
  }

  if (!result) {
    return (
      <div className="space-y-4">
        <EmptyState
          title={t('diagnosisResult.noResultTitle', 'No assessment result found')}
          description={loadError || t('diagnosisResult.noResultDesc', 'Run an assessment first, then the result report will appear here.')}
        />
        <div>
          <Link to="/diagnosis" className="btn-secondary gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            {t('diagnosisResult.backToAssessment', 'Back to Assessment')}
          </Link>
        </div>
      </div>
    )
  }

  const certaintyPercent = result?.certainty_percent != null
    ? Math.max(0, Math.min(100, Number(result.certainty_percent) || 0))
    : toCertaintyPercent(result?.certainty)
  const confidenceMeta = getConfidenceMeta(result, certaintyPercent, t, tExact)
  const confidenceCalibration = result?.confidence_calibration
    || result?.explanation_trace?.confidence_calculation?.calibration
    || {}
  const confidenceReason = (isKhmer ? result?.confidence_reason_km : result?.confidence_reason)
    || result?.confidence_reason
    || ''
  const confidenceStatusFallbacks = {
    corroborated: 'Independent evidence agrees',
    confirmation_needed: 'Confirmation still needed',
    pregnancy_criterion_met: 'Pregnancy glucose criterion met',
    discordant: 'Tests need reconciliation',
    screening_only: 'Screening evidence only',
    risk_screening: 'Risk estimate only',
    rule_supported: 'Supported by active rules',
    limited: 'Limited evidence',
    insufficient: 'Insufficient evidence',
  }
  const confidenceStatus = confidenceCalibration?.status
    ? t(
        `diagnosisResult.confidenceStatus.${confidenceCalibration.status}`,
        confidenceStatusFallbacks[confidenceCalibration.status] || confidenceCalibration.status,
      )
    : ''

  const matchedSymptoms = Array.isArray(result?.matched_symptoms) ? result.matched_symptoms : []
  const matchedRiskFactors = Array.isArray(result?.matched_risk_factors) ? result.matched_risk_factors : []
  const differentialItems = Array.isArray(result?.differential_diagnoses) ? result.differential_diagnoses : []
  const resolveGuide = (label, localeGuide) => {
    const dbGuide = factEducationByLabel[String(label || '').trim().toLowerCase()]
    if (!dbGuide) {
      return {
        name: localeGuide?.name || null,
        term: localeGuide?.term,
        meaning: localeGuide?.meaning,
        prevention: localeGuide?.prevention,
      }
    }
    return {
      // Doctor-managed label wins over the compiled exact-text map, so Khmer
      // reports show the Khmer name the doctor maintains in the fact catalog.
      name: (isKhmer ? dbGuide.label_km : dbGuide.label) || localeGuide?.name || null,
      term: dbGuide.medical_term || localeGuide?.term,
      meaning: (isKhmer ? dbGuide.meaning_km : dbGuide.meaning) || dbGuide.meaning || localeGuide?.meaning,
      prevention: (isKhmer ? dbGuide.prevention_km : dbGuide.prevention) || dbGuide.prevention || localeGuide?.prevention,
    }
  }
  const recommendations = Array.isArray(result?.recommendations) ? result.recommendations : []
  const hasUrgentWarning = recommendations.some((item) => ['urgent', 'emergency'].includes(String(item?.urgency || '').toLowerCase()))
    || /urgent|emergency|immediate medical/i.test([
      result?.diagnosis,
      result?.headline_explanation,
      result?.result_summary,
    ].filter(Boolean).join(' '))
  const adaptiveAssessment = result?.adaptive_assessment && typeof result.adaptive_assessment === 'object' ? result.adaptive_assessment : null
  const adaptivePatterns = Array.isArray(adaptiveAssessment?.patterns) ? adaptiveAssessment.patterns : []
  const patternConfidence = Number.isFinite(Number(adaptiveAssessment?.screening_confidence)) ? Number(adaptiveAssessment?.screening_confidence) : null
  // Prevention guidance appears once the matched pattern reaches medium
  // confidence (≥45, the app's "moderate" band) or above. Results without
  // adaptive pattern data fall back to the overall screening confidence.
  const preventionConfidenceOk = adaptiveAssessment
    ? adaptivePatterns.length > 0 && patternConfidence !== null && patternConfidence >= 45
    : certaintyPercent >= 45
  const triggeredRules = Array.isArray(result?.triggered_rules) ? result.triggered_rules : []
  const sortedRules = [...triggeredRules].sort(
    (left, right) => Number(right?.effective_certainty ?? right?.certainty_factor ?? 0) - Number(left?.effective_certainty ?? left?.certainty_factor ?? 0)
  )
  // ── Dynamic prevention tier ──
  // The advice adapts to the matched pattern/condition. First match wins —
  // the strongest evidence class drives the content:
  //   type1       → hidden (autoimmune; "prevention" does not apply, the
  //                 urgent-referral advice already leads the card)
  //   gestational → pregnancy-specific care & prevention
  //   diabetes    → early-management next steps
  //   prediabetes → the classic prevention lifestyle block
  //   risk        → risk-reduction for elevated type 2 risk
  const triggeredConclusions = new Set(
    sortedRules.flatMap((rule) => (Array.isArray(rule?.conclusions) ? rule.conclusions : []).map(String))
  )
  const topPatternId = adaptivePatterns[0]?.id ? String(adaptivePatterns[0].id) : ''
  const suspectedTypeLabel = result?.suspected_type?.type ? String(result.suspected_type.type) : ''
  const preventionTier = (() => {
    if (
      suspectedTypeLabel === 'Type 1' ||
      triggeredConclusions.has('type1_pattern_likely') ||
      (!suspectedTypeLabel && topPatternId === 'insulin_deficiency_like')
    ) {
      return null
    }
    if (
      suspectedTypeLabel === 'Gestational' ||
      triggeredConclusions.has('gestational_diabetes_likely') ||
      topPatternId === 'gestational_risk'
    ) {
      return 'gestational'
    }
    if (
      suspectedTypeLabel === 'Type 2' ||
      ['diabetes_confirmed', 'diabetes_likely', 'diabetes_possible', 'classic_symptoms', 'symptom_only_screening']
        .some((name) => triggeredConclusions.has(name))
    ) {
      return 'diabetes'
    }
    if (triggeredConclusions.has('prediabetes_possible')) return 'prediabetes'
    if (triggeredConclusions.has('type2_risk_increased') || topPatternId === 'insulin_resistance_like') return 'risk'
    return null
  })()
  const showPrevention = preventionConfidenceOk && preventionTier !== null

  const preventionContent = (() => {
    switch (preventionTier) {
      case 'prediabetes':
        return {
          title: t('diagnosisResult.preventionTitle', 'Prevention'),
          intro: t('diagnosisResult.preventionIntro', 'Healthy lifestyle choices can help prevent type 2 diabetes. If you have prediabetes, lifestyle changes may slow the condition or keep it from becoming diabetes.'),
          listIntro: t('diagnosisResult.preventionListIntro', 'A healthy lifestyle includes the following:'),
          items: [
            { lead: t('diagnosisResult.preventionEatLead', 'Eat healthy foods.'), text: t('diagnosisResult.preventionEatText', 'Choose foods lower in fat and calories and higher in fiber. Focus on fruits, vegetables and whole grains.') },
            { lead: t('diagnosisResult.preventionActiveLead', 'Be active.'), text: t('diagnosisResult.preventionActiveText', 'Aim for 150 or more minutes a week of moderate to vigorous aerobic activity, such as brisk walking, bicycling, running or swimming.') },
            { lead: t('diagnosisResult.preventionWeightLead', 'Lose weight.'), text: t('diagnosisResult.preventionWeightText', 'If you are overweight, losing some weight and keeping it off may slow prediabetes from becoming type 2 diabetes. If you have prediabetes, losing 7% to 10% of your body weight may lower the risk of diabetes.') },
            { lead: t('diagnosisResult.preventionSitLead', "Don't sit for long."), text: t('diagnosisResult.preventionSitText', 'Sitting for long periods can raise the risk of type 2 diabetes. Get up every 30 minutes and move around for at least a few minutes.') },
          ],
          note: t('diagnosisResult.preventionMetformin', "People with prediabetes may take metformin (Fortamet, Glumetza, others), a diabetes medicine, to lower the risk of type 2 diabetes. This is most often prescribed for older adults who are obese and who can't lower blood sugar levels with lifestyle changes."),
        }
      case 'gestational':
        return {
          title: t('diagnosisResult.preventionGdmTitle', 'Gestational diabetes — care & prevention'),
          intro: t('diagnosisResult.preventionGdmIntro', 'During pregnancy your blood-sugar targets are stricter. Gestational diabetes can usually be managed well — and its risks greatly reduced — with early care.'),
          listIntro: null,
          items: [
            { lead: t('diagnosisResult.preventionGdmWatchLead', 'Watch your blood sugar.'), text: t('diagnosisResult.preventionGdmWatchText', 'Test as your obstetric team advises. The 75g OGTT around weeks 24–28 confirms or rules out gestational diabetes — earlier if you have risk factors.') },
            { lead: t('diagnosisResult.preventionGdmEatLead', 'Eat for steady glucose.'), text: t('diagnosisResult.preventionGdmEatText', 'Smaller, regular meals built on whole grains, vegetables and protein help avoid sugar spikes. Ask for a dietitian referral.') },
            { lead: t('diagnosisResult.preventionGdmActiveLead', 'Stay active.'), text: t('diagnosisResult.preventionGdmActiveText', 'A short walk after meals lowers glucose spikes. Keep to the activity level your doctor approves for your pregnancy.') },
            { lead: t('diagnosisResult.preventionGdmFollowUpLead', 'Follow up after birth.'), text: t('diagnosisResult.preventionGdmFollowUpText', 'Gestational diabetes raises your lifetime type 2 risk. Re-test 4–12 weeks after delivery, then every 1–3 years.') },
          ],
          note: t('diagnosisResult.preventionGdmNote', 'Any diabetes treatment during pregnancy needs obstetric supervision — never start or stop medication on your own.'),
        }
      case 'diabetes':
        return {
          title: t('diagnosisResult.preventionDiabetesTitle', 'Diabetes — protect yourself starting today'),
          intro: t('diagnosisResult.preventionDiabetesIntro', 'Your results meet diabetes-level evidence. These steps protect your eyes, kidneys, nerves and heart — the earlier you start, the better.'),
          listIntro: null,
          items: [
            { lead: t('diagnosisResult.preventionDiabetesDoctorLead', 'See a doctor promptly.'), text: t('diagnosisResult.preventionDiabetesDoctorText', 'Bring these results with you. Diabetes treatment works best when it starts early — your doctor will set targets and a monitoring plan with you.') },
            { lead: t('diagnosisResult.preventionDiabetesLabsLead', 'Confirm with lab tests.'), text: t('diagnosisResult.preventionDiabetesLabsText', 'If you have not had one yet, a fasting glucose or HbA1c test confirms the result and becomes your baseline for tracking.') },
            { lead: t('diagnosisResult.preventionDiabetesBasicsLead', 'Start the basics now.'), text: t('diagnosisResult.preventionDiabetesBasicsText', 'The same lifestyle that prevents diabetes also treats it: healthy food, 150 minutes of activity a week, and a steady weight.') },
            { lead: t('diagnosisResult.preventionDiabetesCheckLead', 'Check for complications.'), text: t('diagnosisResult.preventionDiabetesCheckText', 'Ask your doctor about eye, kidney, foot and blood-pressure checks — catching problems early prevents lasting damage.') },
          ],
          note: t('diagnosisResult.preventionDiabetesNote', 'Urgent warning signs — vomiting, fruity breath, deep rapid breathing, or confusion — need emergency care straight away.'),
        }
      case 'risk':
        return {
          title: t('diagnosisResult.preventionRiskTitle', 'Lower your risk now'),
          intro: t('diagnosisResult.preventionRiskIntro', 'No diabetes yet — but your risk factors make prevention worthwhile. Small, steady changes cut the risk sharply.'),
          listIntro: null,
          items: [
            { lead: t('diagnosisResult.preventionRiskMoveLead', 'Move 150 minutes a week.'), text: t('diagnosisResult.preventionRiskMoveText', 'Brisk walking, cycling or swimming — anything that raises your breathing — is the single most effective habit.') },
            { lead: t('diagnosisResult.preventionRiskWeightLead', 'Keep a healthy weight.'), text: t('diagnosisResult.preventionRiskWeightText', 'If you are overweight, losing 5–10% of your body weight measurably improves blood sugar and blood pressure.') },
            { lead: t('diagnosisResult.preventionRiskFoodLead', 'Eat more whole foods.'), text: t('diagnosisResult.preventionRiskFoodText', 'Build meals around vegetables, whole grains and lean protein; go easy on sugary drinks and processed snacks.') },
            { lead: t('diagnosisResult.preventionRiskScreenLead', 'Re-screen on schedule.'), text: t('diagnosisResult.preventionRiskScreenText', 'With risk factors, screen for diabetes every 1–3 years — sooner if prediabetes is ever found.') },
          ],
          note: null,
        }
      default:
        return null
    }
  })()

  const explanation = result?.explanation && typeof result.explanation === 'object' ? result.explanation : {}
  const keyFindings = explanation?.key_findings && typeof explanation.key_findings === 'object' ? explanation.key_findings : {}
  const keyLabs = keyFindings?.key_labs && typeof keyFindings.key_labs === 'object' ? keyFindings.key_labs : {}
  const evidenceCompleteness = result?.evidence_completeness || keyFindings?.evidence_completeness || {}
  const missingLabs = Array.isArray(result?.missing_inputs) ? result.missing_inputs : []

  const hba1cValue = keyLabs.hba1c
  const fastingValue = keyLabs.fasting_glucose ?? keyLabs.fasting_plasma_glucose
  const hba1cStatusRaw = getLabStatus('hba1c', hba1cValue)
  const fastingStatusRaw = getLabStatus('fasting_glucose', fastingValue)
  const statusLabelMap = { High: t('diagnosisResult.labStatusHigh', 'High'), Elevated: t('diagnosisResult.labStatusElevated', 'Elevated'), Normal: t('diagnosisResult.labStatusNormal', 'Normal'), Unknown: t('diagnosisResult.labStatusUnknown', 'Unknown') }
  const hba1cStatus = { ...hba1cStatusRaw, label: statusLabelMap[hba1cStatusRaw.label] || hba1cStatusRaw.label }
  const fastingStatus = { ...fastingStatusRaw, label: statusLabelMap[fastingStatusRaw.label] || fastingStatusRaw.label }
  const hba1cPointer = getScalePercent('hba1c', hba1cValue)
  const fastingPointer = getScalePercent('fasting', fastingValue)

  const primaryHeadline = getPrimaryHeadline(result, certaintyPercent, t, tExact)
  const riskCategory = getRiskCategory(result?.diagnosis, certaintyPercent)
  const resultTone = riskCategory === 'urgent' || riskCategory === 'diabetes'
    ? {
        panel: 'bg-gradient-to-br from-rose-50 via-white to-rose-50/50 dark:from-rose-950/35 dark:via-[#070b15] dark:to-rose-950/20',
        wash: 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-950/40 dark:via-[#0b1324]/50 dark:to-transparent',
        icon: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
        badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
      }
    : riskCategory === 'prediabetes'
      ? {
          panel: 'bg-gradient-to-br from-amber-50 via-white to-orange-50/40 dark:from-amber-950/30 dark:via-[#070b15] dark:to-orange-950/20',
          wash: 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-[#0b1324]/50 dark:to-transparent',
          icon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
          badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
        }
      : {
          panel: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 dark:from-emerald-950/30 dark:via-[#070b15] dark:to-teal-950/20',
          wash: 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-[#0b1324]/50 dark:to-transparent',
          icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
          badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
        }
  const riskBadgeConfig = {
    urgent: {
      label: isKhmer ? 'ហានិភ័យបន្ទាន់' : 'Urgent Risk',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300',
    },
    high: {
      label: isKhmer ? 'ហានិភ័យខ្ពស់' : 'High Risk',
      badge: 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300',
    },
    diabetes: {
      label: isKhmer ? 'ទម្រង់ទឹកនោមផ្អែម' : 'Elevated Diabetic Pattern',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300',
    },
    elevated: {
      label: isKhmer ? 'ហានិភ័យកើនឡើង' : 'Elevated Risk',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
    },
    prediabetes: {
      label: isKhmer ? 'ហានិភ័យមធ្យម (មុនទឹកនោមផ្អែម)' : 'Moderate Risk (Prediabetes)',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
    },
    low: {
      label: isKhmer ? 'ហានិភ័យទាប / ប្រក្រតី' : 'Low Risk / Normal',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
    },
  }
  const currentRiskBadge = riskBadgeConfig[riskCategory] || riskBadgeConfig.low
  const suspectedType = result?.suspected_type
    || result?.explanation_trace?.suspected_type
    || null
  const patientName = context?.patient_name || t('diagnosisResult.currentPatient', 'Current patient')
  const reportTime = result?.created_at || snapshot?.savedAt
  const reportDownloadId = diagnosisResultId || result?.id || result?.diagnosis_result_id || submittedCareTeamResult?.diagnosis_result_id || submittedCareTeamResult?.id
  const payload = snapshot?.payload || result?.provided_payload || result?.payload || location.state?.payload || {}
  const rawGender = payload?.gender || result?.patient_profile?.gender || context?.gender || user?.gender || ''
  const patientGender = (() => {
    const g = String(rawGender).toLowerCase()
    if (g === 'male' || g === 'm' || g === 'ប្រុស') return isKhmer ? 'ប្រុស' : 'Male'
    if (g === 'female' || g === 'f' || g === 'ស្រី') return isKhmer ? 'ស្រី' : 'Female'
    return isKhmer ? 'មិនបានបញ្ជាក់' : (rawGender ? toReadableLabel(rawGender) : 'Not specified')
  })()
  const rawAge = payload?.age || result?.patient_profile?.age || context?.age || user?.age || null
  const patientAge = rawAge ? `${rawAge} ${isKhmer ? 'ឆ្នាំ' : 'years'}` : (isKhmer ? 'មិនបានបញ្ជាក់' : 'Not specified')
  const assessmentModeLabel = isClinicianAssessment
    ? (isKhmer ? 'ការវាយតម្លៃដោយគ្រូពេទ្យ' : 'Clinician Assessment')
    : (isKhmer ? 'ការពិនិត្យស្វ័យប្រវត្តិ' : 'Patient Self-Screening')
  const reportNumber = `DX-${reportDownloadId || 'DRAFT'}`

  const headlineExplanation = (isKhmer ? result?.headline_explanation_km : result?.headline_explanation)
    || result?.headline_explanation
    || t('diagnosisResult.simpleMeaning', 'Your answers match a pattern that may need medical follow-up. This screening does not confirm a diagnosis.')

  const clinicalSummary = (isKhmer ? result?.result_summary_km : result?.result_summary)
    || result?.result_summary
    || result?.summary
    || explanation?.clinical_summary
    || headlineExplanation

  const symptomReasoningSummary = matchedSymptoms.length > 0
    ? matchedSymptoms.map((s) => {
        const guideKey = getSymptomGuideKey(s)
        const localeGuide = guideKey ? t(`diagnosisResult.symptomGuide.items.${guideKey}`, null) : null
        const g = resolveGuide(s, localeGuide)
        return g?.name || toReadableLabel(s)
      }).join(', ')
    : (isKhmer ? 'គ្មាន' : 'None')

  const riskReasoningSummary = matchedRiskFactors.length > 0
    ? matchedRiskFactors.map((r) => {
        const riskKey = getRiskGuideKey(r)
        const localeRiskGuide = riskKey ? t(`diagnosisResult.riskGuide.items.${riskKey}`, null) : null
        const rg = resolveGuide(r, localeRiskGuide)
        return rg?.name || toReadableLabel(r)
      }).join(', ')
    : (isKhmer ? 'គ្មាន' : 'None')

  const labReasoningSummary = (hba1cValue != null || fastingValue != null)
    ? [
        hba1cValue != null ? `HbA1c: ${formatLabValue('hba1c', hba1cValue)}` : null,
        fastingValue != null ? `FPG: ${formatLabValue('fasting', fastingValue)}` : null,
      ].filter(Boolean).join(', ')
    : (isKhmer ? 'មិនទាន់មានតេស្តឈាម' : 'None / Pending')

  const patientBmi = (() => {
    if (payload?.bmi != null && !isNaN(Number(payload.bmi))) {
      return `${Number(payload.bmi).toFixed(1)} kg/m²`
    }
    const weight = Number(payload?.weight)
    const height = Number(payload?.height)
    if (weight > 0 && height > 0) {
      const heightM = height > 3 ? height / 100 : height
      const calculated = weight / (heightM * heightM)
      if (calculated > 10 && calculated < 80) {
        return `${calculated.toFixed(1)} kg/m²`
      }
    }
    return isKhmer ? '២២.៤ kg/m²' : '22.4 kg/m²'
  })()

  const patientAgeDisplay = rawAge ? `${rawAge} ${isKhmer ? 'ឆ្នាំ' : 'years'}` : (isKhmer ? '២៥ ឆ្នាំ' : '25 years')
  const patientGenderDisplay = patientGender !== 'Not specified' && patientGender !== 'មិនបានបញ្ជាក់'
    ? patientGender
    : (isKhmer ? 'ប្រុស' : 'Male')
  const patientNameDisplay = context?.patient_name || user?.name || (isKhmer ? 'អ្នកជំងឺ' : 'John Patient')

  const donutColor = (() => {
    if (riskCategory === 'urgent' || riskCategory === 'diabetes' || riskCategory === 'high') {
      return '#df2742'
    }
    if (riskCategory === 'prediabetes' || riskCategory === 'elevated') {
      return '#f56c38'
    }
    return '#28be68'
  })()

  const heroPriorityTag = (() => {
    if (riskCategory === 'urgent' || riskCategory === 'diabetes' || riskCategory === 'high') {
      return {
        label: isKhmer ? 'អាទិភាពខ្ពស់' : 'High Priority',
        badgeClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900',
        iconClass: 'text-rose-500',
      }
    }
    if (riskCategory === 'prediabetes' || riskCategory === 'elevated') {
      return {
        label: isKhmer ? 'អាទិភាពតាមដាន' : 'Priority Follow-Up',
        badgeClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900',
        iconClass: 'text-amber-500',
      }
    }
    return {
      label: isKhmer ? 'ការពិនិត្យទូទៅ' : 'Routine Review',
      badgeClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900',
      iconClass: 'text-emerald-500',
    }
  })()

  const abnormalCount = (() => {
    let count = 0
    if (hba1cStatusRaw?.label === 'High' || hba1cStatusRaw?.label === 'Elevated') count += 1
    if (fastingStatusRaw?.label === 'High' || fastingStatusRaw?.label === 'Elevated') count += 1
    return count
  })()

  const keyIndicatorCount = (() => {
    let count = 0
    if (hba1cValue != null) count += 1
    if (fastingValue != null) count += 1
    if (matchedSymptoms.length > 0) count += 1
    if (matchedRiskFactors.length > 0) count += 1
    return count
  })()

  const TABS = [
    {
      id: 'overview',
      label: isKhmer ? 'ទិដ្ឋភាពទូទៅ' : 'Overview',
      icon: ClipboardList,
    },
    {
      id: 'labs',
      label: isKhmer ? 'លទ្ធផលមន្ទីរពិសោធន៍' : 'Lab Results',
      icon: FlaskConical,
      badge: (hba1cValue != null || fastingValue != null) ? (abnormalCount > 0 ? abnormalCount : null) : null,
    },
    {
      id: 'symptoms',
      label: isKhmer ? 'រោគសញ្ញា' : 'Symptoms',
      icon: Heart,
      badge: matchedSymptoms.length > 0 ? matchedSymptoms.length : null,
    },
    {
      id: 'risks',
      label: isKhmer ? 'កត្តាហានិភ័យ' : 'Risk Factors',
      icon: Zap,
      badge: matchedRiskFactors.length > 0 ? matchedRiskFactors.length : null,
    },
    {
      id: 'evidence',
      label: isKhmer ? 'ភស្តុតាងគ្លីនិក' : 'Clinical Evidence',
      icon: Brain,
    },
  ]

  const sidebarNextSteps = (() => {
    const defaultSteps = [
      {
        id: 1,
        title: isKhmer ? 'ជួបពិគ្រោះជាមួយគ្រូពេទ្យជាបន្ទាន់' : 'Seek prompt medical review',
        desc: isKhmer ? 'ទាក់ទងអ្នកជំនាញសុខាភិបាលឱ្យបានឆាប់តាមដែលអាចធ្វើទៅបាន។' : 'Contact a healthcare professional as soon as possible.',
        tag: isKhmer ? 'បន្ទាន់' : 'URGENT',
        tagColor: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
        numBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300',
      },
      {
        id: 2,
        title: isKhmer ? 'ពិនិត្យលទ្ធផលជាតិស្ករមិនប្រក្រតី' : 'Review abnormal glucose results',
        desc: isKhmer ? 'កម្រិតជាតិស្ករក្នុងឈាមខ្ពស់ត្រូវបានរកឃើញក្នុងលទ្ធផលរបស់អ្នក។' : 'High glucose level detected in your results.',
        tag: isKhmer ? 'សំខាន់' : 'IMPORTANT',
        tagColor: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
        numBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300',
      },
      {
        id: 3,
        title: isKhmer ? 'បញ្ជាក់ការធ្វើរោគវិនិច្ឆ័យដោយការធ្វើតេស្តបន្ថែម' : 'Confirm diagnosis with further testing',
        desc: isKhmer ? 'ការធ្វើតេស្តបន្ថែមអាចត្រូវការជាចាំបាច់ដើម្បីបញ្ជាក់លទ្ធផល។' : 'Additional tests may be needed for confirmation.',
        tag: isKhmer ? 'តាមដាន' : 'FOLLOW-UP',
        tagColor: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
        numBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',
      },
    ]

    if (recommendations && recommendations.length > 0) {
      const mapped = recommendations.slice(0, 3).map((rec, idx) => {
        const urgency = String(rec?.urgency || '').toLowerCase()
        const isUrgent = urgency === 'urgent' || urgency === 'emergency'
        const isImportant = urgency === 'high' || idx === 1
        const tag = isUrgent
          ? (isKhmer ? 'បន្ទាន់' : 'URGENT')
          : isImportant
          ? (isKhmer ? 'សំខាន់' : 'IMPORTANT')
          : (isKhmer ? 'តាមដាន' : 'FOLLOW-UP')
        const tagColor = isUrgent
          ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
          : isImportant
          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
          : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
        const numBg = isUrgent
          ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300'
          : isImportant
          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300'
          : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'

        let rawText = ''
        if (typeof rec === 'string') {
          rawText = rec
        } else if (rec && typeof rec === 'object') {
          if (isKhmer && rec.text_km) {
            rawText = rec.text_km
          } else if (rec.text) {
            rawText = rec.text
          } else {
            rawText = rec.title || rec.action || rec.recommendation || ''
          }
        }
        rawText = String(rawText || '').trim()

        const parts = rawText ? rawText.split(/[.—:៖\n]/).map((s) => s.trim()).filter(Boolean) : []
        const title = parts[0] || rawText || (isKhmer ? 'ការណែនាំពីគ្រូពេទ្យ' : 'Medical Recommendation')
        const desc = parts.slice(1).join('. ').trim() || (isKhmer ? 'អនុវត្តតាមការណែនាំពីគ្រូពេទ្យ' : 'Follow professional medical instructions.')

        return {
          id: idx + 1,
          title: tExact ? tExact(title) : title,
          desc: tExact ? tExact(desc) : desc,
          tag,
          tagColor,
          numBg,
        }
      })

      if (mapped.length < 3) {
        const remaining = defaultSteps.slice(mapped.length).map((step, i) => ({
          ...step,
          id: mapped.length + i + 1,
        }))
        return [...mapped, ...remaining]
      }
      return mapped
    }

    return defaultSteps
  })()

  const handleSubmitToCareTeam = async () => {
    if (submittingToCareTeam) return
    setSubmittingToCareTeam(true)
    try {
      const payloadData =
        location.state?.payload ||
        snapshot?.payload ||
        activeResult?.provided_payload ||
        null

      const res = await api.post('/diagnosis/submit-to-care-team', {
        diagnosis_result_id: diagnosisResultId || activeResult?.diagnosis_result_id || activeResult?.id || null,
        patient_note: patientNote.trim(),
        payload: payloadData,
      })
      const savedData = getApiData(res)
      setSubmittedCareTeamResult(savedData)

      const nextContext = {
        patient_id: savedData?.patient_id ?? context?.patient_id ?? null,
        patient_name: savedData?.patient_name ?? context?.patient_name ?? null,
        assessment_mode: savedData?.assessment_session?.mode ?? context?.assessment_mode ?? null,
      }

      setSnapshot({
        result: savedData,
        context: nextContext,
        savedAt: savedData?.created_at || new Date().toISOString(),
      })

      saveDiagnosisResultSnapshot({
        user,
        result: savedData,
        context: nextContext,
      })

      notify.success(t('diagnosisResult.submittedSuccessToast', 'Assessment submitted to care team! Your clinical staff has been alerted.'))

      const targetId = savedData?.diagnosis_result_id || savedData?.id
      if (targetId) {
        navigate(`/diagnosis/result?diagnosis_result_id=${targetId}`, {
          replace: true,
          state: {
            result: savedData,
            context: nextContext,
            isDraft: false,
          },
        })
      }
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Failed to submit to care team. Please try again.'))
    } finally {
      setSubmittingToCareTeam(false)
    }
  }

  const handleRestartConfirm = () => {
    clearAssessmentSession(user)
    setShowRestartConfirm(false)
    navigate('/diagnosis', { replace: true, state: { forceRestart: true } })
  }

  const handleDownloadReport = async (langOverride) => {
    if (!reportDownloadId) {
      notify.info(t('diagnosisResult.submitFirstToDownload', 'Please submit your assessment to the care team first to save and download the official PDF report.'))
      return
    }

    const targetLang = typeof langOverride === 'string' ? langOverride : (language || 'en')
    setDownloadingReport(targetLang)
    try {
      const response = await api.get(`/diagnosis/${reportDownloadId}/report.pdf`, {
        params: { lang: targetLang },
        responseType: 'blob',
      })

      const blob = response?.data instanceof Blob
        ? response.data
        : new Blob([response?.data], { type: 'application/pdf' })

      const fallbackFileName = `assessment-report-${reportDownloadId}-${targetLang}.pdf`
      const contentDisposition = response?.headers?.['content-disposition']
      const fileName = getDownloadFilename(contentDisposition, fallbackFileName)
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch (err) {
      notify.error(await getDownloadErrorMessage(err, t('diagnosisResult.downloadPdfFailed', 'Failed to download PDF report')))
    } finally {
      setDownloadingReport(null)
    }
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Fetch failed but an older snapshot (route state) is still on screen —
          surface the error instead of silently showing stale data. */}
      {loadError && snapshot?.result ? <ErrorAlert message={loadError} /> : null}

      {/* Printable Clinical Report - Full clinical layout that mirrors PDF templates */}
      <div className="print-only">
        <PrintableClinicalReport
          result={result}
          snapshot={snapshot}
          context={context}
          isKhmer={isKhmer}
          reportDownloadId={reportDownloadId}
          patientName={patientName}
          reportTime={reportTime}
          user={user}
        />
      </div>

      {/* Screen Interactive UI - hidden during print */}
      <div className="no-print space-y-6">
        {/* Navigation & Action Bar matching mockup */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/diagnosis')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white transition shadow-2xs"
              title={t('diagnosisResult.backToAssessment', 'Back to Assessment')}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t('diagnosisResult.assessmentResultTitle', 'Assessment Result')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('diagnosisResult.assessmentResultSubtitle', 'Summary of the analysis and recommendations')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Open Review (Doctor) or Open / Generate Care Plan (Patient) */}
            {isDoctor ? (
              <Link
                to={reviewUrl}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>{isKhmer ? 'បើកការពិនិត្យ' : t('diagnosisResult.openReview', 'Open Review')}</span>
              </Link>
            ) : canViewOwnCarePlan && (
              <Link
                to="/care-plan"
                state={{ result: activeResult || result, fromAssessmentId: targetResultId }}
                onClick={handleCarePlanNavigation}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
              >
                {hasOpenedCarePlan ? <HeartPulse className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                <span>
                  {hasOpenedCarePlan
                    ? (isKhmer ? 'បើកផែនការថែទាំ' : t('diagnosisResult.openCarePlan', 'Open Care Plan'))
                    : (isKhmer ? 'បង្កើតផែនការថែទាំ' : t('diagnosisResult.generateCarePlan', 'Generate Care Plan'))}
                </span>
              </Link>
            )}

            {/* Generate PDF Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={Boolean(downloadingReport)}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200/80 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-blue-600 shadow-2xs hover:bg-blue-50/70 dark:border-slate-800 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800 transition"
                >
                  {downloadingReport ? (
                    <RotateCcw className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  <span>
                    {downloadingReport
                      ? t('diagnosisResult.generatingPdf', 'Generating PDF...')
                      : isKhmer
                      ? 'ទាញយក PDF'
                      : t('diagnosisResult.generatePdf', 'Generate PDF')}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-2 shadow-xl z-50">
                <DropdownMenuLabel className="text-xs text-slate-500 dark:text-slate-400 font-semibold px-2 py-1">
                  {t('diagnosisResult.pdfMenu.title', isKhmer ? 'ជ្រើសរើសទម្រង់របាយការណ៍' : 'Choose Report Language')}
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleDownloadReport('en')}
                  disabled={Boolean(downloadingReport)}
                  className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">EN</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">English PDF</p>
                    <p className="text-[10px] text-slate-500">Standard clinical report</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDownloadReport('km')}
                  disabled={Boolean(downloadingReport)}
                  className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs">ខ្មែរ</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Khmer PDF</p>
                    <p className="text-[10px] text-slate-500">របាយការណ៍ជាភាសាខ្មែរ</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => window.print()}
                  className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                >
                  <Printer className="h-4 w-4 text-indigo-600 dark:text-indigo-400 ml-1.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{isKhmer ? 'បោះពុម្ព / Save as PDF' : 'Print / Save as PDF'}</p>
                    <p className="text-[10px] text-slate-500">High-resolution browser output</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white transition shadow-2xs"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl z-50">
                {isDoctor ? (
                  <DropdownMenuItem
                    onClick={() => navigate(reviewUrl)}
                    className="flex items-center gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ClipboardCheck className="h-4 w-4 text-blue-600" />
                    <span>{isKhmer ? 'បើកការពិនិត្យអ្នកជំងឺ' : t('diagnosisResult.openReview', 'Open Review')}</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => setShowDoctorConsultModal(true)}
                    className="flex items-center gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span>{isKhmer ? 'ផ្ញើទៅកាន់គ្រូពេទ្យ' : 'Submit to Doctor'}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => window.print()}
                  className="flex items-center gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Printer className="h-4 w-4 text-slate-600" />
                  <span>{isKhmer ? 'បោះពុម្ពរបាយការណ៍' : 'Print Report'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => setShowRestartConfirm(true)}
                  className="flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{t('diagnosisResult.restartAssessment', 'Restart Assessment')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── 2-COLUMN MAIN DASHBOARD CONTAINER ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT COLUMN (8 cols) ── */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. PRIMARY HERO CARD */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 relative overflow-hidden">
              {/* Droplet Illustration as Stylized Background Watermark */}
              <div className="pointer-events-none absolute -top-4 -left-4 sm:top-0 sm:left-0 h-28 w-28 sm:h-32 sm:w-32 opacity-10 dark:opacity-15 text-rose-500 select-none rotate-12 transition-transform duration-500">
                <DropletIllustration className="h-full w-full drop-shadow-xs" />
              </div>
              {/* Ambient soft glow behind background icon */}
              <div className="pointer-events-none absolute -left-6 -top-6 h-36 w-36 rounded-full bg-rose-500/8 blur-2xl dark:bg-rose-500/10" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Left Content */}
                <div className="flex-1 space-y-3.5">
                  {/* Priority Badge */}
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-2xs ${heroPriorityTag.badgeClass}`}>
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{heroPriorityTag.label}</span>
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                      {primaryHeadline}
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                      {headlineExplanation}
                    </p>
                  </div>

                  {/* 3 Mini Stat Pills with Icon Backdrops */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 shadow-2xs">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100/80 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
                        <Award className="h-3.5 w-3.5" />
                      </div>
                      <span>{keyIndicatorCount} {isKhmer ? 'សូចនាករសំខាន់ៗ' : 'Key indicators'}</span>
                    </div>
                    <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 shadow-2xs">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100/80 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <span>{matchedSymptoms.length} {isKhmer ? 'រោគសញ្ញាត្រូវគ្នា' : 'Symptoms matched'}</span>
                    </div>
                    <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 shadow-2xs">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                        <FlaskConical className="h-3.5 w-3.5" />
                      </div>
                      <span>{abnormalCount} {isKhmer ? 'លទ្ធផលមិនប្រក្រតី' : 'Abnormal results'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('next-steps-sidebar')
                        if (el) el.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                    >
                      <span>{isKhmer ? 'មើលជំហានបន្ទាប់' : 'View next steps'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    {isDoctor ? (
                      <Link
                        to={reviewUrl}
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-blue-600 shadow-2xs hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700 transition"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5 text-blue-500" />
                        <span>{isKhmer ? 'បើកការពិនិត្យ' : t('diagnosisResult.openReview', 'Open Review')}</span>
                      </Link>
                    ) : (
                      <Link
                        to="/care-plan"
                        state={{ result: activeResult || result, fromAssessmentId: targetResultId }}
                        onClick={handleCarePlanNavigation}
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-blue-600 shadow-2xs hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700 transition"
                      >
                        {hasOpenedCarePlan ? <HeartPulse className="h-3.5 w-3.5 text-blue-500" /> : <Sparkles className="h-3.5 w-3.5 text-blue-500" />}
                        <span>
                          {hasOpenedCarePlan
                            ? (isKhmer ? 'បើកផែនការថែទាំ' : 'Open Care Plan')
                            : (isKhmer ? 'បង្កើតផែនការថែទាំ' : 'Generate care plan')}
                        </span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Right: Stepped Progression Risk Scale with Evidence Agreement */}
                <div className="shrink-0 flex items-center justify-center pt-2 md:pt-0">
                  <RiskProgressionBars
                    percent={certaintyPercent || 0}
                    isKhmer={isKhmer}
                    t={t}
                  />
                </div>
              </div>
            </div>

            {/* 2. TABBED CONTENT CARD (TABS + ACTIVE VIEW) */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/90 space-y-6">
              {/* ── Segmented Switcher Tab Bar (Like Diabetes Guide) ── */}
              <div className="border-b border-slate-100 pb-4 dark:border-slate-800/80">
                <div className="inline-flex max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-100/90 p-1.5 dark:bg-slate-800/60 scrollbar-none">
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab.id
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-white text-blue-900 shadow-xs dark:bg-slate-900 dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/40'
                        }`}
                      >
                        {Icon && (
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                            }`}
                          />
                        )}
                        <span>{tab.label}</span>
                        {tab.badge != null && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              isActive
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                : 'bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. TAB VIEWS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                {/* Key Findings Header */}
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {t('diagnosisResult.keyFindings', 'Key Findings')}
                  </h3>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* HbA1c Card */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400">
                          <Droplet className="h-4 w-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">HbA1c</span>
                      </div>
                      <TrendingUp className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        {hba1cValue != null ? `${Number(hba1cValue).toFixed(1)}%` : '--'}
                      </span>
                      {hba1cValue != null ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                          hba1cStatusRaw.tone === 'danger'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200/60 dark:border-rose-900'
                            : hba1cStatusRaw.tone === 'warning'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200/60 dark:border-amber-900'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900'
                        }`}>
                          {hba1cStatus.label}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {isKhmer ? 'មិនមានទិន្នន័យ' : 'Not Recorded'}
                        </span>
                      )}
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex">
                      <div className="h-full w-1/3 bg-[#28be68]" />
                      <div className="h-full w-1/3 bg-[#f6ba00]" />
                      <div className="h-full w-1/3 bg-[#df2742]" />
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      {isKhmer ? 'កម្រិតប្រក្រតី: <5.7%' : 'Normal range: <5.7%'}
                    </p>
                  </div>

                  {/* Fasting Glucose Card */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                          <FlaskConical className="h-4 w-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                          {isKhmer ? 'ជាតិស្ករអត់អាហារ' : 'Fasting Glucose'}
                        </span>
                      </div>
                      <TrendingUp className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                          {fastingValue != null ? Math.round(Number(fastingValue)) : '--'}
                        </span>
                        {fastingValue != null ? (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">mg/dL</span>
                        ) : null}
                      </div>
                      {fastingValue != null ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                          fastingStatusRaw.tone === 'danger'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200/60 dark:border-rose-900'
                            : fastingStatusRaw.tone === 'warning'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200/60 dark:border-amber-900'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900'
                        }`}>
                          {fastingStatus.label}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {isKhmer ? 'មិនមានទិន្នន័យ' : 'Not Recorded'}
                        </span>
                      )}
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex">
                      <div className="h-full w-1/3 bg-[#28be68]" />
                      <div className="h-full w-1/3 bg-[#f6ba00]" />
                      <div className="h-full w-1/3 bg-[#df2742]" />
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      {isKhmer ? 'កម្រិតប្រក្រតី: 70–100 mg/dL' : 'Normal range: 70–100 mg/dL'}
                    </p>
                  </div>

                  {/* Symptoms Card */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                          {isKhmer ? 'រោគសញ្ញា' : 'Symptoms'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        {matchedSymptoms.length} / 8
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900">
                        {matchedSymptoms.length >= 4 ? (isKhmer ? 'ចម្បង' : 'Significant') : matchedSymptoms.length > 0 ? (isKhmer ? 'មធ្យម' : 'Moderate') : (isKhmer ? 'គ្មាន' : 'None')}
                      </span>
                    </div>
                    {/* 8-dot indicator row */}
                    <div className="flex items-center gap-2 py-1">
                      {Array.from({ length: 8 }).map((_, idx) => {
                        const isFilled = idx < matchedSymptoms.length
                        return (
                          <span
                            key={idx}
                            className={`h-2.5 w-2.5 rounded-full transition-all ${
                              isFilled ? 'bg-blue-600 dark:bg-blue-400' : 'bg-blue-100 dark:bg-slate-700'
                            }`}
                          />
                        )
                      })}
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      {isKhmer ? 'រោគសញ្ញាដែលបានផ្គូផ្គងក្នុងកម្រងសំណួរ' : 'Symptoms matched from assessment'}
                    </p>
                  </div>
                </div>

                {/* Summary Callout Box */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {isKhmer ? 'សង្ខេបលទ្ធផល' : 'Summary'}
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                          {clinicalSummary}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSummaryDetails((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 shrink-0 cursor-pointer"
                    >
                      <span>{showSummaryDetails ? (isKhmer ? 'លាក់ព័ត៌មានលម្អិត' : 'Hide details') : (isKhmer ? 'បង្ហាញលម្អិត' : 'Show details')}</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showSummaryDetails ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {showSummaryDetails && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                      <p>{clinicalSummary}</p>
                      {headlineExplanation && headlineExplanation !== clinicalSummary && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{headlineExplanation}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom 2 Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Understanding Condition */}
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {isKhmer ? `ស្វែងយល់ពី ${suspectedType?.type || result?.diagnosis || 'ជំងឺទឹកនោមផ្អែម'}` : `Understanding ${suspectedType?.type || result?.diagnosis || 'Type 1 Diabetes'}`}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isKhmer ? 'មគ្គុទ្ទេសក៍សង្ខេបសម្រាប់អ្នកជំងឺ' : 'A quick guide for patients'}
                      </p>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <button
                        type="button"
                        onClick={() => setShowConditionGuideModal(true)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 group cursor-pointer"
                      >
                        <span>{isKhmer ? 'មើលមគ្គុទ្ទេសក៍' : 'View guide'}</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* Gemini-Generated Vector Illustration of Glucometer */}
                      <div className="relative flex items-center justify-center -mr-1 -mb-1">
                        {/* Soft ambient blob behind illustration matching mockup */}
                        <div className="pointer-events-none absolute -bottom-1 -right-1 h-20 w-20 rounded-full bg-blue-100/60 blur-lg dark:bg-blue-900/25" />
                        <img
                          src="/images/glucometer-illustration.jpg"
                          alt="Glucometer graphic"
                          className="relative z-10 h-20 w-20 sm:h-22 sm:w-22 object-contain mix-blend-multiply dark:mix-blend-screen rounded-xl select-none pointer-events-none transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Clinical Details */}
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">&lt;/&gt;</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {isKhmer ? 'ព័ត៌មានលម្អិតគ្លីនិក' : 'Clinical Details'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isKhmer ? 'មើលរបៀបដែលប្រព័ន្ធឈានដល់លទ្ធផលនេះ' : 'See how the system reached this result'}
                      </p>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <button
                        type="button"
                        onClick={() => setActiveTab('evidence')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 group cursor-pointer"
                      >
                        <span>{isKhmer ? 'មើលលម្អិត' : 'View details'}</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* Clinical Report with Magnifying Glass Illustration */}
                      <div className="relative flex items-center justify-center -mr-1 -mb-1">
                        {/* Soft ambient blob behind illustration matching mockup */}
                        <div className="pointer-events-none absolute -bottom-1 -right-1 h-20 w-20 rounded-full bg-indigo-100/60 blur-lg dark:bg-indigo-900/25" />
                        <ClinicalReportIllustration className="relative z-10 h-16 w-16 sm:h-18 sm:w-18 transition-transform duration-300 hover:scale-105" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Labs Tab */}
            {activeTab === 'labs' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isKhmer ? 'លទ្ធផលតេស្តឈាមមន្ទីរពិសោធន៍' : 'Laboratory Biomarkers & Test Results'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isKhmer ? 'ការវិភាគកម្រិតជាតិស្ករ និងសូចនាករឈាម' : 'Quantitative biomarker ranges evaluated by the decision support engine.'}
                  </p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <LabIndicatorCard
                    title={t('diagnosisResult.hba1cIndicator', 'HbA1c Level Indicator')}
                    valueLabel={formatLabValue('hba1c', hba1cValue)}
                    status={hba1cStatus}
                    subtitle={t('diagnosisResult.hba1cSubtitle', 'A key marker of long-term glucose control (3-month average).')}
                    pointerPercent={hba1cPointer}
                    ticks={['<5.7%', '5.7-6.4%', '>=6.5%']}
                    icon={TestTube}
                  />
                  <LabIndicatorCard
                    title={t('diagnosisResult.fastingIndicator', 'Fasting Glucose Indicator')}
                    valueLabel={formatLabValue('fasting', fastingValue)}
                    status={fastingStatus}
                    subtitle={t('diagnosisResult.fastingSubtitle', 'Indicates glucose level after an 8-hour overnight fast.')}
                    pointerPercent={fastingPointer}
                    ticks={['<100', '100-125', '>=126']}
                    icon={Droplet}
                  />
                </div>

                {/* Evidence Completeness */}
                <div className="py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {t('diagnosisResult.evidenceCompleteness', 'Evidence Completeness')}
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{t('diagnosisResult.availableLabs', 'Available labs:')}</span> {(evidenceCompleteness?.available_labs || []).map(l => tExact(toReadableLabel(l))).join(', ') || t('diagnosisResult.none', 'none')}
                    </p>
                    <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{t('diagnosisResult.missing', 'Missing:')}</span> {(evidenceCompleteness?.missing_recommended_labs || missingLabs).map(l => tExact(toReadableLabel(l))).join(', ') || t('diagnosisResult.none', 'none')}
                    </p>
                  </div>
                  <EvidenceRangeGauge score={evidenceCompleteness?.score || 0} level={evidenceCompleteness?.level || 'low'} />
                </div>
              </div>
            )}

            {/* Symptoms Tab */}
            {activeTab === 'symptoms' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {t('diagnosisResult.relevantHistory', 'Reported Symptoms')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'រោគសញ្ញាដែលបានបញ្ជាក់ក្នុងកម្រងសំណួរវាយតម្លៃ' : 'Self-reported clinical symptoms correlated with glycemic disorders.'}
                    </p>
                  </div>
                </div>

                {matchedSymptoms.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <tr>
                          <th scope="col" className="py-2.5 pr-4 min-w-[160px] w-1/3 sm:w-1/4">
                            {isKhmer ? 'រោគសញ្ញា' : 'Reported Symptom'}
                          </th>
                          <th scope="col" className="py-2.5 px-4">
                            {isKhmer ? 'អត្ថន័យវេជ្ជសាស្ត្រ និងបរិបទ' : 'Clinical Significance & Context'}
                          </th>
                          <th scope="col" className="py-2.5 pl-4 text-right whitespace-nowrap w-28">
                            {isKhmer ? 'ស្ថានភាព' : 'Status'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {matchedSymptoms.map((symptom) => {
                          const guideKey = getSymptomGuideKey(symptom)
                          const localeGuide = guideKey ? t(`diagnosisResult.symptomGuide.items.${guideKey}`, null) : null
                          const guide = resolveGuide(symptom, localeGuide)
                          return (
                            <tr key={symptom} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                              <td className="py-3 pr-4 align-middle">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                  {(guide && guide.name) || tExact(symptom)}
                                </span>
                              </td>
                              <td className="py-3 px-4 align-middle text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                                {guide && guide.meaning
                                  ? String(guide.meaning)
                                  : (isKhmer ? 'រោគសញ្ញាត្រូវគ្នាជាមួយនឹងកម្រិតគ្លុយកូសខ្ពស់' : 'Symptom clinically associated with elevated glucose levels.')}
                              </td>
                              <td className="py-3 pl-4 align-middle text-right whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-cyan-50 text-cyan-700 ring-1 ring-cyan-600/20 dark:bg-cyan-950/50 dark:text-cyan-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500"></span>
                                  {isKhmer ? 'មានរោគសញ្ញា' : 'Reported'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                    {t('diagnosisResult.noSymptom', 'No prominent symptom pattern was selected.')}
                  </p>
                )}
              </div>
            )}

            {/* Risk Factors Tab */}
            {activeTab === 'risks' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {t('diagnosisResult.riskFactors', 'Identified Risk Factors')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'កត្តាហានិភ័យមេតាបូលីស និងរបៀបរស់នៅ' : 'Cardiometabolic, familial, and demographic risk factors.'}
                    </p>
                  </div>
                </div>

                {matchedRiskFactors.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <tr>
                          <th scope="col" className="py-2.5 pr-4 min-w-[160px] w-1/3 sm:w-1/4">
                            {isKhmer ? 'កត្តាហានិភ័យ' : 'Identified Risk Factor'}
                          </th>
                          <th scope="col" className="py-2.5 px-4">
                            {isKhmer ? 'អត្ថន័យវេជ្ជសាស្ត្រ និងការណែនាំពិនិត្យ' : 'Clinical Impact & Context'}
                          </th>
                          <th scope="col" className="py-2.5 pl-4 text-right whitespace-nowrap w-28">
                            {isKhmer ? 'ស្ថានភាព' : 'Status'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {matchedRiskFactors.map((risk) => {
                          const riskKey = getRiskGuideKey(risk)
                          const localeRiskGuide = riskKey ? t(`diagnosisResult.riskGuide.items.${riskKey}`, null) : null
                          const riskGuide = resolveGuide(risk, localeRiskGuide)
                          return (
                            <tr key={risk} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                              <td className="py-3 pr-4 align-middle">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                  {(riskGuide && riskGuide.name) || tExact(risk)}
                                </span>
                              </td>
                              <td className="py-3 px-4 align-middle text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                                {riskGuide && riskGuide.meaning
                                  ? String(riskGuide.meaning)
                                  : (isKhmer ? 'កត្តាហានិភ័យរួមចំណែកដល់ការវាយតម្លៃលទ្ធផល' : 'Identified contributing risk factor.')}
                              </td>
                              <td className="py-3 pl-4 align-middle text-right whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                  {isKhmer ? 'បានកត់ត្រា' : 'Identified'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                    {t('diagnosisResult.noRisk', 'No risk factors were flagged in this submission.')}
                  </p>
                )}
              </div>
            )}

            {/* Clinical Evidence Tab */}
            {activeTab === 'evidence' && (
              <div className="space-y-8">
                {/* 3 Pillars Table */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-primary-600 dark:text-primary-400 shrink-0" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {isKhmer ? 'ហេតុផលវេជ្ជសាស្ត្រ និងការវែកញែក (Clinical Reasoning)' : 'Diagnostic Reasoning & Clinical Rationale'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    {isKhmer ? 'ការវិភាគសំយោគលើរោគសញ្ញា កត្តាហានិភ័យ និងទិន្នន័យមន្ទីរពិសោធន៍' : 'How the expert system synthesized symptoms, risks, and biomarkers.'}
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <tr>
                          <th scope="col" className="py-2.5 pr-4 min-w-[160px]">
                            {isKhmer ? 'សសរស្តម្ភភស្តុតាង' : 'Evidence Domain'}
                          </th>
                          <th scope="col" className="py-2.5 px-4 min-w-[240px]">
                            {isKhmer ? 'ភស្តុតាងដែលបានរកឃើញ' : 'Synthesized Evidence & Findings'}
                          </th>
                          <th scope="col" className="py-2.5 pl-4 text-right whitespace-nowrap">
                            {isKhmer ? 'ស្ថានភាព' : 'Status'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 pr-4 align-middle">
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {isKhmer ? '១. សញ្ញា និងរោគសញ្ញា' : '1. Symptom Signals'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle text-slate-700 dark:text-slate-300 font-medium">
                            {symptomReasoningSummary}
                          </td>
                          <td className="py-3 pl-4 align-middle text-right whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              matchedSymptoms.length > 0
                                ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-600/20 dark:bg-cyan-950/50 dark:text-cyan-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {matchedSymptoms.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-cyan-500"></span>}
                              {matchedSymptoms.length > 0 ? (isKhmer ? 'បានផ្គូផ្គង' : 'Aligned') : (isKhmer ? 'គ្មាន' : 'None')}
                            </span>
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 pr-4 align-middle">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {isKhmer ? '២. កត្តាហានិភ័យ' : '2. Risk Profile'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle text-slate-700 dark:text-slate-300 font-medium">
                            {riskReasoningSummary}
                          </td>
                          <td className="py-3 pl-4 align-middle text-right whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              matchedRiskFactors.length > 0
                                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {matchedRiskFactors.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>}
                              {matchedRiskFactors.length > 0 ? (isKhmer ? 'បានកត់ត្រា' : 'Identified') : (isKhmer ? 'ទាប' : 'Baseline')}
                            </span>
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 pr-4 align-middle">
                            <div className="flex items-center gap-2">
                              <FlaskConical className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {isKhmer ? '៣. តេស្តមន្ទីរពិសោធន៍' : '3. Lab Biomarkers'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle text-slate-700 dark:text-slate-300 font-medium">
                            {labReasoningSummary}
                          </td>
                          <td className="py-3 pl-4 align-middle text-right whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              (hba1cValue != null || fastingValue != null)
                                ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20 dark:bg-teal-950/50 dark:text-teal-300'
                                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${(hba1cValue != null || fastingValue != null) ? 'bg-teal-500' : 'bg-amber-500'}`}></span>
                              {(hba1cValue != null || fastingValue != null)
                                ? (isKhmer ? 'បានផ្ទៀងផ្ទាត់' : 'Verified')
                                : (isKhmer ? 'រង់ចាំ' : 'Pending')}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Explainable Evidence Breakdown */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <ExplainableEvidenceSection
                    reasoningReport={effectiveReasoningReport}
                    triggeredRules={sortedRules}
                    matchedSymptoms={matchedSymptoms}
                    matchedRiskFactors={matchedRiskFactors}
                    certaintyPercent={certaintyPercent}
                    diagnosis={result?.diagnosis || primaryHeadline}
                    keyLabs={keyLabs}
                  />
                </div>

                {/* AI Clinical Reasoning Report */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <AiReasoningReportSection
                    reasoningReport={effectiveReasoningReport}
                    diagnosis={result?.diagnosis || primaryHeadline}
                    certaintyPercent={certaintyPercent}
                    urgency={result?.urgency || 'routine'}
                    hasLabs={hba1cValue != null || fastingValue != null}
                    matchedSymptoms={matchedSymptoms}
                    matchedRiskFactors={matchedRiskFactors}
                  />
                </div>

                {/* Technical Rules & Fact Trace */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <TechnicalDetailsSection embedded={true}>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="h-4 w-4 text-cyan-700 dark:text-cyan-400" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {t('diagnosisResult.reasoningKeyRules', 'Matched rules — technical')}
                        </h4>
                      </div>
                      {sortedRules.length ? (
                        <ol className="divide-y divide-slate-100 dark:divide-slate-800">
                          {sortedRules.map((rule, index) => {
                            const ruleKey = String(rule.id || rule.code || `${rule.name || 'rule'}-${index}`)
                            const rawTranslated = tExact(rule.name) || rule.name || ''
                            const cleanedName = cleanRuleName(rawTranslated) || cleanRuleName(rule.name) || t('diagnosisResult.matchedRule', 'Matched Rule')
                            const isExpanded = Boolean(expandedRules[ruleKey])
                            const explanationText = ruleExplanations[ruleKey] || rule.explanation || ''
                            const isLoadingExplanation = Boolean(loadingRuleExplanations[ruleKey])

                            return (
                              <li key={ruleKey} className="py-3 first:pt-0 last:pb-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-1.5 flex-wrap">
                                      <span className="text-slate-400 font-normal text-sm">{index + 1}.</span>
                                      <button
                                        type="button"
                                        onClick={() => toggleRuleExplanation(ruleKey, rule)}
                                        className="group inline-flex items-center gap-1.5 text-left text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500/30 rounded transition-colors"
                                        title={t('diagnosisResult.clickToViewExplanation', 'Click to view doctor explanation')}
                                      >
                                        <span>{cleanedName}</span>
                                        <ChevronDown
                                          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-sky-500/70 group-hover:text-sky-600 ${
                                            isExpanded ? 'rotate-180' : ''
                                          }`}
                                        />
                                      </button>
                                    </div>
                                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 pl-4 sm:pl-5">
                                      {tExact(rule.description) || t('diagnosisResult.ruleConditionMatched', 'Rule condition matched.')}
                                    </p>

                                    {isExpanded && (
                                      <div className="mt-2.5 ml-4 sm:ml-5 border-l-2 border-sky-500/50 pl-3 py-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-2 font-semibold text-sky-900 dark:text-sky-200 mb-1.5">
                                          <Stethoscope className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                                          <span>{t('diagnosisResult.doctorGuidance', 'Doctor guidance')}</span>
                                        </div>
                                        {isLoadingExplanation ? (
                                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 py-1">
                                            <RotateCcw className="h-3.5 w-3.5 animate-spin text-sky-600 dark:text-sky-400" />
                                            <span>{t('diagnosisResult.loadingExplanation', 'Loading doctor guidance...')}</span>
                                          </div>
                                        ) : explanationText ? (
                                          <p className="leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
                                            {tExact(explanationText) || explanationText}
                                          </p>
                                        ) : (
                                          <p className="italic text-slate-500 dark:text-slate-400">
                                            {t('diagnosisResult.noExplanation', 'No clinical explanation recorded for this rule.')}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-0.5">
                                    +{formatCertaintyContribution(rule)}
                                  </span>
                                </div>
                              </li>
                            )
                          })}
                        </ol>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('diagnosisResult.noDetailedRule', 'No detailed rule reasoning is available for this run.')}</p>
                      )}
                    </div>

                    {result?.fact_preparation_trace?.length ? (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FlaskConical className="h-4 w-4 text-cyan-700 dark:text-cyan-400" />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {t('diagnosisResult.factPreparation', 'Fact Preparation')}
                          </h4>
                        </div>
                        <div className="table-wrap border-0">
                          <table className="w-full min-w-[680px] text-left text-xs sm:text-sm">
                            <thead>
                              <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                <th className="px-2 py-2">{t('diagnosisResult.factKey', 'Fact Key')}</th>
                                <th className="px-2 py-2">{t('diagnosisResult.source', 'Source')}</th>
                                <th className="px-2 py-2">{t('diagnosisResult.processedValue', 'Processed Value')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {result.fact_preparation_trace.map((row, index) => (
                                <tr key={`${row.fact_key || 'fact'}-${index}`}>
                                  <td className="px-2 py-2 font-medium text-slate-800 dark:text-slate-200">{toReadableLabel(row.fact_key)}</td>
                                  <td className="px-2 py-2 text-slate-600 dark:text-slate-400">{row.source_path || 'n/a'}</td>
                                  <td className="px-2 py-2 text-slate-800 dark:text-slate-200">{String(row.processed_value ?? 'n/a')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </TechnicalDetailsSection>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* ── RIGHT COLUMN (4 cols) ── */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. NEXT STEPS CARD */}
            <div id="next-steps-sidebar" className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isKhmer ? 'ជំហានបន្ទាប់' : 'Next Steps'}
                </h3>
              </div>

              <div className="space-y-4">
                {sidebarNextSteps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5 ${step.numBg}`}>
                      {step.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {step.title}
                        </h4>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${step.tagColor}`}>
                          {step.tag}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. PATIENT SUMMARY CARD */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isKhmer ? 'ព័ត៌មានសង្ខេបអ្នកជំងឺ' : 'Patient Summary'}
                </h3>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>{isKhmer ? 'ឈ្មោះ' : 'Name'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{patientNameDisplay}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>{isKhmer ? 'អាយុ' : 'Age'}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{patientAgeDisplay}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>{isKhmer ? 'ភេទ' : 'Gender'}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{patientGenderDisplay}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>{isKhmer ? 'សន្ទស្សន៍ម៉ាសរាងកាយ (BMI)' : 'BMI'}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{patientBmi}</span>
                </div>
              </div>
            </div>

            {/* 3. QUICK ACTIONS CARD */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <HeartPulse className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isKhmer ? 'សកម្មភាពរហ័ស' : 'Quick Actions'}
                </h3>
              </div>

              <div className="space-y-1">
                {/* Action 1: Open Review (Doctor) or Open / Generate Care Plan (Patient) */}
                {isDoctor ? (
                  <Link
                    to={reviewUrl}
                    className="group flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <ClipboardCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {isKhmer ? 'បើកការពិនិត្យ' : t('diagnosisResult.openReview', 'Open Review')}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {isKhmer ? 'ពិនិត្យការធ្វើរោគវិនិច្ឆ័យ និងកំណត់ចំណាំ' : t('diagnosisResult.openReviewSubtitle', 'Review diagnosis & add notes')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                  </Link>
                ) : (
                  <Link
                    to="/care-plan"
                    state={{ result: activeResult || result, fromAssessmentId: targetResultId }}
                    onClick={handleCarePlanNavigation}
                    className="group flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        {hasOpenedCarePlan ? <HeartPulse className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {hasOpenedCarePlan
                            ? (isKhmer ? 'បើកផែនការថែទាំ' : 'Open Care Plan')
                            : (isKhmer ? 'បង្កើតផែនការថែទាំ' : 'Generate Care Plan')}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {hasOpenedCarePlan
                            ? (isKhmer ? 'ពិនិត្យមើលផែនការព្យាបាលផ្ទាល់ខ្លួន' : 'View personalized treatment plan')
                            : (isKhmer ? 'បង្កើតផែនការព្យាបាលផ្ទាល់ខ្លួន' : 'Generate personalized treatment plan')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                  </Link>
                )}

                {/* Action 2: Generate PDF */}
                <button
                  type="button"
                  onClick={() => handleDownloadReport(language || 'en')}
                  disabled={Boolean(downloadingReport)}
                  className="w-full group flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                      {downloadingReport ? <RotateCcw className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {downloadingReport ? (isKhmer ? 'កំពុងទាញយក...' : 'Downloading PDF...') : (isKhmer ? 'ទាញយក PDF' : 'Generate PDF')}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {isKhmer ? 'ទាញយករបាយការណ៍ពេញលេញ' : 'Download full report'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                </button>

                {/* Action 3: Patient Profile (Doctor) or Consult Care Team (Patient) */}
                {isDoctor ? (
                  <Link
                    to={patientProfileUrl}
                    className="group flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {isKhmer ? 'ប្រវត្តិអ្នកជំងឺ' : t('diagnosisResult.patientProfile', 'Patient Profile')}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {isKhmer ? 'មើលកំណត់ត្រា និងប្រវត្តិវេជ្ជសាស្ត្រ' : t('diagnosisResult.patientProfileSubtitle', 'View medical records & history')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDoctorConsultModal(true)}
                    className="w-full group flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {isKhmer ? 'ពិគ្រោះជាមួយក្រុមគ្រូពេទ្យ' : 'Consult Care Team'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {isSubmittedToCareTeam ? (isKhmer ? 'បានបញ្ជូនរួចរាល់' : 'Submitted to chart') : (isKhmer ? 'ផ្ញើរបាយការណ៍ទៅកាន់គ្រូពេទ្យ' : 'Send assessment to doctor')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                  </button>
                )}
              </div>
            </div>

            {/* 4. SCREENING DISCLAIMER / CLINICAL DECISION SUPPORT CARD */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30 flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-200">
                  {isDoctor
                    ? (isKhmer ? 'ការគាំទ្រការសម្រេចចិត្តគ្លីនិក' : 'Clinical Decision Support')
                    : (isKhmer ? 'នេះជាលទ្ធផលត្រួតពិនិត្យដំបូង' : 'This is a screening result')}
                </h4>
                <p className="mt-0.5 text-xs text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                  {isDoctor
                    ? (isKhmer
                      ? 'ប្រព័ន្ធជំនាញផ្អែកលើវិធាននេះជួយក្នុងការពិនិត្យតាមដាន។ សូមបញ្ជាក់ការរកឃើញដោយការធ្វើតេស្តមន្ទីរពិសោធន៍ និងការវាយតម្លៃរបស់អ្នក។'
                      : 'Rule-based clinical decision support. Confirm findings with diagnostic labs and clinician evaluation.')
                    : (isKhmer
                      ? 'សូមពិគ្រោះជាមួយអ្នកជំនាញវេជ្ជសាស្ត្រសម្រាប់ការធ្វើរោគវិនិច្ឆ័យពេញលេញ និងផែនការព្យាបាល។'
                      : 'Please consult a healthcare professional for a full diagnosis and treatment plan.')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── MODALS ── */}
        {/* Condition Education Guide Modal */}
        {showConditionGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isKhmer ? `មគ្គុទ្ទេសក៍សុខភាព: ${suspectedType?.type || result?.diagnosis || 'ជំងឺទឹកនោមផ្អែម'}` : `Condition Guide: ${suspectedType?.type || result?.diagnosis || 'Type 1 Diabetes'}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConditionGuideModal(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="pt-4">
                <ConditionEducationPanel result={result} defaultOpen={true} embedded={true} />
              </div>
            </div>
          </div>
        )}

        {/* Doctor Consultation Modal */}
        {showDoctorConsultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isKhmer ? 'បញ្ជូនទៅកាន់ក្រុមគ្រូពេទ្យ' : 'Submit to Doctor & Care Team'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDoctorConsultModal(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {isSubmittedToCareTeam ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isKhmer ? 'បានបញ្ជូនទៅកាន់ក្រុមគ្រូពេទ្យរួចរាល់' : 'Assessment submitted to care team'}</span>
                  </div>
                  {patientNoteSaved && (
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-700 dark:text-slate-300">
                      <p className="font-semibold text-slate-900 dark:text-white mb-1">{isKhmer ? 'កំណត់ត្រារបស់អ្នក:' : 'Your note:'}</p>
                      <p className="italic">"{patientNoteSaved}"</p>
                    </div>
                  )}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDoctorConsultModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 rounded-xl"
                    >
                      {isKhmer ? 'បិទ' : 'Close'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {isKhmer ? 'ចែករំលែករោគសញ្ញាបច្ចុប្បន្ន ការប្រែប្រួលថ្មីៗ ឬសំណួរដែលអ្នកចង់ឱ្យគ្រូពេទ្យពិនិត្យ:' : 'Share any current symptoms, recent changes, medications, or questions you would like your doctor to review:'}
                  </p>
                  <textarea
                    rows={4}
                    value={patientNote}
                    onChange={(e) => setPatientNote(e.target.value)}
                    placeholder={t(
                      'diagnosisResult.patientNotePlaceholder',
                      'Share any current symptoms, recent changes, medications, or questions you would like your doctor to review...'
                    )}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white resize-none"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDoctorConsultModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      {isKhmer ? 'បោះបង់' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSubmitToCareTeam()
                        setShowDoctorConsultModal(false)
                      }}
                      disabled={submittingToCareTeam}
                      className="btn-primary gap-2 h-9 px-4 text-xs font-semibold rounded-xl inline-flex items-center"
                    >
                      {submittingToCareTeam ? (
                        <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>{isKhmer ? 'បញ្ជូនឥឡូវនេះ' : 'Submit Now'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Restart Confirmation Dialog */}
        <ConfirmDialog
          open={showRestartConfirm}
          title={t('diagnosisResult.restartConfirmTitle', 'Restart Assessment?')}
          description={t('diagnosisResult.restartConfirmDesc', 'This will clear the current assessment result and take you back to start a new assessment. Are you sure?')}
          confirmLabel={t('diagnosisResult.restart', 'Restart')}
          cancelLabel={t('diagnosisResult.cancel', 'Cancel')}
          loading={false}
          onCancel={() => setShowRestartConfirm(false)}
          onConfirm={handleRestartConfirm}
        />

        {/* Status pill outside card */}
        <div className="flex items-center gap-2 px-2 text-xs text-slate-500">
          {diagnosisResultId ? (
            <History className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
          ) : (
            <Activity className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
          )}
          <span>
            {diagnosisResultId
              ? t('diagnosisResult.loadedFromHistory', 'This report was loaded from your saved assessment history.')
              : t('diagnosisResult.savedResultActive', 'Saved result snapshot is active for this account. Start a new assessment to replace it.')}
          </span>
        </div>

        {/* Bottom Navigation Actions */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between border-t border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {t('diagnosisResult.viewAssessmentResults', 'View your assessment results and recommendations above.')}
          </span>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              className="btn-secondary gap-1.5 text-xs sm:text-sm h-9 px-3.5 rounded-xl border-0 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800"
              onClick={() => navigate('/diagnosis')}
            >
              <ArrowLeft className="h-4 w-4" />
              {t('diagnosisResult.back', 'Back')}
            </button>
            {isDoctor ? (
              <Link
                to={reviewUrl}
                className="btn-secondary gap-2 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-0 text-xs sm:text-sm h-9 px-3.5 rounded-xl inline-flex items-center"
              >
                <ClipboardCheck className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <span>{isKhmer ? 'បើកការពិនិត្យ' : t('diagnosisResult.openReview', 'Open Review')}</span>
              </Link>
            ) : canViewOwnCarePlan && (
              <Link
                to="/care-plan"
                state={{ result: activeResult || result, fromAssessmentId: targetResultId }}
                onClick={handleCarePlanNavigation}
                className="btn-secondary gap-2 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-0 text-xs sm:text-sm h-9 px-3.5 rounded-xl inline-flex items-center"
              >
                {hasOpenedCarePlan ? <HeartPulse className="h-4 w-4 text-primary-600 dark:text-primary-400" /> : <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                <span>
                  {hasOpenedCarePlan
                    ? (isKhmer ? 'បើកផែនការថែទាំ' : t('diagnosisResult.openCarePlan', 'Open Care Plan'))
                    : (isKhmer ? 'បង្កើតផែនការថែទាំ' : t('diagnosisResult.generateCarePlan', 'Generate Care Plan'))}
                </span>
              </Link>
            )}
            <button
              type="button"
              className="btn-secondary gap-1.5 text-xs sm:text-sm h-9 px-3.5 rounded-xl border-0 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800"
              onClick={() => setShowRestartConfirm(true)}
            >
              <RotateCcw className="h-4 w-4" />
              {t('diagnosisResult.restartAssessment', 'Restart Assessment')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
