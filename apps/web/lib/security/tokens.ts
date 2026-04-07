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
    return null;
  }
}
