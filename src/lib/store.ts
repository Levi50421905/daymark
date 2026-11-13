import { useSyncExternalStore } from 'react'
import {
  addMonthsISO,
  addWeeksISO,
  addYearsISO,
  monthKeyOf,
  todayISO,
  toISODate,
} from '@/lib/dates'
import { applyShoppingListToFinance, createDemoData } from '@/lib/demo'
import { createDefaultData, createDefaultSettings } from '@/lib/seed'
import {
  clearStoredData,
  loadAppData,
  requestPersistentStorage,
  saveAppData,
} from '@/lib/storage'
import { uid } from '@/lib/utils'
import type {
  AppData,
  Category,
  Checklist,
  DataPackage,
  Device,
  GoalContribution,
  InventoryItem,
  MealIngredient,
  MealPlan,
  Review,
  SavingsGoal,
  Settings,
  ShoppingItem,
  ShoppingList,
  Subscription,
  Task,
  Transaction,
  WidgetId,
} from '@/types/domain'

export type StoreStatus = 'loading' | 'ready' | 'error'
export type SaveStatus = 'saving' | 'saved' | 'error'

export interface StoreSnapshot {
  data: AppData
  status: StoreStatus
  error: string | null
  saveStatus: SaveStatus
  lastSavedAt: string | null
  storageWarning: string | null
  revision: number
}

export type NewTransactionInput = Omit<Transaction, 'id' | 'createdAt'>
export type UpdateTransactionInput = Partial<
  Pick<Transaction, 'type' | 'categoryId' | 'amount' | 'date' | 'note'>
>
export type GoalInput = Omit<SavingsGoal, 'id' | 'createdAt'>
export type GoalUpdate = Partial<Pick<SavingsGoal, 'name' | 'targetAmount' | 'deadline' | 'color' | 'icon' | 'note'>>
export type ContributionInput = Omit<GoalContribution, 'id' | 'createdAt'>
export type ShoppingListInput = Pick<ShoppingList, 'name' | 'note' | 'budget'>
export type ShoppingItemInput = Omit<ShoppingItem, 'id'>
export type InventoryInput = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
export type MealInput = {
  date: string
  meal: MealPlan['meal']
  title: string
  ingredients: Array<Omit<MealIngredient, 'id'>>
  estimatedCost: number
  note: string
}
export type DeviceInput = Omit<Device, 'id' | 'createdAt'>
export type DataPackageInput = Omit<DataPackage, 'id' | 'createdAt'>
export type SubscriptionInput = Omit<
  Subscription,
  'id' | 'createdAt' | 'lastPaidAt' | 'active'
> & { active?: boolean }
export type ChecklistInput = Pick<Checklist, 'name' | 'color' | 'icon'>
export type TaskInput = {
  title: string
  notes?: string
  checklistId?: string | null
  priority: Task['priority']
  category: string
  dueDate?: string | null
  status?: Task['status']
}
export type TaskUpdate = Partial<
  Pick<Task, 'title' | 'notes' | 'checklistId' | 'priority' | 'category' | 'dueDate'>
>
export type ReviewInput = Omit<Review, 'id' | 'createdAt'>

const listeners = new Set<() => void>()
let snapshot: StoreSnapshot = {
  data: createDefaultData(),
  status: 'loading',
  error: null,
  saveStatus: 'saved',
  lastSavedAt: null,
  storageWarning: null,
  revision: 0,
}
let initialized = false
let saveTimer: ReturnType<typeof setTimeout> | undefined

function emit(next: StoreSnapshot): void {
  snapshot = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): StoreSnapshot {
  return snapshot
}

export function useAppStore(): StoreSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useAppData(): AppData {
  return useAppStore().data
}

function queuePersist(delay = 420): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = undefined
    void flushPersist()
  }, delay)
}

async function flushPersist(): Promise<void> {
  const revisionAtStart = snapshot.revision
  const dataToSave = snapshot.data
  try {
    await saveAppData(dataToSave)
    if (snapshot.revision === revisionAtStart) {
      emit({
        ...snapshot,
        saveStatus: 'saved',
        lastSavedAt: new Date().toISOString(),
        storageWarning: null,
      })
    } else {
      queuePersist(180)
    }
  } catch (error) {
    emit({
      ...snapshot,
      saveStatus: 'error',
      storageWarning:
        error instanceof Error
          ? `Penyimpanan lokal bermasalah: ${error.message}`
          : 'Penyimpanan lokal bermasalah.',
    })
  }
}

