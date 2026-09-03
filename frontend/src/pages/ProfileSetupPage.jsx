import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/auth/LanguageSwitcher'
import { cn } from '@/lib/utils'

const NS = 'profileSetup'
const TOTAL_STEPS = 3

const GENDER_OPTIONS = [
  { value: 'male', labelKey: `${NS}.genderMale`, fallback: 'Male' },
  { value: 'female', labelKey: `${NS}.genderFemale`, fallback: 'Female' },
  { value: 'other', labelKey: `${NS}.genderOther`, fallback: 'Other' },
]

const RISK_PILLS = [
  { key: 'family_history', labelKey: `${NS}.riskFamily`, fallback: 'Family history of diabetes' },
  { key: 'hypertension', labelKey: `${NS}.riskHypertension`, fallback: 'High blood pressure' },
  { key: 'high_cholesterol', labelKey: `${NS}.riskCholesterol`, fallback: 'High cholesterol' },
  { key: 'smoking', labelKey: `${NS}.riskSmoking`, fallback: 'I smoke' },
  { key: 'sedentary_lifestyle', labelKey: `${NS}.riskSedentary`, fallback: 'Mostly sedentary lifestyle' },
]

const fieldLabel = 'text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'
const fieldInput = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-primary-900/40'

function computeAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const birth = new Date(dateOfBirth)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1
  return age >= 0 && age < 130 ? age : null
}

function computeBmi(heightCm, weightKg) {
  const h = Number(heightCm)
  const w = Number(weightKg)
  if (!h || !w || h <= 0 || w <= 0) return null
  const bmi = w / ((h / 100) * (h / 100))
  return bmi > 0 && bmi < 200 ? Math.round(bmi * 10) / 10 : null
}

function StepProgress({ step, t }) {
  return (
    <div className="flex items-center gap-2" aria-label={t(`${NS}.stepProgress`, 'Step {{current}} of {{total}}', { current: step, total: TOTAL_STEPS })}>
      {Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1).map((s) => (
        <span
          key={s}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            s === step ? 'w-8 bg-primary-600 dark:bg-primary-400' : s < step ? 'w-4 bg-primary-300 dark:bg-primary-700' : 'w-4 bg-slate-200 dark:bg-slate-700'
          )}
        />
      ))}
    </div>
  )
}

