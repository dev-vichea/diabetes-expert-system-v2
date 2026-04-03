import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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
import { RolePermissionsPage } from '../pages/RolePermissionsPage'
import { UnauthorizedPage } from '../pages/public/UnauthorizedPage'
import { NotFoundPage } from '../pages/public/NotFoundPage'

function AuthenticatedRoutes() {
  const { user, logout } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/sign-up" element={<Navigate to="/" replace />} />
      <Route path="/auth/sign-in" element={<Navigate to="/" replace />} />
      <Route path="/auth/sign-up" element={<Navigate to="/" replace />} />

      <Route
        element={(
          <ProtectedRoute user={user}>
            <AppLayout />
          </ProtectedRoute>
        )}
      >
        <Route path="/" element={<DashboardPage />} />

        <Route
          path="/diagnosis"
          element={(
            <RoleGuard user={user} permissions={['diagnosis.run']}>
              <DiagnosisPage />
            </RoleGuard>
          )}
        />

        <Route
          path="/diagnosis/result"
          element={(
            <RoleGuard user={user} permissions={['diagnosis.run']}>
              <DiagnosisResultPage />
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
              <PatientHistoryPage />
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
              <AdminPage />
            </RoleGuard>
          )}
        />

        <Route
          path="/users/:userId/edit"
          element={(
            <RoleGuard user={user} permissions={['user.view', 'permission.view', 'user.manage', 'permission.manage']}>
              <AdminUserEditPage />
            </RoleGuard>
          )}
        />

        <Route
          path="/roles-permissions"
          element={(
            <RoleGuard user={user} permissions={['permission.view']}>
              <RolePermissionsPage />
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

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/auth/sign-in" element={<Navigate to="/login" replace />} />
      <Route path="/auth/sign-up" element={<Navigate to="/sign-up" replace />} />
      <Route path="/unauthorized" element={<UnauthorizedPage isAuthenticated={false} />} />
      <Route path="/not-found" element={<NotFoundPage isAuthenticated={false} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export function AppRouter() {
  const { user } = useAuth()

  if (user) {
    return <AuthenticatedRoutes />
  }

  return <PublicRoutes />
}
