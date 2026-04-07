import { NextRequest, NextResponse } from "next/server";

/**
 * DockPass Middleware — CRITICAL 2 + HIGH 4 + HIGH 7
 * Handles: CSP, security headers, CORS, request size limits, auth routing
 */

const WEBHOOK_PATHS = [
  "/api/webhooks/stripe",
  "/api/webhooks/buoy",
  "/api/webhooks/tint",
];

const ALLOWED_ORIGINS = [
  "https://dockpass.io",
  "https://www.dockpass.io",
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : "",
].filter(Boolean);

// CRITICAL 2: Full CSP that allows Mapbox, Supabase Realtime, Stripe
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://api.mapbox.com",
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.supabase.co https://api.mapbox.com https://events.mapbox.com",
  "font-src 'self' https://fonts.gstatic.com",
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.open-meteo.com",
    "https://api.mapbox.com",
    "https://events.mapbox.com",
    "https://api.stripe.com",
    "https://api.resend.com",
    "https://api.twilio.com",
    "https://api.apify.com",
    "https://api.buoy.insure",
  ].join(" "),
  "worker-src 'self' blob:",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin") ?? "";
  const isWebhook = WEBHOOK_PATHS.some((p) => pathname.startsWith(p));

  // HIGH 4: Reject requests over 10MB
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return new NextResponse("Request too large", { status: 413 });
  }

  // Preflight
  if (request.method === "OPTIONS") {
    const preflightHeaders = new Headers();
    preflightHeaders.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    preflightHeaders.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, stripe-signature"
    );
    if (isWebhook) {
      preflightHeaders.set("Access-Control-Allow-Origin", "*");
    } else if (ALLOWED_ORIGINS.includes(origin)) {
      preflightHeaders.set("Access-Control-Allow-Origin", origin);
    }
    return new NextResponse(null, { status: 200, headers: preflightHeaders });
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );
  response.headers.set("Content-Security-Policy", csp);

  // HIGH 7: CORS
  if (isWebhook) {
    response.headers.set("Access-Control-Allow-Origin", "*");
  } else if (ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, stripe-signature"
  );

  // Dashboard routes require auth (enforced via Supabase in page components)
  // Middleware just ensures security headers are present on all routes

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|security.txt|robots.txt).*)",
  ],
};
