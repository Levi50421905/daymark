import { AnimatePresence, motion } from 'framer-motion'
import { Boxes, Pencil, Plus, RotateCcw, SearchX, Trash2 } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { getInventoryCategoryMeta, getInventoryStatus } from '@/lib/calc'
import { formatDateMedium } from '@/lib/dates'
import { formatQuantity } from '@/lib/format'
import { transitions } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { InventoryItem } from '@/types/domain'
import { InventoryStatusBadge } from './InventoryStatusBadge'
import { QuantityStepper } from './QuantityStepper'
import { expiryLabel, expiryTextClass } from '../lib/stock'

interface StockListProps {
  items: InventoryItem[]
  totalCount: number
  hasFilters: boolean
  today: string
  onAddItem: () => void
  onEditItem: (item: InventoryItem) => void
  onDeleteItem: (item: InventoryItem) => void
  onAdjustQuantity: (item: InventoryItem, delta: number) => void
  onResetFilters: () => void
}

interface StockRow {
  item: InventoryItem
  category: ReturnType<typeof getInventoryCategoryMeta>
  status: ReturnType<typeof getInventoryStatus>
  expiry: string
}

export function StockList({
  items,
  totalCount,
  hasFilters,
  today,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onAdjustQuantity,
  onResetFilters,
}: StockListProps) {
  if (items.length === 0) {
    return (
      <Card padding="lg">
        <EmptyState
          compact={totalCount > 0}
          icon={totalCount > 0 ? SearchX : Boxes}
          title={totalCount > 0 ? 'Tidak ada barang yang cocok' : 'Persediaan masih kosong'}
          description={
            totalCount > 0
              ? 'Coba kata kunci lain, atau reset filter untuk melihat semua barang.'
              : 'Catat bahan makanan, bumbu, dan perlengkapan rumah agar stok serta tanggal kedaluwarsanya terpantau.'
          }
          action={
            totalCount > 0 ? (
              <Button variant="secondary" icon={RotateCcw} onClick={onResetFilters}>
                Reset filter
              </Button>
            ) : (
              <Button icon={Plus} onClick={onAddItem}>
                Tambah barang
              </Button>
            )
          }
        />
      </Card>
    )
  }

  const rows: StockRow[] = items.map((item) => ({
    item,
    category: getInventoryCategoryMeta(item.category),
    status: getInventoryStatus(item, today),
    expiry: expiryLabel(item, today),
  }))

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 pb-3 sm:px-5 sm:pt-5">
        <SectionHeading
          title="Daftar barang"
          description={
            hasFilters
              ? `${items.length} barang sesuai filter aktif.`
              : 'Diurutkan dari yang paling perlu perhatian.'
          }
        />
        <span className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[10px] font-bold text-ink-2 number">
          {items.length} barang
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full table-fixed text-left">
          <thead>
            <tr className="border-y border-line bg-surface-2/60 text-[9px] uppercase tracking-[0.12em] text-ink-3">
              <th scope="col" className="w-[33%] px-5 py-2.5 font-bold">
                Barang
              </th>
              <th scope="col" className="w-[20%] px-3 py-2.5 font-bold">
                Jumlah
              </th>
              <th scope="col" className="w-[15%] px-3 py-2.5 font-bold">
                Status
              </th>
              <th scope="col" className="w-[15%] px-3 py-2.5 font-bold">
                Kedaluwarsa
              </th>
              <th scope="col" className="w-[17%] px-5 py-2.5 text-right font-bold">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((row) => (
                <motion.tr
                  key={row.item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transitions.fast}
                  className="border-b border-line/70 transition-colors last:border-0 hover:bg-surface-2/60"
                >
                  <td className="px-5 py-3 align-middle">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <CategoryIcon icon={row.category.icon} color={row.category.color} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink">{row.item.name}</p>
                        <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] text-ink-3">
                          <span className="font-semibold" style={{ color: row.category.color }}>
                            {row.category.shortLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{row.item.location.trim() || 'Tanpa lokasi'}</span>
                        </p>
                        {row.item.note ? (
                          <p className="mt-0.5 truncate text-[9px] italic text-ink-3">
                            {row.item.note}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="flex flex-col items-start gap-1">
                      <QuantityStepper
                        itemName={row.item.name}
                        quantity={row.item.quantity}
                        unit={row.item.unit}
                        onAdjust={(delta) => onAdjustQuantity(row.item, delta)}
                      />
                      <span className="pl-1 text-[9px] font-medium text-ink-3">
                        min. {formatQuantity(row.item.minStock, row.item.unit)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <InventoryStatusBadge status={row.status} short />
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <p className="text-[11px] font-medium text-ink-2">
                      {row.item.expiresAt ? formatDateMedium(row.item.expiresAt) : '—'}
                    </p>
                    <p className={cn('mt-0.5 text-[9px] font-semibold', expiryTextClass(row.item, today))}>
                      {row.expiry}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        label={`Ubah ${row.item.name}`}
                        icon={Pencil}
                        size="sm"
                        onClick={() => onEditItem(row.item)}
                      />
                      <IconButton
                        label={`Hapus ${row.item.name}`}
                        icon={Trash2}
                        size="sm"
                        variant="danger"
                        onClick={() => onDeleteItem(row.item)}
                      />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-line md:hidden">
        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <motion.div
              key={row.item.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={transitions.fast}
              className="px-4 py-3.5"
            >
              <div className="flex items-start gap-2.5">
                <CategoryIcon icon={row.category.icon} color={row.category.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[13px] font-bold leading-snug text-ink">{row.item.name}</p>
                    <InventoryStatusBadge status={row.status} short />
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-ink-3">
                    <span className="font-semibold" style={{ color: row.category.color }}>
                      {row.category.shortLabel}
                    </span>
                    {' · '}
                    {row.item.location.trim() || 'Tanpa lokasi'}
                  </p>
                  {row.item.note ? (
                    <p className="mt-0.5 line-clamp-1 text-[10px] italic text-ink-3">{row.item.note}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <QuantityStepper
                    itemName={row.item.name}
                    quantity={row.item.quantity}
                    unit={row.item.unit}
                    onAdjust={(delta) => onAdjustQuantity(row.item, delta)}
                  />
                  <span className="pl-1 text-[9px] font-medium text-ink-3">
                    min. {formatQuantity(row.item.minStock, row.item.unit)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-ink-2">
                      {row.item.expiresAt ? formatDateMedium(row.item.expiresAt) : 'Tanpa kedaluwarsa'}
                    </p>
                    <p className={cn('text-[9px] font-semibold', expiryTextClass(row.item, today))}>
                      {row.expiry}
                    </p>
                  </div>
                  <IconButton
                    label={`Ubah ${row.item.name}`}
                    icon={Pencil}
                    size="md"
                    variant="secondary"
                    onClick={() => onEditItem(row.item)}
                  />
                  <IconButton
                    label={`Hapus ${row.item.name}`}
                    icon={Trash2}
                    size="md"
                    variant="danger"
                    onClick={() => onDeleteItem(row.item)}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  )
}
