import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
import {
  Activity,
  ArrowUpDown,
  Download,
  Pencil,
  Plus,
  Search,
  Settings2,
  Shield,
  Siren,
  Stethoscope,
  Trash2,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { AdminHeroCard, AdminInsightPanel, AdminMetricCard } from '@/components/admin'
import { formatDateTime, getDateTimeTimestamp } from '@/lib/datetime'
import { notify } from '@/lib/toast'
import {
  AppSelect,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  StatusBadge,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui'

const DEFAULT_EDITOR = {
  id: null,
  name: '',
  email: '',
  password: '',
  role: 'patient',
  is_active: true,
}

const STATUS_TABS = [
  { value: 'all', label: 'common.all' },
  { value: 'active', label: 'common.active' },
  { value: 'inactive', label: 'common.inactive' },
  { value: 'suspended', label: 'common.suspended' },
]

const PAGE_SIZE_OPTIONS = [10, 20, 50]

function formatRelativeTime(value, t) {
  if (!value) return t('time.noActivity')

  const time = getDateTimeTimestamp(value)
  if (Number.isNaN(time)) return t('time.noActivity')
  const now = Date.now()
  const diffMinutes = Math.max(0, Math.round((now - time) / 60000))

  if (diffMinutes < 1) return t('time.justNow')
  if (diffMinutes < 60) return t('time.minAgo', { count: diffMinutes })
  if (diffMinutes < 1440) {
    const hours = Math.round(diffMinutes / 60)
    return hours >= 2 ? t('time.hoursAgo', { count: hours }) : t('time.hourAgo', { count: hours })
  }
  const days = Math.round(diffMinutes / 1440)
  return days > 1 ? t('time.daysAgo', { count: days }) : t('time.dayAgo', { count: days })
}

function getInitials(name) {
  const parts = String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
  if (!parts.length) return 'U'
  return parts.map((part) => part[0].toUpperCase()).join('')
}

function roleBadgeClass(role) {
  const normalized = String(role || '').toLowerCase()
  if (normalized === 'super_admin') return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/60'
  if (normalized === 'admin') return 'bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800/60'
  if (normalized === 'doctor') return 'bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-800/60'
  if (normalized === 'patient') return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/60'
  return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800/60'
}

function exportUsersCsv(users, t) {
  const header = [
    t('usersPage.table.headers.name'),
    t('usersPage.table.headers.email'),
    t('usersPage.table.headers.role'),
    t('usersPage.table.headers.status'),
    t('usersPage.table.headers.access'),
    t('usersPage.table.headers.created'),
    t('usersPage.table.headers.updated'),
  ]
  const rows = users.map((user) => [
    user.name,
    user.email,
    user.role || '',
    user.is_active ? t('common.active') : t('common.inactive'),
    user.permissions?.join('; ') || '',
    user.created_at || '',
    user.updated_at || '',
  ])
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'admin-users-export.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  notify.info(t('usersPage.notifications.exportSuccess'))
}

function compareValues(left, right) {
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' })
}

function sortUsers(users, sortKey, sortDirection) {
  const sorted = [...users].sort((a, b) => {
    let result = 0

    if (sortKey === 'name') result = compareValues(a.name, b.name)
    if (sortKey === 'role') result = compareValues(a.role || a.roles?.[0], b.role || b.roles?.[0])
    if (sortKey === 'status') result = compareValues(a.is_active ? 'active' : 'inactive', b.is_active ? 'active' : 'inactive')
    if (sortKey === 'updated_at') result = compareValues(a.updated_at || a.created_at, b.updated_at || b.created_at)

    return sortDirection === 'asc' ? result : -result
  })

  return sorted
}

function UserEditorDialog({
  open,
  mode,
  editor,
  roleOptions,
  saving,
  onClose,
  onChange,
  onSubmit,
}) {
  const { t } = useLanguage()
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-[2px] animate-in fade-in-0">
      <div className="surface dark-hover-border w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#1f2640] dark:bg-[#070712] animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-[#1f2640]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              {mode === 'create' ? t('usersPage.editor.newAccount') : t('usersPage.editor.editAccount')}
            </p>
            <h3 className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50">
              {mode === 'create' ? t('usersPage.editor.addUser') : t('usersPage.editor.updateUser')}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {mode === 'create'
                ? t('usersPage.editor.createDesc')
                : t('usersPage.editor.editDesc')}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
            onClick={onClose}
            disabled={saving}
            aria-label={t('common.closeSidebar')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="grid gap-4 px-6 py-6 sm:grid-cols-2" onSubmit={onSubmit}>
          <label className="block sm:col-span-2">
            <span className="label-text">{t('usersPage.editor.fields.fullName')}</span>
            <input
              className="input-base"
              value={editor.name}
              onChange={(event) => onChange({ ...editor, name: event.target.value })}
              required
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="label-text">{t('usersPage.editor.fields.email')}</span>
            <input
              className="input-base"
              type="email"
              value={editor.email}
              onChange={(event) => onChange({ ...editor, email: event.target.value })}
              required
            />
          </label>

          {mode === 'create' ? (
            <label className="block sm:col-span-2">
              <span className="label-text">{t('usersPage.editor.fields.password')}</span>
              <input
                className="input-base"
                type="password"
                value={editor.password}
                onChange={(event) => onChange({ ...editor, password: event.target.value })}
                required
              />
            </label>
          ) : null}

          <label className="block">
            <span className="label-text">{t('usersPage.editor.fields.role')}</span>
            <AppSelect
              value={editor.role}
              onValueChange={(value) => onChange({ ...editor, role: value })}
              options={roleOptions}
            />
          </label>

          <label className="block">
            <span className="label-text">{t('usersPage.editor.fields.status')}</span>
            <AppSelect
              value={editor.is_active ? 'active' : 'inactive'}
              onValueChange={(value) => onChange({ ...editor, is_active: value === 'active' })}
              options={[
                { value: 'active', label: t('common.active') },
                { value: 'inactive', label: t('common.inactive') },
              ]}
            />
          </label>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5 sm:col-span-2 dark:border-slate-800">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              {t('usersPage.editor.actions.cancel')}
            </button>
            <button type="submit" className="btn-primary gap-2" disabled={saving}>
              {mode === 'create' ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {saving ? t('usersPage.editor.actions.saving') : mode === 'create' ? t('usersPage.editor.actions.createUser') : t('usersPage.editor.actions.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export function AdminPage() {
  const { user: currentUser } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [activityOverview, setActivityOverview] = useState({ summary: null, recent_events: [] })
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortKey, setSortKey] = useState('updated_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showEditor, setShowEditor] = useState(false)
  const [editorMode, setEditorMode] = useState('create')
  const [editor, setEditor] = useState(DEFAULT_EDITOR)
  const [pendingStatusUser, setPendingStatusUser] = useState(null)
  const [showStatusConfirm, setShowStatusConfirm] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    role: true,
    access: true,
    status: true,
    updated_at: true,
  })

  const roleDistributionData = useMemo(
    () => Object.entries(stats?.users?.by_role || {}).map(([role, count]) => ({ role, count })),
    [stats]
  )
  const rulesStatusData = useMemo(
    () => Object.entries(stats?.rules?.by_status || {}).map(([status, count]) => ({ status, count })),
    [stats]
  )
  const topActionData = useMemo(
    () => (activityOverview.summary?.top_actions || []).slice(0, 6).map((row) => ({
      action: row.action.replace(/\./g, ' '),
      count: row.count,
    })),
    [activityOverview]
  )

  const currentActorRoles = useMemo(
    () => new Set(currentUser?.roles || (currentUser?.role ? [currentUser.role] : [])),
    [currentUser]
  )
  const actorIsSuperAdmin = currentActorRoles.has('super_admin')
  const roleOptions = useMemo(
    () => roles
      .filter((role) => actorIsSuperAdmin || role.name !== 'super_admin')
      .map((role) => ({ value: role.name, label: role.name })),
    [actorIsSuperAdmin, roles]
  )

  const sortedUsers = useMemo(() => sortUsers(users, sortKey, sortDirection), [users, sortKey, sortDirection])
  const pageCount = Math.max(1, Math.ceil(sortedUsers.length / pageSize))
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedUsers.slice(start, start + pageSize)
  }, [sortedUsers, page, pageSize])

  const statsCards = [
    {
      title: t('adminStats.totalUsers'),
      description: t('adminStats.totalUsersDesc'),
      value: stats?.users?.total ?? 0,
      icon: Users,
      iconClass: 'bg-violet-100/20 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-900/10 dark:text-violet-300 dark:ring-violet-500/30',
      shellClass: 'from-violet-50 via-white to-white dark:from-violet-950/20 dark:via-[#070712] dark:to-[#070712]',
      glowClass: 'bg-violet-300/25 dark:bg-violet-500/10',
      accentClass: 'bg-violet-500',
    },
    {
      title: t('adminStats.patients'),
      description: t('adminStats.patientsDesc'),
      value: stats?.patients?.total ?? 0,
      icon: Stethoscope,
      iconClass: 'bg-sky-100/20 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/10 dark:text-sky-300 dark:ring-sky-500/30',
      shellClass: 'from-sky-50 via-white to-white dark:from-sky-950/20 dark:via-[#070712] dark:to-[#070712]',
      glowClass: 'bg-sky-300/25 dark:bg-sky-500/10',
      accentClass: 'bg-sky-500',
    },
    {
      title: t('adminStats.diagnosisTotal'),
      description: t('adminStats.diagnosisDesc'),
      value: stats?.diagnosis?.total ?? 0,
      icon: Shield,
      iconClass: 'bg-cyan-100/20 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/10 dark:text-cyan-300 dark:ring-cyan-500/30',
      shellClass: 'from-cyan-50 via-white to-white dark:from-cyan-950/20 dark:via-[#070712] dark:to-[#070712]',
      glowClass: 'bg-cyan-300/25 dark:bg-cyan-500/10',
      accentClass: 'bg-cyan-500',
    },
    {
      title: t('adminStats.urgentCases'),
      description: t('adminStats.urgentCasesDesc'),
      value: stats?.diagnosis?.urgent ?? 0,
      icon: Siren,
      iconClass: 'bg-amber-100/20 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/10 dark:text-amber-300 dark:ring-amber-500/30',
      shellClass: 'from-amber-50 via-white to-white dark:from-amber-950/20 dark:via-[#070712] dark:to-[#070712]',
      glowClass: 'bg-amber-300/25 dark:bg-amber-500/10',
      accentClass: 'bg-amber-500',
    },
  ]

  const pageSectionClass = 'p-0'

  useEffect(() => {
    setPage(1)
  }, [search, statusTab, pageSize])

  useEffect(() => {
    async function loadInitial() {
      await Promise.all([loadDashboard(), loadUsers({ searchValue: '', statusValue: 'all' })])
    }

    loadInitial()
  }, [])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      loadUsers({ searchValue: search, statusValue: statusTab })
    }, 250)

    return () => window.clearTimeout(handle)
  }, [search, statusTab])

  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      const [statsResponse, activityResponse] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/activity?days=7&limit=30'),
      ])

      setStats(getApiData(statsResponse) || null)
      setActivityOverview(getApiData(activityResponse) || { summary: null, recent_events: [] })
    } catch (err) {
      setError(getApiErrorMessage(err, t('usersPage.notifications.loadError')))
    } finally {
      setLoading(false)
    }
  }

  async function loadUsers({ searchValue = search, statusValue = statusTab } = {}) {
    setLoadingUsers(true)
    setError('')

    try {
      if (statusValue === 'suspended') {
        const rolesResponse = await api.get('/admin/roles')
        setUsers([])
        setRoles(getApiData(rolesResponse) || [])
        return
      }

      const params = new URLSearchParams({ limit: '200' })
      const normalizedSearch = searchValue.trim()
      if (normalizedSearch) params.set('search', normalizedSearch)
      if (statusValue !== 'all') params.set('status', statusValue)

      const [usersResponse, rolesResponse] = await Promise.all([
        api.get(`/admin/users?${params.toString()}`),
        api.get('/admin/roles'),
      ])

      setUsers(getApiData(usersResponse) || [])
      setRoles(getApiData(rolesResponse) || [])
    } catch (err) {
      setError(getApiErrorMessage(err, t('usersPage.notifications.loadError')))
    } finally {
      setLoadingUsers(false)
    }
  }

  function openCreateUser() {
    setEditorMode('create')
    setEditor(DEFAULT_EDITOR)
    setShowEditor(true)
  }

  function openEditUser(user) {
    navigate(`/users/${user.id}/edit`)
  }

  function closeEditor() {
    if (savingUser) return
    setShowEditor(false)
    setEditorMode('create')
    setEditor(DEFAULT_EDITOR)
  }

  async function submitEditor(event) {
    event.preventDefault()
    setSavingUser(true)
    setError('')
    const loadingToast = notify.loading(editorMode === 'create' ? t('usersPage.notifications.creating') : t('usersPage.notifications.updating'))

    try {
      if (editorMode === 'create') {
        await api.post('/admin/users', {
          name: editor.name,
          email: editor.email,
          password: editor.password,
          roles: [editor.role],
          is_active: editor.is_active,
        })
      } else {
        await api.patch(`/admin/users/${editor.id}`, {
          name: editor.name,
          email: editor.email,
        })
        await api.patch(`/admin/users/${editor.id}/roles`, {
          roles: [editor.role],
        })
        await api.patch(`/admin/users/${editor.id}/status`, {
          is_active: editor.is_active,
        })
      }

      await Promise.all([
        loadUsers({ searchValue: search, statusValue: statusTab }),
        loadDashboard(),
      ])
      notify.dismiss(loadingToast)
      notify.success(editorMode === 'create' ? t('usersPage.notifications.createSuccess') : t('usersPage.notifications.updateSuccess'))
      closeEditor()
    } catch (err) {
      notify.dismiss(loadingToast)
      notify.error(getApiErrorMessage(err, editorMode === 'create' ? t('usersPage.notifications.createError') : t('usersPage.notifications.updateError')))
    } finally {
      setSavingUser(false)
    }
  }

  function requestStatusToggle(user) {
    setPendingStatusUser(user)
    setShowStatusConfirm(true)
  }

  async function confirmStatusToggle() {
    if (!pendingStatusUser) return

    setSavingUser(true)
    setError('')
    const loadingToast = notify.loading(pendingStatusUser.is_active ? t('usersPage.notifications.disabling') : t('usersPage.notifications.enabling'))

    try {
      await api.patch(`/admin/users/${pendingStatusUser.id}/status`, {
        is_active: !pendingStatusUser.is_active,
      })
      await Promise.all([
        loadUsers({ searchValue: search, statusValue: statusTab }),
        loadDashboard(),
      ])
      notify.dismiss(loadingToast)
      notify.success(t('usersPage.notifications.statusSuccess'))
    } catch (err) {
      notify.dismiss(loadingToast)
      notify.error(getApiErrorMessage(err, t('usersPage.notifications.updateError')))
    } finally {
      setSavingUser(false)
      setShowStatusConfirm(false)
      setPendingStatusUser(null)
    }
  }

  function toggleSort(nextKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(nextKey)
    setSortDirection(nextKey === 'updated_at' ? 'desc' : 'asc')
  }

  function toggleColumn(column) {
    setVisibleColumns((current) => ({ ...current, [column]: !current[column] }))
  }

  const showingFrom = sortedUsers.length ? (page - 1) * pageSize + 1 : 0
  const showingTo = Math.min(page * pageSize, sortedUsers.length)

  return (
    <div className="space-y-6">
      <section className={pageSectionClass}>
        <AdminHeroCard
          eyebrow={t('usersPage.hero.eyebrow')}
          eyebrowIcon={Users}
          title={t('usersPage.hero.title')}
          description={t('usersPage.hero.description')}
          action={(
            <button
              type="button"
              className="btn-primary gap-2 self-start rounded-2xl px-5 py-3 shadow-lg shadow-cyan-700/15"
              onClick={openCreateUser}
            >
              <Plus className="h-4 w-4" />
              {t('usersPage.hero.addUser')}
            </button>
          )}
        />
      </section>

      <section className={pageSectionClass}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statsCards.map((card) => (
            <AdminMetricCard
              key={card.title}
              title={card.title}
              description={card.description}
              value={card.value}
              icon={card.icon}
              iconClass={card.iconClass}
              shellClass={card.shellClass}
              glowClass={card.glowClass}
              accentClass={card.accentClass}
              loading={loading}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <AdminInsightPanel
            title={t('usersPage.insights.rolesTitle')}
            description={t('usersPage.insights.rolesDesc')}
            icon={Users}
            iconClass="text-violet-500"
            glowClass="bg-violet-200/20 dark:bg-violet-500/10"
          >
            {!roleDistributionData.length ? (
              <EmptyState title={t('usersPage.insights.noRoleData')} description={t('usersPage.insights.noRoleDataDesc')} />
            ) : (
              <ChartContainer className="h-64 w-full" config={{ count: { label: t('usersPage.insights.usersCount'), color: '#1f76e8' } }}>
                <BarChart accessibilityLayer data={roleDistributionData} margin={{ left: 6, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="role" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </AdminInsightPanel>

          <AdminInsightPanel
            title={t('usersPage.insights.rulesTitle')}
            description={t('usersPage.insights.rulesDesc')}
            icon={Shield}
            iconClass="text-cyan-500"
            glowClass="bg-cyan-200/20 dark:bg-cyan-500/10"
          >
            {!rulesStatusData.length ? (
              <EmptyState title={t('usersPage.insights.noRuleData')} description={t('usersPage.insights.noRuleDataDesc')} />
            ) : (
              <ChartContainer
                className="h-64 w-full"
                config={{
                  active: { label: t('common.active'), color: '#16a34a' },
                  inactive: { label: t('common.inactive'), color: '#f59e0b' },
                  archived: { label: t('common.archived'), color: '#94a3b8' },
                }}
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={rulesStatusData} dataKey="count" nameKey="status" innerRadius={46} outerRadius={86} stroke="none" strokeWidth={0}>
                    {rulesStatusData.map((entry) => (
                      <Cell key={entry.status} fill={`var(--color-${entry.status})`} stroke="none" />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </AdminInsightPanel>

          <AdminInsightPanel
            title={t('usersPage.insights.actionsTitle')}
            description={t('usersPage.insights.actionsDesc')}
            icon={Activity}
            iconClass="text-emerald-500"
            glowClass="bg-emerald-200/20 dark:bg-emerald-500/10"
          >
            {!topActionData.length ? (
              <EmptyState title={t('usersPage.insights.noActionData')} description={t('usersPage.insights.noActionDataDesc')} />
            ) : (
              <ChartContainer className="h-64 w-full" config={{ count: { label: t('usersPage.insights.eventsCount'), color: '#14b8a6' } }}>
                <BarChart accessibilityLayer data={topActionData} layout="vertical" margin={{ left: 4, right: 4 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="action" width={120} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </AdminInsightPanel>
        </div>

        <div className="surface mt-6 p-4">
          <Tabs value={statusTab} onValueChange={setStatusTab}>
            <TabsList>
              {STATUS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={tab.value === 'suspended' ? 'opacity-80' : ''}
                >
                  {t(tab.label)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input-base rounded-2xl pl-11"
                placeholder={t('usersPage.table.searchPlaceholder')}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="btn-secondary gap-2 rounded-2xl">
                    <Settings2 className="h-4 w-4" />
                    {t('usersPage.table.columns')}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>{t('usersPage.table.visibleColumns')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[
                    ['role', t('usersPage.table.headers.role')],
                    ['access', t('usersPage.table.headers.access')],
                    ['status', t('usersPage.table.headers.status')],
                    ['updated_at', t('usersPage.table.headers.lastActive')],
                  ].map(([key, label]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={visibleColumns[key]}
                      onCheckedChange={() => toggleColumn(key)}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button type="button" className="btn-secondary gap-2 rounded-2xl" onClick={() => exportUsersCsv(sortedUsers, t)}>
                <Download className="h-4 w-4" />
                {t('usersPage.table.export')}
              </button>
            </div>
          </div>

          {statusTab === 'suspended' ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
              {t('usersPage.table.suspendedNotice')}
            </div>
          ) : null}

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-slate-950/20">
                <thead className="bg-slate-50/80 dark:bg-slate-950/60">
                  <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('name')}>
                      {t('usersPage.table.headers.name')}
                      <ArrowUpDown className="h-4 w-4 text-slate-400" />
                      </button>
                    </th>
                    {visibleColumns.role ? (
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('role')}>
                          {t('usersPage.table.headers.role')}
                          <ArrowUpDown className="h-4 w-4 text-slate-400" />
                        </button>
                      </th>
                    ) : null}
                    {visibleColumns.access ? <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">{t('usersPage.table.headers.access')}</th> : null}
                    {visibleColumns.status ? (
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('status')}>
                          {t('usersPage.table.headers.status')}
                          <ArrowUpDown className="h-4 w-4 text-slate-400" />
                        </button>
                      </th>
                    ) : null}
                    {visibleColumns.updated_at ? (
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('updated_at')}>
                          {t('usersPage.table.headers.lastActive')}
                          <ArrowUpDown className="h-4 w-4 text-slate-400" />
                        </button>
                      </th>
                    ) : null}
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">{t('usersPage.table.headers.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        {t('usersPage.table.states.loading')}
                      </td>
                    </tr>
                  ) : null}

                  {!loadingUsers && !paginatedUsers.length ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-10">
                        <EmptyState title={t('usersPage.table.states.noneFound')} description={t('usersPage.table.states.noneFoundDesc')} />
                      </td>
                    </tr>
                  ) : null}

                    {!loadingUsers
                      ? paginatedUsers.map((user) => {
                        const primaryRole = user.role || user.roles?.[0] || 'patient'
                        const count = user.permissions?.length || 0
                        const accessLabel = t('usersPage.table.states.permissions', { count })
                      return (
                        <tr key={user.id} className="border-t border-slate-200 transition hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-950/40">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                                {getInitials(user.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">{user.name}</p>
                                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          {visibleColumns.role ? (
                            <td className="px-3 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass(primaryRole)}`}>
                                {t(`roles.${primaryRole}`)}
                              </span>
                            </td>
                          ) : null}
                          {visibleColumns.access ? (
                            <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-400">
                              <p>{accessLabel}</p>
                              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">Created {formatDateTime(user.created_at)}</p>
                            </td>
                          ) : null}
                          {visibleColumns.status ? (
                            <td className="px-3 py-3">
                              <button type="button" className="group flex items-center gap-2" onClick={() => requestStatusToggle(user)}>
                                <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                              </button>
                            </td>
                          ) : null}
                          {visibleColumns.updated_at ? (
                            <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                              {formatRelativeTime(user.updated_at || user.created_at, t)}
                            </td>
                          ) : null}
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                                onClick={() => openEditUser(user)}
                                aria-label={`Edit ${user.name}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${user.is_active
                                    ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30'
                                  }`}
                                onClick={() => requestStatusToggle(user)}
                                aria-label={`${user.is_active ? 'Disable' : 'Enable'} ${user.name}`}
                              >
                                {user.is_active ? <Trash2 className="h-3.5 w-3.5" /> : <UserRoundCheck className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                    : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('common.showing', { from: showingFrom, to: showingTo, total: sortedUsers.length })}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>{t('common.rows')}</span>
                <div className="min-w-[88px]">
                  <AppSelect
                    value={String(pageSize)}
                    onValueChange={(value) => setPageSize(Number(value))}
                    options={PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: String(size) }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary rounded-2xl px-4 py-2"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  {t('common.previous')}
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(pageCount, 3) }, (_, index) => {
                    let pageNumber = index + 1
                    if (pageCount > 3 && page > 2) {
                      pageNumber = Math.min(pageCount - 2 + index, pageCount)
                    }
                    if (pageCount > 3 && page >= pageCount - 1) {
                      pageNumber = pageCount - 2 + index
                    }
                    const active = page === pageNumber
                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-semibold transition ${active
                            ? 'border-violet-500 bg-violet-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-200 dark:hover:bg-slate-900'
                          }`}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  className="btn-secondary rounded-2xl px-4 py-2"
                  disabled={page >= pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          </div>
        </div>

      </section>

      {error ? <p className="error-box">{error}</p> : null}

      <UserEditorDialog
        open={showEditor}
        mode={editorMode}
        editor={editor}
        roleOptions={roleOptions}
        saving={savingUser}
        onClose={closeEditor}
        onChange={setEditor}
        onSubmit={submitEditor}
      />

      <ConfirmDialog
        open={showStatusConfirm}
        title={pendingStatusUser?.is_active ? t('common.disableAccount') : t('common.enableAccount')}
        description={
          pendingStatusUser
            ? pendingStatusUser.is_active 
                ? t('common.disableDesc', { name: pendingStatusUser.name })
                : t('common.enableDesc', { name: pendingStatusUser.name })
            : t('common.confirmStatusChange')
        }
        confirmLabel={pendingStatusUser?.is_active ? t('common.disableUser') : t('common.enableUser')}
        confirmTone="danger"
        loading={savingUser}
        onCancel={() => {
          if (savingUser) return
          setShowStatusConfirm(false)
          setPendingStatusUser(null)
        }}
        onConfirm={confirmStatusToggle}
      />
    </div>
  )
}
