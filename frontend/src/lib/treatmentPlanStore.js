const STORAGE_KEY = 'des_treatment_plans_v1'

const INITIAL_TREATMENT_PLANS = [
  {
    id: 'tp-101',
    patientId: 'P001',
    patientName: 'Marin Jabri',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'Approved',
    doctorName: 'Dr. Marco Rossi',
    doctorRole: 'Lead Endocrinologist',
    createdAt: '2024-03-01',
    startDate: '2024-03-15',
    estimatedEnd: '2024-06-15',
    protocolName: 'Intensive Glycemic Stabilization & Reversal Protocol',
    diagnosis: 'Type 2 Diabetes Mellitus (High Risk Baseline)',
    targetGlucose: '80–130 mg/dL',
    targetA1c: '< 6.5%',
    pharmacotherapy: 'Metformin 500mg BID + Empagliflozin 10mg',
    adherenceRate: '94%',
    durationWeeks: '12 Weeks',
    phase: 'Phase 2: Active Intervention',
    tags: ['Metformin Titration', 'Postprandial 30m Walk', 'Low-GI Diet', 'Renal Screening'],
    procedures: [
      {
        id: 'proc-1',
        title: 'Pharmacotherapy Titration — Metformin & SGLT2i',
        description: 'Gradual dose escalation of Metformin to 500mg BID with breakfast and dinner. Add Empagliflozin 10mg once daily to enhance urinary glucose excretion while monitoring renal tolerance.',
        category: 'Medication Management',
        priority: 'High Priority',
        scheduledDate: '2024-03-15',
        status: 'In Progress',
      },
      {
        id: 'proc-2',
        title: 'Supervised Aerobic & Resistance Cardio Regimen',
        description: '150 minutes per week of moderate-intensity aerobic exercise (e.g. 30-min postprandial brisk walks 5 days/wk) paired with twice-weekly low-impact resistance training.',
        category: 'Lifestyle Medicine',
        priority: 'Medium Priority',
        scheduledDate: '2024-03-18',
        status: 'Active',
      },
      {
        id: 'proc-3',
        title: 'Comprehensive Diabetic Retinal & Microvascular Screening',
        description: 'Dilated eye fundus photography and visual acuity test to detect early signs of diabetic microvascular retinopathy.',
        category: 'Preventive Diagnostics',
        priority: 'Medium Priority',
        scheduledDate: '2024-04-10',
        status: 'Scheduled',
      },
    ],
    medications: [
      { name: 'Metformin Hydrochloride', dosage: '500 mg', frequency: 'Twice daily with meals', status: 'Active' },
      { name: 'Empagliflozin (Jardiance)', dosage: '10 mg', frequency: 'Once daily in the morning', status: 'Active' },
      { name: 'Lisinopril', dosage: '10 mg', frequency: 'Once daily at bedtime', status: 'Active' },
    ],
    milestones: [
      { title: 'Baseline Metabolic Profiling', date: 'Week 1', completed: true },
      { title: 'Fasting Glucose Stabilization (<130 mg/dL)', date: 'Week 4', completed: true },
      { title: 'Mid-term Physician Check-in & Lab Review', date: 'Week 6', completed: false },
      { title: 'Target HbA1c Milestone Assessment (<6.5%)', date: 'Week 12', completed: false },
    ],
  },
  {
    id: 'tp-102',
    patientId: 'P002',
    patientName: 'Giovanni Verdi',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'Approved',
    doctorName: 'Dr. Marco Rossi',
    doctorRole: 'Lead Endocrinologist',
    createdAt: '2024-03-05',
    startDate: '2024-03-10',
    estimatedEnd: '2024-09-10',
    protocolName: 'Basal Insulin Optimization & Cardiovascular Protection',
    diagnosis: 'Type 2 Diabetes with Metabolic Syndrome',
    targetGlucose: '90–140 mg/dL',
    targetA1c: '< 7.0%',
    pharmacotherapy: 'Glargine U-100 + Metformin 1000mg',
    adherenceRate: '88%',
    durationWeeks: '24 Weeks',
    phase: 'Phase 1: Stabilization',
    tags: ['Basal Insulin Titration', 'Cardiovascular Monitoring', 'Daily Glucose Log'],
    procedures: [
      {
        id: 'proc-1',
        title: 'Insulin Glargine Bedtime Titration Algorithm',
        description: 'Commence 10 units Insulin Glargine at 22:00. Titrate by 2 units every 3 days if fasting glucose remains above 140 mg/dL without nocturnal hypoglycemia.',
        category: 'Insulin Therapy',
        priority: 'High Priority',
        scheduledDate: '2024-03-10',
        status: 'In Progress',
      },
      {
        id: 'proc-2',
        title: 'Continuous Glucose Monitoring (CGM) Sensor Placement',
        description: 'Apply 14-day Freestyle Libre / Dexcom sensor to record postprandial glycemic variability and nocturnal dips.',
        category: 'Diagnostic Monitoring',
        priority: 'High Priority',
        scheduledDate: '2024-03-12',
        status: 'Completed',
      },
    ],
    medications: [
      { name: 'Insulin Glargine (Lantus)', dosage: '14 Units', frequency: 'Once daily at bedtime', status: 'Active' },
      { name: 'Metformin Extended Release', dosage: '1000 mg', frequency: 'Once daily with dinner', status: 'Active' },
      { name: 'Atorvastatin', dosage: '20 mg', frequency: 'Once daily at bedtime', status: 'Active' },
    ],
    milestones: [
      { title: 'Fasting Titration Target Met', date: 'Week 2', completed: true },
      { title: 'Hypoglycemia Prevention Assessment', date: 'Week 4', completed: false },
      { title: 'Quarterly HbA1c Lab Verification', date: 'Week 12', completed: false },
    ],
  },
  {
    id: 'tp-103',
    patientId: 'P-1042',
    patientName: 'John Patient',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    status: 'Approved',
    doctorName: 'Dr. Lina',
    doctorRole: 'Attending Endocrinologist',
    createdAt: '2024-03-15',
    startDate: '2024-03-20',
    estimatedEnd: '2024-06-20',
    protocolName: 'Targeted Glycemic Control & Lifestyle Care Protocol',
    diagnosis: 'Type 2 Diabetes Mellitus — Lifestyle Guidance Recommended',
    targetGlucose: '80–130 mg/dL',
    targetA1c: '< 6.5%',
    pharmacotherapy: 'Metformin 500mg BID + Lisinopril 10mg',
    adherenceRate: '96%',
    durationWeeks: '12 Weeks',
    phase: 'Phase 2: Active Intervention',
    tags: ['Metformin 500mg', 'Brisk Walking 30m', 'Diabetic Foot Care', 'HbA1c Lab'],
    procedures: [
      {
        id: 'proc-1',
        title: 'Morning Antihyperglycemic Medication & Timing',
        description: 'Metformin 500mg taken immediately after breakfast with a full glass of water. Promotes hepatic insulin sensitivity and reduces post-meal blood sugar surges.',
        category: 'Pharmacotherapy',
        priority: 'High Priority',
        scheduledDate: '2024-03-20',
        status: 'In Progress',
      },
      {
        id: 'proc-2',
        title: 'Postprandial Exercise & Muscle Glucose Uptake',
        description: 'Engage in a 30-minute brisk walk daily 20–30 minutes following your largest meal to stimulate GLUT4 translocation independent of insulin.',
        category: 'Physical Therapy & Cardio',
        priority: 'Medium Priority',
        scheduledDate: '2024-03-21',
        status: 'Active',
      },
      {
        id: 'proc-3',
        title: 'Diabetic Foot & Skin Self-Examination Protocol',
        description: 'Nightly inspection of feet and interdigital spaces for erythema, calluses, or pressure points. Apply urea-based moisturizer and avoid barefoot walking.',
        category: 'Preventive Care',
        priority: 'Medium Priority',
        scheduledDate: '2024-03-22',
        status: 'Active',
      },
      {
        id: 'proc-4',
        title: 'Comprehensive HbA1c Lab Panel Verification',
        description: 'Blood draw at diagnostic pathology to evaluate 90-day average blood glucose and adjust medication dosage accordingly.',
        category: 'Lab Diagnostics',
        priority: 'Routine',
        scheduledDate: '2024-05-15',
        status: 'Scheduled',
      },
    ],
    medications: [
      { name: 'Metformin Hydrochloride', dosage: '500 mg', frequency: 'Twice daily with meals', status: 'Active' },
      { name: 'Lisinopril', dosage: '10 mg', frequency: 'Once daily in the morning', status: 'Active' },
      { name: 'Empagliflozin (Jardiance)', dosage: '10 mg', frequency: 'Once daily in the morning', status: 'Active' },
    ],
    milestones: [
      { title: 'Care Protocol Hand-off & Education', date: 'Day 1', completed: true },
      { title: 'Morning Fasting Glucose Target (80-130)', date: 'Day 7', completed: true },
      { title: 'Mid-Intervention Glycemic Review', date: 'Day 14', completed: true },
      { title: 'Comprehensive 90-Day Lab Panel', date: 'Day 30', completed: false },
    ],
  },
]

