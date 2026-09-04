import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Briefcase,
  Camera,
  Check,
  Hospital,
  Loader2,
  Save,
  Trash2,
  UserRound,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { UserAvatar } from '@/components/ui'
import { cn } from '@/lib/utils'

/*
 * Profile page — allows users to upload profile pictures, manage personal contact
 * details, and for staff roles (Doctor, Admin, Reviewer) configure professional
 * credentials (title, department, affiliation, license, clinical bio). For patient
 * accounts, preserves the pre-filling health profile.
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

const EMPTY_HEALTH_FORM = {
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

function getRoleMeta(role, t) {
  const normalized = String(role || 'user').toLowerCase().trim()
  if (normalized === 'doctor' || normalized === 'physician') {
    return {
      label: t('roles.doctor', 'Doctor'),
      badgeClass: 'bg-cyan-100 text-cyan-800 ring-1 ring-cyan-600/20 dark:bg-cyan-950/50 dark:text-cyan-300 dark:ring-cyan-500/30',
      avatarGradient: 'from-cyan-600 to-blue-600',
    }
  }
  if (normalized === 'admin' || normalized === 'super_admin') {
    return {
      label: normalized === 'super_admin' ? t('roles.super_admin', 'Super Admin') : t('roles.admin', 'Admin'),
      badgeClass: 'bg-purple-100 text-purple-800 ring-1 ring-purple-600/20 dark:bg-purple-950/50 dark:text-purple-300 dark:ring-purple-500/30',
      avatarGradient: 'from-purple-600 to-indigo-600',
    }
  }
  if (normalized === 'reviewer' || normalized === 'clinical_reviewer') {
    return {
      label: t('roles.reviewer', 'Reviewer'),
      badgeClass: 'bg-amber-100 text-amber-800 ring-1 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-500/30',
      avatarGradient: 'from-amber-500 to-orange-600',
    }
  }
  return {
    label: t(`roles.${normalized}`, 'Patient'),
    badgeClass: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-500/30',
    avatarGradient: 'from-emerald-500 to-teal-600',
  }
}

export function ProfilePage() {
  const { user, updateUser, refreshUser } = useAuth()
  const { t } = useLanguage()

  const isPatient = Boolean(user?.patient_id)
  const activeRole = user?.roles?.[0] || user?.role || 'user'
  const roleMeta = getRoleMeta(activeRole, t)

  // ── Account / Staff Form State ──
  const [userForm, setUserForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    title: user?.title || '',
    department: user?.department || '',
    hospital_affiliation: user?.hospital_affiliation || '',
    license_number: user?.license_number || '',
    bio: user?.bio || '',
  })
  const [userBaseline, setUserBaseline] = useState(null)
  const [userSaving, setUserSaving] = useState(false)
  const [userSavedFlash, setUserSavedFlash] = useState(false)
  const [userError, setUserError] = useState('')
  const userFlashTimer = useRef(null)

  useEffect(() => {
    if (!user) return
    const next = {
      name: user.name || '',
      phone: user.phone || '',
      title: user.title || '',
      department: user.department || '',
      hospital_affiliation: user.hospital_affiliation || '',
      license_number: user.license_number || '',
      bio: user.bio || '',
    }
    setUserForm(next)
    setUserBaseline(JSON.stringify(next))
  }, [user?.id, user?.updated_at]) // eslint-disable-line react-hooks/exhaustive-deps

  const isUserDirty = userBaseline !== null && JSON.stringify(userForm) !== userBaseline

  function updateUserField(patch) {
    setUserError('')
    setUserForm((prev) => ({ ...prev, ...patch }))
  }

  // ── Avatar State & Handlers ──
  const fileInputRef = useRef(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [avatarSuccess, setAvatarSuccess] = useState('')
  const avatarTimer = useRef(null)

  async function handleAvatarFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarError('')
    setAvatarSuccess('')

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(t(`${NS}.photoErrorSize`, 'Image size exceeds 5MB. Please choose a smaller photo.'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setAvatarError(t(`${NS}.photoErrorType`, 'Please select a valid image file (PNG, JPG, WEBP, GIF).'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploadingAvatar(true)
    try {
      const response = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const data = getApiData(response)
      if (data) {
        updateUser(data)
      } else {
        await refreshUser()
      }
      setAvatarSuccess(t(`${NS}.photoUploadSuccess`, 'Profile picture updated successfully.'))
      if (avatarTimer.current) clearTimeout(avatarTimer.current)
      avatarTimer.current = setTimeout(() => setAvatarSuccess(''), 3000)
    } catch (err) {
      setAvatarError(getApiErrorMessage(err, 'Failed to upload profile picture.'))
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleAvatarDelete() {
    setAvatarError('')
    setAvatarSuccess('')
    setUploadingAvatar(true)
    try {
      const response = await api.delete('/auth/avatar')
      const data = getApiData(response)
      if (data) {
        updateUser(data)
      } else {
        updateUser({ avatar_url: null })
      }
      setAvatarSuccess(t(`${NS}.photoRemoveSuccess`, 'Profile picture removed.'))
      if (avatarTimer.current) clearTimeout(avatarTimer.current)
      avatarTimer.current = setTimeout(() => setAvatarSuccess(''), 3000)
    } catch (err) {
      setAvatarError(getApiErrorMessage(err, 'Failed to remove profile picture.'))
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSaveUserProfile(e) {
    if (e?.preventDefault) e.preventDefault()
    setUserError('')

    const trimmedName = userForm.name.trim()
    if (!trimmedName) {
      setUserError(t('common.nameRequired', 'Full Name is required.'))
      return
    }

    setUserSaving(true)
    try {
      const payload = {
        name: trimmedName,
        phone: userForm.phone.trim(),
        title: userForm.title.trim(),
        department: userForm.department.trim(),
        hospital_affiliation: userForm.hospital_affiliation.trim(),
        license_number: userForm.license_number.trim(),
        bio: userForm.bio.trim(),
      }
      const response = await api.patch('/auth/me', payload)
      const data = getApiData(response)
      if (data) {
        updateUser(data)
        setUserBaseline(JSON.stringify(userForm))
      }
      setUserSavedFlash(true)
      if (userFlashTimer.current) clearTimeout(userFlashTimer.current)
      userFlashTimer.current = setTimeout(() => setUserSavedFlash(false), 2500)
    } catch (err) {
      setUserError(getApiErrorMessage(err, t('common.saveFailed', 'Could not save profile changes.')))
    } finally {
      setUserSaving(false)
    }
  }

  // ── Patient Health Profile State ──
  const [healthForm, setHealthForm] = useState(EMPTY_HEALTH_FORM)
  const [healthBaseline, setHealthBaseline] = useState(null)
  const [healthLoading, setHealthLoading] = useState(isPatient)
  const [healthLoadError, setHealthLoadError] = useState('')
  const [healthError, setHealthError] = useState('')
  const [healthSaving, setHealthSaving] = useState(false)
  const [healthSavedFlash, setHealthSavedFlash] = useState(false)
  const healthFlashTimer = useRef(null)

  useEffect(() => {
    if (!isPatient) { setHealthLoading(false); return undefined }
    let cancelled = false
    async function load() {
      try {
        const data = getApiData(await api.get('/patients/mine'))
        if (cancelled || !data) return
        const next = profileFromData(data)
        setHealthBaseline(JSON.stringify(next))
        setHealthForm(next)
      } catch (e) {
        if (!cancelled) setHealthLoadError(getApiErrorMessage(e, t(`${NS}.loadFailed`, 'Could not load your health profile.')))
      } finally {
        if (!cancelled) setHealthLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
      if (healthFlashTimer.current) clearTimeout(healthFlashTimer.current)
    }
  }, [isPatient]) // eslint-disable-line react-hooks/exhaustive-deps

  const isHealthDirty = healthBaseline !== null && JSON.stringify(healthForm) !== healthBaseline
  const age = useMemo(() => computeAge(healthForm.date_of_birth), [healthForm.date_of_birth])
  const bmi = useMemo(() => computeBmi(healthForm.height_cm, healthForm.weight_kg), [healthForm.height_cm, healthForm.weight_kg])

  function updateHealth(patch) {
    setHealthError('')
    setHealthForm((prev) => ({ ...prev, ...patch }))
  }

  async function handleSaveHealthProfile() {
    setHealthError('')
    const h = Number(healthForm.height_cm)
    const w = Number(healthForm.weight_kg)
    const wa = Number(healthForm.waist_circumference)
    if (healthForm.height_cm && (Number.isNaN(h) || h < 80 || h > 250)) {
      setHealthError(t(`${SETUP}.errors.height`, 'Please enter a height between 80 and 250 cm.'))
      return
    }
    if (healthForm.weight_kg && (Number.isNaN(w) || w < 20 || w > 400)) {
      setHealthError(t(`${SETUP}.errors.weight`, 'Please enter a weight between 20 and 400 kg.'))
      return
    }
    if (healthForm.waist_circumference && (Number.isNaN(wa) || wa < 40 || wa > 200)) {
      setHealthError(t(`${SETUP}.errors.waist`, 'Please enter a waist between 40 and 200 cm.'))
      return
    }

    const payload = {}
    if (healthForm.gender) payload.gender = healthForm.gender
    if (healthForm.date_of_birth) payload.date_of_birth = healthForm.date_of_birth
    if (healthForm.height_cm && !Number.isNaN(h)) payload.height_cm = h
    if (healthForm.weight_kg && !Number.isNaN(w)) payload.weight_kg = w
    if (healthForm.waist_circumference && !Number.isNaN(wa)) payload.waist_circumference = wa
    for (const pill of RISK_PILLS) payload[pill.key] = Boolean(healthForm[pill.key])

    setHealthSaving(true)
    try {
      const data = getApiData(await api.patch('/patients/mine', payload))
      const next = data ? profileFromData(data) : healthForm
      setHealthBaseline(JSON.stringify(next))
      setHealthForm(next)
      refreshUser()
      setHealthSavedFlash(true)
      if (healthFlashTimer.current) clearTimeout(healthFlashTimer.current)
      healthFlashTimer.current = setTimeout(() => setHealthSavedFlash(false), 2500)
    } catch (e) {
      setHealthError(getApiErrorMessage(e, t(`${SETUP}.errors.save`, 'Could not save your profile. Please try again.')))
    } finally {
      setHealthSaving(false)
    }
  }

  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {t(`${NS}.title`, 'Your profile')}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t(`${NS}.subtitle`, 'Manage your account, profile photo, and clinical or health credentials.')}
      </p>

      {/* ── 1. Hero / Avatar & Identity Card ── */}
      <div className="surface mt-6 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          {/* Avatar with upload trigger */}
          <div className="group relative shrink-0">
            <div
              className={cn(
                'relative flex h-20 w-20 overflow-hidden rounded-full shadow-md ring-2 ring-white dark:ring-[#1e2234]',
                uploadingAvatar && 'opacity-60'
              )}
            >
              <UserAvatar
                name={user?.name}
                src={user?.avatar_url}
                size="2xl"
                className="h-full w-full"
              />

              {/* Hover overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label={t(`${NS}.changePhoto`, 'Change photo')}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
              >
                <Camera className="h-5 w-5" />
                <span className="mt-0.5 text-[10px] font-semibold">{t(`${NS}.changePhoto`, 'Change')}</span>
              </button>
            </div>

            {/* Spinner if uploading */}
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>

          {/* Info and action buttons */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-50">
                {user?.name || t('common.user', 'User')}
              </h2>
              <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', roleMeta.badgeClass)}>
                {roleMeta.label}
              </span>
            </div>

            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
              {user?.email || t('common.noEmail', 'No email')}
            </p>

            {/* Sub-role or affiliation chip if present */}
            {(userForm.title || userForm.department || userForm.hospital_affiliation) && (
              <p className="mt-1 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                {[userForm.title, userForm.department, userForm.hospital_affiliation].filter(Boolean).join(' • ')}
              </p>
            )}

            {/* Photo Action Buttons */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleAvatarFileSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
                {uploadingAvatar ? t(`${NS}.uploadingPhoto`, 'Uploading...') : t(`${NS}.uploadPhoto`, 'Upload photo')}
              </button>

              {user?.avatar_url && (
                <button
                  type="button"
                  onClick={handleAvatarDelete}
                  disabled={uploadingAvatar}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-rose-600 shadow-sm transition-colors hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/40 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t(`${NS}.removePhoto`, 'Remove photo')}
                </button>
              )}

              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {t(`${NS}.photoHint`, 'PNG, JPG, WEBP or GIF up to 5MB')}
              </span>
            </div>

            {/* Avatar feedback */}
            {avatarError && (
              <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">{avatarError}</p>
            )}
            {avatarSuccess && (
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" /> {avatarSuccess}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Account & Personal Details Form (All Users) ── */}
      <form onSubmit={handleSaveUserProfile} className="surface mt-5 p-5 sm:p-7">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t(`${NS}.accountTitle`, 'Account & Personal Details')}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t(`${NS}.accountSubtitle`, 'Update your name, contact phone, and account photo.')}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* Full Name */}
          <div>
            <label className={fieldLabel} htmlFor="profile-fullname">
              {t(`${NS}.fullName`, 'Full Name')}
            </label>
            <div className="relative mt-1.5">
              <input
                id="profile-fullname"
                type="text"
                className={fieldInput}
                value={userForm.name}
                placeholder={t(`${NS}.fullNamePlaceholder`, 'e.g. Dr. Lina Sok')}
                onChange={(e) => updateUserField({ name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className={fieldLabel} htmlFor="profile-phone">
              {t(`${NS}.phone`, 'Phone Number')}
            </label>
            <div className="relative mt-1.5">
              <input
                id="profile-phone"
                type="tel"
                className={fieldInput}
                value={userForm.phone}
                placeholder={t(`${NS}.phonePlaceholder`, 'e.g. +855 12 345 678')}
                onChange={(e) => updateUserField({ phone: e.target.value })}
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className={fieldLabel} htmlFor="profile-email">
              {t(`${NS}.email`, 'Email Address')}
            </label>
            <div className="relative mt-1.5">
              <input
                id="profile-email"
                type="email"
                disabled
                className={cn(fieldInput, 'cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400')}
                value={user?.email || ''}
              />
            </div>
          </div>

          {/* Role (read-only) */}
          <div>
            <span className={fieldLabel}>{t(`${NS}.role`, 'Role')}</span>
            <div className="mt-1.5 flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold capitalize text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
              <span className={cn('mr-2 h-2 w-2 rounded-full', roleMeta.badgeClass)} />
              {roleMeta.label}
            </div>
          </div>
        </div>

        {/* ── 3. Staff Information Section (Doctors, Admins, Reviewers) ── */}
        {!isPatient && (
          <div className="mt-7 border-t border-slate-100 pt-6 dark:border-slate-800">
            <div className="mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Briefcase className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                {t(`${NS}.staffTitle`, 'Professional & Staff Details')}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t(`${NS}.staffSubtitle`, 'Manage your clinical title, department, hospital affiliation, and practice notes.')}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Professional Title */}
              <div>
                <label className={fieldLabel} htmlFor="staff-title">
                  {t(`${NS}.titleLabel`, 'Professional Title / Designation')}
                </label>
                <input
                  id="staff-title"
                  type="text"
                  className={fieldInput}
                  value={userForm.title}
                  placeholder={t(`${NS}.titlePlaceholder`, 'e.g. Senior Consultant Endocrinologist')}
                  onChange={(e) => updateUserField({ title: e.target.value })}
                />
              </div>

              {/* Department / Specialty */}
              <div>
                <label className={fieldLabel} htmlFor="staff-dept">
                  {t(`${NS}.department`, 'Department / Specialty')}
                </label>
                <input
                  id="staff-dept"
                  type="text"
                  className={fieldInput}
                  value={userForm.department}
                  placeholder={t(`${NS}.departmentPlaceholder`, 'e.g. Endocrinology & Metabolic Care')}
                  onChange={(e) => updateUserField({ department: e.target.value })}
                />
              </div>

              {/* Hospital Affiliation */}
              <div>
                <label className={fieldLabel} htmlFor="staff-hospital">
                  {t(`${NS}.hospital`, 'Hospital / Clinic Affiliation')}
                </label>
                <input
                  id="staff-hospital"
                  type="text"
                  className={fieldInput}
                  value={userForm.hospital_affiliation}
                  placeholder={t(`${NS}.hospitalPlaceholder`, 'e.g. Calmette Hospital, Phnom Penh')}
                  onChange={(e) => updateUserField({ hospital_affiliation: e.target.value })}
                />
              </div>

              {/* Medical License / Staff ID */}
              <div>
                <label className={fieldLabel} htmlFor="staff-license">
                  {t(`${NS}.license`, 'Medical License / Staff ID')}
                </label>
                <input
                  id="staff-license"
                  type="text"
                  className={fieldInput}
                  value={userForm.license_number}
                  placeholder={t(`${NS}.licensePlaceholder`, 'e.g. CAM-MD-2024-8841')}
                  onChange={(e) => updateUserField({ license_number: e.target.value })}
                />
              </div>
            </div>

            {/* Clinical Bio / Notes */}
            <div className="mt-4">
              <label className={fieldLabel} htmlFor="staff-bio">
                {t(`${NS}.bio`, 'Clinical Bio & Practice Notes')}
              </label>
              <textarea
                id="staff-bio"
                rows={3}
                className={cn(fieldInput, 'min-h-[5rem] resize-y py-2.5')}
                value={userForm.bio}
                placeholder={t(`${NS}.bioPlaceholder`, 'Consultation hours, clinic room, medical background, or guidance for patients...')}
                onChange={(e) => updateUserField({ bio: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* User Save Error */}
        {userError && (
          <p className="mt-5 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
            {userError}
          </p>
        )}

        {/* Save Bar */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
          <span className={cn('inline-flex items-center gap-1 text-xs font-medium text-emerald-600 transition-opacity dark:text-emerald-400', userSavedFlash ? 'opacity-100' : 'opacity-0')}>
            <Check className="h-3.5 w-3.5" /> {t(`${NS}.saved`, 'Saved')}
          </span>
          <button
            type="submit"
            disabled={!isUserDirty || userSaving}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all',
              isUserDirty && !userSaving
                ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700'
                : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            )}
          >
            {userSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {userSaving ? t(`${NS}.saving`, 'Saving...') : t(`${NS}.save`, 'Save changes')}
          </button>
        </div>
      </form>

      {/* ── 4. Health Profile (Patients Only) ── */}
      {isPatient ? (
        <div className="surface mt-5 p-5 sm:p-7">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{t(`${NS}.healthTitle`, 'Health profile')}</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t(`${NS}.healthSubtitle`, 'Keep this up to date — every new assessment starts pre-filled from here.')}</p>

          {healthLoading ? (
            <div className="py-10"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-500" /></div>
          ) : healthLoadError ? (
            <p className="mt-5 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{healthLoadError}</p>
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
                          onClick={() => updateHealth({ gender: opt.value })}
                          aria-pressed={healthForm.gender === opt.value}
                          className={cn(
                            'min-h-11 rounded-xl border-2 px-2 text-sm font-semibold transition-all',
                            healthForm.gender === opt.value
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
                      value={healthForm.date_of_birth}
                      onChange={(e) => updateHealth({ date_of_birth: e.target.value })}
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
                    <input className={fieldInput} type="number" min={80} max={250} step="0.1" placeholder="e.g. 170" value={healthForm.height_cm} onChange={(e) => updateHealth({ height_cm: e.target.value })} />
                  </div>
                  <div>
                    <span className={fieldLabel}>{t(`${SETUP}.weightLabel`, 'Weight (kg)')}</span>
                    <input className={fieldInput} type="number" min={20} max={400} step="0.1" placeholder="e.g. 65" value={healthForm.weight_kg} onChange={(e) => updateHealth({ weight_kg: e.target.value })} />
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
                  <input className={fieldInput} type="number" min={40} max={200} step="0.1" placeholder="e.g. 95" value={healthForm.waist_circumference} onChange={(e) => updateHealth({ waist_circumference: e.target.value })} />
                </div>
              </div>

              {/* Health background */}
              <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t(`${SETUP}.step3.title`, 'Health background')}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t(`${SETUP}.step3.description`, 'Optional — these feed the risk analysis only if they apply to you.')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {RISK_PILLS.map((pill) => {
                    const active = healthForm[pill.key]
                    return (
                      <button
                        key={pill.key}
                        type="button"
                        onClick={() => updateHealth({ [pill.key]: !active })}
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

              {healthError ? (
                <p className="mt-5 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{healthError}</p>
              ) : null}

              {/* Save bar */}
              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                <span className={cn('mr-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-600 transition-opacity dark:text-emerald-400', healthSavedFlash ? 'opacity-100' : 'opacity-0')}>
                  <Check className="h-3.5 w-3.5" /> {t(`${NS}.saved`, 'Saved')}
                </span>
                <button
                  type="button"
                  onClick={handleSaveHealthProfile}
                  disabled={!isHealthDirty || healthSaving}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all',
                    isHealthDirty && !healthSaving
                      ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700'
                      : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
                  )}
                >
                  {healthSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {healthSaving ? t(`${SETUP}.saving`, 'Saving...') : t(`${NS}.save`, 'Save changes')}
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
