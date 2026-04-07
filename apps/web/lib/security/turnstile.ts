import "server-only";

/**
 * HIGH 3 fix: Cloudflare Turnstile server-side verification.
 * Free bot protection — verify tokens before guest registration.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // In development, skip Turnstile if not configured
    if (process.env.NODE_ENV === "development") return true;
    console.error("[turnstile] TURNSTILE_SECRET_KEY not set");
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
