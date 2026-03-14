import { X } from 'lucide-react'
import { NavDocuments } from './NavDocuments'
import { NavMain } from './NavMain'
import { NavSecondary } from './NavSecondary'
import { NavUser } from './NavUser'
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

export function Sidebar({ navItems, userName, userEmail, activeRole, onLogout, onClose, collapsed = false }) {
  const { workspace, system, documents } = splitNavGroups(navItems)

  return (
    <SidebarRoot className="h-full min-h-0 overflow-hidden bg-white dark:bg-[#030309]">
      <SidebarHeader className="relative p-4 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className={`rounded-2xl bg-slate-100/90 py-2.5 text-slate-900 hover:bg-slate-100 dark:bg-[#1b2a44] dark:text-slate-100 dark:hover:bg-[#243754] ${collapsed ? 'justify-center px-0' : 'px-3'}`}
            >
              <button type="button" aria-label="Diabetes Expert">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white dark:bg-[#020617] dark:text-[#8f86ff]">
                  DX
                </span>
                {!collapsed ? <span className="text-sm font-semibold">Diabetes Expert</span> : null}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-4 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </SidebarHeader>

      <SidebarContent className={`custom-scrollbar pb-3 ${collapsed ? 'px-2' : 'px-3'}`}>
        <NavMain title="Workspace" items={workspace} collapsed={collapsed} />
        <NavDocuments items={documents} collapsed={collapsed} />
        <NavMain title="System" items={system} collapsed={collapsed} />
        <SidebarSeparator className={collapsed ? 'mx-1' : undefined} />
        <NavSecondary collapsed={collapsed} />
      </SidebarContent>

      <SidebarFooter className={`border-t border-slate-200 dark:border-[#161b31] ${collapsed ? 'p-2 pt-2' : 'p-3 pt-2'}`}>
        <NavUser
          user={{ name: userName, email: userEmail, role: activeRole }}
          collapsed={collapsed}
          onLogout={onLogout}
        />
      </SidebarFooter>
    </SidebarRoot>
  )
}
