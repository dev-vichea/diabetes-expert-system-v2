import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileClock,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react'
import api, { getApiErrorMessage, getApiPaginated } from '@/api/client'
import { AdminHeroCard } from '@/components/admin'
import { EmptyState, Skeleton } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatDateTime, formatRelativeTime } from '@/lib/datetime'

const EMPTY_FILTERS = {
  search: '',
  category: '',
}

const ACTION_TRANSLATION_KEYS = {
  'auth.register': 'registered',
  'auth.login': 'loggedIn',
  'auth.google_register': 'registeredWithGoogle',
  'auth.google_login': 'loggedInWithGoogle',
  'auth.google_link': 'linkedGoogle',
  'auth.logout': 'loggedOut',
  'assessment.evaluate': 'completedAssessment',
  'assessment.complete': 'completedAssessment',
  'diagnosis.create': 'completedAssessment',
  'diagnosis.submit_to_care_team': 'submittedAssessment',
  'diagnosis.review': 'reviewedAssessment',
  'patient.create': 'createdPatient',
  'patient.update': 'updatedPatient',
  'patient.update_self': 'updatedOwnProfile',
  'symptom.create': 'recordedSymptom',
  'lab_result.create': 'recordedLabResult',
  'user.create': 'createdUser',
  'user.update': 'updatedUser',
  'user.profile_update': 'updatedProfile',
  'user.roles.update': 'changedUserRole',
  'user.access_profile.save': 'changedUserAccess',
  'user.status.update': 'changedUserStatus',
  'role.create': 'createdRole',
  'role.update': 'updatedRole',
  'role.delete': 'deletedRole',
  'rule.create': 'createdRule',
  'rule.update': 'updatedRule',
  'rule.archive': 'archivedRule',
  'fact.create': 'createdFact',
  'fact.update': 'updatedFact',
}

const ENTITY_TRANSLATION_KEYS = {
  user: 'user',
  role: 'role',
  patient: 'patient',
  diagnosis_result: 'assessment',
  assessment_session: 'assessment',
  symptom: 'symptom',
  lab_result: 'labResult',
  rule: 'rule',
  fact: 'knowledgeItem',
}

const DETAIL_TRANSLATION_KEYS = {
  email: 'email',
  roles: 'roles',
  diagnosis: 'assessmentResult',
  certainty: 'confidence',
  confidence_level: 'confidenceLevel',
  urgency: 'urgency',
  is_urgent: 'urgent',
  patient_id: 'patient',
  session_id: 'assessment',
  assessment_session_id: 'assessment',
  diagnosis_id: 'assessment',
  fields: 'updatedInformation',
  updated_fields: 'updatedInformation',
  permissions: 'permissions',
  direct_permissions: 'individualPermissions',
  effective_permissions: 'effectivePermissions',
  is_active: 'accountStatus',
  name: 'name',
  key: 'knowledgeItem',
  symptom_code: 'symptom',
  test_name: 'labTest',
  assessment_mode: 'assessmentType',
  has_sufficient_data: 'completed',
}

const HIDDEN_DETAIL_KEYS = new Set(['patient_note', 'refresh_jti', 'revoked_jtis'])

