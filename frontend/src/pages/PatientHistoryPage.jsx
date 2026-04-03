import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { AppSelect } from '@/components/ui'

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
      setError(getApiErrorMessage(err, 'Failed to load patient history'))
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
      setError(getApiErrorMessage(err, 'Failed to update profile'))
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
      setError(getApiErrorMessage(err, 'Failed to add symptom'))
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
      setError(getApiErrorMessage(err, 'Failed to add lab result'))
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
            <h2 className="section-title">Patient Profile</h2>
            <p className="section-subtitle mt-1">Manage demographics and monitor case history over time.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/patients" className="btn-secondary">Back to List</Link>
            <Link to={`/diagnosis?patient_id=${patientId}`} className="btn-primary">Run Assessment</Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Symptoms</p>
            <p className="text-xl font-bold text-slate-900">{symptomCount}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Lab Results</p>
            <p className="text-xl font-bold text-slate-900">{labCount}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Diagnoses</p>
            <p className="text-xl font-bold text-slate-900">{diagnosisCount}</p>
          </div>
        </div>

        {loading ? <p className="state-box mt-4">Loading patient history...</p> : null}

        <form onSubmit={updateProfile} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="label-text">Full Name</span>
            <input className="input-base" required value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} />
          </label>

          <label className="block">
            <span className="label-text">Gender</span>
            <AppSelect
              value={profile.gender}
              onValueChange={(value) => setProfile({ ...profile, gender: value })}
              options={[
                { value: 'unknown', label: 'Unknown' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </label>

          <label className="block">
            <span className="label-text">Date of Birth</span>
            <input className="input-base" type="date" value={profile.date_of_birth || ''} onChange={(event) => setProfile({ ...profile, date_of_birth: event.target.value })} />
          </label>

          <label className="block">
            <span className="label-text">Phone</span>
            <input className="input-base" value={profile.phone || ''} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
          </label>

          <label className="block md:col-span-2">
            <span className="label-text">Notes</span>
            <textarea className="input-base" value={profile.notes || ''} rows={3} onChange={(event) => setProfile({ ...profile, notes: event.target.value })} />
          </label>

          <div className="md:col-span-2">
            <button type="submit" className="btn-primary" disabled={savingProfile || loading || !patient}>
              {savingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="surface p-5 sm:p-6">
          <h3 className="section-title">Symptoms</h3>

          <form className="mt-4 grid gap-3" onSubmit={addSymptom}>
            <input
              className="input-base"
              required
              placeholder="Symptom code (e.g. fatigue)"
              value={symptomForm.symptom_code}
              onChange={(event) => setSymptomForm({ ...symptomForm, symptom_code: event.target.value })}
            />
            <input
              className="input-base"
              required
              placeholder="Symptom name"
              value={symptomForm.symptom_name}
              onChange={(event) => setSymptomForm({ ...symptomForm, symptom_name: event.target.value })}
            />
            <input
              className="input-base"
              type="number"
              min="1"
              max="10"
              placeholder="Severity 1-10"
              value={symptomForm.severity}
              onChange={(event) => setSymptomForm({ ...symptomForm, severity: event.target.value })}
            />
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={symptomForm.present}
                onChange={(event) => setSymptomForm({ ...symptomForm, present: event.target.checked })}
              />
              Present now
            </label>
            <textarea
              className="input-base"
              rows={2}
              placeholder="Notes"
              value={symptomForm.notes}
              onChange={(event) => setSymptomForm({ ...symptomForm, notes: event.target.value })}
            />
            <button type="submit" className="btn-primary" disabled={savingSymptom || !patient}>
              {savingSymptom ? 'Saving...' : 'Add Symptom'}
            </button>
          </form>

          <div className="mt-4 table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Symptom</th>
                  <th>Severity</th>
                  <th>Present</th>
                  <th>Recorded</th>
                </tr>
              </thead>
              <tbody>
                {(history?.symptoms || []).map((symptom) => (
                  <tr key={symptom.id}>
                    <td>{symptom.symptom_name}</td>
                    <td>{symptom.severity ?? 'N/A'}</td>
                    <td>{symptom.present ? 'Yes' : 'No'}</td>
                    <td>{formatDateTime(symptom.recorded_at)}</td>
                  </tr>
                ))}
                {!history?.symptoms?.length ? (
                  <tr>
                    <td colSpan="4"><div className="state-box">No symptom history.</div></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-5 sm:p-6">
          <h3 className="section-title">Lab Results</h3>

          <form className="mt-4 grid gap-3" onSubmit={addLabResult}>
            <input className="input-base" required placeholder="Test name" value={labForm.test_name} onChange={(event) => setLabForm({ ...labForm, test_name: event.target.value })} />
            <input
              className="input-base"
              required
              type="number"
              step="0.01"
              placeholder="Test value"
              value={labForm.test_value}
              onChange={(event) => setLabForm({ ...labForm, test_value: event.target.value })}
            />
            <input className="input-base" placeholder="Unit" value={labForm.unit} onChange={(event) => setLabForm({ ...labForm, unit: event.target.value })} />
            <input
              className="input-base"
              placeholder="Reference range"
              value={labForm.reference_range}
              onChange={(event) => setLabForm({ ...labForm, reference_range: event.target.value })}
            />
            <textarea className="input-base" rows={2} placeholder="Notes" value={labForm.notes} onChange={(event) => setLabForm({ ...labForm, notes: event.target.value })} />
            <button type="submit" className="btn-primary" disabled={savingLab || !patient}>
              {savingLab ? 'Saving...' : 'Add Lab Result'}
            </button>
          </form>

          <div className="mt-4 table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Value</th>
                  <th>Range</th>
                  <th>Measured</th>
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
                    <td colSpan="4"><div className="state-box">No lab history.</div></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="surface p-5 sm:p-6">
        <h3 className="section-title">Diagnosis History</h3>
        <div className="mt-4 table-wrap">
          <table className="table-base">
            <thead>
              <tr>
                <th>Diagnosis</th>
                <th>Certainty</th>
                <th>By</th>
                <th>When</th>
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
                  <td colSpan="4"><div className="state-box">No diagnosis history yet.</div></td>
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
