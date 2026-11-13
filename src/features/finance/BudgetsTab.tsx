import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Gauge, Info, SlidersHorizontal, TriangleAlert } from 'lucide-react'
import { budgetState, type BudgetRow, type MonthSummary } from '@/lib/calc'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeading } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MoneyText } from '@/components/ui/MoneyText'
import { ProgressBar } from '@/components/ui/Progress'
import { useToast } from '@/components/ui/Toast'
import { formatMonthLabel, shiftMonthKey } from '@/lib/dates'
import { formatMoney, formatPercent } from '@/lib/format'
import { fadeUp } from '@/lib/motion'
import { actions } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { AppData, CurrencyCode } from '@/types/domain'
import { BudgetFormModal } from './BudgetFormModal'
import { budgetStateMeta } from './finance-utils'

interface BudgetsTabProps {
  data: AppData
  month: string
  summary: MonthSummary
}

export function BudgetsTab({ data, month, summary }: BudgetsTabProps) {
  const toast = useToast()
  const currency = data.settings.currency
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmCopy, setConfirmCopy] = useState(false)
  const previousMonth = shiftMonthKey(month, -1)
  const budget = summary.budget
  const status = budgetState(budget.totalBudget, budget.spent)
  const meta = budgetStateMeta(status)
  const expenseCategories = useMemo(
    () => data.categories.filter((category) => category.type === 'expense'),
    [data.categories],
  )
  const previousBudgetCount = useMemo(
    () => data.budgets.filter((entry) => entry.month === previousMonth).length,
    [data.budgets, previousMonth],
  )
  const currentBudgetCount = useMemo(
    () => data.budgets.filter((entry) => entry.month === month).length,
    [data.budgets, month],
  )
  const budgetedCount = budget.rows.filter((row) => row.budget > 0).length

  const copyFromPrevious = () => {
    try {
      const copied = actions.copyBudgets(previousMonth, month)
      toast({
        tone: 'success',
        title: 'Anggaran disalin',
        description: `${copied} kategori dari ${formatMonthLabel(previousMonth)}.`,
      })
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menyalin anggaran',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.',
      })
    } finally {
      setConfirmCopy(false)
    }
  }

  const handleCopyClick = () => {
    if (currentBudgetCount > 0) setConfirmCopy(true)
    else copyFromPrevious()
  }

  return (
    <div className="space-y-3">
      <div className="surface-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-brand">
              Anggaran
            </p>
            <h2 className="mt-1 text-base font-extrabold tracking-[-0.025em] text-ink">
              {formatMonthLabel(month)}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {previousBudgetCount > 0 ? (
              <Button variant="secondary" size="sm" icon={Copy} onClick={handleCopyClick}>
                Salin {formatMonthLabel(previousMonth, 'short')}
              </Button>
            ) : null}
            <Button
              variant="soft"
              size="sm"
              icon={SlidersHorizontal}
              onClick={() => setModalOpen(true)}
            >
              Atur
            </Button>
          </div>
        </div>

        {budget.totalBudget > 0 ? (
          <div className="mt-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[0.6875rem] font-semibold text-ink-3">Sisa anggaran</p>
                <p
                  className={cn(
                    'mt-0.5 truncate text-[1.6rem] font-extrabold leading-tight tracking-[-0.04em]',
                    status === 'over'
                      ? 'text-danger'
                      : status === 'warning'
                        ? 'text-warning'
                        : 'text-ink',
                  )}
                >
                  <MoneyText amount={budget.remaining} currency={currency} animated />
                </p>
              </div>
              <Badge tone={meta.tone}>{meta.label}</Badge>
            </div>
            <ProgressBar value={budget.progress} color={meta.color} height="md" className="mt-3" />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[0.6875rem] font-semibold text-ink-3">
              <span>
                {formatPercent(budget.progress)} terpakai · {formatMoney(budget.spent, currency)}{' '}
                dari {formatMoney(budget.totalBudget, currency)}
              </span>
              <span>{budgetedCount} kategori dianggarkan</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-line-strong bg-surface-2 p-3.5">
            <p className="text-xs font-bold text-ink">Belum ada anggaran bulan ini</p>
            <p className="mt-1 text-[0.6875rem] leading-relaxed text-ink-3">
              Anggaran membantu kamu melihat batas belanja per kategori. Mulai dari angka yang
              masuk akal, lalu sesuaikan pelan-pelan.
            </p>
            {budget.totalExpense > 0 ? (
              <p className="mt-2 text-[0.6875rem] font-semibold text-ink-2">
                Pengeluaran bulan ini {formatMoney(budget.totalExpense, currency)} belum punya
                anggaran.
              </p>
            ) : null}
          </div>
        )}

        {budget.unbudgetedSpent > 0 && budget.totalBudget > 0 ? (
          <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-warning/20 bg-warning/10 px-2.5 py-2 text-[0.6875rem] font-medium leading-relaxed text-warning">
            <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            {formatMoney(budget.unbudgetedSpent, currency)} pengeluaran berada di kategori tanpa
            anggaran.
          </p>
        ) : null}
      </div>

      {budget.warnings.length > 0 ? (
        <div className="surface-muted flex items-start gap-3 border-warning/25 bg-warning/10 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <TriangleAlert size={17} strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink">
              {budget.overBudgetCount > 0
                ? `${budget.overBudgetCount} kategori sudah lewat anggaran`
                : `${budget.warnings.length} kategori hampir penuh`}
            </p>
            <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ink-3">
              {budget.warnings
                .slice(0, 3)
                .map((row) => `${row.category.name} ${formatPercent(row.progress)}`)
                .join(' · ')}
              {budget.warnings.length > 3
                ? ` · +${budget.warnings.length - 3} kategori lainnya`
                : ''}
            </p>
          </div>
        </div>
      ) : null}

      <div className="surface-card p-4 sm:p-5">
        <SectionHeading
          title="Anggaran per kategori"
          description="Bandingkan rencana dengan realisasi bulan ini."
        />
        {budget.rows.length === 0 ? (
          <EmptyState
            compact
            icon={Gauge}
            title="Belum ada anggaran atau pengeluaran"
            description="Atur batas belanja per kategori, atau salin dari bulan lalu untuk mulai cepat."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" variant="soft" icon={SlidersHorizontal} onClick={() => setModalOpen(true)}>
                  Atur anggaran
                </Button>
                {previousBudgetCount > 0 ? (
                  <Button size="sm" variant="secondary" icon={Copy} onClick={handleCopyClick}>
                    Salin bulan lalu
                  </Button>
                ) : null}
              </div>
            }
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {budget.rows.map((row) => (
              <BudgetRowItem
                key={row.category.id}
                row={row}
                currency={currency}
                onSet={() => setModalOpen(true)}
              />
            ))}
          </ul>
        )}
      </div>

      <BudgetFormModal
        open={modalOpen}
        month={month}
        categories={expenseCategories}
        budgets={data.budgets}
        currency={currency}
        onClose={() => setModalOpen(false)}
      />

      <ConfirmDialog
        open={confirmCopy}
        onClose={() => setConfirmCopy(false)}
        onConfirm={copyFromPrevious}
        tone="primary"
        confirmLabel="Salin anggaran"
        title="Ganti anggaran bulan ini?"
        description={`Anggaran ${formatMonthLabel(month)} akan diganti dengan anggaran ${formatMonthLabel(
          previousMonth,
        )} (${previousBudgetCount} kategori). Transaksi tidak berubah.`}
      />
    </div>
  )
}

