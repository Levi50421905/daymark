import { useEffect, useId, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, Check, Tags } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AmountInput, DateInput, Field, FormGrid, Select, TextInput } from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { formatMoney } from '@/lib/format'
import { actions } from '@/lib/store'
import type { Category, CurrencyCode, Transaction, TransactionType } from '@/types/domain'

interface TransactionFormModalProps {
  open: boolean
  /** Null creates a new transaction. */
  transaction: Transaction | null
  defaultDate: string
  defaultType?: TransactionType
  categories: Category[]
  currency: CurrencyCode
  onClose: () => void
  onManageCategories: (type: TransactionType) => void
}

interface FormErrors {
  amount?: string
  category?: string
  date?: string
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function TransactionFormModal({
  open,
  transaction,
  defaultDate,
  defaultType = 'expense',
  categories,
  currency,
  onClose,
  onManageCategories,
}: TransactionFormModalProps) {
  const toast = useToast()
  const formId = useId()
  const [type, setType] = useState<TransactionType>(defaultType)
  const [amount, setAmount] = useState(0)
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!open) return
    const nextType = transaction?.type ?? defaultType
    const fallback = categories.find((category) => category.type === nextType)?.id ?? ''
    setType(nextType)
    setAmount(transaction?.amount ?? 0)
    setCategoryId(transaction?.categoryId ?? fallback)
    setDate(transaction?.date ?? defaultDate)
    setNote(transaction?.note ?? '')
    setErrors({})
    // Categories are intentionally not a dependency: the form must not reset mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction, defaultDate, defaultType])

  const typeCategories = categories.filter((category) => category.type === type)
  const selectedCategory = categories.find((category) => category.id === categoryId)

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType)
    const options = categories.filter((category) => category.type === nextType)
    setCategoryId(options[0]?.id ?? '')
    setErrors((current) => ({ ...current, category: undefined }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: FormErrors = {}
    if (!Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = 'Nominal harus lebih dari 0.'
    }
    const category = categories.find((item) => item.id === categoryId)
    if (!category) {
      nextErrors.category = 'Pilih kategori terlebih dahulu.'
    } else if (category.type !== type) {
      nextErrors.category = `Pilih kategori ${type === 'income' ? 'pemasukan' : 'pengeluaran'}.`
    }
    if (!date || !DATE_PATTERN.test(date)) {
      nextErrors.date = 'Tanggal wajib diisi.'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    // Guard for TypeScript: the checks above guarantee a matching category.
    if (!category) return

    try {
      if (transaction) {
        actions.updateTransaction(transaction.id, { type, categoryId, amount, date, note })
      } else {
        actions.addTransaction({ type, categoryId, amount, date, note })
      }
      toast({
        tone: 'success',
        title: transaction ? 'Transaksi diperbarui' : 'Transaksi ditambahkan',
        description: `${category.name} · ${formatMoney(amount, currency)}`,
      })
      onClose()
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menyimpan transaksi',
        description:
          error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi sebentar.',
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={transaction ? 'Ubah transaksi' : 'Tambah transaksi'}
      description={
        transaction
          ? 'Perbarui detail transaksi. Saldo bulan ini menyesuaikan otomatis.'
          : 'Catat pemasukan atau pengeluaran agar ringkasan bulan ini tetap akurat.'
      }
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form={formId} icon={Check}>
            {transaction ? 'Simpan perubahan' : 'Simpan transaksi'}
          </Button>
        </ModalFooter>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <Field label="Jenis transaksi" required>
          <SegmentedControl
            value={type}
            onChange={handleTypeChange}
            ariaLabel="Jenis transaksi"
            options={[
              { value: 'expense', label: 'Pengeluaran', icon: ArrowUpRight },
              { value: 'income', label: 'Pemasukan', icon: ArrowDownLeft },
            ]}
            className="w-full"
          />
        </Field>

        <FormGrid>
          <Field
            label="Nominal"
            htmlFor={`${formId}-amount`}
            required
            error={errors.amount}
            hint={amount > 0 ? formatMoney(amount, currency) : 'Masukkan angka tanpa titik atau koma.'}
          >
            <AmountInput
              id={`${formId}-amount`}
              currency={currency}
              value={amount}
              onValueChange={(next) => {
                setAmount(next)
                setErrors((current) => ({ ...current, amount: undefined }))
              }}
            />
          </Field>
          <Field label="Tanggal" htmlFor={`${formId}-date`} required error={errors.date}>
            <DateInput
              id={`${formId}-date`}
              value={date}
              onValueChange={(next) => {
                setDate(next)
                setErrors((current) => ({ ...current, date: undefined }))
              }}
            />
          </Field>
        </FormGrid>

        <Field
          label="Kategori"
          htmlFor={`${formId}-category`}
          required
          error={errors.category}
          hint={selectedCategory ? `Kategori ${selectedCategory.name} untuk ${type === 'income' ? 'pemasukan' : 'pengeluaran'}.` : undefined}
        >
          <Select
            id={`${formId}-category`}
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value)
              setErrors((current) => ({ ...current, category: undefined }))
            }}
            disabled={typeCategories.length === 0}
          >
            <option value="">
              {typeCategories.length > 0 ? 'Pilih kategori' : 'Belum ada kategori'}
            </option>
            {typeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>

        {typeCategories.length === 0 ? (
          <div className="surface-muted flex flex-wrap items-center justify-between gap-2 p-3">
            <p className="text-[0.6875rem] font-medium leading-relaxed text-ink-3">
              Belum ada kategori {type === 'income' ? 'pemasukan' : 'pengeluaran'}. Buat satu dulu
              sebelum mencatat transaksi.
            </p>
            <Button variant="soft" size="sm" icon={Tags} onClick={() => onManageCategories(type)}>
              Kelola kategori
            </Button>
          </div>
        ) : null}

        <Field
          label="Catatan"
          htmlFor={`${formId}-note`}
          optional
          hint="Catatan membantu kamu mengingat detail transaksi ini."
        >
          <TextInput
            id={`${formId}-note`}
            value={note}
            maxLength={160}
            placeholder="Contoh: Makan siang tim"
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
      </form>
    </Modal>
  )
}
