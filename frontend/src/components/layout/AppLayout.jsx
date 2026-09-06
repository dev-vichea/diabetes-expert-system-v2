import { Outlet, useLocation } from 'react-router-dom'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Sidebar } from './Sidebar'
import { MobileSidebarDrawer } from './MobileSidebarDrawer'
import { Topbar } from './Topbar'
import { RouteLoading } from '../RouteLoading'
import { getBreadcrumbs, getPageInfo, getVisibleNavItems } from '../../lib/nav-config'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'

export function AppLayout() {
  const { user, logout } = useAuth()
  const { language } = useLanguage()
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

  const navItems = useMemo(() => getVisibleNavItems(user, language), [language, user])
  const page = getPageInfo(location.pathname, language, user)
  const breadcrumbs = useMemo(() => getBreadcrumbs(location.pathname, navItems, language), [language, location.pathname, navItems])
  const activeRole = user?.roles?.[0] || user?.role || 'user'
  const sidebarWidth = desktopSidebarCollapsed ? 'lg:grid-cols-[5rem_1fr]' : 'lg:grid-cols-[15rem_1fr]'

  const isDiagnosis = location.pathname.replace(/\/$/, '') === '/diagnosis'

  return (
    <div className={`app-layout-root h-[100dvh] min-w-0 overflow-hidden bg-[#f5f8fc] dark:bg-[#030309] lg:grid ${sidebarWidth}`}>
      <aside className="hidden h-[100dvh] min-h-0 overflow-hidden border-r border-slate-200 bg-white dark:border-[#161b31] dark:bg-[#030309] lg:static lg:block lg:w-auto">
        <Sidebar
          navItems={navItems}
          user={user}
          userName={user?.name}
          userEmail={user?.email}
          activeRole={activeRole}
          collapsed={desktopSidebarCollapsed}
          onLogout={logout}
        />
      </aside>

      <MobileSidebarDrawer
        open={mobileNavOpen}
        navItems={navItems}
        user={user}
        onLogout={logout}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="app-layout-content relative z-10 flex h-[100dvh] min-w-0 min-h-0 flex-col overflow-hidden">
        <Topbar
          page={page}
          user={user}
          breadcrumbs={breadcrumbs}
          theme={theme}
          isSidebarCollapsed={desktopSidebarCollapsed}
          onToggleDesktopSidebar={() => setDesktopSidebarCollapsed((prev) => !prev)}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          onLogout={logout}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main
          key={location.pathname}
          className={`custom-scrollbar page-open-motion min-w-0 flex-1 overflow-y-auto flex flex-col ${
            isDiagnosis
              ? 'p-0 bg-white dark:bg-[#0c1024]'
              : 'px-3 py-4 sm:px-6 sm:py-6'
          }`}
        >
          <div className={`w-full flex-1 flex flex-col ${isDiagnosis ? 'min-h-full' : 'mx-auto max-w-[100rem]'}`}>
            {/* Suspense here keeps the sidebar/topbar shell mounted while a lazy page chunk loads */}
            <Suspense fallback={<RouteLoading />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
