import { useEffect, useRef } from 'react'
import {
  Activity, AlertTriangle, ArrowLeft, Armchair, Baby, Bandage, BatteryLow, Bug, Building2, CalendarHeart,
  Calculator, Check, Cigarette, ClipboardList, Contrast, Droplet, Droplets, Egg, Eye, Flame, FlaskConical, Flower2,
  GlassWater, Globe, Hand, HeartCrack, HeartPulse, Info, PenTool, Plus, RefreshCw, Scale, ShieldAlert, Soup,
  Sparkles, Stethoscope, TestTube2, Timer, TrendingDown, Trash2, UserRound, Users, Vibrate, Waves, Weight, X,
} from 'lucide-react'
import { AppSelect, LoadingState } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  FIELD_FALLBACKS, camelField, fieldLabelKey, getFactLabel, nodeFields,
  getNodeQuestion, getNodeHelper, getNodeMedicalTerm,
} from './interview-flow'

const NODE_ICONS = {
  Building2, UserRound, Baby, CalendarHeart, Droplets, Stethoscope, AlertTriangle,
  ClipboardList, Scale, TestTube2, FlaskConical, PenTool, Timer, Users, Activity, Contrast,
  Globe, ShieldAlert, GlassWater, BatteryLow, HeartPulse, Armchair, Soup, Cigarette,
}

const FIELD_ICONS = {
  frequent_urination: Droplets, excessive_thirst: GlassWater, weight_loss: TrendingDown,
  fatigue: BatteryLow, blurred_vision: Eye, slow_healing: Bandage, nausea: Waves,
  tingling_hands_feet: Hand, burning_sensation: Flame, numbness: Hand,
  frequent_infections: Bug, recurrent_uti_yeast: Bug, itchy_skin: Bandage,
  acanthosis_nigricans: Contrast, bed_wetting: Baby,
  sweating: Droplet, shaking: Vibrate, dizziness: RefreshCw, vomiting: Soup, abdominal_pain: HeartCrack,
  family_history: Users, obesity: Weight, hypertension: HeartPulse, sedentary_lifestyle: Armchair,
  gestational_history: Baby, smoking: Cigarette, high_cholesterol: Egg, pcos_history: Flower2,
  ethnicity_high_risk: Globe,
  dyslipidemia_low_hdl: Egg, dyslipidemia_high_tg: Egg, cardiovascular_disease: HeartPulse,
  macrosomia_history: Baby, sleep_apnea_history: Activity, alcohol_frequent: GlassWater,
  urine_ketones: TestTube2, unquenchable_thirst: GlassWater, severe_fatigue: BatteryLow,
  nocturia: Droplets, physical_inactivity: Armchair, sugary_diet: Soup,
}

