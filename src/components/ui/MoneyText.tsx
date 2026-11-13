import { formatMoney } from '@/lib/format'
import type { CurrencyCode } from '@/types/domain'
import { cn } from '@/lib/utils'
import { CountUp } from '@/components/ui/CountUp'

interface MoneyTextProps {
  amount: number
  currency: CurrencyCode
  className?: string
  compact?: boolean
  signed?: boolean
  animated?: boolean
  decimals?: boolean
}

export function MoneyText({
  amount,
  currency,
  className,
  compact = false,
  signed = false,
  animated = false,
  decimals,
}: MoneyTextProps) {
  const format = (value: number) => formatMoney(value, currency, { compact, signed, decimals })
  return animated ? (
    <CountUp value={amount} format={format} className={className} />
  ) : (
    <span className={cn('number', className)}>{format(amount)}</span>
  )
}

export function MoneyDelta({
  amount,
  currency,
  className,
}: {
  amount: number
  currency: CurrencyCode
  className?: string
}) {
  const positive = amount >= 0
  return (
    <span
      className={cn(
        'number text-xs font-bold',
        positive ? 'text-success' : 'text-danger',
        className,
      )}
    >
      {formatMoney(amount, currency, { signed: true, compact: true })}
    </span>
  )
}
