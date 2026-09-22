import { useState } from 'react'
import {
  Activity,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplets,
  FileText,
  Footprints,
  HeartPulse,
  MoreHorizontal,
  Pill,
  Sparkles,
  Stethoscope,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MiniSparkline } from '@/components/ui/MiniSparkline'

// ============================================================================
// 1. TODAY'S CARE GOALS (Inspired by the goals layout, styled like Dashboard)
// ============================================================================
export function CarePlanGoals({ t }) {
  const [goals, setGoals] = useState([
    {
      id: 'goal-glucose-am',
      title: 'Morning Fasting Glucose Check',
      time: '08:00 AM',
      target: 'Target: 80–130 mg/dL',
      category: 'glucose',
      completed: true,
      icon: Droplets,
      badgeColor: 'amber',
    },
    {
      id: 'goal-meds-am',
      title: 'Metformin 500mg (Morning Dose)',
      time: '08:30 AM',
      target: 'Take with breakfast & full glass of water',
      category: 'meds',
      completed: true,
      icon: Pill,
      badgeColor: 'sky',
    },
    {
      id: 'goal-exercise-pm',
      title: '30-Min Postprandial Walk',
      time: '12:30 PM',
      target: 'Aerobic activity to boost insulin uptake',
      category: 'activity',
      completed: false,
      icon: Footprints,
      badgeColor: 'emerald',
    },
    {
      id: 'goal-foot-pm',
      title: 'Diabetic Foot & Skin Examination',
      time: '08:00 PM',
      target: 'Check for pressure spots & maintain hydration',
      category: 'prevention',
      completed: false,
      icon: HeartPulse,
      badgeColor: 'rose',
    },
  ])

  const toggleGoal = (id) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    )
  }

  const completedCount = goals.filter((g) => g.completed).length
  const progressPercent = Math.round((completedCount / goals.length) * 100)

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-200 dark:border-slate-800 dark:bg-slate-900">
      {/* Card Header matching Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3.5 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Today's Care Goals
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily diabetes management tasks and health habits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {completedCount} of {goals.length} Completed ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Goal Items - Clean, seamless list with elegant hover and no harsh borders */}
      <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800/60">
        {goals.map((goal) => {
          const Icon = goal.icon
          const isDone = goal.completed

          return (
            <div
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                'group flex cursor-pointer items-center justify-between gap-3.5 py-3.5 px-3 rounded-xl transition-all duration-150',
                isDone
                  ? 'bg-slate-50/40 hover:bg-slate-50/80 dark:bg-slate-800/20 dark:hover:bg-slate-800/40'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
              )}
            >
              {/* Left: Category Icon + Title & Schedule */}
              <div className="flex items-center gap-3.5 min-w-0">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors shadow-2xs',
                    goal.badgeColor === 'amber' &&
                      'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
                    goal.badgeColor === 'sky' &&
                      'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300',
                    goal.badgeColor === 'emerald' &&
                      'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
                    goal.badgeColor === 'rose' &&
                      'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <div className="min-w-0">
                  <h3
                    className={cn(
                      'text-sm font-bold tracking-tight truncate transition-colors',
                      isDone
                        ? 'text-slate-600 dark:text-slate-300'
                        : 'text-slate-900 dark:text-slate-100'
                    )}
                  >
                    {goal.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {goal.time}
                    </span>{' '}
                    • {goal.target}
                  </p>
                </div>
              </div>

              {/* Right: Status Pill Button (Clean, no harsh thick borders) */}
              <div className="shrink-0">
                {isDone ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors dark:bg-emerald-950/50 dark:text-emerald-300">
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Completed</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors group-hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700/80">
                    <span>Scheduled</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ============================================================================
// 2. PRESCRIBED MEDICATIONS TABLE (Inspired by meds layout, styled like Dashboard)
// ============================================================================
export function CarePlanMedications({ t }) {
  const [meds, setMeds] = useState([
    {
      id: 'med-1',
      name: 'Metformin Hydrochloride (Glucophage)',
      schedule: '08:00 AM (Breakfast) & 07:00 PM (Dinner)',
      dosage: '500 mg',
      instructions: 'Take with food to minimize GI effects',
      category: 'Antihyperglycemic',
      taken: true,
    },
    {
      id: 'med-2',
      name: 'Lisinopril (Zestril)',
      schedule: '08:00 AM (Morning dose)',
      dosage: '10 mg',
      instructions: 'Blood pressure & kidney microvascular protection',
      category: 'ACE Inhibitor',
      taken: true,
    },
    {
      id: 'med-3',
      name: 'Empagliflozin (Jardiance)',
      schedule: '08:00 AM (Once daily)',
      dosage: '10 mg',
      instructions: 'Promotes urinary glucose excretion (SGLT2i)',
      category: 'SGLT2 Inhibitor',
      taken: false,
    },
  ])

  const toggleMed = (id) => {
    setMeds((prev) =>
      prev.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m))
    )
  }

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-200 dark:border-slate-800 dark:bg-slate-900">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3.5 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Prescribed Medications
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Active pharmacotherapy regimen and dosing schedule
          </p>
        </div>

        <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">
          Rx ACTIVE
        </span>
      </div>

      {/* Table Structure */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
              <th className="py-2.5 font-bold">Medication & Timing</th>
              <th className="py-2.5 font-bold">Dosage</th>
              <th className="py-2.5 font-bold hidden sm:table-cell">Instructions</th>
              <th className="py-2.5 text-right font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {meds.map((med) => (
              <tr
                key={med.id}
                className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-3.5 pr-3">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {med.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{med.schedule}</span>
                  </p>
                </td>
                <td className="py-3.5 pr-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                  {med.dosage}
                </td>
                <td className="py-3.5 pr-3 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell max-w-xs leading-relaxed">
                  {med.instructions}
                </td>
                <td className="py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => toggleMed(med.id)}
                    aria-label={`Mark ${med.name} as ${med.taken ? 'not taken' : 'taken'}`}
                    className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-150 shadow-2xs',
                      med.taken
                        ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                        : 'border-slate-300 bg-white hover:border-emerald-500 dark:border-slate-600 dark:bg-slate-800'
                    )}
                  >
                    {med.taken && <Check className="h-4 w-4 stroke-[3]" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ============================================================================
// 3. UPCOMING APPOINTMENTS (Inspired by appointments card, styled like Dashboard)
// ============================================================================
export function CarePlanAppointments({ t }) {
  const appointments = [
    {
      id: 'app-1',
      month: 'Nov',
      day: '02',
      specialty: 'Endocrinologist Follow-up',
      doctor: 'Dr. Lina • Diabetes Care Team',
      location: 'Clinic Wing B, Room 204',
      type: 'Clinical Review',
    },
    {
      id: 'app-2',
      month: 'Nov',
      day: '05',
      specialty: 'Comprehensive HbA1c Lab Panel',
      doctor: 'Diagnostic Pathology Services',
      location: 'Central Diagnostic Lab',
      type: 'Lab Order',
    },
    {
      id: 'app-3',
      month: 'Nov',
      day: '18',
      specialty: 'Diabetic Retinal Eye Exam',
      doctor: 'Dr. Jennifer • Ophthalmology Suite',
      location: 'Eye Care Institute',
      type: 'Preventive Screening',
    },
  ]

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-200 dark:border-slate-800 dark:bg-slate-900">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Upcoming Appointments
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scheduled consultations and lab work orders
          </p>
        </div>

        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          3 Scheduled
        </span>
      </div>

      {/* Appointment Items with clean seamless dividers */}
      <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800/60">
        {appointments.map((app) => (
          <div
            key={app.id}
            className="flex items-center gap-3.5 py-3 px-2 rounded-xl transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            {/* Boxed Date Badge */}
            <div className="flex flex-col items-center justify-center min-w-[46px] rounded-xl bg-slate-50 px-2.5 py-1.5 shadow-2xs dark:bg-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                {app.month}
              </span>
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                {app.day}
              </span>
            </div>

            {/* Specialty & Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {app.specialty}
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                {app.doctor}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {app.location}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// 4. PROGRESS TRACKER (Horizontal Stepper matching Dashboard styling)
// ============================================================================
export function CarePlanProgressTracker({ t }) {
  const steps = [
    { label: 'Day 1', desc: 'Baseline Assessment', status: 'completed' },
    { label: 'Day 7', desc: 'Regimen Adherence', status: 'completed' },
    { label: 'Day 14', desc: 'Mid-Point Review', status: 'active', pill: 'Day 14/30' },
    { label: 'Day 30', desc: 'Glycemic Target', status: 'pending' },
  ]

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-200 dark:border-slate-800 dark:bg-slate-900">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Care Plan Progress
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            30-Day Glycemic Stabilization Protocol
          </p>
        </div>

        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
          Phase 2 Active
        </span>
      </div>

      {/* Horizontal Milestone Stepper */}
      <div className="relative mt-9 mb-3 px-3">
        {/* Continuous Connecting Line */}
        <div className="absolute left-6 right-6 top-3 h-1 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full w-[67%] rounded-full bg-emerald-500" />
        </div>

        {/* Milestone Nodes */}
        <div className="relative flex justify-between">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center">
              {/* Active Tooltip Pill */}
              {step.pill ? (
                <div className="absolute -top-7.5 whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-md dark:bg-white dark:text-slate-900">
                  {step.pill}
                </div>
              ) : null}

              {/* Node Circle */}
              <div
                className={cn(
                  'h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center shadow-2xs',
                  step.status === 'completed' &&
                    'border-emerald-500 bg-emerald-500 text-white',
                  step.status === 'active' &&
                    'border-emerald-500 bg-white ring-4 ring-emerald-100 dark:bg-slate-900 dark:ring-emerald-950/80',
                  step.status === 'pending' &&
                    'border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
                )}
              >
                {step.status === 'completed' && <Check className="h-3 w-3 stroke-[3]" />}
              </div>

              {/* Day Label */}
              <span
                className={cn(
                  'mt-2 text-xs font-bold',
                  step.status === 'pending'
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-slate-800 dark:text-slate-200'
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// 5. VITALS & ACTIVITY LOG DUAL CARDS (Matching Dashboard style)
// ============================================================================
export function CarePlanVitalsSnapshot({ results = [], t }) {
  const latestResult = results[0]
  const facts = latestResult?.facts || {}
  const glucose = facts.fasting_glucose ? Math.round(facts.fasting_glucose) : 118

  // 7-day sparkline series
  const glucoseTrend = [124, 119, 130, 115, 122, 118, 118]

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Vitals Trend
        </h4>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          In Target Range
        </span>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {glucose}
          </span>
          <span className="text-xs text-slate-400 ml-1">mg/dL Fasting</span>
        </div>
        <span className="text-xs text-slate-400">Target: 80–130</span>
      </div>

      {/* Mini Sparkline Curve */}
      <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <MiniSparkline
          points={glucoseTrend}
          strokeColor="#10b981"
          fillColor="#10b981"
          height={32}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <span>7-Day Fasting Blood Glucose</span>
        <span className="text-emerald-600 dark:text-emerald-400">Stable</span>
      </div>
    </div>
  )
}

export function CarePlanActivitySnapshot({ t }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Daily Activity
        </h4>
        <span className="text-[10px] font-bold text-slate-400">7-Day Log</span>
      </div>

      {/* Steps counter & mini duration bars */}
      <div className="mt-2 flex items-center justify-between gap-3 h-[50px]">
        {/* Footprints Icon + Steps */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-2xs dark:bg-emerald-950/60 dark:text-emerald-300">
            <Footprints className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-none">
              6,540
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Goal: 8,000 steps
            </p>
          </div>
        </div>

        {/* 5-bar vertical mini chart */}
        <div className="flex items-end justify-between gap-1.5 w-24 h-9">
          {[
            { height: '40%', active: false },
            { height: '65%', active: false },
            { height: '50%', active: false },
            { height: '90%', active: true },
            { height: '75%', active: false },
          ].map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
              <div
                className={cn(
                  'w-full rounded-xs transition-all',
                  bar.active
                    ? 'bg-emerald-600 dark:bg-emerald-500'
                    : 'bg-emerald-200/60 dark:bg-emerald-900/50'
                )}
                style={{ height: bar.height }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span>Postprandial Exercise</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400">82% Goal Met</span>
      </div>
    </div>
  )
}
