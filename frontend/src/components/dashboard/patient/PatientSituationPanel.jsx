import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardPlus,
  FileText,
  HeartPulse,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime, getRelativeCheckAge, toNumberOrNull } from './patient-dashboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'

export function PatientSituationPanel({ latestResult }) {
  const { language, t, tExact } = useLanguage()

  const isUrgent = Boolean(latestResult?.is_urgent)
  const facts = latestResult?.facts || {}
  const hba1c = toNumberOrNull(facts.hba1c)
  const isHighA1c = hba1c !== null && hba1c >= 8.0

  // Apple Health style plain-language explanation
  const plainExplanation = latestResult
    ? isUrgent
      ? isHighA1c
        ? t(
            'patientDashboard.situation.highA1cDesc',
            'Your recent HbA1c is 10.5%, above the 5.7% target. Staying consistent with medication and booking a follow-up visit will help guide your levels lower.'
          )
        : t(
            'patientDashboard.situation.urgentDesc',
            'Your latest glucose indicators are higher than standard ranges. We recommend checking in with your doctor for next steps.'
          )
      : t(
          'patientDashboard.situation.stableDesc',
          'Your metabolic indicators and blood sugar levels look stable. Keep maintaining your daily routine and healthy habits.'
        )
    : t(
        'patientDashboard.situation.noResultDesc',
        'Take your first assessment to establish your personal health baseline and receive tailored wellness targets.'
      )

  const diagnosisTitle = latestResult?.diagnosis
    ? (tExact ? tExact(latestResult.diagnosis) : latestResult.diagnosis)
    : t('patientDashboard.hero.noDiagnosisYet', 'No diagnosis result yet')

  return (
    <div
      className={cn(
        'relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border p-6 transition-all duration-300 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)]',
        isUrgent
          ? 'border-rose-200/80 bg-gradient-to-br from-[#fff6f6] via-white to-[#fffaf2] dark:border-rose-900/30 dark:from-[#211116]/60 dark:via-[#13131c] dark:to-[#13131c]'
          : latestResult
            ? 'border-emerald-200/80 bg-gradient-to-br from-[#f2fcf5] via-white to-[#f0f9ff] dark:border-emerald-900/30 dark:from-[#0d2218]/60 dark:via-[#13131c] dark:to-[#13131c]'
            : 'border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900'
      )}
    >
      {/* Decorative ambient blur circle */}
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl',
          isUrgent ? 'bg-rose-200/60 dark:bg-rose-950/30' : 'bg-emerald-200/50 dark:bg-emerald-950/30'
        )}
      />

      <div>
        {/* Top Eyebrow & Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-2xl shadow-sm',
                isUrgent
                  ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
              )}
            >
              {isUrgent ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                Health Alert
              </p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isUrgent ? 'Clinical Attention' : 'All Vitals Normal'}
              </p>
            </div>
          </div>

          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold shadow-2xs backdrop-blur-md',
              isUrgent
                ? 'border border-rose-200/80 bg-rose-100/90 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/80 dark:text-rose-300'
                : 'border border-emerald-200/80 bg-emerald-100/90 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/80 dark:text-emerald-300'
            )}
          >
            {isUrgent ? (isHighA1c ? 'High HbA1c' : 'Requires Attention') : 'Routine Monitoring'}
          </span>
        </div>

        {/* Diagnosis & Plain Language Explanation */}
        <div className="mt-5">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-[1.7rem]">
            {diagnosisTitle}
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
            {plainExplanation}
          </p>
        </div>
      </div>

      {/* Action Buttons & Timestamps */}
      <div className="mt-7 pt-2">
        <div className="flex flex-wrap items-center gap-3">
          {/* Primary CTA (Apple iOS Pill) */}
          <Link
            to="/diagnosis"
            className="inline-flex items-center gap-2.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <ClipboardPlus className="h-4 w-4" />
            <span>{t('patientDashboard.situation.takeNewAssessment', 'Take New Assessment')}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Secondary CTA (Glass outline pill) */}
          <Link
            to={
              latestResult?.id
                ? `/diagnosis/result?diagnosis_result_id=${latestResult.id}`
                : '/my-results'
            }
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs backdrop-blur-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FileText className="h-4 w-4 text-slate-400" />
            <span>{t('patientDashboard.situation.viewDoctorReport', 'View Doctor Report')}</span>
          </Link>
        </div>

        {/* Apple style discrete metadata */}
        {latestResult?.created_at ? (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <HeartPulse className="h-3.5 w-3.5 text-rose-500/80" />
            <span>
              Last recorded: {getRelativeCheckAge(latestResult.created_at, t)} ({formatDateTime(latestResult.created_at, language, '—')})
            </span>
          </p>
        ) : null}
      </div>
    </div>
  )
}
