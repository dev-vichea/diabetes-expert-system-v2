import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthUser } from '../hooks/useAuthUser'
import { ProtectedRoute } from '../components/guards/ProtectedRoute'
import { RoleGuard } from '../components/guards/RoleGuard'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../pages/LoginPage'
import { SignUpPage } from '../pages/SignUpPage'
import { DashboardPage } from '../pages/DashboardPage'
import { DiagnosisPage } from '../pages/DiagnosisPage'
import { DiagnosisResultPage } from '../pages/DiagnosisResultPage'
import { PatientsPage } from '../pages/PatientsPage'
import { PatientHistoryPage } from '../pages/PatientHistoryPage'
import { RulesPage } from '../pages/RulesPage'
import { ReviewPage } from '../pages/ReviewPage'
import { DiagnosisHistoryPage } from '../pages/DiagnosisHistoryPage'
import { AdminPage } from '../pages/AdminPage'
import { AdminUserEditPage } from '../pages/AdminUserEditPage'
import { UnauthorizedPage } from '../pages/public/UnauthorizedPage'
import { NotFoundPage } from '../pages/public/NotFoundPage'

function AuthenticatedRoutes({ user, logout }) {
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/sign-up" element={<Navigate to="/" replace />} />
      <Route path="/auth/sign-in" element={<Navigate to="/" replace />} />
      <Route path="/auth/sign-up" element={<Navigate to="/" replace />} />

      <Route
        element={(
          <ProtectedRoute user={user}>
            <AppLayout user={user} onLogout={logout} />
          </ProtectedRoute>
        )}
      >
        <Route path="/" element={<DashboardPage user={user} />} />

        <Route
          path="/diagnosis"
          element={(
            <RoleGuard user={user} permissions={['diagnosis.run']}>
              <DiagnosisPage user={user} />
            </RoleGuard>
          )}
        />

        <Route
          path="/diagnosis/result"
          element={(
            <RoleGuard user={user} permissions={['diagnosis.run']}>
              <DiagnosisResultPage user={user} />
            </RoleGuard>
          )}
        />

        <Route
          path="/patients"
          element={(
            <RoleGuard user={user} permissions={['patient.view']}>
              <PatientsPage />
            </RoleGuard>
          )}
        />

        <Route
          path="/patients/:patientId"
          element={(
            <RoleGuard user={user} permissions={['patient.view']}>
              <PatientHistoryPage user={user} />
            </RoleGuard>
          )}
        />

        <Route
          path="/rules"
          element={(
            <RoleGuard user={user} permissions={['rule.view']}>
              <RulesPage />
            </RoleGuard>
          )}
        />

        <Route
          path="/review"
          element={(
            <RoleGuard user={user} permissions={['diagnosis.review_any']}>
              <ReviewPage />
            </RoleGuard>
          )}
        />

        <Route
          path="/my-results"
          element={(
            <RoleGuard user={user} permissions={['diagnosis.view_own']}>
              <DiagnosisHistoryPage />
            </RoleGuard>
          )}
        />

        <Route path="/admin" element={<Navigate to="/users" replace />} />

        <Route
          path="/users"
          element={(
            <RoleGuard user={user} permissions={['user.view', 'permission.view']}>
              <AdminPage user={user} />
            </RoleGuard>
          )}
        />

        <Route
          path="/users/:userId/edit"
          element={(
            <RoleGuard user={user} permissions={['user.view', 'permission.view', 'user.manage', 'permission.manage']}>
              <AdminUserEditPage user={user} />
            </RoleGuard>
          )}
        />

        <Route path="/unauthorized" element={<UnauthorizedPage isAuthenticated />} />
        <Route path="/not-found" element={<NotFoundPage isAuthenticated />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Route>
    </Routes>
  )
}

function PublicRoutes({ setUser }) {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage setUser={setUser} />} />
      <Route path="/sign-up" element={<SignUpPage setUser={setUser} />} />
      <Route path="/auth/sign-in" element={<Navigate to="/login" replace />} />
      <Route path="/auth/sign-up" element={<Navigate to="/sign-up" replace />} />
      <Route path="/unauthorized" element={<UnauthorizedPage isAuthenticated={false} />} />
      <Route path="/not-found" element={<NotFoundPage isAuthenticated={false} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export function AppRouter() {
  const { user, setUser, logout } = useAuthUser()

  if (user) {
    return <AuthenticatedRoutes user={user} logout={logout} />
  }

  return <PublicRoutes setUser={setUser} />
}
