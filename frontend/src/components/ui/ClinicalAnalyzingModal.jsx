import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Activity, HeartPulse, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

const ASSESSMENT_STEPS = [
  { en: 'Reviewing symptoms and vitals...', km: 'ពិនិត្យរោគសញ្ញា និងសញ្ញាគ្លីនិក...' },
  { en: 'Checking ADA clinical guidelines...', km: 'ផ្ទៀងផ្ទាត់ស្តង់ដារវេជ្ជសាស្ត្រ ADA...' },
  { en: 'Evaluating inference engine rules...', km: 'ដំណើរការក្បួនវិភាគឆ្លាតវៃ...' },
  { en: 'Finalizing diagnostic summary...', km: 'រៀបចំរបាយការណ៍រោគវិនិច្ឆ័យ...' },
]

const CARE_PLAN_STEPS = [
  { en: 'Reviewing assessment findings...', km: 'ពិនិត្យទិន្នន័យរោគវិនិច្ឆ័យ...' },
  { en: 'Setting glycemic targets...', km: 'កំណត់គោលដៅជាតិស្ករ...' },
  { en: 'Customizing diet and activity...', km: 'រៀបចំផែនការអាហារ និងលំហាត់ប្រាណ...' },
  { en: 'Assembling personalized plan...', km: 'ចងក្រងផែនការថែទាំផ្ទាល់ខ្លួន...' },
]

/**
 * ClinicalAnalyzingModal
 * ======================
 * Simple, clean, minimal loading modal rendered via createPortal
 * into document.body to ensure complete viewport coverage without clipping.
 */
export function ClinicalAnalyzingModal({
  isOpen,
  isDone = false,
  mode = 'assessment',
  onComplete,
}) {
  const { isKhmer } = useLanguage()
  const [progress, setProgress] = useState(8)
  const completedRef = useRef(false)
  const isCarePlan = mode === 'care-plan'
  const steps = isCarePlan ? CARE_PLAN_STEPS : ASSESSMENT_STEPS

  useEffect(() => {
    if (!isOpen) {
      setProgress(8)
      completedRef.current = false
      return undefined
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    completedRef.current = false
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (completedRef.current) return 100

        if (isDone) {
          const next = prev + 14
          if (next >= 100) {
            completedRef.current = true
            clearInterval(interval)
            setTimeout(() => {
              if (onComplete) onComplete()
            }, 300)
            return 100
          }
          return next
        }

        // Smooth gradual progression towards 92%
        const remaining = 92 - prev
        if (remaining <= 0.5) return prev
        const increment = Math.max(0.6, remaining * 0.08)
        return Math.min(92, prev + increment)
      })
    }, 65)

    return () => {
      document.body.style.overflow = prevOverflow
      clearInterval(interval)
    }
  }, [isOpen, isDone, onComplete])

  if (!isOpen) return null

  // Determine current active step index (0 to 3)
  let currentStepIndex = 0
  if (progress >= 75) currentStepIndex = 3
  else if (progress >= 50) currentStepIndex = 2
  else if (progress >= 25) currentStepIndex = 1
  else currentStepIndex = 0

  const currentStep = steps[currentStepIndex] || steps[0]
  const isFullyComplete = progress >= 100

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in-0 duration-200"
    >
      <div className="relative w-full max-w-sm rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-150">
        {/* Minimal Centered Icon */}
        <div className="relative mx-auto flex h-14 w-14 items-center justify-center">
          <span
            className={cn(
              'absolute inset-0 rounded-2xl border-2 border-dashed animate-spin [animation-duration:8s]',
              isCarePlan
                ? 'border-emerald-300/70 dark:border-emerald-700/60'
                : 'border-blue-300/70 dark:border-blue-700/60'
            )}
          />
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200',
              isFullyComplete
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : isCarePlan
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
            )}
          >
            {isFullyComplete ? (
              <Check className="h-5 w-5 stroke-[2.5]" />
            ) : isCarePlan ? (
              <HeartPulse className="h-5 w-5 animate-pulse" />
            ) : (
              <Activity className="h-5 w-5 animate-pulse" />
            )}
          </div>
        </div>

        {/* Clean Headline & Step Description */}
        <div className="mt-4 space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {isFullyComplete
              ? (isCarePlan
                ? (isKhmer ? 'ផែនការថែទាំរួចរាល់' : 'Care Plan Ready')
                : (isKhmer ? 'ការវិភាគរួចរាល់' : 'Analysis Complete'))
              : (isCarePlan
                ? (isKhmer ? 'កំពុងរៀបចំផែនការថែទាំ' : 'Creating Care Plan')
                : (isKhmer ? 'កំពុងវិភាគទិន្នន័យ' : 'Analyzing Assessment'))}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 h-5 transition-opacity duration-200 truncate">
            {isFullyComplete
              ? (isKhmer ? 'កំពុងបើកលទ្ធផល...' : 'Opening results...')
              : (isKhmer ? currentStep.km : currentStep.en)}
          </p>
        </div>

        {/* Minimal Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-200 ease-out',
                isCarePlan
                  ? 'bg-emerald-500 dark:bg-emerald-400'
                  : 'bg-blue-600 dark:bg-blue-500'
              )}
              style={{ width: `${Math.min(100, Math.max(6, progress))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors duration-200',
                    i <= currentStepIndex
                      ? (isCarePlan ? 'bg-emerald-500' : 'bg-blue-600')
                      : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              ))}
            </div>
            <span className="font-mono font-medium">{Math.min(100, Math.round(progress))}%</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ClinicalAnalyzingModal
