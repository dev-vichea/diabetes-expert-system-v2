import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Loader2, Save, UserRound } from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

/*
 * Profile page — the "You can change it anytime in your profile" promise from
 * the first-login wizard. Shows account details, and for patient accounts an
 * editable health profile saved through PATCH /patients/mine (the same safe
 * field whitelist the setup wizard uses). Staff accounts see account details
 * only.
 */

const NS = 'profilePage'
const SETUP = 'profileSetup'

const GENDER_OPTIONS = [
  { value: 'male', labelKey: `${SETUP}.genderMale`, fallback: 'Male' },
  { value: 'female', labelKey: `${SETUP}.genderFemale`, fallback: 'Female' },
  { value: 'other', labelKey: `${SETUP}.genderOther`, fallback: 'Other' },
]

const RISK_PILLS = [
  { key: 'family_history', labelKey: `${SETUP}.riskFamily`, fallback: 'Family history of diabetes' },
  { key: 'hypertension', labelKey: `${SETUP}.riskHypertension`, fallback: 'High blood pressure' },
  { key: 'high_cholesterol', labelKey: `${SETUP}.riskCholesterol`, fallback: 'High cholesterol' },
  { key: 'smoking', labelKey: `${SETUP}.riskSmoking`, fallback: 'I smoke' },
  { key: 'sedentary_lifestyle', labelKey: `${SETUP}.riskSedentary`, fallback: 'Mostly sedentary lifestyle' },
]

const fieldLabel = 'text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'
const fieldInput = 'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-primary-900/40'

const EMPTY_FORM = {
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
}

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

