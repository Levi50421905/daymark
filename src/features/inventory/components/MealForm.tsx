import { useState, type FormEvent } from 'react'
import {
  Check,
  CircleAlert,
  MoonStar,
  Plus,
  Sun,
  Sunrise,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import {
  AmountInput,
  DateInput,
  Field,
  FormGrid,
  TextInput,
  Textarea,
} from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { MEAL_META } from '@/lib/constants'
import { formatDateMedium, todayISO } from '@/lib/dates'
import { formatQuantity } from '@/lib/format'
import { actions, type MealInput } from '@/lib/store'
import { uid } from '@/lib/utils'
import type { CurrencyCode, InventoryItem, MealPlan, MealType } from '@/types/domain'
import { MEAL_ORDER, MEAL_UNITS } from '../lib/meals'
import { sortInventoryItems } from '../lib/stock'

export interface MealFormIngredientInput {
  name: string
  quantity: number | null
  unit: string
}

export interface MealFormInitial {
  meal: MealPlan | null
  date: string
  mealType: MealType
  ingredients?: MealFormIngredientInput[]
}

interface MealFormProps {
  open: boolean
  initial: MealFormInitial | null
  inventory: InventoryItem[]
  mealPlans: MealPlan[]
  currency: CurrencyCode
  onClose: () => void
  onRequestDelete: (meal: MealPlan) => void
}

interface IngredientRowDraft {
  key: string
  name: string
  quantity: string
  unit: string
}

interface MealDraft {
  date: string
  mealType: MealType
  title: string
  estimatedCost: number
  note: string
  ingredients: IngredientRowDraft[]
}

const FORM_ID = 'meal-plan-form'

const MEAL_ICONS: Record<MealType, LucideIcon> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: MoonStar,
}

const MEAL_OPTIONS: Array<SegmentedOption<MealType>> = MEAL_ORDER.map((meal) => ({
  value: meal,
  label: MEAL_META[meal].label,
  icon: MEAL_ICONS[meal],
}))

function emptyIngredientRow(): IngredientRowDraft {
  return { key: uid('row'), name: '', quantity: '', unit: '' }
}

function createDraft(initial: MealFormInitial | null): MealDraft {
  if (!initial) {
    return {
      date: todayISO(),
      mealType: 'lunch',
      title: '',
      estimatedCost: 0,
      note: '',
      ingredients: [emptyIngredientRow()],
    }
  }
  const source = initial.meal
  if (source) {
    return {
      date: source.date,
      mealType: source.meal,
      title: source.title,
      estimatedCost: source.estimatedCost,
      note: source.note,
      ingredients:
        source.ingredients.length > 0
          ? source.ingredients.map((ingredient) => ({
              key: uid('row'),
              name: ingredient.name,
              quantity: ingredient.quantity === null ? '' : String(ingredient.quantity),
              unit: ingredient.unit,
            }))
          : [emptyIngredientRow()],
    }
  }
  return {
    date: initial.date,
    mealType: initial.mealType,
    title: '',
    estimatedCost: 0,
    note: '',
    ingredients:
      initial.ingredients && initial.ingredients.length > 0
        ? initial.ingredients.map((ingredient) => ({
            key: uid('row'),
            name: ingredient.name,
            quantity: ingredient.quantity === null ? '' : String(ingredient.quantity),
            unit: ingredient.unit,
          }))
        : [emptyIngredientRow()],
  }
}

function parseIngredientQuantity(value: string): number | null {
  const normalised = value.trim().replace(',', '.')
  if (!normalised) return null
  const parsed = Number(normalised)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.round(parsed * 100) / 100
}

function quantityError(value: string): boolean {
  const normalised = value.trim().replace(',', '.')
  if (!normalised) return false
  const parsed = Number(normalised)
  return !Number.isFinite(parsed) || parsed <= 0
}

export function MealForm({
  open,
  initial,
  inventory,
  mealPlans,
  currency,
  onClose,
  onRequestDelete,
}: MealFormProps) {
  const editingMeal = initial?.meal ?? null
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editingMeal ? 'Ubah menu' : 'Tambah menu'}
      description={
        editingMeal
          ? 'Perbarui detail menu, bahan, atau perkiraan biayanya.'
          : 'Isi satu waktu makan. Kamu bisa menambah bahan dari stok dapur.'
      }
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {editingMeal ? (
            <Button variant="danger" icon={Trash2} onClick={() => onRequestDelete(editingMeal)}>
              Hapus menu
            </Button>
          ) : null}
          <ModalFooter className="sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" form={FORM_ID} icon={editingMeal ? Check : Plus}>
              {editingMeal ? 'Simpan perubahan' : 'Tambah menu'}
            </Button>
          </ModalFooter>
        </div>
      }
    >
      <MealFormFields
        initial={initial}
        inventory={inventory}
        mealPlans={mealPlans}
        currency={currency}
        onClose={onClose}
      />
    </Modal>
  )
}

