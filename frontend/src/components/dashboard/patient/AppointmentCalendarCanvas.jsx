import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  Info,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  Stethoscope,
  User,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// DEFAULT CLINICAL APPOINTMENT DATA
// ============================================================================
const DEFAULT_APPOINTMENTS = [
  {
    id: 'apt-1',
    doctor: 'Dr. Lina',
    doctorRole: 'Endocrinologist',
    title: 'Endocrinology Review',
    procedure: 'Glycemic Control & Insulin Assessment',
    dayIndex: 0, // Monday
    startHour: 8, // 8:00 AM
    durationMinutes: 45,
    timeLabel: '08:00 - 08:45 (45 min)',
    status: 'Confirmed',
    colorTheme: 'amber', // matching user's screenshot amber card
    room: 'Clinic Wing B, Room 204',
    instructions: 'Bring your glucose log from the past 14 days and list of current medications.',
    phone: '+1 (555) 234-8901',
  },
  {
    id: 'apt-2',
    doctor: 'Dr. Jennifer',
    doctorRole: 'Ophthalmologist',
    title: 'Retinal Screening',
    procedure: 'Diabetic Retinopathy Eye Exam',
    dayIndex: 2, // Wednesday
    startHour: 9, // 9:00 AM
    durationMinutes: 60,
    timeLabel: '09:00 - 10:00 (60 min)',
    status: 'In Progress',
    colorTheme: 'blue', // matching user's screenshot solid blue card
    room: 'Eye Care Center, Suite 302',
    instructions: 'Pupil dilation drops will be applied. Arrange for transportation as vision will be blurred for 2-3 hours.',
    phone: '+1 (555) 890-1234',
  },
  {
    id: 'apt-3',
    doctor: 'Central Diagnostic Lab',
    doctorRole: 'Clinical Pathology',
    title: 'Comprehensive HbA1c Lab',
    procedure: 'Fasting Plasma Glucose & Lipid Panel',
    dayIndex: 3, // Thursday
    startHour: 7, // 7:30 AM
    durationMinutes: 30,
    timeLabel: '07:30 - 08:00 (30 min)',
    status: 'Scheduled',
    colorTheme: 'emerald', // matching user's screenshot soft mint card
    room: 'Pathology Outpatient Lab, Level 1',
    instructions: 'Fasting required: do not consume food or beverages (except plain water) for 8-10 hours prior to blood draw.',
    phone: '+1 (555) 345-6789',
  },
  {
    id: 'apt-4',
    doctor: 'Sarah Miller, RD',
    doctorRole: 'Certified Diabetes Educator',
    title: 'Nutrition Consultation',
    procedure: 'Low-Glycemic Meal Planning',
    dayIndex: 4, // Friday
    startHour: 10, // 10:00 AM
    durationMinutes: 45,
    timeLabel: '10:00 - 10:45 (45 min)',
    status: 'Scheduled',
    colorTheme: 'purple',
    room: 'Wellness Pavilion, Room 110',
    instructions: 'Bring a 3-day food diary noting carbohydrate portions and post-meal energy levels.',
    phone: '+1 (555) 678-9012',
  },
  {
    id: 'apt-5',
    doctor: 'Dr. David',
    doctorRole: 'Podiatrist',
    title: 'Diabetic Foot Exam',
    procedure: 'Peripheral Neuropathy & Circulation',
    dayIndex: 0, // Monday
    startHour: 12, // 12:00 PM
    durationMinutes: 30,
    timeLabel: '12:00 - 12:30 (30 min)',
    status: 'Priority',
    colorTheme: 'rose', // matching user's screenshot soft pink/emergency card
    room: 'Podiatry Clinic, Room 108',
    instructions: 'Routine microvascular inspection. Wear comfortable footwear that can be easily removed.',
    phone: '+1 (555) 456-7890',
  },
  {
    id: 'apt-6',
    doctor: 'Marco Conti',
    doctorRole: 'Physical Therapist',
    title: 'Supervised Cardio',
    procedure: 'Aerobic Exercise Session',
    dayIndex: 5, // Saturday
    startHour: 8, // 8:00 AM
    durationMinutes: 45,
    timeLabel: '08:00 - 08:45 (45 min)',
    status: 'Confirmed',
    colorTheme: 'amber',
    room: 'Cardio Rehab Gym, 2nd Floor',
    instructions: 'Wear athletic sneakers and athletic wear. Drink 500ml water beforehand.',
    phone: '+1 (555) 789-0123',
  },
]

