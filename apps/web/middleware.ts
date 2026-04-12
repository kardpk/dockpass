import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * BoatCheckin Middleware — CRITICAL 2 + HIGH 4 + HIGH 7 + AUTH GUARD
 * Handles: Auth guard, CSP, security headers, CORS, request size limits
 */

const WEBHOOK_PATHS = [
  '/api/webhooks/stripe',
  '/api/webhooks/buoy',
  '/api/webhooks/tint',
]

const ALLOWED_ORIGINS = [
  'https://boatcheckin.com',
  'https://www.boatcheckin.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
].filter(Boolean)

// CRITICAL 2: Full CSP that allows Mapbox, Supabase Realtime, Stripe
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://api.mapbox.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.supabase.co https://api.mapbox.com https://events.mapbox.com",
  "font-src 'self' https://fonts.gstatic.com",
  [
    "connect-src 'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://api.open-meteo.com',
    'https://api.mapbox.com',
    'https://events.mapbox.com',
    'https://api.stripe.com',
    'https://api.resend.com',
    'https://api.twilio.com',
    'https://api.apify.com',
    'https://api.buoy.insure',
    'https://challenges.cloudflare.com',
  ].join(' '),
  "worker-src 'self' blob:",
  'frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com',
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

// Auth pages — logged-in operators are redirected away from these
const AUTH_PATHS = ['/login', '/signup', '/forgot-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin') ?? ''
  const isWebhook = WEBHOOK_PATHS.some((p) => pathname.startsWith(p))

  // ─── HIGH 4: Reject requests over 10MB ──────────────────────────────────
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return new NextResponse('Request too large', { status: 413 })
  }

  // ─── Preflight ──────────────────────────────────────────────────────────
  if (request.method === 'OPTIONS') {
    const preflightHeaders = new Headers()
    preflightHeaders.set(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,DELETE,OPTIONS'
    )
    preflightHeaders.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, stripe-signature'
    )
    if (isWebhook) {
      preflightHeaders.set('Access-Control-Allow-Origin', '*')
    } else if (ALLOWED_ORIGINS.includes(origin)) {
      preflightHeaders.set('Access-Control-Allow-Origin', origin)
    }
    return new NextResponse(null, { status: 200, headers: preflightHeaders })
  }

  // ─── 1. Create mutable response for Supabase cookie refresh ─────────────
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // ─── 2. Build Supabase client for edge (cookie-based, no DB) ────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Must reassign response so refreshed cookie is sent back
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ─── 3. Refresh session (MUST call before auth check) ───────────────────
  const { data: { user } } = await supabase.auth.getUser()

  // ─── 4. Dashboard auth guard ────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ─── 5. Redirect authenticated operators away from auth pages ───────────
  if (user && AUTH_PATHS.includes(pathname)) {
    const hasError = request.nextUrl.searchParams.has('error')
    if (!hasError) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ─── 6. Security headers ───────────────────────────────────────────────
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)'
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  response.headers.set('Content-Security-Policy', csp)

  // ─── 7. CORS ───────────────────────────────────────────────────────────
  if (isWebhook) {
    response.headers.set('Access-Control-Allow-Origin', '*')
  } else if (ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Vary', 'Origin')
  }
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,DELETE,OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, stripe-signature'
  )

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|security.txt|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4)$).*)',
  ],
}
