import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * HIGH 5 fix: Service role client with hard guards.
 * This file MUST NEVER be imported in client components.
 * The `server-only` import + runtime check provide double protection.
 */

// Runtime guard against accidental client-side import
if (typeof window !== "undefined") {
  throw new Error(
    "SECURITY: lib/supabase/service.ts imported on client. " +
      "This file contains the service role key. " +
      "Use lib/supabase/client.ts in client components."
  );
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase service role credentials");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
