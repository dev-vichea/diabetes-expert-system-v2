import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarCheck,
  Check,
  Clock,
  ExternalLink,
  Footprints,
  Mail,
  Pill,
  Phone,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

const DEFAULT_HABITS = [
  {
    id: 'glucose_morning',
    title: 'Log morning glucose reading',
    subtitle: 'Fasting check before breakfast (target: 80–130 mg/dL)',
    time: '8:00 AM',
    icon: Stethoscope,
    tint: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
  },
  {
    id: 'medication_am',
    title: 'Take prescribed medication',
    subtitle: 'Morning dosage with full glass of water',
    time: '8:30 AM',
    icon: Pill,
    tint: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
  },
  {
    id: 'walk_afternoon',
    title: 'Schedule 30-min walk',
    subtitle: 'Post-meal light aerobic walk improves insulin response',
    time: '12:30 PM',
    icon: Footprints,
    tint: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
]

export function PatientTodayCarePlan({ latestResult }) {
  const { t } = useLanguage()
  const [contactModalOpen, setContactModalOpen] = useState(false)

  const todayKey = `apple_health_habits_${new Date().toISOString().slice(0, 10)}`

  const [completedTaskIds, setCompletedTaskIds] = useState(() => {
    try {
      const saved = localStorage.getItem(todayKey)
      return saved ? JSON.parse(saved) : ['glucose_morning'] // Default 1 completed for visual delight
    } catch {
      return ['glucose_morning']
    }
  })

  const toggleTask = (id) => {
    setCompletedTaskIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      try {
        localStorage.setItem(todayKey, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const completedCount = completedTaskIds.length
  const totalTasks = DEFAULT_HABITS.length
  const progressPercent = Math.round((completedCount / totalTasks) * 100)

  // Circular progress ring calculation
  const radius = 38
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <>
      <div className="flex h-full flex-col justify-between rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div>
          {/* Header with Circular Activity Ring */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CalendarCheck className="h-3.5 w-3.5" />
                </span>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Daily Routine
                </p>
              </div>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100 sm:text-xl">
                Today&apos;s Habits
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {completedCount} of {totalTasks} completed today
              </p>
            </div>

            {/* Apple Watch Style Activity Progress Ring */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 96 96">
                {/* Background Ring */}
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="url(#appleHealthGradient)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out"
                />
                <defs>
                  <linearGradient id="appleHealthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34c759" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Text inside ring */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-50">
                  {progressPercent}%
                </span>
                <span className="text-[9px] font-semibold uppercase text-slate-400">Done</span>
              </div>
            </div>
          </div>

          {/* Habit Checklist (iOS Style) */}
          <ul className="mt-5 space-y-3">
            {DEFAULT_HABITS.map((habit) => {
              const isChecked = completedTaskIds.includes(habit.id)
              const HabitIcon = habit.icon

              return (
                <li key={habit.id}>
                  <button
                    type="button"
                    onClick={() => toggleTask(habit.id)}
                    className={cn(
                      'group flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all duration-200',
                      isChecked
                        ? 'border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                        : 'border-slate-100 bg-[#fafafc] hover:border-slate-200 hover:bg-white hover:shadow-xs dark:border-slate-800 dark:bg-slate-800/30 dark:hover:border-slate-700'
                    )}
                  >
                    {/* iOS Pill Checkbox */}
                    <div
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-200',
                        isChecked
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'border-2 border-slate-300 group-hover:border-slate-400 dark:border-slate-600'
                      )}
                    >
                      {isChecked ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : null}
                    </div>

                    {/* Habit Icon Squircle */}
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                        habit.tint
                      )}
                    >
                      <HabitIcon className="h-4.5 w-4.5" />
                    </div>

                    {/* Title & Subtitle */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-xs font-bold transition-colors sm:text-sm',
                          isChecked
                            ? 'text-slate-400 line-through dark:text-slate-500'
                            : 'text-slate-900 dark:text-slate-100'
                        )}
                      >
                        {habit.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {habit.subtitle}
                      </p>
                    </div>

                    {/* Time Pill */}
                    <span className="hidden shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:flex">
                      <Clock className="h-3 w-3" />
                      {habit.time}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Action Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setContactModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-900"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Contact Care Team / Doctor</span>
          </button>

          <Link
            to="/care-plan"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            <span>View Full Care Plan</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Doctor & Care Team Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Diabetes Care Team
                  </h4>
                  <p className="text-xs text-slate-500">General Diabetes Clinic • Care Unit A</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-slate-100 bg-[#fafafc] p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-200 text-sm font-bold text-primary-800">
                  DL
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Dr. Lina</p>
                  <p className="text-xs text-slate-500">Lead Endocrinologist &amp; Diabetes Specialist</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Contact for medication adjustments, lab prescriptions, or severe glucose readings (&gt; 250 mg/dL or &lt; 70 mg/dL).
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <a
                href="tel:+85523888999"
                className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span>Clinic Hotline: +855 23 888 999</span>
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                  Open Now
                </span>
              </a>

              <a
                href="mailto:careteam@diabetesclinic.org?subject=Diabetes%20Care%20Plan%20Inquiry"
                className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-sky-600" />
                  <span>careteam@diabetesclinic.org</span>
                </span>
                <span className="text-[10px] text-slate-400">&lt; 24h reply</span>
              </a>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="rounded-full bg-slate-100 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
