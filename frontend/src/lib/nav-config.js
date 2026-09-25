import {
  BookOpen,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  Microscope,
  ShieldCheck,
  UserCog,
  Users,
  Stethoscope,
} from 'lucide-react'
import { translate } from './i18n'

export const NAV_ITEMS = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, section: 'workspace', permissions: ['analytics.view', 'patient.view', 'patient.view_own'], permissionMode: 'any' },
  { to: '/patients', labelKey: 'nav.patients', icon: Users, section: 'workspace', permissions: ['patient.view'] },
  { to: '/review', labelKey: 'nav.patientReview', icon: ClipboardCheck, section: 'workspace', permissions: ['diagnosis.review_any'] },
  { to: '/treatment-plans', labelKey: 'nav.treatmentPlans', icon: Stethoscope, section: 'workspace', permissions: ['treatment_plan.view'] },
  { to: '/diagnosis', labelKey: 'nav.assessment', icon: Microscope, section: 'workspace', permissions: ['diagnosis.run'] },
  { to: '/my-results', labelKey: 'nav.myResults', icon: FileSpreadsheet, section: 'workspace', roles: ['patient'], permissions: ['diagnosis.view_own'] },
  { to: '/my-results', labelKey: 'nav.patientResults', icon: FileSpreadsheet, section: 'workspace', notRoles: ['patient'], permissions: ['diagnosis.view_own'] },
  { to: '/care-plan', labelKey: 'nav.carePlan', icon: HeartPulse, section: 'workspace', notRoles: ['admin'], permissions: ['care_plan.view_own'] },
  { to: '/rules', labelKey: 'nav.knowledgeBase', icon: BookOpen, section: 'documents', permissions: ['rule.view'] },
  { to: '/guide', labelKey: 'nav.diabetesGuide', icon: GraduationCap, section: 'documents', permissions: ['guide.view'] },
  { to: '/users', labelKey: 'nav.users', icon: UserCog, section: 'system', permissions: ['user.view', 'permission.view'] },
  { to: '/roles-permissions', labelKey: 'nav.roles', icon: ShieldCheck, section: 'system', permissions: ['permission.view'] },
]

export const ROLE_NAV_CONFIG = {
  admin: {
    sections: [
      { id: 'administration', titleKey: 'nav.administration', defaultTitle: 'ADMINISTRATION' },
      { id: 'clinicalOperations', titleKey: 'nav.clinicalOperations', defaultTitle: 'CLINICAL OPERATIONS' },
      { id: 'documents', titleKey: 'nav.documents', defaultTitle: 'DOCUMENTS' },
    ],
    pathSection: {
      '/dashboard': 'administration',
      '/users': 'administration',
      '/roles-permissions': 'administration',
      '/patients': 'clinicalOperations',
      '/review': 'clinicalOperations',
      '/treatment-plans': 'clinicalOperations',
      '/diagnosis': 'clinicalOperations',
      '/my-results': 'clinicalOperations',
      '/rules': 'documents',
      '/guide': 'documents',
    },
    pathOrder: [
      '/dashboard',
      '/users',
      '/roles-permissions',
      '/patients',
      '/review',
      '/treatment-plans',
      '/diagnosis',
      '/my-results',
      '/rules',
      '/guide',
    ],
  },
  doctor: {
    sections: [
      { id: 'workspace', titleKey: 'nav.workspace', defaultTitle: 'WORKSPACE' },
      { id: 'documents', titleKey: 'nav.documents', defaultTitle: 'DOCUMENTS' },
    ],
    pathSection: {
      '/dashboard': 'workspace',
      '/patients': 'workspace',
      '/review': 'workspace',
      '/treatment-plans': 'workspace',
      '/diagnosis': 'workspace',
      '/my-results': 'workspace',
      '/rules': 'documents',
      '/guide': 'documents',
    },
    pathOrder: [
      '/dashboard',
      '/patients',
      '/review',
      '/treatment-plans',
      '/diagnosis',
      '/my-results',
      '/rules',
      '/guide',
    ],
  },
  patient: {
    sections: [
      { id: 'workspace', titleKey: 'nav.workspace', defaultTitle: 'WORKSPACE' },
      { id: 'documents', titleKey: 'nav.documents', defaultTitle: 'DOCUMENTS' },
    ],
    pathSection: {
      '/dashboard': 'workspace',
      '/diagnosis': 'workspace',
      '/care-plan': 'workspace',
      '/my-results': 'workspace',
      '/guide': 'documents',
    },
    pathOrder: [
      '/dashboard',
      '/diagnosis',
      '/care-plan',
      '/my-results',
      '/guide',
    ],
  },
  default: {
    sections: [
      { id: 'workspace', titleKey: 'nav.workspace', defaultTitle: 'WORKSPACE' },
      { id: 'documents', titleKey: 'nav.documents', defaultTitle: 'DOCUMENTS' },
      { id: 'system', titleKey: 'nav.system', defaultTitle: 'SYSTEM' },
    ],
    pathSection: {
      '/rules': 'documents',
      '/guide': 'documents',
      '/users': 'system',
      '/roles-permissions': 'system',
    },
    pathOrder: [
      '/dashboard',
      '/patients',
      '/review',
      '/treatment-plans',
      '/diagnosis',
      '/care-plan',
      '/my-results',
      '/rules',
      '/guide',
      '/users',
      '/roles-permissions',
    ],
  },
}

