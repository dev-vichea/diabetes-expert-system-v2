import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { getApiData, getApiErrorMessage, setAuthTokens } from '../api/client'

export function LoginPage({ setUser }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: 'doctor@example.com',
    password: 'doctor123',
    rememberMe: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = useMemo(() => formData.email.trim() && formData.password.trim(), [formData.email, formData.password])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!isValid) {
      setError('Email and password are required.')
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
      setError(getApiErrorMessage(err, 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <section className="surface border border-slate-200 shadow-lg">
          <div className="space-y-2 px-6 pb-0 pt-6 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Sign In</h1>
            <p className="text-sm text-slate-600">Welcome back! Please sign in to your account</p>
          </div>

          <div className="space-y-6 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-normal text-slate-700">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  className="input-base"
                  placeholder="your@email.com"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-normal text-slate-700">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  className="input-base"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="remember-me" className="flex items-center gap-2">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(event) => setFormData({ ...formData, rememberMe: event.target.checked })}
                  />
                  <span className="text-sm text-slate-700">Remember me</span>
                </label>
                <button type="button" className="text-sm font-medium text-cyan-700 hover:text-cyan-800">
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading || !isValid}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="btn-secondary w-full">
                  <svg className="mr-2 h-5 w-5 text-red-500" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button type="button" className="btn-secondary w-full">
                  <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </button>
              </div>
            </div>

            {error ? <p className="error-box">{error}</p> : null}

            <p className="text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link to="/sign-up" className="font-medium text-cyan-700 hover:text-cyan-800">Sign up</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
