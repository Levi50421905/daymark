import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { SCHEMA_VERSION, STORAGE_DB, STORAGE_KEY, STORAGE_STORE } from '@/lib/constants'
import { createDefaultData } from '@/lib/seed'
import { parseStoredData } from '@/lib/validation'
import type { AppData } from '@/types/domain'

interface DaymarkDB extends DBSchema {
  [STORAGE_STORE]: {
    key: string
    value: AppData
  }
}

const FALLBACK_KEY = 'daymark.fallback.v1'
let databasePromise: Promise<IDBPDatabase<DaymarkDB>> | null = null

function getDatabase(): Promise<IDBPDatabase<DaymarkDB>> {
  if (!databasePromise) {
    databasePromise = openDB<DaymarkDB>(STORAGE_DB, 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORAGE_STORE)) {
          database.createObjectStore(STORAGE_STORE)
        }
      },
    }).catch((error: unknown) => {
      databasePromise = null
      throw error
    })
  }
  return databasePromise
}

function getFallback(): AppData | null {
  try {
    const raw = window.localStorage.getItem(FALLBACK_KEY)
    if (!raw) return null
    return parseStoredData(JSON.parse(raw))
  } catch {
    return null
  }
}

function setFallback(data: AppData): void {
  try {
    window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(data))
  } catch {
    // Storage may be blocked in private browsing; the in-memory session still works.
  }
}

/** Add fields introduced by newer app versions without losing the user's data. */
function migrate(raw: unknown): AppData | null {
  const fallback = createDefaultData()
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Partial<AppData>
  const merged = {
    ...fallback,
    ...source,
    meta: {
      ...fallback.meta,
      ...(source.meta ?? {}),
      schemaVersion: SCHEMA_VERSION,
      createdAt: source.meta?.createdAt ?? fallback.meta.createdAt,
      updatedAt: source.meta?.updatedAt ?? fallback.meta.updatedAt,
    },
    settings: {
      ...fallback.settings,
      ...(source.settings ?? {}),
      dashboardWidgets:
        source.settings?.dashboardWidgets?.length
          ? source.settings.dashboardWidgets
          : fallback.settings.dashboardWidgets,
    },
    categories:
      Array.isArray(source.categories) && source.categories.length > 0
        ? source.categories
        : fallback.categories,
  }
  return parseStoredData(merged)
}

export async function loadAppData(): Promise<AppData> {
  try {
    const database = await getDatabase()
    const stored = await database.get(STORAGE_STORE, STORAGE_KEY)
    if (stored !== undefined) {
      const migrated = migrate(stored)
      if (!migrated) throw new Error('Data lokal tidak dapat dibaca.')
      return migrated
    }
    const fallback = getFallback()
    if (fallback) return fallback
    const fresh = createDefaultData()
    await database.put(STORAGE_STORE, fresh, STORAGE_KEY)
    return fresh
  } catch (error) {
    const fallback = getFallback()
    if (fallback) return fallback
    throw error
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  const snapshot = structuredClone(data)
  try {
    const database = await getDatabase()
    await database.put(STORAGE_STORE, snapshot, STORAGE_KEY)
  } catch (error) {
    setFallback(snapshot)
    throw error
  }
}

export async function clearStoredData(): Promise<void> {
  try {
    const database = await getDatabase()
    await database.delete(STORAGE_STORE, STORAGE_KEY)
  } catch {
    // ignore; fallback is still cleared below
  }
  try {
    window.localStorage.removeItem(FALLBACK_KEY)
  } catch {
    // ignore
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!('storage' in navigator) || !navigator.storage?.persist) return false
  try {
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!('storage' in navigator) || !navigator.storage?.estimate) return null
  try {
    const estimate = await navigator.storage.estimate()
    return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 }
  } catch {
    return null
  }
}
