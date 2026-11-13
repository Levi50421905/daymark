import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'

export interface DonutDatum {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutDatum[]
  size?: number
  thickness?: number
  centerLabel?: ReactNode
  centerValue?: ReactNode
  className?: string
  ariaLabel?: string
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  }
}

function arcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polar(cx, cy, radius, startAngle)
  const end = polar(cx, cy, radius, endAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

export function DonutChart({
  data,
  size = 180,
  thickness = 18,
  centerLabel,
  centerValue,
  className,
  ariaLabel,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0)
  const gap = data.filter((item) => item.value > 0).length > 1 ? 2.4 : 0.01
  const radius = (size - thickness) / 2
  const center = size / 2
  const label = ariaLabel ?? data.map((item) => `${item.label}: ${formatNumber(item.value)}`).join(', ')
  const positive = data.filter((item) => item.value > 0)
  const slices = positive.map((item, index) => {
    const preceding = positive.slice(0, index).reduce((sum, entry) => sum + entry.value, 0)
    const startAngle = (preceding / total) * 360 + gap / 2
    const endAngle = ((preceding + item.value) / total) * 360 - gap / 2
    return { item, startAngle, endAngle }
  })

  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-0">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--c-surface-3)"
          strokeWidth={thickness}
        />
        {total > 0
          ? slices.map(({ item, startAngle, endAngle }, index) => (
              <motion.path
                key={`${item.label}-${index}`}
                d={arcPath(center, center, radius, startAngle, Math.max(startAngle + 0.2, endAngle))}
                fill="none"
                stroke={item.color}
                strokeWidth={thickness}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.75, delay: 0.12 + index * 0.07, ease: [0.22, 0.8, 0.28, 1] }}
              />
            ))
          : null}
      </svg>
      {centerValue || centerLabel ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
          {centerValue ? (
            <div className="text-[1.05rem] font-extrabold leading-tight tracking-[-0.03em] text-ink">
              {centerValue}
            </div>
          ) : null}
          {centerLabel ? (
            <div className="mt-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
              {centerLabel}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export interface ChartLegendItem {
  label: string
  value?: string
  color: string
  percentage?: number
}

export function ChartLegend({
  items,
  className,
  limit,
}: {
  items: ChartLegendItem[]
  className?: string
  limit?: number
}) {
  const visible = typeof limit === 'number' ? items.slice(0, limit) : items
  const hidden = typeof limit === 'number' ? Math.max(0, items.length - limit) : 0
  return (
    <ul className={cn('space-y-2.5', className)}>
      {visible.map((item) => (
        <li key={item.label} className="flex min-w-0 items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[4px]"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-2">{item.label}</span>
          {item.value ? <span className="number shrink-0 text-xs font-semibold text-ink">{item.value}</span> : null}
          {typeof item.percentage === 'number' ? (
            <span className="w-9 shrink-0 text-right text-[0.625rem] font-semibold tabular-nums text-ink-3">
              {Math.round(item.percentage)}%
            </span>
          ) : null}
        </li>
      ))}
      {hidden > 0 ? <li className="pl-5 text-[0.625rem] font-semibold text-ink-3">+{hidden} kategori lainnya</li> : null}
    </ul>
  )
}

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  children?: ReactNode
  className?: string
  ariaLabel?: string
}

export function CircularProgress({
  value,
  size = 68,
  strokeWidth = 6,
  color = 'var(--c-brand)',
  trackColor = 'var(--c-surface-3)',
  children,
  className,
  ariaLabel,
}: CircularProgressProps) {
  const circumference = 2 * Math.PI * ((size - strokeWidth) / 2)
  const safe = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))
  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - safe / 100) }}
          transition={{ duration: 0.9, ease: [0.22, 0.8, 0.28, 1] }}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
      ) : null}
    </div>
  )
}
