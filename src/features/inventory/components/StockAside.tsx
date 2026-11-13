import { ArrowRight, BellRing, CheckCircle2, ChevronRight, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { CategoryIcon, DynamicIcon } from '@/components/ui/CategoryIcon'
import { ProgressBar } from '@/components/ui/Progress'
import { getInventoryCategoryMeta, getInventoryStatus } from '@/lib/calc'
import { INVENTORY_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { InventoryItem } from '@/types/domain'
import { InventoryStatusBadge } from './InventoryStatusBadge'
import {
  locationCounts,
  sortedAlerts,
  stockAlertDescription,
  type StockCategoryFilter,
} from '../lib/stock'

interface StockAlertsCardProps {
  alerts: InventoryItem[]
  today: string
  onEditItem: (item: InventoryItem) => void
  onShowAttention: () => void
}

export function StockAlertsCard({ alerts, today, onEditItem, onShowAttention }: StockAlertsCardProps) {
  const sorted = sortedAlerts(alerts, today)
  const visible = sorted.slice(0, 5)

  return (
    <Card padding="md">
      <SectionHeading
        title="Perlu perhatian"
        description={sorted.length > 0 ? 'Stok dan kedaluwarsa yang butuh tindakan.' : 'Stok dan kedaluwarsa terpantau.'}
        icon={<BellRing size={16} strokeWidth={1.9} aria-hidden="true" />}
        action={sorted.length > 0 ? <Badge tone="amber">{sorted.length}</Badge> : undefined}
      />

      {visible.length === 0 ? (
        <div className="surface-muted mt-3 flex items-start gap-2.5 p-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <CheckCircle2 size={15} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink">Semua stok aman</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-ink-3">
              Tidak ada stok menipis, habis, atau mendekati kedaluwarsa.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-2 space-y-0.5">
          {visible.map((item) => {
            const status = getInventoryStatus(item, today)
            const category = getInventoryCategoryMeta(item.category)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onEditItem(item)}
                  className="focus-ring flex w-full items-center gap-2.5 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-surface-2"
                >
                  <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[11px] font-semibold text-ink">{item.name}</span>
                      <InventoryStatusBadge status={status} short className="shrink-0" />
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 block truncate text-[10px]',
                        status === 'out' || status === 'expired'
                          ? 'text-danger'
                          : status === 'low' || status === 'expiring'
                            ? 'text-warning'
                            : 'text-ink-3',
                      )}
                    >
                      {stockAlertDescription(item, today)}
                    </span>
                  </span>
                  <ChevronRight size={13} className="shrink-0 text-ink-3" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {sorted.length > 5 ? (
        <Button
          size="sm"
          variant="ghost"
          fullWidth
          iconRight={ArrowRight}
          className="mt-1"
          onClick={onShowAttention}
        >
          Lihat semua peringatan
        </Button>
      ) : sorted.length > 0 ? (
        <Button size="sm" variant="ghost" fullWidth className="mt-1" onClick={onShowAttention}>
          Tampilkan di daftar
        </Button>
      ) : null}
    </Card>
  )
}

interface StockCategoryCardProps {
  items: InventoryItem[]
  category: StockCategoryFilter
  onCategoryChange: (value: StockCategoryFilter) => void
}

export function StockCategoryCard({ items, category, onCategoryChange }: StockCategoryCardProps) {
  const total = items.length
  const locations = locationCounts(items)

  return (
    <Card padding="md">
      <SectionHeading
        title="Komposisi kategori"
        description="Ketuk kategori untuk memfilter daftar."
        action={<span className="text-[10px] font-bold text-ink-3 number">{total}</span>}
      />
      <div className="mt-3 space-y-2.5">
        {INVENTORY_CATEGORIES.map((option) => {
          const count = items.filter((item) => item.category === option.value).length
          const percentage = total > 0 ? (count / total) * 100 : 0
          const active = category === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onCategoryChange(active ? 'all' : option.value)}
              aria-pressed={active}
              className={cn(
                'focus-ring block w-full rounded-xl px-1.5 py-1 text-left transition-colors',
                active ? 'bg-brand/[0.04]' : 'hover:bg-surface-2',
              )}
            >
              <span className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex min-w-0 items-center gap-1.5 font-semibold text-ink-2">
                  <DynamicIcon
                    name={option.icon}
                    size={12}
                    strokeWidth={2}
                    style={{ color: option.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{option.label}</span>
                </span>
                <span className={cn('number shrink-0 font-semibold', active ? 'text-brand' : 'text-ink-3')}>
                  {count}
                </span>
              </span>
              <ProgressBar
                value={active ? Math.max(percentage, 2) : percentage}
                color={option.color}
                height="xs"
                className="mt-1.5"
              />
            </button>
          )
        })}
      </div>

      {locations.length > 0 ? (
        <div className="mt-3 border-t border-line pt-3">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-ink-3">
            <MapPin size={11} aria-hidden="true" />
            Lokasi terbanyak
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {locations.map((entry) => (
              <Badge key={entry.location} tone="neutral">
                {entry.location} · {entry.count}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  )
}
