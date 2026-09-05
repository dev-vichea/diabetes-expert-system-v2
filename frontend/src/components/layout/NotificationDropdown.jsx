import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ClipboardCheck,
  ExternalLink,
  FlaskConical,
  Info,
  Shield,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatDateTime, parseApiDateTime } from '@/lib/datetime'

function getNotificationTypeIcon(type) {
  switch (type) {
    case 'urgent':
      return AlertTriangle
    case 'diagnosis':
      return Stethoscope
    case 'review':
      return ClipboardCheck
    case 'lab':
      return FlaskConical
    case 'system':
      return Shield
    default:
      return Info
  }
}

function getNotificationTypeStyles(type) {
  switch (type) {
    case 'urgent':
      return {
        iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800',
        badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
      }
    case 'diagnosis':
      return {
        iconBg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 ring-1 ring-cyan-200 dark:ring-cyan-800',
        badge: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
      }
    case 'review':
      return {
        iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800',
        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      }
    case 'lab':
      return {
        iconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 ring-1 ring-purple-200 dark:ring-purple-800',
        badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
      }
    case 'system':
      return {
        iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800',
        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      }
    default:
      return {
        iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700',
        badge: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      }
  }
}

function formatRelativeTime(dateString, language = 'en') {
  const parsed = parseApiDateTime(dateString)
  if (!parsed) return ''

  const now = new Date()
  const diffMs = now.getTime() - parsed.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSec < 60) return language === 'km' ? 'អម្បាញ់មិញ' : 'Just now'
  if (diffMin < 60) return language === 'km' ? `${diffMin} នាទីមុន` : `${diffMin}m ago`
  if (diffHours < 24) return language === 'km' ? `${diffHours} ម៉ោងមុន` : `${diffHours}h ago`
  if (diffDays === 1) return language === 'km' ? 'ម្សិលមិញ' : 'Yesterday'
  if (diffDays < 7) return language === 'km' ? `${diffDays} ថ្ងៃមុន` : `${diffDays}d ago`

  return formatDateTime(dateString, '', language)
}

export function NotificationDropdown({ className = '' }) {
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState('all') // 'all' | 'unread' | 'urgent'
  const containerRef = useRef(null)

  const hasUrgentUnread = useMemo(
    () => notifications.some((n) => !n.is_read && n.type === 'urgent'),
    [notifications]
  )

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter((n) => !n.is_read)
      case 'urgent':
        return notifications.filter((n) => n.type === 'urgent')
      default:
        return notifications
    }
  }, [notifications, filter])

  // Close on outside click or escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function handleNotificationClick(notification) {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      setIsOpen(false)
      navigate(notification.link)
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-primary-50 hover:text-primary-700 dark:border-[#1e2234] dark:bg-[#101020] dark:text-slate-300 dark:hover:bg-[#181830] dark:hover:text-primary-300"
        aria-label={t('topbar.notifications')}
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />

        {/* Badge counter */}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 99 ? '99+' : unreadCount}
            {hasUrgentUnread && (
              <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-rose-400 opacity-75" />
            )}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-[#1e2234] dark:bg-[#0f111a] sm:w-[26rem]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('notificationPanel.title')}
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                  {t('notificationPanel.unreadCount', { count: unreadCount })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary-600 transition hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/50"
                  title={t('notificationPanel.markAllRead')}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="text-[11px]">{t('notificationPanel.markAllRead')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`flex-1 rounded-xl py-1.5 font-medium transition ${
                filter === 'all'
                  ? 'bg-primary-50 font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('notificationPanel.filterAll')} ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`flex-1 rounded-xl py-1.5 font-medium transition ${
                filter === 'unread'
                  ? 'bg-primary-50 font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('notificationPanel.filterUnread')} ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('urgent')}
              className={`flex-1 rounded-xl py-1.5 font-medium transition ${
                filter === 'urgent'
                  ? 'bg-rose-50 font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('notificationPanel.filterUrgent')} (
              {notifications.filter((n) => n.type === 'urgent').length})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800/60">
            {!filteredNotifications.length ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <BellOff className="h-6 w-6 text-slate-400" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t('notificationPanel.emptyTitle')}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {filter === 'all'
                    ? t('notificationPanel.emptyDesc')
                    : t('notificationPanel.emptyFilterDesc')}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const TypeIcon = getNotificationTypeIcon(item.type)
                const typeStyles = getNotificationTypeStyles(item.type)

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group relative flex cursor-pointer items-start gap-3 p-3.5 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                      !item.is_read
                        ? 'bg-primary-50/20 dark:bg-primary-950/10'
                        : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    {/* Unread indicator bar */}
                    {!item.is_read && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary-600 dark:bg-primary-400" />
                    )}

                    {/* Icon */}
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${typeStyles.iconBg}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`truncate text-xs font-semibold ${!item.is_read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                          {item.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">
                          {formatRelativeTime(item.created_at, language)}
                        </span>
                      </div>

                      <p className="mt-1 text-xs leading-relaxed text-slate-600 line-clamp-2 dark:text-slate-400">
                        {item.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${typeStyles.badge}`}>
                          {t(`notificationPanel.types.${item.type}`, { defaultValue: item.type })}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                          {!item.is_read && (
                            <button
                              type="button"
                              onClick={() => markAsRead(item.id)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                              title={t('notificationPanel.markAsRead')}
                            >
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteNotification(item.id)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-red-600 dark:hover:bg-slate-700 dark:hover:text-red-400"
                            title={t('notificationPanel.delete')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.some((n) => n.is_read) && (
            <div className="border-t border-slate-100 bg-slate-50/50 p-2 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={clearReadNotifications}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
              >
                {t('notificationPanel.clearAllRead')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export default NotificationDropdown
