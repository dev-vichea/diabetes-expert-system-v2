import { useEffect, useMemo, useState } from 'react'
import { Search, BookOpen } from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { RuleSimulator } from '@/components/knowledge-base/RuleSimulator'
import { KnowledgeBaseDashboard } from '@/components/knowledge-base/KnowledgeBaseDashboard'
import { VisualLogicMap } from '@/components/knowledge-base/VisualLogicMap'
import { useLanguage } from '@/contexts/LanguageContext'
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
  Tabs, TabsList, TabsTrigger, TabsContent,
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
  const { t, tExact } = useLanguage()
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
  const [ruleSearch, setRuleSearch] = useState('')

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

  const filteredRules = useMemo(() => {
    if (!ruleSearch.trim()) return rules
    const q = ruleSearch.toLowerCase()
    return rules.filter((r) =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q) ||
      (r.conclusion || '').toLowerCase().includes(q)
    )
  }, [rules, ruleSearch])

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
    <Tabs defaultValue="dashboard" className="w-full space-y-5">
      <div className="flex items-center justify-between pb-1">
        <TabsList>
          <TabsTrigger value="dashboard">{t('rules.tabs.overview', 'Overview')}</TabsTrigger>
          <TabsTrigger value="editor">{t('rules.tabs.editor', 'Rule Editor')}</TabsTrigger>
          <TabsTrigger value="visual">{t('rules.tabs.visual', 'Visual Graph')}</TabsTrigger>
          <TabsTrigger value="simulator">{t('rules.tabs.sandbox', 'Sandbox')}</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="dashboard" className="mt-0">
        <KnowledgeBaseDashboard />
      </TabsContent>

      <TabsContent value="visual" className="mt-0 h-[600px]">
        <SectionCard bodyClassName="flex flex-1 min-h-0 flex-col p-0 h-full overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0c1024]">
            <div>
              <h2 className="section-title">{t('rules.dashboard.visualLogicGraph', 'Visual Logic Graph')}</h2>
              <p className="text-xs text-slate-500 mt-1">
                {t('rules.dashboard.visualizingRule', 'Visualizing rule:')} <span className="font-semibold text-cyan-600">{form.name || t('rules.dashboard.unnamedRule', 'Unnamed Rule')}</span>
              </p>
            </div>
            {selectedRule && selectedRule.status !== 'archived' ? (
              <button type="button" className="btn-primary py-1.5 px-3 text-xs" onClick={saveRule} disabled={saving}>
                 {saving ? t('rules.dashboard.saving', 'Saving...') : t('rules.dashboard.saveRule', 'Save Rule')}
              </button>
            ) : null}
          </div>
          <div className="flex-1 w-full relative min-h-0 bg-slate-50 dark:bg-slate-900/20">
            <VisualLogicMap form={form} />
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="editor" className="mt-0 space-y-5">
      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cyan-600" />
            {t('rules.dashboard.knowledgeBaseRules', 'Knowledge Base Rules')}
            <span className="ml-1 inline-flex items-center rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
              {filteredRules.length}
            </span>
          </span>
        }
        description={t('rules.dashboard.filterSelectReview', "Filter and select a rule to review versions and edit conditions.")}
        className="max-h-[30rem]"
        bodyClassName="flex flex-1 min-h-0 flex-col"
      >
          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('rules.dashboard.searchPlaceholder', "Search rules by name, category, or conclusion...")}
              value={ruleSearch}
              onChange={(e) => setRuleSearch(e.target.value)}
              className="input-base w-full pl-9 py-2 text-sm"
            />
          </div>

          <FilterBar className="mt-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
            <AppSelect
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
              includeEmpty
              emptyLabel={t('rules.dashboard.allCategories', "All categories")}
              options={categoryOptions}
            />

            <AppSelect
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
              includeEmpty
              emptyLabel={t('rules.dashboard.allStatuses', "All statuses")}
              options={[
                { value: 'active', label: t('rules.dropdowns.active', 'Active') },
                { value: 'inactive', label: t('rules.dropdowns.inactive', 'Inactive') },
                { value: 'archived', label: t('rules.dropdowns.archived', 'Archived') },
              ]}
            />

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" checked={filters.include_archived} onChange={(event) => setFilters({ ...filters, include_archived: event.target.checked })} />
              {t('rules.dashboard.includeArchived', 'Include archived')}
            </label>

            <button type="button" className="btn-secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>{t('rules.dashboard.reset', 'Reset')}</button>
          </FilterBar>

          <DataTable
            className="no-scrollbar mt-4 flex-1 min-h-0 overflow-y-auto"
            columns={[
              { key: 'name', label: t('rules.dashboard.columns.name', 'Name') },
              { key: 'category', label: t('rules.dashboard.columns.category', 'Category') },
              { key: 'status', label: t('rules.dashboard.columns.status', 'Status') },
              { key: 'priority', label: t('rules.dashboard.columns.priority', 'Priority') },
              { key: 'version', label: t('rules.dashboard.columns.version', 'Version') },
            ]}
            loading={loading}
            isEmpty={!filteredRules.length}
            loadingMessage={t('rules.dashboard.loadingRules', "Loading rules...")}
            emptyTitle={ruleSearch ? t('rules.dashboard.noRulesSearch', "No rules match your search.") : t('rules.dashboard.noRulesFound', "No rules found.")}
          >
            {filteredRules.map((rule) => (
              <tr
                key={rule.id}
                onClick={() => selectRule(rule.id)}
                className={`table-row-hover ${selectedRuleId === rule.id ? 'table-row-selected' : ''}`}
              >
                <td className="font-semibold text-slate-900 dark:text-slate-100">{tExact(rule.name)}</td>
                <td>
                  <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {rule.category}
                  </span>
                </td>
                <td><StatusBadge tone={statusTone(rule.status)}>{rule.status}</StatusBadge></td>
                <td><StatusBadge tone={priorityTone(rule.priority)}>{rule.priority}</StatusBadge></td>
                <td className="text-center font-mono text-sm text-slate-500">{rule.version}</td>
              </tr>
            ))}
          </DataTable>
        </SectionCard>

      <SectionCard bodyClassName="flex flex-1 min-h-0 flex-col">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
              <h2 className="section-title">{selectedRule ? t('rules.editor.editRule', 'Edit Rule') : t('rules.editor.createRule', 'Create Rule')}</h2>
              <p className="section-subtitle mt-1">
                {t('rules.editor.subtitle', 'Write simple clinical logic for doctors. Example: if fasting glucose is 126 or higher, set diabetes possible.')}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={resetEditor}>{t('rules.editor.newRule', 'New Rule')}</button>
              {selectedRule?.status === 'archived' ? (
                <button type="button" className="btn-secondary" onClick={unarchiveSelectedRule} disabled={unarchiving}>
                  {unarchiving ? t('rules.editor.restoring', 'Restoring...') : t('rules.editor.unarchive', 'Unarchive')}
                </button>
              ) : null}
              {selectedRule && selectedRule.status !== 'archived' ? (
                <button type="button" className="btn-danger" onClick={() => setShowArchiveDialog(true)}>{t('rules.editor.archive', 'Archive')}</button>
              ) : null}
            </div>
          </div>

          <form onSubmit={saveRule} className="no-scrollbar flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
            <label className="block">
              <span className="label-text">{t('rules.editor.ruleName', 'Rule Name')}</span>
              <input className="input-base" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label-text">{t('rules.editor.category', 'Category')}</span>
                <AppSelect
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                  options={categoryOptions}
                />
              </label>

              <label className="block">
                <span className="label-text">{t('rules.editor.conclusion', 'Conclusion')}</span>
                <input className="input-base" value={form.conclusion} onChange={(event) => setForm({ ...form, conclusion: event.target.value })} required />
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/30 p-3 dark:border-slate-700 dark:bg-slate-900/20">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  {t('rules.editor.conditions', 'Conditions')}
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400">
                    {form.conditions.length}
                  </span>
                </p>
                <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={addCondition}>{t('rules.editor.addCondition', '+ Add Condition')}</button>
              </div>

              <div className="space-y-2">
                {form.conditions.map((condition, index) => (
                  <div key={`condition-${index}`} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800/50 sm:grid-cols-[90px_1.2fr_0.7fr_1fr_auto]">
                    {index > 0 ? (
                      <AppSelect
                        value={condition.logical_operator}
                        onValueChange={(value) => updateCondition(index, 'logical_operator', value)}
                        showIcon={false}
                        className="justify-center text-center [&>span]:w-full [&>span]:text-center"
                        options={[
                          { value: 'and', label: 'AND' },
                          { value: 'or', label: 'OR' },
                        ]}
                      />
                    ) : (
                      <div className="input-base flex items-center justify-center bg-cyan-50 text-xs font-bold uppercase text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">IF</div>
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
                      className="justify-center text-center font-mono [&>span]:w-full [&>span]:text-center"
                      options={OPERATOR_OPTIONS}
                    />
                    <input
                      className="input-base font-mono text-sm"
                      value={condition.expected_value ?? ''}
                      onChange={(event) => updateCondition(index, 'expected_value', event.target.value)}
                      placeholder={t('rules.editor.expectedValue', "Expected value")}
                    />
                    <button type="button" className="btn-secondary text-xs hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-900/20 dark:hover:text-rose-400" onClick={() => removeCondition(index)}>{t('rules.editor.remove', 'Remove')}</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="label-text">{t('rules.editor.certaintyFactor', 'Certainty Factor')}</span>
                <input className="input-base" type="number" step="0.01" min="0" max="1" value={form.certainty_factor} onChange={(event) => setForm({ ...form, certainty_factor: event.target.value })} />
              </label>

              <label className="block">
                <span className="label-text">{t('rules.editor.priority', 'Priority')}</span>
                <AppSelect
                  value={form.priority}
                  onValueChange={(value) => setForm({ ...form, priority: value })}
                  options={[
                    { value: 'low', label: t('rules.dropdowns.low', 'Low') },
                    { value: 'medium', label: t('rules.dropdowns.medium', 'Medium') },
                    { value: 'high', label: t('rules.dropdowns.high', 'High') },
                  ]}
                />
              </label>

              <label className="block">
                <span className="label-text">{t('rules.editor.status', 'Status')}</span>
                <AppSelect
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value })}
                  options={[
                    { value: 'active', label: t('rules.dropdowns.active', 'Active') },
                    { value: 'inactive', label: t('rules.dropdowns.inactive', 'Inactive') },
                    { value: 'archived', label: t('rules.dropdowns.archived', 'Archived') },
                  ]}
                />
              </label>
            </div>

            <label className="block">
              <span className="label-text">{t('rules.editor.explanation', 'Explanation')}</span>
              <textarea className="input-base" value={form.explanation} rows={3} onChange={(event) => setForm({ ...form, explanation: event.target.value })} />
            </label>

            <label className="block">
              <span className="label-text">{t('rules.editor.recommendation', 'Recommendation')}</span>
              <textarea className="input-base" value={form.recommendation} rows={3} onChange={(event) => setForm({ ...form, recommendation: event.target.value })} />
            </label>

            <label className="block">
              <span className="label-text">{t('rules.editor.notes', 'Notes')}</span>
              <textarea className="input-base" value={form.description} rows={2} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? t('rules.dashboard.saving', 'Saving...') : selectedRule ? t('rules.editor.updateRule', 'Update Rule') : t('rules.editor.createRule', 'Create Rule')}
          </button>
          </form>
        </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="surface p-5 sm:p-6">
          <h2 className="section-title flex items-center gap-2">
            {t('rules.history.ruleVersions', 'Rule Versions')}
            {selectedRule && versions.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {versions.length}
              </span>
            )}
          </h2>
          {!selectedRule ? <p className="state-box mt-4">{t('rules.history.selectRuleToViewVersions', 'Select a rule to view versions.')}</p> : null}

          <div className="mt-4 table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t('rules.history.columns.version', 'Version')}</th>
                  <th>{t('rules.history.columns.change', 'Change')}</th>
                  <th>{t('rules.history.columns.by', 'By')}</th>
                  <th>{t('rules.history.columns.time', 'Time')}</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.id}>
                    <td>
                      <span className="inline-flex items-center justify-center rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                        v{version.version_number}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {version.change_type}
                      </span>
                    </td>
                    <td>{version.changed_by_name || version.changed_by_user_id || 'N/A'}</td>
                    <td className="text-xs text-slate-500">{formatDateTime(version.created_at)}</td>
                  </tr>
                ))}
                {!versions.length && selectedRule ? (
                  <tr>
                    <td colSpan="4"><div className="state-box">{t('rules.history.noVersionHistory', 'No version history found.')}</div></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-5 sm:p-6">
          <h2 className="section-title flex items-center gap-2">
            {t('rules.history.auditTrail', 'Audit Trail')}
            {selectedRule && auditLogs.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {auditLogs.length}
              </span>
            )}
          </h2>
          {!selectedRule ? <p className="state-box mt-4">{t('rules.history.selectRuleToViewAudit', 'Select a rule to view audit logs.')}</p> : null}

          <div className="mt-4 table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t('rules.history.auditColumns.action', 'Action')}</th>
                  <th>{t('rules.history.auditColumns.by', 'By')}</th>
                  <th>{t('rules.history.auditColumns.time', 'Time')}</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="inline-flex rounded-md bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        {log.action}
                      </span>
                    </td>
                    <td>{log.actor_user_id || 'N/A'}</td>
                    <td className="text-xs text-slate-500">{formatDateTime(log.created_at)}</td>
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
      </TabsContent>

      <TabsContent value="simulator" className="mt-0">
        <RuleSimulator rules={rules} />
      </TabsContent>
    </Tabs>
  )
}
