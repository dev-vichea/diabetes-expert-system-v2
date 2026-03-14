import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, ChevronRight, LogOut, Menu, Moon, PanelLeft, Plus, Settings, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Topbar({
  page,
  user,
  breadcrumbs = [],
  theme = 'light',
  isSidebarCollapsed = false,
  onToggleDesktopSidebar,
  onToggleTheme,
  onLogout,
  onOpenMobileNav,
}) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const activeRole = user?.roles?.[0] || user?.role || 'user'
  const isDark = theme === 'dark'
  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-[#161b31] dark:bg-[#030309]/90 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="dark-hover-border hidden rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-[#1d243c] dark:text-slate-300 dark:hover:bg-[#0f1529] dark:hover:text-slate-100 lg:inline-flex"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft className={cn('h-4 w-4 transition-transform duration-200', isSidebarCollapsed ? 'rotate-180' : 'rotate-0')} />
          </button>

          <button
            type="button"
            onClick={onOpenMobileNav}
            className="dark-hover-border rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-[#1d243c] dark:text-slate-300 dark:hover:bg-[#0f1529] dark:hover:text-slate-100 lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-0.5 flex flex-wrap items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              {breadcrumbs.map((crumb, index) => (
                <div key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {index > 0 ? <ChevronRight className="h-3 w-3 text-slate-400" /> : null}
                  {crumb.to ? (
                    <Link to={crumb.to} className="rounded px-1 py-0.5 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#0f1529] dark:hover:text-slate-100">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="px-1 py-0.5 font-semibold text-slate-700 dark:text-slate-100">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">{page.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{page.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              navigate('/diagnosis', {
                state: {
                  requestRestart: true,
                  restartRequestId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                },
              })
            }}
            className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-[#6d4bff] to-[#1699ff] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            New Assessment
          </button>

          <div className="hidden h-7 w-px bg-slate-200 dark:bg-[#1d243c] sm:block" />

          <button
            type="button"
            onClick={onToggleTheme}
            className="dark-hover-border inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-[#1d243c] dark:bg-[#090f20] dark:text-slate-300 dark:hover:bg-[#0f1529] dark:hover:text-slate-100"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-500" />}
          </button>

          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-[#1d243c] dark:bg-[#090f20] dark:text-slate-300 dark:hover:bg-[#0f1529] dark:hover:text-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="dark-hover-border flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2 py-1.5 text-slate-700 shadow-sm transition-colors hover:bg-slate-100 dark:border-[#1d243c] dark:bg-[#090f20] dark:text-slate-200 dark:hover:bg-[#0f1529]"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#6d4bff] to-[#1699ff] text-xs font-bold text-white">
                {initials}
              </span>
              <span className="hidden max-w-32 truncate text-sm font-semibold sm:inline">{user?.name || 'User'}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {menuOpen ? (
              <div className="dark-hover-border absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-[#1a2037] dark:bg-[#090f20]">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#1a2037] dark:bg-[#0f1529]">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name || 'Unknown User'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || 'No email'}</p>
                  <p className="mt-1 inline-flex rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 dark:bg-[#10263b] dark:text-cyan-300">
                    {activeRole}
                  </p>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#0f1529]"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-[#1a2037] dark:text-slate-200 dark:hover:bg-[#0f1529]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </span>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-100 px-1 text-[11px] font-semibold text-violet-700 dark:bg-[#201c42] dark:text-violet-300">
                    4
                  </span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  onClick={() => {
                    setMenuOpen(false)
                    onLogout()
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
