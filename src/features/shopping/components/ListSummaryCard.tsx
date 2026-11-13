import type { ReactNode } from 'react'
import { ReceiptText, ShoppingBasket, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CircularProgress } from '@/components/charts/DonutChart'
import { MoneyText } from '@/components/ui/MoneyText'
import { ProgressBar } from '@/components/ui/Progress'
import { getShoppingTotals } from '@/lib/calc'
import { formatDateMedium } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CurrencyCode, ShoppingList } from '@/types/domain'

interface ListSummaryCardProps {
  list: ShoppingList
  currency: CurrencyCode
  onEditList: () => void
}

interface TotalCellProps {
  label: string
  hint: string
  value: ReactNode
  tone?: 'default' | 'danger' | 'success'
}

function TotalCell({ label, hint, value, tone = 'default' }: TotalCellProps) {
  return (
    <div className="min-w-0 p-4">
      <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-3">{label}</p>
      <p
        className={cn(
          'number mt-1 truncate text-sm font-extrabold tracking-[-0.02em] sm:text-[0.9375rem]',
          tone === 'danger' ? 'text-danger' : tone === 'success' ? 'text-success' : 'text-ink',
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[0.625rem] leading-relaxed text-ink-3">{hint}</p>
    </div>
  )
}

export function ListSummaryCard({ list, currency, onEditList }: ListSummaryCardProps) {
  const totals = getShoppingTotals(list)
  const completed = list.completedAt !== null
  const budget = list.budget !== null && list.budget > 0 ? list.budget : null
  const spent = totals.actualTotal
  const budgetProgress = budget ? (spent / budget) * 100 : 0
  const remainingBudget = budget ? budget - spent : 0
  const overBudget = budget !== null && spent > budget
  const nearBudget = budget !== null && !overBudget && budgetProgress >= 80
  const projectedOver = budget !== null ? totals.projectedTotal - budget : 0
  const budgetColor = overBudget ? 'var(--c-danger)' : nearBudget ? 'var(--c-warning)' : 'var(--c-brand)'
  const difference = totals.difference
  const differenceTone =
    totals.purchasedCount === 0 ? 'default' : difference > 0 ? 'danger' : difference < 0 ? 'success' : 'default'

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="hero-gradient p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={completed ? 'mint' : 'brand'} dot>
            {completed ? 'Selesai' : 'Aktif'}
          </Badge>
          {list.recordedTransactionId ? (
            <Badge tone="sky" dot>
              Tercatat di Finance
            </Badge>
          ) : null}
          <span className="text-[0.6875rem] font-medium text-ink-3">
            {completed && list.completedAt
              ? `Diselesaikan ${formatDateMedium(list.completedAt.slice(0, 10))}`
              : `Dibuat ${formatDateMedium(list.createdAt.slice(0, 10))}`}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-3">Progres belanja</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="number text-3xl font-extrabold leading-none tracking-[-0.04em] text-ink">
                {totals.purchasedCount}
              </span>
              <span className="number text-sm font-bold text-ink-3">/ {totals.itemCount}</span>
              <span className="text-xs font-semibold text-ink-2">barang</span>
            </p>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-ink-3">
              {totals.itemCount === 0
                ? 'Belum ada barang di daftar ini.'
                : totals.remainingCount === 0
                  ? 'Semua barang sudah ditandai dibeli.'
                  : `${totals.remainingCount} barang masih perlu dibeli.`}
            </p>
            <div className="mt-3 max-w-sm">
              <ProgressBar
                value={totals.progress}
                color={completed ? 'var(--c-mint)' : 'var(--c-brand)'}
                height="md"
              />
            </div>
          </div>
          <CircularProgress
            value={totals.progress}
            size={96}
            strokeWidth={8}
            color={completed ? 'var(--c-mint)' : 'var(--c-brand)'}
            ariaLabel={`${totals.purchasedCount} dari ${totals.itemCount} barang sudah dibeli`}
          >
            <span className="number text-xl font-extrabold tracking-[-0.03em] text-ink">
              {Math.round(totals.progress)}%
            </span>
          </CircularProgress>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-y divide-line border-t border-line sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
        <TotalCell
          label="Estimasi"
          hint="Perkiraan seluruh barang"
          value={<MoneyText amount={totals.estimatedTotal} currency={currency} animated />}
        />
        <TotalCell
          label="Aktual"
          hint={totals.purchasedCount > 0 ? 'Sudah dibelanjakan' : 'Belum ada yang dibeli'}
          value={<MoneyText amount={spent} currency={currency} animated />}
        />
        <TotalCell
          label="Proyeksi"
          hint="Aktual + sisa estimasi"
          value={<MoneyText amount={totals.projectedTotal} currency={currency} animated />}
        />
        <TotalCell
          label="Selisih"
          hint={
            totals.purchasedCount === 0
              ? 'Butuh harga aktual'
              : difference === 0
                ? 'Sesuai estimasi'
                : difference > 0
                  ? 'Lebih mahal dari estimasi'
                  : 'Lebih hemat dari estimasi'
          }
          tone={differenceTone}
          value={
            totals.purchasedCount === 0
              ? formatMoney(0, currency)
              : formatMoney(difference, currency, { signed: true })
          }
        />
      </div>

      <div className="border-t border-line p-4 sm:px-5 sm:py-4">
        {budget !== null ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2">
                <Wallet size={13} strokeWidth={1.9} aria-hidden="true" />
                Anggaran daftar
              </p>
              <p className="number text-xs font-bold text-ink">
                {formatMoney(spent, currency)}
                <span className="font-medium text-ink-3"> dari {formatMoney(budget, currency)}</span>
              </p>
            </div>
            <ProgressBar
              value={Math.min(100, budgetProgress)}
              color={budgetColor}
              height="md"
              className="mt-2"
            />
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[0.6875rem] text-ink-3">
              <span className={cn(overBudget && 'font-semibold text-danger', nearBudget && 'font-semibold text-warning')}>
                {overBudget
                  ? `Melebihi anggaran ${formatMoney(-remainingBudget, currency)}`
                  : `Sisa anggaran ${formatMoney(remainingBudget, currency)}`}
              </span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {!overBudget && projectedOver > 0 ? (
                  <span className="font-semibold text-warning">
                    Proyeksi bisa lewat {formatMoney(projectedOver, currency)}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={onEditList}
                  className="focus-ring font-semibold text-brand underline-offset-2 hover:underline"
                >
                  Ubah anggaran
                </button>
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-brand/15 bg-brand/10 text-brand">
                <ReceiptText size={15} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-2">Belum ada anggaran</p>
                <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ink-3">
                  Tetapkan batas belanja supaya pengeluaran tetap terkendali.
                </p>
              </div>
            </div>
            <Button variant="soft" size="sm" icon={Wallet} onClick={onEditList}>
              Atur anggaran
            </Button>
          </div>
        )}
      </div>

      {totals.itemCount === 0 ? (
        <div className="flex items-center gap-2 border-t border-line bg-surface-2/60 px-4 py-2.5 text-[0.6875rem] text-ink-3 sm:px-5">
          <ShoppingBasket size={13} strokeWidth={1.9} aria-hidden="true" />
          Tambahkan barang agar total dan anggaran bisa dihitung.
        </div>
      ) : null}
    </Card>
  )
}
