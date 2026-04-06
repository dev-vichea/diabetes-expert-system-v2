import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { AppSelect, DataTable, ErrorAlert, FilterBar, FormSection, SearchInput, SectionCard, StatusBadge } from '@/components/ui'

const DEFAULT_FILTERS = {
  search: '',
  gender: '',
  has_diagnosis: '',
}

const DEFAULT_FORM = {
  full_name: '',
  gender: 'unknown',
  date_of_birth: '',
  phone: '',
  notes: '',
}

function genderBadgeTone(gender) {
  if (gender === 'male') return 'info'
  if (gender === 'female') return 'primary'
  return 'neutral'
}

export function PatientsPage() {
  const navigate = useNavigate()
  const [urlParams] = useSearchParams()
  const [patients, setPatients] = useState([])

  // Seed filters from URL query params (enables dashboard drill-down links)
  const initialFilters = useMemo(() => ({
    search: urlParams.get('search') || '',
    gender: urlParams.get('gender') || '',
    has_diagnosis: urlParams.get('has_diagnosis') || '',
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  const [filters, setFilters] = useState(initialFilters)
  const [draftFilters, setDraftFilters] = useState(initialFilters)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEditing = selectedPatientId != null

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.gender) params.set('gender', filters.gender)
    if (filters.has_diagnosis) params.set('has_diagnosis', filters.has_diagnosis)
    params.set('limit', '200')
    return params.toString()
  }, [filters])

  async function loadPatients(activeQueryString = queryString) {
    setLoading(true)
    setError('')

    try {
      const response = await api.get(`/patients/?${activeQueryString}`)
      setPatients(getApiData(response) || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load patients'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [queryString])

  function resetPatientForm() {
    setForm(DEFAULT_FORM)
    setSelectedPatientId(null)
  }

  function populatePatientForm(patient) {
    setSelectedPatientId(patient.id)
    setForm({
      full_name: patient.full_name || '',
      gender: patient.gender || 'unknown',
      date_of_birth: patient.date_of_birth || '',
      phone: patient.phone || '',
      notes: patient.notes || '',
    })
    setError('')
  }

  function openAssessmentForPatient(patientId) {
    navigate({
      pathname: '/diagnosis',
      search: `?patient_id=${patientId}`,
    }, {
      state: {
        forceRestart: true,
      },
      replace: false,
    })
  }

  function openPatientWorkflow(patient) {
    if (patient.latest_diagnosis_result_id) {
      navigate(`/diagnosis/result?diagnosis_result_id=${patient.latest_diagnosis_result_id}`)
      return
    }
    openAssessmentForPatient(patient.id)
  }

  async function submitPatient(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        full_name: form.full_name,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        phone: form.phone || null,
        notes: form.notes || null,
      }

      if (isEditing) {
        await api.patch(`/patients/${selectedPatientId}`, payload)
      } else {
        await api.post('/patients/', payload)
      }

      resetPatientForm()
      await loadPatients()
    } catch (err) {
      setError(getApiErrorMessage(err, isEditing ? 'Failed to update patient' : 'Failed to register patient'))
    } finally {
      setSaving(false)
    }
  }

  function applyFilters(event) {
    event.preventDefault()
    setFilters({
      search: draftFilters.search.trim(),
      gender: draftFilters.gender,
      has_diagnosis: draftFilters.has_diagnosis,
    })
  }

  function resetFilters() {
    setDraftFilters(DEFAULT_FILTERS)
    setFilters(DEFAULT_FILTERS)
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <SectionCard title="Patient Records" description="Search, filter, edit profiles, and open assessment workflows.">
        <FilterBar className="mt-4 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_auto_auto]" onSubmit={applyFilters}>
          <SearchInput
            value={draftFilters.search}
            onChange={(event) => setDraftFilters({ ...draftFilters, search: event.target.value })}
            placeholder="Search by name or phone"
          />

          <AppSelect
            value={draftFilters.gender}
            onValueChange={(value) => setDraftFilters({ ...draftFilters, gender: value })}
            includeEmpty
            emptyLabel="All genders"
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
              { value: 'unknown', label: 'Unknown' },
            ]}
          />

          <AppSelect
            value={draftFilters.has_diagnosis}
            onValueChange={(value) => setDraftFilters({ ...draftFilters, has_diagnosis: value })}
            includeEmpty
            emptyLabel="Any diagnosis status"
            options={[
              { value: 'true', label: 'Has diagnosis' },
              { value: 'false', label: 'No diagnosis yet' },
            ]}
          />

          <button type="submit" className="btn-primary">Apply</button>
          <button type="button" className="btn-secondary" onClick={resetFilters}>Reset</button>
        </FilterBar>

        <DataTable
          className="mt-4"
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'gender', label: 'Gender' },
            { key: 'phone', label: 'Phone' },
            { key: 'diagnoses', label: 'Diagnoses' },
            { key: 'actions', label: 'Actions' },
          ]}
          loading={loading}
          isEmpty={!patients.length}
          loadingMessage="Loading patients..."
          emptyTitle="No patients found for current filters."
        >
          {patients.map((patient) => (
            <tr
              key={patient.id}
              onClick={() => populatePatientForm(patient)}
              className={`table-row-hover ${selectedPatientId === patient.id ? 'table-row-selected' : ''}`}
            >
              <td className="font-semibold text-slate-900">{patient.full_name}</td>
              <td><StatusBadge tone={genderBadgeTone(patient.gender)}>{patient.gender || 'N/A'}</StatusBadge></td>
              <td>{patient.phone || 'N/A'}</td>
              <td>{patient.diagnosis_count}</td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/patients/${patient.id}`}
                    className="btn-secondary px-3 py-1.5 text-xs"
                    onClick={(event) => event.stopPropagation()}
                  >
                    History
                  </Link>
                  <button
                    type="button"
                    className="btn-primary px-3 py-1.5 text-xs"
                    onClick={(event) => {
                      event.stopPropagation()
                      openPatientWorkflow(patient)
                    }}
                  >
                    {patient.latest_diagnosis_result_id ? 'Latest Result' : 'Assess'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>

      <SectionCard
        title={isEditing ? 'Edit Patient' : 'Register Patient'}
        description={isEditing ? 'Update profile details before reviewing history or running a new assessment.' : 'Add a profile before recording symptoms and labs.'}
        actions={isEditing ? <button type="button" className="btn-secondary" onClick={resetPatientForm}>Cancel Edit</button> : null}
      >
        <FormSection>
          <form onSubmit={submitPatient} className="space-y-3">
            <label className="block">
              <span className="label-text">Full name</span>
              <input
                className="input-base"
                required
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                placeholder="Patient full name"
              />
            </label>

            <label className="block">
              <span className="label-text">Gender</span>
              <AppSelect
                value={form.gender}
                onValueChange={(value) => setForm({ ...form, gender: value })}
                options={[
                  { value: 'unknown', label: 'Unknown' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </label>

            <label className="block">
              <span className="label-text">Date of birth</span>
              <input className="input-base" type="date" value={form.date_of_birth} onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })} />
            </label>

            <label className="block">
              <span className="label-text">Phone</span>
              <input className="input-base" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone number" />
            </label>

            <label className="block">
              <span className="label-text">Notes</span>
              <textarea
                className="input-base"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Background notes"
                rows={4}
              />
            </label>

            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update Patient' : 'Create Patient'}
            </button>
          </form>
        </FormSection>

        <ErrorAlert message={error} className="mt-4" />
      </SectionCard>
    </div>
  )
}
