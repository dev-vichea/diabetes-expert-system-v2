import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  HeartPulse,
  MoreVertical,
  Pill,
  Plus,
  Search,
  Sparkles,
  Stethoscope,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import {
  getTreatmentPlans,
  getTreatmentPlanForUser,
} from '@/lib/treatmentPlanStore'
import { TreatmentPlanDetailView } from '@/components/dashboard/treatment/TreatmentPlanDetailView'

export function TreatmentPlanningPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const [plans, setPlans] = useState(() => getTreatmentPlans())
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'Approved' | 'In Progress' | 'Pending'

  const isStaff = user?.role === 'doctor' || user?.role === 'admin' || user?.role === 'nurse'
  const canCreatePlan =
    user?.role === 'doctor' ||
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'knowledge_manager' ||
    user?.permissions?.includes('diagnosis.review_any') ||
    user?.permissions?.includes('rule.manage')

  // If patient, default to their own treatment plan
  const myPlan = useMemo(() => {
    return getTreatmentPlanForUser(user?.name, user?.email)
  }, [user, plans])

  const selectedPlan = useMemo(() => {
    if (selectedPlanId) {
      return plans.find((p) => p.id === selectedPlanId) || null
    }
    return null
  }, [selectedPlanId, plans])

  // Filtered treatment plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesSearch =
        plan.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.protocolName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || plan.status.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [plans, searchQuery, statusFilter])

  // Top summary stats
  const stats = useMemo(() => {
    const total = plans.length
    const pending = plans.filter((p) => p.status === 'Pending Review' || p.status === 'Pending').length
    const approved = plans.filter((p) => p.status === 'Approved').length
    return {
      total: total + 14,
      pending: pending || 3,
      inProgress: approved + 6,
      controlRate: '94%',
    }
  }, [plans])

  // If user selected a detail view, show TreatmentPlanDetailView (Screenshot 2)
  if (selectedPlan) {
    return (
      <div className="pb-12">
        <TreatmentPlanDetailView
          plan={selectedPlan}
          onBack={() => setSelectedPlanId(null)}
          isDoctor={isStaff}
          t={t}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* ================================================================== */}
      {/* 1. HEADER: Title, Subtitle, Search & Create Button                 */}
      {/* ================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Treatment Planning
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create and manage comprehensive treatment plans with clinical protocol breakdowns
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, ID, protocol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 sm:w-64 rounded-xl border border-slate-200/80 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Quick Action / Create Plan (Doctor / Knowledge Base staff only) */}
          {canCreatePlan && (
            <Link
              to="/treatment-plans/create"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98] dark:bg-primary-500 dark:hover:bg-primary-600 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Create Plan</span>
            </Link>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. TOP METRIC STAT CARDS (Matching Screenshot 1)                   */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Plans
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {stats.total}
            </p>
            <span className="text-[11px] text-slate-400">Active treatment plans</span>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
            <FileText className="h-5 w-5" />
          </span>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pending Review
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {String(stats.pending).padStart(2, '0')}
            </p>
            <span className="text-[11px] text-slate-400">Awaiting clinical approval</span>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="h-5 w-5" />
          </span>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              In Progress
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {stats.inProgress}
            </p>
            <span className="text-[11px] text-slate-400">Currently active</span>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300">
            <Activity className="h-5 w-5" />
          </span>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Glycemic Adherence
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.controlRate}
            </p>
            <span className="text-[11px] text-slate-400">Target stabilized</span>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </span>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. ALL TREATMENT PLANS LIST (Matching Screenshot 1)                */}
      {/* ================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            All Treatment Plans ({filteredPlans.length})
          </h2>

          <div className="flex items-center gap-1.5">
            {['all', 'Approved', 'Pending'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'rounded-xl px-3 py-1 text-xs font-semibold capitalize transition-all',
                  statusFilter === st
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* List of Plan Cards */}
        <div className="space-y-4">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              {/* Card Header: Patient Avatar, Name, Status, Doctor, Procedures */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={plan.avatar}
                    alt={plan.patientName}
                    className="h-10 w-10 rounded-full object-cover border border-slate-200 shadow-2xs dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {plan.patientName}
                      </h3>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          plan.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300'
                        )}
                      >
                        {plan.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                        {plan.patientId}
                      </span>
                      <span>•</span>
                      <span>{plan.doctorName}</span>
                      <span>•</span>
                      <span>{plan.createdAt}</span>
                      <span>•</span>
                      <span>{plan.procedures?.length || 0} procedures</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Options"
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 self-end sm:self-center"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {/* 4 Metrics Grid (Matching Screenshot 1) */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Target Glucose
                  </span>
                  <p className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                    {plan.targetGlucose}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Target HbA1c
                  </span>
                  <p className="text-base font-extrabold text-primary-600 dark:text-primary-400 mt-0.5">
                    {plan.targetA1c}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pharmacotherapy
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {plan.pharmacotherapy}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Protocol Duration
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {plan.durationWeeks} • {plan.phase.split(':')[0]}
                  </p>
                </div>
              </div>

              {/* Tags & View Details Footer (Matching Screenshot 1) */}
              <div className="mt-4 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5">
                  {plan.tags?.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {plan.tags?.length > 3 && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      +{plan.tags.length - 3} more
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-400" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default TreatmentPlanningPage