export function getTreatmentPlans() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TREATMENT_PLANS))
      return INITIAL_TREATMENT_PLANS
    }
    return JSON.parse(stored)
  } catch (err) {
    console.error('Failed to load treatment plans:', err)
    return INITIAL_TREATMENT_PLANS
  }
}

export function saveTreatmentPlans(plans) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
  } catch (err) {
    console.error('Failed to save treatment plans:', err)
  }
}

export function getTreatmentPlanById(id) {
  const plans = getTreatmentPlans()
  return plans.find((p) => p.id === id) || null
}

export function getTreatmentPlanForUser(userName, userEmail) {
  const plans = getTreatmentPlans()
  const cleanName = (userName || '').toLowerCase().trim()
  const cleanEmail = (userEmail || '').toLowerCase().trim()

  if (!cleanName && !cleanEmail) return null

  // 1. Direct or partial match with patient name or email
  const matched = plans.find(
    (p) =>
      (cleanName && p.patientName && p.patientName.toLowerCase().trim() === cleanName) ||
      (cleanEmail && p.patientEmail && p.patientEmail.toLowerCase().trim() === cleanEmail)
  )
  if (matched) return matched

  // 2. Demo fallback only for specific seeded demo account 'john patient'
  if (cleanName === 'john patient' || cleanEmail === 'john.patient@example.com') {
    return plans.find((p) => p.patientId === 'P-1042') || null
  }

  // 3. User without an assigned treatment plan
  return null
}

