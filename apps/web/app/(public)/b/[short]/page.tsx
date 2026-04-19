import { notFound, redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { headers } from "next/headers";
import { auditLog } from "@/lib/security/audit";

/**
 * /b/[short] — Short boarding URL redirect
 *
 * Looks up short_board_token in the boats table, then 307-redirects
 * to the canonical /board/[publicSlug] page where all real logic lives.
 *
 * Security model:
 *   - No sensitive data is returned here — just a redirect
 *   - Rate limiting, guest auth, and trip logic all happen on the destination
 *   - short_board_token is non-secret (printed on laminated QR, shared freely)
 *
 * Backward compat: /board/[publicSlug] works forever alongside this route.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShortBoardRedirectPage({
  params,
}: {
  params: Promise<{ short: string }>;
}) {
  const { short } = await params;

  // Basic sanity check — short tokens are lowercase alphanumeric + hyphens
  if (!short || !/^[a-z0-9-]{3,40}$/.test(short)) {
    return notFound();
  }

  const supabase = createServiceClient();

  // Look up the full public_slug via the short token
  const { data: boat } = await supabase
    .from("boats")
    .select("id, public_slug")
    .eq("short_board_token", short)
    .eq("is_active", true)
    .maybeSingle();

  if (!boat?.public_slug) {
    return notFound();
  }

  // Fire-and-forget audit log (non-blocking)
  void (async () => {
    try {
      const headerList = await headers();
      const ip =
        headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      auditLog({
        action: "board_qr_scan_short",
        operatorId: null,
        actorType: "guest",
        actorIdentifier: ip,
        entityType: "boat",
        entityId: boat.id,
        changes: { short, resolvedTo: boat.public_slug },
      });
    } catch {
      // Never block the redirect on audit failure
    }
  })();

  // 307 → canonical boarding URL (temporary so future slug changes redirect correctly)
  redirect(`/board/${boat.public_slug}`);
}
