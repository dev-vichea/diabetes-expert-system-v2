import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { AdminHeroCard } from '@/components/admin'
import { Checkbox, EmptyState, ErrorAlert, SectionCard } from '@/components/ui'
import { notify } from '@/lib/toast'
import { useLanguage } from '@/contexts/LanguageContext'

const BUILT_IN_ROLE_NAMES = new Set(['patient', 'doctor', 'admin', 'super_admin'])

function getPermissionGroupLabels(t) {
  return {
    user: t('rolesPage.groups.user'),
    permission: t('rolesPage.groups.permission'),
    patient: t('rolesPage.groups.patient'),
    symptom: t('rolesPage.groups.symptom'),
    lab: t('rolesPage.groups.lab'),
    rule: t('rolesPage.groups.rule'),
    diagnosis: t('rolesPage.groups.diagnosis'),
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
  return String(value || '').trim().toLowerCase()
}

function sortPermissionItems(left, right) {
  const leftLabel = left.description || left.code
  const rightLabel = right.description || right.code
  return leftLabel.localeCompare(rightLabel, undefined, { sensitivity: 'base' })
}

function roleBadgeClass(roleName) {
  if (BUILT_IN_ROLE_NAMES.has(roleName)) {
    return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700'
  }
  return 'bg-primary-50 text-primary-700 ring-1 ring-primary-100 dark:bg-primary-950/40 dark:text-primary-300 dark:ring-primary-900/40'
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
  const [error, setError] = useState('')

  const userPermissions = useMemo(() => new Set(user?.permissions || []), [user])
  const canManage = userPermissions.has('permission.manage')

  const selectedRole = useMemo(
    () => roles.find((role) => String(role.id) === String(selectedRoleId)) || null,
    [roles, selectedRoleId]
  )

  const isBuiltInRole = BUILT_IN_ROLE_NAMES.has(selectedRole?.name || '')
  const isReadOnly = !canManage || Boolean(selectedRole && isBuiltInRole)

  const groupedPermissions = useMemo(() => {
    const groups = new Map()

    permissions.forEach((permission) => {
      const group = getPermissionGroup(permission.code)
      if (!groups.has(group)) groups.set(group, [])
      groups.get(group).push(permission)
    })

    return Array.from(groups.entries())
      .sort(([left], [right]) => getPermissionGroupLabel(left, t).localeCompare(getPermissionGroupLabel(right, t), undefined, { sensitivity: 'base' }))
      .map(([group, items]) => ({
        key: group,
        label: getPermissionGroupLabel(group, t),
        items: [...items].sort(sortPermissionItems),
      }))
  }, [permissions, t])

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
  }

  function createNewRole() {
    setSelectedRoleId('new')
    setForm(EMPTY_FORM)
    setError('')
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

  return (
    <div className="space-y-6">
      <AdminHeroCard
        title={t('rolesPage.hero.title')}
        description={t('rolesPage.hero.description')}
        action={canManage ? (
          <button type="button" className="btn-primary gap-2 rounded-2xl px-5 py-3 shadow-lg shadow-cyan-700/15" onClick={createNewRole}>
            <Plus className="h-4 w-4" />
            {t('rolesPage.hero.newRole')}
          </button>
        ) : null}
      />

      <ErrorAlert message={error} />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <SectionCard
          title={t('rolesPage.list.title')}
          description={t('rolesPage.list.description')}
          actions={canManage ? (
            <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={createNewRole}>
              {t('rolesPage.list.newRole')}
            </button>
          ) : null}
          className="h-fit xl:sticky xl:top-24"
        >
          <div className="space-y-2">
            {loading ? <p className="state-box">{t('rolesPage.list.loading')}</p> : null}
            {!loading && !roles.length ? (
              <EmptyState title={t('rolesPage.list.emptyTitle')} description={t('rolesPage.list.emptyDescription')} />
            ) : null}
            {roles.map((role) => {
              const active = String(role.id) === String(selectedRoleId)
              const builtIn = BUILT_IN_ROLE_NAMES.has(role.name)

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => selectRole(role)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? 'border-primary-300 bg-primary-50/70 shadow-sm dark:border-primary-700/50 dark:bg-primary-950/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{role.name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {role.user_count === 1 ? t('rolesPage.list.userCount', { count: role.user_count }) : t('rolesPage.list.userCount_plural', { count: role.user_count })}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${roleBadgeClass(role.name)}`}>
                      {builtIn ? t('rolesPage.list.builtIn') : t('rolesPage.list.custom')}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </SectionCard>

        <SectionCard
          title={form.id ? t('rolesPage.form.detailsTitle') : t('rolesPage.form.newRoleTitle')}
          description={isBuiltInRole ? t('rolesPage.form.builtInNotice') : t('rolesPage.form.newRoleDesc')}
          actions={canManage ? (
            <button
              type="submit"
              form="role-permissions-form"
              className="btn-primary gap-2"
              disabled={saving || loading || isReadOnly}
            >
              <Save className="h-4 w-4" />
              {saving ? t('rolesPage.form.saving') : (form.id ? t('rolesPage.form.saveRole') : t('rolesPage.form.createRole'))}
            </button>
          ) : null}
        >
          <form id="role-permissions-form" className="space-y-6" onSubmit={handleSubmit}>
            <label className="block">
              <span className="label-text">{t('rolesPage.form.roleName')}</span>
              <input
                className="input-base"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder={t('rolesPage.form.roleNamePlaceholder')}
                disabled={loading || saving || isReadOnly}
                required
              />
            </label>

            <div>
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('rolesPage.form.permissions')}</h3>
              </div>

              {!groupedPermissions.length ? (
                <EmptyState title={t('rolesPage.form.noPermissionsTitle')} description={t('rolesPage.form.noPermissionsDesc')} />
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {groupedPermissions.map((group) => (
                    <div key={group.key}>
                      <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{group.label}</h4>
                      <div className="mt-3 space-y-3">
                        {group.items.map((permission) => {
                          const checked = form.permissions.includes(permission.code)
                          return (
                            <label key={permission.code} className="flex items-start gap-3">
                              <Checkbox
                                checked={checked}
                                disabled={loading || saving || isReadOnly}
                                aria-label={permission.description || permission.code}
                                onCheckedChange={(value) => togglePermission(permission.code, value === true)}
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {t(`permissions.${permission.code}`, { defaultValue: permission.description || permission.code })}
                                </p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </SectionCard>
      </div>
    </div>
  )
}
