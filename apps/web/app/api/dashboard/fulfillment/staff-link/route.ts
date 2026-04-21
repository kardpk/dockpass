import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto'

/**
 * POST /api/dashboard/fulfillment/staff-link
 *
 * Generates the operator's fulfillment_token (staff URL slug)
 * and optionally sets a 4-digit PIN for access control.
 * PIN is stored as PBKDF2-SHA256 (100k iterations) — no bcrypt needed.
 *
 * Body: { pin?: string, revoke?: boolean }
 * Returns: { staffUrl: string | null, hasPin: boolean }
 */

function hashPin(pin: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(pin, salt, 100_000, 32, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, expected] = stored.split(':')
  if (!salt || !expected) return false
  try {
    const actual = pbkdf2Sync(pin, salt, 100_000, 32, 'sha256').toString('hex')
    return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'))
  } catch { return false }
}

export async function POST(req: NextRequest) {
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, { max: 10, window: 300, key: `staff-link:${operator.id}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const body = await req.json().catch(() => ({})) as { pin?: string; revoke?: boolean }
  const supabase = createServiceClient()

  if (body.revoke) {
    await supabase
      .from('operators')
      .update({ fulfillment_token: null, fulfillment_pin: null, fulfillment_token_expires: null })
      .eq('id', operator.id)
    return NextResponse.json({ data: { staffUrl: null, hasPin: false } })
  }

  const token     = randomBytes(16).toString('hex')        // 32 hex chars
  let hashedPin: string | null = null
  if (body.pin && /^\d{4}$/.test(body.pin)) {
    hashedPin = hashPin(body.pin)
  }

  const { error } = await supabase
    .from('operators')
    .update({ fulfillment_token: token, fulfillment_pin: hashedPin, fulfillment_token_expires: null })
    .eq('id', operator.id)

  if (error) return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 })

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://boatcheckin.com'
  const staffUrl = `${appUrl}/fulfill/${token}`

  return NextResponse.json({ data: { staffUrl, hasPin: !!hashedPin } })
}

/**
 * GET /api/dashboard/fulfillment/staff-link
 * Returns current staff link status (no PIN exposure).
 */
export async function GET(req: NextRequest) {
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, { max: 20, window: 60, key: `staff-link-get:${operator.id}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('operators')
    .select('fulfillment_token, fulfillment_pin')
    .eq('id', operator.id)
    .single()

  const token  = (data?.fulfillment_token as string | null) ?? null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://boatcheckin.com'

  return NextResponse.json({
    data: {
      staffUrl: token ? `${appUrl}/fulfill/${token}` : null,
      hasPin:   !!(data?.fulfillment_pin),
    },
  })
}
