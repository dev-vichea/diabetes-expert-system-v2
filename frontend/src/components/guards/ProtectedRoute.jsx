import { Navigate, useLocation } from 'react-router-dom'

export function ProtectedRoute({ user, children }) {
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
