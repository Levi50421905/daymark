import { motion } from 'framer-motion'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'
import { formatMoney, formatQuantity } from '@/lib/format'
import { transitions } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { actualLineTotal, estimatedLineTotal, lineDifference } from '@/features/shopping/lib/shopping-helpers'
import type { CurrencyCode, ShoppingItem } from '@/types/domain'

interface ItemRowProps {
  item: ShoppingItem
  currency: CurrencyCode
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ItemRow({ item, currency, onToggle, onEdit, onDelete }: ItemRowProps) {
  const lineTotal = item.purchased ? actualLineTotal(item) : estimatedLineTotal(item)
  const unitPrice = item.purchased ? (item.actualPrice ?? item.estimatedPrice) : item.estimatedPrice
  const difference = lineDifference(item)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: transitions.fast }}
      transition={transitions.fast}
      className={cn(
        'group/item px-3 py-2.5 transition-colors duration-200 sm:px-4',
        item.purchased && 'bg-surface-2/70',
      )}
    >
      <div className="flex items-start gap-1.5 sm:gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={item.purchased}
          aria-label={item.purchased ? `Tandai ${item.name} belum dibeli` : `Tandai ${item.name} sudah dibeli`}
          onClick={onToggle}
          className="focus-ring -ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:-ml-1.5"
        >
          <span
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors duration-200',
              item.purchased
                ? 'border-brand bg-brand text-white'
                : 'border-line-strong bg-surface text-transparent group-hover/item:border-brand/60',
            )}
          >
            <motion.span
              animate={{ scale: item.purchased ? 1 : 0.4, opacity: item.purchased ? 1 : 0 }}
              transition={transitions.springSnappy}
            >
              <Check size={13} strokeWidth={3.2} aria-hidden="true" />
            </motion.span>
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={cn(
                'min-w-0 break-words text-sm font-semibold leading-snug text-ink transition-colors duration-200',
                item.purchased && 'text-ink-3 line-through decoration-ink-3/50',
              )}
            >
              {item.name}
            </p>
            <div className="shrink-0 text-right">
              <p className={cn('number text-sm font-bold leading-snug', item.purchased ? 'text-ink-2' : 'text-ink')}>
                {formatMoney(lineTotal, currency)}
              </p>
              <p className="text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                {item.purchased ? 'aktual' : 'estimasi'}
              </p>
            </div>
          </div>

          <div className="mt-1 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[0.6875rem] leading-relaxed text-ink-3">
                <span className="font-semibold text-ink-2">{formatQuantity(item.qty, item.unit)}</span>
                <span className="mx-1" aria-hidden="true">
                  ·
                </span>
                {formatMoney(unitPrice, currency)} / satuan
              </p>
              {item.note ? <p className="mt-0.5 truncate text-[0.6875rem] leading-relaxed text-ink-3">{item.note}</p> : null}
              {item.purchased && difference !== 0 ? (
                <p
                  className={cn(
                    'mt-0.5 text-[0.625rem] font-semibold',
                    difference > 0 ? 'text-warning' : 'text-success',
                  )}
                >
                  {difference > 0 ? 'Lebih' : 'Hemat'} {formatMoney(Math.abs(difference), currency)} dari estimasi
                </p>
              ) : null}
            </div>

            <div className="-my-1.5 flex shrink-0 items-center">
              <IconButton
                icon={Pencil}
                label={`Ubah ${item.name}`}
                size="sm"
                onClick={onEdit}
                className="h-11 w-11 sm:h-8 sm:w-8"
              />
              <IconButton
                icon={Trash2}
                label={`Hapus ${item.name}`}
                size="sm"
                variant="danger"
                onClick={onDelete}
                className="h-11 w-11 sm:h-8 sm:w-8"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.li>
  )
}
