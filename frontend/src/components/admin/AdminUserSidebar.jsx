import { CalendarDays, Mail, Shield, UserRound } from 'lucide-react'
import { StatusBadge } from '@/components/ui'
import { cn } from '@/lib/utils'

function getInitials(name) {
  const parts = String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
  if (!parts.length) return 'U'
  return parts.map((part) => part[0].toUpperCase()).join('')
}

function formatDateTime(value) {
  if (!value) return 'Unknown'
  return new Date(value).toLocaleString()
}

function roleBadgeClass(role) {
  const normalized = String(role || '').toLowerCase()
  if (normalized === 'admin') return 'bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800/60'
  if (normalized === 'doctor') return 'bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-800/60'
  if (normalized === 'patient') return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800/60'
  return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800/60'
}

export function AdminUserSidebar({ user, permissions = [], className }) {
  const primaryRole = user?.role || user?.roles?.[0] || 'patient'

  return (
    <aside className={cn('surface h-fit overflow-hidden p-0 xl:sticky xl:top-24', className)}>
      <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-100/80 text-3xl font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{user?.name || 'User'}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${roleBadgeClass(primaryRole)}`}>
                {primaryRole}
              </span>
              <StatusBadge tone={user?.is_active ? 'success' : 'neutral'}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </StatusBadge>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3">
          <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              <Mail className="h-3.5 w-3.5" />
              Contact
            </div>
            <p className="mt-2 break-all text-sm font-medium text-slate-900 dark:text-slate-100">{user?.email || 'No email'}</p>
          </div>

          <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              <UserRound className="h-3.5 w-3.5" />
              Account ID
            </div>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">#{user?.id ?? 'N/A'}</p>
          </div>

          <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              Timeline
            </div>
            <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <p><span className="font-medium text-slate-900 dark:text-slate-100">Created:</span> {formatDateTime(user?.created_at)}</p>
              <p><span className="font-medium text-slate-900 dark:text-slate-100">Updated:</span> {formatDateTime(user?.updated_at)}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            <Shield className="h-3.5 w-3.5" />
            Effective Permissions
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {permissions.length ? (
              permissions.map((permission) => (
                <span
                  key={permission}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300"
                >
                  {permission}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No permissions available for this role.</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
