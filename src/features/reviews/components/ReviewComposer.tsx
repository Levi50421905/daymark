import { useId, useLayoutEffect, useMemo, useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, DateInput, FormGrid, Textarea } from '@/components/ui/Field'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { MoneyText } from '@/components/ui/MoneyText'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { TrendChart } from '@/components/charts/TrendChart'
import { getDailyTrend, getReviewSnapshot } from '@/lib/calc'
import { formatDateRange, formatDay, getReviewRange, todayISO } from '@/lib/dates'
import { formatMoney } from '@/lib/format'
import { actions, useAppData, type ReviewInput } from '@/lib/store'
import { RatingPicker } from '@/features/reviews/components/RatingPicker'
import { ReviewMetrics } from '@/features/reviews/components/ReviewMetrics'
import {
  PERIOD_META,
  REVIEW_PERIOD_ORDER,
  rangeDayCount,
  ratingLabel,
} from '@/features/reviews/review-helpers'
import type { ReviewPeriod } from '@/types/domain'

interface ReviewComposerProps {
  open: boolean
  onClose: () => void
}

/** Create flow: pick a period, see live metrics, then write the reflection. */
export function ReviewComposer({ open, onClose }: ReviewComposerProps) {
  const data = useAppData()
  const toast = useToast()
  const formId = useId()
  const anchorInputId = useId()
  const noteId = useId()
  const reflectionId = useId()

  const [period, setPeriod] = useState<ReviewPeriod>('weekly')
  const [anchor, setAnchor] = useState(todayISO())
  const [note, setNote] = useState('')
  const [reflection, setReflection] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [anchorError, setAnchorError] = useState<string | null>(null)
  const [entryError, setEntryError] = useState<string | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    setPeriod('weekly')
    setAnchor(todayISO())
    setNote('')
    setReflection('')
    setRating(null)
    setAnchorError(null)
    setEntryError(null)
  }, [open])

  const anchorDate = anchor || todayISO()
  const range = useMemo(
    () => getReviewRange(period, anchorDate, data.settings.weekStartsOn),
    [period, anchorDate, data.settings.weekStartsOn],
  )
  const snapshot = useMemo(() => getReviewSnapshot(data, range), [data, range])
  const trend = useMemo(() => getDailyTrend(data, range), [data, range])
  const meta = PERIOD_META[period]
  const days = rangeDayCount(range.start, range.end)
  const multiDay = range.start !== range.end
  const chartData = trend.map((point) => ({ label: formatDay(point.date), value: point.expense }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let invalid = false
    if (!anchor) {
      setAnchorError('Pilih tanggal acuan untuk periode ini.')
      invalid = true
    } else {
      setAnchorError(null)
    }
    if (!note.trim() && !reflection.trim()) {
      setEntryError('Tuliskan setidaknya satu catatan atau refleksi singkat.')
      invalid = true
    } else {
      setEntryError(null)
    }
    if (invalid) return

    try {
      const input: ReviewInput = {
        period,
        periodStart: range.start,
        periodEnd: range.end,
        note: note.trim(),
        reflection: reflection.trim(),
        rating,
        snapshot,
      }
      actions.addReview(input)
      toast({
        tone: 'success',
        title: `Evaluasi ${meta.label.toLowerCase()} tersimpan`,
        description: formatDateRange(range.start, range.end),
      })
      onClose()
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Gagal menyimpan evaluasi',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan.',
      })
    }
  }

  const periodOptions = REVIEW_PERIOD_ORDER.map((value) => ({
    value,
    label: PERIOD_META[value].label,
    icon: PERIOD_META[value].icon,
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Evaluasi baru"
      description="Luangkan beberapa menit untuk melihat kembali, tanpa menghakimi diri."
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form={formId} icon={meta.icon}>
            Simpan evaluasi
          </Button>
        </ModalFooter>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-6">
        <section aria-labelledby="review-period-heading">
          <h3
            id="review-period-heading"
            className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-3"
          >
            Periode evaluasi
          </h3>
          <SegmentedControl<ReviewPeriod>
            value={period}
            onChange={setPeriod}
            options={periodOptions}
            ariaLabel="Jenis periode evaluasi"
            className="w-full"
          />
          <FormGrid className="mt-3">
            <Field
              label="Tanggal acuan"
              htmlFor={anchorInputId}
              error={anchorError ?? undefined}
              hint="Pilih tanggal mana pun di dalam periode yang ingin dievaluasi."
            >
              <DateInput
                id={anchorInputId}
                value={anchor}
                onValueChange={(value) => {
                  setAnchor(value)
                  if (anchorError) setAnchorError(null)
                }}
                aria-invalid={anchorError ? true : undefined}
                className={anchorError ? 'field-invalid' : undefined}
              />
            </Field>
            <div className="surface-muted flex flex-col justify-center px-3.5 py-3">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                Periode terhitung
              </p>
              <p className="mt-1 text-sm font-bold leading-snug text-ink">
                {formatDateRange(range.start, range.end)}
              </p>
              <p className="mt-0.5 text-[0.6875rem] font-medium text-ink-3">
                {days} hari · data dihitung otomatis
              </p>
            </div>
          </FormGrid>
        </section>

        <section aria-labelledby="review-metrics-heading">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3
              id="review-metrics-heading"
              className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-3"
            >
              Ringkasan data periode
            </h3>
            <Badge tone="brand" dot>
              Langsung
            </Badge>
          </div>
          <p className="mb-2 text-[0.625rem] leading-relaxed text-ink-3">
            Anggaran dibandingkan secara proporsional sesuai panjang periode yang dipilih.
          </p>
          <ReviewMetrics snapshot={snapshot} currency={data.settings.currency} prominent />
          {multiDay && snapshot.totalExpense > 0 ? (
            <div className="surface-muted mt-2.5 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                  Ritme pengeluaran harian
                </p>
                <p className="text-xs font-bold text-ink">
                  <MoneyText amount={snapshot.totalExpense} currency={data.settings.currency} />
                </p>
              </div>
              <TrendChart
                data={chartData}
                height={118}
                color="var(--c-peach)"
                showAxis
                className="mt-1.5"
                valueFormat={(value) =>
                  formatMoney(value, data.settings.currency, { compact: true })
                }
              />
            </div>
          ) : null}
        </section>

        <section aria-labelledby="review-reflection-heading" className="space-y-4">
          <h3
            id="review-reflection-heading"
            className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-3"
          >
            Catatan & refleksi
          </h3>
          <Field label="Catatan" htmlFor={noteId} optional hint={meta.hint}>
            <Textarea
              id={noteId}
              value={note}
              onChange={(event) => {
                setNote(event.target.value)
                if (entryError) setEntryError(null)
              }}
              rows={3}
              placeholder="Apa yang terjadi selama periode ini?"
            />
          </Field>
          <Field
            label="Refleksi"
            htmlFor={reflectionId}
            optional
            error={entryError ?? undefined}
            hint="Apa yang ingin kamu pertahankan, lepaskan, atau coba lagi?"
          >
            <Textarea
              id={reflectionId}
              value={reflection}
              onChange={(event) => {
                setReflection(event.target.value)
                if (entryError) setEntryError(null)
              }}
              rows={3}
              placeholder="Pelajaran kecil untuk periode berikutnya…"
              aria-invalid={entryError ? true : undefined}
              className={entryError ? 'field-invalid' : undefined}
            />
          </Field>
          <Field
            label="Rating refleksi"
            optional
            hint="Opsional. 1 = berat, 5 = luar biasa. Klik bintang yang sama untuk menghapus."
          >
            <div className="flex flex-wrap items-center gap-2">
              <RatingPicker value={rating} onChange={setRating} />
              <span className="text-xs font-semibold text-ink-3">{ratingLabel(rating)}</span>
            </div>
          </Field>
        </section>
      </form>
    </Modal>
  )
}
