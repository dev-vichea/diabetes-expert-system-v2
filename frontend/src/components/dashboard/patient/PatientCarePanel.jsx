import { Link } from 'react-router-dom'
import { ArrowRight, FileText, Siren, Sparkles, Stethoscope } from 'lucide-react'
import { SectionCard } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  formatDateTime,
  getA1cCategory,
  getBmiCategory,
  getDaysSinceCheck,
  getFastingGlucoseCategory,
  getRelativeCheckAge,
  getReportedSymptomLabels,
  getRiskFactorLabels,
  getUnderstandingKey,
  toNumberOrNull,
  toPercentValue,
} from './patient-dashboard-utils'
import { buildAutoRecommendations } from './patient-recommendations'
import { useLanguage } from '@/contexts/LanguageContext'

const eyebrow = 'flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400'
const tile = 'rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/30'

/* Hero gradient follows the status: urgent → red, high confidence → amber, calm → green. */
const HERO_TONES = {
  urgent: 'from-rose-500 via-rose-600 to-red-700',
  watch: 'from-amber-400 via-orange-500 to-amber-600',
  good: 'from-emerald-400 via-emerald-500 to-teal-600',
}

const STEP_TONES = {
  1: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
  2: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
  3: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
}

function ConfidenceDonut({ percent, label }) {
  const radius = 33
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)
  return (
    <div className="relative h-[76px] w-[76px] shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={radius} fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black leading-none text-white">{percent}%</span>
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-white/75">{label}</span>
      </div>
    </div>
  )
}

