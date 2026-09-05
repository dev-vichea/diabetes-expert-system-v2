import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { getApiData } from '../api/client'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async (options = {}) => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setTotalCount(0)
      return
    }

    if (options.silent !== true) {
      setLoading(true)
    }

    try {
      const response = await api.get('/notifications?limit=50')
      const data = getApiData(response) || {}
      setNotifications(data.notifications || [])
      setUnreadCount(Number(data.unread_count || 0))
      setTotalCount(Number(data.total || 0))
    } catch {
      // Background fetch silent ignore
    } finally {
      setLoading(false)
    }
  }, [user])

  // Periodic polling when window is active
  useEffect(() => {
    if (!user) return

    fetchNotifications()

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications({ silent: true })
      }
    }, 45000)

    const onFocus = () => {
      fetchNotifications({ silent: true })
    }

    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [user, fetchNotifications])

  const markAsRead = useCallback(async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      await api.patch(`/notifications/${id}/read`)
    } catch {
      // Revert if error
      fetchNotifications({ silent: true })
    }
  }, [fetchNotifications])

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)

    try {
      await api.post('/notifications/mark-all-read')
    } catch {
      fetchNotifications({ silent: true })
    }
  }, [fetchNotifications])

  const deleteNotification = useCallback(async (id) => {
    const target = notifications.find((n) => n.id === id)
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (target && !target.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setTotalCount((prev) => Math.max(0, prev - 1))

    try {
      await api.delete(`/notifications/${id}`)
    } catch {
      fetchNotifications({ silent: true })
    }
  }, [notifications, fetchNotifications])

  const clearReadNotifications = useCallback(async () => {
    setNotifications((prev) => prev.filter((n) => !n.is_read))
    try {
      await api.delete('/notifications/clear-read')
    } catch {
      fetchNotifications({ silent: true })
    }
  }, [fetchNotifications])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      totalCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearReadNotifications,
    }),
    [
      notifications,
      unreadCount,
      totalCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearReadNotifications,
    ]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
