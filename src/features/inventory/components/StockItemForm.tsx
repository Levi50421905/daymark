import { useState, type FormEvent } from 'react'
import { Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DateInput, Field, FormGrid, Select, TextInput, Textarea } from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { addDaysISO, todayISO } from '@/lib/dates'
import { actions, type InventoryInput } from '@/lib/store'
import { INVENTORY_CATEGORIES, INVENTORY_LOCATIONS, INVENTORY_UNITS } from '@/lib/constants'
import type { InventoryCategory, InventoryItem } from '@/types/domain'
import { normaliseUnit } from '../lib/stock'

interface StockItemFormProps {
  open: boolean
  item: InventoryItem | null
  onClose: () => void
}

interface StockDraft {
  name: string
  category: InventoryCategory
  quantity: string
  unit: string
  minStock: string
  purchasedAt: string
  expiresAt: string
  location: string
  note: string
}

const FORM_ID = 'inventory-item-form'

function createDraft(item: InventoryItem | null): StockDraft {
  if (!item) {
    return {
      name: '',
      category: 'ingredients',
      quantity: '',
      unit: 'pcs',
      minStock: '',
      purchasedAt: todayISO(),
      expiresAt: '',
      location: '',
      note: '',
    }
  }
  return {
    name: item.name,
    category: item.category,
    quantity: String(item.quantity),
    unit: item.unit,
    minStock: String(item.minStock),
    purchasedAt: item.purchasedAt,
    expiresAt: item.expiresAt ?? '',
    location: item.location,
    note: item.note,
  }
}

function parseDraftNumber(value: string): number {
  const normalised = value.trim().replace(',', '.')
  if (!normalised) return 0
  const parsed = Number(normalised)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN
}

export function StockItemForm({ open, item, onClose }: StockItemFormProps) {
  const isEdit = item !== null
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={isEdit ? 'Ubah barang' : 'Tambah barang'}
      description={
        isEdit
          ? 'Perbarui jumlah, stok minimum, atau tanggal kedaluwarsa barang ini.'
          : 'Catat barang baru agar jumlah dan masa simpannya terpantau.'
      }
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form={FORM_ID} icon={isEdit ? Check : Plus}>
            {isEdit ? 'Simpan perubahan' : 'Tambah barang'}
          </Button>
        </ModalFooter>
      }
    >
      <StockItemFields item={item} onClose={onClose} />
    </Modal>
  )
}

