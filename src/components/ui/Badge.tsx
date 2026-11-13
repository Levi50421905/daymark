import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'sky'
  | 'mint'
  | 'lavender'
  | 'peach'
  | 'amber'
  | 'rose'
  | 'danger'
  | 'success'

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-3 text-ink-2 border-line',
  brand: 'bg-brand/10 text-brand border-brand/15',
  sky: 'bg-sky/12 text-sky border-sky/20',
  mint: 'bg-mint/12 text-emerald-600 border-mint/25 dark:text-mint',
  lavender: 'bg-lavender/12 text-lavender border-lavender/20',
  peach: 'bg-peach/15 text-orange-600 border-peach/25 dark:text-peach',
  amber: 'bg-warning/12 text-warning border-warning/20',
  rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20 dark:text-rose-300',
  danger: 'bg-danger/10 text-danger border-danger/20',
  success: 'bg-success/10 text-success border-success/20',
}

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
  dot?: boolean
  color?: string
}

export function Badge({ children, tone = 'neutral', className, dot = false, color }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold leading-5',
        !color && toneClasses[tone],
        className,
      )}
      style={
        color
          ? {
              color,
              borderColor: `color-mix(in srgb, ${color} 24%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${color} 11%, transparent)`,
            }
          : undefined
      }
    >
      {dot ? (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color ?? 'currentColor' }}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  )
}

export function StatusDot({
  tone = 'brand',
  pulse = false,
  className,
}: {
  tone?: 'brand' | 'success' | 'danger' | 'warning' | 'neutral'
  pulse?: boolean
  className?: string
}) {
  const colors = {
    brand: 'bg-brand',
    success: 'bg-success',
    danger: 'bg-danger',
    warning: 'bg-warning',
    neutral: 'bg-ink-3',
  }
  return (
    <span className={cn('relative flex h-2 w-2', className)} aria-hidden="true">
      {pulse ? (
        <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-40', colors[tone])} />
      ) : null}
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', colors[tone])} />
    </span>
  )
}
