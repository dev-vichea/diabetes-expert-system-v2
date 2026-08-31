import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Activity, ChevronRight, Loader2, Pencil, Search, SlidersHorizontal, UserPlus, X } from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { AppSelect, ErrorAlert, StatusBadge } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'

const DEFAULT_FILTERS = {
  search: '',
  gender: '',
  has_diagnosis: '',
}

const DEFAULT_FORM = {
  full_name: '',
  gender: 'unknown',
  date_of_birth: '',
  phone: '',
  notes: '',
}

const AVATAR_TONES = [
  'from-primary-500 to-sky-500',
  'from-sky-500 to-cyan-400',
  'from-indigo-500 to-primary-500',
  'from-cyan-500 to-sky-600',
  'from-slate-400 to-slate-500',
]

function avatarTone(name = '') {
  let hash = 0
  for (const ch of String(name)) hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return AVATAR_TONES[hash % AVATAR_TONES.length]
}

function initialsOf(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('')
}

function genderBadgeTone(gender) {
  if (gender === 'male') return 'info'
  if (gender === 'female') return 'primary'
  return 'neutral'
}

export function PatientsPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [urlParams] = useSearchParams()
  const [patients, setPatients] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  // Seed filters from URL query params (enables dashboard drill-down links)
  const initialFilters = useMemo(() => ({
    search: urlParams.get('search') || '',
    gender: urlParams.get('gender') || '',
    has_diagnosis: urlParams.get('has_diagnosis') || '',
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  const [filters, setFilters] = useState(initialFilters)
  const [draftFilters, setDraftFilters] = useState(initialFilters)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEditing = selectedPatientId != null

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.gender) params.set('gender', filters.gender)
    if (filters.has_diagnosis) params.set('has_diagnosis', filters.has_diagnosis)
    params.set('limit', '200')
    return params.toString()
  }, [filters])

  const groupedPatients = useMemo(() => {
    const groups = new Map()
    for (const patient of patients) {
      const letter = (patient.full_name || '?').charAt(0).toUpperCase()
      if (!groups.has(letter)) groups.set(letter, [])
      groups.get(letter).push(patient)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [patients])

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) || null,
    [patients, selectedPatientId],
  )

  async function loadPatients(activeQueryString = queryString) {
    setLoading(true)
    setError('')

    try {
      const response = await api.get(`/patients/?${activeQueryString}`)
      setPatients(getApiData(response) || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load patients'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [queryString])

  function resetPatientForm() {
    setForm(DEFAULT_FORM)
    setSelectedPatientId(null)
  }

  function populatePatientForm(patient) {
    setSelectedPatientId(patient.id)
    setForm({
      full_name: patient.full_name || '',
      gender: patient.gender || 'unknown',
      date_of_birth: patient.date_of_birth || '',
      phone: patient.phone || '',
      notes: patient.notes || '',
    })
    setError('')
  }

  function openAssessmentForPatient(patientId) {
    navigate({
      pathname: '/diagnosis',
      search: `?patient_id=${patientId}`,
    }, {
      state: {
        forceRestart: true,
      },
      replace: false,
    })
  }

  function openPatientWorkflow(patient) {
    if (patient.latest_diagnosis_result_id) {
      navigate(`/diagnosis/result?diagnosis_result_id=${patient.latest_diagnosis_result_id}`)
      return
    }
    openAssessmentForPatient(patient.id)
  }

  async function submitPatient(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        full_name: form.full_name,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        phone: form.phone || null,
        notes: form.notes || null,
      }

      if (isEditing) {
        await api.patch(`/patients/${selectedPatientId}`, payload)
      } else {
        await api.post('/patients/', payload)
      }

      resetPatientForm()
      await loadPatients()
    } catch (err) {
      setError(getApiErrorMessage(err, isEditing ? 'Failed to update patient' : 'Failed to register patient'))
    } finally {
      setSaving(false)
    }
  }

  function applyFilters(event) {
    event.preventDefault()
    setFilters({
      search: draftFilters.search.trim(),
      gender: draftFilters.gender,
      has_diagnosis: draftFilters.has_diagnosis,
    })
  }

  function resetFilters() {
    setDraftFilters(DEFAULT_FILTERS)
    setFilters(DEFAULT_FILTERS)
  }

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(20rem,22rem)_minmax(0,1fr)]">
      {/* ── Patients list panel (master) ─────────────────────── */}
      <section className="surface flex min-w-0 flex-col overflow-hidden p-0 xl:sticky xl:top-0 xl:max-h-[calc(100dvh-8.5rem)]">
        <header className="flex items-center justify-between gap-2 px-4 pb-1 pt-4">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {t('patientsPage.list.title', 'Patients list')}
            </h2>
            <p className="text-xs text-slate-500">
              {patients.length} {t('patientsPage.list.registered', 'registered')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => { resetPatientForm(); setShowFilters(false) }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm transition-colors hover:bg-primary-700"
              aria-label={t('patientsPage.list.addPatient', 'Add patient')}
              title={t('patientsPage.list.addPatient', 'Add patient')}
            >
              <UserPlus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${showFilters ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-300' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-[#1e2234] dark:bg-[#101020] dark:text-slate-400 dark:hover:bg-[#181830]'}`}
              aria-label={t('patientsPage.list.filters', 'Filters')}
              title={t('patientsPage.list.filters', 'Filters')}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="px-4 py-2">
          <div className="relative">
            <input
              value={draftFilters.search}
              onChange={(event) => setDraftFilters({ ...draftFilters, search: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  setFilters({ search: draftFilters.search.trim(), gender: draftFilters.gender, has_diagnosis: draftFilters.has_diagnosis })
                }
              }}
              placeholder={t('patientsPage.filters.search', 'Search by name or phone')}
              className="h-11 w-full rounded-2xl border border-transparent bg-slate-100/90 pl-4 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100 dark:border-[#1e2234] dark:bg-[#101020] dark:text-slate-100 dark:focus:border-primary-500/50 dark:focus:bg-[#101020] dark:focus:ring-primary-500/10"
            />
            <button
              type="button"
              onClick={() => setFilters({ search: draftFilters.search.trim(), gender: draftFilters.gender, has_diagnosis: draftFilters.has_diagnosis })}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition-colors hover:bg-white hover:text-primary-600 dark:hover:bg-[#181830] dark:hover:text-primary-300"
              aria-label={t('patientsPage.filters.apply', 'Search')}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showFilters ? (
          <form onSubmit={applyFilters} className="mx-4 mb-2 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-[#1e2234] dark:bg-[#0d0d1c]">
            <AppSelect
              value={draftFilters.gender}
              onValueChange={(value) => setDraftFilters({ ...draftFilters, gender: value })}
              includeEmpty
              emptyLabel={t('patientsPage.filters.allGenders', 'All genders')}
              options={[
                { value: 'male', label: t('common.male', 'Male') },
                { value: 'female', label: t('common.female', 'Female') },
                { value: 'other', label: t('common.other', 'Other') },
                { value: 'unknown', label: t('common.unknown', 'Unknown') },
              ]}
            />
            <AppSelect
              value={draftFilters.has_diagnosis}
              onValueChange={(value) => setDraftFilters({ ...draftFilters, has_diagnosis: value })}
              includeEmpty
              emptyLabel={t('patientsPage.filters.anyDiagnosis', 'Any diagnosis status')}
              options={[
                { value: 'true', label: t('patientsPage.filters.hasDiagnosis', 'Has diagnosis') },
                { value: 'false', label: t('patientsPage.filters.noDiagnosis', 'No diagnosis yet') },
              ]}
            />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary min-h-9 flex-1 px-3 py-1.5 text-xs">{t('patientsPage.filters.apply', 'Apply')}</button>
              <button type="button" className="btn-secondary min-h-9 flex-1 px-3 py-1.5 text-xs" onClick={resetFilters}>{t('patientsPage.filters.reset', 'Reset')}</button>
            </div>
          </form>
        ) : null}

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {loading && !patients.length ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t('patientsPage.table.loading', 'Loading patients...')}
            </div>
          ) : null}

          {!loading && !patients.length ? (
            <div className="state-box m-3">{t('patientsPage.table.empty', 'No patients found for current filters.')}</div>
          ) : null}

          {groupedPatients.map(([letter, groupPatients]) => (
            <div key={letter}>
              <p className="px-3 pb-1 pt-4 text-lg font-bold text-slate-800 dark:text-slate-200">{letter}</p>
              <div className="space-y-0.5">
                {groupPatients.map((patient) => {
                  const hasDiagnosis = Number(patient.diagnosis_count) > 0
                  const isSelected = selectedPatientId === patient.id
                  return (
                    <div
                      key={patient.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      onKeyDown={(event) => { if (event.key === 'Enter') navigate(`/patients/${patient.id}`) }}
                      className={`group flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${isSelected ? 'bg-primary-50 dark:bg-primary-500/10' : 'hover:bg-slate-50 dark:hover:bg-[#181830]'}`}
                    >
                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${avatarTone(patient.full_name)}`}>
                        {initialsOf(patient.full_name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{patient.full_name}</p>
                        <p className="truncate text-xs text-slate-500">{patient.phone || t('patientsPage.list.noPhone', 'No phone on file')}</p>
                      </div>
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${hasDiagnosis ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        title={hasDiagnosis ? t('patientsPage.filters.hasDiagnosis', 'Has diagnosis') : t('patientsPage.filters.noDiagnosis', 'No diagnosis yet')}
                      />
                      <div className="flex shrink-0 items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); populatePatientForm(patient) }}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-primary-600 dark:hover:bg-[#181830] dark:hover:text-primary-300"
                          aria-label={t('patientsPage.form.editTitle', 'Edit Patient')}
                          title={t('patientsPage.form.editTitle', 'Edit Patient')}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); openPatientWorkflow(patient) }}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-primary-600 dark:hover:bg-[#181830] dark:hover:text-primary-300"
                          aria-label={patient.latest_diagnosis_result_id ? t('patientsPage.table.latestResult', 'Latest Result') : t('patientsPage.table.assess', 'Assess')}
                          title={patient.latest_diagnosis_result_id ? t('patientsPage.table.latestResult', 'Latest Result') : t('patientsPage.table.assess', 'Assess')}
                        >
                          <Activity className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Register / edit panel (detail) ───────────────────── */}
      <section className="surface min-w-0 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="section-title">
              {isEditing ? t('patientsPage.form.editTitle', 'Edit Patient') : t('patientsPage.form.createTitle', 'Register Patient')}
            </h2>
            <p className="section-subtitle mt-1">
              {isEditing
                ? t('patientsPage.form.editDesc', 'Update profile details before reviewing history or running a new assessment.')
                : t('patientsPage.form.createDesc', 'Add a profile before recording symptoms and labs.')}
            </p>
          </div>
          {isEditing ? (
            <button type="button" className="btn-secondary" onClick={resetPatientForm}>
              <X className="h-4 w-4" />
              {t('patientsPage.form.cancelEdit', 'Cancel Edit')}
            </button>
          ) : null}
        </div>

        {isEditing && selectedPatient ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-[#1e2234] dark:bg-[#0d0d1c]">
            <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${avatarTone(selectedPatient.full_name)}`}>
              {initialsOf(selectedPatient.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedPatient.full_name}</p>
              <p className="truncate text-xs text-slate-500">{selectedPatient.phone || t('patientsPage.list.noPhone', 'No phone on file')}</p>
            </div>
            <StatusBadge tone={genderBadgeTone(selectedPatient.gender)}>
              {t(`common.${selectedPatient.gender}`, selectedPatient.gender || 'N/A')}
            </StatusBadge>
            <Link
              to={`/patients/${selectedPatient.id}`}
              className="btn-secondary min-h-9 whitespace-nowrap px-3 py-1.5 text-xs"
            >
              {t('patientsPage.table.history', 'History')}
            </Link>
          </div>
        ) : null}

        <form onSubmit={submitPatient} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="label-text">{t('patientsPage.form.fullName', 'Full name')}</span>
            <input
              className="input-base"
              required
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              placeholder={t('patientsPage.form.fullNamePlaceholder', 'Patient full name')}
            />
          </label>

          <label className="block">
            <span className="label-text">{t('patientsPage.form.gender', 'Gender')}</span>
            <AppSelect
              value={form.gender}
              onValueChange={(value) => setForm({ ...form, gender: value })}
              options={[
                { value: 'unknown', label: t('common.unknown', 'Unknown') },
                { value: 'male', label: t('common.male', 'Male') },
                { value: 'female', label: t('common.female', 'Female') },
                { value: 'other', label: t('common.other', 'Other') },
              ]}
            />
          </label>

          <label className="block">
            <span className="label-text">{t('patientsPage.form.dateOfBirth', 'Date of birth')}</span>
            <input className="input-base" type="date" value={form.date_of_birth} onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })} />
          </label>

          <label className="block md:col-span-2">
            <span className="label-text">{t('patientsPage.form.phone', 'Phone')}</span>
            <input className="input-base" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder={t('patientsPage.form.phonePlaceholder', 'Phone number')} />
          </label>

          <label className="block md:col-span-2">
            <span className="label-text">{t('patientsPage.form.notes', 'Notes')}</span>
            <textarea
              className="input-base"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder={t('patientsPage.form.notesPlaceholder', 'Background notes')}
              rows={4}
            />
          </label>

          <div className="md:col-span-2">
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
              {saving ? t('patientsPage.form.saving', 'Saving...') : isEditing ? t('patientsPage.form.updatePatient', 'Update Patient') : t('patientsPage.form.createPatient', 'Create Patient')}
            </button>
          </div>
        </form>

        <ErrorAlert message={error} className="mt-4" />
      </section>
    </div>
  )
}