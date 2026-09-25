import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  KeyRound,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import api, { getApiData, getApiErrorMessage, getApiPaginated } from '@/api/client'
import { formatDateTime, formatRelativeTime } from '@/lib/datetime'
import { notify } from '@/lib/toast'
import { cn } from '@/lib/utils'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  EmptyState,
  Skeleton,
  StatusBadge,
  UserAvatar,
} from '@/components/ui'

const ROLE_FILTERS = ['all', 'admin', 'doctor', 'patient']

function formatRoleName(roleName, t = null) {
  if (!roleName) return 'Patient'
  const norm = String(roleName).toLowerCase()
  if (t) {
    const key = `roles.${norm}`
    const translated = t(key, null)
    if (translated) return translated
  }
  return String(roleName)
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getRoleBadgeTone(roleName) {
  const norm = String(roleName || '').toLowerCase()
  if (norm === 'admin' || norm === 'super_admin') return 'violet'
  if (norm === 'doctor') return 'info'
  if (norm === 'patient') return 'success'
  return 'primary'
}

function activityTone(action) {
  const value = String(action || '').toLowerCase()
  if (value.includes('status') || value.includes('suspend') || value.includes('delete')) {
    return { icon: XCircle, classes: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' }
  }
  if (value.includes('role') || value.includes('permission')) {
    return { icon: ShieldCheck, classes: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' }
  }
  if (value.includes('create') || value.includes('reactivat') || value.includes('register')) {
    return { icon: CheckCircle2, classes: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' }
  }
  return { icon: Activity, classes: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' }
}

function readableAction(action) {
  return String(action || 'System activity')
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function AdminPageSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-32 rounded-3xl bg-slate-200/70 dark:bg-slate-800/60" />
      {/* KPI skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50" />
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-72 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50" />
        <div className="h-72 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50" />
        <div className="h-72 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50" />
      </div>
      {/* Table skeleton */}
      <div className="h-96 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50" />
    </div>
  )
}

export function AdminPage() {
  const { user: currentUser } = useAuth()
  const { t, isKhmer, language } = useLanguage()
  const navigate = useNavigate()
  const activityRef = useRef(null)

  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [activitySummary, setActivitySummary] = useState(null)
  const [roles, setRoles] = useState([])
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'patient' })

  // 1. Fetch Users (Paginated & Filtered)
  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(pageSize))
      if (search.trim()) params.set('search', search.trim())
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const response = await api.get(`/admin/users?${params.toString()}`)
      const paginated = getApiPaginated(response)
      setUsers(paginated.data || [])
      setTotalCount(paginated.total || 0)
      setTotalPages(paginated.totalPages || 1)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load users.'))
    } finally {
      setUsersLoading(false)
    }
  }

  // 2. Fetch Dashboard Statistics, Activity & Roles
  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const [statsResponse, activityResponse, rolesResponse] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/activity?days=7&limit=25'),
        api.get('/admin/roles'),
      ])
      if (statsResponse.status === 'fulfilled') setStats(getApiData(statsResponse.value) || null)
      if (activityResponse.status === 'fulfilled') {
        const activityPayload = getApiData(activityResponse.value) || {}
        setActivity(activityPayload.recent_events || [])
        setActivitySummary(activityPayload.summary || null)
      }
      if (rolesResponse.status === 'fulfilled') setRoles(getApiData(rolesResponse.value) || [])
      if (statsResponse.status === 'rejected') setError(getApiErrorMessage(statsResponse.reason, 'Unable to load dashboard statistics.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(loadUsers, 220)
    return () => window.clearTimeout(timer)
  }, [search, roleFilter, statusFilter, page])

  // Reset page to 1 when filters change
  const handleRoleFilterChange = (val) => {
    setRoleFilter(val)
    setPage(1)
  }

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val)
    setPage(1)
  }

  const handleSearchChange = (val) => {
    setSearch(val)
    setPage(1)
  }

  // Calculated KPI numbers
  const userCounts = stats?.users || {}
  const activeUsers = Number(userCounts.active || 0)
  const inactiveUsers = Number(userCounts.inactive || 0)
  const byRole = userCounts.by_role || {}
  const totalUsers = Number(userCounts.total || totalCount || users.length || 0)
  const doctors = Number(byRole.doctor || 0)
  const admins = Number(byRole.admin || 0)
  const patients = Number(stats?.patients?.total || byRole.patient || 0)
  const assessments = Number(stats?.assessments?.total ?? stats?.diagnosis?.total ?? 0)
  const treatmentPlans = Number(stats?.treatment_plans?.total ?? stats?.diagnosis?.treatment_plans ?? 0)
  const reviews = Number(stats?.diagnosis?.reviewed ?? 0)
  const rulesCount = Number(stats?.rules?.total ?? 0)
  const events24h = Number(stats?.audit?.events_24h ?? activity.length ?? 0)

  // Chart Data: Platform Operations (Horizontal Bar Chart)
  const operationsChartData = useMemo(() => [
    {
      name: isKhmer ? 'ការវាយតម្លៃ' : 'Assessments',
      fullName: isKhmer ? 'ការវាយតម្លៃសរុប' : 'Total Clinical Assessments',
      value: assessments,
      color: '#3b82f6',
      unit: isKhmer ? 'ករណី' : 'cases',
    },
    {
      name: isKhmer ? 'ផែនការ' : 'Care Plans',
      fullName: isKhmer ? 'ផែនការព្យាបាល' : 'Treatment & Care Plans',
      value: treatmentPlans,
      color: '#10b981',
      unit: isKhmer ? 'ផែនការ' : 'plans',
    },
    {
      name: isKhmer ? 'ក្បួនគ្លីនិក' : 'Active Rules',
      fullName: isKhmer ? 'ក្បួនវេជ្ជសាស្ត្រសកម្ម' : 'Active Expert Rules',
      value: rulesCount || 20,
      color: '#f59e0b',
      unit: isKhmer ? 'ក្បួន' : 'rules',
    },
    {
      name: isKhmer ? 'ការពិនិត្យ' : 'Reviews',
      fullName: isKhmer ? 'ការពិនិត្យដោយវេជ្ជបណ្ឌិត' : 'Completed Doctor Reviews',
      value: reviews,
      color: '#8b5cf6',
      unit: isKhmer ? 'ពិនិត្យ' : 'reviews',
    },
  ], [assessments, treatmentPlans, rulesCount, reviews, isKhmer])

  // Chart Data: 7-Day Activity & Audit Trend
  const activityTrendData = useMemo(() => {
    const rawTrend = activitySummary?.daily_trend
    const khmerDays = {
      Mon: 'ច័ន្ទ',
      Tue: 'អង្គារ',
      Wed: 'ពុធ',
      Thu: 'ព្រហ',
      Fri: 'សុក្រ',
      Sat: 'សៅរ៍',
      Sun: 'អាទិត្យ',
    }

    if (Array.isArray(rawTrend) && rawTrend.length > 0) {
      return rawTrend.map((item) => ({
        ...item,
        displayDay: isKhmer ? (khmerDays[item.day] || item.day) : item.day,
      }))
    }

    // Fallback: build 7-day timeline from events or current dates
    const days = []
    const enDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const kmDays = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហ', 'សុក្រ', 'សៅរ៍']
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayIdx = d.getDay()
      const matchingEvents = activity.filter((ev) => {
        const evDate = (ev.created_at || '').split('T')[0]
        return evDate === dateStr
      }).length

      days.push({
        date: dateStr,
        day: enDays[dayIdx],
        displayDay: isKhmer ? kmDays[dayIdx] : enDays[dayIdx],
        events: matchingEvents,
      })
    }
    return days
  }, [activitySummary, activity, isKhmer])

  const totalWeekEvents = useMemo(() => {
    if (activitySummary?.events_total != null) return Number(activitySummary.events_total)
    return activityTrendData.reduce((acc, curr) => acc + (curr.events || 0), 0)
  }, [activitySummary, activityTrendData])

  // Chart Data: Roles Distribution Bar Chart
  const roleChartData = useMemo(() => {
    const roleColors = {
      admin: '#8b5cf6',
      doctor: '#3b82f6',
      patient: '#10b981',
    }
    const roleList = roles.length
      ? roles
      : [
          { name: 'admin', user_count: admins },
          { name: 'doctor', user_count: doctors },
          { name: 'patient', user_count: patients },
        ]

    return roleList.map((r) => {
      const normRole = String(r.name || '').toLowerCase()
      const count = Number(r.user_count ?? byRole[normRole] ?? byRole[r.name] ?? 0)
      const roleColor = roleColors[normRole] || '#06b6d4'
      return {
        name: formatRoleName(r.name, t),
        roleKey: normRole,
        users: count,
        color: roleColor,
        fill: roleColor,
      }
    })
  }, [roles, admins, doctors, patients, byRole, t])

  // Toggle user status
  async function toggleUserStatus(target) {
    setUpdatingId(target.id)
    try {
      await api.patch(`/admin/users/${target.id}/status`, { is_active: !target.is_active })
      notify.success(target.is_active ? (isKhmer ? 'បានផ្អាកគណនី' : 'Account deactivated.') : (isKhmer ? 'បានបើកដំណើរការគណនី' : 'Account activated.'))
      await Promise.all([loadDashboard(), loadUsers()])
    } catch (err) {
      notify.error(getApiErrorMessage(err, isKhmer ? 'មិនអាចធ្វើបច្ចុប្បន្នភាពគណនីបានទេ' : 'Unable to update account status.'))
    } finally {
      setUpdatingId(null)
    }
  }

  // Create new user
  async function createUser(event) {
    event.preventDefault()
    setCreatingUser(true)
    try {
      await api.post('/admin/users', {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        roles: [createForm.role],
        is_active: true,
      })
      notify.success(isKhmer ? 'បានបង្កើតគណនីអ្នកប្រើប្រាស់ជោគជ័យ' : 'User account created.')
      setShowCreateUser(false)
      setCreateForm({ name: '', email: '', password: '', role: 'patient' })
      await Promise.all([loadDashboard(), loadUsers()])
    } catch (err) {
      notify.error(getApiErrorMessage(err, isKhmer ? 'មិនអាចបង្កើតអ្នកប្រើប្រាស់បានទេ' : 'Unable to create user account.'))
    } finally {
      setCreatingUser(false)
    }
  }

  function scrollToActivity() {
    activityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (loading && !stats) return <AdminPageSkeleton />

  return (
    <div className="admin-dashboard-shell space-y-6 pb-12">
      {/* ==================================================================== */}
      {/* 1. HERO HEADER BANNER                                                */}
      {/* ==================================================================== */}
      <section className="admin-dashboard-hero overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-r from-white via-sky-50/80 to-cyan-50/70 p-5 sm:p-7 shadow-[0_8px_30px_rgba(31,85,120,0.06)] dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
              <Shield className="h-4 w-4" />
              <span>{isKhmer ? 'ផ្ទាំងគ្រប់គ្រងរដ្ឋបាលប្រព័ន្ធ' : 'System Administration'}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {isKhmer ? 'ផ្ទាំងគ្រប់គ្រងអ្នកគ្រប់គ្រង' : 'Admin Control Center'}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {isKhmer
                ? 'តាមដានគណនីអ្នកប្រើប្រាស់ តួនាទី ការអនុញ្ញាត និងស្ថិតិនៃប្រតិបត្តិការប្រព័ន្ធ'
                : 'Monitor user accounts, roles, access permissions, and real-time operational statistics.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-[0.98] cursor-pointer"
              onClick={() => setShowCreateUser(true)}
            >
              <Plus className="h-4 w-4" />
              <span>{isKhmer ? 'បន្ថែមអ្នកប្រើ' : 'Add User'}</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 cursor-pointer"
              onClick={() => navigate('/roles-permissions')}
            >
              <KeyRound className="h-4 w-4 text-violet-500" />
              <span>{isKhmer ? 'គ្រប់គ្រងតួនាទី' : 'Manage Roles'}</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 cursor-pointer"
              onClick={scrollToActivity}
            >
              <FileText className="h-4 w-4 text-emerald-500" />
              <span>{isKhmer ? 'កំណត់ហេតុសវនកម្ម' : 'Audit Logs'}</span>
            </button>
            <button
              type="button"
              title={isKhmer ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh Dashboard'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white cursor-pointer"
              onClick={() => {
                loadDashboard()
                loadUsers()
              }}
            >
              <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. KPI METRICS CARDS ROW (4 CARDS)                                   */}
      {/* ==================================================================== */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: isKhmer ? 'អ្នកប្រើប្រាស់សរុប' : 'Total Users',
            value: totalUsers,
            detail: isKhmer ? 'គណនីក្នុងប្រព័ន្ធទាំងអស់' : 'Active directory accounts',
            icon: Users,
            accent: 'text-sky-700 bg-sky-50 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-800',
            tone: 'admin-kpi-blue bg-gradient-to-br from-sky-50/70 via-white to-white dark:from-sky-950/20 dark:via-slate-900 dark:to-slate-900',
          },
          {
            title: isKhmer ? 'វេជ្ជបណ្ឌិត និងគិលានុបដ្ឋាក' : 'Doctors & Clinicians',
            value: doctors,
            detail: isKhmer ? 'បុគ្គលិកគ្លីនិកមានសិទ្ធិ' : 'Clinical staff members',
            icon: Stethoscope,
            accent: 'text-indigo-700 bg-indigo-50 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-800',
            tone: 'admin-kpi-indigo bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900',
          },
          {
            title: isKhmer ? 'អ្នកជំងឺបានចុះឈ្មោះ' : 'Registered Patients',
            value: patients,
            detail: patients ? (isKhmer ? 'ទម្រង់អ្នកជំងឺសកម្ម' : 'Active patient records') : (isKhmer ? 'មិនទាន់មានទិន្នន័យ' : 'No records yet'),
            icon: UserRound,
            accent: 'text-emerald-700 bg-emerald-50 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800',
            tone: 'admin-kpi-green bg-gradient-to-br from-emerald-50/70 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900',
          },
          {
            title: isKhmer ? 'អ្នកគ្រប់គ្រងប្រព័ន្ធ' : 'System Admins',
            value: admins,
            detail: isKhmer ? 'សិទ្ធិគ្រប់គ្រងពេញលេញ' : 'Full access privileges',
            icon: ShieldCheck,
            accent: 'text-violet-700 bg-violet-50 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:ring-violet-800',
            tone: 'admin-kpi-violet bg-gradient-to-br from-violet-50/70 via-white to-white dark:from-violet-950/20 dark:via-slate-900 dark:to-slate-900',
          },
        ].map(({ title, value, detail, icon: Icon, accent, tone }) => (
          <section
            key={title}
            className={`admin-dashboard-kpi rounded-2xl border border-slate-200/80 p-4 shadow-xs dark:border-slate-800 ${tone}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${accent}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                <i className="admin-live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {isKhmer ? 'ទិន្នន័យជាក់ស្តែង' : 'Live data'}
              </span>
            </div>
            <p className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
              {value}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
          </section>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* 3. STATISTIC GRAPHS & CHARTS SECTION (PLACED ABOVE TABLE!)            */}
      {/* ==================================================================== */}
      <div className="grid gap-5 lg:grid-cols-3 items-stretch">
        {/* Chart 1: Role Distribution (Bar Chart) */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span>{isKhmer ? 'ការបែងចែកតួនាទី' : 'Role Distribution'}</span>
              </h2>
              <Link
                to="/roles-permissions"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center gap-1"
              >
                <span>{isKhmer ? 'តួនាទី' : 'Roles'}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Bar Chart */}
            <div className="mt-2.5 h-36 w-full">
              <ChartContainer config={{ users: { label: isKhmer ? 'អ្នកប្រើប្រាស់' : 'Users' } }} className="h-full w-full">
                <BarChart data={roleChartData} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-slate-600 dark:text-slate-400"
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-600 dark:text-slate-400"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val, name, item) => [
                          `${val} ${isKhmer ? 'នាក់' : 'users'}`,
                          item?.payload?.name,
                        ]}
                      />
                    }
                  />
                  <Bar dataKey="users" radius={[6, 6, 0, 0]} barSize={32}>
                    {roleChartData.map((entry, index) => (
                      <Cell key={`role-cell-${index}`} fill={entry.color || entry.fill} />
                    ))}
                    <LabelList
                      dataKey="users"
                      position="top"
                      offset={6}
                      fontSize={11}
                      fontWeight={700}
                      className="fill-slate-700 dark:fill-slate-300"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              {isKhmer ? 'អ្នកគ្រប់គ្រង' : 'Admin'}
              <span className="h-2 w-2 rounded-full bg-blue-500 ml-1" />
              {isKhmer ? 'វេជ្ជបណ្ឌិត' : 'Doctor'}
              <span className="h-2 w-2 rounded-full bg-emerald-500 ml-1" />
              {isKhmer ? 'អ្នកជំងឺ' : 'Patient'}
            </span>
            <Link to="/roles-permissions" className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
              {isKhmer ? 'មើលលម្អិត' : 'Details'} &rarr;
            </Link>
          </div>
        </section>

        {/* Chart 2: 7-Day Activity & Audit Trend */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isKhmer ? 'និន្នាការសកម្មភាព ៧ ថ្ងៃ' : '7-Day Activity Trend'}</span>
              </h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 tabular-nums">
                {totalWeekEvents} {isKhmer ? 'សកម្មភាព' : 'events'}
              </span>
            </div>

            {/* Area Chart */}
            <div className="mt-2.5 h-36 w-full">
              <ChartContainer
                config={{
                  events: {
                    label: isKhmer ? 'ព្រឹត្តិការណ៍សវនកម្ម' : 'Audit Events',
                    color: '#10b981',
                  },
                }}
                className="h-full w-full"
              >
                <AreaChart
                  data={activityTrendData}
                  margin={{ top: 8, right: 12, left: -24, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="adminActivityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="displayDay"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-slate-600 dark:text-slate-400"
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-600 dark:text-slate-400"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val, name, item) => [
                          `${val} ${isKhmer ? 'ព្រឹត្តិការណ៍' : 'events'}`,
                          item?.payload?.date || (isKhmer ? 'សកម្មភាព' : 'Events'),
                        ]}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#adminActivityGradient)"
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>

          {/* Quick Activity Footnote & Link */}
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span>
                {activitySummary?.active_actor_count != null
                  ? `${activitySummary.active_actor_count} ${isKhmer ? 'ប្រតិបត្តិករសកម្មក្នុងសប្តាហ៍' : 'active operators this week'}`
                  : (isKhmer ? 'ស្ថិតិប្រតិបត្តិការផ្ទាល់' : 'Real-time telemetry')}
              </span>
            </span>
            <button
              type="button"
              onClick={scrollToActivity}
              className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:underline dark:text-emerald-400 cursor-pointer"
            >
              <span>{isKhmer ? 'មើលកំណត់ហេតុ' : 'Audit Stream'}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </section>

        {/* Chart 3: Platform Operations & System Throughput (Horizontal Bar Chart) */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span>{isKhmer ? 'ប្រតិបត្តិការប្រព័ន្ធ' : 'Platform Operations'}</span>
              </h2>
              <span className="badge border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300 text-[11px]">
                {isKhmer ? 'សរុបទាំងអស់' : 'All time'}
              </span>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="mt-2.5 h-36 w-full">
              <ChartContainer
                config={{
                  value: {
                    label: isKhmer ? 'ចំនួនប្រតិបត្តិការ' : 'Operations',
                    color: '#3b82f6',
                  },
                }}
                className="h-full w-full"
              >
                <BarChart
                  layout="vertical"
                  data={operationsChartData}
                  margin={{ top: 4, right: 34, left: 6, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-slate-500 dark:text-slate-400"
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={isKhmer ? 88 : 86}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-slate-700 dark:text-slate-300 font-medium"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val, name, item) => [
                          `${val} ${item?.payload?.unit || ''}`,
                          item?.payload?.fullName || name,
                        ]}
                      />
                    }
                  />
                  <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={15}>
                    {operationsChartData.map((entry, index) => (
                      <Cell key={`op-cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="right"
                      offset={8}
                      fontSize={11}
                      fontWeight={700}
                      className="fill-slate-800 dark:fill-slate-200"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          {/* Footer Action */}
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-500" />
              <span>
                {isKhmer ? 'សវនកម្ម (24h)' : 'Security (24h)'}: <strong className="text-slate-900 dark:text-white tabular-nums">{events24h}</strong> {isKhmer ? 'ព្រឹត្តិការណ៍' : 'events'}
              </span>
            </span>
            <Link
              to="/review"
              className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline cursor-pointer"
            >
              <span>{isKhmer ? 'បើកជួរពិនិត្យ' : 'Clinical Queue'}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>
      </div>

      {/* ==================================================================== */}
      {/* 4. MAIN USER MANAGEMENT TABLE SECTION (MATCHING OTHER SCREENS)       */}
      {/* ==================================================================== */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800/80 dark:bg-slate-900">
        {/* Table Title Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                {isKhmer ? 'បញ្ជីអ្នកប្រើប្រាស់ប្រព័ន្ធ' : 'User Directory'}
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {totalCount} {isKhmer ? 'នាក់' : 'users'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isKhmer
                ? 'ស្វែងរក គ្រប់គ្រងគណនី កំណត់តួនាទី និងបិទ/បើកដំណើរការអ្នកប្រើប្រាស់'
                : 'Search, manage accounts, assign roles, and toggle user authorization states.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateUser(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{isKhmer ? 'បន្ថែមអ្នកប្រើ' : 'Add User'}</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Filters (Matching PatientsPage style) */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={isKhmer ? 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬលេខសម្គាល់...' : 'Search by name, email, or ID...'}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-slate-50/70 pl-10 pr-9 text-xs sm:text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Role Filter Select */}
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
                className="h-10 rounded-xl border border-slate-200/90 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">{isKhmer ? 'គ្រប់តួនាទី' : 'All Roles'}</option>
                <option value="admin">{isKhmer ? 'អ្នកគ្រប់គ្រង (Admin)' : 'Admin'}</option>
                <option value="doctor">{isKhmer ? 'វេជ្ជបណ្ឌិត (Doctor)' : 'Doctor'}</option>
                <option value="patient">{isKhmer ? 'អ្នកជំងឺ (Patient)' : 'Patient'}</option>
              </select>

              {/* Status Filter Select */}
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="h-10 rounded-xl border border-slate-200/90 bg-white px-3 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">{isKhmer ? 'គ្រប់ស្ថានភាព' : 'All Status'}</option>
                <option value="active">{isKhmer ? 'សកម្ម (Active)' : 'Active'}</option>
                <option value="inactive">{isKhmer ? 'អសកម្ម (Inactive)' : 'Inactive'}</option>
              </select>
            </div>
          </div>

          {/* Quick Segmented Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ROLE_FILTERS.map((filter) => {
              const isActive = roleFilter === filter
              const count =
                filter === 'all'
                  ? totalUsers
                  : filter === 'admin'
                  ? admins
                  : filter === 'doctor'
                  ? doctors
                  : patients
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => handleRoleFilterChange(filter)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-blue-100 text-blue-800 shadow-2xs dark:bg-blue-950/80 dark:text-blue-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{filter === 'all' ? (isKhmer ? 'ទាំងអស់' : 'All') : formatRoleName(filter, t)}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive
                        ? 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ================================================================== */}
        {/* DESKTOP TABLE VIEW (MATCHING PATIENTS PAGE & REVIEW PAGE)          */}
        {/* ================================================================== */}
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800/80 dark:bg-slate-800/30 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">{isKhmer ? 'អ្នកប្រើប្រាស់' : 'User'}</th>
                <th className="px-4 py-3 whitespace-nowrap">{isKhmer ? 'អ៊ីមែល' : 'Email'}</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">{isKhmer ? 'តួនាទី' : 'Role'}</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="px-4 py-3 whitespace-nowrap">{isKhmer ? 'សកម្មភាពចុងក្រោយ' : 'Last Active'}</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {/* Skeleton Rows */}
              {usersLoading && (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-24" />
                            <Skeleton className="h-2.5 w-14" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Skeleton className="h-3 w-36" />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                      </td>
                      <td className="px-4 py-3.5">
                        <Skeleton className="h-3 w-20" />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Skeleton className="h-8 w-24 ml-auto rounded-lg" />
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* Empty State */}
              {!usersLoading && !users.length && (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <EmptyState
                      title={isKhmer ? 'រកមិនឃើញអ្នកប្រើប្រាស់ទេ' : 'No users match your filters'}
                      description={isKhmer ? 'សូមសាកល្បងកែប្រែពាក្យស្វែងរក ឬតម្រង' : 'Try adjusting your search criteria or resetting filters.'}
                    />
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!usersLoading &&
                users.map((item) => {
                  const primaryRole = item.role || item.roles?.[0] || 'patient'
                  const roleTone = getRoleBadgeTone(primaryRole)
                  const activityDate = item.updated_at || item.created_at

                  return (
                    <tr
                      key={item.id}
                      className="group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                      onClick={() => navigate(`/users/${item.id}/edit`)}
                    >
                      {/* User (Avatar + Name + UID) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={item.name} src={item.avatar_url} size="md" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-primary-600 dark:text-slate-100 dark:group-hover:text-primary-400 transition-colors">
                              {item.name}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                              UID-#{String(item.id).padStart(4, '0')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                          {item.email}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge tone={roleTone} size="sm">
                          {formatRoleName(primaryRole, t)}
                        </StatusBadge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge tone={item.is_active ? 'success' : 'neutral'} size="sm">
                          <span
                            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                              item.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {item.is_active ? (isKhmer ? 'សកម្ម' : 'Active') : (isKhmer ? 'អសកម្ម' : 'Inactive')}
                        </StatusBadge>
                      </td>

                      {/* Last Active */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div title={formatDateTime(activityDate, '—', language)}>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {formatRelativeTime(activityDate, language, t)}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            {formatDateTime(activityDate, '—', language).split(',')[0]}
                          </p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/users/${item.id}/edit`)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 cursor-pointer transition"
                          >
                            <span>{isKhmer ? 'កែប្រែ' : 'Manage'}</span>
                            <ChevronRight className="h-3 w-3 text-slate-400" />
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === item.id}
                            onClick={() => toggleUserStatus(item)}
                            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
                              item.is_active
                                ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                          >
                            {updatingId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : item.is_active ? (
                              isKhmer ? 'បិទ' : 'Disable'
                            ) : (
                              isKhmer ? 'បើក' : 'Enable'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View (Visible only on small devices) */}
        <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800/60 mt-3 border-t border-slate-100 dark:border-slate-800">
          {!usersLoading &&
            users.map((item) => {
              const primaryRole = item.role || item.roles?.[0] || 'patient'
              const roleTone = getRoleBadgeTone(primaryRole)

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/users/${item.id}/edit`)}
                  className="py-3.5 space-y-2 cursor-pointer transition hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar name={item.name} src={item.avatar_url} size="md" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-sm text-slate-900 dark:text-white">
                          {item.name}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">
                          UID-#{String(item.id).padStart(4, '0')} &bull; {item.email}
                        </p>
                      </div>
                    </div>
                    <StatusBadge tone={roleTone} size="sm">
                      {formatRoleName(primaryRole, t)}
                    </StatusBadge>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <StatusBadge tone={item.is_active ? 'success' : 'neutral'} size="sm">
                      <span
                        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                          item.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {item.is_active ? (isKhmer ? 'សកម្ម' : 'Active') : (isKhmer ? 'អសកម្ម' : 'Inactive')}
                    </StatusBadge>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/users/${item.id}/edit`)
                      }}
                      className="font-semibold text-primary-600 dark:text-primary-400 inline-flex items-center gap-1"
                    >
                      <span>{isKhmer ? 'គ្រប់គ្រង' : 'Manage'}</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isKhmer
              ? `បង្ហាញ ${Math.min((page - 1) * pageSize + 1, totalCount)} ដល់ ${Math.min(
                  page * pageSize,
                  totalCount
                )} នៃ ${totalCount} អ្នកប្រើប្រាស់`
              : `Showing ${totalCount === 0 ? 0 : (page - 1) * pageSize + 1} to ${Math.min(
                  page * pageSize,
                  totalCount
                )} of ${totalCount} users`}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>{isKhmer ? 'មុន' : 'Prev'}</span>
            </button>

            <span className="px-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              {page} / {totalPages || 1}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            >
              <span>{isKhmer ? 'បន្ទាប់' : 'Next'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. AUDIT LOG & RECENT SYSTEM ACTIVITY (BELOW TABLE)                 */}
      {/* ==================================================================== */}
      <div ref={activityRef} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        {/* Recent Admin Activity Timeline */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800/80 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isKhmer ? 'សកម្មភាពសវនកម្មថ្មីៗ' : 'Recent Admin Activity'}</span>
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {isKhmer ? 'កំណត់ហេតុសកម្មភាព និងការផ្លាស់ប្តូរសុវត្ថិភាពចុងក្រោយ' : 'Audit logs of user and access changes'}
              </p>
            </div>
            <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px]">
              {activity.length} {isKhmer ? 'ព្រឹត្តិការណ៍' : 'events'}
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/60">
            {activity.length ? (
              activity.slice(0, 6).map((event, index) => {
                const tone = activityTone(event.action)
                const Icon = tone.icon
                return (
                  <div key={`${event.id || event.action}-${index}`} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone.classes}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {readableAction(event.action)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {event.entity_type ? `${event.entity_type} #${event.entity_id || '—'}` : 'System event'}
                        {event.actor_user_id ? ` • by user #${event.actor_user_id}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                      {formatRelativeTime(event.created_at, language, t)}
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {isKhmer ? 'មិនមានសកម្មភាពថ្មីៗទេ' : 'No recent administrative activity.'}
              </p>
            )}
          </div>
        </section>

        {/* Built-in Roles Quick Overview & Security */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span>{isKhmer ? 'សេចក្តីសង្ខេបតួនាទី' : 'Role Specifications'}</span>
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {isKhmer ? 'កម្រិតសិទ្ធិចម្បងទាំង ៣' : 'Primary access tiers and definitions'}
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                { name: 'admin', count: admins, tone: 'violet', label: 'Admin', desc: isKhmer ? 'សិទ្ធិប្រព័ន្ធ និងគ្រប់គ្រងអ្នកប្រើ' : 'Full system & user access' },
                { name: 'doctor', count: doctors, tone: 'info', label: 'Doctor', desc: isKhmer ? 'ពិនិត្យ និងវាយតម្លៃអ្នកជំងឺ' : 'Clinical reviews & care plans' },
                { name: 'patient', count: patients, tone: 'success', label: 'Patient', desc: isKhmer ? 'ទិន្នន័យសុខភាពផ្ទាល់ខ្លួន' : 'Self-assessment & care plan' },
              ].map((role) => (
                <div
                  key={role.name}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <StatusBadge tone={role.tone} size="sm">
                      {role.label}
                    </StatusBadge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{role.desc}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                    {role.count} {isKhmer ? 'នាក់' : 'users'}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate('/roles-permissions')}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 cursor-pointer"
            >
              <span>{isKhmer ? 'គ្រប់គ្រងម៉ាទ្រីសសិទ្ធិ' : 'Configure Role Matrix'}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </section>
      </div>

      {/* ==================================================================== */}
      {/* 6. CREATE USER MODAL DIALOG                                          */}
      {/* ==================================================================== */}
      {showCreateUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={createUser}
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
                  {isKhmer ? 'គ្រប់គ្រងអ្នកប្រើប្រាស់' : 'User Registration'}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                  {isKhmer ? 'បង្កើតគណនីអ្នកប្រើថ្មី' : 'Add New System User'}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {isKhmer ? 'បញ្ចូលព័ត៌មានលម្អិតដើម្បីបង្កើតគណនីក្នុងប្រព័ន្ធ' : 'Create an account in the shared system directory.'}
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                onClick={() => setShowCreateUser(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'} *
                </span>
                <input
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Sokha Chan or Dr. Sarah Connor"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isKhmer ? 'អាសយដ្ឋានអ៊ីមែល' : 'Email Address'} *
                </span>
                <input
                  required
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isKhmer ? 'ពាក្យសម្ងាត់បណ្តោះអាសន្ន' : 'Temporary Password'} *
                </span>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="At least 6 chars"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isKhmer ? 'តួនាទីដំបូង' : 'Assigned Role'} *
                </span>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="patient">{isKhmer ? 'អ្នកជំងឺ (Patient)' : 'Patient'}</option>
                  <option value="doctor">{isKhmer ? 'វេជ្ជបណ្ឌិត (Doctor)' : 'Doctor'}</option>
                  <option value="admin">{isKhmer ? 'អ្នកគ្រប់គ្រង (Admin)' : 'Admin'}</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                onClick={() => setShowCreateUser(false)}
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={creatingUser}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-60 cursor-pointer"
              >
                {creatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span>{isKhmer ? 'បង្កើតគណនី' : 'Create User'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
