import { DEFAULT_CATEGORIES, DEFAULT_WIDGETS, SCHEMA_VERSION } from '@/lib/constants'
import { toISODate } from '@/lib/dates'
import type { AppData, Settings } from '@/types/domain'

export function createDefaultSettings(): Settings {
  return {
    userName: '',
    currency: 'IDR',
    theme: 'light',
    weekStartsOn: 'monday',
    dashboardWidgets: DEFAULT_WIDGETS.map((widget) => ({ ...widget })),
  }
}

/** A fresh, local-first workspace with the starter categories only. */
export function createDefaultData(now = new Date()): AppData {
  const timestamp = now.toISOString()
  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastBackupAt: null,
      demoData: false,
    },
    settings: createDefaultSettings(),
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
    transactions: [],
    budgets: [],
    goals: [],
    contributions: [],
    shoppingLists: [],
    inventory: [],
    mealPlans: [],
    devices: [],
    dataPackages: [],
    subscriptions: [],
    checklists: [],
    tasks: [],
    reviews: [],
  }
}

/** Used when a persisted snapshot is missing a newer field. */
export function defaultDateISO(): string {
  return toISODate(new Date())
}