export async function saveNow(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = undefined
  }
  await flushPersist()
}

export async function initStore(force = false): Promise<void> {
  if (initialized && !force) return
  initialized = true
  emit({ ...snapshot, status: 'loading', error: null })
  try {
    const data = await loadAppData()
    emit({
      ...snapshot,
      data,
      status: 'ready',
      error: null,
      saveStatus: 'saved',
      lastSavedAt: new Date().toISOString(),
      storageWarning: null,
    })
    void requestPersistentStorage()
  } catch (error) {
    emit({
      ...snapshot,
      status: 'error',
      error:
        error instanceof Error
          ? error.message
          : 'Daymark tidak bisa membuka penyimpanan lokal di browser ini.',
    })
  }
}

export function startWithoutStorage(): void {
  initialized = true
  emit({
    ...snapshot,
    data: createDefaultData(),
    status: 'ready',
    error: null,
    saveStatus: 'error',
    storageWarning: 'Mode sementara — data tidak akan tersimpan setelah tab ditutup.',
  })
}

function mutate(updater: (data: AppData) => AppData): void {
  if (snapshot.status !== 'ready') {
    throw new Error('Data belum siap. Coba muat ulang aplikasi.')
  }
  const now = new Date().toISOString()
  const data = updater(snapshot.data)
  const nextData: AppData = {
    ...data,
    meta: { ...data.meta, updatedAt: now },
  }
  emit({
    ...snapshot,
    data: nextData,
    revision: snapshot.revision + 1,
    saveStatus: 'saving',
    error: null,
  })
  queuePersist()
}

function requireExpenseCategory(data: AppData, categoryId: string): Category {
  const category = data.categories.find((item) => item.id === categoryId)
  if (!category) throw new Error('Kategori tidak ditemukan.')
  if (category.type !== 'expense') throw new Error('Pilih kategori pengeluaran.')
  return category
}

function requireTransactionCategory(
  data: AppData,
  categoryId: string,
  type: Transaction['type'],
): Category {
  const category = data.categories.find((item) => item.id === categoryId)
  if (!category) throw new Error('Kategori tidak ditemukan.')
  if (category.type !== type) {
    throw new Error(`Kategori "${category.name}" bukan kategori ${type === 'income' ? 'pemasukan' : 'pengeluaran'}.`)
  }
  return category
}

function mapBudgetIds(budgets: AppData['budgets']): AppData['budgets'] {
  return budgets.map((budget) => ({ ...budget, id: `${budget.month}:${budget.categoryId}` }))
}

function nextSubscriptionDate(
  currentDate: string,
  cycle: Subscription['cycle'],
): string {
  if (cycle === 'weekly') return addWeeksISO(currentDate, 1)
  if (cycle === 'yearly') return addYearsISO(currentDate, 1)
  return addMonthsISO(currentDate, 1)
}

