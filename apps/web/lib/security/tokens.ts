import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

/**
 * CRITICAL 6 fix: QR tokens with HMAC signature + expiry.
 * Tokens expire at midnight after trip date + 1 day.
 */
export function generateQRToken(
  guestId: string,
  tripId: string,
  tripDate: string // 'YYYY-MM-DD'
): string {
  const expiresAt = new Date(tripDate);
  expiresAt.setDate(expiresAt.getDate() + 1);
  const expiry = Math.floor(expiresAt.getTime() / 1000);

  const payload = `${guestId}:${tripId}:${expiry}`;
  const hmac = createHmac("sha256", process.env.QR_HMAC_SECRET!);
  hmac.update(payload);
  const signature = hmac.digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function verifyQRToken(
  token: string
): { guestId: string; tripId: string; expired: boolean } | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;

    const payload = Buffer.from(payloadB64, "base64url").toString();
    const hmac = createHmac("sha256", process.env.QR_HMAC_SECRET!);
    hmac.update(payload);
    const expectedSig = hmac.digest("base64url");

    // Timing-safe comparison to prevent timing attacks
    if (
      !timingSafeEqual(
        Buffer.from(signature, "utf-8"),
        Buffer.from(expectedSig, "utf-8")
      )
    ) {
      return null;
    }

    const [guestId, tripId, expiryStr] = payload.split(":");
    const expiry = parseInt(expiryStr ?? "0");
    const expired = Date.now() / 1000 > expiry;

    return { guestId: guestId!, tripId: tripId!, expired };
  } catch {
    return null
  }
}

// ─── Trip slug generator ──────────────────────────────────────────────────────

/**
 * Generates a 22-character URL-safe random slug for trip links.
 * Uses crypto.randomUUID() stripped of hyphens, then trimmed.
 * Example: 'a7f2c9e1b3d845f0c8e2a1'
 */
export function generateTripSlug(): string {
  // Two UUIDs give 64 hex chars → take first 22, no hyphens
  const raw = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
  return raw.slice(0, 22)
}

// ─── Trip code generator ──────────────────────────────────────────────────────

/**
 * Generates a 4-character uppercase alphanumeric trip code.
 * Deliberately omits ambiguous characters: O, 0, I, 1, L
 * Example: 'SUN4'
 */
export function generateTripCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const buf = new Uint8Array(4)
  crypto.getRandomValues(buf)
  return Array.from(buf, (byte) => chars[byte % chars.length]!).join('')
}

// ─── Captain token (HMAC-signed, dynamic TTL, version-revocable) ─────────────────

export interface CaptainTokenPayload {
  tripId: string
  version: number
  issuedAt: number   // Unix ms
  expiresAt: number  // Unix ms
}

/**
 * Generate an HMAC-signed captain snapshot token.
 * Token format: `<base64url-payload>.<base64url-hmac>`
 */
export function generateCaptainToken(
  tripId: string,
  version: number,
  expiresAt: Date
): { token: string; expiresAt: Date } {
  const issuedAt = Date.now()

  const payload: CaptainTokenPayload = { tripId, version, issuedAt, expiresAt: expiresAt.getTime() }
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')

  const hmac = createHmac('sha256', process.env.CAPTAIN_TOKEN_SECRET!)
  hmac.update(payloadB64)
  const signature = hmac.digest('base64url')

  return {
    token: `${payloadB64}.${signature}`,
    expiresAt: new Date(expiresAt),
  }
}

/**
 * Verify an HMAC-signed captain token.
 * Returns the decoded payload if valid and not expired, null otherwise.
 * Never throws — all failures return null to prevent timing-based enumeration.
 */
export function verifyCaptainToken(token: string): CaptainTokenPayload | null {
  try {
    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return null

    // Verify HMAC signature
    const hmac = createHmac('sha256', process.env.CAPTAIN_TOKEN_SECRET!)
    hmac.update(payloadB64)
    const expectedSig = hmac.digest('base64url')

    const sigBuf = Buffer.from(signature, 'base64url')
    const expectedBuf = Buffer.from(expectedSig, 'base64url')
    if (sigBuf.length !== expectedBuf.length) return null
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null

    // Decode payload
    const payload: CaptainTokenPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString()
    )

    // Check expiry
    if (Date.now() > payload.expiresAt) return null

    return payload
  } catch {
    return null
  }
}

/**
 * Calculates absolute expiration time for Captain Snapshot tokens.
 * ttl = MIN(base_ttl, (departure_timestamp + 2hr) - now())
 */
export function calculateSnapshotExpiry(
  tripDateStr: string,
  departureTimeStr: string,
  baseTtlHours: number
): Date {
  const nowMs = Date.now()
  let departureMs = nowMs
  
  try {
    const tzStr = `${tripDateStr}T${departureTimeStr}:00`
    const parsed = new Date(tzStr).getTime()
    if (!isNaN(parsed)) departureMs = parsed
  } catch {}

  const capMs = departureMs + (2 * 60 * 60 * 1000)
  const baseTtlMs = baseTtlHours * 60 * 60 * 1000

  const timeToCapMs = capMs - nowMs
  const finalTtlMs = Math.min(baseTtlMs, timeToCapMs)
  // Ensure we don't have negative expiry
  const validTtlMs = finalTtlMs > 0 ? finalTtlMs : 0

  return new Date(nowMs + validTtlMs)
}
