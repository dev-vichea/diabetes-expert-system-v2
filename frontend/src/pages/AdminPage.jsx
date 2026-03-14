import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

const PAGE_SIZE_OPTIONS = [10, 20, 50]

function formatRelativeTime(value) {
  if (!value) return 'No activity yet'

  const time = new Date(value).getTime()
  const now = Date.now()
  const diffMinutes = Math.max(0, Math.round((now - time) / 60000))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  if (diffMinutes < 1440) return `${Math.round(diffMinutes / 60)} hour${diffMinutes >= 120 ? 's' : ''} ago`
  const days = Math.round(diffMinutes / 1440)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function formatDateTime(value) {
  if (!value) return 'Unknown'
  return new Date(value).toLocaleString()
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

function exportUsersCsv(users) {
  const header = ['Name', 'Email', 'Role', 'Status', 'Permissions', 'Created At', 'Updated At']
  const rows = users.map((user) => [
    user.name,
    user.email,
    user.role || '',
    user.is_active ? 'Active' : 'Inactive',
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
  notify.info('User export downloaded.')
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
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-[2px] animate-in fade-in-0">
      <div className="surface dark-hover-border w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#1f2640] dark:bg-[#070712] animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-[#1f2640]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              {mode === 'create' ? 'New Account' : 'Edit Account'}
            </p>
            <h3 className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50">
              {mode === 'create' ? 'Add User' : 'Update User'}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {mode === 'create'
                ? 'Create a new system account and assign the initial role.'
                : 'Update account identity, role assignment, and access state.'}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
            onClick={onClose}
            disabled={saving}
            aria-label="Close editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="grid gap-4 px-6 py-6 sm:grid-cols-2" onSubmit={onSubmit}>
          <label className="block sm:col-span-2">
            <span className="label-text">Full Name</span>
            <input
              className="input-base"
              value={editor.name}
              onChange={(event) => onChange({ ...editor, name: event.target.value })}
              required
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="label-text">Email</span>
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
              <span className="label-text">Password</span>
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
            <span className="label-text">Role</span>
            <AppSelect
              value={editor.role}
              onValueChange={(value) => onChange({ ...editor, role: value })}
              options={roleOptions}
            />
          </label>

          <label className="block">
            <span className="label-text">Account Status</span>
            <AppSelect
              value={editor.is_active ? 'active' : 'inactive'}
              onValueChange={(value) => onChange({ ...editor, is_active: value === 'active' })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </label>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5 sm:col-span-2 dark:border-slate-800">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary gap-2" disabled={saving}>
              {mode === 'create' ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {saving ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export function AdminPage({ user: currentUser }) {
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
      title: 'Total Users',
      description: 'All registered accounts',
      value: stats?.users?.total ?? 0,
      icon: Users,
      iconClass: 'bg-violet-100/20 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-900/10 dark:text-violet-300 dark:ring-violet-500/30',
      shellClass: 'from-violet-50 via-white to-white dark:from-violet-950/20 dark:via-[#070712] dark:to-[#070712]',
      glowClass: 'bg-violet-300/25 dark:bg-violet-500/10',
      accentClass: 'bg-violet-500',
    },
    {
      title: 'Patients',
      description: 'Linked patient profiles',
      value: stats?.patients?.total ?? 0,
      icon: Stethoscope,
      iconClass: 'bg-sky-100/20 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/10 dark:text-sky-300 dark:ring-sky-500/30',
      shellClass: 'from-sky-50 via-white to-white dark:from-sky-950/20 dark:via-[#070712] dark:to-[#070712]',
      glowClass: 'bg-sky-300/25 dark:bg-sky-500/10',
      accentClass: 'bg-sky-500',
    },
    {
      title: 'Diagnosis Total',
      description: 'Recorded diagnostic outcomes',
      value: stats?.diagnosis?.total ?? 0,
      icon: Shield,
      iconClass: 'bg-cyan-100/20 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/10 dark:text-cyan-300 dark:ring-cyan-500/30',
      shellClass: 'from-cyan-50 via-white to-white dark:from-cyan-950/20 dark:via-[#070712] dark:to-[#070712]',
      glowClass: 'bg-cyan-300/25 dark:bg-cyan-500/10',
      accentClass: 'bg-cyan-500',
    },
    {
      title: 'Urgent Cases',
      description: 'Cases flagged for review',
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
      setError(getApiErrorMessage(err, 'Failed to load admin dashboard'))
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
      setError(getApiErrorMessage(err, 'Failed to load users'))
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
    const loadingToast = notify.loading(editorMode === 'create' ? 'Creating user...' : 'Saving user changes...')

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
      notify.success(editorMode === 'create' ? 'User created successfully.' : 'User updated successfully.')
      closeEditor()
    } catch (err) {
      notify.dismiss(loadingToast)
      notify.error(getApiErrorMessage(err, `Failed to ${editorMode === 'create' ? 'create' : 'update'} user`))
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
    const loadingToast = notify.loading(pendingStatusUser.is_active ? 'Disabling user...' : 'Enabling user...')

    try {
      await api.patch(`/admin/users/${pendingStatusUser.id}/status`, {
        is_active: !pendingStatusUser.is_active,
      })
      await Promise.all([
        loadUsers({ searchValue: search, statusValue: statusTab }),
        loadDashboard(),
      ])
      notify.dismiss(loadingToast)
      notify.success(`User ${pendingStatusUser.is_active ? 'disabled' : 'enabled'} successfully.`)
    } catch (err) {
      notify.dismiss(loadingToast)
      notify.error(getApiErrorMessage(err, 'Failed to update account status'))
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
          eyebrow="User Management"
          eyebrowIcon={Users}
          title="Users"
          description="Manage team members, roles, and account access from one control surface."
          action={(
            <button
              type="button"
              className="btn-primary gap-2 self-start rounded-2xl px-5 py-3 shadow-lg shadow-cyan-700/15"
              onClick={openCreateUser}
            >
              <Plus className="h-4 w-4" />
              Add User
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
            title="Users by Role"
            description="Distribution across assigned roles."
            icon={Users}
            iconClass="text-violet-500"
            glowClass="bg-violet-200/20 dark:bg-violet-500/10"
          >
            {!roleDistributionData.length ? (
              <EmptyState title="No role data" description="Role distribution appears when user stats are available." />
            ) : (
              <ChartContainer className="h-64 w-full" config={{ count: { label: 'Users', color: '#1f76e8' } }}>
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
            title="Rules by Status"
            description="Current active versus archived rules."
            icon={Shield}
            iconClass="text-cyan-500"
            glowClass="bg-cyan-200/20 dark:bg-cyan-500/10"
          >
            {!rulesStatusData.length ? (
              <EmptyState title="No rule data" description="Rule status chart appears once rule stats are loaded." />
            ) : (
              <ChartContainer
                className="h-64 w-full"
                config={{
                  active: { label: 'Active', color: '#16a34a' },
                  inactive: { label: 'Inactive', color: '#f59e0b' },
                  archived: { label: 'Archived', color: '#94a3b8' },
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
            title="Top Actions (7d)"
            description="Most common admin and auth events."
            icon={Activity}
            iconClass="text-emerald-500"
            glowClass="bg-emerald-200/20 dark:bg-emerald-500/10"
          >
            {!topActionData.length ? (
              <EmptyState title="No action data" description="Activity actions will be charted once events are available." />
            ) : (
              <ChartContainer className="h-64 w-full" config={{ count: { label: 'Events', color: '#14b8a6' } }}>
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
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input-base rounded-2xl pl-11"
                placeholder="Search users..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="btn-secondary gap-2 rounded-2xl">
                    <Settings2 className="h-4 w-4" />
                    Columns
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[
                    ['role', 'Role'],
                    ['access', 'Access'],
                    ['status', 'Status'],
                    ['updated_at', 'Last Active'],
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

              <button type="button" className="btn-secondary gap-2 rounded-2xl" onClick={() => exportUsersCsv(sortedUsers)}>
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {statusTab === 'suspended' ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
              Suspended accounts are not modeled separately in the current backend. Use <span className="font-semibold">Inactive</span> to disable access.
            </div>
          ) : null}

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-slate-950/20">
                <thead className="bg-slate-50/80 dark:bg-slate-950/60">
                  <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('name')}>
                      Name
                      <ArrowUpDown className="h-4 w-4 text-slate-400" />
                      </button>
                    </th>
                    {visibleColumns.role ? (
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('role')}>
                          Role
                          <ArrowUpDown className="h-4 w-4 text-slate-400" />
                        </button>
                      </th>
                    ) : null}
                    {visibleColumns.access ? <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Access</th> : null}
                    {visibleColumns.status ? (
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('status')}>
                          Status
                          <ArrowUpDown className="h-4 w-4 text-slate-400" />
                        </button>
                      </th>
                    ) : null}
                    {visibleColumns.updated_at ? (
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('updated_at')}>
                          Last Active
                          <ArrowUpDown className="h-4 w-4 text-slate-400" />
                        </button>
                      </th>
                    ) : null}
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        Loading users...
                      </td>
                    </tr>
                  ) : null}

                  {!loadingUsers && !paginatedUsers.length ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-10">
                        <EmptyState title="No users found" description="Try another search or switch account status." />
                      </td>
                    </tr>
                  ) : null}

                  {!loadingUsers
                    ? paginatedUsers.map((user) => {
                      const primaryRole = user.role || user.roles?.[0] || 'patient'
                      const accessLabel = `${user.permissions?.length || 0} permission${user.permissions?.length === 1 ? '' : 's'}`
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
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeClass(primaryRole)}`}>
                                {primaryRole}
                              </span>
                            </td>
                          ) : null}
                          {visibleColumns.access ? (
                            <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300">
                              <p>{accessLabel}</p>
                              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">Created {formatDateTime(user.created_at)}</p>
                            </td>
                          ) : null}
                          {visibleColumns.status ? (
                            <td className="px-3 py-3">
                              <StatusBadge tone={user.is_active ? 'success' : 'neutral'}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </StatusBadge>
                            </td>
                          ) : null}
                          {visibleColumns.updated_at ? (
                            <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300">
                              {formatRelativeTime(user.updated_at || user.created_at)}
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
              Showing {showingFrom}-{showingTo} of {sortedUsers.length} results
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>Rows</span>
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
                  Previous
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
                  Next
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
        title={pendingStatusUser?.is_active ? 'Disable user account?' : 'Enable user account?'}
        description={
          pendingStatusUser
            ? `${pendingStatusUser.name} will be ${pendingStatusUser.is_active ? 'marked inactive and will lose access until re-enabled.' : 'restored and allowed to sign in again.'}`
            : 'Confirm account status change.'
        }
        confirmLabel={pendingStatusUser?.is_active ? 'Disable User' : 'Enable User'}
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
