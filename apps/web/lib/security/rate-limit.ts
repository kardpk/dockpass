import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis/client";

interface RateLimitOptions {
  max: number;
  window: number; // seconds
}

/**
 * Rate limit by IP address using Redis sliding window.
 * Returns NextResponse with 429 if limit exceeded, or null if allowed.
 */
export async function rateLimit(
  req: NextRequest,
  { max, window }: RateLimitOptions
): Promise<NextResponse | null> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `rate:${req.nextUrl.pathname}:${ip}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, window);
    }

    if (current > max) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
  } catch {
    // If Redis is down, allow the request (fail open for MVP)
    console.error("[rate-limit] Redis error, allowing request");
  }

  return null;
}
