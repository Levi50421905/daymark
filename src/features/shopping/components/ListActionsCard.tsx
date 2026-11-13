import { CheckCheck, CheckCircle2, ReceiptText, RotateCcw, Trash2, Undo2, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { getShoppingTotals } from '@/lib/calc'
import { formatDateMedium } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { listRecordAmount } from '@/features/shopping/lib/shopping-helpers'
import type { Category, CurrencyCode, ShoppingList, Transaction } from '@/types/domain'

interface ListActionsCardProps {
  list: ShoppingList
  currency: CurrencyCode
  linkedTransaction: Transaction | null
  linkedCategory: Category | null
  onRecord: () => void
  onUnlink: () => void
  onToggleAll: () => void
  onComplete: () => void
  onReopen: () => void
  onDelete: () => void
}

export function ListActionsCard({
  list,
  currency,
  linkedTransaction,
  linkedCategory,
  onRecord,
  onUnlink,
  onToggleAll,
  onComplete,
  onReopen,
  onDelete,
}: ListActionsCardProps) {
  const totals = getShoppingTotals(list)
  const completed = list.completedAt !== null
  const allPurchased = totals.itemCount > 0 && totals.purchasedCount === totals.itemCount
  const amount = listRecordAmount(list)
  const recordDisabled = totals.itemCount === 0 || amount <= 0

  return (
    <Card padding="sm">
      <SectionHeading title="Aksi daftar" description="Catat pengeluaran dan kelola status belanja." />

      <div className="mt-4">
        {list.recordedTransactionId ? (
          <div className="surface-muted p-3">
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-sky/20 bg-sky/10 text-sky">
                <ReceiptText size={15} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-xs font-bold text-ink">Tercatat di Finance</p>
                  <Badge tone="sky" dot>
                    Terhubung
                  </Badge>
                </div>
                <p className="mt-1 text-[0.6875rem] leading-relaxed text-ink-3">
                  {linkedTransaction
                    ? `${formatMoney(linkedTransaction.amount, currency)} · ${linkedCategory?.name ?? 'Pengeluaran'} · ${formatDateMedium(linkedTransaction.date)}`
                    : 'Transaksi pengeluaran untuk daftar ini sudah tercatat.'}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" fullWidth icon={Undo2} className="mt-2.5" onClick={onUnlink}>
              Batalkan catatan
            </Button>
            <p className="mt-1.5 text-[0.625rem] leading-relaxed text-ink-3">
              Transaksi pengeluaran terkait akan ikut dihapus dari Finance.
            </p>
          </div>
        ) : (
          <div className="surface-muted p-3">
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-brand/15 bg-brand/10 text-brand">
                <Wallet size={15} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink">Catat ke Finance</p>
                <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ink-3">
                  Simpan total belanja sebagai pengeluaran. Cukup sekali per daftar.
                </p>
              </div>
            </div>
            <Button
              variant="soft"
              size="sm"
              fullWidth
              icon={ReceiptText}
              className="mt-2.5"
              onClick={onRecord}
              disabled={recordDisabled}
              title={recordDisabled ? 'Tambahkan barang dengan nominal terlebih dahulu.' : undefined}
            >
              Catat ke Finance
            </Button>
            <p className="mt-1.5 text-[0.625rem] leading-relaxed text-ink-3">
              {recordDisabled
                ? 'Tambahkan barang dengan nominal terlebih dahulu.'
                : `${formatMoney(amount, currency)} akan dicatat sebagai pengeluaran.`}
            </p>
          </div>
        )}
      </div>

      <div className="my-4 border-t border-line" />

      <div className="space-y-2">
        <Button
          variant="secondary"
          fullWidth
          icon={allPurchased ? Undo2 : CheckCheck}
          onClick={onToggleAll}
          disabled={totals.itemCount === 0}
        >
          {allPurchased ? 'Batalkan semua tanda' : 'Tandai semua dibeli'}
        </Button>
        {completed ? (
          <Button variant="secondary" fullWidth icon={RotateCcw} onClick={onReopen}>
            Buka kembali daftar
          </Button>
        ) : (
          <Button variant="soft" fullWidth icon={CheckCircle2} onClick={onComplete}>
            Selesaikan belanja
          </Button>
        )}
        <Button variant="danger" fullWidth icon={Trash2} onClick={onDelete}>
          Hapus daftar
        </Button>
      </div>

      <p className="mt-3 text-[0.625rem] leading-relaxed text-ink-3">
        {completed && list.completedAt
          ? `Daftar diselesaikan ${formatDateMedium(list.completedAt.slice(0, 10))}.`
          : 'Menandai semua barang tidak mengubah harga aktual yang sudah diisi.'}
      </p>
    </Card>
  )
}
