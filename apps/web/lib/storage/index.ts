/**
 * DockPass — Versioned Storage Layer
 * ════════════════════════════════════════════════════════════════════
 * Central, type-safe abstraction over browser localStorage.
 *
 * ARCHITECTURE GUARANTEES:
 * 1. Every key is auto-namespaced under `dp:` to prevent collisions.
 * 2. Every key has an explicit schema version. When the schema changes,
 *    bump the version → old data is silently purged on next read.
 * 3. All reads are wrapped in try/catch (Private/Incognito mode,
 *    QuotaExceeded, and corrupt JSON never crash the app).
 * 4. TypeScript generics enforce shape at compile time.
 * 5. An optional TTL (seconds) auto-expires stale entries.
 *
 * USAGE:
 *   import { storage } from '@/lib/storage'
 *   storage.set('boat_wizard_draft', data)
 *   const draft = storage.get('boat_wizard_draft')
 *   storage.remove('boat_wizard_draft')
 *
 * ADDING A NEW KEY:
 *   1. Add entry to STORAGE_REGISTRY below
 *   2. Define the shape in StorageSchemas
 *   3. Done — versioning, namespacing, TTL all handled automatically
 */

import type { GuestSession } from '@/types'

// ── Storage Schemas ──────────────────────────────────────────────────────────
// Every localStorage datum has a typed schema. Add new shapes here.

export interface WizardDraftData {
  boatName: string
  boatType: string
  charterType: string
  linkedCaptainIds: string[]
  [key: string]: unknown   // allow future fields without breaking compat
}

export interface GuestChecklistData {
  checked: number[]
}

export interface LangPreference {
  lang: string
}

// Map of registry keys → their TypeScript shape
interface StorageSchemas {
  boat_wizard_draft: WizardDraftData
  boat_wizard_step:  number
  guest_session:     GuestSession
  guest_checklist:   GuestChecklistData
  lang_preference:   LangPreference
}

// ── Registry ─────────────────────────────────────────────────────────────────
// Central manifest of every localStorage key in the app.
//   version:  bump when schema changes → old data auto-purged
//   ttlSec:   optional expiry in seconds (undefined = permanent)
//   dynamic:  if true, the key includes a runtime suffix (e.g. slug)

interface RegistryEntry {
  version: number
  ttlSec?: number
  dynamic?: boolean
}

const STORAGE_REGISTRY: Record<keyof StorageSchemas, RegistryEntry> = {
  boat_wizard_draft: { version: 2 },
  boat_wizard_step:  { version: 2 },
  guest_session:     { version: 1, dynamic: true },
  guest_checklist:   { version: 1, dynamic: true, ttlSec: 86400 * 30 },  // 30 days
  lang_preference:   { version: 1 },
}

// ── Internal envelope (what we actually write to localStorage) ────────────────
interface StorageEnvelope<T> {
  v: number        // schema version
  ts: number       // write timestamp (ms)
  d: T             // data payload
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildKey(key: string, suffix?: string): string {
  return suffix ? `dp:${key}:${suffix}` : `dp:${key}`
}

function isExpired(entry: StorageEnvelope<unknown>, ttlSec?: number): boolean {
  if (!ttlSec) return false
  return Date.now() - entry.ts > ttlSec * 1000
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Read a typed value from localStorage.
 * Returns `null` if: missing, wrong version, expired, corrupt, or unavailable.
 */
function get<K extends keyof StorageSchemas>(
  key: K,
  suffix?: string
): StorageSchemas[K] | null {
  try {
    const reg = STORAGE_REGISTRY[key]
    const raw = localStorage.getItem(buildKey(key, suffix))
    if (!raw) return null

    const envelope: StorageEnvelope<StorageSchemas[K]> = JSON.parse(raw)

    // Version mismatch → purge silently
    if (envelope.v !== reg.version) {
      localStorage.removeItem(buildKey(key, suffix))
      return null
    }

    // TTL expired → purge silently
    if (isExpired(envelope, reg.ttlSec)) {
      localStorage.removeItem(buildKey(key, suffix))
      return null
    }

    return envelope.d
  } catch {
    // Corrupt JSON, Private mode, QuotaExceeded — never crash
    return null
  }
}

/**
 * Write a typed value to localStorage.
 * Silently no-ops if storage is unavailable.
 */
function set<K extends keyof StorageSchemas>(
  key: K,
  data: StorageSchemas[K],
  suffix?: string
): void {
  try {
    const reg = STORAGE_REGISTRY[key]
    const envelope: StorageEnvelope<StorageSchemas[K]> = {
      v: reg.version,
      ts: Date.now(),
      d: data,
    }
    localStorage.setItem(buildKey(key, suffix), JSON.stringify(envelope))
  } catch {
    // QuotaExceeded, Private mode — silently fail
  }
}

/**
 * Remove a specific key from localStorage.
 */
function remove<K extends keyof StorageSchemas>(
  key: K,
  suffix?: string
): void {
  try {
    localStorage.removeItem(buildKey(key, suffix))
  } catch {
    // silently fail
  }
}

/**
 * Purge ALL DockPass keys from localStorage.
 * Useful on logout or "Clear All Data" settings action.
 */
function purgeAll(): void {
  try {
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('dp:')) toRemove.push(k)
    }
    toRemove.forEach((k) => localStorage.removeItem(k))
  } catch {
    // silently fail
  }
}