function readableValue(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function activityLabel(action, t) {
  const key = ACTION_TRANSLATION_KEYS[action]
  return key ? t(`auditLogPage.actions.${key}`) : readableValue(action)
}

function entityLabel(entityType, entityId, t) {
  const key = ENTITY_TRANSLATION_KEYS[entityType]
  const label = key ? t(`auditLogPage.entities.${key}`) : readableValue(entityType)
  return entityId ? `${label} #${entityId}` : label
}

function detailLabel(key, t) {
  const translationKey = DETAIL_TRANSLATION_KEYS[key]
  return translationKey ? t(`auditLogPage.details.${translationKey}`) : readableValue(key)
}

function detailValue(value, t) {
  if (typeof value === 'boolean') return value ? t('auditLogPage.details.yes') : t('auditLogPage.details.no')
  if (Array.isArray(value)) return value.map((item) => readableValue(item)).join(', ')
  if (value && typeof value === 'object') return Object.values(value).map((item) => readableValue(item)).join(', ')
  return readableValue(value)
}

function actionTone(action) {
  const value = String(action || '').toLowerCase()
  if (value.includes('error') || value.includes('delete') || value.includes('disable') || value.includes('revoke')) {
    return {
      icon: XCircle,
      badge: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300',
      iconClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    }
  }
  if (value.includes('change') || value.includes('role') || value.includes('permission') || value.includes('access')) {
    return {
      icon: ShieldCheck,
      badge: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/30 dark:text-violet-300',
      iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
    }
  }
  if (value.includes('create') || value.includes('enable') || value.includes('register')) {
    return {
      icon: CheckCircle2,
      badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300',
      iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    }
  }
  return {
    icon: Activity,
    badge: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-300',
    iconClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  }
}

function metadataEntries(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return []
  return Object.entries(metadata).filter(([key, value]) => !HIDDEN_DETAIL_KEYS.has(key) && value !== null && value !== '')
}

export function AuditLogPage() {
  const { t, language } = useLanguage()
  const [logs, setLogs] = useState([])
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    async function loadLogs() {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
        Object.entries(filters).forEach(([key, value]) => {
          if (String(value).trim()) params.set(key, String(value).trim())
        })
        const response = await api.get(`/admin/audit-logs?${params.toString()}`)
        const result = getApiPaginated(response)
        if (!active) return
        setLogs(result.data || [])
        setTotal(result.total || 0)
        setTotalPages(Math.max(1, result.totalPages || 1))
      } catch (requestError) {
        if (!active) return
        setLogs([])
        setError(getApiErrorMessage(requestError, t('auditLogPage.loadFailed')))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadLogs()
    return () => {
      active = false
    }
  }, [filters, page, pageSize, refreshKey, t])

  const pageStats = useMemo(() => {
    const actors = new Set(logs.map((log) => log.actor_user_id).filter(Boolean))
    const logins = logs.filter((log) => ['auth.login', 'auth.google_login'].includes(log.action)).length
    const assessments = logs.filter((log) => log.action?.startsWith('assessment.') || log.action?.startsWith('diagnosis.')).length
    return { actors: actors.size, logins, assessments }
  }, [logs])

  const rangeStart = total ? (page - 1) * pageSize + 1 : 0
  const rangeEnd = Math.min(page * pageSize, total)
  const hasFilters = Object.values(filters).some((value) => String(value).trim())

  function submitFilters(event) {
    event.preventDefault()
    setPage(1)
    setFilters({ ...draftFilters })
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  function applyCategory(category) {
    const next = { ...draftFilters, category }
    setDraftFilters(next)
    setFilters(next)
    setPage(1)
  }

  return (
    <div className="space-y-6 pb-12">
      <AdminHeroCard
        className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-sky-50/70 to-cyan-50/80 p-6 shadow-xs dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-cyan-950/20 sm:p-8"
        title={t('auditLogPage.hero.title')}
        description={t('auditLogPage.hero.description')}
        action={(
          <button
            type="button"
            disabled={loading}
            onClick={() => setRefreshKey((value) => value + 1)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('auditLogPage.refresh')}
          </button>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t('auditLogPage.metrics.total'), value: total, icon: FileClock, tone: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400' },
          { label: t('auditLogPage.metrics.actors'), value: pageStats.actors, icon: UserRound, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
          { label: t('auditLogPage.metrics.logins'), value: pageStats.logins, icon: CheckCircle2, tone: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400' },
          { label: t('auditLogPage.metrics.assessments'), value: pageStats.assessments, icon: ShieldCheck, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
        ].map((metric) => (
          <section key={metric.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${metric.tone}`}>
              <metric.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-950 dark:text-white">{metric.value}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{metric.label}</p>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <h2 className="font-bold text-slate-900 dark:text-white">{t('auditLogPage.filters.title')}</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ['', t('auditLogPage.filters.allActivity')],
            ['authentication', t('auditLogPage.filters.authentication')],
            ['assessments', t('auditLogPage.filters.assessments')],
            ['patients', t('auditLogPage.filters.patientActivity')],
            ['users', t('auditLogPage.filters.userManagement')],
            ['knowledge', t('auditLogPage.filters.knowledgeBase')],
          ].map(([value, label]) => {
            const selected = filters.category === value
            return (
              <button
                key={value || 'all'}
                type="button"
                onClick={() => applyCategory(value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selected
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <form onSubmit={submitFilters} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">{t('auditLogPage.filters.search')}</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={draftFilters.search}
              placeholder={t('auditLogPage.filters.searchPlaceholder')}
              onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
              className="input-base h-11 pl-10"
            />
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-primary-700">
              <Search className="h-4 w-4" />
              {t('auditLogPage.filters.apply')}
            </button>
            {hasFilters ? (
              <button type="button" onClick={clearFilters} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                {t('auditLogPage.filters.clear')}
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">{t('auditLogPage.table.title')}</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t('auditLogPage.table.description')}</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            {t('common.rows')}
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPage(1)
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
        </div>

        {error ? <p className="m-5 error-box">{error}</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">{t('auditLogPage.table.action')}</th>
                <th className="px-5 py-3 font-semibold">{t('auditLogPage.table.actor')}</th>
                <th className="px-5 py-3 font-semibold">{t('auditLogPage.table.target')}</th>
                <th className="px-5 py-3 font-semibold">{t('auditLogPage.table.details')}</th>
                <th className="px-5 py-3 font-semibold">{t('auditLogPage.table.time')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      {Array.from({ length: 5 }).map((__, cell) => <td key={cell} className="px-5 py-4"><Skeleton className="h-8 w-full" /></td>)}
                    </tr>
                  ))
                : logs.map((log) => {
                    const tone = actionTone(log.action)
                    const Icon = tone.icon
                    const details = metadataEntries(log.metadata)
                    return (
                      <tr key={log.id} className="align-top transition hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone.iconClass}`}><Icon className="h-4 w-4" /></span>
                            <div>
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>{activityLabel(log.action, t)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{log.actor_name || t('auditLogPage.table.system')}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{log.actor_email || (log.actor_user_id ? `#${log.actor_user_id}` : '—')}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{entityLabel(log.entity_type, log.entity_id, t)}</p>
                        </td>
                        <td className="max-w-sm px-5 py-4">
                          {details.length ? (
                            <details className="group">
                              <summary className="cursor-pointer text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">{t('auditLogPage.table.viewDetails', { count: details.length })}</summary>
                              <dl className="mt-2 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-950/50">
                                {details.map(([key, value]) => (
                                  <div key={key} className="grid grid-cols-[minmax(90px,0.7fr)_minmax(0,1.3fr)] gap-2">
                                    <dt className="font-semibold text-slate-500 dark:text-slate-400">{detailLabel(key, t)}</dt>
                                    <dd className="break-words text-slate-700 dark:text-slate-300">{detailValue(value, t)}</dd>
                                  </div>
                                ))}
                              </dl>
                            </details>
                          ) : <span className="text-sm text-slate-400">{t('auditLogPage.table.noDetails')}</span>}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatRelativeTime(log.created_at, language, t)}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{formatDateTime(log.created_at, '—', language)}</p>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>

        {!loading && !logs.length && !error ? (
          <div className="p-8">
            <EmptyState icon={FileClock} title={t('auditLogPage.empty.title')} description={t('auditLogPage.empty.description')} />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-200/80 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('common.showing', { from: rangeStart, to: rangeEnd, total })}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <ChevronLeft className="h-4 w-4" /> {t('common.previous')}
            </button>
            <span className="min-w-20 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              {t('common.next')} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
