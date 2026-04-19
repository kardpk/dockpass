import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateShortBoardToken } from "@/lib/utils/shortBoardToken";

/**
 * POST /api/internal/backfill-short-tokens
 *
 * One-time backfill endpoint: assigns short_board_token to all existing boats
 * that don't have one. Called once after migration 024 is applied in Supabase.
 *
 * Security: requires x-internal-secret header matching INTERNAL_SECRET env var.
 *
 * Usage:
 *   curl -X POST https://boatcheckin.com/api/internal/backfill-short-tokens \
 *        -H "x-internal-secret: YOUR_SECRET"
 *
 * Safe to call multiple times — only updates rows where short_board_token IS NULL.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth: internal secret gate ──────────────────────────────────────────
  const secret = process.env.INTERNAL_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INTERNAL_SECRET env var not configured" },
      { status: 500 }
    );
  }

  const providedSecret = req.headers.get("x-internal-secret");
  if (!providedSecret || providedSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // ── Fetch boats without a short token ───────────────────────────────────
  const { data: boats, error } = await supabase
    .from("boats")
    .select("id, boat_name, short_board_token")
    .is("short_board_token", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!boats || boats.length === 0) {
    return NextResponse.json({
      message: "All boats already have short tokens.",
      updated: 0,
    });
  }

  // ── Generate & assign tokens ─────────────────────────────────────────────
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const boat of boats) {
    const token = generateShortBoardToken(
      boat.id as string,
      boat.boat_name as string
    );

    const { error: updateError } = await supabase
      .from("boats")
      .update({ short_board_token: token })
      .eq("id", boat.id)
      .is("short_board_token", null); // idempotency guard

    if (updateError) {
      // Likely a unique constraint collision — append suffix and retry once
      if (updateError.code === "23505") {
        const fallbackToken = `${token}-${Math.random().toString(36).slice(2, 5)}`;
        const { error: retryError } = await supabase
          .from("boats")
          .update({ short_board_token: fallbackToken })
          .eq("id", boat.id)
          .is("short_board_token", null);

        if (retryError) {
          errors.push(`${boat.id}: ${retryError.message}`);
          skipped++;
          continue;
        }
      } else {
        errors.push(`${boat.id}: ${updateError.message}`);
        skipped++;
        continue;
      }
    }

    updated++;
  }

  return NextResponse.json({
    message: `Backfill complete.`,
    total: boats.length,
    updated,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
