import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
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
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import {
  EmptyState,
  ErrorAlert,
  StatusBadge,
  ConfirmDialog,
  LoadingState,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui'
import { ConditionEducationPanel } from '@/components/diagnosis/ConditionEducationPanel'
import { PlainSummaryStrip } from '@/components/diagnosis/PlainSummaryStrip'
import { getSymptomGuideKey } from '@/lib/symptom-guide'
import { getRiskGuideKey } from '@/lib/risk-factor-guide'
import { bilingualField } from '@/lib/i18n'
import { TechnicalDetailsSection } from '@/components/diagnosis/TechnicalDetailsSection'
import PrintableClinicalReport from '@/components/assessment/PrintableClinicalReport'
import { readDiagnosisResultSnapshot, saveDiagnosisResultSnapshot } from '@/lib/diagnosis-result-storage'
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

function getUrgencyTone(urgency) {
  const key = String(urgency || '').toLowerCase()
  if (key === 'urgent') return 'danger'
  if (key === 'high') return 'warning'
  return 'info'
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

function getRiskGradient(percent, diagnosis) {
  const category = getRiskCategory(diagnosis, percent)
  if (category === 'normal') {
    return 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800'
  }
  if (category === 'prediabetes') {
    return 'bg-gradient-to-br from-amber-600 via-amber-700 to-orange-600'
  }
  if (category === 'urgent') {
    return 'bg-gradient-to-br from-rose-700 via-red-700 to-red-800'
  }
  return 'bg-gradient-to-br from-rose-700 via-pink-800 to-red-700'
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

export function cleanRuleName(name) {
  if (!name) return ''
  return String(name)
    // English prefixes (e.g., "V2 Diagnosis: ", "V2 Recommendation: ", "V2 Type 2 Pattern: ", "Classification: ", "Diagnosis: ")
    .replace(/^V\d+\s+(Diagnosis|Recommendation|Pattern|Classification|Triage|Type\s+\d+\s+Pattern|Gestational\s+Pattern|Risk)[\s:：៖\-–—\u17D6]+/i, '')
    .replace(/^V\d+[\s:：៖\-–—\u17D6]+/i, '')
    .replace(/^(Diagnosis|Recommendation|Classification|Triage|Pattern|Risk)[\s:：៖\-–—\u17D6]+/i, '')
    // Khmer prefixes (e.g., "V2 ការវិភាគរោគ៖ ", "V2 ការណែនាំ៖ ", "V2 ទម្រង់ប្រភេទទី ២៖ ", "ការវិភាគរោគ៖ ")
    .replace(/^V\d+\s+(ការវិភាគរោគ|ការណែនាំ|ការសង្គ្រោះបឋម|ទម្រង់\s*Gestational|ទម្រង់ប្រភេទទី\s*\d+|ទម្រង់ប្រភេទ\s*\d+|ទម្រង់|ការចាត់ថ្នាក់|ការត្រួតពិនិត្យបន្ទាន់)[\s:：\-–—\u17D6]+/i, '')
    .replace(/^V\d+[\s:：\-–—\u17D6]+/i, '')
    .replace(/^(ការវិភាគរោគ|ការណែនាំ|ការសង្គ្រោះបឋម|ទម្រង់\s*Gestational|ទម្រង់ប្រភេទទី\s*\d+|ទម្រង់ប្រភេទ\s*\d+|ទម្រង់|ការចាត់ថ្នាក់)[\s:：\-–—\u17D6]+/i, '')
    .trim()
}

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
  if (percent <= 20) return translateKey('lowRisk', 'Low Diabetes Risk Indicated')

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

function CertaintyRing({ percent, diagnosis, size = 140, stroke = 12 }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0))
  const radius = (size - stroke * 2) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - safePercent / 100)

  const category = getRiskCategory(diagnosis, safePercent)
  let colorClass = 'text-emerald-500'
  if (category === 'urgent') colorClass = 'text-red-500'
  else if (category === 'diabetes') colorClass = 'text-rose-500'
  else if (category === 'prediabetes') colorClass = 'text-amber-500'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={center} cy={center} r={radius} strokeWidth={stroke} className="fill-none stroke-slate-200 dark:stroke-slate-800" />
      <circle
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={`fill-none stroke-current ${colorClass} transition-all duration-1000 ease-out`}
      />
    </svg>
  )
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
    <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-[#0a0f1c]/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
          <p className="break-words text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">{title}</p>
        </div>
        <StatusBadge tone={status.tone} size="sm">{status.label}</StatusBadge>
      </div>

      <p className="mt-2.5 break-words text-2xl font-bold leading-none text-slate-900 dark:text-slate-100">{valueLabel}</p>

      <div className="mt-4">
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

function SurfaceSection({ title, subtitle, children, icon: Icon, action, className = '' }) {
  return (
    <section className={`space-y-2.5 ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-100/70 text-cyan-700 ring-1 ring-cyan-200/60 dark:bg-cyan-900/40 dark:text-cyan-300 dark:ring-cyan-800/60">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800/70 dark:bg-[#070b15] sm:p-6">
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
    return <LoadingState label={t('diagnosisResult.loading', 'Loading diagnosis result...')} className="py-16" />
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

  const matchedSymptoms = Array.isArray(result?.matched_symptoms) ? result.matched_symptoms : []
  const matchedRiskFactors = Array.isArray(result?.matched_risk_factors) ? result.matched_risk_factors : []
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

  const primaryHeadline = getPrimaryHeadline(result, certaintyPercent, t, tExact).toUpperCase()
  const suspectedType = result?.suspected_type
    || result?.explanation_trace?.suspected_type
    || null
  const patientName = context?.patient_name || t('diagnosisResult.currentPatient', 'Current patient')
  const reportTime = result?.created_at || snapshot?.savedAt
  const reportDownloadId = diagnosisResultId || result?.id || result?.diagnosis_result_id || submittedCareTeamResult?.diagnosis_result_id || submittedCareTeamResult?.id

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
    localStorage.removeItem('diagnosisResultSnapshot')
    setShowRestartConfirm(false)
    navigate('/diagnosis', { state: { keepData: true } })
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
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
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
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            {t('diagnosisResult.pageTitle', 'Medical Assessment Report')}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{t('diagnosisResult.patient', 'Patient')}: <strong className="font-semibold text-slate-800 dark:text-slate-200">{patientName}</strong></span>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <span>{t('diagnosisResult.generatedOn', 'Generated on')}: {formatDateTime(reportTime)}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          {/* Open Care Plan Button */}
          <Link
            to="/care-plan"
            className="btn-secondary gap-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700 h-10 px-4 text-sm font-semibold transition-all text-slate-700 dark:text-slate-200 inline-flex items-center"
          >
            <HeartPulse className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span>{t('diagnosisResult.openCarePlan', 'Open Care Plan')}</span>
          </Link>

          {/* Print Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-secondary gap-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700 h-10 px-4 text-sm font-semibold transition-all text-slate-700 dark:text-slate-200"
            title={t('diagnosisResult.printTooltip', 'Print or save as PDF with native browser font rendering (Recommended for Khmer)')}
          >
            <Printer className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>{isKhmer ? 'បោះពុម្ព' : t('diagnosisResult.print', 'Print')}</span>
          </button>

          {/* Generate PDF Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={Boolean(downloadingReport)}
                className="btn-primary gap-2 h-10 px-4 shadow-sm transition-all text-sm font-semibold inline-flex items-center"
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

      <PlainSummaryStrip result={result} />

      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100/70 text-primary-700 ring-1 ring-primary-200/60 dark:bg-primary-900/40 dark:text-primary-300 dark:ring-primary-800/60">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {t('diagnosisResult.diagnosticOutput', 'Diagnostic Output')}
              </h3>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Primary Screening
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-slate-100 dark:bg-[#070b15] dark:ring-slate-800/60">
          <div className="grid lg:grid-cols-5">
            <article className={`relative overflow-hidden px-6 py-8 text-white sm:px-9 md:py-12 lg:col-span-3 ${getRiskGradient(certaintyPercent, result?.diagnosis)}`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10 pointer-events-none" />
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              <div className="relative z-10 flex h-full flex-col justify-center">
                <h2 className="break-words text-2xl font-bold tracking-tight text-white drop-shadow-xs sm:text-3xl lg:text-4xl">{primaryHeadline}</h2>
                {suspectedType?.type ? (
                  <div className="mt-4 w-fit max-w-md rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-white">
                      <Dna className="h-4 w-4 shrink-0" />
                      <span className="tracking-wide">{t('diagnosisResult.suspectedType', 'Suspected type')}:</span>
                      <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-bold">
                        {tExact(t(`diagnosisResult.type.${getTypeLabelKey(suspectedType.type)}`, suspectedType.type))}
                        {suspectedType.type !== 'Undetermined' && Number.isFinite(Number(suspectedType.certainty)) ? ` · ${Math.round(Number(suspectedType.certainty) * 100)}%` : ''}
                      </span>
                    </p>
                    {suspectedType.note ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-white/85">{tExact(String(suspectedType.note))}</p>
                    ) : null}
                    {Array.isArray(suspectedType.candidates) && suspectedType.candidates.length ? (
                      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-white/90">
                        {t('diagnosisResult.couldFit', 'Could fit:')}
                        {suspectedType.candidates.slice(0, 3).map((candidate) => (
                          <span key={candidate.type} className="rounded-full bg-white/20 px-2 py-0.5">
                            {tExact(t(`diagnosisResult.type.${getTypeLabelKey(candidate.type)}`, candidate.type))} {Math.round(Number(candidate.certainty || 0) * 100)}%
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <p className="mt-4 max-w-lg text-sm font-normal leading-relaxed text-white/95 sm:text-base">
                  {result?.headline_explanation
                    ? tExact(bilingualField(result.headline_explanation, result.headline_explanation_km))
                    : result?.result_summary
                      ? tExact(bilingualField(result.result_summary, result.result_summary_km))
                      : (<>{t('diagnosisResult.probabilityBase', 'Screening confidence: ')}<strong className="font-bold text-white">{certaintyPercent}%</strong>{t('diagnosisResult.probabilityOf', ' — see the evidence breakdown below.')}</>)
                  }
                </p>
                {result?.context_note ? (
                  <p className="mt-3 flex max-w-lg items-start gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium leading-relaxed text-white/95 backdrop-blur-sm">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{tExact(String(result.context_note))}</span>
                  </p>
                ) : null}
              </div>
            </article>

            <article className="relative flex flex-col items-center justify-center bg-slate-50/80 px-6 py-8 dark:bg-[#0a0f1c] sm:px-8 sm:py-10 lg:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 mt-1">{t('diagnosisResult.overallScore', 'Screening Confidence')}</p>

              <div className="relative flex items-center justify-center">
                <CertaintyRing percent={certaintyPercent} diagnosis={result?.diagnosis} size={170} stroke={13} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">{certaintyPercent}</span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase mt-1 tracking-wider">/ 100</span>
                </div>
              </div>

              <div className="mt-6 text-center bg-white dark:bg-slate-900/60 rounded-2xl py-2.5 px-5 shadow-xs border border-slate-100 dark:border-slate-800 max-w-[240px]">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {tExact(confidenceMeta.title)}
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <ConditionEducationPanel result={result} defaultOpen={true} />

      <SurfaceSection title={t('diagnosisResult.actionableRecommendations', 'What you should do next')} icon={ClipboardList}>
        {recommendations.length ? (
          <ol className="divide-y divide-slate-100 dark:divide-slate-800">
            {recommendations.map((item, index) => {
              const isUrgent = item.urgency === 'urgent' || item.urgency === 'emergency'
              return (
                <li
                  key={`${item.text}-${index}`}
                  className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                    {index + 1}
                  </span>
                  <p className="flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {tExact(bilingualField(item.text, item.text_km))}
                  </p>
                  {isUrgent ? (
                    <span className="mt-0.5 shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600 ring-1 ring-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-900/50">
                      {t('diagnosisResult.urgentTag', 'Urgent')}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ol>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <ClipboardList className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {tExact(bilingualField(result.recommendation, result.recommendations?.[0]?.text === result.recommendation ? result.recommendations?.[0]?.text_km : undefined)) || t('diagnosisResult.noSpecificRecommendations', 'No specific recommendations were generated. Please consult with a physician.')}
            </p>
          </div>
        )}
        {showPrevention && preventionContent ? (
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            <h4 className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              {preventionContent.title}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {preventionContent.intro}
            </p>
            {preventionContent.listIntro ? (
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {preventionContent.listIntro}
              </p>
            ) : null}
            <ul className="mt-2.5 space-y-2">
              {preventionContent.items.map((item) => (
                <li key={item.lead} className="flex items-start gap-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  <span>
                    <strong className="font-semibold text-slate-900 dark:text-white">{item.lead}</strong>{' '}
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
            {preventionContent.note ? (
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {preventionContent.note}
              </p>
            ) : null}
          </div>
        ) : null}
      </SurfaceSection>

      <div className="flex items-center gap-2.5 pt-4 px-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Stethoscope className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
            {t('diagnosisResult.clinicalEvidence', 'The evidence behind this result')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Biomarkers, symptoms, and risk factors that influenced this assessment
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <article>
          <SurfaceSection title={t('diagnosisResult.keyDiagnosticIndicators', 'Key Diagnostic Indicators')} icon={FlaskConical}>
            <div className="grid gap-2 sm:grid-cols-2">
              <LabIndicatorCard
                title={t('diagnosisResult.hba1cIndicator', 'HbA1c Level Indicator')}
                valueLabel={formatLabValue('hba1c', hba1cValue)}
                status={hba1cStatus}
                subtitle={t('diagnosisResult.hba1cSubtitle', 'A key marker of long-term glucose control.')}
                pointerPercent={hba1cPointer}
                ticks={['<5.7%', '5.7-6.4%', '>=6.5%']}
                icon={TestTube}
              />
              <LabIndicatorCard
                title={t('diagnosisResult.fastingIndicator', 'Fasting Glucose Indicator')}
                valueLabel={formatLabValue('fasting', fastingValue)}
                status={fastingStatus}
                subtitle={t('diagnosisResult.fastingSubtitle', 'Indicates glucose level after an 8-hour fast.')}
                pointerPercent={fastingPointer}
                ticks={['<100', '100-125', '>=126']}
                icon={Droplet}
              />
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
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
          </SurfaceSection>
        </article>

        <article>
          <SurfaceSection title={t('diagnosisResult.relevantHistory', 'Relevant History & Symptoms')} icon={Heart}>
            {matchedSymptoms.length ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('diagnosisResult.knownSymptoms', 'You reported:')}</p>
                <ul className="mt-3 space-y-3">
                  {matchedSymptoms.map((symptom) => {
                    const guideKey = getSymptomGuideKey(symptom)
                    const localeGuide = guideKey ? t(`diagnosisResult.symptomGuide.items.${guideKey}`, null) : null
                    const guide = resolveGuide(symptom, localeGuide)
                    return (
                      <li key={symptom} className="flex items-start gap-2.5">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500 dark:bg-cyan-400" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                            {(guide && guide.name) || tExact(symptom)}
                            {guide && guide.term ? (
                              <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">{String(guide.term)}</span>
                            ) : null}
                          </p>
                          {guide && guide.meaning ? (
                            <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">{String(guide.meaning)}</p>
                          ) : null}
                          {guide && guide.prevention ? (
                            <p className="mt-1 flex items-start gap-1.5 text-xs sm:text-sm leading-relaxed text-emerald-700 dark:text-emerald-400">
                              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span>
                                <span className="font-semibold">{t('diagnosisResult.symptomGuide.preventionLabel', 'Prevention:')}</span>{' '}
                                {String(guide.prevention)}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-4 border-t border-slate-100 pt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {t('diagnosisResult.symptomAlign', "The patient's reported symptoms align with the matched diabetes pattern shown by the inference engine.")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('diagnosisResult.noSymptom', 'No prominent symptom pattern was selected.')}</p>
            )}
          </SurfaceSection>
        </article>

        <article>
          <SurfaceSection title={t('diagnosisResult.riskFactors', 'Risk Factors')} icon={Zap}>
            {matchedRiskFactors.length ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('diagnosisResult.knownHistory', 'Known history includes:')}</p>
                <ul className="mt-3 space-y-3">
                  {matchedRiskFactors.map((risk) => {
                    const riskKey = getRiskGuideKey(risk)
                    const localeRiskGuide = riskKey ? t(`diagnosisResult.riskGuide.items.${riskKey}`, null) : null
                    const riskGuide = resolveGuide(risk, localeRiskGuide)
                    return (
                      <li key={risk} className="flex items-start gap-2.5">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">{(riskGuide && riskGuide.name) || tExact(risk)}</p>
                          {riskGuide && riskGuide.meaning ? (
                            <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">{String(riskGuide.meaning)}</p>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('diagnosisResult.noRisk', 'No risk factors were flagged in this submission.')}</p>
            )}
          </SurfaceSection>
        </article>
      </div>

      <TechnicalDetailsSection>
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
                  <li
                    key={ruleKey}
                    className="py-3 first:pt-0 last:pb-0"
                  >
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

      {/* ── Status Banner / Submit to Doctor Card ── */}
      {isStaff || isClinicianAssessment ? (
        <section className="relative overflow-hidden rounded-3xl border border-primary-200/80 bg-gradient-to-br from-primary-50/60 via-white to-sky-50/40 p-5 shadow-sm dark:border-primary-900/50 dark:from-primary-950/30 dark:via-[#070b15] dark:to-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        </section>
      ) : !isSubmittedToCareTeam ? (
        <section className="relative overflow-hidden rounded-3xl border-2 border-primary-200 bg-gradient-to-br from-primary-50/70 via-white to-sky-50/50 p-6 shadow-sm dark:border-primary-900/60 dark:from-primary-950/40 dark:via-[#070b15] dark:to-slate-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-md shadow-primary-500/25 dark:bg-primary-500">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                    {t('diagnosisResult.submitToDoctorTitle', 'Submit to Doctor')}
                  </h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800/60 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('diagnosisResult.savedInChartBadge', 'Saved in Your Chart · Ready to Send to Doctor')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 sm:text-sm max-w-2xl leading-relaxed">
                  {t(
                    'diagnosisResult.submitToDoctorDesc',
                    'This assessment report is saved in your medical chart. You can submit it to your doctor along with any notes or questions for clinical review.'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
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
                className="w-full rounded-2xl border border-slate-200 bg-white/90 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500 transition-all resize-none shadow-xs"
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
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 p-5 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/30 dark:via-[#070b15] dark:to-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        </section>
      )}

      <div className="rounded-xl bg-white px-4 py-3 dark:bg-[#050912]">
        <div className="flex items-start gap-2">
          {diagnosisResultId ? (
            <History className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          ) : (
            <Activity className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          )}
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {diagnosisResultId
              ? t('diagnosisResult.loadedFromHistory', 'This report was loaded from your saved assessment history.')
              : t('diagnosisResult.savedResultActive', 'Saved result snapshot is active for this account. Start a new assessment to replace it.')}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span className="text-xs text-slate-500">
          {t('diagnosisResult.viewAssessmentResults', 'View your assessment results and recommendations above.')}
        </span>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" className="btn-secondary gap-1.5" onClick={() => navigate('/diagnosis')}>
            <ArrowLeft className="h-4 w-4" />
            {t('diagnosisResult.back', 'Back')}
          </button>
          <Link
            to="/care-plan"
            className="btn-secondary gap-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700 inline-flex items-center"
          >
            <HeartPulse className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span>{t('diagnosisResult.openCarePlan', 'Open Care Plan')}</span>
          </Link>
          <button type="button" className="btn-secondary gap-1.5" onClick={() => setShowRestartConfirm(true)}>
            <RotateCcw className="h-4 w-4" />
            {t('diagnosisResult.restartAssessment', 'Restart Assessment')}
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
