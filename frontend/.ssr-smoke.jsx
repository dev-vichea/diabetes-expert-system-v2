import './.ssr-smoke-env.js'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ClinicalDashboard, DoctorWorkloadStrip } from '@/components/dashboard/ClinicalDashboard'

const t = (key, fallback, values) => {
  if (typeof fallback !== 'string') return key
  return fallback.replace(/\{\{(.*?)\}\}/g, (_, raw) => {
    const name = raw.trim()
    return values && values[name] != null ? String(values[name]) : ''
  })
}

const workload = {
  pending_reviews: 5,
  urgent_pending: 2,
  reviewed_by_me: 9,
  assessed_by_me: 4,
  signoff_share: 64,
}

const strip = renderToStaticMarkup(
  <MemoryRouter>
    <DoctorWorkloadStrip workload={workload} ready rangeLabel="Last 30 Days" t={t} />
  </MemoryRouter>
)

const dashboard = renderToStaticMarkup(
  <MemoryRouter>
    <LanguageProvider>
      <AuthProvider>
        <ClinicalDashboard activeRole="doctor" />
      </AuthProvider>
    </LanguageProvider>
  </MemoryRouter>
)

const tagNames = (html) => [...html.matchAll(/<\/?([^\s>/]+)/g)].map((match) => match[1])
const invalidTags = (html) => tagNames(html).filter((name) => !/^[a-zA-Z][a-zA-Z0-9-]*$/.test(name))

const checks = [
  ['strip renders 4 tile icons + header icon', (strip.match(/<svg/g) || []).length >= 5],
  ['strip has no invalid tag names', invalidTags(strip).length === 0],
  ['strip tile: pending', strip.includes('Awaiting sign-off')],
  ['strip tile: urgent', strip.includes('Urgent awaiting sign-off')],
  ['strip tile: reviewed', strip.includes('Signed off by you')],
  ['strip tile: assessed', strip.includes('Assessed by you')],
  ['strip sign-off percent', strip.includes('64%')],
  ['strip range badge', strip.includes('Last 30 Days')],
  ['strip values rendered', (strip.match(/tabular-nums/g) || []).length >= 4],
  ['dashboard: range bar heading', dashboard.includes('Date Range') || dashboard.includes('ចន្លោះពេលវេលា')],
  ['dashboard: sliding glide present', dashboard.includes('dash-range-glide')],
  ['dashboard: custom trigger present', dashboard.includes('Custom') || dashboard.includes('កំណត់ដោយខ្លួនឯង')],
  ['dashboard: all presets present', [
    ['Last 7 Days', '៧ ថ្ងៃចុងក្រោយ'],
    ['Last 30 Days', '៣០ ថ្ងៃចុងក្រោយ'],
    ['This Year', 'ឆ្នាំនេះ'],
    ['All Time', 'គ្រប់ពេលវេលា'],
  ].every(([english, khmer]) => dashboard.includes(english) || dashboard.includes(khmer))],
  ['dashboard has no invalid tag names', invalidTags(dashboard).length === 0],
]

let failed = 0
for (const [label, ok] of checks) {
  if (!ok) failed += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
}

if (failed) {
  console.log('\ninvalid tags in strip:', invalidTags(strip))
  console.log('\ninvalid tags in dashboard:', invalidTags(dashboard))
  process.exit(1)
}
console.log(`\nall ${checks.length} SSR smoke checks passed`)
