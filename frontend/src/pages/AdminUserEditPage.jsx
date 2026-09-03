import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { ArrowLeft, Save, Shield, Users } from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { AdminHeroCard } from '@/components/admin'
import { AdminUserSidebar } from '@/components/admin/AdminUserSidebar'
import { AppSelect, Checkbox, Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui'
import { notify } from '@/lib/toast'

const CUSTOM_ROLE_DRAFT = 'custom'

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

function samePermissions(left, right) {
  const a = normalizePermissionList(left)
  const b = normalizePermissionList(right)
  if (a.length !== b.length) return false
  return a.every((code, index) => code === b[index])
}

function RoleCombobox({ value, options, disabled, onValueChange, t }) {
  const inputValue = value === CUSTOM_ROLE_DRAFT ? '' : value
  const normalizedInput = normalizeRoleName(inputValue)
  const selectedOption = useMemo(
    () => options.find((option) => option.value === normalizedInput) || null,
    [normalizedInput, options]
  )
  const hasExactMatch = options.some((option) => option.value === normalizedInput)
  const items = useMemo(() => {
    if (!normalizedInput || hasExactMatch) return options
    return [
      ...options,
      {
        value: normalizedInput,
        label: t(`${EDIT_NS}.createRoleOption`, { name: inputValue }),
        isCreate: true,
      },
    ]
  }, [hasExactMatch, inputValue, normalizedInput, options, t])

  return (
    <Combobox
      items={items}
      value={selectedOption}
      inputValue={inputValue}
      disabled={disabled}
      openOnInputClick
      itemToStringLabel={(item) => item?.value || ''}
      itemToStringValue={(item) => item?.value || ''}
      isItemEqualToValue={(item, selected) => item?.value === selected?.value && Boolean(item?.isCreate) === Boolean(selected?.isCreate)}
      onInputValueChange={(nextValue) => onValueChange(nextValue)}
      onValueChange={(nextValue) => {
        if (!nextValue) return
        onValueChange(nextValue.value)
      }}
    >
      <ComboboxInput disabled={disabled} placeholder={t(`${EDIT_NS}.rolePlaceholder`)} autoComplete="off" />
      <ComboboxContent>
        <ComboboxEmpty>{normalizedInput ? t(`${EDIT_NS}.noMatchingRoles`) : t(`${EDIT_NS}.noRolesAvailable`)}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem
              key={`${item.isCreate ? 'create' : 'role'}-${item.value}`}
              value={item}
              className={item.isCreate ? 'border border-dashed border-cyan-200 bg-cyan-50/60 dark:border-cyan-500/20 dark:bg-cyan-500/5' : undefined}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {item.isCreate ? item.label : formatRoleLabel(item.label)}
                </p>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export function AdminUserEditPage() {
  const { user: currentUser } = useAuth()
  const { t } = useLanguage()
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const currentActorRoles = useMemo(
    () => new Set(currentUser?.roles || (currentUser?.role ? [currentUser.role] : [])),
    [currentUser]
  )
  const actorIsSuperAdmin = currentActorRoles.has('super_admin')

  const visibleRoles = useMemo(
    () => roles.filter((role) => actorIsSuperAdmin || role.name !== 'super_admin'),
    [actorIsSuperAdmin, roles]
  )

  const roleMap = useMemo(
    () => new Map(visibleRoles.map((role) => [role.name, role])),
    [visibleRoles]
  )

  const roleOptions = useMemo(
    () => visibleRoles.map((role) => ({ value: role.name, label: role.name })),
    [visibleRoles]
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
    setSelectedPermissions(normalizePermissionList(userData?.permissions || []))
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

    const matchedRole = roleMap.get(roleName)
    if (matchedRole) {
      setSelectedPermissions(normalizePermissionList(matchedRole.permissions || []))
    }
  }

  function togglePermission(code, checked) {
    setSelectedPermissions((current) => {
      const next = new Set(current)
      if (checked) next.add(code)
      else next.delete(code)

      const nextPermissions = Array.from(next).sort((left, right) => left.localeCompare(right))
      const currentRole = roleMap.get(normalizeRoleName(form.role_name))
      if (currentRole && !samePermissions(nextPermissions, currentRole.permissions || [])) {
        setForm((currentForm) => ({ ...currentForm, role_name: CUSTOM_ROLE_DRAFT }))
      }

      return nextPermissions
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const normalizedRoleName = normalizeRoleName(form.role_name)
    if (!normalizedRoleName || normalizedRoleName === CUSTOM_ROLE_DRAFT) {
      setSaving(false)
      notify.warning(t(`${EDIT_NS}.enterCustomRoleName`))
      return
    }

    let loadingToast

    try {
      const existingRole = roleMap.get(normalizedRoleName)
      if (existingRole && !samePermissions(selectedPermissions, existingRole.permissions || [])) {
        notify.warning(t(`${EDIT_NS}.roleNameConflict`))
        setSaving(false)
        return
      }

      loadingToast = notify.loading(t(`${EDIT_NS}.savingProfile`))

      await api.patch(`/admin/users/${userId}/access-profile`, {
        name: form.name,
        email: form.email,
        is_active: form.is_active,
        role_name: normalizedRoleName,
        permissions: normalizePermissionList(selectedPermissions),
        role_description: t(`${EDIT_NS}.customRoleDescription`, {
          name: form.name || t(`${EDIT_NS}.customRoleFallbackName`),
        }),
      })

      await loadPage()
      notify.dismiss(loadingToast)
      notify.success(existingRole ? t(`${EDIT_NS}.saved`) : t(`${EDIT_NS}.roleCreated`))
    } catch (err) {
      notify.dismiss(loadingToast)
      notify.error(getApiErrorMessage(err, t(`${EDIT_NS}.saveFailed`)))
    } finally {
      setSaving(false)
    }
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
        <AdminUserSidebar user={previewUser} permissions={selectedPermissions} />

        <div className="space-y-5">
          <section className="surface p-5 sm:p-6">
            <div>
              <h2 className="section-title">{t(`${EDIT_NS}.detailsTitle`)}</h2>
              <p className="section-subtitle mt-1">{t(`${EDIT_NS}.detailsDescription`)}</p>
            </div>

            {loading ? <p className="state-box mt-4">{t(`${EDIT_NS}.loading`)}</p> : null}

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
                <RoleCombobox
                  value={form.role_name}
                  options={roleOptions}
                  disabled={loading || saving}
                  onValueChange={applyRoleSelection}
                  t={t}
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
                        const checked = selectedPermissions.includes(permission.code)
                        return (
                          <label key={permission.code} className="flex items-start gap-3">
                            <Checkbox
                              checked={checked}
                              disabled={loading || saving}
                              aria-label={permission.description || permission.code}
                              onCheckedChange={(value) => togglePermission(permission.code, value === true)}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{permission.description || permission.code}</p>
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
