import type { ReactNode } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCheck,
  Gauge,
  PiggyBank,
  Sparkles,
} from 'lucide-react'
import { MoneyText } from '@/components/ui/MoneyText'
import { ProgressBar } from '@/components/ui/Progress'
import { formatMoney, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  budgetComparison,
  savingsPercent,
  tasksPercent,
} from '@/features/reviews/review-helpers'
import type { CurrencyCode, ReviewSnapshot } from '@/types/domain'

function MetricLabel({ icon, children, tone }: { icon: ReactNode; children: ReactNode; tone: string }) {
  return (
    <p
      className="flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-[0.14em]"
      style={{ color: tone }}
    >
      {icon}
      {children}
    </p>
  )
}

interface ReviewMetricsProps {
  snapshot: ReviewSnapshot
  currency: CurrencyCode
  className?: string
  /** Slightly larger money type in the review detail sheet. */
  prominent?: boolean
}

/** The data half of a review — shared by the composer preview and the detail sheet. */
export function ReviewMetrics({ snapshot, currency, className, prominent = false }: ReviewMetricsProps) {
  const budget = budgetComparison(snapshot)
  const savings = savingsPercent(snapshot)
  const tasks = tasksPercent(snapshot)
  const overBudget = budget.state === 'over'
  const budgetColor =
    budget.state === 'over'
      ? 'var(--c-danger)'
      : budget.state === 'warning'
        ? 'var(--c-warning)'
        : budget.state === 'safe'
          ? 'var(--c-brand)'
          : 'var(--c-line-strong)'
  const budgetPercent = snapshot.budgetAmount > 0 ? budget.percent : 0
  const moneyClass = prominent
    ? 'text-lg font-extrabold leading-tight tracking-[-0.03em] text-ink'
    : 'text-base font-extrabold leading-tight tracking-[-0.03em] text-ink'

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="surface-muted p-3.5">
          <MetricLabel icon={<ArrowDownLeft size={12} strokeWidth={2.4} />} tone="var(--c-sky)">
            Pemasukan
          </MetricLabel>
          <p className={cn('mt-1.5', moneyClass)}>
            <MoneyText amount={snapshot.totalIncome} currency={currency} />
          </p>
          <p className="mt-0.5 text-[0.625rem] font-medium text-ink-3">Uang masuk periode ini</p>
        </div>
        <div className="surface-muted p-3.5">
          <MetricLabel icon={<ArrowUpRight size={12} strokeWidth={2.4} />} tone="var(--c-peach)">
            Pengeluaran
          </MetricLabel>
          <p className={cn('mt-1.5', moneyClass)}>
            <MoneyText amount={snapshot.totalExpense} currency={currency} />
          </p>
          <p className="mt-0.5 text-[0.625rem] font-medium text-ink-3">Belanja periode ini</p>
        </div>
      </div>

      <div className="surface-muted p-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <MetricLabel icon={<Gauge size={12} strokeWidth={2.4} />} tone="var(--c-ink-3)">
            Anggaran prorata
          </MetricLabel>
          <span className="text-sm font-bold text-ink">
            <MoneyText amount={snapshot.budgetAmount} currency={currency} />
          </span>
        </div>
        {budget.state === 'unset' ? (
          <p className="mt-2 text-[0.6875rem] leading-relaxed text-ink-3">
            Belum ada anggaran untuk periode ini. Atur anggaran bulanan di Finance agar perbandingan
            ini terisi otomatis.
          </p>
        ) : (
          <>
            <ProgressBar value={budgetPercent} color={budgetColor} height="sm" className="mt-2.5" />
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p
                className={cn(
                  'text-[0.6875rem] font-semibold',
                  overBudget ? 'text-danger' : 'text-ink-3',
                )}
              >
                {overBudget
                  ? `Melebihi anggaran ${formatMoney(Math.abs(budget.difference), currency)}`
                  : `Sisa ${formatMoney(Math.max(0, budget.difference), currency)} dari anggaran`}
              </p>
              <p className="text-[0.6875rem] font-bold text-ink-2">
                <span className="number">{formatPercent(budgetPercent, 0)}</span> terpakai
              </p>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="surface-muted p-3.5">
          <div className="flex items-center justify-between gap-2">
            <MetricLabel icon={<PiggyBank size={12} strokeWidth={2.4} />} tone="var(--c-success)">
              Tabungan
            </MetricLabel>
            <span className="number text-[0.6875rem] font-bold text-ink-2">
              {formatPercent(savings, 0)}
            </span>
          </div>
          <ProgressBar value={savings} color="var(--c-success)" height="sm" className="mt-2.5" />
          <p className="mt-2 text-[0.6875rem] font-medium text-ink-3">
            <span className="font-bold text-ink-2">
              <MoneyText amount={snapshot.savingsSaved} currency={currency} />
            </span>{' '}
            dari{' '}
            <MoneyText amount={snapshot.savingsTarget} currency={currency} />
          </p>
          <p className="mt-1 flex items-center gap-1 text-[0.6875rem] font-medium text-ink-3">
            <Sparkles size={11} strokeWidth={2.2} aria-hidden="true" />
            Setoran periode ini:{' '}
            <span className="font-bold text-ink-2">
              <MoneyText amount={snapshot.contributions} currency={currency} />
            </span>
          </p>
        </div>

        <div className="surface-muted p-3.5">
          <div className="flex items-center justify-between gap-2">
            <MetricLabel icon={<CheckCheck size={12} strokeWidth={2.4} />} tone="var(--c-brand)">
              Tugas selesai
            </MetricLabel>
            <span className="number text-[0.6875rem] font-bold text-ink-2">
              {formatPercent(tasks, 0)}
            </span>
          </div>
          <ProgressBar value={tasks} color="var(--c-brand)" height="sm" className="mt-2.5" />
          <p className="mt-2 text-[0.6875rem] font-medium text-ink-3">
            <span className="number font-bold text-ink-2">{snapshot.tasksCompleted}</span> dari{' '}
            <span className="number">{snapshot.tasksTotal}</span> tugas dalam periode
          </p>
          <p className="mt-1 text-[0.6875rem] font-medium text-ink-3">
            {Math.max(0, snapshot.tasksTotal - snapshot.tasksCompleted)} tugas belum selesai
          </p>
        </div>
      </div>
    </div>
  )
}
