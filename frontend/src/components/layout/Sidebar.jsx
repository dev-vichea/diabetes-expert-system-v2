import { useState } from 'react'
import { X } from 'lucide-react'
import { NavDocuments } from './NavDocuments'
import { NavMain } from './NavMain'
import { NavSecondary } from './NavSecondary'
import { NavUser } from './NavUser'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from '@/components/ui/sidebar'

function splitNavGroups(navItems) {
  const workspace = []
  const system = []
  const documents = []

  for (const item of navItems) {
    if (item.to === '/rules' || item.to === '/review' || item.to === '/my-results') {
      documents.push(item)
      continue
    }

    if (item.section === 'system') system.push(item)
    else workspace.push(item)
  }

  return { workspace, system, documents }
}

const BRAND_LOGO_SRC = '/images/logo.png'

export function Sidebar({ navItems, user, userName, userEmail, activeRole, onLogout, onClose, collapsed = false }) {
  const { t } = useLanguage()
  const { workspace, system, documents } = splitNavGroups(navItems)
  const [logoVisible, setLogoVisible] = useState(true)
  const effectiveUser = user || { name: userName, email: userEmail, role: activeRole }

  return (
    <SidebarRoot className="h-full min-h-0 overflow-hidden border-r border-slate-200 bg-white dark:border-[#1e2234] dark:bg-[#070712]">
      <SidebarHeader className="relative p-4 pb-2">
        <div className={`flex items-center gap-3 py-1 ${collapsed ? 'justify-center' : 'px-1'}`}>
          {logoVisible ? (
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">
              <img
                src={BRAND_LOGO_SRC}
                alt="Expert system logo"
                className="h-full w-full object-contain"
                onError={() => setLogoVisible(false)}
              />
            </span>
          ) : (
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-base font-bold text-white dark:bg-primary-900 dark:text-primary-200">
              DX
            </span>
          )}
          {!collapsed ? (
            <span className="flex min-w-0 flex-col items-start leading-tight">
              <span className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">Diabetes</span>
              <span className="truncate text-xs text-slate-500 dark:text-slate-400">Expert System</span>
            </span>
          ) : null}
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-4 rounded-md p-1 text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-slate-400 dark:hover:bg-[#181830] dark:hover:text-slate-100 lg:hidden"
            aria-label={t('common.closeSidebar')}
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </SidebarHeader>

      <SidebarContent className={`custom-scrollbar pb-3 ${collapsed ? 'px-2' : 'px-3'}`}>
        <NavMain title={t('nav.workspace')} items={workspace} collapsed={collapsed} />
        <NavDocuments title={t('nav.documents')} items={documents} collapsed={collapsed} />
        <NavMain title={t('nav.system')} items={system} collapsed={collapsed} />
        <SidebarSeparator className={collapsed ? 'mx-1' : undefined} />
        <NavSecondary collapsed={collapsed} />
      </SidebarContent>

      <SidebarFooter className={collapsed ? 'p-2' : 'p-2'}>
        <NavUser
          user={effectiveUser}
          collapsed={collapsed}
          onLogout={onLogout}
        />
      </SidebarFooter>
    </SidebarRoot>
  )
}
