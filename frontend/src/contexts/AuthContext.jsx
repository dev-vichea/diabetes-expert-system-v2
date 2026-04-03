import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api, { clearAuthStorage, getAccessToken, getRefreshToken } from '../api/client'

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

  const logout = async () => {
    try {
      await api.post('/auth/logout', { refresh_token: getRefreshToken() })
    } catch {
      // Best effort logout; local cleanup still enforced.
    } finally {
      clearAuthStorage()
      setUser(null)
    }
  }

  const value = useMemo(() => ({
    user,
    setUser,
    logout,
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
