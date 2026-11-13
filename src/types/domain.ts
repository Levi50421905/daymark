/** Central domain model for Daymark.
 *
 * Everything the user owns lives inside one serialisable `AppData` document.
 * Keeping the shape flat and versioned makes IndexedDB writes, JSON backup and
 * a future optional sync layer straightforward.
 */

export type ThemeMode = 'light' | 'dark' | 'system'
export type CurrencyCode = 'IDR' | 'USD' | 'EUR' | 'GBP' | 'SGD' | 'MYR' | 'JPY' | 'AUD'
export type TransactionType = 'income' | 'expense'
export type WeekStart = 'monday' | 'sunday'
export type Priority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'done'
export type ReviewPeriod = 'daily' | 'weekly' | 'monthly'
export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type InventoryCategory = 'frozen' | 'ingredients' | 'seasoning' | 'beverage' | 'household'
export type InventoryStatus = 'ok' | 'low' | 'out' | 'expiring' | 'expired'
export type ShoppingCategory = 'Makanan' | 'Minuman' | 'Rumah Tangga' | 'Kesehatan' | 'Lainnya'
export type SubscriptionCycle = 'weekly' | 'monthly' | 'yearly'
export type DeviceType = 'phone' | 'tablet' | 'laptop' | 'router' | 'other'

export interface Category {
  id: string
  name: string
  type: TransactionType
  color: string
  icon: string
}

export interface TransactionSource {
  kind: 'shopping' | 'subscription'
  id: string
}

export interface Transaction {
  id: string
  type: TransactionType
  categoryId: string
  amount: number
  /** ISO date, YYYY-MM-DD */
  date: string
  note: string
  createdAt: string
  updatedAt?: string
  source?: TransactionSource
}

export interface Budget {
  /** Deterministic: `${month}:${categoryId}` */
  id: string
  categoryId: string
  /** YYYY-MM */
  month: string
  amount: number
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  deadline: string | null
  color: string
  icon: string
  note: string
  createdAt: string
}

export interface GoalContribution {
  id: string
  goalId: string
  amount: number
  /** ISO date, YYYY-MM-DD */
  date: string
  note: string
  createdAt: string
}

export interface ShoppingItem {
  id: string
  name: string
  category: ShoppingCategory
  qty: number
  unit: string
  estimatedPrice: number
  actualPrice: number | null
  purchased: boolean
  note: string
}

export interface ShoppingList {
  id: string
  name: string
  note: string
  budget: number | null
  createdAt: string
  /** ISO timestamp when the user completed the list */
  completedAt: string | null
  items: ShoppingItem[]
  /** Prevents the same list being recorded twice in Finance */
  recordedTransactionId: string | null
}

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  quantity: number
  unit: string
  minStock: number
  /** ISO date, YYYY-MM-DD */
  purchasedAt: string
  /** ISO date, YYYY-MM-DD */
  expiresAt: string | null
  location: string
  note: string
  createdAt: string
  updatedAt: string
}

export interface MealIngredient {
  id: string
  name: string
  quantity: number | null
  unit: string
}

export interface MealPlan {
  id: string
  /** ISO date, YYYY-MM-DD */
  date: string
  meal: MealType
  title: string
  ingredients: MealIngredient[]
  estimatedCost: number
  note: string
  createdAt: string
}

export interface Device {
  id: string
  name: string
  type: DeviceType
  note: string
  createdAt: string
}

export interface DataPackage {
  id: string
  deviceId: string
  provider: string
  packageName: string
  price: number
  quotaGB: number
  remainingGB: number
  /** ISO date, YYYY-MM-DD */
  purchasedAt: string
  /** ISO date, YYYY-MM-DD */
  expiresAt: string
  note: string
  createdAt: string
}

export interface Subscription {
  id: string
  name: string
  amount: number
  cycle: SubscriptionCycle
  /** ISO date, YYYY-MM-DD */
  nextPaymentDate: string
  active: boolean
  note: string
  categoryId: string | null
  /** ISO timestamp */
  lastPaidAt: string | null
  createdAt: string
}

export interface Checklist {
  id: string
  name: string
  color: string
  icon: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  notes: string
  checklistId: string | null
  priority: Priority
  /** Free-form activity category, e.g. Personal, Rumah, Kesehatan */
  category: string
  /** ISO date, YYYY-MM-DD */
  dueDate: string | null
  status: TaskStatus
  createdAt: string
  completedAt: string | null
}

export interface ReviewSnapshot {
  totalIncome: number
  totalExpense: number
  /** Budget allocated to the period, prorated for daily/weekly reviews */
  budgetAmount: number
  tasksCompleted: number
  tasksTotal: number
  savingsTarget: number
  savingsSaved: number
  contributions: number
}

export interface Review {
  id: string
  period: ReviewPeriod
  /** ISO date, YYYY-MM-DD */
  periodStart: string
  /** ISO date, YYYY-MM-DD */
  periodEnd: string
  note: string
  reflection: string
  /** 1–5, null when skipped */
  rating: number | null
  snapshot: ReviewSnapshot
  createdAt: string
}

export type WidgetId =
  | 'finance'
  | 'spending'
  | 'budget'
  | 'recent'
  | 'goals'
  | 'shopping'
  | 'inventory'
  | 'tasks'
  | 'upcoming'
  | 'review'

export interface DashboardWidget {
  id: WidgetId
  visible: boolean
}

export interface Settings {
  userName: string
  currency: CurrencyCode
  theme: ThemeMode
  weekStartsOn: WeekStart
  dashboardWidgets: DashboardWidget[]
}

export interface AppMeta {
  schemaVersion: number
  createdAt: string
  updatedAt: string
  lastBackupAt: string | null
  demoData: boolean
}

export interface AppData {
  meta: AppMeta
  settings: Settings
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  goals: SavingsGoal[]
  contributions: GoalContribution[]
  shoppingLists: ShoppingList[]
  inventory: InventoryItem[]
  mealPlans: MealPlan[]
  devices: Device[]
  dataPackages: DataPackage[]
  subscriptions: Subscription[]
  checklists: Checklist[]
  tasks: Task[]
  reviews: Review[]
}

/** Convert a value to a finite, non-negative number without throwing. */
export function safeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}
