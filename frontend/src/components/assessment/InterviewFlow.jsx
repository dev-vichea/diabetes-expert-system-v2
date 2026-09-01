import { useEffect, useRef } from 'react'
import {
  Activity, AlertTriangle, Armchair, Baby, Bandage, BatteryLow, Bug, Building2, CalendarHeart,
  Check, Cigarette, ClipboardList, Contrast, Droplet, Droplets, Egg, Eye, FlaskConical, Flower2,
  GlassWater, Globe, Hand, HeartCrack, HeartPulse, PenTool, Plus, RefreshCw, Scale, Soup,
  Stethoscope, TestTube2, Timer, TrendingDown, Trash2, UserRound, Users, Vibrate, Waves, Weight, X,
} from 'lucide-react'
import { AppSelect, LoadingState } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { FIELD_FALLBACKS, camelField, fieldLabelKey, nodeFields } from './interview-flow'

const NODE_ICONS = {
  Building2, UserRound, Baby, CalendarHeart, Droplets, Stethoscope, AlertTriangle,
  ClipboardList, Scale, TestTube2, FlaskConical, PenTool, Timer,
}

const FIELD_ICONS = {
  frequent_urination: Droplets, excessive_thirst: GlassWater, weight_loss: TrendingDown,
  fatigue: BatteryLow, blurred_vision: Eye, slow_healing: Bandage, nausea: Waves,
  tingling_hands_feet: Hand, frequent_infections: Bug, acanthosis_nigricans: Contrast,
  sweating: Droplet, shaking: Vibrate, dizziness: RefreshCw, vomiting: Soup, abdominal_pain: HeartCrack,
  family_history: Users, obesity: Weight, hypertension: HeartPulse, sedentary_lifestyle: Armchair,
  gestational_history: Baby, smoking: Cigarette, high_cholesterol: Egg, pcos_history: Flower2,
  ethnicity_high_risk: Globe,
}

function QuestionCard({ node, title, helper, children }) {
  const Icon = NODE_ICONS[node.icon] || ClipboardList
  return (
    <div className="assessment-card-enter surface min-w-0 p-5 sm:p-7">
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
          <Icon className="h-5.5 w-5.5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-slate-50 sm:text-xl">{title}</h3>
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
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => (
        <button
          key={String(opt.v)}
          type="button"
          onClick={() => onPick(opt.v)}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition-all',
            value === opt.v
              ? 'border-cyan-500 bg-cyan-500 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/50 dark:border-slate-700 dark:bg-[#0b0b16] dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-cyan-900/20',
          )}
        >
          {value === opt.v ? <Check className="h-4.5 w-4.5" strokeWidth={2.5} /> : null}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function MultiGrid({ node, form, t, onToggle, onNone }) {
  const fields = nodeFields(node, { form })
  const selectedCount = fields.filter((f) => form[f]).length
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {fields.map((key) => {
          const FIcon = FIELD_ICONS[key] || Activity
          const active = Boolean(form[key])
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(node, key, !active)}
              className={cn(
                'toggle-pill assessment-card-enter',
                active && 'active',
              )}
            >
              <FIcon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-slate-400 dark:text-slate-500')} strokeWidth={2} />
              <span className="flex-1 text-left">{t(fieldLabelKey(key), FIELD_FALLBACKS[key])}</span>
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

export function InterviewFlow(props) {
  const {
    node, form, qcm, t,
    patients, loadingPatients,
    ageOptions, labOptions, renderBadge,
    extraLabs, onAddExtraLab, onRemoveExtraLab,
    onField, onPickSegment, onSetCustom, onCalculateBmi,
    onYesNo, onChoice, onToggleMulti, onMultiNone,
    onContinue, onSkip, onFinish, canFinish, editing,
  } = props

  const inputRef = useRef(null)
  useEffect(() => { if (node?.kind === 'number' && inputRef.current) inputRef.current.focus() }, [node?.id])

  if (!node) return null

  const title = t(node.titleKey, node.titleFallback)
  const helper = node.helperKey ? t(node.helperKey, node.helperFallback) : ''
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
      <div className={cn('grid gap-2', node.options.length > 3 ? 'sm:grid-cols-2' : 'grid-cols-2')}>
        {node.options.map((opt) => {
          const active = form[node.field] === opt.value
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
    const value = node.field === 'has_labs'
      ? (form.has_labs === 'yes' ? true : form.has_labs === 'no' ? false : null)
      : Boolean(form[node.field])
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
    body = <MultiGrid node={node} form={form} t={t} onToggle={onToggleMulti} onNone={onMultiNone} />
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
    body = (
      <div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="label-text">{t('assessment.weightKg', 'Weight (kg)')}</span>
            <input className="input-base" type="number" min={2} max={400} step="0.1" placeholder="e.g. 65" value={form.weight_kg} onChange={(e) => { onField('weight_kg', e.target.value); onCalculateBmi(e.target.value, form.height_cm) }} />
          </label>
          <label className="block">
            <span className="label-text">{t('assessment.heightCm', 'Height (cm)')}</span>
            <input className="input-base" type="number" min={40} max={260} step="0.1" placeholder="e.g. 170" value={form.height_cm} onChange={(e) => { onField('height_cm', e.target.value); onCalculateBmi(form.weight_kg, e.target.value) }} />
          </label>
        </div>
        {form.bmi ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {t('assessment.interview.bmiIs', 'Your BMI:')} {form.bmi}
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-2">
          <label className="block">
            <span className="label-text">{t('assessment.interview.orExactBmi', 'Or enter BMI directly')}</span>
            <input className="input-base" type="number" min={10} max={80} step="0.1" placeholder="e.g. 26.5" value={form.bmi} onChange={(e) => onSetCustom('bmi_group', 'bmi', e.target.value)} />
          </label>
          <label className="block">
            <span className="label-text">{t('assessment.profile.exactWaist', 'Waist in cm (optional)')}</span>
            <input className="input-base" type="number" min={30} max={250} step="0.1" placeholder="e.g. 95" value={form.waist_circumference} onChange={(e) => onField('waist_circumference', e.target.value)} />
          </label>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <QuestionCard node={node} title={title} helper={helper}>
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
        {canFinish && onFinish ? (
          <button
            type="button"
            className="btn-primary gap-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            onClick={onFinish}
          >
            {t('assessment.interview.finishNow', 'Enough — see my result')}
          </button>
        ) : null}
        {node.skippable ? (
          <button type="button" className="btn-secondary gap-1.5" onClick={onSkip}>
            {t('assessment.interview.skip', 'Skip')}
          </button>
        ) : null}
        {node.kind !== 'patient' && node.kind !== 'yesno' && node.kind !== 'choice' ? (
          <button type="button" className="btn-primary gap-1.5" disabled={!continueEnabled} onClick={onContinue}>
            {continueLabel}
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

      <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="q-section-title"><TestTube2 className="h-5 w-5 text-slate-500" /> {t('assessment.labs.rpgTitle', 'Random Blood Glucose (optional)')}</div>
          <label className="mt-3 block">
            <span className="label-text">{t('assessment.valueMgDl', 'Value (mg/dL)')}</span>
            <input className="input-base" type="number" min={30} max={1000} placeholder="e.g. 180" value={form.random_plasma_glucose} onChange={(e) => onField('random_plasma_glucose', e.target.value)} />
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

