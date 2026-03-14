import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  HeartPulse,
  Plus,
  ShieldAlert,
  RotateCcw,
  Send,
  Trash2,
  UserRound,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import {
  AppSelect,
  ConfirmDialog,
  ErrorAlert,
  LoadingState,
  StatusBadge,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { saveDiagnosisResultSnapshot } from '@/lib/diagnosis-result-storage'

const STEP_ITEMS = [
  { id: 1, title: 'Profile', description: 'Basic patient information', icon: UserRound },
  { id: 2, title: 'Symptoms', description: 'Symptoms you are feeling', icon: HeartPulse },
  { id: 3, title: 'Lab Values', description: 'Glucose and lab values', icon: FlaskConical },
  { id: 4, title: 'Risk Factors', description: 'Lifestyle and medical risks', icon: ShieldAlert },
  { id: 5, title: 'Review & Submit', description: 'Check details and run diagnosis', icon: Send },
]

const TOTAL_STEPS = STEP_ITEMS.length
const REVIEW_STEP = TOTAL_STEPS
const DIAGNOSIS_DRAFT_VERSION = 1

const AGE_OPTIONS = [
  { id: 'under_18', label: 'Under 18', value: 16 },
  { id: '18_30', label: '18-30', value: 24 },
  { id: '31_45', label: '31-45', value: 38 },
  { id: '46_60', label: '46-60', value: 53 },
  { id: 'over_60', label: 'Over 60', value: 67 },
]

const BMI_OPTIONS = [
  { id: 'underweight', label: 'Underweight', value: 18.0 },
  { id: 'normal', label: 'Normal', value: 23.0 },
  { id: 'overweight', label: 'Overweight', value: 28.0 },
  { id: 'obese', label: 'Obese', value: 33.0 },
]

const WAIST_OPTIONS = [
  { id: 'low', label: 'Low risk', value: 80 },
  { id: 'medium', label: 'Medium risk', value: 95 },
  { id: 'high', label: 'High risk', value: 110 },
]

const FASTING_OPTIONS = [
  { id: 'normal', label: '< 100 mg/dL', value: 95 },
  { id: 'prediabetes', label: '100-125 mg/dL', value: 115 },
  { id: 'diabetes', label: '126-199 mg/dL', value: 140 },
  { id: 'critical', label: '>= 200 mg/dL', value: 260 },
]

const HBA1C_OPTIONS = [
  { id: 'normal', label: '< 5.7%', value: 5.2 },
  { id: 'prediabetes', label: '5.7%-6.4%', value: 6.0 },
  { id: 'diabetes', label: '>= 6.5%', value: 6.8 },
  { id: 'critical', label: '>= 10%', value: 10.5 },
]

const SYMPTOM_FIELDS = [
  { key: 'frequent_urination', label: 'Frequent urination' },
  { key: 'excessive_thirst', label: 'Excessive thirst' },
  { key: 'fatigue', label: 'Fatigue' },
  { key: 'blurred_vision', label: 'Blurred vision' },
  { key: 'weight_loss', label: 'Unintended weight loss' },
  { key: 'slow_healing', label: 'Slow wound healing' },
]

const SAFETY_SYMPTOM_FIELDS = [
  { key: 'sweating', label: 'Sweating episode' },
  { key: 'shaking', label: 'Shaking/tremor' },
  { key: 'dizziness', label: 'Dizziness/light-headedness' },
  { key: 'vomiting', label: 'Vomiting' },
  { key: 'abdominal_pain', label: 'Abdominal pain' },
]

const HYPO_BRANCH_FIELDS = [
  { key: 'hypo_confusion', label: 'Confusion or trouble focusing' },
  { key: 'hypo_palpitations', label: 'Palpitations/rapid heartbeat' },
  { key: 'hypo_improves_with_sugar', label: 'Symptoms improve after sugar intake' },
]

const URGENT_BRANCH_FIELDS = [
  { key: 'nausea', label: 'Nausea' },
  { key: 'rapid_breathing', label: 'Rapid or deep breathing' },
  { key: 'unable_to_keep_fluids', label: 'Unable to keep fluids down' },
  { key: 'crisis', label: 'Looks severely ill or in crisis' },
]

const RISK_FACTOR_FIELDS = [
  { key: 'family_history', label: 'Family history' },
  { key: 'obesity', label: 'Obesity' },
  { key: 'hypertension', label: 'Hypertension' },
  { key: 'sedentary_lifestyle', label: 'Sedentary lifestyle' },
  { key: 'gestational_history', label: 'Gestational diabetes history' },
  { key: 'smoking', label: 'Smoking' },
]

const DEFAULT_FORM = {
  patient_id: '',
  age: '',
  bmi: '',
  waist_circumference: '',
  fasting_glucose: '',
  hba1c: '',
  random_plasma_glucose: '',
  no_labs_available: false,
  frequent_urination: false,
  excessive_thirst: false,
  fatigue: false,
  blurred_vision: false,
  weight_loss: false,
  slow_healing: false,
  sweating: false,
  shaking: false,
  dizziness: false,
  vomiting: false,
  abdominal_pain: false,
  nausea: false,
  rapid_breathing: false,
  unable_to_keep_fluids: false,
  crisis: false,
  hypo_confusion: false,
  hypo_palpitations: false,
  hypo_improves_with_sugar: false,
  extra_symptoms: '',
  family_history: false,
  obesity: false,
  hypertension: false,
  sedentary_lifestyle: false,
  gestational_history: false,
  smoking: false,
  extra_lab_name: '',
  extra_lab_value: '',
}

const DEFAULT_QCM = {
  age_group: '',
  bmi_group: '',
  waist_group: '',
  fasting_group: '',
  hba1c_group: '',
}

function getDiagnosisDraftStorageKey(user) {
  const userKey = user?.id || user?.sub || user?.email || 'guest'
  return `diagnosis-assessment-draft:v${DIAGNOSIS_DRAFT_VERSION}:${String(userKey)}`
}

function StepNavItem({ item, status, locked, onClick }) {
  const Icon = item.icon
  const stepDotClass = status === 'active'
    ? 'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500 dark:text-white'
    : status === 'pending'
      ? 'border-primary-500 bg-slate-50 text-primary-600 dark:border-primary-400 dark:bg-[#070712] dark:text-primary-300'
      : 'border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-600 dark:bg-[#070712] dark:text-slate-500'

  const stepTitleClass = status === 'active'
    ? 'text-primary-700 dark:text-primary-300'
    : status === 'pending'
      ? 'text-slate-900 dark:text-slate-100'
      : 'text-slate-500 dark:text-slate-400'
  const stepDotMotionClass = status === 'active' ? 'assessment-step-dot-active' : ''

  return (
    <li className="relative z-10 min-w-[11rem] flex-1">
      <button
        type="button"
        onClick={onClick}
        disabled={locked}
        className={cn(
          'w-full transition',
          locked && 'cursor-not-allowed'
        )}
      >
        <div className="relative flex w-full items-center justify-center">
          <span
            className={cn(
              'relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-colors',
              stepDotClass,
              stepDotMotionClass
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2.25} />
          </span>
        </div>

        <div className="mt-2 text-center">
          <h6 className={cn('text-sm font-semibold', stepTitleClass)}>
            {item.title}
          </h6>
        </div>
      </button>
    </li>
  )
}

function QuestionCard({ title, helper, children, className }) {
  return (
    <div className={cn('assessment-card-enter rounded-xl bg-white p-3 shadow-sm', className)}>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  )
}

function QcmOptions({ value, options, onChange }) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.id}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm transition',
            value === option.id ? 'text-cyan-700' : 'text-slate-700 hover:text-slate-900'
          )}
        >
          <input
            type="checkbox"
            className="h-4 w-4 accent-cyan-600"
            checked={value === option.id}
            onChange={() => onChange(option)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  )
}

