import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'
import type { CaptainProfile } from '@/types'

// ── Validation Schema ───────────────────────────────────────
const updateCaptainSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  photoUrl: z.string().url().max(500).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  licenseNumber: z.string().max(100).optional().nullable(),
  licenseType: z.enum([
    'OUPV', 'Master 25 Ton', 'Master 50 Ton',
    'Master 100 Ton', 'Master 200 Ton', 'Master Unlimited',
    'Able Seaman', 'Other',
  ]).optional().nullable(),
  licenseExpiry: z.string().optional().nullable(),
  languages: z.array(z.string().max(5)).max(10).optional(),
  yearsExperience: z.number().int().min(0).max(80).optional().nullable(),
  certifications: z.array(z.string().max(100)).max(20).optional(),
  isDefault: z.boolean().optional(),
})


/** Supabase row → CaptainProfile */
function toCaptainProfile(row: Record<string, unknown>): CaptainProfile {
  return {
    id: row.id as string,
    operatorId: row.operator_id as string,
    fullName: row.full_name as string,
    photoUrl: (row.photo_url as string) ?? null,
    bio: (row.bio as string) ?? null,
    phone: (row.phone as string) ?? null,
    email: (row.email as string) ?? null,
    licenseNumber: (row.license_number as string) ?? null,
    licenseType: (row.license_type as CaptainProfile['licenseType']) ?? null,
    licenseExpiry: (row.license_expiry as string) ?? null,
    languages: (row.languages as string[]) ?? ['en'],
    yearsExperience: (row.years_experience as number) ?? null,
    certifications: (row.certifications as string[]) ?? [],
    isActive: row.is_active as boolean,
    isDefault: row.is_default as boolean,
    createdAt: row.created_at as string,
  }
}


// ═══════════════════════════════════════════════════════════════
// PATCH /api/dashboard/captains/[id]
// Update captain profile
// ═══════════════════════════════════════════════════════════════
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const limited = await rateLimit(req, { max: 30, window: 3600, key: `captains:update:${id}` })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { user } = await requireOperator()
  const supabase = createServiceClient()

  const body = await req.json().catch(() => null)
  const parsed = updateCaptainSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const d = parsed.data

  // Build update object — only include fields that were provided
  const updates: Record<string, unknown> = {}
  if (d.fullName !== undefined) updates.full_name = d.fullName
  if (d.photoUrl !== undefined) updates.photo_url = d.photoUrl
  if (d.bio !== undefined) updates.bio = d.bio
  if (d.phone !== undefined) updates.phone = d.phone
  if (d.email !== undefined) updates.email = d.email
  if (d.licenseNumber !== undefined) updates.license_number = d.licenseNumber
  if (d.licenseType !== undefined) updates.license_type = d.licenseType
  if (d.licenseExpiry !== undefined) updates.license_expiry = d.licenseExpiry
  if (d.languages !== undefined) updates.languages = d.languages
  if (d.yearsExperience !== undefined) updates.years_experience = d.yearsExperience
  if (d.certifications !== undefined) updates.certifications = d.certifications

  // Handle default flag — clear other defaults first
  if (d.isDefault === true) {
    await supabase
      .from('captains')
      .update({ is_default: false })
      .eq('operator_id', user.id)
      .eq('is_default', true)
    updates.is_default = true
  } else if (d.isDefault === false) {
    updates.is_default = false
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('captains')
    .update(updates)
    .eq('id', id)
    .eq('operator_id', user.id) // RLS + explicit check
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A captain with this email already exists in your roster' },
        { status: 409 }
      )
    }
    console.error('[captains:update]', error.message)
    return NextResponse.json({ error: 'Failed to update captain' }, { status: 500 })
  }

  if (!updated) {
    return NextResponse.json({ error: 'Captain not found' }, { status: 404 })
  }

  await auditLog({
    action: 'captain_updated',
    operatorId: user.id,
    actorType: 'operator',
    actorIdentifier: user.email ?? user.id,
    entityType: 'captain',
    entityId: id,
    changes: updates,
  })

  return NextResponse.json({ data: toCaptainProfile(updated) })
}


// ═══════════════════════════════════════════════════════════════
// DELETE /api/dashboard/captains/[id]
// Soft-delete captain (set is_active = false)
// ═══════════════════════════════════════════════════════════════
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const limited = await rateLimit(req, { max: 10, window: 3600, key: `captains:delete:${id}` })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { user } = await requireOperator()
  const supabase = createServiceClient()

  // Soft-delete: mark as inactive
  const { error } = await supabase
    .from('captains')
    .update({ is_active: false })
    .eq('id', id)
    .eq('operator_id', user.id)

  if (error) {
    console.error('[captains:delete]', error.message)
    return NextResponse.json({ error: 'Failed to deactivate captain' }, { status: 500 })
  }

  await auditLog({
    action: 'captain_deactivated',
    operatorId: user.id,
    actorType: 'operator',
    actorIdentifier: user.email ?? user.id,
    entityType: 'captain',
    entityId: id,
    changes: { is_active: false },
  })

  return NextResponse.json({ data: { id, deactivated: true } })
}
