import { addDays, differenceInCalendarDays, getDaysInMonth, parseISO } from 'date-fns'
import { CHART_COLORS, INVENTORY_CATEGORIES, MEAL_META, REVIEW_PERIOD_META, SHOPPING_CATEGORIES } from '@/lib/constants'
import {
  daysUntil,
  formatDateMedium,
  getMonthRange,
  monthKeyOf,
  shiftMonthKey,
  todayISO,
  toISODate,
  type DateRange,
} from '@/lib/dates'
import { sum } from '@/lib/utils'
import type {
  AppData,
  Category,
  Checklist,
  DataPackage,
  GoalContribution,
  InventoryItem,
  InventoryStatus,
  MealPlan,
  MealType,
  ReviewSnapshot,
  SavingsGoal,
  ShoppingList,
  Subscription,
  Task,
  Transaction,
  TransactionType,
} from '@/types/domain'

/* -------------------------------------------------------------------------- */
/* Transactions & monthly money                                               */
/* -------------------------------------------------------------------------- */

export function transactionsInRange(
  data: Pick<AppData, 'transactions'>,
  range: DateRange,
  type?: TransactionType,
): Transaction[] {
  return data.transactions.filter(
    (transaction) =>
      transaction.date >= range.start &&
      transaction.date <= range.end &&
      (!type || transaction.type === type),
  )
}

export function sumTransactions(transactions: Transaction[], type: TransactionType): number {
  return sum(transactions.filter((transaction) => transaction.type === type).map((transaction) => transaction.amount))
}

export interface MoneySummary {
  income: number
  expense: number
  balance: number
  transactionCount: number
}

export function summarizeTransactions(transactions: Transaction[]): MoneySummary {
  const income = sumTransactions(transactions, 'income')
  const expense = sumTransactions(transactions, 'expense')
  return {
    income,
    expense,
    balance: income - expense,
    transactionCount: transactions.length,
  }
}

export function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export interface CategoryTotal {
  category: Category
  amount: number
  percentage: number
  color: string
  transactionCount: number
}

