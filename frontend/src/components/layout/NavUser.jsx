import { useEffect, useState } from 'react'
import { CheckCircle2, LogOut, ShieldCheck, Stethoscope, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { ConfirmDialog, UserAvatar } from '@/components/ui'
import { cn } from '@/lib/utils'

function getRoleMeta(role, t) {
  const normalized = String(role || 'user').toLowerCase().trim()
  if (normalized === 'doctor' || normalized === 'physician') {
    return {
      label: t('roles.doctor', 'Doctor'),
      icon: Stethoscope,
      badgeClass: 'bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-600/20 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-500/30',
      avatarGradient: 'from-cyan-600 to-blue-600',
    }
  }
  if (normalized === 'admin' || normalized === 'super_admin') {
    return {
      label: normalized === 'super_admin' ? t('roles.super_admin', 'Super Admin') : t('roles.admin', 'Admin'),
      icon: ShieldCheck,
      badgeClass: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-500/30',
      avatarGradient: 'from-purple-600 to-indigo-600',
    }
  }
  if (normalized === 'reviewer' || normalized === 'clinical_reviewer') {
    return {
      label: t('roles.reviewer', 'Reviewer'),
      icon: CheckCircle2,
      badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/30',
      avatarGradient: 'from-amber-500 to-orange-600',
    }
  }
  return {
    label: t(`roles.${normalized}`, 'Patient'),
    icon: User,
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/30',
    avatarGradient: 'from-emerald-500 to-teal-600',
  }
}

export function NavUser({ user: propUser, collapsed = false, onLogout }) {
  const { user: authUser } = useAuth()
  const user = { ...authUser, ...propUser }
  const { t } = useLanguage()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [user?.avatar_url])

  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const activeRole = user?.roles?.[0] || user?.role || 'user'
  const roleMeta = getRoleMeta(activeRole, t)
  const RoleIcon = roleMeta.icon

  if (collapsed) {
    return (
      <>
        <div className="flex flex-col items-center gap-2">
          <UserAvatar
            name={user?.name}
            src={user?.avatar_url}
            size="md"
            status={true}
            className="h-10 w-10 shadow-sm"
            title={`${user?.name || t('common.user')} (${roleMeta.label})`}
          />

          <button
            type="button"
            aria-label={t('topbar.logOut', 'Log out')}
            title={t('topbar.logOut', 'Log out')}
            onClick={() => setShowLogoutConfirm(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-[#1e2234] dark:bg-[#101020] dark:text-slate-400 dark:hover:border-rose-900/50 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <ConfirmDialog
          open={showLogoutConfirm}
          title={t('common.logoutConfirmTitle', 'Log out?')}
          description={t('common.logoutConfirmDesc', 'Are you sure you want to log out of your account?')}
          confirmLabel={t('topbar.logOut', 'Log out')}
          cancelLabel={t('common.cancel', 'Cancel')}
          confirmTone="danger"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            setShowLogoutConfirm(false)
            onLogout?.()
          }}
        />
      </>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-2.5 shadow-sm transition-all dark:border-[#1e2234] dark:bg-[#0c101c]">
        {/* Profile Details */}
        <div className="flex items-center gap-2.5">
          <UserAvatar
            name={user?.name}
            src={user?.avatar_url}
            size="md"
            status={true}
            className="h-10 w-10 shadow-sm"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {user?.name || t('common.unknownUser')}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {user?.email || t('common.noEmail')}
            </p>
          </div>
        </div>

        {/* Action / Meta Footer Bar */}
        <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/60 pt-2 dark:border-[#1e2234]/60">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', roleMeta.badgeClass)}>
            <RoleIcon className="h-3 w-3" />
            <span>{roleMeta.label}</span>
          </span>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{t('topbar.logOut', 'Log out')}</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title={t('common.logoutConfirmTitle', 'Log out?')}
        description={t('common.logoutConfirmDesc', 'Are you sure you want to log out of your account?')}
        confirmLabel={t('topbar.logOut', 'Log out')}
        cancelLabel={t('common.cancel', 'Cancel')}
        confirmTone="danger"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false)
          onLogout?.()
        }}
      />
    </>
  )
}
