import { useMemo, useState, useEffect, useRef } from 'react'
import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api, { getApiData, getApiErrorMessage, setAuthTokens } from '../api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/auth/LanguageSwitcher'
import { AuthShowcasePanel } from '@/components/auth/AuthShowcasePanel'
import { GoogleLogin } from '@react-oauth/google'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

export function LoginPage() {
  const { setUser, loginWithGoogle } = useAuth()
  const { language, t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: 'doctor@example.com',
    password: 'doctor123',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const googleWrapperRef = useRef(null)
  const [googleWidth, setGoogleWidth] = useState(380)

  useEffect(() => {
    const el = googleWrapperRef.current
    if (!el) return

    const updateWidth = () => {
      const rect = el.getBoundingClientRect()
      const w = Math.floor(rect.width)
      if (w >= 200) {
        setGoogleWidth(Math.min(400, Math.max(200, w)))
      }
    }

    updateWidth()

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => updateWidth())
      ro.observe(el)
      return () => ro.disconnect()
    }
  }, [])

  const isValid = useMemo(
    () => Boolean(formData.email.trim() && formData.password.trim()),
    [formData.email, formData.password]
  )

  async function handleSubmit(event) {
    event.preventDefault()
    if (!isValid) {
      setError(t('auth.errorEmailPasswordRequired', 'Email and password are required.'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      })
      const data = getApiData(response)
      setAuthTokens(data.access_token || data.token, data.refresh_token)
      setUser(data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(getApiErrorMessage(err, t('auth.errorLoginFailed', 'Login failed')))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    if (!credentialResponse?.credential) return
    setLoading(true)
    setError('')
    try {
      const user = await loginWithGoogle(credentialResponse.credential)
      if (user?.role === 'patient' && !user?.profile_completed) {
        navigate('/profile-setup')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(getApiErrorMessage(err, t('auth.errorGoogleLoginFailed', 'Google sign-in failed. Please try again.')))
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleError() {
    setError(t('auth.errorGoogleLoginFailed', 'Google sign-in failed. Please try again.'))
  }

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] w-full flex flex-col lg:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-500/20">
      <style>{`
        .auth-google-box {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }

        .auth-google-box > div {
          width: 100% !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          background: transparent !important;
          border: none !important;
        }

        .auth-google-box iframe {
          display: block !important;
          border-radius: 10px !important;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04) !important;
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .auth-google-box:hover iframe {
          transform: translateY(-1px) !important;
          box-shadow: 0 6px 18px rgba(31, 118, 232, 0.16) !important;
        }

        .auth-google-box:active iframe {
          transform: translateY(0) !important;
          box-shadow: 0 2px 6px rgba(31, 118, 232, 0.12) !important;
        }

        html[lang='km'] .auth-heading {
          line-height: 1.4;
        }

        @media (min-height: 600px) {
          .auth-form-column {
            overflow-y: hidden !important;
          }
        }
      `}</style>

      {/* ── LEFT HALF: Sign In Form ── */}
      <div className="auth-form-column w-full lg:w-1/2 h-full max-h-[100dvh] flex flex-col justify-between px-6 py-4 sm:px-10 sm:py-5 lg:px-12 lg:py-6 relative overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800">
        {/* Header bar: Logo & Language Switcher */}
        <div className="flex items-center justify-between gap-4 w-full shrink-0">
          <Link to="/" className="inline-flex items-center gap-2.5 group transition-opacity hover:opacity-90">
            <img
              src="/images/logo.png"
              alt="Diabetes Expert System Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1"
                style={{ fontFamily: 'var(--font-latin-display)' }}
              >
                Diabetes Expert System
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                {language === 'km' ? 'ប្រព័ន្ធជំនាញគ្លីនិក v3.0' : 'Clinical Decision Support v3.0'}
              </span>
            </div>
          </Link>

          <LanguageSwitcher />
        </div>

        {/* Center Form Container */}
        <div className="w-full max-w-[400px] mx-auto my-auto py-2 sm:py-3">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/60 text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            <span>{t('auth.accentEyebrow', 'Diabetes Expert System')}</span>
          </div>

          <h1
            className="auth-heading text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight"
            style={{ fontFamily: 'var(--font-latin-display)' }}
          >
            {t('auth.loginPageTitle', 'Sign In')}
          </h1>
          <p
            className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 mb-3.5"
            style={{ fontFamily: 'var(--font-latin-sans)' }}
          >
            {t('auth.loginPageSub', 'Sign in to continue to your clinical dashboard.')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3" style={{ fontFamily: 'var(--font-latin-sans)' }}>
            {/* Email Field */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {t('auth.emailLabel', 'Email')}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <Mail size={16} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  placeholder={t('auth.emailPlaceholder', 'Email address')}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label htmlFor="password" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {t('auth.passwordLabel', 'Password')}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <LockKeyhole size={16} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  placeholder={t('auth.passwordPlaceholder', 'Password')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-[12px]">{t('auth.rememberMe', 'Remember me')}</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              style={{ fontFamily: 'var(--font-latin-display)' }}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('auth.signingIn', 'Signing in...')}</span>
                </>
              ) : (
                <span>{t('auth.login', 'Sign In')}</span>
              )}
            </button>

            {/* Google OAuth Login Button */}
            {googleClientId ? (
              <>
                <div className="relative my-2.5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
                  </div>
                  <div className="relative rounded-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {t('auth.orDivider', 'OR')}
                  </div>
                </div>

                <div ref={googleWrapperRef} className="auth-google-box flex justify-center w-full min-h-[40px]">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    locale={language || 'km'}
                    theme="outline"
                    size="medium"
                    width={String(googleWidth)}
                    text="signin_with"
                    shape="rectangular"
                    logo_alignment="left"
                    containerProps={{
                      style: {
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                      },
                    }}
                  />
                </div>
              </>
            ) : null}

            {/* Error Display */}
            {error ? (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium leading-relaxed flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            ) : null}

            {/* Bottom Link to Sign Up */}
            <p className="pt-1 text-center text-xs text-slate-500 dark:text-slate-400">
              {t('auth.noAccount', "Don't have an account?")}{' '}
              <Link
                to="/sign-up"
                state={{ authTransition: 'to-register' }}
                className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline ml-1"
              >
                {t('auth.signUp', 'Create Account')}
              </Link>
            </p>
          </form>
        </div>

        {/* Footer: Disclaimer / Status */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 gap-1.5 shrink-0">
          <span>© 2026 Diabetes Decision Support System</span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{language === 'km' ? 'ប្រព័ន្ធដំណើរការធម្មតា' : 'System Operational'}</span>
          </span>
        </div>
      </div>

      {/* ── RIGHT HALF: High-Impact Showcase of System ── */}
      <AuthShowcasePanel />
    </div>
  )
}
