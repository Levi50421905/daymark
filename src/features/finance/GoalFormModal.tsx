import { useEffect, useId, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  AmountInput,
  DateInput,
  Field,
  FormGrid,
  Textarea,
  TextInput,
} from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { GOAL_COLORS, GOAL_ICON_CHOICES } from '@/lib/constants'
import { formatMoney } from '@/lib/format'
import { actions } from '@/lib/store'
import type { CurrencyCode, SavingsGoal } from '@/types/domain'
import { ColorPicker, IconPicker } from './Pickers'

interface GoalFormModalProps {
  open: boolean
  /** Null creates a new savings goal. */
  goal: SavingsGoal | null
  currency: CurrencyCode
  onClose: () => void
}

interface GoalFormErrors {
  name?: string
  targetAmount?: string
}

export function GoalFormModal({ open, goal, currency, onClose }: GoalFormModalProps) {
  const toast = useToast()
  const formId = useId()
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState(0)
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState(GOAL_COLORS[0])
  const [icon, setIcon] = useState(GOAL_ICON_CHOICES[0])
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<GoalFormErrors>({})

  useEffect(() => {
    if (!open) return
    setName(goal?.name ?? '')
    setTargetAmount(goal?.targetAmount ?? 0)
    setDeadline(goal?.deadline ?? '')
    setColor(goal?.color ?? GOAL_COLORS[0])
    setIcon(goal?.icon ?? GOAL_ICON_CHOICES[0])
    setNote(goal?.note ?? '')
    setErrors({})
  }, [open, goal])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: GoalFormErrors = {}
    const trimmedName = name.trim()
    if (!trimmedName) nextErrors.name = 'Nama target wajib diisi.'
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      nextErrors.targetAmount = 'Target tabungan harus lebih dari 0.'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const payload = {
      name: trimmedName,
      targetAmount,
      deadline: deadline || null,
      color,
      icon,
      note: note.trim(),
    }

    try {
      if (goal) {
        actions.updateGoal(goal.id, payload)
        toast({ tone: 'success', title: 'Target diperbarui', description: trimmedName })
      } else {
        actions.addGoal(payload)
        toast({
          tone: 'success',
          title: 'Target dibuat',
          description: `${trimmedName} · ${formatMoney(targetAmount, currency)}`,
        })
      }
      onClose()
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menyimpan target',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.',
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={goal ? 'Ubah target tabungan' : 'Target tabungan baru'}
      description="Tentukan tujuan, nominal, dan warna yang membuatmu semangat menabung."
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form={formId} icon={Check}>
            {goal ? 'Simpan perubahan' : 'Buat target'}
          </Button>
        </ModalFooter>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <FormGrid>
          <Field label="Nama target" htmlFor={`${formId}-name`} required error={errors.name}>
            <TextInput
              id={`${formId}-name`}
              value={name}
              maxLength={60}
              placeholder="Contoh: Dana darurat"
              onChange={(event) => {
                setName(event.target.value)
                setErrors((current) => ({ ...current, name: undefined }))
              }}
            />
          </Field>
          <Field
            label="Target nominal"
            htmlFor={`${formId}-target`}
            required
            error={errors.targetAmount}
            hint={
              targetAmount > 0 ? formatMoney(targetAmount, currency) : 'Nominal total yang ingin dicapai.'
            }
          >
            <AmountInput
              id={`${formId}-target`}
              currency={currency}
              value={targetAmount}
              onValueChange={(next) => {
                setTargetAmount(next)
                setErrors((current) => ({ ...current, targetAmount: undefined }))
              }}
            />
          </Field>
        </FormGrid>

        <Field
          label="Tenggat"
          htmlFor={`${formId}-deadline`}
          optional
          hint="Kosongkan jika target ini belum punya batas waktu."
        >
          <DateInput
            id={`${formId}-deadline`}
            value={deadline}
            onValueChange={setDeadline}
          />
        </Field>

        <Field label="Warna target" hint="Warna dipakai pada cincin progres dan grafik tabungan.">
          <ColorPicker colors={GOAL_COLORS} value={color} onChange={setColor} />
        </Field>

        <Field label="Ikon target">
          <IconPicker
            icons={GOAL_ICON_CHOICES}
            value={icon}
            labelPrefix="ikon target"
            onChange={setIcon}
          />
        </Field>

        <Field label="Catatan" htmlFor={`${formId}-note`} optional>
          <Textarea
            id={`${formId}-note`}
            rows={2}
            value={note}
            maxLength={300}
            placeholder="Kenapa target ini penting untukmu?"
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
      </form>
    </Modal>
  )
}