/**
 * Purge all keys matching a specific registry entry (including dynamic suffixes).
 */
function purgeKey<K extends keyof StorageSchemas>(key: K): void {
  try {
    const prefix = `dp:${key}`
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(prefix)) toRemove.push(k)
    }
    toRemove.forEach((k) => localStorage.removeItem(k))
  } catch {
    // silently fail
  }
}

// ── Legacy migration (call once on app bootstrap) ────────────────────────────
// Converts old raw keys to the new dp: envelope format.
// Safe to remove after a few release cycles.
function migrateLegacyKeys(): void {
  try {
    // Wizard draft
    const oldDraft = localStorage.getItem('boatcheckin_boat_wizard_draft')
    const oldStep = localStorage.getItem('boatcheckin_boat_wizard_step')
    if (oldDraft || oldStep) {
      // Don't migrate content — just purge (stale schema)
      localStorage.removeItem('boatcheckin_boat_wizard_draft')
      localStorage.removeItem('boatcheckin_boat_wizard_step')
      localStorage.removeItem('boatcheckin_boat_wizard_version')
    }

    // Language preference
    const oldLang = localStorage.getItem('dp-lang')
    if (oldLang) {
      set('lang_preference', { lang: oldLang })
      localStorage.removeItem('dp-lang')
    }

    // Guest sessions (dp-guest-{slug})
    const toMigrate: [string, string][] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('dp-guest-')) {
        const slug = k.replace('dp-guest-', '')
        const raw = localStorage.getItem(k)
        if (raw) toMigrate.push([slug, raw])
      }
    }
    for (const [slug, raw] of toMigrate) {
      try {
        const parsed = JSON.parse(raw) as GuestSession
        set('guest_session', parsed, slug)
        localStorage.removeItem(`dp-guest-${slug}`)
      } catch {
        localStorage.removeItem(`dp-guest-${slug}`)
      }
    }

    // Guest checklists (dp-checklist-{slug})
    const checklistsToMigrate: [string, string][] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('dp-checklist-')) {
        const slug = k.replace('dp-checklist-', '')
        const raw = localStorage.getItem(k)
        if (raw) checklistsToMigrate.push([slug, raw])
      }
    }
    for (const [slug, raw] of checklistsToMigrate) {
      try {
        const parsed = JSON.parse(raw) as number[]
        set('guest_checklist', { checked: parsed }, slug)
        localStorage.removeItem(`dp-checklist-${slug}`)
      } catch {
        localStorage.removeItem(`dp-checklist-${slug}`)
      }
    }
  } catch {
    // Private mode — no-op
  }
}

// ── Export ────────────────────────────────────────────────────────────────────
export const storage = {
  get,
  set,
  remove,
  purgeAll,
  purgeKey,
  migrateLegacyKeys,
  /** Expose registry for debugging/testing */
  _registry: STORAGE_REGISTRY,
} as const
