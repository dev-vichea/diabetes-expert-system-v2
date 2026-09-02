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
  Zap,
  RotateCcw,
  FileText,
  Stethoscope,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { EmptyState, StatusBadge, ConfirmDialog } from '@/components/ui'
import { ConditionEducationPanel } from '@/components/diagnosis/ConditionEducationPanel'
import { PlainSummaryStrip } from '@/components/diagnosis/PlainSummaryStrip'
import { getSymptomGuideKey } from '@/lib/symptom-guide'
import { TechnicalDetailsSection } from '@/components/diagnosis/TechnicalDetailsSection'
import { readDiagnosisResultSnapshot, saveDiagnosisResultSnapshot } from '@/lib/diagnosis-result-storage'
import { notify } from '@/lib/toast'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

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

function getConfidenceMeta(result, percent) {
  const fallback = {
    title: percent >= 85 ? 'Very high confidence' : percent >= 70 ? 'High confidence' : percent >= 45 ? 'Moderate confidence' : 'Low confidence',
    description: percent >= 85
      ? 'The pattern strongly matches diabetes indicators.'
      : percent >= 70
        ? 'Many indicators point in the same direction.'
        : percent >= 45
          ? 'Some indicators match, but more checks may be needed.'
          : 'Current data shows weak diabetes indication.',
  }

  if (!result?.confidence_level || typeof result.confidence_level !== 'object') return fallback
  return {
    title: result.confidence_level.title || fallback.title,
    description: result.confidence_level.description || fallback.description,
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

function getRiskGradient(percent) {
  percent = Number(percent) || 0

  if (percent >= 85) {
    return 'bg-gradient-to-r from-red-700 to-red-600'
  }
  if (percent >= 70) {
    return 'bg-gradient-to-r from-orange-700 to-orange-600'
  }
  if (percent >= 45) {
    return 'bg-gradient-to-r from-amber-700 to-amber-600'
  }
  if (percent >= 25) {
    return 'bg-gradient-to-r from-yellow-700 to-yellow-600'
  }
  return 'bg-gradient-to-r from-emerald-700 to-emerald-600'
}

function getGaugeColor(score) {
  score = Number(score) || 0

  if (score >= 85) {
    return { light: 'stroke-red-600', dark: 'stroke-red-400' }
  }
  if (score >= 70) {
    return { light: 'stroke-orange-600', dark: 'stroke-orange-400' }
  }
  if (score >= 45) {
    return { light: 'stroke-amber-600', dark: 'stroke-amber-400' }
  }
  if (score >= 25) {
    return { light: 'stroke-yellow-600', dark: 'stroke-yellow-400' }
  }
  return { light: 'stroke-emerald-600', dark: 'stroke-emerald-400' }
}

function formatCertaintyContribution(rule) {
  return Number(rule?.effective_certainty ?? rule?.certainty_factor ?? 0).toFixed(2)
}

function getPrimaryHeadline(result, percent) {
  const diagnosis = String(result?.diagnosis || '').toLowerCase()
  if (diagnosis.includes('likely')) return 'Diabetes likely'
  if (diagnosis.includes('prediabetes')) return 'Prediabetes pattern'
  if (percent <= 30) return 'Low diabetes indication'
  return result?.diagnosis || 'Assessment completed'
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

function CertaintyRing({ percent, size = 140, stroke = 12 }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0))
  const radius = (size - stroke * 2) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - safePercent / 100)

  const colorClass = safePercent >= 85 ? 'text-red-500' : safePercent >= 70 ? 'text-orange-500' : safePercent >= 45 ? 'text-amber-500' : 'text-emerald-500'

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
    <div className="min-w-0 rounded-lg bg-white p-3 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />}
          <p className="break-words text-[1.05rem] font-bold leading-snug text-slate-900 dark:text-slate-100">{title}</p>
        </div>
        <StatusBadge tone={status.tone} size="sm">{status.label}</StatusBadge>
      </div>

      <p className="mt-2 break-words text-3xl font-extrabold leading-none text-slate-900 dark:text-slate-100 sm:text-[2.2rem]">{valueLabel}</p>

      <div className="mt-5">
        <div className="relative h-2 rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="h-full w-1/3 bg-emerald-500" />
            <div className="absolute left-1/3 top-0 h-full w-1/3 bg-amber-400" />
            <div className="absolute right-0 top-0 h-full w-1/3 bg-red-500" />
          </div>
          {markerPercent != null ? (
            <span
              className="pointer-events-none absolute -top-4 -translate-x-1/2 text-base leading-none text-red-600 drop-shadow-sm dark:text-red-400"
              style={{ left: `${markerPercent}%` }}
            >
              ▼
            </span>
          ) : null}
        </div>

        <div className="mt-0.5 grid grid-cols-3 text-[0.72rem] font-semibold text-slate-500 dark:text-slate-400">
          {ticks.map((tick) => (
            <span key={tick} className="text-center">{tick}</span>
          ))}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
    </div>
  )
}

