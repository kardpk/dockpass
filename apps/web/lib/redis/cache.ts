import 'server-only'

import { redis } from '@/lib/redis/client'

/**
 * Invalidates all Redis cache entries for a given trip slug.
 * Called after trip cancellation and trip updates so guest
 * pages immediately reflect the new state.
 */
export async function invalidateTripCache(slug: string): Promise<void> {
  try {
    await Promise.all([
      redis.del(`cache:trip:exists:${slug}`),
      redis.del(`cache:trip:${slug}`),         // v1 — legacy
      redis.del(`cache:trip:v2:${slug}`),      // v2 — current
    ])
  } catch {
    // Cache invalidation failure is non-fatal
  }
}
