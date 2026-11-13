import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { fadeUp, transitions } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  secondaryAction?: ReactNode
  compact?: boolean
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className={cn(
        'flex flex-col items-center justify-center px-5 text-center',
        compact ? 'py-8' : 'py-14',
        className,
      )}
    >
      <div className={cn('relative mb-4', compact ? 'h-14 w-14' : 'h-20 w-20')}>
        <div className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-sky/20 via-brand/10 to-lavender/20 blur-[1px]" />
        <div className="absolute inset-[3px] flex items-center justify-center rounded-[23px] border border-line/80 bg-surface/80 backdrop-blur-sm">
          <motion.span
            initial={{ scale: 0.85, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ ...transitions.springSoft, delay: 0.06 }}
            className="text-brand"
          >
            <Icon size={compact ? 22 : 30} strokeWidth={1.8} aria-hidden="true" />
          </motion.span>
        </div>
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-mint/80" />
        <span className="absolute -bottom-1 left-1 h-1.5 w-1.5 rounded-full bg-lavender/70" />
      </div>
      <h3 className={cn('font-bold tracking-tight text-ink', compact ? 'text-sm' : 'text-base')}>{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink-3">{description}</p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </motion.div>
  )
}
