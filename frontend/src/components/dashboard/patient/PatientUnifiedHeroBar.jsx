import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardPlus,
  FileText,
  HeartPulse,
  Mail,
  Phone,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatDateTime,
  getGreetingKey,
  getRelativeCheckAge,
  toNumberOrNull,
} from './patient-dashboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { CAMBODIA_TIME_ZONE } from '@/lib/datetime'

export function PatientUnifiedHeroBar({ user, latestResult }) {
  const { language, t, tExact } = useLanguage()
  const [contactModalOpen, setContactModalOpen] = useState(false)

  // Name & Greeting
  const rawName = (user?.name || '').trim()
  const firstName = rawName.split(/\s+/)[0] || t('patientDashboard.hero.fallbackName', 'Patient')
  const greeting = t(`patientDashboard.hero.${getGreetingKey()}`, 'Good morning, {{name}}!', { name: firstName })

  // Current Date
  const todayFormatted = new Intl.DateTimeFormat(language === 'km' ? 'km-KH' : 'en-US', {
    timeZone: CAMBODIA_TIME_ZONE,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  // Clinical Status
  const isUrgent = Boolean(latestResult?.is_urgent)
  const facts = latestResult?.facts || {}
  const hba1c = toNumberOrNull(facts.hba1c)
  const isHighA1c = hba1c !== null && hba1c >= 8.0

  const diagnosisTitle = latestResult?.diagnosis
    ? (tExact ? tExact(latestResult.diagnosis) : latestResult.diagnosis)
    : t('patientDashboard.hero.noDiagnosisYet', 'No diagnosis result yet')

  const a1cText = hba1c !== null ? `${hba1c}%` : ''
  const plainExplanation = latestResult
    ? isUrgent
      ? isHighA1c
        ? t(
            'patientDashboard.situation.highA1cDesc',
            a1cText
              ? `Your recent HbA1c is ${a1cText}, above the 5.7% target. Staying consistent with daily habits and your doctor will help guide your levels lower.`
              : 'Your recent HbA1c is elevated above the 5.7% target. Staying consistent with daily habits and your doctor will help guide your levels lower.',
            { hba1c: a1cText || 'elevated' }
          )
        : t(
            'patientDashboard.situation.urgentDesc',
            'Your recent readings are higher than standard target ranges. Follow your care plan and consult your doctor.'
          )
      : t(
          'patientDashboard.situation.stableDesc',
          'Your latest metabolic indicators and blood sugar levels look stable. Keep maintaining your daily routine.'
        )
    : t(
        'patientDashboard.situation.noResultDesc',
        'Take your first assessment to receive personalized guidance, risk evaluation, and customized health targets.'
      )

  return (
    <>
      <section
        className={cn(
          'relative overflow-hidden rounded-[26px] border p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300',
          isUrgent
            ? 'border-rose-200/80 bg-gradient-to-r from-[#fff5f5] via-white to-[#fff9f4] dark:border-rose-900/30 dark:from-[#211116]/50 dark:via-slate-900 dark:to-slate-900'
            : latestResult
              ? 'border-emerald-200/80 bg-gradient-to-r from-[#f0fcf4] via-white to-[#f0f9ff] dark:border-emerald-900/30 dark:from-[#0d2218]/50 dark:via-slate-900 dark:to-slate-900'
              : 'border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900'
        )}
      >
        {/* Soft decorative background blur */}
        <div
          className={cn(
            'pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl',
            isUrgent ? 'bg-rose-200/50 dark:bg-rose-950/30' : 'bg-emerald-200/40 dark:bg-emerald-950/30'
          )}
        />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          {/* Left Column: Greeting & Diagnosis Details */}
          <div className="max-w-3xl">
            {/* Live date & Status Pill */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {todayFormatted}
              </span>
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />

              {latestResult ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold shadow-2xs backdrop-blur-md',
                    isUrgent
                      ? 'border border-rose-200/80 bg-rose-100/90 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/80 dark:text-rose-300'
                      : 'border border-emerald-200/80 bg-emerald-100/90 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/80 dark:text-emerald-300'
                  )}
                >
                  {isUrgent ? (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      <span>{isHighA1c ? 'High HbA1c Alert' : 'Requires Attention'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Routine Monitoring</span>
                    </>
                  )}
                </span>
              ) : null}
            </div>

            {/* Greeting Headline */}
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {greeting}
            </h1>

            {/* Primary Diagnosis & Plain-Language Explanation */}
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {diagnosisTitle}
              </span>
              <span className="hidden text-slate-300 dark:text-slate-700 sm:inline">•</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {plainExplanation}
              </span>
            </div>
          </div>

          {/* Right Column: Action Buttons & Last Checked */}
          <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Primary Action Button */}
              <Link
                to="/diagnosis"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <ClipboardPlus className="h-4 w-4" />
                <span>{t('patientDashboard.situation.takeNewAssessment', 'Take Assessment')}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              {/* View Doctor Report */}
              <Link
                to={
                  latestResult?.id
                    ? `/diagnosis/result?diagnosis_result_id=${latestResult.id}`
                    : '/my-results'
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                <span>{t('patientDashboard.situation.viewDoctorReport', 'Doctor Report')}</span>
              </Link>

              {/* Contact Doctor CTA */}
              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Stethoscope className="h-4 w-4 text-primary-500" />
                <span>Contact Doctor</span>
              </button>
            </div>

            {/* Last Assessment Timestamp */}
            {latestResult?.created_at ? (
              <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <HeartPulse className="h-3.5 w-3.5 text-rose-500/80" />
                <span>
                  Last check: {getRelativeCheckAge(latestResult.created_at, t)} (
                  {formatDateTime(latestResult.created_at, language, '—')})
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Doctor & Care Team Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Diabetes Care Team
                  </h4>
                  <p className="text-xs text-slate-500">General Diabetes Clinic • Care Unit A</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-slate-100 bg-[#fafafc] p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-200 text-sm font-bold text-primary-800">
                  {latestResult?.reviewed_by_name ? latestResult.reviewed_by_name.slice(0, 2).toUpperCase() : 'DC'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {latestResult?.reviewed_by_name
                      ? (latestResult.reviewed_by_name.startsWith('Dr.') ? latestResult.reviewed_by_name : `Dr. ${latestResult.reviewed_by_name}`)
                      : 'Diabetes Clinical Care Team'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {latestResult?.reviewed_by_name ? 'Attending Physician' : 'Endocrinology & Care Support'}
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Contact for medication adjustments, lab prescriptions, or severe glucose readings (&gt; 250 mg/dL or &lt; 70 mg/dL).
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <a
                href="tel:+85523888999"
                className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span>Clinic Hotline: +855 23 888 999</span>
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                  Open Now
                </span>
              </a>

              <a
                href="mailto:careteam@diabetesclinic.org?subject=Diabetes%20Care%20Plan%20Inquiry"
                className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-sky-600" />
                  <span>careteam@diabetesclinic.org</span>
                </span>
                <span className="text-[10px] text-slate-400">&lt; 24h reply</span>
              </a>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="rounded-full bg-slate-100 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
