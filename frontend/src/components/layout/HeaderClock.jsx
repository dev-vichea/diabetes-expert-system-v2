import { useEffect, useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { CAMBODIA_TIME_ZONE } from '@/lib/datetime'
import { getLocaleForLanguage } from '@/lib/i18n'
import { cn } from '@/lib/utils'

function buildClockSnapshot(now, language) {
  const date = new Date(now)
  const locale = getLocaleForLanguage(language)

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: CAMBODIA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: CAMBODIA_TIME_ZONE,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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
  }
}

export function HeaderClock({ theme = 'light', language = 'en' }) {
  const [now, setNow] = useState(() => Date.now())
  const isDark = theme === 'dark'

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const snapshot = useMemo(() => buildClockSnapshot(now, language), [language, now])

  // Compact date pill styled like the other topbar buttons; hovering (or
  // keyboard-focusing) it reveals the live ICT time — always 12-hour format.
  return (
    <div className="group relative hidden xl:inline-flex">
      <button
        type="button"
        className={cn(
          'inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors',
          isDark
            ? 'border-[#1e2234] bg-[#101020] text-slate-300 hover:bg-[#181830] hover:text-primary-300'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-primary-50 hover:text-primary-700'
        )}
      >
        <CalendarDays className="h-4 w-4" />
        <span>{snapshot.dateValue}</span>
      </button>

      <div
        className={cn(
          'pointer-events-none absolute right-0 top-full z-30 mt-2 flex items-baseline gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 opacity-0 shadow-[0_10px_24px_rgba(2,8,23,0.22)] transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100',
          isDark
            ? 'border-[#1e2234] bg-[#0d0d1c]'
            : 'border-slate-900/10 bg-slate-900'
        )}
      >
        <span className="font-mono text-base font-semibold leading-none tracking-[0.06em] text-white">
          {snapshot.timeValue}
        </span>
        <span className="text-[11px] font-semibold text-slate-300">{snapshot.dayPeriod}</span>
      </div>
    </div>
  )
}
