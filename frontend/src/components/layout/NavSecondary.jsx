import { HelpCircle, Settings } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavSecondary({ collapsed = false }) {
  const { t } = useLanguage()
  const items = [
    { title: t('common.settings'), icon: Settings },
    { title: t('common.getHelp'), icon: HelpCircle },
  ]

  return (
    <SidebarGroup className="mt-auto">
      {!collapsed ? <SidebarGroupLabel>{t('nav.tools')}</SidebarGroupLabel> : null}
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
