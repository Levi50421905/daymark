import { Link } from 'react-router-dom'
import { ArrowRight, NotebookPen, Quote, Star } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { formatMoney } from '@/lib/format'
import { formatDateRange, relativeTimeLabel } from '@/lib/dates'
import { REVIEW_PERIOD_META } from '@/lib/constants'
import { useAppData } from '@/lib/store'

export function ReviewWidget() {
  const data = useAppData()
  const currency = data.settings.currency
  const latest = [...data.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  if (!latest) {
    return (
      <div className="surface-card overflow-hidden">
        <div className="bg-gradient-to-br from-lavender/10 via-surface to-sky/8 px-5 py-3 sm:px-6">
          <EmptyState
            compact
            icon={NotebookPen}
            title="Saatnya melihat kembali perjalananmu"
            description="Luangkan lima menit untuk mencatat apa yang berjalan baik dan apa yang ingin diperbaiki."
            className="py-4"
            action={
              <Link
                to="/reviews"
                className="inline-flex items-center gap-1 text-[0.6875rem] font-bold text-brand hover:underline"
              >
                Mulai evaluasi <ArrowRight size={13} aria-hidden="true" />
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const meta = REVIEW_PERIOD_META[latest.period]
  return (
    <div className="surface-card relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-lavender/10 via-transparent to-sky/8" aria-hidden="true" />
      <div className="relative z-10 flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3 lg:w-64 lg:shrink-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-lavender/20 bg-lavender/10 text-lavender">
            <NotebookPen size={20} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-ink-3">Evaluasi terakhir</p>
            <p className="mt-0.5 text-sm font-extrabold text-ink">
              Review {meta.label.toLowerCase()}
            </p>
            <p className="mt-0.5 text-[0.625rem] text-ink-3">
              {formatDateRange(latest.periodStart, latest.periodEnd)} · {relativeTimeLabel(latest.createdAt)}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1 border-t border-line/70 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <Quote size={14} className="mb-1 text-lavender/70" aria-hidden="true" />
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-2">
            {latest.reflection || latest.note || 'Belum ada catatan refleksi untuk evaluasi ini.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="lavender" className="text-[0.625rem]">
              Pengeluaran {formatMoney(latest.snapshot.totalExpense, currency, { compact: true })}
            </Badge>
            <Badge tone="mint" className="text-[0.625rem]">
              {latest.snapshot.tasksCompleted} aktivitas selesai
            </Badge>
            {latest.rating ? (
              <span className="inline-flex items-center gap-0.5 text-[0.625rem] font-bold text-warning">
                {Array.from({ length: latest.rating }, (_, index) => (
                  <Star key={index} size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                ))}
              </span>
            ) : null}
          </div>
        </div>

        <Link
          to="/reviews"
          className="focus-ring inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface/80 px-3.5 py-2 text-[0.6875rem] font-bold text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
        >
          Buka evaluasi
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
