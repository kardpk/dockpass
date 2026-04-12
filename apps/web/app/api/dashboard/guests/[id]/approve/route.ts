import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { auditLog } from '@/lib/security/audit'
import { z } from 'zod'

const schema = z.object({
  action: z.enum(['approved', 'declined']),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('guests')
    .update({
      approval_status: parsed.data.action,
      approved_at: parsed.data.action === 'approved'
        ? new Date().toISOString()
        : null,
    })
    .eq('id', id)
    .eq('operator_id', operator.id)
    .select('id, full_name, trip_id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
  }

  auditLog({
    action: parsed.data.action === 'approved'
      ? 'approval_granted' : 'approval_denied',
    operatorId: operator.id,
    actorType: 'operator',
    actorIdentifier: operator.id,
    entityType: 'guest',
    entityId: id,
    changes: { guestName: data.full_name },
  })

  return NextResponse.json({ data: { id, status: parsed.data.action } })
}
