import { Suspense, useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, Download, Pencil, Plus, Search, Settings2, Trash2, BookOpen } from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../api/client'
import { formatDateTime } from '@/lib/datetime'
import { lazyWithRetry } from '@/lib/lazyWithRetry'
import { RuleSimulator } from '@/components/knowledge-base/RuleSimulator'
import { KnowledgeBaseDashboard } from '@/components/knowledge-base/KnowledgeBaseDashboard'
import { FactCatalog } from '@/components/knowledge-base/FactCatalog'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoadingState } from '@/components/ui/LoadingState'
import {
  AppSelect,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ConfirmDialog,
  ErrorAlert,
  SectionCard,
  StatusBadge,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui'

// The @xyflow graph editor is heavy (~127 kB min / 41 kB gzipped with deps) —
// fetch it only when the user opens the "Visual Graph" tab.
const VisualLogicMap = lazyWithRetry(() => import('@/components/knowledge-base/VisualLogicMap').then((m) => ({ default: m.VisualLogicMap })))

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

// Blueprint-style tone palette for category avatars/badges (Users-page look).
const RULE_TONES = {
  diagnosis: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  recommendation: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  screening: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  emergency: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  lifestyle: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  follow_up: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  monitoring: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
}

function ruleTone(category) {
  if (RULE_TONES[category]) return RULE_TONES[category]
  const keys = Object.keys(RULE_TONES)
  let hash = 0
  for (const ch of String(category || '')) hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return RULE_TONES[keys[hash % keys.length]]
}

function ruleInitials(name) {
  const initials = String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || '')
    .join('')
    .toUpperCase()
  return initials || '?'
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
  const [filters, setFilters] = useState({ category: '', status: '', include_archived: true })
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
  const [message, setMessage] = useState('')
  const [ruleSearch, setRuleSearch] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [visibleColumns, setVisibleColumns] = useState({ category: true, status: true, priority: true, version: true })
  const [showColumnMenu, setShowColumnMenu] = useState(false)

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

  // --- Blueprint table: sort + pagination (client-side) ---
  const sortedRules = useMemo(() => {
    const arr = [...filteredRules]
    const direction = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      if (sortKey === 'version') return (Number(a.version || 0) - Number(b.version || 0)) * direction
      return String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')) * direction
    })
    return arr
  }, [filteredRules, sortKey, sortDir])

  const totalRules = sortedRules.length
  const totalPages = Math.max(1, Math.ceil(totalRules / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedRules = useMemo(
    () => sortedRules.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sortedRules, safePage, pageSize]
  )
  const pageNumbers = useMemo(() => {
    const maxButtons = 5
    let start = Math.max(1, safePage - Math.floor(maxButtons / 2))
    const end = Math.min(totalPages, start + maxButtons - 1)
    start = Math.max(1, end - maxButtons + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])
  const tableColSpan = 2 + ['category', 'status', 'priority', 'version'].filter((key) => visibleColumns[key]).length
  const statusPill = filters.status || 'all'

  function setStatusPill(pill) {
    if (pill === 'all') setFilters({ ...filters, status: '', include_archived: true })
    else setFilters({ ...filters, status: pill, include_archived: pill === 'archived' })
  }

  function toggleSort(colKey) {
    if (sortKey === colKey) setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(colKey)
      setSortDir('asc')
    }
  }

  function exportRulesCsv() {
    const columns = ['name', 'category', 'status', 'priority', 'version', 'conclusion']
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const lines = [columns.join(',')]
    for (const rule of sortedRules) lines.push(columns.map((col) => escape(rule[col])).join(','))
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'knowledge-base-rules.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const renderSortTh = (colKey, label) => {
    const active = sortKey === colKey
    return (
      <button
        type="button"
        className={`inline-flex items-center gap-1 uppercase transition hover:text-slate-700 dark:hover:text-slate-200 ${active ? 'text-slate-700 dark:text-slate-200' : ''}`}
        onClick={() => toggleSort(colKey)}
      >
        {label}
        <ArrowUpDown className={`h-3.5 w-3.5 ${active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
      </button>
    )
  }

  useEffect(() => {
    loadRuleCategories()
  }, [])

  useEffect(() => {
    loadRules()
  }, [filters])

  // Jump back to the first page whenever the result set changes.
  useEffect(() => {
    setPage(1)
  }, [ruleSearch, filters, pageSize])

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

  function closeEditor() {
    // Keep the last-edited form in memory so the Visual Graph tab keeps
    // rendering the rule and the Radix exit animation can play.
    setEditorOpen(false)
  }

  async function fetchRuleIntoForm(ruleId) {
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
  }

  async function openRuleEditor(ruleId) {
    setError('')
    setMessage('')
    setEditorOpen(true)
    try {
      await fetchRuleIntoForm(ruleId)
    } catch (err) {
      setEditorOpen(false)
      setError(getApiErrorMessage(err, 'Failed to load selected rule'))
    }
  }

  function openCreateEditor() {
    setSelectedRuleId(null)
    setForm({
      ...DEFAULT_FORM,
      conditions: [{ fact_key: '', operator: '==', expected_value: '', logical_operator: 'and' }],
    })
    setError('')
    setMessage('')
    setEditorOpen(true)
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
    if (event) event.preventDefault()
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

      setMessage(t('rules.editor.saved', 'Rule saved.'))
      await loadRules()
      closeEditor()

      if (selectedRuleId) {
        // Refresh the in-memory form + history so the Visual Graph tab and the
        // editor show the server state (fresh version number, etc.).
        await fetchRuleIntoForm(selectedRuleId)
        await loadRuleHistory(selectedRuleId)
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
      await fetchRuleIntoForm(selectedRuleId)
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
      await fetchRuleIntoForm(selectedRuleId)
      await loadRuleHistory(selectedRuleId)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to unarchive rule'))
    } finally {
      setUnarchiving(false)
    }
  }

  return (
    <Tabs defaultValue="dashboard" className="w-full min-w-0 space-y-5">
      <div className="flex min-w-0 items-center justify-between overflow-x-auto pb-1">
        <TabsList className="shrink-0">
          <TabsTrigger value="dashboard">{t('rules.tabs.overview', 'Overview')}</TabsTrigger>
          <TabsTrigger value="editor">{t('rules.tabs.editor', 'Rule Editor')}</TabsTrigger>
          <TabsTrigger value="visual">{t('rules.tabs.visual', 'Visual Graph')}</TabsTrigger>
          <TabsTrigger value="simulator">{t('rules.tabs.sandbox', 'Sandbox')}</TabsTrigger>
          <TabsTrigger value="facts">{t('rules.tabs.facts', 'Facts')}</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="dashboard" className="mt-0">
        <KnowledgeBaseDashboard />
      </TabsContent>

      <TabsContent value="visual" className="mt-0 h-[70dvh] min-h-[420px] lg:h-[600px]">
        <SectionCard bodyClassName="flex flex-1 min-h-0 flex-col p-0 h-full overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0c1024] sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
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
            <Suspense fallback={<div className="flex h-full items-center justify-center"><LoadingState /></div>}>
              <VisualLogicMap form={form} />
            </Suspense>
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
          bodyClassName="flex flex-1 min-h-0 flex-col"
          actions={
            <button type="button" className="btn-primary gap-1.5 py-1.5 px-3 text-xs" onClick={openCreateEditor}>
              <Plus className="h-4 w-4" />
              {t('rules.editor.newRule', 'New Rule')}
            </button>
          }
        >
          {/* Status pills — All / Active / Inactive / Archived */}
          <div className="mt-4 inline-flex w-fit max-w-full flex-wrap items-center gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
            {[
              { value: 'all', label: t('rules.table.all', 'All') },
              { value: 'active', label: t('rules.dropdowns.active', 'Active') },
              { value: 'inactive', label: t('rules.dropdowns.inactive', 'Inactive') },
              { value: 'archived', label: t('rules.dropdowns.archived', 'Archived') },
            ].map((pill) => (
              <button
                key={pill.value}
                type="button"
                onClick={() => setStatusPill(pill.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  statusPill === pill.value
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Search + toolbar row */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('rules.dashboard.searchPlaceholder', "Search rules by name, category, or conclusion...")}
                value={ruleSearch}
                onChange={(e) => setRuleSearch(e.target.value)}
                className="input-base w-full rounded-full py-2.5 pl-11 pr-4 text-sm"
              />
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <AppSelect
                className="h-10 min-w-[11rem] w-auto rounded-full px-4 text-sm"
                value={filters.category}
                onValueChange={(val) => setFilters({ ...filters, category: val })}
                options={categoryOptions}
                includeEmpty
                emptyLabel={t('rules.dashboard.allCategories', 'All categories')}
                placeholder={t('rules.dashboard.allCategories', 'All categories')}
              />

              <div className="relative">
                <button type="button" className="btn-secondary h-10 gap-1.5 rounded-full px-4 text-sm" onClick={() => setShowColumnMenu((open) => !open)}>
                  <Settings2 className="h-4 w-4" />
                  {t('rules.table.columns', 'Columns')}
                </button>
                {showColumnMenu ? (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowColumnMenu(false)} />
                    <div className="absolute right-0 z-40 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      {[
                        { key: 'category', label: t('rules.dashboard.columns.category', 'Category') },
                        { key: 'status', label: t('rules.dashboard.columns.status', 'Status') },
                        { key: 'priority', label: t('rules.dashboard.columns.priority', 'Priority') },
                        { key: 'version', label: t('rules.dashboard.columns.version', 'Version') },
                      ].map((col) => (
                        <label key={col.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                            checked={visibleColumns[col.key]}
                            onChange={() => setVisibleColumns((prev) => ({ ...prev, [col.key]: !prev[col.key] }))}
                          />
                          {col.label}
                        </label>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              <button type="button" className="btn-secondary h-10 gap-1.5 rounded-full px-4 text-sm" onClick={exportRulesCsv}>
                <Download className="h-4 w-4" />
                {t('rules.table.export', 'Export')}
              </button>
            </div>
          </div>

          {message ? <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{message}</p> : null}

          {/* Table */}
          <div className="mt-4 min-h-0 flex-1 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="py-3 pr-3">{renderSortTh('name', t('rules.dashboard.columns.name', 'Name'))}</th>
                  {visibleColumns.category ? <th className="py-3 pr-3">{renderSortTh('category', t('rules.dashboard.columns.category', 'Category'))}</th> : null}
                  {visibleColumns.status ? <th className="py-3 pr-3">{renderSortTh('status', t('rules.dashboard.columns.status', 'Status'))}</th> : null}
                  {visibleColumns.priority ? <th className="py-3 pr-3">{renderSortTh('priority', t('rules.dashboard.columns.priority', 'Priority'))}</th> : null}
                  {visibleColumns.version ? <th className="py-3 pr-3 text-center">{renderSortTh('version', t('rules.dashboard.columns.version', 'Version'))}</th> : null}
                  <th className="py-3 text-right">{t('rules.table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={tableColSpan}><LoadingState label={t('rules.dashboard.loadingRules', 'Loading rules...')} /></td>
                  </tr>
                ) : !pagedRules.length ? (
                  <tr>
                    <td colSpan={tableColSpan} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      {ruleSearch ? t('rules.dashboard.noRulesSearch', 'No rules match your search.') : t('rules.dashboard.noRulesFound', 'No rules found.')}
                    </td>
                  </tr>
                ) : pagedRules.map((rule) => (
                  <tr
                    key={rule.id}
                    onClick={() => openRuleEditor(rule.id)}
                    className={`table-row-hover cursor-pointer border-b border-slate-100 last:border-0 dark:border-slate-800 ${selectedRuleId === rule.id ? 'table-row-selected' : ''}`}
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ruleTone(rule.category)}`}>
                          {ruleInitials(rule.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-900 dark:text-slate-100">{tExact(rule.name)}</div>
                          <div className="truncate text-xs text-slate-500 dark:text-slate-400">{rule.conclusion || rule.category}</div>
                        </div>
                      </div>
                    </td>
                    {visibleColumns.category ? (
                      <td className="py-3 pr-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ruleTone(rule.category)}`}>
                          {rule.category}
                        </span>
                      </td>
                    ) : null}
                    {visibleColumns.status ? <td className="py-3 pr-3"><StatusBadge tone={statusTone(rule.status)}>{rule.status}</StatusBadge></td> : null}
                    {visibleColumns.priority ? <td className="py-3 pr-3"><StatusBadge tone={priorityTone(rule.priority)}>{rule.priority}</StatusBadge></td> : null}
                    {visibleColumns.version ? <td className="py-3 pr-3 text-center font-mono text-sm text-slate-500">v{rule.version}</td> : null}
                    <td className="py-3 text-right" onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title={t('rules.editor.edit', 'Edit')}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-cyan-500/10"
                          onClick={() => openRuleEditor(rule.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {rule.status !== 'archived' ? (
                          <button
                            type="button"
                            title={t('rules.editor.archive', 'Archive')}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                            onClick={() => { setSelectedRuleId(rule.id); setShowArchiveDialog(true) }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('rules.table.showing', 'Showing')} {totalRules === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalRules)} {t('rules.table.of', 'of')} {totalRules} {t('rules.table.results', 'results')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                {t('rules.table.rows', 'Rows')}
                <AppSelect
                  className="h-9 w-20 rounded-lg px-2.5 text-xs font-semibold"
                  value={String(pageSize)}
                  onValueChange={(val) => setPageSize(Number(val) || 10)}
                  options={[
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                    { value: '50', label: '50' },
                  ]}
                />
              </label>
              <button type="button" className="btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                {t('rules.table.previous', 'Previous')}
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${pageNumber === safePage ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {pageNumber}
                </button>
              ))}
              <button type="button" className="btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
                {t('rules.table.next', 'Next')}
              </button>
            </div>
          </div>
        </SectionCard>

        {/* --- SLIDE-OVER RULE EDITOR (Radix Sheet, portaled to <body>) --- */}
        <Sheet open={editorOpen} onOpenChange={(open) => { if (!open) closeEditor() }}>
          <SheetContent side="right" className="w-full sm:max-w-2xl">
            <form onSubmit={saveRule} className="flex h-full min-h-0 flex-col">
              <SheetHeader>
                <SheetTitle>
                  {selectedRuleId ? t('rules.editor.editRule', 'Edit Rule') : t('rules.editor.createRule', 'Create Rule')}
                </SheetTitle>
                <SheetDescription>
                  {t('rules.editor.subtitle', 'Write simple clinical logic for doctors. Example: if fasting glucose is 126 or higher, set diabetes possible.')}
                </SheetDescription>
              </SheetHeader>

              <SheetBody className="space-y-6">
                {error ? <ErrorAlert message={error} /> : null}

                <section className="grid gap-4 sm:grid-cols-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:col-span-2 dark:text-slate-400">
                    {t('rules.editor.sectionDetails', 'Rule details')}
                  </h3>
                  <label className="block sm:col-span-2">
                    <span className="label-text">{t('rules.editor.ruleName', 'Rule Name')}</span>
                    <input className="input-base mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                  </label>

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
                </section>

                <section className="rounded-xl border border-slate-200 bg-slate-50/30 p-3 dark:border-slate-700 dark:bg-slate-900/20">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {t('rules.editor.conditions', 'Conditions')}
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400">
                        {form.conditions.length}
                      </span>
                    </p>
                    <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={addCondition}>{t('rules.editor.addCondition', '+ Add Condition')}</button>
                  </div>

                  <div className="space-y-2">
                    {form.conditions.map((condition, index) => (
                      <div key={`condition-${index}`} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800/50 lg:grid-cols-[90px_minmax(0,1.2fr)_0.7fr_minmax(0,1fr)_auto]">
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
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:col-span-3 dark:text-slate-400">
                    {t('rules.editor.sectionOutcome', 'Outcome & weighting')}
                  </h3>
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
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t('rules.editor.sectionGuidance', 'Doctor guidance')}
                  </h3>
                  <label className="block">
                    <span className="label-text">{t('rules.editor.explanation', 'Explanation')}</span>
                    <textarea className="input-base mt-1" value={form.explanation} rows={3} onChange={(event) => setForm({ ...form, explanation: event.target.value })} />
                  </label>

                  <label className="block">
                    <span className="label-text">{t('rules.editor.recommendation', 'Recommendation')}</span>
                    <textarea className="input-base mt-1" value={form.recommendation} rows={3} onChange={(event) => setForm({ ...form, recommendation: event.target.value })} />
                  </label>

                  <label className="block">
                    <span className="label-text">{t('rules.editor.notes', 'Notes')}</span>
                    <textarea className="input-base mt-1" value={form.description} rows={2} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                  </label>
                </section>

                {selectedRuleId ? (
                  <section className="space-y-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <div>
                      <h3 className="section-title flex items-center gap-2">
                        {t('rules.history.ruleVersions', 'Rule Versions')}
                        {versions.length > 0 && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {versions.length}
                          </span>
                        )}
                      </h3>
                      <div className="mt-3 overflow-x-auto">
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
                            {!versions.length ? (
                              <tr>
                                <td colSpan="4"><div className="state-box">{t('rules.history.noVersionHistory', 'No version history found.')}</div></td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="section-title flex items-center gap-2">
                        {t('rules.history.auditTrail', 'Audit Trail')}
                        {auditLogs.length > 0 && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {auditLogs.length}
                          </span>
                        )}
                      </h3>
                      <div className="mt-3 overflow-x-auto">
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
                            {!auditLogs.length ? (
                              <tr>
                                <td colSpan="3"><div className="state-box">{t('rules.history.selectRuleToViewAudit', 'No audit history found.')}</div></td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                ) : null}
              </SheetBody>

              <SheetFooter>
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2">
                    {selectedRule?.status === 'archived' ? (
                      <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={unarchiveSelectedRule} disabled={unarchiving}>
                        {unarchiving ? t('rules.editor.restoring', 'Restoring...') : t('rules.editor.unarchive', 'Unarchive')}
                      </button>
                    ) : null}
                    {selectedRule && selectedRule.status !== 'archived' ? (
                      <button type="button" className="btn-danger px-3 py-2 text-sm" onClick={() => setShowArchiveDialog(true)}>
                        {t('rules.editor.archive', 'Archive')}
                      </button>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={closeEditor} disabled={saving}>
                      {t('common.cancel', 'Cancel')}
                    </button>
                    <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={saving}>
                      {saving ? t('rules.dashboard.saving', 'Saving...') : selectedRuleId ? t('rules.editor.updateRule', 'Update Rule') : t('rules.editor.createRule', 'Create Rule')}
                    </button>
                  </div>
                </div>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

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

      <TabsContent value="facts" className="mt-0">
        <FactCatalog />
      </TabsContent>
    </Tabs>
  )
}
