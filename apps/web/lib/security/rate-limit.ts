import "server-only";

import { NextResponse } from "next/server";
import { redis } from "@/lib/redis/client";

/**
 * HIGH 2 fix: Atomic rate limiting using Redis Lua script.
 * INCR + EXPIRE in one atomic operation — prevents permanent lockout
 * if server crashes between the two commands.
 */

interface RateLimitConfig {
  /** Unique key identifier (defaults to pathname) */
  key?: string;
  /** Max requests allowed in the window */
  max: number;
  /** Window duration in seconds */
  window: number;
}

interface RateLimitResult {
  blocked: boolean;
  remaining: number;
}

const LUA_SCRIPT = `
  local current = redis.call('INCR', KEYS[1])
  if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return current
`;

export async function rateLimit(
  req: Request,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const ip = getClientIP(req);
  const key = `rate:${config.key ?? new URL(req.url).pathname}:${ip}`;

  try {
    const count = (await redis.eval(LUA_SCRIPT, [key], [
      config.window.toString(),
    ])) as number;

    return {
      blocked: count > config.max,
      remaining: Math.max(0, config.max - count),
    };
  } catch {
    // If Redis is down, fail open for MVP (allow the request)
    console.error("[rate-limit] Redis error, allowing request");
    return { blocked: false, remaining: config.max };
  }
}

/**
 * Create a rate limit response (429 Too Many Requests)
 */
export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429 }
  );
}

/**
 * Extract client IP with Cloudflare, Vercel, and proxy support
 */
function getClientIP(req: Request): string {
  const cfIP = req.headers.get("cf-connecting-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");

  if (cfIP) return cfIP;
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  if (realIP) return realIP;
  return "unknown";
}
