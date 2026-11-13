import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { transitions } from '@/lib/motion'
import { motion } from 'framer-motion'

interface RatingPickerProps {
  value: number | null
  onChange?: (value: number | null) => void
  readOnly?: boolean
  size?: 'sm' | 'md'
  className?: string
  label?: string
}

const SIZES = { sm: 14, md: 19 }

/** Five calm stars. Optional rating: click the active star again to clear it. */
export function RatingPicker({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  className,
  label,
}: RatingPickerProps) {
  const filled = value ?? 0
  const iconSize = SIZES[size]

  if (readOnly) {
    return (
      <span
        className={cn('inline-flex items-center gap-0.5', className)}
        role="img"
        aria-label={label ?? `Rating ${value ?? 0} dari 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={iconSize}
            strokeWidth={2}
            className={cn(
              star <= filled ? 'fill-warning text-warning' : 'fill-transparent text-line-strong',
            )}
            aria-hidden="true"
          />
        ))}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span role="group" aria-label={label ?? 'Rating evaluasi'}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star === value
          return (
            <motion.button
              key={star}
              type="button"
              onClick={() => onChange?.(active ? null : star)}
              aria-label={active ? `Hapus rating ${star} bintang` : `Beri rating ${star} dari 5`}
              aria-pressed={star <= filled}
              whileTap={{ scale: 0.86 }}
              transition={transitions.springSnappy}
              className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-surface-2"
            >
              <Star
                size={22}
                strokeWidth={2}
                className={cn(
                  'transition-colors',
                  star <= filled ? 'fill-warning text-warning' : 'fill-transparent text-line-strong',
                )}
                aria-hidden="true"
              />
            </motion.button>
          )
        })}
      </span>
      {value !== null ? (
        <button
          type="button"
          onClick={() => onChange?.(null)}
          className="focus-ring ml-1 rounded-lg px-2 py-1 text-[0.6875rem] font-semibold text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink-2"
        >
          Hapus rating
        </button>
      ) : null}
    </span>
  )
}
