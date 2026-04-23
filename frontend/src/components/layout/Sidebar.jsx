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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

export function Sidebar({ navItems, userName, userEmail, activeRole, onLogout, onClose, collapsed = false }) {
  const { t } = useLanguage()
  const { workspace, system, documents } = splitNavGroups(navItems)
  const [logoVisible, setLogoVisible] = useState(true)

  return (
    <SidebarRoot className="h-full min-h-0 overflow-hidden border-r border-[#dcecf6] bg-[#f6fcff] dark:border-[#163042] dark:bg-[#07111b]">
      <SidebarHeader className="relative p-4 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className={`rounded-[28px] border border-[#d7eaf4] bg-gradient-to-br from-[#eefbff] via-white to-[#eefcf9] py-3 text-[#103b56] shadow-[0_12px_28px_rgba(76,139,176,0.08)] hover:bg-white dark:border-[#1d3b4d] dark:bg-gradient-to-br dark:from-[#102131] dark:via-[#0b1826] dark:to-[#10261f] dark:text-[#e5f7ff] dark:hover:from-[#11283b] dark:hover:via-[#0d1d2d] dark:hover:to-[#143226] ${collapsed ? 'justify-center px-0' : 'px-4'}`}
            >
              <button type="button" aria-label="Diabetes Expert System">
                {logoVisible ? (
                  <span className="inline-flex h-14 w-14 items-center justify-center overflow-hidden">
                    <img
                      src={BRAND_LOGO_SRC}
                      alt="Expert system logo"
                      className="h-full w-full object-contain"
                      onError={() => setLogoVisible(false)}
                    />
                  </span>
                ) : (
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#123a56] text-lg font-bold text-white dark:bg-[#0b2235] dark:text-[#7ee7f6]">
                    DX
                  </span>
                )}
                {!collapsed ? (
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-xl font-semibold tracking-[-0.02em]">Diabetes</span>
                    <span className="whitespace-nowrap text-sm text-[#5f7b91] dark:text-[#90a8bb]">Expert System</span>
                  </span>
                ) : null}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-4 rounded-md p-1 text-[#6c8599] transition-colors hover:bg-[#e8f6fd] hover:text-[#12486d] dark:text-[#9ab3c4] dark:hover:bg-[#102234] dark:hover:text-[#dff8ff] lg:hidden"
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

      <SidebarFooter className={`border-t border-[#d8ecf7] dark:border-[#183041] ${collapsed ? 'p-2 pt-2' : 'p-3 pt-2'}`}>
        <NavUser
          user={{ name: userName, email: userEmail, role: activeRole }}
          collapsed={collapsed}
          onLogout={onLogout}
        />
      </SidebarFooter>
    </SidebarRoot>
  )
}
