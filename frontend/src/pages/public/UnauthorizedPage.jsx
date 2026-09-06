import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Home,
  Languages,
  LayoutDashboard,
  Lock,
  LogOut,
  Moon,
  ShieldAlert,
  Sun,
  User,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'

const BRAND_LOGO_SRC = '/images/logo.png'

export function UnauthorizedPage({ isAuthenticated = false }) {
  const { language, setLanguage, t } = useLanguage()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logoVisible, setLogoVisible] = useState(true)

  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = window.localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'km' : 'en')
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(isAuthenticated ? '/dashboard' : '/')
    }
  }

  const homeTarget = isAuthenticated ? '/dashboard' : '/'

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-slate-50/80 text-slate-900 transition-colors duration-200 dark:bg-[#060814] dark:text-slate-100">
      {/* ── Ambient Background Glows ── */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-rose-500/10 blur-3xl dark:bg-rose-500/15" />
      <div className="pointer-events-none absolute -bottom-40 right-10 -z-10 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl dark:bg-primary-500/15" />

      {/* ── Top Navigation Bar ── */}
      <header className="flex w-full items-center justify-between px-4 py-4 sm:px-8">
        <Link
          to={homeTarget}
          className="group flex items-center gap-3 transition-transform hover:scale-[1.01]"
        >
          {logoVisible ? (
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200 dark:bg-[#0c1024] dark:ring-slate-800">
              <img
                src={BRAND_LOGO_SRC}
                alt="Diabetes Expert System"
                className="h-full w-full object-contain"
                onError={() => setLogoVisible(false)}
              />
            </span>
          ) : (
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-sm font-bold text-white shadow-sm dark:bg-primary-900 dark:text-primary-200">
              DX
            </span>
          )}
          <div className="flex flex-col text-left">
            <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
              Diabetes
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Expert System
            </span>
          </div>
        </Link>

        {/* Quick controls: Language, Theme & User status */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-slate-100 dark:border-[#1e2544] dark:bg-[#0e132c]/80 dark:text-slate-200 dark:hover:bg-[#161d42]"
            title="Switch Language"
          >
            <Languages className="h-3.5 w-3.5 text-primary-500" />
            <span>{language === 'en' ? 'ភាសាខ្មែរ' : 'English'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-slate-100 dark:border-[#1e2544] dark:bg-[#0e132c]/80 dark:text-slate-300 dark:hover:bg-[#161d42]"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {user && (
            <div className="ml-1 hidden items-center gap-2 sm:flex">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-2.5 py-1 text-xs shadow-sm backdrop-blur dark:border-[#1e2544] dark:bg-[#0e132c]/80">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="max-w-[8rem] truncate font-medium text-slate-700 dark:text-slate-200">
                  {user.name || user.email}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200/60 bg-rose-50/60 text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Error Card ── */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center shadow-2xl shadow-slate-200/50 backdrop-blur-xl transition-all sm:p-10 dark:border-[#1e2544] dark:bg-[#0d122c]/90 dark:shadow-none">
          {/* Animated Glowing Icon Badge */}
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 shadow-inner ring-8 ring-rose-50/60 transition-transform duration-300 hover:scale-105 dark:bg-rose-950/40 dark:ring-rose-950/30">
            <ShieldAlert className="h-10 w-10 text-rose-600 dark:text-rose-400" />
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-2 ring-rose-100 dark:bg-[#151b3a] dark:ring-rose-900/60">
              <Lock className="h-3.5 w-3.5 text-rose-500" />
            </div>
          </div>

          {/* Error Tag */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/80 px-3.5 py-1 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>{t('publicPages.unauthorized.badge', 'Error 403')}</span>
            <span className="text-rose-300 dark:text-rose-700">•</span>
            <span>{t('publicPages.unauthorized.eyebrow', 'Access Control')}</span>
          </div>

          {/* Heading */}
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {t('publicPages.unauthorized.title', 'Access Restricted')}
          </h1>

          {/* Description */}
          <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            {t(
              'publicPages.unauthorized.description',
              'You do not have permission to access this page.'
            )}
          </p>

          {/* Helpful Help Callout */}
          <div className="my-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-left text-xs text-slate-600 dark:border-[#1e2544] dark:bg-[#111736]/70 dark:text-slate-400">
            <p className="leading-relaxed">
              {t(
                'publicPages.unauthorized.helpNotice',
                'If you believe this is an error, please contact your system administrator to update your role permissions.'
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-[0.98] dark:bg-primary-500 dark:hover:bg-primary-400"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>{t('publicPages.unauthorized.backDashboard', 'Back to Dashboard')}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-[0.98] dark:bg-primary-500 dark:hover:bg-primary-400"
              >
                <Lock className="h-4 w-4" />
                <span>{t('publicPages.unauthorized.goLogin', 'Go to Login')}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] dark:border-[#1e2544] dark:bg-[#111736] dark:text-slate-200 dark:hover:bg-[#171f48]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('publicPages.unauthorized.goBack', 'Previous Page')}</span>
            </button>

            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-[#141b3d] dark:hover:text-slate-200"
              title="Landing Page"
            >
              <Home className="h-4 w-4" />
              <span>{t('publicPages.unauthorized.home', 'Home')}</span>
            </Link>
          </div>
        </div>
      </main>

      {/* ── Clean Footer ── */}
      <footer className="px-4 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        <span>© {new Date().getFullYear()} Diabetes Expert System • Clinical Decision Support v2.0</span>
      </footer>
    </div>
  )
}
