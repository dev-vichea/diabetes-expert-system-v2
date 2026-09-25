import React from 'react'
import { Link } from 'react-router-dom'
import {
  HeartPulse,
  ArrowRight,
  Sparkles,
  Calendar,
  Utensils,
  Activity,
  CheckCircle2,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

/**
 * CarePlanCalloutBanner
 * =====================
 * Smooth transition from diagnosis result to the personalized care plan.
 */
export function CarePlanCalloutBanner({
  diagnosisResultId,
  result,
  className = '',
}) {
  const { isKhmer } = useLanguage()

  return (
    <div className={`py-4 border-l-4 border-primary-600 pl-4 sm:pl-6 ${className}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {isKhmer
                ? 'ជំហានបន្ទាប់៖ ការគ្រប់គ្រង និងថែទាំសុខភាព'
                : 'Next Step in Your Health Journey'}
            </span>
          </div>

          <h3 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isKhmer
              ? 'បន្តទៅកាន់ផែនការថែទាំផ្ទាល់ខ្លួនរបស់អ្នក'
              : 'Continue to Your Personalized Care Plan'}
          </h3>

          <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {isKhmer
              ? 'ប្រព័ន្ធបានរៀបចំផែនការសកម្មភាពជាក់លាក់ផ្អែកលើការវាយតម្លៃនេះ៖ ការណែនាំអាហារូបត្ថម្ភ កាលវិភាគហាត់ប្រាណ ការតាមដានជាតិស្ករ និងការណែនាំជួបគ្រូពេទ្យ។'
              : 'Transform this assessment into action. Access tailored dietary guidance, physical activity targets, blood glucose tracking, and scheduled follow-ups aligned with your risk profile.'}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Utensils className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isKhmer ? 'អាហារូបត្ថម្ភសមស្រប' : 'Nutrition Guidance'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>{isKhmer ? 'សកម្មភាពរាងកាយ' : 'Physical Activity'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>{isKhmer ? 'កាលវិភាគតាមដាន' : 'Clinical Checkups'}</span>
            </span>
          </div>
        </div>

        <div className="shrink-0 pt-2 lg:pt-0">
          <Link
            to="/care-plan"
            state={{ fromAssessmentId: diagnosisResultId, result }}
            className="btn-primary gap-2 h-10 px-5 text-sm font-semibold rounded-xl inline-flex items-center"
          >
            <HeartPulse className="h-4 w-4" />
            <span>{isKhmer ? 'បើកផែនការថែទាំផ្ទាល់ខ្លួន' : 'Open My Personalized Care Plan'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CarePlanCalloutBanner
