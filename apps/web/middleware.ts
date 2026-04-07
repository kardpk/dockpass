import { NextRequest, NextResponse } from "next/server";

// DockPass Middleware
// Handles: auth checks for dashboard routes, security headers
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );

  // Dashboard routes require auth (will be enforced with Supabase)
  if (pathname.startsWith("/dashboard")) {
    // TODO: Check Supabase Auth session
    // const session = await getSession(request)
    // if (!session) return NextResponse.redirect(new URL('/login', request.url))
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and api
    "/((?!_next/static|_next/image|favicon.ico|icons/).*)",
  ],
};
