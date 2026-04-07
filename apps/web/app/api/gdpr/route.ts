import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
  void req;
  return NextResponse.json({ data: null, error: "Not implemented" }, { status: 501 });
}
