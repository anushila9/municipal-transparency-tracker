import { useState } from 'react'
import { Link, useOutletContext } from 'react-router'
import { AlertTriangle, ArrowRight, CircleCheckBig, Inbox, Landmark, Plus, Wallet } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchReports } from '../../api/admin.js'
import { fetchProjects, fetchStats } from '../../api/projects.js'
import { useMeta } from '../../api/useMeta.js'
import { useRequest } from '../../api/useRequest.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import { ErrorState } from '../../components/States.jsx'
import { ButtonLink } from '../../components/ui/Button.jsx'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import { Select } from '../../components/ui/Field.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import { formatDate, formatNpr, formatNprShort } from '../../lib/format.js'
import { STATUS_FILL } from '../../lib/labels.js'

export default function AdminDashboardPage() {
  const meta = useMeta()
  const { reportCounts } = useOutletContext()
  const [fiscalYear, setFiscalYear] = useState('')
  const stats = useRequest(fiscalYear, (signal) => fetchStats(fiscalYear, signal))

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Budget utilisation and delivery across all recorded projects."
        actions={
          <>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="whitespace-nowrap">Fiscal year</span>
              <Select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                placeholder="All years"
                options={(meta?.fiscalYears ?? []).map((fy) => ({ value: fy, label: `FY ${fy}` }))}
                className="w-36"
              />
            </label>
            <ButtonLink to="/admin/projects/new" icon={Plus}>
              New project
            </ButtonLink>
          </>
        }
      />

      {stats.error && !stats.data ? (
        <ErrorState message={stats.error.message} onRetry={stats.reload} />
      ) : !stats.data ? (
        <DashboardSkeleton />
      ) : (
        <div className={`space-y-6 transition-opacity ${stats.loading ? 'opacity-60' : ''}`} aria-busy={stats.loading}>
          <KpiRow stats={stats.data} openReports={reportCounts?.open} />
          {stats.data.projectCount === 0 ? (
            <Card className="p-10 text-center">
              <p className="font-medium text-slate-800">No projects recorded{fiscalYear ? ` for FY ${fiscalYear}` : ''} yet</p>
              <p className="mt-1 text-sm text-slate-500">Charts appear once projects are added.</p>
              <ButtonLink to="/admin/projects/new" icon={Plus} className="mt-4">
                Add the first project
              </ButtonLink>
            </Card>
          ) : (
            <div className="grid gap-6 xl:grid-cols-5">
              <SectorBudgetCard stats={stats.data} className="min-w-0 xl:col-span-3" />
              <StatusCard stats={stats.data} className="min-w-0 xl:col-span-2" />
            </div>
          )}
          <div className="grid gap-6 *:min-w-0 lg:grid-cols-2">
            <AttentionProjects fiscalYear={fiscalYear} />
            <LatestReports />
          </div>
        </div>
      )}
    </div>
  )
}

function KpiRow({ stats, openReports }) {
  const utilisation = pct(stats.totalSpent, stats.totalAllocated)
  const completion = pct(stats.completedCount, stats.projectCount)
  return (
    <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
      <Kpi icon={Landmark} label="Approved budget" value={formatNprShort(stats.totalAllocated)} detail={formatNpr(stats.totalAllocated)} />
      <Kpi
        icon={Wallet}
        label="Spent to date"
        value={formatNprShort(stats.totalSpent)}
        detail={`${utilisation}% of approved budget`}
        meter={utilisation}
      />
      <Kpi
        icon={CircleCheckBig}
        label="Completion rate"
        value={`${completion}%`}
        detail={`${stats.completedCount} of ${stats.projectCount} projects completed`}
        meter={completion}
      />
      <Kpi
        icon={AlertTriangle}
        label="Needs attention"
        value={String(stats.overdueCount)}
        detail={
          <>
            overdue project{stats.overdueCount === 1 ? '' : 's'}
            {openReports != null && (
              <>
                {' · '}
                <Link to="/admin/reports?state=OPEN" className="font-medium text-brand-700 hover:underline">
                  {openReports} open report{openReports === 1 ? '' : 's'}
                </Link>
              </>
            )}
          </>
        }
        tone={stats.overdueCount > 0 ? 'warn' : undefined}
      />
    </div>
  )
}

