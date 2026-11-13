import { Check, NotebookPen, PencilLine, Sparkles, Trash2 } from 'lucide-react'
import { useLayoutEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Textarea } from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatDateMedium, formatDateRange } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { actions, useAppData } from '@/lib/store'
import { RatingPicker } from '@/features/reviews/components/RatingPicker'
import { ReviewMetrics } from '@/features/reviews/components/ReviewMetrics'
import {
  PERIOD_META,
  rangeDayCount,
  ratingLabel,
} from '@/features/reviews/review-helpers'
import type { Review } from '@/types/domain'

interface ReviewDetailProps {
  open: boolean
  review: Review | null
  onClose: () => void
  onRequestDelete: (review: Review) => void
  initialEditing?: boolean
}

export function ReviewDetail({
  open,
  review,
  onClose,
  onRequestDelete,
  initialEditing = false,
}: ReviewDetailProps) {
  const data = useAppData()
  const toast = useToast()
  const [editing, setEditing] = useState(initialEditing)
  const [note, setNote] = useState('')
  const [reflection, setReflection] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reviewId = review?.id

  useLayoutEffect(() => {
    if (!open || !review) return
    setEditing(initialEditing)
    setNote(review.note)
    setReflection(review.reflection)
    setRating(review.rating)
    setError(null)
    // The draft only resets when a different review opens or the mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reviewId, initialEditing])

  if (!review) {
    return <Modal open={false} onClose={onClose} title="Detail evaluasi">{null}</Modal>
  }

  const meta = PERIOD_META[review.period]
  const Icon = meta.icon
  const days = rangeDayCount(review.periodStart, review.periodEnd)
  const rangeLabel = formatDateRange(review.periodStart, review.periodEnd)

  const handleSave = () => {
    if (!note.trim() && !reflection.trim()) {
      setError('Tuliskan setidaknya satu catatan atau refleksi singkat.')
      return
    }
    setError(null)
    try {
      actions.updateReview(review.id, {
        note: note.trim(),
        reflection: reflection.trim(),
        rating,
      })
      toast({ tone: 'success', title: 'Evaluasi diperbarui', description: rangeLabel })
      setEditing(false)
    } catch (updateError) {
      toast({
        tone: 'error',
        title: 'Gagal memperbarui evaluasi',
        description: updateError instanceof Error ? updateError.message : 'Terjadi kesalahan.',
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Edit evaluasi' : 'Detail evaluasi'}
      description={
        editing
          ? 'Perbarui catatan, refleksi, atau rating. Metrik periode tetap seperti saat disimpan.'
          : 'Lihat kembali apa yang sudah berjalan dan apa yang ingin kamu ubah.'
      }
      footer={
        editing ? (
          <ModalFooter>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Batal
            </Button>
            <Button icon={Check} onClick={handleSave}>
              Simpan perubahan
            </Button>
          </ModalFooter>
        ) : (
          <ModalFooter>
            <Button variant="secondary" onClick={onClose}>
              Tutup
            </Button>
            <Button icon={PencilLine} onClick={() => setEditing(true)}>
              Edit catatan
            </Button>
          </ModalFooter>
        )
      }
    >
      <div className="space-y-5">
        <div
          className={cn(
            'relative overflow-hidden rounded-[18px] border border-line/80 bg-gradient-to-br p-4',
            meta.gradient,
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border"
                style={{
                  color: meta.accent,
                  backgroundColor: `color-mix(in srgb, ${meta.accent} 13%, transparent)`,
                  borderColor: `color-mix(in srgb, ${meta.accent} 26%, transparent)`,
                }}
                aria-hidden="true"
              >
                <Icon size={20} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-[-0.01em] text-ink">
                  Evaluasi {meta.label.toLowerCase()}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-ink-2">{rangeLabel}</p>
                <p className="mt-0.5 text-[0.625rem] font-medium text-ink-3">
                  Dibuat {formatDateMedium(review.createdAt.slice(0, 10))} · {days} hari
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <RatingPicker readOnly value={review.rating} size="sm" />
              <p className="text-[0.625rem] font-semibold text-ink-3">{ratingLabel(review.rating)}</p>
            </div>
          </div>
        </div>

        <ReviewMetrics snapshot={review.snapshot} currency={data.settings.currency} prominent />

        {editing ? (
          <div className="space-y-4">
            <Field label="Catatan" optional>
              <Textarea
                value={note}
                onChange={(event) => {
                  setNote(event.target.value)
                  if (error) setError(null)
                }}
                rows={3}
                placeholder="Apa yang terjadi selama periode ini?"
              />
            </Field>
            <Field
              label="Refleksi"
              optional
              error={error ?? undefined}
              hint="Perubahan hanya pada catatan dan rating; metrik periode tetap."
            >
              <Textarea
                value={reflection}
                onChange={(event) => {
                  setReflection(event.target.value)
                  if (error) setError(null)
                }}
                rows={3}
                placeholder="Pelajaran kecil untuk periode berikutnya…"
                aria-invalid={error ? true : undefined}
                className={error ? 'field-invalid' : undefined}
              />
            </Field>
            <Field
              label="Rating refleksi"
              optional
              hint="Klik bintang yang sama untuk menghapus rating."
            >
              <div className="flex flex-wrap items-center gap-2">
                <RatingPicker value={rating} onChange={setRating} />
                <span className="text-xs font-semibold text-ink-3">{ratingLabel(rating)}</span>
              </div>
            </Field>
          </div>
        ) : (
          <>
            <section className="surface-muted p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-ink-2">
                <NotebookPen size={14} strokeWidth={2.2} className="text-brand" aria-hidden="true" />
                Catatan
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-2">
                {review.note || 'Belum ada catatan untuk evaluasi ini.'}
              </p>
            </section>

            <section className="rounded-2xl border border-lavender/25 bg-lavender/5 p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-ink-2">
                <Sparkles size={14} strokeWidth={2.2} className="text-lavender" aria-hidden="true" />
                Refleksi
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-2">
                {review.reflection || 'Belum ada refleksi untuk evaluasi ini.'}
              </p>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <p className="max-w-sm text-[0.625rem] leading-relaxed text-ink-3">
                Metrik tersimpan bersama evaluasi ini dan tidak berubah saat catatan diedit.
              </p>
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{meta.label}</Badge>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => onRequestDelete(review)}
                >
                  Hapus evaluasi
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
