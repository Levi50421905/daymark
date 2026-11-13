import { ChartLegend, DonutChart } from '@/components/charts/DonutChart'
import { Card, SectionHeading } from '@/components/ui/Card'
import { formatMoney } from '@/lib/format'
import type { ShoppingCategoryGroup } from '@/features/shopping/lib/shopping-helpers'
import type { CurrencyCode } from '@/types/domain'

interface CategoryBreakdownCardProps {
  groups: ShoppingCategoryGroup[]
  currency: CurrencyCode
}

export function CategoryBreakdownCard({ groups, currency }: CategoryBreakdownCardProps) {
  const data = groups
    .map((group) => ({ label: group.category, value: group.estimatedSubtotal, color: group.color }))
    .filter((entry) => entry.value > 0)
  const total = data.reduce((sum, entry) => sum + entry.value, 0)

  if (data.length === 0) return null

  return (
    <Card padding="sm">
      <SectionHeading title="Sebaran estimasi" description="Perkiraan belanja per kategori." />
      <div className="mt-4 flex flex-col items-center gap-4">
        <DonutChart
          data={data}
          size={118}
          thickness={13}
          centerValue={
            <span className="number text-[0.8125rem] font-extrabold tracking-[-0.02em] text-ink">
              {formatMoney(total, currency, { compact: true })}
            </span>
          }
          centerLabel="Estimasi"
          ariaLabel={`Sebaran estimasi: ${data
            .map((entry) => `${entry.label} ${formatMoney(entry.value, currency)}`)
            .join(', ')}`}
        />
        <ChartLegend
          className="w-full min-w-0"
          items={data.map((entry) => ({
            label: entry.label,
            value: formatMoney(entry.value, currency, { compact: true }),
            color: entry.color,
            percentage: total > 0 ? (entry.value / total) * 100 : 0,
          }))}
        />
      </div>
    </Card>
  )
}
