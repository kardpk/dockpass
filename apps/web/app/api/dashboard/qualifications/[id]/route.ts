import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'

/**
 * PATCH /api/dashboard/qualifications/[id]
 *
 * Operator reviews a guest qualification: approve / flag / reject.
 * Auth: requireOperator() — only the owning operator may review.
 */

const reviewSchema = z.object({
  status:       z.enum(['approved', 'flagged', 'rejected']),
  review_notes: z.string().max(1000).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, {
    max: 60,
    window: 3600,
    key: `qualify-review:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Verify this qualification belongs to this operator
  const { data: existing } = await supabase
    .from('guest_qualifications')
    .select('id, operator_id, guest_id, trip_id')
    .eq('id', id)
    .single()

  if (!existing || existing.operator_id !== operator.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: updated, error } = await supabase
    .from('guest_qualifications')
    .update({
      qualification_status: parsed.data.status,
      review_notes:         parsed.data.review_notes ?? null,
      reviewed_by_staff:    true,
      reviewed_at:          new Date().toISOString(),
      updated_at:           new Date().toISOString(),
    })
    .eq('id', id)
    .eq('operator_id', operator.id)
    .select()
    .single()

  if (error || !updated) {
    console.error('[qualification-review] update error:', error)
    return NextResponse.json(
      { error: 'Failed to update qualification.' },
      { status: 500 }
    )
  }

  auditLog({
    action:          'qualification_reviewed',
    operatorId:      operator.id,
    actorType:       'operator',
    actorIdentifier: operator.id,
    entityType:      'guest_qualification',
    entityId:        id,
    changes: {
      status:       parsed.data.status,
      review_notes: parsed.data.review_notes ?? null,
      guest_id:     existing.guest_id,
      trip_id:      existing.trip_id,
    },
  })

  return NextResponse.json({ data: updated })
}