function profileFromData(data) {
  return {
    gender: data?.gender || '',
    date_of_birth: data?.date_of_birth || '',
    height_cm: data?.height_cm != null ? String(data.height_cm) : '',
    weight_kg: data?.weight_kg != null ? String(data.weight_kg) : '',
    waist_circumference: data?.waist_circumference != null ? String(data.waist_circumference) : '',
    family_history: Boolean(data?.family_history),
    hypertension: Boolean(data?.hypertension),
    high_cholesterol: Boolean(data?.high_cholesterol),
    smoking: Boolean(data?.smoking),
    sedentary_lifestyle: Boolean(data?.sedentary_lifestyle),
  }
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { t } = useLanguage()

  const isPatient = Boolean(user?.patient_id)
  const [form, setForm] = useState(EMPTY_FORM)
  const [baseline, setBaseline] = useState(null)
  const [loading, setLoading] = useState(isPatient)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const flashTimer = useRef(null)

  useEffect(() => {
    if (!isPatient) { setLoading(false); return undefined }
    let cancelled = false
    async function load() {
      try {
        const data = getApiData(await api.get('/patients/mine'))
        if (cancelled || !data) return
        const next = profileFromData(data)
        setBaseline(JSON.stringify(next))
        setForm(next)
      } catch (e) {
        if (!cancelled) setLoadError(getApiErrorMessage(e, t(`${NS}.loadFailed`, 'Could not load your health profile.')))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
  }, [isPatient]) // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = baseline !== null && JSON.stringify(form) !== baseline
  const age = useMemo(() => computeAge(form.date_of_birth), [form.date_of_birth])
  const bmi = useMemo(() => computeBmi(form.height_cm, form.weight_kg), [form.height_cm, form.weight_kg])

  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const activeRole = user?.roles?.[0] || user?.role || 'user'

  function update(patch) {
    setError('')
    setForm((prev) => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    setError('')
    const h = Number(form.height_cm)
    const w = Number(form.weight_kg)
    const wa = Number(form.waist_circumference)
    if (form.height_cm && (Number.isNaN(h) || h < 80 || h > 250)) {
      setError(t(`${SETUP}.errors.height`, 'Please enter a height between 80 and 250 cm.'))
      return
    }
    if (form.weight_kg && (Number.isNaN(w) || w < 20 || w > 400)) {
      setError(t(`${SETUP}.errors.weight`, 'Please enter a weight between 20 and 400 kg.'))
      return
    }
    if (form.waist_circumference && (Number.isNaN(wa) || wa < 40 || wa > 200)) {
      setError(t(`${SETUP}.errors.waist`, 'Please enter a waist between 40 and 200 cm.'))
      return
    }

    const payload = {}
    if (form.gender) payload.gender = form.gender
    if (form.date_of_birth) payload.date_of_birth = form.date_of_birth
    if (form.height_cm && !Number.isNaN(h)) payload.height_cm = h
    if (form.weight_kg && !Number.isNaN(w)) payload.weight_kg = w
    if (form.waist_circumference && !Number.isNaN(wa)) payload.waist_circumference = wa
    for (const pill of RISK_PILLS) payload[pill.key] = Boolean(form[pill.key])

    setSaving(true)
    try {
      const data = getApiData(await api.patch('/patients/mine', payload))
      const next = data ? profileFromData(data) : form
      setBaseline(JSON.stringify(next))
      setForm(next)
      refreshUser()
      setSavedFlash(true)
      if (flashTimer.current) clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setSavedFlash(false), 2500)
    } catch (e) {
      setError(getApiErrorMessage(e, t(`${SETUP}.errors.save`, 'Could not save your profile. Please try again.')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t(`${NS}.title`, 'Your profile')}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(`${NS}.subtitle`, 'Account details and the health profile your assessments pre-fill from.')}</p>

      {/* Account card */}
      <div className="surface mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-primary-500 to-sky-500 text-lg font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-slate-900 dark:text-slate-50">{user?.name || t('common.user', 'User')}</p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user?.email || t('common.noEmail', 'No email')}</p>
            <p className="mt-1.5 inline-flex rounded-full bg-primary-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
              {t(`roles.${activeRole}`)}
            </p>
          </div>
        </div>
      </div>

      {/* Health profile (patients only) */}
      {isPatient ? (
        <div className="surface mt-5 p-5 sm:p-7">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{t(`${NS}.healthTitle`, 'Health profile')}</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t(`${NS}.healthSubtitle`, 'Keep this up to date — every new assessment starts pre-filled from here.')}</p>

          {loading ? (
            <div className="py-10"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-500" /></div>
          ) : loadError ? (
            <p className="mt-5 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{loadError}</p>
          ) : (
            <>
              {/* About you */}
              <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t(`${SETUP}.step1.title`, 'About you')}</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className={fieldLabel}>{t(`${SETUP}.genderLabel`, 'Gender')}</span>
                    <div className="mt-1.5 grid grid-cols-3 gap-2">
                      {GENDER_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => update({ gender: opt.value })}
                          aria-pressed={form.gender === opt.value}
                          className={cn(
                            'min-h-11 rounded-xl border-2 px-2 text-sm font-semibold transition-all',
                            form.gender === opt.value
                              ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-700',
                          )}
                        >
                          {t(opt.labelKey, opt.fallback)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className={fieldLabel}>{t(`${SETUP}.dobLabel`, 'Date of birth')}</span>
                    <input
                      className={fieldInput}
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={form.date_of_birth}
                      onChange={(e) => update({ date_of_birth: e.target.value })}
                    />
                    {age !== null ? (
                      <p className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {t(`${SETUP}.agePreview`, '{{age}} years old', { age })}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Your body */}
              <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t(`${SETUP}.step2.title`, 'Your body')}</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className={fieldLabel}>{t(`${SETUP}.heightLabel`, 'Height (cm)')}</span>
                    <input className={fieldInput} type="number" min={80} max={250} step="0.1" placeholder="e.g. 170" value={form.height_cm} onChange={(e) => update({ height_cm: e.target.value })} />
                  </div>
                  <div>
                    <span className={fieldLabel}>{t(`${SETUP}.weightLabel`, 'Weight (kg)')}</span>
                    <input className={fieldInput} type="number" min={20} max={400} step="0.1" placeholder="e.g. 65" value={form.weight_kg} onChange={(e) => update({ weight_kg: e.target.value })} />
                  </div>
                </div>
                {bmi !== null ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {t(`${SETUP}.bmiPreview`, 'Your BMI: {{value}} — calculated automatically in every assessment.', { value: bmi })}
                  </p>
                ) : null}
                <div className="mt-4">
                  <span className={fieldLabel}>
                    {t(`${SETUP}.waistLabel`, 'Waist (cm)')}
                    <span className="ml-1.5 normal-case text-slate-400">{t(`${SETUP}.optional`, 'optional')}</span>
                  </span>
                  <input className={fieldInput} type="number" min={40} max={200} step="0.1" placeholder="e.g. 95" value={form.waist_circumference} onChange={(e) => update({ waist_circumference: e.target.value })} />
                </div>
              </div>

              {/* Health background */}
              <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t(`${SETUP}.step3.title`, 'Health background')}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t(`${SETUP}.step3.description`, 'Optional — these feed the risk analysis only if they apply to you.')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {RISK_PILLS.map((pill) => {
                    const active = form[pill.key]
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
                            : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-800',
                        )}
                      >
                        <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border transition-colors', active ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300 text-transparent dark:border-slate-600')}>
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {t(pill.labelKey, pill.fallback)}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400 dark:text-slate-500">
                  {t(`${SETUP}.privacyNote`, 'Only you and your care team can see this. You can change it anytime in your profile.')}
                </p>
              </div>

              {error ? (
                <p className="mt-5 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>
              ) : null}

              {/* Save bar */}
              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                <span className={cn('mr-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-600 transition-opacity dark:text-emerald-400', savedFlash ? 'opacity-100' : 'opacity-0')}>
                  <Check className="h-3.5 w-3.5" /> {t(`${NS}.saved`, 'Saved')}
                </span>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all',
                    isDirty && !saving
                      ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700'
                      : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
                  )}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? t(`${SETUP}.saving`, 'Saving...') : t(`${NS}.save`, 'Save changes')}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="surface mt-5 flex items-start gap-3 p-5 text-sm text-slate-600 dark:text-slate-300">
          <UserRound className="mt-0.5 h-4.5 w-4.5 shrink-0 text-slate-400" />
          <p>{t(`${NS}.staffNote`, 'You are signed in as staff — the health profile section is only shown for patient accounts.')}</p>
        </div>
      )}
    </div>
  )
}

