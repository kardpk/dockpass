import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'

/**
 * GET  /api/dashboard/property-codes  — list operator's property codes
 * POST /api/dashboard/property-codes  — create new code
 */

const ADDON_CATEGORIES = ['food','beverage','gear','safety','experience','seasonal','other','general'] as const

const createSchema = z.object({
  code:                  z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/, 'Use uppercase letters, numbers, _ or -'),
  description:           z.string().max(100).optional(),
  discountType:          z.enum(['percent', 'fixed_cents', 'unlock_addons']),
  discountValue:         z.number().int().min(0),
  validFrom:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  validUntil:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  maxUses:               z.number().int().min(1).optional(),
  boatId:                z.string().uuid().optional(),
  // null = all categories; array = subset
  applicableCategories:  z.array(z.enum(ADDON_CATEGORIES)).optional(),
})

export async function GET(req: NextRequest) {
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, { max: 60, window: 60, key: `prop-codes-list:${operator.id}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('property_codes')
    .select('id, code, description, discount_type, discount_value, applicable_categories, valid_from, valid_until, max_uses, use_count, boat_id, is_active, created_at, boats(boat_name)')
    .eq('operator_id', operator.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  return NextResponse.json({
    data: (data ?? []).map(r => ({
      id:                   r.id,
      code:                 r.code,
      description:          r.description,
      discountType:         r.discount_type,
      discountValue:        r.discount_value,
      applicableCategories: (r.applicable_categories as string[] | null) ?? null,
      validFrom:            r.valid_from,
      validUntil:           r.valid_until,
      maxUses:              r.max_uses,
      useCount:             r.use_count,
      boatId:               r.boat_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      boatName:             (r.boats as any)?.boat_name ?? null,
      isActive:             r.is_active,
      createdAt:            r.created_at,
    }))
  })
}

export async function POST(req: NextRequest) {
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, { max: 20, window: 3600, key: `prop-codes-create:${operator.id}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const d = parsed.data

  // Validate discount value range
  if (d.discountType === 'percent' && (d.discountValue < 1 || d.discountValue > 100)) {
    return NextResponse.json({ error: 'Percent discount must be 1–100' }, { status: 400 })
  }

  // Validate boat belongs to operator if provided
  if (d.boatId) {
    const supabase = createServiceClient()
    const { data: boat } = await supabase.from('boats').select('id').eq('id', d.boatId).eq('operator_id', operator.id).single()
    if (!boat) return NextResponse.json({ error: 'Boat not found' }, { status: 404 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('property_codes')
    .insert({
      operator_id:           operator.id,
      code:                  d.code.toUpperCase(),
      description:           d.description ?? null,
      discount_type:         d.discountType,
      discount_value:        d.discountValue,
      applicable_categories: d.applicableCategories?.length ? d.applicableCategories : null,
      valid_from:            d.validFrom ?? null,
      valid_until:           d.validUntil ?? null,
      max_uses:              d.maxUses ?? null,
      boat_id:               d.boatId ?? null,
      is_active:             true,
    })
    .select('id, code, discount_type, discount_value')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: `Code "${d.code}" already exists for your account` }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create code' }, { status: 500 })
  }

  auditLog({
    action: 'property_code_created',
    operatorId: operator.id,

    actorType: 'operator',
    actorIdentifier: operator.id,
    entityType: 'property_code',
    entityId: data!.id,
    changes: { code: d.code, discountType: d.discountType },
  })

  return NextResponse.json({ data }, { status: 201 })
}
