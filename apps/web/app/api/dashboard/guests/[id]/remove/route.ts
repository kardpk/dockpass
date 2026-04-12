import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createClient } from '@/lib/supabase/server'
import { auditLog } from '@/lib/security/audit'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()
  const supabase = await createClient()

  // Soft delete — never hard delete guest records
  const { data, error } = await supabase
    .from('guests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('operator_id', operator.id)
    .select('id, full_name')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
  }

  auditLog({
    action: 'guest_removed',
    operatorId: operator.id,
    actorType: 'operator',
    actorIdentifier: operator.id,
    entityType: 'guest',
    entityId: id,
    changes: { guestName: data.full_name },
  })

  return NextResponse.json({ data: { removed: true } })
}
