import { getLocaleForLanguage } from '@/lib/i18n'

export const CAMBODIA_TIME_ZONE = 'Asia/Phnom_Penh'

function hasExplicitTimeZone(value) {
  return /(?:[zZ]|[+\-]\d{2}:\d{2})$/.test(value)
}

export function parseApiDateTime(value) {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const text = String(value).trim()
  if (!text) return null

  const normalized = hasExplicitTimeZone(text) ? text : `${text}Z`
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function getDateTimeTimestamp(value) {
  const parsed = parseApiDateTime(value)
  return parsed ? parsed.getTime() : Number.NaN
}

export function formatDateTime(value, fallback = 'N/A', language = 'en') {
  const parsed = parseApiDateTime(value)
  if (!parsed) return fallback

  const formatter = new Intl.DateTimeFormat(getLocaleForLanguage(language), {
    timeZone: CAMBODIA_TIME_ZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return formatter.format(parsed)
}

export function formatRelativeTime(value, language = 'en', t = null) {
  const parsed = parseApiDateTime(value)
  if (!parsed) return '—'

  const diffSec = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000))
  const diffMin = Math.floor(diffSec / 60)
  const isKm = language === 'km'

  if (diffMin < 1) {
    return t ? t('time.justNow', isKm ? 'អម្បាញ់មិញ' : 'Just now') : (isKm ? 'អម្បាញ់មិញ' : 'Just now')
  }

  if (diffMin < 60) {
    return t
      ? t('time.minAgo', isKm ? '{{count}} នាទីមុន' : '{{count}} min ago', { count: diffMin })
      : (isKm ? `${diffMin} នាទីមុន` : `${diffMin} min ago`)
  }

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) {
    const key = diffHours === 1 ? 'time.hourAgo' : 'time.hoursAgo'
    const fallback = isKm ? `${diffHours} ម៉ោងមុន` : `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    return t ? t(key, fallback, { count: diffHours }) : fallback
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) {
    return t ? t('time.yesterday', isKm ? 'ម្សិលមិញ' : 'Yesterday') : (isKm ? 'ម្សិលមិញ' : 'Yesterday')
  }

  if (diffDays < 30) {
    const key = diffDays === 1 ? 'time.dayAgo' : 'time.daysAgo'
    const fallback = isKm ? `${diffDays} ថ្ងៃមុន` : `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    return t ? t(key, fallback, { count: diffDays }) : fallback
  }

  return formatDateTime(value, '—', language)
}

