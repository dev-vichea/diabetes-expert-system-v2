import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, normalizeLanguage, translate } from '@/lib/i18n'

const LanguageContext = createContext(null)

function getStoredLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE

  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY))
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getStoredLanguage)

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language
    document.documentElement.dataset.language = language
  }, [language])

  const value = useMemo(() => ({
    language,
    isKhmer: language === 'km',
    setLanguage: (nextLanguage) => setLanguage(normalizeLanguage(nextLanguage)),
    t: (key, values) => translate(language, key, values),
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }

  return context
}
