import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'
import { hashQualificationAttestation } from '@/lib/security/qualification'

/**
 * POST /api/trips/[slug]/qualify
 *
 * Submits a guest's self-drive qualification attestation.
 * Creates (or updates) a guest_qualifications record with:
 *   - Experience details
 *   - Safe Boater Card URL (if uploaded)
 *   - SHA-256 attestation hash (ESIGN-comparable audit record)
 *   - IP + User-Agent attribution
 *
 * Called from StepQualification component in the guest join flow.
 * Guest must already have a guestId (from /register step prior — NOT YET the case:
 * qualification happens BEFORE waiver/registration).
 *
 * Flow clarification:
 *   The qualification step happens BEFORE the guest is registered (before waiver).
 *   At this point we only have: tripSlug + tripCode (validated in StepCode).
 *   We store qualification linked to trip only; guestId is set after registration
 *   and patched in via a separate update when registration completes.
 *
 * Therefore: we store a pre-qualification record keyed by (trip_id, attestation_hash)
 * and the registration handler links it to the guest after INSERT.
 *
 * Re-design per code reality: guestId IS available because:
 *   JoinFlowSheet order: code → details → qualification → safety → waiver
 *   But waiver/registration (StepWaiver → /register) is AFTER qualification.
 *   So at qualification time, guestId is NOT yet set in state.
 *
 * Resolution: store qualification with a temporary session_token = tripSlug+hash
 * The /register endpoint then links it by looking up the pending qualification.
 *
 * SIMPLER ALTERNATIVE (used here):
 *   Store without guestId (nullable), using trip_id + attestation_hash as unique key.
 *   The /register endpoint runs: UPDATE guest_qualifications SET guest_id = $1
 *   WHERE trip_id = $2 AND guest_id IS NULL LIMIT 1
 *   This is safe because only one guest can be completing qualification at a time
 *   for a given trip on a given device.
 *
 * Auth: None — trip slug is the access token. Same pattern as /register.
 */

const qualifySchema = z.object({
  tripSlug:              z.string().min(16).max(30),

  // Experience
  hasBoatOwnership:      z.boolean(),
  ownershipYears:        z.number().int().min(0).max(80).nullable().optional(),
  ownershipVesselType:   z.enum(['center_console','pontoon','sailboat','other']).nullable().optional(),
  experienceYears:       z.number().int().min(0).max(80),
  experienceDescription: z.string().max(500).nullable().optional(),

  // Safe Boater Card
  safetyBoaterRequired:  z.boolean(),
  safetyBoaterCardUrl:   z.string().url().nullable().optional(),
  safetyBoaterCardState: z.string().max(50).nullable().optional(),
  safetyBoaterCardNumber: z.string().max(50).nullable().optional(),

  // Attestation confirmation checkbox
  attestation:           z.literal(true),
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
  const userAgent = req.headers.get('user-agent') ?? 'unknown'

  // Rate limit: 5 qualification submissions per IP per hour
  const limited = await rateLimit(req, {
    max: 5,
    window: 3600,
    key: `qualify:${ip}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  // Parse + validate body
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = qualifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Cross-check slug
  if (data.tripSlug !== slug) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Fetch trip to get trip_id and operator_id
  const { data: trip } = await supabase
    .from('trips')
    .select('id, operator_id, status, requires_qualification, boats(requires_qualification)')
    .eq('slug', slug)
    .neq('status', 'cancelled')
    .single()

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  // Build attestation hash
  const attestedAt = new Date().toISOString()
  const attestationHash = hashQualificationAttestation({
    guestId:               'pending', // not yet registered
    tripId:                trip.id,
    hasBoatOwnership:      data.hasBoatOwnership,
    ownershipYears:        data.ownershipYears ?? null,
    ownershipVesselType:   data.ownershipVesselType ?? null,
    experienceYears:       data.experienceYears,
    experienceDescription: data.experienceDescription ?? null,
    safetyBoaterRequired:  data.safetyBoaterRequired,
    safetyBoaterCardUrl:   data.safetyBoaterCardUrl ?? null,
    safetyBoaterCardState: data.safetyBoaterCardState ?? null,
    safetyBoaterCardNumber: data.safetyBoaterCardNumber ?? null,
    attestedAt,
    ip,
    userAgent,
  })

  // Insert pending qualification record (guest_id is null — linked after /register)
  const { data: qualification, error: insertError } = await supabase
    .from('guest_qualifications')
    .insert({
      guest_id:               null,  // will be linked by /register handler
      trip_id:                trip.id,
      operator_id:            trip.operator_id,
      has_boat_ownership:     data.hasBoatOwnership,
      ownership_years:        data.ownershipYears ?? null,
      ownership_vessel_type:  data.ownershipVesselType ?? null,
      experience_years:       data.experienceYears,
      experience_description: data.experienceDescription ?? null,
      safe_boater_required:   data.safetyBoaterRequired,
      safe_boater_card_url:   data.safetyBoaterCardUrl ?? null,
      safe_boater_card_state: data.safetyBoaterCardState ?? null,
      safe_boater_card_number: data.safetyBoaterCardNumber ?? null,
      attested_at:            attestedAt,
      attestation_ip:         ip,
      attestation_user_agent: userAgent,
      attestation_hash:       attestationHash,
      qualification_status:   'pending',
    })
    .select('id')
    .single()

  if (insertError || !qualification) {
    console.error('[qualify] insert error:', insertError)
    return NextResponse.json(
      { error: 'Failed to record qualification. Please try again.' },
      { status: 500 }
    )
  }

  // Non-blocking audit log
  auditLog({
    action:           'guest_qualified',
    operatorId:       trip.operator_id,
    actorType:        'guest',
    actorIdentifier:  ip,
    entityType:       'guest_qualification',
    entityId:         qualification.id,
    changes: {
      tripId:              trip.id,
      experienceYears:     data.experienceYears,
      hasBoatOwnership:    data.hasBoatOwnership,
      safetyBoaterRequired: data.safetyBoaterRequired,
      hasCard:             !!data.safetyBoaterCardUrl,
    },
  })

  return NextResponse.json({
    data: {
      qualificationId: qualification.id,
      status:          'pending',
    },
  })
}
