import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCheck,
  Copy,
  Crown,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  HeartHandshake,
  History,
  Info,
  KeyRound,
  Lock,
  Plus,
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
import { Checkbox, EmptyState, ErrorAlert, SectionCard } from '@/components/ui'
import { notify } from '@/lib/toast'
import { useLanguage } from '@/contexts/LanguageContext'

const BUILT_IN_ROLE_NAMES = new Set(['patient', 'doctor', 'nurse', 'admin', 'super_admin'])

function getRoleIcon(roleName) {
  switch (roleName) {
    case 'super_admin':
      return Crown
    case 'admin':
      return ShieldAlert
    case 'doctor':
      return Stethoscope
    case 'nurse':
      return HeartHandshake
    case 'patient':
      return User
    default:
      return KeyRound
  }
}

function getRoleColorClasses(roleName) {
  switch (roleName) {
    case 'super_admin':
      return {
        iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 ring-1 ring-amber-300 dark:ring-amber-800',
        badge: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/60',
        activeBorder: 'border-amber-400 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-950/20',
      }
    case 'admin':
      return {
        iconBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 ring-1 ring-indigo-300 dark:ring-indigo-800',
        badge: 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900/60',
        activeBorder: 'border-indigo-400 bg-indigo-50/40 dark:border-indigo-700 dark:bg-indigo-950/20',
      }
    case 'doctor':
      return {
        iconBg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 ring-1 ring-cyan-300 dark:ring-cyan-800',
        badge: 'bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-900/60',
        activeBorder: 'border-cyan-400 bg-cyan-50/40 dark:border-cyan-700 dark:bg-cyan-950/20',
      }
    case 'nurse':
      return {
        iconBg: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 ring-1 ring-teal-300 dark:ring-teal-800',
        badge: 'bg-teal-50 text-teal-800 ring-1 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-900/60',
        activeBorder: 'border-teal-400 bg-teal-50/40 dark:border-teal-700 dark:bg-teal-950/20',
      }
    case 'patient':
      return {
        iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 ring-1 ring-blue-300 dark:ring-blue-800',
        badge: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/60',
        activeBorder: 'border-blue-400 bg-blue-50/40 dark:border-blue-700 dark:bg-blue-950/20',
      }
    default:
      return {
        iconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 ring-1 ring-purple-300 dark:ring-purple-800',
        badge: 'bg-purple-50 text-purple-800 ring-1 ring-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-900/60',
        activeBorder: 'border-purple-400 bg-purple-50/40 dark:border-purple-700 dark:bg-purple-950/20',
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
  const { user } = useAuth()
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMembers, setShowMembers] = useState(false)

  const userPermissions = useMemo(() => new Set(user?.permissions || []), [user])
  const canManage = userPermissions.has('permission.manage')

  const selectedRole = useMemo(
    () => roles.find((role) => String(role.id) === String(selectedRoleId)) || null,
    [roles, selectedRoleId]
  )

  const isBuiltInRole = BUILT_IN_ROLE_NAMES.has(selectedRole?.name || '')
  const isReadOnly = !canManage || Boolean(selectedRole && isBuiltInRole)

  // Filtered roles for left sidebar
  const filteredRoles = useMemo(() => {
    if (!roleFilter.trim()) return roles
    const term = roleFilter.toLowerCase().trim()
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(term) ||
        (role.description || '').toLowerCase().includes(term) ||
        t(`roles.${role.name}`, { defaultValue: role.name }).toLowerCase().includes(term)
    )
  }, [roles, roleFilter, t])

  // Filtered permissions and grouping
  const filteredGroupedPermissions = useMemo(() => {
    const term = permissionSearch.trim().toLowerCase()
    const groups = new Map()

    permissions.forEach((permission) => {
      const group = getPermissionGroup(permission.code)
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
      .sort(([left], [right]) => getPermissionGroupLabel(left, t).localeCompare(getPermissionGroupLabel(right, t), undefined, { sensitivity: 'base' }))
      .map(([group, items]) => ({
        key: group,
        label: getPermissionGroupLabel(group, t),
        icon: getGroupIcon(group),
        items: items.sort((a, b) => a.code.localeCompare(b.code)),
      }))
  }, [permissions, permissionSearch, t])

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
  }

  function createNewRole() {
    setSelectedRoleId('new')
    setForm(EMPTY_FORM)
    setError('')
    setShowDeleteModal(false)
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

  async function handleDeleteRole() {
    if (!form.id || isBuiltInRole) return

    setDeleting(true)
    const loadingToast = notify.loading(t('rolesPage.notifications.deleting'))

    try {
      await api.delete(`/admin/roles/${form.id}`)
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

    setSaving(true)
    setError('')
    const loadingToast = notify.loading(form.id ? t('rolesPage.notifications.saving') : t('rolesPage.notifications.creating'))

    try {
      const payload = {
        name: roleName,
        description: form.description || `Role permissions for ${roleName}`,
        permissions: normalizePermissionList(form.permissions),
      }

      if (form.id) {
        await api.patch(`/admin/roles/${form.id}`, payload)
      } else {
        await api.post('/admin/roles', payload)
      }

      await loadPage()
      notify.dismiss(loadingToast)
      notify.success(form.id ? t('rolesPage.notifications.saveSuccess') : t('rolesPage.notifications.createSuccess'))
      createNewRole()
    } catch (err) {
      notify.dismiss(loadingToast)
      notify.error(getApiErrorMessage(err, form.id ? t('rolesPage.notifications.saveError') : t('rolesPage.notifications.createError')))
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = form.permissions.length
  const totalCount = permissions.length

  return (
    <div className="space-y-6">
      <AdminHeroCard
        title={t('rolesPage.hero.title')}
        description={t('rolesPage.hero.description')}
        action={
          canManage ? (
            <button
              type="button"
              className="btn-primary gap-2 rounded-2xl px-5 py-3 shadow-lg shadow-primary-700/15"
              onClick={createNewRole}
            >
              <Plus className="h-4 w-4" />
              {t('rolesPage.hero.newRole')}
            </button>
          ) : null
        }
      />

      <ErrorAlert message={error} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* Left Column: Role List Sidebar */}
        <div className="space-y-4">
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
            {/* Role search filter if more than 3 roles */}
            {roles.length > 3 && (
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  placeholder={t('rolesPage.list.searchRoles')}
                  className="input-base py-1.5 pl-9 pr-8 text-xs"
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

            <div className="space-y-2.5">
              {loading ? <p className="state-box">{t('rolesPage.list.loading')}</p> : null}
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
                    className={`group relative w-full rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                      active
                        ? `${colorTheme.activeBorder} shadow-sm ring-1 ring-primary-500/20`
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colorTheme.iconBg}`}>
                        <RoleIcon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="truncate text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">
                            {roleDisplayName}
                          </p>
                          <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${colorTheme.badge}`}>
                            {builtIn ? t('rolesPage.list.builtIn') : t('rolesPage.list.custom')}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400 dark:text-slate-500">
                          {role.name}
                        </p>

                        <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {role.user_count === 1
                              ? t('rolesPage.list.userCount', { count: role.user_count })
                              : t('rolesPage.list.userCount_plural', { count: role.user_count })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5 text-slate-400" />
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

        {/* Right Column: Role Details & Permissions Matrix */}
        <div className="space-y-6">
          <SectionCard
            title={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
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
                  {/* Clone / Duplicate action for built-in or existing roles */}
                  {selectedRole && canManage && (
                    <button
                      type="button"
                      onClick={() => handleDuplicateRole(selectedRole)}
                      className="btn-secondary gap-1.5 px-3 py-2 text-xs"
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
                      onClick={() => setShowDeleteModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{t('rolesPage.form.deleteRole')}</span>
                    </button>
                  )}

                  {/* Save/Create Button for editable roles */}
                  {!isReadOnly && canManage && (
                    <button
                      type="submit"
                      form="role-permissions-form"
                      className="btn-primary gap-2 px-4 py-2 text-xs"
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
            description={isBuiltInRole ? t('rolesPage.form.builtInNotice') : t('rolesPage.form.newRoleDesc')}
          >
            {/* Built-in role lock banner */}
            {isBuiltInRole && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {t('rolesPage.form.builtInBadge')}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {t('rolesPage.form.builtInNotice')}
                  </p>
                </div>
              </div>
            )}

            <form id="role-permissions-form" className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="label-text">{t('rolesPage.form.roleName')}</span>
                  <input
                    className="input-base font-medium"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder={t('rolesPage.form.roleNamePlaceholder')}
                    disabled={loading || saving || isReadOnly}
                    required
                  />
                  {form.name && (
                    <span className="mt-1 block font-mono text-[11px] text-slate-400">
                      {t('rolesPage.form.roleIdentifier')}: {normalizeRoleName(form.name)}
                    </span>
                  )}
                </label>

                <label className="block">
                  <span className="label-text">{t('rolesPage.form.roleDescription')}</span>
                  <input
                    className="input-base"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder={t('rolesPage.form.roleDescriptionPlaceholder')}
                    disabled={loading || saving || isReadOnly}
                  />
                </label>
              </div>

              {/* Assigned Members Preview for selected role */}
              {selectedRole && (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/30">
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
                        className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                      >
                        {showMembers ? 'Collapse' : 'View Members'}
                      </button>
                    )}
                  </div>

                  {showMembers && selectedRole.users?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                      {selectedRole.users.map((u) => (
                        <div
                          key={u.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white uppercase">
                            {u.name?.charAt(0) || 'U'}
                          </span>
                          <span className="font-medium">{u.name}</span>
                          <span className="text-[11px] text-slate-400">({u.email})</span>
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

              {/* Permissions Header & Controls Bar */}
              <div className="border-t border-slate-200/80 pt-6 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {t('rolesPage.form.permissions')}
                    </h3>
                    <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                      {t('rolesPage.form.permissionsCounter', { selected: selectedCount, total: totalCount })}
                    </span>
                  </div>

                  {/* Global Select/Deselect All buttons for editable roles */}
                  {!isReadOnly && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                        {t('rolesPage.form.selectAll')}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <X className="h-3.5 w-3.5 text-slate-400" />
                        {t('rolesPage.form.deselectAll')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Permission Search Input */}
                <div className="relative mb-5">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    placeholder={t('rolesPage.form.searchPermissions')}
                    className="input-base py-2 pl-10 pr-9 text-xs"
                  />
                  {permissionSearch && (
                    <button
                      type="button"
                      onClick={() => setPermissionSearch('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Permissions Category Cards */}
                {!filteredGroupedPermissions.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {permissionSearch ? t('rolesPage.form.noSearchMatch') : t('rolesPage.form.noPermissionsTitle')}
                    </p>
                    {permissionSearch && (
                      <button
                        type="button"
                        onClick={() => setPermissionSearch('')}
                        className="mt-2 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
                      >
                        Clear search filter
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {filteredGroupedPermissions.map((group) => {
                      const GroupIcon = group.icon
                      const groupCodes = group.items.map((p) => p.code)
                      const groupSelectedCount = groupCodes.filter((code) => form.permissions.includes(code)).length
                      const allGroupSelected = groupSelectedCount === groupCodes.length && groupCodes.length > 0
                      const someGroupSelected = groupSelectedCount > 0 && !allGroupSelected

                      return (
                        <div
                          key={group.key}
                          className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
                        >
                          {/* Group Header */}
                          <div className="mb-3.5 flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800/80">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                <GroupIcon className="h-3.5 w-3.5" />
                              </div>
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{group.label}</h4>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  allGroupSelected
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : someGroupSelected
                                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {groupSelectedCount}/{groupCodes.length}
                              </span>

                              {/* Group quick toggle for editable roles */}
                              {!isReadOnly && (
                                <button
                                  type="button"
                                  onClick={() => toggleGroupPermissions(group.key, !allGroupSelected)}
                                  className="text-[11px] font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
                                >
                                  {allGroupSelected
                                    ? t('rolesPage.form.deselectAllCategory')
                                    : t('rolesPage.form.selectAllCategory')}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Group Permission Items */}
                          <div className="space-y-2.5">
                            {group.items.map((permission) => {
                              const checked = form.permissions.includes(permission.code)
                              const permissionLabel = t(`permissions.${permission.code}`, {
                                defaultValue: permission.description || permission.code,
                              })

                              return (
                                <label
                                  key={permission.code}
                                  className={`flex cursor-pointer select-none items-start gap-3 rounded-xl border p-2.5 transition ${
                                    checked
                                      ? 'border-primary-200 bg-primary-50/40 dark:border-primary-900/40 dark:bg-primary-950/20'
                                      : 'border-slate-100 bg-slate-50/30 hover:border-slate-200 hover:bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-900/20 dark:hover:border-slate-700'
                                  } ${isReadOnly ? 'cursor-default opacity-80' : ''}`}
                                >
                                  <div className="mt-0.5">
                                    <Checkbox
                                      checked={checked}
                                      disabled={loading || saving || isReadOnly}
                                      aria-label={permissionLabel}
                                      onCheckedChange={(value) => togglePermission(permission.code, value === true)}
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                                      {permissionLabel}
                                    </p>
                                    <p className="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                      {permission.code}
                                    </p>
                                  </div>
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
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Info className="h-4 w-4" />
                  Warning: Active Users Assigned
                </div>
                <p className="mt-1">
                  This role currently has {selectedRole.user_count} assigned user(s). You must reassign those users
                  before deleting this role.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary px-4 py-2 text-xs"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRole}
                disabled={deleting || selectedRole?.user_count > 0}
                className="btn-primary bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 px-4 py-2 text-xs"
              >
                {deleting ? 'Deleting...' : t('rolesPage.form.deleteConfirmAction')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default RolePermissionsPage
