import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Redirects patients with an incomplete health profile to the step-by-step
 * profile setup page. Staff accounts (no patient profile) pass through.
 */
export function ProfileGate() {
  const { user } = useAuth()
  const location = useLocation()

  const roles = new Set(user?.roles || (user?.role ? [user.role] : []))
  const isPatient = roles.has('patient')
  const profileCompleted = Boolean(user?.profile_completed)
  const onSetupPage = location.pathname.startsWith('/profile-setup')

  if (isPatient && !profileCompleted && !onSetupPage) {
    return <Navigate to="/profile-setup" replace />
  }

  return <Outlet />
}
