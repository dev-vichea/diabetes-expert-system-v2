import { useMemo } from 'react'

export function useRoleAccess(user) {
  const userRoles = useMemo(() => new Set(user?.roles || (user?.role ? [user.role] : [])), [user])
  const userPermissions = useMemo(() => new Set(user?.permissions || []), [user])

  return {
    userRoles,
    userPermissions,
    isPatient: userRoles.has('patient'),
    isAdmin: userRoles.has('admin'),
    canViewPatients: userPermissions.has('patient.view'),
    canManageRules: userPermissions.has('rule.view'),
    canReview: userPermissions.has('diagnosis.review_any'),
    canUseAssistant: userPermissions.has('assistant.use'),
    canViewTreatmentPlans: userPermissions.has('treatment_plan.view'),
    canManageTreatmentPlans: userPermissions.has('treatment_plan.manage'),
    canViewOwnCarePlan: userPermissions.has('care_plan.view_own'),
    canViewGuide: userPermissions.has('guide.view'),
    canViewNotifications: userPermissions.has('notification.view'),
  }
}
