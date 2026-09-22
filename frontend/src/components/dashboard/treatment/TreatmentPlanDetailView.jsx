import { useState } from 'react'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileText,
  HeartPulse,
  Pill,
  Printer,
  Shield,
  Sparkles,
  Stethoscope,
  Tag,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function TreatmentPlanDetailView({ plan, onBack, onEdit, isDoctor = false, t }) {
  const [activeTab, setActiveTab] = useState('procedures') // 'procedures' | 'medications' | 'milestones' | 'approval'

  if (!plan) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Treatment Plans</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Printer className="h-3.5 w-3.5 text-slate-400" />
            <span>Print Plan</span>
          </button>
          {isDoctor && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(plan)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Treatment Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Treatment Plan Details
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Comprehensive clinical interventions, medication protocol, and targets
        </p>
      </div>

      {/* ==================================================================== */}
      {/* 1. PATIENT HEADER CARD (Matching Screenshot 2)                       */}
      {/* ==================================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={plan.avatar}
              alt={plan.patientName}
              className="h-14 w-14 rounded-full object-cover border border-slate-200 shadow-2xs dark:border-slate-700"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {plan.patientName}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Check className="h-3 w-3" />
                  <span>{plan.status}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {plan.patientId}
                </span>
                <span>•</span>
                <span>Attending: {plan.doctorName}</span>
                <span>•</span>
                <span>Created: {plan.createdAt}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {plan.procedures?.length || 0} Clinical Interventions
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Sub-grid (Matching Screenshot 2) */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Start Date
            </span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {plan.startDate}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Estimated Review / End
            </span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {plan.estimatedEnd}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Clinical Protocol
            </span>
            <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-0.5 truncate">
              {plan.protocolName}
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. SUB-NAVIGATION TABS (Matching Screenshot 2)                       */}
      {/* ==================================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'procedures', label: `Procedures & Interventions (${plan.procedures?.length || 0})` },
          { id: 'medications', label: `Medications & Dosage (${plan.medications?.length || 0})` },
          { id: 'milestones', label: `Milestones (${plan.milestones?.length || 0})` },
          { id: 'approval', label: 'Physician Sign-off & Targets' },
        ].map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all',
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ==================================================================== */}
      {/* 3. PROCEDURES TAB (Matching Screenshot 2 numbered cards)             */}
      {/* ==================================================================== */}
      {activeTab === 'procedures' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Treatment Procedures ({plan.procedures?.length || 0})
              </h3>
              <p className="text-xs text-slate-400">
                Structured clinical steps prescribed by attending specialist
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {plan.durationWeeks} Duration
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {plan.procedures?.map((proc, index) => (
              <div
                key={proc.id || index}
                className="flex items-start gap-4 rounded-xl border border-slate-100 p-4 hover:border-slate-200 hover:bg-slate-50/50 transition-all dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/30"
              >
                {/* Number Badge (Matching Screenshot 2) */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {proc.title}
                    </h4>
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
                  </div>

                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {proc.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {proc.category}
                    </span>
                    {proc.scheduledDate && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Scheduled: {proc.scheduledDate}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. MEDICATIONS TAB                                                   */}
      {/* ==================================================================== */}
      {activeTab === 'medications' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            Pharmacotherapy & Prescription Schedule
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="py-2.5">Medication</th>
                  <th className="py-2.5">Dosage</th>
                  <th className="py-2.5">Frequency & Instructions</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {plan.medications?.map((med, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 pr-3 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {med.name}
                    </td>
                    <td className="py-3.5 pr-3 text-xs font-bold text-primary-600 dark:text-primary-400">
                      {med.dosage}
                    </td>
                    <td className="py-3.5 pr-3 text-xs text-slate-600 dark:text-slate-300">
                      {med.frequency}
                    </td>
                    <td className="py-3.5 text-right">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        {med.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. MILESTONES TAB                                                    */}
      {/* ==================================================================== */}
      {activeTab === 'milestones' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 pb-3 dark:border-slate-800">
            Care Protocol Milestones
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {plan.milestones?.map((m, idx) => (
              <div key={idx} className="relative flex items-start gap-3">
                <span
                  className={cn(
                    'absolute -left-6 flex h-4.5 w-4.5 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900',
                    m.completed
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                  )}
                >
                  {m.completed && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {m.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{m.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. APPROVAL & PHYSICIAN SIGN-OFF TAB                                 */}
      {/* ==================================================================== */}
      {activeTab === 'approval' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Physician Verification & Clinical Target Thresholds
              </h3>
              <p className="text-xs text-slate-400">
                Official medical oversight signed by {plan.doctorName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Target Fasting Glucose
              </span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {plan.targetGlucose}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Evaluated daily before breakfast
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Target HbA1c Threshold
              </span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {plan.targetA1c}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Evaluated quarterly via lab order
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 mt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Clinical Sign-off Status: Approved & Active
              </h4>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
              This personalized care regimen was reviewed and authorized by {plan.doctorName} ({plan.doctorRole}). Any dosage adjustments will be synchronized upon subsequent clinical assessments.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
export default TreatmentPlanDetailView
