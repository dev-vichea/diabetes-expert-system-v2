/**
 * i18n engine — translation data lives in `src/locales/*.json`.
 *
 * Locale files:
 *   - en.json           English UI strings (nested namespaces)
 *   - km.json           Khmer UI strings (nested namespaces, mirrors en.json)
 *   - exact-en-km.json  exact English → Khmer overrides for backend/DB-seeded
 *                       text that cannot be key-based (see translateExact)
 *
 * Public API (unchanged): DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY,
 * SUPPORTED_LANGUAGES, messages, normalizeLanguage, getLocaleForLanguage,
 * translate, exactTextMap, translateExact.
 */
import enMessages from '@/locales/en.json'
import kmMessages from '@/locales/km.json'
import exactEnKm from '@/locales/exact-en-km.json'

export const DEFAULT_LANGUAGE = 'km'
export const LANGUAGE_STORAGE_KEY = 'app-language'
export const SUPPORTED_LANGUAGES = ['en', 'km']

export const messages = {
  en: enMessages,
  km: kmMessages,
}

export const exactTextMap = exactEnKm

function getNestedValue(object, path) {
  return path.split('.').reduce((value, segment) => (value == null ? undefined : value[segment]), object)
}

function interpolate(template, values) {
  if (!values || typeof values !== 'object') return template

  return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey) => {
    const key = rawKey.trim()
    return values[key] == null ? '' : String(values[key])
  })
}

export function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE
}

export function getLocaleForLanguage(language) {
  return normalizeLanguage(language) === 'km' ? 'km-KH' : 'en-US'
}

export function translate(language, key, valuesOrFallback, maybeValues) {
  const normalized = normalizeLanguage(language)
  const values = typeof valuesOrFallback === 'string' ? maybeValues : valuesOrFallback
  const fallback = typeof valuesOrFallback === 'string' ? valuesOrFallback : undefined
  const defaultMessage = getNestedValue(messages[DEFAULT_LANGUAGE], key)
  const localizedMessage = getNestedValue(messages[normalized], key)
  const resolved = localizedMessage ?? defaultMessage ?? fallback

  if (typeof resolved === 'string') {
    return interpolate(resolved, values)
  }

  return resolved ?? fallback ?? key
}

export function translateExact(language, exactEnglishText) {
  if (!exactEnglishText) return exactEnglishText
  const rawText = String(exactEnglishText).trim()
  const normalized = normalizeLanguage(language)

  if (normalized === 'km' && exactTextMap[rawText]) {
    return exactTextMap[rawText]
  }

  // Soft match trick: if there are no hits, sometimes it's capitalization.
  // e.g. "DIABETES LIKELY" vs "Diabetes likely"
  if (normalized === 'km') {
    for (const [key, value] of Object.entries(exactTextMap)) {
      if (key.toLowerCase() === rawText.toLowerCase()) {
        return value
      }
    }
  }

  return rawText
}
