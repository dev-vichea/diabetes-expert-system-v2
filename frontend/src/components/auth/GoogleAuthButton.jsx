import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useLanguage } from '@/contexts/LanguageContext'

export function GoogleIcon({ className = 'w-4 h-4 shrink-0' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        fill="#EA4335"
      />
    </svg>
  )
}

/**
 * Custom Google Sign-In / Sign-Up Button styled to match the primary form button
 * with full width, rounded-xl corners (12px), matching height, typography, and micro-interactions.
 */
export function GoogleAuthButton({
  mode = 'signin',
  onSuccess,
  onError,
  disabled = false,
  className = '',
}) {
  const { language, isKhmer, t } = useLanguage()
  const [internalLoading, setInternalLoading] = useState(false)

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setInternalLoading(true)
      try {
        if (onSuccess) {
          await onSuccess(tokenResponse)
        }
      } catch (err) {
        if (onError) onError(err)
      } finally {
        setInternalLoading(false)
      }
    },
    onError: (err) => {
      setInternalLoading(false)
      if (onError) onError(err)
    },
  })

  const label =
    mode === 'signup'
      ? isKhmer
        ? 'ចុះឈ្មោះជាមួយ Google'
        : t('auth.signupWithGoogle', 'Sign up with Google')
      : isKhmer
      ? 'ចូលគណនីជាមួយ Google'
      : t('auth.signinWithGoogle', 'Sign in with Google')

  return (
    <button
      type="button"
      onClick={() => {
        if (disabled || internalLoading) return
        googleLogin()
      }}
      disabled={disabled || internalLoading}
      className={`w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2.5 ${className}`}
      style={{ fontFamily: 'var(--font-latin-display)' }}
    >
      {internalLoading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-slate-300 dark:border-slate-600 border-t-blue-600 rounded-full animate-spin" />
          <span>{isKhmer ? 'កំពុងដំណើរការ...' : 'Connecting to Google...'}</span>
        </>
      ) : (
        <>
          <GoogleIcon />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}
