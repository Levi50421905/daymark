import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { DynamicIcon } from '@/components/ui/CategoryIcon'
import { cn } from '@/lib/utils'

interface WidgetShellProps {
  title: string
  description?: string
  icon: string
  iconColor?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  headerClassName?: string
}

export function WidgetShell({
  title,
  description,
  icon,
  iconColor = '#2EC4B6',
  action,
  children,
  className,
  bodyClassName,
  headerClassName,
}: WidgetShellProps) {
  return (
    <Card padding="none" className={cn('flex h-full flex-col overflow-hidden', className)}>
      <div className={cn('flex items-start justify-between gap-3 px-5 pb-3 pt-5', headerClassName)}>
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border"
            style={{
              color: iconColor,
              backgroundColor: `color-mix(in srgb, ${iconColor} 10%, transparent)`,
              borderColor: `color-mix(in srgb, ${iconColor} 16%, transparent)`,
            }}
            aria-hidden="true"
          >
            <DynamicIcon name={icon} size={15} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-[0.9375rem] font-bold tracking-[-0.02em] text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ink-3">{description}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn('min-h-0 flex-1 px-5 pb-5', bodyClassName)}>{children}</div>
    </Card>
  )
}

export function WidgetLink({ to, label = 'Lihat semua' }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      className="focus-ring inline-flex items-center gap-0.5 rounded-md text-[0.6875rem] font-bold text-brand transition-opacity hover:opacity-75"
    >
      {label}
      <ChevronRight size={13} aria-hidden="true" />
    </Link>
  )
}

export function MiniStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  tone?: 'neutral' | 'mint' | 'rose' | 'sky' | 'lavender'
}) {
  const tones = {
    neutral: 'text-ink',
    mint: 'text-success',
    rose: 'text-danger',
    sky: 'text-sky',
    lavender: 'text-lavender',
  }
  return (
    <div className="min-w-0">
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-3">{label}</p>
      <div className={cn('number mt-1 truncate text-sm font-extrabold', tones[tone])}>{value}</div>
    </div>
  )
}
