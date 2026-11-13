import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  NotebookPen,
  PencilLine,
  SearchX,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { MoneyText } from '@/components/ui/MoneyText'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { formatDateRange, relativeTimeLabel } from '@/lib/dates'
import { listItem } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { RatingPicker } from '@/features/reviews/components/RatingPicker'
import {
  PERIOD_META,
  REVIEW_PERIOD_ORDER,
  countByPeriod,
  type PeriodFilter,
} from '@/features/reviews/review-helpers'
import type { CurrencyCode, Review } from '@/types/domain'

interface ReviewHistoryProps {
  reviews: Review[]
  currency: CurrencyCode
  onOpen: (review: Review) => void
  onEdit: (review: Review) => void
  onDelete: (review: Review) => void
  onNew: () => void
}

export function ReviewHistory({
  reviews,
  currency,
  onOpen,
  onEdit,
  onDelete,
  onNew,
}: ReviewHistoryProps) {
  const [filter, setFilter] = useState<PeriodFilter>('all')
  const counts = useMemo(() => countByPeriod(reviews), [reviews])
  const filtered = useMemo(
    () => (filter === 'all' ? reviews : reviews.filter((review) => review.period === filter)),
    [reviews, filter],
  )

  const filterOptions: Array<{ value: PeriodFilter; label: string; count: number }> = [
    { value: 'all', label: 'Semua', count: counts.all },
    ...REVIEW_PERIOD_ORDER.map((period) => ({
      value: period as PeriodFilter,
      label: PERIOD_META[period].label,
      count: counts[period],
    })),
  ]

  return (
    <Card padding="md" className="sm:p-6">
      <SectionHeading
        title="Riwayat evaluasi"
        description={
          reviews.length > 0
            ? `${reviews.length} refleksi tersimpan — buka kembali kapan pun kamu butuh konteks.`
            : 'Setiap refleksi yang kamu simpan akan muncul di sini.'
        }
        action={<Badge tone="neutral">{counts.all} catatan</Badge>}
      />

      {reviews.length > 0 ? (
        <div className="mt-3.5">
          <SegmentedControl<PeriodFilter>
            value={filter}
            onChange={setFilter}
            options={filterOptions}
            size="sm"
            ariaLabel="Filter riwayat berdasarkan periode"
            className="w-full sm:w-auto"
          />
        </div>
      ) : null}

      {reviews.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Belum ada evaluasi"
          description="Mulai dari satu catatan kecil. Evaluasi harian, mingguan, atau bulanan membantumu melihat pola."
          action={
            <Button icon={NotebookPen} onClick={onNew}>
              Mulai evaluasi
            </Button>
          }
          className="py-10"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          compact
          icon={SearchX}
          title={`Belum ada evaluasi ${filter === 'all' ? '' : PERIOD_META[filter].label.toLowerCase()}`}
          description="Coba lihat periode lain, atau mulailah menulis evaluasi baru."
          action={
            <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
              Tampilkan semua
            </Button>
          }
          className="py-8"
        />
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {filtered.map((review) => {
            const meta = PERIOD_META[review.period]
            const Icon = meta.icon
            const range = formatDateRange(review.periodStart, review.periodEnd)
            const preview = review.note || review.reflection || 'Tanpa catatan.'
            return (
              <motion.li key={review.id} layout variants={listItem} initial="hidden" animate="visible">
                <Card
                  padding="none"
                  className="group flex h-full flex-col overflow-hidden transition-colors hover:border-line-strong"
                >
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border"
                          style={{
                            color: meta.accent,
                            backgroundColor: `color-mix(in srgb, ${meta.accent} 12%, transparent)`,
                            borderColor: `color-mix(in srgb, ${meta.accent} 24%, transparent)`,
                          }}
                          aria-hidden="true"
                        >
                          <Icon size={17} strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-x-1.5 text-[0.8125rem] font-bold leading-tight text-ink">
                            {meta.label}
                            <span className="text-[0.6875rem] font-medium text-ink-3">·</span>
                            <span className="text-[0.6875rem] font-medium text-ink-3">{range}</span>
                          </p>
                          <p className="mt-0.5 text-[0.625rem] font-medium text-ink-3">
                            Dibuat {relativeTimeLabel(review.createdAt)}
                          </p>
                        </div>
                      </div>
                      <RatingPicker
                        readOnly
                        size="sm"
                        value={review.rating}
                        className="shrink-0 pt-0.5"
                      />
                    </div>

                    <p className="mt-2.5 line-clamp-2 min-h-[2.35rem] text-xs leading-relaxed text-ink-2">
                      {preview}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.6875rem] font-medium text-ink-3">
                      <span className="inline-flex items-center gap-1">
                        <ArrowUpRight size={11.5} strokeWidth={2.3} aria-hidden="true" />
                        <MoneyText amount={review.snapshot.totalExpense} currency={currency} />
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CheckCheck size={11.5} strokeWidth={2.3} aria-hidden="true" />
                        <span className="number">
                          {review.snapshot.tasksCompleted}/{review.snapshot.tasksTotal}
                        </span>{' '}
                        tugas
                      </span>
                      <span
                        className={cn(
                          'rounded-full border px-1.5 py-px text-[0.625rem] font-semibold',
                          review.snapshot.totalExpense > review.snapshot.budgetAmount &&
                            review.snapshot.budgetAmount > 0
                            ? 'border-danger/20 bg-danger/8 text-danger'
                            : 'border-line bg-surface-2 text-ink-3',
                        )}
                      >
                        {review.snapshot.budgetAmount > 0
                          ? review.snapshot.totalExpense > review.snapshot.budgetAmount
                            ? 'Lewat anggaran'
                            : 'Dalam anggaran'
                          : 'Anggaran belum diatur'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-2/55 px-2.5 py-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      iconRight={ArrowRight}
                      onClick={() => onOpen(review)}
                      aria-label={`Buka evaluasi ${meta.label.toLowerCase()} ${range}`}
                    >
                      Buka
                    </Button>
                    <div className="flex items-center gap-0.5">
                      <IconButton
                        label={`Edit evaluasi ${meta.label.toLowerCase()} ${range}`}
                        icon={PencilLine}
                        size="sm"
                        onClick={() => onEdit(review)}
                      />
                      <IconButton
                        label={`Hapus evaluasi ${meta.label.toLowerCase()} ${range}`}
                        icon={Trash2}
                        size="sm"
                        variant="danger"
                        onClick={() => onDelete(review)}
                      />
                    </div>
                  </div>
                </Card>
              </motion.li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