function StockItemFields({ item, onClose }: { item: InventoryItem | null; onClose: () => void }) {
  const toast = useToast()
  const [draft, setDraft] = useState<StockDraft>(() => createDraft(item))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = <K extends keyof StockDraft>(key: K, value: StockDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = draft.name.trim()
    const quantity = parseDraftNumber(draft.quantity)
    const minStock = parseDraftNumber(draft.minStock)
    const nextErrors: Record<string, string> = {}

    if (!name) nextErrors.name = 'Nama barang wajib diisi.'
    if (!Number.isFinite(quantity)) nextErrors.quantity = 'Jumlah harus berupa angka 0 atau lebih.'
    if (!Number.isFinite(minStock)) nextErrors.minStock = 'Stok minimum harus angka 0 atau lebih.'
    if (!draft.purchasedAt) nextErrors.purchasedAt = 'Tanggal beli wajib diisi.'
    if (draft.expiresAt && draft.purchasedAt && draft.expiresAt < draft.purchasedAt) {
      nextErrors.expiresAt = 'Tanggal kedaluwarsa tidak boleh sebelum tanggal beli.'
    }
    if (!draft.unit.trim()) nextErrors.unit = 'Satuan wajib diisi.'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const payload: InventoryInput = {
      name,
      category: draft.category,
      quantity,
      unit: normaliseUnit(draft.unit),
      minStock,
      purchasedAt: draft.purchasedAt,
      expiresAt: draft.expiresAt || null,
      location: draft.location.trim(),
      note: draft.note.trim(),
    }

    try {
      if (item) {
        actions.updateInventoryItem(item.id, payload)
        toast({
          tone: 'success',
          title: 'Barang diperbarui',
          description: `${name} tersimpan di persediaan.`,
        })
      } else {
        actions.addInventoryItem(payload)
        toast({
          tone: 'success',
          title: 'Barang ditambahkan',
          description: `${name} masuk ke persediaan.`,
        })
      }
      onClose()
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menyimpan barang',
        description: error instanceof Error ? error.message : 'Coba lagi sebentar lagi.',
      })
    }
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4 pb-1" noValidate>
      <Field label="Nama barang" htmlFor="inventory-name" required error={errors.name}>
        <TextInput
          id="inventory-name"
          value={draft.name}
          onChange={(event) => update('name', event.target.value)}
          placeholder="cth. Dada ayam fillet"
          autoComplete="off"
        />
      </Field>

      <FormGrid>
        <Field label="Kategori" htmlFor="inventory-category" required>
          <Select
            id="inventory-category"
            value={draft.category}
            onChange={(event) => update('category', event.target.value as InventoryCategory)}
          >
            {INVENTORY_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Lokasi penyimpanan"
          htmlFor="inventory-location"
          hint="Contoh: Freezer, Kulkas, Rak Dapur."
        >
          <TextInput
            id="inventory-location"
            list="inventory-location-options"
            value={draft.location}
            onChange={(event) => update('location', event.target.value)}
            placeholder="cth. Freezer"
            autoComplete="off"
          />
        </Field>

        <Field
          label="Jumlah"
          htmlFor="inventory-quantity"
          hint="Angka boleh desimal, misalnya 0,5 kg."
          error={errors.quantity}
        >
          <div className="flex gap-2">
            <TextInput
              id="inventory-quantity"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={draft.quantity}
              onChange={(event) => update('quantity', event.target.value)}
              placeholder="0"
              className="flex-1"
            />
            <div className="w-24 shrink-0">
              <TextInput
                aria-label="Satuan"
                list="inventory-unit-options"
                value={draft.unit}
                onChange={(event) => update('unit', event.target.value)}
                placeholder="pcs"
                autoComplete="off"
              />
            </div>
          </div>
          {errors.unit ? (
            <p className="mt-1.5 text-[0.6875rem] font-medium text-danger" role="alert">
              {errors.unit}
            </p>
          ) : null}
        </Field>

        <Field
          label="Stok minimum"
          htmlFor="inventory-min-stock"
          hint="Batas peringatan saat stok mulai menipis."
          error={errors.minStock}
        >
          <TextInput
            id="inventory-min-stock"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={draft.minStock}
            onChange={(event) => update('minStock', event.target.value)}
            placeholder="0"
          />
        </Field>

        <Field label="Tanggal beli" htmlFor="inventory-purchased" required error={errors.purchasedAt}>
          <DateInput
            id="inventory-purchased"
            value={draft.purchasedAt}
            onValueChange={(value) => update('purchasedAt', value)}
          />
        </Field>

        <Field
          label="Tanggal kedaluwarsa"
          htmlFor="inventory-expires"
          optional
          hint="Kosongkan jika barang tidak punya tanggal kedaluwarsa."
          error={errors.expiresAt}
        >
          <DateInput
            id="inventory-expires"
            value={draft.expiresAt}
            onValueChange={(value) => update('expiresAt', value)}
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[
              { label: '1 minggu', days: 7 },
              { label: '1 bulan', days: 30 },
              { label: '3 bulan', days: 90 },
            ].map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() =>
                  update('expiresAt', addDaysISO(draft.purchasedAt || todayISO(), preset.days))
                }
                className="focus-ring rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[10px] font-semibold text-ink-3 transition-colors hover:border-brand/40 hover:text-brand"
              >
                +{preset.label}
              </button>
            ))}
            {draft.expiresAt ? (
              <button
                type="button"
                onClick={() => update('expiresAt', '')}
                className="focus-ring rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[10px] font-semibold text-ink-3 transition-colors hover:border-danger/40 hover:text-danger"
              >
                Kosongkan
              </button>
            ) : null}
          </div>
        </Field>
      </FormGrid>

      <Field label="Catatan" htmlFor="inventory-note" optional>
        <Textarea
          id="inventory-note"
          rows={2}
          value={draft.note}
          onChange={(event) => update('note', event.target.value)}
          placeholder="cth. Sudah dipotong per porsi, atau untuk masak akhir pekan."
        />
      </Field>

      <datalist id="inventory-unit-options">
        {INVENTORY_UNITS.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
      <datalist id="inventory-location-options">
        {INVENTORY_LOCATIONS.map((location) => (
          <option key={location} value={location} />
        ))}
      </datalist>
    </form>
  )
}
