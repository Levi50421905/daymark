import { useEffect, useId, useState, type FormEvent } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AmountInput, DateInput, Field, FormGrid, TextInput } from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatMoney } from '@/lib/format'
import { todayISO } from '@/lib/dates'
import { actions } from '@/lib/store'
import type { CurrencyCode, SavingsGoal } from '@/types/domain'

interface ContributionFormModalProps {
  open: boolean
  goal: SavingsGoal | null
  /** Total already saved for this goal, used for the "target tercapai" hint. */
  saved: number
  currency: CurrencyCode
  onClose: () => void
}

interface ContributionErrors {
  amount?: string
  date?: string
}

export function ContributionFormModal({
  open,
  goal,
  saved,
  currency,
  onClose,
}: ContributionFormModalProps) {
  const toast = useToast()
  const formId = useId()
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<ContributionErrors>({})

  useEffect(() => {
    if (!open) return
    setAmount(0)
    setDate(todayISO())
    setNote('')
    setErrors({})
  }, [open, goal])

  const reachesTarget = Boolean(goal) && amount > 0 && saved + amount >= (goal?.targetAmount ?? 0)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!goal) return
    const nextErrors: ContributionErrors = {}
    if (!Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = 'Nominal setoran harus lebih dari 0.'
    }
    if (!date) nextErrors.date = 'Tanggal setoran wajib diisi.'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    try {
      actions.addContribution({ goalId: goal.id, amount, date, note: note.trim() })
      toast({
        tone: 'success',
        title: 'Dana ditambahkan',
        description: `${formatMoney(amount, currency)} untuk ${goal.name}.`,
      })
      onClose()
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menambah dana',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.',
      })
    }
  }

  return (
    <Modal
      open={open && Boolean(goal)}
      onClose={onClose}
      size="md"
      title="Tambah dana tabungan"
      description={
        goal ? `Catat setoran untuk target ${goal.name}. Setoran tidak membuat transaksi baru.` : ''
      }
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form={formId} icon={Check}>
            Simpan setoran
          </Button>
        </ModalFooter>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <FormGrid>
          <Field
            label="Nominal setoran"
            htmlFor={`${formId}-amount`}
            required
            error={errors.amount}
            hint={
              goal
                ? `Terkumpul ${formatMoney(saved, currency)} dari ${formatMoney(
                    goal.targetAmount,
                    currency,
                  )}.`
                : undefined
            }
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

        {reachesTarget ? (
          <p className="flex items-start gap-2 rounded-xl border border-mint/25 bg-mint/10 p-3 text-[0.6875rem] font-semibold leading-relaxed text-emerald-600 dark:text-mint">
            <Sparkles size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            Dengan setoran ini targetmu tercapai. Kerja bagus!
          </p>
        ) : null}

        <Field label="Catatan" htmlFor={`${formId}-note`} optional>
          <TextInput
            id={`${formId}-note`}
            value={note}
            maxLength={120}
            placeholder="Contoh: Sisihan dari gaji bulan ini"
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
      </form>
    </Modal>
  )
}
