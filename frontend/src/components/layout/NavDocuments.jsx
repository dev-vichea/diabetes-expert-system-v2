import { NavLink } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

function getDocClass(isActive, collapsed) {
  return cn(
    'flex items-center rounded-2xl py-2.5 text-sm font-medium transition-colors duration-200',
    collapsed ? 'justify-center px-0' : 'items-center gap-2 px-3',
    isActive
      ? 'bg-primary-100 text-primary-800 shadow-[inset_0_0_0_1px_rgba(47,140,255,0.18)] dark:bg-primary-500/10 dark:text-primary-200 dark:shadow-[inset_0_0_0_1px_rgba(99,160,247,0.14)]'
      : 'text-slate-600 hover:bg-primary-50 hover:text-primary-800 dark:text-slate-400 dark:hover:bg-[#181830] dark:hover:text-slate-100'
  )
}

export function NavDocuments({ title, items, collapsed = false }) {
  if (!items?.length) return null

  return (
    <SidebarGroup>
      {!collapsed ? <SidebarGroupLabel>{title}</SidebarGroupLabel> : null}
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon || FileText

          return (
            <SidebarMenuItem key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => getDocClass(isActive, collapsed)} title={item.label}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </NavLink>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