export const PAGE_TITLE_BY_PATH = [
  { pattern: '/guide', titleKey: 'page.diabetesGuide.title', subtitleKey: 'page.diabetesGuide.subtitle' },
  { pattern: '/unauthorized', titleKey: 'page.unauthorized.title', subtitleKey: 'page.unauthorized.subtitle' },
  { pattern: '/not-found', titleKey: 'page.notFound.title', subtitleKey: 'page.notFound.subtitle' },
  { pattern: '/diagnosis/result', titleKey: 'page.assessmentResult.title', subtitleKey: 'page.assessmentResult.subtitle' },
  { pattern: '/diagnosis', titleKey: 'page.assessmentWorkspace.title', subtitleKey: 'page.assessmentWorkspace.subtitle' },
  { pattern: '/patients', titleKey: 'page.patientManagement.title', subtitleKey: 'page.patientManagement.subtitle' },
  { pattern: '/rules', titleKey: 'page.knowledgeBase.title', subtitleKey: 'page.knowledgeBase.subtitle' },
  { pattern: '/review', titleKey: 'page.clinicalReview.title', subtitleKey: 'page.clinicalReview.subtitle' },
  { pattern: '/treatment-plans/create', titleKey: 'page.treatmentPlanningCreate.title', subtitleKey: 'page.treatmentPlanningCreate.subtitle' },
  { pattern: '/treatment-plans', titleKey: 'page.treatmentPlanning.title', subtitleKey: 'page.treatmentPlanning.subtitle' },
  {
    pattern: '/my-results',
    titleKey: 'page.myDiagnosisResults.title',
    subtitleKey: 'page.myDiagnosisResults.subtitle',
    staffTitleKey: 'page.patientResults.title',
    staffSubtitleKey: 'page.patientResults.subtitle',
  },
  { pattern: '/care-plan', titleKey: 'page.carePlan.title', subtitleKey: 'page.carePlan.subtitle' },
  { pattern: '/users', titleKey: 'page.users.title', subtitleKey: 'page.users.subtitle' },
  { pattern: '/roles-permissions', titleKey: 'page.rolesPermissions.title', subtitleKey: 'page.rolesPermissions.subtitle' },
  { pattern: '/dashboard', titleKey: 'page.dashboard.title', subtitleKey: 'page.dashboard.subtitle' },
]

export function getPageInfo(pathname, language = 'en', user = null) {
  const matched = PAGE_TITLE_BY_PATH.find((item) => pathname === item.pattern || pathname.startsWith(`${item.pattern}/`))
  const page = matched || PAGE_TITLE_BY_PATH[PAGE_TITLE_BY_PATH.length - 1]
  const isStaff = userHasStaffRole(user)

  const titleKey = isStaff && page.staffTitleKey ? page.staffTitleKey : page.titleKey
  const subtitleKey = isStaff && page.staffSubtitleKey ? page.staffSubtitleKey : page.subtitleKey

  return {
    ...page,
    title: translate(language, titleKey),
    subtitle: translate(language, subtitleKey),
  }
}

/**
 * Identify primary navigation role for menu layout and ordering.
 */
