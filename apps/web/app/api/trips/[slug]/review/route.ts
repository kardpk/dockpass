import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { reviewSchema } from '@/lib/security/sanitise'
import { auditLog } from '@/lib/security/audit'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Rate limit: 3 reviews per hour per IP
  const limited = await rateLimit(req, {
    max: 3, window: 3600,
    key: `review:${slug}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid review data' },
      { status: 400 }
    )
  }

  const { tripSlug, guestId, rating, feedbackText } = parsed.data

  if (tripSlug !== slug) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Verify guest belongs to this trip
  const { data: guest } = await supabase
    .from('guests')
    .select('id, trip_id, full_name')
    .eq('id', guestId)
    .is('deleted_at', null)
    .single()

  if (!guest) {
    return NextResponse.json(
      { error: 'Guest not found' },
      { status: 404 }
    )
  }

  // Verify trip is completed and matches slug
  const { data: trip } = await supabase
    .from('trips')
    .select('id, operator_id, status')
    .eq('id', guest.trip_id)
    .eq('slug', slug)
    .eq('status', 'completed')
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found or not yet completed' },
      { status: 404 }
    )
  }

  // Idempotency: one review per guest per trip
  const { data: existing } = await supabase
    .from('trip_reviews')
    .select('id, rating')
    .eq('trip_id', trip.id)
    .eq('guest_id', guestId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      data: {
        reviewId: existing.id,
        rating: existing.rating,
        isDuplicate: true,
      },
    })
  }

  // Review gate: 4-5 stars are public, 1-3 are private
  const isPublic = rating >= 4

  const { data: review, error } = await supabase
    .from('trip_reviews')
    .insert({
      trip_id: trip.id,
      guest_id: guestId,
      operator_id: trip.operator_id,
      rating,
      feedback_text: feedbackText ?? null,
      is_public: isPublic,
      platform: isPublic ? null : 'internal',
    })
    .select('id')
    .single()

  if (error || !review) {
    return NextResponse.json(
      { error: 'Failed to save review' },
      { status: 500 }
    )
  }

  // Mark guest as reviewed (non-blocking)
  void supabase
    .from('guests')
    .update({ reviewed_at: new Date().toISOString() })
    .eq('id', guestId)

  // Notify operator of positive review (non-blocking)
  if (isPublic) {
    void supabase
      .from('operator_notifications')
      .insert({
        operator_id: trip.operator_id,
        type: 'positive_review',
        title: `⭐ ${rating}-star review received`,
        body: `${guest.full_name.split(' ')[0]} left a ${rating}-star review`,
        data: { tripId: trip.id, reviewId: review.id, rating },
      })
  }

  auditLog({
    action: 'review_submitted',
    actorType: 'guest',
    actorIdentifier: guestId,
    entityType: 'trip',
    entityId: trip.id,
    changes: { rating, isPublic, guestId },
    operatorId: trip.operator_id,
  })

  return NextResponse.json({
    data: {
      reviewId: review.id,
      rating,
      isPublic,
      isDuplicate: false,
    },
  })
}
