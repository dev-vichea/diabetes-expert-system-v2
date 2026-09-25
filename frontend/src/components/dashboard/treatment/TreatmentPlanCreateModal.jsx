import { useState, useEffect } from 'react'
import {
  Activity,
  Check,
  ClipboardPlus,
  HeartPulse,
  Pill,
  Plus,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createTreatmentPlan } from '@/lib/treatmentPlanStore'

export function TreatmentPlanCreateModal({
  isOpen,
  onClose,
  initialData = {},
  onCreated,
  t,
}) {
  const [formData, setFormData] = useState({
    patientName: initialData.patientName || '',
    patientId: initialData.patientId || `P-${Math.floor(1000 + Math.random() * 9000)}`,
    doctorName: initialData.doctorName || 'Diabetes Care Team',
    protocolName: initialData.protocolName || 'Targeted Glycemic Stabilization Protocol',
    diagnosis: initialData.diagnosis || 'Type 2 Diabetes Mellitus',
    targetGlucose: initialData.targetGlucose || '80–130 mg/dL',
    targetA1c: initialData.targetA1c || '< 6.5%',
    durationWeeks: initialData.durationWeeks || '12 Weeks',
    phase: initialData.phase || 'Phase 2: Active Intervention',
    procedures: initialData.procedures || [
      {
        id: 'proc-1',
        title: 'Pharmacotherapy Titration — Metformin & SGLT2i',
        description: 'Take 500mg Metformin with breakfast and dinner. Monitor fasting glucose and renal markers.',
        category: 'Medication Management',
        priority: 'High Priority',
      },
      {
        id: 'proc-2',
        title: 'Daily 30-Min Postprandial Walking Regimen',
        description: 'Brisk walk 20 minutes after lunch to stimulate GLUT4 glucose uptake.',
        category: 'Lifestyle Medicine',
        priority: 'Medium Priority',
      },
    ],
    medications: initialData.medications || [
      { name: 'Metformin Hydrochloride', dosage: '500 mg', frequency: 'Twice daily with meals', status: 'Active' },
      { name: 'Empagliflozin (Jardiance)', dosage: '10 mg', frequency: 'Once daily with breakfast', status: 'Active' },
    ],
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        patientName: initialData.patientName || '',
        patientId: initialData.patientId || `P-${Math.floor(1000 + Math.random() * 9000)}`,
        doctorName: initialData.doctorName || 'Diabetes Care Team',
        protocolName: initialData.protocolName || 'Targeted Glycemic Stabilization Protocol',
        diagnosis: initialData.diagnosis || 'Type 2 Diabetes Mellitus',
        targetGlucose: initialData.targetGlucose || '80–130 mg/dL',
        targetA1c: initialData.targetA1c || '< 6.5%',
        durationWeeks: initialData.durationWeeks || '12 Weeks',
        phase: initialData.phase || 'Phase 2: Active Intervention',
        procedures: initialData.procedures || [
          {
            id: 'proc-1',
            title: 'Pharmacotherapy Titration — Metformin & SGLT2i',
            description: 'Take 500mg Metformin with breakfast and dinner. Monitor fasting glucose and renal markers.',
            category: 'Medication Management',
            priority: 'High Priority',
          },
          {
            id: 'proc-2',
            title: 'Daily 30-Min Postprandial Walking Regimen',
            description: 'Brisk walk 20 minutes after lunch to stimulate GLUT4 glucose uptake.',
            category: 'Lifestyle Medicine',
            priority: 'Medium Priority',
          },
        ],
        medications: initialData.medications || [
          { name: 'Metformin Hydrochloride', dosage: '500 mg', frequency: 'Twice daily with meals', status: 'Active' },
          { name: 'Empagliflozin (Jardiance)', dosage: '10 mg', frequency: 'Once daily with breakfast', status: 'Active' },
        ],
      })
    }
  }, [isOpen, initialData])

  const [newProcTitle, setNewProcTitle] = useState('')
  const [newProcDesc, setNewProcDesc] = useState('')
  const [newProcPriority, setNewProcPriority] = useState('High Priority')

  const [newMedName, setNewMedName] = useState('')
  const [newMedDosage, setNewMedDosage] = useState('')
  const [newMedFreq, setNewMedFreq] = useState('')

  if (!isOpen) return null

  const handleAddProcedure = () => {
    if (!newProcTitle.trim()) return
    setFormData((prev) => ({
      ...prev,
      procedures: [
        ...prev.procedures,
        {
          id: `proc-${Date.now()}`,
          title: newProcTitle.trim(),
          description: newProcDesc.trim() || 'Follow attending specialist instructions.',
          category: 'Clinical Protocol',
          priority: newProcPriority,
        },
      ],
    }))
    setNewProcTitle('')
    setNewProcDesc('')
  }

  const handleRemoveProcedure = (id) => {
    setFormData((prev) => ({
      ...prev,
      procedures: prev.procedures.filter((p) => p.id !== id),
    }))
  }

  const handleAddMedication = () => {
    if (!newMedName.trim()) return
    setFormData((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          name: newMedName.trim(),
          dosage: newMedDosage.trim() || 'Standard Dose',
          frequency: newMedFreq.trim() || 'Daily with meals',
          status: 'Active',
        },
      ],
    }))
    setNewMedName('')
    setNewMedDosage('')
    setNewMedFreq('')
  }

  const handleRemoveMedication = (index) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const created = createTreatmentPlan({
      ...formData,
      status: 'Approved',
      pharmacotherapy: formData.medications.map((m) => `${m.name} ${m.dosage}`).join(', ') || 'Custom Pharmacotherapy',
      tags: formData.procedures.map((p) => p.title.slice(0, 24)),
    })
    if (onCreated) onCreated(created)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
              <ClipboardPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Create Custom Treatment Plan
              </h2>
              <p className="text-xs text-slate-400">
                Formulate personalized procedures, targets, and prescriptions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5 text-xs">
          {/* Patient & Doctor Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Patient Name
              </label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="e.g. John Miller"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Patient ID
              </label>
              <input
                type="text"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Protocol Name & Diagnosis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Treatment Protocol Name
              </label>
              <input
                type="text"
                value={formData.protocolName}
                onChange={(e) => setFormData({ ...formData, protocolName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Clinical Diagnosis
              </label>
              <input
                type="text"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Targets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Target Fasting Glucose
              </label>
              <input
                type="text"
                value={formData.targetGlucose}
                onChange={(e) => setFormData({ ...formData, targetGlucose: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Target HbA1c
              </label>
              <input
                type="text"
                value={formData.targetA1c}
                onChange={(e) => setFormData({ ...formData, targetA1c: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Duration
              </label>
              <input
                type="text"
                value={formData.durationWeeks}
                onChange={(e) => setFormData({ ...formData, durationWeeks: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Clinical Procedures Builder */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">
              Clinical Procedures & Interventions ({formData.procedures.length})
            </h3>

            {/* List of current procedures */}
            <div className="space-y-2 mb-3">
              {formData.procedures.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {idx + 1}. {p.title}
                    </span>
                    <span className="ml-2 rounded-md bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {p.priority}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {p.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProcedure(p.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new procedure inline inputs */}
            <div className="rounded-xl border border-dashed border-slate-200 p-3 bg-slate-50/30 dark:border-slate-700 dark:bg-slate-800/20 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Procedure / Intervention title"
                  value={newProcTitle}
                  onChange={(e) => setNewProcTitle(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white p-2 font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <select
                  value={newProcPriority}
                  onChange={(e) => setNewProcPriority(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white p-2 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option>High Priority</option>
                  <option>Medium Priority</option>
                  <option>Routine</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Clinical instructions / procedure description"
                  value={newProcDesc}
                  onChange={(e) => setNewProcDesc(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white p-2 font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={handleAddProcedure}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 text-white px-3 py-2 text-xs font-semibold hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Medications Builder */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">
              Medications & Dosage ({formData.medications.length})
            </h3>

            <div className="space-y-1.5 mb-3">
              {formData.medications.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-800/40"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {m.name} — <strong className="text-primary-600">{m.dosage}</strong> ({m.frequency})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Medication name"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <input
                type="text"
                placeholder="Dosage (e.g. 500 mg)"
                value={newMedDosage}
                onChange={(e) => setNewMedDosage(e.target.value)}
                className="w-28 rounded-lg border border-slate-200 bg-white p-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={handleAddMedication}
                className="rounded-lg bg-slate-900 text-white px-3 py-2 text-xs font-semibold hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              Authorize & Save Treatment Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default TreatmentPlanCreateModal
