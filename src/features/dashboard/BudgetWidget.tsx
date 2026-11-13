import { Link } from 'react-router-dom'
import { CircleAlert, Gauge } from 'lucide-react'
import { CircularProgress } from '@/components/charts/DonutChart'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/Progress'
import { WidgetLink, WidgetShell } from '@/features/dashboard/WidgetShell'
import { getBudgetSummary } from '@/lib/calc'
import { formatMoney } from '@/lib/format'
import { monthKeyOf, todayISO } from '@/lib/dates'
import { useAppData } from '@/lib/store'
import { cn } from '@/lib/utils'

export function BudgetWidget() {
  const data = useAppData()
  const currency = data.settings.currency
  const month = monthKeyOf(todayISO())
  const budget = getBudgetSummary(data, month)
  const rows = budget.rows.filter((row) => row.budget > 0).slice(0, 3)
  const hasBudget = budget.totalBudget > 0
  const progress = Math.min(100, budget.progress)
  const color =
    budget.progress >= 100 ? 'var(--c-danger)' : budget.progress >= 80 ? 'var(--c-warning)' : 'var(--c-brand)'

  return (
    <WidgetShell
      title="Anggaran bulan ini"
      description="Tetap di jalur tanpa merasa dibatasi"
      icon="Gauge"
      iconColor="#4E9FF3"
      action={<WidgetLink to="/finance" label="Atur" />}
      className="min-h-[240px]"
    >
      {!hasBudget ? (
        <EmptyState
          compact
          icon={Gauge}
          title="Anggaran belum diatur"
          description="Buat batas per kategori agar pengeluaran lebih tenang."
          className="py-5"
          action={
            <Link to="/finance" className="text-[0.6875rem] font-bold text-brand hover:underline">
              Atur di Finance →
            </Link>
          }
        />
      ) : (
        <div>
          <div className="flex items-center gap-4">
            <CircularProgress value={progress} size={78} strokeWidth={7} color={color} ariaLabel="Progress anggaran">
              <span className="number text-sm font-extrabold text-ink">{Math.round(budget.progress)}%</span>
            </CircularProgress>
            <div className="min-w-0">
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
                {budget.remaining >= 0 ? 'Sisa anggaran' : 'Melewati anggaran'}
              </p>
              <p
                className={cn(
                  'number mt-0.5 text-lg font-extrabold tracking-[-0.03em]',
                  budget.remaining >= 0 ? 'text-ink' : 'text-danger',
                )}
              >
                {formatMoney(Math.abs(budget.remaining), currency)}
              </p>
              <p className="mt-0.5 text-[0.625rem] text-ink-3">
                dari {formatMoney(budget.totalBudget, currency, { compact: true })}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {rows.map((row) => (
              <div key={row.category.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-[0.6875rem] font-semibold text-ink-2">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.category.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{row.category.name}</span>
                  </span>
                  <span
                    className={cn(
                      'number shrink-0 text-[0.625rem] font-bold',
                      row.state === 'over' ? 'text-danger' : row.state === 'warning' ? 'text-warning' : 'text-ink-3',
                    )}
                  >
                    {Math.round(row.progress)}%
                  </span>
                </div>
                <ProgressBar
                  value={Math.min(100, row.progress)}
                  height="xs"
                  className="mt-1"
                  color={
                    row.state === 'over'
                      ? 'var(--c-danger)'
                      : row.state === 'warning'
                        ? 'var(--c-warning)'
                        : row.category.color
                  }
                />
              </div>
            ))}
          </div>

          {budget.overBudgetCount > 0 ? (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-danger/8 px-2 py-1.5 text-[0.625rem] leading-relaxed text-danger">
              <CircleAlert size={12} className="mt-px shrink-0" aria-hidden="true" />
              {budget.overBudgetCount} kategori sudah melewati anggaran.
            </p>
          ) : null}
        </div>
      )}
    </WidgetShell>
  )
}
