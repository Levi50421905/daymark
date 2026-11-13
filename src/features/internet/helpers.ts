import type { BadgeTone } from '@/components/ui/Badge'
import type { PackageStatus } from '@/lib/calc'
import { SUBSCRIPTION_CYCLE_META } from '@/lib/constants'
import { daysUntil, formatDateMedium, todayISO } from '@/lib/dates'
import { formatQuantity } from '@/lib/format'
import type { DataPackage, DeviceType, Subscription, SubscriptionCycle } from '@/types/domain'

export interface StatusMeta {
  label: string
  tone: BadgeTone
  color: string
}

/** Copy + tone for every data package state produced by `getPackageProgress`. */
export const PACKAGE_STATUS_META: Record<PackageStatus, StatusMeta> = {
  ok: { label: 'Aman', tone: 'mint', color: 'var(--c-mint)' },
  low: { label: 'Kuota menipis', tone: 'amber', color: 'var(--c-warning)' },
  expiring: { label: 'Segera berakhir', tone: 'peach', color: 'var(--c-peach)' },
  expired: { label: 'Berakhir', tone: 'rose', color: 'var(--c-danger)' },
}

/** Urgency order used to sort active packages and alerts (most urgent first). */
export const PACKAGE_STATUS_ORDER: Record<PackageStatus, number> = {
  expiring: 0,
  low: 1,
  ok: 2,
  expired: 3,
}

export const DEVICE_TONES: Record<DeviceType, string> = {
  phone: 'var(--c-brand)',
  tablet: 'var(--c-sky)',
  laptop: 'var(--c-lavender)',
  router: 'var(--c-mint)',
  other: 'var(--c-peach)',
}

export function packageStatusMeta(pkg: DataPackage, status: PackageStatus): StatusMeta {
  if (status === 'low' && pkg.remainingGB <= 0) {
    return { label: 'Kuota habis', tone: 'danger', color: 'var(--c-danger)' }
  }
  return PACKAGE_STATUS_META[status]
}

/** Human friendly GB value, e.g. "12,4 GB". */
export function quotaText(gb: number): string {
  return formatQuantity(gb, 'GB')
}

export function packageExpiryLabel(pkg: DataPackage, daysLeft: number): string {
  if (daysLeft < 0) return `Berakhir ${formatDateMedium(pkg.expiresAt)}`
  if (daysLeft === 0) return 'Masa aktif berakhir hari ini'
  if (daysLeft <= 7) return `Berakhir dalam ${daysLeft} hari`
  return `Aktif sampai ${formatDateMedium(pkg.expiresAt)}`
}

export function packageExpiryShort(pkg: DataPackage, daysLeft: number): string {
  if (daysLeft < 0) return `Berakhir ${formatDateMedium(pkg.expiresAt)}`
  if (daysLeft === 0) return 'Berakhir hari ini'
  return `${daysLeft} hari lagi`
}

export type DueKind = 'overdue' | 'today' | 'soon' | 'upcoming'

export interface DueMeta {
  kind: DueKind
  days: number
  label: string
  tone: BadgeTone
}

/** Relative status for a subscription's next payment date. */
export function subscriptionDueMeta(dateISO: string, today = todayISO()): DueMeta {
  const days = daysUntil(dateISO, today)
  if (days < 0) {
    return { kind: 'overdue', days, label: `Terlambat ${Math.abs(days)} hari`, tone: 'rose' }
  }
  if (days === 0) return { kind: 'today', days, label: 'Jatuh tempo hari ini', tone: 'amber' }
  if (days === 1) return { kind: 'soon', days, label: 'Besok', tone: 'peach' }
  if (days <= 7) return { kind: 'soon', days, label: `${days} hari lagi`, tone: 'sky' }
  return { kind: 'upcoming', days, label: formatDateMedium(dateISO), tone: 'neutral' }
}

export function cycleLabel(cycle: SubscriptionCycle): string {
  return SUBSCRIPTION_CYCLE_META[cycle].label
}

export function cycleShort(cycle: SubscriptionCycle): string {
  return SUBSCRIPTION_CYCLE_META[cycle].short
}

/** Monthly equivalent matching the sharing logic in `getMonthlySubscriptionCost`. */
export function monthlyEquivalent(subscription: Subscription): number {
  if (subscription.cycle === 'weekly') return (subscription.amount * 52) / 12
  if (subscription.cycle === 'yearly') return subscription.amount / 12
  return subscription.amount
}

/** Parse a GB field typed by the user. Accepts comma decimals; null when invalid. */
export function parseQuotaInput(input: string): number | null {
  const normalized = input.replace(',', '.').trim()
  if (!normalized) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

export function errorText(error: unknown, fallback = 'Coba lagi sebentar.'): string {
  return error instanceof Error && error.message ? error.message : fallback
}
