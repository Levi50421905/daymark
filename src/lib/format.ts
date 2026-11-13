import { CURRENCIES, CURRENCY_SYMBOL } from '@/lib/constants'
import type { CurrencyCode } from '@/types/domain'
import { formatDateMedium, relativeTimeLabel } from '@/lib/dates'

export function currencyMeta(currency: CurrencyCode) {
  return CURRENCIES.find((item) => item.code === currency) ?? CURRENCIES[0]
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode = 'IDR',
  options: { compact?: boolean; signed?: boolean; decimals?: boolean } = {},
): string {
  const meta = currencyMeta(currency)
  const value = Number.isFinite(amount) ? amount : 0
  const formatter = new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency: meta.code,
    notation: options.compact ? 'compact' : 'standard',
    minimumFractionDigits: options.decimals === false ? 0 : meta.decimals,
    maximumFractionDigits: options.compact ? 1 : meta.decimals,
  })
  const formatted = formatter.format(Math.abs(value))
  if (options.signed && value !== 0) return `${value > 0 ? '+' : '−'}${formatted}`
  return value < 0 ? `−${formatted}` : formatted
}

/** Short symbol for inputs and tiny spaces. */
export function currencySymbol(currency: CurrencyCode): string {
  return CURRENCY_SYMBOL[currency] ?? currency
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)
}

export function formatPercent(value: number, decimals = 0): string {
  const safe = Number.isFinite(value) ? value : 0
  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(safe)}%`
}

export function formatQuantity(value: number, unit = ''): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)
  return unit ? `${formatted} ${unit}` : formatted
}

/** Parse user-typed digits into a safe amount. */
export function parseAmount(value: string): number {
  const cleaned = value.replace(/[^\d]/g, '')
  if (!cleaned) return 0
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatDigitsWhileTyping(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  return new Intl.NumberFormat('id-ID').format(Math.round(value))
}

export function formatSavedAgo(timestamp: string | null | undefined): string {
  if (!timestamp) return 'Belum ada backup'
  return relativeTimeLabel(timestamp)
}

export function formatDateLabel(value: string): string {
  return formatDateMedium(value)
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0)
}
