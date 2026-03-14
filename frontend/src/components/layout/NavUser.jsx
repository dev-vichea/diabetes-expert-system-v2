import { LogOut } from 'lucide-react'

export function NavUser({ user, collapsed = false, onLogout }) {
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#6d4bff] to-[#1699ff] text-xs font-bold text-white"
          title={user?.name || 'User'}
        >
          {initials}
        </span>
        <button
          type="button"
          aria-label="Logout"
          title="Logout"
          onClick={onLogout}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:bg-[#090f20] dark:text-slate-300 dark:hover:bg-[#0f1529] dark:hover:text-slate-100"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="px-1 py-1">
      <div className="dark-hover-border flex w-full items-center gap-2 rounded-full bg-white px-2 py-1.5 text-slate-700 shadow-sm transition-colors hover:bg-slate-100 dark:bg-[#090f20] dark:text-slate-200 dark:hover:bg-[#0f1529]">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#6d4bff] to-[#1699ff] text-xs font-bold text-white">
          {initials}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name || 'Unknown User'}</p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user?.email || 'No email'}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Role: {user?.role || 'user'}
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#141b31] dark:hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </button>
      </div>
    </div>
  )
}
