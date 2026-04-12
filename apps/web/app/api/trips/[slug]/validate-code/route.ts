import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { getRedis } from '@/lib/redis/upstash'
import { hashWaiverText } from '@/lib/security/waiver'
import { z } from 'zod'

const validateCodeSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{4}$/),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'

  // Rate limit: 20 attempts per 5min per IP (more lenient than final register)
  const limited = await rateLimit(req, {
    max: 20,
    window: 300,
    key: `validatecode:${slug}:${ip}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many attempts', lockSeconds: 300 },
      { status: 429 }
    )
  }

  // Check existing lockout (set by previous wrong code attempts)
  const redis = getRedis()
  const lockKey = `lock:code:${slug}:${ip}`
  const locked = await redis.get(lockKey).catch(() => null)

  if (locked) {
    const ttl = await redis.ttl(lockKey).catch(() => 1800)
    return NextResponse.json(
      { error: 'Too many attempts', lockSeconds: ttl },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = validateCodeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid code format' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, trip_code, max_guests, status,
      trip_date, departure_time, duration_hours,
      charter_type,
      boats (
        boat_name, marina_name, slip_number,
        captain_name, waiver_text,
        firma_template_id, safety_cards
      )
    `)
    .eq('slug', slug)
    .neq('status', 'cancelled')
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found' },
      { status: 404 }
    )
  }

  if (trip.status === 'completed') {
    return NextResponse.json(
      { error: 'This trip has already ended' },
      { status: 409 }
    )
  }

  // Capacity check
  const { count } = await supabase
    .from('guests')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', trip.id)
    .is('deleted_at', null)

  if ((count ?? 0) >= trip.max_guests) {
    return NextResponse.json(
      { error: 'This trip is full' },
      { status: 409 }
    )
  }

  // Code comparison — wrong code triggers atomic increment + lockout
  if (parsed.data.code.toUpperCase() !== trip.trip_code.toUpperCase()) {
    const luaScript = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then redis.call('EXPIRE', KEYS[1], 300) end
      if current >= 5 then
        redis.call('SET', KEYS[2], '1')
        redis.call('EXPIRE', KEYS[2], 1800)
      end
      return current
    `
    const attemptsKey = `rate:code:${slug}:${ip}`
    const attempts = await redis
      .eval(luaScript, [attemptsKey, lockKey], [])
      .catch(() => 1) as number

    const remaining = Math.max(0, 5 - Number(attempts))
    return NextResponse.json(
      {
        valid: false,
        error: remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} left.`
          : 'Too many attempts. Locked out for 30 minutes.',
        remaining,
      },
      { status: 400 }
    )
  }

  // Code is correct — compute waiver hash to send to client
  const boat = trip.boats as unknown as {
    boat_name: string
    marina_name: string
    slip_number: string | null
    captain_name: string | null
    waiver_text: string | null
    firma_template_id: string | null
    safety_cards: unknown[] | null
  } | null

  const waiverHash = boat?.waiver_text
    ? hashWaiverText(boat.waiver_text)
    : ''

  return NextResponse.json({
    valid: true,
    trip: {
      boatName: boat?.boat_name ?? '',
      marinaName: boat?.marina_name ?? '',
      slipNumber: boat?.slip_number ?? null,
      captainName: boat?.captain_name ?? null,
      tripDate: trip.trip_date,
      departureTime: trip.departure_time,
      durationHours: trip.duration_hours,
      charterType: trip.charter_type,
      waiverHash,
      firmaTemplateId: boat?.firma_template_id ?? null,
      safetyCards: boat?.safety_cards ?? [],
    },
  })
}
