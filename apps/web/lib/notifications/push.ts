import 'server-only'
import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/service'

// Init VAPID (idempotent — safe to call repeatedly)
let vapidInitialised = false
function initVapid() {
  if (vapidInitialised) return
  const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privKey = process.env.VAPID_PRIVATE_KEY
  if (!pubKey || !privKey) return
  webpush.setVapidDetails(
    'mailto:hello@boatcheckin.com',
    pubKey,
    privKey
  )
  vapidInitialised = true
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
  tag?: string        // Replaces previous notification with same tag
}

// Send push to a single subscription
export async function sendPush(
  subscription: PushSubscription | object,
  payload: PushPayload
): Promise<void> {
  initVapid()
  if (!vapidInitialised) {
    console.warn('[push] VAPID keys not set — skipping push')
    return
  }

  try {
    await webpush.sendNotification(
      subscription as any,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon ?? '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: payload.tag,
        data: { url: payload.url ?? '/' },
      })
    )
  } catch (err: any) {
    // 410 Gone = subscription expired
    // 404 Not Found = invalid subscription
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Mark subscription as invalid in DB (non-blocking)
      removeExpiredPushSubscription(subscription).catch(() => null)
    }
    // Never throw — push failure is non-critical
  }
}

// Send push to ALL guests on a trip
export async function sendPushToAllGuests(
  tripId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const supabase = createServiceClient()

  // 1. Get all active guests for this trip
  const { data: guests } = await supabase
    .from('guests')
    .select('id')
    .eq('trip_id', tripId)
    .is('deleted_at', null)

  const guestIds = guests?.map(g => g.id) || []
  if (guestIds.length === 0) {
    return { sent: 0, failed: 0 }
  }

  // 2. Lookup push subscriptions for these guests
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, keys')
    .eq('target_type', 'guest')
    .in('target_id', guestIds)
    .eq('is_active', true)

  if (!subs || subs.length === 0) {
    return { sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  await Promise.allSettled(
    subs.map(async sub => {
      try {
        await sendPush(sub, payload)
        sent++
      } catch {
        failed++
      }
    })
  )

  return { sent, failed }
}

async function removeExpiredPushSubscription(
  subscription: any
): Promise<void> {
  if (!subscription || !subscription.endpoint) return
  const supabase = createServiceClient()
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', subscription.endpoint)
}
