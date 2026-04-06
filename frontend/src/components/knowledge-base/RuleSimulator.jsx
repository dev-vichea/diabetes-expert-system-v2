import { useState, useMemo } from 'react'
import {
  Beaker,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Activity,
  AlertTriangle,
} from 'lucide-react'

/* ── client-side condition evaluator ──────────────────────────── */
function parseValue(raw) {
  if (raw === true || raw === 'true') return true
  if (raw === false || raw === 'false') return false
  const n = Number(raw)
  return Number.isNaN(n) ? raw : n
}

function evaluateCondition(condition, facts) {
  const { fact_key, operator, expected_value } = condition
  const actual = facts[fact_key]

  if (actual === undefined || actual === null || actual === '') return false

  const a = parseValue(actual)
  const e = parseValue(expected_value)

  switch (operator) {
    case '==':  return a == e  // eslint-disable-line eqeqeq
    case '!=':  return a != e  // eslint-disable-line eqeqeq
    case '>':   return Number(a) > Number(e)
    case '<':   return Number(a) < Number(e)
    case '>=':  return Number(a) >= Number(e)
    case '<=':  return Number(a) <= Number(e)
    case 'in':  return Array.isArray(e) ? e.includes(a) : String(e).includes(String(a))
    case 'contains': return String(a).toLowerCase().includes(String(e).toLowerCase())
    default:    return a == e  // eslint-disable-line eqeqeq
  }
}

function evaluateRule(rule, facts) {
  const conditions = rule.conditions || []
  if (!conditions.length) return { match: false, details: [] }

  const details = conditions.map((c) => ({
    ...c,
    passed: evaluateCondition(c, facts),
    actualValue: facts[c.fact_key],
  }))

  let result = details[0].passed
  for (let i = 1; i < details.length; i++) {
    const d = details[i]
    result = d.logical_operator === 'or' ? result || d.passed : result && d.passed
  }

  return { match: result, details }
}

/* ── quick-fill presets ──────────────────────────────────── */
const PRESETS = {
  healthy: {
    label: 'Healthy Adult',
    facts: { age: '35', bmi: '22', fasting_glucose: '85', hba1c: '5.0', fasting_plasma_glucose: '85', frequent_urination: 'false', excessive_thirst: 'false', fatigue: 'false', weight_loss: 'false', family_history_diabetes: 'false', physical_activity_low: 'false' },
  },
  prediabetes: {
    label: 'Pre-Diabetes',
    facts: { age: '52', bmi: '28', fasting_glucose: '110', hba1c: '6.0', fasting_plasma_glucose: '110', frequent_urination: 'false', excessive_thirst: 'false', fatigue: 'true', weight_loss: 'false', family_history_diabetes: 'true', physical_activity_low: 'true' },
  },
  t2dm: {
    label: 'Type 2 Diabetes',
    facts: { age: '55', bmi: '32', fasting_glucose: '145', hba1c: '7.8', fasting_plasma_glucose: '145', frequent_urination: 'true', excessive_thirst: 'true', fatigue: 'true', weight_loss: 'false', family_history_diabetes: 'true', physical_activity_low: 'true' },
  },
  dka: {
    label: 'DKA Crisis',
    facts: { age: '28', bmi: '20', fasting_glucose: '380', hba1c: '12.0', random_plasma_glucose: '380', blood_glucose: '380', fasting_plasma_glucose: '380', frequent_urination: 'true', excessive_thirst: 'true', fatigue: 'true', weight_loss: 'true', nausea: 'true', vomiting: 'true', abdominal_pain: 'true', family_history_diabetes: 'false', physical_activity_low: 'false' },
  },
}

const INPUT_GROUPS = [
  {
    title: 'Demographics',
    fields: [
      { key: 'age', label: 'Age', type: 'number', placeholder: 'e.g. 45' },
      { key: 'bmi', label: 'BMI', type: 'number', placeholder: 'e.g. 27.5' },
    ],
  },
  {
    title: 'Lab Values',
    fields: [
      { key: 'fasting_glucose', label: 'Fasting Glucose', type: 'number', placeholder: 'mg/dL' },
      { key: 'fasting_plasma_glucose', label: 'Fasting Plasma Glucose', type: 'number', placeholder: 'mg/dL' },
      { key: 'hba1c', label: 'HbA1c', type: 'number', placeholder: '%' },
      { key: '2h_ogtt_75g', label: '2h OGTT', type: 'number', placeholder: 'mg/dL' },
      { key: 'random_plasma_glucose', label: 'Random Plasma Glucose', type: 'number', placeholder: 'mg/dL' },
      { key: 'blood_glucose', label: 'Blood Glucose', type: 'number', placeholder: 'mg/dL' },
    ],
  },
  {
    title: 'Symptoms',
    fields: [
      { key: 'frequent_urination', label: 'Frequent Urination', type: 'toggle' },
      { key: 'excessive_thirst', label: 'Excessive Thirst', type: 'toggle' },
      { key: 'fatigue', label: 'Fatigue', type: 'toggle' },
      { key: 'blurred_vision', label: 'Blurred Vision', type: 'toggle' },
      { key: 'weight_loss', label: 'Weight Loss', type: 'toggle' },
      { key: 'nausea', label: 'Nausea', type: 'toggle' },
      { key: 'vomiting', label: 'Vomiting', type: 'toggle' },
      { key: 'abdominal_pain', label: 'Abdominal Pain', type: 'toggle' },
      { key: 'tingling_hands_feet', label: 'Tingling Hands/Feet', type: 'toggle' },
      { key: 'frequent_infections', label: 'Frequent Infections', type: 'toggle' },
      { key: 'acanthosis_nigricans', label: 'Dark Skin Patches (Acanthosis Nigricans)', type: 'toggle' },
    ],
  },
  {
    title: 'Risk Factors',
    fields: [
      { key: 'family_history_diabetes', label: 'Family History', type: 'toggle' },
      { key: 'physical_activity_low', label: 'Low Physical Activity', type: 'toggle' },
      { key: 'sedentary_lifestyle', label: 'Sedentary Lifestyle', type: 'toggle' },
      { key: 'high_cholesterol', label: 'High Cholesterol', type: 'toggle' },
      { key: 'pcos_history', label: 'PCOS History', type: 'toggle' },
      { key: 'ethnicity_high_risk', label: 'High Risk Ethnicity', type: 'toggle' },
    ],
  },
]

