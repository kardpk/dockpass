import "server-only";

/**
 * HIGH 3 fix: Cloudflare Turnstile server-side verification.
 * Free bot protection — verify tokens before guest registration.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  // In development, bypass when Turnstile widget fails to load (Error 110200)
  if (process.env.NODE_ENV === 'development' && (!token || token === 'dev-bypass')) {
    return true;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Turnstile not configured — allow registration with warning.
    // The 12 other security layers still protect the endpoint.
    console.warn("[turnstile] TURNSTILE_SECRET_KEY not set — bot check skipped");
    return true;
  }

  // If key IS configured but token is empty — likely a bot
  if (!token) {
    console.warn("[turnstile] Empty token received — blocking");
    return false;
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          response: token,
        }),
      }
    );

    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    console.error("[turnstile] verification request failed");
    return false;
  }
}
