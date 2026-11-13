import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Gauge, Wallet } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { MoneyText } from '@/components/ui/MoneyText'
import { ProgressBar } from '@/components/ui/Progress'
import { TrendChart } from '@/components/charts/TrendChart'
import { WidgetLink } from '@/features/dashboard/WidgetShell'
import {
  clipRangeToToday,
  getDailyTrend,
  getMonthSummary,
} from '@/lib/calc'
import { formatMoney } from '@/lib/format'
import { formatMonthLabel, monthKeyOf, todayISO } from '@/lib/dates'
import { useAppData } from '@/lib/store'

export function FinanceWidget() {
  const data = useAppData()
  const currency = data.settings.currency
  const month = monthKeyOf(todayISO())
  const summary = getMonthSummary(data, month)
  const trendRange = clipRangeToToday(summary.range)
  const trend = getDailyTrend(data, trendRange).map((point) => ({
    label: point.label,
    value: point.expense,
  }))
  const hasBudget = summary.budget.totalBudget > 0
  const budgetProgress = summary.budget.progress
  const budgetColor =
    budgetProgress >= 100 ? 'var(--c-danger)' : budgetProgress >= 80 ? 'var(--c-warning)' : 'var(--c-brand)'

  return (
    <Card padding="none" className="relative h-full overflow-hidden">
      <div className="hero-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-sky/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-mint/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[11px] border border-white/70 bg-white/55 text-brand shadow-sm backdrop-blur dark:border-line dark:bg-surface/60">
              <Wallet size={17} strokeWidth={2} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-ink-3">
                Saldo bulan ini
              </p>
              <p className="mt-0.5 text-xs font-semibold text-ink-2">{formatMonthLabel(month)}</p>
            </div>
          </div>
          <WidgetLink to="/finance" label="Detail" />
        </div>

        <div className="mt-5 flex flex-1 flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <MoneyText
              amount={summary.balance}
              currency={currency}
              animated
              className="block text-[2rem] font-extrabold leading-none tracking-[-0.045em] text-ink sm:text-[2.6rem]"
            />
            <p className="mt-2 max-w-xs text-[0.6875rem] leading-relaxed text-ink-2">
              {hasBudget
                ? summary.budget.remaining >= 0
                  ? `Sisa ${formatMoney(summary.budget.remaining, currency, { compact: true })} dari anggaran bulan ini.`
                  : `Pengeluaran ${formatMoney(Math.abs(summary.budget.remaining), currency, { compact: true })} melewati anggaran.`
                : 'Belum ada anggaran bulan ini. Atur dari halaman Finance.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/50 px-3 py-2 backdrop-blur dark:border-line dark:bg-surface/55">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-success/10 text-success">
                  <ArrowDownLeft size={13} strokeWidth={2.4} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                    Masuk
                  </span>
                  <MoneyText
                    amount={summary.income}
                    currency={currency}
                    compact
                    className="block text-xs font-extrabold leading-tight text-ink"
                  />
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/50 px-3 py-2 backdrop-blur dark:border-line dark:bg-surface/55">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-danger/10 text-danger">
                  <ArrowUpRight size={13} strokeWidth={2.4} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                    Keluar
                  </span>
                  <MoneyText
                    amount={summary.expense}
                    currency={currency}
                    compact
                    className="block text-xs font-extrabold leading-tight text-ink"
                  />
                </span>
              </span>
              <Link
                to="/finance"
                className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-white/70 bg-white/50 px-3 py-2 text-[0.625rem] font-bold text-ink-2 backdrop-blur transition-colors hover:bg-white/70 dark:border-line dark:bg-surface/55 dark:hover:bg-surface-2"
              >
                <Gauge size={13} className="text-brand" aria-hidden="true" />
                Kelola
              </Link>
            </div>
          </div>

          <div className="w-full shrink-0 rounded-2xl border border-white/70 bg-white/45 p-3 backdrop-blur-md dark:border-line dark:bg-surface/55 lg:max-w-[246px]">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[0.625rem] font-bold text-ink-2">Pengeluaran harian</span>
              <MoneyText
                amount={summary.expense}
                currency={currency}
                compact
                className="text-[0.625rem] font-bold text-ink-3"
              />
            </div>
            <TrendChart
              data={trend}
              height={104}
              showAxis={false}
              color="#23B8BE"
              valueFormat={(value) => formatMoney(value, currency, { compact: true })}
              ariaLabel="Tren pengeluaran harian bulan ini"
            />
            <div className="mt-1 flex justify-between text-[0.5625rem] font-medium text-ink-3">
              <span>Awal bulan</span>
              <span>Hari ini</span>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-white/60 pt-3.5 dark:border-line">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.625rem] font-semibold text-ink-3">
              {hasBudget ? `Anggaran terpakai ${Math.round(budgetProgress)}%` : 'Anggaran belum diatur'}
            </span>
            <span className="number text-[0.625rem] font-bold text-ink-2">
              {hasBudget
                ? `${formatMoney(summary.budget.spent, currency, { compact: true })} / ${formatMoney(summary.budget.totalBudget, currency, { compact: true })}`
                : 'Atur di Finance'}
            </span>
          </div>
          {hasBudget ? (
            <ProgressBar value={budgetProgress} color={budgetColor} height="xs" className="mt-2" />
          ) : null}
        </div>
      </div>
    </Card>
  )
}