export const actions = {
  /* ---------------------------------------------------------------- settings */
  updateSettings(patch: Partial<Settings>): void {
    mutate((data) => ({ ...data, settings: { ...data.settings, ...patch } }))
  },

  setWidgetVisible(id: WidgetId, visible: boolean): void {
    mutate((data) => ({
      ...data,
      settings: {
        ...data.settings,
        dashboardWidgets: data.settings.dashboardWidgets.map((widget) =>
          widget.id === id ? { ...widget, visible } : widget,
        ),
      },
    }))
  },

  setDashboardWidgets(widgets: Settings['dashboardWidgets']): void {
    mutate((data) => ({
      ...data,
      settings: { ...data.settings, dashboardWidgets: widgets.map((widget) => ({ ...widget })) },
    }))
  },

  resetDashboardWidgets(): void {
    mutate((data) => ({
      ...data,
      settings: {
        ...data.settings,
        dashboardWidgets: createDefaultSettings().dashboardWidgets,
      },
    }))
  },

  /* -------------------------------------------------------------- categories */
  addCategory(input: Pick<Category, 'name' | 'type' | 'color' | 'icon'>): Category {
    const category: Category = {
      id: uid('cat'),
      name: input.name.trim(),
      type: input.type,
      color: input.color,
      icon: input.icon,
    }
    if (!category.name) throw new Error('Nama kategori wajib diisi.')
    mutate((data) => {
      const duplicate = data.categories.some(
        (item) =>
          item.type === category.type &&
          item.name.toLowerCase() === category.name.toLowerCase(),
      )
      if (duplicate) throw new Error('Kategori dengan nama itu sudah ada.')
      return { ...data, categories: [...data.categories, category] }
    })
    return category
  },

  updateCategory(id: string, patch: Pick<Category, 'name' | 'color' | 'icon'>): void {
    mutate((data) => ({
      ...data,
      categories: data.categories.map((category) =>
        category.id === id
          ? { ...category, name: patch.name.trim() || category.name, color: patch.color, icon: patch.icon }
          : category,
      ),
    }))
  },

  deleteCategory(id: string): void {
    mutate((data) => {
      const usedByTransaction = data.transactions.some((transaction) => transaction.categoryId === id)
      const usedByBudget = data.budgets.some((budget) => budget.categoryId === id)
      if (usedByTransaction || usedByBudget) {
        throw new Error('Kategori masih dipakai transaksi atau anggaran. Pindahkan dulu datanya.')
      }
      return {
        ...data,
        categories: data.categories.filter((category) => category.id !== id),
        subscriptions: data.subscriptions.map((subscription) =>
          subscription.categoryId === id ? { ...subscription, categoryId: null } : subscription,
        ),
      }
    })
  },

  /* ------------------------------------------------------------ transactions */
  addTransaction(input: NewTransactionInput): Transaction {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error('Nominal transaksi harus lebih dari 0.')
    }
    const transaction: Transaction = {
      ...input,
      id: uid('tx'),
      note: input.note.trim(),
      createdAt: new Date().toISOString(),
    }
    mutate((data) => {
      requireTransactionCategory(data, transaction.categoryId, transaction.type)
      return {
        ...data,
        transactions: [transaction, ...data.transactions],
      }
    })
    return transaction
  },

  updateTransaction(id: string, patch: UpdateTransactionInput): void {
    mutate((data) => {
      const existing = data.transactions.find((transaction) => transaction.id === id)
      if (!existing) throw new Error('Transaksi tidak ditemukan.')
      const nextType = patch.type ?? existing.type
      const nextCategoryId = patch.categoryId ?? existing.categoryId
      requireTransactionCategory(data, nextCategoryId, nextType)
      if (patch.amount !== undefined && (!Number.isFinite(patch.amount) || patch.amount <= 0)) {
        throw new Error('Nominal transaksi harus lebih dari 0.')
      }
      return {
        ...data,
        transactions: data.transactions.map((transaction) =>
          transaction.id === id
            ? {
                ...transaction,
                ...patch,
                note: patch.note !== undefined ? patch.note.trim() : transaction.note,
                updatedAt: new Date().toISOString(),
              }
            : transaction,
        ),
      }
    })
  },

  deleteTransaction(id: string): void {
    mutate((data) => {
      const target = data.transactions.find((transaction) => transaction.id === id)
      return {
        ...data,
        transactions: data.transactions.filter((transaction) => transaction.id !== id),
        shoppingLists: data.shoppingLists.map((list) =>
          list.recordedTransactionId === id || target?.source?.id === list.id
            ? { ...list, recordedTransactionId: null }
            : list,
        ),
      }
    })
  },

  /* ----------------------------------------------------------------- budgets */
  setBudget(categoryId: string, month: string, amount: number): void {
    mutate((data) => {
      requireExpenseCategory(data, categoryId)
      const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0
      const others = data.budgets.filter(
        (budget) => !(budget.categoryId === categoryId && budget.month === month),
      )
      const budgets =
        safeAmount > 0
          ? [...others, { id: `${month}:${categoryId}`, categoryId, month, amount: safeAmount }]
          : others
      return { ...data, budgets }
    })
  },

  setBudgets(month: string, entries: Record<string, number>): void {
    mutate((data) => {
      const nextBudgets = data.budgets.filter((budget) => budget.month !== month)
      for (const [categoryId, amount] of Object.entries(entries)) {
        const category = data.categories.find((item) => item.id === categoryId)
        if (!category || category.type !== 'expense') continue
        const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0
        if (safeAmount > 0) {
          nextBudgets.push({ id: `${month}:${categoryId}`, categoryId, month, amount: safeAmount })
        }
      }
      return { ...data, budgets: nextBudgets }
    })
  },

  copyBudgets(fromMonth: string, toMonth: string): number {
    let copied = 0
    mutate((data) => {
      const source = data.budgets.filter((budget) => budget.month === fromMonth)
      copied = source.length
      if (!source.length) throw new Error('Tidak ada anggaran di bulan sebelumnya untuk disalin.')
      const targets = source.map((budget) => ({
        ...budget,
        month: toMonth,
        id: `${toMonth}:${budget.categoryId}`,
      }))
      return {
        ...data,
        budgets: [...data.budgets.filter((budget) => budget.month !== toMonth), ...targets],
      }
    })
    return copied
  },

  /* ------------------------------------------------------------ savings goals */
  addGoal(input: GoalInput): SavingsGoal {
    if (!input.name.trim()) throw new Error('Nama target wajib diisi.')
    if (input.targetAmount <= 0) throw new Error('Target tabungan harus lebih dari 0.')
    const goal: SavingsGoal = {
      ...input,
      id: uid('goal'),
      name: input.name.trim(),
      createdAt: new Date().toISOString(),
    }
    mutate((data) => ({ ...data, goals: [goal, ...data.goals] }))
    return goal
  },

  updateGoal(id: string, patch: GoalUpdate): void {
    mutate((data) => ({
      ...data,
      goals: data.goals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              ...patch,
              name: patch.name !== undefined ? patch.name.trim() || goal.name : goal.name,
            }
          : goal,
      ),
    }))
  },

  deleteGoal(id: string): void {
    mutate((data) => ({
      ...data,
      goals: data.goals.filter((goal) => goal.id !== id),
      contributions: data.contributions.filter((contribution) => contribution.goalId !== id),
    }))
  },

  addContribution(input: ContributionInput): GoalContribution {
    if (input.amount <= 0) throw new Error('Nominal tabungan harus lebih dari 0.')
    const contribution: GoalContribution = {
      ...input,
      note: input.note.trim(),
      id: uid('contrib'),
      createdAt: new Date().toISOString(),
    }
    mutate((data) => {
      if (!data.goals.some((goal) => goal.id === contribution.goalId)) {
        throw new Error('Target tabungan tidak ditemukan.')
      }
      return { ...data, contributions: [contribution, ...data.contributions] }
    })
    return contribution
  },

  deleteContribution(id: string): void {
    mutate((data) => ({
      ...data,
      contributions: data.contributions.filter((contribution) => contribution.id !== id),
    }))
  },

  /* ----------------------------------------------------------------- shopping */
  addShoppingList(input: ShoppingListInput): ShoppingList {
    if (!input.name.trim()) throw new Error('Nama daftar belanja wajib diisi.')
    const list: ShoppingList = {
      id: uid('list'),
      name: input.name.trim(),
      note: input.note.trim(),
      budget: input.budget,
      createdAt: new Date().toISOString(),
      completedAt: null,
      items: [],
      recordedTransactionId: null,
    }
    mutate((data) => ({ ...data, shoppingLists: [list, ...data.shoppingLists] }))
    return list
  },

  updateShoppingList(id: string, patch: Partial<ShoppingListInput>): void {
    mutate((data) => ({
      ...data,
      shoppingLists: data.shoppingLists.map((list) =>
        list.id === id
          ? {
              ...list,
              ...patch,
              name: patch.name !== undefined ? patch.name.trim() || list.name : list.name,
              note: patch.note !== undefined ? patch.note.trim() : list.note,
            }
          : list,
      ),
    }))
  },

  deleteShoppingList(id: string): void {
    mutate((data) => ({
      ...data,
      shoppingLists: data.shoppingLists.filter((list) => list.id !== id),
    }))
  },

  addShoppingItem(listId: string, input: ShoppingItemInput): ShoppingItem {
    if (!input.name.trim()) throw new Error('Nama barang wajib diisi.')
    const item: ShoppingItem = { ...input, id: uid('item'), name: input.name.trim() }
    mutate((data) => ({
      ...data,
      shoppingLists: data.shoppingLists.map((list) =>
        list.id === listId ? { ...list, items: [...list.items, item] } : list,
      ),
    }))
    return item
  },

  updateShoppingItem(listId: string, itemId: string, patch: Partial<ShoppingItemInput>): void {
    mutate((data) => ({
      ...data,
      shoppingLists: data.shoppingLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      ...patch,
                      name: patch.name !== undefined ? patch.name.trim() || item.name : item.name,
                    }
                  : item,
              ),
            }
          : list,
      ),
    }))
  },

  deleteShoppingItem(listId: string, itemId: string): void {
    mutate((data) => ({
      ...data,
      shoppingLists: data.shoppingLists.map((list) =>
        list.id === listId ? { ...list, items: list.items.filter((item) => item.id !== itemId) } : list,
      ),
    }))
  },

  toggleShoppingItem(listId: string, itemId: string): void {
    mutate((data) => ({
      ...data,
      shoppingLists: data.shoppingLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) => {
                if (item.id !== itemId) return item
                const purchased = !item.purchased
                return {
                  ...item,
                  purchased,
                  actualPrice:
                    purchased && item.actualPrice === null ? item.estimatedPrice : item.actualPrice,
                }
              }),
            }
          : list,
      ),
    }))
  },

  setAllShoppingItemsPurchased(listId: string, purchased: boolean): void {
    mutate((data) => ({
      ...data,
      shoppingLists: data.shoppingLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) => ({
                ...item,
                purchased,
                actualPrice:
                  purchased && item.actualPrice === null ? item.estimatedPrice : item.actualPrice,
              })),
            }
          : list,
      ),
    }))
  },

  completeShoppingList(listId: string): void {
    mutate((data) => ({
      ...data,
      shoppingLists: data.shoppingLists.map((list) =>
        list.id === listId ? { ...list, completedAt: new Date().toISOString() } : list,
      ),
    }))
  },

  reopenShoppingList(listId: string): void {
    mutate((data) => ({
      ...data,
      shoppingLists: data.shoppingLists.map((list) =>
        list.id === listId ? { ...list, completedAt: null } : list,
      ),
    }))
  },

  recordShoppingToFinance(
    listId: string,
    categoryId: string,
    date: string,
  ): Transaction {
    let result!: Transaction
    mutate((data) => {
      const list = data.shoppingLists.find((item) => item.id === listId)
      if (!list) throw new Error('Daftar belanja tidak ditemukan.')
      if (list.recordedTransactionId) throw new Error('Daftar ini sudah dicatat ke Finance.')
      requireExpenseCategory(data, categoryId)
      const transaction = applyShoppingListToFinance(list, categoryId, date)
      result = transaction
      return {
        ...data,
        transactions: [transaction, ...data.transactions],
        shoppingLists: data.shoppingLists.map((item) =>
          item.id === listId
            ? {
                ...item,
                recordedTransactionId: transaction.id,
                completedAt: item.completedAt ?? new Date().toISOString(),
              }
            : item,
        ),
      }
    })
    return result
  },

  unlinkShoppingTransaction(listId: string): void {
    mutate((data) => {
      const list = data.shoppingLists.find((item) => item.id === listId)
      if (!list?.recordedTransactionId) return data
      return {
        ...data,
        transactions: data.transactions.filter(
          (transaction) => transaction.id !== list.recordedTransactionId,
        ),
        shoppingLists: data.shoppingLists.map((item) =>
          item.id === listId ? { ...item, recordedTransactionId: null } : item,
        ),
      }
    })
  },

  /* ---------------------------------------------------------------- inventory */
  addInventoryItem(input: InventoryInput): InventoryItem {
    if (!input.name.trim()) throw new Error('Nama barang wajib diisi.')
    const now = new Date().toISOString()
    const item: InventoryItem = {
      ...input,
      id: uid('inv'),
      name: input.name.trim(),
      createdAt: now,
      updatedAt: now,
    }
    mutate((data) => ({ ...data, inventory: [item, ...data.inventory] }))
    return item
  },

  updateInventoryItem(id: string, patch: Partial<InventoryInput>): void {
    mutate((data) => ({
      ...data,
      inventory: data.inventory.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              name: patch.name !== undefined ? patch.name.trim() || item.name : item.name,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }))
  },

  adjustInventoryQuantity(id: string, delta: number): void {
    mutate((data) => ({
      ...data,
      inventory: data.inventory.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(0, Math.round((item.quantity + delta) * 100) / 100),
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }))
  },

  deleteInventoryItem(id: string): void {
    mutate((data) => ({ ...data, inventory: data.inventory.filter((item) => item.id !== id) }))
  },

  /* -------------------------------------------------------------- meal plans */
  addMealPlan(input: MealInput): MealPlan {
    if (!input.title.trim()) throw new Error('Nama menu wajib diisi.')
    const plan: MealPlan = {
      ...input,
      id: uid('meal'),
      title: input.title.trim(),
      ingredients: input.ingredients
        .filter((ingredient) => ingredient.name.trim())
        .map((ingredient) => ({ ...ingredient, name: ingredient.name.trim(), id: uid('ing') })),
      createdAt: new Date().toISOString(),
    }
    mutate((data) => ({ ...data, mealPlans: [plan, ...data.mealPlans] }))
    return plan
  },

  updateMealPlan(id: string, patch: Partial<MealInput>): void {
    mutate((data) => ({
      ...data,
      mealPlans: data.mealPlans.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              ...patch,
              title: patch.title !== undefined ? patch.title.trim() || plan.title : plan.title,
              ingredients:
                patch.ingredients !== undefined
                  ? patch.ingredients
                      .filter((ingredient) => ingredient.name.trim())
                      .map((ingredient) => ({
                        ...ingredient,
                        name: ingredient.name.trim(),
                        id: uid('ing'),
                      }))
                  : plan.ingredients,
            }
          : plan,
      ),
    }))
  },

  deleteMealPlan(id: string): void {
    mutate((data) => ({ ...data, mealPlans: data.mealPlans.filter((plan) => plan.id !== id) }))
  },

  /* ------------------------------------------------------------------ devices */
  addDevice(input: DeviceInput): Device {
    if (!input.name.trim()) throw new Error('Nama perangkat wajib diisi.')
    const device: Device = {
      ...input,
      name: input.name.trim(),
      id: uid('device'),
      createdAt: new Date().toISOString(),
    }
    mutate((data) => ({ ...data, devices: [device, ...data.devices] }))
    return device
  },

  updateDevice(id: string, patch: Partial<DeviceInput>): void {
    mutate((data) => ({
      ...data,
      devices: data.devices.map((device) =>
        device.id === id
          ? { ...device, ...patch, name: patch.name !== undefined ? patch.name.trim() || device.name : device.name }
          : device,
      ),
    }))
  },

  deleteDevice(id: string): void {
    mutate((data) => ({
      ...data,
      devices: data.devices.filter((device) => device.id !== id),
      dataPackages: data.dataPackages.filter((pkg) => pkg.deviceId !== id),
    }))
  },

  /* -------------------------------------------------------------- data packages */
  addDataPackage(input: DataPackageInput): DataPackage {
    if (!input.provider.trim()) throw new Error('Nama provider wajib diisi.')
    const pkg: DataPackage = {
      ...input,
      id: uid('pkg'),
      provider: input.provider.trim(),
      packageName: input.packageName.trim(),
      remainingGB: Math.min(Math.max(0, input.remainingGB), Math.max(0, input.quotaGB)),
      createdAt: new Date().toISOString(),
    }
    mutate((data) => {
      if (!data.devices.some((device) => device.id === pkg.deviceId)) {
        throw new Error('Pilih perangkat terlebih dahulu.')
      }
      return { ...data, dataPackages: [pkg, ...data.dataPackages] }
    })
    return pkg
  },

  updateDataPackage(id: string, patch: Partial<DataPackageInput>): void {
    mutate((data) => ({
      ...data,
      dataPackages: data.dataPackages.map((pkg) =>
        pkg.id === id
          ? {
              ...pkg,
              ...patch,
              remainingGB: Math.min(
                Math.max(0, patch.remainingGB ?? pkg.remainingGB),
                Math.max(0, patch.quotaGB ?? pkg.quotaGB),
              ),
            }
          : pkg,
      ),
    }))
  },

  updateRemainingQuota(id: string, remainingGB: number): void {
    mutate((data) => ({
      ...data,
      dataPackages: data.dataPackages.map((pkg) =>
        pkg.id === id
          ? { ...pkg, remainingGB: Math.min(Math.max(0, remainingGB), Math.max(0, pkg.quotaGB)) }
          : pkg,
      ),
    }))
  },

  deleteDataPackage(id: string): void {
    mutate((data) => ({
      ...data,
      dataPackages: data.dataPackages.filter((pkg) => pkg.id !== id),
    }))
  },

  /* ------------------------------------------------------------- subscriptions */
  addSubscription(input: SubscriptionInput): Subscription {
    if (!input.name.trim()) throw new Error('Nama langganan wajib diisi.')
    if (input.amount <= 0) throw new Error('Nominal langganan harus lebih dari 0.')
    const subscription: Subscription = {
      ...input,
      name: input.name.trim(),
      id: uid('sub'),
      active: input.active ?? true,
      lastPaidAt: null,
      createdAt: new Date().toISOString(),
    }
    mutate((data) => ({ ...data, subscriptions: [subscription, ...data.subscriptions] }))
    return subscription
  },

  updateSubscription(id: string, patch: Partial<SubscriptionInput>): void {
    mutate((data) => ({
      ...data,
      subscriptions: data.subscriptions.map((subscription) =>
        subscription.id === id
          ? {
              ...subscription,
              ...patch,
              name:
                patch.name !== undefined
                  ? patch.name.trim() || subscription.name
                  : subscription.name,
            }
          : subscription,
      ),
    }))
  },

  toggleSubscription(id: string): void {
    mutate((data) => ({
      ...data,
      subscriptions: data.subscriptions.map((subscription) =>
        subscription.id === id ? { ...subscription, active: !subscription.active } : subscription,
      ),
    }))
  },

  deleteSubscription(id: string): void {
    mutate((data) => ({
      ...data,
      subscriptions: data.subscriptions.filter((subscription) => subscription.id !== id),
    }))
  },

  paySubscription(id: string): Transaction {
    let result!: Transaction
    mutate((data) => {
      const subscription = data.subscriptions.find((item) => item.id === id)
      if (!subscription) throw new Error('Langganan tidak ditemukan.')
      if (subscription.lastPaidAt?.slice(0, 10) === todayISO()) {
        throw new Error('Langganan ini sudah dibayar hari ini.')
      }
      const category =
        (subscription.categoryId
          ? data.categories.find(
              (item) => item.id === subscription.categoryId && item.type === 'expense',
            )
          : undefined) ??
        data.categories.find((item) => item.name.toLowerCase() === 'internet' && item.type === 'expense') ??
        data.categories.find((item) => item.type === 'expense')
      if (!category) throw new Error('Tambahkan kategori pengeluaran terlebih dahulu.')
      const transaction: Transaction = {
        id: uid('tx'),
        type: 'expense',
        categoryId: category.id,
        amount: subscription.amount,
        date: todayISO(),
        note: `Langganan ${subscription.name}`,
        createdAt: new Date().toISOString(),
        source: { kind: 'subscription', id: subscription.id },
      }
      let nextPaymentDate = nextSubscriptionDate(subscription.nextPaymentDate, subscription.cycle)
      while (nextPaymentDate <= todayISO()) {
        nextPaymentDate = nextSubscriptionDate(nextPaymentDate, subscription.cycle)
      }
      result = transaction
      return {
        ...data,
        transactions: [transaction, ...data.transactions],
        subscriptions: data.subscriptions.map((item) =>
          item.id === id
            ? { ...item, lastPaidAt: new Date().toISOString(), nextPaymentDate }
            : item,
        ),
      }
    })
    return result
  },

  /* -------------------------------------------------------------- checklists */
  addChecklist(input: ChecklistInput): Checklist {
    if (!input.name.trim()) throw new Error('Nama checklist wajib diisi.')
    const checklist: Checklist = {
      ...input,
      name: input.name.trim(),
      id: uid('checklist'),
      createdAt: new Date().toISOString(),
    }
    mutate((data) => ({ ...data, checklists: [...data.checklists, checklist] }))
    return checklist
  },

  updateChecklist(id: string, patch: Partial<ChecklistInput>): void {
    mutate((data) => ({
      ...data,
      checklists: data.checklists.map((checklist) =>
        checklist.id === id
          ? {
              ...checklist,
              ...patch,
              name: patch.name !== undefined ? patch.name.trim() || checklist.name : checklist.name,
            }
          : checklist,
      ),
    }))
  },

  deleteChecklist(id: string): void {
    mutate((data) => ({
      ...data,
      checklists: data.checklists.filter((checklist) => checklist.id !== id),
      tasks: data.tasks.map((task) => (task.checklistId === id ? { ...task, checklistId: null } : task)),
    }))
  },

  /* ------------------------------------------------------------------- tasks */
  addTask(input: TaskInput): Task {
    if (!input.title.trim()) throw new Error('Judul tugas wajib diisi.')
    const now = new Date().toISOString()
    const task: Task = {
      id: uid('task'),
      title: input.title.trim(),
      notes: input.notes?.trim() ?? '',
      checklistId: input.checklistId ?? null,
      priority: input.priority,
      category: input.category.trim() || 'Personal',
      dueDate: input.dueDate ?? null,
      status: input.status ?? 'todo',
      createdAt: now,
      completedAt: input.status === 'done' ? now : null,
    }
    mutate((data) => ({ ...data, tasks: [task, ...data.tasks] }))
    return task
  },

  updateTask(id: string, patch: TaskUpdate & { status?: Task['status'] }): void {
    mutate((data) => {
      const existing = data.tasks.find((task) => task.id === id)
      if (!existing) throw new Error('Tugas tidak ditemukan.')
      const nextStatus = patch.status ?? existing.status
      return {
        ...data,
        tasks: data.tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                ...patch,
                title: patch.title !== undefined ? patch.title.trim() || task.title : task.title,
                notes: patch.notes !== undefined ? patch.notes.trim() : task.notes,
                completedAt:
                  nextStatus === 'done'
                    ? (task.completedAt ?? new Date().toISOString())
                    : null,
              }
            : task,
        ),
      }
    })
  },

  toggleTask(id: string): void {
    mutate((data) => {
      const task = data.tasks.find((item) => item.id === id)
      if (!task) throw new Error('Tugas tidak ditemukan.')
      const nextStatus = task.status === 'done' ? 'todo' : 'done'
      return {
        ...data,
        tasks: data.tasks.map((item) =>
          item.id === id
            ? {
                ...item,
                status: nextStatus,
                completedAt: nextStatus === 'done' ? new Date().toISOString() : null,
              }
            : item,
        ),
      }
    })
  },

  deleteTask(id: string): void {
    mutate((data) => ({ ...data, tasks: data.tasks.filter((task) => task.id !== id) }))
  },

  /* ----------------------------------------------------------------- reviews */
  addReview(input: ReviewInput): Review {
    const review: Review = {
      ...input,
      note: input.note.trim(),
      reflection: input.reflection.trim(),
      id: uid('review'),
      createdAt: new Date().toISOString(),
    }
    mutate((data) => ({ ...data, reviews: [review, ...data.reviews] }))
    return review
  },

  updateReview(id: string, patch: Pick<ReviewInput, 'note' | 'reflection' | 'rating'>): void {
    mutate((data) => ({
      ...data,
      reviews: data.reviews.map((review) =>
        review.id === id
          ? {
              ...review,
              ...patch,
              note: patch.note.trim(),
              reflection: patch.reflection.trim(),
            }
          : review,
      ),
    }))
  },

  deleteReview(id: string): void {
    mutate((data) => ({ ...data, reviews: data.reviews.filter((review) => review.id !== id) }))
  },

  /* ------------------------------------------------------------- data & meta */
  markBackup(): void {
    mutate((data) => ({
      ...data,
      meta: { ...data.meta, lastBackupAt: new Date().toISOString() },
    }))
  },

  replaceData(data: AppData): void {
    const nextData: AppData = {
      ...data,
      meta: {
        ...data.meta,
        schemaVersion: data.meta.schemaVersion,
        updatedAt: new Date().toISOString(),
      },
    }
    emit({
      ...snapshot,
      data: nextData,
      status: 'ready',
      error: null,
      saveStatus: 'saving',
      storageWarning: null,
      revision: snapshot.revision + 1,
    })
    queuePersist(50)
  },

  resetData(): void {
    const fresh = createDefaultData()
    emit({
      ...snapshot,
      data: fresh,
      status: 'ready',
      error: null,
      saveStatus: 'saving',
      storageWarning: null,
      revision: snapshot.revision + 1,
    })
    queuePersist(50)
  },

  loadDemoData(): void {
    const demo = createDemoData()
    const next: AppData = {
      ...demo,
      settings: {
        ...demo.settings,
        userName: snapshot.data.settings.userName,
        currency: snapshot.data.settings.currency,
        theme: snapshot.data.settings.theme,
        weekStartsOn: snapshot.data.settings.weekStartsOn,
        dashboardWidgets: snapshot.data.settings.dashboardWidgets,
      },
    }
    emit({
      ...snapshot,
      data: next,
      status: 'ready',
      error: null,
      saveStatus: 'saving',
      storageWarning: null,
      revision: snapshot.revision + 1,
    })
    queuePersist(50)
  },

  async clearAllData(): Promise<void> {
    await clearStoredData()
    const fresh = createDefaultData()
    emit({
      ...snapshot,
      data: fresh,
      status: 'ready',
      error: null,
      saveStatus: 'saved',
      lastSavedAt: new Date().toISOString(),
      storageWarning: null,
      revision: snapshot.revision + 1,
    })
    await saveAppData(fresh)
  },

  /** Used by tests and the CSV/JSON import flow. */
  getData(): AppData {
    return snapshot.data
  },
}

export type AppActions = typeof actions

/** Helpful when a component needs a timestamp for a form default. */
export function defaultFormDate(): string {
  return toISODate(new Date())
}

/** Deterministic helper for date defaults inside forms. */
export function currentMonth(): string {
  return monthKeyOf(new Date())
}

/** Exported only for focused tests around budget mapping. */
export const __internal = { mapBudgetIds }
