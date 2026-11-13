import { useId, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'

export interface TrendPoint {
  label: string
  value: number
  meta?: string
}

interface TrendChartProps {
  data: TrendPoint[]
  height?: number
  color?: string
  valueFormat?: (value: number) => string
  ariaLabel?: string
  showAxis?: boolean
  className?: string
}

interface Point {
  x: number
  y: number
  value: number
  label: string
  meta?: string
}

function smoothPath(points: Point[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y} L ${points[0]!.x + 0.01} ${points[0]!.y}`
  let path = `M ${points[0]!.x} ${points[0]!.y}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]!
    const next = points[index + 1]!
    const middle = (current.x + next.x) / 2
    path += ` C ${middle} ${current.y}, ${middle} ${next.y}, ${next.x} ${next.y}`
  }
  return path
}

export function TrendChart({
  data,
  height = 160,
  color = 'var(--c-brand)',
  valueFormat = (value) => formatNumber(value),
  ariaLabel,
  showAxis = true,
  className,
}: TrendChartProps) {
  const gradientId = `trend-${useId().replace(/:/g, '')}`
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const width = 600
  const topPadding = 16
  const bottomPadding = showAxis ? 24 : 10
  const chartHeight = Math.max(20, height - topPadding - bottomPadding)
  const values = data.map((item) => Math.max(0, Number.isFinite(item.value) ? item.value : 0))
  const max = Math.max(...values, 1) * 1.08
  const points: Point[] = useMemo(
    () =>
      data.map((item, index) => {
        const x = data.length <= 1 ? width / 2 : (index / (data.length - 1)) * width
        const y = topPadding + chartHeight - (Math.max(0, item.value) / max) * chartHeight
        return { x, y, value: item.value, label: item.label, meta: item.meta }
      }),
    [data, max, chartHeight],
  )
  const linePath = smoothPath(points)
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1]!.x} ${height - bottomPadding} L ${points[0]!.x} ${height - bottomPadding} Z`
      : ''
  const active = activeIndex !== null ? points[activeIndex] : undefined
  const label = ariaLabel ?? `Grafik tren: ${data.map((item) => `${item.label} ${valueFormat(item.value)}`).join(', ')}`

  const handlePointer = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || data.length === 0) return
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const index = data.length <= 1 ? 0 : Math.round(ratio * (data.length - 1))
    setActiveIndex(index)
  }

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      <div
        className="relative w-full touch-none select-none"
        style={{ height }}
        role="img"
        aria-label={label}
        onPointerMove={(event) => handlePointer(event.clientX)}
        onPointerLeave={() => setActiveIndex(null)}
        onPointerDown={(event) => handlePointer(event.clientX)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.26" />
              <stop offset="70%" stopColor={color} stopOpacity="0.055" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={0}
              x2={width}
              y1={topPadding + chartHeight * ratio}
              y2={topPadding + chartHeight * ratio}
              stroke="var(--c-line)"
              strokeWidth="1"
              strokeDasharray="3 6"
              opacity={ratio === 1 ? 0.9 : 0.55}
            />
          ))}
          {areaPath ? (
            <motion.path
              d={areaPath}
              fill={`url(#${gradientId})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.1 }}
            />
          ) : null}
          {linePath ? (
            <motion.path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.85, ease: [0.22, 0.8, 0.28, 1] }}
            />
          ) : null}
          {active ? (
            <>
              <line
                x1={active.x}
                x2={active.x}
                y1={topPadding}
                y2={height - bottomPadding}
                stroke="var(--c-line-strong)"
                strokeWidth="1"
                strokeDasharray="3 4"
                vectorEffect="non-scaling-stroke"
              />
              <motion.circle
                cx={active.x}
                cy={active.y}
                r="4.5"
                fill="var(--c-surface)"
                stroke={color}
                strokeWidth="2.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                style={{ transformOrigin: `${active.x}px ${active.y}px` }}
              />
            </>
          ) : null}
        </svg>
        {active ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-xl border border-line bg-surface px-2.5 py-1.5 shadow-lift"
            style={{ left: `${(active.x / width) * 100}%`, top: `${(active.y / height) * 100}%` }}
          >
            <p className="text-[0.625rem] font-semibold text-ink-3">{active.label}</p>
            <p className="number text-xs font-extrabold text-ink">{valueFormat(active.value)}</p>
          </div>
        ) : null}
      </div>
      {showAxis ? (
        <div className="mt-1.5 flex justify-between text-[0.625rem] font-medium text-ink-3">
          <span>{data[0]?.label ?? ''}</span>
          <span>{data[Math.floor(data.length / 2)]?.label ?? ''}</span>
          <span>{data[data.length - 1]?.label ?? ''}</span>
        </div>
      ) : null}
    </div>
  )
}

export function Sparkline({
  values,
  color = 'var(--c-brand)',
  width = 120,
  height = 36,
  className,
}: {
  values: number[]
  color?: string
  width?: number
  height?: number
  className?: string
}) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const points = values.map((value, index) => ({
    x: values.length <= 1 ? width / 2 : (index / (values.length - 1)) * width,
    y: height - 4 - ((value - min) / range) * (height - 8),
    value,
    label: '',
  }))
  const path = smoothPath(points)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 0.8, 0.28, 1] }}
      />
    </svg>
  )
}