export function getCategoryTotals(
  data: Pick<AppData, 'categories' | 'transactions'>,
  range: DateRange,
  type: TransactionType = 'expense',
): CategoryTotal[] {
  const categories = new Map(data.categories.map((category) => [category.id, category]))
  const totals = new Map<string, { amount: number; count: number }>()
  for (const transaction of data.transactions) {
    if (transaction.type !== type) continue
    if (transaction.date < range.start || transaction.date > range.end) continue
    const current = totals.get(transaction.categoryId) ?? { amount: 0, count: 0 }
    current.amount += transaction.amount
    current.count += 1
    totals.set(transaction.categoryId, current)
  }
  const totalAmount = sum([...totals.values()].map((item) => item.amount))
  return [...totals.entries()]
    .map(([categoryId, value], index) => {
      const category =
        categories.get(categoryId) ??
        ({
          id: categoryId,
          name: 'Lainnya',
          type,
          color: CHART_COLORS[index % CHART_COLORS.length],
          icon: 'Shapes',
        } satisfies Category)
      return {
        category,
        amount: value.amount,
        percentage: totalAmount > 0 ? (value.amount / totalAmount) * 100 : 0,
        color: category.color,
        transactionCount: value.count,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

/* -------------------------------------------------------------------------- */
/* Budgets                                                                    */
/* -------------------------------------------------------------------------- */

export type BudgetState = 'unset' | 'safe' | 'warning' | 'over'

export interface BudgetRow {
  category: Category
  budget: number
  spent: number
  remaining: number
  progress: number
  state: BudgetState
}

export interface BudgetSummary {
  month: string
  totalBudget: number
  spent: number
  totalExpense: number
  remaining: number
  progress: number
  rows: BudgetRow[]
  warnings: BudgetRow[]
  overBudgetCount: number
  unbudgetedSpent: number
}

export function budgetState(budget: number, spent: number): BudgetState {
  if (budget <= 0) return 'unset'
  const progress = spent / budget
  if (progress >= 1) return 'over'
  if (progress >= 0.8) return 'warning'
  return 'safe'
}

export function getBudgetRows(
  data: Pick<AppData, 'categories' | 'transactions' | 'budgets'>,
  month: string,
  options: { includeEmpty?: boolean } = {},
): BudgetRow[] {
  const monthRange = getMonthRange(month)
  const spentByCategory = new Map<string, number>()
  for (const transaction of data.transactions) {
    if (transaction.type !== 'expense') continue
    if (transaction.date < monthRange.start || transaction.date > monthRange.end) continue
    spentByCategory.set(
      transaction.categoryId,
      (spentByCategory.get(transaction.categoryId) ?? 0) + transaction.amount,
    )
  }
  const budgetByCategory = new Map(
    data.budgets
      .filter((budget) => budget.month === month)
      .map((budget) => [budget.categoryId, budget.amount]),
  )
  return data.categories
    .filter((category) => category.type === 'expense')
    .map((category) => {
      const budget = budgetByCategory.get(category.id) ?? 0
      const spent = spentByCategory.get(category.id) ?? 0
      const progress = budget > 0 ? (spent / budget) * 100 : spent > 0 ? 100 : 0
      return {
        category,
        budget,
        spent,
        remaining: budget - spent,
        progress,
        state: budgetState(budget, spent),
      } satisfies BudgetRow
    })
    .filter((row) => options.includeEmpty || row.budget > 0 || row.spent > 0)
    .sort((a, b) => {
      const rank = { over: 0, warning: 1, safe: 2, unset: 3 }
      const stateDifference = rank[a.state] - rank[b.state]
      if (stateDifference !== 0) return stateDifference
      return b.spent - a.spent
    })
}

export function getBudgetSummary(
  data: Pick<AppData, 'categories' | 'transactions' | 'budgets'>,
  month: string,
): BudgetSummary {
  const rows = getBudgetRows(data, month)
  const totalBudget = sum(rows.map((row) => row.budget))
  const budgetedSpend = sum(rows.filter((row) => row.budget > 0).map((row) => row.spent))
  const totalExpense = sumTransactions(
    transactionsInRange(data, getMonthRange(month), 'expense'),
    'expense',
  )
  const remaining = totalBudget - budgetedSpend
  const progress = totalBudget > 0 ? (budgetedSpend / totalBudget) * 100 : 0
  return {
    month,
    totalBudget,
    spent: budgetedSpend,
    totalExpense,
    remaining,
    progress,
    rows,
    warnings: rows.filter((row) => row.state === 'warning' || row.state === 'over'),
    overBudgetCount: rows.filter((row) => row.state === 'over').length,
    unbudgetedSpent: Math.max(0, totalExpense - budgetedSpend),
  }
}

/** Budget allocation for any date range, prorated across months. */
export function getProratedBudget(
  data: Pick<AppData, 'budgets'>,
  range: DateRange,
): number {
  if (!data.budgets.length) return 0
  let startMonth = monthKeyOf(range.start)
  const endMonth = monthKeyOf(range.end)
  const rangeStart = parseISO(range.start)
  const rangeEnd = parseISO(range.end)
  let total = 0
  let guard = 0
  while (startMonth <= endMonth && guard < 240) {
    const monthRange = getMonthRange(startMonth)
    const monthStart = parseISO(monthRange.start)
    const monthEnd = parseISO(monthRange.end)
    const overlapStart = rangeStart > monthStart ? rangeStart : monthStart
    const overlapEnd = rangeEnd < monthEnd ? rangeEnd : monthEnd
    const overlapDays = Math.max(0, differenceInCalendarDays(overlapEnd, overlapStart) + 1)
    const daysInMonth = getDaysInMonth(monthStart)
    const monthBudget = sum(
      data.budgets.filter((budget) => budget.month === startMonth).map((budget) => budget.amount),
    )
    if (overlapDays > 0 && daysInMonth > 0) total += monthBudget * (overlapDays / daysInMonth)
    startMonth = shiftMonthKey(startMonth, 1)
    guard += 1
  }
  return total
}

export interface MonthSummary extends MoneySummary {
  month: string
  budget: BudgetSummary
  range: DateRange
}

export function getMonthSummary(
  data: Pick<AppData, 'categories' | 'transactions' | 'budgets'>,
  month: string,
): MonthSummary {
  const range = getMonthRange(month)
  const transactions = transactionsInRange(data, range)
  return {
    ...summarizeTransactions(transactions),
    month,
    budget: getBudgetSummary(data, month),
    range,
  }
}

/* -------------------------------------------------------------------------- */
/* Trends                                                                     */
/* -------------------------------------------------------------------------- */

export interface TrendPoint {
  date: string
  label: string
  expense: number
  income: number
  net: number
}

export function getDailyTrend(
  data: Pick<AppData, 'transactions'>,
  range: DateRange,
): TrendPoint[] {
  const start = parseISO(range.start)
  const end = parseISO(range.end)
  const days = Math.max(0, differenceInCalendarDays(end, start)) + 1
  const points: TrendPoint[] = []
  for (let index = 0; index < days; index += 1) {
    const date = addDays(start, index)
    const iso = toISODate(date)
    points.push({ date: iso, label: date.getDate().toString(), expense: 0, income: 0, net: 0 })
  }
  const byDate = new Map(points.map((point) => [point.date, point]))
  for (const transaction of data.transactions) {
    if (transaction.date < range.start || transaction.date > range.end) continue
    const point = byDate.get(transaction.date)
    if (!point) continue
    if (transaction.type === 'expense') point.expense += transaction.amount
    else point.income += transaction.amount
    point.net = point.income - point.expense
  }
  return points
}

export function clipRangeToToday(range: DateRange, today = todayISO()): DateRange {
  if (range.start > today) return range
  if (range.end > today) return { start: range.start, end: today }
  return range
}

export function getWeekdayAverages(points: TrendPoint[]): number {
  if (!points.length) return 0
  return sum(points.map((point) => point.expense)) / points.length
}

/* -------------------------------------------------------------------------- */
/* Savings goals                                                              */
/* -------------------------------------------------------------------------- */

export interface GoalProgress {
  goal: SavingsGoal
  saved: number
  remaining: number
  progress: number
  daysLeft: number | null
  contributionCount: number
  lastContributionDate: string | null
}

export function getGoalProgress(goal: SavingsGoal, contributions: GoalContribution[]): GoalProgress {
  const items = contributions.filter((contribution) => contribution.goalId === goal.id)
  const saved = sum(items.map((item) => item.amount))
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date))
  return {
    goal,
    saved,
    remaining: Math.max(0, goal.targetAmount - saved),
    progress: goal.targetAmount > 0 ? (saved / goal.targetAmount) * 100 : 0,
    daysLeft: goal.deadline ? daysUntil(goal.deadline) : null,
    contributionCount: items.length,
    lastContributionDate: sorted[0]?.date ?? null,
  }
}

export interface SavingsOverview {
  totalTarget: number
  totalSaved: number
  progress: number
  goals: GoalProgress[]
}

export function getSavingsOverview(
  data: Pick<AppData, 'goals' | 'contributions'>,
): SavingsOverview {
  const goals = data.goals.map((goal) => getGoalProgress(goal, data.contributions))
  const totalTarget = sum(goals.map((goal) => goal.goal.targetAmount))
  const totalSaved = sum(goals.map((goal) => goal.saved))
  return {
    totalTarget,
    totalSaved,
    progress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
    goals: goals.sort((a, b) => b.progress - a.progress),
  }
}

/* -------------------------------------------------------------------------- */
/* Shopping                                                                   */
/* -------------------------------------------------------------------------- */

export interface ShoppingTotals {
  itemCount: number
  purchasedCount: number
  remainingCount: number
  estimatedTotal: number
  estimatedPurchased: number
  actualTotal: number
  projectedTotal: number
  difference: number
  progress: number
  hasActualPrices: boolean
}

export function getShoppingTotals(list: ShoppingList): ShoppingTotals {
  const itemCount = list.items.length
  const purchasedCount = list.items.filter((item) => item.purchased).length
  const estimatedTotal = sum(list.items.map((item) => item.estimatedPrice * item.qty))
  const estimatedPurchased = sum(
    list.items.filter((item) => item.purchased).map((item) => item.estimatedPrice * item.qty),
  )
  const actualTotal = sum(
    list.items
      .filter((item) => item.purchased)
      .map((item) => (item.actualPrice ?? item.estimatedPrice) * item.qty),
  )
  const remainingEstimate = sum(
    list.items
      .filter((item) => !item.purchased)
      .map((item) => item.estimatedPrice * item.qty),
  )
  return {
    itemCount,
    purchasedCount,
    remainingCount: itemCount - purchasedCount,
    estimatedTotal,
    estimatedPurchased,
    actualTotal,
    projectedTotal: actualTotal + remainingEstimate,
    difference: actualTotal - estimatedPurchased,
    progress: itemCount > 0 ? (purchasedCount / itemCount) * 100 : 0,
    hasActualPrices: list.items.some((item) => item.purchased && item.actualPrice !== null),
  }
}

export function sortShoppingItems(list: ShoppingList): Array<[string, ShoppingList['items']]> {
  const order = SHOPPING_CATEGORIES.map((category) => category.value)
  const groups = new Map<string, ShoppingList['items']>()
  for (const item of list.items) {
    const bucket = groups.get(item.category) ?? []
    bucket.push(item)
    groups.set(item.category, bucket)
  }
  return [...groups.entries()].sort(
    (a, b) => (order as string[]).indexOf(a[0]) - (order as string[]).indexOf(b[0]),
  )
}

export function getShoppingOverview(lists: ShoppingList[]) {
  const active = lists.filter((list) => !list.completedAt)
  const completed = lists.filter((list) => list.completedAt)
  const totals = active.map(getShoppingTotals)
  return {
    active,
    completed,
    activeCount: active.length,
    completedCount: completed.length,
    itemCount: sum(totals.map((item) => item.itemCount)),
    purchasedCount: sum(totals.map((item) => item.purchasedCount)),
    estimatedTotal: sum(totals.map((item) => item.estimatedTotal)),
  }
}

/* -------------------------------------------------------------------------- */
/* Inventory                                                                  */
/* -------------------------------------------------------------------------- */

export function getInventoryStatus(item: InventoryItem, today = todayISO()): InventoryStatus {
  if (item.quantity <= 0) return 'out'
  if (item.expiresAt && item.expiresAt < today) return 'expired'
  if (item.expiresAt && daysUntil(item.expiresAt, today) <= 3) return 'expiring'
  if (item.quantity <= item.minStock) return 'low'
  return 'ok'
}

export function getInventorySummary(items: InventoryItem[], today = todayISO()) {
  const counts: Record<InventoryStatus, number> = { ok: 0, low: 0, out: 0, expiring: 0, expired: 0 }
  for (const item of items) counts[getInventoryStatus(item, today)] += 1
  const alerts = items.filter((item) => getInventoryStatus(item, today) !== 'ok')
  return {
    counts,
    total: items.length,
    alertCount: alerts.length,
    alerts,
  }
}

export function getInventoryCategoryMeta(category: InventoryItem['category']) {
  return INVENTORY_CATEGORIES.find((item) => item.value === category) ?? INVENTORY_CATEGORIES[0]
}

/* -------------------------------------------------------------------------- */
/* Meals                                                                      */
/* -------------------------------------------------------------------------- */

export interface MealIngredientSummary {
  name: string
  quantity: number | null
  unit: string
  entryCount: number
}

export interface MealWeekSummary {
  meals: MealPlan[]
  totalCost: number
  mealCount: number
  ingredients: MealIngredientSummary[]
  byDay: Record<string, MealPlan[]>
}

export function getMealWeekSummary(
  mealPlans: MealPlan[],
  range: DateRange,
): MealWeekSummary {
  const meals = mealPlans
    .filter((meal) => meal.date >= range.start && meal.date <= range.end)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      const order: MealType[] = ['breakfast', 'lunch', 'dinner']
      return order.indexOf(a.meal) - order.indexOf(b.meal)
    })
  const ingredientMap = new Map<string, MealIngredientSummary>()
  for (const meal of meals) {
    for (const ingredient of meal.ingredients) {
      if (!ingredient.name.trim()) continue
      const key = `${ingredient.name.trim().toLowerCase()}::${ingredient.unit}`
      const existing = ingredientMap.get(key)
      if (existing) {
        existing.entryCount += 1
        if (existing.quantity !== null && ingredient.quantity !== null) {
          existing.quantity += ingredient.quantity
        } else {
          existing.quantity = null
        }
      } else {
        ingredientMap.set(key, {
          name: ingredient.name.trim(),
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          entryCount: 1,
        })
      }
    }
  }
  const byDay: Record<string, MealPlan[]> = {}
  for (const meal of meals) {
    ;(byDay[meal.date] ??= []).push(meal)
  }
  return {
    meals,
    totalCost: sum(meals.map((meal) => meal.estimatedCost)),
    mealCount: meals.length,
    ingredients: [...ingredientMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    byDay,
  }
}

export function getMealMeta(meal: MealType) {
  return MEAL_META[meal]
}

/* -------------------------------------------------------------------------- */
/* Internet & subscriptions                                                   */
/* -------------------------------------------------------------------------- */

export type PackageStatus = 'ok' | 'low' | 'expiring' | 'expired'

export interface PackageProgress {
  pkg: DataPackage
  used: number
  remainingPercent: number
  daysLeft: number
  status: PackageStatus
}

export function getPackageProgress(pkg: DataPackage, today = todayISO()): PackageProgress {
  const used = Math.max(0, pkg.quotaGB - pkg.remainingGB)
  const remainingPercent = pkg.quotaGB > 0 ? Math.max(0, (pkg.remainingGB / pkg.quotaGB) * 100) : 0
  const daysLeft = daysUntil(pkg.expiresAt, today)
  let status: PackageStatus = 'ok'
  if (daysLeft < 0) status = 'expired'
  else if (daysLeft <= 3) status = 'expiring'
  else if (remainingPercent <= 12 || pkg.remainingGB <= 1) status = 'low'
  return { pkg, used, remainingPercent, daysLeft, status }
}

export function getActivePackages(packages: DataPackage[], today = todayISO()): DataPackage[] {
  return packages.filter((pkg) => pkg.expiresAt >= today && pkg.remainingGB > 0)
}

export function getPackageSummary(packages: DataPackage[], today = todayISO()) {
  const active = getActivePackages(packages, today)
  const activeProgress = active.map((pkg) => getPackageProgress(pkg, today))
  return {
    active,
    totalRemainingGB: sum(active.map((pkg) => pkg.remainingGB)),
    lowCount: activeProgress.filter((item) => item.status === 'low' || item.status === 'expiring').length,
    expiredCount: packages.filter((pkg) => pkg.expiresAt < today).length,
    lastPurchase: [...packages].sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))[0] ?? null,
  }
}

