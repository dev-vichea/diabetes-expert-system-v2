import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, AlertTriangle, Microscope, MoreVertical, Pill, Stethoscope, Users } from 'lucide-react'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  SectionCard,
} from '@/components/ui'

const statsCards = [
  {
    title: 'Assessments Today',
    description: 'New submissions in last 24h',
    value: '42',
    trend: '+8% from yesterday',
    icon: Microscope,
    iconClass: 'bg-cyan-100/20 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/10 dark:text-cyan-300 dark:ring-cyan-500/30',
    chartColor: '#0891b2',
    chartData: [{ value: 6 }, { value: 9 }, { value: 7 }, { value: 11 }, { value: 10 }, { value: 13 }],
  },
  {
    title: 'Active Patients',
    description: 'Patients under review',
    value: '128',
    trend: '+12 this week',
    icon: Users,
    iconClass: 'bg-sky-100/20 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/10 dark:text-sky-300 dark:ring-sky-500/30',
    chartColor: '#0ea5e9',
    chartData: [{ value: 18 }, { value: 20 }, { value: 21 }, { value: 24 }, { value: 22 }, { value: 26 }],
  },
  {
    title: 'Urgent Cases',
    description: 'Flagged by review team',
    value: '7',
    trend: '-2 from last week',
    icon: AlertTriangle,
    iconClass: 'bg-amber-100/20 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/10 dark:text-amber-300 dark:ring-amber-500/30',
    chartColor: '#d97706',
    chartData: [{ value: 5 }, { value: 8 }, { value: 7 }, { value: 9 }, { value: 8 }, { value: 7 }],
  },
  {
    title: 'Treatment Plans',
    description: 'Recommendations issued',
    value: '96',
    trend: '+15 this month',
    icon: Pill,
    iconClass: 'bg-emerald-100/20 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/10 dark:text-emerald-300 dark:ring-emerald-500/30',
    chartColor: '#059669',
    chartData: [{ value: 14 }, { value: 15 }, { value: 18 }, { value: 16 }, { value: 19 }, { value: 22 }],
  },
]

const projectsData = [
  { id: 1, name: 'Community Screening Program', members: ['DR', 'NP', 'KD'], budget: '$14,000', completion: 82, icon: Activity, iconClass: 'bg-cyan-100/20 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/10 dark:text-cyan-300 dark:ring-cyan-500/30' },
  { id: 2, name: 'Rule Base Validation Sprint', members: ['AL', 'SM', 'NT'], budget: '$9,500', completion: 67, icon: Stethoscope, iconClass: 'bg-sky-100/20 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/10 dark:text-sky-300 dark:ring-sky-500/30' },
  { id: 3, name: 'Patient Education Campaign', members: ['PR', 'JT', 'KO'], budget: '$6,200', completion: 54, icon: Users, iconClass: 'bg-emerald-100/20 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/10 dark:text-emerald-300 dark:ring-emerald-500/30' },
]

const areaChartData = [
  { month: 'Jan', diagnosed: 84, pending: 32 },
  { month: 'Feb', diagnosed: 92, pending: 30 },
  { month: 'Mar', diagnosed: 105, pending: 28 },
  { month: 'Apr', diagnosed: 98, pending: 24 },
  { month: 'May', diagnosed: 116, pending: 26 },
  { month: 'Jun', diagnosed: 123, pending: 21 },
]

const lineChartData = [
  { day: 'Mon', sessions: 52, reviews: 23 },
  { day: 'Tue', sessions: 48, reviews: 20 },
  { day: 'Wed', sessions: 67, reviews: 29 },
  { day: 'Thu', sessions: 61, reviews: 27 },
  { day: 'Fri', sessions: 73, reviews: 34 },
  { day: 'Sat', sessions: 55, reviews: 22 },
  { day: 'Sun', sessions: 58, reviews: 25 },
]

const pieChartData = [
  { name: 'Normal Risk', value: 44, fill: '#0ea5e9' },
  { name: 'Prediabetes', value: 33, fill: '#f59e0b' },
  { name: 'Diabetes', value: 23, fill: '#ef4444' },
]

const barChartData = [
  { quarter: 'Q1', cases: 310, closed: 280 },
  { quarter: 'Q2', cases: 355, closed: 319 },
  { quarter: 'Q3', cases: 392, closed: 358 },
  { quarter: 'Q4', cases: 420, closed: 391 },
]

const areaChartConfig = {
  diagnosed: { label: 'Diagnosed', color: '#0891b2' },
  pending: { label: 'Pending', color: '#64748b' },
}

const lineChartConfig = {
  sessions: { label: 'Sessions', color: '#0284c7' },
  reviews: { label: 'Reviews', color: '#0f766e' },
}

