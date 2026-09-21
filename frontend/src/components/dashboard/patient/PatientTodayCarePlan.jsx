import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarCheck,
  Check,
  Clock,
  ExternalLink,
  Footprints,
  Pill,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

const DEFAULT_HABITS = [
  {
    id: 'glucose_morning',
    title: 'Log morning glucose reading',
    subtitle: 'Fasting check before breakfast (target: 80–130 mg/dL)',
    instruction: 'Check after 8 hrs fasting, record in diary',
    time: '8:00 AM',
    icon: Stethoscope,
    gradient: 'from-amber-500 to-orange-500',
    tint: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
  },
  {
    id: 'medication_am',
    title: 'Take prescribed medication',
    subtitle: 'Morning dosage with full glass of water',
    instruction: 'Take with breakfast as advised by physician',
    time: '8:30 AM',
    icon: Pill,
    gradient: 'from-sky-500 to-blue-600',
    tint: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
  },
  {
    id: 'walk_afternoon',
    title: 'Schedule 30-min walk',
    subtitle: 'Light aerobic post-meal activity',
    instruction: 'Helps muscle glucose uptake & lowers post-meal spikes',
    time: '12:30 PM',
    icon: Footprints,
    gradient: 'from-emerald-500 to-teal-600',
    tint: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
]

export function PatientTodayCarePlan({ latestResult }) {
  const { t } = useLanguage()

  const todayKey = `apple_health_habits_${new Date().toISOString().slice(0, 10)}`

  const [completedTaskIds, setCompletedTaskIds] = useState(() => {
    try {
      const saved = localStorage.getItem(todayKey)
      return saved ? JSON.parse(saved) : ['glucose_morning']
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

  // Circular activity ring
  const radius = 34
  const strokeWidth = 7
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200/70 bg-white p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
      {/* Top Header with Activity Ring & Section Metadata */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Apple Watch Style Activity Progress Ring */}
          <div className="relative flex h-18 w-18 shrink-0 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 88 88">
              <circle
                cx="44"
                cy="44"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx="44"
                cy="44"
                r={radius}
                stroke="url(#carePlanGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 ease-out"
              />
              <defs>
                <linearGradient id="carePlanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34c759" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-50">
                {progressPercent}%
              </span>
              <span className="text-[8px] font-bold uppercase text-slate-400">Done</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Daily Care Plan
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {completedCount} / {totalTasks} Completed
              </span>
            </div>
            <h3 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Today&apos;s Habits &amp; Action Checklist
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stay on track to maintain optimal glucose control and energy throughout the day
            </p>
          </div>
        </div>

        <Link
          to="/care-plan"
          className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 sm:self-auto"
        >
          <span>Open Full Care Plan</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 3-Column Habit Cards Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {DEFAULT_HABITS.map((habit) => {
          const isChecked = completedTaskIds.includes(habit.id)
          const HabitIcon = habit.icon

          return (
            <div
              key={habit.id}
              onClick={() => toggleTask(habit.id)}
              className={cn(
                'group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4.5 transition-all duration-200 select-none',
                isChecked
                  ? 'border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                  : 'border-slate-100 bg-[#fafafc] hover:border-slate-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-700'
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs',
                      `bg-gradient-to-br ${habit.gradient}`
                    )}
                  >
                    <HabitIcon className="h-5 w-5" />
                  </div>

                  {/* Circular Checkbox */}
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200',
                      isChecked
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'border-2 border-slate-300 group-hover:border-slate-400 dark:border-slate-600'
                    )}
                  >
                    {isChecked ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : null}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        'text-sm font-bold transition-colors',
                        isChecked
                          ? 'text-slate-400 line-through dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100'
                      )}
                    >
                      {habit.title}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {habit.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100/80 pt-3 dark:border-slate-800/80">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                  <Clock className="h-3 w-3" />
                  {habit.time}
                </span>

                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    isChecked
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  )}
                >
                  {isChecked ? 'Completed' : 'Pending'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
