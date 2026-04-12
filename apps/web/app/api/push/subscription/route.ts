import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
    const { oldEndpoint, newSubscription, targetType, targetId } = await req.json();

    if (!newSubscription?.endpoint || !targetType || !targetId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!['guest', 'operator', 'captain'].includes(targetType)) {
      return NextResponse.json(
        { error: "Invalid targetType" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // If we have an old endpoint, simply delete it (cleaner than setting inactive)
    if (oldEndpoint) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", oldEndpoint);
    }

    // Upsert the new subscription
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: newSubscription.endpoint,
        keys: newSubscription.keys,
        target_type: targetType,
        target_id: targetId,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("[push/subscription] Upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