function QuestionCard({ node, title, helper, medicalTerm, children }) {
  const Icon = NODE_ICONS[node.icon] || ClipboardList
  return (
    <div className="assessment-card-enter min-w-0 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6 sm:p-8 dark:border-slate-700/60 dark:bg-[#0f1533]/50">
      <div className="flex items-start gap-3.5 sm:gap-4">
        <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100/70 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400">
          <Icon className="h-5.5 w-5.5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-slate-50 sm:text-xl">{title}</h3>
            {medicalTerm ? (
              <span className="inline-flex items-center rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700 ring-1 ring-inset ring-cyan-600/20 dark:bg-cyan-950/60 dark:text-cyan-300 dark:ring-cyan-500/30">
                {medicalTerm}
              </span>
            ) : null}
          </div>
          {helper ? <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{helper}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  )
}

function YesNoButtons({ value, onPick, noLabel, yesLabel, t }) {
  const options = [
    { v: false, label: noLabel },
    { v: true, label: yesLabel },
  ]
  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((opt) => (
        <button
          key={String(opt.v)}
          type="button"
          onClick={() => onPick(opt.v)}
          className={cn(
            'flex items-center justify-center gap-2.5 rounded-xl border-2 px-5 py-4 text-base font-semibold transition-all',
            value === opt.v
              ? 'border-cyan-500 bg-cyan-500 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/50 dark:border-slate-700 dark:bg-[#0b0b16] dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-cyan-900/20',
          )}
        >
          {value === opt.v ? <Check className="h-5 w-5" strokeWidth={2.5} /> : null}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function MultiGrid({ node, form, ctx, t, factsMap, language, onToggle, onNone }) {
  /* ctx carries the settled probe ids so the shrink filter can't mistake a
     just-tapped choice for "already asked" — choices must stay visible. */
  const fields = nodeFields(node, ctx || { form })
  const selectedCount = fields.filter((f) => form[f]).length
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((key) => {
          const FIcon = FIELD_ICONS[key] || Activity
          const active = Boolean(form[key])
          const fact = factsMap?.get(key)
          const label = getFactLabel(key, factsMap, language, t)
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(node, key, !active)}
              title={fact?.question || undefined}
              className={cn(
                'toggle-pill assessment-card-enter text-left group',
                active && 'active',
              )}
            >
              <FIcon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  active
                    ? 'text-primary-600 dark:text-sky-300'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300',
                )}
                strokeWidth={2}
              />
              <span className="flex-1 min-w-0">
                <span
                  className={cn(
                    'block leading-snug transition-colors text-[0.95rem]',
                    active
                      ? 'font-semibold text-primary-950 dark:text-slate-50'
                      : 'font-medium text-slate-700 dark:text-slate-200',
                  )}
                >
                  {label}
                </span>
              </span>
              <span className="pill-check">{active ? <Check className="h-3 w-3" /> : null}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onNone(node)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-3.5 w-3.5" /> {t('assessment.interview.noneOfThese', 'None of these')}
        </button>
        <span className={cn('text-xs font-medium', selectedCount ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400')}>
          {selectedCount ? t('assessment.interview.selectedCount', `${selectedCount} selected`) : ''}
        </span>
      </div>
    </div>
  )
}

function SegmentButtons({ options, value, onChange }) {
  return (
    <div className="segment-group">
      {options.map((opt) => (
        <button key={opt.id} type="button" className={cn('segment-btn', value === opt.id && 'active')} onClick={() => onChange(opt)}>
          <div className="text-sm font-semibold">{opt.label}</div>
          {opt.sub ? <div className="mt-0.5 text-[11px] opacity-70">{opt.sub}</div> : null}
        </button>
      ))}
    </div>
  )
}

function getBmiStatus(bmi) {
  const num = Number(bmi)
  if (!num || num < 10 || num > 80) return null
  if (num < 18.5) {
    return {
      id: 'underweight',
      labelKey: 'assessment.options.bmi.underweight',
      defaultLabel: 'Underweight',
      range: '< 18.5',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
      activeRing: 'ring-sky-500 border-sky-500 bg-sky-50/80 dark:bg-sky-950/40',
      dotClass: 'bg-sky-500',
    }
  }
  if (num < 23.0) {
    return {
      id: 'normal',
      labelKey: 'assessment.options.bmi.normal',
      defaultLabel: 'Normal weight',
      range: '18.5 – 22.9',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      activeRing: 'ring-emerald-500 border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40',
      dotClass: 'bg-emerald-500',
    }
  }
  if (num < 27.5) {
    return {
      id: 'Overweight',
      labelKey: 'assessment.options.bmi.overweight',
      defaultLabel: 'Overweight',
      range: '23.0 – 27.4',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      activeRing: 'ring-amber-500 border-amber-500 bg-amber-50/80 dark:bg-amber-950/40',
      dotClass: 'bg-amber-500',
    }
  }
  return {
    id: 'obese',
    labelKey: 'assessment.options.bmi.obese',
    defaultLabel: 'Obese',
    range: '≥ 27.5',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    activeRing: 'ring-rose-500 border-rose-500 bg-rose-50/80 dark:bg-rose-950/40',
    dotClass: 'bg-rose-500',
  }
}

export function InterviewFlow(props) {
  const {
    node, form, qcm, t,
    patients, loadingPatients,
    subjectOptions = [], subjectValue = null, onSelectSubject,
    ageOptions, bmiOptions = [], labOptions, renderBadge,
    extraLabs, onAddExtraLab, onRemoveExtraLab,
    onField, onPickSegment, onSetCustom, onCalculateBmi,
    onYesNo, onChoice, onToggleMulti, onMultiNone,
    onContinue, onSkip, onBack, canBack = false, analyzing, editing,
    doneIds = [], skippedIds = [],
    factsMap = null, fieldGroups = null,
  } = props

  const { language } = useLanguage()
  const inputRef = useRef(null)
  useEffect(() => { if (node?.kind === 'number' && inputRef.current) inputRef.current.focus() }, [node?.id])

  if (!node) return null

  const title = getNodeQuestion(node, factsMap, language, t)
  const helper = getNodeHelper(node, factsMap, language, t)
  const medicalTerm = getNodeMedicalTerm(node, factsMap)
  const continueLabel = editing ? t('assessment.interview.doneEditing', 'Done') : t('common.continue', 'Continue')

  let body = null
  let continueEnabled = true

  if (node.kind === 'patient') {
    body = loadingPatients
      ? <LoadingState label="Loading patients..." />
      : (
        <AppSelect
          value={form.patient_id}
          onValueChange={(v) => { onField('patient_id', v); onContinue() }}
          placeholder={t('assessment.patient.selectPlaceholder', 'Select a patient')}
          includeEmpty
          emptyLabel={patients.length ? t('assessment.patient.selectPlaceholder', 'Select a patient') : t('assessment.patient.noPatients', 'No patients found')}
          options={patients.map((p) => ({ value: String(p.id), label: `${p.full_name} (#${p.id})` }))}
        />
      )
  } else if (node.kind === 'subject') {
    /* Patient accounts: "Myself / Someone else" — picking one answers the
       question and advances the flow immediately (no Continue button). */
    body = (
      <div className="grid gap-3 sm:grid-cols-2">
        {subjectOptions.map((option) => {
          const active = subjectValue === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectSubject(option.id)}
              aria-pressed={active}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                active
                  ? 'border-cyan-500 bg-cyan-50/70 ring-2 ring-cyan-400 dark:border-cyan-500 dark:bg-cyan-950/40 dark:ring-cyan-600'
                  : 'border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/40 dark:border-slate-700 dark:bg-[#0b0b16] dark:hover:border-cyan-700 dark:hover:bg-cyan-900/20',
              )}
            >
              <option.icon className={cn('mt-0.5 h-5 w-5 shrink-0', active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400')} aria-hidden="true" />
              <span className="min-w-0">
                <span className={cn('block text-[0.98rem] font-bold', active ? 'text-cyan-900 dark:text-cyan-200' : 'text-slate-800 dark:text-slate-100')}>
                  {t(option.labelKey, option.labelFallback)}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {t(option.descKey, option.descFallback)}
                </span>
              </span>
              {active ? <Check className="ml-auto h-4.5 w-4.5 shrink-0 text-cyan-600 dark:text-cyan-400" strokeWidth={2.5} /> : null}
            </button>
          )
        })}
      </div>
    )
  } else if (node.kind === 'number') {
    continueEnabled = String(form[node.field] || '').trim() !== ''
    body = (
      <div>
        <input
          ref={inputRef}
          className="input-base max-w-xs text-lg font-semibold"
          type="number"
          min={1}
          max={120}
          inputMode="numeric"
          placeholder={t('assessment.interview.agePlaceholder', 'e.g. 42')}
          value={form[node.field]}
          onChange={(e) => onSetCustom(node.qcm, node.field, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && continueEnabled) onContinue() }}
        />
        <div className="mt-4">
          <SegmentButtons options={ageOptions} value={qcm[node.qcm]} onChange={(opt) => onPickSegment(node.qcm, opt, node.field)} />
        </div>
      </div>
    )
  } else if (node.kind === 'choice') {
    body = (
      <div className={cn('grid gap-2.5', node.options.length === 2 ? 'grid-cols-2' : node.options.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
        {node.options.map((opt) => {
          const isDone = doneIds.includes(node.id)
          const active = (isDone || (form[node.field] !== null && form[node.field] !== undefined && form[node.field] !== '')) && form[node.field] === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChoice(node, opt.value)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition-all',
                active
                  ? 'border-cyan-500 bg-cyan-500 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/50 dark:border-slate-700 dark:bg-[#0b0b16] dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-cyan-900/20',
              )}
            >
              {active ? <Check className="h-4.5 w-4.5" strokeWidth={2.5} /> : null}
              {t(opt.labelKey, opt.labelFallback)}
            </button>
          )
        })}
      </div>
    )
  } else if (node.kind === 'yesno') {
    const isDone = doneIds.includes(node.id)
    const value = node.field === 'has_labs'
      ? (form.has_labs === 'yes' ? true : form.has_labs === 'no' ? false : null)
      : (isDone ? Boolean(form[node.field]) : null)
    body = (
      <YesNoButtons
        value={value}
        onPick={(v) => onYesNo(node, v)}
        noLabel={t('assessment.interview.answerNo', 'No')}
        yesLabel={t('assessment.interview.answerYes', 'Yes')}
        t={t}
      />
    )
  } else if (node.kind === 'multi') {
    body = (
      <MultiGrid
        node={node}
        form={form}
        ctx={{ form, doneIds, skippedIds, fieldGroups }}
        t={t}
        factsMap={factsMap}
        language={language}
        onToggle={onToggleMulti}
        onNone={onMultiNone}
      />
    )
  } else if (node.kind === 'text') {
    body = (
      <textarea
        className="input-base min-h-[90px] resize-y"
        value={form[node.field]}
        onChange={(e) => onField(node.field, e.target.value)}
        placeholder={t('assessment.extraPlaceholderText', 'e.g. tingling feet, dry mouth...')}
      />
    )
  } else if (node.kind === 'body') {
    // Align with validation (BMI must be 10–80) so half-typed direct entries
    // can't be submitted — and a live-calculated BMI only unlocks once plausible.
    continueEnabled = Number(form.bmi) >= 10
    const currentBmiStatus = getBmiStatus(form.bmi)
    const bmiTiers = [
      { id: 'underweight', labelKey: 'assessment.interview.bmiScaleUnderweight', fallback: 'Underweight (< 18.5)', match: (v) => v < 18.5 },
      { id: 'normal', labelKey: 'assessment.interview.bmiScaleNormal', fallback: 'Normal weight (18.5 – 22.9)', match: (v) => v >= 18.5 && v < 23.0 },
      { id: 'overweight', labelKey: 'assessment.interview.bmiScaleOverweight', fallback: 'Overweight (23.0 – 27.4)', match: (v) => v >= 23.0 && v < 27.5 },
      { id: 'obese', labelKey: 'assessment.interview.bmiScaleObese', fallback: 'Obesity (≥ 27.5)', match: (v) => v >= 27.5 },
    ]
    const numericBmi = Number(form.bmi)

    body = (
      <div className="space-y-6">
        {/* Top Split: Educational Callout (Left) + Interactive BMI Calculator Widget (Right) */}
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Left Column: What is BMI? Clinical & IDF Educational Guidance */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/70 via-white to-sky-50/40 p-5 shadow-xs dark:border-cyan-900/40 dark:from-cyan-950/20 dark:via-[#0f1533] dark:to-sky-950/20">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-xs dark:bg-cyan-500">
                  <Info className="h-4.5 w-4.5" />
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t('assessment.interview.whatIsBmiTitle', 'What is Body Mass Index (BMI)?')}
                </h4>
              </div>

              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t('assessment.interview.whatIsBmiDesc', 'The body-mass index is used to assess whether a person is a healthy weight for their height. It is calculated by dividing body weight (kg) by the square of body height (m). For example, if your height is 165 cm and your weight is 70 kg, your body-mass index will be 25.7.')}
              </p>

              {/* Diabetes Clinical Connection Callout */}
              <div className="mt-3.5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{t('assessment.interview.bmiDiabetesRisk', 'Higher body fat — especially visceral fat around the abdomen — increases insulin resistance, making it harder for the body to regulate blood sugar.')}</span>
                </div>
              </div>

              {/* Asian Population Threshold Notice */}
              <div className="mt-2.5 rounded-xl border border-sky-200/80 bg-sky-50/70 p-3 text-xs leading-relaxed text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">
                <div className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  <span>{t('assessment.interview.bmiAsianNotice', 'For Asian populations, diabetes risk increases at lower thresholds: BMI ≥ 23 indicates overweight, and BMI ≥ 27.5 indicates obesity.')}</span>
                </div>
              </div>
            </div>

            {/* 4-Tier Scale Badges */}
            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {bmiTiers.map((tier) => {
                  const isActive = numericBmi >= 10 && tier.match(numericBmi)
                  return (
                    <div
                      key={tier.id}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all',
                        isActive
                          ? 'border-cyan-500 bg-white shadow-md ring-2 ring-cyan-400 dark:border-cyan-400 dark:bg-slate-900'
                          : 'border-slate-200/80 bg-white/70 opacity-80 dark:border-slate-800 dark:bg-slate-900/60'
                      )}
                    >
                      <span className={cn('text-[11px] font-semibold', isActive ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400')}>
                        {t(tier.labelKey, tier.fallback)}
                      </span>
                      {isActive ? (
                        <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3 w-3" strokeWidth={3} /> Current
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive BMI Calculator Widget */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#0b0b16]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
                    <Calculator className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {t('assessment.interview.bmiCalculatorTitle', 'BMI Calculator')}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Metric (kg / cm)
                </span>
              </div>

              {/* Inputs */}
              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('assessment.weightKg', 'Weight (kg)')}
                  </label>
                  <div className="relative">
                    <input
                      className="input-base pr-12 text-base font-semibold"
                      type="number"
                      min={2}
                      max={400}
                      step="0.1"
                      placeholder="e.g. 65"
                      value={form.weight_kg || ''}
                      onChange={(e) => {
                        onField('weight_kg', e.target.value)
                        onCalculateBmi(e.target.value, form.height_cm)
                      }}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      kg
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('assessment.heightCm', 'Height (cm)')}
                  </label>
                  <div className="relative">
                    <input
                      className="input-base pr-12 text-base font-semibold"
                      type="number"
                      min={40}
                      max={260}
                      step="0.1"
                      placeholder="e.g. 170"
                      value={form.height_cm || ''}
                      onChange={(e) => {
                        onField('height_cm', e.target.value)
                        onCalculateBmi(form.weight_kg, e.target.value)
                      }}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      cm
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Result Display */}
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
              {currentBmiStatus ? (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t('assessment.interview.bmiIs', 'Your BMI:')}
                    </span>
                    <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                      {form.bmi} <span className="text-xs font-normal text-slate-400">kg/m²</span>
                    </div>
                  </div>
                  <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-xs', currentBmiStatus.badgeClass)}>
                    <span className={cn('h-2 w-2 rounded-full', currentBmiStatus.dotClass)} />
                    {t(currentBmiStatus.labelKey, currentBmiStatus.defaultLabel)}
                  </div>
                </div>
              ) : (
                <p className="text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {t('assessment.interview.enterHeightWeightPrompt', 'Enter your height and weight to calculate your BMI, or select your category below.')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Quick Category Selection + Waist Circumference */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 dark:border-slate-800 dark:bg-[#0b0b16]/60 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label-text font-bold text-slate-800 dark:text-slate-200">
                {t('assessment.interview.orExactBmi', 'Or select BMI category directly')}
              </span>
              {form.bmi ? (
                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                  BMI: {form.bmi}
                </span>
              ) : null}
            </div>
            {bmiOptions && bmiOptions.length > 0 ? (
              <SegmentButtons
                options={bmiOptions}
                value={qcm?.bmi_group}
                onChange={(opt) => onPickSegment('bmi_group', opt, 'bmi')}
              />
            ) : null}
          </div>

          <div className="grid gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 sm:grid-cols-2">
            <label className="block">
              <span className="label-text">{t('assessment.interview.orExactBmi', 'Or enter BMI directly')}</span>
              <input
                className="input-base"
                type="number"
                min={10}
                max={80}
                step="0.1"
                placeholder="e.g. 26.5"
                value={form.bmi || ''}
                onChange={(e) => onSetCustom('bmi_group', 'bmi', e.target.value)}
              />
            </label>

            <label className="block">
              <span className="label-text">{t('assessment.interview.waistOptional', 'Waist in cm (optional)')}</span>
              <input
                className="input-base"
                type="number"
                min={30}
                max={250}
                step="0.1"
                placeholder="e.g. 95"
                value={form.waist_circumference || ''}
                onChange={(e) => onField('waist_circumference', e.target.value)}
              />
              <span className="mt-1 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                {t('assessment.interview.waistHelperText', 'Waist circumference measures central/abdominal fat — a strong independent risk factor for diabetes.')}
              </span>
            </label>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <QuestionCard node={node} title={title} helper={helper} medicalTerm={medicalTerm}>
        {node.kind === 'labs' ? null : body}
      </QuestionCard>

      {node.kind === 'labs' ? (
        <div className="mt-4">
          <LabsSection
            form={form} qcm={qcm} t={t}
            labOptions={labOptions} renderBadge={renderBadge}
            extraLabs={extraLabs} onAddExtraLab={onAddExtraLab} onRemoveExtraLab={onRemoveExtraLab}
            onField={onField} onPickSegment={onPickSegment} onSetCustom={onSetCustom}
          />
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-end gap-2 pb-2">
        {/* Back — step back to the card the user saw just before this one,
            retracing the visit path one question at a time. */}
        {onBack && canBack ? (
          <button type="button" className="btn-secondary mr-auto gap-1.5" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            {t('common.back', 'Back')}
          </button>
        ) : null}
        {node.skippable ? (
          <button type="button" className="btn-secondary gap-1.5" onClick={onSkip}>
            {t('assessment.interview.skip', 'Skip')}
          </button>
        ) : null}
        {node.kind !== 'patient' && node.kind !== 'subject' && node.kind !== 'yesno' && node.kind !== 'choice' ? (
          <button type="button" className="btn-primary gap-1.5" disabled={!continueEnabled || analyzing} onClick={onContinue}>
            {analyzing ? t('assessment.status.analyzing', 'Analyzing...') : continueLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function LabsSection({ form, qcm, t, labOptions, renderBadge, extraLabs, onAddExtraLab, onRemoveExtraLab, onField, onPickSegment, onSetCustom }) {
  return (
    <div className="space-y-4">
      <div className="q-section">
        <div className="q-section-title"><TestTube2 className="h-5 w-5 text-slate-500" /> {t('assessment.labs.fastingTitle', 'Fasting Blood Glucose')}</div>
        <p className="q-section-sub">{t('assessment.labs.fastingHelper', 'mg/dL — after 8+ hours of fasting')}</p>
        <div className="mt-3">
          <SegmentButtons options={labOptions.fasting} value={qcm.fasting_group} onChange={(opt) => onPickSegment('fasting_group', opt, 'fasting_glucose')} />
          <label className="mt-3 block">
            <span className="label-text">{t('assessment.exactValueMgDl', 'Exact value (mg/dL)')} {renderBadge(form.fasting_glucose, { critical: 200, diabetes: 126, prediabetes: 100 })}</span>
            <input className="input-base" type="number" placeholder="e.g. 115" value={form.fasting_glucose} onChange={(e) => onSetCustom('fasting_group', 'fasting_glucose', e.target.value)} />
          </label>
        </div>
      </div>

      <div className="q-section">
        <div className="q-section-title"><Activity className="h-5 w-5 text-slate-500" /> {t('assessment.labs.hba1cTitle', 'HbA1c (Glycated Hemoglobin)')}</div>
        <p className="q-section-sub">{t('assessment.labs.hba1cHelper', 'Percentage — reflects 2–3 month average blood sugar')}</p>
        <div className="mt-3">
          <SegmentButtons options={labOptions.hba1c} value={qcm.hba1c_group} onChange={(opt) => onPickSegment('hba1c_group', opt, 'hba1c')} />
          <label className="mt-3 block">
            <span className="label-text">{t('assessment.exactValuePercent', 'Exact value (%)')} {renderBadge(form.hba1c, { critical: 10, diabetes: 6.5, prediabetes: 5.7 })}</span>
            <input className="input-base" type="number" step="0.1" placeholder="e.g. 6.1" value={form.hba1c} onChange={(e) => onSetCustom('hba1c_group', 'hba1c', e.target.value)} />
          </label>
        </div>
      </div>

      <div className="q-section">
        <div className="q-section-title"><TestTube2 className="h-5 w-5 text-slate-500" /> {t('assessment.labs.ogttTitle', '2-Hour OGTT (optional)')}</div>
        <div className="mt-3">
          <SegmentButtons options={labOptions.ogtt} value={qcm.ogtt_group} onChange={(opt) => onPickSegment('ogtt_group', opt, 'ogtt_2h')} />
          <label className="mt-3 block">
            <span className="label-text">{t('assessment.exactValueMgDl', 'Exact value (mg/dL)')}</span>
            <input className="input-base" type="number" placeholder="e.g. 165" value={form.ogtt_2h} onChange={(e) => onSetCustom('ogtt_group', 'ogtt_2h', e.target.value)} />
          </label>
        </div>
      </div>

      <div className="q-section">
        <div className="q-section-title"><Plus className="h-5 w-5 text-slate-500" /> {t('assessment.additionalLabTests', 'Additional lab tests (optional)')}</div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
          <input className="input-base" placeholder={t('assessment.testName', 'Test name')} value={form.extra_lab_name} onChange={(e) => onField('extra_lab_name', e.target.value)} />
          <input className="input-base" placeholder={t('assessment.value', 'Value')} type="number" step="0.01" value={form.extra_lab_value} onChange={(e) => onField('extra_lab_value', e.target.value)} />
          <button type="button" className="btn-secondary gap-1.5" onClick={onAddExtraLab}><Plus className="h-4 w-4" /> {t('assessment.add', 'Add')}</button>
        </div>
        {extraLabs.length ? (
          <ul className="mt-3 space-y-2">
            {extraLabs.map((lab, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                <span>{lab.test_name}: <strong>{lab.test_value}</strong></span>
                <button type="button" className="btn-secondary gap-1 px-2.5 py-1.5 text-xs" onClick={() => onRemoveExtraLab(i)}><Trash2 className="h-3.5 w-3.5" /> {t('assessment.remove', 'Remove')}</button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}