function SurfaceSection({ title, children, icon: Icon }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-[#070b15] dark:ring-slate-800/60">
      <header className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 dark:border-slate-800 dark:bg-[#0a0f1c]/50">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />}
          <p className="text-sm font-extrabold uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">{title}</p>
        </div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

export function DiagnosisResultPage() {
  const { user } = useAuth()
  const { t, tExact } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loadingRemote, setLoadingRemote] = useState(false)
  const [downloadingReport, setDownloadingReport] = useState(false)
  const diagnosisResultId = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('diagnosis_result_id')
  }, [location.search])
  const [snapshot, setSnapshot] = useState(() => {
    const fromState = normalizeSnapshot(location.state)
    if (fromState) return fromState
    return readDiagnosisResultSnapshot(user)
  })

  useEffect(() => {
    const fromState = normalizeSnapshot(location.state)
    if (fromState) {
      setSnapshot(fromState)
      return
    }

    if (!diagnosisResultId) {
      setSnapshot(readDiagnosisResultSnapshot(user))
      return
    }

    let cancelled = false

    async function loadDiagnosisResult() {
      setLoadingRemote(true)
      setLoadError('')
      try {
        const response = await api.get(`/diagnosis/${diagnosisResultId}`)
        const result = getApiData(response)
        const nextSnapshot = {
          result,
          context: {
            patient_id: result?.patient_id ?? null,
            patient_name: result?.patient_name ?? null,
            assessment_mode: result?.assessment_session?.mode ?? null,
          },
          savedAt: result?.created_at || null,
        }
        if (cancelled) return
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
  }, [diagnosisResultId, location.state, user])

  if (loadingRemote && !snapshot?.result) {
    return <div className="text-sm text-slate-500">{t('diagnosisResult.loading', 'Loading diagnosis result...')}</div>
  }

  if (!snapshot?.result) {
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

  const result = snapshot.result
  const context = snapshot.context || {}
  const certaintyPercent = result?.certainty_percent != null
    ? Math.max(0, Math.min(100, Number(result.certainty_percent) || 0))
    : toCertaintyPercent(result?.certainty)
  const confidenceMeta = getConfidenceMeta(result, certaintyPercent)

  const matchedSymptoms = Array.isArray(result?.matched_symptoms) ? result.matched_symptoms : []
  const matchedRiskFactors = Array.isArray(result?.matched_risk_factors) ? result.matched_risk_factors : []
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

  const primaryHeadline = tExact(getPrimaryHeadline(result, certaintyPercent)).toUpperCase()
  const suspectedType = result?.suspected_type
    || result?.explanation_trace?.suspected_type
    || null
  const patientName = context?.patient_name || t('diagnosisResult.currentPatient', 'Current patient')
  const reportTime = result?.created_at || snapshot?.savedAt
  const reportDownloadId = diagnosisResultId || result?.id || result?.diagnosis_result_id

  const handleRestartConfirm = () => {
    localStorage.removeItem('diagnosisResultSnapshot')
    setShowRestartConfirm(false)
    navigate('/diagnosis', { state: { keepData: true } })
  }

  const handleDownloadReport = async () => {
    if (!reportDownloadId) {
      notify.error(t('diagnosisResult.downloadPdfMissingId', 'This result is missing a report identifier. Reload the page and try again.'))
      return
    }

    setDownloadingReport(true)
    try {
      const response = await api.get(`/diagnosis/${reportDownloadId}/report.pdf`, {
        responseType: 'blob',
      })

      const blob = response?.data instanceof Blob
        ? response.data
        : new Blob([response?.data], { type: 'application/pdf' })

      const fallbackFileName = `assessment-report-${reportDownloadId}.pdf`
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
      setDownloadingReport(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            {t('diagnosisResult.pageTitle', 'Medical Assessment Report')}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
            <span>{t('diagnosisResult.patient', 'Patient')}: <strong className="text-slate-700 dark:text-slate-300 uppercase tracking-wide">{patientName}</strong></span>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <span>{t('diagnosisResult.generatedOn', 'Generated on')}: {formatDateTime(reportTime)}</span>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            className="btn-secondary gap-2 bg-white hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700 h-10 px-4 transition-all"
          >
            <FileText className="h-4 w-4 text-slate-500" />
            <span className="font-semibold">
              {downloadingReport
                ? t('diagnosisResult.generatingPdf', 'Generating PDF...')
                : t('diagnosisResult.downloadPdf', 'Download PDF Report')}
            </span>
          </button>
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

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-[#070b15] dark:ring-slate-800/60">
        <div className="grid lg:grid-cols-5">
          <article className={`relative overflow-hidden px-5 py-8 text-white sm:px-8 md:py-14 lg:col-span-3 ${getRiskGradient(certaintyPercent)}`}>
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            <img src="/images/disease.png" alt="Disease illustration" className="absolute -right-10 top-0 hidden h-full w-auto opacity-[0.15] object-cover mix-blend-luminosity sm:block" />

            <div className="relative z-10 flex h-full flex-col justify-center">
              <span className="mb-4 flex items-center gap-1.5 w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-widest text-white backdrop-blur-md shadow-sm border border-white/10">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('diagnosisResult.diagnosticOutput', 'Diagnostic Output')}
              </span>
              <h2 className="break-words text-3xl font-black uppercase leading-tight drop-shadow-sm sm:text-4xl md:text-5xl">{primaryHeadline}</h2>
              {suspectedType?.type ? (
                <div className="mt-4 w-fit max-w-md rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-white">
                    <Dna className="h-4 w-4 shrink-0" />
                    <span className="uppercase tracking-wide">{t('diagnosisResult.suspectedType', 'Suspected type')}:</span>
                    <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-black">
                      {tExact(t(`diagnosisResult.type.${getTypeLabelKey(suspectedType.type)}`, suspectedType.type))}
                      {suspectedType.type !== 'Undetermined' && Number.isFinite(Number(suspectedType.certainty)) ? ` · ${Math.round(Number(suspectedType.certainty) * 100)}%` : ''}
                    </span>
                  </p>
                  {suspectedType.note ? (
                    <p className="mt-1.5 text-xs leading-relaxed text-white/85">{tExact(String(suspectedType.note))}</p>
                  ) : null}
                  {Array.isArray(suspectedType.candidates) && suspectedType.candidates.length ? (
                    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-white/90">
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
              <p className="mt-4 max-w-md text-base font-medium leading-relaxed text-white/95 drop-shadow-sm sm:text-lg">
                {t('diagnosisResult.probabilityBase', 'Based on comprehensive clinical data, the inference engine calculates a ')}<strong className="font-extrabold text-white">{certaintyPercent >= 85 ? t('diagnosisResult.probability.veryHigh', 'very high probability') : certaintyPercent >= 70 ? t('diagnosisResult.probability.high', 'high probability') : certaintyPercent >= 45 ? t('diagnosisResult.probability.moderate', 'moderate probability') : t('diagnosisResult.probability.low', 'low probability')}</strong>{t('diagnosisResult.probabilityOf', ' of this diagnosis.')}
              </p>
              {result?.context_note ? (
                <p className="mt-3 flex max-w-md items-start gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold leading-relaxed text-white/95 backdrop-blur-sm">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{tExact(String(result.context_note))}</span>
                </p>
              ) : null}
            </div>
          </article>

          <article className="relative flex flex-col items-center justify-center bg-slate-50 px-5 py-8 dark:bg-[#0a0f1c] sm:px-8 sm:py-10 lg:col-span-2">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/5"></div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-8 mt-2">{t('diagnosisResult.overallScore', 'Screening Confidence')}</p>

            <div className="relative flex items-center justify-center">
              <CertaintyRing percent={certaintyPercent} size={180} stroke={14} />
              <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-md">
                <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">{certaintyPercent}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">/ 100</span>
              </div>
            </div>

            <div className="mt-8 text-center bg-white dark:bg-slate-900/50 rounded-2xl py-3 px-6 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 max-w-[240px]">
              <p className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                {tExact(confidenceMeta.title)}
              </p>
            </div>
          </article>
        </div>
      </div>

      <SurfaceSection title={t('diagnosisResult.actionableRecommendations', 'What you should do next')} icon={ClipboardList}>
        {recommendations.length ? (
          <ol className="divide-y divide-slate-100 dark:divide-slate-800">
            {recommendations.map((item, index) => {
              const isUrgent = item.urgency === 'urgent' || item.urgency === 'emergency'
              return (
                <li
                  key={`${item.text}-${index}`}
                  className="flex items-start gap-3 py-3.5"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-black text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                    {index + 1}
                  </span>
                  <p className="flex-1 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
                    {tExact(item.text)}
                  </p>
                  {isUrgent ? (
                    <span className="mt-0.5 shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-rose-600 ring-1 ring-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-900/50">
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
            <p className="text-base font-medium text-slate-600 dark:text-slate-400">
              {tExact(result.recommendation) || t('diagnosisResult.noSpecificRecommendations', 'No specific recommendations were generated. Please consult with a physician.')}
            </p>
          </div>
        )}
        {showPrevention && preventionContent ? (
          <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/15 sm:p-5">
            <h4 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              {preventionContent.title}
            </h4>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
              {preventionContent.intro}
            </p>
            {preventionContent.listIntro ? (
              <p className="mt-3 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
                {preventionContent.listIntro}
              </p>
            ) : null}
            <ul className="mt-2 space-y-2.5">
              {preventionContent.items.map((item) => (
                <li key={item.lead} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  <span>
                    <strong className="font-bold text-slate-900 dark:text-slate-100">{item.lead}</strong>{' '}
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
            {preventionContent.note ? (
              <p className="mt-3 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
                {preventionContent.note}
              </p>
            ) : null}
          </div>
        ) : null}
      </SurfaceSection>

      <div className="flex items-center gap-3 pt-6 pb-2">
        <Stethoscope className="h-6 w-6 text-slate-400" />
        <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">{t('diagnosisResult.clinicalEvidence', 'The evidence behind this result')}</h3>
      </div>

      <div className="mt-3 grid min-w-0 gap-3">
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

            <div className="mt-3 rounded-lg bg-white p-3 dark:bg-slate-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('diagnosisResult.evidenceCompleteness', 'Evidence Completeness')}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {t('diagnosisResult.availableLabs', 'available labs:')} {(evidenceCompleteness?.available_labs || []).map(l => tExact(toReadableLabel(l))).join(', ') || t('diagnosisResult.none', 'none')}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {t('diagnosisResult.missing', 'missing:')} {(evidenceCompleteness?.missing_recommended_labs || missingLabs).map(l => tExact(toReadableLabel(l))).join(', ') || t('diagnosisResult.none', 'none')}
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
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('diagnosisResult.knownSymptoms', 'Known symptoms includes:')}</p>
                <ul className="mt-3 space-y-2.5">
                  {matchedSymptoms.map((symptom) => {
                    const guideKey = getSymptomGuideKey(symptom)
                    const guide = guideKey ? t(`diagnosisResult.symptomGuide.items.${guideKey}`, null) : null
                    return (
                      <li key={symptom} className="flex items-start gap-2 text-sm text-slate-800 dark:text-slate-100">
                        <span className="mt-0.5 text-slate-400 dark:text-slate-600">•</span>
                        <div className="min-w-0">
                          <p className="font-semibold leading-snug">
                            {tExact(symptom)}
                            {guide && guide.term ? (
                              <span className="ml-1.5 text-xs font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-400">{String(guide.term)}</span>
                            ) : null}
                          </p>
                          {guide && guide.meaning ? (
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{String(guide.meaning)}</p>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-4 pt-3 text-sm text-slate-700 dark:text-slate-300">
                  {t('diagnosisResult.symptomAlign', "The patient's reported symptoms align with the matched diabetes pattern shown by the inference engine.")}
                </p>
              </div>
            ) : (
              <p className="text-base text-slate-600 dark:text-slate-300">{t('diagnosisResult.noSymptom', 'No prominent symptom pattern was selected.')}</p>
            )}
          </SurfaceSection>
        </article>

        <article>
          <SurfaceSection title={t('diagnosisResult.riskFactors', 'Risk Factors')} icon={Zap}>
            {matchedRiskFactors.length ? (
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('diagnosisResult.knownHistory', 'Known history includes:')}</p>
                <ul className="mt-3 space-y-2">
                  {matchedRiskFactors.map((risk) => (
                    <li key={risk} className="text-sm text-slate-800 dark:text-slate-100 flex items-start gap-2">
                      <span className="text-slate-400 dark:text-slate-600 mt-0.5">•</span>
                      <span>{tExact(risk)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-base text-slate-600 dark:text-slate-300">{t('diagnosisResult.noRisk', 'No risk factors were flagged in this submission.')}</p>
            )}
          </SurfaceSection>
        </article>
      </div>

      <ConditionEducationPanel result={result} />

      <TechnicalDetailsSection>
      <div className="grid gap-3 xl:grid-cols-2">
        <SurfaceSection title={t('diagnosisResult.reasoningKeyRules', 'Reasoning & Key Rules')} icon={ShieldCheck}>
          {sortedRules.length ? (
            <ol className="space-y-2">
              {sortedRules.slice(0, 6).map((rule, index) => (
                <li
                  key={rule.id || `${rule.code || 'rule'}-${index}`}
                  className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900"
                >
                  <p className="text-[1.02rem] leading-snug text-slate-900 dark:text-slate-100">
                    <span className="font-extrabold">{index + 1}. {tExact(rule.name) || t('diagnosisResult.matchedRule', 'Matched Rule')}:</span>{' '}
                    {tExact(rule.description) || t('diagnosisResult.ruleConditionMatched', 'Rule condition matched.')}{' '}
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {t('diagnosisResult.contribution', 'Contribution')} +{formatCertaintyContribution(rule)}
                    </span>
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-base text-slate-600 dark:text-slate-300">{t('diagnosisResult.noDetailedRule', 'No detailed rule reasoning is available for this run.')}</p>
          )}
        </SurfaceSection>

        <SurfaceSection title={t('diagnosisResult.diagnosticReasoning', 'Diagnostic Reasoning')} icon={Beaker}>
          <div className="space-y-2 text-[1.05rem] leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              {t('diagnosisResult.diagnosticReasoningP1', 'The system compares this assessment against structured diabetes rules from symptom, laboratory, and risk-factor evidence.')}
            </p>
            <p>
              {t('diagnosisResult.diagnosticReasoningP2', 'Confidence is calculated from the strength and priority of matched rules, then adjusted by evidence completeness.')}
            </p>
            <p>
              {t('diagnosisResult.diagnosticReasoningP3', 'This output is a decision-support summary and should be reviewed with a qualified healthcare professional.')}
            </p>
          </div>
        </SurfaceSection>
      </div>

      {result?.fact_preparation_trace?.length ? (
        <SurfaceSection title={t('diagnosisResult.factPreparation', 'Fact Preparation')} icon={FlaskConical}>
        <div className="table-wrap border-0">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-700">
                  <th className="px-2 py-2">{t('diagnosisResult.factKey', 'Fact Key')}</th>
                  <th className="px-2 py-2">{t('diagnosisResult.source', 'Source')}</th>
                  <th className="px-2 py-2">{t('diagnosisResult.processedValue', 'Processed Value')}</th>
                </tr>
              </thead>
              <tbody>
                {result.fact_preparation_trace.map((row, index) => (
                  <tr key={`${row.fact_key || 'fact'}-${index}`} className="dark:text-slate-800">
                    <td className="px-2 py-2 font-medium text-slate-800 dark:text-slate-100">{toReadableLabel(row.fact_key)}</td>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{row.source_path || 'n/a'}</td>
                    <td className="px-2 py-2 text-slate-800 dark:text-slate-100">{String(row.processed_value ?? 'n/a')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceSection>
      ) : null}
      </TechnicalDetailsSection>

      <div className="rounded-xl bg-white px-4 py-3 dark:bg-[#050912]">
        <div className="flex items-start gap-2">
          <Activity className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('diagnosisResult.savedResultActive', 'Saved result snapshot is active for this account. Start a new assessment to replace it.')}
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
            Back
          </button>
          <button type="button" className="btn-primary gap-1.5" onClick={() => setShowRestartConfirm(true)}>
            <RotateCcw className="h-4 w-4" />
            {t('diagnosisResult.restartAssessment', 'Restart Assessment')}
          </button>
        </div>
      </div>
    </div>
  )
}
