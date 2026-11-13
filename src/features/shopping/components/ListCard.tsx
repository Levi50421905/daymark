import { CheckCheck, ChevronRight, Pencil, ShoppingBasket, Trash2, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/Progress'
import { getShoppingTotals } from '@/lib/calc'
import { formatDateMedium } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CurrencyCode, ShoppingList } from '@/types/domain'

interface ListCardProps {
  list: ShoppingList
  currency: CurrencyCode
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ListCard({ list, currency, onOpen, onEdit, onDelete }: ListCardProps) {
  const totals = getShoppingTotals(list)
  const completed = list.completedAt !== null
  const budget = list.budget !== null && list.budget > 0 ? list.budget : null
  const createdLabel = formatDateMedium(list.createdAt.slice(0, 10))

  return (
    <Card interactive padding="none" className="group flex h-full flex-col overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="focus-ring flex flex-1 flex-col p-4 text-left sm:p-5"
        aria-label={`Buka daftar ${list.name}`}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border',
              completed
                ? 'border-mint/25 bg-mint/10 text-emerald-600 dark:text-mint'
                : 'border-brand/20 bg-brand/10 text-brand',
            )}
            aria-hidden="true"
          >
            {completed ? <CheckCheck size={20} strokeWidth={1.9} /> : <ShoppingBasket size={20} strokeWidth={1.9} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 truncate text-[0.9375rem] font-bold tracking-[-0.02em] text-ink">{list.name}</h3>
              <ChevronRight
                size={16}
                className="mt-0.5 shrink-0 text-ink-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink-2"
                aria-hidden="true"
              />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge tone={completed ? 'mint' : 'brand'} dot>
                {completed ? 'Selesai' : 'Aktif'}
              </Badge>
              {list.recordedTransactionId ? (
                <Badge tone="sky" dot>
                  Tercatat
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 min-h-[2.05rem] text-xs leading-relaxed text-ink-3">
          {list.note || 'Tanpa catatan tambahan.'}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-3">Estimasi</p>
            <p className="number mt-0.5 truncate text-base font-extrabold tracking-[-0.03em] text-ink">
              {formatMoney(totals.estimatedTotal, currency)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[0.6875rem] font-semibold text-ink-2">
              {totals.purchasedCount}/{totals.itemCount} barang
            </p>
            <p className="mt-0.5 text-[0.625rem] font-medium text-ink-3">
              {totals.itemCount === 0
                ? 'Belum ada barang'
                : totals.remainingCount === 0
                  ? 'Semua dibeli'
                  : `${totals.remainingCount} tersisa`}
            </p>
          </div>
        </div>

        <ProgressBar
          value={totals.progress}
          color={completed ? 'var(--c-mint)' : 'var(--c-brand)'}
          height="sm"
          className="mt-2.5"
        />
        <p className="mt-2 text-[0.625rem] font-medium text-ink-3">
          {completed && list.completedAt
            ? `Diselesaikan ${formatDateMedium(list.completedAt.slice(0, 10))}`
            : `Dibuat ${createdLabel}`}
        </p>
      </button>

      <div className="flex items-center justify-between gap-1 border-t border-line bg-surface-2/60 px-2.5 py-1.5">
        <span className="inline-flex min-w-0 items-center gap-1.5 pl-1 text-[0.6875rem] font-semibold text-ink-3">
          <Wallet size={13} strokeWidth={1.9} aria-hidden="true" />
          <span className="truncate">{budget ? formatMoney(budget, currency, { compact: true }) : 'Tanpa anggaran'}</span>
        </span>
        <div className="flex shrink-0 items-center">
          <IconButton
            icon={Pencil}
            label={`Ubah daftar ${list.name}`}
            size="sm"
            onClick={onEdit}
            className="h-11 w-11 sm:h-8 sm:w-8"
          />
          <IconButton
            icon={Trash2}
            label={`Hapus daftar ${list.name}`}
            size="sm"
            variant="danger"
            onClick={onDelete}
            className="h-11 w-11 sm:h-8 sm:w-8"
          />
        </div>
      </div>
    </Card>
  )
}
