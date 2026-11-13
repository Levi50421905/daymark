import { describe, expect, it } from 'vitest'
import {
  budgetState,
  getBudgetRows,
  getBudgetSummary,
  getCategoryTotals,
  getDailyTrend,
  getGoalProgress,
  getInventoryStatus,
  getMealWeekSummary,
  getMonthlySubscriptionCost,
  getPackageProgress,
  getProratedBudget,
  getReviewSnapshot,
  getSavingsOverview,
  getShoppingTotals,
  getTaskBuckets,
  getTaskStats,
  getUpcomingItems,
  isTaskOverdue,
  summarizeTransactions,
  transactionsInRange,
} from '@/lib/calc'
import { createDefaultData } from '@/lib/seed'
import type { AppData, DataPackage, InventoryItem, ShoppingList, Task } from '@/types/domain'

const NOW = new Date(2026, 10, 13, 10, 0, 0) // 13 Nov 2026, local time

function fixture(): AppData {
  const data = createDefaultData(NOW)
  data.transactions = [
    {
      id: 'tx-1',
      type: 'income',
      categoryId: 'cat-salary',
      amount: 5_000_000,
      date: '2026-11-01',
      note: 'Gaji',
      createdAt: '2026-11-01T08:00:00.000Z',
    },
    {
      id: 'tx-2',
      type: 'expense',
      categoryId: 'cat-food',
      amount: 1_500_000,
      date: '2026-11-02',
      note: 'Makan',
      createdAt: '2026-11-02T10:00:00.000Z',
    },
    {
      id: 'tx-3',
      type: 'expense',
      categoryId: 'cat-internet',
      amount: 350_000,
      date: '2026-11-05',
      note: 'Kuota',
      createdAt: '2026-11-05T10:00:00.000Z',
    },
    {
      id: 'tx-4',
      type: 'expense',
      categoryId: 'cat-fun',
      amount: 320_000,
      date: '2026-11-07',
      note: 'Hiburan',
      createdAt: '2026-11-07T10:00:00.000Z',
    },
  ]
  data.budgets = [
    { id: '2026-11:cat-food', categoryId: 'cat-food', month: '2026-11', amount: 2_000_000 },
    { id: '2026-11:cat-internet', categoryId: 'cat-internet', month: '2026-11', amount: 400_000 },
    { id: '2026-11:cat-fun', categoryId: 'cat-fun', month: '2026-11', amount: 300_000 },
  ]
  data.goals = [
    {
      id: 'goal-1',
      name: 'Dana darurat',
      targetAmount: 10_000_000,
      deadline: '2026-12-31',
      color: '#2EC4B6',
      icon: 'PiggyBank',
      note: '',
      createdAt: '2026-10-01T00:00:00.000Z',
    },
  ]
  data.contributions = [
    {
      id: 'contrib-1',
      goalId: 'goal-1',
      amount: 2_500_000,
      date: '2026-11-04',
      note: '',
      createdAt: '2026-11-04T00:00:00.000Z',
    },
    {
      id: 'contrib-2',
      goalId: 'goal-1',
      amount: 1_000_000,
      date: '2026-10-04',
      note: '',
      createdAt: '2026-10-04T00:00:00.000Z',
    },
  ]
  data.tasks = [
    {
      id: 'task-1',
      title: 'Tugas selesai',
      notes: '',
      checklistId: null,
      priority: 'high',
      category: 'Personal',
      dueDate: '2026-11-10',
      status: 'done',
      createdAt: '2026-11-08T00:00:00.000Z',
      completedAt: '2026-11-10T09:00:00.000Z',
    },
    {
      id: 'task-2',
      title: 'Tugas terlambat',
      notes: '',
      checklistId: null,
      priority: 'medium',
      category: 'Rumah',
      dueDate: '2026-11-12',
      status: 'todo',
      createdAt: '2026-11-08T00:00:00.000Z',
      completedAt: null,
    },
    {
      id: 'task-3',
      title: 'Tugas hari ini',
      notes: '',
      checklistId: null,
      priority: 'low',
      category: 'Personal',
      dueDate: '2026-11-13',
      status: 'todo',
      createdAt: '2026-11-09T00:00:00.000Z',
      completedAt: null,
    },
  ]
  return data
}

const shoppingList: ShoppingList = {
  id: 'list-1',
  name: 'Belanja',
  note: '',
  budget: 200_000,
  createdAt: '2026-11-01T00:00:00.000Z',
  completedAt: null,
  recordedTransactionId: null,
  items: [
    {
      id: 'i1',
      name: 'Apel',
      category: 'Makanan',
      qty: 2,
      unit: 'kg',
      estimatedPrice: 20_000,
      actualPrice: 22_000,
      purchased: true,
      note: '',
    },
    {
      id: 'i2',
      name: 'Susu',
      category: 'Minuman',
      qty: 1,
      unit: 'pack',
      estimatedPrice: 25_000,
      actualPrice: null,
      purchased: false,
      note: '',
    },
  ],
}

