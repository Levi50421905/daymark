import type { ReactNode } from 'react'
import { LayoutGrid, RotateCcw, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DynamicIcon } from '@/components/ui/CategoryIcon'
import { INVENTORY_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  STOCK_STATUS_FILTERS,
  statusFilterCount,
  type StockCategoryFilter,
  type StockCounts,
  type StockStatusFilter,
} from '../lib/stock'

interface StockFiltersProps {
  query: string
  onQueryChange: (value: string) => void
  category: StockCategoryFilter
  onCategoryChange: (value: StockCategoryFilter) => void
  status: StockStatusFilter
  onStatusChange: (value: StockStatusFilter) => void
  counts: StockCounts
  resultCount: number
  hasFilters: boolean
  onReset: () => void
}

interface FilterChipProps {
  active: boolean
  onClick: () => void
  icon?: ReactNode
  count: number
  children: ReactNode
}

function FilterChip({ active, onClick, icon, count, children }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'focus-ring inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold transition-colors duration-150',
        active
          ? 'border-brand/30 bg-brand/10 text-brand'
          : 'border-line bg-surface-2 text-ink-3 hover:border-line-strong hover:text-ink',
      )}
    >
      {icon}
      {children}
      <span
        className={cn(
          'rounded-full px-1.5 py-px text-[9px] font-bold leading-4 number',
          active ? 'bg-brand/15 text-brand' : 'bg-surface-3 text-ink-3',
        )}
      >
        {count}
      </span>
    </button>
  )
}

export function StockFilters({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  counts,
  resultCount,
  hasFilters,
  onReset,
}: StockFiltersProps) {
  return (
    <Card padding="sm" className="p-3.5 sm:p-4">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Cari nama barang, lokasi, atau catatan…"
          aria-label="Cari barang"
          className="field h-11 pl-10 pr-10"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Bersihkan pencarian"
            className="focus-ring absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X size={15} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="w-[58px] shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] text-ink-3">
            Kategori
          </span>
          <FilterChip
            active={category === 'all'}
            onClick={() => onCategoryChange('all')}
            icon={<LayoutGrid size={12} aria-hidden="true" />}
            count={counts.total}
          >
            Semua
          </FilterChip>
          {INVENTORY_CATEGORIES.map((option) => (
            <FilterChip
              key={option.value}
              active={category === option.value}
              onClick={() => onCategoryChange(category === option.value ? 'all' : option.value)}
              icon={<DynamicIcon name={option.icon} size={12} aria-hidden="true" />}
              count={counts.byCategory[option.value]}
            >
              {option.shortLabel}
            </FilterChip>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="w-[58px] shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] text-ink-3">
            Status
          </span>
          {STOCK_STATUS_FILTERS.map((option) => {
            const Icon = option.icon
            return (
              <FilterChip
                key={option.value}
                active={status === option.value}
                onClick={() => onStatusChange(status === option.value ? 'all' : option.value)}
                icon={<Icon size={12} aria-hidden="true" />}
                count={statusFilterCount(counts, option.value)}
              >
                {option.label}
              </FilterChip>
            )
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        <p className="text-[11px] text-ink-3">
          Menampilkan{' '}
          <span className="font-bold text-ink-2 number">{resultCount}</span> dari{' '}
          <span className="font-semibold text-ink-2 number">{counts.total}</span> barang
        </p>
        {hasFilters ? (
          <Button size="sm" variant="ghost" icon={RotateCcw} onClick={onReset}>
            Reset
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
