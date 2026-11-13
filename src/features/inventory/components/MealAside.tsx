import { CookingPot, Package, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { getInventoryCategoryMeta, type MealIngredientSummary } from '@/lib/calc'
import type { InventoryItem } from '@/types/domain'
import { formatIngredientQuantity } from '../lib/meals'
import { expiryLabel } from '../lib/stock'

interface MealIngredientsCardProps {
  ingredients: MealIngredientSummary[]
  mealCount: number
  onGoToStock: () => void
}

export function MealIngredientsCard({
  ingredients,
  mealCount,
  onGoToStock,
}: MealIngredientsCardProps) {
  return (
    <Card padding="md">
      <SectionHeading
        title="Bahan minggu ini"
        description={`${ingredients.length} bahan unik dari ${mealCount} menu.`}
        icon={<CookingPot size={16} strokeWidth={1.9} aria-hidden="true" />}
      />

      {ingredients.length === 0 ? (
        <div className="surface-muted mt-3 p-3.5 text-center">
          <p className="text-xs font-semibold text-ink">Belum ada bahan tercatat</p>
          <p className="mt-1 text-[10px] leading-relaxed text-ink-3">
            Tambahkan bahan pada menu untuk melihat daftar belanja mingguanmu.
          </p>
        </div>
      ) : (
        <ul className="mt-2 max-h-[330px] divide-y divide-line/70 overflow-y-auto pr-0.5">
          {ingredients.map((ingredient) => (
            <li
              key={`${ingredient.name.toLowerCase()}::${ingredient.unit}`}
              className="flex items-center gap-2 py-2"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand/60" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink-2">
                {ingredient.name}
              </span>
              {ingredient.entryCount > 1 ? (
                <span className="shrink-0 rounded-full bg-surface-3 px-1.5 py-px text-[9px] font-bold text-ink-3">
                  ×{ingredient.entryCount}
                </span>
              ) : null}
              <span className="shrink-0 text-[11px] font-semibold text-ink number">
                {formatIngredientQuantity(ingredient.quantity, ingredient.unit)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Button size="sm" variant="ghost" fullWidth icon={Package} className="mt-2" onClick={onGoToStock}>
        Buka stok
      </Button>
    </Card>
  )
}

interface MealSuggestionsCardProps {
  items: InventoryItem[]
  today: string
  onAddWithIngredient: (item: InventoryItem) => void
}

export function MealSuggestionsCard({ items, today, onAddWithIngredient }: MealSuggestionsCardProps) {
  if (items.length === 0) return null

  return (
    <Card padding="md">
      <SectionHeading
        title="Gunakan dari stok"
        description="Bahan yang sebaiknya dipakai lebih dulu."
        icon={<Sparkles size={16} strokeWidth={1.9} aria-hidden="true" />}
      />
      <ul className="mt-2 space-y-0.5">
        {items.map((item) => {
          const category = getInventoryCategoryMeta(item.category)
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onAddWithIngredient(item)}
                className="focus-ring flex w-full items-center gap-2.5 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-surface-2"
              >
                <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-semibold text-ink">{item.name}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-ink-3">
                    {expiryLabel(item, today)}
                  </span>
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Plus size={13} strokeWidth={2.4} aria-hidden="true" />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-1.5 px-1.5 text-[9px] leading-relaxed text-ink-3">
        Ketuk bahan untuk memasukkannya ke menu baru.
      </p>
    </Card>
  )
}
