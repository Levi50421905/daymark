import { Minus, Plus } from 'lucide-react'
import { formatQuantity } from '@/lib/format'
import { cn } from '@/lib/utils'
import { stockAdjustStep } from '../lib/stock'

interface QuantityStepperProps {
  itemName: string
  quantity: number
  unit: string
  onAdjust: (delta: number) => void
  className?: string
}

/**
 * Compact −/+ control used on stock rows. The step adapts to the unit so
 * gram/ml stock moves in sensible increments. Adjustments persist through the
 * shared `adjustInventoryQuantity` action.
 */
export function QuantityStepper({ itemName, quantity, unit, onAdjust, className }: QuantityStepperProps) {
  const step = stockAdjustStep(unit)
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl border border-line bg-surface-2 p-0.5',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onAdjust(-step)}
        disabled={quantity <= 0}
        aria-label={`Kurangi ${formatQuantity(step, unit)} ${itemName}`}
        title={`Kurangi ${formatQuantity(step, unit)}`}
        className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[9px] text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink disabled:pointer-events-none disabled:opacity-35 sm:h-8 sm:w-8"
      >
        <Minus size={13} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <span className="min-w-[3rem] px-0.5 text-center text-[11px] font-bold text-ink number">
        {formatQuantity(quantity, unit)}
      </span>
      <button
        type="button"
        onClick={() => onAdjust(step)}
        aria-label={`Tambah ${formatQuantity(step, unit)} ${itemName}`}
        title={`Tambah ${formatQuantity(step, unit)}`}
        className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[9px] text-ink-2 transition-colors hover:bg-brand/10 hover:text-brand sm:h-8 sm:w-8"
      >
        <Plus size={13} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  )
}
