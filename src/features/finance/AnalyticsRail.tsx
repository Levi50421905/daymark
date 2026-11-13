import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ChartLine, ChartPie } from 'lucide-react'
import {
  clipRangeToToday,
  getCategoryTotals,
  getDailyTrend,
  getSavingsOverview,
  type MonthSummary,
} from '@/lib/calc'
import {
  ChartLegend,
  DonutChart,
  type ChartLegendItem,
  type DonutDatum,
} from '@/components/charts/DonutChart'
import { TrendChart } from '@/components/charts/TrendChart'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { SectionHeading } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { MoneyText } from '@/components/ui/MoneyText'
import { ProgressBar } from '@/components/ui/Progress'
import { formatDateMedium, formatMonthLabel } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { fadeUp } from '@/lib/motion'
import type { AppData } from '@/types/domain'
import { compactMoney, monthTickLabel } from './finance-utils'

interface AnalyticsRailProps {
  data: AppData
  month: string
  summary: MonthSummary
  onOpenGoals: () => void
}

/**
 * Desktop side rail: spending distribution, daily trend and a tiny savings peek.
 * On narrow screens it stacks below the active tab.
 */
export function AnalyticsRail({ data, month, summary, onOpenGoals }: AnalyticsRailProps) {
  const currency = data.settings.currency
  const categoryTotals = useMemo(
    () => getCategoryTotals(data, summary.range, 'expense'),
    [data, summary.range],
  )
  const donutData: DonutDatum[] = useMemo(
    () =>
      categoryTotals.map((item) => ({
        label: item.category.name,
        value: item.amount,
        color: item.color,
      })),
    [categoryTotals],
  )
  const legendItems: ChartLegendItem[] = useMemo(
    () =>
      categoryTotals.map((item) => ({
        label: item.category.name,
        color: item.color,
        value: compactMoney(item.amount, currency),
        percentage: item.percentage,
      })),
    [categoryTotals, currency],
  )

  const trendRange = useMemo(() => clipRangeToToday(summary.range), [summary.range])
  const dailyTrend = useMemo(() => getDailyTrend(data, trendRange), [data, trendRange])
  const trendPoints = useMemo(
    () => dailyTrend.map((point) => ({ label: monthTickLabel(point.date), value: point.expense })),
    [dailyTrend],
  )
  const trendTotal = useMemo(
    () => dailyTrend.reduce((total, point) => total + point.expense, 0),
    [dailyTrend],
  )
  const average = dailyTrend.length > 0 ? trendTotal / dailyTrend.length : 0
  const peak = useMemo(
    () =>
      dailyTrend.reduce<{ date: string; expense: number } | null>(
        (best, point) => (!best || point.expense > best.expense ? { date: point.date, expense: point.expense } : best),
        null,
      ),
    [dailyTrend],
  )
  const savings = useMemo(() => getSavingsOverview(data), [data])
  const donutLabel = `Distribusi pengeluaran ${formatMonthLabel(month)}: ${categoryTotals
    .slice(0, 6)
    .map((item) => `${item.category.name} ${formatMoney(item.amount, currency)}`)
    .join(', ')}`

  return (
    <aside className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="surface-card h-full p-4 sm:p-5">
          <SectionHeading
            title="Distribusi pengeluaran"
            description={formatMonthLabel(month)}
            icon={<ChartPie size={16} aria-hidden="true" />}
          />
          {summary.expense > 0 ? (
            <>
              <div className="mt-4 flex justify-center">
                <DonutChart
                  data={donutData}
                  size={168}
                  thickness={16}
                  ariaLabel={donutLabel}
                  centerValue={
                    <span className="text-sm font-extrabold">
                      {formatMoney(summary.expense, currency, { compact: true })}
                    </span>
                  }
                  centerLabel="Pengeluaran"
                />
              </div>
              <ChartLegend items={legendItems} limit={5} className="mt-4" />
            </>
          ) : (
            <EmptyState
              compact
              icon={ChartPie}
              title="Belum ada pengeluaran"
              description="Catat transaksi pertama bulan ini untuk melihat ke mana uang pergi."
            />
          )}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <div className="surface-card h-full p-4 sm:p-5">
          <SectionHeading
            title="Tren pengeluaran"
            description="Pengeluaran harian bulan ini"
            icon={<ChartLine size={16} aria-hidden="true" />}
          />
          {trendTotal > 0 ? (
            <>
              <div className="mt-4">
                <TrendChart
                  data={trendPoints}
                  height={148}
                  color="var(--c-peach)"
                  valueFormat={(value) => formatMoney(value, currency, { compact: true })}
                  ariaLabel={`Tren pengeluaran harian ${formatMonthLabel(month)}`}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="surface-muted px-2.5 py-2">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                    Rata-rata / hari
                  </p>
                  <p className="mt-0.5 text-xs font-extrabold text-ink">
                    <MoneyText amount={average} currency={currency} compact />
                  </p>
                </div>
                <div className="surface-muted px-2.5 py-2">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                    Hari tertinggi
                  </p>
                  <p className="mt-0.5 text-xs font-extrabold text-ink">
                    <MoneyText amount={peak?.expense ?? 0} currency={currency} compact />
                  </p>
                  <p className="text-[0.625rem] font-medium text-ink-3">
                    {peak ? formatDateMedium(peak.date) : '—'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              compact
              icon={ChartLine}
              title="Belum ada tren"
              description="Grafik muncul setelah ada pengeluaran di bulan ini."
            />
          )}
        </div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="sm:col-span-2 xl:col-span-1"
      >
        <div className="surface-card h-full p-4 sm:p-5">
          <SectionHeading
            title="Target tabungan"
            description={
              savings.goals.length > 0
                ? `${savings.goals.length} target sedang berjalan`
                : 'Belum ada target'
            }
            action={
              <Button size="sm" variant="ghost" iconRight={ArrowRight} onClick={onOpenGoals}>
                Kelola
              </Button>
            }
          />
          {savings.goals.length === 0 ? (
            <div className="mt-3">
              <p className="text-[0.6875rem] leading-relaxed text-ink-3">
                Mulai dari satu tujuan kecil, lalu tambah setoran kapan pun kamu bisa.
              </p>
              <Button size="sm" variant="soft" iconRight={ArrowRight} className="mt-2" onClick={onOpenGoals}>
                Lihat target
              </Button>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {savings.goals.slice(0, 2).map((item) => (
                <li key={item.goal.id}>
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon icon={item.goal.icon} color={item.goal.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-bold text-ink">{item.goal.name}</p>
                        <span className="number shrink-0 text-[0.625rem] font-bold text-ink-3">
                          {Math.round(item.progress)}%
                        </span>
                      </div>
                      <ProgressBar
                        value={item.progress}
                        color={item.goal.color}
                        height="xs"
                        className="mt-1.5"
                      />
                      <p className="mt-1 text-[0.625rem] font-medium text-ink-3">
                        {compactMoney(item.saved, currency)} /{' '}
                        {compactMoney(item.goal.targetAmount, currency)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </aside>
  )
}
