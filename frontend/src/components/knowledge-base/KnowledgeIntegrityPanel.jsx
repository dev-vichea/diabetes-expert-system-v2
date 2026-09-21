import { useEffect, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import api, { getApiData, getApiErrorMessage } from '@/api/client'
import { useLanguage } from '@/contexts/LanguageContext'
import { ErrorAlert, LoadingState } from '@/components/ui'

export function KnowledgeIntegrityPanel() {
  const { t } = useLanguage()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    api.get('/rules/integrity').then((response) => {
      if (!cancelled) setReport(getApiData(response))
    }).catch((err) => {
      if (!cancelled) setError(getApiErrorMessage(err, t('knowledgeIntegrity.loadError', 'Could not check rule–fact links.')))
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [revision, t])

  const query = search.trim().toLowerCase()
  const links = (report?.fact_links || []).filter((row) =>
    [row.key, row.label, ...row.used_by, ...row.produced_by].join(' ').toLowerCase().includes(query))

  return (
    <section className="surface space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t('knowledgeIntegrity.title', 'Knowledge base integrity')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('knowledgeIntegrity.description', 'Check catalog links, value types, and rule execution order.')}</p>
        </div>
        <button type="button" className="btn-secondary gap-2" disabled={loading} onClick={() => setRevision((value) => value + 1)}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{t('knowledgeIntegrity.refresh', 'Check again')}
        </button>
      </div>
      {error ? <ErrorAlert message={error} /> : null}
      {loading ? <LoadingState label={t('knowledgeIntegrity.loading', 'Checking rules and facts…')} /> : !error && report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['rules', 'Active rules', report.summary.active_rules],
              ['facts', 'Linked facts', report.summary.referenced_facts],
              ['errors', 'Link errors', report.summary.errors],
            ].map(([key, label, count]) => (
              <div key={key} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm text-slate-500">{t(`knowledgeIntegrity.${key}`, label)}</p>
                <p className="mt-1 text-2xl font-semibold">{count}</p>
              </div>
            ))}
          </div>
          <p className={`rounded-lg p-3 text-sm ${report.valid ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200'}`}>
            {report.valid ? t('knowledgeIntegrity.valid', 'All active rules pass the structural checks.') : t('knowledgeIntegrity.invalid', 'Resolve these links before relying on the affected rules.')}
          </p>
          {report.issues.length ? (
            <ul className="space-y-2 text-sm">
              {report.issues.map((issue, index) => <li key={`${issue.rule_code}-${index}`} className="rounded-lg border border-amber-200 p-3"><strong>{issue.rule_code}</strong>: {issue.message}</li>)}
            </ul>
          ) : null}
          <label className="relative block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className="input-base pl-9" aria-label={t('knowledgeIntegrity.search', 'Search facts or rules')} placeholder={t('knowledgeIntegrity.search', 'Search facts or rules')} value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200 dark:border-slate-700">
                {['fact', 'type', 'source', 'producedBy', 'usedBy'].map((key) => <th key={key} className="p-3">{t(`knowledgeIntegrity.${key}`, key)}</th>)}
              </tr></thead>
              <tbody>{links.map((row) => <tr key={row.key} className="border-b border-slate-100 align-top dark:border-slate-800">
                <td className="p-3"><p className="font-medium">{row.label}</p><code className="text-xs text-slate-500">{row.key}</code></td>
                <td className="p-3">{t(`knowledgeIntegrity.types.${row.data_type}`, row.data_type || '—')}<p className="text-xs text-slate-500">{row.unit}</p></td>
                <td className="p-3">{t(`knowledgeIntegrity.sources.${row.value_source}`, row.value_source || '—')}</td>
                <td className="p-3">{row.produced_by.length ? row.produced_by.map((code) => <p key={code} className="mb-1 break-words font-mono text-xs">{code}</p>) : '—'}</td>
                <td className="p-3">{row.used_by.length ? row.used_by.map((code) => <p key={code} className="mb-1 break-words font-mono text-xs">{code}</p>) : '—'}</td>
              </tr>)}</tbody>
            </table>
            {!links.length ? <p className="py-6 text-center text-slate-500">{t('knowledgeIntegrity.empty', 'No matching links.')}</p> : null}
          </div>
          <p className="text-xs text-slate-500">{t('knowledgeIntegrity.scope', 'These checks validate rule structure. Clinical accuracy requires separate evaluation with verified patient outcomes.')}</p>
        </>
      ) : null}
    </section>
  )
}
