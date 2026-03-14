import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from './Sidebar'
import { MobileSidebarDrawer } from './MobileSidebarDrawer'
import { Topbar } from './Topbar'
import { getBreadcrumbs, getPageInfo, getVisibleNavItems } from '../../lib/nav-config'

export function AppLayout({ user, onLogout }) {
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = window.localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('sidebar-collapsed') === 'true'
  })
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    window.localStorage.setItem('sidebar-collapsed', String(desktopSidebarCollapsed))
  }, [desktopSidebarCollapsed])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const navItems = useMemo(() => getVisibleNavItems(user), [user])
  const page = getPageInfo(location.pathname)
  const breadcrumbs = useMemo(() => getBreadcrumbs(location.pathname, navItems), [location.pathname, navItems])
  const activeRole = user?.roles?.[0] || user?.role || 'user'
  const sidebarWidth = desktopSidebarCollapsed ? 'lg:grid-cols-[5rem_1fr]' : 'lg:grid-cols-[15rem_1fr]'

  return (
    // <div className={`h-screen overflow-hidden bg-slate-50 dark:bg-[#030309] lg:grid ${sidebarWidth}`}>
    <div className={`h-screen overflow-hidden bg-white dark:bg-[#030309] lg:grid ${sidebarWidth}`}>
      <aside className="hidden h-screen min-h-0 overflow-hidden border-r border-slate-200 bg-white dark:border-[#161b31] dark:bg-[#030309] lg:static lg:block lg:w-auto">
        <Sidebar
          navItems={navItems}
          userName={user?.name}
          userEmail={user?.email}
          activeRole={activeRole}
          collapsed={desktopSidebarCollapsed}
          onLogout={onLogout}
        />
      </aside>

      <MobileSidebarDrawer
        open={mobileNavOpen}
        navItems={navItems}
        user={user}
        onLogout={onLogout}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="relative z-10 flex h-screen min-h-0 flex-col overflow-hidden">
        <Topbar
          page={page}
          user={user}
          breadcrumbs={breadcrumbs}
          theme={theme}
          isSidebarCollapsed={desktopSidebarCollapsed}
          onToggleDesktopSidebar={() => setDesktopSidebarCollapsed((prev) => !prev)}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          onLogout={onLogout}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main key={location.pathname} className="custom-scrollbar page-open-motion flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
