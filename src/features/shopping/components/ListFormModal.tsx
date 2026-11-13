import { useState, type FormEvent } from 'react'
import { Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Textarea, TextInput, AmountInput } from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { actions } from '@/lib/store'
import { errorMessage } from '@/features/shopping/lib/shopping-helpers'
import type { CurrencyCode, ShoppingList } from '@/types/domain'

interface ListFormModalProps {
  open: boolean
  /** `null` opens the create form, a list opens the edit form. */
  list: ShoppingList | null
  currency: CurrencyCode
  onClose: () => void
  onCreated?: (list: ShoppingList) => void
}

const FORM_ID = 'shopping-list-form'
const NAME_ID = 'shopping-list-name'
const NOTE_ID = 'shopping-list-note'
const BUDGET_ID = 'shopping-list-budget'

export function ListFormModal({ open, list, currency, onClose, onCreated }: ListFormModalProps) {
  const toast = useToast()
  const [name, setName] = useState(list?.name ?? '')
  const [note, setNote] = useState(list?.note ?? '')
  const [budget, setBudget] = useState(list?.budget ?? 0)
  const [nameError, setNameError] = useState<string | null>(null)
  const isEdit = list !== null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError('Nama daftar wajib diisi.')
      return
    }
    const payload = { name: trimmedName, note: note.trim(), budget: budget > 0 ? budget : null }
    try {
      if (list) {
        actions.updateShoppingList(list.id, payload)
        toast({ tone: 'success', title: 'Daftar diperbarui', description: `“${payload.name}” sudah disimpan.` })
        onClose()
      } else {
        const created = actions.addShoppingList(payload)
        toast({
          tone: 'success',
          title: 'Daftar belanja dibuat',
          description: 'Tambahkan barang pertama untuk daftar ini.',
        })
        onClose()
        onCreated?.(created)
      }
    } catch (error) {
      toast({ tone: 'error', title: 'Gagal menyimpan daftar', description: errorMessage(error) })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Ubah daftar belanja' : 'Daftar belanja baru'}
      description={
        isEdit
          ? 'Perbarui nama, catatan, atau anggaran daftar ini.'
          : 'Beri nama daftar, tambahkan catatan, dan tetapkan anggaran bila perlu.'
      }
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form={FORM_ID} icon={isEdit ? Save : Plus}>
            {isEdit ? 'Simpan perubahan' : 'Buat daftar'}
          </Button>
        </ModalFooter>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Nama daftar" htmlFor={NAME_ID} required error={nameError ?? undefined}>
          <TextInput
            id={NAME_ID}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (nameError) setNameError(null)
            }}
            placeholder="Contoh: Belanja mingguan"
            autoComplete="off"
            maxLength={120}
          />
        </Field>

        <Field label="Catatan" htmlFor={NOTE_ID} optional hint="Misalnya untuk menu berapa hari atau toko tujuan.">
          <Textarea
            id={NOTE_ID}
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Contoh: Untuk menu empat hari ke depan."
            maxLength={500}
          />
        </Field>

        <Field
          label="Anggaran"
          htmlFor={BUDGET_ID}
          optional
          hint="Biarkan kosong jika tidak ingin memakai anggaran. Anggaran membantu memantau sisa belanja."
        >
          <AmountInput
            id={BUDGET_ID}
            value={budget}
            onValueChange={setBudget}
            currency={currency}
            placeholder="0"
          />
        </Field>
      </form>
    </Modal>
  )
}
