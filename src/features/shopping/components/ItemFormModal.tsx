import { useState, type FormEvent } from 'react'
import { Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AmountInput, Field, FormGrid, Select, Textarea, TextInput } from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Progress'
import { useToast } from '@/components/ui/Toast'
import { SHOPPING_CATEGORIES, SHOPPING_UNITS } from '@/lib/constants'
import { actions } from '@/lib/store'
import { errorMessage } from '@/features/shopping/lib/shopping-helpers'
import type { CurrencyCode, ShoppingCategory, ShoppingItem } from '@/types/domain'

interface ItemFormModalProps {
  open: boolean
  listId: string
  listName: string
  /** `null` opens the create form, an item opens the edit form. */
  item: ShoppingItem | null
  currency: CurrencyCode
  onClose: () => void
}

interface ItemErrors {
  name?: string
  qty?: string
  estimatedPrice?: string
}

const FORM_ID = 'shopping-item-form'
const DEFAULT_CATEGORY: ShoppingCategory = SHOPPING_CATEGORIES[0].value
const DEFAULT_UNIT = SHOPPING_UNITS[0]

export function ItemFormModal({ open, listId, listName, item, currency, onClose }: ItemFormModalProps) {
  const toast = useToast()
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<ShoppingCategory>(item?.category ?? DEFAULT_CATEGORY)
  const [qty, setQty] = useState(item ? String(item.qty) : '1')
  const [unit, setUnit] = useState(item?.unit ?? DEFAULT_UNIT)
  const [estimatedPrice, setEstimatedPrice] = useState(item?.estimatedPrice ?? 0)
  const [actualPrice, setActualPrice] = useState(item?.actualPrice ?? 0)
  const [purchased, setPurchased] = useState(item?.purchased ?? false)
  const [note, setNote] = useState(item?.note ?? '')
  const [errors, setErrors] = useState<ItemErrors>({})
  const isEdit = item !== null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const parsedQty = Number(qty.replace(',', '.'))
    const nextErrors: ItemErrors = {}
    if (!trimmedName) nextErrors.name = 'Nama barang wajib diisi.'
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) nextErrors.qty = 'Jumlah harus lebih dari 0.'
    if (!Number.isFinite(estimatedPrice) || estimatedPrice <= 0) {
      nextErrors.estimatedPrice = 'Harga estimasi harus lebih dari 0.'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const payload = {
      name: trimmedName,
      category,
      qty: parsedQty,
      unit,
      estimatedPrice,
      // Keep a typed actual price even while unpurchased so it is not silently
      // dropped; totals only count actual prices for purchased items.
      actualPrice: actualPrice > 0 ? actualPrice : purchased ? estimatedPrice : null,
      purchased,
      note: note.trim(),
    }

    try {
      if (item) {
        actions.updateShoppingItem(listId, item.id, payload)
        toast({ tone: 'success', title: 'Barang diperbarui', description: `“${payload.name}” sudah disimpan.` })
      } else {
        actions.addShoppingItem(listId, payload)
        toast({
          tone: 'success',
          title: 'Barang ditambahkan',
          description: `“${payload.name}” masuk ke daftar ${listName}.`,
        })
      }
      onClose()
    } catch (error) {
      toast({ tone: 'error', title: 'Gagal menyimpan barang', description: errorMessage(error) })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Ubah barang' : 'Tambah barang'}
      description={`Barang untuk daftar “${listName}”.`}
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form={FORM_ID} icon={isEdit ? Check : Plus}>
            {isEdit ? 'Simpan perubahan' : 'Tambahkan'}
          </Button>
        </ModalFooter>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Nama barang" htmlFor="shopping-item-name" required error={errors.name} hint="Tulis nama yang mudah dikenali saat berbelanja.">
          <TextInput
            id="shopping-item-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (errors.name) setErrors((current) => ({ ...current, name: undefined }))
            }}
            placeholder="Contoh: Telur ayam"
            autoComplete="off"
            maxLength={120}
          />
        </Field>

        <FormGrid>
          <Field label="Kategori" htmlFor="shopping-item-category" required>
            <Select
              id="shopping-item-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as ShoppingCategory)}
            >
              {SHOPPING_CATEGORIES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.value}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Jumlah & satuan" htmlFor="shopping-item-qty" required error={errors.qty}>
            <div className="flex gap-2">
              <TextInput
                id="shopping-item-qty"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={qty}
                onChange={(event) => {
                  setQty(event.target.value)
                  if (errors.qty) setErrors((current) => ({ ...current, qty: undefined }))
                }}
                className="number w-24 shrink-0 text-right font-semibold"
              />
              <Select
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                wrapperClassName="min-w-0 flex-1"
                aria-label="Satuan barang"
              >
                {SHOPPING_UNITS.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </Select>
            </div>
          </Field>

          <Field
            label="Harga estimasi"
            htmlFor="shopping-item-estimated-price"
            required
            error={errors.estimatedPrice}
            hint="Harga per satuan. Dikalikan jumlah saat menghitung total."
          >
            <AmountInput
              id="shopping-item-estimated-price"
              value={estimatedPrice}
              onValueChange={(value) => {
                setEstimatedPrice(value)
                if (errors.estimatedPrice) setErrors((current) => ({ ...current, estimatedPrice: undefined }))
              }}
              currency={currency}
            />
          </Field>

          <Field
            label="Harga aktual"
            htmlFor="shopping-item-actual-price"
            optional
            hint="Isi setelah membeli. Dibagi per satuan, sama seperti estimasi."
          >
            <AmountInput
              id="shopping-item-actual-price"
              value={actualPrice}
              onValueChange={setActualPrice}
              currency={currency}
            />
          </Field>
        </FormGrid>

        <div className="surface-muted px-3.5 py-3">
          <Switch
            checked={purchased}
            onChange={setPurchased}
            label="Sudah dibeli"
            description="Tandai jika barang ini sudah masuk keranjang."
          />
        </div>

        <Field label="Catatan" htmlFor="shopping-item-note" optional hint="Misalnya merek, ukuran, atau catatan toko.">
          <Textarea
            id="shopping-item-note"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Contoh: Isi 10 butir."
            maxLength={500}
          />
        </Field>
      </form>
    </Modal>
  )
}
