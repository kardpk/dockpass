import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Ultra minimal proxy to determine if Vercel Edge Runtime is crashing on our logic or file
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|security.txt|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4)$).*)',
  ],
}
