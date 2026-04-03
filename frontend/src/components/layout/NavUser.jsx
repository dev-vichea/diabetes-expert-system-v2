import { LogOut } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export function NavUser({ user, collapsed = false, onLogout }) {
  const { t } = useLanguage()
  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#0ea5b7] to-[#1792ff] text-xs font-bold text-white"
          title={user?.name || t('common.user')}
        >
          {initials}
        </span>
        <button
          type="button"
          aria-label={t('topbar.logOut')}
          title={t('topbar.logOut')}
          onClick={onLogout}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8ecf7] bg-white text-[#547085] transition-colors hover:bg-[#ecf8ff] hover:text-[#0f4c81] dark:border-[#1d3b4d] dark:bg-[#0d1a28] dark:text-[#9eb5c8] dark:hover:bg-[#112335] dark:hover:text-[#dcf7ff]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="px-1 py-1">
      <div className="dark-hover-border flex w-full items-center gap-2 rounded-full border border-[#d8ecf7] bg-white px-2 py-1.5 text-[#365167] shadow-sm transition-colors hover:bg-[#ecf8ff] dark:border-[#1d3b4d] dark:bg-[#0d1a28] dark:text-[#dff4ff] dark:hover:bg-[#112335]">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#0ea5b7] to-[#1792ff] text-xs font-bold text-white">
          {initials}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-[#17384f] dark:text-[#eefbff]">{user?.name || t('common.unknownUser')}</p>
          <p className="truncate text-[11px] text-[#678197] dark:text-[#8ea7ba]">{user?.email || t('common.noEmail')}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-[#678197] dark:text-[#8ea7ba]">
          {t('common.role')}: {t(`roles.${user?.role || 'user'}`)}
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#547085] transition-colors hover:bg-[#ecf8ff] hover:text-[#0f4c81] dark:text-[#9eb5c8] dark:hover:bg-[#112335] dark:hover:text-[#eefbff]"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t('topbar.logOut')}
        </button>
      </div>
    </div>
  )
}