const inventory: InventoryItem = {
  id: 'inv-1',
  name: 'Telur',
  category: 'ingredients',
  quantity: 3,
  unit: 'butir',
  minStock: 4,
  purchasedAt: '2026-11-01',
  expiresAt: '2026-11-14',
  location: 'Kulkas',
  note: '',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
}

const dataPackage: DataPackage = {
  id: 'pkg-1',
  deviceId: 'device-1',
  provider: 'Telkomsel',
  packageName: '25 GB',
  price: 300_000,
  quotaGB: 25,
  remainingGB: 2,
  purchasedAt: '2026-11-01',
  expiresAt: '2026-11-15',
  note: '',
  createdAt: '2026-11-01T00:00:00.000Z',
}

describe('transactions and monthly summary', () => {
  it('summarizes income, expense and balance', () => {
    const summary = summarizeTransactions(fixture().transactions)
    expect(summary.income).toBe(5_000_000)
    expect(summary.expense).toBe(2_170_000)
    expect(summary.balance).toBe(2_830_000)
  })

  it('filters transactions by inclusive date range', () => {
    const data = fixture()
    const result = transactionsInRange(data, { start: '2026-11-02', end: '2026-11-05' })
    expect(result.map((transaction) => transaction.id)).toEqual(['tx-2', 'tx-3'])
  })

  it('returns category totals sorted by amount', () => {
    const data = fixture()
    const totals = getCategoryTotals(data, { start: '2026-11-01', end: '2026-11-30' })
    expect(totals[0]?.category.name).toBe('Makanan')
    expect(totals[0]?.percentage).toBeCloseTo((1_500_000 / 2_170_000) * 100, 5)
  })

  it('builds a daily trend covering every day', () => {
    const data = fixture()
    const trend = getDailyTrend(data, { start: '2026-11-01', end: '2026-11-03' })
    expect(trend).toHaveLength(3)
    expect(trend[0]?.income).toBe(5_000_000)
    expect(trend[1]?.expense).toBe(1_500_000)
  })
})

describe('budgets', () => {
  it('classifies budgets correctly', () => {
    expect(budgetState(100, 0)).toBe('safe')
    expect(budgetState(100, 80)).toBe('warning')
    expect(budgetState(100, 100)).toBe('over')
    expect(budgetState(0, 100)).toBe('unset')
  })

  it('builds budget rows and summary', () => {
    const data = fixture()
    const summary = getBudgetSummary(data, '2026-11')
    expect(summary.totalBudget).toBe(2_700_000)
    expect(summary.spent).toBe(2_170_000)
    expect(summary.remaining).toBe(530_000)
    expect(summary.overBudgetCount).toBe(1)
    expect(summary.warnings.map((row) => row.category.name)).toContain('Hiburan')
  })

  it('prorates budgets across a week', () => {
    const data = fixture()
    const amount = getProratedBudget(data, { start: '2026-11-09', end: '2026-11-15' })
    expect(amount).toBeCloseTo(2_700_000 * (7 / 30), 2)
  })

  it('marks category rows as over when spending exceeds limit', () => {
    const rows = getBudgetRows(fixture(), '2026-11')
    const fun = rows.find((row) => row.category.id === 'cat-fun')
    expect(fun?.state).toBe('over')
  })
})

describe('goals and savings', () => {
  it('aggregates goal contributions', () => {
    const data = fixture()
    const overview = getSavingsOverview(data)
    expect(overview.totalSaved).toBe(3_500_000)
    expect(overview.progress).toBe(35)
    expect(overview.goals[0]?.remaining).toBe(6_500_000)
    const goal = getGoalProgress(data.goals[0]!, data.contributions)
    expect(goal.contributionCount).toBe(2)
  })
})

describe('shopping', () => {
  it('compares estimate and actual totals', () => {
    const totals = getShoppingTotals(shoppingList)
    expect(totals.estimatedTotal).toBe(65_000)
    expect(totals.actualTotal).toBe(44_000)
    expect(totals.projectedTotal).toBe(69_000)
    expect(totals.estimatedPurchased).toBe(40_000)
    expect(totals.difference).toBe(4_000)
    expect(totals.progress).toBe(50)
  })
})

describe('inventory', () => {
  it('detects low, expiring, out and expired states', () => {
    expect(getInventoryStatus(inventory, '2026-11-13')).toBe('expiring')
    expect(getInventoryStatus({ ...inventory, expiresAt: null }, '2026-11-13')).toBe('low')
    expect(getInventoryStatus({ ...inventory, quantity: 0, expiresAt: null }, '2026-11-13')).toBe('out')
    expect(getInventoryStatus({ ...inventory, quantity: 10, expiresAt: '2026-11-01' }, '2026-11-13')).toBe(
      'expired',
    )
    expect(getInventoryStatus({ ...inventory, quantity: 10, expiresAt: null }, '2026-11-13')).toBe('ok')
  })
})

