import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { NavDocuments } from './NavDocuments'
import { NavMain } from './NavMain'
import { NavSecondary } from './NavSecondary'
import { NavUser } from './NavUser'
import { useLanguage } from '@/contexts/LanguageContext'
import { getGroupedNavSections } from '@/lib/nav-config'
import { cn } from '@/lib/utils'

const BRAND_LOGO_SRC = '/images/logo.png'

export function Sidebar({
  navItems,
  user,
  userName = '',
  userEmail = '',
  activeRole = 'patient',
  onLogout,
  onClose,
  collapsed = false,
  className,
}) {
  const { t } = useLanguage()
  const [logoVisible, setLogoVisible] = useState(true)

  const effectiveUser = user || {
    name: userName,
    email: userEmail,
    role: activeRole,
  }

  const sections = getGroupedNavSections(navItems, effectiveUser, t)

  return (
    <aside
      className={cn(
        'relative flex h-full min-h-0 w-full flex-col justify-between overflow-hidden border-r border-slate-200/80 bg-white select-none transition-all duration-200 dark:border-slate-800/80 dark:bg-[#070712]',
        className
      )}
    >
      {/* Upper section: Branding + Scrollable Nav */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Top Branding (no background, no border) */}
        <div
          className={cn(
            'relative flex h-[72px] shrink-0 items-center transition-all',
            collapsed ? 'justify-center px-2' : 'px-4'
          )}
        >
          <Link
            to="/dashboard"
            className={cn(
              'group flex items-center gap-3 transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl',
              collapsed ? 'justify-center p-1' : 'px-1'
            )}
            title="Diabetes Expert System"
          >
            {/* Medical / Clinical Logo - Clean without bg or border */}
            {logoVisible ? (
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">
                <img
                  src={BRAND_LOGO_SRC}
                  alt="Diabetes Expert System logo"
                  className="h-full w-full object-contain"
                  onError={() => setLogoVisible(false)}
                />
              </span>
            ) : (
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-base font-bold text-white dark:bg-primary-900 dark:text-primary-200">
                DX
              </span>
            )}

            {/* Typography: Primary Title + Secondary Subtitle */}
            {!collapsed && (
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Diabetes
                </span>
                <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                  Expert System
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Drawer Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden"
              aria-label={t('common.closeSidebar', 'Close sidebar')}
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {/* Middle Navigation (Role-based Groups) */}
        <div
          className={cn(
            'custom-scrollbar flex-1 overflow-y-auto space-y-6 py-2',
            collapsed ? 'px-2' : 'px-3'
          )}
        >
          {sections.map((section) => {
            const NavComponent = section.id === 'documents' ? NavDocuments : NavMain
            return (
              <NavComponent
                key={section.id}
                title={section.title}
                items={section.items}
                collapsed={collapsed}
              />
            )
          })}
        </div>
      </div>

      {/* Lower section: Tools + Profile Card (No bg, no border) */}
      <div
        className={cn(
          'shrink-0 flex flex-col space-y-2',
          collapsed ? 'p-2' : 'p-3'
        )}
      >
        {/* TOOLS Section */}
        <NavSecondary collapsed={collapsed} />

        {/* Bottom Profile Card */}
        <NavUser
          user={effectiveUser}
          collapsed={collapsed}
          onLogout={onLogout}
        />
      </div>
    </aside>
  )
}