export function getMonthlySubscriptionCost(subscriptions: Subscription[]): number {
  const active = subscriptions.filter((subscription) => subscription.active)
  return sum(
    active.map((subscription) => {
      if (subscription.cycle === 'weekly') return (subscription.amount * 52) / 12
      if (subscription.cycle === 'yearly') return subscription.amount / 12
      return subscription.amount
    }),
  )
}

export function getUpcomingSubscriptions(
  subscriptions: Subscription[],
  days = 14,
  today = todayISO(),
): Subscription[] {
  return subscriptions
    .filter(
      (subscription) =>
        subscription.active && daysUntil(subscription.nextPaymentDate, today) <= days,
    )
    .sort((a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate))
}

/* -------------------------------------------------------------------------- */
/* Tasks & checklists                                                         */
/* -------------------------------------------------------------------------- */

export function isTaskOverdue(task: Task, today = todayISO()): boolean {
  return task.status === 'todo' && task.dueDate !== null && task.dueDate < today
}

export function getTaskStats(tasks: Task[], range?: DateRange, today = todayISO()) {
  const completed = tasks.filter((task) => task.status === 'done')
  const completedInRange = range
    ? completed.filter(
        (task) =>
          task.completedAt !== null &&
          task.completedAt.slice(0, 10) >= range.start &&
          task.completedAt.slice(0, 10) <= range.end,
      )
    : completed
  const inRange = (task: Task) => {
    if (!range) return true
    const created = task.createdAt.slice(0, 10)
    return (
      (task.dueDate !== null && task.dueDate >= range.start && task.dueDate <= range.end) ||
      (created >= range.start && created <= range.end) ||
      (task.completedAt !== null &&
        task.completedAt.slice(0, 10) >= range.start &&
        task.completedAt.slice(0, 10) <= range.end)
    )
  }
  const scoped = tasks.filter(inRange)
  return {
    total: scoped.length,
    allTotal: tasks.length,
    completed: completedInRange.length,
    completedAll: completed.length,
    open: scoped.filter((task) => task.status === 'todo').length,
    overdue: tasks.filter((task) => isTaskOverdue(task, today)).length,
    dueToday: tasks.filter((task) => task.status === 'todo' && task.dueDate === today).length,
    progress: scoped.length > 0 ? (completedInRange.length / scoped.length) * 100 : 0,
  }
}