export function createTreatmentPlan(planData) {
  const plans = getTreatmentPlans()
  const newPlan = {
    id: `tp-${Date.now()}`,
    patientId: planData.patientId || `P-${Math.floor(1000 + Math.random() * 9000)}`,
    patientName: planData.patientName || 'Patient',
    avatar: planData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    status: planData.status || 'Approved',
    doctorName: planData.doctorName || 'Diabetes Care Team',
    doctorRole: planData.doctorRole || 'Attending Physician',
    createdAt: new Date().toISOString().split('T')[0],
    startDate: planData.startDate || new Date().toISOString().split('T')[0],
    estimatedEnd: planData.estimatedEnd || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    protocolName: planData.protocolName || 'Custom Personalized Diabetes Care Plan',
    diagnosis: planData.diagnosis || 'Type 2 Diabetes Clinical Management',
    targetGlucose: planData.targetGlucose || '80–130 mg/dL',
    targetA1c: planData.targetA1c || '< 6.5%',
    pharmacotherapy: planData.pharmacotherapy || 'Metformin 500mg BID',
    adherenceRate: '100%',
    durationWeeks: planData.durationWeeks || '12 Weeks',
    phase: planData.phase || 'Phase 2: Active Intervention',
    tags: planData.tags || ['Pharmacotherapy', 'Lifestyle Cardio', 'Glucose Monitoring'],
    procedures: planData.procedures || [
      {
        id: 'proc-1',
        title: 'Pharmacotherapy Administration',
        description: 'Adhere to daily prescribed medications with breakfast and dinner.',
        category: 'Medication',
        priority: 'High Priority',
        scheduledDate: new Date().toISOString().split('T')[0],
        status: 'Active',
      },
      {
        id: 'proc-2',
        title: 'Daily Postprandial Exercise',
        description: '30 minutes of aerobic exercise after lunch to lower post-meal glucose spikes.',
        category: 'Lifestyle',
        priority: 'Medium Priority',
        scheduledDate: new Date().toISOString().split('T')[0],
        status: 'Active',
      },
    ],
    medications: planData.medications || [
      { name: 'Metformin Hydrochloride', dosage: '500 mg', frequency: 'Twice daily with meals', status: 'Active' },
    ],
    milestones: planData.milestones || [
      { title: 'Treatment Plan Initiated', date: 'Week 1', completed: true },
      { title: 'Fasting Glucose Target Met', date: 'Week 4', completed: false },
      { title: 'Comprehensive 90-Day Lab Panel', date: 'Week 12', completed: false },
    ],
  }

  const updated = [newPlan, ...plans]
  saveTreatmentPlans(updated)
  return newPlan
}

export function updateTreatmentPlan(id, updates) {
  const plans = getTreatmentPlans()
  const idx = plans.findIndex((p) => p.id === id)
  if (idx === -1) return null

  plans[idx] = { ...plans[idx], ...updates }
  saveTreatmentPlans(plans)
  return plans[idx]
}
