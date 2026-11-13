import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 sm:p-7',
}

export function Card({ interactive = false, padding = 'md', className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'surface-card',
        paddings[padding],
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

interface SectionHeadingProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  icon?: ReactNode
}

export function SectionHeading({ title, description, action, className, icon }: SectionHeadingProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {icon ? <span className="mt-0.5 text-ink-3">{icon}</span> : null}
        <div className="min-w-0">
          <h2 className="text-[0.9375rem] font-bold tracking-[-0.02em] text-ink">{title}</h2>
          {description ? <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
