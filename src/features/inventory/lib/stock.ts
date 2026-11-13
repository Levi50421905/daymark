import type { LucideIcon } from 'lucide-react'
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  LayoutGrid,
  PackageX,
  TrendingDown,
  TriangleAlert,
} from 'lucide-react'
import type { BadgeTone } from '@/components/ui/Badge'
import { getInventoryCategoryMeta, getInventoryStatus } from '@/lib/calc'
import { daysUntil, formatDateMedium, todayISO } from '@/lib/dates'
import { formatQuantity } from '@/lib/format'
import type { InventoryCategory, InventoryItem, InventoryStatus } from '@/types/domain'

/** UI-only view of the stock status filter. `expiry` groups expiring + expired. */
export type StockStatusFilter = 'all' | 'attention' | 'low' | 'out' | 'expiry' | 'ok'
export type StockCategoryFilter = 'all' | InventoryCategory

export interface InventoryStatusMeta {
  label: string
  shortLabel: string
  description: string
  tone: BadgeTone
  icon: LucideIcon
}

export const INVENTORY_STATUS_META: Record<InventoryStatus, InventoryStatusMeta> = {
  ok: {
    label: 'Aman',
    shortLabel: 'Aman',
    description: 'Stok masih mencukupi.',
    tone: 'mint',
    icon: CheckCircle2,
  },
  low: {
    label: 'Stok menipis',
    shortLabel: 'Menipis',
    description: 'Sudah menyentuh stok minimum.',
    tone: 'amber',
    icon: TrendingDown,
  },
  out: {
    label: 'Stok habis',
    shortLabel: 'Habis',
    description: 'Perlu segera dibeli lagi.',
    tone: 'danger',
    icon: PackageX,
  },
  expiring: {
    label: 'Segera kedaluwarsa',
    shortLabel: 'Segera',
    description: 'Kedaluwarsa dalam tiga hari.',
    tone: 'peach',
    icon: CalendarClock,
  },
  expired: {
    label: 'Kedaluwarsa',
    shortLabel: 'Lewat',
    description: 'Sudah melewati tanggal kedaluwarsa.',
    tone: 'rose',
    icon: CircleAlert,
  },
}

/** Lower number = more urgent. Used to surface the right items first. */
const STATUS_SEVERITY: Record<InventoryStatus, number> = {
  out: 0,
  expired: 1,
  expiring: 2,
  low: 3,
  ok: 4,
}

export const STOCK_STATUS_FILTERS: Array<{
  value: StockStatusFilter
  label: string
  icon: LucideIcon
}> = [
  { value: 'all', label: 'Semua', icon: LayoutGrid },
  { value: 'attention', label: 'Perlu perhatian', icon: TriangleAlert },
  { value: 'low', label: 'Menipis', icon: TrendingDown },
  { value: 'out', label: 'Habis', icon: PackageX },
  { value: 'expiry', label: 'Kedaluwarsa', icon: CalendarClock },
  { value: 'ok', label: 'Aman', icon: CheckCircle2 },
]

export interface StockCounts {
  total: number
  ok: number
  low: number
  out: number
  expiring: number
  expired: number
  attention: number
  expiry: number
  byCategory: Record<InventoryCategory, number>
}

export function countStock(items: InventoryItem[], today = todayISO()): StockCounts {
  const counts: StockCounts = {
    total: items.length,
    ok: 0,
    low: 0,
    out: 0,
    expiring: 0,
    expired: 0,
    attention: 0,
    expiry: 0,
    byCategory: { frozen: 0, ingredients: 0, seasoning: 0, beverage: 0, household: 0 },
  }
  for (const item of items) {
    const status = getInventoryStatus(item, today)
    if (status === 'ok') {
      counts.ok += 1
    } else {
      counts.attention += 1
      counts[status] += 1
    }
    if (status === 'expiring' || status === 'expired') counts.expiry += 1
    counts.byCategory[item.category] += 1
  }
  return counts
}

export function statusFilterCount(counts: StockCounts, filter: StockStatusFilter): number {
  if (filter === 'all') return counts.total
  if (filter === 'attention') return counts.attention
  if (filter === 'expiry') return counts.expiry
  return counts[filter]
}

export function statusMatchesFilter(status: InventoryStatus, filter: StockStatusFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'attention') return status !== 'ok'
  if (filter === 'expiry') return status === 'expiring' || status === 'expired'
  return status === filter
}

