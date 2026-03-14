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
      ? 'bg-primary-50 text-primary-700 dark:bg-[#0a0d22] dark:text-primary-500 dark:shadow-[inset_0_0_0_1px_rgba(47,140,255,0.18)]'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-[#070a1a] dark:hover:text-slate-300'
  )
}

export function NavDocuments({ items, collapsed = false }) {
  if (!items?.length) return null

  return (
    <SidebarGroup>
      {!collapsed ? <SidebarGroupLabel>Documents</SidebarGroupLabel> : null}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.to}>
            <NavLink to={item.to} className={({ isActive }) => getDocClass(isActive, collapsed)} title={item.label}>
              <FileText className="h-4 w-4 shrink-0" />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </NavLink>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
