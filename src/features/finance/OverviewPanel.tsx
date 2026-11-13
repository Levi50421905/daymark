import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { budgetState, transactionsInRange, type MonthSummary } from '@/lib/calc'
import { Badge } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { MoneyDelta, MoneyText } from '@/components/ui/MoneyText'
import { ProgressBar } from '@/components/ui/Progress'
import { formatDateRange, formatMonthLabel, monthKeyOf, shiftMonthKey } from '@/lib/dates'
import { formatMoney, formatPercent } from '@/lib/format'
import { fadeUp, staggerContainer, transitions } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { AppData, CurrencyCode } from '@/types/domain'
import { budgetStateMeta, monthlyAverageExpense } from './finance-utils'

interface OverviewPanelProps {
  data: AppData
  month: string
  summary: MonthSummary
  previous: MonthSummary
  onMonthChange: (month: string) => void
  onOpenBudgets: () => void
}

/**
 * Month navigation + the four headline metrics for the visible month.
 * The balance is the hero card; income, expense and budget stay quiet beside it.
 */
export function OverviewPanel({
  data,
  month,
  summary,
  previous,
  onMonthChange,
  onOpenBudgets,
}: OverviewPanelProps) {
  const currency = data.settings.currency
  const currentMonth = monthKeyOf()
  const isCurrentMonth = month === currentMonth
  const previousMonth = shiftMonthKey(month, -1)
  const monthTransactions = useMemo(
    () => transactionsInRange(data, summary.range),
    [data, summary.range],
  )
  const incomeCount = monthTransactions.filter((transaction) => transaction.type === 'income').length
  const expenseCount = monthTransactions.length - incomeCount
  const budget = summary.budget
  const status = budgetState(budget.totalBudget, budget.spent)
  const meta = budgetStateMeta(status)
  const hasPrevious = previous.transactionCount > 0
  const averageExpense = monthlyAverageExpense(summary.expense, month)

  return (
    <motion.section variants={staggerContainer(0.05)} initial="hidden" animate="visible">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <IconButton
            label="Bulan sebelumnya"
            icon={ChevronLeft}
            variant="secondary"
            onClick={() => onMonthChange(shiftMonthKey(month, -1))}
          />
          <div className="min-w-[9.25rem] px-1 text-center sm:min-w-[10.5rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={month}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={transitions.micro}
              >
                <p className="truncate text-sm font-extrabold tracking-[-0.02em] text-ink">
                  {formatMonthLabel(month)}
                </p>
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                  {formatDateRange(summary.range.start, summary.range.end)}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          <IconButton
            label="Bulan berikutnya"
            icon={ChevronRight}
            variant="secondary"
            onClick={() => onMonthChange(shiftMonthKey(month, 1))}
          />
        </div>
        <div className="flex items-center gap-2">
          {isCurrentMonth ? (
            <Badge tone="mint" dot>
              Bulan berjalan
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              icon={CalendarDays}
              onClick={() => onMonthChange(currentMonth)}
            >
              Kembali ke bulan ini
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <motion.div variants={fadeUp} className="col-span-2 xl:col-span-1">
          <div className="surface-card hero-gradient relative flex h-full flex-col overflow-hidden p-4 sm:p-5">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-brand/25 blur-2xl"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-10 left-6 h-24 w-24 rounded-full bg-lavender/25 blur-2xl"
            />
            <div className="relative flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-ink-2">
                  Saldo bulan ini
                </p>
                <p className="mt-1.5 truncate text-[1.45rem] font-extrabold leading-tight tracking-[-0.04em] text-ink sm:text-[1.6rem]">
                  <MoneyText amount={summary.balance} currency={currency} animated />
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-brand/20 bg-surface/70 text-brand backdrop-blur-sm">
                <Wallet size={18} strokeWidth={1.9} aria-hidden="true" />
              </span>
            </div>
            <div className="relative mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-[0.6875rem] font-semibold text-ink-3">
              {hasPrevious ? (
                <>
                  <span>vs {formatMonthLabel(previousMonth, 'short')}</span>
                  <MoneyDelta amount={summary.balance - previous.balance} currency={currency} />
                </>
              ) : (
                <span>Belum ada data pembanding bulan lalu.</span>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <MetricCard
            label="Pemasukan"
            amount={summary.income}
            currency={currency}
            icon={ArrowDownLeft}
            iconClassName="border-mint/20 bg-mint/12 text-emerald-600 dark:text-mint"
            footnote={`${incomeCount} transaksi masuk bulan ini`}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <MetricCard
            label="Pengeluaran"
            amount={summary.expense}
            currency={currency}
            icon={ArrowUpRight}
            iconClassName="border-peach/25 bg-peach/15 text-orange-600 dark:text-peach"
            footnote={
              summary.expense > 0
                ? `Rata-rata ${formatMoney(averageExpense, currency, { compact: true })} per hari`
                : `${expenseCount} transaksi · belum ada pengeluaran`
            }
          />
        </motion.div>

        <motion.div variants={fadeUp} className="col-span-2 xl:col-span-1">
          <div className="surface-card flex h-full flex-col p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                Sisa anggaran
              </p>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] border border-lavender/25 bg-lavender/12 text-lavender">
                <Gauge size={15} strokeWidth={2.1} aria-hidden="true" />
              </span>
            </div>
            {budget.totalBudget > 0 ? (
              <>
                <p
                  className={cn(
                    'mt-2 truncate text-[1.15rem] font-extrabold leading-tight tracking-[-0.03em]',
                    status === 'over'
                      ? 'text-danger'
                      : status === 'warning'
                        ? 'text-warning'
                        : 'text-ink',
                  )}
                >
                  <MoneyText amount={budget.remaining} currency={currency} animated />
                </p>
                <ProgressBar
                  value={budget.progress}
                  color={meta.color}
                  height="xs"
                  className="mt-2.5"
                />
                <div className="mt-auto flex flex-wrap items-center justify-between gap-1.5 pt-2">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <span className="text-[0.6875rem] font-semibold text-ink-3">
                    {formatPercent(budget.progress)} terpakai
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm font-bold text-ink">Belum diatur</p>
                <p className="mt-1 text-[0.6875rem] leading-relaxed text-ink-3">
                  {summary.expense > 0
                    ? `${formatMoney(summary.expense, currency)} pengeluaran belum punya anggaran.`
                    : 'Tetapkan batas belanja bulan ini supaya lebih tenang.'}
                </p>
                <div className="mt-auto pt-3">
                  <Button variant="soft" size="sm" icon={Gauge} onClick={onOpenBudgets}>
                    Atur anggaran
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

interface MetricCardProps {
  label: string
  amount: number
  currency: CurrencyCode
  icon: LucideIcon
  iconClassName: string
  footnote: string
}

function MetricCard({ label, amount, currency, icon: Icon, iconClassName, footnote }: MetricCardProps) {
  return (
    <div className="surface-card flex h-full flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-3">{label}</p>
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] border',
            iconClassName,
          )}
        >
          <Icon size={15} strokeWidth={2.1} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 truncate text-[1.15rem] font-extrabold leading-tight tracking-[-0.03em] text-ink">
        <MoneyText amount={amount} currency={currency} animated />
      </p>
      <p className="mt-auto pt-2 text-[0.6875rem] font-medium leading-relaxed text-ink-3">{footnote}</p>
    </div>
  )
}
