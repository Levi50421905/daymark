import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  leading?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, leading, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {leading}
        {eyebrow ? (
          <p className="mb-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
        ) : null}
        <h1 className="text-[1.65rem] font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-[2rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-3">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
