import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { ReviewPeriod, WeekStart } from '@/types/domain'

export const ISO_DATE = 'yyyy-MM-dd'
export const ISO_MONTH = 'yyyy-MM'

export interface DateRange {
  /** Inclusive ISO date, YYYY-MM-DD */
  start: string
  /** Inclusive ISO date, YYYY-MM-DD */
  end: string
}

export function toISODate(date: Date): string {
  return format(date, ISO_DATE)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function parseDate(value: string): Date {
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : startOfDay(new Date())
}

export function toDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : null
}

export function formatDate(value: string, pattern = 'd MMM yyyy'): string {
  const date = parseDate(value)
  return format(date, pattern, { locale: localeId })
}

export function formatDateLong(value: string): string {
  return formatDate(value, 'EEEE, d MMMM yyyy')
}

export function formatDateMedium(value: string): string {
  return formatDate(value, 'd MMM yyyy')
}

export function formatWeekdayShort(value: string): string {
  return formatDate(value, 'EEE')
}

export function formatDay(value: string): string {
  return formatDate(value, 'd')
}

export function formatDateRange(start: string, end: string): string {
  const startDate = parseDate(start)
  const endDate = parseDate(end)
  if (start === end) return format(startDate, 'd MMMM yyyy', { locale: localeId })
  const sameMonth = format(startDate, 'yyyy-MM') === format(endDate, 'yyyy-MM')
  if (sameMonth) {
    return `${format(startDate, 'd', { locale: localeId })}–${format(endDate, 'd MMMM yyyy', {
      locale: localeId,
    })}`
  }
  return `${format(startDate, 'd MMM', { locale: localeId })} – ${format(endDate, 'd MMM yyyy', {
    locale: localeId,
  })}`
}

export function formatMonthLabel(monthKey: string, variant: 'long' | 'short' = 'long'): string {
  const date = parseDate(`${monthKey}-01`)
  return format(date, variant === 'long' ? 'MMMM yyyy' : 'MMM yy', { locale: localeId })
}

export function monthKeyOf(value: string | Date = new Date()): string {
  const date = typeof value === 'string' ? parseDate(value) : value
  return format(date, ISO_MONTH)
}

export function getMonthRange(monthKey: string): DateRange {
  const date = parseDate(`${monthKey}-01`)
  return {
    start: toISODate(startOfMonth(date)),
    end: toISODate(endOfMonth(date)),
  }
}

export function shiftMonthKey(monthKey: string, amount: number): string {
  return format(addMonths(parseDate(`${monthKey}-01`), amount), ISO_MONTH)
}

export function getWeekRange(
  anchor: string | Date = new Date(),
  weekStartsOn: WeekStart = 'monday',
): DateRange {
  const date = typeof anchor === 'string' ? parseDate(anchor) : anchor
  const options = { weekStartsOn: weekStartsOn === 'sunday' ? 0 : 1 } as const
  return {
    start: toISODate(startOfWeek(date, options)),
    end: toISODate(endOfWeek(date, options)),
  }
}

export function getReviewRange(
  period: ReviewPeriod,
  anchorDate: string,
  weekStartsOn: WeekStart = 'monday',
): DateRange {
  const anchor = parseDate(anchorDate)
  if (period === 'daily') {
    const day = toISODate(anchor)
    return { start: day, end: day }
  }
  if (period === 'weekly') {
    return getWeekRange(anchor, weekStartsOn)
  }
  return getMonthRange(monthKeyOf(anchor))
}

export function getCalendarDays(monthKey: string, weekStartsOn: WeekStart = 'monday'): Date[] {
  const monthStart = startOfMonth(parseDate(`${monthKey}-01`))
  const monthEnd = endOfMonth(monthStart)
  const gridStart =
    weekStartsOn === 'sunday' ? startOfWeek(monthStart, { weekStartsOn: 0 }) : startOfWeek(monthStart, { weekStartsOn: 1 })
  const totalDays = differenceInCalendarDays(monthEnd, gridStart) + 1
  const trailing = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7)
  const totalCells = totalDays + trailing
  return Array.from({ length: totalCells }, (_, index) => addDays(gridStart, index))
}

export function enumerateDates(start: string, end: string): string[] {
  const startDate = parseDate(start)
  const endDate = parseDate(end)
  const days = Math.max(0, differenceInCalendarDays(endDate, startDate))
  return Array.from({ length: days + 1 }, (_, index) => toISODate(addDays(startDate, index)))
}

export function isDateInRange(value: string, range: DateRange): boolean {
  return value >= range.start && value <= range.end
}

export function daysUntil(value: string, from: string = todayISO()): number {
  return differenceInCalendarDays(parseDate(value), parseDate(from))
}

export function isPast(value: string, from: string = todayISO()): boolean {
  return value < from
}

export function isToday(value: string): boolean {
  return value === todayISO()
}

export function isSameMonth(value: string, monthKey: string): boolean {
  return monthKeyOf(value) === monthKey
}

export function addDaysISO(value: string, amount: number): string {
  return toISODate(addDays(parseDate(value), amount))
}

export function addMonthsISO(value: string, amount: number): string {
  return toISODate(addMonths(parseDate(value), amount))
}

export function addWeeksISO(value: string, amount: number): string {
  return toISODate(addWeeks(parseDate(value), amount))
}

export function addYearsISO(value: string, amount: number): string {
  return toISODate(addYears(parseDate(value), amount))
}

export function relativeDueLabel(dateISO: string): string {
  const days = daysUntil(dateISO)
  if (days === 0) return 'Hari ini'
  if (days === 1) return 'Besok'
  if (days === -1) return 'Kemarin'
  if (days > 1 && days <= 7) return `${days} hari lagi`
  if (days < -1 && days >= -30) return `Terlambat ${Math.abs(days)} hari`
  return formatDateMedium(dateISO)
}

export function relativeTimeLabel(isoTimestamp: string): string {
  const date = parseDate(isoTimestamp)
  if (!isValid(date)) return 'Belum pernah'
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Kemarin'
  if (days < 7) return `${days} hari lalu`
  return formatDateMedium(toISODate(date))
}

export function greetingForHour(hour = new Date().getHours()): string {
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export function startOfTodayISO(): string {
  return toISODate(startOfDay(new Date()))
}

export function previousMonthKey(monthKey: string): string {
  return format(subMonths(parseDate(`${monthKey}-01`), 1), ISO_MONTH)
}

export function nextMonthKey(monthKey: string): string {
  return format(addMonths(parseDate(`${monthKey}-01`), 1), ISO_MONTH)
}

export function shiftDate(value: string, amount: number): string {
  return toISODate(addDays(parseDate(value), amount))
}

export function recentDate(daysAgo: number): string {
  return toISODate(subDays(new Date(), daysAgo))
}
