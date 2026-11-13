import { AnimatePresence } from 'framer-motion'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Card } from '@/components/ui/Card'
import { formatMoney } from '@/lib/format'
import { ItemRow } from '@/features/shopping/components/ItemRow'
import type { ShoppingCategoryGroup } from '@/features/shopping/lib/shopping-helpers'
import type { CurrencyCode, ShoppingItem } from '@/types/domain'

interface CategoryGroupCardProps {
  group: ShoppingCategoryGroup
  currency: CurrencyCode
  onToggle: (item: ShoppingItem) => void
  onEdit: (item: ShoppingItem) => void
  onDelete: (item: ShoppingItem) => void
}

export function CategoryGroupCard({ group, currency, onToggle, onEdit, onDelete }: CategoryGroupCardProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3 sm:px-5">
        <CategoryIcon icon={group.icon} color={group.color} size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold tracking-[-0.01em] text-ink">{group.category}</h3>
          <p className="mt-0.5 text-[0.6875rem] text-ink-3">
            {group.items.length} barang · {group.purchasedCount} sudah dibeli
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="number text-xs font-bold text-ink">{formatMoney(group.estimatedSubtotal, currency)}</p>
          <p className="mt-0.5 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-3">Estimasi</p>
        </div>
      </div>
      <ul className="divide-y divide-line">
        <AnimatePresence initial={false}>
          {group.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              currency={currency}
              onToggle={() => onToggle(item)}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          ))}
        </AnimatePresence>
      </ul>
    </Card>
  )
}
