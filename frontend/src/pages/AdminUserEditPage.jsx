import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { ArrowLeft, Lock, Save, Shield, Users } from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { AdminHeroCard } from '@/components/admin'
import { AdminUserSidebar } from '@/components/admin/AdminUserSidebar'
import {
  AppSelect,
  Checkbox,
  PageHeaderSkeleton,
  TwoColumnPageSkeleton,
} from '@/components/ui'
import { notify } from '@/lib/toast'

const PATIENT_EXCLUSIVE_PERMISSIONS = new Set(['care_plan.view_own'])

const EMPTY_FORM = {
  name: '',
  email: '',
  role_name: 'patient',
  is_active: true,
}

const EDIT_NS = 'usersPage.editor.editPage'

function getPermissionGroup(code) {
  return String(code || '').split('.')[0] || 'other'
}

function prettifyGroupName(group) {
  return group
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getPermissionGroupLabel(group, t) {
  return t(`${EDIT_NS}.permissionGroups.${group}`, prettifyGroupName(group))
}

function sortPermissionItems(left, right) {
  const leftLabel = left.description || left.code
  const rightLabel = right.description || right.code
  return leftLabel.localeCompare(rightLabel, undefined, { sensitivity: 'base' })
}

function getUserRole(userData) {
  return userData?.role || userData?.roles?.[0] || 'patient'
}

function normalizeRoleName(value) {
  return String(value || '').trim().toLowerCase()
}

function formatRoleLabel(value) {
  return String(value || '')
    .trim()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizePermissionList(permissionCodes) {
  return Array.from(new Set((permissionCodes || []).map((code) => String(code || '').trim()).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right)
  )
}

function permissionsAllowedForRole(roleName, permissionCodes) {
  const normalizedRoleName = normalizeRoleName(roleName)
  if (normalizedRoleName === 'patient') return normalizePermissionList(permissionCodes)
  return normalizePermissionList(
    (permissionCodes || []).filter((code) => !PATIENT_EXCLUSIVE_PERMISSIONS.has(code))
  )
}

export function AdminUserEditPage() {
  const { t } = useLanguage()
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [directPermissions, setDirectPermissions] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const visibleRoles = roles

  const roleMap = useMemo(
    () => new Map(visibleRoles.map((role) => [role.name, role])),
    [visibleRoles]
  )

  const roleOptions = useMemo(
    () => visibleRoles.map((role) => ({ value: role.name, label: formatRoleLabel(role.name) })),
    [visibleRoles]
  )

  const selectedRole = roleMap.get(normalizeRoleName(form.role_name)) || null
  const rolePermissionSet = useMemo(
    () => new Set(selectedRole?.permissions || []),
    [selectedRole]
  )
  const effectivePermissions = useMemo(
    () => normalizePermissionList([...rolePermissionSet, ...directPermissions]),
    [rolePermissionSet, directPermissions]
  )

  const groupedPermissions = useMemo(() => {
    const groups = new Map()

    permissions.forEach((permission) => {
      const group = getPermissionGroup(permission.code)
      if (!groups.has(group)) {
        groups.set(group, [])
      }
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

  const previewUser = user
    ? {
        ...user,
        name: form.name,
        email: form.email,
        role: normalizeRoleName(form.role_name) || getUserRole(user),
        roles: [normalizeRoleName(form.role_name) || getUserRole(user)],
        is_active: form.is_active,
        permissions: effectivePermissions,
      }
    : null

  function syncUserState(userData) {
    const roleName = getUserRole(userData)
    setUser(userData)
    setForm({
      name: userData?.name || '',
      email: userData?.email || '',
      role_name: roleName,
      is_active: Boolean(userData?.is_active),
    })
    setDirectPermissions(permissionsAllowedForRole(roleName, userData?.direct_permissions || []))
  }

  async function loadPage() {
    setLoading(true)
    setError('')

    try {
      const [userResponse, rolesResponse, permissionsResponse] = await Promise.all([
        api.get(`/admin/users/${userId}`),
        api.get('/admin/roles'),
        api.get('/admin/permissions'),
      ])

      const userData = getApiData(userResponse)
      const roleData = getApiData(rolesResponse) || []
      const permissionData = getApiData(permissionsResponse) || []

      setRoles(roleData)
      setPermissions(permissionData)
      syncUserState(userData)
    } catch (err) {
      setError(getApiErrorMessage(err, t(`${EDIT_NS}.loadFailed`)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage()
  }, [userId])

  function applyRoleSelection(rawValue) {
    const roleName = normalizeRoleName(rawValue)
    setForm((current) => ({ ...current, role_name: roleName || '' }))
    const inherited = new Set(roleMap.get(roleName)?.permissions || [])
    setDirectPermissions((current) =>
      permissionsAllowedForRole(roleName, current).filter((code) => !inherited.has(code))
    )
  }

  function togglePermission(code, checked) {
    if (rolePermissionSet.has(code)) return
    if (PATIENT_EXCLUSIVE_PERMISSIONS.has(code) && normalizeRoleName(form.role_name) !== 'patient') return
    setDirectPermissions((current) => {
      const next = new Set(current)
      if (checked) next.add(code)
      else next.delete(code)
      return Array.from(next).sort((left, right) => left.localeCompare(right))
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const normalizedRoleName = normalizeRoleName(form.role_name)
    const existingRole = roleMap.get(normalizedRoleName)
    if (!existingRole) {
      setSaving(false)
      notify.warning(t(`${EDIT_NS}.selectExistingRole`))
      return
    }

    let loadingToast

    try {
      loadingToast = notify.loading(t(`${EDIT_NS}.savingProfile`))

      await api.patch(`/admin/users/${userId}/access-profile`, {
        name: form.name,
        email: form.email,
        is_active: form.is_active,
        role_name: normalizedRoleName,
        direct_permissions: permissionsAllowedForRole(normalizedRoleName, directPermissions),
      })

      await loadPage()
      notify.dismiss(loadingToast)
      notify.success(t(`${EDIT_NS}.saved`))
    } catch (err) {
      notify.dismiss(loadingToast)
      notify.error(getApiErrorMessage(err, t(`${EDIT_NS}.saveFailed`)))
    } finally {
      setSaving(false)
    }
  }

  if (loading && !user) {
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
        eyebrow={t('usersPage.hero.eyebrow')}
        eyebrowIcon={Users}
        title={(() => {
          const displayName = form.name || user?.name
          return displayName ? t(`${EDIT_NS}.title`, { name: displayName }) : t(`${EDIT_NS}.titleFallback`)
        })()}
        description={t(`${EDIT_NS}.description`)}
        variant="simple"
        action={
          <>
            <Link to="/users" className="btn-secondary gap-2 rounded-2xl px-4 py-3">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Link>
            <button
              type="submit"
              form="admin-user-edit-form"
              className="btn-primary gap-2 rounded-2xl px-5 py-3 shadow-lg shadow-cyan-700/15"
              disabled={saving || loading || !user}
            >
              <Save className="h-4 w-4" />
              {saving ? t('usersPage.editor.actions.saving') : t('usersPage.editor.actions.saveChanges')}
            </button>
          </>
        }
      />

      {error ? <p className="error-box">{error}</p> : null}
      <div className="grid min-w-0 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <AdminUserSidebar user={previewUser} permissions={effectivePermissions} />

        <div className="space-y-5">
          <section className="surface p-5 sm:p-6">
            <div>
              <h2 className="section-title">{t(`${EDIT_NS}.detailsTitle`)}</h2>
              <p className="section-subtitle mt-1">{t(`${EDIT_NS}.detailsDescription`)}</p>
            </div>


            <form id="admin-user-edit-form" className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <label className="block md:col-span-2">
                <span className="label-text">{t('usersPage.editor.fields.fullName')}</span>
                <input
                  className="input-base"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                  disabled={loading || saving}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="label-text">{t('usersPage.editor.fields.email')}</span>
                <input
                  className="input-base"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                  disabled={loading || saving}
                />
              </label>

              <label className="block">
                <span className="label-text">{t(`${EDIT_NS}.roleLabel`)}</span>
                <AppSelect
                  value={form.role_name}
                  options={roleOptions}
                  disabled={loading || saving}
                  onValueChange={applyRoleSelection}
                />
              </label>

              <label className="block">
                <span className="label-text">{t('usersPage.editor.fields.status')}</span>
                <AppSelect
                  value={form.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setForm((current) => ({ ...current, is_active: value === 'active' }))}
                  options={[
                    { value: 'active', label: t('common.active') },
                    { value: 'inactive', label: t('common.inactive') },
                  ]}
                  disabled={loading || saving}
                />
              </label>
            </form>
          </section>

          <section className="surface p-5 sm:p-6">
            <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                <div>
                  <h2 className="section-title">{t(`${EDIT_NS}.permissionsTitle`)}</h2>
                  <p className="section-subtitle mt-1">{t(`${EDIT_NS}.permissionsDescription`)}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              {groupedPermissions.length ? (
                groupedPermissions.map((group) => (
                  <div key={group.key}>
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{group.label}</h3>
                    <div className="mt-3 space-y-3">
                      {group.items.map((permission) => {
                        const inherited = rolePermissionSet.has(permission.code)
                        const individuallyGranted = directPermissions.includes(permission.code)
                        const checked = inherited || individuallyGranted
                        const patientOnlyLocked =
                          PATIENT_EXCLUSIVE_PERMISSIONS.has(permission.code) &&
                          normalizeRoleName(form.role_name) !== 'patient'
                        const permissionLocked = inherited || patientOnlyLocked
                        return (
                          <label
                            key={permission.code}
                            title={
                              patientOnlyLocked
                                ? t(`${EDIT_NS}.patientOnlyPermission`)
                                : inherited
                                  ? t(`${EDIT_NS}.inheritedPermission`)
                                  : undefined
                            }
                            className={`flex items-start gap-3 ${permissionLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                          >
                            <Checkbox
                              checked={checked}
                              disabled={loading || saving || permissionLocked}
                              aria-label={permission.description || permission.code}
                              onCheckedChange={(value) => togglePermission(permission.code, value === true)}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{permission.description || permission.code}</p>
                              {patientOnlyLocked && (
                                <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                                  <Lock className="h-3 w-3" />
                                  {t(`${EDIT_NS}.patientOnlyPermission`)}
                                </p>
                              )}
                              {inherited && !patientOnlyLocked && (
                                <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                  <Lock className="h-3 w-3" />
                                  {t(`${EDIT_NS}.inheritedPermission`)}
                                </p>
                              )}
                              {individuallyGranted && !inherited && (
                                <p className="mt-0.5 text-xs font-medium text-cyan-700 dark:text-cyan-400">
                                  {t(`${EDIT_NS}.individualPermission`)}
                                </p>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${EDIT_NS}.noPermissions`)}</p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:flex-wrap">
              <button
                type="submit"
                form="admin-user-edit-form"
                className="btn-primary gap-2"
                disabled={saving || loading || !user}
              >
                <Save className="h-4 w-4" />
                {saving ? t('usersPage.editor.actions.saving') : t('usersPage.editor.actions.saveChanges')}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/users')}
                disabled={saving}
              >
                {t('common.cancel')}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
