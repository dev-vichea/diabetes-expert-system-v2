import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, LogOut, MoreVertical, ShieldCheck, Stethoscope, User } from 'lucide-react'
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
  const normalized = String(role || 'doctor').toLowerCase().trim()
  if (normalized === 'doctor' || normalized === 'physician' || normalized === 'endocrinologist') {
    return {
      label: t('roles.doctor', 'Doctor'),
      specialty: 'Endocrinologist',
      icon: Stethoscope,
      badgeClass: 'bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-600/20 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-500/30',
      avatarGradient: 'from-cyan-600 to-blue-600',
    }
  }
  if (normalized === 'admin') {
    return {
      label: t('roles.admin', 'Admin'),
      specialty: 'System Admin',
      icon: ShieldCheck,
      badgeClass: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-500/30',
      avatarGradient: 'from-purple-600 to-indigo-600',
    }
  }
  if (normalized === 'reviewer' || normalized === 'clinical_reviewer') {
    return {
      label: t('roles.reviewer', 'Reviewer'),
      specialty: 'Clinical Reviewer',
      icon: CheckCircle2,
      badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/30',
      avatarGradient: 'from-amber-500 to-orange-600',
    }
  }
  return {
    label: t(`roles.${normalized}`, 'Patient'),
    specialty: 'Patient',
    icon: User,
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/30',
    avatarGradient: 'from-emerald-500 to-teal-600',
  }
}

function UserDropdownContent({ user, roleMeta, onNavigateProfile, onTriggerLogout, t }) {
  const RoleIcon = roleMeta.icon

  return (
    <>
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <UserAvatar
          name={user?.name}
          src={user?.avatar_url}
          size="sm"
          status={true}
          className="h-8 w-8 shrink-0 shadow-sm"
        />
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100" title={user?.name}>
            {user?.name}
          </p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400" title={user?.email}>
            {user?.email}
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
        className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
      >
        <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <span>{t('topbar.profile', 'View Profile')}</span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={onTriggerLogout}
        className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
      >
        <LogOut className="h-4 w-4 text-rose-500 dark:text-rose-400" />
        <span>{t('topbar.logOut', 'Log out')}</span>
      </DropdownMenuItem>
    </>
  )
}

export function NavUser({ user: propUser, collapsed = false, onLogout }) {
  const { user: authUser } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Provide realistic Doctor Lina defaults if empty
  const rawUser = { ...authUser, ...propUser }
  const user = {
    name: rawUser?.name || 'Dr. Lina',
    email: rawUser?.email || 'dr.lina@diabetes-care.org',
    avatar_url: rawUser?.avatar_url,
    role: rawUser?.roles?.[0] || rawUser?.role || 'doctor',
    roles: rawUser?.roles || ['doctor'],
  }

  const activeRole = user?.role || 'doctor'
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
        <div className="flex w-full justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-[#181830] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label={user.name}
                title={`${user.name} (${user.email})`}
              >
                <UserAvatar
                  name={user.name}
                  src={user.avatar_url}
                  size="md"
                  status={true}
                  className="h-8 w-8 shrink-0 shadow-xs"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" sideOffset={12} className="w-60 p-1.5 shadow-xl border-slate-200 dark:border-slate-800">
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
      <div className="w-full min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group flex w-full min-w-0 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label={t('common.userMenu', 'User menu')}
            >
              <UserAvatar
                name={user.name}
                src={user.avatar_url}
                size="md"
                status={true}
                className="h-9 w-9 shrink-0 shadow-xs"
              />

              {/* Text block with robust truncation prevention */}
              <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
                <span
                  className="truncate text-[13px] font-semibold leading-tight text-slate-800 dark:text-slate-100"
                  title={user.name}
                >
                  {user.name}
                </span>
                <span
                  className="truncate text-[11px] font-medium leading-normal text-slate-400 dark:text-slate-500"
                  title={user.email}
                >
                  {user.email}
                </span>
              </div>

              {/* Action Menu icon */}
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300">
                <MoreVertical className="h-4 w-4" />
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-60 p-1.5 shadow-xl border-slate-200 dark:border-slate-800">
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
