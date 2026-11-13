import { useId } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { transitions } from '@/lib/motion'
import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
  count?: number
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Array<SegmentedOption<T>>
  size?: 'sm' | 'md'
  className?: string
  ariaLabel?: string
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const layoutId = `segmented-${useId().replace(/:/g, '')}`
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'no-scrollbar inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-[15px] border border-line bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'focus-ring relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[11px] font-semibold transition-colors duration-150',
              size === 'sm' ? 'h-8 px-2.5 text-[0.6875rem]' : 'h-9 px-3 text-xs',
              active ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-[11px] border border-line bg-surface shadow-[0_2px_8px_-3px_rgba(20,68,102,0.2)]"
                transition={transitions.spring}
              />
            ) : null}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {Icon ? <Icon size={14} strokeWidth={2.1} aria-hidden="true" /> : null}
              {option.label}
              {typeof option.count === 'number' ? (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-px text-[0.625rem] leading-4',
                    active ? 'bg-brand/10 text-brand' : 'bg-surface-3 text-ink-3',
                  )}
                >
                  {option.count}
                </span>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