export function PatientCarePanel({ latestResult, results = [] }) {
  const { language, t, tExact } = useLanguage()
  const confidencePercent = toPercentValue(latestResult?.certainty)
  const reportedSymptoms = latestResult ? getReportedSymptomLabels(latestResult, t) : []
  const riskFactors = latestResult ? getRiskFactorLabels(latestResult, t) : []
  const understandingKey = latestResult ? getUnderstandingKey(latestResult) : 'understandingFallback'
  const recommendations = latestResult
    ? buildAutoRecommendations({ latestResult, results, t, daysSinceLastCheck: getDaysSinceCheck(latestResult.created_at) })
    : []

  /* Health snapshot from the latest assessment's facts. */
  const facts = latestResult?.facts && typeof latestResult.facts === 'object' ? latestResult.facts : {}
  const age = toNumberOrNull(facts.age)
  const bmi = toNumberOrNull(facts.bmi)
  const fastingGlucose = toNumberOrNull(facts.fasting_glucose)
  const hba1c = toNumberOrNull(facts.hba1c)
  const categoryLabels = {
    normal: t('patientDashboard.carePlan.catNormal', 'Normal'),
    prediabetes: t('patientDashboard.carePlan.catPrediabetes', 'Borderline'),
    diabetes: t('patientDashboard.carePlan.catDiabetes', 'High'),
    overweight: t('patientDashboard.carePlan.catOverweight', 'Overweight'),
    obese: t('patientDashboard.carePlan.catObese', 'Obese'),
    underweight: t('patientDashboard.carePlan.catUnderweight', 'Underweight'),
  }
  const numberCells = [
    age !== null && { label: t('patientDashboard.carePlan.numbersAge', 'Age'), value: String(age), unit: t('patientDashboard.carePlan.yearsUnit', 'yrs') },
    bmi !== null && { label: t('patientDashboard.carePlan.numbersBmi', 'BMI'), value: String(bmi), category: getBmiCategory(bmi) },
    fastingGlucose !== null && { label: t('patientDashboard.carePlan.numbersFasting', 'Fasting glucose'), value: String(fastingGlucose), unit: t('patientDashboard.carePlan.unitMgdl', 'mg/dL'), category: getFastingGlucoseCategory(fastingGlucose) },
    hba1c !== null && { label: t('patientDashboard.carePlan.numbersHba1c', 'HbA1c'), value: String(hba1c), unit: t('patientDashboard.carePlan.unitPercent', '%'), category: getA1cCategory(hba1c) },
  ].filter(Boolean)

  const isUrgent = Boolean(latestResult?.is_urgent)
  const heroTone = isUrgent ? 'urgent' : confidencePercent >= 70 ? 'watch' : 'good'
  const conclusion = latestResult ? (tExact(latestResult.diagnosis) || t('patientDashboard.carePlan.noDiagnosisAvailable', 'No diagnosis available')) : ''

  return (
    <SectionCard
      title={t('patientDashboard.carePlan.title', 'Care Plan')}
      description={t('patientDashboard.carePlan.description', 'What matters most after your latest assessment.')}
      actions={
        <Link
          to="/care-plan"
          className="inline-flex min-h-9 items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          {t('patientDashboard.carePlan.openFull', 'Open care plan')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      {!latestResult ? (
        <Link
          to="/diagnosis"
          className="group flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center transition hover:border-primary-400 hover:bg-primary-50/40 dark:border-slate-700 dark:bg-slate-950/30 dark:hover:border-primary-600 dark:hover:bg-primary-950/20"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 transition group-hover:scale-105 dark:bg-primary-950/60 dark:text-primary-300">
            <Sparkles className="h-6 w-6" />
          </span>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100">
            {t('patientDashboard.carePlan.emptyTitle', 'No latest summary yet')}
          </span>
          <span className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t('patientDashboard.carePlan.emptyDescription', 'Once you complete an assessment, your most recent diagnosis and follow-up plan will appear here.')}
          </span>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white">
            {t('diagnosisResult.backToAssessment', 'Back to Assessment')}
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ) : (
        <div className="flex min-w-0 flex-col gap-4">
          {/* ── Hero banner: status, conclusion, plain-language meaning ── */}
          <div className={cn('relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-lg sm:p-6', HERO_TONES[heroTone])}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_34%)]" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
              <ConfidenceDonut percent={confidencePercent} label={t('patientDashboard.carePlan.confidence', 'Confidence')} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                    isUrgent ? 'bg-white text-rose-700' : 'bg-white/20 text-white',
                  )}>
                    {isUrgent
                      ? t('patientDashboard.status.needsAttention', 'Needs attention')
                      : t('patientDashboard.status.stable', 'Stable')}
                  </span>
                  <span className="text-xs font-medium text-white/80">
                    {formatDateTime(latestResult.created_at, language, t('common.notAvailable'))}
                    {getRelativeCheckAge(latestResult.created_at, t) ? ` · ${getRelativeCheckAge(latestResult.created_at, t)}` : ''}
                  </span>
                </div>
                <h3 className="mt-2 text-xl font-black leading-tight tracking-tight sm:text-2xl">
                  {conclusion}
                </h3>
                <p className="mt-2 line-clamp-3 max-w-3xl text-sm leading-6 text-white/85">
                  <span className="font-bold text-white">{t('patientDashboard.carePlan.heroWhatThisMeans', 'What this means')}: </span>
                  {t(`patientDashboard.carePlan.${understandingKey}`, 'This report compares your answers against medical rules for diabetes. Open the full report to see the evidence behind it and the recommended next steps.')}
                </p>
              </div>

              <Link
                to={`/diagnosis/result?diagnosis_result_id=${latestResult.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-white/20 px-3.5 py-2 text-xs font-bold text-white ring-1 ring-inset ring-white/40 backdrop-blur transition hover:bg-white/30 sm:self-center"
              >
                <FileText className="h-3.5 w-3.5" />
                {t('patientDashboard.carePlan.heroViewReport', 'View full report')}
              </Link>
            </div>
          </div>

          {/* ── Numbers + doctor's note ── */}
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <div className={tile}>
              <p className={eyebrow}>{t('patientDashboard.carePlan.numbersTitle', 'Your numbers')}</p>
              {numberCells.length ? (
                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {numberCells.map((cell) => (
                    <div key={cell.label} className="rounded-xl bg-slate-50 px-2.5 py-3 text-center dark:bg-slate-900/60">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{cell.label}</p>
                      <p className="mt-1 text-lg font-black leading-none text-slate-900 dark:text-slate-50">
                        {cell.value}
                        {cell.unit ? <span className="ml-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">{cell.unit}</span> : null}
                      </p>
                      {cell.category ? (
                        <span className={cn(
                          'mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold',
                          cell.category.tone === 'danger' && 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
                          cell.category.tone === 'warning' && 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
                          cell.category.tone === 'success' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
                        )}>
                          {categoryLabels[cell.category.id]}
                        </span>
                      ) : (
                        <span className="mt-1.5 block">&nbsp;</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {t('patientDashboard.carePlan.numbersNoLabs', 'No lab values yet — a fasting glucose and HbA1c test will make your reports far more accurate.')}
                </p>
              )}
            </div>

            <div className={cn(tile, 'min-w-0')}>
              <p className={eyebrow}>
                <Stethoscope className="h-3.5 w-3.5" />
                {t('patientDashboard.carePlan.reviewNote', 'Review Note')}
              </p>
              {latestResult.review_note ? (
                <blockquote className="mt-3 border-l-[3px] border-primary-500 pl-3.5 text-sm italic leading-6 text-slate-700 dark:text-slate-300">
                  {latestResult.review_note}
                </blockquote>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-400 dark:text-slate-500">
                  {t('patientDashboard.carePlanPage.doctorNote.empty', 'No note from your doctor yet — notes appear here after a clinician reviews your result.')}
                </p>
              )}
            </div>
          </div>

          {/* ── Numbered next steps ── */}
          {recommendations.length ? (
            <div className={cn(tile, 'min-w-0')}>
              <p className={eyebrow}>{t('patientDashboard.carePlan.nextStepsTitle', 'Your next steps')}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div key={rec.id} className="flex items-start gap-2.5 rounded-xl bg-slate-50/80 p-3 dark:bg-slate-900/60">
                    <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black', STEP_TONES[rec.priority] || STEP_TONES[3])}>
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold leading-5 text-slate-800 dark:text-slate-200">{rec.title}</p>
                      <p className="mt-0.5 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{rec.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* ── Symptoms · risk factors · emergency signs ── */}
          <div className="grid min-w-0 gap-4 lg:grid-cols-3">
            <div className={cn(tile, 'min-w-0')}>
              <p className={eyebrow}>{t('patientDashboard.carePlan.reportedSymptoms', 'Symptoms you reported')}</p>
              {reportedSymptoms.length ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {reportedSymptoms.slice(0, 6).map((label) => (
                    <span key={label} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {t('patientDashboard.carePlan.noSymptoms', 'No symptoms reported in your latest assessment.')}
                </p>
              )}
            </div>

            <div className={cn(tile, 'min-w-0')}>
              <p className={eyebrow}>{t('patientDashboard.carePlan.riskTitle', 'Your risk factors')}</p>
              {riskFactors.length ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {riskFactors.map((label) => (
                    <span key={label} className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200/70 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/60">
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {t('patientDashboard.carePlan.riskEmpty', 'No risk factors recorded in your latest assessment.')}
                </p>
              )}
            </div>

            <div className="min-w-0 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
              <p className={cn(eyebrow, 'text-rose-700 dark:text-rose-300')}>
                <Siren className="h-3.5 w-3.5" />
                {t('patientDashboard.carePlan.warningTitle', 'Warning signs — get help fast')}
              </p>
              <p className="mt-2 line-clamp-4 text-xs leading-5 text-rose-900/85 dark:text-rose-200/85">
                {t('patientDashboard.carePlan.warningBody', 'Go to emergency care for fruity-smelling breath, deep or fast breathing, vomiting with no fluids kept down, confusion or extreme drowsiness. For shakiness, sweating or dizziness, take fast sugar (juice or glucose tablets) and recheck after 15 minutes.')}
              </p>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  )
}
