import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const { token } = await params;

  // TODO: Validate HMAC token, return captain snapshot data
  return NextResponse.json({
    data: { token: token.slice(0, 8), status: "placeholder" },
    error: null,
  });
}
