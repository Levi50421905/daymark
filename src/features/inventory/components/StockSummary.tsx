import { motion } from 'framer-motion'
import { Boxes, CalendarClock, PackageX, TrendingDown, type LucideIcon } from 'lucide-react'
import { CountUp } from '@/components/ui/CountUp'
import { fadeUpSmall, staggerContainer, transitions } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { StockCounts, StockStatusFilter } from '../lib/stock'

interface StockSummaryProps {
  counts: StockCounts
  active: StockStatusFilter
  onChange: (filter: StockStatusFilter) => void
}

interface StatCard {
  filter: StockStatusFilter
  label: string
  value: number
  hint: string
  icon: LucideIcon
  tile: string
}

const CARD_RING = 'ring-2 ring-brand/40 ring-offset-2 ring-offset-bg'

export function StockSummary({ counts, active, onChange }: StockSummaryProps) {
  const cards: StatCard[] = [
    {
      filter: 'low',
      label: 'Stok menipis',
      value: counts.low,
      hint: 'Sudah menyentuh stok minimum',
      icon: TrendingDown,
      tile: 'bg-warning/12 text-warning',
    },
    {
      filter: 'out',
      label: 'Stok habis',
      value: counts.out,
      hint: 'Perlu segera dibeli lagi',
      icon: PackageX,
      tile: 'bg-danger/10 text-danger',
    },
    {
      filter: 'expiry',
      label: 'Kedaluwarsa',
      value: counts.expiry,
      hint: `${counts.expiring} segera · ${counts.expired} lewat`,
      icon: CalendarClock,
      tile: 'bg-peach/15 text-orange-600 dark:text-peach',
    },
  ]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer(0.05, 0.02)}
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      aria-label="Ringkasan persediaan"
    >
      <motion.button
        type="button"
        variants={fadeUpSmall}
        transition={transitions.spring}
        onClick={() => onChange('all')}
        aria-pressed={active === 'all'}
        className={cn(
          'brand-gradient focus-ring group relative grid grid-rows-[auto_1fr] overflow-hidden rounded-card border border-transparent p-4 text-left text-white shadow-[0_18px_42px_-24px_rgba(15,169,184,0.7)] transition-shadow hover:shadow-[0_22px_48px_-22px_rgba(15,169,184,0.8)]',
          active === 'all' && CARD_RING,
        )}
      >
        <span
          className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-md"
          aria-hidden="true"
        />
        <span className="flex items-center justify-between gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <Boxes size={17} strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="rounded-full bg-white/16 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white/85">
            {counts.attention > 0 ? `${counts.attention} perlu perhatian` : 'Semua aman'}
          </span>
        </span>
        <span className="relative mt-3 block">
          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
            Total barang
          </span>
          <span className="mt-0.5 block text-[1.6rem] font-extrabold leading-none number">
            <CountUp value={counts.total} />
          </span>
          <span className="mt-1 block truncate text-[10px] font-medium text-white/80">
            {counts.ok} aman · {counts.low + counts.out} perlu restok
          </span>
        </span>
      </motion.button>

      {cards.map((card) => {
        const Icon = card.icon
        const isActive = active === card.filter
        return (
          <motion.button
            key={card.filter}
            type="button"
            variants={fadeUpSmall}
            onClick={() => onChange(card.filter)}
            aria-pressed={isActive}
            className={cn(
              'surface-card focus-ring flex flex-col p-4 text-left transition-[border-color,background-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-lift',
              isActive && cn('border-brand/40 bg-brand/[0.03]', CARD_RING),
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', card.tile)}>
                <Icon size={17} strokeWidth={2} aria-hidden="true" />
              </span>
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors',
                  isActive ? 'bg-brand' : 'bg-line-strong',
                )}
                aria-hidden="true"
              />
            </span>
            <span className="mt-3 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
              {card.label}
            </span>
            <span className="mt-0.5 block text-[1.6rem] font-extrabold leading-none text-ink number">
              <CountUp value={card.value} />
            </span>
            <span className="mt-1 block truncate text-[10px] font-medium text-ink-3">{card.hint}</span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
