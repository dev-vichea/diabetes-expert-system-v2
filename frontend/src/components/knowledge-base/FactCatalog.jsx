import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpDown,
  Download,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Settings2,
  Stethoscope,
} from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../../api/client'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  AppSelect,
  Checkbox,
  ErrorAlert,
  LoadingState,
  SectionCard,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  StatusBadge,
} from '@/components/ui'

// Doctor-managed fact/symptom knowledge catalog (Knowledge Base → Facts).
// Education fields (meaning / prevention, EN + KM) feed the assessment report;
// reasoning fields (weight / type_indication / flags) overlay the inference
// engine's static symptom knowledge at assessment time.
// Rows and the slide-over editor are language aware: DB labels switch with the
// UI language whenever the Khmer counterpart exists (and vice versa).

const EMPTY_FORM = {
  key: '',
  label: '',
  label_km: '',
  medical_term: '',
  category: 'other',
  question: '',
  meaning: '',
  meaning_km: '',
  prevention: '',
  prevention_km: '',
  weight: 0.05,
  type_indication: 'none',
  is_cardinal: false,
  is_emergency: false,
  aliases: '',
  is_active: true,
  display_order: 100,
}

const CATEGORIES = [
  'cardinal',
  'metabolic',
  'vision',
  'skin',
  'nerve',
  'reproductive',
  'mental',
  'emergency',
  'pediatric',
  'risk_factor',
  'lab',
  'profile',
  'other',
]

const TYPE_INDICATIONS = ['none', 'both', 'type1', 'type2', 'gestational']

const CATEGORY_FALLBACKS = {
  cardinal: 'Cardinal (3 Ps)',
  metabolic: 'Metabolic',
  vision: 'Vision',
  skin: 'Skin',
  nerve: 'Nerve',
  reproductive: 'Reproductive',
  mental: 'Mental',
  emergency: 'Emergency',
  pediatric: 'Pediatric',
  risk_factor: 'Risk factor',
  lab: 'Lab',
  profile: 'Profile',
  other: 'Other',
}

const TYPE_FALLBACKS = {
  none: 'Not type-specific',
  both: 'Type 1 & Type 2',
  type1: 'Type 1',
  type2: 'Type 2',
  gestational: 'Gestational',
}

const FACT_TONES = {
  cardinal: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  metabolic: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  vision: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  skin: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  nerve: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  reproductive: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  mental: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  emergency: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  pediatric: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  risk_factor: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  lab: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
  profile: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  other: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
}

function factTone(category) {
  if (FACT_TONES[category]) return FACT_TONES[category]
  const keys = Object.keys(FACT_TONES)
  let hash = 0
  for (const ch of String(category || '')) hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return FACT_TONES[keys[hash % keys.length]]
}

function factInitials(name) {
  const initials = String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || '')
    .join('')
    .toUpperCase()
  return initials || '?'
}

function toForm(row) {
  return {
    key: row.key || '',
    label: row.label || '',
    label_km: row.label_km || '',
    medical_term: row.medical_term || '',
    category: row.category || 'other',
    question: row.question || '',
    meaning: row.meaning || '',
    meaning_km: row.meaning_km || '',
    prevention: row.prevention || '',
    prevention_km: row.prevention_km || '',
    weight: row.weight ?? 0.05,
    type_indication: row.type_indication || 'none',
    is_cardinal: Boolean(row.is_cardinal),
    is_emergency: Boolean(row.is_emergency),
    aliases: (row.aliases || []).join(', '),
    is_active: row.is_active !== false,
    display_order: row.display_order ?? 100,
  }
}

