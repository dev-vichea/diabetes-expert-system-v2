import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, LogOut, MoreHorizontal, ShieldCheck, Stethoscope, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  UserAvatar,
} from '@/components/ui'
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

function UserDropdownContent({ user, roleMeta, onNavigateProfile, onTriggerLogout, t }) {
  const RoleIcon = roleMeta.icon

  return (
    <>
      <div className="flex items-center gap-2.5 px-2.5 py-2">
        <UserAvatar
          name={user?.name}
          src={user?.avatar_url}
          size="sm"
          className="h-8 w-8 shrink-0 shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
            {user?.name || t('common.unknownUser')}
          </p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {user?.email || t('common.noEmail')}
          </p>
          <div className="mt-1">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider', roleMeta.badgeClass)}>
              <RoleIcon className="h-2.5 w-2.5" />
              <span>{roleMeta.label}</span>
            </span>
          </div>
        </div>
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={onNavigateProfile}
        className="flex cursor-pointer items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
      >
        <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <span>{t('topbar.profile', 'Profile')}</span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={onTriggerLogout}
        className="flex cursor-pointer items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
      >
        <LogOut className="h-4 w-4 text-rose-500 dark:text-rose-400" />
        <span>{t('topbar.logOut', 'Log out')}</span>
      </DropdownMenuItem>
    </>
  )
}

export function NavUser({ user: propUser, collapsed = false, onLogout }) {
  const { user: authUser } = useAuth()
  const user = { ...authUser, ...propUser }
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const activeRole = user?.roles?.[0] || user?.role || 'user'
  const roleMeta = getRoleMeta(activeRole, t)

  const handleNavigateProfile = () => {
    navigate('/profile')
  }

  const handleTriggerLogout = () => {
    setShowLogoutConfirm(true)
  }

  if (collapsed) {
    return (
      <>
        <div className="flex flex-col items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-[#181830] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label={user?.name || t('common.user')}
                title={`${user?.name || t('common.user')} (${roleMeta.label})`}
              >
                <UserAvatar
                  name={user?.name}
                  src={user?.avatar_url}
                  size="md"
                  status={true}
                  className="h-9 w-9 shadow-sm"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" sideOffset={12} className="w-56 p-1.5 shadow-xl">
              <UserDropdownContent
                user={user}
                roleMeta={roleMeta}
                onNavigateProfile={handleNavigateProfile}
                onTriggerLogout={handleTriggerLogout}
                t={t}
              />
            </DropdownMenuContent>
          </DropdownMenu>
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
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group flex w-full min-w-0 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-[#121626] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label={t('common.userMenu', 'User menu')}
            >
              <UserAvatar
                name={user?.name}
                src={user?.avatar_url}
                size="md"
                status={true}
                className="h-9 w-9 shrink-0 shadow-sm"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {user?.name || t('common.unknownUser')}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.email || t('common.noEmail')}
                </p>
              </div>

              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors group-hover:bg-slate-200/60 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:bg-[#1e2234] dark:group-hover:text-slate-100">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-56 p-1.5 shadow-xl">
            <UserDropdownContent
              user={user}
              roleMeta={roleMeta}
              onNavigateProfile={handleNavigateProfile}
              onTriggerLogout={handleTriggerLogout}
              t={t}
            />
          </DropdownMenuContent>
        </DropdownMenu>
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
