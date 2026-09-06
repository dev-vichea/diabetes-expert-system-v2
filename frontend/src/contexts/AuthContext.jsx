import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api, { clearAuthStorage, getAccessToken, getApiData, getRefreshToken } from '../api/client'

const AuthContext = createContext(null)

function readStoredUser() {
  const savedUser = localStorage.getItem('user')
  const token = getAccessToken()
  if (!savedUser || !token) return null

  try {
    return JSON.parse(savedUser)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  // Keep the cached user in sync (e.g. profile_completed flips after onboarding,
  // or the cached copy predates that field existing).
  useEffect(() => {
    if (!getAccessToken()) return
    let cancelled = false
    api.get('/auth/me')
      .then((response) => {
        const data = getApiData(response)
        const nextUser = data?.user || data
        if (!cancelled && nextUser?.email) setUser((current) => ({ ...current, ...nextUser }))
      })
      .catch(() => { /* offline or token refresh in flight — cached user stays */ })
    return () => { cancelled = true }
  }, [])

  const logout = async () => {
    try {
      await api.post('/auth/logout', { refresh_token: getRefreshToken() })
    } catch {
      // Best effort logout; local cleanup still enforced.
    } finally {
      clearAuthStorage()
      setUser(null)
      window.location.assign('/login')
    }
  }

  const refreshUser = async () => {
    const response = await api.get('/auth/me')
    const data = getApiData(response)
    const nextUser = data?.user || data
    if (nextUser?.email) setUser((current) => ({ ...current, ...nextUser }))
    return nextUser
  }

  const updateUser = (patch) => {
    setUser((current) => {
      const updated = { ...current, ...patch }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }

  const value = useMemo(() => ({
    user,
    setUser,
    updateUser,
    logout,
    refreshUser,
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
