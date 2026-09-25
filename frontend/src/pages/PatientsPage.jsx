import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Phone,
  Search,
  SlidersHorizontal,
  Stethoscope,
  Users,
  UserCheck,
  Calendar,
  X,
} from 'lucide-react'
import api, { getApiData, getApiPaginated, getApiErrorMessage } from '../api/client'
import { AppSelect, ErrorAlert, StatusBadge, UserAvatar, Skeleton } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatDateTime, formatRelativeTime } from '@/lib/datetime'

const DEFAULT_FILTERS = {
  search: '',
  gender: '',
  has_diagnosis: '',
}

function genderBadgeTone(gender) {
  if (gender === 'male') return 'info'
  if (gender === 'female') return 'primary'
  return 'neutral'
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null
  return Math.max(0, Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)))
}

function getConditionMeta(diagnosis, t, tExact) {
  if (!diagnosis) {
    return {
      tone: 'neutral',
      label: t('patientsPage.table.notAssessed', 'Not Assessed'),
      fullText: t('patientsPage.table.noDiagnosisYet', 'No diagnosis recorded yet'),
    }
  }

  const text = String(diagnosis).toLowerCase()
  if (text.includes('likely diabetes') || text.includes('suspected diabetes') || text.includes('mellitus')) {
    return {
      tone: 'danger',
      label: t('patientsPage.conditions.diabetes', 'Likely Diabetes'),
      fullText: tExact ? tExact(diagnosis) : diagnosis,
    }
  }
  if (text.includes('prediabetes')) {
    return {
      tone: 'warning',
      label: t('patientsPage.conditions.prediabetes', 'Prediabetes'),
      fullText: tExact ? tExact(diagnosis) : diagnosis,
    }
  }
  if (text.includes('elevated') || text.includes('risk')) {
    return {
      tone: 'warning',
      label: t('patientsPage.conditions.elevatedRisk', 'Elevated Risk'),
      fullText: tExact ? tExact(diagnosis) : diagnosis,
    }
  }
  if (text.includes('possible') || text.includes('signs')) {
    return {
      tone: 'info',
      label: t('patientsPage.conditions.possibleSigns', 'Possible Signs'),
      fullText: tExact ? tExact(diagnosis) : diagnosis,
    }
  }
  if (text.includes('normal')) {
    return {
      tone: 'success',
      label: t('patientsPage.conditions.normal', 'Normal Glucose'),
      fullText: tExact ? tExact(diagnosis) : diagnosis,
    }
  }

  return {
    tone: 'primary',
    label: tExact ? tExact(diagnosis) : diagnosis,
    fullText: tExact ? tExact(diagnosis) : diagnosis,
  }
}

