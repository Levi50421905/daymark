/** Small, dependency-free helpers used across the app. */

export function uid(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}_${random.replace(/-/g, '').slice(0, 16)}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>((total, value) => total + (Number.isFinite(value ?? NaN) ? (value as number) : 0), 0)
}

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce(
    (groups, item) => {
      const groupKey = key(item)
      ;(groups[groupKey] ??= []).push(item)
      return groups
    },
    {} as Record<K, T[]>,
  )
}

export function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const value = key(item)
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

export function sortByDateDesc<T extends { date?: string; createdAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const left = `${a.date ?? ''}${a.createdAt ?? ''}`
    const right = `${b.date ?? ''}${b.createdAt ?? ''}`
    return right.localeCompare(left)
  })
}

export function downloadFile(filename: string, content: string, type = 'application/json'): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function truncate(value: string, length: number): string {
  if (value.length <= length) return value
  return `${value.slice(0, Math.max(0, length - 1)).trimEnd()}…`
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Join truthy class names without pulling in a dependency. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

export function noop(): void {}

export function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}
