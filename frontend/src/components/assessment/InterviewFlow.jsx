import { useEffect, useRef, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, Armchair, Baby, Bandage, BatteryLow, Bug, Building2, CalendarHeart,
  Calculator, Check, Cigarette, ClipboardList, Contrast, Droplet, Droplets, Egg, Eye, Flame, FlaskConical, Flower2,
  GlassWater, Globe, Hand, HeartCrack, HeartPulse, Info, PenTool, Plus, RefreshCw, Scale, ShieldAlert, Soup,
  Sparkles, Stethoscope, TestTube2, Timer, TrendingDown, Trash2, UserRound, Users, Vibrate, Waves, Weight, X,
} from 'lucide-react'
import { AppSelect, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  FIELD_FALLBACKS, camelField, fieldLabelKey, getFactLabel, nodeFields,
  getNodeQuestion, getNodeHelper, getNodeMedicalTerm,
} from './interview-flow'
import { getNodeSymptomMedia, getFieldSymptomMedia } from './symptom-media'

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

function BmiQuestionCard({
  isSplitLayout = false,
  questionNumber = 2,
  theme,
  form,
  qcm,
  isOther = false,
  sex = null,
  onField,
  onPickSegment,
  onSetCustom,
  onCalculateBmi,
  onContinue,
  onBack,
  canBack,
  onSkip,
  continueEnabled,
  analyzing,
  continueLabel,
  onPreviewImage,
  t,
}) {
  const isFemale = sex === 'female' || form?.sex === 'female'
  const isMale = sex === 'male' || form?.sex === 'male'

  const bmiTitle = isOther
    ? (isFemale ? t('assessment.interview.herBmiTitle', "What's her BMI?") : isMale ? t('assessment.interview.hisBmiTitle', "What's his BMI?") : t('assessment.interview.theirBmiTitle', "What's their BMI?"))
    : t('assessment.interview.bodyTitle', "What's your BMI?")

  const bmiSubPrompt = isOther
    ? (isFemale ? t('assessment.interview.herBmiIs', 'Her BMI is...') : isMale ? t('assessment.interview.hisBmiIs', 'His BMI is...') : t('assessment.interview.theirBmiIs', 'Their BMI is...'))
    : t('assessment.interview.myBmiIs', 'My BMI is...')

  const calcSubtitle = isOther
    ? (isFemale ? t('assessment.interview.herBmiTitle', "What's her BMI?") : isMale ? t('assessment.interview.hisBmiTitle', "What's his BMI?") : t('assessment.interview.theirBmiTitle', "What's their BMI?"))
    : t('assessment.interview.whatsMyBmi', "What's my BMI?")

  const weightPlaceholder = isOther
    ? (isFemale ? t('assessment.interview.herWeight', 'Her weight') : isMale ? t('assessment.interview.hisWeight', 'His weight') : t('assessment.interview.weight', 'Weight'))
    : t('assessment.interview.myWeight', 'My weight')

  const heightPlaceholder = isOther
    ? (isFemale ? t('assessment.interview.herHeight', 'Her height') : isMale ? t('assessment.interview.hisHeight', 'His height') : t('assessment.interview.height', 'Height'))
    : t('assessment.interview.myHeight', 'My height')

  const [unit, setUnit] = useState('metric') // 'metric' | 'imperial'
  const [weightLbs, setWeightLbs] = useState(() => (form.weight_kg ? String(Math.round(Number(form.weight_kg) * 2.20462)) : ''))
  const [heightFt, setHeightFt] = useState(() => {
    if (!form.height_cm) return ''
    const totIn = Number(form.height_cm) / 2.54
    return String(Math.floor(totIn / 12))
  })
  const [heightIn, setHeightIn] = useState(() => {
    if (!form.height_cm) return ''
    const totIn = Number(form.height_cm) / 2.54
    return String(Math.round(totIn % 12))
  })
  const [showWaist, setShowWaist] = useState(Boolean(form.waist_circumference))

  const numericBmi = Number(form.bmi)
  const currentBmiStatus = getBmiStatus(form.bmi)

  // Validation checks: strict physiological bounds to prevent dump input
  const numMetricWeight = Number(form.weight_kg)
  const isMetricWeightInvalid = Boolean(String(form.weight_kg || '').trim()) && (Number.isNaN(numMetricWeight) || numMetricWeight < 10 || numMetricWeight > 350)

  const numMetricHeight = Number(form.height_cm)
  const isMetricHeightInvalid = Boolean(String(form.height_cm || '').trim()) && (Number.isNaN(numMetricHeight) || numMetricHeight < 50 || numMetricHeight > 250)

  const numImperialWeight = Number(weightLbs)
  const isImperialWeightInvalid = Boolean(String(weightLbs || '').trim()) && (Number.isNaN(numImperialWeight) || numImperialWeight < 22 || numImperialWeight > 770)

  const imperialTotIn = (Number(heightFt || 0) * 12) + Number(heightIn || 0)
  const hasImperialHeight = Boolean(String(heightFt || '').trim()) || Boolean(String(heightIn || '').trim())
  const isImperialHeightInvalid = hasImperialHeight && (imperialTotIn < 20 || imperialTotIn > 98 || Number(heightFt) < 1 || Number(heightFt) > 8 || Number(heightIn) < 0 || Number(heightIn) > 11)

  const isWeightError = unit === 'metric' ? isMetricWeightInvalid : isImperialWeightInvalid
  const isHeightError = unit === 'metric' ? isMetricHeightInvalid : isImperialHeightInvalid
  const hasBmiInputError = isWeightError || isHeightError

  const bmiOptions = [
    {
      id: 'lower_25',
      label: t('assessment.interview.lowerThan25', 'Lower than 25'),
      sub: 'Normal or lower weight (< 25, or < 23 Asian cutoff)',
      match: (v) => v > 0 && v < 25,
      value: 22.0,
      group: 'normal',
    },
    {
      id: 'between_25_30',
      label: t('assessment.interview.between25and30', 'Between 25 – 30'),
      sub: 'Overweight (25 – 30, or 23 – 27.5 Asian cutoff)',
      match: (v) => v >= 25 && v <= 30,
      value: 27.0,
      group: 'Overweight',
    },
    {
      id: 'higher_30',
      label: t('assessment.interview.higherThan30', 'Higher than 30'),
      sub: 'Obesity (≥ 30, or ≥ 27.5 Asian cutoff)',
      match: (v) => v > 30,
      value: 32.0,
      group: 'obese',
    },
  ]

  const handlePickTier = (opt) => {
    onPickSegment('bmi_group', { id: opt.group, label: opt.label }, 'bmi')
    onField('bmi', String(opt.value))
  }

  const handleMetricWeight = (val) => {
    onField('weight_kg', val)
    const w = Number(val)
    const h = Number(form.height_cm)
    if (val && form.height_cm && !Number.isNaN(w) && w >= 10 && w <= 350 && !Number.isNaN(h) && h >= 50 && h <= 250) {
      onCalculateBmi(val, form.height_cm)
    } else {
      onCalculateBmi('', '')
    }
  }

  const handleMetricHeight = (val) => {
    onField('height_cm', val)
    const w = Number(form.weight_kg)
    const h = Number(val)
    if (form.weight_kg && val && !Number.isNaN(w) && w >= 10 && w <= 350 && !Number.isNaN(h) && h >= 50 && h <= 250) {
      onCalculateBmi(form.weight_kg, val)
    } else {
      onCalculateBmi('', '')
    }
  }

  const handleImperialWeight = (val) => {
    setWeightLbs(val)
    const numLbs = Number(val)
    if (!val || Number.isNaN(numLbs) || numLbs < 22 || numLbs > 770) {
      onField('weight_kg', '')
      onCalculateBmi('', '')
      return
    }
    const kg = (numLbs * 0.453592).toFixed(1)
    onField('weight_kg', kg)
    const totIn = (Number(heightFt || 0) * 12) + Number(heightIn || 0)
    if (totIn >= 20 && totIn <= 98) {
      const cm = (totIn * 2.54).toFixed(1)
      onCalculateBmi(kg, cm)
    } else {
      onCalculateBmi('', '')
    }
  }

  const handleImperialHeightFt = (ft) => {
    setHeightFt(ft)
    const totIn = (Number(ft || 0) * 12) + Number(heightIn || 0)
    if (!totIn || totIn < 20 || totIn > 98 || Number(ft) < 1 || Number(ft) > 8) {
      onField('height_cm', '')
      onCalculateBmi('', '')
      return
    }
    const cm = (totIn * 2.54).toFixed(1)
    onField('height_cm', cm)
    const w = Number(form.weight_kg)
    if (w >= 10 && w <= 350) {
      onCalculateBmi(form.weight_kg, cm)
    } else {
      onCalculateBmi('', '')
    }
  }

  const handleImperialHeightIn = (inch) => {
    setHeightIn(inch)
    const totIn = (Number(heightFt || 0) * 12) + Number(inch || 0)
    if (!totIn || totIn < 20 || totIn > 98 || Number(inch) < 0 || Number(inch) > 11) {
      onField('height_cm', '')
      onCalculateBmi('', '')
      return
    }
    const cm = (totIn * 2.54).toFixed(1)
    onField('height_cm', cm)
    const w = Number(form.weight_kg)
    if (w >= 10 && w <= 350) {
      onCalculateBmi(form.weight_kg, cm)
    } else {
      onCalculateBmi('', '')
    }
  }

  const isContinueReady = !hasBmiInputError && (((numericBmi >= 10 && numericBmi <= 80)) || Boolean(qcm?.bmi_group))

  return (
    <div className="assessment-card-enter w-full flex-1 flex flex-col justify-center min-h-0 h-full relative overflow-hidden">
      {/* Content Container */}
      <section className="w-full lg:w-[64%] xl:w-[60%] flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-6 relative z-20 text-white min-h-[460px] lg:min-h-[520px]">
        <div className="flex items-start gap-5">
          {/* Circular Step Badge */}
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl sm:text-3xl font-bold text-white">
            {questionNumber || 2}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
              {bmiTitle}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed max-w-lg">
              {t(
                'assessment.interview.whatIsBmiDesc',
                'The body-mass index is used to assess whether a person is normal weight or not. The index is calculated by dividing body weight (kg) by the square of body height (m).'
              )}
            </p>

            {/* Answers & Calculator Card Row */}
            <div className="mt-6 sm:mt-8 flex flex-col md:flex-row items-center gap-8 lg:gap-12 relative z-30">
              {/* Left: Section prompt & Radio choices */}
              <div className="w-full md:w-[220px] lg:w-[240px] shrink-0">
                <h2 className="mb-4 text-xl sm:text-2xl font-semibold text-white">
                  {bmiSubPrompt}
                </h2>

                <div className="space-y-4 pt-1">
                  {bmiOptions.map((opt) => {
                    const isSelected = (numericBmi >= 10 && opt.match(numericBmi)) || qcm?.bmi_group === opt.group
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handlePickTier(opt)}
                        className="flex items-center gap-4 group cursor-pointer select-none text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div
                          className={cn(
                            'h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0 flex items-center justify-center transition-all duration-200',
                            isSelected
                              ? 'bg-white border-2 border-white shadow-md'
                              : 'bg-white/20 border-2 border-white/50 group-hover:bg-white/30 group-hover:border-white'
                          )}
                        >
                          {isSelected ? (
                            <Check
                              className="h-5 w-5 sm:h-5.5 sm:w-5.5"
                              strokeWidth={3}
                              style={{ color: theme?.buttonText || '#1d4ed8' }}
                            />
                          ) : null}
                        </div>
                        <span
                          className={cn(
                            'text-lg sm:text-xl transition-colors',
                            isSelected ? 'font-bold text-white' : 'font-medium text-white/90 group-hover:text-white'
                          )}
                        >
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right: Compact BMI Calculator Card inside the Answer Row */}
              <div className="w-full max-w-[215px] sm:max-w-[225px] shrink-0 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/50 dark:border-slate-800 transition-all duration-300 self-center">
                <div className="p-3 sm:p-3.5 pb-2 text-center">
                  {/* Subtitle */}
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {calcSubtitle}
                  </p>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-black text-[#1b365d] dark:text-white mt-0.5 tracking-tight">
                    {t('assessment.interview.bmiCalculatorTitle', 'BMI Calculator')}
                  </h3>

                  {/* Unit Toggle */}
                  <div className="mt-2 mx-auto flex w-fit rounded-full bg-slate-100 dark:bg-slate-800 p-0.5">
                    <button
                      type="button"
                      onClick={() => setUnit('imperial')}
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer',
                        unit === 'imperial'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      {t('assessment.interview.imperial', 'Imperial')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit('metric')}
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer',
                        unit === 'metric'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      {t('assessment.interview.metric', 'Metric')}
                    </button>
                  </div>

                  {/* Inputs */}
                  <div className="mt-2 space-y-1.5 text-left">
                    {unit === 'metric' ? (
                      <>
                        {/* Weight */}
                        <div className={cn(
                          "flex items-center rounded-lg px-2.5 py-1.5 transition-all",
                          isWeightError
                            ? "border border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 dark:border-rose-500 text-rose-900 dark:text-rose-200 ring-1 ring-rose-400/40"
                            : "bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20"
                        )}>
                          <input
                            type="number"
                            min={10}
                            max={350}
                            step="0.1"
                            placeholder={weightPlaceholder}
                            value={form.weight_kg || ''}
                            onChange={(e) => handleMetricWeight(e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white placeholder:text-xs placeholder:text-slate-400 focus:outline-none"
                          />
                          <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-1.5" />
                          <span className={cn("text-[11px] font-bold whitespace-nowrap", isWeightError ? "text-rose-600 dark:text-rose-400" : "text-[#1b365d] dark:text-blue-400")}>kg</span>
                        </div>

                        {/* Height */}
                        <div className={cn(
                          "flex items-center rounded-lg px-2.5 py-1.5 transition-all",
                          isHeightError
                            ? "border border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 dark:border-rose-500 text-rose-900 dark:text-rose-200 ring-1 ring-rose-400/40"
                            : "bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20"
                        )}>
                          <input
                            type="number"
                            min={50}
                            max={250}
                            step="0.1"
                            placeholder={heightPlaceholder}
                            value={form.height_cm || ''}
                            onChange={(e) => handleMetricHeight(e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white placeholder:text-xs placeholder:text-slate-400 focus:outline-none"
                          />
                          <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-1.5" />
                          <span className={cn("text-[11px] font-bold whitespace-nowrap", isHeightError ? "text-rose-600 dark:text-rose-400" : "text-[#1b365d] dark:text-blue-400")}>cm</span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Weight Imperial */}
                        <div className={cn(
                          "flex items-center rounded-lg px-2.5 py-1.5 transition-all",
                          isWeightError
                            ? "border border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 dark:border-rose-500 text-rose-900 dark:text-rose-200 ring-1 ring-rose-400/40"
                            : "bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20"
                        )}>
                          <input
                            type="number"
                            min={22}
                            max={770}
                            step="0.5"
                            placeholder={weightPlaceholder}
                            value={weightLbs}
                            onChange={(e) => handleImperialWeight(e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white placeholder:text-xs placeholder:text-slate-400 focus:outline-none"
                          />
                          <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-1.5" />
                          <span className={cn("text-[11px] font-bold whitespace-nowrap", isWeightError ? "text-rose-600 dark:text-rose-400" : "text-[#1b365d] dark:text-blue-400")}>lbs</span>
                        </div>

                        {/* Height Imperial */}
                        <div className={cn(
                          "flex items-center rounded-lg px-2 py-1 transition-all",
                          isHeightError
                            ? "border border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 dark:border-rose-500 text-rose-900 dark:text-rose-200 ring-1 ring-rose-400/40"
                            : "bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20"
                        )}>
                          <input
                            type="number"
                            min={1}
                            max={8}
                            placeholder="ft"
                            value={heightFt}
                            onChange={(e) => handleImperialHeightFt(e.target.value)}
                            className="w-8 bg-transparent text-center text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                          />
                          <span className="text-[10px] font-bold text-[#1b365d] dark:text-blue-400 mr-1">ft</span>
                          <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mr-1" />
                          <input
                            type="number"
                            min={0}
                            max={11}
                            placeholder="in"
                            value={heightIn}
                            onChange={(e) => handleImperialHeightIn(e.target.value)}
                            className="w-8 bg-transparent text-center text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                          />
                          <span className="text-[10px] font-bold text-[#1b365d] dark:text-blue-400">in</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Footer Banner */}
                <div className={cn(
                  "border-t px-2.5 py-1.5 transition-colors",
                  hasBmiInputError
                    ? "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                    : "bg-slate-100/90 dark:bg-slate-800/90 border-slate-200/70 dark:border-slate-700/70"
                )}>
                  {hasBmiInputError ? (
                    <div className="text-center py-0.5">
                      <p className="text-[10px] font-bold leading-tight flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400">
                        <span className="text-xs">⚠️</span>
                        {isWeightError && isHeightError
                          ? t('assessment.validation.enterRealisticValues', 'Please enter realistic height & weight values')
                          : isWeightError
                            ? t('assessment.validation.weightRangeShort', 'Weight: 10–350 kg (22–770 lbs)')
                            : t('assessment.validation.heightRangeShort', "Height: 50–250 cm (1'8\"–8'2\")")}
                      </p>
                    </div>
                  ) : numericBmi >= 10 && numericBmi <= 80 ? (
                    <div className="text-center">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                        {t('assessment.interview.bmiCalculated', 'Calculated BMI')}
                      </p>
                      <p className="text-xs font-bold text-[#1b365d] dark:text-blue-300 mt-0.5">
                        <span className="text-blue-600 dark:text-blue-400 text-sm font-black mr-1">{form.bmi}</span> kg/m²
                      </p>
                    </div>
                  ) : (
                    <p className="text-center text-[10px] font-semibold text-[#1b365d] dark:text-blue-300 leading-tight">
                      {t('assessment.interview.enterHeightWeightToCalc', 'Enter height & weight to calculate BMI')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Buttons: Below choices and calculator card */}
            <div className="mt-10 flex flex-wrap items-center gap-5 relative z-30">
              <button
                type="button"
                onClick={onBack}
                disabled={!canBack}
                className="rounded-full border-2 border-white px-8 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-sm sm:text-base active:scale-[0.98]"
              >
                {t('assessment.interview.previousQuestion', 'Previous')}
              </button>

              {onSkip ? (
                <button
                  type="button"
                  onClick={onSkip}
                  className="rounded-full px-6 py-3 font-semibold text-white/70 hover:text-white transition cursor-pointer text-sm sm:text-base active:scale-[0.98]"
                >
                  {t('assessment.interview.skip', 'Skip')}
                </button>
              ) : null}

              <button
                type="button"
                onClick={onContinue}
                disabled={!isContinueReady || analyzing}
                className="rounded-full bg-white px-10 py-3 font-semibold transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md text-sm sm:text-base active:scale-[0.98]"
                style={{ color: theme?.buttonText || '#12488F' }}
              >
                {continueLabel || t('assessment.interview.nextQuestion', 'Next question')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ⭐ PNG OVERLAY */}
      <img
        src="/images/png/bmiscale.png"
        alt="BMI Scale and Medical Record"
        className="
          hidden lg:block
          absolute
          bottom-0
          right-0
          z-10

          h-full
          w-auto
          max-w-none

          object-contain
          object-right-bottom
          pointer-events-none
          select-none
        "
        style={{ objectPosition: 'right bottom' }}
        onError={(e) => {
          if (!e.currentTarget.src.includes('bmiscale.png')) {
            e.currentTarget.src = '/images/png/bmiscale.png'
          }
        }}
      />
    </div>
  )
}

function WaistQuestionCard({
  isSplitLayout = false,
  questionNumber,
  theme,
  form,
  qcm,
  isOther = false,
  sex = null,
  onField,
  onPickSegment,
  onContinue,
  onBack,
  canBack,
  onSkip,
  continueEnabled,
  analyzing,
  continueLabel,
  onPreviewImage,
  t,
}) {
  const [unit, setUnit] = useState('metric') // 'metric' | 'imperial'
  const [customVal, setCustomVal] = useState(() => {
    if (!form.waist_circumference) return ''
    if (unit === 'imperial') {
      return String(Math.round(Number(form.waist_circumference) / 2.54))
    }
    return String(form.waist_circumference)
  })

  const currentWaistCm = Number(form.waist_circumference) || null
  const selectedGroup = qcm?.waist_group

  const menOptions = [
    {
      id: 'men_low',
      label: unit === 'metric' ? t('assessment.interview.waistMenLow', '< 94cm') : t('assessment.interview.waistMenLowImperial', '< 37 in'),
      desc: 'Normal / low risk',
      cmValue: 88,
      group: 'men_low',
      match: (cm) => cm > 0 && cm < 94,
    },
    {
      id: 'men_mid',
      label: unit === 'metric' ? t('assessment.interview.waistMenMid', '94 - 102cm') : t('assessment.interview.waistMenMidImperial', '37 - 40 in'),
      desc: 'Increased metabolic risk',
      cmValue: 98,
      group: 'men_mid',
      match: (cm) => cm >= 94 && cm <= 102,
    },
    {
      id: 'men_high',
      label: unit === 'metric' ? t('assessment.interview.waistMenHigh', '> 102cm') : t('assessment.interview.waistMenHighImperial', '> 40 in'),
      desc: 'Substantially increased risk',
      cmValue: 106,
      group: 'men_high',
      match: (cm) => cm > 102,
    },
  ]

  const womenOptions = [
    {
      id: 'women_low',
      label: unit === 'metric' ? t('assessment.interview.waistWomenLow', '< 80cm') : t('assessment.interview.waistWomenLowImperial', '< 31.5 in'),
      desc: 'Normal / low risk',
      cmValue: 75,
      group: 'women_low',
      match: (cm) => cm > 0 && cm < 80,
    },
    {
      id: 'women_mid',
      label: unit === 'metric' ? t('assessment.interview.waistWomenMid', '80 - 88cm') : t('assessment.interview.waistWomenMidImperial', '31.5 - 35 in'),
      desc: 'Increased metabolic risk',
      cmValue: 84,
      group: 'women_mid',
      match: (cm) => cm >= 80 && cm <= 88,
    },
    {
      id: 'women_high',
      label: unit === 'metric' ? t('assessment.interview.waistWomenHigh', '> 88cm') : t('assessment.interview.waistWomenHighImperial', '> 35 in'),
      desc: 'Substantially increased risk',
      cmValue: 92,
      group: 'women_high',
      match: (cm) => cm > 88,
    },
  ]

  const handleSelectOption = (opt) => {
    onPickSegment('waist_group', { id: opt.group, label: opt.label }, 'waist_circumference')
    onField('waist_circumference', String(opt.cmValue))
    if (unit === 'imperial') {
      setCustomVal(String(Math.round(opt.cmValue / 2.54)))
    } else {
      setCustomVal(String(opt.cmValue))
    }
  }

  const handleCustomChange = (raw) => {
    setCustomVal(raw)
    const num = Number(raw)
    if (!raw.trim() || Number.isNaN(num) || num <= 0) {
      onField('waist_circumference', '')
      return
    }
    const isOut = unit === 'metric' ? (num < 40 || num > 220) : (num < 16 || num > 86)
    if (isOut) {
      onField('waist_circumference', '')
      return
    }
    const cm = unit === 'imperial' ? (num * 2.54).toFixed(1) : String(num)
    onField('waist_circumference', cm)

    const list = form.sex === 'female' ? womenOptions : menOptions
    const matched = list.find((o) => o.match(Number(cm)))
    if (matched) {
      onPickSegment('waist_group', { id: matched.group, label: matched.label }, 'waist_circumference')
    }
  }

  const numCustom = Number(customVal)
  const isWaistError = Boolean(String(customVal || '').trim()) && (
    Number.isNaN(numCustom) ||
    (unit === 'metric' ? (numCustom < 40 || numCustom > 220) : (numCustom < 16 || numCustom > 86))
  )

  const isContinueReady = !isWaistError && (Boolean(form.waist_circumference) || Boolean(qcm?.waist_group))
  const isFemale = form.sex === 'female'
  const currentOptions = isFemale ? womenOptions : menOptions
  const categoryTitle = isFemale ? t('assessment.interview.women', 'Women') : t('assessment.interview.men', 'Men')

  const waistTitle = isOther
    ? (form?.sex === 'female' || sex === 'female'
        ? t('assessment.interview.herWaistTitle', "What's her waist circumference?")
        : form?.sex === 'male' || sex === 'male'
          ? t('assessment.interview.hisWaistTitle', "What's his waist circumference?")
          : t('assessment.interview.theirWaistTitle', "What's their waist circumference?"))
    : t('assessment.interview.waistQuestionTitle', "What's your waist circumference?")

  return (
    <div className="assessment-card-enter w-full flex-1 flex flex-col justify-center min-h-0 h-full">
      {/* Left Content */}
      <section className="w-full lg:w-[58%] flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-6 relative z-20 text-white">
        <div className="flex items-start gap-5">
          {/* Question Number */}
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl sm:text-3xl font-bold text-white">
            {questionNumber || 3}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
              {waistTitle}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-white/80">
              {t('assessment.interview.waistQuestionHelper', 'Measured below the ribs, usually at the level of the navel')}
            </p>

        {/* Unit Toggle */}
        <div className="mb-8 flex w-fit rounded-full bg-white/20 p-1">
          <button
            id="imperial"
            type="button"
            onClick={() => {
              setUnit('imperial')
              if (form.waist_circumference) {
                setCustomVal(String(Math.round(Number(form.waist_circumference) / 2.54)))
              }
            }}
            className={cn(
              'rounded-full px-6 py-2 text-sm sm:text-base font-semibold transition-all cursor-pointer',
              unit === 'imperial' ? (theme?.toggleActive ? `${theme.toggleActive} shadow-xs` : 'bg-blue-500 text-white shadow-xs') : 'text-white/70 hover:text-white'
            )}
          >
            {t('assessment.interview.imperial', 'Imperial')}
          </button>

          <button
            id="metric"
            type="button"
            onClick={() => {
              setUnit('metric')
              if (form.waist_circumference) {
                setCustomVal(String(form.waist_circumference))
              }
            }}
            className={cn(
              'rounded-full px-6 py-2 text-sm sm:text-base font-semibold transition-all cursor-pointer',
              unit === 'metric' ? (theme?.toggleActive ? `${theme.toggleActive} shadow-xs` : 'bg-blue-500 text-white shadow-xs') : 'text-white/70 hover:text-white'
            )}
          >
            {t('assessment.interview.metric', 'Metric')}
          </button>
        </div>

        {/* Options: show only the relevant sex options */}
        <div className="max-w-md text-white">
          <h2 className="mb-5 text-2xl font-semibold">
            {categoryTitle}
          </h2>

          <div className="space-y-4 pt-1">
            {currentOptions.map((opt) => {
              const isSelected = selectedGroup === opt.group || (currentWaistCm && opt.match(currentWaistCm))
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className="flex items-center gap-4 group cursor-pointer select-none text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div
                    className={cn(
                      'h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0 flex items-center justify-center transition-all duration-200',
                      isSelected
                        ? 'bg-white border-2 border-white shadow-md'
                        : 'bg-white/20 border-2 border-white/50 group-hover:bg-white/30 group-hover:border-white'
                    )}
                  >
                    {isSelected ? (
                      <Check
                        className="h-5 w-5 sm:h-5.5 sm:w-5.5"
                        strokeWidth={3}
                        style={{ color: theme?.buttonText || '#1d4ed8' }}
                      />
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      'text-lg sm:text-xl transition-colors',
                      isSelected ? 'font-bold text-white' : 'font-medium text-white/90 group-hover:text-white'
                    )}
                  >
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Optional Direct Entry */}
        <div className="mt-8 flex flex-col items-start gap-1.5">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70">
              {t('assessment.interview.orEnterExactWaist', 'Or enter exact waist')}:
            </span>
            <div className={cn(
              "flex items-center rounded-full px-4 py-1.5 border transition-all",
              isWaistError
                ? "bg-rose-500/20 border-rose-400 text-rose-100 ring-2 ring-rose-400/40"
                : "bg-white/15 border-white/30 focus-within:border-white"
            )}>
              <input
                type="number"
                min={unit === 'metric' ? 40 : 16}
                max={unit === 'metric' ? 220 : 86}
                step="0.5"
                placeholder={unit === 'metric' ? 'e.g. 92' : 'e.g. 36'}
                value={customVal}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="w-20 bg-transparent text-sm font-semibold text-white placeholder:text-white/40 focus:outline-none"
              />
              <span className="text-xs font-bold text-white/80 ml-1.5">
                {unit === 'metric' ? 'cm' : 'in'}
              </span>
            </div>
          </div>
          {isWaistError && (
            <p className="text-xs font-semibold text-rose-300 flex items-center gap-1 pl-1 animate-fadeIn">
              <span>⚠️</span>
              {t('assessment.validation.waistRange', 'Waist must be between 40 and 220 cm (16–86 in).')}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-wrap items-center gap-5 relative z-30">
          <button
            type="button"
            onClick={onBack}
            disabled={!canBack}
            className="rounded-full border-2 border-white px-8 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {t('assessment.interview.previousQuestion', 'Previous')}
          </button>

          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-full px-6 py-3 font-semibold text-white/70 hover:text-white transition cursor-pointer"
            >
              {t('assessment.interview.skip', 'Skip')}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onContinue}
            disabled={!isContinueReady || analyzing}
            className="rounded-full bg-white px-10 py-3 font-semibold transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
            style={{ color: theme?.buttonText || '#12488F' }}
          >
            {continueLabel || t('assessment.interview.nextQuestion', 'Next question')}
          </button>
        </div>
          </div>
        </div>
      </section>

      {/* ⭐ PNG OVERLAY */}
      <img
        src={
          form?.sex === 'female'
            ? '/images/png/waist-measurement-female.png'
            : form?.sex === 'male'
              ? '/images/png/waist-measurement-male.png'
              : '/images/png/waist-measurement.png'
        }
        alt="Person measuring waist"
        className="
          hidden lg:block
          absolute
          bottom-0
          right-0
          z-10

          h-full
          w-auto
          max-w-none

          object-contain
          object-right-bottom
          pointer-events-none
          select-none
        "
        style={{ objectPosition: 'right bottom' }}
        onError={(e) => {
          if (!e.currentTarget.src.includes('waist-measurement.png')) {
            e.currentTarget.src = '/images/png/waist-measurement.png'
          }
        }}
      />
    </div>
  )
}

function QuestionCard({
  node,
  questionNumber,
  title,
  helper,
  medicalTerm,
  symptomMedia,
  onPreviewImage,
  actions,
  t,
  children,
}) {
  const Icon = NODE_ICONS[node?.icon] || ClipboardList
  const displayMedia = symptomMedia

  return (
    <div className="assessment-card-enter w-full flex-1 flex flex-col justify-center min-h-0 h-full">
      {/* Left Content */}
      <section className="w-full lg:w-[58%] flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-6 relative z-20 text-white min-h-[460px] lg:min-h-[520px]">
        <div className="flex items-start gap-5">
          {/* Question Number Badge */}
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl sm:text-3xl font-bold text-white">
            {questionNumber || 1}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
              {title}
            </h1>

            {helper ? (
              <p className="mt-4 text-base sm:text-lg text-white/80 max-w-xl">
                {helper}
              </p>
            ) : null}

            {/* Mobile Image Banner */}
            {displayMedia ? (
              <div className="lg:hidden w-full h-48 sm:h-56 my-5 rounded-2xl overflow-hidden flex items-center justify-center bg-white/10 p-2">
                <img
                  src={displayMedia.image}
                  alt={displayMedia.name || title}
                  className="h-full w-auto max-w-full object-contain"
                />
              </div>
            ) : null}

            <div className="mt-8">{children}</div>

            {/* Buttons */}
            {actions ? (
              <div className="mt-10 relative z-30">
                {actions}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ⭐ PNG OVERLAY */}
      {displayMedia ? (
        <img
          src={displayMedia.image}
          alt={displayMedia.name || title}
          className="
            hidden lg:block
            absolute
            bottom-0
            right-0
            z-10

            h-full
            w-auto
            max-w-none

            object-contain
            object-right-bottom
            pointer-events-none
            select-none
          "
          style={{ objectPosition: 'right bottom' }}
          loading="eager"
          onError={(e) => {
            const current = e.currentTarget.src
            if (displayMedia?.fallbackImage && current !== displayMedia.fallbackImage) {
              e.currentTarget.src = displayMedia.fallbackImage
            }
          }}
        />
      ) : null}
    </div>
  )
}

function YesNoButtons({ value, onPick, noLabel, yesLabel, theme, t }) {
  const options = [
    { v: true, label: yesLabel || t('assessment.interview.answerYes', 'Yes') },
    { v: false, label: noLabel || t('assessment.interview.answerNo', 'No') },
  ]
  return (
    <div className="space-y-4 max-w-md pt-1">
      {options.map((opt) => {
        const isSelected = value === opt.v
        return (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onPick(opt.v)}
            className="flex items-center gap-4 group cursor-pointer select-none text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div
              className={cn(
                'h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0 flex items-center justify-center transition-all duration-200',
                isSelected
                  ? 'bg-white border-2 border-white shadow-md'
                  : 'bg-white/20 border-2 border-white/50 group-hover:bg-white/30 group-hover:border-white'
              )}
            >
              {isSelected ? (
                <Check
                  className="h-5 w-5 sm:h-5.5 sm:w-5.5"
                  strokeWidth={3}
                  style={{ color: theme?.buttonText || '#1d4ed8' }}
                />
              ) : null}
            </div>
            <span
              className={cn(
                'text-lg sm:text-xl transition-colors',
                isSelected ? 'font-bold text-white' : 'font-medium text-white/90 group-hover:text-white'
              )}
            >
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function MultiGrid({ node, form, ctx, t, factsMap, language, onToggle, onNone, onPreviewImage }) {
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
          const media = getFieldSymptomMedia(key, language)

          if (media) {
            return (
              <div
                key={key}
                onClick={() => onToggle(node, key, !active)}
                className={cn(
                  'assessment-card-enter relative flex items-center gap-3.5 rounded-2xl border-2 p-2.5 text-left transition-all duration-200 group cursor-pointer overflow-hidden',
                  active
                    ? 'border-2 border-white bg-white/30 text-white font-bold ring-2 ring-white/50'
                    : 'border border-white/20 bg-white/10 hover:bg-white/20 text-white',
                )}
                role="checkbox"
                aria-checked={active}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    onToggle(node, key, !active)
                  }
                }}
              >
                {/* Visual Thumbnail */}
                <div
                  className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-white/10 border border-white/20"
                  onClick={(e) => {
                    if (onPreviewImage) {
                      e.stopPropagation()
                      onPreviewImage(media)
                    }
                  }}
                  title={t?.('assessment.interview.enlargePhoto', 'Click to enlarge photo')}
                >
                  <img
                    src={media.image}
                    alt={label}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                  <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-sm bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-2.5 w-2.5" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block leading-snug transition-colors text-sm',
                      active ? 'text-white font-bold' : 'text-white/90 font-medium',
                    )}
                  >
                    {label}
                  </span>
                  {media.medicalTerm ? (
                    <span className="mt-0.5 inline-block text-[11px] text-white/70 font-medium">
                      {media.medicalTerm}
                    </span>
                  ) : null}
                </div>

                <span
                  className={cn(
                    'mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all',
                    active
                      ? 'border-white bg-white text-blue-600 shadow-xs'
                      : 'border-white/40 bg-white/10 text-transparent',
                  )}
                >
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                </span>
              </div>
            )
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(node, key, !active)}
              title={fact?.question || undefined}
              className={cn(
                'flex items-center gap-3 rounded-2xl p-3 text-left transition-all duration-200 cursor-pointer',
                active
                  ? 'border-2 border-white bg-white/30 text-white font-bold ring-2 ring-white/50'
                  : 'border border-white/20 bg-white/10 hover:bg-white/20 text-white',
              )}
            >
              <FIcon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  active ? 'text-white' : 'text-white/70',
                )}
                strokeWidth={2}
              />
              <span className="flex-1 min-w-0">
                <span
                  className={cn(
                    'block leading-snug transition-colors text-[0.95rem]',
                    active ? 'font-bold text-white' : 'font-medium text-white/90',
                  )}
                >
                  {label}
                </span>
              </span>
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', active ? 'border-white bg-white text-blue-600' : 'border-white/40')}>
                {active ? <Check className="h-3 w-3 stroke-[3]" /> : null}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onNone(node)}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" /> {t('assessment.interview.noneOfThese', 'None of these')}
        </button>
        <span className="text-xs font-medium text-white/80">
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
    isSplitLayout = false,
    theme,
    questionNumber = 1,
    totalQuestions = 8,
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
  const [previewMedia, setPreviewMedia] = useState(null)
  const symptomMedia = getNodeSymptomMedia(node, language)

  const inputRef = useRef(null)
  useEffect(() => { if (node?.kind === 'number' && inputRef.current) inputRef.current.focus() }, [node?.id])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && previewMedia) {
        setPreviewMedia(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewMedia])

  if (!node) return null

  const isOther = subjectValue === 'other' || Boolean(props.needsPatient)
  const sex = form?.sex
  const subjectCtx = { isOther, sex }

  const title = getNodeQuestion(node, factsMap, language, t, subjectCtx)
  const helper = getNodeHelper(node, factsMap, language, t, subjectCtx)
  const medicalTerm = getNodeMedicalTerm(node, factsMap)
  const continueLabel = editing ? t('assessment.interview.doneEditing', 'Done') : t('common.continue', 'Continue')

  /* ── Special Dedicated Layout for BMI: Ada Health inspired ── */
  if (node.kind === 'body') {
    return (
      <BmiQuestionCard
        isSplitLayout={isSplitLayout}
        questionNumber={questionNumber}
        theme={theme}
        form={form}
        qcm={qcm}
        isOther={isOther}
        sex={sex}
        onField={onField}
        onPickSegment={onPickSegment}
        onSetCustom={onSetCustom}
        onCalculateBmi={onCalculateBmi}
        onContinue={onContinue}
        onBack={onBack}
        canBack={canBack}
        onSkip={onSkip}
        continueEnabled={Number(form.bmi) >= 10 || Boolean(qcm?.bmi_group)}
        analyzing={analyzing}
        continueLabel={continueLabel}
        onPreviewImage={setPreviewMedia}
        t={t}
      />
    )
  }

  /* ── Special Dedicated Layout for Waist: Ada Health Question 3 inspired ── */
  if (node.kind === 'waist') {
    return (
      <WaistQuestionCard
        isSplitLayout={isSplitLayout}
        questionNumber={questionNumber}
        theme={theme}
        form={form}
        qcm={qcm}
        isOther={isOther}
        sex={sex}
        onField={onField}
        onPickSegment={onPickSegment}
        onContinue={onContinue}
        onBack={onBack}
        canBack={canBack}
        onSkip={onSkip}
        continueEnabled={Boolean(form.waist_circumference) || Boolean(qcm?.waist_group)}
        analyzing={analyzing}
        continueLabel={continueLabel}
        onPreviewImage={setPreviewMedia}
        t={t}
      />
    )
  }

  let body = null
  let continueEnabled = true

  if (node.kind === 'patient') {
    body = loadingPatients
      ? <Skeleton className="h-11 w-full rounded-xl" />
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
    /* Patient accounts: "Myself / Someone else" with Ada radio cards */
    body = (
      <div className="space-y-4 max-w-md pt-1">
        {subjectOptions.map((option) => {
          const active = subjectValue === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectSubject(option.id)}
              className="flex items-start gap-4 group cursor-pointer select-none text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div
                className={cn(
                  'h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0 flex items-center justify-center transition-all duration-200 mt-0.5',
                  active
                    ? 'bg-white border-2 border-white shadow-md'
                    : 'bg-white/20 border-2 border-white/50 group-hover:bg-white/30 group-hover:border-white'
                )}
              >
                {active ? (
                  <Check
                    className="h-5 w-5 sm:h-5.5 sm:w-5.5"
                    strokeWidth={3}
                    style={{ color: theme?.buttonText || '#1d4ed8' }}
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <span className={cn('block text-lg sm:text-xl transition-colors', active ? 'font-bold text-white' : 'font-medium text-white/90 group-hover:text-white')}>
                  {t(option.labelKey, option.labelFallback)}
                </span>
                <span className="mt-0.5 block text-sm text-white/70">
                  {t(option.descKey, option.descFallback)}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    )
  } else if (node.kind === 'number') {
    const rawVal = String(form[node.field] || '').trim()
    const numVal = Number(rawVal)
    const isAgeField = node.field === 'age'
    const isAgeError = isAgeField && rawVal !== '' && (Number.isNaN(numVal) || numVal < 1 || numVal > 120)
    continueEnabled = rawVal !== '' && !isAgeError
    body = (
      <div className="space-y-6">
        <div>
          <input
            ref={inputRef}
            className={cn(
              'w-48 text-3xl font-bold rounded-2xl px-5 py-3 outline-none transition-all',
              isAgeError
                ? 'bg-rose-500/20 border-2 border-rose-400 text-rose-100 ring-2 ring-rose-400/30 focus:border-rose-400'
                : 'bg-white/15 border-2 border-white/30 text-white placeholder:text-white/40 focus:border-white'
            )}
            type="number"
            min={1}
            max={120}
            inputMode="numeric"
            placeholder={t('assessment.interview.agePlaceholder', 'e.g. 42')}
            value={form[node.field]}
            onChange={(e) => onSetCustom(node.qcm, node.field, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && continueEnabled) onContinue() }}
          />
          {isAgeError && (
            <p className="mt-3 text-sm font-semibold text-rose-300 flex items-center gap-1.5 animate-fadeIn">
              <span className="text-base">⚠️</span>
              {t('assessment.validation.ageRange', 'Please enter a valid age between 1 and 120.')}
            </p>
          )}
        </div>
        {ageOptions && ageOptions.length > 0 ? (
          <div>
            <span className="block text-sm font-semibold text-white/80 mb-3">
              {t('assessment.interview.orSelectRange', 'Or select age range')}:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg">
              {ageOptions.map((opt) => {
                const active = qcm[node.qcm] === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onPickSegment(node.qcm, opt, node.field)}
                    className={cn(
                      'rounded-full px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer text-center',
                      active
                        ? (theme?.toggleActive ? `${theme.toggleActive} shadow-md` : 'bg-blue-500 text-white shadow-md')
                        : 'bg-white/15 text-white/80 hover:text-white hover:bg-white/25'
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    )
  } else if (node.kind === 'choice') {
    const selectedVal = form[node.field]
    continueEnabled = selectedVal !== null && selectedVal !== undefined && selectedVal !== ''
    body = (
      <div className="space-y-4 max-w-md pt-1">
        {node.options.map((opt) => {
          const isSelected = selectedVal === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChoice(node, opt.value)}
              className="flex items-center gap-4 group cursor-pointer select-none text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div
                className={cn(
                  'h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0 flex items-center justify-center transition-all duration-200',
                  isSelected
                    ? 'bg-white border-2 border-white shadow-md'
                    : 'bg-white/20 border-2 border-white/50 group-hover:bg-white/30 group-hover:border-white'
                )}
              >
                {isSelected ? (
                  <Check
                    className="h-5 w-5 sm:h-5.5 sm:w-5.5"
                    strokeWidth={3}
                    style={{ color: theme?.buttonText || '#1d4ed8' }}
                  />
                ) : null}
              </div>
              <span
                className={cn(
                  'text-lg sm:text-xl transition-colors',
                  isSelected ? 'font-bold text-white' : 'font-medium text-white/90 group-hover:text-white'
                )}
              >
                {t(opt.labelKey, opt.labelFallback)}
              </span>
            </button>
          )
        })}
      </div>
    )
  } else if (node.kind === 'yesno') {
    const rawVal = form[node.field]
    const value = node.field === 'has_labs'
      ? (form.has_labs === 'yes' ? true : form.has_labs === 'no' ? false : null)
      : (typeof rawVal === 'boolean' ? rawVal : (rawVal === 'yes' ? true : rawVal === 'no' ? false : null))
    continueEnabled = value !== null && value !== undefined
    body = (
      <YesNoButtons
        value={value}
        theme={theme}
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
        onPreviewImage={setPreviewMedia}
      />
    )
  } else if (node.kind === 'text') {
    body = (
      <textarea
        className="w-full max-w-lg min-h-[110px] resize-y bg-white/15 border-2 border-white/30 text-white placeholder:text-white/40 focus:border-white rounded-2xl p-4 outline-none"
        value={form[node.field]}
        onChange={(e) => onField(node.field, e.target.value)}
        placeholder={t('assessment.extraPlaceholderText', 'e.g. tingling feet, dry mouth...')}
      />
    )
  }

  if (node.kind === 'labs') {
    const fg = String(form.fasting_glucose || '').trim()
    const hb = String(form.hba1c || '').trim()
    const og = String(form.ogtt_2h || '').trim()
    const isFgInvalid = fg !== '' && (Number.isNaN(Number(fg)) || Number(fg) < 40 || Number(fg) > 600)
    const isHbInvalid = hb !== '' && (Number.isNaN(Number(hb)) || Number(hb) < 3 || Number(hb) > 20)
    const isOgInvalid = og !== '' && (Number.isNaN(Number(og)) || Number(og) < 40 || Number(og) > 800)
    if (isFgInvalid || isHbInvalid || isOgInvalid) {
      continueEnabled = false
    }
  }

  const navActions = (
    <div className="mt-10 flex flex-wrap items-center gap-5">
      {onBack && canBack ? (
        <button
          type="button"
          className="rounded-full border-2 border-white px-8 py-3 text-base sm:text-lg font-semibold text-white transition hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none cursor-pointer active:scale-[0.98]"
          onClick={onBack}
        >
          {t('assessment.interview.previousQuestion', 'Previous')}
        </button>
      ) : null}

      {node.skippable ? (
        <button
          type="button"
          className="rounded-full px-6 py-3 text-base sm:text-lg font-semibold text-white/70 hover:text-white transition cursor-pointer active:scale-[0.98]"
          onClick={onSkip}
        >
          {t('assessment.interview.skip', 'Skip')}
        </button>
      ) : null}

      {node.kind !== 'patient' && node.kind !== 'subject' && node.kind !== 'body' && node.kind !== 'waist' ? (
        <button
          type="button"
          className="rounded-full bg-white px-10 py-3 text-base sm:text-lg font-semibold transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md active:scale-[0.98]"
          style={{ color: theme?.buttonText || '#12488F' }}
          disabled={!continueEnabled || analyzing}
          onClick={onContinue}
        >
          {analyzing ? t('assessment.status.analyzing', 'Analyzing...') : (continueLabel || t('assessment.interview.nextQuestion', 'Next question'))}
        </button>
      ) : null}
    </div>
  )

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 h-full overflow-visible">
      <QuestionCard
        isSplitLayout={isSplitLayout}
        node={node}
        questionNumber={questionNumber}
        title={title}
        helper={helper}
        medicalTerm={medicalTerm}
        symptomMedia={symptomMedia}
        onPreviewImage={setPreviewMedia}
        actions={navActions}
        t={t}
      >
        {node.kind === 'labs' ? (
          <LabsSection
            form={form} qcm={qcm} t={t}
            labOptions={labOptions} renderBadge={renderBadge}
            extraLabs={extraLabs} onAddExtraLab={onAddExtraLab} onRemoveExtraLab={onRemoveExtraLab}
            onField={onField} onPickSegment={onPickSegment} onSetCustom={onSetCustom}
          />
        ) : body}
      </QuestionCard>

      {/* Lightbox / Zoom Modal for Full-Screen Image Viewing */}
      {previewMedia ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="relative max-w-4xl w-full rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-white/20 overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] max-h-[68vh] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={previewMedia.image}
                alt={previewMedia.name}
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                aria-label={t('common.close', 'Close')}
                className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 hover:bg-black/95 text-white backdrop-blur-md transition-all shadow-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{previewMedia.name}</h4>
                {previewMedia.medicalTerm ? (
                  <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-950/60 dark:text-blue-300">
                    {previewMedia.medicalTerm}
                  </span>
                ) : null}
                {previewMedia.badge ? (
                  <span className="rounded-md bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-300">
                    {previewMedia.badge}
                  </span>
                ) : null}
              </div>
              {previewMedia.caption ? (
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {previewMedia.caption}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LabsSection({ form, qcm, t, labOptions, renderBadge, extraLabs, onAddExtraLab, onRemoveExtraLab, onField, onPickSegment, onSetCustom }) {
  const fg = String(form.fasting_glucose || '').trim()
  const hb = String(form.hba1c || '').trim()
  const og = String(form.ogtt_2h || '').trim()
  const isFgInvalid = fg !== '' && (Number.isNaN(Number(fg)) || Number(fg) < 40 || Number(fg) > 600)
  const isHbInvalid = hb !== '' && (Number.isNaN(Number(hb)) || Number(hb) < 3 || Number(hb) > 20)
  const isOgInvalid = og !== '' && (Number.isNaN(Number(og)) || Number(og) < 40 || Number(og) > 800)

  return (
    <div className="space-y-4">
      <div className="q-section">
        <div className="q-section-title"><TestTube2 className="h-5 w-5 text-slate-500" /> {t('assessment.labs.fastingTitle', 'Fasting Blood Glucose')}</div>
        <p className="q-section-sub">{t('assessment.labs.fastingHelper', 'mg/dL — after 8+ hours of fasting')}</p>
        <div className="mt-3">
          <SegmentButtons options={labOptions.fasting} value={qcm.fasting_group} onChange={(opt) => onPickSegment('fasting_group', opt, 'fasting_glucose')} />
          <label className="mt-3 block">
            <span className="label-text">{t('assessment.exactValueMgDl', 'Exact value (mg/dL)')} {renderBadge(form.fasting_glucose, { critical: 200, diabetes: 126, prediabetes: 100 })}</span>
            <input
              className={cn("input-base", isFgInvalid && "border-rose-400 bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-400")}
              type="number"
              min={40}
              max={600}
              placeholder="e.g. 115"
              value={form.fasting_glucose}
              onChange={(e) => onSetCustom('fasting_group', 'fasting_glucose', e.target.value)}
            />
            {isFgInvalid && (
              <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                <span>⚠️</span> {t('assessment.validation.fastingRange', 'Fasting glucose must be 40–600 mg/dL.')}
              </p>
            )}
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
            <input
              className={cn("input-base", isHbInvalid && "border-rose-400 bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-400")}
              type="number"
              step="0.1"
              min={3}
              max={20}
              placeholder="e.g. 6.1"
              value={form.hba1c}
              onChange={(e) => onSetCustom('hba1c_group', 'hba1c', e.target.value)}
            />
            {isHbInvalid && (
              <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                <span>⚠️</span> {t('assessment.validation.hba1cRange', 'HbA1c must be 3–20%.')}
              </p>
            )}
          </label>
        </div>
      </div>

      <div className="q-section">
        <div className="q-section-title"><TestTube2 className="h-5 w-5 text-slate-500" /> {t('assessment.labs.ogttTitle', '2-Hour OGTT (optional)')}</div>
        <div className="mt-3">
          <SegmentButtons options={labOptions.ogtt} value={qcm.ogtt_group} onChange={(opt) => onPickSegment('ogtt_group', opt, 'ogtt_2h')} />
          <label className="mt-3 block">
            <span className="label-text">{t('assessment.exactValueMgDl', 'Exact value (mg/dL)')}</span>
            <input
              className={cn("input-base", isOgInvalid && "border-rose-400 bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-400")}
              type="number"
              min={40}
              max={800}
              placeholder="e.g. 165"
              value={form.ogtt_2h}
              onChange={(e) => onSetCustom('ogtt_group', 'ogtt_2h', e.target.value)}
            />
            {isOgInvalid && (
              <p className="mt-1 text-xs font-semibold text-rose-500 flex items-center gap-1">
                <span>⚠️</span> {t('assessment.validation.ogttRange', '2-hour OGTT must be 40–800 mg/dL.')}
              </p>
            )}
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

