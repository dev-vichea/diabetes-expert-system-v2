import { useEffect, useRef, useState } from 'react'
import { Plus, Stethoscope } from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '../../api/client'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  ErrorAlert,
  LoadingState,
  SectionCard,
  StatusBadge,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui'

// Doctor-managed fact/symptom knowledge catalog (Knowledge Base → Facts).
// Education fields (meaning / prevention, EN + KM) feed the assessment report;
// reasoning fields (weight / type_indication / flags) overlay the inference
// engine's static symptom knowledge at assessment time.
// Rows and the slide-over editor are language aware: DB labels switch with the
// UI language whenever the Khmer counterpart exists (and vice versa).

const EMPTY_FORM = {
  key: '', label: '', label_km: '', medical_term: '', category: 'other',
  question: '', meaning: '', meaning_km: '', prevention: '', prevention_km: '',
  weight: 0.05, type_indication: 'none', is_cardinal: false, is_emergency: false,
  aliases: '', is_active: true, display_order: 100,
}

const CATEGORIES = [
  'cardinal', 'metabolic', 'vision', 'skin', 'nerve', 'reproductive', 'mental',
  'emergency', 'pediatric', 'other', 'risk_factor', 'lab', 'profile',
]

const TYPE_INDICATIONS = ['none', 'both', 'type1', 'type2', 'gestational']

const CATEGORY_FALLBACKS = {
  cardinal: 'Cardinal (3 Ps)', metabolic: 'Metabolic', vision: 'Vision', skin: 'Skin',
  nerve: 'Nerve', reproductive: 'Reproductive', mental: 'Mental', emergency: 'Emergency',
  pediatric: 'Pediatric', other: 'Other', risk_factor: 'Risk factor', lab: 'Lab', profile: 'Profile',
}

