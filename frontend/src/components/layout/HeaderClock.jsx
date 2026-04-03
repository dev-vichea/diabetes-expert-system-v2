import { useEffect, useMemo, useState } from 'react'
import { CAMBODIA_TIME_ZONE } from '@/lib/datetime'
import { getLocaleForLanguage } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const CLOCK_FORMAT_STORAGE_KEY = 'header-clock-hour12'

function getStoredHourFormat() {
  if (typeof window === 'undefined') return true

  const stored = window.localStorage.getItem(CLOCK_FORMAT_STORAGE_KEY)
  return stored !== 'false'
}

function buildClockSnapshot(now, hour12, language) {
  const date = new Date(now)
  const locale = getLocaleForLanguage(language)

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: CAMBODIA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12,
  })

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: CAMBODIA_TIME_ZONE,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const dayFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: CAMBODIA_TIME_ZONE,
    weekday: 'long',
  })

  const parts = timeFormatter.formatToParts(date)
  const timeValue = parts
    .filter((part) => part.type === 'hour' || part.type === 'minute' || part.type === 'second' || part.type === 'literal')
    .map((part) => part.value)
    .join('')
  const dayPeriod = parts.find((part) => part.type === 'dayPeriod')?.value || ''

  return {
    timeValue,
    dayPeriod,
    dateValue: dateFormatter.format(date),
    dayValue: dayFormatter.format(date),
  }
}

export function HeaderClock({ theme = 'light', language = 'en' }) {
  const [hour12, setHour12] = useState(getStoredHourFormat)
  const [now, setNow] = useState(() => Date.now())
  const isDark = theme === 'dark'

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(CLOCK_FORMAT_STORAGE_KEY, String(hour12))
  }, [hour12])

  const snapshot = useMemo(() => buildClockSnapshot(now, hour12, language), [language, now, hour12])

  return (
    <section
      className={cn(
        'hidden min-w-[208px] max-w-[220px] flex-col gap-2 rounded-[20px] px-3 py-2.5 xl:flex',
        isDark
          ? 'border border-slate-800 bg-[#0a0f1c] text-slate-300 shadow-[0_10px_24px_rgba(2,8,23,0.22)]'
          : 'border border-slate-200/90 bg-white/95 text-slate-600 shadow-[0_10px_24px_rgba(148,163,184,0.18)]'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            'truncate text-[10px] font-medium uppercase tracking-[0.16em]',
            isDark ? 'text-slate-500' : 'text-slate-400'
          )}
        >
          ICT
        </p>
        <div
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-full p-1',
            isDark ? 'bg-white/5' : 'bg-slate-100'
          )}
        >
          <button
            type="button"
            onClick={() => setHour12(true)}
            className={cn(
              'rounded-full px-2 py-1 text-[10px] font-semibold transition-colors',
              hour12
                ? isDark
                  ? 'bg-white/10 text-[#15b7b9]'
                  : 'bg-white text-[#0ea5b7] shadow-sm'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
            )}
          >
            12 hr
          </button>
          <button
            type="button"
            onClick={() => setHour12(false)}
            className={cn(
              'rounded-full px-2 py-1 text-[10px] font-semibold transition-colors',
              !hour12
                ? isDark
                  ? 'bg-white/10 text-[#15b7b9]'
                  : 'bg-white text-[#0ea5b7] shadow-sm'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
            )}
          >
            24 hr
          </button>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-end gap-1.5">
          <p
            className={cn(
              'min-w-0 font-mono text-[1.5rem] font-semibold leading-none tracking-[0.08em]',
              isDark ? 'text-white' : 'text-slate-900'
            )}
          >
            {snapshot.timeValue}
          </p>
          {hour12 ? (
            <span className={cn('pb-0.5 text-[11px] font-semibold', isDark ? 'text-slate-300' : 'text-slate-600')}>
              {snapshot.dayPeriod}
            </span>
          ) : null}
        </div>
        <p className={cn('mt-1 text-[11px] font-medium', isDark ? 'text-slate-200' : 'text-slate-700')}>{snapshot.dateValue}</p>
        <p className={cn('mt-0.5 text-[10px]', isDark ? 'text-slate-500' : 'text-slate-400')}>{snapshot.dayValue}</p>
      </div>
    </section>
  )
}
