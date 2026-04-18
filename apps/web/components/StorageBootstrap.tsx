'use client'

import { useEffect } from 'react'
import { storage } from '@/lib/storage'

/**
 * One-shot legacy key migration.
 * Drop-in client component — renders nothing, runs once on mount.
 * Safe to remove after 2-3 release cycles.
 */
export function StorageBootstrap() {
  useEffect(() => {
    storage.migrateLegacyKeys()
  }, [])
  return null
}
