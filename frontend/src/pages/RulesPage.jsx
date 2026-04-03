import { useEffect, useMemo, useState } from 'react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import {
  AppSelect,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ConfirmDialog,
  DataTable,
  ErrorAlert,
  FilterBar,
  SectionCard,
  StatusBadge,
} from '@/components/ui'

const DEFAULT_FACT_KEYS = [
  'age',
  'bmi',
  'waist_circumference',
  'fasting_glucose',
  'fasting_plasma_glucose',
  'hba1c',
  '2h_ogtt_75g',
  'random_plasma_glucose',
  'blood_glucose',
  'frequent_urination',
  'excessive_thirst',
  'fatigue',
  'blurred_vision',
  'weight_loss',
  'nausea',
  'vomiting',
  'abdominal_pain',
  'sweating',
  'shaking',
  'dizziness',
  'family_history',
  'family_history_diabetes',
  'physical_activity_low',
  'sedentary_lifestyle',
  'prediabetes_possible',
  'hyperglycemia_present',
  'hypoglycemia',
  'symptomatic_hypoglycemia',
  'possible_dka',
  'type2_risk_increased',
  'high_type2_risk_pattern',
  'diabetes_diagnostic_criterion_met',
  'classic_hyperglycemia_symptoms',
  'no_lab_values_available',
  'only_symptoms_available',
  'urgent_flag',
]

const OPERATOR_OPTIONS = [
  { value: '==', label: '=' },
  { value: '!=', label: '!=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: 'in', label: 'in' },
  { value: 'contains', label: 'contains' },
]

const DEFAULT_FILTERS = {
  category: '',
  status: '',
  include_archived: false,
}

const DEFAULT_FORM = {
  name: '',
  category: 'diagnosis',
  conditions: [{ fact_key: 'fasting_glucose', operator: '>=', expected_value: '126', logical_operator: 'and' }],
  conclusion: 'diabetes_possible',
  recommendation: '',
  certainty_factor: 0.8,
  priority: 'medium',
  status: 'active',
  explanation: '',
  description: '',
}

function statusTone(status) {
  if (status === 'active') return 'success'
  if (status === 'inactive') return 'warning'
  return 'neutral'
}

function priorityTone(priority) {
  if (priority === 'high') return 'danger'
  if (priority === 'medium') return 'info'
  return 'neutral'
}

function parseExpectedValueInput(rawValue) {
  const text = String(rawValue ?? '').trim()
  if (!text) return null
  const lowered = text.toLowerCase()
  if (['true', 'yes', 'on', 'y', '1'].includes(lowered)) return true
  if (['false', 'no', 'off', 'n', '0'].includes(lowered)) return false
  if (!Number.isNaN(Number(text))) return Number(text)
  if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }
  return text
}

function toConditionExpectedDisplay(rawValue) {
  if (rawValue == null) return ''
  if (typeof rawValue === 'string') {
    const text = rawValue.trim()
    if (!text) return ''
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed === 'string') return parsed
      return JSON.stringify(parsed)
    } catch {
      return text
    }
  }
  if (typeof rawValue === 'object') return JSON.stringify(rawValue)
  return String(rawValue)
}

