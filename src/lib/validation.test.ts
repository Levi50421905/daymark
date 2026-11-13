import { describe, expect, it } from 'vitest'
import { buildBackupEnvelope, DataValidationError, parseBackupText, parseStoredData } from '@/lib/validation'
import { createDemoData } from '@/lib/demo'
import { createDefaultData } from '@/lib/seed'

function backupText(mutator?: (data: ReturnType<typeof createDemoData>) => void): string {
  const data = createDemoData()
  mutator?.(data)
  return JSON.stringify(buildBackupEnvelope(data))
}

describe('backup validation', () => {
  it('round-trips a valid backup', () => {
    const text = backupText()
    const result = parseBackupText(text)
    expect(result.data.transactions.length).toBeGreaterThan(0)
    expect(result.counts.tugas).toBeGreaterThan(0)
    expect(result.data.meta.demoData).toBe(true)
    expect(result.data.shoppingLists[0]?.items.length).toBeGreaterThan(0)
  })

  it('accepts a raw AppData object as well as an envelope', () => {
    const data = createDefaultData()
    const result = parseBackupText(JSON.stringify(data))
    expect(result.data.categories.length).toBeGreaterThan(0)
  })

  it('rejects malformed JSON', () => {
    expect(() => parseBackupText('{nope')).toThrow(DataValidationError)
  })

  it('rejects a non-Daymark file', () => {
    expect(() =>
      parseBackupText(JSON.stringify({ app: 'other-app', schemaVersion: 1, data: {} })),
    ).toThrow(/bukan backup Daymark/i)
  })

  it('rejects a backup from a newer schema version', () => {
    expect(() =>
      parseBackupText(
        JSON.stringify({
          app: 'daymark',
          schemaVersion: 99,
          data: createDefaultData(),
        }),
      ),
    ).toThrow(/versi Daymark yang lebih baru/i)
  })

  it('rejects orphan transactions', () => {
    const text = backupText((data) => {
      data.transactions[0]!.categoryId = 'missing-category'
    })
    expect(() => parseBackupText(text)).toThrow(DataValidationError)
  })

  it('rejects duplicate IDs', () => {
    const text = backupText((data) => {
      data.transactions[1]!.id = data.transactions[0]!.id
    })
    expect(() => parseBackupText(text)).toThrow(/ID ganda/i)
  })

  it('rejects negative amounts', () => {
    const text = backupText((data) => {
      data.transactions[0]!.amount = -100
    })
    expect(() => parseBackupText(text)).toThrow(DataValidationError)
  })

  it('rejects a shopping list linked to a missing transaction', () => {
    const text = backupText((data) => {
      const list = data.shoppingLists.find((item) => item.recordedTransactionId)
      if (list) list.recordedTransactionId = 'missing-tx'
    })
    expect(() => parseBackupText(text)).toThrow(/tautan transaksi/i)
  })

  it('returns null for corrupt persisted data', () => {
    expect(parseStoredData({ meta: null })).toBeNull()
  })
})
