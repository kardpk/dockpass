import "server-only";

/**
 * Turnstile bot protection — BYPASSED FOR BETA
 *
 * Will be re-enabled near production with proper key configuration.
 * The other 12 security layers (rate limiting, code validation,
 * capacity check, waiver hash, etc.) still protect the endpoint.
 */
export async function verifyTurnstile(_token: string): Promise<boolean> {
  // Beta: bot check bypassed — re-enable with TURNSTILE_SECRET_KEY for production
  return true;
}

