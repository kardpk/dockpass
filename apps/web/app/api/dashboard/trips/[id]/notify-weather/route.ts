import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { sendPushToAllGuests } from '@/lib/notifications/push'
import { z } from 'zod'

const schema = z.object({
  message: z.string()
    .min(5)
    .max(200)
    .transform(s => s.trim()),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  // Rate limit: 1 weather notification per trip per hour
  const limited = await rateLimit(req, {
    max: 1, window: 3600,
    key: `notify-weather:${id}:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Weather notification already sent in the last hour' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid message' }, { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Verify ownership + get slug for chat
  const { data: trip } = await supabase
    .from('trips')
    .select('id, slug, operator_id')
    .eq('id', id)
    .eq('operator_id', operator.id)
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found' }, { status: 404 }
    )
  }

  // Send push to all guests
  const pushResult = await sendPushToAllGuests(id, {
    title: '⚠️ Weather update for your charter',
    body: parsed.data.message,
    url: `/trip/${trip.slug}`,
    tag: `weather-alert-${id}`,
  })

  // Also post as a system message in chat
  // so guests see it when they open the trip page
  void (async () => {
    await supabase.from('trip_messages').insert({
      trip_id: id,
      operator_id: operator.id,
      sender_type: 'system',
      sender_name: 'BoatCheckin Weather',
      body: `⚠️ ${parsed.data.message}`,
      is_quick_chip: false,
    })
  })()

  return NextResponse.json({
    data: {
      pushSent: pushResult.sent,
      pushFailed: pushResult.failed,
    },
  })
}
