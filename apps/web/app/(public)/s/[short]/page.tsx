import { redirect } from "next/navigation";
import { redis, CACHE_KEYS } from "@/lib/redis/client";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export default async function ShortUrlRedirectPage({
  params,
}: {
  params: Promise<{ short: string }>;
}) {
  const { short } = await params;
  
  if (!short || short.length < 8) {
    redirect('/');
  }

  const redisKey = CACHE_KEYS.shortUrlToken(short);
  const fullToken = await redis.get<string>(redisKey);

  if (!fullToken) {
    // If expired or invalid
    redirect('/link-expired');
  }

  // We have the full HMAC token, we can log the open event if possible
  // To keep it simple, log it loosely. We extract tripId directly from token if possible,
  // but since token is JWT/HMAC, we might need to parse payload.
  try {
    const [payloadB64] = fullToken.split('.');
    if (payloadB64) {
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
      if (payload?.tripId) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        // Log captain open event
        await supabase.from('audit_log').insert({
          action: 'captain_snapshot_opened_via_sms',
          entity_type: 'trips',
          record_id: payload.tripId,
        });
      }
    }
  } catch (err) {
    console.error("[ShortURL] Failed to parse and log token payload:", err);
  }

  // Redirect to full snapshot route
  redirect(`/snapshot/${fullToken}`);
}