function FactKeyCombobox({ value, options, onValueChange }) {
  const normalizedValue = String(value || '').trim()
  const selectedOption = useMemo(
    () => options.find((option) => option.value === normalizedValue) || null,
    [normalizedValue, options]
  )
  const hasExactMatch = options.some((option) => option.value === normalizedValue)
  const items = useMemo(() => {
    if (!normalizedValue || hasExactMatch) return options
    return [
      ...options,
      {
        value: normalizedValue,
        label: `Use "${normalizedValue}"`,
        isCustom: true,
      },
    ]
  }, [hasExactMatch, normalizedValue, options])

  return (
    <Combobox
      items={items}
      value={selectedOption}
      inputValue={normalizedValue}
      openOnInputClick
      itemToStringLabel={(item) => item?.value || ''}
      itemToStringValue={(item) => item?.value || ''}
      isItemEqualToValue={(item, selected) => item?.value === selected?.value && Boolean(item?.isCustom) === Boolean(selected?.isCustom)}
      onInputValueChange={(nextValue) => onValueChange(nextValue)}
      onValueChange={(nextValue) => {
        if (!nextValue) return
        onValueChange(nextValue.value)
      }}
    >
      <ComboboxInput placeholder="Select fact key" autoComplete="off" />
      <ComboboxContent>
        <ComboboxEmpty>{normalizedValue ? 'No matching fact keys.' : 'No fact keys available.'}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem
              key={`${item.isCustom ? 'custom' : 'fact'}-${item.value}`}
              value={item}
              className={item.isCustom ? 'border border-dashed border-cyan-200 bg-cyan-50/60 dark:border-cyan-500/20 dark:bg-cyan-500/5' : undefined}
            >
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item.label}</p>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export function RulesPage() {
  const [rules, setRules] = useState([])
  const [ruleCategories, setRuleCategories] = useState([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [selectedRuleId, setSelectedRuleId] = useState(null)
  const [versions, setVersions] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [unarchiving, setUnarchiving] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [error, setError] = useState('')

  const selectedRule = useMemo(() => rules.find((rule) => rule.id === selectedRuleId) || null, [rules, selectedRuleId])
  const categoryOptions = useMemo(
    () => (ruleCategories || [])
      .filter((category) => category.code)
      .map((category) => ({ value: category.code, label: category.name || category.code })),
    [ruleCategories]
  )
  const factKeyOptions = useMemo(() => {
    const discovered = new Set(DEFAULT_FACT_KEYS)
    for (const rule of rules) {
      for (const condition of rule.conditions || []) {
        if (condition?.fact_key) discovered.add(String(condition.fact_key))
      }
    }
    return Array.from(discovered).sort().map((value) => ({ value, label: value }))
  }, [rules])

  useEffect(() => {
    loadRuleCategories()
  }, [])

  useEffect(() => {
    loadRules()
  }, [filters])

  useEffect(() => {
    if (!selectedRuleId) {
      setVersions([])
      setAuditLogs([])
      return
    }
    loadRuleHistory(selectedRuleId)
  }, [selectedRuleId])

  async function loadRules() {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      if (filters.category) params.set('category', filters.category)
      if (filters.status) params.set('status', filters.status)
      if (filters.include_archived) params.set('include_archived', 'true')

      const response = await api.get(`/rules/?${params.toString()}`)
      const loadedRules = getApiData(response) || []
      setRules(loadedRules)

      if (selectedRuleId && !loadedRules.some((row) => row.id === selectedRuleId)) {
        setSelectedRuleId(null)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load rules'))
    } finally {
      setLoading(false)
    }
  }

  async function loadRuleCategories() {
    try {
      const response = await api.get('/rules/categories')
      const categories = getApiData(response) || []
      setRuleCategories(categories)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load rule categories'))
    }
  }

  async function loadRuleHistory(ruleId) {
    try {
      const [versionsResponse, auditResponse] = await Promise.all([
        api.get(`/rules/${ruleId}/versions?limit=30`),
        api.get(`/rules/${ruleId}/audit?limit=50`),
      ])
      setVersions(getApiData(versionsResponse) || [])
      setAuditLogs(getApiData(auditResponse) || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load rule history'))
    }
  }

  function resetEditor() {
    setSelectedRuleId(null)
    setForm(DEFAULT_FORM)
  }

  async function selectRule(ruleId) {
    setError('')
    try {
      const response = await api.get(`/rules/${ruleId}`)
      const rule = getApiData(response)

      setSelectedRuleId(rule.id)
      setForm({
        name: rule.name || '',
        category: rule.category || 'diagnosis',
        conditions: (rule.conditions || []).length
          ? rule.conditions.map((condition) => ({
            fact_key: condition.fact_key || '',
            operator: condition.operator || '==',
            expected_value: toConditionExpectedDisplay(condition.expected_value),
            logical_operator: condition.logical_operator || 'and',
          }))
          : [{ fact_key: '', operator: '==', expected_value: '', logical_operator: 'and' }],
        conclusion: rule.conclusion || '',
        recommendation: rule.recommendation || '',
        certainty_factor: rule.certainty_factor ?? 0.5,
        priority: rule.priority || 'medium',
        status: rule.status || 'active',
        explanation: rule.explanation || '',
        description: rule.description || '',
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load selected rule'))
    }
  }

  function updateCondition(index, field, value) {
    const nextConditions = form.conditions.map((condition, currentIndex) => {
      if (currentIndex !== index) return condition
      return { ...condition, [field]: value }
    })
    setForm({ ...form, conditions: nextConditions })
  }

  function addCondition() {
    setForm({
      ...form,
      conditions: [...form.conditions, { fact_key: '', operator: '==', expected_value: '', logical_operator: 'and' }],
    })
  }

  function removeCondition(index) {
    if (form.conditions.length <= 1) return
    setForm({ ...form, conditions: form.conditions.filter((_, currentIndex) => currentIndex !== index) })
  }

  async function saveRule(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const normalizedConditions = (form.conditions || [])
        .map((condition, index) => ({
          fact_key: String(condition.fact_key || '').trim(),
          operator: String(condition.operator || '==').trim(),
          expected_value: parseExpectedValueInput(condition.expected_value),
          logical_operator: index === 0 ? 'and' : (condition.logical_operator || 'and'),
          sequence: index + 1,
        }))
        .filter((condition) => condition.fact_key)

      if (!normalizedConditions.length) {
        setError('At least one condition with fact key is required.')
        setSaving(false)
        return
      }

      const payload = {
        name: form.name,
        category: form.category,
        conditions: normalizedConditions,
        conclusion: form.conclusion,
        recommendation: form.recommendation || null,
        certainty_factor: Number(form.certainty_factor),
        priority: form.priority,
        status: form.status,
        explanation: form.explanation || null,
        description: form.description || '',
      }

      if (selectedRuleId) {
        await api.patch(`/rules/${selectedRuleId}`, payload)
      } else {
        await api.post('/rules/', payload)
      }

      await loadRules()

      if (selectedRuleId) {
        await selectRule(selectedRuleId)
      } else {
        resetEditor()
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save rule'))
    } finally {
      setSaving(false)
    }
  }

  async function archiveSelectedRule() {
    if (!selectedRuleId) return
    setArchiving(true)
    setError('')
    try {
      await api.delete(`/rules/${selectedRuleId}`)
      setShowArchiveDialog(false)
      setFilters((prev) => ({
        ...prev,
        status: '',
        include_archived: true,
      }))
      await selectRule(selectedRuleId)
      await loadRuleHistory(selectedRuleId)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to archive rule'))
    } finally {
      setArchiving(false)
    }
  }

  async function unarchiveSelectedRule() {
    if (!selectedRuleId) return
    setUnarchiving(true)
    setError('')
    try {
      await api.patch(`/rules/${selectedRuleId}`, { status: 'active' })
      setFilters((prev) => ({
        ...prev,
        status: '',
        include_archived: true,
      }))
      await loadRules()
      await selectRule(selectedRuleId)
      await loadRuleHistory(selectedRuleId)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to unarchive rule'))
    } finally {
      setUnarchiving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Knowledge Base Rules"
          description="Filter and select a rule to review versions and edit conditions."
          className="h-[calc(100vh-18rem)] min-h-[26rem] max-h-[44rem]"
          bodyClassName="flex flex-1 min-h-0 flex-col"
        >
          <FilterBar className="mt-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
            <AppSelect
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
              includeEmpty
              emptyLabel="All categories"
              options={categoryOptions}
            />

            <AppSelect
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
              includeEmpty
              emptyLabel="All statuses"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'archived', label: 'Archived' },
              ]}
            />

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <input type="checkbox" checked={filters.include_archived} onChange={(event) => setFilters({ ...filters, include_archived: event.target.checked })} />
              Include archived
            </label>

            <button type="button" className="btn-secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset</button>
          </FilterBar>

          <DataTable
            className="no-scrollbar mt-4 flex-1 min-h-0 overflow-y-auto"
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'category', label: 'Category' },
              { key: 'status', label: 'Status' },
              { key: 'priority', label: 'Priority' },
              { key: 'version', label: 'Version' },
            ]}
            loading={loading}
            isEmpty={!rules.length}
            loadingMessage="Loading rules..."
            emptyTitle="No rules found."
          >
            {rules.map((rule) => (
              <tr
                key={rule.id}
                onClick={() => selectRule(rule.id)}
                className={`table-row-hover ${selectedRuleId === rule.id ? 'table-row-selected' : ''}`}
              >
                <td className="font-semibold text-slate-900">{rule.name}</td>
                <td>{rule.category}</td>
                <td><StatusBadge tone={statusTone(rule.status)}>{rule.status}</StatusBadge></td>
                <td><StatusBadge tone={priorityTone(rule.priority)}>{rule.priority}</StatusBadge></td>
                <td>{rule.version}</td>
              </tr>
            ))}
          </DataTable>
        </SectionCard>

        <SectionCard className="h-[calc(100vh-18rem)] min-h-[26rem] max-h-[44rem]" bodyClassName="flex flex-1 min-h-0 flex-col">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="section-title">{selectedRule ? 'Edit Rule' : 'Create Rule'}</h2>
              <p className="section-subtitle mt-1">
                Write simple clinical logic for doctors. Example: if fasting glucose is 126 or higher, set diabetes possible.
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={resetEditor}>New Rule</button>
              {selectedRule?.status === 'archived' ? (
                <button type="button" className="btn-secondary" onClick={unarchiveSelectedRule} disabled={unarchiving}>
                  {unarchiving ? 'Restoring...' : 'Unarchive'}
                </button>
              ) : null}
              {selectedRule && selectedRule.status !== 'archived' ? (
                <button type="button" className="btn-danger" onClick={() => setShowArchiveDialog(true)}>Archive</button>
              ) : null}
            </div>
          </div>

          <form onSubmit={saveRule} className="no-scrollbar flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
            <label className="block">
              <span className="label-text">Rule Name</span>
              <input className="input-base" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label-text">Category</span>
                <AppSelect
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                  options={categoryOptions}
                />
              </label>

              <label className="block">
                <span className="label-text">Conclusion</span>
                <input className="input-base" value={form.conclusion} onChange={(event) => setForm({ ...form, conclusion: event.target.value })} required />
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">Conditions</p>
                <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={addCondition}>Add Condition</button>
              </div>

              <div className="space-y-2">
                {form.conditions.map((condition, index) => (
                  <div key={`condition-${index}`} className="grid gap-2 sm:grid-cols-[90px_1.2fr_0.7fr_1fr_auto]">
                    {index > 0 ? (
                      <AppSelect
                        value={condition.logical_operator}
                        onValueChange={(value) => updateCondition(index, 'logical_operator', value)}
                        showIcon={false}
                        className="justify-center text-center [&>span]:w-full [&>span]:text-center"
                        options={[
                          { value: 'and', label: 'and' },
                          { value: 'or', label: 'or' },
                        ]}
                      />
                    ) : (
                      <div className="input-base flex items-center justify-center bg-slate-50 text-xs font-semibold uppercase text-slate-500">if</div>
                    )}
                    <FactKeyCombobox
                      value={condition.fact_key || ''}
                      options={factKeyOptions}
                      onValueChange={(value) => updateCondition(index, 'fact_key', value)}
                    />
                    <AppSelect
                      value={condition.operator || '=='}
                      onValueChange={(value) => updateCondition(index, 'operator', value)}
                      showIcon={false}
                      className="justify-center text-center [&>span]:w-full [&>span]:text-center"
                      options={OPERATOR_OPTIONS}
                    />
                    <input
                      className="input-base"
                      value={condition.expected_value ?? ''}
                      onChange={(event) => updateCondition(index, 'expected_value', event.target.value)}
                      placeholder="Expected value"
                    />
                    <button type="button" className="btn-secondary" onClick={() => removeCondition(index)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="label-text">Certainty Factor</span>
                <input className="input-base" type="number" step="0.01" min="0" max="1" value={form.certainty_factor} onChange={(event) => setForm({ ...form, certainty_factor: event.target.value })} />
              </label>

              <label className="block">
                <span className="label-text">Priority</span>
                <AppSelect
                  value={form.priority}
                  onValueChange={(value) => setForm({ ...form, priority: value })}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                  ]}
                />
              </label>

              <label className="block">
                <span className="label-text">Status</span>
                <AppSelect
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value })}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                />
              </label>
            </div>

            <label className="block">
              <span className="label-text">Explanation</span>
              <textarea className="input-base" value={form.explanation} rows={3} onChange={(event) => setForm({ ...form, explanation: event.target.value })} />
            </label>

            <label className="block">
              <span className="label-text">Recommendation</span>
              <textarea className="input-base" value={form.recommendation} rows={3} onChange={(event) => setForm({ ...form, recommendation: event.target.value })} />
            </label>

            <label className="block">
              <span className="label-text">Notes</span>
              <textarea className="input-base" value={form.description} rows={2} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving...' : selectedRule ? 'Update Rule' : 'Create Rule'}
          </button>
          </form>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="surface p-5 sm:p-6">
          <h2 className="section-title">Rule Versions</h2>
          {!selectedRule ? <p className="state-box mt-4">Select a rule to view versions.</p> : null}

          <div className="mt-4 table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Change</th>
                  <th>By</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.id}>
                    <td>{version.version_number}</td>
                    <td>{version.change_type}</td>
                    <td>{version.changed_by_name || version.changed_by_user_id || 'N/A'}</td>
                    <td>{formatDateTime(version.created_at)}</td>
                  </tr>
                ))}
                {!versions.length && selectedRule ? (
                  <tr>
                    <td colSpan="4"><div className="state-box">No version history found.</div></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-5 sm:p-6">
          <h2 className="section-title">Audit Trail</h2>
          {!selectedRule ? <p className="state-box mt-4">Select a rule to view audit logs.</p> : null}

          <div className="mt-4 table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>By</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.action}</td>
                    <td>{log.actor_user_id || 'N/A'}</td>
                    <td>{formatDateTime(log.created_at)}</td>
                  </tr>
                ))}
                {!auditLogs.length && selectedRule ? (
                  <tr>
                    <td colSpan="3"><div className="state-box">No audit history found.</div></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ErrorAlert message={error} />

      <ConfirmDialog
        open={showArchiveDialog}
        title="Archive Rule"
        description="This rule will be moved to archived status and removed from active decision flow."
        confirmLabel="Archive Rule"
        cancelLabel="Cancel"
        loading={archiving}
        onCancel={() => setShowArchiveDialog(false)}
        onConfirm={archiveSelectedRule}
      />
    </div>
  )
}