const TIME_SLOTS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]

export function AppointmentCalendarCanvas({ t }) {
  const [viewMode, setViewMode] = useState('Weekly') // 'Daily' | 'Weekly' | 'Monthly' | 'By Specialist'
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState(1) // 0 = Mon, 1 = Tue (Today)
  const [appointments, setAppointments] = useState(DEFAULT_APPOINTMENTS)
  const [activeModalAppointment, setActiveModalAppointment] = useState(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [newBooking, setNewBooking] = useState({
    doctor: 'Dr. Lina (Endocrinologist)',
    title: 'Follow-up Consultation',
    dayIndex: 1,
    startHour: 10,
    timeLabel: '10:00 - 10:45 AM',
    room: 'Clinic Wing B, Room 204',
  })

  // Lock body overflow & handle Escape key when modals are open (matching DiabetesGuidePage)
  useEffect(() => {
    if (!activeModalAppointment && !isBookingModalOpen) return undefined

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setActiveModalAppointment(null)
        setIsBookingModalOpen(false)
      }
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeModalAppointment, isBookingModalOpen])

  // Dynamic 7-day week dates
  const weekDates = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDay()
    const distToMon = (currentDay + 6) % 7
    const monday = new Date(today)
    monday.setDate(today.getDate() - distToMon + weekOffset * 7)

    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + idx)
      const isToday = d.toDateString() === today.toDateString()

      return {
        dayName,
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        fullDate: d,
        isToday,
      }
    })
  }, [weekOffset])

  const dateRangeLabel = useMemo(() => {
    if (!weekDates.length) return ''
    const start = weekDates[0]
    const end = weekDates[6]
    return `${start.dayNum} ${start.monthName} – ${end.dayNum} ${end.monthName}, ${start.fullDate.getFullYear()}`
  }, [weekDates])

  const specialists = [
    { name: 'Dr. Lina', role: 'Endocrinologist', room: 'Room 204' },
    { name: 'Central Lab', role: 'Diagnostic Pathology', room: 'Lab Wing' },
    { name: 'Dr. Jennifer', role: 'Ophthalmology', room: 'Suite 302' },
    { name: 'Sarah Miller, RD', role: 'Diabetes Dietetics', room: 'Room 110' },
  ]

  const handleCreateBooking = (e) => {
    e.preventDefault()
    const newApt = {
      id: `apt-${Date.now()}`,
      doctor: newBooking.doctor.split('(')[0].trim(),
      doctorRole: 'Consultant',
      title: newBooking.title,
      procedure: 'Clinical Consultation',
      dayIndex: Number(newBooking.dayIndex),
      startHour: Number(newBooking.startHour),
      durationMinutes: 45,
      timeLabel: `${newBooking.startHour}:00 - ${newBooking.startHour}:45`,
      status: 'Confirmed',
      colorTheme: 'blue',
      room: newBooking.room,
      instructions: 'Consultation confirmed. Arrive 10 minutes before your scheduled appointment.',
      phone: '+1 (555) 234-8901',
    }
    setAppointments((prev) => [...prev, newApt])
    setIsBookingModalOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* ================================================================== */}
      {/* 1. TOP CONTROLS: View Switcher, Date Range & Booking CTA          */}
      {/* ================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
        {/* Left: View Switcher Pills matching screenshot */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {['Daily', 'Weekly', 'Monthly', 'By Specialist'].map((mode) => {
            const isActive = viewMode === mode
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  'rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                )}
              >
                {mode}
              </button>
            )
          })}
        </div>

        {/* Right: Date Navigation & Booking Action */}
        <div className="flex items-center gap-2.5">
          {/* Previous / Next Week */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {dateRangeLabel}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Book Appointment CTA */}
          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98] dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            <span>Book Visit</span>
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. CALENDAR CANVAS CONTAINER                                       */}
      {/* ================================================================== */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-slate-800 dark:bg-slate-900">
        
        {/* VIEW 1: WEEKLY CALENDAR CANVAS (Matching user reference screenshot) */}
        {viewMode === 'Weekly' && (
          <div className="overflow-x-auto">
            <div className="min-w-[840px]">
              {/* Header Row: Days of the Week */}
              <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-slate-100 dark:border-slate-800">
                {/* Top-left corner time label */}
                <div className="p-3 text-center border-r border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Time
                  </span>
                </div>

                {/* 7 Days Columns */}
                {weekDates.map((d, idx) => (
                  <div
                    key={d.dayName}
                    className={cn(
                      'p-3 text-center border-r border-slate-100 last:border-r-0 dark:border-slate-800 transition-colors',
                      d.isToday && 'bg-primary-50/40 dark:bg-primary-950/20'
                    )}
                  >
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {d.dayName}
                    </span>
                    <div className="mt-0.5 flex items-center justify-center">
                      <span
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                          d.isToday
                            ? 'bg-primary-600 text-white shadow-2xs'
                            : 'text-slate-800 dark:text-slate-200'
                        )}
                      >
                        {d.dayNum}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid Body: Hours (Rows) x Days (Columns) */}
              <div className="relative divide-y divide-slate-100 dark:divide-slate-800/80">
                {TIME_SLOTS.map((hour) => {
                  const hourLabel =
                    hour === 12
                      ? '12 pm'
                      : hour > 12
                        ? `${hour - 12} pm`
                        : `${hour} am`

                  return (
                    <div
                      key={hour}
                      className="grid grid-cols-[70px_repeat(7,1fr)] min-h-[96px] relative"
                    >
                      {/* Left Time Label */}
                      <div className="p-2.5 text-right border-r border-slate-100 dark:border-slate-800 select-none">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {hourLabel}
                        </span>
                      </div>

                      {/* 7 Day Slot Cells */}
                      {weekDates.map((d, dayIdx) => {
                        // Find appointment scheduled in this cell
                        const slotAppointment = appointments.find(
                          (apt) => apt.dayIndex === dayIdx && apt.startHour === hour
                        )

                        return (
                          <div
                            key={dayIdx}
                            onClick={() => {
                              if (!slotAppointment) {
                                setNewBooking((prev) => ({
                                  ...prev,
                                  dayIndex: dayIdx,
                                  startHour: hour,
                                }))
                                setIsBookingModalOpen(true)
                              }
                            }}
                            className={cn(
                              'p-1.5 border-r border-slate-100 last:border-r-0 dark:border-slate-800/80 relative transition-colors group',
                              !slotAppointment &&
                                'hover:bg-slate-50/70 dark:hover:bg-slate-800/30 cursor-pointer',
                              d.isToday && 'bg-primary-50/10'
                            )}
                          >
                            {/* Empty slot quick add indicator on hover */}
                            {!slotAppointment && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                  <Plus className="h-3.5 w-3.5" />
                                </span>
                              </div>
                            )}

                            {/* Render Appointment Card if exists */}
                            {slotAppointment && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveModalAppointment(slotAppointment)
                                }}
                                className={cn(
                                  'h-full w-full rounded-xl p-2.5 shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between select-none hover:shadow-md hover:scale-[1.01]',
                                  // Warm Amber Card (Matching user screenshot)
                                  slotAppointment.colorTheme === 'amber' &&
                                    'border border-amber-200/80 bg-amber-50/90 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100',
                                  // Vibrant Solid Blue Card (Matching user screenshot)
                                  slotAppointment.colorTheme === 'blue' &&
                                    'bg-primary-600 text-white shadow-md',
                                  // Soft Mint/Emerald Card
                                  slotAppointment.colorTheme === 'emerald' &&
                                    'border border-emerald-200/80 bg-emerald-50/90 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100',
                                  // Soft Rose/Priority Card
                                  slotAppointment.colorTheme === 'rose' &&
                                    'border border-rose-200/80 bg-rose-50/90 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100',
                                  // Soft Purple Card
                                  slotAppointment.colorTheme === 'purple' &&
                                    'border border-purple-200/80 bg-purple-50/90 text-purple-950 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-100'
                                )}
                              >
                                <div>
                                  {/* Doctor Avatar / Header */}
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span
                                        className={cn(
                                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                                          slotAppointment.colorTheme === 'blue'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-900/10 text-slate-800 dark:bg-white/10 dark:text-slate-100'
                                        )}
                                      >
                                        <User className="h-3 w-3" />
                                      </span>
                                      <span className="text-xs font-bold truncate">
                                        {slotAppointment.doctor}
                                      </span>
                                    </div>
                                    <MoreVertical className="h-3 w-3 shrink-0 opacity-60" />
                                  </div>

                                  {/* Procedure Title */}
                                  <p
                                    className={cn(
                                      'text-[11px] font-semibold mt-1 truncate',
                                      slotAppointment.colorTheme === 'blue'
                                        ? 'text-white/90'
                                        : 'text-slate-700 dark:text-slate-300'
                                    )}
                                  >
                                    {slotAppointment.title}
                                  </p>

                                  {/* Time Duration */}
                                  <p
                                    className={cn(
                                      'text-[10px] mt-0.5 truncate font-medium',
                                      slotAppointment.colorTheme === 'blue'
                                        ? 'text-white/70'
                                        : 'text-slate-500 dark:text-slate-400'
                                    )}
                                  >
                                    {slotAppointment.timeLabel}
                                  </p>
                                </div>

                                {/* Status Pill Footer */}
                                <div className="mt-1.5 flex items-center justify-between">
                                  <span
                                    className={cn(
                                      'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                                      slotAppointment.colorTheme === 'blue'
                                        ? 'bg-white/20 text-white'
                                        : slotAppointment.status === 'Confirmed'
                                          ? 'bg-amber-100/90 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                                          : slotAppointment.status === 'Scheduled'
                                            ? 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                            : 'bg-rose-100/90 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                                    )}
                                  >
                                    {slotAppointment.status}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: DAILY TIMELINE VIEW */}
        {viewMode === 'Daily' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Select Day:
                </span>
                <div className="flex items-center gap-1">
                  {weekDates.map((d, idx) => (
                    <button
                      key={d.dayName}
                      type="button"
                      onClick={() => setSelectedDay(idx)}
                      className={cn(
                        'flex flex-col items-center px-2.5 py-1 rounded-xl text-xs font-semibold transition',
                        selectedDay === idx
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      )}
                    >
                      <span>{d.dayName}</span>
                      <span className="font-bold">{d.dayNum}</span>
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                {weekDates[selectedDay]?.dayName}, {weekDates[selectedDay]?.dayNum}{' '}
                {weekDates[selectedDay]?.monthName}
              </span>
            </div>

            {/* Daily Slots */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {TIME_SLOTS.map((hour) => {
                const hourLabel =
                  hour === 12
                    ? '12:00 PM'
                    : hour > 12
                      ? `${hour - 12}:00 PM`
                      : `${hour}:00 AM`

                const dayApt = appointments.find(
                  (a) => a.dayIndex === selectedDay && a.startHour === hour
                )

                return (
                  <div
                    key={hour}
                    className="grid grid-cols-[80px_1fr] gap-4 py-3 items-start group"
                  >
                    <span className="text-xs font-mono font-semibold text-slate-400 pt-1">
                      {hourLabel}
                    </span>

                    {dayApt ? (
                      <div
                        onClick={() => setActiveModalAppointment(dayApt)}
                        className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs hover:border-slate-300 transition-all cursor-pointer dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {dayApt.title}
                            </h4>
                          </div>
                          <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md dark:bg-primary-950/40">
                            {dayApt.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {dayApt.doctor} ({dayApt.doctorRole}) • {dayApt.room}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {dayApt.instructions}
                        </p>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setNewBooking((prev) => ({
                            ...prev,
                            dayIndex: selectedDay,
                            startHour: hour,
                          }))
                          setIsBookingModalOpen(true)
                        }}
                        className="rounded-xl border border-dashed border-slate-200 p-2.5 text-xs text-slate-400 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer transition flex items-center justify-between dark:border-slate-800 dark:hover:bg-slate-800/30"
                      >
                        <span>Available Consultation Window</span>
                        <span className="text-primary-600 font-semibold text-[11px] flex items-center gap-1">
                          <Plus className="h-3 w-3" /> Book Slot
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: BY SPECIALIST VIEW */}
        {viewMode === 'By Specialist' && (
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {specialists.map((doc) => {
                const docApts = appointments.filter((a) =>
                  a.doctor.toLowerCase().includes(doc.name.toLowerCase().split(' ')[0])
                )

                return (
                  <div
                    key={doc.name}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
                          <Stethoscope className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {doc.name}
                          </h4>
                          <p className="text-[11px] text-slate-400">{doc.role}</p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {docApts.map((a) => (
                          <div
                            key={a.id}
                            onClick={() => setActiveModalAppointment(a)}
                            className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 hover:bg-slate-100 transition cursor-pointer dark:border-slate-800 dark:bg-slate-800/40"
                          >
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {a.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {weekDates[a.dayIndex]?.dayName} • {a.timeLabel}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNewBooking((prev) => ({
                          ...prev,
                          doctor: `${doc.name} (${doc.role})`,
                          room: doc.room,
                        }))
                        setIsBookingModalOpen(true)
                      }}
                      className="mt-4 w-full rounded-xl border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-center dark:border-slate-700 dark:text-slate-300"
                    >
                      Book With {doc.name.split(' ')[0]}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: MONTHLY OVERVIEW */}
        {viewMode === 'Monthly' && (
          <div className="p-5">
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 border-b border-slate-100 pb-2 mb-2 dark:border-slate-800">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 35 }).map((_, i) => {
                const dayNum = ((i + 1) % 31) + 1
                const hasApt = i === 1 || i === 8 || i === 14 || i === 22

                return (
                  <div
                    key={i}
                    className={cn(
                      'min-h-[64px] rounded-xl border p-1.5 text-left flex flex-col justify-between transition-colors',
                      hasApt
                        ? 'border-primary-200 bg-primary-50/20 dark:border-primary-900/40 dark:bg-primary-950/10'
                        : 'border-slate-100 hover:bg-slate-50/50 dark:border-slate-800/80 dark:hover:bg-slate-800/30'
                    )}
                  >
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {dayNum}
                    </span>
                    {hasApt && (
                      <span className="truncate rounded-md bg-primary-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Consultation
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/* 3. APPOINTMENT DETAIL POPUP / MODAL                                */}
      {/* ================================================================== */}
      {activeModalAppointment &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in-0 duration-200"
            onClick={() => setActiveModalAppointment(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
                    <CalendarIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {activeModalAppointment.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {activeModalAppointment.procedure}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalAppointment(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <User className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {activeModalAppointment.doctor}
                    </p>
                    <p className="text-slate-500">{activeModalAppointment.doctorRole}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {activeModalAppointment.timeLabel}
                    </p>
                    <p className="text-slate-500">
                      {weekDates[activeModalAppointment.dayIndex]?.dayName},{' '}
                      {weekDates[activeModalAppointment.dayIndex]?.dayNum}{' '}
                      {weekDates[activeModalAppointment.dayIndex]?.monthName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {activeModalAppointment.room}
                    </p>
                    <p className="text-slate-500">Main Clinical Facility</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Info className="h-3.5 w-3.5 text-primary-600" />
                    <span>Preparation Instructions:</span>
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    {activeModalAppointment.instructions}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400">
                  Status: <strong className="text-slate-800 dark:text-slate-200">{activeModalAppointment.status}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalAppointment(null)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert('Appointment confirmed & synced to your personal calendar.')
                      setActiveModalAppointment(null)
                    }}
                    className="rounded-xl bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 shadow-2xs"
                  >
                    Add to Calendar
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ================================================================== */}
      {/* 4. BOOK NEW APPOINTMENT MODAL                                      */}
      {/* ================================================================== */}
      {isBookingModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in-0 duration-200"
            onClick={() => setIsBookingModalOpen(false)}
          >
            <form
              onSubmit={handleCreateBooking}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
                    <Plus className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Book Clinical Appointment
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Specialist / Department
                  </label>
                  <select
                    value={newBooking.doctor}
                    onChange={(e) =>
                      setNewBooking((prev) => ({ ...prev, doctor: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option>Dr. Lina (Endocrinologist)</option>
                    <option>Central Diagnostic Lab (Pathology HbA1c)</option>
                    <option>Dr. Jennifer (Ophthalmology Retinal Screening)</option>
                    <option>Sarah Miller, RD (Diabetes Dietetics)</option>
                    <option>Dr. David (Podiatrist Foot Care)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Appointment Type
                  </label>
                  <input
                    type="text"
                    value={newBooking.title}
                    onChange={(e) =>
                      setNewBooking((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    placeholder="e.g. Routine Glycemic Review"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Day of Week
                    </label>
                    <select
                      value={newBooking.dayIndex}
                      onChange={(e) =>
                        setNewBooking((prev) => ({ ...prev, dayIndex: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {weekDates.map((d, idx) => (
                        <option key={idx} value={idx}>
                          {d.dayName}, {d.dayNum} {d.monthName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Time Window
                    </label>
                    <select
                      value={newBooking.startHour}
                      onChange={(e) =>
                        setNewBooking((prev) => ({ ...prev, startHour: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {TIME_SLOTS.map((h) => (
                        <option key={h} value={h}>
                          {h}:00 {h >= 12 ? 'PM' : 'AM'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 shadow-sm"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  )
}
export default AppointmentCalendarCanvas
