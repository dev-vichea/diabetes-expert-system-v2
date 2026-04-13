import {
  ActivitySquare,
  BookMarked,
  ClipboardList,
  LayoutDashboard,
  Microscope,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { translate } from '@/lib/i18n'

export const NAV_ITEMS = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, section: 'workspace' },
  { to: '/diagnosis', labelKey: 'nav.assessment', icon: Microscope, section: 'workspace', permissions: ['diagnosis.run'] },
  { to: '/patients', labelKey: 'nav.patients', icon: Users, section: 'workspace', permissions: ['patient.view'] },
  { to: '/rules', labelKey: 'nav.knowledgeBase', icon: BookMarked, section: 'workspace', permissions: ['rule.view'] },
  { to: '/review', labelKey: 'nav.patientReview', icon: ClipboardList, section: 'workspace', permissions: ['diagnosis.review_any'] },
  { to: '/my-results', labelKey: 'nav.myResults', icon: ActivitySquare, section: 'workspace', permissions: ['diagnosis.view_own'] },
  { to: '/users', labelKey: 'nav.users', icon: ShieldCheck, section: 'system', permissions: ['user.view', 'permission.view'], permissionMode: 'any' },
  { to: '/roles-permissions', labelKey: 'nav.roles', icon: ShieldCheck, section: 'system', permissions: ['permission.view'] },
]

export const PAGE_TITLE_BY_PATH = [
  { pattern: '/unauthorized', titleKey: 'page.unauthorized.title', subtitleKey: 'page.unauthorized.subtitle' },
  { pattern: '/not-found', titleKey: 'page.notFound.title', subtitleKey: 'page.notFound.subtitle' },
  { pattern: '/diagnosis/result', titleKey: 'page.assessmentResult.title', subtitleKey: 'page.assessmentResult.subtitle' },
  { pattern: '/diagnosis', titleKey: 'page.assessmentWorkspace.title', subtitleKey: 'page.assessmentWorkspace.subtitle' },
  { pattern: '/patients', titleKey: 'page.patientManagement.title', subtitleKey: 'page.patientManagement.subtitle' },
  { pattern: '/rules', titleKey: 'page.knowledgeBase.title', subtitleKey: 'page.knowledgeBase.subtitle' },
  { pattern: '/review', titleKey: 'page.clinicalReview.title', subtitleKey: 'page.clinicalReview.subtitle' },
  { pattern: '/my-results', titleKey: 'page.myDiagnosisResults.title', subtitleKey: 'page.myDiagnosisResults.subtitle' },
  { pattern: '/users', titleKey: 'page.users.title', subtitleKey: 'page.users.subtitle' },
  { pattern: '/roles-permissions', titleKey: 'page.rolesPermissions.title', subtitleKey: 'page.rolesPermissions.subtitle' },
  { pattern: '/dashboard', titleKey: 'page.dashboard.title', subtitleKey: 'page.dashboard.subtitle' },
]

export function getPageInfo(pathname, language = 'en') {
  const matched = PAGE_TITLE_BY_PATH.find((item) => pathname === item.pattern || pathname.startsWith(`${item.pattern}/`))
  const page = matched || PAGE_TITLE_BY_PATH[PAGE_TITLE_BY_PATH.length - 1]

  return {
    ...page,
    title: translate(language, page.titleKey),
    subtitle: translate(language, page.subtitleKey),
  }
}

function hasAccess(user, item) {
  const userRoles = new Set(user?.roles || (user?.role ? [user.role] : []))
  const userPermissions = new Set(user?.permissions || [])

  if (item.roles?.length && item.roles.every((role) => !userRoles.has(role))) {
    return false
  }

  if (item.permissions?.length) {
    if (item.permissionMode === 'any') {
      // OR logic: user needs at least one
      if (item.permissions.every((permission) => !userPermissions.has(permission))) {
        return false
      }
    } else {
      // AND logic (default): user needs all
      if (item.permissions.some((permission) => !userPermissions.has(permission))) {
        return false
      }
    }
  }

  return true
}

export function getVisibleNavItems(user, language = 'en') {
  return NAV_ITEMS
    .filter((item) => hasAccess(user, item))
    .map((item) => ({
      ...item,
      label: translate(language, item.labelKey),
    }))
}

function toTitleCase(value) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getDynamicCrumbLabel(segment, parentPath, language) {
  if (parentPath === '/patients') return translate(language, 'breadcrumbs.patientHistory')
  if (parentPath === '/rules') return translate(language, 'breadcrumbs.ruleDetails')
  if (parentPath === '/review') return translate(language, 'breadcrumbs.reviewDetails')
  if (/^\d+$/.test(segment)) return `#${segment}`
  if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(segment)) return translate(language, 'breadcrumbs.details')
  return toTitleCase(segment)
}

export function getBreadcrumbs(pathname, navItems = NAV_ITEMS, language = 'en') {
  const pathOnly = pathname.split('?')[0]
  const segments = pathOnly.split('/').filter(Boolean)
  const navLabelMap = new Map(navItems.map((item) => [item.to, item.label || translate(language, item.labelKey)]))

  const breadcrumbs = [{ label: translate(language, 'breadcrumbs.dashboard'), to: segments.length ? '/dashboard' : null }]
  if (!segments.length || (segments.length === 1 && segments[0] === 'dashboard')) return breadcrumbs

  let parentPath = ''

  segments.forEach((segment, index) => {
    parentPath = `${parentPath}/${segment}`
    const isLast = index === segments.length - 1
    const label = navLabelMap.get(parentPath) || getDynamicCrumbLabel(segment, parentPath.slice(0, parentPath.lastIndexOf('/')) || '/', language)

    breadcrumbs.push({
      label,
      to: isLast ? null : parentPath,
    })
  })

  return breadcrumbs
}
