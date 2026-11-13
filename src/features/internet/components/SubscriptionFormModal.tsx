import { useId, useState, type FormEvent } from 'react'
import { Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  AmountInput,
  DateInput,
  Field,
  FormGrid,
  Select,
  Textarea,
  TextInput,
} from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Progress'
import { useToast } from '@/components/ui/Toast'
import { SUBSCRIPTION_CYCLE_META } from '@/lib/constants'
import { addDaysISO, todayISO } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { actions } from '@/lib/store'
import type { Category, CurrencyCode, Subscription, SubscriptionCycle } from '@/types/domain'
import { cycleShort, errorText } from '../helpers'

interface SubscriptionFormModalProps {
  open: boolean
  subscription: Subscription | null
  categories: Category[]
  currency: CurrencyCode
  onClose: () => void
}

interface SubscriptionFormErrors {
  name?: string
  amount?: string
  date?: string
}

const CYCLES = Object.keys(SUBSCRIPTION_CYCLE_META) as SubscriptionCycle[]

export function SubscriptionFormModal({
  open,
  subscription,
  categories,
  currency,
  onClose,
}: SubscriptionFormModalProps) {
  const formId = useId().replace(/:/g, '')
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={subscription ? 'Edit langganan' : 'Tambah langganan'}
      description="Catat tagihan rutin supaya biaya bulananmu tetap terlihat."
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            form={formId}
            icon={subscription ? Check : Plus}
            className="max-sm:min-h-11"
          >
            {subscription ? 'Simpan perubahan' : 'Tambah langganan'}
          </Button>
        </ModalFooter>
      }
    >
      <SubscriptionFormFields
        key={subscription?.id ?? 'new-subscription'}
        formId={formId}
        subscription={subscription}
        categories={categories}
        currency={currency}
        onClose={onClose}
      />
    </Modal>
  )
}

function SubscriptionFormFields({
  formId,
  subscription,
  categories,
  currency,
  onClose,
}: {
  formId: string
  subscription: Subscription | null
  categories: Category[]
  currency: CurrencyCode
  onClose: () => void
}) {
  const toast = useToast()
  const expenseCategories = categories.filter((category) => category.type === 'expense')
  const initialCategoryId =
    expenseCategories.find((category) => category.id === subscription?.categoryId)?.id ??
    expenseCategories.find((category) => category.name.toLowerCase() === 'internet')?.id ??
    ''
  const [name, setName] = useState(subscription?.name ?? '')
  const [amount, setAmount] = useState(subscription?.amount ?? 0)
  const [cycle, setCycle] = useState<SubscriptionCycle>(subscription?.cycle ?? 'monthly')
  const [nextPaymentDate, setNextPaymentDate] = useState(
    subscription?.nextPaymentDate ?? addDaysISO(todayISO(), 7),
  )
  const [active, setActive] = useState(subscription?.active ?? true)
  const [categoryId, setCategoryId] = useState(initialCategoryId)
  const [note, setNote] = useState(subscription?.note ?? '')
  const [errors, setErrors] = useState<SubscriptionFormErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    const nextErrors: SubscriptionFormErrors = {}
    if (!trimmedName) nextErrors.name = 'Nama langganan wajib diisi.'
    if (!Number.isFinite(amount) || amount <= 0) nextErrors.amount = 'Nominal harus lebih dari 0.'
    if (!nextPaymentDate) nextErrors.date = 'Tanggal tagihan berikutnya wajib diisi.'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const payload = {
      name: trimmedName,
      amount,
      cycle,
      nextPaymentDate,
      active,
      categoryId: categoryId || null,
      note: note.trim(),
    }

    try {
      if (subscription) {
        actions.updateSubscription(subscription.id, payload)
        toast({
          tone: 'success',
          title: 'Langganan diperbarui',
          description: `${trimmedName} · ${formatMoney(amount, currency)} per ${cycleShort(cycle)}.`,
        })
      } else {
        actions.addSubscription(payload)
        toast({
          tone: 'success',
          title: 'Langganan ditambahkan',
          description: `${trimmedName} · ${formatMoney(amount, currency)} per ${cycleShort(cycle)}.`,
        })
      }
      onClose()
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menyimpan langganan',
        description: errorText(error),
      })
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nama langganan" htmlFor={`${formId}-name`} required error={errors.name}>
        <TextInput
          id={`${formId}-name`}
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (errors.name) setErrors((current) => ({ ...current, name: undefined }))
          }}
          placeholder="Mis. Netflix, Spotify, iCloud+"
          autoComplete="off"
          maxLength={40}
        />
      </Field>

      <FormGrid>
        <Field label="Nominal" htmlFor={`${formId}-amount`} required error={errors.amount}>
          <AmountInput
            id={`${formId}-amount`}
            currency={currency}
            value={amount}
            onValueChange={(next) => {
              setAmount(next)
              if (errors.amount) setErrors((current) => ({ ...current, amount: undefined }))
            }}
          />
        </Field>
        <Field label="Siklus pembayaran" htmlFor={`${formId}-cycle`} required>
          <Select
            id={`${formId}-cycle`}
            value={cycle}
            onChange={(event) => setCycle(event.target.value as SubscriptionCycle)}
          >
            {CYCLES.map((value) => (
              <option key={value} value={value}>
                {SUBSCRIPTION_CYCLE_META[value].label}
              </option>
            ))}
          </Select>
        </Field>
      </FormGrid>

      <FormGrid>
        <Field
          label="Tagihan berikutnya"
          htmlFor={`${formId}-next`}
          required
          error={errors.date}
          hint="Tanggal otomatis maju setelah ditandai dibayar."
        >
          <DateInput
            id={`${formId}-next`}
            value={nextPaymentDate}
            onValueChange={(next) => {
              setNextPaymentDate(next)
              if (errors.date) setErrors((current) => ({ ...current, date: undefined }))
            }}
          />
        </Field>
        <Field
          label="Kategori pengeluaran"
          htmlFor={`${formId}-category`}
          optional
          hint="Dipakai saat pembayaran dicatat ke Finance."
        >
          <Select
            id={`${formId}-category`}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Tanpa kategori</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
      </FormGrid>

      <div className="surface-muted p-3">
        <Switch
          checked={active}
          onChange={setActive}
          label="Langganan aktif"
          description="Matikan untuk menjeda tagihan tanpa menghapus data."
        />
      </div>

      <Field label="Catatan" htmlFor={`${formId}-note`} optional>
        <Textarea
          id={`${formId}-note`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Mis. paket Standar dibagi dua orang."
          rows={2}
          maxLength={160}
        />
      </Field>
    </form>
  )
}
