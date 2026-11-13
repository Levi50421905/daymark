import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarCheck,
  CheckCheck,
  NotebookPen,
  Quote,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CountUp } from '@/components/ui/CountUp'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { formatDateRange } from '@/lib/dates'
import { fadeUp } from '@/lib/motion'
import { formatMoney, formatNumber } from '@/lib/format'
import { actions, useAppData } from '@/lib/store'
import { cn } from '@/lib/utils'
import { RatingPicker } from '@/features/reviews/components/RatingPicker'
import { ReviewComposer } from '@/features/reviews/components/ReviewComposer'
import { ReviewDetail } from '@/features/reviews/components/ReviewDetail'
import { ReviewHistory } from '@/features/reviews/components/ReviewHistory'
import {
  PERIOD_META,
  PERIOD_PROMPTS,
  averageRating,
  reviewsInCurrentMonth,
  sortReviews,
} from '@/features/reviews/review-helpers'
import type { Review } from '@/types/domain'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.'
}

export default function ReviewsPage() {
  const data = useAppData()
  const toast = useToast()

  const [composerOpen, setComposerOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [detailEditing, setDetailEditing] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const reviews = useMemo(() => sortReviews(data.reviews), [data.reviews])
  const latest = reviews[0] ?? null
  const activeReview = useMemo(
    () => (activeId ? data.reviews.find((review) => review.id === activeId) ?? null : null),
    [data.reviews, activeId],
  )
  const deleteTarget = useMemo(
    () => (deleteTargetId ? data.reviews.find((review) => review.id === deleteTargetId) ?? null : null),
    [data.reviews, deleteTargetId],
  )
  const ratedCount = reviews.filter((review) => review.rating !== null).length
  const avgRating = averageRating(reviews)
  const thisMonthCount = reviewsInCurrentMonth(reviews)
  const currency = data.settings.currency

  const openDetail = (review: Review, edit = false) => {
    setActiveId(review.id)
    setDetailEditing(edit)
  }

  const closeDetail = () => {
    setActiveId(null)
    setDetailEditing(false)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    try {
      actions.deleteReview(deleteTarget.id)
      toast({
        tone: 'success',
        title: 'Evaluasi dihapus',
        description: formatDateRange(deleteTarget.periodStart, deleteTarget.periodEnd),
      })
      if (activeId === deleteTarget.id) closeDetail()
      setDeleteTargetId(null)
    } catch (error) {
      toast({ tone: 'error', title: 'Gagal menghapus evaluasi', description: errorMessage(error) })
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Review"
        title="Evaluasi berkala"
        description="Lihat kembali ritme hidupmu dengan tenang — catat apa yang berjalan dan apa yang ingin diubah."
        actions={
          <Button icon={NotebookPen} onClick={() => setComposerOpen(true)}>
            Evaluasi baru
          </Button>
        }
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]"
      >
        <Card
          padding="lg"
          className="hero-gradient relative overflow-hidden border-brand/15"
        >
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/12 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 left-1/4 h-52 w-52 rounded-full bg-lavender/14 blur-3xl"
            aria-hidden="true"
          />

          {latest ? (
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <p className="inline-flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-brand">
                  <Sparkles size={13} strokeWidth={2.3} aria-hidden="true" />
                  Refleksi terakhir
                </p>
                <Badge tone={PERIOD_META[latest.period].tone} dot>
                  {PERIOD_META[latest.period].label}
                </Badge>
                <span className="text-[0.6875rem] font-semibold text-ink-3">
                  {formatDateRange(latest.periodStart, latest.periodEnd)}
                </span>
              </div>

              <h2 className="mt-3 line-clamp-3 max-w-2xl text-xl font-extrabold leading-snug tracking-[-0.03em] text-ink sm:text-[1.4rem]">
                {latest.note.trim() || latest.reflection.trim() || 'Evaluasi tanpa catatan.'}
              </h2>
              {latest.reflection.trim() ? (
                <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-ink-2">
                  {latest.reflection}
                </p>
              ) : null}

              <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                <RatingPicker readOnly value={latest.rating} size="sm" />
                <span className="text-[0.6875rem] font-semibold text-ink-3">
                  {latest.rating !== null ? `${latest.rating}/5` : 'Belum dinilai'}
                </span>
                <span className="hidden h-3 w-px bg-line-strong sm:block" aria-hidden="true" />
                <span className="text-[0.6875rem] font-medium text-ink-3">
                  {latest.snapshot.tasksCompleted}/{latest.snapshot.tasksTotal} tugas selesai
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-line/70 bg-surface/70 p-3 backdrop-blur-sm">
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                    <Wallet size={10} strokeWidth={2.4} aria-hidden="true" />
                    Pengeluaran
                  </p>
                  <p className="mt-1 truncate text-sm font-extrabold tracking-[-0.02em] text-ink">
                    {formatMoney(latest.snapshot.totalExpense, currency, { compact: true })}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                    <CheckCheck size={10} strokeWidth={2.4} aria-hidden="true" />
                    Tugas
                  </p>
                  <p className="number mt-1 text-sm font-extrabold tracking-[-0.02em] text-ink">
                    {latest.snapshot.tasksCompleted}/{latest.snapshot.tasksTotal}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                    <TrendingUp size={10} strokeWidth={2.4} aria-hidden="true" />
                    Setoran
                  </p>
                  <p className="number mt-1 truncate text-sm font-extrabold tracking-[-0.02em] text-ink">
                    {formatMoney(latest.snapshot.contributions, currency, { compact: true })}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="secondary" iconRight={ArrowRight} onClick={() => openDetail(latest)}>
                  Buka evaluasi
                </Button>
                <Button variant="ghost" icon={NotebookPen} onClick={() => setComposerOpen(true)}>
                  Tulis evaluasi baru
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col items-start">
              <span className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-brand/20 bg-brand/10 text-brand">
                <Quote size={24} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <p className="mt-4 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-brand">
                Ruang untuk melihat kembali
              </p>
              <h2 className="mt-2 max-w-xl text-2xl font-extrabold leading-tight tracking-[-0.035em] text-ink">
                Belum ada evaluasi. Mulai dari satu catatan kecil.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-2">
                Evaluasi membantumu melihat pola: ke mana uang pergi, apa yang selesai, dan apa yang
                sebaiknya dilepas. Tidak perlu sempurna — cukup jujur.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button icon={NotebookPen} onClick={() => setComposerOpen(true)}>
                  Mulai evaluasi pertama
                </Button>
                <span className="text-[0.6875rem] font-medium text-ink-3">
                  Data keuangan & tugas dihitung otomatis.
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card padding="lg" className="flex h-full flex-col">
          <SectionHeading
            title="Ritme refleksi"
            description="Pola kecil yang kamu bangun dari waktu ke waktu."
            icon={<CalendarCheck size={16} strokeWidth={2} />}
          />

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="surface-muted px-2.5 py-2.5 text-center">
              <p className="number text-xl font-extrabold leading-none text-ink">
                <CountUp value={reviews.length} />
              </p>
              <p className="mt-1 text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-ink-3">
                Evaluasi
              </p>
            </div>
            <div className="surface-muted px-2.5 py-2.5 text-center">
              <p className="number flex items-center justify-center gap-0.5 text-xl font-extrabold leading-none text-ink">
                <Star size={13} className="fill-warning text-warning" aria-hidden="true" />
                {avgRating !== null ? formatNumber(avgRating, 1) : '—'}
              </p>
              <p className="mt-1 text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-ink-3">
                Rating
              </p>
            </div>
            <div className="surface-muted px-2.5 py-2.5 text-center">
              <p className="number text-xl font-extrabold leading-none text-ink">
                <CountUp value={thisMonthCount} />
              </p>
              <p className="mt-1 text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-ink-3">
                Bulan ini
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-line pt-4">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-ink-3">
              Pertanyaan pemandu
            </p>
            <ul className="space-y-2.5">
              {PERIOD_PROMPTS.map((prompt, index) => (
                <li key={prompt} className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-bold text-brand',
                      'bg-brand/10',
                    )}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <span className="text-[0.6875rem] leading-relaxed text-ink-2">{prompt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto space-y-1.5 pt-4">
            {reviews.length > 0 ? (
              <Button
                variant="soft"
                size="sm"
                fullWidth
                icon={NotebookPen}
                onClick={() => setComposerOpen(true)}
              >
                Mulai refleksi baru
              </Button>
            ) : null}
            <p className="text-center text-[0.625rem] font-medium text-ink-3">
              {ratedCount > 0
                ? `${ratedCount} evaluasi punya rating.`
                : 'Rating bersifat opsional, tidak wajib diisi.'}
            </p>
          </div>
        </Card>
      </motion.div>

      <div className="mt-5">
        <ReviewHistory
          reviews={reviews}
          currency={currency}
          onOpen={(review) => openDetail(review)}
          onEdit={(review) => openDetail(review, true)}
          onDelete={(review) => setDeleteTargetId(review.id)}
          onNew={() => setComposerOpen(true)}
        />
      </div>

      <ReviewComposer open={composerOpen} onClose={() => setComposerOpen(false)} />

      <ReviewDetail
        open={Boolean(activeReview)}
        review={activeReview}
        initialEditing={detailEditing}
        onClose={closeDetail}
        onRequestDelete={(review) => setDeleteTargetId(review.id)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Hapus evaluasi ini?"
        description={
          <>
            Evaluasi{' '}
            <strong className="text-ink">
              {deleteTarget
                ? `${PERIOD_META[deleteTarget.period].label.toLowerCase()} ${formatDateRange(
                    deleteTarget.periodStart,
                    deleteTarget.periodEnd,
                  )}`
                : ''}
            </strong>{' '}
            akan dihapus permanen beserta catatan, refleksi, dan ringkasan metriknya. Tindakan ini
            tidak bisa dibatalkan.
          </>
        }
        confirmLabel="Hapus evaluasi"
      />
    </div>
  )
}