export function matchesInventoryQuery(item: InventoryItem, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const category = getInventoryCategoryMeta(item.category)
  return [item.name, item.location, item.note, item.unit, category.label, category.shortLabel].some(
    (value) => value.toLowerCase().includes(needle),
  )
}

export function sortInventoryItems(items: InventoryItem[], today = todayISO()): InventoryItem[] {
  return [...items].sort((a, b) => {
    const severity =
      STATUS_SEVERITY[getInventoryStatus(a, today)] - STATUS_SEVERITY[getInventoryStatus(b, today)]
    if (severity !== 0) return severity
    if (a.expiresAt && b.expiresAt && a.expiresAt !== b.expiresAt) {
      return a.expiresAt.localeCompare(b.expiresAt)
    }
    if (a.expiresAt && !b.expiresAt) return -1
    if (!a.expiresAt && b.expiresAt) return 1
    return a.name.localeCompare(b.name, 'id')
  })
}

export function filterInventoryItems(
  items: InventoryItem[],
  options: {
    query: string
    category: StockCategoryFilter
    status: StockStatusFilter
    today?: string
  },
): InventoryItem[] {
  const today = options.today ?? todayISO()
  return sortInventoryItems(
    items.filter(
      (item) =>
        matchesInventoryQuery(item, options.query) &&
        (options.category === 'all' || item.category === options.category) &&
        statusMatchesFilter(getInventoryStatus(item, today), options.status),
    ),
    today,
  )
}

export function sortedAlerts(items: InventoryItem[], today = todayISO()): InventoryItem[] {
  return sortInventoryItems(
    items.filter((item) => getInventoryStatus(item, today) !== 'ok'),
    today,
  )
}

export function expiryLabel(item: InventoryItem, today = todayISO()): string {
  if (!item.expiresAt) return 'Tanpa kedaluwarsa'
  const days = daysUntil(item.expiresAt, today)
  if (days < 0) return `Lewat ${Math.abs(days)} hari`
  if (days === 0) return 'Hari ini'
  if (days === 1) return 'Besok'
  if (days <= 30) return `${days} hari lagi`
  return formatDateMedium(item.expiresAt)
}

export function expiryTextClass(item: InventoryItem, today = todayISO()): string {
  if (!item.expiresAt) return 'text-ink-3'
  const days = daysUntil(item.expiresAt, today)
  if (days < 0) return 'text-danger'
  if (days <= 3) return 'text-warning'
  return 'text-ink-3'
}

export function stockAlertDescription(item: InventoryItem, today = todayISO()): string {
  const status = getInventoryStatus(item, today)
  const expiresAt = item.expiresAt ?? today
  if (status === 'out') return 'Stok habis — segera restok.'
  if (status === 'low') {
    return `Sisa ${formatQuantity(item.quantity, item.unit)} · minimum ${formatQuantity(item.minStock, item.unit)}.`
  }
  if (status === 'expiring') {
    const days = daysUntil(expiresAt, today)
    return days <= 0
      ? 'Kedaluwarsa hari ini — pakai atau buang.'
      : `Kedaluwarsa ${days} hari lagi (${formatDateMedium(expiresAt)}).`
  }
  if (status === 'expired') {
    return `Lewat ${Math.abs(daysUntil(expiresAt, today))} hari dari tanggal kedaluwarsa.`
  }
  return `Sisa ${formatQuantity(item.quantity, item.unit)}.`
}

export function locationCounts(
  items: InventoryItem[],
  limit = 4,
): Array<{ location: string; count: number }> {
  const totals = new Map<string, number>()
  for (const item of items) {
    const location = item.location.trim() || 'Tanpa lokasi'
    totals.set(location, (totals.get(location) ?? 0) + 1)
  }
  return [...totals.entries()]
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count || a.location.localeCompare(b.location, 'id'))
    .slice(0, limit)
}

/** Normalise the free-form unit input, falling back to a friendly default. */
export function normaliseUnit(unit: string): string {
  return unit.trim() || 'pcs'
}

/** Sensible quick-adjust step so gram/ml stock is not changed one unit at a time. */
export function stockAdjustStep(unit: string): number {
  const normalised = unit.trim().toLowerCase()
  if (normalised === 'gram' || normalised === 'ml') return 10
  if (normalised === 'kg' || normalised === 'liter') return 0.5
  return 1
}
