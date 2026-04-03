import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

function getNavClass(isActive, collapsed) {
  return cn(
    'flex items-center rounded-2xl py-2.5 text-sm font-medium transition-colors duration-200',
    collapsed ? 'justify-center px-0' : 'items-center gap-2 px-3',
    isActive
      ? 'bg-[#dff4ff] text-[#0b6b86] shadow-[inset_0_0_0_1px_rgba(71,176,214,0.18)] dark:bg-[#10273a] dark:text-[#76e4f7] dark:shadow-[inset_0_0_0_1px_rgba(99,225,247,0.14)]'
      : 'text-[#496278] hover:bg-[#eaf8ff] hover:text-[#0f4c81] dark:text-[#9eb5c8] dark:hover:bg-[#102234] dark:hover:text-[#dcf7ff]'
  )
}

export function NavMain({ title, items, collapsed = false }) {
  if (!items?.length) return null

  return (
    <SidebarGroup>
      {!collapsed ? <SidebarGroupLabel>{title}</SidebarGroupLabel> : null}
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon

          return (
            <SidebarMenuItem key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => getNavClass(isActive, collapsed)} title={item.label}>
                {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </NavLink>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
