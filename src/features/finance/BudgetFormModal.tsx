import { useEffect, useMemo, useState } from 'react'
import { Check, Gauge } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { AmountInput } from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { MoneyText } from '@/components/ui/MoneyText'
import { useToast } from '@/components/ui/Toast'
import { formatMonthLabel } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { actions } from '@/lib/store'
import { sum } from '@/lib/utils'
import type { Budget, Category, CurrencyCode } from '@/types/domain'
import { budgetAmountMap } from './finance-utils'

interface BudgetFormModalProps {
  open: boolean
  month: string
  categories: Category[]
  budgets: Budget[]
  currency: CurrencyCode
  onClose: () => void
}

export function BudgetFormModal({
  open,
  month,
  categories,
  budgets,
  currency,
  onClose,
}: BudgetFormModalProps) {
  const toast = useToast()
  const [values, setValues] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!open) return
    setValues(budgetAmountMap(budgets, month))
  }, [open, month, budgets])

  const total = useMemo(() => sum(Object.values(values)), [values])
  const filledCount = useMemo(
    () => Object.values(values).filter((amount) => amount > 0).length,
    [values],
  )

  const handleSave = () => {
    try {
      actions.setBudgets(month, values)
      toast({
        tone: 'success',
        title: 'Anggaran disimpan',
        description: `${filledCount} kategori · total ${formatMoney(total, currency)}.`,
      })
      onClose()
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menyimpan anggaran',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.',
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Atur anggaran ${formatMonthLabel(month)}`}
      description="Tentukan batas belanja per kategori. Isi 0 untuk menghapus anggaran kategori tersebut."
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button icon={Check} onClick={handleSave}>
            Simpan anggaran
          </Button>
        </ModalFooter>
      }
    >
      <div className="surface-muted mb-4 flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-ink-3">
            Total anggaran
          </p>
          <p className="mt-0.5 truncate text-base font-extrabold tracking-[-0.02em] text-ink">
            <MoneyText amount={total} currency={currency} />
          </p>
        </div>
        <p className="shrink-0 text-[0.6875rem] font-semibold text-ink-3">
          {filledCount} dari {categories.length} kategori
        </p>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          compact
          icon={Gauge}
          title="Belum ada kategori pengeluaran"
          description="Buat kategori pengeluaran dulu lewat tombol Kategori di halaman Keuangan."
        />
      ) : (
        <div className="space-y-2">
          {categories.map((category) => {
            const amount = values[category.id] ?? 0
            return (
              <div key={category.id} className="surface-muted flex items-center gap-2.5 p-2">
                <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink">{category.name}</p>
                  <p className="text-[0.625rem] font-medium text-ink-3">
                    {amount > 0 ? 'Anggaran aktif' : 'Belum dianggarkan'}
                  </p>
                </div>
                <AmountInput
                  currency={currency}
                  value={amount}
                  onValueChange={(next) =>
                    setValues((current) => ({ ...current, [category.id]: next }))
                  }
                  aria-label={`Anggaran ${category.name}`}
                  wrapperClassName="w-[132px] shrink-0"
                  className="h-10 text-xs"
                />
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
