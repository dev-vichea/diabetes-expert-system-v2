import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FlaskConical,
  HeartPulse,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  Activity,
  AlertTriangle,
  Scale,
  Stethoscope,
  TestTube2,
  ClipboardList,
  CheckCircle2,
  PenTool,
  PlusCircle,
  Building2,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import {
  AppSelect,
  ConfirmDialog,
  ErrorAlert,
  LoadingState,
  StatusBadge,
} from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { saveDiagnosisResultSnapshot } from '@/lib/diagnosis-result-storage'
import { InterviewFlow } from '@/components/assessment/InterviewFlow'
import {
  INTERVIEW_NODES, INSIGHT_BANNERS,
  SYMPTOM_ALL_FIELDS, SAFETY_FIELDS, RISK_FIELDS,
  FIELD_FALLBACKS, fieldLabelKey, getFactLabel, nodeFields,
  firstOpenNode, interviewProgress, interviewPosition, applicableNodes,
  buildFactsFromAnswers, buildFieldGroupsFromFacts,
} from '@/components/assessment/interview-flow'

/* ── Constants ────────────────────────── */
/* v4: staff drafts may hold a silently auto-picked patient — discard them so
   the "Which patient?" question is asked explicitly again. */
const DIAGNOSIS_DRAFT_VERSION = 4
const TOTAL_STEPS = 2
const REVIEW_STEP = 2

const DEFAULT_FORM = {
  patient_id: '',
  age: '', bmi: '', waist_circumference: '',
  fasting_glucose: '', hba1c: '', random_plasma_glucose: '', ogtt_2h: '',
  no_labs_available: false,
  frequent_urination: false, excessive_thirst: false, fatigue: false,
  blurred_vision: false, weight_loss: false, slow_healing: false,
  sweating: false, shaking: false, dizziness: false,
  vomiting: false, abdominal_pain: false, nausea: false,
  rapid_breathing: false, unable_to_keep_fluids: false, crisis: false,
  hypo_confusion: false, hypo_palpitations: false, hypo_improves_with_sugar: false,
  tingling_hands_feet: false, frequent_infections: false, acanthosis_nigricans: false,
  extra_symptoms: '',
  sex: '', currently_pregnant: false, pregnancy_stage: '', has_labs: '',
  family_history: false, obesity: false, hypertension: false,
  sedentary_lifestyle: false, gestational_history: false, smoking: false,
  high_cholesterol: false, pcos_history: false, ethnicity_high_risk: false,
  extra_lab_name: '', extra_lab_value: '',
  show_bmi_calculator: false, weight_kg: '', height_cm: '',
}

const NON_BOOLEAN_FACT_KEYS = new Set([
  'fasting_glucose', 'fasting_plasma_glucose', 'hba1c', 'random_plasma_glucose',
  'ogtt_2h', '2h_ogtt_75g', 'blood_glucose', 'age', 'bmi', 'waist_circumference',
  'weight_kg', 'height_cm', 'sex', 'pregnancy_stage', 'extra_symptoms', 'extra_lab_name', 'extra_lab_value',
])

const DEFAULT_QCM = { age_group: '', bmi_group: '', fasting_group: '', hba1c_group: '', ogtt_group: '' }

/* Patient accounts choose the assessment subject. "self" pre-fills from the
   saved health profile; "other" asks every question about that person. */
const SUBJECT_OPTIONS = [
  {
    id: 'self',
    icon: UserRound,
    labelKey: 'assessment.subject.self', labelFallback: 'Myself',
    descKey: 'assessment.subject.selfDesc', descFallback: 'Pre-fill my details from my saved health profile',
  },
  {
    id: 'other',
    icon: Users,
    labelKey: 'assessment.subject.other', labelFallback: 'Someone else',
    descKey: 'assessment.subject.otherDesc', descFallback: 'Ask me everything — age, weight and health of that person',
  },
]

/* DOB → age in years, or null when the DOB is missing/invalid/implausible. */
function yearsFromDob(dob) {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let ageYears = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) ageYears -= 1
  return ageYears >= 1 && ageYears < 130 ? ageYears : null
}

function getDraftKey(user) {
  const k = user?.id || user?.sub || user?.email || 'guest'
  return `diagnosis-assessment-draft:v${DIAGNOSIS_DRAFT_VERSION}:${String(k)}`
}

/* ================================================================
   REUSABLE COMPONENTS
   ================================================================ */
function TogglePill({ item, active, onToggle }) {
  return (
    <button
      type="button"
      className={cn('toggle-pill assessment-card-enter', active && 'active')}
      onClick={() => onToggle(item.key, !active)}
    >
      <span className="flex-1 text-left">{item.label}</span>
      <span className="pill-check">
        {active ? <Check className="h-3 w-3" /> : null}
      </span>
    </button>
  )
}

function SegmentSelector({ options, value, onChange, renderLabel }) {
  return (
    <div className="segment-group">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={cn('segment-btn', value === opt.id && 'active')}
          onClick={() => onChange(opt)}
        >
          {renderLabel ? renderLabel(opt) : (
            <>
              <div className="text-sm font-semibold">{opt.label}</div>
              {opt.sub ? <div className="mt-0.5 text-[11px] opacity-70">{opt.sub}</div> : null}
            </>
          )}
        </button>
      ))}
    </div>
  )
}

function QSection({ icon, title, sub, children, className }) {
  return (
    <div className={cn('q-section assessment-card-enter', className)}>
      <div className="q-section-title">
        {icon ? <span className="text-lg">{icon}</span> : null}
        {title}
      </div>
      {sub ? <p className="q-section-sub">{sub}</p> : null}
      <div className="mt-4">{children}</div>
    </div>
  )
}

function StepDot({ item, status, onClick, locked }) {
  const { t } = useLanguage()
  const Icon = item.icon
  return (
    <li className="relative z-10 min-w-[9rem] flex-1">
      <button
        type="button"
        onClick={onClick}
        disabled={locked}
        className={cn('w-full transition', locked && 'cursor-not-allowed')}
      >
        <div className="relative flex w-full items-center justify-center">
          <span className={cn(
            'relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-sm transition-all duration-300',
            status === 'done' ? 'border-cyan-500 bg-cyan-500 text-white' :
              status === 'active' ? 'border-cyan-500 bg-white text-cyan-600 assessment-step-dot-active dark:bg-[#070712]' :
                'border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-600 dark:bg-[#070712] dark:text-slate-500',
          )}>
            {status === 'done' ? <Check className="h-5 w-5" strokeWidth={2.5} /> : <Icon className="h-5 w-5" strokeWidth={2.25} />}
          </span>
        </div>
        <div className="mt-2 text-center">
          <h6 className={cn(
            'text-sm font-semibold',
            status === 'done' ? 'text-cyan-700 dark:text-cyan-400' :
              status === 'active' ? 'text-slate-900 dark:text-slate-100' :
                'text-slate-500 dark:text-slate-400',
          )}>{t(`assessment.steps.${item.id === 1 ? 'interview' : 'review'}.title`, item.title)}</h6>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">{t(`assessment.steps.${item.id === 1 ? 'interview' : 'review'}.description`, item.description)}</p>
        </div>
      </button>
    </li>
  )
}

/* ================================================================
   MAIN PAGE
   ================================================================ */
