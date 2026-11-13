import { CalendarDays, CalendarRange, Sun, type LucideIcon } from 'lucide-react'
import { REVIEW_PERIOD_META } from '@/lib/constants'
import type { BadgeTone } from '@/components/ui/Badge'
import { daysUntil, monthKeyOf, todayISO } from '@/lib/dates'
import type { Review, ReviewPeriod, ReviewSnapshot } from '@/types/domain'

export const REVIEW_PERIOD_ORDER: ReviewPeriod[] = ['daily', 'weekly', 'monthly']

export type PeriodFilter = 'all' | ReviewPeriod

export interface PeriodMeta {
  label: string
  adjective: string
  hint: string
  icon: LucideIcon
  accent: string
  tone: BadgeTone
  gradient: string
}

export const PERIOD_META: Record<ReviewPeriod, PeriodMeta> = {
  daily: {
    label: REVIEW_PERIOD_META.daily.label,
    adjective: REVIEW_PERIOD_META.daily.adjective,
    hint: REVIEW_PERIOD_META.daily.hint,
    icon: Sun,
    accent: 'var(--c-peach)',
    tone: 'peach',
    gradient: 'from-peach/18 via-surface to-surface',
  },
  weekly: {
    label: REVIEW_PERIOD_META.weekly.label,
    adjective: REVIEW_PERIOD_META.weekly.adjective,
    hint: REVIEW_PERIOD_META.weekly.hint,
    icon: CalendarRange,
    accent: 'var(--c-sky)',
    tone: 'sky',
    gradient: 'from-sky/16 via-surface to-surface',
  },
  monthly: {
    label: REVIEW_PERIOD_META.monthly.label,
    adjective: REVIEW_PERIOD_META.monthly.adjective,
    hint: REVIEW_PERIOD_META.monthly.hint,
    icon: CalendarDays,
    accent: 'var(--c-lavender)',
    tone: 'lavender',
    gradient: 'from-lavender/16 via-surface to-surface',
  },
}

export const PERIOD_PROMPTS = [
  'Apa satu hal yang berjalan baik dan ingin kamu ulangi?',
  'Apa yang paling menguras energi minggu ini?',
  'Satu langkah kecil apa yang bisa membuat periode berikutnya lebih ringan?',
]

export function periodLabel(period: ReviewPeriod): string {
  return PERIOD_META[period].label
}

export function rangeDayCount(start: string, end: string): number {
  return Math.max(1, daysUntil(end, start) + 1)
}

export function sortReviews(reviews: Review[]): Review[] {
  return [...reviews].sort((left, right) => {
    if (left.periodEnd !== right.periodEnd) return right.periodEnd.localeCompare(left.periodEnd)
    return right.createdAt.localeCompare(left.createdAt)
  })
}

export function countByPeriod(reviews: Review[]): Record<PeriodFilter, number> {
  return {
    all: reviews.length,
    daily: reviews.filter((review) => review.period === 'daily').length,
    weekly: reviews.filter((review) => review.period === 'weekly').length,
    monthly: reviews.filter((review) => review.period === 'monthly').length,
  }
}

export interface BudgetComparison {
  percent: number
  difference: number
  state: 'unset' | 'safe' | 'warning' | 'over'
}

/** Compare actual spending against the prorated budget stored in a snapshot. */
export function budgetComparison(snapshot: ReviewSnapshot): BudgetComparison {
  if (snapshot.budgetAmount <= 0) {
    return { percent: 0, difference: 0, state: 'unset' }
  }
  const percent = (snapshot.totalExpense / snapshot.budgetAmount) * 100
  return {
    percent,
    difference: snapshot.budgetAmount - snapshot.totalExpense,
    state: percent >= 100 ? 'over' : percent >= 80 ? 'warning' : 'safe',
  }
}

export function savingsPercent(snapshot: ReviewSnapshot): number {
  if (snapshot.savingsTarget <= 0) return 0
  return Math.min(100, Math.max(0, (snapshot.savingsSaved / snapshot.savingsTarget) * 100))
}

export function tasksPercent(snapshot: ReviewSnapshot): number {
  if (snapshot.tasksTotal <= 0) return 0
  return Math.min(100, Math.max(0, (snapshot.tasksCompleted / snapshot.tasksTotal) * 100))
}

export function averageRating(reviews: Review[]): number | null {
  const rated = reviews.filter((review) => review.rating !== null)
  if (!rated.length) return null
  return rated.reduce((total, review) => total + (review.rating ?? 0), 0) / rated.length
}

export function reviewsInCurrentMonth(reviews: Review[], today = todayISO()): number {
  const month = monthKeyOf(today)
  return reviews.filter(
    (review) => monthKeyOf(review.periodEnd) === month || monthKeyOf(review.periodStart) === month,
  ).length
}

export function ratingLabel(rating: number | null): string {
  if (rating === null) return 'Belum dinilai'
  if (rating <= 1) return 'Berat'
  if (rating === 2) return 'Kurang'
  if (rating === 3) return 'Cukup'
  if (rating === 4) return 'Baik'
  return 'Sangat baik'
}
