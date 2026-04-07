import { useMemo, useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api, { getApiData, getApiErrorMessage, setAuthTokens } from '../api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

export function LoginPage() {
  const { setUser } = useAuth()
  const { t } = useLanguage()
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
  const transitionDirection = location.state?.authTransition
  const cardAnimationClass = transitionDirection
    ? `auth-card-route-transition auth-card-route-transition--${transitionDirection}`
    : 'page-open-motion'

  const isValid = useMemo(() => formData.email.trim() && formData.password.trim(), [formData.email, formData.password])

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
      navigate('/')
    } catch (err) {
      setError(getApiErrorMessage(err, t('auth.errorLoginFailed', 'Login failed')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <section className={`auth-card ${cardAnimationClass}`}>
        <aside className="auth-panel auth-panel-accent auth-panel-accent--left">
          <div className="auth-accent-content">
            <span className="auth-eyebrow">{t('auth.accentEyebrow', 'Diabetes Expert System')}</span>
            <h1 className="auth-accent-title">{t('auth.accentTitle', 'Hello, Welcome!')}</h1>
            <p className="auth-accent-copy">
              {t('auth.accentCopy', "Don't have an account yet? Create one to access diagnosis tools, patient history, and smarter follow-up care.")}
            </p>
            <Link to="/sign-up" state={{ authTransition: 'to-register' }} className="auth-outline-button">{t('auth.register', 'Register')}</Link>
          </div>
        </aside>

        <section className="auth-panel auth-panel-form">
          <div className="auth-form-inner">
            <div className="auth-form-header">
              <h1 className="auth-form-title">{t('auth.loginPageTitle', 'Login')}</h1>
              <p className="auth-form-copy">{t('auth.loginPageSub', 'Sign in to continue to your dashboard.')}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="email" className="auth-field-label">{t('auth.emailLabel', 'Email')}</label>
                <div className="auth-input-box">
                  <span className="auth-input-icon" aria-hidden="true">
                    <Mail size={18} />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    className="auth-input"
                    placeholder={t('auth.emailPlaceholder', 'Email address')}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="password" className="auth-field-label">{t('auth.passwordLabel', 'Password')}</label>
                <div className="auth-input-box">
                  <span className="auth-input-icon" aria-hidden="true">
                    <LockKeyhole size={18} />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    className="auth-input"
                    placeholder={t('auth.passwordPlaceholder', 'Password')}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="auth-toggle-button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-aux-row">
                <label htmlFor="remember-me" className="auth-checkbox">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(event) => setFormData({ ...formData, rememberMe: event.target.checked })}
                  />
                  <span>{t('auth.rememberMe', 'Remember me')}</span>
                </label>
              </div>

              <button type="submit" className="auth-submit-button" disabled={loading || !isValid}>
                {loading ? t('auth.signingIn', 'Signing in...') : t('auth.login', 'Login')}
              </button>

              {error ? <p className="error-box">{error}</p> : null}

              <p className="auth-bottom-link">
                {t('auth.noAccount', "Don't have an account?")} <Link to="/sign-up" state={{ authTransition: 'to-register' }}>{t('auth.signUp', 'Sign up')}</Link>
              </p>
            </form>
          </div>
        </section>
      </section>
    </div>
  )
}
