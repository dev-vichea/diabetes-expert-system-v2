import { getGreetingKey } from './patient-dashboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'

export function PatientDashboardHero({ user }) {
  const { t } = useLanguage()

  const firstName = (user?.name || '').trim().split(/\s+/)[0] || t('patientDashboard.hero.fallbackName', 'Patient')
  const greeting = t(`patientDashboard.hero.${getGreetingKey()}`, 'Welcome back, {{name}}!', { name: firstName })

  return (
    <div className="min-w-0">
      <h1 className="truncate text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{greeting}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
        {t('patientDashboard.hero.description')}
      </p>
    </div>
  )
}
