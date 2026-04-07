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
  Activity,
  AlertTriangle,
  Scale,
  Stethoscope,
  TestTube2,
  ClipboardList,
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

/* ── Constants ────────────────────────── */
const DIAGNOSIS_DRAFT_VERSION = 2
const TOTAL_STEPS = 3
const REVIEW_STEP = 3

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
  family_history: false, obesity: false, hypertension: false,
  sedentary_lifestyle: false, gestational_history: false, smoking: false,
  high_cholesterol: false, pcos_history: false, ethnicity_high_risk: false,
  extra_lab_name: '', extra_lab_value: '',
  show_bmi_calculator: false, weight_kg: '', height_cm: '',
}

const DEFAULT_QCM = { age_group: '', bmi_group: '', fasting_group: '', hba1c_group: '', ogtt_group: '' }

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
          )}>{t(`assessment.steps.${item.id === 1 ? 'profile' : item.id === 2 ? 'symptoms' : 'review'}.title`, item.title)}</h6>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">{t(`assessment.steps.${item.id === 1 ? 'profile' : item.id === 2 ? 'symptoms' : 'review'}.description`, item.description)}</p>
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
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()

  const REVIEW_STEP = 3
  const DIAGNOSIS_DRAFT_VERSION = 2

  const STEP_ITEMS_CONFIG = [
    { id: 1, title: t('assessment.steps.profile.title', 'About You'), description: t('assessment.steps.profile.description', 'Age, body profile & patient info'), icon: UserRound },
    { id: 2, title: t('assessment.steps.symptoms.title', 'How You Feel'), description: t('assessment.steps.symptoms.description', 'Symptoms & risk factors in one go'), icon: HeartPulse },
    { id: 3, title: t('assessment.steps.review.title', 'Lab & Review'), description: t('assessment.steps.review.description', 'Lab results (optional) & submit'), icon: FlaskConical },
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

  const SYMPTOM_PILLS = [
    { key: 'frequent_urination', label: t('assessment.fields.symptoms.frequentUrination', 'Frequent urination') },
    { key: 'excessive_thirst', label: t('assessment.fields.symptoms.excessiveThirst', 'Excessive thirst') },
    { key: 'fatigue', label: t('assessment.fields.symptoms.fatigue', 'Constant tiredness') },
    { key: 'blurred_vision', label: t('assessment.fields.symptoms.blurredVision', 'Blurred vision') },
    { key: 'weight_loss', label: t('assessment.fields.symptoms.weightLoss', 'Unexplained weight loss') },
    { key: 'slow_healing', label: t('assessment.fields.symptoms.slowHealing', 'Slow wound healing') },
    { key: 'nausea', label: t('assessment.fields.symptoms.nausea', 'Nausea') },
    { key: 'tingling_hands_feet', label: t('assessment.fields.symptoms.tinglingHandsFeet', 'Tingling hands / feet') },
    { key: 'frequent_infections', label: t('assessment.fields.symptoms.frequentInfections', 'Frequent infections') },
    { key: 'acanthosis_nigricans', label: t('assessment.fields.symptoms.acanthosisNigricans', 'Dark skin patches') },
  ]

  const SAFETY_PILLS = [
    { key: 'sweating', label: t('assessment.fields.safetySymptoms.sweating', 'Sweating episodes') },
    { key: 'shaking', label: t('assessment.fields.safetySymptoms.shaking', 'Shaking / tremor') },
    { key: 'dizziness', label: t('assessment.fields.safetySymptoms.dizziness', 'Dizziness') },
    { key: 'vomiting', label: t('assessment.fields.safetySymptoms.vomiting', 'Vomiting') },
    { key: 'abdominal_pain', label: t('assessment.fields.safetySymptoms.abdominalPain', 'Stomach pain') },
  ]

  const RISK_PILLS = [
    { key: 'family_history', label: t('assessment.fields.riskFactors.familyHistory', 'Family history of diabetes') },
    { key: 'obesity', label: t('assessment.fields.riskFactors.obesity', 'Obesity / overweight') },
    { key: 'hypertension', label: t('assessment.fields.riskFactors.hypertension', 'High blood pressure') },
    { key: 'sedentary_lifestyle', label: t('assessment.fields.riskFactors.sedentaryLifestyle', 'Inactive / sedentary') },
    { key: 'gestational_history', label: t('assessment.fields.riskFactors.gestationalHistory', 'Gestational diabetes history') },
    { key: 'smoking', label: t('assessment.fields.riskFactors.smoking', 'Current smoker') },
    { key: 'high_cholesterol', label: t('assessment.fields.riskFactors.highCholesterol', 'High cholesterol / lipids') },
    { key: 'pcos_history', label: t('assessment.fields.riskFactors.pcosHistory', 'PCOS History') },
    { key: 'ethnicity_high_risk', label: t('assessment.fields.riskFactors.ethnicityHighRisk', 'High-risk ethnicity') },
  ]

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

  const userRoles = useMemo(() => new Set(user?.roles || (user?.role ? [user.role] : [])), [user])
  const needsPatient = userRoles.has('doctor') || userRoles.has('admin') || userRoles.has('super_admin')
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

  const isDraftPristine = useMemo(() => {
    const hasFormChanges = Object.keys(DEFAULT_FORM).some(k => k !== 'patient_id' && form[k] !== DEFAULT_FORM[k])
    const hasQcmChanges = Object.values(qcm).some(Boolean)
    return !result && step === 1 && maxReached === 1 && extraLabs.length === 0 && !hasFormChanges && !hasQcmChanges
  }, [extraLabs.length, form, maxReached, qcm, result, step])

  const selectedSymptoms = useMemo(
    () => SYMPTOM_PILLS.filter(i => form[i.key]).map(i => i.label),
    [form],
  )
  const selectedRisks = useMemo(
    () => RISK_PILLS.filter(i => form[i.key]).map(i => i.label),
    [form],
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
  const flowPercent = result ? 100 : Math.round(((step - 1) / TOTAL_STEPS) * 100)

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
      if (typeof p.step === 'number') setStep(Math.max(1, Math.min(REVIEW_STEP, p.step)))
      if (typeof p.maxReachedStep === 'number') setMaxReached(Math.max(1, Math.min(REVIEW_STEP, p.maxReachedStep)))
      if (p.result) setResult(p.result)
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
      form, qcm, extraLabs, result, savedAt: new Date().toISOString(),
    }))
  }, [storageKey, step, maxReached, form, qcm, extraLabs, result, draftReady, isDraftPristine])

  useEffect(() => {
    if (!draftReady || (!restartRequested && !forceRestart && !keepData)) return
    if (keepData) {
      setResult(null); setStep(1);
      navigate({ pathname: '/diagnosis', search: location.search }, { replace: true, state: null })
      return
    }
    if (forceRestart) { startNew({ preservePatient: false }); navigate({ pathname: '/diagnosis', search: location.search }, { replace: true, state: null }); return }
    if (!restartRequestId) return
    if (handledRestartRef.current === restartRequestId) return
    handledRestartRef.current = restartRequestId
    if (isDraftPristine) startNew(); else setShowRestart(true)
    navigate({ pathname: '/diagnosis', search: location.search }, { replace: true, state: null })
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
      const list = getApiData(res) || []
      setPatients(list)
      if (list.length) setForm(p => {
        const has = list.some(pt => String(pt.id) === String(p.patient_id))
        return has ? p : { ...p, patient_id: String(list[0].id) }
      })
    } catch (e) { setError(getApiErrorMessage(e, t('assessment.errors.loadPatients'))) }
    finally { setLoadingPatients(false) }
  }

  function up(field, value) { setForm(p => ({ ...p, [field]: value })) }
  function pickSegment(qKey, opt, field) { setQcm(p => ({ ...p, [qKey]: opt.id })); setForm(p => ({ ...p, [field]: String(opt.value) })) }
  function setCustom(qKey, field, value) { setQcm(p => ({ ...p, [qKey]: 'custom' })); setForm(p => ({ ...p, [field]: value })) }

  function calculateBmi(w, h) {
    const weight = Number(w)
    const heightCm = Number(h)
    if (!Number.isNaN(weight) && weight > 0 && !Number.isNaN(heightCm) && heightCm > 0) {
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
    setForm(f); setQcm(q); setExtraLabs([]); setStep(1); setMaxReached(1); setResult(null);
  }

  function startNew(opts = {}) {
    const pid = (opts.preservePatient ?? needsPatient) ? form.patient_id : ''
    window.localStorage.removeItem(storageKey)
    setForm({ ...DEFAULT_FORM, patient_id: pid }); setQcm(DEFAULT_QCM)
    setExtraLabs([]); setResult(null); setError(''); setStep(1); setMaxReached(1)
  }

  function getStepErrors(s = step) {
    const errs = []
    if (s === 1) {
      if (needsPatient && !form.patient_id) errs.push('Please select a patient.')
      if (form.age && (Number(form.age) < 0 || Number(form.age) > 120)) errs.push('Age must be between 0 and 120.')
      if (form.bmi && (Number(form.bmi) < 10 || Number(form.bmi) > 80)) errs.push('BMI must be between 10 and 80.')
    }
    if (s === 3) {
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

  function buildContext() {
    return {
      patient_id: form.patient_id ? Number(form.patient_id) : null,
      patient_name: needsPatient ? selectedPatient?.full_name || null : user?.name || null,
      assessment_mode: assessmentMode,
      profile: { age: form.age ? Number(form.age) : null, bmi: form.bmi ? Number(form.bmi) : null, waist_circumference: form.waist_circumference ? Number(form.waist_circumference) : null },
      labs: { fasting_glucose: form.fasting_glucose ? Number(form.fasting_glucose) : null, hba1c: form.hba1c ? Number(form.hba1c) : null, random_plasma_glucose: form.random_plasma_glucose ? Number(form.random_plasma_glucose) : null },
      symptoms: selectedSymptoms, risk_factors: selectedRisks,
      adaptive_flags: { hypoglycemia: hasHypoTrigger, urgent_dka: hasUrgentTrigger },
    }
  }

  async function submitAssessment(e) {
    e.preventDefault()
    const errs = getStepErrors(1).concat(getStepErrors(3))
    if (errs.length) { setError(errs[0]); return }
    setSubmitting(true); setError('')
    try {
      const symptoms = {
        fatigue: form.fatigue, blurred_vision: form.blurred_vision, weight_loss: form.weight_loss,
        slow_healing: form.slow_healing, sweating: form.sweating, shaking: form.shaking,
        dizziness: form.dizziness, vomiting: form.vomiting, abdominal_pain: form.abdominal_pain,
        nausea: form.nausea, tingling_hands_feet: form.tingling_hands_feet,
        frequent_infections: form.frequent_infections, acanthosis_nigricans: form.acanthosis_nigricans,
      }
      const customList = customSymptoms.map(s => ({ symptom_code: s.toLowerCase().replace(/\s+/g, '_'), symptom_name: s, present: true }))
      const qAnswers = {
        qcm, yes_no: {
          symptoms: Object.fromEntries(SYMPTOM_PILLS.map(f => [f.key, Boolean(form[f.key])])),
          safety_symptoms: Object.fromEntries(SAFETY_PILLS.map(f => [f.key, Boolean(form[f.key])])),
          risk_factors: Object.fromEntries(RISK_PILLS.map(f => [f.key, Boolean(form[f.key])])),
        },
        free_text: { extra_symptoms: customSymptoms },
      }
      const payload = {
        mode: assessmentMode, no_labs_available: form.no_labs_available,
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
        symptoms: customList.length
          ? [...customList, ...Object.keys(symptoms).map(k => ({ symptom_code: k, symptom_name: k.replace('_', ' '), present: symptoms[k] }))]
          : symptoms,
        risk_factors: {
          family_history: form.family_history, obesity: form.obesity, hypertension: form.hypertension,
          sedentary_lifestyle: form.sedentary_lifestyle, gestational_history: form.gestational_history, smoking: form.smoking,
          high_cholesterol: form.high_cholesterol, pcos_history: form.pcos_history, ethnicity_high_risk: form.ethnicity_high_risk,
        },
        questionnaire_version: 'qcm_yesno_v1', questionnaire_answers: qAnswers,
      }
      if (String(form.fasting_glucose || '').trim()) payload.fasting_glucose = Number(form.fasting_glucose)
      if (String(form.hba1c || '').trim()) payload.hba1c = Number(form.hba1c)
      if (String(form.random_plasma_glucose || '').trim()) payload.random_plasma_glucose = Number(form.random_plasma_glucose)
      if (String(form.ogtt_2h || '').trim()) payload['2h_ogtt_75g'] = Number(form.ogtt_2h)
      if (form.age) payload.age = Number(form.age)
      if (form.bmi) payload.bmi = Number(form.bmi)
      if (form.waist_circumference) payload.waist_circumference = Number(form.waist_circumference)
      if (!form.no_labs_available && extraLabs.length) payload.labs = extraLabs
      if (needsPatient) payload.patient_id = Number(form.patient_id)

      const res = await api.post('/diagnosis/', payload)
      const data = getApiData(res)
      setResult(data); setStep(REVIEW_STEP); setMaxReached(REVIEW_STEP)
      saveDiagnosisResultSnapshot({ user, result: data, context: buildContext() })
      navigate('/diagnosis/result', { state: { result: data, context: buildContext(), savedAt: new Date().toISOString() } })
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

  const totalAnswered = SYMPTOM_PILLS.filter(i => form[i.key]).length + SAFETY_PILLS.filter(i => form[i.key]).length + RISK_PILLS.filter(i => form[i.key]).length + (form.age ? 1 : 0) + (form.bmi ? 1 : 0)
  const stepFill = result ? 100 : ((step - 1) / (TOTAL_STEPS - 1)) * 100
  const inset = 50 / TOTAL_STEPS

  return (
    <div className="space-y-5">
      <section className="surface border-0 p-5 sm:p-6">
        <div className="mx-auto w-full max-w-5xl">

          {/* ── Step Progress Bar ─────────────────────────── */}
          <div className="mb-6 px-1">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
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
          <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="section-title">{t(`assessment.steps.${step === 1 ? 'profile' : step === 2 ? 'symptoms' : 'review'}.title`, STEP_ITEMS_CONFIG[step - 1]?.title)}</h2>
              <p className="section-subtitle mt-1">{t(`assessment.steps.${step === 1 ? 'profile' : step === 2 ? 'symptoms' : 'review'}.description`, STEP_ITEMS_CONFIG[step - 1]?.description)}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 mr-2 border-r border-slate-200 dark:border-slate-700 pr-4">
                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">{t('assessment.demoFill', 'Demo Fill:')}</span>
                <button type="button" onClick={() => loadDemo('t2dm')} className="rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors">T2DM</button>
                <button type="button" onClick={() => loadDemo('dka')} className="rounded bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 transition-colors">DKA Crisis</button>
              </div>
              <StatusBadge tone="info">{t('assessment.step', 'Step')} {step}/{TOTAL_STEPS}</StatusBadge>
              {totalAnswered > 0 ? <StatusBadge tone="success">{totalAnswered} {t('assessment.answered', 'answered')}</StatusBadge> : null}
            </div>
          </div>

          <form onSubmit={submitAssessment} className="space-y-5">
            <div key={`step-${step}-${result ? 'r' : 'n'}`} className="assessment-step-enter">

            {/* ═══════════════ STEP 1 — About You ═══════════════ */}
            {step === 1 ? (
              <div className="assessment-step-list space-y-5">
                {needsPatient ? (
                  <QSection icon={<Building2 className="h-5 w-5 text-slate-500" />} title={t('assessment.patient.title', "Patient")} sub={t('assessment.patient.noSelection', "Select the patient being assessed")}>
                    {loadingPatients ? <LoadingState label="Loading patients..." /> : (
                      <AppSelect
                        value={form.patient_id}
                        onValueChange={(v) => up('patient_id', v)}
                        placeholder={t('assessment.patient.selectPlaceholder', "Select a patient")}
                        includeEmpty emptyLabel={patients.length ? t('assessment.patient.selectPlaceholder', 'Select a patient') : t('assessment.patient.noPatients', 'No patients found')}
                        options={patients.map(p => ({ value: String(p.id), label: `${p.full_name} (#${p.id})` }))}
                      />
                    )}
                  </QSection>
                ) : null}

                <QSection icon={<UserRound className="h-5 w-5 text-slate-500" />} title={t('assessment.profile.ageTitle', 'How old are you?')} sub={t('assessment.profile.ageHelper', 'Tap the range that fits best, or type your exact age')}>
                  <SegmentSelector
                    options={AGE_OPTIONS.map(o => {
                      const keyMap = { under_18: 'under18', '18_30': 'age18to30', '31_45': 'age31to45', '46_60': 'age46to60', over_60: 'over60' };
                      return {...o, label: t(`assessment.options.age.${keyMap[o.id] || o.id}`, o.label)};
                    })}
                    value={qcm.age_group}
                    onChange={(opt) => pickSegment('age_group', opt, 'age')}
                    renderLabel={(opt) => (
                      <div className="flex flex-col items-center gap-0.5 py-1">
                        <span className="text-sm font-semibold">{opt.label}</span>
                      </div>
                    )}
                  />
                  <label className="mt-3 block">
                    <span className="label-text">{t('assessment.profile.exactAge', 'Or enter exact age')}</span>
                    <input className="input-base" type="number" min={0} max={120} placeholder="e.g. 42" value={form.age} onChange={(e) => setCustom('age_group', 'age', e.target.value)} />
                  </label>
                </QSection>

                <QSection icon={<Scale className="h-5 w-5 text-slate-500" />} title={t('assessment.profile.bmiTitle', 'Body Mass Index (BMI)')} sub={t('assessment.profile.exactBmi', 'Select your range or enter your BMI number')}>
                  <SegmentSelector options={BMI_OPTIONS.map(o => ({...o, label: t(`assessment.options.bmi.${o.id.toLowerCase()}`, o.label)}))} value={qcm.bmi_group} onChange={(opt) => pickSegment('bmi_group', opt, 'bmi')} />
                  <label className="mt-3 block">
                    <span className="label-text">{t('assessment.profile.exactBmi', 'Exact BMI value')}</span>
                    <input className="input-base" type="number" min={10} max={80} step="0.1" placeholder="e.g. 26.5" value={form.bmi} onChange={(e) => setCustom('bmi_group', 'bmi', e.target.value)} />
                  </label>
                  
                  <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <button type="button" className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors" onClick={() => up('show_bmi_calculator', !form.show_bmi_calculator)}>
                      {form.show_bmi_calculator ? t('assessment.closeBmiCalc', 'Close calculator') : t('assessment.openBmiCalc', "I don't know my exact BMI")}
                    </button>
                    {form.show_bmi_calculator && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800">
                        <label className="block">
                          <span className="label-text">{t('assessment.weightKg', 'Weight (kg)')}</span>
                          <input className="input-base bg-white dark:bg-[#070712]" type="number" placeholder="e.g. 70" value={form.weight_kg} onChange={(e) => { up('weight_kg', e.target.value); calculateBmi(e.target.value, form.height_cm); }} />
                        </label>
                        <label className="block">
                          <span className="label-text">{t('assessment.heightCm', 'Height (cm)')}</span>
                          <input className="input-base bg-white dark:bg-[#070712]" type="number" placeholder="e.g. 175" value={form.height_cm} onChange={(e) => { up('height_cm', e.target.value); calculateBmi(form.weight_kg, e.target.value); }} />
                        </label>
                      </div>
                    )}
                  </div>
                </QSection>

                <QSection icon={<Activity className="h-5 w-5 text-slate-500" />} title={t('assessment.profile.waistTitle', "Waist Circumference (optional)")} sub={t('assessment.profile.waistHelper', "Helps detect central obesity — a key diabetes risk factor")}>
                  <label className="block">
                    <span className="label-text">{t('assessment.profile.exactWaist', "Waist in cm")}</span>
                    <input className="input-base" type="number" min={30} max={250} step="0.1" placeholder="e.g. 95 cm" value={form.waist_circumference} onChange={(e) => up('waist_circumference', e.target.value)} />
                  </label>
                </QSection>
              </div>
            ) : null}

            {/* ═══════════════ STEP 2 — How You Feel ════════════ */}
            {step === 2 ? (
              <div className="assessment-step-list space-y-5">
                <QSection icon={<Stethoscope className="h-5 w-5 text-slate-500" />} title={t('assessment.symptoms.commonTitle', 'Common symptoms')} sub={t('assessment.symptoms.commonHelper', "Tap any symptoms you're currently experiencing")}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SYMPTOM_PILLS.map(item => (
                      <TogglePill key={item.key} item={{...item, label: t(`assessment.fields.symptoms.${item.key.replace(/_([a-z])/g, g => g[1].toUpperCase())}`, item.label)}} active={Boolean(form[item.key])} onToggle={(k, v) => up(k, v)} />
                    ))}
                  </div>
                </QSection>

                <QSection icon={<AlertTriangle className="h-5 w-5 text-red-500" />} title={t('assessment.symptoms.safetyTitle', 'Warning signs')} sub={t('assessment.symptoms.safetyHelper', 'These help detect low blood sugar or emergencies')} className="assessment-branch-card">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SAFETY_PILLS.map(item => (
                      <TogglePill key={item.key} item={{...item, label: t(`assessment.fields.safetySymptoms.${item.key.replace(/_([a-z])/g, g => g[1].toUpperCase())}`, item.label)}} active={Boolean(form[item.key])} onToggle={(k, v) => up(k, v)} />
                    ))}
                  </div>
                </QSection>

                <QSection icon={<Activity className="h-5 w-5 text-slate-500" />} title={t('assessment.risks.title', 'Risk factors')} sub={t('assessment.risks.helper', 'Do any of these apply to you?')}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {RISK_PILLS.map(item => (
                      <TogglePill key={item.key} item={{...item, label: t(`assessment.fields.riskFactors.${item.key.replace(/_([a-z])/g, g => g[1].toUpperCase())}`, item.label)}} active={Boolean(form[item.key])} onToggle={(k, v) => up(k, v)} />
                    ))}
                  </div>
                </QSection>

                <QSection icon={<PenTool className="h-5 w-5 text-slate-500" />} title={t('assessment.symptoms.extraTitle', "Anything else?")} sub={t('assessment.symptoms.extraHelper', "Describe any additional symptoms (optional)")}>
                  <textarea
                    className="input-base min-h-[80px] resize-y"
                    value={form.extra_symptoms}
                    onChange={(e) => up('extra_symptoms', e.target.value)}
                    placeholder={t('assessment.extraPlaceholderText', 'e.g. tingling feet, dry mouth, frequent infections...')}
                  />
                </QSection>
              </div>
            ) : null}

            {/* ═══════════════ STEP 3 — Lab & Review ════════════ */}
            {step === 3 ? (
              <div className="assessment-step-list space-y-5">
                <QSection icon={<TestTube2 className="h-5 w-5 text-slate-500" />} title={t('assessment.labHaveResults', 'Do you have lab results?')} sub={t('assessment.labHaveResultsSub', 'Lab values improve accuracy — but you can skip this')}>
                  <label className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-amber-600" checked={Boolean(form.no_labs_available)} onChange={(e) => {
                      up('no_labs_available', e.target.checked)
                      if (e.target.checked) {
                        setForm(p => ({ ...p, fasting_glucose: '', hba1c: '', random_plasma_glucose: '', ogtt_2h: '' }))
                        setQcm(p => ({ ...p, fasting_group: '', hba1c_group: '', ogtt_group: '' }))
                        setExtraLabs([])
                      }
                    }} />
                    <span className="font-medium text-amber-800 dark:text-amber-300">{t('assessment.labs.noLabsAvailable', "I don't have lab results right now")}</span>
                  </label>
                  <p className="mt-2 text-xs text-slate-500">
                    {t('assessment.labs.mode', 'Mode')}: <span className="font-semibold">{assessmentMode === 'diagnostic' ? t('assessment.labs.diagnosticMode', '🔬 Diagnostic') : t('assessment.labs.screeningMode', '📋 Screening')}</span>
                  </p>
                </QSection>

                {!form.no_labs_available ? (
                  <>
                    <QSection icon={<TestTube2 className="h-5 w-5 text-slate-500" />} title={t('assessment.labs.fastingTitle', 'Fasting Blood Glucose')} sub={t('assessment.labs.fastingHelper', 'mg/dL — after 8+ hours of fasting')}>
                      <SegmentSelector options={FASTING_OPTIONS.map(o => ({...o, label: t(`assessment.fields.labs.fasting.${o.id}`, o.label)}))} value={qcm.fasting_group} onChange={(opt) => pickSegment('fasting_group', opt, 'fasting_glucose')} />
                      <label className="mt-3 block">
                        <span className="label-text">{t('assessment.exactValueMgDl', 'Exact value (mg/dL)')} {renderBadge(form.fasting_glucose, { critical: 200, diabetes: 126, prediabetes: 100 })}</span>
                        <input className="input-base" type="number" placeholder="e.g. 115" value={form.fasting_glucose} onChange={(e) => setCustom('fasting_group', 'fasting_glucose', e.target.value)} />
                      </label>
                    </QSection>

                    <QSection icon={<Activity className="h-5 w-5 text-slate-500" />} title={t('assessment.labs.hba1cTitle', "HbA1c (Glycated Hemoglobin)")} sub={t('assessment.labs.hba1cHelper', "Percentage — reflects 2–3 month average blood sugar")}>
                      <SegmentSelector options={HBA1C_OPTIONS.map(o => ({...o, label: t(`assessment.fields.labs.hba1c.${o.id}`, o.label)}))} value={qcm.hba1c_group} onChange={(opt) => pickSegment('hba1c_group', opt, 'hba1c')} />
                      <label className="mt-3 block">
                        <span className="label-text">{t('assessment.exactValuePercent', 'Exact value (%)')} {renderBadge(form.hba1c, { critical: 10, diabetes: 6.5, prediabetes: 5.7 })}</span>
                        <input className="input-base" type="number" step="0.1" placeholder="e.g. 6.1" value={form.hba1c} onChange={(e) => setCustom('hba1c_group', 'hba1c', e.target.value)} />
                      </label>
                    </QSection>

                    <QSection icon={<TestTube2 className="h-5 w-5 text-slate-500" />} title={t('assessment.labs.ogttTitle', '2-Hour OGTT (optional)')} sub={t('assessment.labs.ogttHelper', 'mg/dL — measured 2 hours after 75g glucose load')}>
                      <SegmentSelector options={OGTT_OPTIONS.map(o => ({...o, label: t(`assessment.options.ogtt.${o.id}`, o.label)}))} value={qcm.ogtt_group} onChange={(opt) => pickSegment('ogtt_group', opt, 'ogtt_2h')} />
                      <label className="mt-3 block">
                        <span className="label-text">{t('assessment.exactValueMgDl', 'Exact value (mg/dL)')} {renderBadge(form.ogtt_2h, { diabetes: 200, prediabetes: 140 })}</span>
                        <input className="input-base" type="number" placeholder="e.g. 165" value={form.ogtt_2h} onChange={(e) => setCustom('ogtt_group', 'ogtt_2h', e.target.value)} />
                      </label>
                    </QSection>

                    <QSection icon={<TestTube2 className="h-5 w-5 text-slate-500" />} title={t('assessment.labs.rpgTitle', "Random Blood Glucose (optional)")} sub={t('assessment.labs.rpgHelper', "mg/dL — any time, no fasting needed")}>
                      <label className="block">
                        <span className="label-text">{t('assessment.valueMgDl', 'Value (mg/dL)')}</span>
                        <input className="input-base" type="number" min={30} max={1000} placeholder="e.g. 180" value={form.random_plasma_glucose} onChange={(e) => up('random_plasma_glucose', e.target.value)} />
                      </label>
                    </QSection>

                    <QSection icon={<PlusCircle className="h-5 w-5 text-slate-500" />} title={t('assessment.additionalLabTests', 'Additional lab tests (optional)')}>
                      <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_auto]">
                        <input className="input-base" placeholder={t('assessment.testName', 'Test name')} value={form.extra_lab_name} onChange={(e) => up('extra_lab_name', e.target.value)} />
                        <input className="input-base" placeholder={t('assessment.value', 'Value')} type="number" step="0.01" value={form.extra_lab_value} onChange={(e) => up('extra_lab_value', e.target.value)} />
                        <button type="button" className="btn-secondary gap-1.5" onClick={addExtraLab}><Plus className="h-4 w-4" /> {t('assessment.add', 'Add')}</button>
                      </div>
                      {extraLabs.length ? (
                        <ul className="mt-3 space-y-2">
                          {extraLabs.map((lab, i) => (
                            <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm">
                              <span>{lab.test_name}: <strong>{lab.test_value}</strong></span>
                              <button type="button" className="btn-secondary gap-1 px-2.5 py-1.5 text-xs" onClick={() => setExtraLabs(p => p.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5" /> {t('assessment.remove', 'Remove')}</button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </QSection>
                  </>
                ) : null}

                {/* ── Review Summary ──────────────────────── */}
                <QSection icon={<ClipboardList className="h-5 w-5 text-slate-500" />} title={t('assessment.reviewSummary', 'Review Summary')} sub={t('assessment.reviewSummarySub', 'Double-check before submitting')}>
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2.5 text-white">
                      <p className="text-sm font-semibold uppercase tracking-[0.08em]">{t('assessment.review.overview', 'Assessment Overview')}</p>
                    </div>
                    <dl className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                      {[
                        [t('assessment.review.patient', 'Patient'), needsPatient ? (selectedPatient ? `${selectedPatient.full_name} (#${selectedPatient.id})` : t('assessment.patient.noSelection', 'Not selected')) : user?.name || 'Current user'],
                        [t('assessment.review.mode', 'Mode'), assessmentMode === 'diagnostic' ? t('assessment.labs.diagnosticMode', '🔬 Diagnostic') : t('assessment.labs.screeningMode', '📋 Screening')],
                        [t('assessment.review.profile', 'Age / BMI / Waist'), `${form.age || '-'} yrs / ${form.bmi || '-'} / ${form.waist_circumference || '-'} cm`],
                        [t('assessment.review.glucose', 'Glucose Tests'), `FPG: ${form.fasting_glucose || '-'} — A1c: ${form.hba1c || '-'} — OGTT: ${form.ogtt_2h || '-'} — RPG: ${form.random_plasma_glucose || '-'}`],
                        [t('assessment.review.symptoms', 'Symptoms'), `${selectedSymptoms.length + customSymptoms.length} ${t('common.selected', 'selected')}`],
                        [t('assessment.review.risks', 'Risk Factors'), `${selectedRisks.length} ${t('common.selected', 'selected')}`],
                        [t('assessment.review.flags', 'Flags'), `Hypo: ${hasHypoTrigger ? t('common.yes', '🟡 Yes') : '—'} | Urgent: ${hasUrgentTrigger ? t('common.yes', '🔴 Yes') : '—'}`],
                      ].map(([label, value]) => (
                        <div key={label} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[11rem_1fr] sm:items-center">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                          <dd className="text-slate-800 dark:text-slate-100">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </QSection>

                {result ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 p-4">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">✅ {t('diagnosisResult.assessmentComplete', 'Assessment complete! Your results have been saved.')}</p>
                    <button type="button" className="btn-primary mt-3 gap-1.5" onClick={() => navigate('/diagnosis/result')}>{t('diagnosisResult.viewReport', 'View Report →')}</button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{t('diagnosisResult.reviewBeforeSubmit', 'Review your answers above, then click "Run Assessment" to get your results.')}</p>
                )}
              </div>
            ) : null}
            </div>

            <ErrorAlert message={error} />

            {/* ── Footer Navigation ──────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700 pt-5">
              <span className="text-xs text-slate-400">
                {step < REVIEW_STEP ? t('assessment.footerHintContinue', '↓ Complete each section, then continue') : result ? t('assessment.footerHintSubmitted', '✅ Assessment submitted') : t('assessment.footerHintReady', '🚀 Ready to submit')}
              </span>
              <div className="flex flex-wrap gap-2">
                {step > 1 ? (
                  <button type="button" className="btn-secondary gap-1.5" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4" /> {t('common.back', 'Back')}
                  </button>
                ) : null}
                {step < REVIEW_STEP ? (
                  <button type="button" className="btn-primary gap-1.5" onClick={goNext}>
                    {t('common.continue', 'Continue')} <ArrowRight className="h-4 w-4" />
                  </button>
                ) : null}
                {step === REVIEW_STEP ? (
                  <button type="submit" className="btn-primary gap-1.5" disabled={submitting}>
                    <Send className="h-4 w-4" />
                    {submitting ? t('assessment.status.analyzing', 'Analyzing...') : result ? t('assessment.status.runAgain', 'Run Again') : t('assessment.status.runAssessment', '🔬 Run Assessment')}
                  </button>
                ) : null}
                {step === REVIEW_STEP && result ? (
                  <button type="button" className="btn-secondary gap-1.5" onClick={() => setShowRestart(true)}>
                    <RotateCcw className="h-4 w-4" /> {t('assessment.status.newAssessment', 'New Assessment')}
                  </button>
                ) : null}
              </div>
            </div>
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
