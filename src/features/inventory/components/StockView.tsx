import { useMemo, useState } from 'react'
import { Boxes, CalendarClock, PackageOpen, Plus, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { todayISO } from '@/lib/dates'
import type { InventoryItem } from '@/types/domain'
import { StockAlertsCard, StockCategoryCard } from './StockAside'
import { StockFilters } from './StockFilters'
import { StockList } from './StockList'
import { StockSummary } from './StockSummary'
import {
  countStock,
  filterInventoryItems,
  type StockCategoryFilter,
  type StockStatusFilter,
} from '../lib/stock'

interface StockViewProps {
  inventory: InventoryItem[]
  onAddItem: () => void
  onEditItem: (item: InventoryItem) => void
  onDeleteItem: (item: InventoryItem) => void
  onAdjustQuantity: (item: InventoryItem, delta: number) => void
}

const EMPTY_STEPS = [
  {
    icon: PackageOpen,
    title: 'Catat barang',
    description: 'Lengkapi nama, jumlah, satuan, dan lokasi penyimpanan.',
  },
  {
    icon: TrendingDown,
    title: 'Atur stok minimum',
    description: 'Dapatkan peringatan otomatis saat stok mulai menipis.',
  },
  {
    icon: CalendarClock,
    title: 'Pantau kedaluwarsa',
    description: 'Tahu bahan mana yang harus dipakai atau dibuang lebih dulu.',
  },
]

export function StockView({
  inventory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onAdjustQuantity,
}: StockViewProps) {
  const today = todayISO()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<StockCategoryFilter>('all')
  const [status, setStatus] = useState<StockStatusFilter>('all')

  const counts = useMemo(() => countStock(inventory, today), [inventory, today])
  const filteredItems = useMemo(
    () => filterInventoryItems(inventory, { query, category, status, today }),
    [inventory, query, category, status, today],
  )
  const hasFilters = query.trim().length > 0 || category !== 'all' || status !== 'all'

  const resetFilters = () => {
    setQuery('')
    setCategory('all')
    setStatus('all')
  }

  if (counts.total === 0) {
    return (
      <Card padding="lg">
        <EmptyState
          icon={Boxes}
          title="Persediaan masih kosong"
          description="Mulai catat bahan makanan, bumbu, dan perlengkapan rumah. Daymark akan mengingatkan saat stok menipis atau mendekati kedaluwarsa."
          action={
            <Button icon={Plus} onClick={onAddItem}>
              Tambah barang pertama
            </Button>
          }
        />
        <div className="mx-auto mt-2 grid max-w-3xl gap-2 sm:grid-cols-3">
          {EMPTY_STEPS.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="surface-muted flex items-start gap-2.5 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon size={15} strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-ink">{step.title}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-ink-3">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <StockSummary counts={counts} active={status} onChange={setStatus} />

      <StockFilters
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        status={status}
        onStatusChange={setStatus}
        counts={counts}
        resultCount={filteredItems.length}
        hasFilters={hasFilters}
        onReset={resetFilters}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="order-1 min-w-0 xl:order-none xl:col-start-1 xl:row-start-1">
          <StockList
            items={filteredItems}
            totalCount={counts.total}
            hasFilters={hasFilters}
            today={today}
            onAddItem={onAddItem}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            onAdjustQuantity={onAdjustQuantity}
            onResetFilters={resetFilters}
          />
        </div>

        <div className="order-2 min-w-0 space-y-4 xl:order-none xl:col-start-2 xl:row-start-1">
          <StockAlertsCard
            alerts={inventory}
            today={today}
            onEditItem={onEditItem}
            onShowAttention={() => setStatus('attention')}
          />
          <StockCategoryCard
            items={inventory}
            category={category}
            onCategoryChange={setCategory}
          />
        </div>
      </div>
    </div>
  )
}