function MealFormFields({
  initial,
  inventory,
  mealPlans,
  currency,
  onClose,
}: {
  initial: MealFormInitial | null
  inventory: InventoryItem[]
  mealPlans: MealPlan[]
  currency: CurrencyCode
  onClose: () => void
}) {
  const toast = useToast()
  const [draft, setDraft] = useState<MealDraft>(() => createDraft(initial))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const inventorySuggestions = sortInventoryItems(
    inventory.filter((item) => item.quantity > 0),
  ).slice(0, 6)

  const slotConflict = draft.date
    ? mealPlans.find(
        (meal) =>
          meal.id !== initial?.meal?.id &&
          meal.date === draft.date &&
          meal.meal === draft.mealType,
      )
    : undefined

  const update = <K extends keyof MealDraft>(key: K, value: MealDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key] && !current.slot) return current
      const next = { ...current }
      delete next[key]
      delete next.slot
      return next
    })
  }

  const updateIngredient = (key: string, patch: Partial<Omit<IngredientRowDraft, 'key'>>) => {
    const nextName = patch.name
    setDraft((current) => ({
      ...current,
      ingredients: current.ingredients.map((row) => {
        if (row.key !== key) return row
        const next = { ...row, ...patch }
        if (nextName !== undefined && !row.unit.trim()) {
          const match = inventory.find(
            (item) => item.name.trim().toLowerCase() === nextName.trim().toLowerCase(),
          )
          if (match) next.unit = match.unit
        }
        return next
      }),
    }))
    setErrors((current) => {
      if (!current.ingredients) return current
      const next = { ...current }
      delete next.ingredients
      return next
    })
  }

  const addIngredientRow = () => {
    setDraft((current) => ({
      ...current,
      ingredients: [...current.ingredients, emptyIngredientRow()],
    }))
  }

  const removeIngredientRow = (key: string) => {
    setDraft((current) => {
      const remaining = current.ingredients.filter((row) => row.key !== key)
      return {
        ...current,
        ingredients: remaining.length > 0 ? remaining : [emptyIngredientRow()],
      }
    })
  }

  const addIngredientFromInventory = (item: InventoryItem) => {
    if (
      draft.ingredients.some(
        (row) => row.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
      )
    ) {
      toast({
        tone: 'info',
        title: 'Bahan sudah ada',
        description: `${item.name} sudah masuk daftar bahan menu ini.`,
      })
      return
    }
    setDraft((current) => {
      const rows = [...current.ingredients]
      const emptyIndex = rows.findIndex(
        (row) => !row.name.trim() && !row.quantity.trim() && !row.unit.trim(),
      )
      const nextRow: IngredientRowDraft = {
        key: emptyIndex >= 0 ? rows[emptyIndex]!.key : uid('row'),
        name: item.name,
        quantity: '',
        unit: item.unit,
      }
      if (emptyIndex >= 0) rows[emptyIndex] = nextRow
      else rows.push(nextRow)
      return { ...current, ingredients: rows }
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = draft.title.trim()
    const nextErrors: Record<string, string> = {}

    if (!title) nextErrors.title = 'Nama menu wajib diisi.'
    if (!draft.date) nextErrors.date = 'Pilih tanggal menu.'

    const invalidIngredient = draft.ingredients.find(
      (row) => row.name.trim() && quantityError(row.quantity),
    )
    if (invalidIngredient) {
      nextErrors.ingredients = `Jumlah untuk "${invalidIngredient.name.trim()}" harus lebih dari 0, atau kosongkan.`
    }
    if (slotConflict) nextErrors.slot = 'Slot ini sudah terisi menu lain.'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const payload: MealInput = {
      date: draft.date,
      meal: draft.mealType,
      title,
      ingredients: draft.ingredients
        .filter((row) => row.name.trim())
        .map((row) => {
          const quantity = parseIngredientQuantity(row.quantity)
          return {
            name: row.name.trim(),
            quantity,
            unit: row.unit.trim() || (quantity === null ? 'secukupnya' : 'pcs'),
          }
        }),
      estimatedCost: draft.estimatedCost,
      note: draft.note.trim(),
    }

    try {
      if (initial?.meal) {
        actions.updateMealPlan(initial.meal.id, payload)
        toast({
          tone: 'success',
          title: 'Menu diperbarui',
          description: `${title} tersimpan di rencana mingguan.`,
        })
      } else {
        actions.addMealPlan(payload)
        toast({
          tone: 'success',
          title: 'Menu ditambahkan',
          description: `${title} masuk ke rencana mingguan.`,
        })
      }
      onClose()
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menyimpan menu',
        description: error instanceof Error ? error.message : 'Coba lagi sebentar lagi.',
      })
    }
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4 pb-1" noValidate>
      <Field label="Nama menu" htmlFor="meal-title" required error={errors.title}>
        <TextInput
          id="meal-title"
          value={draft.title}
          onChange={(event) => update('title', event.target.value)}
          placeholder="cth. Ayam tumis brokoli"
          autoComplete="off"
        />
      </Field>

      <FormGrid>
        <Field label="Tanggal" htmlFor="meal-date" required error={errors.date}>
          <DateInput
            id="meal-date"
            value={draft.date}
            onValueChange={(value) => update('date', value)}
          />
        </Field>
        <Field label="Waktu makan" required>
          <SegmentedControl
            value={draft.mealType}
            onChange={(value) => update('mealType', value)}
            options={MEAL_OPTIONS}
            size="sm"
            ariaLabel="Pilih waktu makan"
          />
        </Field>
      </FormGrid>

      {slotConflict ? (
        <p
          className="-mt-1 flex items-start gap-1.5 rounded-xl border border-warning/20 bg-warning/10 px-2.5 py-2 text-[11px] font-medium leading-relaxed text-warning"
          role="alert"
        >
          <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          Slot {MEAL_META[draft.mealType].label.toLowerCase()} pada {formatDateMedium(draft.date)}{' '}
          sudah terisi &ldquo;{slotConflict.title}&rdquo;. Pilih tanggal atau waktu makan lain.
        </p>
      ) : null}

      <Field
        label="Estimasi biaya"
        htmlFor="meal-cost"
        optional
        hint="Perkiraan total biaya bahan untuk menu ini. Boleh dikosongkan."
      >
        <AmountInput
          id="meal-cost"
          value={draft.estimatedCost}
          onValueChange={(value) => update('estimatedCost', value)}
          currency={currency}
        />
      </Field>

      <section className="rounded-2xl border border-line bg-surface-2/60 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-2">Bahan-bahan</p>
            <p className="mt-0.5 text-[10px] text-ink-3">
              Opsional · {draft.ingredients.filter((row) => row.name.trim()).length} bahan tercatat
            </p>
          </div>
          <Button size="sm" variant="soft" icon={Plus} onClick={addIngredientRow}>
            Tambah bahan
          </Button>
        </div>

        {inventorySuggestions.length > 0 ? (
          <div className="mt-2.5">
            <p className="text-[10px] font-semibold text-ink-3">Dari stok dapur</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {inventorySuggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addIngredientFromInventory(item)}
                  className="focus-ring inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-1 text-[10px] font-semibold text-ink-2 transition-colors hover:border-brand/40 hover:text-brand"
                >
                  <Plus size={10} strokeWidth={2.6} aria-hidden="true" />
                  <span className="max-w-[8.5rem] truncate">{item.name}</span>
                  <span className="font-medium text-ink-3">
                    {formatQuantity(item.quantity, item.unit)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {errors.ingredients ? (
          <p className="mt-2.5 text-[0.6875rem] font-medium text-danger" role="alert">
            {errors.ingredients}
          </p>
        ) : null}

        <div className="mt-2.5 space-y-2">
          {draft.ingredients.map((row, index) => (
            <div
              key={row.key}
              className="grid grid-cols-12 gap-1.5 rounded-xl border border-line bg-surface p-1.5"
            >
              <div className="col-span-12 sm:col-span-5">
                <TextInput
                  aria-label={`Nama bahan ${index + 1}`}
                  list="meal-ingredient-name-options"
                  value={row.name}
                  onChange={(event) => updateIngredient(row.key, { name: event.target.value })}
                  placeholder="Nama bahan"
                  autoComplete="off"
                  className="h-10 text-xs"
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <TextInput
                  aria-label={`Jumlah bahan ${index + 1}`}
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={row.quantity}
                  onChange={(event) => updateIngredient(row.key, { quantity: event.target.value })}
                  placeholder="Jml"
                  className="h-10 text-xs number"
                />
              </div>
              <div className="col-span-5 sm:col-span-3">
                <TextInput
                  aria-label={`Satuan bahan ${index + 1}`}
                  list="meal-unit-options"
                  value={row.unit}
                  onChange={(event) => updateIngredient(row.key, { unit: event.target.value })}
                  placeholder="Satuan"
                  autoComplete="off"
                  className="h-10 text-xs"
                />
              </div>
              <div className="col-span-3 flex items-center justify-end sm:col-span-2">
                <IconButton
                  label={`Hapus bahan ${index + 1}`}
                  icon={X}
                  size="md"
                  variant="danger"
                  onClick={() => removeIngredientRow(row.key)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <Field label="Catatan" htmlFor="meal-note" optional>
        <Textarea
          id="meal-note"
          rows={2}
          value={draft.note}
          onChange={(event) => update('note', event.target.value)}
          placeholder="cth. Masak dua porsi sekaligus untuk bekal besok."
        />
      </Field>

      <datalist id="meal-ingredient-name-options">
        {inventory.map((item) => (
          <option key={item.id} value={item.name} />
        ))}
      </datalist>
      <datalist id="meal-unit-options">
        {MEAL_UNITS.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
    </form>
  )
}
