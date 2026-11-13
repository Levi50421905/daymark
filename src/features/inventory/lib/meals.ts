import { getInventoryStatus } from '@/lib/calc'
import { getWeekRange, daysUntil, todayISO } from '@/lib/dates'
import { formatQuantity } from '@/lib/format'
import type { InventoryItem, MealPlan, MealType, WeekStart } from '@/types/domain'

export const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner']

/** Units suggested while building meal ingredient rows. */
export const MEAL_UNITS = [
  'gram',
  'kg',
  'ml',
  'liter',
  'pcs',
  'butir',
  'ikat',
  'bungkus',
  'pack',
  'sdm',
  'sdt',
  'botol',
  'kaleng',
  'lembar',
  'potong',
  'secukupnya',
]

export function formatIngredientQuantity(quantity: number | null, unit: string): string {
  if (quantity === null) return 'secukupnya'
  return formatQuantity(quantity, unit)
}

export function mealIngredientCount(meal: MealPlan): number {
  return meal.ingredients.filter((ingredient) => ingredient.name.trim()).length
}

/** Friendly label for the week range currently open in the planner. */
export function weekRelativeLabel(weekStart: string, weekStartsOn: WeekStart): string | null {
  const currentWeekStart = getWeekRange(todayISO(), weekStartsOn).start
  const difference = Math.round(daysUntil(weekStart, currentWeekStart) / 7)
  if (difference === 0) return 'Minggu ini'
  if (difference === -1) return 'Minggu lalu'
  if (difference === 1) return 'Minggu depan'
  return null
}

/** Pick a sensible default meal time from the device clock. */
export function defaultMealType(): MealType {
  const hour = new Date().getHours()
  if (hour < 10) return 'breakfast'
  if (hour < 15) return 'lunch'
  return 'dinner'
}

/** Inventory items that should ideally be cooked first. */
export function mealSuggestionItems(
  items: InventoryItem[],
  today = todayISO(),
  limit = 3,
): InventoryItem[] {
  return items
    .filter((item) => item.quantity > 0 && getInventoryStatus(item, today) === 'expiring')
    .sort((a, b) => (a.expiresAt ?? '').localeCompare(b.expiresAt ?? ''))
    .slice(0, limit)
}

/** First still-empty day/meal slot for a week, preferring the given day. */
export function findOpenSlot(
  mealPlans: MealPlan[],
  days: string[],
  preferredDate: string,
): { date: string; meal: MealType } | null {
  const occupied = new Set(mealPlans.map((meal) => `${meal.date}|${meal.meal}`))
  const orderedDays = [preferredDate, ...days.filter((day) => day !== preferredDate)]
  for (const day of orderedDays) {
    for (const meal of MEAL_ORDER) {
      if (!occupied.has(`${day}|${meal}`)) return { date: day, meal }
    }
  }
  return null
}

/** Previous-week plans used by the "copy last week" shortcut. */
export function mealsInWeek(mealPlans: MealPlan[], range: { start: string; end: string }): MealPlan[] {
  return mealPlans.filter((meal) => meal.date >= range.start && meal.date <= range.end)
}
