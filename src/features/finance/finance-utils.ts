import type { BadgeTone } from '@/components/ui/Badge'
import { sortTransactions } from '@/lib/calc'
import type { BudgetState } from '@/lib/calc'
import {
  addDaysISO,
  daysUntil,
  formatDate,
  formatDateMedium,
  getMonthRange,
  monthKeyOf,
  todayISO,
} from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import type {
  AppData,
  Category,
  CurrencyCode,
  GoalContribution,
  Transaction,
  TransactionType,
} from '@/types/domain'

export type FinanceTab = 'transactions' | 'budgets' | 'goals'

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
}

/** Short money text for dense rows and card subtitles. */
export function compactMoney(amount: number, currency: CurrencyCode): string {
  return formatMoney(amount, currency, { compact: true })
}

export function monthTickLabel(dateISO: string): string {
  return formatDate(dateISO, 'd MMM')
}

/** Friendly heading for a transaction date group. */
export function dateGroupHeading(dateISO: string): string {
  const today = todayISO()
  if (dateISO === today) return 'Hari ini'
  if (dateISO === addDaysISO(today, -1)) return 'Kemarin'
  return formatDate(dateISO, 'EEEE, d MMMM')
}

/** Secondary label under today/yesterday so the real date is still visible. */
export function dateGroupSubLabel(dateISO: string): string | null {
  const today = todayISO()
  if (dateISO === today || dateISO === addDaysISO(today, -1)) return formatDateMedium(dateISO)
  return null
}

export interface DateGroup {
  date: string
  transactions: Transaction[]
  income: number
  expense: number
}

export function groupTransactionsByDate(transactions: Transaction[]): DateGroup[] {
  const groups: DateGroup[] = []
  for (const transaction of sortTransactions(transactions)) {
    let group = groups[groups.length - 1]
    if (!group || group.date !== transaction.date) {
      group = { date: transaction.date, transactions: [], income: 0, expense: 0 }
      groups.push(group)
    }
    group.transactions.push(transaction)
    if (transaction.type === 'income') group.income += transaction.amount
    else group.expense += transaction.amount
  }
  return groups
}

export function transactionMatchesQuery(
  transaction: Transaction,
  categoryName: string,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const label = TRANSACTION_TYPE_LABEL[transaction.type].toLowerCase()
  return (
    transaction.note.toLowerCase().includes(needle) ||
    categoryName.toLowerCase().includes(needle) ||
    label.includes(needle) ||
    String(transaction.amount).includes(needle)
  )
}

export function transactionSourceLabel(transaction: Transaction): string | null {
  if (!transaction.source) return null
  return transaction.source.kind === 'shopping' ? 'Dari belanja' : 'Dari langganan'
}

export function transactionDisplayTitle(
  transaction: Transaction,
  category: Category | undefined,
): string {
  return (
    transaction.note.trim() ||
    category?.name ||
    (transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran')
  )
}

export interface CategoryUsage {
  transactions: number
  budgetCount: number
  subscriptions: number
  /** Total references that block deletion (transactions + budgets). */
  total: number
  inUse: boolean
}

export function getCategoryUsage(
  data: Pick<AppData, 'transactions' | 'budgets' | 'subscriptions'>,
  categoryId: string,
): CategoryUsage {
  const transactions = data.transactions.filter((item) => item.categoryId === categoryId).length
  const budgetCount = data.budgets.filter((item) => item.categoryId === categoryId).length
  const subscriptions = data.subscriptions.filter((item) => item.categoryId === categoryId).length
  return {
    transactions,
    budgetCount,
    subscriptions,
    total: transactions + budgetCount,
    inUse: transactions > 0 || budgetCount > 0,
  }
}

export function categoryUsageLabel(usage: CategoryUsage): string {
  const parts: string[] = []
  if (usage.transactions > 0) parts.push(`${usage.transactions} transaksi`)
  if (usage.budgetCount > 0) parts.push(`${usage.budgetCount} anggaran`)
  if (usage.subscriptions > 0) parts.push(`${usage.subscriptions} langganan`)
  return parts.length > 0 ? `Dipakai di ${parts.join(' · ')}` : 'Belum dipakai'
}

export function budgetStateMeta(state: BudgetState): {
  label: string
  tone: BadgeTone
  color: string
} {
  if (state === 'over') return { label: 'Lewat anggaran', tone: 'danger', color: 'var(--c-danger)' }
  if (state === 'warning') return { label: 'Hampir penuh', tone: 'amber', color: 'var(--c-warning)' }
  if (state === 'safe') return { label: 'Aman', tone: 'mint', color: 'var(--c-mint)' }
  return { label: 'Belum diatur', tone: 'neutral', color: 'var(--c-ink-3)' }
}

export interface GoalDeadlineMeta {
  label: string
  tone: BadgeTone
  days: number | null
}

export function goalDeadlineMeta(deadline: string | null): GoalDeadlineMeta {
  if (!deadline) return { label: 'Tanpa tenggat', tone: 'neutral', days: null }
  const days = daysUntil(deadline)
  if (days < 0) return { label: `Lewat ${Math.abs(days)} hari`, tone: 'danger', days }
  if (days === 0) return { label: 'Tenggat hari ini', tone: 'amber', days }
  if (days <= 7) return { label: `${days} hari lagi`, tone: 'amber', days }
  if (days <= 30) return { label: `${days} hari lagi`, tone: 'lavender', days }
  return { label: formatDateMedium(deadline), tone: 'neutral', days }
}

/** Sensible date default when adding a transaction for the visible month. */
export function defaultTransactionDate(month: string): string {
  const today = todayISO()
  return monthKeyOf(today) === month ? today : `${month}-01`
}

/** Average daily expense for the visible month (elapsed days for the current month). */
export function monthlyAverageExpense(expense: number, month: string): number {
  const today = todayISO()
  const range = getMonthRange(month)
  const daysInMonth = Number(range.end.slice(8, 10))
  const elapsed =
    monthKeyOf(today) === month ? Math.min(daysInMonth, Number(today.slice(8, 10))) : daysInMonth
  return elapsed > 0 ? expense / elapsed : 0
}

export function budgetAmountMap(
  budgets: AppData['budgets'],
  month: string,
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const budget of budgets) {
    if (budget.month === month) map[budget.categoryId] = budget.amount
  }
  return map
}

export function sortContributions(contributions: GoalContribution[]): GoalContribution[] {
  return [...contributions].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.createdAt.localeCompare(a.createdAt)
  })
}