export interface ChecklistProgress {
  checklist: Checklist
  total: number
  done: number
  progress: number
}

export function getChecklistProgress(
  checklists: Checklist[],
  tasks: Task[],
): ChecklistProgress[] {
  return checklists
    .map((checklist) => {
      const scoped = tasks.filter((task) => task.checklistId === checklist.id)
      const done = scoped.filter((task) => task.status === 'done').length
      return {
        checklist,
        total: scoped.length,
        done,
        progress: scoped.length > 0 ? (done / scoped.length) * 100 : 0,
      }
    })
    .sort((a, b) => b.progress - a.progress)
}

export interface TaskBucket {
  id: 'overdue' | 'today' | 'upcoming' | 'someday' | 'done'
  label: string
  tasks: Task[]
}

export function getTaskBuckets(tasks: Task[], today = todayISO()): TaskBucket[] {
  const order = (task: Task) => {
    if (task.priority === 'high') return 0
    if (task.priority === 'medium') return 1
    return 2
  }
  const open = tasks
    .filter((task) => task.status === 'todo')
    .sort((a, b) => {
      const priority = order(a) - order(b)
      if (priority !== 0) return priority
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return b.createdAt.localeCompare(a.createdAt)
    })
  const done = tasks
    .filter((task) => task.status === 'done')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  return [
    { id: 'overdue', label: 'Terlambat', tasks: open.filter((task) => isTaskOverdue(task, today)) },
    {
      id: 'today',
      label: 'Hari ini',
      tasks: open.filter((task) => task.dueDate === today),
    },
    {
      id: 'upcoming',
      label: 'Mendatang',
      tasks: open.filter((task) => task.dueDate !== null && task.dueDate > today),
    },
    {
      id: 'someday',
      label: 'Tanpa tenggat',
      tasks: open.filter((task) => task.dueDate === null),
    },
    { id: 'done', label: 'Selesai', tasks: done },
  ].filter((bucket) => bucket.tasks.length > 0) as TaskBucket[]
}

