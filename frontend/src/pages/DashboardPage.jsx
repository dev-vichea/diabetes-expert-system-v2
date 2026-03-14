import { useMemo } from 'react'
import { ClinicalDashboardPage } from '@/pages/dashboard/ClinicalDashboardPage'
import { PatientDashboardPage } from '@/pages/dashboard/PatientDashboardPage'

export function DashboardPage({ user }) {
  const userRoles = useMemo(() => new Set(user?.roles || (user?.role ? [user.role] : [])), [user])
  const userPermissions = useMemo(() => new Set(user?.permissions || []), [user])
  const hasClinicalAccess = userRoles.has('doctor') || userRoles.has('admin') || userRoles.has('super_admin') || userPermissions.has('patient.view')
  const isPatientExperience = userRoles.has('patient') && !hasClinicalAccess
  const activeRole = user?.roles?.[0] || user?.role || 'user'

  if (isPatientExperience) {
    return <PatientDashboardPage user={user} />
  }

  return <ClinicalDashboardPage activeRole={activeRole} />
}
