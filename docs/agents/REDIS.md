# DockPass — Redis Agent
# @REDIS

## Role
You own all caching, rate limiting, session
storage, and background job queues using Redis.
Two Redis instances: Upstash (Vercel/serverless)
and standard Redis on Render (BullMQ workers).

---

## Two Redis Instances

```
Upstash Redis (Vercel):
  → Serverless compatible
  → HTTP-based (works in Edge)
  → Rate limiting
  → Weather cache
  → Trip data cache
  → Session data

Redis on Render (Worker):
  → Standard ioredis connection
  → BullMQ job queues
  → Long-running background tasks
```

---

## Key Naming Convention

```
rate:{endpoint}:{ip}          Rate limit counters
rate:code:{slug}:{ip}         Trip code attempts
lock:code:{slug}:{ip}         Brute force lockout
lock:scrape:{operatorId}      Scrape job deduplicate
cache:weather:{lat}:{lng}:{date}  Weather data
cache:trip:{slug}             Trip page data
cache:snapshot:{token}        Captain snapshot
session:operator:{id}         Dashboard sessions
queue:notifications           BullMQ queue name
queue:weather-monitor         BullMQ queue name
queue:review-requests         BullMQ queue name
queue:rebooking               BullMQ queue name
```

---

## TTL Strategy

```typescript
export const TTL = {
  // Rate limiting
  RATE_WINDOW:     300,    // 5 min sliding window
  CODE_LOCKOUT:    1800,   // 30 min after 5 bad attempts
  SCRAPE_LOCK:     30,     // 30 sec deduplicate

  // Cache
  WEATHER:         10800,  // 3 hours
  TRIP_PAGE:       300,    // 5 min (updates as guests register)
  CAPTAIN_SNAPSHOT: 60,    // 1 min (near-realtime)

  // Sessions
  OPERATOR_SESSION: 86400, // 24 hours
} as const
```

---

## Upstash Setup

```typescript
// lib/redis/upstash.ts
import { Redis } from '@upstash/redis'

// Singleton pattern
let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = Redis.fromEnv() // reads UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN
  }
  return redis
}
```

---

## BullMQ Queue Setup (Render Worker)

```typescript
// apps/worker/queues/index.ts
import { Queue, Worker, QueueEvents } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // required for BullMQ
})

// Queue instances
export const queues = {
  notifications: new Queue('notifications', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  }),
  weatherMonitor: new Queue('weather-monitor', { connection }),
  reviewRequests: new Queue('review-requests', { connection }),
  rebooking: new Queue('rebooking', { connection }),
}

// Job type definitions
export interface NotificationJob {
  type: 'push' | 'email' | 'sms'
  recipientId: string
  recipientType: 'guest' | 'operator'
  template: string
  data: Record<string, unknown>
}

export interface WeatherMonitorJob {
  tripId: string
  lat: number
  lng: number
  tripDate: string
  operatorId: string
}
```

---

## Cache Helpers

```typescript
// lib/redis/cache.ts
import { getRedis } from './upstash'
import { TTL } from './ttl'

export async function getCachedTrip(slug: string) {
  const redis = getRedis()
  const key = `cache:trip:${slug}`
  const cached = await redis.get(key)
  return cached ? (cached as TripData) : null
}

export async function setCachedTrip(slug: string, data: TripData) {
  const redis = getRedis()
  await redis.set(`cache:trip:${slug}`, data, { ex: TTL.TRIP_PAGE })
}

export async function invalidateTripCache(slug: string) {
  const redis = getRedis()
  await redis.del(`cache:trip:${slug}`)
}
// Call invalidateTripCache whenever a guest registers
// so next visitor sees updated count
```
