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
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-sky-500 text-xs font-bold text-white"
          title={user?.name || t('common.user')}
        >
          {initials}
        </span>
        <button
          type="button"
          aria-label={t('topbar.logOut')}
          title={t('topbar.logOut')}
          onClick={onLogout}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:border-[#1e2234] dark:bg-[#101020] dark:text-slate-400 dark:hover:bg-[#181830] dark:hover:text-primary-300"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="px-1 py-1">
      <div className="dark-hover-border flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-slate-700 shadow-sm transition-colors hover:bg-primary-50 dark:border-[#1e2234] dark:bg-[#101020] dark:text-slate-200 dark:hover:bg-[#181830]">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-sky-500 text-xs font-bold text-white">
          {initials}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name || t('common.unknownUser')}</p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user?.email || t('common.noEmail')}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {t('common.role')}: {t(`roles.${user?.role || 'user'}`)}
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-slate-400 dark:hover:bg-[#181830] dark:hover:text-slate-100"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t('topbar.logOut')}
        </button>
      </div>
    </div>
  )
}