interface BudgetRowItemProps {
  row: BudgetRow
  currency: CurrencyCode
  onSet: () => void
}

function BudgetRowItem({ row, currency, onSet }: BudgetRowItemProps) {
  const meta = budgetStateMeta(row.state)
  const over = row.state === 'over'
  return (
    <motion.li variants={fadeUp} initial="hidden" animate="visible" className="surface-muted p-3">
      <div className="flex items-center gap-2.5">
        <CategoryIcon icon={row.category.icon} color={row.category.color} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-xs font-bold text-ink">{row.category.name}</p>
            {row.state !== 'unset' ? <Badge tone={meta.tone}>{meta.label}</Badge> : null}
          </div>
          <p className="mt-0.5 truncate text-[0.6875rem] font-medium text-ink-3">
            {row.budget > 0
              ? `${formatMoney(row.spent, currency)} dari ${formatMoney(row.budget, currency)}`
              : `${formatMoney(row.spent, currency)} · belum dianggarkan`}
          </p>
        </div>
        {row.budget > 0 ? (
          <p
            className={cn(
              'number shrink-0 text-right text-xs font-extrabold',
              over ? 'text-danger' : row.state === 'warning' ? 'text-warning' : 'text-ink',
            )}
          >
            {formatMoney(row.remaining, currency, { signed: true })}
            <span className="block text-[0.625rem] font-medium text-ink-3">
              {over ? 'lewat' : 'sisa'}
            </span>
          </p>
        ) : (
          <Button size="sm" variant="soft" onClick={onSet}>
            Atur
          </Button>
        )}
      </div>
      {row.budget > 0 ? (
        <ProgressBar value={row.progress} color={meta.color} height="xs" className="mt-2.5" />
      ) : null}
    </motion.li>
  )
}
