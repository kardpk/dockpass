import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Require authenticated operator — CRITICAL 1 fix (Next.js 15 async cookies)
 * Use in Server Components and Server Actions for dashboard routes.
 */
export async function requireOperator() {
  const cookieStore = await cookies(); // MUST await in Next.js 15+
  const headersList = await headers();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — can't set cookies
          }
        },
      },
      global: {
        fetch: (url, options) => {
          return fetch(url, { ...options, cache: 'no-store' });
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Redirect to login with next param so operator returns here after login
  const pathname = headersList.get('x-invoke-path') ?? '/dashboard';
  const loginUrl = `/login?next=${encodeURIComponent(pathname)}`;

  if (error || !user) redirect(loginUrl);

  let { data: operator } = await supabase
    .from("operators")
    .select(
      "id, full_name, email, company_name, subscription_status, subscription_tier, is_active, max_boats, trial_ends_at, firma_workspace_id"
    )
    .eq("id", user.id)
    .single();

  if (!operator) {
    // Self-heal ghost accounts: auth created, but operator row failed or hasn't created yet
    const serviceClient = createServiceClient();
    const { error: healError } = await serviceClient.from("operators").insert({
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || "Operator",
      company_name: user.user_metadata?.company_name || null,
      is_active: true,
      subscription_status: "trial",
      subscription_tier: "solo",
      max_boats: 1,
    });
    
    if (healError) {
      console.error("[AUTH_HEAL_ERROR]", healError);
      redirect(`/login?error=account_inactive&debug=${encodeURIComponent(healError.message)}`);
    }

    // Fetch newly created operator
    const { data: healed, error: fetchError } = await supabase
      .from("operators")
      .select("id, full_name, email, company_name, subscription_status, subscription_tier, is_active, max_boats, trial_ends_at, firma_workspace_id")
      .eq("id", user.id)
      .single();
      
    if (fetchError) {
       console.error("[AUTH_HEAL_FETCH_ERROR]", fetchError);
    }
    operator = healed;
  }

  if (!operator?.is_active) redirect(`/login?error=account_inactive&next=${encodeURIComponent(pathname)}`);

  return { user, operator, supabase };
}

