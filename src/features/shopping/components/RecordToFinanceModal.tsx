import { useMemo, useState, type FormEvent } from 'react'
import { ReceiptText, TriangleAlert, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DateInput, Field, Select } from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useNavigate } from 'react-router-dom'
import { getShoppingTotals } from '@/lib/calc'
import { todayISO } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { actions } from '@/lib/store'
import {
  errorMessage,
  listRecordAmount,
  preferredExpenseCategoryId,
} from '@/features/shopping/lib/shopping-helpers'
import type { Category, CurrencyCode, ShoppingList } from '@/types/domain'

interface RecordToFinanceModalProps {
  open: boolean
  list: ShoppingList
  currency: CurrencyCode
  categories: Category[]
  onClose: () => void
}

const FORM_ID = 'shopping-finance-form'

export function RecordToFinanceModal({ open, list, currency, categories, onClose }: RecordToFinanceModalProps) {
  const toast = useToast()
  const navigate = useNavigate()
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'expense'),
    [categories],
  )
  const totals = getShoppingTotals(list)
  const amount = listRecordAmount(list)
  const [categoryId, setCategoryId] = useState(() => preferredExpenseCategoryId(categories))
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState<string | null>(null)

  const alreadyRecorded = list.recordedTransactionId !== null
  const canRecord = !alreadyRecorded && amount > 0 && expenseCategories.length > 0 && categoryId !== ''

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (alreadyRecorded) {
      setError('Daftar ini sudah dicatat ke Finance.')
      return
    }
    if (!categoryId) {
      setError('Pilih kategori pengeluaran.')
      return
    }
    if (!date) {
      setError('Pilih tanggal transaksi.')
      return
    }
    if (amount <= 0) {
      setError('Daftar ini belum punya nominal untuk dicatat.')
      return
    }
    try {
      actions.recordShoppingToFinance(list.id, categoryId, date)
      toast({
        tone: 'success',
        title: 'Tercatat ke Finance',
        description: `${formatMoney(amount, currency)} dari “${list.name}” sudah dicatat sebagai pengeluaran.`,
        action: { label: 'Buka Finance', onClick: () => navigate('/finance') },
      })
      onClose()
    } catch (actionError) {
      toast({ tone: 'error', title: 'Gagal mencatat ke Finance', description: errorMessage(actionError) })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Catat ke Finance"
      description="Simpan total belanja ini sebagai transaksi pengeluaran."
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form={FORM_ID} icon={ReceiptText} disabled={!canRecord}>
            Catat sekarang
          </Button>
        </ModalFooter>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="surface-muted p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-semibold text-ink-3">Total yang akan dicatat</p>
              <p className="number mt-1 text-2xl font-extrabold tracking-[-0.03em] text-ink">
                {formatMoney(amount, currency)}
              </p>
              <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-ink-3">
                {totals.purchasedCount > 0
                  ? `Dari ${totals.purchasedCount} barang yang sudah dibeli. Sisa ${totals.remainingCount} barang belum dihitung.`
                  : `Dari estimasi ${totals.itemCount} barang karena belum ada barang yang ditandai dibeli.`}
              </p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-brand/20 bg-brand/10 text-brand">
              <Wallet size={19} strokeWidth={1.9} aria-hidden="true" />
            </span>
          </div>
        </div>

        {alreadyRecorded ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-warning/25 bg-warning/10 p-3.5 text-xs leading-relaxed text-ink-2">
            <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
            <p>Daftar ini sudah tercatat ke Finance. Batalkan catatan yang lama terlebih dahulu.</p>
          </div>
        ) : null}

        {expenseCategories.length === 0 ? (
          <div className="rounded-2xl border border-warning/25 bg-warning/10 p-3.5">
            <p className="text-xs font-semibold text-ink">Belum ada kategori pengeluaran.</p>
            <p className="mt-1 text-[0.6875rem] leading-relaxed text-ink-3">
              Tambahkan kategori pengeluaran di halaman Finance terlebih dahulu.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2.5"
              onClick={() => {
                onClose()
                navigate('/finance')
              }}
            >
              Buka Finance
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategori pengeluaran" htmlFor="shopping-finance-category" required>
              <Select
                id="shopping-finance-category"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value)
                  setError(null)
                }}
              >
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tanggal transaksi" htmlFor="shopping-finance-date" required>
              <DateInput
                id="shopping-finance-date"
                value={date}
                onValueChange={(value) => {
                  setDate(value)
                  setError(null)
                }}
              />
            </Field>
          </div>
        )}

        {error ? (
          <p className="text-xs font-medium text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <p className="text-[0.6875rem] leading-relaxed text-ink-3">
          Daftar akan otomatis ditandai selesai setelah dicatat. Kamu bisa membatalkan catatan ini kapan saja
          dari halaman daftar.
        </p>
      </form>
    </Modal>
  )
}
