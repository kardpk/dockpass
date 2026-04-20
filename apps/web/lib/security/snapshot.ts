import 'server-only'

import { createHmac } from 'crypto'
import { generateCaptainToken } from './tokens'

/**
 * Generate a snapshot token for a trip.
 * Delegates to generateCaptainToken with version=1.
 */
export function generateSnapshotToken(tripId: string, expiresAt: Date): string {
  const { token } = generateCaptainToken(tripId, 1, expiresAt)
  return token
}

/**
 * Compatibility wrapper: verifySnapshotToken
 *
 * Delegates to the same HMAC verification logic as verifyCaptainToken (in tokens.ts)
 * but returns { tripId, expired } to match the shape expected by
 * start/route.ts, end/route.ts, and snapshot/[token]/route.ts.
 *
 * We can't just re-export verifyCaptainToken because it returns null
 * for BOTH "invalid" and "expired" — we need to distinguish them so
 * the start route can show "link expired" vs "invalid token" messages.
 */
export function verifySnapshotToken(
  token: string
): { tripId: string; expired: boolean } | null {
  try {
    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return null

    // Verify HMAC signature using the same secret as verifyCaptainToken
    const secret = process.env.CAPTAIN_TOKEN_SECRET
    if (!secret) {
      console.error('[snapshot] CAPTAIN_TOKEN_SECRET not configured')
      return null
    }

    const hmac = createHmac('sha256', secret)
    hmac.update(payloadB64)
    const expectedSig = hmac.digest('base64url')

    // Timing-safe comparison
    const sigBuf = Buffer.from(signature, 'base64url')
    const expectedBuf = Buffer.from(expectedSig, 'base64url')
    if (sigBuf.length !== expectedBuf.length) return null

    const { timingSafeEqual } = require('crypto')
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null

    // Decode payload
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString()
    ) as { tripId: string; version: number; issuedAt: number; expiresAt: number }

    if (!payload.tripId) return null

    // Check expiry — return expired: true instead of null
    const expired = Date.now() > payload.expiresAt

    return { tripId: payload.tripId, expired }
  } catch {
    return null
  }
}
