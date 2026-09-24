import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CheckCheck,
  ClipboardList,
  Copy,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  History,
  Info,
  KeyRound,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { AdminHeroCard } from '@/components/admin'
import {
  Checkbox,
  EmptyState,
  ErrorAlert,
  SectionCard,
  Skeleton,
  PageHeaderSkeleton,
  TwoColumnPageSkeleton,
  UserAvatar,
} from '@/components/ui'
import { notify } from '@/lib/toast'
import { useLanguage } from '@/contexts/LanguageContext'

const BUILT_IN_ROLE_NAMES = new Set(['patient', 'doctor', 'admin'])
const ROLE_SORT_ORDER = new Map([
  ['admin', 0],
  ['doctor', 1],
  ['patient', 2],
])

function getRoleIcon(roleName) {
  switch (roleName) {
    case 'admin':
      return ShieldAlert
    case 'doctor':
      return Stethoscope
    case 'patient':
      return User
    default:
      return KeyRound
  }
}

function getRoleColorClasses(roleName) {
  switch (roleName) {
    case 'admin':
      return {
        iconBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400',
        badge: 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900/60',
        activeIndicator: 'bg-indigo-500',
      }
    case 'doctor':
      return {
        iconBg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400',
        badge: 'bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-900/60',
        activeIndicator: 'bg-cyan-500',
      }
    case 'patient':
      return {
        iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
        badge: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/60',
        activeIndicator: 'bg-blue-500',
      }
    default:
      return {
        iconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400',
        badge: 'bg-purple-50 text-purple-800 ring-1 ring-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-900/60',
        activeIndicator: 'bg-purple-500',
      }
  }
}

function getGroupIcon(group) {
  switch (group) {
    case 'user':
      return Users
    case 'permission':
      return ShieldCheck
    case 'patient':
      return FileText
    case 'symptom':
      return Activity
    case 'lab':
      return FlaskConical
    case 'rule':
      return BookOpen
    case 'diagnosis':
      return Stethoscope
    case 'assistant':
      return Bot
    case 'treatment_plan':
      return ClipboardList
    case 'care_plan':
      return HeartPulse
    case 'guide':
      return GraduationCap
    case 'notification':
      return Bell
    case 'audit':
      return History
    case 'report':
      return FileSpreadsheet
    case 'analytics':
      return BarChart3
    default:
      return Shield
  }
}

function getPermissionGroupLabels(t) {
  return {
    user: t('rolesPage.groups.user'),
    permission: t('rolesPage.groups.permission'),
    patient: t('rolesPage.groups.patient'),
    symptom: t('rolesPage.groups.symptom'),
    lab: t('rolesPage.groups.lab'),
    rule: t('rolesPage.groups.rule'),
    diagnosis: t('rolesPage.groups.diagnosis'),
    assistant: t('rolesPage.groups.assistant'),
    treatment_plan: t('rolesPage.groups.treatment_plan'),
    care_plan: t('rolesPage.groups.care_plan'),
    guide: t('rolesPage.groups.guide'),
    notification: t('rolesPage.groups.notification'),
    audit: t('rolesPage.groups.audit'),
    report: t('rolesPage.groups.report'),
    analytics: t('rolesPage.groups.analytics'),
  }
}

const EMPTY_FORM = {
  id: null,
  name: '',
  description: '',
  permissions: [],
}

function getPermissionGroup(code) {
  return String(code || '').split('.')[0] || 'other'
}

function getPermissionGroupLabel(group, t) {
  const labels = getPermissionGroupLabels(t)
  if (labels[group]) return labels[group]
  return group
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizePermissionList(permissionCodes) {
  return Array.from(new Set((permissionCodes || []).map((code) => String(code || '').trim()).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right)
  )
}

function normalizeRoleName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '_')
}

