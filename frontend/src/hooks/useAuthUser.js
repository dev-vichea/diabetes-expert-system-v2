import { useEffect, useState } from 'react'
import api, { clearAuthStorage, getAccessToken, getRefreshToken } from '../api/client'

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

export function useAuthUser() {
  const [user, setUser] = useState(() => readStoredUser())

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  async function logout() {
    try {
      await api.post('/auth/logout', { refresh_token: getRefreshToken() })
    } catch {
      // Best effort logout; local cleanup still enforced.
    } finally {
      clearAuthStorage()
      setUser(null)
    }
  }

  return {
    user,
    setUser,
    logout,
  }
}