/* -------------------------------------------------------------------------- */
/* Upcoming timeline                                                          */
/* -------------------------------------------------------------------------- */

export type UpcomingTone = 'rose' | 'amber' | 'sky' | 'mint' | 'lavender'

export interface UpcomingItem {
  id: string
  kind: 'task' | 'subscription' | 'inventory' | 'data'
  title: string
  subtitle: string
  date: string
  href: string
  tone: UpcomingTone
}

export function getUpcomingItems(data: AppData, days = 7, limit = 7): UpcomingItem[] {
  const today = todayISO()
  const horizon = toISODate(addDays(parseISO(today), days))
  const items: UpcomingItem[] = []
  for (const task of data.tasks) {
    if (task.status !== 'todo' || !task.dueDate) continue
    if (task.dueDate > horizon) continue
    const overdue = task.dueDate < today
    items.push({
      id: `task-${task.id}`,
      kind: 'task',
      title: task.title,
      subtitle: overdue ? `Terlambat · ${formatDateMedium(task.dueDate)}` : `Tugas · ${formatDateMedium(task.dueDate)}`,
      date: task.dueDate,
      href: '/planning',
      tone: overdue ? 'rose' : task.dueDate === today ? 'amber' : 'sky',
    })
  }
  for (const subscription of data.subscriptions) {
    if (!subscription.active) continue
    if (subscription.nextPaymentDate > horizon) continue
    const overdue = subscription.nextPaymentDate < today
    items.push({
      id: `sub-${subscription.id}`,
      kind: 'subscription',
      title: subscription.name,
      subtitle: overdue
        ? `Langganan tertunda · ${formatDateMedium(subscription.nextPaymentDate)}`
        : `Langganan · ${formatDateMedium(subscription.nextPaymentDate)}`,
      date: subscription.nextPaymentDate,
      href: '/internet',
      tone: overdue ? 'rose' : 'lavender',
    })
  }
  for (const item of data.inventory) {
    if (!item.expiresAt || item.quantity <= 0) continue
    if (item.expiresAt > horizon) continue
    const daysLeft = daysUntil(item.expiresAt)
    items.push({
      id: `inv-${item.id}`,
      kind: 'inventory',
      title: item.name,
      subtitle:
        daysLeft < 0
          ? `Kedaluwarsa · ${formatDateMedium(item.expiresAt)}`
          : `Kedaluwarsa dalam ${daysLeft} hari`,
      date: item.expiresAt,
      href: '/inventory',
      tone: daysLeft < 0 ? 'rose' : 'amber',
    })
  }
  for (const pkg of data.dataPackages) {
    if (pkg.expiresAt > horizon) continue
    if (pkg.remainingGB <= 0 || daysUntil(pkg.expiresAt) < -1) continue
    const daysLeft = daysUntil(pkg.expiresAt)
    items.push({
      id: `pkg-${pkg.id}`,
      kind: 'data',
      title: `${pkg.provider} — ${pkg.packageName}`,
      subtitle:
        daysLeft < 0
          ? 'Paket data sudah berakhir'
          : `Paket data berakhir dalam ${daysLeft} hari`,
      date: pkg.expiresAt,
      href: '/internet',
      tone: daysLeft < 0 ? 'rose' : 'sky',
    })
  }
  return items
    .sort((a, b) => {
      const aOverdue = a.date < today ? 0 : 1
      const bOverdue = b.date < today ? 0 : 1
      if (aOverdue !== bOverdue) return aOverdue - bOverdue
      return a.date.localeCompare(b.date)
    })
    .slice(0, limit)
}

