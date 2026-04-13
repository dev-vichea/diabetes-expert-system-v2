import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { AppSelect } from '@/components/ui'
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

  return (
    <div className="space-y-5">
      <section className="surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title">{t('historyPage.profile.title', 'Patient Profile')}</h2>
            <p className="section-subtitle mt-1">{t('historyPage.profile.desc', 'Manage demographics and monitor case history over time.')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/patients" className="btn-secondary">{t('historyPage.profile.back', 'Back to List')}</Link>
            <Link to={`/diagnosis?patient_id=${patientId}`} className="btn-primary">{t('historyPage.profile.assess', 'Run Assessment')}</Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{t('historyPage.sections.symptoms', 'Symptoms')}</p>
            <p className="text-xl font-bold text-slate-900">{symptomCount}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{t('historyPage.sections.labResults', 'Lab Results')}</p>
            <p className="text-xl font-bold text-slate-900">{labCount}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{t('historyPage.sections.diagnosisHistory', 'Diagnoses')}</p>
            <p className="text-xl font-bold text-slate-900">{diagnosisCount}</p>
          </div>
        </div>

        {loading ? <p className="state-box mt-4">{t('patientsPage.table.loading', 'Loading patient history...')}</p> : null}

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

          <label className="block">
            <span className="label-text">{t('patientsPage.form.phone', 'Phone')}</span>
            <input className="input-base" value={profile.phone || ''} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
          </label>

          <label className="block md:col-span-2">
            <span className="label-text">{t('patientsPage.form.notes', 'Notes')}</span>
            <textarea className="input-base" value={profile.notes || ''} rows={3} onChange={(event) => setProfile({ ...profile, notes: event.target.value })} />
          </label>

          <div className="md:col-span-2">
            <button type="submit" className="btn-primary" disabled={savingProfile || loading || !patient}>
              {savingProfile ? t('historyPage.profile.saving', 'Saving...') : t('historyPage.profile.updateProfile', 'Update Profile')}
            </button>
          </div>
        </form>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="surface p-5 sm:p-6">
          <h3 className="section-title">{t('historyPage.sections.symptoms', 'Symptoms')}</h3>

          <form className="mt-4 grid gap-3" onSubmit={addSymptom}>
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
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={symptomForm.present}
                onChange={(event) => setSymptomForm({ ...symptomForm, present: event.target.checked })}
              />
              {t('historyPage.symptomForm.present', 'Present now')}
            </label>
            <textarea
              className="input-base"
              rows={2}
              placeholder={t('historyPage.symptomForm.notes', 'Notes')}
              value={symptomForm.notes}
              onChange={(event) => setSymptomForm({ ...symptomForm, notes: event.target.value })}
            />
            <button type="submit" className="btn-primary" disabled={savingSymptom || !patient}>
              {savingSymptom ? t('historyPage.profile.saving', 'Saving...') : t('historyPage.symptomForm.add', 'Add Symptom')}
            </button>
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

        <section className="surface p-5 sm:p-6">
          <h3 className="section-title">{t('historyPage.sections.labResults', 'Lab Results')}</h3>

          <form className="mt-4 grid gap-3" onSubmit={addLabResult}>
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
            <textarea className="input-base" rows={2} placeholder={t('historyPage.labForm.notes', 'Notes')} value={labForm.notes} onChange={(event) => setLabForm({ ...labForm, notes: event.target.value })} />
            <button type="submit" className="btn-primary" disabled={savingLab || !patient}>
              {savingLab ? t('historyPage.profile.saving', 'Saving...') : t('historyPage.labForm.add', 'Add Lab Result')}
            </button>
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
      </div>

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
                  <td>{diagnosis.diagnosis}</td>
                  <td>{diagnosis.certainty}</td>
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

      {error ? <p className="error-box">{error}</p> : null}
    </div>
  )
}