export function RuleSimulator({ rules = [] }) {
  const [facts, setFacts] = useState({})
  const [expanded, setExpanded] = useState(true)
  const [showDetails, setShowDetails] = useState(null)

  const activeRules = useMemo(() => rules.filter((r) => r.status === 'active'), [rules])

  const results = useMemo(() => {
    const hasInput = Object.values(facts).some((v) => v !== '' && v !== undefined && v !== null)
    if (!hasInput) return null

    return activeRules.map((rule) => {
      const { match, details } = evaluateRule(rule, facts)
      return { rule, match, details }
    })
  }, [activeRules, facts])

  const matchedCount = results?.filter((r) => r.match).length || 0
  const totalTested = results?.length || 0

  function updateFact(key, value) {
    setFacts((prev) => ({ ...prev, [key]: value }))
  }

  function applyPreset(presetKey) {
    setFacts(PRESETS[presetKey].facts)
  }

  function clearAll() {
    setFacts({})
    setShowDetails(null)
  }

  return (
    <div className="surface overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-slate-50/50 dark:hover:bg-[#0c1024]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20">
            <Beaker className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Rule Simulation Sandbox</h3>
            <p className="text-xs text-slate-500">Test patient scenarios against active rules without saving records</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {results && (
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium dark:bg-slate-800">
              <Zap className="h-3 w-3 text-amber-500" />
              <span className="text-emerald-600 dark:text-emerald-400">{matchedCount} matched</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600 dark:text-slate-300">{totalTested} rules</span>
            </div>
          )}
          {expanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-[#1b2342]">
          <div className="grid gap-6 p-6 xl:grid-cols-[1fr_1fr]">

            {/* Input Panel */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Test Patient Data</h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="h-3 w-3" /> Clear
                  </button>
                </div>
              </div>

              {/* Presets */}
              <div className="mb-4 flex flex-wrap gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-violet-600 dark:hover:bg-violet-900/20"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Input Fields */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {INPUT_GROUPS.map((group) => (
                  <div key={group.title}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.fields.map((field) => (
                        <div key={field.key}>
                          {field.type === 'toggle' ? (
                            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800">
                              <input
                                type="checkbox"
                                checked={facts[field.key] === 'true' || facts[field.key] === true}
                                onChange={(e) => updateFact(field.key, e.target.checked ? 'true' : 'false')}
                                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                              />
                              <span className="text-slate-700 dark:text-slate-300">{field.label}</span>
                            </label>
                          ) : (
                            <label className="block">
                              <span className="mb-1 block text-xs text-slate-500">{field.label}</span>
                              <input
                                type="number"
                                step="any"
                                className="input-base py-1.5 text-sm"
                                placeholder={field.placeholder}
                                value={facts[field.key] || ''}
                                onChange={(e) => updateFact(field.key, e.target.value)}
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Results Panel */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Simulation Results</h4>

              {!results ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-700">
                  <Activity className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-slate-500">Enter test data to simulate</p>
                  <p className="mt-1 text-xs text-slate-400">Use presets above for quick scenarios</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                  {/* Summary Bar */}
                  <div className={`mb-3 flex items-center gap-3 rounded-xl p-3 text-sm font-medium ${
                    matchedCount > 0
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}>
                    {matchedCount > 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-slate-400" />
                    )}
                    {matchedCount} of {totalTested} active rules triggered
                  </div>

                  {/* Matched rules first, then unmatched */}
                  {results
                    .sort((a, b) => (b.match ? 1 : 0) - (a.match ? 1 : 0))
                    .map(({ rule, match, details }) => (
                      <div
                        key={rule.id}
                        className={`rounded-xl border p-3 transition-all ${
                          match
                            ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-900/10'
                            : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            {match ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            ) : (
                              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                            )}
                            <div className="min-w-0">
                              <p className={`truncate text-sm font-semibold ${match ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                {rule.name}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                {rule.category} | CF: {rule.certainty_factor} | {rule.conclusion}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowDetails(showDetails === rule.id ? null : rule.id)}
                            className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {showDetails === rule.id ? 'Hide' : 'Details'}
                          </button>
                        </div>

                        {showDetails === rule.id && (
                          <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 dark:border-slate-800">
                            {details.map((d, i) => (
                              <div
                                key={i}
                                className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${
                                  d.passed
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                                }`}
                              >
                                {d.passed ? (
                                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                                ) : (
                                  <XCircle className="h-3 w-3 shrink-0" />
                                )}
                                <span className="font-mono">
                                  {i > 0 ? `${d.logical_operator?.toUpperCase()} ` : ''}
                                  {d.fact_key} {d.operator} {JSON.stringify(d.expected_value)}
                                </span>
                                <span className="ml-auto text-[10px] opacity-70">
                                  actual: {d.actualValue !== undefined ? String(d.actualValue) : 'N/A'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
