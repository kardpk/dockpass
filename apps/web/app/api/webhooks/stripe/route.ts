import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Stripe webhook handler — needs raw body for signature verification
  // TODO: Verify Stripe signature, handle subscription events
  const body = await req.text();
  void body; // Will be used for signature verification

  return NextResponse.json({ received: true });
}
