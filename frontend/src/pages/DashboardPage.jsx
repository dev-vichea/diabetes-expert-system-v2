import { Suspense, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { RouteLoading } from '@/components/RouteLoading'
import { lazyWithRetry } from '@/lib/lazyWithRetry'

// Split dashboards so patient users don't download the chart-heavy clinical
// dashboard (recharts) and clinical users don't download the patient panel.
const ClinicalDashboardPage = lazyWithRetry(() => import('@/pages/dashboard/ClinicalDashboardPage').then((m) => ({ default: m.ClinicalDashboardPage })))
const PatientDashboardPage = lazyWithRetry(() => import('@/pages/dashboard/PatientDashboardPage').then((m) => ({ default: m.PatientDashboardPage })))

export function DashboardPage() {
  const { user } = useAuth()
  const userRoles = useMemo(() => new Set(user?.roles || (user?.role ? [user.role] : [])), [user])
  const userPermissions = useMemo(() => new Set(user?.permissions || []), [user])
  const hasClinicalAccess = userRoles.has('doctor') || userRoles.has('admin') || userRoles.has('super_admin') || userPermissions.has('patient.view')
  const isPatientExperience = userRoles.has('patient') && !hasClinicalAccess
  const activeRole = user?.roles?.[0] || user?.role || 'user'

  if (isPatientExperience) {
    return (
      <Suspense fallback={<RouteLoading />}>
        <PatientDashboardPage />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<RouteLoading />}>
      <ClinicalDashboardPage activeRole={activeRole} />
    </Suspense>
  )
}
