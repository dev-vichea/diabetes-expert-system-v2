import React, { useState } from 'react'
import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowRight,
  Stethoscope,
  Activity,
  Beaker,
  Info,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

/**
 * ExplainableEvidenceSection
 * ===========================
 * Shows "WHY did I get this result?" by breaking down:
 * 1. The visual diagnostic inference chain
 * 2. Rule-by-rule matched findings and missing evidence
 * 3. Primary vs supporting vs conflicting vs missing evidence
 */
export function ExplainableEvidenceSection({
  reasoningReport,
  triggeredRules = [],
  matchedSymptoms = [],
  matchedRiskFactors = [],
  certaintyPercent = 0,
  diagnosis = '',
  keyLabs = {},
  className = '',
}) {
  const { isKhmer } = useLanguage()
  const [expandedRules, setExpandedRules] = useState({})
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'primary' | 'supporting' | 'conflicts'

  const toggleRule = (id) => {
    setExpandedRules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Derive rules with matched evidence from reasoningReport or triggeredRules fallback
  const rulesList = reasoningReport?.matched_rules?.length
    ? reasoningReport.matched_rules
    : triggeredRules.map((r, idx) => {
        const factsUsed = Array.isArray(r.facts_used) ? r.facts_used : []
        const matched = factsUsed.map((f) => {
          const key = typeof f === 'object' ? f.fact_key || f.fact : String(f)
          const val = typeof f === 'object' && f.value !== undefined ? String(f.value) : 'Present'
          return {
            fact: key,
            label: key.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            value: val,
            status: 'matched',
          }
        })
        return {
          rule_id: r.id || r.code || `rule-${idx}`,
          rule_name: r.name || 'Clinical Logic Rule',
          description: r.description || '',
          explanation: r.explanation || '',
          certainty_factor: r.effective_certainty ?? r.certainty_factor ?? 0,
          matched_evidence: matched,
          missing_evidence: [],
          evidence_strength: matched.length >= 3 ? 'strong' : matched.length >= 2 ? 'moderate' : 'standard',
        }
      })

  const primaryEvidence = reasoningReport?.reasoning?.primary_evidence || []
  const supportingEvidence = reasoningReport?.reasoning?.supporting_evidence || []
  const conflictingEvidence = reasoningReport?.reasoning?.conflicting_evidence || []
  const missingEvidence = reasoningReport?.reasoning?.missing_evidence || []
  const evidenceSummary = reasoningReport?.reasoning?.evidence_summary || {
    total_primary: primaryEvidence.length || matchedSymptoms.length,
    total_supporting: supportingEvidence.length || matchedRiskFactors.length,
    total_conflicting: conflictingEvidence.length,
    total_missing: missingEvidence.length,
    evidence_strength: certaintyPercent >= 70 ? 'strong' : certaintyPercent >= 45 ? 'moderate' : 'insufficient',
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ── Visual Pathway Steps ── */}
      <div className="flex flex-wrap items-center gap-2 text-xs py-1">
        {[
          { step: '1', title: isKhmer ? 'ការវាយតម្លៃ' : 'Assessment' },
          { step: '2', title: isKhmer ? 'ក្បួនវេជ្ជសាស្ត្រ' : 'Expert Rules' },
          { step: '3', title: isKhmer ? 'ភស្តុតាងផ្គូផ្គង' : 'Matched Evidence' },
          { step: '4', title: isKhmer ? 'លទ្ធផលហានិភ័យ' : 'Diagnosis / Risk' },
          { step: '5', title: isKhmer ? 'ហេតុផល AI' : 'AI Reasoning' },
          { step: '6', title: isKhmer ? 'ផែនការថែទាំ' : 'Care Plan' },
        ].map((item, index, arr) => (
          <React.Fragment key={item.step}>
            <div className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <span className="flex h-4 w-4 items-center justify-center rounded bg-primary-100 text-[10px] font-bold text-primary-700 dark:bg-primary-900/60 dark:text-primary-300">
                {item.step}
              </span>
              <span>{item.title}</span>
            </div>
            {index < arr.length - 1 && (
              <ArrowRight className="h-3 w-3 text-slate-300 dark:text-slate-600 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Evidence Distribution List Down Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-y border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {isKhmer ? 'ភស្តុតាងចម្បង' : 'Primary Evidence'}
          </span>
          <span className="text-base font-bold text-cyan-700 dark:text-cyan-400">
            {evidenceSummary.total_primary}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isKhmer ? 'រោគសញ្ញាសំខាន់ និងតេស្តឈាម' : 'Cardinal symptoms & labs'}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {isKhmer ? 'ភស្តុតាងគាំទ្រ' : 'Supporting Evidence'}
          </span>
          <span className="text-base font-bold text-amber-700 dark:text-amber-400">
            {evidenceSummary.total_supporting}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isKhmer ? 'កត្តាហានិភ័យ និងប្រវត្តិ' : 'Risk factors & demographics'}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {isKhmer ? 'ភាពមិនស៊ីគ្នា' : 'Discordance'}
          </span>
          <span className="text-base font-bold text-purple-700 dark:text-purple-400">
            {evidenceSummary.total_conflicting}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {conflictingEvidence.length > 0 ? (isKhmer ? 'មានទិន្នន័យខុសគ្នា' : 'Conflicts detected') : (isKhmer ? 'គ្មាន' : 'None detected')}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {isKhmer ? 'ទិន្នន័យដែលបាត់' : 'Missing Evidence'}
          </span>
          <span className="text-base font-bold text-slate-700 dark:text-slate-300">
            {evidenceSummary.total_missing}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {missingEvidence.length > 0 ? (isKhmer ? 'តេស្តណែនាំបន្ថែម' : 'Recommended blood tests') : (isKhmer ? 'គ្រប់គ្រាន់' : 'Sufficient')}
          </p>
        </div>
      </div>

      {/* ── Conflicting Evidence Alert if any ── */}
      {conflictingEvidence.length > 0 && (
        <div className="border-l-3 border-amber-400 pl-3 py-1 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h5 className="font-bold">
                {isKhmer ? 'ការកត់សម្គាល់៖ មានទិន្នន័យមិនស៊ីសង្វាក់គ្នា' : 'Important Clinical Note: Discordant Evidence Detected'}
              </h5>
              <div className="mt-1 space-y-0.5">
                {conflictingEvidence.map((c, i) => (
                  <p key={i} className="text-amber-800 dark:text-amber-300">
                    • <strong>{c.label}:</strong> {c.detail}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Rule-to-Evidence Breakdown (List Down) ── */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {isKhmer ? 'ក្បួនវេជ្ជសាស្ត្រដែលដំណើរការ និងភស្តុតាងផ្គូផ្គង' : 'Triggered Expert Rules & Matched Findings'}
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            {rulesList.length} {isKhmer ? 'ក្បួន' : 'rule(s) matched'}
          </span>
        </div>

        {rulesList.length === 0 ? (
          <div className="py-4 text-xs text-slate-500">
            {isKhmer
              ? 'មិនមានក្បួនណាមួយត្រូវបានផ្គូផ្គងនឹងការវាយតម្លៃនេះទេ'
              : 'No expert rules triggered for this specific combination of answers.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rulesList.map((rule, idx) => {
              const ruleKey = rule.rule_id || `rule-${idx}`
              const isExpanded = expandedRules[ruleKey] ?? (idx === 0)
              const cf = Number(rule.certainty_factor || 0)
              const cfPercent = Math.max(0, Math.min(100, Math.round(cf <= 1 ? cf * 100 : cf)))

              return (
                <div key={ruleKey} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleRule(ruleKey)}
                      className="group flex flex-1 items-start gap-2.5 text-left focus:outline-none"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="text-sm font-bold text-slate-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 transition-colors">
                            {rule.rule_name}
                          </h5>
                          {rule.rule_code && (
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              [{rule.rule_code}]
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            • {rule.matched_evidence?.length || 0} {isKhmer ? 'ផ្គូផ្គង' : 'matched'}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                            {rule.description}
                          </p>
                        )}
                      </div>
                      <ChevronDown
                        className={`mt-1 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                        +{cfPercent}% CF
                      </span>
                    </div>
                  </div>

                  {/* Expanded Rule Evidence Panel */}
                  {isExpanded && (
                    <div className="mt-2.5 pl-7 text-xs space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {rule.matched_evidence?.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="flex items-start gap-1.5 text-slate-800 dark:text-slate-200"
                          >
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <div>
                              <span className="font-semibold">{item.label}: </span>
                              <span className="text-emerald-700 dark:text-emerald-400">{item.value}</span>
                            </div>
                          </div>
                        ))}

                        {rule.missing_evidence?.map((item, itemIdx) => (
                          <div
                            key={`missing-${itemIdx}`}
                            className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400"
                          >
                            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <div>
                              <span>{item.label}</span>
                              <span className="text-[10px] text-slate-400"> ({isKhmer ? 'អវត្តមាន' : 'unconfirmed'})</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {rule.explanation && (
                        <p className="pt-1 text-slate-600 dark:text-slate-400 italic">
                          <strong className="font-semibold text-slate-700 dark:text-slate-300 not-italic">
                            {isKhmer ? 'មូលហេតុវេជ្ជសាស្ត្រ៖ ' : 'Clinical Note: '}
                          </strong>
                          {rule.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExplainableEvidenceSection
