import { z } from 'zod'
import { SCHEMA_VERSION } from '@/lib/constants'
import type { AppData } from '@/types/domain'

const id = z.string().min(1).max(140)
const text = z.string().max(5000)
const shortText = z.string().max(500)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
const isoMonth = z.string().regex(/^\d{4}-\d{2}$/, 'Format bulan harus YYYY-MM')
const isoTimestamp = z.string().min(4).max(60)
const amount = z.number().min(0).max(1_000_000_000_000)

const transactionType = z.enum(['income', 'expense'])
const priority = z.enum(['low', 'medium', 'high'])
const taskStatus = z.enum(['todo', 'done'])
const reviewPeriod = z.enum(['daily', 'weekly', 'monthly'])
const mealType = z.enum(['breakfast', 'lunch', 'dinner'])
const inventoryCategory = z.enum(['frozen', 'ingredients', 'seasoning', 'beverage', 'household'])
const shoppingCategory = z.enum(['Makanan', 'Minuman', 'Rumah Tangga', 'Kesehatan', 'Lainnya'])
const subscriptionCycle = z.enum(['weekly', 'monthly', 'yearly'])
const deviceType = z.enum(['phone', 'tablet', 'laptop', 'router', 'other'])
const widgetId = z.enum([
  'finance',
  'spending',
  'budget',
  'recent',
  'goals',
  'shopping',
  'inventory',
  'tasks',
  'upcoming',
  'review',
])
const currency = z.enum(['IDR', 'USD', 'EUR', 'GBP', 'SGD', 'MYR', 'JPY', 'AUD'])
const theme = z.enum(['light', 'dark', 'system'])
const weekStart = z.enum(['monday', 'sunday'])

const categorySchema = z.object({
  id,
  name: shortText.min(1),
  type: transactionType,
  color: z.string().max(40),
  icon: z.string().max(60),
})

const transactionSchema = z.object({
  id,
  type: transactionType,
  categoryId: id,
  amount,
  date: isoDate,
  note: text,
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp.optional(),
  source: z
    .object({
      kind: z.enum(['shopping', 'subscription']),
      id,
    })
    .optional(),
})

const budgetSchema = z.object({
  id,
  categoryId: id,
  month: isoMonth,
  amount,
})

const goalSchema = z.object({
  id,
  name: shortText.min(1),
  targetAmount: amount,
  deadline: isoDate.nullable(),
  color: z.string().max(40),
  icon: z.string().max(60),
  note: text,
  createdAt: isoTimestamp,
})

const contributionSchema = z.object({
  id,
  goalId: id,
  amount,
  date: isoDate,
  note: text,
  createdAt: isoTimestamp,
})

const shoppingItemSchema = z.object({
  id,
  name: shortText.min(1),
  category: shoppingCategory,
  qty: z.number().min(0).max(1_000_000),
  unit: z.string().max(40),
  estimatedPrice: amount,
  actualPrice: amount.nullable(),
  purchased: z.boolean(),
  note: text,
})

const shoppingListSchema = z.object({
  id,
  name: shortText.min(1),
  note: text,
  budget: amount.nullable(),
  createdAt: isoTimestamp,
  completedAt: isoTimestamp.nullable(),
  items: z.array(shoppingItemSchema).max(500),
  recordedTransactionId: id.nullable(),
})

const inventoryItemSchema = z.object({
  id,
  name: shortText.min(1),
  category: inventoryCategory,
  quantity: z.number().min(0).max(1_000_000),
  unit: z.string().max(40),
  minStock: z.number().min(0).max(1_000_000),
  purchasedAt: isoDate,
  expiresAt: isoDate.nullable(),
  location: z.string().max(120),
  note: text,
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
})

const mealIngredientSchema = z.object({
  id,
  name: shortText,
  quantity: z.number().min(0).max(1_000_000).nullable(),
  unit: z.string().max(40),
})

const mealPlanSchema = z.object({
  id,
  date: isoDate,
  meal: mealType,
  title: shortText.min(1),
  ingredients: z.array(mealIngredientSchema).max(100),
  estimatedCost: amount,
  note: text,
  createdAt: isoTimestamp,
})

const deviceSchema = z.object({
  id,
  name: shortText.min(1),
  type: deviceType,
  note: text,
  createdAt: isoTimestamp,
})

const dataPackageSchema = z.object({
  id,
  deviceId: id,
  provider: shortText.min(1),
  packageName: shortText,
  price: amount,
  quotaGB: z.number().min(0).max(1_000_000),
  remainingGB: z.number().min(0).max(1_000_000),
  purchasedAt: isoDate,
  expiresAt: isoDate,
  note: text,
  createdAt: isoTimestamp,
})

const subscriptionSchema = z.object({
  id,
  name: shortText.min(1),
  amount,
  cycle: subscriptionCycle,
  nextPaymentDate: isoDate,
  active: z.boolean(),
  note: text,
  categoryId: id.nullable(),
  lastPaidAt: isoTimestamp.nullable(),
  createdAt: isoTimestamp,
})

const checklistSchema = z.object({
  id,
  name: shortText.min(1),
  color: z.string().max(40),
  icon: z.string().max(60),
  createdAt: isoTimestamp,
})

const taskSchema = z.object({
  id,
  title: shortText.min(1),
  notes: text,
  checklistId: id.nullable(),
  priority,
  category: z.string().max(120),
  dueDate: isoDate.nullable(),
  status: taskStatus,
  createdAt: isoTimestamp,
  completedAt: isoTimestamp.nullable(),
})

const reviewSnapshotSchema = z.object({
  totalIncome: amount,
  totalExpense: amount,
  budgetAmount: amount,
  tasksCompleted: z.number().min(0).max(1_000_000),
  tasksTotal: z.number().min(0).max(1_000_000),
  savingsTarget: amount,
  savingsSaved: amount,
  contributions: amount,
})

const reviewSchema = z.object({
  id,
  period: reviewPeriod,
  periodStart: isoDate,
  periodEnd: isoDate,
  note: text,
  reflection: text,
  rating: z.number().min(1).max(5).nullable(),
  snapshot: reviewSnapshotSchema,
  createdAt: isoTimestamp,
})

const widgetSchema = z.object({
  id: widgetId,
  visible: z.boolean(),
})

const settingsSchema = z.object({
  userName: z.string().max(80),
  currency,
  theme,
  weekStartsOn: weekStart,
  dashboardWidgets: z.array(widgetSchema).max(20),
})

const metaSchema = z.object({
  schemaVersion: z.number().int().min(1).max(SCHEMA_VERSION),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
  lastBackupAt: isoTimestamp.nullable(),
  demoData: z.boolean(),
})

export const appDataSchema = z.object({
  meta: metaSchema,
  settings: settingsSchema,
  categories: z.array(categorySchema).min(1).max(200),
  transactions: z.array(transactionSchema).max(100_000),
  budgets: z.array(budgetSchema).max(20_000),
  goals: z.array(goalSchema).max(500),
  contributions: z.array(contributionSchema).max(20_000),
  shoppingLists: z.array(shoppingListSchema).max(500),
  inventory: z.array(inventoryItemSchema).max(5_000),
  mealPlans: z.array(mealPlanSchema).max(10_000),
  devices: z.array(deviceSchema).max(500),
  dataPackages: z.array(dataPackageSchema).max(5_000),
  subscriptions: z.array(subscriptionSchema).max(1_000),
  checklists: z.array(checklistSchema).max(500),
  tasks: z.array(taskSchema).max(20_000),
  reviews: z.array(reviewSchema).max(5_000),
})

export interface BackupEnvelope {
  app: 'daymark'
  schemaVersion: number
  exportedAt: string
  data: AppData
}

export function buildBackupEnvelope(data: AppData): BackupEnvelope {
  return {
    app: 'daymark',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export class DataValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DataValidationError'
  }
}

function describeIssue(issue: z.ZodIssue): string {
  const path = issue.path.length ? issue.path.join('.') : 'data'
  return `${path}: ${issue.message}`
}