const pieChartConfig = {
  normal: { label: 'Normal Risk', color: '#0ea5e9' },
  prediabetes: { label: 'Prediabetes', color: '#f59e0b' },
  diabetes: { label: 'Diabetes', color: '#ef4444' },
}

const barChartConfig = {
  cases: { label: 'Cases', color: '#0891b2' },
  closed: { label: 'Closed', color: '#059669' },
}

function ProgressBar({ value }) {
  return (
    <div className="h-2 w-32 rounded-full bg-slate-100 dark:bg-[#131a33]">
      <div className="h-2 rounded-full bg-cyan-600 dark:bg-cyan-500" style={{ width: `${value}%` }} />
    </div>
  )
}

export function ClinicalDashboard({ activeRole }) {
  return (
    <div className="w-full space-y-6">
      <section className="surface overflow-hidden p-0">
        <div className="relative h-64 bg-cover bg-top bg-no-repeat sm:h-72" style={{ backgroundImage: 'url(/images/banner.png)' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent" />
          <div className="relative z-10 flex h-full items-center p-6 sm:p-8">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{activeRole} dashboard</p>
              <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Build Better Diabetes Care Pathways</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                Monitor screening trends, review rule-driven outcomes, and coordinate medical follow-ups from one unified clinical dashboard.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/diagnosis" className="btn-primary">Start Assessment</Link>
                <Link to="/patients" className="btn-secondary">Open Patients</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.title} className="surface flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{card.description}</p>
                </div>
                <span className={`inline-flex rounded-lg p-2 ${card.iconClass}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-emerald-600">{card.trend}</p>
              <ChartContainer className="mt-auto h-16 w-full pt-4" config={{ value: { label: card.title, color: card.chartColor } }}>
                <AreaChart data={card.chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <Area type="monotone" dataKey="value" stroke={card.chartColor} fill={card.chartColor} fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </article>
          )
        })}
      </div>

      <section className="surface overflow-hidden p-0">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-[#1b2342]">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Projects</h3>
            <p className="mt-1 text-sm text-slate-500">3 active initiatives in this cycle</p>
          </div>
          <button type="button" className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-[#0c122a] dark:hover:text-slate-200">
            <MoreVertical className="h-4 w-4" />
          </button>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-[#0c1024]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Projects</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-[#1b2342] dark:bg-[#050816]">
              {projectsData.map((project, index) => {
                const Icon = project.icon
                return (
                  <tr
                    key={project.id}
                    className={`transition-colors ${
                      index % 2 === 0 ? 'bg-slate-50/70 dark:bg-[#070b1b]' : 'bg-white dark:bg-[#050816]'
                    } hover:bg-slate-100 dark:hover:bg-[#0e1530]`}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <span className={`mr-3 inline-flex rounded-lg p-2 ${project.iconClass}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="font-medium text-slate-900">{project.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex -space-x-2">
                        {project.members.map((member) => (
                          <span key={`${project.id}-${member}`} className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-cyan-600 text-xs font-semibold text-white dark:border-[#070b1b] dark:bg-cyan-500">
                            {member}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-700 dark:text-slate-300">{project.budget}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{project.completion}%</span>
                        <ProgressBar value={project.completion} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid items-stretch gap-5 xl:grid-cols-2">
        <SectionCard className="h-full" title="Diagnosis Volume vs Pending" description="Monthly clinical throughput.">
          <ChartContainer config={areaChartConfig} className="h-[300px] w-full">
            <AreaChart data={areaChartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="diagnosed" stroke="var(--color-diagnosed)" fill="var(--color-diagnosed)" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="pending" stroke="var(--color-pending)" fill="var(--color-pending)" fillOpacity={0.12} strokeWidth={2} />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </SectionCard>

        <SectionCard className="h-full" title="Workflow Sessions" description="Weekly interaction and review trends.">
          <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
            <LineChart data={lineChartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="sessions" stroke="var(--color-sessions)" strokeWidth={3} dot={{ fill: 'var(--color-sessions)', r: 4 }} />
              <Line type="monotone" dataKey="reviews" stroke="var(--color-reviews)" strokeWidth={3} dot={{ fill: 'var(--color-reviews)', r: 4 }} />
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
        </SectionCard>

        <SectionCard className="h-full" title="Risk Classification" description="Current diagnosis split.">
          <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={62} outerRadius={100} paddingAngle={4} dataKey="value" nameKey="name">
                {pieChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </SectionCard>

        <SectionCard className="h-full" title="Quarterly Case Closure" description="Opened and completed cases.">
          <ChartContainer config={barChartConfig} className="h-[300px] w-full">
            <BarChart data={barChartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="cases" fill="var(--color-cases)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="closed" fill="var(--color-closed)" radius={[6, 6, 0, 0]} />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        </SectionCard>
      </div>
    </div>
  )
}
