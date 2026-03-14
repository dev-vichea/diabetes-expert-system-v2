import { HelpCircle, Search, Settings } from 'lucide-react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavSecondary({ collapsed = false }) {
  const items = [
    { title: 'Settings', icon: Settings },
    { title: 'Get Help', icon: HelpCircle },
    { title: 'Search', icon: Search },
  ]

  return (
    <SidebarGroup className="mt-auto">
      {!collapsed ? <SidebarGroupLabel>Tools</SidebarGroupLabel> : null}
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                type="button"
                aria-label={item.title}
                title={item.title}
                className={collapsed ? 'justify-center px-0' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span>{item.title}</span> : null}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
