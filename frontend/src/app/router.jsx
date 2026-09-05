import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ProtectedRoute } from '../components/guards/ProtectedRoute'
import { RoleGuard } from '../components/guards/RoleGuard'
import { ProfileGate } from '../components/guards/ProfileGate'
import { AppLayout } from '../components/layout/AppLayout'
import { RouteLoading } from '../components/RouteLoading'
import { UnauthorizedPage } from '../pages/public/UnauthorizedPage'
import { NotFoundPage } from '../pages/public/NotFoundPage'

/*
 * Route-level code splitting: each page ships as its own chunk and is fetched
 * on first navigation, keeping the initial bundle small (the landing/login
 * screens no longer download admin, chart, or rule-editor code). Tiny shared
 * pages (404 / unauthorized) stay eagerly imported to avoid extra chunks.
 */
const LandingPage = lazy(() => import('../pages/LandingPage').then((m) => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const SignUpPage = lazy(() => import('../pages/SignUpPage').then((m) => ({ default: m.SignUpPage })))
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const DiagnosisPage = lazy(() => import('../pages/DiagnosisPage').then((m) => ({ default: m.DiagnosisPage })))
const DiagnosisResultPage = lazy(() => import('../pages/DiagnosisResultPage').then((m) => ({ default: m.DiagnosisResultPage })))
const PatientsPage = lazy(() => import('../pages/PatientsPage').then((m) => ({ default: m.PatientsPage })))
const PatientHistoryPage = lazy(() => import('../pages/PatientHistoryPage').then((m) => ({ default: m.PatientHistoryPage })))
const RulesPage = lazy(() => import('../pages/RulesPage').then((m) => ({ default: m.RulesPage })))
const ReviewPage = lazy(() => import('../pages/ReviewPage').then((m) => ({ default: m.ReviewPage })))
const DiagnosisHistoryPage = lazy(() => import('../pages/DiagnosisHistoryPage').then((m) => ({ default: m.DiagnosisHistoryPage })))
const CarePlanPage = lazy(() => import('../pages/CarePlanPage').then((m) => ({ default: m.CarePlanPage })))
const ProfileSetupPage = lazy(() => import('../pages/ProfileSetupPage').then((m) => ({ default: m.ProfileSetupPage })))
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const AdminPage = lazy(() => import('../pages/AdminPage').then((m) => ({ default: m.AdminPage })))
const AdminUserEditPage = lazy(() => import('../pages/AdminUserEditPage').then((m) => ({ default: m.AdminUserEditPage })))
const RolePermissionsPage = lazy(() => import('../pages/RolePermissionsPage').then((m) => ({ default: m.RolePermissionsPage })))

function MyResultRedirect() {
  const { id } = useParams()
  return <Navigate to={`/diagnosis/result?diagnosis_result_id=${id}`} replace />
}

function AuthenticatedRoutes() {
  const { user, logout } = useAuth()

  return (
    <Routes>
      {/* Redirect auth pages to dashboard if already logged in */}
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/sign-up" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth/sign-in" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth/sign-up" element={<Navigate to="/dashboard" replace />} />

      {/* ProfileGate is a pathless layout route: patients with an incomplete
          health profile are redirected to the wizard; everyone else passes
          through to the standalone setup page or the app shell below. */}
      <Route element={<ProtectedRoute user={user}><ProfileGate /></ProtectedRoute>}>
        {/* First-login health profile wizard — standalone page, no app chrome */}
        <Route path="/profile-setup" element={<ProfileSetupPage />} />

        {/* App shell (sidebar + topbar) around every other authenticated page */}
        <Route element={<AppLayout />}>
        {/* Dashboard is no longer at root, but at /dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* If user tries to access / direct to dashboard (managed by AppRouter mostly) */}
        {/* But we'll keep this as a fallback redirect */}

        <Route
          path="/diagnosis"
          element={(
            <RoleGuard user={user} permissions={['diagnosis.run']}>
              <DiagnosisPage />
            </RoleGuard>
          )}
        />
        {/* ... existing routes ... */}
        <Route
          path="/diagnosis/result"
          element={(
            <RoleGuard user={user} permissions={['diagnosis.run', 'diagnosis.view_own']} permissionMode="any">
              <DiagnosisResultPage />
            </RoleGuard>
          )}
        />
        <Route
          path="/my-results/:id"
          element={(
            <RoleGuard user={user} permissions={['diagnosis.run', 'diagnosis.view_own']} permissionMode="any">
              <MyResultRedirect />
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
          path="/care-plan"
          element={
            <RoleGuard user={user} roles={['patient']} permissions={['diagnosis.view_own']}>
              <CarePlanPage />
            </RoleGuard>
          }
        />

        {/* Profile page — available to every authenticated user; the page itself
            adapts (health profile section renders for patient accounts only). */}
        <Route path="/profile" element={<ProfilePage />} />

        <Route
          path="/users"
          element={(
            <RoleGuard user={user} permissions={['user.view', 'permission.view']} permissionMode="any">
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
      </Route>
    </Routes>
  )
}

function PublicRoutes() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/auth/sign-in" element={<Navigate to="/login" replace />} />
        <Route path="/auth/sign-up" element={<Navigate to="/sign-up" replace />} />
        <Route path="/unauthorized" element={<UnauthorizedPage isAuthenticated={false} />} />
        <Route path="/not-found" element={<NotFoundPage isAuthenticated={false} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export function AppRouter() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Root is ALWAYS the Landing Page */}
      <Route
        path="/"
        element={(
          <Suspense fallback={<RouteLoading />}>
            <LandingPage />
          </Suspense>
        )}
      />

      {/* Wildcard to sub-routers */}
      <Route path="/*" element={user ? <AuthenticatedRoutes /> : <PublicRoutes />} />
    </Routes>
  )
}
