import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, ClipboardCheck, TestTube2 } from 'lucide-react'
import { EmptyState, SectionCard, StatusBadge } from '@/components/ui'
import { buildCareChecklist, getUrgencyLabel, getUrgencyTone, toPercent } from './patient-dashboard-utils'

function ActionBlock({ icon: Icon, title, text, actionLabel, actionTo, tone = 'default' }) {
  const toneClass = tone === 'alert'
    ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/20'
    : 'border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40'

  return (
    <article className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-800">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
          {actionLabel && actionTo ? (
            <Link to={actionTo} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 dark:text-primary-300">
              {actionLabel}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function PatientCarePanel({ latestResult }) {
  const checklist = buildCareChecklist(latestResult)

  return (
    <div className="space-y-5">
      <SectionCard title="Care Plan" description="What matters most after your latest assessment.">
        {!latestResult ? (
          <EmptyState title="No latest summary yet" description="Once you complete an assessment, your most recent diagnosis and follow-up plan will appear here." />
        ) : (
          <div className="space-y-4">
            <ActionBlock
              icon={AlertTriangle}
              title="Current priority"
              text={latestResult.is_urgent
                ? 'Your latest result includes an urgent flag. Follow the recommendation promptly and contact a clinician if symptoms are getting worse.'
                : 'Your latest result does not show an urgent flag. Continue with the recommended follow-up and monitor any symptom changes.'}
              tone={latestResult.is_urgent ? 'alert' : 'default'}
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Latest Summary
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                    {latestResult.diagnosis || 'No diagnosis available'}
                  </p>
                </div>
                <StatusBadge tone={getUrgencyTone(latestResult)}>
                  {getUrgencyLabel(latestResult)}
                </StatusBadge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/50">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Confidence</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">{toPercent(latestResult.certainty)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/50">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Review Note</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{latestResult.review_note || 'No doctor note yet.'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Next Steps" description="Simple actions to keep your care on track.">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/30">
          <ul className="space-y-3">
            {checklist.map((item, index) => (
              <li key={item} className="flex items-start gap-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-sm leading-6 text-slate-700 dark:text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3">
          <ActionBlock
            icon={ClipboardCheck}
            title="Review your diagnosis history"
            text="Track changes in diagnosis, urgency, and confidence across older and newer results."
            actionLabel="Open history"
            actionTo="/my-results"
          />
          <ActionBlock
            icon={TestTube2}
            title="Start a new assessment when information changes"
            text="Run another assessment when symptoms change, new lab values become available, or your doctor asks for an update."
            actionLabel="Start assessment"
            actionTo="/diagnosis"
          />
        </div>
      </SectionCard>
    </div>
  )
}
