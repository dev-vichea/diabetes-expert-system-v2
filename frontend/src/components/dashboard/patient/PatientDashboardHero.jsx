import { Link } from 'react-router-dom'
import { CalendarDays, Plus } from 'lucide-react'
import { CAMBODIA_TIME_ZONE } from '@/lib/datetime'
import { getLocaleForLanguage } from '@/lib/i18n'
import { getGreetingKey } from './patient-dashboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'

function todayLabel(language) {
  return new Intl.DateTimeFormat(getLocaleForLanguage(language), {
    timeZone: CAMBODIA_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())
}

export function PatientDashboardHero({ user }) {
  const { language, t } = useLanguage()

  const firstName = (user?.name || '').trim().split(/\s+/)[0] || t('patientDashboard.hero.fallbackName', 'Patient')
  const greeting = t(`patientDashboard.hero.${getGreetingKey()}`, 'Welcome back, {{name}}!', { name: firstName })

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{greeting}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t('patientDashboard.hero.description')}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 dark:border-[#1e2234] dark:bg-[#101020] dark:text-slate-300">
          <CalendarDays className="h-4 w-4" />
          {todayLabel(language)}
        </span>
        <Link
          to="/diagnosis"
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          {t('patientDashboard.hero.startAssessment', 'Start New Assessment')}
        </Link>
      </div>
    </div>
  )
}
