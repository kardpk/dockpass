import { Redis } from "@upstash/redis";

// Singleton Redis client for edge/serverless
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL ?? "",
  token: process.env.UPSTASH_REDIS_TOKEN ?? "",
});

// ── Cache key patterns (from ARCHITECTURE.md) ──
export const CACHE_KEYS = {
  rateLimit: (slug: string, code: string) =>
    `rate:trip:${slug}:code:${code}` as const,
  rateLimitAttempts: (slug: string) =>
    `rate:trip:${slug}:attempts` as const,
  weatherCache: (lat: string, lng: string, date: string) =>
    `cache:weather:${lat}:${lng}:${date}` as const,
  tripCache: (slug: string) =>
    `cache:trip:${slug}` as const,
  operatorSession: (id: string) =>
    `session:operator:${id}` as const,
  scrapeLock: (operatorId: string) =>
    `lock:scrape:${operatorId}` as const,
  shortUrlToken: (shortToken: string) =>
    `snap:short:${shortToken}` as const,
} as const;

// ── TTL values (seconds) ──
export const TTL = {
  RATE_LIMIT_LOCKOUT: 1800,   // 30 min
  RATE_LIMIT_WINDOW: 300,     // 5 min
  WEATHER_CACHE: 10800,       // 3 hours
  TRIP_CACHE: 300,            // 5 min
  OPERATOR_SESSION: 86400,    // 24 hours
  SCRAPE_LOCK: 30,            // 30 sec
  SHORT_URL: 21600,           // 6 hours
} as const;
