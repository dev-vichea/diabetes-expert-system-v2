import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { CambodiaFlag, UsFlag } from '@/components/layout/Topbar'

/**
 * Language switcher dropdown styled like the Dashboard Topbar
 * with clean "English" and "ភាសាខ្មែរ" labels without the (EN)/(KM) suffix.
 */
export function LanguageSwitcher({ style, className = '' }) {
  const { language, setLanguage, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('relative inline-block select-none', className)} style={style} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 sm:h-9 items-center gap-2 rounded-xl px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-2xs hover:bg-slate-100/90 dark:hover:bg-slate-800/80 backdrop-blur-md transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={t('topbar.languageSwitcher', 'Switch language')}
        title={t('topbar.languageSwitcher', 'Switch language')}
      >
        {language === 'km' ? <CambodiaFlag /> : <UsFlag />}
        <span className="font-semibold">{language === 'km' ? 'KM' : 'EN'}</span>
        <ChevronDown
          className={cn('h-3 w-3 text-slate-400 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {/* Language Popover Menu */}
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-36 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              setLanguage('en')
              setOpen(false)
            }}
            className={cn(
              'flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors',
              language === 'en'
                ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-500/15 dark:text-blue-300'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
          >
            <div className="flex items-center gap-2.5">
              <UsFlag />
              <span>English</span>
            </div>
            {language === 'en' && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setLanguage('km')
              setOpen(false)
            }}
            className={cn(
              'flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors',
              language === 'km'
                ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-500/15 dark:text-blue-300'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
          >
            <div className="flex items-center gap-2.5">
              <CambodiaFlag />
              <span>ភាសាខ្មែរ</span>
            </div>
            {language === 'km' && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
          </button>
        </div>
      )}
    </div>
  )
}
