import { useMemo } from 'react'

export function useRoleAccess(user) {
  const userRoles = useMemo(() => new Set(user?.roles || (user?.role ? [user.role] : [])), [user])
  const userPermissions = useMemo(() => new Set(user?.permissions || []), [user])

  return {
    userRoles,
    userPermissions,
    isPatient: userRoles.has('patient'),
    isAdmin: userRoles.has('admin') || userRoles.has('super_admin'),
    canViewPatients: userPermissions.has('patient.view'),
    canManageRules: userPermissions.has('rule.view'),
    canReview: userPermissions.has('diagnosis.review_any'),
  }
}
