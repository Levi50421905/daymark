import { PieChart } from 'lucide-react'
import { ChartLegend, DonutChart } from '@/components/charts/DonutChart'
import { EmptyState } from '@/components/ui/EmptyState'
import { WidgetLink, WidgetShell } from '@/features/dashboard/WidgetShell'
import { getCategoryTotals } from '@/lib/calc'
import { formatMoney } from '@/lib/format'
import { getMonthRange, monthKeyOf, todayISO } from '@/lib/dates'
import { useAppData } from '@/lib/store'

export function SpendingWidget() {
  const data = useAppData()
  const currency = data.settings.currency
  const month = monthKeyOf(todayISO())
  const totals = getCategoryTotals(data, getMonthRange(month), 'expense')
  const total = totals.reduce((sum, item) => sum + item.amount, 0)
  const daysElapsed = new Date().getDate()
  const dailyAverage = total / Math.max(1, daysElapsed)
  const legend = totals.map((item) => ({
    label: item.category.name,
    value: formatMoney(item.amount, currency, { compact: true }),
    color: item.color,
    percentage: item.percentage,
  }))

  return (
    <WidgetShell
      title="Ke mana uangmu pergi"
      description="Distribusi pengeluaran bulan ini"
      icon="PieChart"
      iconColor="#8B8FF7"
      action={<WidgetLink to="/finance" />}
      className="min-h-[240px]"
      bodyClassName="flex flex-col justify-between"
    >
      {totals.length === 0 ? (
        <EmptyState
          compact
          icon={PieChart}
          title="Belum ada pengeluaran"
          description="Catat transaksi pertamamu untuk melihat distribusinya."
          className="py-5"
        />
      ) : (
        <>
          <div className="flex flex-1 flex-col items-center gap-4 sm:flex-row sm:items-center">
            <DonutChart
              data={totals.map((item) => ({ label: item.category.name, value: item.amount, color: item.color }))}
              size={138}
              thickness={16}
              centerValue={formatMoney(total, currency, { compact: true })}
              centerLabel="total"
              ariaLabel={`Distribusi pengeluaran: ${totals.map((item) => `${item.category.name} ${formatMoney(item.amount, currency, { compact: true })}`).join(', ')}`}
            />
            <ChartLegend items={legend} limit={4} className="w-full min-w-0 flex-1" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line/70 pt-3">
            <span className="text-[0.625rem] font-semibold text-ink-3">
              Rata-rata harian · {totals.length} kategori
            </span>
            <span className="number text-[0.6875rem] font-extrabold text-ink">
              {formatMoney(dailyAverage, currency, { compact: true })}
            </span>
          </div>
        </>
      )}
    </WidgetShell>
  )
}
