import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Beaker,
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
import PrintableClinicalReport from '@/components/assessment/PrintableClinicalReport'
import { readDiagnosisResultSnapshot, saveDiagnosisResultSnapshot, clearAssessmentSession } from '@/lib/diagnosis-result-storage'
import { notify } from '@/lib/toast'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { userHasStaffRole } from '@/lib/nav-config'

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
    <div className="min-w-0 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4.5 dark:border-slate-800/80 dark:bg-slate-900/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />}
          <p className="break-words text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">{title}</p>
        </div>
        <StatusBadge tone={status.tone} size="sm">{status.label}</StatusBadge>
      </div>

      <p className="mt-2.5 break-words text-2xl font-bold leading-none text-slate-900 dark:text-slate-100">{valueLabel}</p>

      <div className="mt-3.5">
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

        <div className="mt-1.5 grid grid-cols-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {ticks.map((tick) => (
            <span key={tick} className="text-center">{tick}</span>
          ))}
        </div>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  )
}

function ReportSection({ title, subtitle, children, icon: Icon, action, className = '', id }) {
  return (
    <section id={id} className={`border-t border-slate-100 px-6 py-6 sm:px-8 dark:border-slate-800/80 ${className}`}>
      {title && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-200/60 dark:bg-primary-950/40 dark:text-primary-300 dark:ring-primary-800/60">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div>
        {children}
      </div>
    </section>
  )
}

export function DiagnosisResultPage() {
  const { user } = useAuth()
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
          console.warn('Failed to fetch rule explanation:', err)
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

  const isStaff = userHasStaffRole(user)
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
        panel: 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-50/50 dark:border-rose-900/60 dark:from-rose-950/35 dark:via-[#070b15] dark:to-rose-950/20',
        wash: 'border-b border-rose-100/80 bg-gradient-to-br from-rose-50/70 via-rose-50/20 to-transparent dark:border-rose-900/50 dark:from-rose-950/30 dark:via-[#0b1324] dark:to-transparent',
        icon: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
        badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
      }
    : riskCategory === 'prediabetes'
      ? {
          panel: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50/40 dark:border-amber-900/60 dark:from-amber-950/30 dark:via-[#070b15] dark:to-orange-950/20',
          wash: 'border-b border-amber-100/80 bg-gradient-to-br from-amber-50/70 via-amber-50/20 to-transparent dark:border-amber-900/50 dark:from-amber-950/30 dark:via-[#0b1324] dark:to-transparent',
          icon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
          badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
        }
      : {
          panel: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 dark:border-emerald-900/60 dark:from-emerald-950/30 dark:via-[#070b15] dark:to-teal-950/20',
          wash: 'border-b border-emerald-100/80 bg-gradient-to-br from-emerald-50/70 via-emerald-50/20 to-transparent dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-[#0b1324] dark:to-transparent',
          icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
          badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
        }
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
    ? (isKhmer
        ? `${matchedSymptoms.length} រោគសញ្ញាត្រូវគ្នា (${matchedSymptoms.slice(0, 2).map((s) => {
            const guideKey = getSymptomGuideKey(s)
            const localeGuide = guideKey ? t(`diagnosisResult.symptomGuide.items.${guideKey}`, null) : null
            const g = resolveGuide(s, localeGuide)
            return g?.name || toReadableLabel(s)
          }).join(', ')}${matchedSymptoms.length > 2 ? '...' : ''})`
        : `${matchedSymptoms.length} symptom(s) aligned (${matchedSymptoms.slice(0, 2).map((s) => {
            const guideKey = getSymptomGuideKey(s)
            const localeGuide = guideKey ? t(`diagnosisResult.symptomGuide.items.${guideKey}`, null) : null
            const g = resolveGuide(s, localeGuide)
            return g?.name || toReadableLabel(s)
          }).join(', ')}${matchedSymptoms.length > 2 ? '...' : ''})`)
    : (isKhmer ? 'គ្មានរោគសញ្ញាសំខាន់ត្រូវបានរាយការណ៍' : 'No cardinal symptoms reported')

  const riskReasoningSummary = matchedRiskFactors.length > 0
    ? (isKhmer
        ? `${matchedRiskFactors.length} កត្តាហានិភ័យ (${matchedRiskFactors.slice(0, 2).map((r) => {
            const riskKey = getRiskGuideKey(r)
            const localeRiskGuide = riskKey ? t(`diagnosisResult.riskGuide.items.${riskKey}`, null) : null
            const rg = resolveGuide(r, localeRiskGuide)
            return rg?.name || toReadableLabel(r)
          }).join(', ')}${matchedRiskFactors.length > 2 ? '...' : ''})`
        : `${matchedRiskFactors.length} risk factor(s) identified (${matchedRiskFactors.slice(0, 2).map((r) => {
            const riskKey = getRiskGuideKey(r)
            const localeRiskGuide = riskKey ? t(`diagnosisResult.riskGuide.items.${riskKey}`, null) : null
            const rg = resolveGuide(r, localeRiskGuide)
            return rg?.name || toReadableLabel(r)
          }).join(', ')}${matchedRiskFactors.length > 2 ? '...' : ''})`)
    : (isKhmer ? 'កម្រិតហានិភ័យទាប' : 'Standard baseline risk')

  const labReasoningSummary = (hba1cValue != null || fastingValue != null)
    ? (isKhmer
        ? `ទិន្នន័យតេស្តឈាម (${hba1cValue != null ? `HbA1c: ${formatLabValue('hba1c', hba1cValue)}` : ''}${fastingValue != null ? `${hba1cValue != null ? ', ' : ''}FPG: ${formatLabValue('fasting', fastingValue)}` : ''})`
        : `Biomarkers verified (${hba1cValue != null ? `HbA1c: ${formatLabValue('hba1c', hba1cValue)}` : ''}${fastingValue != null ? `${hba1cValue != null ? ', ' : ''}FPG: ${formatLabValue('fasting', fastingValue)}` : ''})`)
    : (isKhmer ? 'មិនទាន់មានតេស្តឈាម (រង់ចាំការបញ្ជាក់ពីមន្ទីរពិសោធន៍)' : 'Awaiting fasting glucose or HbA1c lab verification')

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
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
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
      <div className="no-print space-y-5">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate('/diagnosis')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('diagnosisResult.backToAssessment', 'Back to Assessment')}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Open Care Plan Button */}
            <Link
              to="/care-plan"
              className="btn-secondary gap-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-xs border-slate-200 dark:border-slate-700 h-9 px-3.5 text-xs sm:text-sm font-semibold transition-all text-slate-700 dark:text-slate-200 inline-flex items-center rounded-xl"
            >
              <HeartPulse className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span>{t('diagnosisResult.openCarePlan', 'Open Care Plan')}</span>
            </Link>

            {/* Download and print options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={Boolean(downloadingReport)}
                  className="btn-primary gap-2 h-9 px-3.5 shadow-sm transition-all text-xs sm:text-sm font-semibold inline-flex items-center rounded-xl"
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
                  <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-80 p-2 shadow-xl z-50">
                <DropdownMenuLabel className="text-xs text-slate-500 dark:text-slate-400 font-semibold px-2 py-1">
                  {t('diagnosisResult.pdfMenu.title', isKhmer ? 'ជ្រើសរើសទម្រង់របាយការណ៍' : 'Choose Report Language')}
                </DropdownMenuLabel>

                <DropdownMenuItem
                  onClick={() => handleDownloadReport('en')}
                  disabled={Boolean(downloadingReport)}
                  className="flex items-start gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs">
                    EN
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t('diagnosisResult.pdfMenu.englishTitle', isKhmer ? 'របាយការណ៍ជាភាសាអង់គ្លេស (PDF)' : 'English PDF Report')}
                      </p>
                      {downloadingReport === 'en' && <RotateCcw className="h-3.5 w-3.5 animate-spin text-blue-500" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('diagnosisResult.pdfMenu.englishDesc', isKhmer ? 'របាយការណ៍គ្លីនិកស្តង់ដារសម្រាប់កំណត់ត្រា និង EMR' : 'Standard clinical PDF for records & EMR')}
                    </p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleDownloadReport('km')}
                  disabled={Boolean(downloadingReport)}
                  className="flex items-start gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    ខ្មែរ
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t('diagnosisResult.pdfMenu.khmerTitle', isKhmer ? 'របាយការណ៍ជាភាសាខ្មែរ (PDF)' : 'Khmer PDF Report')}
                      </p>
                      {downloadingReport === 'km' && <RotateCcw className="h-3.5 w-3.5 animate-spin text-emerald-500" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('diagnosisResult.pdfMenu.khmerDesc', isKhmer ? 'របាយការណ៍គ្លីនិកជាភាសាខ្មែរផ្លូវការ' : 'Official clinical PDF report in Khmer')}
                    </p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5" />

                <DropdownMenuItem
                  onClick={() => window.print()}
                  className="flex items-start gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                    <Printer className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t('diagnosisResult.pdfMenu.printTitle', isKhmer ? 'បោះពុម្ព / រក្សាទុកជា PDF' : 'Print / Save as PDF')}
                      </p>
                      <span className="rounded bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                        {t('diagnosisResult.pdfMenu.printBadge', isKhmer ? 'ណែនាំ' : 'Best Font')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('diagnosisResult.pdfMenu.printDesc', isKhmer
                        ? 'ប្រើប្រព័ន្ធ font របស់ browser សម្រាប់អក្សរខ្មែរច្បាស់ 100%'
                        : 'Native browser font shaping for perfect Khmer typography')}
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

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

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ── THE MASTER CLINICAL REPORT CARD (ONE SINGLE CARD) ── */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <article className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-[#0b1324] dark:shadow-none">
          {/* ── 1. CLINICAL DOSSIER HEADER ── */}
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-blue-700 text-white shadow-md shadow-primary-500/25">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                    {isKhmer
                      ? 'ប្រព័ន្ធជំនាញ និងគាំទ្រការសម្រេចចិត្តគ្លីនិក'
                      : 'Clinical Decision Support & Expert System'}
                  </p>
                  <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                    {t('diagnosisResult.pageTitle', 'Medical Assessment Report')}
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {isKhmer
                      ? 'មជ្ឈមណ្ឌលឯកទេសជំងឺទឹកនោមផ្អែម និងសុខភាពមេតាបូលីស · ការវាយតម្លៃគ្លីនិកស្វ័យប្រវត្តិ'
                      : 'Endocrinology & Diabetes Center of Clinical Excellence · Diagnostic Evaluation'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/50 sm:items-end sm:text-right shrink-0">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                  <span className="text-slate-400 font-sans font-normal">{isKhmer ? 'លេខកូដ:' : 'Report No:'}</span>
                  <span className="rounded bg-primary-50 px-1.5 py-0.5 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 font-semibold">{reportNumber}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {formatDateTime(reportTime)}
                </p>
                <div className="mt-0.5">
                  {isSubmittedToCareTeam ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800/60">
                      <CheckCircle2 className="h-3 w-3" />
                      {isKhmer ? 'បានរក្សាទុកក្នុងកំណត់ត្រា' : 'Recorded in Chart'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800/60">
                      <Clock className="h-3 w-3" />
                      {isKhmer ? 'ការពិនិត្យសកម្ម' : 'Active Screening'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. PATIENT DEMOGRAPHICS STRIP ── */}
          <div className="grid grid-cols-2 gap-4 border-y border-slate-100 bg-slate-50/70 px-6 py-3.5 sm:grid-cols-4 sm:px-8 dark:border-slate-800/80 dark:bg-slate-900/40">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('diagnosisResult.patient', 'Patient Name')}
              </p>
              <p className="mt-0.5 truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                {patientName}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isKhmer ? 'ភេទ' : 'Gender'}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {patientGender}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isKhmer ? 'អាយុ' : 'Age'}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {patientAge}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isKhmer ? 'ប្រភេទពិនិត្យ' : 'Assessment Mode'}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {assessmentModeLabel}
              </p>
            </div>
          </div>

          {/* ── 3. CLINICAL IMPRESSION & CONFIDENCE HERO ── */}
          <div className={`px-6 py-6 sm:px-8 sm:py-8 ${resultTone.wash}`}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,1fr)] lg:gap-8">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${resultTone.icon}`}>
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {t('diagnosisResult.screeningResult', 'Your screening result')}
                  </span>
                </div>

                <h2 className="mt-2 break-words text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  {primaryHeadline}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base">
                  {headlineExplanation}
                </p>

                {suspectedType?.type && suspectedType.type !== 'Undetermined' ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                    <Dna className="h-3.5 w-3.5 text-primary-500" />
                    <span>{t('diagnosisResult.suspectedType', 'Possible type')}:</span>
                    <span className="text-primary-600 dark:text-primary-400">{tExact(t(`diagnosisResult.type.${getTypeLabelKey(suspectedType.type)}`, suspectedType.type))}</span>
                  </div>
                ) : null}

                {hasUrgentWarning ? (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3.5 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                    <div>
                      <p className="text-sm font-extrabold">{t('diagnosisResult.urgentNoticeTitle', 'Urgent symptoms need prompt care')}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-rose-800 dark:text-rose-200 sm:text-sm">
                        {t('diagnosisResult.urgentNoticeText', 'Please contact a healthcare professional promptly. If symptoms are severe or worsening, seek emergency care.')}
                      </p>
                    </div>
                  </div>
                ) : null}

                <a
                  href="#next-steps"
                  className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                >
                  {t('diagnosisResult.viewNextSteps', 'View my next steps')}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {t('diagnosisResult.overallScore', 'Result confidence')}
                </p>

                <div className="mt-2.5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-lg font-extrabold text-slate-950 dark:text-white sm:text-xl">
                      {tExact(confidenceMeta.title)}
                    </p>
                    {confidenceStatus ? (
                      <p className="mt-1.5 inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {confidenceStatus}
                      </p>
                    ) : null}
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-extrabold ${resultTone.badge}`}>
                    {certaintyPercent}%
                  </span>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-[width] duration-700"
                    style={{ width: `${certaintyPercent}%` }}
                  />
                </div>

                <p className="mt-3.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {confidenceReason || ((evidenceCompleteness?.missing_recommended_labs || missingLabs).length
                    ? t('diagnosisResult.confidenceMissingLabs', 'More information or recommended blood tests can make this result clearer.')
                    : t('diagnosisResult.confidenceGeneral', 'A healthcare professional can review this result and confirm what it means for you.'))}
                </p>
              </div>
            </div>

            {/* ── Diagnostic Reasoning & Clinical Rationale ── */}
            <div className="mt-6 rounded-2xl border border-primary-200/80 bg-white/95 p-5 shadow-xs dark:border-primary-900/40 dark:bg-slate-900/90 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100 text-primary-700 ring-1 ring-primary-200/80 dark:bg-primary-950/60 dark:text-primary-300 dark:ring-primary-800/60">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isKhmer ? 'ហេតុផលវេជ្ជសាស្ត្រ និងការវែកញែក (Clinical Reasoning)' : 'Diagnostic Reasoning & Clinical Rationale'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isKhmer ? 'ការវិភាគសំយោគលើរោគសញ្ញា កត្តាហានិភ័យ និងទិន្នន័យមន្ទីរពិសោធន៍' : 'How the expert system synthesized symptoms, risks, and biomarkers'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 ring-1 ring-primary-200/60 dark:ring-primary-800/60">
                  <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                  {isKhmer ? 'ក្បួនដោះស្រាយ EMR' : 'Expert Inference'}
                </span>
              </div>

              {/* Narrative Clinical Rationale */}
              <div className="mt-4">
                <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                  {clinicalSummary}
                </p>
              </div>

              {/* 3 Reasoning Pillars */}
              <div className="mt-5 grid gap-3 sm:grid-cols-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 dark:border-slate-800/60 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Heart className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>{isKhmer ? '១. សញ្ញា និងរោគសញ្ញា' : '1. Symptom Signals'}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {symptomReasoningSummary}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 dark:border-slate-800/60 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{isKhmer ? '២. កត្តាហានិភ័យ' : '2. Risk Profile'}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {riskReasoningSummary}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 dark:border-slate-800/60 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <FlaskConical className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{isKhmer ? '៣. តេស្តមន្ទីរពិសោធន៍' : '3. Lab Biomarkers'}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {labReasoningSummary}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. WHAT YOU SHOULD DO NEXT ── */}
          <ReportSection
            id="next-steps"
            title={t('diagnosisResult.actionableRecommendations', 'What you should do next')}
            subtitle={t('diagnosisResult.recommendationsSubtitle', 'Clinical steps recommended by the decision support engine')}
            icon={ClipboardList}
          >
            {recommendations.length ? (
              <ol className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {recommendations.map((item, index) => {
                  const isUrgent = item.urgency === 'urgent' || item.urgency === 'emergency'
                  return (
                    <li
                      key={`${item.text}-${index}`}
                      className="flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 ring-1 ring-primary-200/50 dark:ring-primary-800/50">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {tExact(bilingualField(item.text, item.text_km))}
                        </p>
                      </div>
                      {isUrgent ? (
                        <span className="mt-0.5 shrink-0 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:ring-rose-800/50">
                          {t('diagnosisResult.urgentTag', 'Urgent')}
                        </span>
                      ) : null}
                    </li>
                  )
                })}
              </ol>
            ) : (
              <p className="text-sm text-slate-500">
                {t('diagnosisResult.noSpecificRecommendations', 'No specific recommendations were generated. Please consult with a physician.')}
              </p>
            )}

            {showPrevention && preventionContent ? (
              <div className="mt-5 rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 sm:p-5">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 mb-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-sm font-bold">{preventionContent.title}</h4>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">{preventionContent.intro}</p>
                {preventionContent.listIntro ? (
                  <p className="mt-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">{preventionContent.listIntro}</p>
                ) : null}
                <ul className="mt-3 space-y-2">
                  {preventionContent.items.map((item) => (
                    <li key={item.lead} className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span><strong className="font-semibold text-slate-900 dark:text-white">{item.lead}</strong> {item.text}</span>
                    </li>
                  ))}
                </ul>
                {preventionContent.note ? (
                  <p className="mt-3 border-t border-emerald-200/60 pt-2.5 text-xs text-slate-600 dark:text-slate-400">{preventionContent.note}</p>
                ) : null}
              </div>
            ) : null}

            <ConditionEducationPanel result={result} defaultOpen={false} embedded={true} />
          </ReportSection>

          {/* ── 5. KEY DIAGNOSTIC INDICATORS ── */}
          <ReportSection
            title={t('diagnosisResult.keyDiagnosticIndicators', 'Key Diagnostic Indicators')}
            subtitle={t('diagnosisResult.biomarkersSubtitle', 'Verified biomarker measurements and glycemic indicators')}
            icon={FlaskConical}
          >
            <div className="grid gap-3.5 sm:grid-cols-2">
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

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/80 dark:bg-slate-900/30">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('diagnosisResult.evidenceCompleteness', 'Evidence Completeness')}</p>
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
          </ReportSection>

          {/* ── 6. CLINICAL EVIDENCE: SYMPTOMS & RISK FACTORS ── */}
          <ReportSection
            title={t('diagnosisResult.clinicalEvidence', 'The Evidence Behind This Result')}
            subtitle={t('diagnosisResult.evidenceSubtitle', 'Biomarkers, symptoms, and risk factors that influenced this assessment')}
            icon={Stethoscope}
          >
            {/* Diagnostic Reasoning & Logic Pathway */}
            <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4.5 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  <Brain className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isKhmer ? 'ការវិភាគហេតុផលវេជ្ជសាស្ត្រ និងការសំយោគទិន្នន័យ' : 'Clinical Diagnostic Logic & Evidence Synthesis'}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {isKhmer
                      ? `ការសន្និដ្ឋាននេះផ្អែកលើការរួមបញ្ចូលគ្នានៃ ${matchedSymptoms.length} រោគសញ្ញា ${matchedRiskFactors.length > 0 ? `រួមជាមួយ ${matchedRiskFactors.length} កត្តាហានិភ័យ` : ''}${hba1cValue != null || fastingValue != null ? ' និងលទ្ធផលតេស្តឈាមជាក់ស្តែង' : ' (មិនទាន់មានតេស្តឈាមផ្លូវការ)'}។ ${confidenceReason ? `កម្រិតទំនុកចិត្ត (${certaintyPercent}%)៖ ${confidenceReason}` : ''}`
                      : `This assessment was synthesized from ${matchedSymptoms.length} clinical symptom signal(s)${matchedRiskFactors.length > 0 ? `, ${matchedRiskFactors.length} patient risk factor(s)` : ''}${hba1cValue != null || fastingValue != null ? ', and verified laboratory biomarker values' : ', pending laboratory confirmation'}. ${confidenceReason ? `Confidence calculation rationale (${certaintyPercent}%): ${confidenceReason}` : ''}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column: Symptoms */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4.5 dark:border-slate-800/80 dark:bg-slate-900/30">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('diagnosisResult.relevantHistory', 'Relevant History & Symptoms')}
                  </h4>
                </div>

                {matchedSymptoms.length ? (
                  <ul className="space-y-3">
                    {matchedSymptoms.map((symptom) => {
                      const guideKey = getSymptomGuideKey(symptom)
                      const localeGuide = guideKey ? t(`diagnosisResult.symptomGuide.items.${guideKey}`, null) : null
                      const guide = resolveGuide(symptom, localeGuide)
                      return (
                        <li key={symptom} className="flex items-start gap-2.5">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                              {(guide && guide.name) || tExact(symptom)}
                              {guide && guide.term ? (
                                <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">{String(guide.term)}</span>
                              ) : null}
                            </p>
                            {guide && guide.meaning ? (
                              <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{String(guide.meaning)}</p>
                            ) : null}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('diagnosisResult.noSymptom', 'No prominent symptom pattern was selected.')}</p>
                )}
              </div>

              {/* Right Column: Risk Factors */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4.5 dark:border-slate-800/80 dark:bg-slate-900/30">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('diagnosisResult.riskFactors', 'Identified Risk Factors')}
                  </h4>
                </div>

                {matchedRiskFactors.length ? (
                  <ul className="space-y-3">
                    {matchedRiskFactors.map((risk) => {
                      const riskKey = getRiskGuideKey(risk)
                      const localeRiskGuide = riskKey ? t(`diagnosisResult.riskGuide.items.${riskKey}`, null) : null
                      const riskGuide = resolveGuide(risk, localeRiskGuide)
                      return (
                        <li key={risk} className="flex items-start gap-2.5">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">{(riskGuide && riskGuide.name) || tExact(risk)}</p>
                            {riskGuide && riskGuide.meaning ? (
                              <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{String(riskGuide.meaning)}</p>
                            ) : null}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('diagnosisResult.noRisk', 'No risk factors were flagged in this submission.')}</p>
                )}
              </div>
            </div>

            {/* Differentials if applicable */}
            {(differentialItems.length > 0 || (matchedSymptoms.length > 0 && certaintyPercent < 60)) && (
              <div className="mt-5 rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t('diagnosisResult.differentials.title', 'Alternative Explanations to Consider')}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  {t(
                    'diagnosisResult.differentials.subtitle',
                    'Your reported symptoms can also be caused by non-diabetic conditions. If blood glucose is normal, consider discussing these possibilities with a doctor:'
                  )}
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {(differentialItems.length > 0 ? differentialItems : [
                    {
                      key: 'uti_hydration',
                      title: t('diagnosisResult.differentials.utiTitle', 'Urinary Tract Infection (UTI) or High Fluid Intake'),
                      title_km: 'ការរលាកផ្លូវបង្ហូរនោម (UTI) ឬការញ៉ាំទឹកច្រើន',
                      description: t('diagnosisResult.differentials.utiDesc', 'Frequent urination without high blood glucose is commonly caused by drinking high amounts of fluids/caffeine, mild urinary infections, or benign prostate changes.'),
                      description_km: 'ការនោមញឹកញាប់ដោយគ្មានជាតិស្ករឡើងខ្ពស់ ច្រើនតែកើតពីការផឹកទឹក/កាហ្វេច្រើន ការរលាកផ្លូវទឹកនោមស្រាល ឬការប្រែប្រួលក្រពេញប្រូស្តាត។',
                    },
                    {
                      key: 'anemia_sleep',
                      title: t('diagnosisResult.differentials.anemiaTitle', 'Sleep Deprivation, Anemia, or Stress'),
                      title_km: 'ការគេងមិនគ្រប់គ្រាន់ ខ្វះគ្រាប់ឈាម ឬសម្ពាធអារម្មណ៍',
                      description: t('diagnosisResult.differentials.anemiaDesc', 'Fatigue is one of the most common non-specific symptoms. Poor sleep quality, stress, low iron levels, or thyroid imbalances are frequent causes.'),
                      description_km: 'ភាពអស់កម្លាំងជារោគសញ្ញាទូទៅបំផុត។ ការគេងមិនបានស្កប់ស្កល់ ភាពតានតឹង កង្វះជាតិដែក ឬអ័រម៉ូនទីរ៉ូអ៊ីត គឺជាមូលហេតុញឹកញាប់។',
                    },
                  ]).map((diff) => (
                    <div key={diff.key || diff.title} className="rounded-xl bg-white/80 p-3 dark:bg-slate-900/60 border border-amber-200/50 dark:border-amber-900/40">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">{isKhmer ? (diff.title_km || diff.title) : diff.title}</h5>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{isKhmer ? (diff.description_km || diff.description) : diff.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ReportSection>

          {/* ── 7. CARE TEAM DISPOSITION & DOCTOR REVIEW ── */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-6 sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/20">
            {isStaff || isClinicianAssessment ? (
              <div>
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-md shadow-primary-500/20 dark:bg-primary-500">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {t('diagnosisResult.clinicalAssessmentRecorded', 'Clinical Assessment Recorded')}
                      </h3>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800/60 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('diagnosisResult.savedToPatientChart', 'Saved to Patient Chart · Patient Alerted')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
                      {t(
                        'diagnosisResult.clinicalRecordedDesc',
                        "This clinical assessment was completed by medical staff and saved directly to the patient's record. The patient has been automatically notified."
                      )}
                      {reportTime ? ` · ${formatDateTime(reportTime)}` : ''}
                    </p>
                  </div>
                </div>

                {patientNoteSaved ? (
                  <div className="mt-3.5 rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/60 shadow-xs">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-300">
                      <MessageSquare className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                      <span>{t('diagnosisResult.patientNoteLabel', 'Notes')}:</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 italic">
                      "{patientNoteSaved}"
                    </p>
                  </div>
                ) : null}
              </div>
            ) : !isSubmittedToCareTeam ? (
              <div>
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-md shadow-primary-500/20">
                    <Send className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                        {t('diagnosisResult.submitToDoctorTitle', 'Submit to Doctor')}
                      </h3>
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800/60 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('diagnosisResult.savedInChartBadge', 'Saved in Your Chart · Ready to Send to Doctor')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 sm:text-sm leading-relaxed">
                      {t(
                        'diagnosisResult.submitToDoctorDesc',
                        'This assessment report is saved in your medical chart. You can submit it to your doctor along with any notes or questions for clinical review.'
                      )}
                    </p>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label htmlFor="patient-note-input" className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                          <span>{t('diagnosisResult.patientNoteLabel', 'Notes or Questions for Doctor (Optional)')}</span>
                        </label>
                        <textarea
                          id="patient-note-input"
                          rows={3}
                          value={patientNote}
                          onChange={(e) => setPatientNote(e.target.value)}
                          placeholder={t(
                            'diagnosisResult.patientNotePlaceholder',
                            'Share any current symptoms, recent changes, medications, or questions you would like your doctor to review...'
                          )}
                          className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500 transition-all resize-none shadow-xs"
                        />
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{t('diagnosisResult.submitToDoctorHint', 'Submitting alerts clinical staff to review your assessment.')}</span>
                        </p>

                        <button
                          type="button"
                          onClick={handleSubmitToCareTeam}
                          disabled={submittingToCareTeam}
                          className="btn-primary gap-2 h-11 px-6 text-sm font-semibold shadow-md shadow-primary-600/20 shrink-0 inline-flex items-center justify-center cursor-pointer"
                        >
                          {submittingToCareTeam ? (
                            <>
                              <RotateCcw className="h-4 w-4 animate-spin" />
                              <span>{t('diagnosisResult.submittingToCareTeam', 'Submitting...')}</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              <span>{t('diagnosisResult.submitToDoctorBtn', 'Submit to Doctor')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20 dark:bg-emerald-500">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {t('diagnosisResult.submittedToDoctorBadge', 'Submitted to Doctor')}
                      </h3>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800/60 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t('diagnosisResult.pendingReview', 'Pending Doctor Review')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
                      {t(
                        'diagnosisResult.submittedToDoctorToast',
                        'Assessment submitted to your doctor! Your care team has been alerted.'
                      )}
                      {submittedAt ? ` · ${formatDateTime(submittedAt)}` : ''}
                    </p>
                  </div>
                </div>

                {patientNoteSaved ? (
                  <div className="mt-3.5 rounded-2xl border border-emerald-100 bg-white/80 p-3.5 dark:border-emerald-900/40 dark:bg-slate-950/60 shadow-xs">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{t('diagnosisResult.yourNoteToDoctor', 'Your Note to Doctor')}:</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 italic">
                      "{patientNoteSaved}"
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* ── 8. TECHNICAL DETAILS ACCORDION ── */}
          <div className="border-t border-slate-100 px-6 py-2 sm:px-8 dark:border-slate-800/80">
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
                                <div className="mt-2.5 ml-4 sm:ml-5 rounded-xl border border-sky-200/80 bg-sky-50/70 p-3.5 text-xs sm:text-sm text-slate-700 shadow-xs dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-slate-300">
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
                <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
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

          {/* ── 9. MASTER DOCUMENT FOOTER ── */}
          <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:px-8 dark:border-slate-800/80 dark:bg-slate-900/40">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{t('diagnosisResult.footerDisclaimer', 'Medical Disclaimer: This report is generated by an expert clinical decision support system for screening and guidance. It does not replace professional medical diagnosis.')}</span>
              </div>
              <div className="shrink-0 font-mono text-[10px]">
                CDS Engine v2.4 · {reportNumber}
              </div>
            </div>
          </div>
        </article>

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
            <button type="button" className="btn-secondary gap-1.5 text-xs sm:text-sm h-9 px-3.5 rounded-xl" onClick={() => navigate('/diagnosis')}>
              <ArrowLeft className="h-4 w-4" />
              {t('diagnosisResult.back', 'Back')}
            </button>
            <Link
              to="/care-plan"
              className="btn-secondary gap-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-xs border-slate-200 dark:border-slate-700 text-xs sm:text-sm h-9 px-3.5 rounded-xl inline-flex items-center"
            >
              <HeartPulse className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span>{t('diagnosisResult.openCarePlan', 'Open Care Plan')}</span>
            </Link>
            <button type="button" className="btn-secondary gap-1.5 text-xs sm:text-sm h-9 px-3.5 rounded-xl" onClick={() => setShowRestartConfirm(true)}>
              <RotateCcw className="h-4 w-4" />
              {t('diagnosisResult.restartAssessment', 'Restart Assessment')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