export function RolePermissionsPage() {
  const { t } = useLanguage()
  const { user, refreshUser } = useAuth()
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState('new')
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [permissionSearch, setPermissionSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [replacementRoleName, setReplacementRoleName] = useState('')
  const [showMembers, setShowMembers] = useState(false)

  const userPermissions = useMemo(() => new Set(user?.permissions || []), [user])
  const canManage = userPermissions.has('permission.manage')
  const actorRoleNames = useMemo(
    () => new Set(user?.roles || (user?.role ? [user.role] : [])),
    [user]
  )
  const selectedRole = useMemo(
    () => roles.find((role) => String(role.id) === String(selectedRoleId)) || null,
    [roles, selectedRoleId]
  )

  const isBuiltInRole = selectedRole?.is_builtin ?? BUILT_IN_ROLE_NAMES.has(selectedRole?.name || '')
  const isReadOnly = !canManage
  const isEditableBuiltInRole = Boolean(selectedRole && isBuiltInRole)
  const replacementRoleOptions = useMemo(
    () => roles.filter((role) => role.id !== selectedRole?.id),
    [roles, selectedRole?.id]
  )
  const savedRolePermissionSet = useMemo(
    () => new Set(selectedRole?.permissions || []),
    [selectedRole]
  )

  // Filtered roles for left sidebar
  const filteredRoles = useMemo(() => {
    const term = roleFilter.toLowerCase().trim()
    const matchingRoles = !term
      ? roles
      : roles.filter(
          (role) =>
            role.name.toLowerCase().includes(term) ||
            (role.description || '').toLowerCase().includes(term) ||
            t(`roles.${role.name}`, { defaultValue: role.name }).toLowerCase().includes(term)
        )

    return [...matchingRoles].sort((left, right) => {
      const leftOrder = ROLE_SORT_ORDER.get(left.name) ?? 100
      const rightOrder = ROLE_SORT_ORDER.get(right.name) ?? 100
      return leftOrder - rightOrder || left.name.localeCompare(right.name)
    })
  }, [roles, roleFilter, t])

  // All category keys for filter pills
  const allCategoryKeys = useMemo(() => {
    const set = new Set()
    permissions.forEach((p) => set.add(getPermissionGroup(p.code)))
    return Array.from(set).sort((a, b) =>
      getPermissionGroupLabel(a, t).localeCompare(getPermissionGroupLabel(b, t), undefined, { sensitivity: 'base' })
    )
  }, [permissions, t])

  // Filtered permissions and grouping
  const filteredGroupedPermissions = useMemo(() => {
    const term = permissionSearch.trim().toLowerCase()
    const groups = new Map()

    permissions.forEach((permission) => {
      const group = getPermissionGroup(permission.code)
      if (activeCategoryFilter !== 'all' && group !== activeCategoryFilter) {
        return
      }

      const groupLabel = getPermissionGroupLabel(group, t)
      const permLabel = t(`permissions.${permission.code}`, { defaultValue: permission.description || permission.code })

      const matches =
        !term ||
        permission.code.toLowerCase().includes(term) ||
        (permission.description || '').toLowerCase().includes(term) ||
        groupLabel.toLowerCase().includes(term) ||
        permLabel.toLowerCase().includes(term)

      if (matches) {
        if (!groups.has(group)) groups.set(group, [])
        groups.get(group).push(permission)
      }
    })

    return Array.from(groups.entries())
      .map(([group, items]) => ({
        key: group,
        label: getPermissionGroupLabel(group, t),
        icon: getGroupIcon(group),
        assignedCount: items.filter((item) => savedRolePermissionSet.has(item.code)).length,
        items: items.sort((a, b) => {
          const assignedDifference = Number(savedRolePermissionSet.has(b.code)) - Number(savedRolePermissionSet.has(a.code))
          return assignedDifference || a.code.localeCompare(b.code)
        }),
      }))
      .sort((left, right) => {
        const assignedDifference = Number(right.assignedCount > 0) - Number(left.assignedCount > 0)
        return assignedDifference || left.label.localeCompare(right.label, undefined, { sensitivity: 'base' })
      })
  }, [permissions, permissionSearch, activeCategoryFilter, savedRolePermissionSet, t])

  async function loadPage() {
    setLoading(true)
    setError('')

    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/permissions'),
      ])

      const nextRoles = getApiData(rolesResponse) || []
      const nextPermissions = getApiData(permissionsResponse) || []

      setRoles(nextRoles)
      setPermissions(nextPermissions)

      if (selectedRoleId === 'new') return

      const matchedRole = nextRoles.find((role) => String(role.id) === String(selectedRoleId))
      if (matchedRole) {
        setForm({
          id: matchedRole.id,
          name: matchedRole.name,
          description: matchedRole.description || '',
          permissions: normalizePermissionList(matchedRole.permissions || []),
        })
      }
    } catch (err) {
      setError(getApiErrorMessage(err, t('rolesPage.notifications.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage()
  }, [])

  function selectRole(role) {
    setSelectedRoleId(String(role.id))
    setForm({
      id: role.id,
      name: role.name,
      description: role.description || '',
      permissions: normalizePermissionList(role.permissions || []),
    })
    setError('')
    setShowDeleteModal(false)
    setReplacementRoleName('')
  }

  function createNewRole() {
    setSelectedRoleId('new')
    setForm(EMPTY_FORM)
    setError('')
    setShowDeleteModal(false)
    setReplacementRoleName('')
  }

  function handleDuplicateRole(roleToCopy) {
    const baseName = roleToCopy?.name || 'custom_role'
    setSelectedRoleId('new')
    setForm({
      id: null,
      name: `${baseName}_copy`,
      description: `Custom role duplicated from ${baseName}`,
      permissions: normalizePermissionList(roleToCopy.permissions || []),
    })
    setError('')
    notify.info(t('rolesPage.notifications.duplicateSuccess'))
  }

  function togglePermission(code, checked) {
    setForm((current) => {
      const next = new Set(current.permissions)
      if (checked) next.add(code)
      else next.delete(code)
      return {
        ...current,
        permissions: Array.from(next).sort((left, right) => left.localeCompare(right)),
      }
    })
  }

  function toggleGroupPermissions(groupKey, enableAll) {
    if (isReadOnly) return
    const groupPermissionCodes = permissions
      .filter((p) => getPermissionGroup(p.code) === groupKey)
      .map((p) => p.code)

    setForm((current) => {
      const nextSet = new Set(current.permissions)
      groupPermissionCodes.forEach((code) => {
        if (enableAll) nextSet.add(code)
        else nextSet.delete(code)
      })
      return {
        ...current,
        permissions: normalizePermissionList(Array.from(nextSet)),
      }
    })
  }

  function handleSelectAll() {
    if (isReadOnly) return
    setForm((current) => ({
      ...current,
      permissions: normalizePermissionList(permissions.map((p) => p.code)),
    }))
  }

  function handleDeselectAll() {
    if (isReadOnly) return
    setForm((current) => ({
      ...current,
      permissions: [],
    }))
  }

  function handleRestoreRecommended() {
    if (isReadOnly || !selectedRole?.recommended_permissions?.length) return
    setForm((current) => ({
      ...current,
      permissions: normalizePermissionList(selectedRole.recommended_permissions),
    }))
    notify.info(t('rolesPage.notifications.recommendedRestored', { role: t(`roles.${selectedRole.name}`, { defaultValue: selectedRole.name }) }))
  }

  async function handleDeleteRole() {
    if (!form.id || isBuiltInRole) return
    if (selectedRole?.user_count > 0 && !replacementRoleName) {
      notify.warning(t('rolesPage.notifications.replacementRequired'))
      return
    }

    setDeleting(true)
    const loadingToast = notify.loading(t('rolesPage.notifications.deleting'))

    try {
      await api.delete(`/admin/roles/${form.id}`, {
        data: replacementRoleName ? { replacement_role: replacementRoleName } : {},
      })
      notify.dismiss(loadingToast)
      notify.success(t('rolesPage.notifications.deleteSuccess'))
      setShowDeleteModal(false)
      createNewRole()
      await loadPage()
    } catch (err) {
      notify.dismiss(loadingToast)
      notify.error(getApiErrorMessage(err, t('rolesPage.notifications.deleteError')))
    } finally {
      setDeleting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isReadOnly) return

    const roleName = normalizeRoleName(form.name)
    if (!roleName) {
      notify.warning(t('rolesPage.notifications.nameRequired'))
      return
    }
    if (!form.permissions.length) {
      notify.warning(t('rolesPage.notifications.permissionRequired'))
      return
    }

    const removesOwnPermissionManagement =
      selectedRole &&
      actorRoleNames.has(selectedRole.name) &&
      (selectedRole.permissions?.includes('permission.manage') || selectedRole.permissions?.includes('permission.view')) &&
      (!form.permissions.includes('permission.manage') || !form.permissions.includes('permission.view'))

    if (removesOwnPermissionManagement && !window.confirm(t('rolesPage.form.selfLockoutWarning'))) {
      return
    }

    setSaving(true)
    setError('')
    const loadingToast = notify.loading(form.id ? t('rolesPage.notifications.saving') : t('rolesPage.notifications.creating'))

    try {
      const payload = {
        name: roleName,
        description: form.description || `Role permissions for ${roleName}`,
        permissions: normalizePermissionList(form.permissions),
      }

      const isUpdating = Boolean(form.id)
      if (isUpdating) {
        await api.patch(`/admin/roles/${form.id}`, payload)
      } else {
        await api.post('/admin/roles', payload)
      }

      let refreshedActor = null
      if (isUpdating && actorRoleNames.has(roleName)) {
        refreshedActor = await refreshUser()
      }
      // If this save removed the current user's permission.view, the role
      // editor is no longer readable; avoid a misleading second 403 toast.
      if (!refreshedActor || refreshedActor.permissions?.includes('permission.view')) {
        await loadPage()
      }
      notify.dismiss(loadingToast)
      notify.success(isUpdating ? t('rolesPage.notifications.saveSuccess') : t('rolesPage.notifications.createSuccess'))
      if (!isUpdating) createNewRole()
    } catch (err) {
      notify.dismiss(loadingToast)
      notify.error(getApiErrorMessage(err, form.id ? t('rolesPage.notifications.saveError') : t('rolesPage.notifications.createError')))
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = form.permissions.length
  const totalCount = permissions.length

  if (loading && !roles.length) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeaderSkeleton hasActions={true} />
        <TwoColumnPageSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminHeroCard
        title={t('rolesPage.hero.title')}
        description={t('rolesPage.hero.description')}
        action={
          canManage ? (
            <button
              type="button"
              className="btn-primary gap-2 rounded-xl px-4 py-2.5 text-xs shadow-sm"
              onClick={createNewRole}
            >
              <Plus className="h-4 w-4" />
              {t('rolesPage.hero.newRole')}
            </button>
          ) : null
        }
      />

      <ErrorAlert message={error} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* Left Column: Roles Sidebar */}
        <div>
          <SectionCard
            title={
              <div className="flex items-center justify-between gap-2">
                <span>{t('rolesPage.list.title')}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {roles.length}
                </span>
              </div>
            }
            description={t('rolesPage.list.description')}
            className="h-fit"
          >
            {/* Minimal search input */}
            {roles.length > 3 && (
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  placeholder={t('rolesPage.list.searchRoles')}
                  className="w-full rounded-xl bg-slate-100/70 py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 transition-all border-0"
                />
                {roleFilter && (
                  <button
                    type="button"
                    onClick={() => setRoleFilter('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* If currently creating new role, show active new role item */}
            {selectedRoleId === 'new' && (
              <div className="relative mb-2 flex items-center gap-3 rounded-xl bg-primary-50/80 px-3 py-2.5 dark:bg-primary-950/40">
                <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary-600 dark:bg-primary-500" />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white shadow-xs">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="truncate text-xs font-semibold text-primary-900 dark:text-primary-100">
                      {form.name || t('rolesPage.form.newRoleTitle')}
                    </p>
                    <span className="inline-flex shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-[9px] font-semibold text-primary-800 dark:bg-primary-900/60 dark:text-primary-200">
                      {t('rolesPage.form.customBadge')}
                    </span>
                  </div>
                  <p className="text-[10px] text-primary-700/80 dark:text-primary-300/80">
                    {t('rolesPage.form.permissionsCounter', { selected: selectedCount, total: totalCount })}
                  </p>
                </div>
              </div>
            )}

            {/* Seamless role list without individual box borders */}
            <div className="space-y-1">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl animate-pulse">
                      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-2.5 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {!loading && !filteredRoles.length ? (
                <EmptyState title={t('rolesPage.list.emptyTitle')} description={t('rolesPage.list.emptyDescription')} />
              ) : null}

              {filteredRoles.map((role) => {
                const active = String(role.id) === String(selectedRoleId)
                const builtIn = BUILT_IN_ROLE_NAMES.has(role.name)
                const RoleIcon = getRoleIcon(role.name)
                const colorTheme = getRoleColorClasses(role.name)
                const roleDisplayName = t(`roles.${role.name}`, { defaultValue: role.name })

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => selectRole(role)}
                    className={`group relative w-full rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                      active
                        ? 'bg-slate-100/90 text-slate-900 shadow-xs dark:bg-slate-800/90 dark:text-slate-100'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {active && (
                      <span
                        className={`absolute inset-y-2 left-0 w-1 rounded-r-full ${colorTheme.activeIndicator}`}
                      />
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorTheme.iconBg}`}>
                        <RoleIcon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate text-xs font-semibold capitalize text-slate-900 dark:text-slate-100">
                            {roleDisplayName}
                          </span>
                          <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${colorTheme.badge}`}>
                            {builtIn ? t('rolesPage.list.builtIn') : t('rolesPage.list.custom')}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            {role.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {role.user_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {role.permissions?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </SectionCard>
        </div>

        {/* Right Column: Role Details & Permissions */}
        <div className="space-y-6">
          <SectionCard
            title={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      selectedRole ? getRoleColorClasses(selectedRole.name).iconBg : 'bg-primary-50 text-primary-600 dark:bg-primary-950/50'
                    }`}
                  >
                    {selectedRole ? (
                      (() => {
                        const Icon = getRoleIcon(selectedRole.name)
                        return <Icon className="h-5 w-5" />
                      })()
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {form.id
                        ? `${t('rolesPage.form.detailsTitle')}: ${t(`roles.${form.name}`, { defaultValue: form.name })}`
                        : t('rolesPage.form.newRoleTitle')}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isBuiltInRole ? t('rolesPage.form.builtInBadge') : t('rolesPage.form.customBadge')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Restore the safe role template without locking role editing. */}
                  {isEditableBuiltInRole && canManage && (
                    <button
                      type="button"
                      onClick={handleRestoreRecommended}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                      title={t('rolesPage.form.restoreRecommended')}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{t('rolesPage.form.restoreRecommended')}</span>
                    </button>
                  )}

                  {/* Clone / Duplicate action */}
                  {selectedRole && canManage && (
                    <button
                      type="button"
                      onClick={() => handleDuplicateRole(selectedRole)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                      title={t('rolesPage.form.duplicateRole')}
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span className="hidden sm:inline">{t('rolesPage.form.duplicateRole')}</span>
                    </button>
                  )}

                  {/* Delete button for custom roles */}
                  {form.id && !isBuiltInRole && canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplacementRoleName('')
                        setShowDeleteModal(true)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t('rolesPage.form.deleteRole')}</span>
                    </button>
                  )}

                  {form.id && isBuiltInRole && (
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400 dark:bg-slate-800/70 dark:text-slate-500"
                      title={t('rolesPage.form.coreRoleDeleteNotice')}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>{t('rolesPage.form.protectedDelete')}</span>
                    </button>
                  )}

                  {/* Save/Create Button for editable roles */}
                  {!isReadOnly && canManage && (
                    <button
                      type="submit"
                      form="role-permissions-form"
                      className="btn-primary gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium shadow-sm"
                      disabled={saving || loading}
                    >
                      <Save className="h-3.5 w-3.5" />
                      {saving
                        ? t('rolesPage.form.saving')
                        : form.id
                          ? t('rolesPage.form.saveRole')
                          : t('rolesPage.form.createRole')}
                    </button>
                  )}
                </div>
              </div>
            }
            description={isEditableBuiltInRole ? t('rolesPage.form.editableBuiltInNotice') : t('rolesPage.form.newRoleDesc')}
          >
            {/* Built-in role status and safety guidance */}
            {isBuiltInRole && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border-l-4 border-emerald-500 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold">{t('rolesPage.form.builtInBadge')}: </span>
                  <span>{t('rolesPage.form.editableBuiltInNotice')}</span>
                </div>
              </div>
            )}

            <form id="role-permissions-form" className="space-y-6" onSubmit={handleSubmit}>
              {/* Sleek inputs without heavy box borders */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('rolesPage.form.roleName')}
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 transition-all font-medium disabled:opacity-75"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder={t('rolesPage.form.roleNamePlaceholder')}
                    disabled={loading || saving || isReadOnly || isBuiltInRole}
                    required
                  />
                  {form.name && (
                    <span className="mt-1 block font-mono text-[10px] text-slate-400">
                      {t('rolesPage.form.roleIdentifier')}: {normalizeRoleName(form.name)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('rolesPage.form.roleDescription')}
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 transition-all disabled:opacity-75"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder={t('rolesPage.form.roleDescriptionPlaceholder')}
                    disabled={loading || saving || isReadOnly}
                  />
                </div>
              </div>

              {/* Assigned Members Preview */}
              {selectedRole && (
                <div className="rounded-xl bg-slate-50/60 p-3.5 dark:bg-slate-800/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {t('rolesPage.form.assignedMembers')} ({selectedRole.users?.length || 0})
                      </span>
                    </div>
                    {selectedRole.users?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowMembers((v) => !v)}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        {showMembers ? 'Collapse' : 'View Members'}
                      </button>
                    )}
                  </div>

                  {showMembers && selectedRole.users?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200/60 pt-3 dark:border-slate-800">
                      {selectedRole.users.map((u) => (
                        <div
                          key={u.id}
                          className="inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 text-xs text-slate-700 shadow-2xs dark:bg-slate-800 dark:text-slate-200"
                        >
                          <UserAvatar user={u} size="xs" />
                          <span className="font-medium">{u.name}</span>
                          <span className="text-[10px] text-slate-400">({u.email})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showMembers && selectedRole.users?.length > 0 && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {selectedRole.users.slice(0, 3).map((u) => u.name).join(', ')}
                      {selectedRole.users.length > 3 ? ` and ${selectedRole.users.length - 3} more` : ''}
                    </p>
                  )}

                  {!selectedRole.users?.length && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {t('rolesPage.form.noAssignedMembers')}
                    </p>
                  )}
                </div>
              )}

              {/* Permissions Section */}
              <div className="space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800/80">
                {/* Header & Global Selection Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {t('rolesPage.form.permissions')}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {t('rolesPage.form.permissionsCounter', { selected: selectedCount, total: totalCount })}
                      </p>
                      {selectedRole && (
                        <p className="mt-0.5 text-[10px] font-medium text-primary-600 dark:text-primary-400">
                          {t('rolesPage.form.assignedFirstHint', {
                            role: t(`roles.${selectedRole.name}`, { defaultValue: selectedRole.name }),
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        {t('rolesPage.form.selectAll')}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        <X className="h-3.5 w-3.5 text-slate-400" />
                        {t('rolesPage.form.deselectAll')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Search & Category Filter Pills */}
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      placeholder={t('rolesPage.form.searchPermissions')}
                      className="w-full rounded-xl bg-slate-100/70 py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 transition-all border-0"
                    />
                    {permissionSearch && (
                      <button
                        type="button"
                        onClick={() => setPermissionSearch('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Horizontal Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveCategoryFilter('all')}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                        activeCategoryFilter === 'all'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                      }`}
                    >
                      All ({totalCount})
                    </button>
                    {allCategoryKeys.map((catKey) => {
                      const catCount = permissions.filter((p) => getPermissionGroup(p.code) === catKey).length
                      const catLabel = getPermissionGroupLabel(catKey, t)
                      const isCatActive = activeCategoryFilter === catKey
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => setActiveCategoryFilter(catKey)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                            isCatActive
                              ? 'bg-primary-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                          }`}
                        >
                          {catLabel} ({catCount})
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Permissions Category Cards */}
                {!filteredGroupedPermissions.length ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {permissionSearch ? t('rolesPage.form.noSearchMatch') : t('rolesPage.form.noPermissionsTitle')}
                    </p>
                    {(permissionSearch || activeCategoryFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setPermissionSearch('')
                          setActiveCategoryFilter('all')
                        }}
                        className="mt-2 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredGroupedPermissions.map((group) => {
                      const GroupIcon = group.icon
                      const groupCodes = group.items.map((p) => p.code)
                      const groupSelectedCount = groupCodes.filter((code) => form.permissions.includes(code)).length
                      const allGroupSelected = groupSelectedCount === groupCodes.length && groupCodes.length > 0
                      const someGroupSelected = groupSelectedCount > 0 && !allGroupSelected

                      return (
                        <div
                          key={group.key}
                          className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900/40"
                        >
                          {/* Group Header Bar */}
                          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <GroupIcon className="h-3.5 w-3.5" />
                              </div>
                              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{group.label}</h4>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  allGroupSelected
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : someGroupSelected
                                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                                      : 'bg-slate-200/60 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {groupSelectedCount}/{groupCodes.length}
                              </span>

                              {/* Group quick toggle */}
                              {!isReadOnly && (
                                <button
                                  type="button"
                                  onClick={() => toggleGroupPermissions(group.key, !allGroupSelected)}
                                  className="text-[11px] font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                                >
                                  {allGroupSelected
                                    ? t('rolesPage.form.deselectAllCategory')
                                    : t('rolesPage.form.selectAllCategory')}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Seamless permission rows without individual box borders */}
                          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {group.items.map((permission) => {
                              const checked = form.permissions.includes(permission.code)
                              const permissionLabel = t(`permissions.${permission.code}`, {
                                defaultValue: permission.description || permission.code,
                              })

                              return (
                                <label
                                  key={permission.code}
                                  className={`group flex cursor-pointer select-none items-center justify-between gap-3 px-3.5 py-2.5 transition-colors ${
                                    checked
                                      ? 'bg-primary-50/30 dark:bg-primary-950/15'
                                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                                  } ${isReadOnly ? 'cursor-default opacity-85' : ''}`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Checkbox
                                      checked={checked}
                                      disabled={loading || saving || isReadOnly}
                                      aria-label={permissionLabel}
                                      onCheckedChange={(value) => togglePermission(permission.code, value === true)}
                                    />
                                    <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                                      {permissionLabel}
                                    </span>
                                  </div>
                                  <span className="shrink-0 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                    {permission.code}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </form>
          </SectionCard>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/50">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t('rolesPage.form.deleteConfirmTitle')}
              </h3>
            </div>

            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
              {t('rolesPage.form.deleteConfirmMessage', { name: form.name })}
            </p>

            {selectedRole?.user_count > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Info className="h-4 w-4" />
                  {t('rolesPage.form.activeUsersWarning')}
                </div>
                <p className="mt-1">
                  {t('rolesPage.form.reassignBeforeDelete', { count: selectedRole.user_count })}
                </p>
                <label className="mt-3 block font-semibold" htmlFor="replacement-role">
                  {t('rolesPage.form.replacementRole')}
                </label>
                <select
                  id="replacement-role"
                  value={replacementRoleName}
                  onChange={(event) => setReplacementRoleName(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-amber-900/70 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">{t('rolesPage.form.selectReplacementRole')}</option>
                  {replacementRoleOptions.map((role) => (
                    <option key={role.id} value={role.name}>
                      {t(`roles.${role.name}`, { defaultValue: role.name })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary px-4 py-2 text-xs"
                disabled={deleting}
              >
                {t('rolesPage.form.cancelDelete')}
              </button>
              <button
                type="button"
                onClick={handleDeleteRole}
                disabled={deleting || (selectedRole?.user_count > 0 && !replacementRoleName)}
                className="btn-primary bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 px-4 py-2 text-xs"
              >
                {deleting ? t('rolesPage.form.deletingRole') : t('rolesPage.form.deleteConfirmAction')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RolePermissionsPage
