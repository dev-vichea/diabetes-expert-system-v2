import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FileText, FlaskConical, LayoutDashboard, Thermometer, UserCog } from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { AppSelect, Sparkline, StatusBadge } from '@/components/ui'
import { useLanguage } from '@/contexts/LanguageContext'

const EMPTY_SYMPTOM_FORM = {
  symptom_code: '',
  symptom_name: '',
  severity: '',
  present: true,
  notes: '',
}

const EMPTY_LAB_FORM = {
  test_name: '',
  test_value: '',
  unit: '',
  reference_range: '',
  notes: '',
}

const AVATAR_TONES = [
  'from-primary-500 to-sky-500',
  'from-sky-500 to-cyan-400',
  'from-indigo-500 to-primary-500',
  'from-cyan-500 to-sky-600',
  'from-slate-400 to-slate-500',
]

function avatarTone(name = '') {
  let hash = 0
  for (const ch of String(name)) hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return AVATAR_TONES[hash % AVATAR_TONES.length]
}

function initialsOf(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('')
}

function certaintyPercent(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return Math.round(num <= 1 ? num * 100 : num)
}

function certaintyToneClass(percent) {
  if (percent == null) return 'text-slate-400'
  if (percent >= 70) return 'text-rose-600 dark:text-rose-400'
  if (percent >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

function cumulativeSeries(items = [], dateKey) {
  const dates = (items || [])
    .map((item) => item?.[dateKey])
    .filter(Boolean)
    .sort()
  if (!dates.length) return [{ value: 0 }]
  return dates.map((_, index) => ({ value: index + 1 }))
}

export function PatientHistoryPage() {
  const { t } = useLanguage()
  const { patientId } = useParams()
  const [history, setHistory] = useState(null)
  const [profile, setProfile] = useState({
    full_name: '',
    gender: 'unknown',
    date_of_birth: '',
    phone: '',
    notes: '',
  })
  const [symptomForm, setSymptomForm] = useState(EMPTY_SYMPTOM_FORM)
  const [labForm, setLabForm] = useState(EMPTY_LAB_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingSymptom, setSavingSymptom] = useState(false)
  const [savingLab, setSavingLab] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  async function loadHistory() {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/patients/${patientId}/history`)
      const data = getApiData(response)
      setHistory(data)
      setProfile({
        full_name: data?.patient?.full_name || '',
        gender: data?.patient?.gender || 'unknown',
        date_of_birth: data?.patient?.date_of_birth || '',
        phone: data?.patient?.phone || '',
        notes: data?.patient?.notes || '',
      })
    } catch (err) {
      setError(getApiErrorMessage(err, t('historyPage.errors.loadHistory', 'Failed to load patient history')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [patientId])

  async function updateProfile(event) {
    event.preventDefault()
    setSavingProfile(true)
    setError('')

    try {
      await api.patch(`/patients/${patientId}`, {
        full_name: profile.full_name,
        gender: profile.gender || null,
        date_of_birth: profile.date_of_birth || null,
        phone: profile.phone || null,
        notes: profile.notes || null,
      })
      await loadHistory()
    } catch (err) {
      setError(getApiErrorMessage(err, t('historyPage.errors.updateProfile', 'Failed to update profile')))
    } finally {
      setSavingProfile(false)
    }
  }

  async function addSymptom(event) {
    event.preventDefault()
    setSavingSymptom(true)
    setError('')

    try {
      await api.post(`/patients/${patientId}/symptoms`, {
        symptom_code: symptomForm.symptom_code,
        symptom_name: symptomForm.symptom_name,
        severity: symptomForm.severity ? Number(symptomForm.severity) : null,
        present: symptomForm.present,
        notes: symptomForm.notes || null,
      })
      setSymptomForm(EMPTY_SYMPTOM_FORM)
      await loadHistory()
    } catch (err) {
      setError(getApiErrorMessage(err, t('historyPage.errors.addSymptom', 'Failed to add symptom')))
    } finally {
      setSavingSymptom(false)
    }
  }

  async function addLabResult(event) {
    event.preventDefault()
    setSavingLab(true)
    setError('')

    try {
      await api.post(`/patients/${patientId}/lab-results`, {
        test_name: labForm.test_name,
        test_value: Number(labForm.test_value),
        unit: labForm.unit || null,
        reference_range: labForm.reference_range || null,
        notes: labForm.notes || null,
      })
      setLabForm(EMPTY_LAB_FORM)
      await loadHistory()
    } catch (err) {
      setError(getApiErrorMessage(err, t('historyPage.errors.addLab', 'Failed to add lab result')))
    } finally {
      setSavingLab(false)
    }
  }

  const patient = history?.patient
  const symptomCount = history?.symptoms?.length || 0
  const labCount = history?.lab_results?.length || 0
  const diagnosisCount = history?.diagnosis_history?.length || 0
  const latestDiagnosis = diagnosisCount ? history.diagnosis_history[0] : null
  const latestCertainty = latestDiagnosis ? certaintyPercent(latestDiagnosis.certainty) : null

  const certaintySeries = useMemo(() => (
    (history?.diagnosis_history || [])
      .slice()
      .reverse()
      .map((item) => ({ value: certaintyPercent(item?.certainty) ?? 0 }))
  ), [history])

  const symptomSeries = useMemo(() => cumulativeSeries(history?.symptoms, 'recorded_at'), [history])
  const labSeries = useMemo(() => cumulativeSeries(history?.lab_results, 'measured_at'), [history])
  const diagnosisSeries = useMemo(() => cumulativeSeries(history?.diagnosis_history, 'created_at'), [history])

  const age = useMemo(() => {
    if (!patient?.date_of_birth) return null
    const dob = new Date(patient.date_of_birth)
    if (Number.isNaN(dob.getTime())) return null
    return Math.max(0, Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)))
  }, [patient?.date_of_birth])

  const genderLabel = patient?.gender && patient.gender !== 'unknown'
    ? t(`common.${patient.gender}`, patient.gender)
    : t('common.unknown', 'Unknown')

  const tabs = [
    { key: 'overview', icon: LayoutDashboard, label: t('historyPage.tabs.overview', 'Overview'), count: null },
    { key: 'diagnoses', icon: FileText, label: t('historyPage.tabs.diagnoses', 'Diagnoses'), count: diagnosisCount },
    { key: 'symptoms', icon: Thermometer, label: t('historyPage.tabs.symptoms', 'Symptoms'), count: symptomCount },
    { key: 'labs', icon: FlaskConical, label: t('historyPage.tabs.labs', 'Lab Results'), count: labCount },
    { key: 'profile', icon: UserCog, label: t('historyPage.tabs.profile', 'Profile'), count: null },
  ]

  return (
    <div className="space-y-5">
      {/* ── Patient header card ─────────────────────────────── */}
      <section className="surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold text-white ${avatarTone(patient?.full_name)}`}>
              {initialsOf(patient?.full_name)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
                {patient?.full_name || '—'}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {genderLabel}{age != null ? ` · ${age}` : ''}
              </p>
              <p className="truncate text-xs text-slate-500">{patient?.phone || t('patientsPage.list.noPhone', 'No phone on file')}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <div className="rounded-2xl bg-slate-50 px-4 py-2 text-center dark:bg-[#101020]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t('historyPage.header.assessments', 'Assessments')}</p>
              <p className="text-2xl font-bold leading-tight text-slate-900 dark:text-slate-50">{diagnosisCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-2 text-center dark:bg-[#101020]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t('historyPage.header.latestCertainty', 'Latest certainty')}</p>
              <p className={`text-2xl font-bold leading-tight ${certaintyToneClass(latestCertainty)}`}>
                {latestCertainty != null ? `${latestCertainty}%` : '—'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/patients" className="btn-secondary min-h-9 px-3 py-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                {t('historyPage.profile.back', 'Back to List')}
              </Link>
              <Link to={`/diagnosis?patient_id=${patientId}`} className="btn-primary min-h-9 px-3 py-1.5 text-xs">
                {t('historyPage.profile.assess', 'Run Assessment')}
              </Link>
            </div>
          </div>
        </div>

        {error ? <p className="error-box mt-4">{error}</p> : null}
      </section>

      {/* ── Section tab bar ─────────────────────────────────── */}
      <nav className="surface no-scrollbar flex gap-1 overflow-x-auto p-2" aria-label={t('historyPage.tabs.nav', 'Patient sections')}>
        {tabs.map((tab) => {
          const TabIcon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex min-w-[6rem] flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2.5 transition-colors ${isActive ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-200' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-[#181830]'}`}
            >
              <TabIcon className="h-[18px] w-[18px]" />
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
                {tab.label}
                {tab.count ? (
                  <span className="rounded-full bg-slate-200/80 px-1.5 text-[9px] font-bold text-slate-600 dark:bg-[#181830] dark:text-slate-300">
                    {tab.count}
                  </span>
                ) : null}
              </span>
            </button>
          )
        })}
      </nav>

      {loading ? <p className="state-box">{t('patientsPage.table.loading', 'Loading patient history...')}</p> : null}

      {activeTab === 'overview' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="surface flex min-w-0 items-center gap-4 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                <Thermometer className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold leading-none text-slate-900 dark:text-slate-50">{symptomCount}</p>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('historyPage.sections.symptoms', 'Symptoms')}</p>
              </div>
              <Sparkline data={symptomSeries} color="#1f76e8" className="h-10 w-14 shrink-0 sm:w-20" />
            </article>

            <article className="surface flex min-w-0 items-center gap-4 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                <FlaskConical className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold leading-none text-slate-900 dark:text-slate-50">{labCount}</p>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('historyPage.sections.labResults', 'Lab Results')}</p>
              </div>
              <Sparkline data={labSeries} color="#0ea5e9" className="h-10 w-14 shrink-0 sm:w-20" />
            </article>

            <article className="surface flex min-w-0 items-center gap-4 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold leading-none text-slate-900 dark:text-slate-50">{diagnosisCount}</p>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('historyPage.sections.diagnosisHistory', 'Diagnoses')}</p>
              </div>
              <Sparkline data={diagnosisSeries} color="#6366f1" className="h-10 w-14 shrink-0 sm:w-20" />
            </article>
          </div>

          <section className="surface p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="section-title">{t('historyPage.overview.latestDiagnosis', 'Latest Diagnosis')}</h3>
                <p className="section-subtitle mt-1">
                  {latestDiagnosis ? formatDateTime(latestDiagnosis.created_at) : t('historyPage.overview.none', 'No assessments recorded yet.')}
                </p>
              </div>
              {latestDiagnosis?.id ? (
                <Link to={`/diagnosis/result?diagnosis_result_id=${latestDiagnosis.id}`} className="btn-secondary min-h-9 px-3 py-1.5 text-xs">
                  {t('historyPage.overview.viewResult', 'View Result')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <Link to={`/diagnosis?patient_id=${patientId}`} className="btn-primary min-h-9 px-3 py-1.5 text-xs">
                  {t('historyPage.profile.assess', 'Run Assessment')}
                </Link>
              )}
            </div>

            {latestDiagnosis ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StatusBadge tone="primary">{latestDiagnosis.diagnosis}</StatusBadge>
                <span className={`text-sm font-bold ${certaintyToneClass(latestCertainty)}`}>
                  {latestCertainty != null ? `${latestCertainty}%` : '—'} {t('historyPage.diagnosisTable.certainty', 'Certainty')}
                </span>
                <span className="text-xs text-slate-500">
                  {t('historyPage.diagnosisTable.by', 'By')}: {latestDiagnosis.diagnosed_by_name || latestDiagnosis.diagnosed_by_user_id || '—'}
                </span>
              </div>
            ) : null}

            {latestDiagnosis && certaintySeries.length ? (
              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-[#1e2234]">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('historyPage.overview.certaintyTrend', 'Certainty trend')}</p>
                <Sparkline
                  data={certaintySeries}
                  color={latestCertainty >= 70 ? '#e11d48' : latestCertainty >= 40 ? '#d97706' : '#16a34a'}
                  className="mt-1 h-14 w-full"
                />
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {activeTab === 'diagnoses' ? (
        <section className="surface p-5 sm:p-6">
          <h3 className="section-title">{t('historyPage.sections.diagnosisHistory', 'Diagnosis History')}</h3>
          <div className="mt-4 table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t('historyPage.diagnosisTable.diagnosis', 'Diagnosis')}</th>
                  <th>{t('historyPage.diagnosisTable.certainty', 'Certainty')}</th>
                  <th>{t('historyPage.diagnosisTable.by', 'By')}</th>
                  <th>{t('historyPage.sections.recorded_at', 'When')}</th>
                </tr>
              </thead>
              <tbody>
                {(history?.diagnosis_history || []).map((diagnosis) => (
                  <tr key={diagnosis.id}>
                    <td>
                      {diagnosis.id ? (
                        <Link
                          to={`/diagnosis/result?diagnosis_result_id=${diagnosis.id}`}
                          className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                        >
                          {diagnosis.diagnosis}
                        </Link>
                      ) : (
                        diagnosis.diagnosis
                      )}
                    </td>
                    <td>{certaintyPercent(diagnosis.certainty) != null ? `${certaintyPercent(diagnosis.certainty)}%` : 'N/A'}</td>
                    <td>{diagnosis.diagnosed_by_name || diagnosis.diagnosed_by_user_id || 'N/A'}</td>
                    <td>{formatDateTime(diagnosis.created_at)}</td>
                  </tr>
                ))}
                {!history?.diagnosis_history?.length ? (
                  <tr>
                    <td colSpan="4"><div className="state-box">{t('historyPage.diagnosisTable.noHistory', 'No diagnosis history yet.')}</div></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === 'symptoms' ? (
        <section className="surface p-5 sm:p-6">
          <h3 className="section-title">{t('historyPage.sections.symptoms', 'Symptoms')}</h3>
          <p className="section-subtitle mt-1">{t('historyPage.symptoms.desc', 'Record observed symptoms to enrich future assessments.')}</p>

          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={addSymptom}>
            <input
              className="input-base"
              required
              placeholder={t('historyPage.symptomForm.code', 'Symptom code (e.g. fatigue)')}
              value={symptomForm.symptom_code}
              onChange={(event) => setSymptomForm({ ...symptomForm, symptom_code: event.target.value })}
            />
            <input
              className="input-base"
              required
              placeholder={t('historyPage.symptomForm.name', 'Symptom name')}
              value={symptomForm.symptom_name}
              onChange={(event) => setSymptomForm({ ...symptomForm, symptom_name: event.target.value })}
            />
            <input
              className="input-base"
              type="number"
              min="1"
              max="10"
              placeholder={t('historyPage.symptomForm.severity', 'Severity 1-10')}
              value={symptomForm.severity}
              onChange={(event) => setSymptomForm({ ...symptomForm, severity: event.target.value })}
            />
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-[#1e2234] dark:bg-[#101020]">
              <input
                type="checkbox"
                checked={symptomForm.present}
                onChange={(event) => setSymptomForm({ ...symptomForm, present: event.target.checked })}
              />
              {t('historyPage.symptomForm.present', 'Present now')}
            </label>
            <textarea
              className="input-base sm:col-span-2"
              rows={2}
              placeholder={t('historyPage.symptomForm.notes', 'Notes')}
              value={symptomForm.notes}
              onChange={(event) => setSymptomForm({ ...symptomForm, notes: event.target.value })}
            />
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={savingSymptom || !patient}>
                {savingSymptom ? t('historyPage.profile.saving', 'Saving...') : t('historyPage.symptomForm.add', 'Add Symptom')}
              </button>
            </div>
          </form>

          <div className="mt-4 table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t('historyPage.symptomForm.name', 'Symptom')}</th>
                  <th>{t('historyPage.symptomForm.severity', 'Severity')}</th>
                  <th>{t('historyPage.symptomForm.present', 'Present')}</th>
                  <th>{t('historyPage.sections.recorded', 'Recorded')}</th>
                </tr>
              </thead>
              <tbody>
                {(history?.symptoms || []).map((symptom) => (
                  <tr key={symptom.id}>
                    <td>{symptom.symptom_name}</td>
                    <td>{symptom.severity ?? 'N/A'}</td>
                    <td>{symptom.present ? t('common.yes', 'Yes') : t('common.noSelection', 'No')}</td>
                    <td>{formatDateTime(symptom.recorded_at)}</td>
                  </tr>
                ))}
                {!history?.symptoms?.length ? (
                  <tr>
                    <td colSpan="4"><div className="state-box">{t('historyPage.symptomForm.noHistory', 'No symptom history.')}</div></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === 'labs' ? (
        <section className="surface p-5 sm:p-6">
          <h3 className="section-title">{t('historyPage.sections.labResults', 'Lab Results')}</h3>
          <p className="section-subtitle mt-1">{t('historyPage.labs.desc', 'Track glucose and HbA1c measurements over time.')}</p>

          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={addLabResult}>
            <input className="input-base" required placeholder={t('historyPage.labForm.testName', 'Test name')} value={labForm.test_name} onChange={(event) => setLabForm({ ...labForm, test_name: event.target.value })} />
            <input
              className="input-base"
              required
              type="number"
              step="0.01"
              placeholder={t('historyPage.labForm.testValue', 'Test value')}
              value={labForm.test_value}
              onChange={(event) => setLabForm({ ...labForm, test_value: event.target.value })}
            />
            <input className="input-base" placeholder={t('historyPage.labForm.unit', 'Unit')} value={labForm.unit} onChange={(event) => setLabForm({ ...labForm, unit: event.target.value })} />
            <input
              className="input-base"
              placeholder={t('historyPage.labForm.range', 'Reference range')}
              value={labForm.reference_range}
              onChange={(event) => setLabForm({ ...labForm, reference_range: event.target.value })}
            />
            <textarea className="input-base sm:col-span-2" rows={2} placeholder={t('historyPage.labForm.notes', 'Notes')} value={labForm.notes} onChange={(event) => setLabForm({ ...labForm, notes: event.target.value })} />
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={savingLab || !patient}>
                {savingLab ? t('historyPage.profile.saving', 'Saving...') : t('historyPage.labForm.add', 'Add Lab Result')}
              </button>
            </div>
          </form>

          <div className="mt-4 table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t('historyPage.labForm.testName', 'Test')}</th>
                  <th>{t('historyPage.labForm.testValue', 'Value')}</th>
                  <th>{t('historyPage.labForm.range', 'Range')}</th>
                  <th>{t('historyPage.sections.recorded', 'Measured')}</th>
                </tr>
              </thead>
              <tbody>
                {(history?.lab_results || []).map((labResult) => (
                  <tr key={labResult.id}>
                    <td>{labResult.test_name}</td>
                    <td>{labResult.test_value}{labResult.unit ? ` ${labResult.unit}` : ''}</td>
                    <td>{labResult.reference_range || 'N/A'}</td>
                    <td>{formatDateTime(labResult.measured_at)}</td>
                  </tr>
                ))}
                {!history?.lab_results?.length ? (
                  <tr>
                    <td colSpan="4"><div className="state-box">{t('historyPage.labForm.noHistory', 'No lab history.')}</div></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === 'profile' ? (
        <section className="surface p-5 sm:p-6">
          <h3 className="section-title">{t('historyPage.profile.title', 'Patient Profile')}</h3>
          <p className="section-subtitle mt-1">{t('historyPage.profile.desc', 'Manage demographics and monitor case history over time.')}</p>

          <form onSubmit={updateProfile} className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="label-text">{t('patientsPage.form.fullName', 'Full Name')}</span>
              <input className="input-base" required value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} />
            </label>

            <label className="block">
              <span className="label-text">{t('patientsPage.form.gender', 'Gender')}</span>
              <AppSelect
                value={profile.gender}
                onValueChange={(value) => setProfile({ ...profile, gender: value })}
                options={[
                  { value: 'unknown', label: t('common.unknown', 'Unknown') },
                  { value: 'male', label: t('common.male', 'Male') },
                  { value: 'female', label: t('common.female', 'Female') },
                  { value: 'other', label: t('common.other', 'Other') },
                ]}
              />
            </label>

            <label className="block">
              <span className="label-text">{t('patientsPage.form.dateOfBirth', 'Date of Birth')}</span>
              <input className="input-base" type="date" value={profile.date_of_birth || ''} onChange={(event) => setProfile({ ...profile, date_of_birth: event.target.value })} />
            </label>

            <label className="block md:col-span-2">
              <span className="label-text">{t('patientsPage.form.phone', 'Phone')}</span>
              <input className="input-base" value={profile.phone || ''} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
            </label>

            <label className="block md:col-span-2">
              <span className="label-text">{t('patientsPage.form.notes', 'Notes')}</span>
              <textarea className="input-base" value={profile.notes || ''} rows={3} onChange={(event) => setProfile({ ...profile, notes: event.target.value })} />
            </label>

            <div className="md:col-span-2">
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={savingProfile || loading || !patient}>
                {savingProfile ? t('historyPage.profile.saving', 'Saving...') : t('historyPage.profile.updateProfile', 'Update Profile')}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  )
}