function CheckboxListQuestion({ items, values, onToggle, helper }) {
  return (
    <div className="space-y-2.5">
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      {items.map((item) => (
        <label
          key={item.key}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm transition',
            values[item.key] ? 'text-cyan-700' : 'text-slate-700 hover:text-slate-900'
          )}
        >
          <input
            type="checkbox"
            className="h-4 w-4 accent-cyan-600"
            checked={Boolean(values[item.key])}
            onChange={(event) => onToggle(item.key, event.target.checked)}
          />
          <span>{item.label}</span>
        </label>
      ))}
    </div>
  )
}

export function DiagnosisPage({ user }) {
  const location = useLocation()
  const navigate = useNavigate()
  const storageKey = useMemo(() => getDiagnosisDraftStorageKey(user), [user?.id, user?.sub, user?.email])

  const [step, setStep] = useState(1)
  const [maxReachedStep, setMaxReachedStep] = useState(1)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [qcm, setQcm] = useState(DEFAULT_QCM)
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [extraLabs, setExtraLabs] = useState([])
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const [draftReady, setDraftReady] = useState(false)

  const hasHydratedDraftRef = useRef(false)
  const isHydratingDraftRef = useRef(false)
  const handledRestartRequestRef = useRef(null)

  const userRoles = useMemo(() => new Set(user?.roles || (user?.role ? [user.role] : [])), [user])
  const requiresPatientSelection = userRoles.has('doctor') || userRoles.has('admin')

  const selectedPatient = useMemo(
    () => patients.find((item) => String(item.id) === String(form.patient_id)),
    [patients, form.patient_id]
  )

  const selectedSymptoms = useMemo(
    () => SYMPTOM_FIELDS.filter((field) => Boolean(form[field.key])).map((field) => field.label),
    [form]
  )

  const selectedRiskFactors = useMemo(
    () => RISK_FACTOR_FIELDS.filter((field) => Boolean(form[field.key])).map((field) => field.label),
    [form]
  )

  const customSymptoms = useMemo(
    () => form.extra_symptoms.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean),
    [form.extra_symptoms]
  )

  const hasHypoglycemiaTrigger = useMemo(
    () => Boolean(form.sweating || form.shaking || form.dizziness),
    [form.sweating, form.shaking, form.dizziness]
  )

  const highGlucoseSignal = useMemo(() => {
    const fasting = Number(form.fasting_glucose)
    const random = Number(form.random_plasma_glucose)
    const hba1c = Number(form.hba1c)
    return (
      (!Number.isNaN(fasting) && fasting >= 250) ||
      (!Number.isNaN(random) && random >= 200) ||
      (!Number.isNaN(hba1c) && hba1c >= 10)
    )
  }, [form.fasting_glucose, form.random_plasma_glucose, form.hba1c])

  const hasUrgentTrigger = useMemo(
    () => Boolean(form.vomiting || form.abdominal_pain || highGlucoseSignal),
    [form.vomiting, form.abdominal_pain, highGlucoseSignal]
  )

  const hasAnyLabData = useMemo(() => {
    if (form.no_labs_available) return false
    if (extraLabs.length) return true
    return [
      form.fasting_glucose,
      form.hba1c,
      form.random_plasma_glucose,
    ].some((value) => String(value || '').trim() !== '')
  }, [form.no_labs_available, form.fasting_glucose, form.hba1c, form.random_plasma_glucose, extraLabs.length])

  const assessmentMode = hasAnyLabData ? 'diagnostic' : 'screening'
  const isDraftPristine = useMemo(() => {
    const hasFormChanges = Object.keys(DEFAULT_FORM).some((key) => {
      if (key === 'patient_id') return false
      return form[key] !== DEFAULT_FORM[key]
    })
    const hasQcmChanges = Object.values(qcm).some((value) => Boolean(value))
    return !result && step === 1 && maxReachedStep === 1 && extraLabs.length === 0 && !hasFormChanges && !hasQcmChanges
  }, [extraLabs.length, form, maxReachedStep, qcm, result, step])

  const currentStepMeta = STEP_ITEMS.find((item) => item.id === step) || STEP_ITEMS[0]
  const flowPercent = result ? 100 : Math.round(((step - 1) / TOTAL_STEPS) * 100)
  const stepContentKey = `${step}-${hasHypoglycemiaTrigger ? 'hypo' : 'no-hypo'}-${hasUrgentTrigger ? 'urgent' : 'no-urgent'}-${result ? 'with-result' : 'no-result'}`
  const restartRequested = Boolean(location.state?.requestRestart)
  const restartRequestId = location.state?.restartRequestId || null
  const forceRestart = Boolean(location.state?.forceRestart)

  useEffect(() => {
    isHydratingDraftRef.current = true
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return

      const parsed = JSON.parse(raw)
      if (!parsed || parsed.version !== DIAGNOSIS_DRAFT_VERSION) return

      if (parsed.form && typeof parsed.form === 'object') {
        setForm((previous) => ({ ...previous, ...parsed.form }))
      }
      if (parsed.qcm && typeof parsed.qcm === 'object') {
        setQcm((previous) => ({ ...previous, ...parsed.qcm }))
      }
      if (Array.isArray(parsed.extraLabs)) {
        setExtraLabs(parsed.extraLabs)
      }
      if (typeof parsed.step === 'number') {
        const normalizedStep = Math.max(1, Math.min(REVIEW_STEP, parsed.step))
        setStep(normalizedStep)
      }
      if (typeof parsed.maxReachedStep === 'number') {
        const normalizedMax = Math.max(1, Math.min(REVIEW_STEP, parsed.maxReachedStep))
        setMaxReachedStep(normalizedMax)
      }
      if (parsed.result && typeof parsed.result === 'object') {
        setResult(parsed.result)
      }
    } catch {
      // Ignore malformed draft storage.
    } finally {
      isHydratingDraftRef.current = false
      hasHydratedDraftRef.current = true
      setDraftReady(true)
    }
  }, [storageKey])

  useEffect(() => {
    if (!draftReady || !hasHydratedDraftRef.current || isHydratingDraftRef.current) return
    if (isDraftPristine) {
      window.localStorage.removeItem(storageKey)
      return
    }
    const draftPayload = {
      version: DIAGNOSIS_DRAFT_VERSION,
      step,
      maxReachedStep,
      form,
      qcm,
      extraLabs,
      result,
      savedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(storageKey, JSON.stringify(draftPayload))
  }, [storageKey, step, maxReachedStep, form, qcm, extraLabs, result, draftReady, isDraftPristine])

  useEffect(() => {
    if (!draftReady || (!restartRequested && !forceRestart)) return
    if (forceRestart) {
      startNewAssessment({ preservePatientId: false })
      navigate(
        { pathname: '/diagnosis', search: location.search },
        { replace: true, state: null }
      )
      return
    }
    if (!restartRequestId) return
    if (handledRestartRequestRef.current === restartRequestId) return

    handledRestartRequestRef.current = restartRequestId
    if (isDraftPristine) {
      startNewAssessment()
    } else {
      setShowRestartConfirm(true)
    }
    navigate(
      { pathname: '/diagnosis', search: location.search },
      { replace: true, state: null }
    )
  }, [draftReady, forceRestart, isDraftPristine, location.search, navigate, restartRequestId, restartRequested])

  useEffect(() => {
    if (!requiresPatientSelection) return
    loadPatients()
  }, [requiresPatientSelection])

  useEffect(() => {
    if (!requiresPatientSelection) return
    const params = new URLSearchParams(location.search)
    const patientId = params.get('patient_id')
    if (patientId) {
      setForm((previous) => ({ ...previous, patient_id: patientId }))
    }
  }, [location.search, requiresPatientSelection])

  async function loadPatients() {
    setLoadingPatients(true)
    setError('')

    try {
      const response = await api.get('/patients/?limit=200')
      const loadedPatients = getApiData(response) || []
      setPatients(loadedPatients)

      if (loadedPatients.length) {
        setForm((previous) => {
          if (previous.patient_id) return previous
          return { ...previous, patient_id: String(loadedPatients[0].id) }
        })
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load patients for assessment'))
    } finally {
      setLoadingPatients(false)
    }
  }

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  function selectQcm(questionKey, option, targetField) {
    setQcm((previous) => ({ ...previous, [questionKey]: option.id }))
    setForm((previous) => ({ ...previous, [targetField]: String(option.value) }))
  }

  function setCustomValue(questionKey, fieldName, value) {
    setQcm((previous) => ({ ...previous, [questionKey]: 'custom' }))
    setForm((previous) => ({ ...previous, [fieldName]: value }))
  }

  function addExtraLab() {
    if (!form.extra_lab_name.trim()) {
      setError('Enter a lab test name before adding.')
      return
    }
    if (!form.extra_lab_value || Number.isNaN(Number(form.extra_lab_value))) {
      setError('Enter a valid numeric lab value before adding.')
      return
    }

    setExtraLabs((previous) => [
      ...previous,
      { test_name: form.extra_lab_name.trim(), test_value: Number(form.extra_lab_value) },
    ])

    setForm((previous) => ({
      ...previous,
      extra_lab_name: '',
      extra_lab_value: '',
    }))
    setError('')
  }

  function removeExtraLab(index) {
    setExtraLabs((previous) => previous.filter((_, currentIndex) => currentIndex !== index))
  }

  function buildResultContext() {
    return {
      patient_id: form.patient_id ? Number(form.patient_id) : null,
      patient_name: requiresPatientSelection
        ? selectedPatient?.full_name || null
        : user?.name || null,
      assessment_mode: assessmentMode,
      profile: {
        age: form.age ? Number(form.age) : null,
        bmi: form.bmi ? Number(form.bmi) : null,
        waist_circumference: form.waist_circumference ? Number(form.waist_circumference) : null,
      },
      labs: {
        fasting_glucose: form.fasting_glucose ? Number(form.fasting_glucose) : null,
        hba1c: form.hba1c ? Number(form.hba1c) : null,
        random_plasma_glucose: form.random_plasma_glucose ? Number(form.random_plasma_glucose) : null,
      },
      symptoms: selectedSymptoms,
      risk_factors: selectedRiskFactors,
      adaptive_flags: {
        hypoglycemia: hasHypoglycemiaTrigger,
        urgent_dka: hasUrgentTrigger,
      },
    }
  }

  function clearDraftStorage() {
    window.localStorage.removeItem(storageKey)
  }

  function startNewAssessment(options = {}) {
    const preservePatientId = options.preservePatientId ?? requiresPatientSelection
    const preservedPatientId = preservePatientId ? form.patient_id : ''
    clearDraftStorage()
    setForm({ ...DEFAULT_FORM, patient_id: preservedPatientId })
    setQcm(DEFAULT_QCM)
    setExtraLabs([])
    setResult(null)
    setError('')
    setStep(1)
    setMaxReachedStep(1)
  }

  function confirmRestartAssessment() {
    startNewAssessment()
    setShowRestartConfirm(false)
  }

  function getStepErrors(targetStep = step) {
    const errors = []

    if (targetStep === 1) {
      if (requiresPatientSelection && !form.patient_id) {
        errors.push('Select a patient before continuing.')
      }
      if (form.age && (Number(form.age) < 0 || Number(form.age) > 120)) {
        errors.push('Age must be between 0 and 120.')
      }
      if (form.bmi && (Number(form.bmi) < 10 || Number(form.bmi) > 80)) {
        errors.push('BMI must be between 10 and 80.')
      }
      if (form.waist_circumference && (Number(form.waist_circumference) < 30 || Number(form.waist_circumference) > 250)) {
        errors.push('Waist circumference must be between 30 and 250 cm.')
      }
    }

    if (targetStep === 3) {
      const fastingRaw = String(form.fasting_glucose || '').trim()
      const hba1cRaw = String(form.hba1c || '').trim()
      const randomRaw = String(form.random_plasma_glucose || '').trim()

      if (fastingRaw) {
        const fastingGlucose = Number(fastingRaw)
        if (Number.isNaN(fastingGlucose) || fastingGlucose < 40 || fastingGlucose > 600) {
          errors.push('Fasting glucose must be between 40 and 600.')
        }
      }

      if (hba1cRaw) {
        const hba1c = Number(hba1cRaw)
        if (Number.isNaN(hba1c) || hba1c < 3 || hba1c > 20) {
          errors.push('HbA1c must be between 3 and 20.')
        }
      }

      if (randomRaw) {
        const randomGlucose = Number(randomRaw)
        if (Number.isNaN(randomGlucose) || randomGlucose < 30 || randomGlucose > 1000) {
          errors.push('Random glucose must be between 30 and 1000.')
        }
      }
    }

    return errors
  }

  function goToNextStep() {
    const errors = getStepErrors(step)
    if (errors.length) {
      setError(errors[0])
      return
    }

    setError('')
    const nextStep = Math.min(TOTAL_STEPS, step + 1)
    setStep(nextStep)
    setMaxReachedStep((previous) => Math.max(previous, nextStep))
  }

  function goToPreviousStep() {
    setError('')
    setStep((previous) => Math.max(1, previous - 1))
  }

  function jumpToStep(nextStep) {
    if (nextStep > maxReachedStep) return
    setError('')
    setStep(nextStep)
  }

  async function submitAssessment(event) {
    event.preventDefault()

    const stepErrors = getStepErrors(1).concat(getStepErrors(3))
    if (stepErrors.length) {
      setError(stepErrors[0])
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const symptoms = {
        fatigue: form.fatigue,
        blurred_vision: form.blurred_vision,
        weight_loss: form.weight_loss,
        slow_healing: form.slow_healing,
        sweating: form.sweating,
        shaking: form.shaking,
        dizziness: form.dizziness,
        vomiting: form.vomiting,
        abdominal_pain: form.abdominal_pain,
        nausea: form.nausea,
      }

      const customSymptomList = customSymptoms.map((item) => ({
        symptom_code: item.toLowerCase().replace(/\s+/g, '_'),
        symptom_name: item,
        present: true,
      }))

      const questionnaireAnswers = {
        qcm,
        yes_no: {
          symptoms: Object.fromEntries(SYMPTOM_FIELDS.map((field) => [field.key, Boolean(form[field.key])])),
          safety_symptoms: Object.fromEntries(SAFETY_SYMPTOM_FIELDS.map((field) => [field.key, Boolean(form[field.key])])),
          hypoglycemia_followup: Object.fromEntries(HYPO_BRANCH_FIELDS.map((field) => [field.key, Boolean(form[field.key])])),
          urgent_followup: Object.fromEntries(URGENT_BRANCH_FIELDS.map((field) => [field.key, Boolean(form[field.key])])),
          risk_factors: Object.fromEntries(RISK_FACTOR_FIELDS.map((field) => [field.key, Boolean(form[field.key])])),
        },
        free_text: {
          extra_symptoms: customSymptoms,
        },
      }

      const payload = {
        mode: assessmentMode,
        no_labs_available: form.no_labs_available,
        frequent_urination: form.frequent_urination,
        excessive_thirst: form.excessive_thirst,
        sweating: form.sweating,
        shaking: form.shaking,
        dizziness: form.dizziness,
        vomiting: form.vomiting,
        abdominal_pain: form.abdominal_pain,
        nausea: form.nausea,
        crisis: form.crisis,
        symptoms: customSymptomList.length
          ? [
            ...customSymptomList,
            ...Object.keys(symptoms).map((key) => ({
              symptom_code: key,
              symptom_name: key.replace('_', ' '),
              present: symptoms[key],
            })),
          ]
          : symptoms,
        risk_factors: {
          family_history: form.family_history,
          obesity: form.obesity,
          hypertension: form.hypertension,
          sedentary_lifestyle: form.sedentary_lifestyle,
          gestational_history: form.gestational_history,
          smoking: form.smoking,
        },
        questionnaire_version: 'qcm_yesno_v1',
        questionnaire_answers: questionnaireAnswers,
      }

      if (String(form.fasting_glucose || '').trim()) {
        payload.fasting_glucose = Number(form.fasting_glucose)
      }
      if (String(form.hba1c || '').trim()) {
        payload.hba1c = Number(form.hba1c)
      }
      if (String(form.random_plasma_glucose || '').trim()) {
        payload.random_plasma_glucose = Number(form.random_plasma_glucose)
      }

      if (form.age) payload.age = Number(form.age)
      if (form.bmi) payload.bmi = Number(form.bmi)
      if (form.waist_circumference) payload.waist_circumference = Number(form.waist_circumference)
      if (!form.no_labs_available && extraLabs.length) payload.labs = extraLabs
      if (requiresPatientSelection) payload.patient_id = Number(form.patient_id)

      const response = await api.post('/diagnosis/', payload)
      const resultData = getApiData(response)
      setResult(resultData)
      setStep(REVIEW_STEP)
      setMaxReachedStep(REVIEW_STEP)

      const snapshot = {
        result: resultData,
        context: buildResultContext(),
        savedAt: new Date().toISOString(),
      }
      saveDiagnosisResultSnapshot({ user, result: resultData, context: snapshot.context })
      navigate('/diagnosis/result', { state: snapshot })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Assessment failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const trackInsetPercent = 50 / TOTAL_STEPS
  const stepFillPercent = result ? 100 : ((step - 1) / (TOTAL_STEPS - 1)) * 100


  return (
    <div className="space-y-5">
      <section className="surface border-0 p-5 sm:p-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-5 px-1 sm:px-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <span>Assessment Flow</span>
              <span>{flowPercent}% Complete</span>
            </div>
            <div className="mt-4 overflow-x-auto pb-1">
              <ol className="relative mx-auto flex min-w-[760px] max-w-screen-lg items-start gap-0">
                <div
                  className="pointer-events-none absolute top-5"
                  style={{ left: `${trackInsetPercent}%`, right: `${trackInsetPercent}%` }}
                >
                  <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div
                    className="absolute left-0 top-0 h-1 rounded-full bg-primary-500 transition-all duration-300 dark:bg-primary-500"
                    style={{ width: `${stepFillPercent}%` }}
                  />
                </div>
                {STEP_ITEMS.map((item) => {
                  const status = result
                    ? 'active'
                    : item.id < step
                      ? 'active'
                      : item.id === step
                        ? 'pending'
                        : 'inactive'
                  return (
                    <StepNavItem
                      key={item.id}
                      item={item}
                      status={status}
                      locked={item.id > maxReachedStep}
                      onClick={() => jumpToStep(item.id)}
                    />
                  )
                })}
              </ol>
            </div>
          </div>

          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="section-title">{currentStepMeta.title}</h2>
                <p className="section-subtitle mt-1">{currentStepMeta.description}</p>
              </div>
              <StatusBadge tone="info">Step {step}/{TOTAL_STEPS}</StatusBadge>
            </div>

            <form onSubmit={submitAssessment} className="space-y-4">
              <div key={stepContentKey} className="assessment-step-enter">
              {step === 1 ? (
                <div className="assessment-step-list space-y-4">
                  {requiresPatientSelection ? (
                    <QuestionCard title="Who is being assessed?">
                      {loadingPatients ? (
                        <LoadingState label="Loading patients..." />
                      ) : (
                        <AppSelect
                          value={form.patient_id}
                          onValueChange={(value) => updateField('patient_id', value)}
                          includeEmpty
                          emptyLabel={patients.length ? 'Select patient' : 'No patients available'}
                          options={patients.map((patient) => ({
                            value: String(patient.id),
                            label: `${patient.full_name} (#${patient.id})`,
                          }))}
                        />
                      )}
                    </QuestionCard>
                  ) : null}

                  <QuestionCard title="Age group (QCM)" helper="Select best match, or type exact value.">
                    <QcmOptions value={qcm.age_group} options={AGE_OPTIONS} onChange={(option) => selectQcm('age_group', option, 'age')} />
                    <label className="mt-3 block">
                      <span className="label-text">Exact age (optional override)</span>
                      <input
                        className="input-base"
                        type="number"
                        min={0}
                        max={120}
                        value={form.age}
                        onChange={(event) => setCustomValue('age_group', 'age', event.target.value)}
                      />
                    </label>
                  </QuestionCard>

                  <QuestionCard title="BMI profile (QCM)">
                    <QcmOptions value={qcm.bmi_group} options={BMI_OPTIONS} onChange={(option) => selectQcm('bmi_group', option, 'bmi')} />
                    <label className="mt-3 block">
                      <span className="label-text">Exact BMI (optional override)</span>
                      <input
                        className="input-base"
                        type="number"
                        min={10}
                        max={80}
                        step="0.1"
                        value={form.bmi}
                        onChange={(event) => setCustomValue('bmi_group', 'bmi', event.target.value)}
                      />
                    </label>
                  </QuestionCard>

                  <QuestionCard title="Waist risk profile (QCM)">
                    <QcmOptions value={qcm.waist_group} options={WAIST_OPTIONS} onChange={(option) => selectQcm('waist_group', option, 'waist_circumference')} />
                    <label className="mt-3 block">
                      <span className="label-text">Exact waist (cm, optional override)</span>
                      <input
                        className="input-base"
                        type="number"
                        min={30}
                        max={250}
                        step="0.1"
                        value={form.waist_circumference}
                        onChange={(event) => setCustomValue('waist_group', 'waist_circumference', event.target.value)}
                      />
                    </label>
                  </QuestionCard>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="assessment-step-list space-y-4">
                  <QuestionCard title="Common symptoms">
                    <CheckboxListQuestion
                      items={SYMPTOM_FIELDS}
                      values={form}
                      onToggle={(fieldKey, checked) => updateField(fieldKey, checked)}
                      helper="Check all symptoms that apply."
                    />
                  </QuestionCard>

                  <QuestionCard title="Safety symptoms (for smart branching)">
                    <CheckboxListQuestion
                      items={SAFETY_SYMPTOM_FIELDS}
                      values={form}
                      onToggle={(fieldKey, checked) => updateField(fieldKey, checked)}
                      helper="These help the system detect low-sugar and urgent-risk patterns."
                    />
                  </QuestionCard>

                  {hasHypoglycemiaTrigger ? (
                    <QuestionCard
                      title="Hypoglycemia follow-up"
                      helper="Shown because sweating, shaking, or dizziness was selected."
                      className="assessment-branch-card"
                    >
                      <CheckboxListQuestion
                        items={HYPO_BRANCH_FIELDS}
                        values={form}
                        onToggle={(fieldKey, checked) => updateField(fieldKey, checked)}
                      />
                    </QuestionCard>
                  ) : null}

                  {hasUrgentTrigger ? (
                    <QuestionCard
                      title="Urgent / DKA follow-up"
                      helper="Shown because vomiting, abdominal pain, or high glucose pattern was detected."
                      className="assessment-branch-card"
                    >
                      <CheckboxListQuestion
                        items={URGENT_BRANCH_FIELDS}
                        values={form}
                        onToggle={(fieldKey, checked) => updateField(fieldKey, checked)}
                      />
                    </QuestionCard>
                  ) : null}

                  <QuestionCard title="Any other symptoms?" helper="Type extra symptoms separated by commas.">
                    <textarea
                      className="input-base min-h-[90px] resize-y"
                      value={form.extra_symptoms}
                      onChange={(event) => updateField('extra_symptoms', event.target.value)}
                      placeholder="e.g. dry_mouth, tingling_feet"
                    />
                  </QuestionCard>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="assessment-step-list space-y-4">
                  <QuestionCard title="Lab availability">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary-600"
                        checked={Boolean(form.no_labs_available)}
                        onChange={(event) => {
                          const checked = event.target.checked
                          updateField('no_labs_available', checked)
                          if (checked) {
                            setForm((previous) => ({
                              ...previous,
                              fasting_glucose: '',
                              hba1c: '',
                              random_plasma_glucose: '',
                            }))
                            setQcm((previous) => ({
                              ...previous,
                              fasting_group: '',
                              hba1c_group: '',
                            }))
                            setExtraLabs([])
                          }
                        }}
                      />
                      I do not have lab results right now (continue in screening mode).
                    </label>
                    <p className="mt-2 text-xs text-slate-500">
                      Current mode: <span className="font-medium capitalize">{assessmentMode}</span>
                    </p>
                  </QuestionCard>

                  <QuestionCard title="Fasting glucose range (QCM)" helper="Optional: select range, then optionally override exact value.">
                    <QcmOptions
                      value={qcm.fasting_group}
                      options={FASTING_OPTIONS}
                      onChange={(option) => selectQcm('fasting_group', option, 'fasting_glucose')}
                    />
                    <label className="mt-3 block">
                      <span className="label-text">Exact fasting glucose</span>
                      <input
                        className="input-base"
                        type="number"
                        value={form.fasting_glucose}
                        disabled={form.no_labs_available}
                        onChange={(event) => setCustomValue('fasting_group', 'fasting_glucose', event.target.value)}
                      />
                    </label>
                  </QuestionCard>

                  <QuestionCard title="HbA1c range (QCM)" helper="Optional: select range, then optionally override exact value.">
                    <QcmOptions
                      value={qcm.hba1c_group}
                      options={HBA1C_OPTIONS}
                      onChange={(option) => selectQcm('hba1c_group', option, 'hba1c')}
                    />
                    <label className="mt-3 block">
                      <span className="label-text">Exact HbA1c</span>
                      <input
                        className="input-base"
                        type="number"
                        step="0.1"
                        value={form.hba1c}
                        disabled={form.no_labs_available}
                        onChange={(event) => setCustomValue('hba1c_group', 'hba1c', event.target.value)}
                      />
                    </label>
                  </QuestionCard>

                  <QuestionCard title="Random glucose (optional)">
                    <label className="block">
                      <span className="label-text">Random plasma glucose (mg/dL)</span>
                      <input
                        className="input-base"
                        type="number"
                        min={30}
                        max={1000}
                        value={form.random_plasma_glucose}
                        disabled={form.no_labs_available}
                        onChange={(event) => updateField('random_plasma_glucose', event.target.value)}
                      />
                    </label>
                  </QuestionCard>

                  <QuestionCard title="Additional lab values">
                    <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_auto]">
                      <input className="input-base" placeholder="Lab name" disabled={form.no_labs_available} value={form.extra_lab_name} onChange={(event) => updateField('extra_lab_name', event.target.value)} />
                      <input className="input-base" placeholder="Value" type="number" disabled={form.no_labs_available} step="0.01" value={form.extra_lab_value} onChange={(event) => updateField('extra_lab_value', event.target.value)} />
                      <button type="button" className="btn-secondary gap-1.5" disabled={form.no_labs_available} onClick={addExtraLab}>
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </div>

                    {extraLabs.length ? (
                      <ul className="mt-3 space-y-2">
                        {extraLabs.map((lab, index) => (
                          <li key={`lab-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                            <span>{lab.test_name}: <strong>{lab.test_value}</strong></span>
                            <button type="button" className="btn-secondary gap-1 px-2.5 py-1.5 text-xs" onClick={() => removeExtraLab(index)}>
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">No additional labs added.</p>
                    )}
                  </QuestionCard>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="assessment-step-list space-y-4">
                  <QuestionCard title="Risk factors checklist">
                    <CheckboxListQuestion
                      items={RISK_FACTOR_FIELDS}
                      values={form}
                      onToggle={(fieldKey, checked) => updateField(fieldKey, checked)}
                      helper="Check all risk factors present."
                    />
                  </QuestionCard>
                </div>
              ) : null}

              {step === REVIEW_STEP ? (
                <div className="assessment-step-list space-y-4">
                  <QuestionCard title="Quick review before analysis" helper="Please check this summary before you run diagnosis.">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/50">
                      <div className="bg-primary-600 px-4 py-2.5 text-white dark:bg-primary-700">
                        <p className="text-sm font-semibold uppercase tracking-[0.08em]">Patient Info Summary</p>
                      </div>
                      <dl className="divide-y divide-slate-200 dark:divide-slate-700">
                        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:items-center">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient</dt>
                          <dd className="text-sm text-slate-800 dark:text-slate-100">
                            {requiresPatientSelection
                              ? selectedPatient
                                ? `${selectedPatient.full_name} (#${selectedPatient.id})`
                                : 'Not selected'
                              : user?.name || 'Current user'}
                          </dd>
                        </div>
                        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:items-center">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assessment mode</dt>
                          <dd className="text-sm capitalize text-slate-800 dark:text-slate-100">{assessmentMode}</dd>
                        </div>
                        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:items-center">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Age / Body Mass / Waist</dt>
                          <dd className="text-sm text-slate-800 dark:text-slate-100">{form.age || '-'} / {form.bmi || '-'} / {form.waist_circumference || '-'}</dd>
                        </div>
                        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:items-center">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Glucose tests (Fasting / HbA1c / Random)</dt>
                          <dd className="text-sm text-slate-800 dark:text-slate-100">
                            {form.fasting_glucose || '-'} / {form.hba1c || '-'} / {form.random_plasma_glucose || '-'}
                          </dd>
                        </div>
                        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:items-center">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Symptoms / Risk Factors</dt>
                          <dd className="text-sm text-slate-800 dark:text-slate-100">{selectedSymptoms.length + customSymptoms.length} / {selectedRiskFactors.length}</dd>
                        </div>
                        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:items-center">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adaptive branch flags</dt>
                          <dd className="text-sm text-slate-800 dark:text-slate-100">
                            Hypoglycemia: {hasHypoglycemiaTrigger ? 'On' : 'Off'} | Urgent/DKA: {hasUrgentTrigger ? 'On' : 'Off'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </QuestionCard>

                  {result ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        Result generated successfully. Open the dedicated report page for full clinical explanation.
                      </p>
                      <div className="mt-2">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => navigate('/diagnosis/result')}
                        >
                          Open Result Report
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-slate-500">
                        Submit this assessment to generate diagnosis output.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
              </div>

              <ErrorAlert message={error} />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
                <span className="text-xs text-slate-500">
                  {step < REVIEW_STEP
                    ? 'Answer each section, then continue.'
                    : result
                      ? 'Diagnosis result is ready. You can adjust inputs and run again.'
                      : 'Check your summary, then run diagnosis.'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {step > 1 ? (
                    <button type="button" className="btn-secondary gap-1.5" onClick={goToPreviousStep}>
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                  ) : null}

                  {step < REVIEW_STEP ? (
                    <button type="button" className="btn-primary gap-1.5" onClick={goToNextStep}>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : null}

                  {step === REVIEW_STEP ? (
                    <button type="submit" className="btn-primary gap-1.5" disabled={submitting}>
                      <Send className="h-4 w-4" />
                      {submitting ? 'Running...' : result ? 'Run Again' : 'Run Expert System'}
                    </button>
                  ) : null}

                  {step === REVIEW_STEP && result ? (
                    <>
                      <button type="button" className="btn-primary gap-1.5" onClick={() => setShowRestartConfirm(true)}>
                        <RotateCcw className="h-4 w-4" />
                        New Assessment
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={showRestartConfirm}
        title="Start New Assessment?"
        description="This will clear the current draft and result from this device. Continue only if you want to restart."
        cancelLabel="Cancel"
        confirmLabel="Start New"
        confirmTone="danger"
        onCancel={() => setShowRestartConfirm(false)}
        onConfirm={confirmRestartAssessment}
      />
    </div>
  )
}
