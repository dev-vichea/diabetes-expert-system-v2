import { Navigate, useLocation } from 'react-router-dom'

export function RoleGuard({ user, roles, permissions, children }) {
  const location = useLocation()
  const userRoles = new Set(user?.roles || (user?.role ? [user.role] : []))

  if (roles && roles.every((roleName) => !userRoles.has(roleName))) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />
  }

  if (permissions && permissions.some((permissionCode) => !(user.permissions || []).includes(permissionCode))) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />
  }

  return children
}