function Kpi({ icon: Icon, label, value, detail, meter, tone }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'}`}>
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {meter != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div className={`h-full rounded-full ${meter > 100 ? 'bg-accent-600' : 'bg-brand-600'}`} style={{ width: `${Math.min(meter, 100)}%` }} />
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </Card>
  )
}

function SectorBudgetCard({ stats, className }) {
  const [view, setView] = useState('chart')
  const rows = stats.bySector.filter((s) => s.count > 0)
  const data = rows.map((s) => ({ label: s.label, allocated: Number(s.allocated), spent: Number(s.spent) }))

  return (
    <Card className={className}>
      <CardHeader
        title="Budget by sector"
        description="Approved budget against spending to date"
        actions={
          <div className="inline-flex rounded-lg border border-line p-0.5 text-xs" role="group" aria-label="View as">
            {['chart', 'table'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`min-h-8 rounded-md px-3 font-medium capitalize ${view === v ? 'bg-brand-700 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />
      {view === 'chart' ? (
        <div className="px-2 pt-4 pb-3 sm:px-4">
          <div className="mb-2 flex flex-wrap gap-4 px-2 text-xs text-slate-600">
            <LegendKey color="var(--color-chart-allocated)" label="Approved" />
            <LegendKey color="var(--color-chart-spent)" label="Spent" />
          </div>
          <div style={{ height: Math.max(220, data.length * 64) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }} barGap={2} barCategoryGap="28%">
                <CartesianGrid horizontal={false} stroke="#e7e5e0" />
                <XAxis type="number" tickFormatter={axisNpr} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={112} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                <Tooltip content={<BudgetTooltip />} cursor={{ fill: 'rgba(0, 56, 147, 0.05)' }} />
                <Bar dataKey="allocated" name="Approved" fill="var(--color-chart-allocated)" radius={[0, 4, 4, 0]} maxBarSize={18} />
                <Bar dataKey="spent" name="Spent" fill="var(--color-chart-spent)" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-2.5 sm:px-5">Sector</th>
                <th className="px-3 py-2.5 text-right">Projects</th>
                <th className="px-3 py-2.5 text-right">Approved</th>
                <th className="px-3 py-2.5 text-right">Spent</th>
                <th className="px-4 py-2.5 text-right sm:px-5">Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {stats.bySector.map((s) => (
                <tr key={s.sector}>
                  <td className="px-4 py-2.5 font-medium sm:px-5">{s.label}</td>
                  <td className="px-3 py-2.5 text-right">
                    {s.count} <span className="text-xs text-slate-500">({s.completed} done)</span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">{formatNprShort(s.allocated)}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">{formatNprShort(s.spent)}</td>
                  <td className="px-4 py-2.5 text-right sm:px-5">{pct(s.spent, s.allocated)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function LegendKey({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  )
}

function BudgetTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const [allocated, spent] = [payload.find((p) => p.dataKey === 'allocated')?.value ?? 0, payload.find((p) => p.dataKey === 'spent')?.value ?? 0]
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-900">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-slate-700">
        <span className="h-2 w-2 rounded-sm" style={{ background: 'var(--color-chart-allocated)' }} /> Approved: {formatNpr(allocated)}
      </p>
      <p className="flex items-center gap-1.5 text-slate-700">
        <span className="h-2 w-2 rounded-sm" style={{ background: 'var(--color-chart-spent)' }} /> Spent: {formatNpr(spent)} ({pct(spent, allocated)}%)
      </p>
    </div>
  )
}

function StatusCard({ stats, className }) {
  const max = Math.max(1, ...stats.byStatus.map((s) => s.count))
  return (
    <Card className={className}>
      <CardHeader title="Projects by status" description={`${stats.projectCount} project${stats.projectCount === 1 ? '' : 's'} in total`} />
      <ul className="space-y-4 px-4 py-5 sm:px-5">
        {stats.byStatus.map((s) => (
          <li key={s.status}>
            <Link to={`/admin/projects?status=${s.status}`} className="group block rounded-md focus-visible:outline-offset-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-700 group-hover:text-brand-700">
                  <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${STATUS_FILL[s.status]}`} />
                  {s.label}
                </span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {s.count} <span className="text-xs font-normal text-slate-500">({pct(s.count, stats.projectCount)}%)</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <div className={`h-full rounded-full ${STATUS_FILL[s.status]}`} style={{ width: `${(s.count / max) * 100}%` }} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {stats.overdueCount > 0 && (
        <p className="mx-4 mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:mx-5">
          <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {stats.overdueCount} project{stats.overdueCount === 1 ? ' is' : 's are'} past the target completion date.
        </p>
      )}
    </Card>
  )
}

function AttentionProjects({ fiscalYear }) {
  const { data, error, loading, reload } = useRequest(`stalled:${fiscalYear}`, (signal) =>
    fetchProjects({ status: 'STALLED', fiscalYear, size: 5 }, signal),
  )
  return (
    <Card>
      <CardHeader
        title="Stalled projects"
        description="Work has stopped; citizens are likely to ask"
        actions={
          <Link to="/admin/projects?status=STALLED" className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
            View all <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <MiniList
        loading={loading && !data}
        error={error}
        onRetry={reload}
        items={data?.content}
        empty="No stalled projects. Good news."
        render={(p) => (
          <Link to={`/admin/projects/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-slate-900">{p.title}</span>
              <span className="block text-xs text-slate-500">
                Ward {p.wardNo} · {p.utilizationPercent}% spent · target {formatDate(p.targetEndDate)}
              </span>
            </span>
            <StatusBadge status={p.status} />
          </Link>
        )}
      />
    </Card>
  )
}

function LatestReports() {
  const { data, error, loading, reload } = useRequest('open-reports', (signal) => fetchReports({ state: 'OPEN', size: 5 }, signal))
  return (
    <Card>
      <CardHeader
        title="Awaiting response"
        description="Most recent unanswered citizen reports"
        actions={
          <Link to="/admin/reports?state=OPEN" className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
            Open inbox <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <MiniList
        loading={loading && !data}
        error={error}
        onRetry={reload}
        items={data?.content}
        empty="Inbox zero. Every report has a response."
        render={(r) => (
          <Link to="/admin/reports?state=OPEN" className="flex gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5">
            <Inbox aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm text-slate-800">“{r.comment}”</span>
              <span className="mt-0.5 block truncate text-xs text-slate-500">
                {r.reporterName ?? 'Anonymous'} · {r.projectTitle} · {formatDate(r.submittedAt)}
              </span>
            </span>
          </Link>
        )}
      />
    </Card>
  )
}

function MiniList({ loading, error, onRetry, items, empty, render }) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3 px-4 py-4 sm:px-5" aria-busy="true" aria-label="Loading">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 rounded bg-slate-100" />
        ))}
      </div>
    )
  }
  if (error) {
    return (
      <div className="px-4 py-6 text-center text-sm sm:px-5" role="alert">
        <p className="text-accent-700">{error.message}</p>
        <button onClick={onRetry} className="mt-2 min-h-9 font-medium text-brand-700 hover:underline">
          Try again
        </button>
      </div>
    )
  }
  if (!items?.length) return <p className="px-4 py-8 text-center text-sm text-slate-500 sm:px-5">{empty}</p>
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.id}>{render(item)}</li>
      ))}
    </ul>
  )
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl border border-line bg-white" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="h-80 rounded-xl border border-line bg-white xl:col-span-3" />
        <div className="h-80 rounded-xl border border-line bg-white xl:col-span-2" />
      </div>
    </div>
  )
}

function pct(part, whole) {
  const w = Number(whole)
  if (!w) return 0
  return Math.round((Number(part) / w) * 1000) / 10
}

function axisNpr(v) {
  if (v >= 1e7) return `${+(v / 1e7).toFixed(1)} cr`
  if (v >= 1e5) return `${+(v / 1e5).toFixed(0)} L`
  return String(v)
}
