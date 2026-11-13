import { Badge } from '@/components/ui/Badge'
import type { InventoryStatus } from '@/types/domain'
import { INVENTORY_STATUS_META } from '../lib/stock'
import { cn } from '@/lib/utils'

interface InventoryStatusBadgeProps {
  status: InventoryStatus
  /** Compact label for dense rows (Menipis, Habis, Segera, Lewat). */
  short?: boolean
  className?: string
}

export function InventoryStatusBadge({ status, short = false, className }: InventoryStatusBadgeProps) {
  const meta = INVENTORY_STATUS_META[status]
  const Icon = meta.icon
  return (
    <Badge tone={meta.tone} className={cn('whitespace-nowrap', className)}>
      <Icon size={11} strokeWidth={2.2} aria-hidden="true" />
      {short ? meta.shortLabel : meta.label}
    </Badge>
  )
}