function checkReferentialIntegrity(data: AppData): void {
  const categoryIds = new Set(data.categories.map((category) => category.id))
  const goalIds = new Set(data.goals.map((goal) => goal.id))
  const checklistIds = new Set(data.checklists.map((checklist) => checklist.id))
  const deviceIds = new Set(data.devices.map((device) => device.id))
  const listIds = new Set(data.shoppingLists.map((list) => list.id))
  const transactionIds = new Set(data.transactions.map((transaction) => transaction.id))

  for (const transaction of data.transactions) {
    if (!categoryIds.has(transaction.categoryId)) {
      throw new DataValidationError(
        `Transaksi "${transaction.note || transaction.id}" merujuk kategori yang tidak ada.`,
      )
    }
  }
  for (const budget of data.budgets) {
    if (!categoryIds.has(budget.categoryId)) {
      throw new DataValidationError('Ada anggaran yang merujuk kategori yang tidak ada.')
    }
  }
  for (const contribution of data.contributions) {
    if (!goalIds.has(contribution.goalId)) {
      throw new DataValidationError('Ada kontribusi tabungan tanpa target yang valid.')
    }
  }
  for (const task of data.tasks) {
    if (task.checklistId && !checklistIds.has(task.checklistId)) {
      throw new DataValidationError('Ada tugas yang merujuk checklist yang tidak ada.')
    }
  }
  for (const pkg of data.dataPackages) {
    if (!deviceIds.has(pkg.deviceId)) {
      throw new DataValidationError('Ada paket data yang merujuk perangkat yang tidak ada.')
    }
  }
  for (const list of data.shoppingLists) {
    if (list.recordedTransactionId && !transactionIds.has(list.recordedTransactionId)) {
      throw new DataValidationError('Ada daftar belanja dengan tautan transaksi yang tidak valid.')
    }
  }
  for (const list of data.shoppingLists) {
    if (!listIds.has(list.id)) {
      throw new DataValidationError('Struktur daftar belanja tidak valid.')
    }
  }
  const ids = [
    ...data.categories.map((item) => item.id),
    ...data.transactions.map((item) => item.id),
    ...data.goals.map((item) => item.id),
    ...data.shoppingLists.map((item) => item.id),
    ...data.inventory.map((item) => item.id),
    ...data.mealPlans.map((item) => item.id),
    ...data.devices.map((item) => item.id),
    ...data.dataPackages.map((item) => item.id),
    ...data.subscriptions.map((item) => item.id),
    ...data.checklists.map((item) => item.id),
    ...data.tasks.map((item) => item.id),
    ...data.reviews.map((item) => item.id),
  ]
  if (new Set(ids).size !== ids.length) {
    throw new DataValidationError('Terdapat ID ganda di dalam file backup.')
  }
}

/** Validate and normalise a backup (or a raw AppData object). */
export function parseBackupText(rawText: string): { data: AppData; counts: Record<string, number> } {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new DataValidationError('File bukan JSON yang valid.')
  }
  const candidate =
    parsed && typeof parsed === 'object' && 'data' in parsed && 'app' in parsed
      ? (parsed as { app?: unknown; data?: unknown }).data
      : parsed
  const envelope = parsed as { app?: unknown; schemaVersion?: unknown } | null
  if (envelope && typeof envelope === 'object' && 'app' in envelope && envelope.app !== 'daymark') {
    throw new DataValidationError('File ini bukan backup Daymark.')
  }
  if (
    envelope &&
    typeof envelope === 'object' &&
    typeof envelope.schemaVersion === 'number' &&
    envelope.schemaVersion > SCHEMA_VERSION
  ) {
    throw new DataValidationError(
      'Backup dibuat oleh versi Daymark yang lebih baru. Perbarui aplikasi terlebih dahulu.',
    )
  }
  const result = appDataSchema.safeParse(candidate)
  if (!result.success) {
    throw new DataValidationError(`Backup tidak valid — ${describeIssue(result.error.issues[0]!)}`)
  }
  const data = result.data as AppData
  checkReferentialIntegrity(data)
  return {
    data,
    counts: {
      transaksi: data.transactions.length,
      'daftar belanja': data.shoppingLists.length,
      'stok makanan': data.inventory.length,
      tugas: data.tasks.length,
      langganan: data.subscriptions.length,
      evaluasi: data.reviews.length,
    },
  }
}

/** Used for data already persisted by Daymark; failure is recoverable. */
export function parseStoredData(raw: unknown): AppData | null {
  const result = appDataSchema.safeParse(raw)
  return result.success ? (result.data as AppData) : null
}

export function countData(data: AppData) {
  return {
    transactions: data.transactions.length,
    shoppingLists: data.shoppingLists.length,
    inventory: data.inventory.length,
    tasks: data.tasks.length,
    reviews: data.reviews.length,
    goals: data.goals.length,
    subscriptions: data.subscriptions.length,
  }
}
