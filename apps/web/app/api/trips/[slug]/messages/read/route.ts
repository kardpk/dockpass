import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireOperator } from '@/lib/security/auth'
import { z } from 'zod'

const readSchema = z.object({
  senderType: z.enum(['guest', 'captain', 'operator']),
  senderId: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = readSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  if (parsed.data.senderType !== 'guest') {
    // Operator/captain marking guest messages as read
    const { operator } = await requireOperator()
    await supabase
      .from('trip_messages')
      .update({ read_at: now })
      .eq('trip_id', slug)
      .eq('operator_id', operator.id)
      .is('read_at', null)
      .neq('sender_type', 'captain')
      .neq('sender_type', 'operator')
  } else {
    // Guest marking captain/operator messages as read
    await supabase
      .from('trip_messages')
      .update({ read_at: now })
      .eq('trip_id', slug)
      .in('sender_type', ['captain', 'operator'])
      .is('read_at', null)
  }

  return NextResponse.json({ data: { ok: true } })
}
