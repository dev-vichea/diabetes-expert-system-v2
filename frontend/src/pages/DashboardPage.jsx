import { Suspense, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { RouteLoading } from '@/components/RouteLoading'
import { lazyWithRetry } from '@/lib/lazyWithRetry'

// Split dashboards so patient users don't download the chart-heavy clinical
// dashboard (recharts) and clinical users don't download the patient panel.
const ClinicalDashboardPage = lazyWithRetry(() => import('@/pages/dashboard/ClinicalDashboardPage').then((m) => ({ default: m.ClinicalDashboardPage })))
const PatientDashboardPage = lazyWithRetry(() => import('@/pages/dashboard/PatientDashboardPage').then((m) => ({ default: m.PatientDashboardPage })))
const AdminPage = lazyWithRetry(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })))

export function DashboardPage() {
  const { user } = useAuth()
  const userPermissions = useMemo(() => new Set(user?.permissions || []), [user])
  const isAdminExperience =
    userPermissions.has('analytics.view') &&
    userPermissions.has('user.view') &&
    userPermissions.has('permission.view')
  const hasClinicalAccess = userPermissions.has('analytics.view') || userPermissions.has('patient.view')
  const isPatientExperience = userPermissions.has('patient.view_own') && !hasClinicalAccess
  const activeRole = user?.roles?.[0] || user?.role || 'user'

  if (isPatientExperience) {
    return (
      <Suspense fallback={<RouteLoading />}>
        <PatientDashboardPage />
      </Suspense>
    )
  }

  if (isAdminExperience) {
    return (
      <Suspense fallback={<RouteLoading />}>
        <AdminPage view="dashboard" />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<RouteLoading />}>
      <ClinicalDashboardPage activeRole={activeRole} />
    </Suspense>
  )
}