export function getUserNavRole(user) {
  const rawRoles = user?.roles || (user?.role ? [user.role] : (user?.activeRole ? [user.activeRole] : []))
  const roles = rawRoles.map((r) => String(r).toLowerCase().trim())
  const permissions = new Set(user?.permissions || [])

  // Admin: explicit role or user/permission administration capabilities
  if (
    roles.includes('admin') ||
    roles.includes('super_admin') ||
    permissions.has('user.manage') ||
    permissions.has('permission.manage') ||
    (permissions.has('user.view') && permissions.has('permission.view'))
  ) {
    return 'admin'
  }

  // Doctor/Clinician: doctor role or clinical review capabilities
  if (
    roles.includes('doctor') ||
    roles.includes('physician') ||
    roles.includes('clinician') ||
    roles.includes('nurse') ||
    roles.includes('reviewer') ||
    permissions.has('diagnosis.review_any') ||
    permissions.has('treatment_plan.manage')
  ) {
    return 'doctor'
  }

  if (roles.includes('patient')) {
    return 'patient'
  }

  if (userHasStaffRole(user)) {
    return 'doctor'
  }

  return 'patient'
}

/**
 * Staff = signed-in user with at least one non-patient role (doctor, admin,
 * knowledge_manager, …). Patients (and role-less users) are not staff.
 */
export function userHasStaffRole(user) {
  const roles = user?.roles || (user?.role ? [user.role] : (user?.activeRole ? [user.activeRole] : []))
  if (!roles.length) return false
  return roles.some((role) => String(role).toLowerCase() !== 'patient')
}

function hasAccess(user, item) {
  const userRoles = new Set((user?.roles || (user?.role ? [user.role] : (user?.activeRole ? [user.activeRole] : []))).map((r) => String(r).toLowerCase()))
  const userPermissions = new Set(user?.permissions || [])

  if (item.roles?.length && item.roles.every((role) => !userRoles.has(String(role).toLowerCase()))) {
    return false
  }

  if (item.notRoles?.length && item.notRoles.some((role) => userRoles.has(String(role).toLowerCase()))) {
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
  const role = getUserNavRole(user)
  const config = ROLE_NAV_CONFIG[role] || ROLE_NAV_CONFIG.default

  const visible = NAV_ITEMS
    .filter((item) => hasAccess(user, item))
    .map((item) => {
      const section = config.pathSection?.[item.to] || item.section || 'workspace'
      return {
        ...item,
        section,
        label: translate(language, item.labelKey),
      }
    })

  if (config.pathOrder?.length) {
    const orderMap = new Map(config.pathOrder.map((path, idx) => [path, idx]))
    visible.sort((a, b) => {
      const orderA = orderMap.has(a.to) ? orderMap.get(a.to) : 999
      const orderB = orderMap.has(b.to) ? orderMap.get(b.to) : 999
      return orderA - orderB
    })
  }

  return visible
}

export function getGroupedNavSections(navItems, user, t = (key, fallback) => fallback || key) {
  const role = getUserNavRole(user)
  const config = ROLE_NAV_CONFIG[role] || ROLE_NAV_CONFIG.default
  const sectionsDef = config.sections || [
    { id: 'workspace', titleKey: 'nav.workspace', defaultTitle: 'WORKSPACE' },
    { id: 'documents', titleKey: 'nav.documents', defaultTitle: 'DOCUMENTS' },
  ]

  const items = navItems && navItems.length
    ? navItems
    : getVisibleNavItems(user)

  // Map items to their section
  const sectionBuckets = new Map(sectionsDef.map((sec) => [sec.id, []]))
  const fallbackSectionId = sectionsDef[0]?.id || 'workspace'

  for (const item of items) {
    const targetSection =
      (item.section && sectionBuckets.has(item.section))
        ? item.section
        : (config.pathSection?.[item.to] && sectionBuckets.has(config.pathSection[item.to]))
          ? config.pathSection[item.to]
          : fallbackSectionId

    sectionBuckets.get(targetSection).push(item)
  }

  return sectionsDef
    .map((sec) => ({
      id: sec.id,
      title: t(sec.titleKey, sec.defaultTitle || sec.id.toUpperCase()),
      items: sectionBuckets.get(sec.id) || [],
    }))
    .filter((sec) => sec.items.length > 0)
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
