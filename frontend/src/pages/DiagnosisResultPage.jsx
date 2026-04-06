import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  Beaker,
  ClipboardList,
  FlaskConical,
  ShieldCheck,
  Droplet,
  TestTube,
  Heart,
  Zap,
  RotateCcw,
  Printer,
  FileText,
  Stethoscope,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { EmptyState, StatusBadge, ConfirmDialog } from '@/components/ui'
import { readDiagnosisResultSnapshot, saveDiagnosisResultSnapshot } from '@/lib/diagnosis-result-storage'
import { useAuth } from '@/contexts/AuthContext'

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
    <div className="w-[150px] shrink-0">
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
    <div className="rounded-lg bg-white p-3 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />}
          <p className="text-[1.05rem] font-bold leading-snug text-slate-900 dark:text-slate-100">{title}</p>
        </div>
        <StatusBadge tone={status.tone} size="sm">{status.label}</StatusBadge>
      </div>

      <p className="mt-2 text-[2.2rem] font-extrabold leading-none text-slate-900 dark:text-slate-100">{valueLabel}</p>

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
  const location = useLocation()
  const navigate = useNavigate()
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loadingRemote, setLoadingRemote] = useState(false)
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
    return <div className="text-sm text-slate-500">Loading diagnosis result...</div>
  }

  if (!snapshot?.result) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="No assessment result found"
          description={loadError || 'Run an assessment first, then the result report will appear here.'}
        />
        <div>
          <Link to="/diagnosis" className="btn-secondary gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to Assessment
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
  const triggeredRules = Array.isArray(result?.triggered_rules) ? result.triggered_rules : []
  const sortedRules = [...triggeredRules].sort(
    (left, right) => Number(right?.effective_certainty ?? right?.certainty_factor ?? 0) - Number(left?.effective_certainty ?? left?.certainty_factor ?? 0)
  )

  const explanation = result?.explanation && typeof result.explanation === 'object' ? result.explanation : {}
  const keyFindings = explanation?.key_findings && typeof explanation.key_findings === 'object' ? explanation.key_findings : {}
  const keyLabs = keyFindings?.key_labs && typeof keyFindings.key_labs === 'object' ? keyFindings.key_labs : {}
  const evidenceCompleteness = result?.evidence_completeness || keyFindings?.evidence_completeness || {}
  const missingLabs = Array.isArray(result?.missing_inputs) ? result.missing_inputs : []

  const hba1cValue = keyLabs.hba1c
  const fastingValue = keyLabs.fasting_glucose ?? keyLabs.fasting_plasma_glucose
  const hba1cStatus = getLabStatus('hba1c', hba1cValue)
  const fastingStatus = getLabStatus('fasting_glucose', fastingValue)
  const hba1cPointer = getScalePercent('hba1c', hba1cValue)
  const fastingPointer = getScalePercent('fasting', fastingValue)

  const primaryHeadline = getPrimaryHeadline(result, certaintyPercent).toUpperCase()
  const patientName = context?.patient_name || 'Current patient'
  const reportTime = result?.created_at || snapshot?.savedAt

  const handleRestartConfirm = () => {
    localStorage.removeItem('diagnosisResultSnapshot')
    setShowRestartConfirm(false)
    navigate('/diagnosis', { state: { keepData: true } })
  }

  return (
    <div className="pb-10 max-w-6xl mx-auto space-y-6">

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Medical Assessment Report
          </h1>
          <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-500">
            <span>Patient: <strong className="text-slate-700 dark:text-slate-300 uppercase tracking-wide">{patientName}</strong></span>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <span>Generated on: {formatDateTime(reportTime)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.print()} className="btn-secondary gap-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700 h-10 px-4 transition-all">
            <Printer className="h-4 w-4 text-slate-500" />
            <span className="font-semibold">Print PDF</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showRestartConfirm}
        title="Restart Assessment?"
        description="This will clear the current assessment result and take you back to start a new assessment. Are you sure?"
        confirmLabel="Restart"
        cancelLabel="Cancel"
        loading={false}
        onCancel={() => setShowRestartConfirm(false)}
        onConfirm={handleRestartConfirm}
      />

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-[#070b15] dark:ring-slate-800/60">
        <div className="grid lg:grid-cols-5">
          <article className={`relative lg:col-span-3 overflow-hidden ${getRiskGradient(certaintyPercent)} px-8 py-10 md:py-14 text-white`}>
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            <img src="/images/disease.png" alt="Disease illustration" className="absolute -right-10 top-0 h-full w-auto opacity-[0.15] object-cover mix-blend-luminosity" />
            
            <div className="relative z-10 flex h-full flex-col justify-center">
              <span className="mb-4 flex items-center gap-1.5 w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-widest text-white backdrop-blur-md shadow-sm border border-white/10">
                <ShieldCheck className="h-3.5 w-3.5" />
                Diagnostic Output
              </span>
              <h2 className="text-4xl md:text-5xl font-black uppercase leading-tight drop-shadow-sm">{primaryHeadline}</h2>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-white/95 font-medium drop-shadow-sm">
                Based on comprehensive clinical data, the inference engine calculates a <strong className="font-extrabold text-white">{certaintyPercent >= 85 ? 'very high probability' : certaintyPercent >= 70 ? 'high probability' : certaintyPercent >= 45 ? 'moderate probability' : 'low probability'}</strong> of this diagnosis.
              </p>
            </div>
          </article>

          <article className="lg:col-span-2 bg-slate-50 dark:bg-[#0a0f1c] px-8 py-10 flex flex-col items-center justify-center relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/5"></div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-8 mt-2">Overall Score</p>
            
            <div className="relative flex items-center justify-center">
              <CertaintyRing percent={certaintyPercent} size={180} stroke={14} />
              <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-md">
                 <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">{certaintyPercent}</span>
                 <span className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">/ 100</span>
              </div>
            </div>
            
            <div className="mt-8 text-center bg-white dark:bg-slate-900/50 rounded-2xl py-3 px-6 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 max-w-[240px]">
              <p className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                {confidenceMeta.title}
              </p>
            </div>
          </article>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 pb-2">
        <Stethoscope className="h-6 w-6 text-slate-400" />
        <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">Clinical Evidence</h3>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-12">
        <article className="xl:col-span-6">
            <SurfaceSection title="Key Diagnostic Indicators" icon={FlaskConical}>
            <div className="grid gap-2 sm:grid-cols-2">
              <LabIndicatorCard
                title="HbA1c Level Indicator"
                valueLabel={formatLabValue('hba1c', hba1cValue)}
                status={hba1cStatus}
                subtitle="A key marker of long-term glucose control."
                pointerPercent={hba1cPointer}
                ticks={['<5.7%', '5.7-6.4%', '>=6.5%']}
                icon={TestTube}
              />
              <LabIndicatorCard
                title="Fasting Glucose Indicator"
                valueLabel={formatLabValue('fasting', fastingValue)}
                status={fastingStatus}
                subtitle="Indicates glucose level after an 8-hour fast."
                pointerPercent={fastingPointer}
                ticks={['<100', '100-125', '>=126']}
                icon={Droplet}
              />
            </div>

            <div className="mt-3 rounded-lg bg-white p-3 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">Evidence Completeness</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    available labs: {(evidenceCompleteness?.available_labs || []).map(toReadableLabel).join(', ') || 'none'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    missing: {(evidenceCompleteness?.missing_recommended_labs || missingLabs).map(toReadableLabel).join(', ') || 'none'}
                  </p>
                </div>
                <EvidenceRangeGauge score={evidenceCompleteness?.score || 0} level={evidenceCompleteness?.level || 'low'} />
              </div>
            </div>
          </SurfaceSection>
        </article>

        <article className="xl:col-span-4">
            <SurfaceSection title="Relevant History & Symptoms" icon={Heart}>
            {matchedSymptoms.length ? (
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Known symptoms includes:</p>
                <ul className="mt-3 space-y-2">
                  {matchedSymptoms.map((symptom) => (
                    <li key={symptom} className="text-sm text-slate-800 dark:text-slate-100 flex items-start gap-2">
                      <span className="text-slate-400 dark:text-slate-600 mt-0.5">•</span>
                      <span>{symptom}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 pt-3 text-sm text-slate-700 dark:text-slate-300">
                  The patient&apos;s reported symptoms align with the matched diabetes pattern shown by the inference engine.
                </p>
              </div>
            ) : (
              <p className="text-base text-slate-600 dark:text-slate-300">No prominent symptom pattern was selected.</p>
            )}
          </SurfaceSection>
        </article>

        <article className="xl:col-span-2">
            <SurfaceSection title="Risk Factors" icon={Zap}>
            {matchedRiskFactors.length ? (
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Known history includes:</p>
                <ul className="mt-3 space-y-2">
                  {matchedRiskFactors.map((risk) => (
                    <li key={risk} className="text-sm text-slate-800 dark:text-slate-100 flex items-start gap-2">
                      <span className="text-slate-400 dark:text-slate-600 mt-0.5">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-base text-slate-600 dark:text-slate-300">No risk factors were flagged in this submission.</p>
            )}
          </SurfaceSection>
        </article>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <SurfaceSection title="Reasoning & Key Rules" icon={ShieldCheck}>
          {sortedRules.length ? (
            <ol className="space-y-2">
              {sortedRules.slice(0, 6).map((rule, index) => (
                <li
                  key={rule.id || `${rule.code || 'rule'}-${index}`}
                  className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900"
                >
                  <p className="text-[1.02rem] leading-snug text-slate-900 dark:text-slate-100">
                    <span className="font-extrabold">{index + 1}. {rule.name || 'Matched Rule'}:</span>{' '}
                    {rule.description || 'Rule condition matched.'}{' '}
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Contribution +{formatCertaintyContribution(rule)}
                    </span>
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-base text-slate-600 dark:text-slate-300">No detailed rule reasoning is available for this run.</p>
          )}
        </SurfaceSection>

        <SurfaceSection title="Diagnostic Reasoning" icon={Beaker}>
          <div className="space-y-2 text-[1.05rem] leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              The system compares this assessment against structured diabetes rules from symptom, laboratory, and risk-factor evidence.
            </p>
            <p>
              Confidence is calculated from the strength and priority of matched rules, then adjusted by evidence completeness.
            </p>
            <p>
              This output is a decision-support summary and should be reviewed with a qualified healthcare professional.
            </p>
          </div>
        </SurfaceSection>
      </div>

      <SurfaceSection title="Actionable Recommendations" icon={ClipboardList}>
        {recommendations.length ? (
          <div className="space-y-3">
            {recommendations.map((item, index) => (
              <div
                key={`${item.text}-${index}`}
                className="group flex flex-col sm:flex-row items-start gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-[#0a0f1c]"
              >
                <div className="shrink-0 rounded-full bg-slate-50 p-3 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <Activity className="h-5 w-5 text-cyan-600 dark:text-cyan-500 flex-shrink-0" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-1.5">
                    <StatusBadge tone={getUrgencyTone(item.urgency)} size="sm">
                      {toReadableLabel(item.urgency || 'routine')} Priority
                    </StatusBadge>
                    {item.source ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Rule: {String(item.source).replace(/^rule:/, '')}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-base font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <ClipboardList className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-base font-medium text-slate-600 dark:text-slate-400">
              {result.recommendation || 'No specific recommendations were generated. Please consult with a physician.'}
            </p>
          </div>
        )}
      </SurfaceSection>

      {result?.fact_preparation_trace?.length ? (
        <SurfaceSection title="Fact Preparation" icon={FlaskConical}>
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-700">
                  <th className="px-2 py-2">Fact Key</th>
                  <th className="px-2 py-2">Source</th>
                  <th className="px-2 py-2">Processed Value</th>
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

      <div className="rounded-xl bg-white px-4 py-3 dark:bg-[#050912]">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Saved result snapshot is active for this account. Start a new assessment to replace it.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
        <span className="text-xs text-slate-500">
          View your assessment results and recommendations above.
        </span>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary gap-1.5" onClick={() => navigate('/diagnosis')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button type="button" className="btn-primary gap-1.5" onClick={() => setShowRestartConfirm(true)}>
            <RotateCcw className="h-4 w-4" />
            Restart Assessment
          </button>
        </div>
      </div>
    </div>
  )
}
