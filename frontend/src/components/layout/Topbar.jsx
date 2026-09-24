import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  Sun,
  UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HeaderClock } from './HeaderClock'
import { NotificationDropdown } from './NotificationDropdown'
import { UserAvatar } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNotifications } from '@/contexts/NotificationContext'

/**
 * Cambodian Flag SVG (🇰🇭)
 * Aspect ratio 3:2, Blue/Red/Blue stripes with Angkor Wat white silhouette
 */
export function CambodiaFlag({ className = 'h-3.5 w-5 shrink-0 rounded-[2px] shadow-2xs' }) {
  return (
    <svg className={className} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <clipPath id="kh-flag-clip"><rect width="60" height="40" rx="2" /></clipPath>
      <g clipPath="url(#kh-flag-clip)">
        {/* Top blue stripe */}
        <rect width="60" height="10" fill="#032EA6" />
        {/* Middle red stripe */}
        <rect y="10" width="60" height="20" fill="#E00025" />
        {/* Bottom blue stripe */}
        <rect y="30" width="60" height="10" fill="#032EA6" />
        {/* Angkor Wat silhouette */}
        <g fill="#FFFFFF">
          {/* Base tiers */}
          <rect x="16" y="26.5" width="28" height="2.5" rx="0.5" />
          <rect x="18.5" y="24" width="23" height="2.5" />
          {/* Lower colonnade */}
          <rect x="21" y="21.5" width="18" height="2.5" />
          {/* Central main tower */}
          <polygon points="30,13 27.5,21.5 32.5,21.5" />
          <rect x="29" y="12" width="2" height="2" />
          {/* Left tower */}
          <polygon points="24.5,15.5 22.5,21.5 26.5,21.5" />
          <rect x="23.5" y="14.5" width="2" height="2" />
          {/* Right tower */}
          <polygon points="35.5,15.5 33.5,21.5 37.5,21.5" />
          <rect x="34.5" y="14.5" width="2" height="2" />
          {/* Spire tips */}
          <line x1="30" y1="10.5" x2="30" y2="13" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="24.5" y1="13" x2="24.5" y2="15.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
          <line x1="35.5" y1="13" x2="35.5" y2="15.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}

/**
 * US Flag SVG (🇺🇸)
 * Crisp stripes and canton with stars
 */
export function UsFlag({ className = 'h-3.5 w-5 shrink-0 rounded-[2px] shadow-2xs' }) {
  return (
    <svg className={className} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <clipPath id="us-flag-clip"><rect width="60" height="40" rx="2" /></clipPath>
      <g clipPath="url(#us-flag-clip)">
        {/* Background red */}
        <rect width="60" height="40" fill="#B22234" />
        {/* White stripes */}
        <path
          d="M0 3.08H60M0 9.24H60M0 15.4H60M0 21.56H60M0 27.72H60M0 33.88H60"
          stroke="#FFFFFF"
          strokeWidth="3.08"
        />
        {/* Blue Canton */}
        <rect width="25" height="21.56" fill="#3C3B6E" />
        {/* Star dots */}
        <g fill="#FFFFFF">
          <circle cx="5" cy="4.5" r="1.1" />
          <circle cx="12.5" cy="4.5" r="1.1" />
          <circle cx="20" cy="4.5" r="1.1" />
          <circle cx="8.75" cy="9" r="1.1" />
          <circle cx="16.25" cy="9" r="1.1" />
          <circle cx="5" cy="13.5" r="1.1" />
          <circle cx="12.5" cy="13.5" r="1.1" />
          <circle cx="20" cy="13.5" r="1.1" />
          <circle cx="8.75" cy="18" r="1.1" />
          <circle cx="16.25" cy="18" r="1.1" />
        </g>
      </g>
    </svg>
  )
}

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
  const { unreadCount } = useNotifications()
  const canViewNotifications = Boolean(user?.permissions?.includes('notification.view'))
  const navigate = useNavigate()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const langMenuRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeRole = user?.roles?.[0] || user?.role || 'user'
  const roleLabel = t(
    `roles.${activeRole}`,
    activeRole.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
  const isDark = theme === 'dark'

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-[72px] shrink-0 w-full items-center px-4 sm:px-6 select-none backdrop-blur-md transition-all duration-150',
        isDark
          ? 'bg-[#070712]/90 border-b border-slate-800/60'
          : 'bg-white/90 border-b border-slate-200/60'
      )}
    >
      <div className="flex min-w-0 w-full items-center justify-between gap-3">
        {/* ======================================================== */}
        {/* Left Section: Sidebar Toggle + Title & Subtitle          */}
        {/* ======================================================== */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          {/* Desktop Sidebar Toggle Button */}
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all duration-150 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:inline-flex"
            aria-label={isSidebarCollapsed ? t('topbar.expandSidebar') : t('topbar.collapseSidebar')}
            title={isSidebarCollapsed ? t('topbar.expandSidebar') : t('topbar.collapseSidebar')}
          >
            <PanelLeft
              className={cn(
                'h-4.5 w-4.5 transition-transform duration-200',
                isSidebarCollapsed ? 'rotate-180' : 'rotate-0'
              )}
            />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-all duration-150 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
            aria-label={t('topbar.openMenu')}
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          {/* Page Heading & Context (Clean 1-line SaaS layout) */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {/* Show parent breadcrumb ONLY if deep nested (never duplicate current title) */}
            {breadcrumbs.length > 1 && (
              <nav
                aria-label={t('topbar.breadcrumb')}
                className="hidden items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 sm:flex"
              >
                {breadcrumbs.slice(0, -1).map((crumb, index) => (
                  <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                    {crumb.to ? (
                      <Link
                        to={crumb.to}
                        className="truncate transition-colors hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="truncate">{crumb.label}</span>
                    )}
                    <ChevronRight className="h-3 w-3 text-slate-400/60 dark:text-slate-600" />
                  </span>
                ))}
              </nav>
            )}

            <h1 className="truncate text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              {page.title}
            </h1>

            {page.subtitle && (
              <>
                <span className="hidden text-slate-300 dark:text-slate-700 sm:inline select-none text-xs">
                  •
                </span>
                <p className="hidden truncate text-xs font-normal text-slate-400 dark:text-slate-500 sm:inline leading-none">
                  {page.subtitle}
                </p>
              </>
            )}
          </div>
        </div>


        {/* ======================================================== */}
        {/* Right Section: Actions & Controls                        */}
        {/* ======================================================== */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {/* Date Clock Indicator (Sleek Ghost Chip) */}
          <HeaderClock theme={theme} language={language} />

          {/* Hairline Divider */}
          <div className="hidden h-5 w-px bg-slate-200/80 dark:bg-slate-800/80 sm:block mx-0.5" />

          {/* ======================================================== */}
          {/* Language Switcher with SVG Flag                         */}
          {/* ======================================================== */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              className="inline-flex h-9 items-center gap-2 rounded-xl px-2.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label={t('topbar.languageSwitcher')}
              title={t('topbar.languageSwitcher')}
            >
              {language === 'km' ? <CambodiaFlag /> : <UsFlag />}
              <span className="font-semibold">{language === 'km' ? 'KM' : 'EN'}</span>
              <ChevronDown className="h-3 w-3 text-slate-400 transition-transform" />
            </button>

            {/* Language Popover Menu */}
            {langMenuOpen && (
              <div className="absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('en')
                    setLangMenuOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors',
                    language === 'en'
                      ? 'bg-primary-50 text-primary-700 font-semibold dark:bg-primary-500/15 dark:text-primary-300'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <UsFlag />
                    <span>English</span>
                  </div>
                  {language === 'en' && <Check className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLanguage('km')
                    setLangMenuOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors',
                    language === 'km'
                      ? 'bg-primary-50 text-primary-700 font-semibold dark:bg-primary-500/15 dark:text-primary-300'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <CambodiaFlag />
                    <span>ភាសាខ្មែរ</span>
                  </div>
                  {language === 'km' && <Check className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle Button (Sun / Moon) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all duration-150 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={isDark ? t('topbar.switchToLightTheme') : t('topbar.switchToDarkTheme')}
            title={isDark ? t('topbar.switchToLightTheme') : t('topbar.switchToDarkTheme')}
          >
            {isDark ? (
              <Moon className="h-4 w-4 transition-transform hover:-rotate-12" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500 transition-transform hover:rotate-45" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {canViewNotifications && <NotificationDropdown />}

          {/* ======================================================== */}
          {/* User Profile Pill & Dropdown                            */}
          {/* ======================================================== */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1 text-slate-700 transition-all duration-150 hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-800/60 outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label={t('common.userMenu', 'User menu')}
            >
              {/* Name & Role Subtitle on the left */}
              <div className="hidden flex-col items-end text-right leading-tight md:flex min-w-0">
                <span
                  className="max-w-36 truncate text-xs font-semibold text-slate-800 dark:text-slate-200"
                  title={user?.name}
                >
                  {user?.name || t('common.user')}
                </span>
                <span
                  className="max-w-36 truncate text-[10.5px] font-medium text-slate-400 dark:text-slate-500"
                  title={roleLabel}
                >
                  {roleLabel}
                </span>
              </div>

              {/* Avatar normal size (h-8 w-8) aligned to the right of name */}
              <UserAvatar
                name={user?.name}
                src={user?.avatar_url}
                size="sm"
                className="h-8 w-8 shrink-0 rounded-full"
              />

              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Profile Dropdown Popover */}
            {userMenuOpen && (
              <div className="absolute right-0 z-30 mt-2 w-[min(17.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95">
                {/* User Summary Header */}
                <div className="flex items-center gap-3 border-b border-slate-100 p-2.5 dark:border-slate-800/80">
                  <UserAvatar
                    name={user?.name}
                    src={user?.avatar_url}
                    size="md"
                    className="h-10 w-10 shrink-0 rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100" title={user?.name}>
                      {user?.name || t('common.unknownUser')}
                    </p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400" title={user?.email}>
                      {user?.email || t('common.noEmail')}
                    </p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => {
                      setUserMenuOpen(false)
                      navigate('/profile')
                    }}
                  >
                    <UserRound className="h-3.5 w-3.5 text-slate-400" />
                    <span>{t('topbar.profile', 'Profile')}</span>
                  </button>

                  {canViewNotifications && (
                    <div className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200">
                      <span className="inline-flex items-center gap-2.5">
                        <Bell className="h-3.5 w-3.5 text-slate-400" />
                        <span>{t('topbar.notifications')}</span>
                      </span>
                      {unreadCount > 0 ? (
                        <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-100 px-1.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                          {unreadCount}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">0</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="my-0.5 h-px bg-slate-100 dark:bg-slate-800/80" />

                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                  onClick={() => {
                    setUserMenuOpen(false)
                    onLogout?.()
                  }}
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-500" />
                  <span>{t('topbar.logOut')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
