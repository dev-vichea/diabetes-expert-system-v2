import { HelpCircle, Settings } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavSecondary({ collapsed = false }) {
  const { t } = useLanguage()
  const items = [
    { title: t('common.settings', 'Settings'), icon: Settings, to: '/settings' },
    { title: t('common.getHelp', 'Get Help'), icon: HelpCircle, to: '/help' },
  ]

  return (
    <SidebarGroup className="space-y-1">
      {!collapsed ? (
        <SidebarGroupLabel className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          {t('nav.tools', 'TOOLS')}
        </SidebarGroupLabel>
      ) : null}
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <SidebarMenuItem key={item.title}>
              <button
                type="button"
                aria-label={item.title}
                title={item.title}
                className={cn(
                  'group flex w-full items-center rounded-xl text-sm font-medium text-slate-600 transition-all duration-150 ease-out outline-none hover:bg-slate-100/80 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100',
                  collapsed ? 'h-10 w-10 justify-center mx-auto' : 'gap-3 px-3 py-2 text-left'
                )}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-400 transition-colors group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                {!collapsed ? (
                  <span className="truncate tracking-normal text-[13.5px] leading-5">
                    {item.title}
                  </span>
                ) : null}
              </button>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

