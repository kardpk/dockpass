import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'
import type { CaptainProfile } from '@/types'

// ── Validation Schemas ──────────────────────────────────────
const createCaptainSchema = z.object({
  fullName: z.string().min(2).max(100),
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
// GET /api/dashboard/captains
// List operator's captain roster
// ═══════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, { max: 60, window: 60, key: 'captains:list' })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { user } = await requireOperator()
  const supabase = createServiceClient()

  const { data: captains, error } = await supabase
    .from('captains')
    .select('*')
    .eq('operator_id', user.id)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('full_name', { ascending: true })

  if (error) {
    console.error('[captains:list]', error.message)
    return NextResponse.json({ error: 'Failed to load captains' }, { status: 500 })
  }

  const profiles: CaptainProfile[] = (captains ?? []).map(toCaptainProfile)
  return NextResponse.json({ data: profiles })
}


// ═══════════════════════════════════════════════════════════════
// POST /api/dashboard/captains
// Add new captain to operator's roster
// ═══════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, { max: 20, window: 3600, key: 'captains:create' })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { user } = await requireOperator()
  const supabase = createServiceClient()

  const body = await req.json().catch(() => null)
  const parsed = createCaptainSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const d = parsed.data

  // If this is the first captain or marked default, ensure no other defaults
  if (d.isDefault) {
    await supabase
      .from('captains')
      .update({ is_default: false })
      .eq('operator_id', user.id)
      .eq('is_default', true)
  }

  const { data: created, error } = await supabase
    .from('captains')
    .insert({
      operator_id: user.id,
      full_name: d.fullName,
      photo_url: d.photoUrl ?? null,
      bio: d.bio ?? null,
      phone: d.phone ?? null,
      email: d.email ?? null,
      license_number: d.licenseNumber ?? null,
      license_type: d.licenseType ?? null,
      license_expiry: d.licenseExpiry ?? null,
      languages: d.languages ?? ['en'],
      years_experience: d.yearsExperience ?? null,
      certifications: d.certifications ?? [],
      is_default: d.isDefault ?? false,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A captain with this email already exists in your roster' },
        { status: 409 }
      )
    }
    console.error('[captains:create]', error.message)
    return NextResponse.json({ error: 'Failed to create captain' }, { status: 500 })
  }

  await auditLog({
    action: 'captain_created',
    operatorId: user.id,
    actorType: 'operator',
    actorIdentifier: user.email ?? user.id,
    entityType: 'captain',
    entityId: created.id,
    changes: { fullName: d.fullName, license: d.licenseNumber },
  })

  return NextResponse.json({ data: toCaptainProfile(created) }, { status: 201 })
}
