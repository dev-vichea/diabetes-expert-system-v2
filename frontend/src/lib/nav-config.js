import {
  ActivitySquare,
  BookMarked,
  ClipboardList,
  LayoutDashboard,
  Microscope,
  ShieldCheck,
  Users,
} from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'workspace' },
  { to: '/diagnosis', label: 'Assessment', icon: Microscope, section: 'workspace', permissions: ['diagnosis.run'] },
  { to: '/patients', label: 'Patients', icon: Users, section: 'workspace', permissions: ['patient.view'] },
  { to: '/rules', label: 'Knowledge Base', icon: BookMarked, section: 'workspace', permissions: ['rule.view'] },
  { to: '/review', label: 'Patient Review', icon: ClipboardList, section: 'workspace', permissions: ['diagnosis.review_any'] },
  { to: '/my-results', label: 'My Results', icon: ActivitySquare, section: 'workspace', permissions: ['diagnosis.view_own'] },
  { to: '/users', label: 'Users', icon: ShieldCheck, section: 'system', permissions: ['user.view', 'permission.view'] },
]

export const PAGE_TITLE_BY_PATH = [
  { pattern: '/unauthorized', title: 'Unauthorized', subtitle: 'You do not have access to this resource' },
  { pattern: '/not-found', title: 'Not Found', subtitle: 'The requested page could not be found' },
  { pattern: '/diagnosis/result', title: 'Assessment Result', subtitle: 'Readable clinical summary from your assessment output' },
  { pattern: '/diagnosis', title: 'Assessment Workspace', subtitle: 'Collect patient facts and run expert inference' },
  { pattern: '/patients', title: 'Patient Management', subtitle: 'Profiles, symptoms, labs, and diagnosis timelines' },
  { pattern: '/rules', title: 'Knowledge Base', subtitle: 'Rule authoring, history, and governance' },
  { pattern: '/review', title: 'Clinical Review', subtitle: 'Annotate and triage diagnosis outcomes' },
  { pattern: '/my-results', title: 'My Diagnosis Results', subtitle: 'Track your diagnosis history and feedback' },
  { pattern: '/users', title: 'Users', subtitle: 'Manage user access, roles, and account status' },
  { pattern: '/', title: 'Dashboard', subtitle: 'Operational overview by role' },
]

export function getPageInfo(pathname) {
  const matched = PAGE_TITLE_BY_PATH.find((item) => pathname === item.pattern || pathname.startsWith(`${item.pattern}/`))
  return matched || PAGE_TITLE_BY_PATH[PAGE_TITLE_BY_PATH.length - 1]
}

function hasAccess(user, item) {
  const userRoles = new Set(user?.roles || (user?.role ? [user.role] : []))
  const userPermissions = new Set(user?.permissions || [])

  if (item.roles?.length && item.roles.every((role) => !userRoles.has(role))) {
    return false
  }

  if (item.permissions?.length && item.permissions.some((permission) => !userPermissions.has(permission))) {
    return false
  }

  return true
}

export function getVisibleNavItems(user) {
  return NAV_ITEMS.filter((item) => hasAccess(user, item))
}

function toTitleCase(value) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getDynamicCrumbLabel(segment, parentPath) {
  if (parentPath === '/patients') return 'Patient History'
  if (parentPath === '/rules') return 'Rule Details'
  if (parentPath === '/review') return 'Review Details'
  if (/^\d+$/.test(segment)) return `#${segment}`
  if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(segment)) return 'Details'
  return toTitleCase(segment)
}

export function getBreadcrumbs(pathname, navItems = NAV_ITEMS) {
  const pathOnly = pathname.split('?')[0]
  const segments = pathOnly.split('/').filter(Boolean)
  const navLabelMap = new Map(navItems.map((item) => [item.to, item.label]))

  const breadcrumbs = [{ label: 'Dashboard', to: segments.length ? '/' : null }]
  if (!segments.length) return breadcrumbs

  let parentPath = ''

  segments.forEach((segment, index) => {
    parentPath = `${parentPath}/${segment}`
    const isLast = index === segments.length - 1
    const label = navLabelMap.get(parentPath) || getDynamicCrumbLabel(segment, parentPath.slice(0, parentPath.lastIndexOf('/')) || '/')

    breadcrumbs.push({
      label,
      to: isLast ? null : parentPath,
    })
  })

  return breadcrumbs
}