export function ProfileSetupPage() {
  const { user, setUser, refreshUser } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState({
    gender: '',
    date_of_birth: '',
    height_cm: '',
    weight_kg: '',
    waist_circumference: '',
    family_history: false,
    hypertension: false,
    high_cholesterol: false,
    smoking: false,
    sedentary_lifestyle: false,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const age = useMemo(() => computeAge(profile.date_of_birth), [profile.date_of_birth])
  const bmi = useMemo(() => computeBmi(profile.height_cm, profile.weight_kg), [profile.height_cm, profile.weight_kg])

  const update = (patch) => setProfile((current) => ({ ...current, ...patch }))

  // Returning to the wizard after a previous attempt? Restore whatever was
  // already saved so nothing gets typed twice, and skip straight to the
  // dashboard when the profile was actually completed.
  useEffect(() => {
    let cancelled = false
    api.get('/patients/mine')
      .then((response) => {
        const saved = getApiData(response)
        if (cancelled || !saved) return
        if (saved.profile_completed_at) {
          navigate('/dashboard', { replace: true })
          return
        }
        setProfile((current) => ({
          ...current,
          gender: saved.gender && saved.gender !== 'unknown' ? saved.gender : current.gender,
          date_of_birth: saved.date_of_birth ? String(saved.date_of_birth).slice(0, 10) : current.date_of_birth,
          height_cm: saved.height_cm ?? current.height_cm,
          weight_kg: saved.weight_kg ?? current.weight_kg,
          waist_circumference: saved.waist_circumference ?? current.waist_circumference,
          family_history: Boolean(saved.family_history),
          hypertension: Boolean(saved.hypertension),
          high_cholesterol: Boolean(saved.high_cholesterol),
          smoking: Boolean(saved.smoking),
          sedentary_lifestyle: Boolean(saved.sedentary_lifestyle),
        }))
      })
      .catch(() => { /* offline — the wizard still works with blank defaults */ })
    return () => { cancelled = true }
  }, [])

  function validateStep(current) {
    if (current === 1) {
      if (!profile.gender) return t(`${NS}.errors.gender`, 'Please choose a gender option.')
      if (!profile.date_of_birth) return t(`${NS}.errors.dob`, 'Please enter your date of birth.')
      if (age === null || age < 1 || age > 120) return t(`${NS}.errors.dobRange`, 'Please enter a valid date of birth.')
    }
    if (current === 2) {
      const h = Number(profile.height_cm)
      const w = Number(profile.weight_kg)
      if (!profile.height_cm || h < 80 || h > 250) return t(`${NS}.errors.height`, 'Please enter a height between 80 and 250 cm.')
      if (!profile.weight_kg || w < 20 || w > 400) return t(`${NS}.errors.weight`, 'Please enter a weight between 20 and 400 kg.')
      const waist = Number(profile.waist_circumference)
      if (profile.waist_circumference && (waist < 40 || waist > 200)) return t(`${NS}.errors.waist`, 'Please enter a waist between 40 and 200 cm.')
    }
    return ''
  }

  function goNext() {
    const message = validateStep(step)
    if (message) { setError(message); return }
    setError('')
    setStep((current) => Math.min(TOTAL_STEPS, current + 1))
  }

  function goBack() {
    setError('')
    setStep((current) => Math.max(1, current - 1))
  }

  async function handleFinish() {
    setSaving(true)
    setError('')
    try {
      await api.patch('/patients/mine', {
        gender: profile.gender,
        date_of_birth: profile.date_of_birth || null,
        height_cm: profile.height_cm ? Number(profile.height_cm) : null,
        weight_kg: profile.weight_kg ? Number(profile.weight_kg) : null,
        waist_circumference: profile.waist_circumference ? Number(profile.waist_circumference) : null,
        smoking: profile.smoking,
        sedentary_lifestyle: profile.sedentary_lifestyle,
        family_history: profile.family_history,
        hypertension: profile.hypertension,
        high_cholesterol: profile.high_cholesterol,
        profile_complete: true,
      })
      // The save is durable — flip the flag optimistically so the profile
      // gate lets us through even if the refetch below hiccups.
      setUser((current) => ({ ...(current || {}), profile_completed: true }))
      try {
        await refreshUser()
      } catch {
        // A stale-but-flagged user is good enough to reach the dashboard.
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, t(`${NS}.errors.save`, 'Could not save your profile. Please try again.')))
    } finally {
      setSaving(false)
    }
  }

  const stepTitles = [
    t(`${NS}.step1.title`, 'About you'),
    t(`${NS}.step2.title`, 'Your body'),
    t(`${NS}.step3.title`, 'Health background'),
  ]
  const stepDescriptions = [
    t(`${NS}.step1.description`, 'Two quick details so your assessments start pre-filled.'),
    t(`${NS}.step2.description`, 'Used to calculate your BMI automatically — no need to type it later.'),
    t(`${NS}.step3.description`, 'Optional — these feed the risk analysis only if they apply to you.'),
  ]

  const primaryButtonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <LanguageSwitcher style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 20 }} />
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between gap-4">
          <StepProgress step={step} t={t} />
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            {t(`${NS}.stepLabel`, 'Step {{current}}/{{total}}', { current: step, total: TOTAL_STEPS })}
          </span>
        </div>

        <div className="surface rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
              <UserRound className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
                {stepTitles[step - 1]}
              </h1>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {t(`${NS}.welcome`, 'Hi {{name}} — let’s set up your health profile.', { name: (user?.name || '').split(' ')[0] })}
              </p>
            </div>
          </div>

          <p className="mt-4 rounded-xl bg-primary-50/70 px-3.5 py-2.5 text-xs leading-5 text-primary-800 dark:bg-primary-950/30 dark:text-primary-200">
            {stepDescriptions[step - 1]}
          </p>
          {/* Step 1: About you */}
          {step === 1 ? (
            <div className="mt-6 space-y-5">
              <div>
                <p className={fieldLabel}>{t(`${NS}.genderLabel`, 'Gender')}</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {GENDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update({ gender: option.value })}
                      className={cn(
                        'min-h-11 rounded-xl border px-3 text-sm font-semibold transition-all',
                        profile.gender === option.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-950/40 dark:text-primary-200'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-800'
                      )}
                    >
                      {t(option.labelKey, option.fallback)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="dob" className={fieldLabel}>{t(`${NS}.dobLabel`, 'Date of birth')}</label>
                <input
                  id="dob"
                  type="date"
                  value={profile.date_of_birth}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => update({ date_of_birth: event.target.value })}
                  className={fieldInput}
                />
                {age !== null ? (
                  <p className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {t(`${NS}.agePreview`, '{{age}} years old', { age })}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
          {/* Step 2: Body metrics */}
          {step === 2 ? (
            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="height" className={fieldLabel}>{t(`${NS}.heightLabel`, 'Height (cm)')}</label>
                  <input
                    id="height"
                    type="number"
                    inputMode="decimal"
                    min="80"
                    max="250"
                    value={profile.height_cm}
                    onChange={(event) => update({ height_cm: event.target.value })}
                    className={fieldInput}
                    placeholder="170"
                  />
                </div>
                <div>
                  <label htmlFor="weight" className={fieldLabel}>{t(`${NS}.weightLabel`, 'Weight (kg)')}</label>
                  <input
                    id="weight"
                    type="number"
                    inputMode="decimal"
                    min="20"
                    max="400"
                    value={profile.weight_kg}
                    onChange={(event) => update({ weight_kg: event.target.value })}
                    className={fieldInput}
                    placeholder="65"
                  />
                </div>
              </div>

              {bmi !== null ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                  <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    {t(`${NS}.bmiPreview`, 'Your BMI: {{value}} — calculated automatically in every assessment.', { value: bmi })}
                  </p>
                </div>
              ) : null}

              <div>
                <label htmlFor="waist" className={fieldLabel}>
                  {t(`${NS}.waistLabel`, 'Waist (cm)')} <span className="normal-case text-slate-400">({t(`${NS}.optional`, 'optional')})</span>
                </label>
                <input
                  id="waist"
                  type="number"
                  inputMode="decimal"
                  min="40"
                  max="200"
                  value={profile.waist_circumference}
                  onChange={(event) => update({ waist_circumference: event.target.value })}
                  className={fieldInput}
                  placeholder="80"
                />
              </div>
            </div>
          ) : null}
          {/* Step 3: Health background */}
          {step === 3 ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {RISK_PILLS.map((pill) => {
                  const active = profile[pill.key]
                  return (
                    <button
                      key={pill.key}
                      type="button"
                      onClick={() => update({ [pill.key]: !active })}
                      aria-pressed={active}
                      className={cn(
                        'inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all',
                        active
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-950/40 dark:text-primary-200'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-800'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                          active ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300 text-transparent dark:border-slate-600'
                        )}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {t(pill.labelKey, pill.fallback)}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs leading-5 text-slate-400 dark:text-slate-500">
                {t(`${NS}.privacyNote`, 'Only you and your care team can see this. You can change it anytime in your profile.')}
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="mt-5 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </p>
          ) : null}

          {/* Actions */}
          <div className="mt-7 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                {t(`${NS}.back`, 'Back')}
              </button>
            ) : (
              <span />
            )}

            {step < TOTAL_STEPS ? (
              <button type="button" onClick={goNext} className={primaryButtonClass}>
                {t(`${NS}.continue`, 'Continue')}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={handleFinish} disabled={saving} className={primaryButtonClass}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? t(`${NS}.saving`, 'Saving...') : t(`${NS}.finish`, 'Finish setup')}
              </button>
            )}
          </div>



        </div>

        <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
          {t(`${NS}.footnote`, 'These answers replace the profile questions inside every assessment — less typing, more accuracy.')}
        </p>
      </div>
    </div>
  )
}