/* -------------------------------------------------------------------------- */
/* Reviews                                                                    */
/* -------------------------------------------------------------------------- */

export function getReviewSnapshot(
  data: Pick<
    AppData,
    | 'transactions'
    | 'budgets'
    | 'tasks'
    | 'goals'
    | 'contributions'
  >,
  range: DateRange,
): ReviewSnapshot {
  const transactions = transactionsInRange(data, range)
  const taskStats = getTaskStats(data.tasks, range)
  const savings = getSavingsOverview({ goals: data.goals, contributions: data.contributions })
  const contributions = sum(
    data.contributions
      .filter((item) => item.date >= range.start && item.date <= range.end)
      .map((item) => item.amount),
  )
  return {
    totalIncome: sumTransactions(transactions, 'income'),
    totalExpense: sumTransactions(transactions, 'expense'),
    budgetAmount: getProratedBudget(data, range),
    tasksCompleted: taskStats.completed,
    tasksTotal: taskStats.total,
    savingsTarget: savings.totalTarget,
    savingsSaved: savings.totalSaved,
    contributions,
  }
}

export function getReviewPeriodLabel(period: keyof typeof REVIEW_PERIOD_META): string {
  return REVIEW_PERIOD_META[period].label
}

/* -------------------------------------------------------------------------- */
/* Focus & alerts                                                             */
/* -------------------------------------------------------------------------- */

export function getTodaysTasks(tasks: Task[], today = todayISO()): Task[] {
  return tasks
    .filter(
      (task) =>
        task.status === 'todo' &&
        (task.dueDate === today || (task.dueDate !== null && task.dueDate < today)),
    )
    .sort((a, b) => {
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      const priority = { high: 0, medium: 1, low: 2 }
      return priority[a.priority] - priority[b.priority]
    })
}

export function getBudgetWarnings(data: AppData, month = monthKeyOf()): BudgetRow[] {
  return getBudgetSummary(data, month).warnings
}

export function getCategoryWarnings(data: AppData, month = monthKeyOf()) {
  const summary = getBudgetSummary(data, month)
  return summary.rows.filter((row) => row.state === 'over' || row.state === 'warning')
}

export function countUnreadAlerts(data: AppData): number {
  const inventory = getInventorySummary(data.inventory)
  const packages = getPackageSummary(data.dataPackages)
  const upcoming = getUpcomingSubscriptions(data.subscriptions, 3)
  return inventory.alertCount + packages.lowCount + upcoming.length
}