export function FactCatalog() {
  const { t, language } = useLanguage()
  const [facts, setFacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState('')
  const [statusPill, setStatusPill] = useState('all') // 'all' | 'active' | 'inactive' | 'cardinal' | 'emergency'

  // Sorting and pagination state (Rule Editor blueprint style)
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [visibleColumns, setVisibleColumns] = useState({
    category: true,
    weight: true,
    typeHint: true,
    flags: true,
    status: true,
  })
  const [showColumnMenu, setShowColumnMenu] = useState(false)

  // Sheet Editor state
  const [form, setForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const loadRequestId = useRef(0)

  // Display helper: prefer the row's text in the active UI language, falling
  // back to the other language when the translation is missing on the row.
  const pick = (en, km) => (language === 'km' ? (km || en) : (en || km))

  async function load() {
    const requestId = ++loadRequestId.current
    setLoading(true)
    setError('')
    try {
      const data = getApiData(await api.get('/facts/'))
      if (requestId === loadRequestId.current) setFacts(Array.isArray(data) ? data : [])
    } catch (e) {
      if (requestId === loadRequestId.current) {
        setError(getApiErrorMessage(e, t('knowledgeBase.facts.errors.load', 'Failed to load the fact catalog.')))
      }
    } finally {
      if (requestId === loadRequestId.current) setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Filter facts client-side by search, category, and status pill
  const filteredFacts = useMemo(() => {
    let result = facts

    // Category filter
    if (category) {
      result = result.filter((row) => row.category === category)
    }

    // Status / flag pill filter
    if (statusPill === 'active') {
      result = result.filter((row) => row.is_active)
    } else if (statusPill === 'inactive') {
      result = result.filter((row) => !row.is_active)
    } else if (statusPill === 'cardinal') {
      result = result.filter((row) => Boolean(row.is_cardinal))
    } else if (statusPill === 'emergency') {
      result = result.filter((row) => Boolean(row.is_emergency))
    }

    // Search query
    const q = searchInput.trim().toLowerCase()
    if (q) {
      result = result.filter((row) => {
        const key = (row.key || '').toLowerCase()
        const label = (row.label || '').toLowerCase()
        const labelKm = (row.label_km || '').toLowerCase()
        const med = (row.medical_term || '').toLowerCase()
        const cat = (row.category || '').toLowerCase()
        return key.includes(q) || label.includes(q) || labelKm.includes(q) || med.includes(q) || cat.includes(q)
      })
    }

    return result
  }, [facts, category, statusPill, searchInput])

  // Sorting
  const sortedFacts = useMemo(() => {
    const arr = [...filteredFacts]
    const direction = sortDir === 'asc' ? 1 : -1

    arr.sort((a, b) => {
      if (sortKey === 'name') {
        const nameA = pick(a.label, a.label_km) || a.key || ''
        const nameB = pick(b.label, b.label_km) || b.key || ''
        return nameA.localeCompare(nameB) * direction
      }
      if (sortKey === 'category') {
        return (a.category || '').localeCompare(b.category || '') * direction
      }
      if (sortKey === 'weight') {
        return ((Number(a.weight) || 0) - (Number(b.weight) || 0)) * direction
      }
      if (sortKey === 'typeHint') {
        return (a.type_indication || '').localeCompare(b.type_indication || '') * direction
      }
      if (sortKey === 'status') {
        return ((a.is_active ? 1 : 0) - (b.is_active ? 1 : 0)) * direction
      }
      return 0
    })

    return arr
  }, [filteredFacts, sortKey, sortDir, language])

  // Pagination calculations
  const totalFacts = sortedFacts.length
  const totalPages = Math.max(1, Math.ceil(totalFacts / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedFacts = useMemo(
    () => sortedFacts.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sortedFacts, safePage, pageSize]
  )

  const pageNumbers = useMemo(() => {
    const maxButtons = 5
    let start = Math.max(1, safePage - Math.floor(maxButtons / 2))
    const end = Math.min(totalPages, start + maxButtons - 1)
    start = Math.max(1, end - maxButtons + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])

  // Jump to first page whenever filtering changes
  useEffect(() => {
    setPage(1)
  }, [searchInput, category, statusPill, pageSize])

  const tableColSpan = 2 + Object.values(visibleColumns).filter(Boolean).length

  function toggleSort(colKey) {
    if (sortKey === colKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(colKey)
      setSortDir('asc')
    }
  }

  const renderSortTh = (colKey, label) => {
    const active = sortKey === colKey
    return (
      <button
        type="button"
        className={`inline-flex items-center gap-1 uppercase transition hover:text-slate-700 dark:hover:text-slate-200 ${
          active ? 'text-slate-700 dark:text-slate-200' : ''
        }`}
        onClick={() => toggleSort(colKey)}
      >
        {label}
        <ArrowUpDown
          className={`h-3.5 w-3.5 ${
            active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        />
      </button>
    )
  }

  function exportFactsCsv() {
    const columns = [
      'key',
      'label',
      'label_km',
      'medical_term',
      'category',
      'weight',
      'type_indication',
      'is_cardinal',
      'is_emergency',
      'is_active',
    ]
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const lines = [columns.join(',')]
    for (const fact of sortedFacts) {
      lines.push(columns.map((col) => escape(fact[col])).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fact-catalog.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  // Slide-over Sheet actions
  function closeEditor() {
    setEditorOpen(false)
  }

  function openCreate() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setMessage('')
    setError('')
    setEditorOpen(true)
  }

  function openEdit(row) {
    setEditingId(row.id)
    setForm(toForm(row))
    setMessage('')
    setError('')
    setEditorOpen(true)
  }

  async function save() {
    if (!form) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        weight: Number(form.weight) || 0,
        display_order: Number(form.display_order) || 0,
      }
      if (editingId) {
        await api.patch(`/facts/${editingId}`, payload)
      } else {
        await api.post('/facts/', payload)
      }
      setMessage(t('knowledgeBase.facts.saved', 'Fact saved.'))
      closeEditor()
      await load()
    } catch (e) {
      setError(getApiErrorMessage(e, t('knowledgeBase.facts.errors.save', 'Failed to save the fact.')))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(row) {
    setError('')
    try {
      if (row.is_active) {
        await api.delete(`/facts/${row.id}`)
      } else {
        await api.patch(`/facts/${row.id}`, { is_active: true })
      }
      await load()
    } catch (e) {
      setError(getApiErrorMessage(e, t('knowledgeBase.facts.errors.save', 'Failed to save the fact.')))
    }
  }

  const categoryOptions = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        value: cat,
        label: t(`knowledgeBase.facts.categories.${cat}`, CATEGORY_FALLBACKS[cat] || cat),
      })),
    [t]
  )

  const typeOptions = useMemo(
    () =>
      TYPE_INDICATIONS.map((type) => ({
        value: type,
        label: t(`knowledgeBase.facts.types.${type}`, TYPE_FALLBACKS[type] || type),
      })),
    [t]
  )

  return (
    <div className="space-y-5">
      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-cyan-600" />
            {t('knowledgeBase.facts.title', 'Fact & Symptom Catalog')}
            <span className="ml-1 inline-flex items-center rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
              {filteredFacts.length}
            </span>
          </span>
        }
        description={t(
          'knowledgeBase.facts.description',
          'The vocabulary of the expert system. Meaning and prevention texts appear in patient reports; weight and type hints steer the inference.'
        )}
        bodyClassName="flex flex-1 min-h-0 flex-col"
        actions={
          <button type="button" className="btn-primary gap-1.5 py-1.5 px-3 text-xs" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('knowledgeBase.facts.add', 'Add fact')}
          </button>
        }
      >
        {/* Status pills — All / Active / Inactive / Cardinal / Emergency */}
        <div className="mt-4 inline-flex w-fit max-w-full flex-wrap items-center gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
          {[
            { value: 'all', label: t('rules.table.all', 'All') },
            { value: 'active', label: t('rules.dropdowns.active', 'Active') },
            { value: 'inactive', label: t('rules.dropdowns.inactive', 'Inactive') },
            { value: 'cardinal', label: t('knowledgeBase.facts.cardinal', 'Cardinal (3 Ps)') },
            { value: 'emergency', label: t('knowledgeBase.facts.emergency', 'Emergency') },
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
              placeholder={t('knowledgeBase.facts.search', 'Search key, label, medical term…')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-base w-full rounded-full py-2.5 pl-11 pr-4 text-sm"
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              className="input-base h-10 w-auto rounded-full py-0 pl-4 pr-9 text-sm"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label={t('knowledgeBase.facts.allCategories', 'All categories')}
            >
              <option value="">{t('knowledgeBase.facts.allCategories', 'All categories')}</option>
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {t(`knowledgeBase.facts.categories.${value}`, CATEGORY_FALLBACKS[value] || value)}
                </option>
              ))}
            </select>

            <div className="relative">
              <button
                type="button"
                className="btn-secondary h-10 gap-1.5 rounded-full px-4 text-sm"
                onClick={() => setShowColumnMenu((open) => !open)}
              >
                <Settings2 className="h-4 w-4" />
                {t('rules.table.columns', 'Columns')}
              </button>
              {showColumnMenu ? (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowColumnMenu(false)} />
                  <div className="absolute right-0 z-40 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    {[
                      { key: 'category', label: t('knowledgeBase.facts.category', 'Category') },
                      { key: 'weight', label: t('knowledgeBase.facts.weightCol', 'Weight') },
                      { key: 'typeHint', label: t('knowledgeBase.facts.typeHint', 'Type hint') },
                      { key: 'flags', label: t('knowledgeBase.facts.flags', 'Flags') },
                      { key: 'status', label: t('knowledgeBase.facts.status', 'Status') },
                    ].map((col) => (
                      <label
                        key={col.key}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
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

            <button
              type="button"
              className="btn-secondary h-10 gap-1.5 rounded-full px-4 text-sm"
              onClick={exportFactsCsv}
            >
              <Download className="h-4 w-4" />
              {t('rules.table.export', 'Export')}
            </button>

            <button
              type="button"
              className="btn-secondary h-10 gap-1.5 rounded-full px-4 text-sm"
              onClick={load}
              title={t('knowledgeBase.facts.refresh', 'Refresh')}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('knowledgeBase.facts.refresh', 'Refresh')}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-3">
            <ErrorAlert message={error} />
          </div>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{message}</p>
        ) : null}

        {/* Blueprint Table */}
        <div className="mt-4 min-h-0 flex-1 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="py-3 pr-3">{renderSortTh('name', t('knowledgeBase.facts.nameCol', 'Name'))}</th>
                {visibleColumns.category ? (
                  <th className="py-3 pr-3">
                    {renderSortTh('category', t('knowledgeBase.facts.category', 'Category'))}
                  </th>
                ) : null}
                {visibleColumns.weight ? (
                  <th className="py-3 pr-3">
                    {renderSortTh('weight', t('knowledgeBase.facts.weightCol', 'Weight'))}
                  </th>
                ) : null}
                {visibleColumns.typeHint ? (
                  <th className="py-3 pr-3">
                    {renderSortTh('typeHint', t('knowledgeBase.facts.typeHint', 'Type hint'))}
                  </th>
                ) : null}
                {visibleColumns.flags ? (
                  <th className="py-3 pr-3">{t('knowledgeBase.facts.flags', 'Flags')}</th>
                ) : null}
                {visibleColumns.status ? (
                  <th className="py-3 pr-3">
                    {renderSortTh('status', t('knowledgeBase.facts.status', 'Status'))}
                  </th>
                ) : null}
                <th className="py-3 text-right">{t('rules.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={tableColSpan}>
                    <LoadingState label={t('knowledgeBase.facts.loading', 'Loading facts…')} />
                  </td>
                </tr>
              ) : !pagedFacts.length ? (
                <tr>
                  <td colSpan={tableColSpan} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('knowledgeBase.facts.empty', 'No facts match the current filters.')}
                  </td>
                </tr>
              ) : (
                pagedFacts.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openEdit(row)}
                    className={`table-row-hover cursor-pointer border-b border-slate-100 last:border-0 dark:border-slate-800 ${
                      editingId === row.id ? 'table-row-selected' : ''
                    }`}
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${factTone(
                            row.category
                          )}`}
                        >
                          {factInitials(pick(row.label, row.label_km) || row.key)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-900 dark:text-slate-100">
                            {pick(row.label, row.label_km) || row.key}
                          </div>
                          <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {row.medical_term ? <span className="italic">{row.medical_term} &bull; </span> : null}
                            <span className="font-mono">{row.key}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    {visibleColumns.category ? (
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${factTone(
                            row.category
                          )}`}
                        >
                          {t(`knowledgeBase.facts.categories.${row.category}`, CATEGORY_FALLBACKS[row.category] || row.category)}
                        </span>
                      </td>
                    ) : null}
                    {visibleColumns.weight ? (
                      <td className="py-3 pr-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {Number(row.weight ?? 0).toFixed(2)}
                      </td>
                    ) : null}
                    {visibleColumns.typeHint ? (
                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-300">
                        {t(
                          `knowledgeBase.facts.types.${row.type_indication}`,
                          TYPE_FALLBACKS[row.type_indication] || row.type_indication
                        )}
                      </td>
                    ) : null}
                    {visibleColumns.flags ? (
                      <td className="py-3 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {row.is_cardinal ? (
                            <StatusBadge tone="info" size="sm">
                              {t('knowledgeBase.facts.cardinal', 'cardinal')}
                            </StatusBadge>
                          ) : null}
                          {row.is_emergency ? (
                            <StatusBadge tone="danger" size="sm">
                              {t('knowledgeBase.facts.emergency', 'emergency')}
                            </StatusBadge>
                          ) : null}
                          {!row.is_cardinal && !row.is_emergency ? (
                            <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                    {visibleColumns.status ? (
                      <td className="py-3 pr-3">
                        <StatusBadge tone={row.is_active ? 'success' : 'neutral'} size="sm">
                          {row.is_active
                            ? t('knowledgeBase.facts.active', 'Active')
                            : t('knowledgeBase.facts.inactive', 'Inactive')}
                        </StatusBadge>
                      </td>
                    ) : null}
                    <td className="py-3 text-right" onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title={t('knowledgeBase.facts.edit', 'Edit')}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-cyan-500/10"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title={
                            row.is_active
                              ? t('knowledgeBase.facts.deactivate', 'Deactivate')
                              : t('knowledgeBase.facts.activate', 'Activate')
                          }
                          className={`rounded-lg p-2 transition ${
                            row.is_active
                              ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10'
                              : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10'
                          }`}
                          onClick={() => toggleActive(row)}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer (Rule Editor style) */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('rules.table.showing', 'Showing')} {totalFacts === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, totalFacts)} {t('rules.table.of', 'of')} {totalFacts}{' '}
            {t('rules.table.results', 'results')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {t('rules.table.rows', 'Rows')}
              <select
                className="input-base h-9 w-[4.5rem] rounded-lg py-0 pl-2 pr-7 text-sm"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value) || 10)}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              {t('rules.table.previous', 'Previous')}
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
                  pageNumber === safePage ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              className="btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              {t('rules.table.next', 'Next')}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* --- SLIDE-OVER FACT EDITOR (Radix Sheet, portaled to <body>) --- */}
      <Sheet
        open={editorOpen}
        onOpenChange={(open) => {
          if (!open) closeEditor()
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-2xl">
          {form ? (
            <form
              className="flex h-full min-h-0 flex-col"
              onSubmit={(event) => {
                event.preventDefault()
                save()
              }}
            >
              <SheetHeader>
                <SheetTitle>
                  {editingId
                    ? t('knowledgeBase.facts.editTitle', 'Edit fact')
                    : t('knowledgeBase.facts.createTitle', 'New fact')}
                </SheetTitle>
                <SheetDescription>
                  {t(
                    'knowledgeBase.facts.editorHint',
                    'Meaning & prevention appear on patient reports (English + Khmer). Weight, type hint and flags influence the reasoning.'
                  )}
                </SheetDescription>
              </SheetHeader>

              <SheetBody className="space-y-6">
                {/* Basics Section */}
                <section className="grid gap-4 sm:grid-cols-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:col-span-2 dark:text-slate-400">
                    {t('knowledgeBase.facts.sectionBasics', 'Basics')}
                  </h3>
                  {!editingId ? (
                    <label className="block sm:col-span-2">
                      <span className="label-text">{t('knowledgeBase.facts.key', 'Key')} *</span>
                      <input
                        className="input-base mt-1 w-full font-mono text-sm"
                        value={form.key}
                        onChange={(event) => setForm({ ...form, key: event.target.value })}
                        placeholder="e.g. polyuria, fasting_glucose"
                        required
                      />
                      <span className="mt-1 block text-xs text-slate-500">
                        {t('knowledgeBase.facts.keyLocked', 'Fact keys are permanent — rules and reports reference them.')}
                      </span>
                    </label>
                  ) : (
                    <div className="sm:col-span-2">
                      <span className="label-text">{t('knowledgeBase.facts.key', 'Key')}</span>
                      <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                        <span>{form.key}</span>
                        <span className="ml-auto text-xs text-slate-400">
                          {t('knowledgeBase.facts.keyLocked', 'Fact keys are permanent — rules and reports reference them.')}
                        </span>
                      </div>
                    </div>
                  )}

                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.label', 'Name (English)')} *</span>
                    <input
                      className="input-base mt-1 w-full"
                      value={form.label}
                      onChange={(event) => setForm({ ...form, label: event.target.value })}
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.labelKm', 'Name (Khmer)')}</span>
                    <input
                      className="input-base mt-1 w-full"
                      lang="km"
                      value={form.label_km}
                      onChange={(event) => setForm({ ...form, label_km: event.target.value })}
                    />
                  </label>

                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.medicalTerm', 'Medical term')}</span>
                    <input
                      className="input-base mt-1 w-full"
                      value={form.medical_term}
                      placeholder="e.g. Polyuria"
                      onChange={(event) => setForm({ ...form, medical_term: event.target.value })}
                    />
                  </label>

                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.category', 'Category')}</span>
                    <div className="mt-1">
                      <AppSelect
                        value={form.category}
                        onValueChange={(value) => setForm({ ...form, category: value })}
                        options={categoryOptions}
                      />
                    </div>
                  </label>
                </section>

                {/* Patient Education Section */}
                <section className="grid gap-4 sm:grid-cols-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:col-span-2 dark:text-slate-400">
                    {t('knowledgeBase.facts.sectionEducation', 'Patient education — appears in patient reports')}
                  </h3>

                  <label className="block sm:col-span-2">
                    <span className="label-text">{t('knowledgeBase.facts.question', 'Interview question')}</span>
                    <textarea
                      className="input-base mt-1 w-full"
                      rows={2}
                      value={form.question}
                      onChange={(event) => setForm({ ...form, question: event.target.value })}
                    />
                  </label>

                  <label className="block">
                    <span className="label-text">
                      {t('knowledgeBase.facts.meaning', 'Meaning (why it happens, English)')}
                    </span>
                    <textarea
                      className="input-base mt-1 w-full"
                      rows={3}
                      value={form.meaning}
                      onChange={(event) => setForm({ ...form, meaning: event.target.value })}
                    />
                  </label>

                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.meaningKm', 'Meaning (Khmer)')}</span>
                    <textarea
                      className="input-base mt-1 w-full"
                      rows={3}
                      lang="km"
                      value={form.meaning_km}
                      onChange={(event) => setForm({ ...form, meaning_km: event.target.value })}
                    />
                  </label>

                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.prevention', 'Prevention (English)')}</span>
                    <textarea
                      className="input-base mt-1 w-full"
                      rows={3}
                      value={form.prevention}
                      onChange={(event) => setForm({ ...form, prevention: event.target.value })}
                    />
                  </label>

                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.preventionKm', 'Prevention (Khmer)')}</span>
                    <textarea
                      className="input-base mt-1 w-full"
                      rows={3}
                      lang="km"
                      value={form.prevention_km}
                      onChange={(event) => setForm({ ...form, prevention_km: event.target.value })}
                    />
                  </label>
                </section>

                {/* Reasoning & Weights Section */}
                <section className="grid gap-4 sm:grid-cols-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:col-span-2 dark:text-slate-400">
                    {t('knowledgeBase.facts.sectionReasoning', 'Reasoning — steers the inference engine')}
                  </h3>

                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.weight', 'Reasoning weight (0–1)')}</span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      className="input-base mt-1 w-full"
                      value={form.weight}
                      onChange={(event) => setForm({ ...form, weight: event.target.value })}
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      {t('knowledgeBase.facts.weightHint', '0 = no influence on reasoning, 1 = decisive evidence.')}
                    </span>
                  </label>

                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.typeHint', 'Type hint')}</span>
                    <div className="mt-1">
                      <AppSelect
                        value={form.type_indication}
                        onValueChange={(value) => setForm({ ...form, type_indication: value })}
                        options={typeOptions}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.aliases', 'Aliases (comma-separated)')}</span>
                    <input
                      className="input-base mt-1 w-full font-mono text-sm"
                      value={form.aliases}
                      placeholder="polyuria_alt, frequent_urination"
                      onChange={(event) => setForm({ ...form, aliases: event.target.value })}
                    />
                  </label>

                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.displayOrder', 'Display order')}</span>
                    <input
                      type="number"
                      className="input-base mt-1 w-full"
                      value={form.display_order}
                      onChange={(event) => setForm({ ...form, display_order: event.target.value })}
                    />
                  </label>

                  {/* Flag cards */}
                  <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        form.is_cardinal
                          ? 'border-cyan-300 bg-cyan-50/70 dark:border-cyan-700 dark:bg-cyan-950/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Checkbox
                        checked={form.is_cardinal}
                        onCheckedChange={(checked) => setForm({ ...form, is_cardinal: Boolean(checked) })}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {t('knowledgeBase.facts.cardinal', 'Cardinal (3 Ps)')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t('knowledgeBase.facts.cardinalHint', 'Primary diagnostic sign')}
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        form.is_emergency
                          ? 'border-rose-300 bg-rose-50/70 dark:border-rose-700 dark:bg-rose-950/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Checkbox
                        checked={form.is_emergency}
                        onCheckedChange={(checked) => setForm({ ...form, is_emergency: Boolean(checked) })}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {t('knowledgeBase.facts.emergency', 'Emergency sign')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t('knowledgeBase.facts.emergencyHint', 'Triggers urgent clinical alert')}
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        form.is_active
                          ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-950/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Checkbox
                        checked={form.is_active}
                        onCheckedChange={(checked) => setForm({ ...form, is_active: Boolean(checked) })}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {t('knowledgeBase.facts.active', 'Active')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t('knowledgeBase.facts.activeHint', 'Enabled for inference')}
                        </p>
                      </div>
                    </label>
                  </div>
                </section>
              </SheetBody>

              <SheetFooter>
                <button
                  type="button"
                  className="btn-secondary px-4 py-2 text-sm"
                  onClick={closeEditor}
                  disabled={saving}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={saving}>
                  {saving ? t('knowledgeBase.facts.saving', 'Saving…') : t('knowledgeBase.facts.save', 'Save fact')}
                </button>
              </SheetFooter>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