export function DiagnosisPage() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()

  const STEP_ITEMS_CONFIG = [
    { id: 1, title: t('assessment.steps.interview.title', 'Evidence Interview'), description: t('assessment.steps.interview.description', 'One question at a time — adapts to your answers'), icon: HeartPulse },
    { id: 2, title: t('assessment.steps.review.title', 'Lab & Review'), description: t('assessment.steps.review.description', 'Lab results (optional) & submit'), icon: FlaskConical },
  ]

  const AGE_OPTIONS = [
    { id: 'under_18', label: t('assessment.options.age.under18', '< 18'), value: 16 },
    { id: '18_30', label: t('assessment.options.age.age18to30', '18 – 30'), value: 24 },
    { id: '31_45', label: t('assessment.options.age.age31to45', '31 – 45'), value: 38 },
    { id: '46_60', label: t('assessment.options.age.age46to60', '46 – 60'), value: 53 },
    { id: 'over_60', label: t('assessment.options.age.over60', '60 +'), value: 67 },
  ]

  const BMI_OPTIONS = [
    { id: 'underweight', label: t('assessment.options.bmi.underweight', 'Under'), sub: '< 18.5', value: 18.0 },
    { id: 'normal', label: t('assessment.options.bmi.normal', 'Normal'), sub: '18.5 – 24.9', value: 23.0 },
    { id: 'Overweight', label: t('assessment.options.bmi.overweight', 'Over'), sub: '25 – 29.9', value: 28.0 },
    { id: 'obese', label: t('assessment.options.bmi.obese', 'Obese'), sub: '≥ 30', value: 33.0 },
  ]

  const FASTING_OPTIONS = [
    { id: 'normal', label: t('assessment.options.ogtt.normal', 'Normal'), sub: '< 100', value: 95 },
    { id: 'prediabetes', label: t('assessment.options.ogtt.prediabetes', 'Pre-diabetes'), sub: '100 – 125', value: 115 },
    { id: 'diabetes', label: t('assessment.options.ogtt.diabetes', 'Diabetes range'), sub: '126 – 199', value: 140 },
    { id: 'critical', label: t('assessment.options.ogtt.severe', 'Critical'), sub: '≥ 200', value: 260 },
  ]

  const HBA1C_OPTIONS = [
    { id: 'normal', label: t('assessment.options.ogtt.normal', 'Normal'), sub: '< 5.7%', value: 5.2 },
    { id: 'prediabetes', label: t('assessment.options.ogtt.prediabetes', 'Pre-diabetes'), sub: '5.7 – 6.4%', value: 6.0 },
    { id: 'diabetes', label: t('assessment.options.ogtt.diabetes', 'Diabetes'), sub: '≥ 6.5%', value: 6.8 },
    { id: 'critical', label: t('assessment.options.ogtt.severe', 'Severe'), sub: '≥ 10%', value: 10.5 },
  ]

  const OGTT_OPTIONS = [
    { id: 'normal', label: t('assessment.options.ogtt.normal', 'Normal'), sub: '< 140', value: 120 },
    { id: 'prediabetes', label: t('assessment.options.ogtt.prediabetes', 'Pre-diabetes'), sub: '140 – 199', value: 170 },
    { id: 'diabetes', label: t('assessment.options.ogtt.diabetes', 'Diabetes'), sub: '≥ 200', value: 220 },
  ]

  const [dbFacts, setDbFacts] = useState([])
  const [loadingFacts, setLoadingFacts] = useState(false)

  // Fetch active fact catalog from the database (Knowledge Base -> Facts)
  useEffect(() => {
    let cancelled = false
    async function loadFacts() {
      setLoadingFacts(true)
      try {
        const res = await api.get('/facts/', { params: { status: 'active' } })
        const data = getApiData(res)
        if (!cancelled && Array.isArray(data)) {
          setDbFacts(data)
          // Pre-initialize dynamic fact booleans in form state to avoid uncontrolled warnings
          setForm(prev => {
            const next = { ...prev }
            let changed = false
            for (const f of data) {
              if (
                f.key &&
                next[f.key] === undefined &&
                f.category !== 'lab' &&
                f.category !== 'profile' &&
                !NON_BOOLEAN_FACT_KEYS.has(f.key)
              ) {
                next[f.key] = false
                changed = true
              }
            }
            return changed ? next : prev
          })
        }
      } catch (err) {
        console.warn('Unable to load facts from server, using built-in defaults', err)
      } finally {
        if (!cancelled) setLoadingFacts(false)
      }
    }
    loadFacts()
    window.addEventListener('focus', loadFacts)
    return () => {
      cancelled = true
      window.removeEventListener('focus', loadFacts)
    }
  }, [location.key])

  const fieldGroups = useMemo(() => buildFieldGroupsFromFacts(dbFacts), [dbFacts])
  const factsMap = useMemo(() => new Map(dbFacts.map(f => [f.key, f])), [dbFacts])

  const SYMPTOM_PILLS = useMemo(() => {
    const all = [...fieldGroups.symptoms_core, ...fieldGroups.symptoms_other]
    const unique = Array.from(new Set(all))
    return unique.map(key => ({
      key,
      label: getFactLabel(key, factsMap, language, t),
    }))
  }, [fieldGroups, factsMap, language, t])

  const SAFETY_PILLS = useMemo(() => {
    return fieldGroups.warning_signs.map(key => ({
      key,
      label: getFactLabel(key, factsMap, language, t),
    }))
  }, [fieldGroups, factsMap, language, t])

  const RISK_PILLS = useMemo(() => {
    return fieldGroups.risk_factors.map(key => ({
      key,
      label: getFactLabel(key, factsMap, language, t),
    }))
  }, [fieldGroups, factsMap, language, t])

  const TOTAL_STEPS = 3
  const storageKey = useMemo(() => getDraftKey(user), [user?.id, user?.sub, user?.email])

  const [step, setStep] = useState(1)
  const [maxReached, setMaxReached] = useState(1)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [qcm, setQcm] = useState(DEFAULT_QCM)
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [extraLabs, setExtraLabs] = useState([])
  const [showRestart, setShowRestart] = useState(false)
  const [draftReady, setDraftReady] = useState(false)

  const hasHydratedRef = useRef(false)
  const isHydratingRef = useRef(false)
  const handledRestartRef = useRef(null)
  const profilePrefilledRef = useRef(false)

  const userRoles = useMemo(() => new Set(user?.roles || (user?.role ? [user.role] : [])), [user])
  /* Staff accounts (doctor, admin, super_admin, knowledge manager, …) must pick
     the patient they assess; patient accounts assess themselves or someone else. */
  const isPatientAccount = userRoles.size > 0 && [...userRoles].every((role) => String(role).toLowerCase() === 'patient')
  const needsPatient = userRoles.size > 0 && !isPatientAccount
  /* Patient accounts only — "self" prefills from the saved profile, "other" asks every question. */
  /* Patient accounts answer "Who is this assessment for?" as the FIRST
     interview question. null = unanswered (the question is on screen). */
  const [subjectMode, setSubjectMode] = useState(null)
  const selectedPatient = useMemo(
    () => patients.find((p) => String(p.id) === String(form.patient_id)),
    [patients, form.patient_id],
  )

  const hasAnyLab = useMemo(() => {
    if (form.no_labs_available) return false
    if (extraLabs.length) return true
    return [form.fasting_glucose, form.hba1c, form.random_plasma_glucose].some(v => String(v || '').trim() !== '')
  }, [form.no_labs_available, form.fasting_glucose, form.hba1c, form.random_plasma_glucose, extraLabs.length])

  const assessmentMode = hasAnyLab ? 'diagnostic' : 'screening'

  /* ── Evidence-interview state ── */
  const [interviewDone, setInterviewDone] = useState([])
  const [interviewSkipped, setInterviewSkipped] = useState([])
  const [cursorOverride, setCursorOverride] = useState(null)
  /* Exact order the question cards were shown in — Back retraces THIS visit
     path one step at a time (… → 3 → 2 → 1) instead of hopping around. */
  const [interviewTrail, setInterviewTrail] = useState([])

  /* Settled node ids ride along so grids can shrink by "already asked by a
     probe" (node id) instead of by form values. */
  const interviewCtx = useMemo(
    () => ({ form, needsPatient, subject: subjectMode, doneIds: interviewDone, skippedIds: interviewSkipped, fieldGroups }),
    [form, needsPatient, subjectMode, interviewDone, interviewSkipped, fieldGroups],
  )
  const autoCursor = useMemo(
    () => firstOpenNode(INTERVIEW_NODES, interviewCtx, interviewDone, interviewSkipped),
    [interviewCtx, interviewDone, interviewSkipped],
  )
  const interviewPct = useMemo(
    () => interviewProgress(INTERVIEW_NODES, interviewCtx, interviewDone, interviewSkipped),
    [interviewCtx, interviewDone, interviewSkipped],
  )
  const applicableOrder = useMemo(() => applicableNodes(INTERVIEW_NODES, interviewCtx), [interviewCtx])
  const applicableCount = applicableOrder.length
  const currentNodeId = cursorOverride ?? autoCursor

  /* Record every card the user actually saw so Back can walk the visit path
     in reverse. The last-entry guard keeps it idempotent under StrictMode. */
  useEffect(() => {
    if (!currentNodeId) return
    setInterviewTrail((trail) => (trail[trail.length - 1] === currentNodeId ? trail : [...trail, currentNodeId]))
  }, [currentNodeId])
  const currentNode = useMemo(
    () => INTERVIEW_NODES.find((n) => n.id === currentNodeId) || null,
    [currentNodeId],
  )
  const activeBanners = useMemo(() => INSIGHT_BANNERS.filter((b) => b.when(form, interviewCtx)), [form, interviewCtx])

  const isDraftPristine = useMemo(() => {
    const hasFormChanges = Object.keys(DEFAULT_FORM).some(k => k !== 'patient_id' && form[k] !== DEFAULT_FORM[k])
    const hasDynamicChanges = dbFacts.some(f => Boolean(form[f.key]))
    const hasQcmChanges = Object.values(qcm).some(Boolean)
    return !result && step === 1 && maxReached === 1 && extraLabs.length === 0 && !hasFormChanges && !hasDynamicChanges && !hasQcmChanges && interviewDone.length === 0 && interviewSkipped.length === 0
  }, [extraLabs.length, form, maxReached, qcm, result, step, interviewDone.length, interviewSkipped.length, dbFacts])

  const selectedSymptoms = useMemo(
    () => SYMPTOM_PILLS.filter(i => form[i.key]).map(i => i.label),
    [form, SYMPTOM_PILLS],
  )
  const selectedRisks = useMemo(
    () => RISK_PILLS.filter(i => form[i.key]).map(i => i.label),
    [form, RISK_PILLS],
  )
  const customSymptoms = useMemo(
    () => form.extra_symptoms.split(/[,;\n]/).map(s => s.trim()).filter(Boolean),
    [form.extra_symptoms],
  )

  const hasHypoTrigger = Boolean(form.sweating || form.shaking || form.dizziness)
  const highGlucose = useMemo(() => {
    const f = Number(form.fasting_glucose), r = Number(form.random_plasma_glucose), h = Number(form.hba1c)
    return (!Number.isNaN(f) && f >= 250) || (!Number.isNaN(r) && r >= 200) || (!Number.isNaN(h) && h >= 10)
  }, [form.fasting_glucose, form.random_plasma_glucose, form.hba1c])
  const hasUrgentTrigger = Boolean(form.vomiting || form.abdominal_pain || highGlucose)
  const flowPercent = result ? 100 : step === REVIEW_STEP ? 100 : interviewPct

  const restartRequested = Boolean(location.state?.requestRestart)
  const restartRequestId = location.state?.restartRequestId || null
  const forceRestart = Boolean(location.state?.forceRestart)
  const keepData = Boolean(location.state?.keepData)

  /* ── Draft persistence ─────────────────────────────── */
  useEffect(() => {
    isHydratingRef.current = true
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return
      const p = JSON.parse(raw)
      if (!p || p.version !== DIAGNOSIS_DRAFT_VERSION) return
      if (p.form) setForm(prev => ({ ...prev, ...p.form }))
      if (p.qcm) setQcm(prev => ({ ...prev, ...p.qcm }))
      if (Array.isArray(p.extraLabs)) setExtraLabs(p.extraLabs)
      if (Array.isArray(p.interviewDone)) setInterviewDone(p.interviewDone)
      if (Array.isArray(p.interviewSkipped)) setInterviewSkipped(p.interviewSkipped)
      if (typeof p.step === 'number') setStep(Math.max(1, Math.min(REVIEW_STEP, p.step)))
      if (typeof p.maxReachedStep === 'number') setMaxReached(Math.max(1, Math.min(REVIEW_STEP, p.maxReachedStep)))
      if (p.result) setResult(p.result)
      if (p.subject === 'self' || p.subject === 'other') setSubjectMode(p.subject)
    } catch { /* ignore */ } finally {
      isHydratingRef.current = false
      hasHydratedRef.current = true
      setDraftReady(true)
    }
  }, [storageKey])

  useEffect(() => {
    if (!draftReady || !hasHydratedRef.current || isHydratingRef.current) return
    if (isDraftPristine) { window.localStorage.removeItem(storageKey); return }
    window.localStorage.setItem(storageKey, JSON.stringify({
      version: DIAGNOSIS_DRAFT_VERSION, step, maxReachedStep: maxReached,
      form, qcm, extraLabs, result, interviewDone, interviewSkipped, subject: subjectMode, savedAt: new Date().toISOString(),
    }))
  }, [storageKey, step, maxReached, form, qcm, extraLabs, result, interviewDone, interviewSkipped, subjectMode, draftReady, isDraftPristine])

  /* ── Profile prefill (patient, "for myself"): fill empty fields from the saved health profile ── */
  const profileDataRef = useRef(null)
  useEffect(() => {
    if (!draftReady || profilePrefilledRef.current) return
    if (needsPatient || !user?.patient_id) return
    if (subjectMode !== 'self') return
    profilePrefilledRef.current = true
    let cancelled = false

    async function prefillFromProfile() {
      try {
        const response = await api.get('/patients/mine')
        const profileData = getApiData(response)
        if (!profileData || cancelled) return
        profileDataRef.current = profileData

        applyProfileAnswers(profileData)
      } catch {
        /* Profile prefill is best-effort — never block the assessment form. */
      }
    }

    prefillFromProfile()
    return () => { cancelled = true }
  }, [draftReady, needsPatient, user?.patient_id, subjectMode])

  function applyProfileAnswers(profileData) {
    setForm((prev) => applyProfileToForm(prev, profileData))

    // Questions answered by the profile are marked done explicitly (never via
    // autoDone — that would advance mid-typing while the user edits them).
    if (yearsFromDob(profileData.date_of_birth)) markNodeDone('age')
    // Derive BMI (+ its QCM group) from the prefilled body metrics.
    if (profileData.height_cm && profileData.weight_kg) {
      calculateBmi(profileData.weight_kg, profileData.height_cm)
      markNodeDone('body')
    }
  }

  /* ── "Myself / Someone else" switch ──
     Profile-derived answers belong to the subject: clearing them when the
     assessment is for someone else (age, weight, sex… are asked again),
     re-applying them when switching back to "myself". */
  const subjectInitRef = useRef(false)
  useEffect(() => {
    if (!draftReady || needsPatient) { subjectInitRef.current = true; return }
    if (!subjectInitRef.current) { subjectInitRef.current = true; return }
    if (subjectMode === 'other') {
      setForm((prev) => ({
        ...prev,
        age: '', sex: '', height_cm: '', weight_kg: '', bmi: '', waist_circumference: '',
        family_history: false, hypertension: false, high_cholesterol: false,
        smoking: false, sedentary_lifestyle: false,
      }))
      setQcm((prev) => ({ ...prev, age_group: '', bmi_group: '' }))
      setInterviewDone((prev) => prev.filter((id) => id !== 'age' && id !== 'body'))
    } else if (profileDataRef.current) {
      applyProfileAnswers(profileDataRef.current)
    }
  }, [draftReady, needsPatient, subjectMode])

  /* ── Doctor mode: prefill empty answers from the selected patient's record ── */
  const prefilledPatientRef = useRef(null)
  useEffect(() => {
    if (!draftReady || !needsPatient || !selectedPatient) return
    if (prefilledPatientRef.current === selectedPatient.id) return
    prefilledPatientRef.current = selectedPatient.id
    setForm((prev) => (prev.patient_id === String(selectedPatient.id)
      ? applyProfileToForm(prev, {
        date_of_birth: selectedPatient.date_of_birth,
        gender: selectedPatient.gender,
        height_cm: selectedPatient.height_cm,
        weight_kg: selectedPatient.weight_kg,
        waist_circumference: selectedPatient.waist_circumference,
        family_history: selectedPatient.family_history,
        hypertension: selectedPatient.hypertension,
        high_cholesterol: selectedPatient.high_cholesterol,
        smoking: selectedPatient.smoking,
        sedentary_lifestyle: selectedPatient.sedentary_lifestyle,
      })
      : prev))
    if (yearsFromDob(selectedPatient.date_of_birth)) markNodeDone('age')
    if (selectedPatient.height_cm && selectedPatient.weight_kg) {
      calculateBmi(selectedPatient.weight_kg, selectedPatient.height_cm)
      markNodeDone('body')
    }
  }, [draftReady, needsPatient, selectedPatient?.id])

  useEffect(() => {
    if (!draftReady || (!restartRequested && !forceRestart && !keepData)) return
    if (keepData) {
      setResult(null); setStep(1);
      navigate({ pathname: '/diagnosis', search: location.search }, { replace: true, state: null })
      return
    }
    /* forceRestart / New Assessment drop the patient too — strip any
       ?patient_id= from the URL so it can't silently re-select the old one. */
    if (forceRestart) { startNew({ preservePatient: false }); navigate({ pathname: '/diagnosis' }, { replace: true, state: null }); return }
    if (!restartRequestId) return
    if (handledRestartRef.current === restartRequestId) return
    handledRestartRef.current = restartRequestId
    if (isDraftPristine) startNew(); else setShowRestart(true)
    navigate({ pathname: '/diagnosis' }, { replace: true, state: null })
  }, [draftReady, forceRestart, isDraftPristine, location.search, navigate, restartRequestId, restartRequested])

  useEffect(() => { if (needsPatient) loadPatients() }, [needsPatient])
  useEffect(() => {
    if (!needsPatient) return
    const pid = new URLSearchParams(location.search).get('patient_id')
    if (pid) setForm(p => ({ ...p, patient_id: pid }))
  }, [location.search, needsPatient])

  /* ── Helpers ───────────────────────────────────────── */
  async function loadPatients() {
    setLoadingPatients(true); setError('')
    try {
      const res = await api.get('/patients/?limit=200')
      setPatients(getApiData(res) || [])
      /* Staff choose the patient themselves — never auto-pick one here.
         patient_id may only come from the draft, an explicit ?patient_id=
         URL param, or the "Who is this assessment for?" interview node. */
    } catch (e) { setError(getApiErrorMessage(e, t('assessment.errors.loadPatients'))) }
    finally { setLoadingPatients(false) }
  }

  function up(field, value) { setForm(p => ({ ...p, [field]: value })) }
  function pickSegment(qKey, opt, field) { setQcm(p => ({ ...p, [qKey]: opt.id })); setForm(p => ({ ...p, [field]: String(opt.value) })) }
  function setCustom(qKey, field, value) { setQcm(p => ({ ...p, [qKey]: 'custom' })); setForm(p => ({ ...p, [field]: value })) }

  /* Fill EMPTY answers only — drafts and manual edits are never overwritten. */
  function applyProfileToForm(prev, profileData) {
    const next = { ...prev }
    const ageYears = yearsFromDob(profileData.date_of_birth)
    if (ageYears && !next.age) next.age = String(ageYears)
    if (!next.sex && (profileData.gender === 'male' || profileData.gender === 'female')) next.sex = profileData.gender
    if (!next.height_cm && profileData.height_cm != null) next.height_cm = String(profileData.height_cm)
    if (!next.weight_kg && profileData.weight_kg != null) next.weight_kg = String(profileData.weight_kg)
    if (!next.waist_circumference && profileData.waist_circumference != null) next.waist_circumference = String(profileData.waist_circumference)
    for (const riskKey of ['family_history', 'hypertension', 'high_cholesterol', 'smoking', 'sedentary_lifestyle']) {
      if (profileData[riskKey] === true) next[riskKey] = true
    }
    return next
  }

  function calculateBmi(w, h) {
    const weight = Number(w)
    const heightCm = Number(h)
    // Plausibility gate (matches the inputs' min attributes): prevents garbage
    // BMIs from partial input, e.g. height "1" while typing 170.
    if (!Number.isNaN(weight) && weight >= 2 && !Number.isNaN(heightCm) && heightCm >= 40) {
      const height = heightCm / 100
      const calculatedBmi = (weight / (height * height)).toFixed(1)

      let group = 'custom'
      const bmiNum = Number(calculatedBmi)
      if (bmiNum < 18.5) group = 'underweight'
      else if (bmiNum < 25) group = 'normal'
      else if (bmiNum < 30) group = 'Overweight'
      else group = 'obese'

      setQcm(p => ({ ...p, bmi_group: group }))
      setForm(p => ({ ...p, bmi: calculatedBmi }))
    }
  }

  function addExtraLab() {
    if (!form.extra_lab_name.trim()) { setError('Enter a lab test name.'); return }
    if (!form.extra_lab_value || Number.isNaN(Number(form.extra_lab_value))) { setError('Enter a valid lab value.'); return }
    setExtraLabs(p => [...p, { test_name: form.extra_lab_name.trim(), test_value: Number(form.extra_lab_value) }])
    setForm(p => ({ ...p, extra_lab_name: '', extra_lab_value: '' })); setError('')
  }

  function loadDemo(type) {
    const f = { ...DEFAULT_FORM, patient_id: form.patient_id }
    const q = { ...DEFAULT_QCM }
    if (type === 't2dm') {
      f.age = '55'; q.age_group = '46_60';
      f.bmi = '31.5'; q.bmi_group = 'obese';
      f.fasting_glucose = '165'; q.fasting_group = 'diabetes';
      f.hba1c = '8.2'; q.hba1c_group = 'diabetes';
      f.frequent_urination = true; f.excessive_thirst = true; f.fatigue = true;
      f.obesity = true; f.family_history = true; f.sedentary_lifestyle = true;
    } else if (type === 'dka') {
      f.age = '24'; q.age_group = '18_30';
      f.bmi = '21.0'; q.bmi_group = 'normal';
      f.fasting_glucose = '380'; q.fasting_group = 'critical';
      f.hba1c = '11.5'; q.hba1c_group = 'critical';
      f.excessive_thirst = true; f.weight_loss = true; f.fatigue = true;
      f.vomiting = true; f.abdominal_pain = true; f.dizziness = true; f.crisis = true;
    }
    f.sex = 'male'; f.has_labs = 'yes'; f.no_labs_available = false
    setForm(f); setQcm(q); setExtraLabs([]); setStep(1); setMaxReached(1); setResult(null)
    if (!needsPatient) setSubjectMode('self')
    setInterviewDone(!needsPatient
      ? ['subject', 'age', 'sex', 'symptoms_core', 'symptoms_other', 'warning_signs', 'risk_factors', 'body', 'has_labs', 'labs']
      : ['patient', 'age', 'sex', 'symptoms_core', 'symptoms_other', 'warning_signs', 'risk_factors', 'body', 'has_labs', 'labs'])
    setInterviewSkipped([]); setCursorOverride(null); setInterviewTrail([])
  }

  function startNew(opts = {}) {
    /* Restart always lands back on question 1 ("Who is this assessment for?")
       — the previously selected patient is NOT kept, so a doctor can pick a
       different person. Explicit preservePatient is for special flows only. */
    const pid = opts.preservePatient ? form.patient_id : ''
    window.localStorage.removeItem(storageKey)
    const resetForm = { ...DEFAULT_FORM, patient_id: pid }
    for (const f of dbFacts) {
      if (
        f.key &&
        f.category !== 'lab' &&
        f.category !== 'profile' &&
        !NON_BOOLEAN_FACT_KEYS.has(f.key) &&
        !Object.prototype.hasOwnProperty.call(DEFAULT_FORM, f.key)
      ) {
        resetForm[f.key] = false
      }
    }
    setForm(resetForm); setQcm(DEFAULT_QCM)
    setExtraLabs([]); setResult(null); setError(''); setStep(1); setMaxReached(1)
    setInterviewDone([]); setInterviewSkipped([]); setCursorOverride(null); setInterviewTrail([])
    setSubjectMode(null)
    /* Let the patient-record / profile prefills run again after the reset,
       even if the same person (or "myself") is chosen once more. */
    prefilledPatientRef.current = null
    profilePrefilledRef.current = false
  }

  function getStepErrors(s = step) {
    const errs = []
    if (s === 1) {
      if (needsPatient && !form.patient_id) errs.push('Please select a patient.')
      if (form.age && (Number(form.age) < 0 || Number(form.age) > 120)) errs.push('Age must be between 0 and 120.')
      if (form.bmi && (Number(form.bmi) < 10 || Number(form.bmi) > 80)) errs.push('BMI must be between 10 and 80.')
    }
    if (s === REVIEW_STEP) {
      const fg = String(form.fasting_glucose || '').trim()
      const hb = String(form.hba1c || '').trim()
      const rg = String(form.random_plasma_glucose || '').trim()
      if (fg) { const n = Number(fg); if (Number.isNaN(n) || n < 40 || n > 600) errs.push('Fasting glucose must be 40–600 mg/dL.') }
      if (hb) { const n = Number(hb); if (Number.isNaN(n) || n < 3 || n > 20) errs.push('HbA1c must be 3–20%.') }
      if (rg) { const n = Number(rg); if (Number.isNaN(n) || n < 30 || n > 1000) errs.push('Random glucose must be 30–1000 mg/dL.') }
    }
    return errs
  }

  function goNext() {
    const errs = getStepErrors(step)
    if (errs.length) { setError(errs[0]); return }
    setError('')
    const next = Math.min(TOTAL_STEPS, step + 1)
    setStep(next); setMaxReached(p => Math.max(p, next))
  }
  function goBack() { setError(''); setStep(p => Math.max(1, p - 1)) }
  function jumpTo(s) { if (s <= maxReached) { setError(''); setStep(s) } }

  /* ── Double-click guard ──
     Advancing actions (answer / continue / skip) are ignored for a short
     window after the previous one AND after a new card renders. */
  const ADVANCE_COOLDOWN_MS = 350
  const advanceLockRef = useRef(0)
  function beginAdvance() {
    if (Date.now() - advanceLockRef.current < ADVANCE_COOLDOWN_MS) return false
    advanceLockRef.current = Date.now()
    return true
  }

  /* ── Evidence-interview handlers ── */
  function markNodeDone(nodeId) {
    setInterviewDone(prev => prev.includes(nodeId) ? prev : [...prev, nodeId])
    setInterviewSkipped(prev => prev.filter(id => id !== nodeId))
  }

  function settleNode(nodeId) {
    setInterviewDone(prev => prev.includes(nodeId) ? prev : [...prev, nodeId])
    setInterviewSkipped(prev => prev.filter(id => id !== nodeId))
  }

  function handleYesNo(node, value) {
    if (!beginAdvance()) return
    if (node.id === 'has_labs') {
      up('has_labs', value ? 'yes' : 'no')
      if (value) {
        up('no_labs_available', false)
      } else {
        setForm(p => ({ ...p, no_labs_available: true, fasting_glucose: '', hba1c: '', random_plasma_glucose: '', ogtt_2h: '' }))
        setQcm(p => ({ ...p, fasting_group: '', hba1c_group: '', ogtt_group: '' }))
        setExtraLabs([])
      }
    } else if (node.id === 'currently_pregnant') {
      setForm(p => ({ ...p, currently_pregnant: value, pregnancy_stage: value ? p.pregnancy_stage : '', gestational_history: value ? p.gestational_history : false }))
    } else {
      up(node.field, value)
    }
    settleNode(node.id)
    setCursorOverride(null)
  }

  function handleChoice(node, value) {
    if (!beginAdvance()) return
    if (node.id === 'sex' && value !== 'female') {
      setForm(p => ({ ...p, sex: value, currently_pregnant: false, pregnancy_stage: '', gestational_history: false }))
    } else {
      up(node.field, value)
    }
    settleNode(node.id)
    setCursorOverride(null)
  }

  function handleMultiNone(node) {
    if (!beginAdvance()) return
    setForm(p => {
      const next = { ...p }
      for (const f of nodeFields(node, interviewCtx)) next[f] = false
      return next
    })
    settleNode(node.id)
    setCursorOverride(null)
  }

  function handleSkipNode(node) {
    if (!beginAdvance()) return
    setInterviewSkipped(prev => prev.includes(node.id) ? prev : [...prev, node.id])
    setInterviewDone(prev => prev.filter(id => id !== node.id))
    if (node.id === 'labs') up('no_labs_available', true)
    setCursorOverride(null)
  }

  function handleInterviewContinue() {
    /* Confirm the node on screen and return to natural flow position. */
    if (!beginAdvance()) return
    if (currentNodeId) {
      settleNode(currentNodeId)
    }
    setCursorOverride(null)
  }

  /* "Who is this assessment for?" — the first interview question for patient
     accounts. Picking an option answers the node (settle → answered chip)
     and advances; switching later re-runs the subject effect above, which
     clears / re-applies the profile-derived answers. */
  function handleSelectSubject(id) {
    if (!beginAdvance()) return
    setSubjectMode(id)
    settleNode('subject')
    setCursorOverride(null)
  }
  const canInterviewBack = useMemo(() => {
    if (!currentNodeId) return false
    if (interviewTrail.lastIndexOf(currentNodeId) > 0) return true
    return applicableOrder.findIndex((n) => n.id === currentNodeId) > 0
  }, [currentNodeId, interviewTrail, applicableOrder])

  function interviewBack() {
    if (!currentNodeId) return
    /* Retrace the user's actual visit path ONE step at a time (… → 3 → 2 → 1).
       Fall back to the natural question order when no trail exists yet (e.g. a
       restored draft), stepping over nodes that stopped applying because of
       answers changed in the meantime. */
    const applicableIds = new Set(applicableOrder.map((n) => n.id))
    const candidates = []
    const trailPos = interviewTrail.lastIndexOf(currentNodeId)
    if (trailPos > 0) candidates.push(...interviewTrail.slice(0, trailPos).reverse())
    const orderPos = applicableOrder.findIndex((n) => n.id === currentNodeId)
    if (orderPos > 0) candidates.push(...applicableOrder.slice(0, orderPos).map((n) => n.id).reverse())
    const previousNode = candidates.find((id) => applicableIds.has(id))
    if (!previousNode) return
    /* Trim the trail to end at the node we are moving to, so pressing Back
       again keeps walking backwards instead of bouncing between two cards. */
    setInterviewTrail((trail) => {
      const pos = trail.lastIndexOf(previousNode)
      return pos === -1 ? trail : trail.slice(0, pos + 1)
    })
    setCursorOverride(previousNode)
    setError('')
    setStep(1)
  }
  function editInterviewNode(nodeId) {
    /* Keep the node in `interviewDone` so its chip stays visible — the card
       simply jumps to that question for editing. */
    setCursorOverride(nodeId)
    setError('')
    setStep(1)
  }

  function buildContext() {
    return {
      patient_id: form.patient_id ? Number(form.patient_id) : null,
      patient_name: needsPatient ? selectedPatient?.full_name || null : user?.name || null,
      assessment_mode: assessmentMode,
      profile: { age: form.age ? Number(form.age) : null, bmi: form.bmi ? Number(form.bmi) : null, waist_circumference: form.waist_circumference ? Number(form.waist_circumference) : null },
      labs: { fasting_glucose: form.fasting_glucose ? Number(form.fasting_glucose) : null, hba1c: form.hba1c ? Number(form.hba1c) : null, random_plasma_glucose: form.random_plasma_glucose ? Number(form.random_plasma_glucose) : null },
      symptoms: selectedSymptoms, risk_factors: selectedRisks,
      adaptive_flags: { hypoglycemia: hasHypoTrigger, urgent_dka: hasUrgentTrigger },
      pregnancy: {
        sex: form.sex || null,
        currently_pregnant: form.sex === 'female' ? Boolean(form.currently_pregnant) : null,
        stage: form.currently_pregnant ? (form.pregnancy_stage || null) : null,
      },
    }
  }

  async function submitAssessment(e) {
    e.preventDefault()
    const errs = getStepErrors(1).concat(getStepErrors(REVIEW_STEP))
    if (errs.length) { setError(errs[0]); return }
    setSubmitting(true); setError('')
    try {
      const symptoms = {}
      for (const item of SYMPTOM_PILLS) symptoms[item.key] = Boolean(form[item.key])
      for (const item of SAFETY_PILLS) symptoms[item.key] = Boolean(form[item.key])

      const riskFactorsPayload = {}
      for (const item of RISK_PILLS) riskFactorsPayload[item.key] = Boolean(form[item.key])

      const customList = customSymptoms.map(s => ({ symptom_code: s.toLowerCase().replace(/\s+/g, '_'), symptom_name: s, present: true }))
      const qAnswers = {
        qcm, yes_no: {
          symptoms: Object.fromEntries(SYMPTOM_PILLS.map(f => [f.key, Boolean(form[f.key])])),
          safety_symptoms: Object.fromEntries(SAFETY_PILLS.map(f => [f.key, Boolean(form[f.key])])),
          risk_factors: Object.fromEntries(RISK_PILLS.map(f => [f.key, Boolean(form[f.key])])),
        },
        interview: {
          sex: form.sex || null,
          currently_pregnant: form.sex === 'female' ? Boolean(form.currently_pregnant) : null,
          pregnancy_stage: form.currently_pregnant ? (form.pregnancy_stage || null) : null,
        },
        free_text: { extra_symptoms: customSymptoms },
      }

      const dynamicBooleans = {}
      for (const f of dbFacts) {
        if (
          f.key &&
          f.category !== 'lab' &&
          f.category !== 'profile' &&
          !NON_BOOLEAN_FACT_KEYS.has(f.key) &&
          typeof form[f.key] === 'boolean'
        ) {
          dynamicBooleans[f.key] = form[f.key]
        }
      }

      const payload = {
        mode: assessmentMode,
        no_labs_available: Boolean(form.no_labs_available || !hasAnyLab),
        frequent_urination: form.frequent_urination, excessive_thirst: form.excessive_thirst,
        sweating: form.sweating, shaking: form.shaking, dizziness: form.dizziness,
        vomiting: form.vomiting, abdominal_pain: form.abdominal_pain, nausea: form.nausea, crisis: form.crisis,
        // Send symptom booleans as top-level keys for direct fact normalization
        tingling_hands_feet: form.tingling_hands_feet,
        frequent_infections: form.frequent_infections,
        acanthosis_nigricans: form.acanthosis_nigricans,
        // Send risk factor booleans as top-level keys for direct fact normalization
        family_history: form.family_history, obesity: form.obesity, hypertension: form.hypertension,
        sedentary_lifestyle: form.sedentary_lifestyle, gestational_history: form.gestational_history,
        smoking: form.smoking, high_cholesterol: form.high_cholesterol,
        pcos_history: form.pcos_history, ethnicity_high_risk: form.ethnicity_high_risk,
        ...dynamicBooleans,
        symptoms: customList.length
          ? [...customList, ...Object.keys(symptoms).map(k => ({ symptom_code: k, symptom_name: k.replace(/_/g, ' '), present: symptoms[k] }))]
          : symptoms,
        risk_factors: riskFactorsPayload,
        ...buildFactsFromAnswers(qAnswers),
        questionnaire_version: 'qcm_yesno_v1', questionnaire_answers: qAnswers,
      }
      if (String(form.fasting_glucose || '').trim()) payload.fasting_glucose = Number(form.fasting_glucose)
      else delete payload.fasting_glucose
      if (String(form.hba1c || '').trim()) payload.hba1c = Number(form.hba1c)
      else delete payload.hba1c
      if (String(form.random_plasma_glucose || '').trim()) payload.random_plasma_glucose = Number(form.random_plasma_glucose)
      else delete payload.random_plasma_glucose
      if (String(form.ogtt_2h || '').trim()) payload['2h_ogtt_75g'] = Number(form.ogtt_2h)
      else delete payload['2h_ogtt_75g']
      if (form.sex === 'female') payload.currently_pregnant = Boolean(form.currently_pregnant)
      if (form.rapid_onset === true || form.rapid_onset === false) payload.rapid_onset = form.rapid_onset
      if (form.age) payload.age = Number(form.age)
      if (form.bmi) payload.bmi = Number(form.bmi)
      if (form.waist_circumference) payload.waist_circumference = Number(form.waist_circumference)
      if (!form.no_labs_available && extraLabs.length) payload.labs = extraLabs
      if (needsPatient) payload.patient_id = Number(form.patient_id)

      // Run assessment in preview/evaluation mode to avoid spamming duplicate reports in database
      payload.save = false
      const res = await api.post('/diagnosis/', payload)
      const data = getApiData(res)
      setResult(data); setStep(REVIEW_STEP); setMaxReached(REVIEW_STEP)
      saveDiagnosisResultSnapshot({ user, result: data, payload, context: buildContext() })

      const resultPath = data?.diagnosis_result_id
        ? `/diagnosis/result?diagnosis_result_id=${data.diagnosis_result_id}`
        : '/diagnosis/result'
      navigate(resultPath, { state: { result: data, payload, context: buildContext(), isDraft: true, savedAt: new Date().toISOString() } })
    } catch (err) { setError(getApiErrorMessage(err, 'Assessment failed. Please try again.')) }
    finally { setSubmitting(false) }
  }

  /* ================================================================
     RENDER
     ================================================================ */

  const renderBadge = (val, thresholds) => {
    if (!val) return null;
    const num = Number(val);
    if (num >= thresholds.critical) return <span className="ml-2 inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-400">{t('assessment.criticalHigh', 'Critical High')}</span>;
    if (num >= thresholds.diabetes) return <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-400">{t('assessment.diabetesRange', 'Diabetes Range')}</span>;
    if (num >= thresholds.prediabetes) return <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">{t('assessment.preDiabetes', 'Pre-diabetes')}</span>;
    if (num > 0) return <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">{t('assessment.normalRange', 'Normal Range')}</span>;
    return null;
  }

  const sexLabel = form.sex
    ? ({ male: t('assessment.interview.sexMale', 'Male'), female: t('assessment.interview.sexFemale', 'Female'), other: t('assessment.interview.sexOther', 'Other') }[form.sex] || form.sex)
    : '—'
  const totalAnswered = SYMPTOM_PILLS.filter(i => form[i.key]).length + SAFETY_PILLS.filter(i => form[i.key]).length + RISK_PILLS.filter(i => form[i.key]).length + (form.age ? 1 : 0) + (form.bmi ? 1 : 0)
  const stepFill = result ? 100 : step === REVIEW_STEP ? 100 : interviewPct
  const inset = 50 / TOTAL_STEPS

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <section className="surface min-w-0 flex-1 flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 md:p-10 shadow-soft dark:border-[#1a2142] dark:bg-[#0c1129] min-h-[calc(100dvh-7.5rem)]">
        <div className="mx-auto w-full max-w-4xl flex flex-col">

          {/* ── Step Progress Bar ─────────────────────────── */}
          <div className="mb-6 px-1">
            <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-cyan-500" /> {t('assessment.healthAssessment', 'Health Assessment')}</span>
              <div className="flex items-center gap-4">
                {!isDraftPristine && !result && (
                  <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium tracking-normal text-emerald-600 dark:text-emerald-400/80 animate-pulse-slow">
                    <Check className="h-3 w-3" /> {t('assessment.draftAutosaved', 'Draft autosaved')}
                  </span>
                )}
                <span>{flowPercent}% {t('assessment.complete', 'Complete')}</span>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto pb-1">
              <ol className="relative mx-auto flex min-w-[520px] max-w-screen-md items-start gap-0">
                <div className="pointer-events-none absolute top-[22px]" style={{ left: `${inset}%`, right: `${inset}%` }}>
                  <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="absolute left-0 top-0 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-500" style={{ width: `${stepFill}%` }} />
                </div>
                {STEP_ITEMS_CONFIG.map((item) => {
                  const status = result ? 'done' : item.id < step ? 'done' : item.id === step ? 'active' : 'inactive'
                  return <StepDot key={item.id} item={item} status={status} locked={item.id > maxReached} onClick={() => jumpTo(item.id)} />
                })}
              </ol>
            </div>
          </div>

          {/* ── Current Step Title ────────────────────────── */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="section-title">{t(`assessment.steps.${step === 1 ? 'interview' : 'review'}.title`, STEP_ITEMS_CONFIG[step - 1]?.title)}</h2>
              <p className="section-subtitle mt-1">{t(`assessment.steps.${step === 1 ? 'interview' : 'review'}.description`, STEP_ITEMS_CONFIG[step - 1]?.description)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {import.meta.env.DEV ? (
                <div className="hidden sm:flex items-center gap-2 mr-2 border-r border-slate-200 dark:border-slate-700 pr-4">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">{t('assessment.demoFill', 'Demo Fill:')}</span>
                  <button type="button" onClick={() => loadDemo('t2dm')} className="rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors">T2DM</button>
                  <button type="button" onClick={() => loadDemo('dka')} className="rounded bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 transition-colors">DKA Crisis</button>
                </div>
              ) : null}
              <StatusBadge tone="info">{t('assessment.step', 'Step')} {step}/{TOTAL_STEPS}</StatusBadge>
              {step === 1 && currentNode ? (
                <StatusBadge tone="info">
                  {t('assessment.interview.questionN', 'Question')} {interviewPosition(INTERVIEW_NODES, interviewCtx, interviewDone, interviewSkipped, currentNodeId)}/{applicableCount}
                </StatusBadge>
              ) : null}
              {totalAnswered > 0 ? <StatusBadge tone="success">{totalAnswered} {t('assessment.answered', 'answered')}</StatusBadge> : null}
            </div>
          </div>

          <form onSubmit={submitAssessment} className="space-y-5">
            <div key={`step-${step}-${result ? 'r' : 'n'}`} className="assessment-step-enter">

              {/* ═══════════════ STEP 1 — Evidence Interview ═══════════════ */}
              {step === 1 ? (
                <div>
                  {!needsPatient && subjectMode === 'other' && currentNodeId !== 'subject' ? (
                    <div className="mb-3 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-900/20">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                      <p className="text-sm leading-relaxed text-sky-800 dark:text-sky-300">
                        {t('assessment.subject.otherBanner', "You are assessing someone else — answer each question using their information, not yours. The result will be saved to this account's history.")}
                      </p>
                    </div>
                  ) : null}

                  {activeBanners.map((b) => (
                    <div key={b.id} className={cn(
                      'mb-3 flex items-start gap-3 rounded-xl border p-4',
                      b.tone === 'urgent' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
                        b.tone === 'warn' ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' :
                          'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20',
                    )}>
                      <AlertTriangle className={cn('mt-0.5 h-5 w-5 shrink-0', b.tone === 'urgent' ? 'text-red-500' : b.tone === 'warn' ? 'text-amber-500' : 'text-sky-500')} />
                      <div>
                        <p className={cn('text-sm font-bold', b.tone === 'urgent' ? 'text-red-800 dark:text-red-200' : b.tone === 'warn' ? 'text-amber-800 dark:text-amber-200' : 'text-sky-800 dark:text-sky-200')}>{t(b.titleKey, b.titleFallback)}</p>
                        <p className={cn('mt-0.5 text-sm leading-relaxed', b.tone === 'urgent' ? 'text-red-700 dark:text-red-300' : b.tone === 'warn' ? 'text-amber-700 dark:text-amber-300' : 'text-sky-700 dark:text-sky-300')}>{t(b.textKey, b.textFallback)}</p>
                      </div>
                    </div>
                  ))}

                  {interviewDone.length ? (
                    <div className="mb-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('assessment.interview.answeredLabel', 'Answered')}:</span>
                      {applicableNodes(INTERVIEW_NODES, interviewCtx).filter((n) => interviewDone.includes(n.id)).map((n) => (
                        <button key={n.id} type="button" onClick={() => editInterviewNode(n.id)} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50">
                          <Check className="h-3 w-3" /> {t(n.titleKey, n.titleFallback)}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {currentNode ? (
                    <InterviewFlow
                      node={currentNode}
                      form={form}
                      qcm={qcm}
                      t={t}
                      patients={patients}
                      loadingPatients={loadingPatients}
                      subjectOptions={SUBJECT_OPTIONS}
                      subjectValue={subjectMode}
                      onSelectSubject={handleSelectSubject}
                      ageOptions={AGE_OPTIONS.map(o => {
                        const keyMap = { under_18: 'under18', '18_30': 'age18to30', '31_45': 'age31to45', '46_60': 'age46to60', over_60: 'over60' };
                        return { ...o, label: t(`assessment.options.age.${keyMap[o.id] || o.id}`, o.label) };
                      })}
                      labOptions={{
                        fasting: FASTING_OPTIONS.map(o => ({ ...o, label: t(`assessment.fields.labs.fasting.${o.id}`, o.label) })),
                        hba1c: HBA1C_OPTIONS.map(o => ({ ...o, label: t(`assessment.fields.labs.hba1c.${o.id}`, o.label) })),
                        ogtt: OGTT_OPTIONS.map(o => ({ ...o, label: t(`assessment.options.ogtt.${o.id}`, o.label) })),
                      }}
                      renderBadge={renderBadge}
                      extraLabs={extraLabs}
                      onAddExtraLab={addExtraLab}
                      onRemoveExtraLab={(i) => setExtraLabs(p => p.filter((_, j) => j !== i))}
                      onField={up}
                      onPickSegment={pickSegment}
                      onSetCustom={setCustom}
                      onCalculateBmi={calculateBmi}
                      onYesNo={handleYesNo}
                      onChoice={handleChoice}
                      onToggleMulti={(node, field, value) => up(field, value)}
                      onMultiNone={handleMultiNone}
                      onContinue={handleInterviewContinue}
                      onSkip={() => handleSkipNode(currentNode)}
                      onBack={interviewBack}
                      canBack={canInterviewBack}
                      analyzing={false}
                      editing={Boolean(cursorOverride)}
                      doneIds={interviewDone}
                      skippedIds={interviewSkipped}
                      factsMap={factsMap}
                      fieldGroups={fieldGroups}
                    />
                  ) : (
                    <div className="surface mx-auto w-full max-w-2xl p-8 text-center">
                      <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <Check className="h-7 w-7" strokeWidth={2.5} />
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-50">{t('assessment.interview.allAnsweredTitle', 'All questions answered')}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('assessment.interview.allAnsweredText', 'Review your evidence, then run the assessment.')}</p>
                      <button type="button" className="btn-primary mx-auto mt-5 gap-1.5" onClick={() => { setStep(REVIEW_STEP); setMaxReached(p => Math.max(p, REVIEW_STEP)) }}>
                        {t('assessment.interview.goReview', 'Review & Run')} <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {/* ═══════════════ STEP 2 (REVIEW) — Lab & Submit ════════════ */}
              {step === REVIEW_STEP ? (
                <div className="assessment-step-list space-y-5">
                  <p className="text-xs text-slate-500">
                    {t('assessment.labs.mode', 'Mode')}: <span className="font-semibold">{assessmentMode === 'diagnostic' ? (<span className="inline-flex items-center gap-1 text-cyan-700 dark:text-cyan-300"><FlaskConical className="h-3.5 w-3.5" />{t('assessment.labs.diagnosticMode', 'Diagnostic')}</span>) : (<span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300"><ClipboardList className="h-3.5 w-3.5" />{t('assessment.labs.screeningMode', 'Screening')}</span>)}</span>
                    {' · '}
                    <button type="button" className="font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 transition-colors" onClick={() => { setStep(1); setCursorOverride(null) }}>
                      {t('assessment.interview.editAnswers', 'Edit interview answers')}
                    </button>
                  </p>

                  {/* ── Review Summary ──────────────────────── */}
                  <QSection icon={<ClipboardList className="h-5 w-5 text-slate-500" />} title={t('assessment.reviewSummary', 'Review Summary')} sub={t('assessment.reviewSummarySub', 'Double-check before submitting')}>
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
                      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2.5 text-white">
                        <p className="text-sm font-semibold uppercase tracking-[0.08em]">{t('assessment.review.overview', 'Assessment Overview')}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
                        {/* Column 1: Patient & Profile Information */}
                        <div className="flex flex-col">
                          <div className="bg-slate-50/80 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {t('assessment.review.overviewPatientProfile', 'Patient & Profile Information')}
                            </span>
                          </div>
                          <table className="w-full border-collapse">
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                              {[
                                [t('assessment.review.patient', 'Patient'), needsPatient ? (selectedPatient ? `${selectedPatient.full_name} (#${selectedPatient.id})` : t('assessment.patient.noSelection', 'Not selected')) : user?.name || 'Current user'],
                                [t('assessment.review.assessedFor', 'Assessed for'), needsPatient ? t('assessment.review.forPatient', 'Registered Patient') : (subjectMode === 'other' ? t('assessment.review.forOther', 'Someone else') : t('assessment.review.forSelf', 'Myself'))],
                                [t('assessment.review.mode', 'Mode'), assessmentMode === 'diagnostic' ? t('assessment.labs.diagnosticMode', 'Diagnostic') : t('assessment.labs.screeningMode', 'Screening')],
                                [t('assessment.review.sex', 'Sex'), form.sex === 'female' ? `${sexLabel} · ${form.currently_pregnant ? t('assessment.interview.pregnantShort', 'Pregnant') : t('assessment.interview.notPregnant', 'Not pregnant')}` : sexLabel],
                                [t('assessment.review.age', 'Age'), form.age ? `${form.age} ${t('common.yearsUnit', 'yrs')}` : '—'],
                                [t('assessment.review.bmi', 'BMI'), form.bmi ? String(form.bmi) : '—'],
                                [t('assessment.review.waist', 'Waist'), form.waist_circumference ? `${form.waist_circumference} cm` : '—'],
                              ].map(([label, value]) => (
                                <tr key={label} className="h-[42px] hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                  <th scope="row" className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 w-px">
                                    {label}
                                  </th>
                                  <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100 break-words">
                                    {value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Column 2: Clinical Evidence & Lab Indicators */}
                        <div className="flex flex-col">
                          <div className="bg-slate-50/80 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {t('assessment.review.overviewClinicalData', 'Clinical Evidence & Lab Indicators')}
                            </span>
                          </div>
                          <table className="w-full border-collapse">
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                              {[
                                [t('assessment.review.fastingGlucose', 'Fasting Glucose (FPG)'), form.fasting_glucose ? `${form.fasting_glucose} mg/dL` : '—'],
                                [t('assessment.review.hba1c', 'HbA1c'), form.hba1c ? `${form.hba1c} %` : '—'],
                                [t('assessment.review.ogtt', 'Oral Glucose (OGTT 2h)'), form.ogtt_2h ? `${form.ogtt_2h} mg/dL` : '—'],
                                [t('assessment.review.symptoms', 'Symptoms'), `${selectedSymptoms.length + customSymptoms.length} ${t('common.selected', 'selected')}`],
                                [t('assessment.review.risks', 'Risk Factors'), `${selectedRisks.length} ${t('common.selected', 'selected')}`],
                                [t('assessment.review.hypoFlag', 'Hypoglycemia Risk'), hasHypoTrigger ? t('common.yes', 'Yes') : '—'],
                                [t('assessment.review.urgentFlag', 'Urgent Warning Flag'), hasUrgentTrigger ? t('common.yes', 'Yes') : '—'],
                              ].map(([label, value]) => (
                                <tr key={label} className="h-[42px] hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                  <th scope="row" className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 w-px">
                                    {label}
                                  </th>
                                  <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100 break-words">
                                    {value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </QSection>

                  {result ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 p-4">
                      <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{t('diagnosisResult.assessmentComplete', 'Assessment complete! Your results have been saved.')}</span>
                      </p>
                      <button type="button" className="btn-primary mt-3 gap-1.5" onClick={() => navigate(result?.diagnosis_result_id ? `/diagnosis/result?diagnosis_result_id=${result.diagnosis_result_id}` : '/diagnosis/result')}>{t('diagnosisResult.viewReport', 'View Report →')}</button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">{t('diagnosisResult.reviewBeforeSubmit', 'Review your answers above, then click "Run Assessment" to get your results.')}</p>
                  )}
                </div>
              ) : null}
            </div>

            <ErrorAlert message={error} />

            {/* ── Footer Navigation (review step only — the interview has its own actions) ── */}
            {step === REVIEW_STEP ? (
              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  {result ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />}
                  <span>{result ? t('assessment.footerHintSubmitted', 'Assessment submitted') : t('assessment.footerHintReady', 'Ready to submit')}</span>
                </span>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button type="button" className="btn-secondary gap-1.5" onClick={() => { setStep(1); setCursorOverride(null) }}>
                    <ArrowLeft className="h-4 w-4" /> {t('common.back', 'Back')}
                  </button>
                  <button type="submit" className="btn-primary gap-1.5" disabled={submitting}>
                    <Send className="h-4 w-4" />
                    {submitting ? t('assessment.status.analyzing', 'Analyzing...') : result ? t('assessment.status.runAgain', 'Run Again') : t('assessment.status.runAssessment', 'Run Assessment')}
                  </button>
                  {result ? (
                    <button type="button" className="btn-secondary gap-1.5" onClick={() => setShowRestart(true)}>
                      <RotateCcw className="h-4 w-4" /> {t('assessment.status.newAssessment', 'New Assessment')}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </form>
        </div>
      </section>

      <ConfirmDialog
        open={showRestart}
        title={t('assessment.confirm.title', 'Start New Assessment?')}
        description={t('assessment.confirm.description', 'This will clear all your current answers and start fresh. Your previous results are already saved.')}
        cancelLabel={t('assessment.confirm.cancel', 'Keep Working')}
        confirmLabel={t('assessment.confirm.confirm', 'Start Fresh')}
        confirmTone="danger"
        onCancel={() => setShowRestart(false)}
        onConfirm={() => { startNew(); setShowRestart(false) }}
      />
    </div>
  )
}
