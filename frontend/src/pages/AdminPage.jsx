import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  KeyRound,
  Loader2,
  LockKeyhole,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { getDateTimeTimestamp } from '@/lib/datetime'
import { notify } from '@/lib/toast'

const ROLE_FILTERS = ['all', 'admin', 'doctor', 'patient']

function initials(name) {
  const parts = String(name || 'User').trim().split(/\s+/).filter(Boolean).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase()).join('') || 'U'
}

function formatRelativeTime(value) {
  if (!value) return 'No activity'
  const timestamp = getDateTimeTimestamp(value)
  if (Number.isNaN(timestamp)) return 'No activity'
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)} hr ago`
  const days = Math.round(minutes / 1440)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function roleLabel(role) {
  return String(role || 'patient').replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function roleClasses(role) {
  const normalized = String(role || '').toLowerCase()
  if (normalized === 'admin' || normalized === 'super_admin') return 'bg-violet-50 text-violet-700 ring-violet-200'
  if (normalized === 'doctor' || normalized === 'nurse') return 'bg-sky-50 text-sky-700 ring-sky-200'
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
}

function statusClasses(active) {
  return active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'
}

function activityTone(action) {
  const value = String(action || '').toLowerCase()
  if (value.includes('status') || value.includes('suspend')) return { icon: XCircle, classes: 'bg-orange-50 text-orange-600' }
  if (value.includes('role') || value.includes('permission')) return { icon: ShieldCheck, classes: 'bg-violet-50 text-violet-600' }
  if (value.includes('create') || value.includes('reactivat')) return { icon: CheckCircle2, classes: 'bg-emerald-50 text-emerald-600' }
  return { icon: Activity, classes: 'bg-sky-50 text-sky-600' }
}

function readableAction(action) {
  return String(action || 'System activity').replace(/[._]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function Card({ children, className = '' }) {
  return <section className={`admin-dashboard-card rounded-[20px] border border-slate-200/90 bg-white shadow-[0_8px_30px_rgba(31,85,120,0.06)] ${className}`}>{children}</section>
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-[17px] font-bold tracking-[-0.02em] text-slate-950">{title}</h2>{description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}</div>
      {action}
    </div>
  )
}

function AdminPageSkeleton() {
  return <div className="space-y-5 animate-pulse">{[1, 2, 3].map((row) => <div key={row} className="h-28 rounded-[20px] bg-slate-200/70" />)}</div>
}

export function AdminPage() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const activityRef = useRef(null)
  const [stats, setStats] = useState(null)
  const [clinicalStats, setClinicalStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'patient' })

  async function loadUsers() {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (search.trim()) params.set('search', search.trim())
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const response = await api.get(`/admin/users?${params.toString()}`)
      setUsers(getApiData(response) || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load users.'))
    } finally {
      setUsersLoading(false)
    }
  }

  async function loadDashboard() {
    setLoading(true)
    setError('')
    try {
      const [statsResponse, activityResponse, rolesResponse, clinicalResponse] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/activity?days=7&limit=6'),
        api.get('/admin/roles'),
        api.get('/dashboard/clinical'),
      ])
      if (statsResponse.status === 'fulfilled') setStats(getApiData(statsResponse.value) || null)
      if (activityResponse.status === 'fulfilled') setActivity(getApiData(activityResponse.value)?.recent_events || [])
      if (rolesResponse.status === 'fulfilled') setRoles(getApiData(rolesResponse.value) || [])
      if (clinicalResponse.status === 'fulfilled') setClinicalStats(getApiData(clinicalResponse.value) || null)
      if (statsResponse.status === 'rejected') setError(getApiErrorMessage(statsResponse.reason, 'Unable to load dashboard statistics.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])
  useEffect(() => {
    const timer = window.setTimeout(loadUsers, 220)
    return () => window.clearTimeout(timer)
  }, [search, roleFilter, statusFilter])

  const userCounts = stats?.users || {}
  const activeUsers = Number(userCounts.active || 0)
  const inactiveUsers = Number(userCounts.inactive || 0)
  const byRole = userCounts.by_role || {}
  const totalUsers = Number(userCounts.total || users.length || 0)
  const doctors = Number(byRole.doctor || 0)
  const admins = Number((byRole.admin || 0) + (byRole.super_admin || 0))
  const patients = Number(stats?.patients?.total || byRole.patient || 0)
  const assessments = Number(clinicalStats?.assessments?.value ?? stats?.diagnosis?.total ?? 0)
  const treatmentPlans = Number(clinicalStats?.treatment_plans?.value ?? 0)
  const reviews = Number(stats?.diagnosis?.reviewed ?? clinicalStats?.doctor_workload?.reviewed_by_me ?? 0)
  const accountData = [{ name: 'Active', value: activeUsers, color: '#39a76a' }, { name: 'Inactive', value: inactiveUsers, color: '#e6a23c' }, { name: 'Suspended', value: 0, color: '#e06b72' }]
  const visibleUsers = useMemo(() => users.slice(0, 6), [users])
  const roleCards = useMemo(() => ['admin', 'doctor', 'patient'].map((roleName) => {
    const role = roles.find((item) => item.name === roleName)
    return { name: roleName, count: Number(role?.user_count ?? byRole[roleName] ?? 0), description: role?.description || ({ admin: 'Full system access', doctor: 'Patient and clinical access', patient: 'Personal health information only' }[roleName]) }
  }), [roles, byRole])

  async function toggleUserStatus(target) {
    setUpdatingId(target.id)
    try {
      await api.patch(`/admin/users/${target.id}/status`, { is_active: !target.is_active })
      notify.success(target.is_active ? 'Account deactivated.' : 'Account activated.')
      await Promise.all([loadDashboard(), loadUsers()])
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Unable to update account status.'))
    } finally {
      setUpdatingId(null)
    }
  }

  async function createUser(event) {
    event.preventDefault()
    setCreatingUser(true)
    try {
      await api.post('/admin/users', { name: createForm.name, email: createForm.email, password: createForm.password, roles: [createForm.role], is_active: true })
      notify.success('User account created.')
      setShowCreateUser(false)
      setCreateForm({ name: '', email: '', password: '', role: 'patient' })
      await Promise.all([loadDashboard(), loadUsers()])
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Unable to create user account.'))
    } finally {
      setCreatingUser(false)
    }
  }

  function scrollToActivity() {
    activityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (loading && !stats) return <AdminPageSkeleton />

  return (
    <div className="admin-dashboard-shell space-y-5 pb-8">
      <Card className="admin-dashboard-hero overflow-hidden bg-gradient-to-r from-white via-sky-50/80 to-cyan-50/70 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-600"><Shield className="h-4 w-4" /> System administration</div><h1 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[28px]">Good evening, Admin</h1><p className="mt-1 text-sm text-slate-600">Manage users, roles, permissions, and system access.</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2479d8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1c68bd]" onClick={() => setShowCreateUser(true)}><Plus className="h-4 w-4" /> Add User</button><button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700" onClick={() => navigate('/roles-permissions')}><KeyRound className="h-4 w-4" /> Manage Roles</button><button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700" onClick={scrollToActivity}><FileText className="h-4 w-4" /> View Audit Log</button></div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        { title: 'Total Users', value: totalUsers, detail: 'Live user directory', icon: Users, accent: 'text-sky-700 bg-sky-50 ring-sky-100', tone: 'admin-kpi-blue bg-gradient-to-br from-sky-50/70 via-white to-white' },
        { title: 'Doctors', value: doctors, detail: 'Clinical staff', icon: Stethoscope, accent: 'text-indigo-700 bg-indigo-50 ring-indigo-100', tone: 'admin-kpi-indigo bg-gradient-to-br from-indigo-50/70 via-white to-white' },
        { title: 'Patients', value: patients, detail: patients ? 'Registered patients' : 'No records yet', icon: UserRound, accent: 'text-emerald-700 bg-emerald-50 ring-emerald-100', tone: 'admin-kpi-green bg-gradient-to-br from-emerald-50/70 via-white to-white' },
        { title: 'Admins', value: admins, detail: 'System administrators', icon: ShieldCheck, accent: 'text-violet-700 bg-violet-50 ring-violet-100', tone: 'admin-kpi-violet bg-gradient-to-br from-violet-50/70 via-white to-white' },
      ].map(({ title, value, detail, icon: Icon, accent, tone }) => <Card key={title} className={`admin-dashboard-kpi p-4 ${tone}`}><div className="flex items-start justify-between gap-3"><span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${accent}`}><Icon className="h-4 w-4" /></span><span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400"><i className="admin-live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />Live data</span></div><p className="mt-4 text-2xl font-bold tracking-[-0.03em] text-slate-950">{value}</p><p className="mt-0.5 text-sm font-semibold text-slate-700">{title}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></Card>)}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 p-5 sm:p-6"><SectionHeading title="User Management" description="Manage system users and their access." action={<button type="button" className="hidden items-center gap-1 text-sm font-semibold text-sky-700 sm:inline-flex" onClick={() => navigate('/users')}>View all users <ArrowRight className="h-4 w-4" /></button>} />
          <div className="mt-5 flex flex-col gap-3 lg:flex-row"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or ID..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100" /></label><div className="flex gap-2"><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-sky-400"><option value="all">All Roles</option><option value="admin">Admin</option><option value="doctor">Doctor</option><option value="patient">Patient</option></select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-sky-400"><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
          <div className="mt-4 flex gap-1 overflow-x-auto pb-1">{ROLE_FILTERS.map((filter) => <button key={filter} type="button" onClick={() => setRoleFilter(filter)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${roleFilter === filter ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-100'}`}>{filter === 'all' ? 'All' : roleLabel(filter)}</button>)}</div>
          {error ? <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"><XCircle className="h-4 w-4" />{error}</div> : null}
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[720px] text-left"><thead className="bg-slate-50/80"><tr>{['User', 'Email', 'Role', 'Status', 'Last active', 'Action'].map((heading) => <th key={heading} className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{heading}</th>)}</tr></thead><tbody>{usersLoading ? <tr><td colSpan="6" className="px-4 py-10 text-center text-sm text-slate-500"><Loader2 className="mx-auto h-5 w-5 animate-spin text-sky-600" /></td></tr> : null}{!usersLoading && !visibleUsers.length ? <tr><td colSpan="6" className="px-4 py-10 text-center text-sm text-slate-500">No users match your filters.</td></tr> : null}{!usersLoading ? visibleUsers.map((item) => { const primaryRole = item.role || item.roles?.[0] || 'patient'; return <tr key={item.id} className="border-t border-slate-100 transition hover:bg-slate-50/60"><td className="px-3 py-3"><div className="flex items-center gap-2.5"><span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">{initials(item.name)}</span><div className="min-w-0"><p className="max-w-[150px] truncate text-sm font-semibold text-slate-900">{item.name}</p><p className="text-[11px] text-slate-400">#{item.id}</p></div></div></td><td className="max-w-[190px] truncate px-3 py-3 text-sm text-slate-600">{item.email}</td><td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${roleClasses(primaryRole)}`}>{roleLabel(primaryRole)}</span></td><td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClasses(item.is_active)}`}>{item.is_active ? 'Active' : 'Inactive'}</span></td><td className="px-3 py-3 text-xs text-slate-500">{formatRelativeTime(item.updated_at || item.created_at)}</td><td className="px-3 py-3"><button type="button" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-700" onClick={() => navigate(`/users/${item.id}/edit`)}>Manage <ChevronRight className="h-3.5 w-3.5" /></button><button type="button" disabled={updatingId === item.id} className="ml-2 text-[11px] font-medium text-slate-400 hover:text-slate-700 disabled:opacity-50" onClick={() => toggleUserStatus(item)}>{updatingId === item.id ? 'Saving…' : item.is_active ? 'Disable' : 'Enable'}</button></td></tr> }) : null}</tbody></table></div>
          <button type="button" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-700 sm:hidden" onClick={() => navigate('/users')}>View all users <ArrowRight className="h-4 w-4" /></button>
        </Card>

        <div ref={activityRef} className="space-y-5"><Card className="flex items-center justify-between gap-3 bg-gradient-to-br from-violet-50 to-sky-50 p-4"><div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm"><LockKeyhole className="h-5 w-5" /></span><div><p className="text-sm font-bold text-slate-900">Access needs attention</p><p className="mt-0.5 text-xs text-slate-600">{inactiveUsers ? `${inactiveUsers} inactive account${inactiveUsers === 1 ? '' : 's'} to review` : 'No pending account issues'}</p></div></div><ChevronRight className="h-5 w-5 text-slate-400" /></Card><Card className="p-5"><SectionHeading title="Recent Admin Activity" action={<button type="button" className="text-xs font-semibold text-sky-700" onClick={scrollToActivity}>View all →</button>} /><div className="mt-4">{activity.length ? activity.slice(0, 5).map((event, index) => { const tone = activityTone(event.action); const Icon = tone.icon; return <div key={`${event.id || event.action}-${index}`} className="flex gap-3 border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0"><span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.classes}`}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">{readableAction(event.action)}</p><p className="mt-0.5 truncate text-xs text-slate-500">{event.entity_type ? `${event.entity_type} #${event.entity_id || '—'}` : 'System activity'}</p></div><span className="shrink-0 text-[11px] text-slate-400">{formatRelativeTime(event.created_at)}</span></div> }) : <p className="py-4 text-sm text-slate-500">No recent admin activity.</p>}</div></Card></div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]"><Card className="p-5 sm:p-6"><SectionHeading title="Role & Permission Overview" description="Manage roles and access permissions." action={<button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700" onClick={() => navigate('/roles-permissions')}>View all roles <ArrowRight className="h-4 w-4" /></button>} /><div className="mt-5 grid gap-3 md:grid-cols-3">{roleCards.map((role) => { const Icon = role.name === 'doctor' ? Stethoscope : role.name === 'patient' ? UserRound : ShieldCheck; return <div key={role.name} className="admin-role-card rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white p-4"><span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${roleClasses(role.name)}`}><Icon className="h-4 w-4" /></span><p className="mt-3 text-sm font-bold text-slate-900">{roleLabel(role.name)}</p><p className="mt-1 text-2xl font-bold text-slate-900">{role.count} <span className="text-xs font-medium text-slate-500">users</span></p><p className="mt-1 min-h-8 text-xs leading-5 text-slate-500">{role.description}</p><button type="button" className="mt-3 text-xs font-bold text-sky-700" onClick={() => navigate('/roles-permissions')}>Manage →</button></div> })}</div></Card><Card className="p-5 sm:p-6"><SectionHeading title="Account Status" description="User account distribution" /><div className="mt-3 flex items-center gap-4"><div className="relative h-36 w-36 shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip formatter={(value, name) => [`${value}`, name]} /><Pie data={accountData} dataKey="value" nameKey="name" innerRadius={47} outerRadius={66} paddingAngle={2} stroke="none">{accountData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl text-slate-900">{totalUsers}</strong><span className="text-[10px] text-slate-500">Total users</span></div></div><div className="min-w-0 flex-1 space-y-2.5">{accountData.map((item) => { const percent = totalUsers ? ((item.value / totalUsers) * 100).toFixed(1) : '0.0'; return <div key={item.name} className="flex items-center justify-between gap-2 text-xs"><span className="flex items-center gap-2 text-slate-600"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><span className="font-semibold text-slate-800">{item.value} <span className="font-normal text-slate-400">{percent}%</span></span></div> })}</div></div><button type="button" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-700" onClick={() => navigate('/users')}>Manage accounts <ArrowRight className="h-4 w-4" /></button></Card></div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]"><Card className="p-5 sm:p-6"><SectionHeading title="System Overview" description="Key system statistics" /><div className="mt-4 grid gap-1 sm:grid-cols-2">{[[Users, 'Users', totalUsers, 'text-sky-600'], [ClipboardCheck, 'Assessments', assessments, 'text-indigo-600'], [FileText, 'Treatment plans', treatmentPlans, 'text-emerald-600'], [ShieldCheck, 'Patient reviews', reviews, 'text-violet-600'], [CheckCircle2, 'Active accounts', `${totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0}%`, 'text-teal-600']].map(([Icon, label, value, color]) => <div key={label} className="flex items-center justify-between border-b border-slate-100 px-2 py-3 last:border-0"><span className="flex items-center gap-2.5 text-sm text-slate-600"><Icon className={`h-4 w-4 ${color}`} />{label}</span><strong className="text-sm text-slate-900">{value}</strong></div>)}</div></Card><Card className="p-5 sm:p-6"><SectionHeading title="Permission coverage" description="Current shared access model" /><div className="mt-4 space-y-3">{['User management', 'Role management', 'Clinical access', 'Audit visibility'].map((label, index) => <div key={label}><div className="mb-1.5 flex justify-between text-xs"><span className="font-medium text-slate-600">{label}</span><span className="font-semibold text-slate-800">{index < 2 ? (currentUser?.permissions?.includes(index === 0 ? 'user.manage' : 'permission.manage') ? 'Enabled' : 'View only') : 'Shared'}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${index < 2 ? 'bg-sky-500' : 'bg-emerald-500'}`} style={{ width: index < 2 && !currentUser?.permissions?.includes(index === 0 ? 'user.manage' : 'permission.manage') ? '55%' : '100%' }} /></div></div>)}</div><button type="button" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-700" onClick={() => navigate('/roles-permissions')}>Review permissions <ArrowRight className="h-4 w-4" /></button></Card></div>
      {showCreateUser ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"><form onSubmit={createUser} className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">User management</p><h2 className="mt-1 text-xl font-bold text-slate-950">Add a new user</h2><p className="mt-1 text-sm text-slate-500">Create an account in the shared system directory.</p></div><button type="button" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" onClick={() => setShowCreateUser(false)}><XCircle className="h-5 w-5" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Full name</span><input required value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Email</span><input required type="email" value={createForm.email} onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" /></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Temporary password</span><input required minLength="6" type="password" value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" /></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Role</span><select value={createForm.role} onChange={(event) => setCreateForm({ ...createForm, role: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400"><option value="patient">Patient</option><option value="doctor">Doctor</option><option value="admin">Admin</option></select></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600" onClick={() => setShowCreateUser(false)}>Cancel</button><button type="submit" disabled={creatingUser} className="inline-flex items-center gap-2 rounded-xl bg-[#2479d8] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{creatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create user</button></div></form></div> : null}
    </div>
  )
}
