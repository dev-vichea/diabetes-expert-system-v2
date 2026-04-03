import { useMemo, useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, User } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api, { getApiData, getApiErrorMessage, setAuthTokens } from '../api/client'
import { useAuth } from '@/contexts/AuthContext'

export function SignUpPage() {
  const { setUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const transitionDirection = location.state?.authTransition
  const cardAnimationClass = transitionDirection
    ? `auth-card-route-transition auth-card-route-transition--${transitionDirection}`
    : 'page-open-motion'

  const isValid = useMemo(() => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      formData.password.trim() &&
      formData.confirmPassword.trim() &&
      formData.password === formData.confirmPassword &&
      formData.agreeToTerms
    )
  }, [formData])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions.')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Password and confirm password must match.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/register', {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email.trim(),
        password: formData.password,
      })
      const data = getApiData(response)
      setAuthTokens(data.access_token || data.token, data.refresh_token)
      setUser(data.user)
      navigate('/')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <section className={`auth-card auth-card--reverse ${cardAnimationClass}`}>
        <section className="auth-panel auth-panel-form">
          <div className="auth-form-inner">
            <div className="auth-form-header">
              <h1 className="auth-form-title">Register</h1>
              <p className="auth-form-copy">Create your account and get started right away.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="auth-field">
                  <label htmlFor="first-name" className="auth-field-label">First Name</label>
                  <div className="auth-input-box">
                    <span className="auth-input-icon" aria-hidden="true">
                      <User size={18} />
                    </span>
                    <input
                      id="first-name"
                      name="first-name"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
                      className="auth-input"
                      placeholder="First name"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="last-name" className="auth-field-label">Last Name</label>
                  <div className="auth-input-box">
                    <span className="auth-input-icon" aria-hidden="true">
                      <User size={18} />
                    </span>
                    <input
                      id="last-name"
                      name="last-name"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
                      className="auth-input"
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-email" className="auth-field-label">Email</label>
                <div className="auth-input-box">
                  <span className="auth-input-icon" aria-hidden="true">
                    <Mail size={18} />
                  </span>
                  <input
                    id="signup-email"
                    name="signup-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    className="auth-input"
                    placeholder="Email address"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-password" className="auth-field-label">Password</label>
                <div className="auth-input-box">
                  <span className="auth-input-icon" aria-hidden="true">
                    <LockKeyhole size={18} />
                  </span>
                  <input
                    id="signup-password"
                    name="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    className="auth-input"
                    placeholder="Password"
                    autoComplete="new-password"
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

              <div className="auth-field">
                <label htmlFor="confirm-password" className="auth-field-label">Confirm Password</label>
                <div className="auth-input-box">
                  <span className="auth-input-icon" aria-hidden="true">
                    <LockKeyhole size={18} />
                  </span>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
                    className="auth-input"
                    placeholder="Confirm password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="auth-toggle-button"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <label htmlFor="terms" className="auth-checkbox">
                <input
                  id="terms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(event) => setFormData({ ...formData, agreeToTerms: event.target.checked })}
                />
                <span>
                  I agree to the{' '}
                  <button type="button" className="auth-inline-link">
                    Terms and Conditions
                  </button>
                </span>
              </label>

              <button type="submit" className="auth-submit-button" disabled={loading || !isValid}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              {error ? <p className="error-box">{error}</p> : null}

              <p className="auth-bottom-link">
                Already have an account? <Link to="/login" state={{ authTransition: 'to-login' }}>Sign in</Link>
              </p>
            </form>
          </div>
        </section>

        <aside className="auth-panel auth-panel-accent auth-panel-accent--right">
          <div className="auth-accent-content">
            <span className="auth-eyebrow">Secure Access</span>
            <h1 className="auth-accent-title">Welcome Back!</h1>
            <p className="auth-accent-copy">
              Already registered? Head back to the login screen and continue managing assessments, rules, and patient care.
            </p>
            <Link to="/login" state={{ authTransition: 'to-login' }} className="auth-outline-button">Login</Link>
          </div>
        </aside>
      </section>
    </div>
  )
}
