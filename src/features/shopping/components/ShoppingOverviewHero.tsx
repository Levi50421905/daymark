import { motion } from 'framer-motion'
import { ShoppingBasket, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { CircularProgress } from '@/components/charts/DonutChart'
import { MoneyText } from '@/components/ui/MoneyText'
import { getShoppingOverview } from '@/lib/calc'
import { fadeUp } from '@/lib/motion'
import type { CurrencyCode, ShoppingList } from '@/types/domain'

interface ShoppingOverviewHeroProps {
  lists: ShoppingList[]
  currency: CurrencyCode
}

export function ShoppingOverviewHero({ lists, currency }: ShoppingOverviewHeroProps) {
  const overview = getShoppingOverview(lists)
  const progress = overview.itemCount > 0 ? (overview.purchasedCount / overview.itemCount) * 100 : 0
  const remainingCount = Math.max(0, overview.itemCount - overview.purchasedCount)
  const everythingDone = overview.activeCount > 0 && remainingCount === 0

  return (
    <motion.section
      variants={fadeUp}
      className="surface-card hero-gradient relative overflow-hidden p-5 sm:p-6"
      aria-label="Ringkasan daftar belanja"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/10 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-surface/70 px-2.5 py-1 text-[0.6875rem] font-bold text-brand">
              <ShoppingBasket size={13} strokeWidth={2} aria-hidden="true" />
              Ringkasan belanja
            </span>
            {everythingDone ? (
              <Badge tone="mint" dot>
                Semua barang sudah dibeli
              </Badge>
            ) : null}
            {overview.completedCount > 0 ? (
              <Badge tone="neutral">{overview.completedCount} daftar selesai</Badge>
            ) : null}
          </div>

          <p className="mt-4 text-xs font-semibold text-ink-3">Estimasi total daftar aktif</p>
          <p className="mt-1 text-[1.85rem] font-extrabold leading-none tracking-[-0.04em] text-ink sm:text-[2.25rem]">
            <MoneyText amount={overview.estimatedTotal} currency={currency} animated />
          </p>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-ink-3">
            {overview.activeCount === 0
              ? 'Tidak ada daftar aktif. Saatnya menyusun daftar belanja berikutnya.'
              : `${overview.activeCount} daftar aktif · ${remainingCount} barang belum dibeli.`}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="surface-glass rounded-2xl px-3 py-2">
              <p className="text-[0.5625rem] font-bold uppercase tracking-[0.14em] text-ink-3">Barang</p>
              <p className="number mt-0.5 text-sm font-extrabold text-ink">{overview.itemCount}</p>
            </div>
            <div className="surface-glass rounded-2xl px-3 py-2">
              <p className="text-[0.5625rem] font-bold uppercase tracking-[0.14em] text-ink-3">Dibeli</p>
              <p className="number mt-0.5 text-sm font-extrabold text-ink">{overview.purchasedCount}</p>
            </div>
            <div className="surface-glass rounded-2xl px-3 py-2">
              <p className="text-[0.5625rem] font-bold uppercase tracking-[0.14em] text-ink-3">Tersisa</p>
              <p className="number mt-0.5 text-sm font-extrabold text-ink">{remainingCount}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:flex-col lg:items-end lg:gap-2">
          <CircularProgress
            value={progress}
            size={116}
            strokeWidth={9}
            ariaLabel={`${overview.purchasedCount} dari ${overview.itemCount} barang sudah dibeli`}
          >
            <span className="number text-2xl font-extrabold tracking-[-0.03em] text-ink">{Math.round(progress)}%</span>
            <span className="mt-0.5 text-[0.5625rem] font-bold uppercase tracking-[0.16em] text-ink-3">Selesai</span>
          </CircularProgress>
          <p className="max-w-[9.5rem] text-xs leading-relaxed text-ink-3 lg:text-right">
            <Sparkles size={13} className="mr-1 inline text-brand" aria-hidden="true" />
            {remainingCount === 0 && overview.activeCount > 0
              ? 'Semua daftar aktif sudah lengkap.'
              : `${overview.purchasedCount} barang sudah masuk keranjang.`}
          </p>
        </div>
      </div>
    </motion.section>
  )
}