const TYPE_FALLBACKS = {
  none: 'Not type-specific', both: 'Type 1 & Type 2', type1: 'Type 1',
  type2: 'Type 2', gestational: 'Gestational',
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
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [form, setForm] = useState(null) // null = list mode
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
      const params = {}
      if (category) params.category = category
      if (search) params.search = search
      const data = getApiData(await api.get('/facts/', { params }))
      if (requestId === loadRequestId.current) setFacts(Array.isArray(data) ? data : [])
    } catch (e) {
      if (requestId === loadRequestId.current) {
        setError(getApiErrorMessage(e, t('knowledgeBase.facts.errors.load', 'Failed to load the fact catalog.')))
      }
    } finally {
      if (requestId === loadRequestId.current) setLoading(false)
    }
  }

  useEffect(() => { load() }, [category, search])

  // Debounce free-text search so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Only flip the Sheet's open flag; the last-edited form is kept in memory so
  // the Radix exit animation can play and reopening feels instant.
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
      if (editingId) await api.patch(`/facts/${editingId}`, payload)
      else await api.post('/facts/', payload)
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
      await api.delete(`/facts/${row.id}`)
      await load()
    } catch (e) {
      setError(getApiErrorMessage(e, t('knowledgeBase.facts.errors.save', 'Failed to save the fact.')))
    }
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title={t('knowledgeBase.facts.title', 'Fact & Symptom Catalog')}
        description={t('knowledgeBase.facts.description', 'The vocabulary of the expert system. Meaning and prevention texts appear in patient reports; weight and type hints steer the inference.')}
        icon={Stethoscope}
        actions={
          <button type="button" className="btn-primary gap-1.5 py-1.5 px-3 text-xs" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('knowledgeBase.facts.add', 'Add fact')}
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="input-base w-full max-w-xs py-2 text-sm"
            placeholder={t('knowledgeBase.facts.search', 'Search key, label, medical term…')}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <select className="input-base w-auto py-2 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">{t('knowledgeBase.facts.allCategories', 'All categories')}</option>
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>{t(`knowledgeBase.facts.categories.${value}`, CATEGORY_FALLBACKS[value])}</option>
            ))}
          </select>
          <button type="button" className="btn-secondary py-1.5 px-3 text-xs" onClick={load}>
            {t('knowledgeBase.facts.refresh', 'Refresh')}
          </button>
        </div>

        {error ? <div className="mt-3"><ErrorAlert message={error} /></div> : null}
        {message ? <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{message}</p> : null}

        {loading ? (
          <LoadingState label={t('knowledgeBase.facts.loading', 'Loading facts…')} />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="py-2 pr-3">{t('knowledgeBase.facts.nameCol', 'Name')}</th>
                  <th className="py-2 pr-3">{t('knowledgeBase.facts.category', 'Category')}</th>
                  <th className="py-2 pr-3">{t('knowledgeBase.facts.weightCol', 'Weight')}</th>
                  <th className="py-2 pr-3">{t('knowledgeBase.facts.typeHint', 'Type hint')}</th>
                  <th className="py-2 pr-3">{t('knowledgeBase.facts.flags', 'Flags')}</th>
                  <th className="py-2 pr-3">{t('knowledgeBase.facts.status', 'Status')}</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {facts.map((row) => (
                  <tr
                    key={row.id}
                    className="table-row-hover cursor-pointer border-b border-slate-100 dark:border-slate-800"
                    onClick={() => openEdit(row)}
                  >
                    <td className="py-2 pr-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {pick(row.label, row.label_km) || row.key}
                      </div>
                      {row.medical_term ? (
                        <div className="text-xs italic text-slate-500 dark:text-slate-400">{row.medical_term}</div>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">
                      {t(`knowledgeBase.facts.categories.${row.category}`, CATEGORY_FALLBACKS[row.category] || row.category)}
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-slate-600 dark:text-slate-300">{Number(row.weight ?? 0).toFixed(2)}</td>
                    <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">
                      {t(`knowledgeBase.facts.types.${row.type_indication}`, TYPE_FALLBACKS[row.type_indication] || row.type_indication)}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-1">
                        {row.is_cardinal ? <StatusBadge label={t('knowledgeBase.facts.cardinal', 'cardinal')} tone="info" /> : null}
                        {row.is_emergency ? <StatusBadge label={t('knowledgeBase.facts.emergency', 'emergency')} tone="danger" /> : null}
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <StatusBadge
                        label={row.is_active ? t('knowledgeBase.facts.active', 'Active') : t('knowledgeBase.facts.inactive', 'Inactive')}
                        tone={row.is_active ? 'success' : 'muted'}
                      />
                    </td>
                    <td className="py-2" onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => openEdit(row)}>
                          {t('knowledgeBase.facts.edit', 'Edit')}
                        </button>
                        <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => toggleActive(row)}>
                          {row.is_active ? t('knowledgeBase.facts.deactivate', 'Deactivate') : t('knowledgeBase.facts.activate', 'Activate')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!facts.length ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                      {t('knowledgeBase.facts.empty', 'No facts match the current filters.')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* --- SLIDE-OVER EDITOR (Radix Sheet, portaled to <body>) --- */}
      <Sheet open={editorOpen} onOpenChange={(open) => { if (!open) closeEditor() }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl">
          {form ? (
            <form
              className="flex h-full min-h-0 flex-col"
              onSubmit={(event) => { event.preventDefault(); save() }}
            >
              <SheetHeader>
                <SheetTitle>
                  {editingId
                    ? t('knowledgeBase.facts.editTitle', 'Edit fact')
                    : t('knowledgeBase.facts.createTitle', 'New fact')}
                </SheetTitle>
                <SheetDescription>
                  {t('knowledgeBase.facts.editorHint', 'Meaning & prevention appear on patient reports (English + Khmer). Weight, type hint and flags influence the reasoning.')}
                </SheetDescription>
              </SheetHeader>

              <SheetBody className="space-y-6">
                <section className="grid gap-4 sm:grid-cols-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:col-span-2 dark:text-slate-400">
                    {t('knowledgeBase.facts.sectionBasics', 'Basics')}
                  </h3>
                  {!editingId ? (
                    <label className="block sm:col-span-2">
                      <span className="label-text">{t('knowledgeBase.facts.key', 'Key')} *</span>
                      <input className="input-base mt-1 w-full font-mono text-sm" value={form.key}
                             onChange={(event) => setForm({ ...form, key: event.target.value })} required />
                      <span className="mt-1 block text-xs text-slate-500">
                        {t('knowledgeBase.facts.keyLocked', 'Fact keys are permanent — rules and reports reference them.')}
                      </span>
                    </label>
                  ) : null}
                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.label', 'Name (English)')} *</span>
                    <input className="input-base mt-1 w-full" value={form.label}
                           onChange={(event) => setForm({ ...form, label: event.target.value })} required />
                  </label>
                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.labelKm', 'Name (Khmer)')}</span>
                    <input className="input-base mt-1 w-full" lang="km" value={form.label_km}
                           onChange={(event) => setForm({ ...form, label_km: event.target.value })} />
                  </label>
                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.medicalTerm', 'Medical term')}</span>
                    <input className="input-base mt-1 w-full" value={form.medical_term} placeholder="Polyuria"
                           onChange={(event) => setForm({ ...form, medical_term: event.target.value })} />
                  </label>
                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.category', 'Category')}</span>
                    <select className="input-base mt-1 w-full" value={form.category}
                            onChange={(event) => setForm({ ...form, category: event.target.value })}>
                      {CATEGORIES.map((value) => (
                        <option key={value} value={value}>
                          {t(`knowledgeBase.facts.categories.${value}`, CATEGORY_FALLBACKS[value])}
                        </option>
                      ))}
                    </select>
                  </label>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:col-span-2 dark:text-slate-400">
                    {t('knowledgeBase.facts.sectionEducation', 'Patient education — appears in patient reports')}
                  </h3>
                  <label className="block sm:col-span-2">
                    <span className="label-text">{t('knowledgeBase.facts.question', 'Interview question')}</span>
                    <textarea className="input-base mt-1 w-full" rows={2} value={form.question}
                              onChange={(event) => setForm({ ...form, question: event.target.value })} />
                  </label>
                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.meaning', 'Meaning (why it happens, English)')}</span>
                    <textarea className="input-base mt-1 w-full" rows={3} value={form.meaning}
                              onChange={(event) => setForm({ ...form, meaning: event.target.value })} />
                  </label>
                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.meaningKm', 'Meaning (Khmer)')}</span>
                    <textarea className="input-base mt-1 w-full" rows={3} lang="km" value={form.meaning_km}
                              onChange={(event) => setForm({ ...form, meaning_km: event.target.value })} />
                  </label>
                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.prevention', 'Prevention (English)')}</span>
                    <textarea className="input-base mt-1 w-full" rows={3} value={form.prevention}
                              onChange={(event) => setForm({ ...form, prevention: event.target.value })} />
                  </label>
                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.preventionKm', 'Prevention (Khmer)')}</span>
                    <textarea className="input-base mt-1 w-full" rows={3} lang="km" value={form.prevention_km}
                              onChange={(event) => setForm({ ...form, prevention_km: event.target.value })} />
                  </label>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:col-span-2 dark:text-slate-400">
                    {t('knowledgeBase.facts.sectionReasoning', 'Reasoning — steers the inference engine')}
                  </h3>
                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.weight', 'Reasoning weight (0–1)')}</span>
                    <input type="number" min="0" max="1" step="0.01" className="input-base mt-1 w-full"
                           value={form.weight}
                           onChange={(event) => setForm({ ...form, weight: event.target.value })} />
                    <span className="mt-1 block text-xs text-slate-500">
                      {t('knowledgeBase.facts.weightHint', '0 = no influence on reasoning, 1 = decisive evidence.')}
                    </span>
                  </label>
                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.typeHint', 'Type hint')}</span>
                    <select className="input-base mt-1 w-full" value={form.type_indication}
                            onChange={(event) => setForm({ ...form, type_indication: event.target.value })}>
                      {TYPE_INDICATIONS.map((value) => (
                        <option key={value} value={value}>
                          {t(`knowledgeBase.facts.types.${value}`, TYPE_FALLBACKS[value])}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.aliases', 'Aliases (comma-separated)')}</span>
                    <input className="input-base mt-1 w-full font-mono text-sm" value={form.aliases} placeholder="polyuria_alt"
                           onChange={(event) => setForm({ ...form, aliases: event.target.value })} />
                  </label>
                  <label className="block">
                    <span className="label-text">{t('knowledgeBase.facts.displayOrder', 'Display order')}</span>
                    <input type="number" className="input-base mt-1 w-full" value={form.display_order}
                           onChange={(event) => setForm({ ...form, display_order: event.target.value })} />
                  </label>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                             checked={form.is_cardinal}
                             onChange={(event) => setForm({ ...form, is_cardinal: event.target.checked })} />
                      {t('knowledgeBase.facts.cardinal', 'Cardinal (3 Ps)')}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                             checked={form.is_emergency}
                             onChange={(event) => setForm({ ...form, is_emergency: event.target.checked })} />
                      {t('knowledgeBase.facts.emergency', 'Emergency sign')}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                             checked={form.is_active}
                             onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
                      {t('knowledgeBase.facts.active', 'Active')}
                    </label>
                  </div>
                </section>
              </SheetBody>

              <SheetFooter>
                <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={closeEditor} disabled={saving}>
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={saving}>
                  {saving
                    ? t('knowledgeBase.facts.saving', 'Saving…')
                    : t('knowledgeBase.facts.save', 'Save fact')}
                </button>
              </SheetFooter>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}






