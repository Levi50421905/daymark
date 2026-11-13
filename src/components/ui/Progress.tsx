import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { clamp } from '@/lib/utils'
import { transitions } from '@/lib/motion'

interface ProgressBarProps {
  value: number
  color?: string
  className?: string
  trackClassName?: string
  height?: 'xs' | 'sm' | 'md'
  striped?: boolean
}

const heights = { xs: 'h-1.5', sm: 'h-2', md: 'h-2.5' }

export function ProgressBar({
  value,
  color = 'var(--c-brand)',
  className,
  trackClassName,
  height = 'sm',
  striped = false,
}: ProgressBarProps) {
  const safe = clamp(Number.isFinite(value) ? value : 0, 0, 100)
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-surface-3',
        heights[height],
        trackClassName,
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full"
        style={{
          background: striped
            ? `repeating-linear-gradient(135deg, ${color} 0 8px, color-mix(in srgb, ${color} 78%, white) 8px 16px)`
            : color,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${safe}%` }}
        transition={transitions.springSoft}
      />
    </div>
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  ariaLabel?: string
  disabled?: boolean
  className?: string
}

export function Switch({ checked, onChange, label, description, ariaLabel, disabled, className }: SwitchProps) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? label ?? 'Aktifkan'}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'focus-ring relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200',
        checked ? 'border-transparent bg-brand' : 'border-line bg-surface-3',
        disabled && 'opacity-50',
      )}
    >
      <motion.span
        className="ml-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
        animate={{ x: checked ? 20 : 0 }}
        transition={transitions.springSnappy}
      />
    </button>
  )

  if (!label && !description) return <span className={className}>{control}</span>

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <span className="min-w-0">
        {label ? <span className="block text-sm font-semibold text-ink">{label}</span> : null}
        {description ? <span className="mt-0.5 block text-xs leading-relaxed text-ink-3">{description}</span> : null}
      </span>
      {control}
    </div>
  )
}
