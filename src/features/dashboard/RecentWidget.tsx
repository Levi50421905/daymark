import { Link } from 'react-router-dom'
import { ReceiptText } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { WidgetLink, WidgetShell } from '@/features/dashboard/WidgetShell'
import { sortTransactions } from '@/lib/calc'
import { formatMoney } from '@/lib/format'
import { formatDate, isToday } from '@/lib/dates'
import { useAppData } from '@/lib/store'
import { cn } from '@/lib/utils'

export function RecentWidget() {
  const data = useAppData()
  const currency = data.settings.currency
  const categories = new Map(data.categories.map((category) => [category.id, category]))
  const recent = sortTransactions(data.transactions).slice(0, 5)

  return (
    <WidgetShell
      title="Transaksi terbaru"
      description="Aktivitas keuangan yang baru tercatat"
      icon="ReceiptText"
      iconColor="#4E9FF3"
      action={<WidgetLink to="/finance" />}
    >
      {recent.length === 0 ? (
        <EmptyState
          compact
          icon={ReceiptText}
          title="Belum ada transaksi"
          description="Mulai catat pemasukan atau pengeluaran pertamamu."
          className="py-5"
          action={
            <Link to="/finance" className="text-[0.6875rem] font-bold text-brand hover:underline">
              Buka Finance →
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-line/70">
          {recent.map((transaction) => {
            const category = categories.get(transaction.categoryId)
            return (
              <li key={transaction.id}>
                <Link
                  to="/finance"
                  className="focus-ring group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-2"
                >
                  <CategoryIcon
                    icon={category?.icon ?? 'Shapes'}
                    color={category?.color ?? '#9AA8BC'}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-ink">
                      {transaction.note || category?.name || 'Transaksi'}
                    </p>
                    <p className="mt-0.5 truncate text-[0.625rem] font-medium text-ink-3">
                      {category?.name ?? 'Lainnya'} ·{' '}
                      {isToday(transaction.date) ? 'Hari ini' : formatDate(transaction.date, 'd MMM')}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'number shrink-0 text-xs font-extrabold',
                      transaction.type === 'income' ? 'text-success' : 'text-ink',
                    )}
                  >
                    {transaction.type === 'income' ? '+' : '−'}
                    {formatMoney(transaction.amount, currency, { compact: true })}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </WidgetShell>
  )
}
