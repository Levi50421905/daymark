import { getShoppingTotals, sortShoppingItems } from '@/lib/calc'
import { SHOPPING_CATEGORIES } from '@/lib/constants'
import { sum } from '@/lib/utils'
import type { Category, ShoppingCategory, ShoppingItem, ShoppingList } from '@/types/domain'

export type ShoppingListFilter = 'active' | 'completed' | 'all'

export interface ShoppingCategoryGroup {
  category: ShoppingCategory
  color: string
  icon: string
  items: ShoppingItem[]
  purchasedCount: number
  /** Sum of estimated price × quantity for every item in the group. */
  estimatedSubtotal: number
}

const FALLBACK_CATEGORY = SHOPPING_CATEGORIES[SHOPPING_CATEGORIES.length - 1]

export function shoppingCategoryMeta(category: ShoppingCategory) {
  return SHOPPING_CATEGORIES.find((entry) => entry.value === category) ?? FALLBACK_CATEGORY
}

/** Estimated line total for a single item (unit price × quantity). */
export function estimatedLineTotal(item: ShoppingItem): number {
  return item.estimatedPrice * item.qty
}

/** Actual line total, falling back to the estimate while the price is unknown. */
export function actualLineTotal(item: ShoppingItem): number {
  return (item.actualPrice ?? item.estimatedPrice) * item.qty
}

/** Positive when the real price was higher than the estimate. */
export function lineDifference(item: ShoppingItem): number {
  return actualLineTotal(item) - estimatedLineTotal(item)
}

/**
 * Items grouped by `SHOPPING_CATEGORIES` order using the shared grouping helper.
 * Purchased items are pushed to the bottom of each group so the list stays
 * focused on what is still left to buy.
 */
export function groupShoppingItems(list: ShoppingList): ShoppingCategoryGroup[] {
  return sortShoppingItems(list).map(([category, items]) => {
    const meta = shoppingCategoryMeta(category as ShoppingCategory)
    const ordered = [...items].sort((a, b) => Number(a.purchased) - Number(b.purchased))
    return {
      category: meta.value,
      color: meta.color,
      icon: meta.icon,
      items: ordered,
      purchasedCount: ordered.filter((item) => item.purchased).length,
      estimatedSubtotal: sum(ordered.map((item) => estimatedLineTotal(item))),
    }
  })
}

/** Active lists first (newest first), then completed lists (most recent first). */
export function sortShoppingListsForDisplay(lists: ShoppingList[]): ShoppingList[] {
  return [...lists].sort((a, b) => {
    const aCompleted = a.completedAt !== null
    const bCompleted = b.completedAt !== null
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1
    if (aCompleted && bCompleted) {
      return (b.completedAt ?? '').localeCompare(a.completedAt ?? '')
    }
    return b.createdAt.localeCompare(a.createdAt)
  })
}

/**
 * Amount that `recordShoppingToFinance` will write: actual spend once anything
 * was purchased, otherwise the full estimate.
 */
export function listRecordAmount(list: ShoppingList): number {
  const totals = getShoppingTotals(list)
  return totals.purchasedCount > 0 ? totals.actualTotal : totals.estimatedTotal
}

/** Best expense category to preselect in the Finance modal. */
export function preferredExpenseCategoryId(categories: Category[]): string {
  const expenses = categories.filter((category) => category.type === 'expense')
  const preferredNames = ['makanan', 'kebutuhan rumah', 'belanja']
  for (const name of preferredNames) {
    const match = expenses.find((category) => category.name.toLowerCase().includes(name))
    if (match) return match.id
  }
  return expenses[0]?.id ?? ''
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.'
}
