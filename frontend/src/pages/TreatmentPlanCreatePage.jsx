import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Pill,
  Plus,
  Save,
  Shield,
  Sparkles,
  Stethoscope,
  Trash2,
  User,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { notify } from '@/lib/toast'
import { createTreatmentPlan } from '@/lib/treatmentPlanStore'

export const KNOWLEDGE_BASE_PROTOCOLS = [
  {
    id: 'kb-t2d-glycemic',
    name: 'Targeted Glycemic Stabilization Protocol',
    badge: 'T2D Standard Protocol',
    ruleRef: 'Knowledge Base Rule R-T2D-MET-01 (ADA/EASD)',
    diagnosis: 'Type 2 Diabetes Mellitus',
    targetGlucose: '80–130 mg/dL',
    targetA1c: '< 6.5%',
    durationWeeks: '12 Weeks',
    phase: 'Phase 2: Active Intervention',
    procedures: [
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
        description: 'Brisk walk 20 minutes after lunch to stimulate GLUT4 glucose uptake independent of insulin.',
        category: 'Lifestyle Medicine',
        priority: 'Medium Priority',
      },
      {
        id: 'proc-3',
        title: 'Diabetic Foot & Skin Self-Examination Protocol',
        description: 'Nightly inspection of feet and interdigital spaces. Apply urea moisturizer and avoid barefoot walking.',
        category: 'Preventive Diagnostics',
        priority: 'Medium Priority',
      },
    ],
    medications: [
      { name: 'Metformin Hydrochloride', dosage: '500 mg', frequency: 'Twice daily with meals', status: 'Active' },
      { name: 'Empagliflozin (Jardiance)', dosage: '10 mg', frequency: 'Once daily with breakfast', status: 'Active' },
      { name: 'Lisinopril', dosage: '10 mg', frequency: 'Once daily at bedtime', status: 'Active' },
    ],
    milestones: [
      { title: 'Treatment Protocol Initiation & Patient Hand-off', date: 'Week 1', completed: true },
      { title: 'Morning Fasting Glucose Target Met (<130 mg/dL)', date: 'Week 4', completed: false },
      { title: 'Mid-term Physician Review & Prescription Check', date: 'Week 6', completed: false },
      { title: 'Quarterly HbA1c Lab Verification (<6.5%)', date: 'Week 12', completed: false },
    ],
  },
  {
    id: 'kb-insulin-escalation',
    name: 'Basal Insulin Optimization & Titration Protocol',
    badge: 'Insulin Escalation',
    ruleRef: 'Knowledge Base Rule R-T2D-INS-01 (Clinical Escalation)',
    diagnosis: 'Type 2 Diabetes with Severe Hyperglycemia',
    targetGlucose: '90–140 mg/dL',
    targetA1c: '< 7.0%',
    durationWeeks: '24 Weeks',
    phase: 'Phase 1: Stabilization',
    procedures: [
      {
        id: 'proc-1',
        title: 'Insulin Glargine Bedtime Titration Algorithm',
        description: 'Commence 10 units Insulin Glargine at 22:00. Titrate by 2 units every 3 days if fasting glucose remains above 140 mg/dL without nocturnal hypoglycemia.',
        category: 'Insulin Therapy',
        priority: 'High Priority',
      },
      {
        id: 'proc-2',
        title: 'Continuous Glucose Monitoring (CGM) Sensor Placement',
        description: 'Apply continuous glucose monitoring sensor to record postprandial glycemic variability and nocturnal dips.',
        category: 'Diagnostic Monitoring',
        priority: 'High Priority',
      },
      {
        id: 'proc-3',
        title: 'Rule-of-15 Hypoglycemia Countermeasure Drill',
        description: 'Patient education on consuming 15g fast-acting carbohydrate if glucose drops below 70 mg/dL and re-checking in 15 mins.',
        category: 'Safety & Emergency',
        priority: 'High Priority',
      },
    ],
    medications: [
      { name: 'Insulin Glargine U-100', dosage: '10 Units', frequency: 'Subcutaneously once daily at bedtime (22:00)', status: 'Active' },
      { name: 'Metformin Hydrochloride', dosage: '1000 mg', frequency: 'Twice daily with meals', status: 'Active' },
      { name: 'Atorvastatin', dosage: '20 mg', frequency: 'Once daily at bedtime', status: 'Active' },
    ],
    milestones: [
      { title: 'Basal Insulin Initiation & Injection Technique Audit', date: 'Week 1', completed: true },
      { title: 'Fasting Titration Target Met without Hypoglycemia', date: 'Week 4', completed: false },
      { title: 'CGM Sensor Glycemic Profiling Review', date: 'Week 8', completed: false },
      { title: 'Comprehensive HbA1c & Renal Function Review', date: 'Week 24', completed: false },
    ],
  },
  {
    id: 'kb-gdm-iadpsg',
    name: 'Gestational Diabetes Mellitus (GDM) Protocol',
    badge: 'Obstetric GDM',
    ruleRef: 'Knowledge Base Rule R-GDM-IADPSG (Pregnancy Glycemic Engine)',
    diagnosis: 'Gestational Diabetes Mellitus (GDM)',
    targetGlucose: 'Fasting < 95 mg/dL, 1h Postprandial < 140 mg/dL',
    targetA1c: '< 6.0%',
    durationWeeks: '12 Weeks',
    phase: 'Phase 1: Active Obstetric Management',
    procedures: [
      {
        id: 'proc-1',
        title: '4x Daily Self-Monitoring of Blood Glucose (SMBG)',
        description: 'Test fasting upon waking, plus 1 hour after breakfast, lunch, and dinner. Target fasting <95 mg/dL, 1h post-meal <140 mg/dL.',
        category: 'Diagnostic Monitoring',
        priority: 'High Priority',
      },
      {
        id: 'proc-2',
        title: 'Medical Nutrition Therapy (MNT) with Low Glycemic Load',
        description: 'Personalized carbohydrate distribution (175g/day minimum) spread across 3 main meals and 2-3 snacks to prevent ketonuria.',
        category: 'Lifestyle Medicine',
        priority: 'High Priority',
      },
      {
        id: 'proc-3',
        title: 'Fetal Growth Biometry & Amniotic Fluid Index Surveillance',
        description: 'Ultrasound assessment every 3-4 weeks to monitor abdominal circumference and prevent macrosomia.',
        category: 'Obstetric Care',
        priority: 'Medium Priority',
      },
    ],
    medications: [
      { name: 'Prenatal Multivitamin with Folic Acid', dosage: 'Standard Dose', frequency: 'Once daily with breakfast', status: 'Active' },
      { name: 'Insulin Aspart / Lispro (If Indicated)', dosage: '4 Units', frequency: 'Before meals if postprandial >140 mg/dL', status: 'Active' },
    ],
    milestones: [
      { title: 'MNT Initiation & Nutritional Diary Review', date: 'Week 1', completed: true },
      { title: 'Fasting & Postprandial Glucose Target Verification', date: 'Week 3', completed: false },
      { title: 'Fetal Growth Ultrasound Check', date: 'Week 6', completed: false },
      { title: 'Obstetric Delivery Plan & 6-Week Postpartum OGTT Scheduling', date: 'Week 12', completed: false },
    ],
  },
  {
    id: 'kb-cardio-renal',
    name: 'Cardio-Renal Risk Reduction & SGLT2i Protocol',
    badge: 'Cardio-Renal Protection',
    ruleRef: 'Knowledge Base Rule R-T2D-CKD-01 (Renoprotective Care)',
    diagnosis: 'Type 2 Diabetes with Albuminuria / Cardiorenal Risk',
    targetGlucose: '80–130 mg/dL',
    targetA1c: '< 6.5%',
    durationWeeks: '16 Weeks',
    phase: 'Phase 2: Active Intervention',
    procedures: [
      {
        id: 'proc-1',
        title: 'Renoprotective Titration & Serum Potassium Surveillance',
        description: 'Initiate ACEi/ARB therapy. Re-check serum creatinine, eGFR, and electrolytes 2 to 4 weeks after initiation or dose changes.',
        category: 'Medication Management',
        priority: 'High Priority',
      },
      {
        id: 'proc-2',
        title: 'Serial Urinary Albumin-to-Creatinine Ratio (uACR) Tracking',
        description: 'Monitor early morning first-void urine uACR to gauge reduction in glomerular hyperfiltration and microalbuminuria.',
        category: 'Preventive Diagnostics',
        priority: 'Medium Priority',
      },
      {
        id: 'proc-3',
        title: 'Sodium & Dietary Protein Moderation Plan',
        description: 'Restrict dietary sodium to <2,300 mg/day and maintain moderate protein intake (0.8 g/kg/day) to reduce glomerular pressure.',
        category: 'Lifestyle Medicine',
        priority: 'Medium Priority',
      },
    ],
    medications: [
      { name: 'Empagliflozin (Jardiance)', dosage: '10 mg', frequency: 'Once daily with breakfast', status: 'Active' },
      { name: 'Lisinopril', dosage: '20 mg', frequency: 'Once daily at bedtime', status: 'Active' },
      { name: 'Metformin Extended-Release', dosage: '500 mg', frequency: 'Once daily with dinner', status: 'Active' },
    ],
    milestones: [
      { title: 'Cardiorenal Baseline Labs (uACR, eGFR, K+)', date: 'Week 1', completed: true },
      { title: 'Electrolyte & Renal Marker Stability Confirmation', date: 'Week 4', completed: false },
      { title: 'Blood Pressure Target Stabilized (<130/80 mmHg)', date: 'Week 8', completed: false },
      { title: 'Follow-up uACR Reduction Verification', date: 'Week 16', completed: false },
    ],
  },
]

