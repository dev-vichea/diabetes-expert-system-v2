import { Calendar, Sparkles } from 'lucide-react'
import { getGreetingKey } from './patient-dashboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { CAMBODIA_TIME_ZONE } from '@/lib/datetime'

export function PatientDashboardHero({ user }) {
  const { language, t } = useLanguage()

  const rawName = (user?.name || '').trim()
  const firstName = rawName.split(/\s+/)[0] || t('patientDashboard.hero.fallbackName', 'Patient')
  const greeting = t(`patientDashboard.hero.${getGreetingKey()}`, 'Good morning, {{name}}!', { name: firstName })

  const todayFormatted = new Intl.DateTimeFormat(language === 'km' ? 'km-KH' : 'en-US', {
    timeZone: CAMBODIA_TIME_ZONE,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between pt-1">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            {todayFormatted}
          </span>
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Health Sync Active
          </span>
        </div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {greeting}
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          {t('patientDashboard.hero.subtitle', 'Here is your daily health overview')}
        </p>
      </div>

      <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.04)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 sm:self-auto">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <Sparkles className="h-3 w-3" />
        </span>
        <span>Summary updated</span>
      </div>
    </div>
  )
}
