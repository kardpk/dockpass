import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  // TODO: Fetch trip data from Supabase
  return NextResponse.json({
    data: { slug, status: "placeholder" },
    error: null,
  });
}
