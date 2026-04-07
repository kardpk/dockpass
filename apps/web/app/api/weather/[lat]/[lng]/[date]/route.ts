import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lat: string; lng: string; date: string }> }
): Promise<NextResponse> {
  const { lat, lng, date } = await params;

  // TODO: Check Redis cache first, then fetch from Open-Meteo
  return NextResponse.json({
    data: { lat, lng, date, status: "placeholder" },
    error: null,
  });
}
