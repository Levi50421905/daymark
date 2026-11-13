import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Package, Plus, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { getMealWeekSummary } from '@/lib/calc'
import {
  addDaysISO,
  enumerateDates,
  formatDateMedium,
  getWeekRange,
  todayISO,
} from '@/lib/dates'
import { fadeUp } from '@/lib/motion'
import { actions, useAppData } from '@/lib/store'
import type { InventoryItem, MealPlan, MealType } from '@/types/domain'
import { MealForm, type MealFormIngredientInput, type MealFormInitial } from './components/MealForm'
import { MealPlanner } from './components/MealPlanner'
import { StockItemForm } from './components/StockItemForm'
import { StockView } from './components/StockView'
import { countStock } from './lib/stock'
import { findOpenSlot } from './lib/meals'

type TabValue = 'stock' | 'planner'

interface ItemFormState {
  open: boolean
  item: InventoryItem | null
}

export default function InventoryPage() {
  const data = useAppData()
  const toast = useToast()
  const today = todayISO()

  const [tab, setTab] = useState<TabValue>('stock')
  const [weekAnchor, setWeekAnchor] = useState(today)
  const [itemForm, setItemForm] = useState<ItemFormState>({ open: false, item: null })
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [mealForm, setMealForm] = useState<MealFormInitial | null>(null)
  const [mealToDelete, setMealToDelete] = useState<MealPlan | null>(null)

  const weekRange = getWeekRange(weekAnchor, data.settings.weekStartsOn)
  const weekSummary = getMealWeekSummary(data.mealPlans, weekRange)
  const attentionCount = countStock(data.inventory, today).attention
  const defaultMealDate = today >= weekRange.start && today <= weekRange.end ? today : weekRange.start

  const openNewItem = () => setItemForm({ open: true, item: null })
  const openEditItem = (item: InventoryItem) => setItemForm({ open: true, item })
  const closeItemForm = () => setItemForm((current) => ({ ...current, open: false }))

  const openNewMeal = (
    date: string,
    meal: MealType,
    ingredients?: MealFormIngredientInput[],
  ) => {
    setMealForm({ meal: null, date, mealType: meal, ingredients })
  }
  const openEditMeal = (meal: MealPlan) => {
    setMealForm({ meal, date: meal.date, mealType: meal.meal })
  }

  const weekDays = enumerateDates(weekRange.start, weekRange.end)
  const addMealToOpenSlot = (ingredients?: MealFormIngredientInput[]) => {
    const slot = findOpenSlot(data.mealPlans, weekDays, defaultMealDate)
    if (!slot) {
      toast({
        tone: 'info',
        title: 'Semua slot sudah terisi',
        description: 'Hapus atau ubah salah satu menu sebelum menambah yang baru.',
      })
      return
    }
    openNewMeal(slot.date, slot.meal, ingredients)
  }

  const handleAdjustQuantity = (item: InventoryItem, delta: number) => {
    try {
      actions.adjustInventoryQuantity(item.id, delta)
      if (item.quantity + delta <= 0) {
        toast({
          tone: 'warning',
          title: 'Stok habis',
          description: `${item.name} sekarang 0 ${item.unit}. Catat saat kamu restok, ya.`,
        })
      }
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal memperbarui jumlah',
        description: error instanceof Error ? error.message : 'Coba lagi sebentar lagi.',
      })
    }
  }

  const confirmDeleteItem = () => {
    if (!itemToDelete) return
    try {
      actions.deleteInventoryItem(itemToDelete.id)
      toast({
        tone: 'success',
        title: 'Barang dihapus',
        description: `${itemToDelete.name} sudah keluar dari persediaan.`,
      })
      setItemToDelete(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menghapus barang',
        description: error instanceof Error ? error.message : 'Coba lagi sebentar lagi.',
      })
    }
  }

  const confirmDeleteMeal = () => {
    if (!mealToDelete) return
    try {
      actions.deleteMealPlan(mealToDelete.id)
      toast({
        tone: 'success',
        title: 'Menu dihapus',
        description: `${mealToDelete.title} sudah keluar dari rencana mingguan.`,
      })
      setMealToDelete(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menghapus menu',
        description: error instanceof Error ? error.message : 'Coba lagi sebentar lagi.',
      })
    }
  }

  const handleCopyPreviousWeek = () => {
    const previousRange = getWeekRange(
      addDaysISO(weekRange.start, -7),
      data.settings.weekStartsOn,
    )
    const previousMeals = data.mealPlans.filter(
      (meal) => meal.date >= previousRange.start && meal.date <= previousRange.end,
    )
    if (previousMeals.length === 0) {
      toast({
        tone: 'info',
        title: 'Belum ada menu minggu lalu',
        description: 'Susun menu minggu ini satu per satu dulu.',
      })
      return
    }
    try {
      for (const meal of previousMeals) {
        actions.addMealPlan({
          date: addDaysISO(meal.date, 7),
          meal: meal.meal,
          title: meal.title,
          ingredients: meal.ingredients.map((ingredient) => ({
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
          })),
          estimatedCost: meal.estimatedCost,
          note: meal.note,
        })
      }
      toast({
        tone: 'success',
        title: `${previousMeals.length} menu disalin`,
        description: 'Dari minggu sebelumnya. Sesuaikan dengan stok minggu ini.',
      })
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menyalin menu',
        description: error instanceof Error ? error.message : 'Coba lagi sebentar lagi.',
      })
    }
  }

  const headerAction =
    tab === 'stock' ? (
      <Button icon={Plus} onClick={openNewItem}>
        Tambah barang
      </Button>
    ) : (
      <Button icon={Plus} onClick={() => addMealToOpenSlot()}>
        Tambah menu
      </Button>
    )

  const tabOptions: Array<SegmentedOption<TabValue>> = [
    { value: 'stock', label: 'Stok', icon: Package, count: data.inventory.length },
    { value: 'planner', label: 'Meal Planner', icon: CalendarDays, count: weekSummary.mealCount },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Persediaan"
        description={
          tab === 'stock'
            ? 'Pantau stok dapur, atur batas minimum, dan hindari bahan yang kedaluwarsa.'
            : 'Rencanakan menu seminggu, perkirakan biayanya, dan siapkan bahan yang perlu dibeli.'
        }
        actions={headerAction}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={tabOptions}
          ariaLabel="Pilih tampilan Inventory"
        />

        {tab === 'stock' ? (
          attentionCount > 0 ? (
            <Badge tone="amber">
              <TriangleAlert size={12} strokeWidth={2.2} aria-hidden="true" />
              {attentionCount} barang perlu perhatian
            </Badge>
          ) : (
            <Badge tone="mint" dot>
              Stok terpantau
            </Badge>
          )
        ) : (
          <Badge tone="brand">
            <CalendarDays size={12} strokeWidth={2.2} aria-hidden="true" />
            {weekSummary.mealCount} menu terencana
          </Badge>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {tab === 'stock' ? (
            <StockView
              inventory={data.inventory}
              onAddItem={openNewItem}
              onEditItem={openEditItem}
              onDeleteItem={setItemToDelete}
              onAdjustQuantity={handleAdjustQuantity}
            />
          ) : (
            <MealPlanner
              mealPlans={data.mealPlans}
              inventory={data.inventory}
              currency={data.settings.currency}
              weekStartsOn={data.settings.weekStartsOn}
              weekRange={weekRange}
              summary={weekSummary}
              onWeekAnchorChange={setWeekAnchor}
              onAddMeal={(date, meal) => openNewMeal(date, meal)}
              onAddAnyMeal={() => addMealToOpenSlot()}
              onEditMeal={openEditMeal}
              onCopyPreviousWeek={handleCopyPreviousWeek}
              onAddWithIngredient={(item) =>
                addMealToOpenSlot([{ name: item.name, quantity: null, unit: item.unit }])
              }
              onGoToStock={() => setTab('stock')}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <StockItemForm open={itemForm.open} item={itemForm.item} onClose={closeItemForm} />

      <MealForm
        open={mealForm !== null}
        initial={mealForm}
        inventory={data.inventory}
        mealPlans={data.mealPlans}
        currency={data.settings.currency}
        onClose={() => setMealForm(null)}
        onRequestDelete={(meal) => {
          setMealForm(null)
          setMealToDelete(meal)
        }}
      />

      <ConfirmDialog
        open={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDeleteItem}
        title="Hapus barang?"
        description={
          itemToDelete ? (
            <>
              Barang <span className="font-semibold text-ink-2">{itemToDelete.name}</span> akan
              dihapus dari persediaan. Tindakan ini tidak bisa dibatalkan.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Hapus barang"
      />

      <ConfirmDialog
        open={mealToDelete !== null}
        onClose={() => setMealToDelete(null)}
        onConfirm={confirmDeleteMeal}
        title="Hapus menu?"
        description={
          mealToDelete ? (
            <>
              Menu{' '}
              <span className="font-semibold text-ink-2">{mealToDelete.title}</span> pada{' '}
              {formatDateMedium(mealToDelete.date)} akan dihapus dari rencana mingguan.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Hapus menu"
      />
    </div>
  )
}