describe('tasks', () => {
  it('calculates range-based progress', () => {
    const stats = getTaskStats(fixture().tasks, { start: '2026-11-08', end: '2026-11-14' }, '2026-11-13')
    expect(stats.total).toBe(3)
    expect(stats.completed).toBe(1)
    expect(stats.overdue).toBe(1)
    expect(stats.progress).toBeCloseTo(100 / 3, 5)
  })

  it('groups tasks into meaningful buckets', () => {
    const buckets = getTaskBuckets(fixture().tasks, '2026-11-13')
    expect(buckets.find((bucket) => bucket.id === 'overdue')?.tasks.map((task) => task.id)).toEqual(['task-2'])
    expect(buckets.find((bucket) => bucket.id === 'today')?.tasks.map((task) => task.id)).toEqual(['task-3'])
    const overdueTask = fixture().tasks.find((task) => task.id === 'task-2') as Task
    expect(isTaskOverdue(overdueTask, '2026-11-13')).toBe(true)
  })
})

describe('internet helpers', () => {
  it('calculates data package status and remaining percentage', () => {
    const progress = getPackageProgress(dataPackage, '2026-11-13')
    expect(progress.status).toBe('expiring')
    expect(progress.remainingPercent).toBe(8)
    expect(progress.used).toBe(23)
    expect(progress.daysLeft).toBe(2)
  })

  it('normalizes subscriptions to monthly cost', () => {
    const data = fixture()
    data.subscriptions = [
      {
        id: 'sub-1',
        name: 'Bulanan',
        amount: 100_000,
        cycle: 'monthly',
        nextPaymentDate: '2026-11-20',
        active: true,
        note: '',
        categoryId: 'cat-fun',
        lastPaidAt: null,
        createdAt: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'sub-2',
        name: 'Tahunan',
        amount: 1_200_000,
        cycle: 'yearly',
        nextPaymentDate: '2027-01-01',
        active: true,
        note: '',
        categoryId: 'cat-fun',
        lastPaidAt: null,
        createdAt: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'sub-3',
        name: 'Nonaktif',
        amount: 500_000,
        cycle: 'monthly',
        nextPaymentDate: '2026-11-20',
        active: false,
        note: '',
        categoryId: 'cat-fun',
        lastPaidAt: null,
        createdAt: '2026-11-01T00:00:00.000Z',
      },
    ]
    expect(getMonthlySubscriptionCost(data.subscriptions)).toBe(200_000)
  })

  it('includes upcoming tasks and expiring inventory', () => {
    const data = fixture()
    data.inventory = [inventory]
    data.subscriptions = []
    data.devices = []
    data.dataPackages = []
    data.tasks.push({
      id: 'task-upcoming',
      title: 'Bayar listrik',
      notes: '',
      checklistId: null,
      priority: 'high',
      category: 'Keuangan',
      dueDate: '2026-11-15',
      status: 'todo',
      createdAt: '2026-11-13T00:00:00.000Z',
      completedAt: null,
    })
    const upcoming = getUpcomingItems(data, 7, 10)
    const ids = upcoming.map((item) => item.id)
    expect(ids).toContain('task-task-upcoming')
    expect(ids).toContain('inv-inv-1')
  })
})

describe('reviews', () => {
  it('builds a review snapshot from real data', () => {
    const data = fixture()
    const snapshot = getReviewSnapshot(data, { start: '2026-11-01', end: '2026-11-30' })
    expect(snapshot.totalIncome).toBe(5_000_000)
    expect(snapshot.totalExpense).toBe(2_170_000)
    expect(snapshot.budgetAmount).toBe(2_700_000)
    expect(snapshot.tasksCompleted).toBe(1)
    expect(snapshot.savingsSaved).toBe(3_500_000)
    expect(snapshot.contributions).toBe(2_500_000)
  })
})

describe('meal planner', () => {
  it('aggregates ingredients and cost for a week', () => {
    const data = fixture()
    data.mealPlans = [
      {
        id: 'meal-1',
        date: '2026-11-09',
        meal: 'lunch',
        title: 'Nasi ayam',
        ingredients: [
          { id: 'ing-1', name: 'Beras', quantity: 200, unit: 'gram' },
          { id: 'ing-2', name: 'Ayam', quantity: 200, unit: 'gram' },
        ],
        estimatedCost: 30_000,
        note: '',
        createdAt: '2026-11-09T00:00:00.000Z',
      },
      {
        id: 'meal-2',
        date: '2026-11-10',
        meal: 'dinner',
        title: 'Nasi telur',
        ingredients: [
          { id: 'ing-3', name: 'Beras', quantity: 100, unit: 'gram' },
          { id: 'ing-4', name: 'Telur', quantity: 2, unit: 'butir' },
        ],
        estimatedCost: 18_000,
        note: '',
        createdAt: '2026-11-10T00:00:00.000Z',
      },
    ]
    const summary = getMealWeekSummary(data.mealPlans, { start: '2026-11-09', end: '2026-11-15' })
    expect(summary.mealCount).toBe(2)
    expect(summary.totalCost).toBe(48_000)
    const rice = summary.ingredients.find((item) => item.name === 'Beras')
    expect(rice?.quantity).toBe(300)
  })
})
