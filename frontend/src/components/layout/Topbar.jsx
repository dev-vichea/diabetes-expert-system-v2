import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, ChevronRight, Languages, LogOut, Menu, Moon, PanelLeft, Plus, Settings, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HeaderClock } from './HeaderClock'
import { useLanguage } from '@/contexts/LanguageContext'

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
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
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
  const nextLanguage = language === 'en' ? 'km' : 'en'
  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const hideNewAssessmentPaths = ['/', '/users', '/rules', '/roles-permissions']
  const shouldShowNewAssessment = !(
    hideNewAssessmentPaths.includes(location.pathname) || 
    location.pathname.startsWith('/users/') ||
    // Also consider patient specific user dashboard if any. But standard user dashboard is '/'.
    // If user dashboard means patient landing page.
    (user?.role === 'user' && location.pathname === '/')
  )

  return (
    <header
      className={cn(
        'sticky top-0 z-20 px-4 py-3 backdrop-blur sm:px-6',
        isDark
          ? 'border-b border-[#17384b] bg-[linear-gradient(90deg,rgba(7,20,31,0.98),rgba(10,30,41,0.96),rgba(7,20,31,0.98))] shadow-[0_12px_28px_rgba(0,0,0,0.28)]'
          : 'border-b border-[#dbeef7] bg-[#f8fdff]/95'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="dark-hover-border hidden rounded-xl border border-[#d7eaf4] bg-white p-2 text-[#5a7487] transition-colors hover:bg-[#ecf8ff] hover:text-[#0f4c81] dark:border-[#1d3b4d] dark:bg-[#0d1a28] dark:text-[#9eb5c8] dark:hover:bg-[#112335] dark:hover:text-[#dff8ff] lg:inline-flex"
            aria-label={isSidebarCollapsed ? t('topbar.expandSidebar') : t('topbar.collapseSidebar')}
          >
            <PanelLeft className={cn('h-4 w-4 transition-transform duration-200', isSidebarCollapsed ? 'rotate-180' : 'rotate-0')} />
          </button>

          <button
            type="button"
            onClick={onOpenMobileNav}
            className="dark-hover-border rounded-xl border border-[#d7eaf4] bg-white p-2 text-[#5a7487] transition-colors hover:bg-[#ecf8ff] hover:text-[#0f4c81] dark:border-[#1d3b4d] dark:bg-[#0d1a28] dark:text-[#9eb5c8] dark:hover:bg-[#112335] dark:hover:text-[#dff8ff] lg:hidden"
            aria-label={t('topbar.openMenu')}
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <nav aria-label={t('topbar.breadcrumb')} className="mb-0.5 flex flex-wrap items-center gap-1 text-[11px] text-[#6d889a] dark:text-[#8ea7ba]">
              {breadcrumbs.map((crumb, index) => (
                <div key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {index > 0 ? <ChevronRight className="h-3 w-3 text-[#9bb2c2]" /> : null}
                  {crumb.to ? (
                    <Link to={crumb.to} className="rounded px-1 py-0.5 hover:bg-[#e9f7ff] hover:text-[#0f4c81] dark:hover:bg-[#102234] dark:hover:text-[#dff8ff]">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="px-1 py-0.5 font-semibold text-[#193f59] dark:text-[#eaf8ff]">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
            <h2 className="text-lg font-semibold text-[#17384f] dark:text-[#eefbff] sm:text-xl">{page.title}</h2>
            <p className="text-xs text-[#678197] dark:text-[#8ea7ba] sm:text-sm">{page.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {shouldShowNewAssessment && (
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
              className="hidden min-h-12 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#1098c7] to-[#13b6a5] px-5 py-3 text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(19,182,165,0.22)] transition-transform hover:-translate-y-0.5 sm:inline-flex"
            >
              <Plus className="h-4.5 w-4.5" />
              {t('topbar.newAssessment')}
            </button>
          )}

          <HeaderClock theme={theme} language={language} />

          <div className="hidden h-7 w-px bg-[#d9edf7] dark:bg-[#1d3b4d] sm:block" />

          <button
            type="button"
            onClick={() => setLanguage(nextLanguage)}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d7eaf4] bg-white px-3 py-2 text-xs font-semibold text-[#365167] transition-colors hover:bg-[#ecf8ff] hover:text-[#0f4c81] dark:border-[#1d3b4d] dark:bg-[#0d1a28] dark:text-[#dff8ff] dark:hover:bg-[#112335]"
            aria-label={t('topbar.languageSwitcher')}
            title={t('topbar.languageSwitcher')}
          >
            <Languages className="h-4 w-4" />
            <span>{language === 'en' ? 'EN' : 'ខ្មែរ'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="dark-hover-border inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d7eaf4] bg-white text-[#5a7487] transition-colors hover:bg-[#ecf8ff] hover:text-[#0f4c81] dark:border-[#1d3b4d] dark:bg-[#0d1a28] dark:text-[#9eb5c8] dark:hover:bg-[#112335] dark:hover:text-[#dff8ff]"
            aria-label={isDark ? t('topbar.switchToLightTheme') : t('topbar.switchToDarkTheme')}
            title={isDark ? t('topbar.switchToLightTheme') : t('topbar.switchToDarkTheme')}
          >
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-500" />}
          </button>

          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d7eaf4] bg-white text-[#5a7487] transition-colors hover:bg-[#ecf8ff] hover:text-[#0f4c81] dark:border-[#1d3b4d] dark:bg-[#0d1a28] dark:text-[#9eb5c8] dark:hover:bg-[#112335] dark:hover:text-[#dff8ff]"
            aria-label={t('topbar.notifications')}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="dark-hover-border flex items-center gap-2 rounded-full border border-[#d7eaf4] bg-white px-2 py-1.5 text-[#365167] shadow-sm transition-colors hover:bg-[#ecf8ff] dark:border-[#1d3b4d] dark:bg-[#0d1a28] dark:text-[#e3f7ff] dark:hover:bg-[#112335]"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#1098c7] to-[#13b6a5] text-xs font-bold text-white">
                {initials}
              </span>
              <span className="hidden max-w-32 truncate text-sm font-semibold sm:inline">{user?.name || t('common.user')}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {menuOpen ? (
              <div className="dark-hover-border absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-[#d7eaf4] bg-white shadow-lg dark:border-[#1d3b4d] dark:bg-[#0d1a28]">
                <div className="border-b border-[#d7eaf4] bg-[#f3fbff] px-4 py-3 dark:border-[#1d3b4d] dark:bg-[#112335]">
                  <p className="text-sm font-semibold text-[#17384f] dark:text-[#eefbff]">{user?.name || t('common.unknownUser')}</p>
                  <p className="text-xs text-[#678197] dark:text-[#8ea7ba]">{user?.email || t('common.noEmail')}</p>
                  <p className="mt-1 inline-flex rounded-full bg-[#daf6ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0b6b86] dark:bg-[#143246] dark:text-[#82e8f7]">
                    {t(`roles.${activeRole}`)}
                  </p>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#365167] transition-colors hover:bg-[#f3fbff] dark:text-[#e3f7ff] dark:hover:bg-[#112335]"
                >
                  <Settings className="h-4 w-4" />
                  {t('topbar.profileSettings')}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 border-b border-[#d7eaf4] px-4 py-3 text-left text-sm font-medium text-[#365167] transition-colors hover:bg-[#f3fbff] dark:border-[#1d3b4d] dark:text-[#e3f7ff] dark:hover:bg-[#112335]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    {t('topbar.notifications')}
                  </span>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#daf6ff] px-1 text-[11px] font-semibold text-[#0b6b86] dark:bg-[#143246] dark:text-[#82e8f7]">
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
                  {t('topbar.logOut')}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
