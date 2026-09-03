import { useLanguage } from '@/contexts/LanguageContext'

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'km', label: 'KM' },
]

const ACCENT_COLOR = '#1f76e8'

/**
 * Floating EN/KM pill switcher for the public-facing pages (landing, login,
 * sign-up, profile setup) where the Topbar is not rendered.
 */
export function LanguageSwitcher({ style }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.4rem',
        borderRadius: '50px',
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        ...style,
      }}
    >
      {LANGUAGES.map((lang) => {
        const isActive = language === lang.code

        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            aria-pressed={isActive}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '50px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: isActive ? ACCENT_COLOR : 'transparent',
              color: isActive ? '#fff' : '#64748b',
              boxShadow: isActive ? `0 2px 8px ${ACCENT_COLOR}4D` : 'none',
            }}
          >
            {lang.label}
          </button>
        )
      })}
    </div>
  )
}
