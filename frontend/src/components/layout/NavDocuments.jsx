import { NavLink } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavDocuments({ title, items, collapsed = false }) {
  if (!items?.length) return null

  return (
    <SidebarGroup className="space-y-1">
      {!collapsed && title ? (
        <SidebarGroupLabel className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          {title}
        </SidebarGroupLabel>
      ) : null}
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const Icon = item.icon || FileText

          return (
            <SidebarMenuItem key={item.to}>
              <NavLink
                to={item.to}
                title={item.label}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center rounded-xl text-sm font-medium transition-all duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    collapsed ? 'h-10 w-10 justify-center mx-auto' : 'gap-3 px-3 py-2',
                    isActive
                      ? 'bg-primary-50/90 text-primary-700 font-semibold shadow-xs dark:bg-primary-500/15 dark:text-primary-200'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Sleek left accent indicator */}
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary-600 dark:bg-primary-400 transition-all duration-200" />
                    )}

                    {/* Consistent icon container */}
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-150',
                        isActive
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>

                    {!collapsed ? (
                      <span className="truncate tracking-normal text-[13.5px] leading-5">
                        {item.label}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

