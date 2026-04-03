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
