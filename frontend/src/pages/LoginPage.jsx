import { useMemo, useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, Languages } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api, { getApiData, getApiErrorMessage, setAuthTokens } from '../api/client'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

// ── Medical White Tokens
const C = {
  bg:         '#f4f7f9',
  teal:       '#0f766e',
  tealLight:  '#14b8a6',
  tealBright: '#06b6d4',
  blue:       '#3b82f6',
  sky:        '#0ea5e9',
}

export function LoginPage() {
  const { setUser } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
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

  /* ── Language-Specific Overrides (Khmer Vertical Breathing Room) ── */
  /* Note: These styles are injected via CSS files, this is a placeholder for logic flow */

  /* ── Particle Canvas (Shared with Landing) ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const PARTICLE_COUNT = 40 // Slightly fewer for login to focus on form
    const MAX_DIST = 140
    let W, H, particles, raf

    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }

    const createParticle = () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 1,
      a: Math.random() * 0.2 + 0.1
    })

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(20, 184, 166, ${p.a})`; ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(20, 184, 166, ${(1 - dist / MAX_DIST) * 0.1})`; ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }

    resize(); particles = Array.from({ length: PARTICLE_COUNT }, createParticle); draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

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
      navigate('/dashboard')
    } catch (err) {
      setError(getApiErrorMessage(err, t('auth.errorLoginFailed', 'Login failed')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell" style={{ position: 'relative', backgroundColor: C.bg }}>
      <style>{`
        @keyframes lpBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes floatSlow { 0% { transform: translate(0, 0); } 100% { transform: translate(20px, 20px); } }
      `}</style>
      
      {/* ── Ambient Backgrounds (Shared with Landing) ── */}
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none', animation: 'floatSlow 20s ease-in-out infinite alternate' }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'floatSlow 25s ease-in-out infinite alternate-reverse' }} />
      
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />

      {/* ── Language Switcher ── */}
      <div style={{
        position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10,
        display: 'flex', gap: '0.5rem', padding: '0.4rem', borderRadius: '50px',
        background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
      }}>
        {[
          { code: 'en', label: 'EN' },
          { code: 'km', label: 'KM' }
        ].map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            style={{
              padding: '0.4rem 0.8rem', borderRadius: '50px', border: 'none',
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: language === lang.code ? C.teal : 'transparent',
              color: language === lang.code ? '#fff' : '#64748b',
              boxShadow: language === lang.code ? `0 2px 8px ${C.teal}4D` : 'none'
            }}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <section className={`auth-card ${cardAnimationClass}`} style={{ zIndex: 5 }}>
        <aside className="auth-panel auth-panel-accent auth-panel-accent--left">
          <div className="auth-accent-content">
            <span className="auth-eyebrow" style={{ fontFamily: "'Outfit', sans-serif" }}>{t('auth.accentEyebrow', 'Diabetes Expert System')}</span>
            <h1 className="auth-accent-title" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {t('auth.greetingTitleSplit', 'Hello|Welcome!').split('|').map((line, i) => (
                <span key={i} style={{ display: 'block' }}>
                  {line}
                </span>
              ))}
            </h1>
            <p className="auth-accent-copy" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {t('auth.accentCopy', "Don't have an account yet? Create one to access diagnosis tools, patient history, and smarter follow-up care.")}
            </p>
            <Link to="/sign-up" state={{ authTransition: 'to-register' }} className="auth-outline-button" style={{ fontFamily: "'Outfit', sans-serif" }}>{t('auth.register', 'Register')}</Link>
          </div>
        </aside>

        <section className="auth-panel auth-panel-form">
          <div className="auth-form-inner">
            <div className="auth-form-header">
              <h1 className="auth-form-title" style={{ fontFamily: "'Outfit', sans-serif" }}>{t('auth.loginPageTitle', 'Login')}</h1>
              <p className="auth-form-copy" style={{ fontFamily: "'DM Sans', sans-serif" }}>{t('auth.loginPageSub', 'Sign in to continue to your dashboard.')}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" style={{ fontFamily: "'DM Sans', sans-serif" }}>
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

              <button type="submit" className="auth-submit-button" disabled={loading || !isValid} style={{ fontFamily: "'Outfit', sans-serif" }}>
                {loading ? t('auth.signingIn', 'Signing in...') : t('auth.login', 'Login')}
              </button>

              {error ? <p className="error-box">{error}</p> : null}

              <p className="auth-bottom-link" style={{ textAlign: 'center', marginTop: '1rem' }}>
                {t('auth.noAccount', "Don't have an account?")} <Link to="/sign-up" state={{ authTransition: 'to-register' }} style={{ color: C.teal, fontWeight: 700 }}>{t('auth.signUp', 'Sign up')}</Link>
              </p>
            </form>
          </div>
        </section>
      </section>
    </div>
  )
}
