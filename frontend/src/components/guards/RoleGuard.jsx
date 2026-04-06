import { Navigate, useLocation } from 'react-router-dom'

/**
 * RoleGuard – gate a route by roles and/or permissions.
 *
 * @param {object}   user          – current JWT user from AuthContext
 * @param {string[]} [roles]       – allow if the user has ANY of these roles
 * @param {string[]} [permissions] – allow if the user has ALL of these permissions (AND, default)
 * @param {'all'|'any'} [permissionMode='all'] – 'any' = user needs at least ONE, 'all' = needs every one
 */
export function RoleGuard({ user, roles, permissions, permissionMode = 'all', children }) {
  const location = useLocation()
  const userRoles = new Set(user?.roles || (user?.role ? [user.role] : []))
  const userPermissions = new Set(user?.permissions || [])

  // Role check – user must have at least ONE of the specified roles
  if (roles?.length && roles.every((roleName) => !userRoles.has(roleName))) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />
  }

  // Permission check – configurable AND vs OR
  if (permissions?.length) {
    const hasAccess = permissionMode === 'any'
      ? permissions.some((p) => userPermissions.has(p))
      : permissions.every((p) => userPermissions.has(p))

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />
    }
  }

  return children
}
