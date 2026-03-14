import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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

const PERMISSION_GROUP_LABELS = {
  user: 'Users',
  permission: 'Roles & Permissions',
  patient: 'Patients',
  symptom: 'Symptoms',
  lab: 'Lab Results',
  rule: 'Rules',
  diagnosis: 'Diagnosis',
}

function getPermissionGroup(code) {
  return String(code || '').split('.')[0] || 'other'
}

function getPermissionGroupLabel(group) {
  if (PERMISSION_GROUP_LABELS[group]) return PERMISSION_GROUP_LABELS[group]
  return group
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
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

function RoleCombobox({ value, options, disabled, onValueChange }) {
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
        label: `Create role "${inputValue}"`,
        isCreate: true,
      },
    ]
  }, [hasExactMatch, inputValue, normalizedInput, options])

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
      <ComboboxInput disabled={disabled} placeholder="Select or type role name" autoComplete="off" />
      <ComboboxContent>
        <ComboboxEmpty>{normalizedInput ? 'No matching roles.' : 'No roles available.'}</ComboboxEmpty>
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

export function AdminUserEditPage({ user: currentUser }) {
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
      .sort(([left], [right]) => getPermissionGroupLabel(left).localeCompare(getPermissionGroupLabel(right), undefined, { sensitivity: 'base' }))
      .map(([group, items]) => ({
        key: group,
        label: getPermissionGroupLabel(group),
        items: [...items].sort(sortPermissionItems),
      }))
  }, [permissions])

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
      setError(getApiErrorMessage(err, 'Failed to load user details'))
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
      notify.warning('Enter a name for the custom role before saving.')
      return
    }

    let loadingToast

    try {
      const existingRole = roleMap.get(normalizedRoleName)
      if (existingRole && !samePermissions(selectedPermissions, existingRole.permissions || [])) {
        notify.warning('That role name already exists with different permissions. Use another name.')
        setSaving(false)
        return
      }

      loadingToast = notify.loading('Saving user access profile...')

      await api.patch(`/admin/users/${userId}/access-profile`, {
        name: form.name,
        email: form.email,
        is_active: form.is_active,
        role_name: normalizedRoleName,
        permissions: normalizePermissionList(selectedPermissions),
        role_description: `Custom role for ${form.name || 'user'}`,
      })

      await loadPage()
      notify.dismiss(loadingToast)
      notify.success(existingRole ? 'User updated successfully.' : 'New role created and assigned successfully.')
    } catch (err) {
      notify.dismiss(loadingToast)
      notify.error(getApiErrorMessage(err, 'Failed to update user'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeroCard
        eyebrow="User Management"
        eyebrowIcon={Users}
        title={form.name ? `Edit ${form.name}` : user?.name ? `Edit ${user.name}` : 'Edit User'}
        description="Update user information, choose a role, or create a new role from permission selections."
        variant="simple"
        action={
          <>
            <Link to="/users" className="btn-secondary gap-2 rounded-2xl px-4 py-3">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <button
              type="submit"
              form="admin-user-edit-form"
              className="btn-primary gap-2 rounded-2xl px-5 py-3 shadow-lg shadow-cyan-700/15"
              disabled={saving || loading || !user}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      />

      {error ? <p className="error-box">{error}</p> : null}
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <AdminUserSidebar user={previewUser} permissions={selectedPermissions} />

        <div className="space-y-5">
          <section className="surface p-5 sm:p-6">
            <div>
              <h2 className="section-title">User Details</h2>
              <p className="section-subtitle mt-1">Edit account identity, status, and role assignment from one form.</p>
            </div>

            {loading ? <p className="state-box mt-4">Loading user details...</p> : null}

            <form id="admin-user-edit-form" className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <label className="block md:col-span-2">
                <span className="label-text">Full Name</span>
                <input
                  className="input-base"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                  disabled={loading || saving}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="label-text">Email</span>
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
                <span className="label-text">Role / Custom Role Name</span>
                <RoleCombobox
                  value={form.role_name}
                  options={roleOptions}
                  disabled={loading || saving}
                  onValueChange={applyRoleSelection}
                />
              </label>

              <label className="block">
                <span className="label-text">Account Status</span>
                <AppSelect
                  value={form.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setForm((current) => ({ ...current, is_active: value === 'active' }))}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                  disabled={loading || saving}
                />
              </label>
            </form>
          </section>

          <section className="surface p-5 sm:p-6">
            <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                <div>
                  <h2 className="section-title">Permissions</h2>
                  <p className="section-subtitle mt-1">Check permissions for this role. If they differ from an existing role, save with a new role name.</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
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
                <p className="text-sm text-slate-500 dark:text-slate-400">No permissions are available.</p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <button
                type="submit"
                form="admin-user-edit-form"
                className="btn-primary gap-2"
                disabled={saving || loading || !user}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/users')}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
