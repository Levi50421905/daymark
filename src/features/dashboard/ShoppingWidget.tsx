import { Link } from 'react-router-dom'
import { ShoppingBasket } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/Progress'
import { WidgetLink, WidgetShell } from '@/features/dashboard/WidgetShell'
import { getShoppingOverview, getShoppingTotals } from '@/lib/calc'
import { formatMoney } from '@/lib/format'
import { useAppData } from '@/lib/store'

export function ShoppingWidget() {
  const data = useAppData()
  const currency = data.settings.currency
  const overview = getShoppingOverview(data.shoppingLists)
  const lists = overview.active.slice(0, 2)

  return (
    <WidgetShell
      title="Daftar belanja"
      description={`${overview.activeCount} daftar aktif · ${overview.purchasedCount}/${overview.itemCount} item`}
      icon="ShoppingBasket"
      iconColor="#F4A261"
      action={<WidgetLink to="/shopping" label="Buka" />}
      className="min-h-[240px]"
    >
      {lists.length === 0 ? (
        <EmptyState
          compact
          icon={ShoppingBasket}
          title="Belum ada daftar aktif"
          description="Susun daftar belanja berikutnya agar tidak ada yang terlewat."
          className="py-5"
          action={
            <Link to="/shopping" className="text-[0.6875rem] font-bold text-brand hover:underline">
              Buat daftar →
            </Link>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {lists.map((list) => {
            const totals = getShoppingTotals(list)
            return (
              <Link
                key={list.id}
                to={`/shopping/${list.id}`}
                className="focus-ring block rounded-xl border border-line bg-surface-2/60 px-3 py-2.5 transition-colors hover:border-line-strong hover:bg-surface-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-ink">{list.name}</span>
                  <span className="number shrink-0 text-[0.625rem] font-bold text-ink-2">
                    {formatMoney(totals.estimatedTotal, currency, { compact: true })}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <ProgressBar
                    value={totals.progress}
                    height="xs"
                    color="var(--c-peach)"
                    className="flex-1"
                  />
                  <span className="shrink-0 text-[0.5625rem] font-semibold text-ink-3">
                    {totals.purchasedCount}/{totals.itemCount}
                  </span>
                </div>
              </Link>
            )
          })}
          <div className="flex items-center justify-between border-t border-line/70 pt-2.5">
            <span className="text-[0.625rem] font-medium text-ink-3">
              Estimasi total daftar aktif
            </span>
            <span className="number text-[0.6875rem] font-extrabold text-ink">
              {formatMoney(overview.estimatedTotal, currency, { compact: true })}
            </span>
          </div>
        </div>
      )}
    </WidgetShell>
  )
}