export function PatientsPage() {
  const { t, tExact, language } = useLanguage()
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Debounced search to prevent rapid-fire requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => {
        if (prev.search === draftFilters.search.trim()) return prev
        setPage(1)
        return { ...prev, search: draftFilters.search.trim() }
      })
    }, 300)
    return () => clearTimeout(handler)
  }, [draftFilters.search])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.gender) params.set('gender', filters.gender)
    if (filters.has_diagnosis) params.set('has_diagnosis', filters.has_diagnosis)
    params.set('page', String(page))
    params.set('limit', String(pageSize))
    return params.toString()
  }, [filters, page, pageSize])

  // Computed stats
  const stats = useMemo(() => {
    const total = totalCount || patients.length
    const withDiagnosis = patients.filter((p) => Number(p.diagnosis_count) > 0).length
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    const recent = patients.filter((p) => p.created_at && p.created_at >= thirtyDaysAgo).length
    const maleCount = patients.filter((p) => p.gender === 'male').length
    const femaleCount = patients.filter((p) => p.gender === 'female').length
    return { total, withDiagnosis, recent, maleCount, femaleCount }
  }, [patients, totalCount])

  async function loadPatients(activeQueryString = queryString) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/patients/?${activeQueryString}`)
      const paginated = getApiPaginated(response)
      setPatients(paginated.data)
      setTotalCount(paginated.total)
      setTotalPages(paginated.totalPages)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load patients'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [queryString])

  function applyFilters(event) {
    if (event) event.preventDefault()
    setPage(1)
    setFilters({
      search: draftFilters.search.trim(),
      gender: draftFilters.gender,
      has_diagnosis: draftFilters.has_diagnosis,
    })
  }

  function resetFilters() {
    setDraftFilters(DEFAULT_FILTERS)
    setPage(1)
    setFilters(DEFAULT_FILTERS)
  }

  function openPatientWorkflow(patient) {
    if (patient.latest_diagnosis_result_id) {
      navigate(`/diagnosis/result?diagnosis_result_id=${patient.latest_diagnosis_result_id}`)
      return
    }
    navigate({ pathname: '/diagnosis', search: `?patient_id=${patient.id}` }, { state: { forceRestart: true }, replace: false })
  }

  const statCards = [
    {
      label: t('patientsPage.stats.total', 'Total Patients'),
      value: stats.total,
      icon: Users,
      color: 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-950/40',
    },
    {
      label: t('patientsPage.stats.diagnosed', 'With Diagnosis'),
      value: stats.withDiagnosis,
      icon: Stethoscope,
      color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40',
    },
    {
      label: t('patientsPage.stats.recent', 'Recent (30 days)'),
      value: stats.recent,
      icon: Calendar,
      color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40',
    },
    {
      label: t('patientsPage.stats.assessed', 'Fully Assessed'),
      value: `${stats.total ? Math.round((stats.withDiagnosis / stats.total) * 100) : 0}%`,
      icon: UserCheck,
      color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {t('patientsPage.hero.title', 'Patient Management')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            {t('patientsPage.hero.description', 'Profiles, symptoms, labs, and diagnosis timelines.')}
          </p>
        </div>
      </div>

      <ErrorAlert message={error} />

      {/* Stat Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const CardIcon = card.icon
          return (
            <div
              key={card.label}
              className="group surface flex items-center gap-4 p-4 transition-all hover:shadow-md"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
                <CardIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold leading-none text-slate-900 dark:text-slate-50">
                  {loading ? '—' : card.value}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Patient List Card */}
      <section className="surface overflow-hidden">
        {/* Header & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('patientsPage.list.title', 'Patients')}
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {patients.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Inline search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
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
                className="w-48 rounded-xl bg-slate-100/70 py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 transition-all border-0 sm:w-64"
              />
              {draftFilters.search && (
                <button
                  type="button"
                  onClick={() => { setDraftFilters({ ...draftFilters, search: '' }); setFilters((f) => ({ ...f, search: '' })) }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                showFilters
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
              aria-label={t('patientsPage.list.filters', 'Filters')}
              title={t('patientsPage.list.filters', 'Filters')}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Collapsible filter row */}
        {showFilters && (
          <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-800/80 dark:bg-slate-800/20">
            <div className="w-40">
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
            </div>
            <div className="w-48">
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
            </div>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700 transition shadow-sm">
              {t('patientsPage.filters.apply', 'Apply')}
            </button>
            <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition" onClick={resetFilters}>
              {t('patientsPage.filters.reset', 'Reset')}
            </button>
          </form>
        )}

        {/* Loading skeleton */}
        {loading && !patients.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="w-36 space-y-1.5 shrink-0">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
                <Skeleton className="h-4 w-28 shrink-0 hidden md:block" />
                <Skeleton className="h-5 w-16 rounded-full shrink-0 hidden md:block" />
                <Skeleton className="h-4 w-12 shrink-0 hidden md:block" />
                <Skeleton className="h-5 w-28 rounded-full shrink-0 hidden md:block" />
                <Skeleton className="h-4 w-10 shrink-0 hidden md:block" />
                <div className="flex-1 space-y-1 hidden md:block">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        ) : null}

        {/* Empty state */}
        {!loading && !patients.length ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Users className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t('patientsPage.table.empty', 'No patients found for current filters.')}
            </p>
          </div>
        ) : null}

        {/* Patient list rows */}
        {patients.length > 0 && (
          <>
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800/80 dark:bg-slate-800/30 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 whitespace-nowrap">{t('patientsPage.table.patient', 'Patient')}</th>
                    <th className="px-4 py-3 whitespace-nowrap">{t('patientsPage.table.phone', 'Phone')}</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">{t('patientsPage.table.gender', 'Gender')}</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">{t('patientsPage.table.age', 'Age')}</th>
                    <th className="px-4 py-3 whitespace-nowrap">{t('patientsPage.table.condition', 'Condition')}</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">{t('patientsPage.table.diagnoses', 'Diagnoses')}</th>
                    <th className="px-4 py-3 whitespace-nowrap">{t('patientsPage.table.lastActivity', 'Last Activity')}</th>
                    <th className="px-5 py-3 text-right whitespace-nowrap">{t('patientsPage.table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {patients.map((patient) => {
                    const hasDiagnosis = Number(patient.diagnosis_count) > 0
                    const age = calculateAge(patient.date_of_birth)
                    const condition = getConditionMeta(patient.latest_diagnosis, t, tExact)
                    const activityDate = patient.latest_diagnosis_created_at || patient.created_at

                    return (
                      <tr
                        key={patient.id}
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                      >
                        {/* Patient Name + PID */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={patient.full_name} src={patient.avatar_url} size="md" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors dark:text-slate-100 dark:group-hover:text-primary-400">
                                {patient.full_name}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                PID-#{String(patient.id).padStart(4, '0')}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {patient.phone ? (
                            <a
                              href={`tel:${patient.phone}`}
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-slate-700 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition-colors"
                              title={t('patientsPage.table.callPatient', 'Call {{phone}}', { phone: patient.phone })}
                            >
                              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{patient.phone}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">—</span>
                          )}
                        </td>

                        {/* Gender */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <StatusBadge tone={genderBadgeTone(patient.gender)} size="sm">
                            {t(`common.${patient.gender}`, patient.gender || 'N/A')}
                          </StatusBadge>
                        </td>

                        {/* Age */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {age != null ? (
                            <span
                              className="text-xs font-medium text-slate-700 dark:text-slate-300"
                              title={patient.date_of_birth ? `DOB: ${patient.date_of_birth}` : undefined}
                            >
                              {age} {t('common.yearsShort', 'yrs')}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>

                        {/* Latest Condition / Diagnosis */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge tone={condition.tone} size="sm" title={condition.fullText}>
                            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                            {condition.label}
                          </StatusBadge>
                        </td>

                        {/* Diagnoses count */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${hasDiagnosis ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                            />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {patient.diagnosis_count || 0}
                            </span>
                          </div>
                        </td>

                        {/* Last Activity */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {activityDate ? (
                            <div className="min-w-0" title={formatDateTime(activityDate, '—', language)}>
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {formatRelativeTime(activityDate, language, t)}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                {formatDateTime(activityDate, '—', language).split(',')[0]}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                openPatientWorkflow(patient)
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-primary-100 hover:text-primary-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-primary-950/40 dark:hover:text-primary-300"
                              title={patient.latest_diagnosis_result_id ? t('patientsPage.table.latestResult', 'Latest Result') : t('patientsPage.table.assess', 'Assess')}
                            >
                              <Activity className="h-3 w-3" />
                              <span>{patient.latest_diagnosis_result_id ? t('patientsPage.table.result', 'Result') : t('patientsPage.table.assess', 'Assess')}</span>
                            </button>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400 transition-colors" />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800/60">
              {patients.map((patient) => {
                const hasDiagnosis = Number(patient.diagnosis_count) > 0
                const age = calculateAge(patient.date_of_birth)
                const condition = getConditionMeta(patient.latest_diagnosis, t, tExact)
                const activityDate = patient.latest_diagnosis_created_at || patient.created_at

                return (
                  <article
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="cursor-pointer space-y-2.5 p-4 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar name={patient.full_name} src={patient.avatar_url} size="md" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-white">
                            {patient.full_name}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                            PID-#{String(patient.id).padStart(4, '0')}
                          </p>
                        </div>
                      </div>
                      <StatusBadge tone={condition.tone} size="sm">
                        {condition.label}
                      </StatusBadge>
                    </div>

                    {/* Phone, Gender & Age Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                      {patient.phone ? (
                        <a
                          href={`tel:${patient.phone}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1 font-mono text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400"
                        >
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{patient.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                          {t('patientsPage.list.noPhone', 'No phone on file')}
                        </span>
                      )}

                      <span className="text-slate-300 dark:text-slate-600">•</span>

                      <StatusBadge tone={genderBadgeTone(patient.gender)} size="sm">
                        {t(`common.${patient.gender}`, patient.gender || 'N/A')}
                      </StatusBadge>

                      {age != null && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-slate-600 dark:text-slate-400">
                            {age} {t('common.yearsShort', 'yrs')}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Footer row: Activity & Action button */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/80 dark:border-slate-800/40">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span
                          className={`h-2 w-2 rounded-full ${hasDiagnosis ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        />
                        <span>
                          {patient.diagnosis_count || 0} {t('patientsPage.table.diagnoses', 'Diagnoses')}
                        </span>
                        {activityDate && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span>{formatRelativeTime(activityDate, language, t)}</span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          openPatientWorkflow(patient)
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-primary-100 hover:text-primary-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-primary-950/40 dark:hover:text-primary-300"
                      >
                        <Activity className="h-3 w-3" />
                        <span>{patient.latest_diagnosis_result_id ? t('patientsPage.table.result', 'Result') : t('patientsPage.table.assess', 'Assess')}</span>
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-4 sm:flex-row dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('common.showing', 'Showing')}{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {(page - 1) * pageSize + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {Math.min(page * pageSize, totalCount)}
                  </span>{' '}
                  {t('common.of', 'of')}{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">{totalCount}</span>{' '}
                  {t('patientsPage.table.patients', 'patients')}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{t('common.previous', 'Previous')}</span>
                  </button>

                  <span className="px-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {page} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span>{t('common.next', 'Next')}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}