export function TreatmentPlanCreatePage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  const initialData = location.state?.initialData || {}

  // Authorization is capability-based. Custom roles should work exactly like
  // built-in roles when the administrator grants this permission.
  const canManageTreatmentPlans = user?.permissions?.includes('treatment_plan.manage')

  useEffect(() => {
    if (user && !canManageTreatmentPlans) {
      notify.error('Access restricted: Treatment plans can only be created by attending doctors or knowledge base staff.')
      navigate('/unauthorized', { replace: true })
    }
  }, [user, canManageTreatmentPlans, navigate])

  const getDefaultDoctorName = () => {
    if (initialData.doctorName) return initialData.doctorName
    if (user?.permissions?.includes('diagnosis.review_any')) {
      return user.name?.startsWith('Dr.') ? user.name : `Dr. ${user.name}`
    }
    if (user?.permissions?.includes('treatment_plan.manage')) {
      return user.name || 'Dr. Marco Rossi'
    }
    return 'Dr. Marco Rossi'
  }

  const [selectedKBProtocolId, setSelectedKBProtocolId] = useState(
    initialData.protocolName ? null : 'kb-t2d-glycemic'
  )

  const [formData, setFormData] = useState({
    patientName: initialData.patientName || '',
    patientId: initialData.patientId || `P-${Math.floor(1000 + Math.random() * 9000)}`,
    doctorName: getDefaultDoctorName(),
    doctorRole: initialData.doctorRole || (user?.permissions?.includes('diagnosis.review_any') ? 'Attending Physician' : 'Lead Endocrinologist'),
    protocolName: initialData.protocolName || 'Targeted Glycemic Stabilization Protocol',
    diagnosis: initialData.diagnosis || 'Type 2 Diabetes Mellitus',
    targetGlucose: initialData.targetGlucose || '80–130 mg/dL',
    targetA1c: initialData.targetA1c || '< 6.5%',
    durationWeeks: initialData.durationWeeks || '12 Weeks',
    phase: initialData.phase || 'Phase 2: Active Intervention',
    startDate: initialData.startDate || new Date().toISOString().split('T')[0],
    procedures: initialData.procedures || [
      {
        id: 'proc-1',
        title: 'Pharmacotherapy Titration — Metformin & SGLT2i',
        description: 'Take 500mg Metformin with breakfast and dinner. Monitor fasting glucose and renal markers.',
        category: 'Medication Management',
        priority: 'High Priority',
        scheduledDate: new Date().toISOString().split('T')[0],
      },
      {
        id: 'proc-2',
        title: 'Daily 30-Min Postprandial Walking Regimen',
        description: 'Brisk walk 20 minutes after lunch to stimulate GLUT4 glucose uptake independent of insulin.',
        category: 'Lifestyle Medicine',
        priority: 'Medium Priority',
        scheduledDate: new Date().toISOString().split('T')[0],
      },
      {
        id: 'proc-3',
        title: 'Diabetic Foot & Skin Self-Examination Protocol',
        description: 'Nightly inspection of feet and interdigital spaces. Apply urea moisturizer and avoid barefoot walking.',
        category: 'Preventive Diagnostics',
        priority: 'Medium Priority',
        scheduledDate: new Date().toISOString().split('T')[0],
      },
    ],
    medications: initialData.medications || [
      { name: 'Metformin Hydrochloride', dosage: '500 mg', frequency: 'Twice daily with meals', status: 'Active' },
      { name: 'Empagliflozin (Jardiance)', dosage: '10 mg', frequency: 'Once daily with breakfast', status: 'Active' },
      { name: 'Lisinopril', dosage: '10 mg', frequency: 'Once daily at bedtime', status: 'Active' },
    ],
    milestones: initialData.milestones || [
      { title: 'Treatment Protocol Initiation & Patient Hand-off', date: 'Week 1', completed: true },
      { title: 'Morning Fasting Glucose Target Met (<130 mg/dL)', date: 'Week 4', completed: false },
      { title: 'Mid-term Physician Review & Prescription Check', date: 'Week 6', completed: false },
      { title: 'Quarterly HbA1c Lab Verification (<6.5%)', date: 'Week 12', completed: false },
    ],
  })

  // State for new procedure input
  const [newProcTitle, setNewProcTitle] = useState('')
  const [newProcDesc, setNewProcDesc] = useState('')
  const [newProcCategory, setNewProcCategory] = useState('Medication Management')
  const [newProcPriority, setNewProcPriority] = useState('High Priority')

  // State for new medication input
  const [newMedName, setNewMedName] = useState('')
  const [newMedDosage, setNewMedDosage] = useState('')
  const [newMedFreq, setNewMedFreq] = useState('')

  // State for new milestone input
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [newMilestoneDate, setNewMilestoneDate] = useState('Week 8')

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
          category: newProcCategory,
          priority: newProcPriority,
          scheduledDate: new Date().toISOString().split('T')[0],
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
          frequency: newMedFreq.trim() || 'Once daily with meals',
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

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return
    setFormData((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          title: newMilestoneTitle.trim(),
          date: newMilestoneDate.trim() || 'Upcoming',
          completed: false,
        },
      ],
    }))
    setNewMilestoneTitle('')
  }

  const handleRemoveMilestone = (index) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }))
  }

  const handleSelectKBProtocol = (kbProto) => {
    setSelectedKBProtocolId(kbProto.id)
    setFormData((prev) => ({
      ...prev,
      protocolName: kbProto.name,
      diagnosis: kbProto.diagnosis,
      targetGlucose: kbProto.targetGlucose,
      targetA1c: kbProto.targetA1c,
      durationWeeks: kbProto.durationWeeks,
      phase: kbProto.phase,
      procedures: kbProto.procedures.map((p) => ({
        ...p,
        scheduledDate: new Date().toISOString().split('T')[0],
      })),
      medications: [...kbProto.medications],
      milestones: [...kbProto.milestones],
    }))
    notify.success(`Loaded Knowledge Base protocol: ${kbProto.name}`)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.patientName.trim()) {
      notify.error('Please enter patient name')
      return
    }

    createTreatmentPlan({
      ...formData,
      status: 'Approved',
      pharmacotherapy: formData.medications.map((m) => `${m.name} ${m.dosage}`).join(', ') || 'Custom Pharmacotherapy',
      tags: [
        ...formData.procedures.map((p) => p.title.slice(0, 24)),
        ...formData.medications.map((m) => m.name.slice(0, 20)),
      ].slice(0, 5),
    })

    notify.success('Treatment plan created successfully!')
    navigate('/treatment-plans')
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-150">
      {/* 1. TOP BREADCRUMB & HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/treatment-plans')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Treatment Plans</span>
          </button>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Create Custom Treatment Plan
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Doctor / Knowledge Base Formulation</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Formulate personalized clinical procedures, medication titration, and glycemic targets from expert knowledge base rules
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => navigate('/treatment-plans')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 active:scale-[0.98] transition dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            <Save className="h-4 w-4" />
            <span>Save & Publish Plan</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============================================================== */}
        {/* KNOWLEDGE BASE CLINICAL PROTOCOL PRESETS BANNER                */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-primary-200/80 bg-gradient-to-br from-primary-50/70 via-white to-sky-50/40 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-primary-900/40 dark:from-primary-950/30 dark:via-slate-900 dark:to-sky-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary-100/60 pb-3.5 dark:border-primary-900/30">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-xs dark:bg-primary-500">
                <BookOpen className="h-4.5 w-4.5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Knowledge Base Clinical Protocols
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-100/80 px-2 py-0.5 text-[10px] font-bold text-primary-800 dark:bg-primary-900/60 dark:text-primary-300">
                    <Sparkles className="h-3 w-3" />
                    <span>Expert Rules</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select an evidence-based clinical protocol from the Expert System Knowledge Base to auto-populate procedures and prescriptions.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 self-start sm:self-center">
              Attending Clinician: <span className="text-primary-600 dark:text-primary-400 font-bold">{formData.doctorName}</span>
            </span>
          </div>

          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {KNOWLEDGE_BASE_PROTOCOLS.map((kb) => {
              const isSelected = selectedKBProtocolId === kb.id
              return (
                <button
                  key={kb.id}
                  type="button"
                  onClick={() => handleSelectKBProtocol(kb)}
                  className={cn(
                    'relative rounded-xl p-3 text-left transition-all border flex flex-col justify-between gap-2',
                    isSelected
                      ? 'border-primary-500 bg-white shadow-sm ring-2 ring-primary-500/20 dark:bg-slate-900 dark:border-primary-400'
                      : 'border-slate-200/70 bg-white/60 hover:bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="rounded-md bg-primary-50 px-1.5 py-0.5 text-[9px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                        {kb.badge}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
                      )}
                    </div>
                    <h3 className="mt-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                      {kb.name}
                    </h3>
                  </div>

                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                    {kb.ruleRef}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ================================================================== */}
        {/* 2. MASTER 2-COLUMN GRID                                            */}
        {/* ================================================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* ================================================================ */}
          {/* LEFT COLUMN (7 cols): Patient Details, Targets & Procedures      */}
          {/* ================================================================ */}
          <div className="xl:col-span-7 space-y-6">
            {/* Card 1: Patient & Protocol Details */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
                  <User className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Patient & Clinical Protocol Baseline
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Primary medical identity and attending clinician details
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    placeholder="e.g. Marin Jabri"
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Patient ID
                  </label>
                  <input
                    type="text"
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs font-mono font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Treatment Protocol Name *
                  </label>
                  <input
                    type="text"
                    value={formData.protocolName}
                    onChange={(e) => setFormData({ ...formData, protocolName: e.target.value })}
                    placeholder="e.g. Intensive Glycemic Stabilization Protocol"
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Clinical Diagnosis
                  </label>
                  <input
                    type="text"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    placeholder="e.g. Type 2 Diabetes Mellitus"
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Attending Physician
                  </label>
                  <input
                    type="text"
                    value={formData.doctorName}
                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Protocol Duration
                  </label>
                  <select
                    value={formData.durationWeeks}
                    onChange={(e) => setFormData({ ...formData, durationWeeks: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
                  >
                    <option value="4 Weeks">4 Weeks (Initial Stabilization)</option>
                    <option value="8 Weeks">8 Weeks (Active Escalation)</option>
                    <option value="12 Weeks">12 Weeks (Comprehensive Protocol)</option>
                    <option value="24 Weeks">24 Weeks (Long-term Maintenance)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Target Glycemic Thresholds */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Activity className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Clinical Target Thresholds
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Fasting and glycosylated hemoglobin criteria
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50/60 p-3.5 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Fasting Blood Glucose
                  </label>
                  <input
                    type="text"
                    value={formData.targetGlucose}
                    onChange={(e) => setFormData({ ...formData, targetGlucose: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Normal guideline: 80–130 mg/dL</span>
                </div>

                <div className="rounded-xl bg-slate-50/60 p-3.5 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Target HbA1c Percentage
                  </label>
                  <input
                    type="text"
                    value={formData.targetA1c}
                    onChange={(e) => setFormData({ ...formData, targetA1c: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-primary-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">ADA guideline: &lt; 6.5% or &lt; 7.0%</span>
                </div>
              </div>
            </div>

            {/* Card 3: Clinical Procedures & Interventions Builder (Matching Mockup 2 format) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300">
                    <Stethoscope className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Treatment Procedures & Interventions ({formData.procedures.length})
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Numbered sequential instructions matching clinical care protocol
                    </p>
                  </div>
                </div>
              </div>

              {/* Numbered Procedure List */}
              <div className="space-y-3">
                {formData.procedures.map((proc, index) => (
                  <div
                    key={proc.id}
                    className="flex items-start gap-3.5 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-200 dark:border-slate-800 dark:bg-slate-800/30"
                  >
                    {/* Number Badge */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-xs font-extrabold text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          {proc.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                              proc.priority === 'High Priority'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/60 dark:text-rose-300'
                                : proc.priority === 'Medium Priority'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300'
                            )}
                          >
                            {proc.priority}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProcedure(proc.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition"
                            aria-label="Delete procedure"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {proc.description}
                      </p>

                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {proc.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline Add Procedure Box */}
              <div className="rounded-xl border border-dashed border-slate-200 p-4 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-primary-600" />
                  <span>Add New Procedure / Intervention</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={newProcTitle}
                      onChange={(e) => setNewProcTitle(e.target.value)}
                      placeholder="Procedure title (e.g. Diabetic Foot Microvascular Check)"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <select
                      value={newProcPriority}
                      onChange={(e) => setNewProcPriority(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="High Priority">High Priority</option>
                      <option value="Medium Priority">Medium Priority</option>
                      <option value="Routine">Routine</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={newProcDesc}
                      onChange={(e) => setNewProcDesc(e.target.value)}
                      placeholder="Clinical instructions & protocol steps"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <select
                      value={newProcCategory}
                      onChange={(e) => setNewProcCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="Medication Management">Medication Management</option>
                      <option value="Lifestyle Medicine">Lifestyle Medicine</option>
                      <option value="Preventive Diagnostics">Preventive Diagnostics</option>
                      <option value="Physical Therapy">Physical Therapy</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddProcedure}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Procedure</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* RIGHT COLUMN (5 cols): Medications & Milestones                   */}
          {/* ================================================================ */}
          <div className="xl:col-span-5 space-y-6">
            {/* Card 4: Pharmacotherapy & Prescription Schedule */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
                  <Pill className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Prescriptions ({formData.medications.length})
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Pharmacotherapy schedule and dosage instructions
                  </p>
                </div>
              </div>

              {/* Medication List */}
              <div className="space-y-2.5">
                {formData.medications.map((med, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/30"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {med.name}
                        </span>
                        <span className="font-bold text-primary-600 dark:text-primary-400 text-[11px]">
                          • {med.dosage}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {med.frequency}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      aria-label="Remove medication"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Inline Add Medication */}
              <div className="rounded-xl border border-dashed border-slate-200 p-3.5 dark:border-slate-700 bg-slate-50/30 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Add Medication
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    placeholder="Medication name"
                    className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    placeholder="Dosage (e.g. 500mg)"
                    className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMedFreq}
                    onChange={(e) => setNewMedFreq(e.target.value)}
                    placeholder="Frequency (e.g. Twice daily with meals)"
                    className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 shrink-0"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Card 5: Care Protocol Milestones */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
                  <Clock className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Protocol Milestones ({formData.milestones.length})
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Key glycemic progress checkpoints
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {formData.milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                        ✓
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {m.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-400 font-mono">
                        {m.date}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Milestone Inline */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  placeholder="Milestone title"
                  className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={newMilestoneDate}
                  onChange={(e) => setNewMilestoneDate(e.target.value)}
                  placeholder="Week / Date"
                  className="w-24 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 shrink-0"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Card 6: Physician Sign-off & Publish Card */}
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Ready for Clinical Activation
                </h3>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Publishing will make this protocol live for {formData.patientName || 'the patient'}, visible in their patient care plan portal with official physician sign-off.
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition"
              >
                <Check className="h-4 w-4" />
                <span>Save & Activate Protocol</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
export default TreatmentPlanCreatePage
