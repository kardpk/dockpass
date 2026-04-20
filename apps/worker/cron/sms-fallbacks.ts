import { createClient } from '@supabase/supabase-js'
import { smsQueue } from '../queues/index'
import crypto from 'crypto'
import { generateSnapshotToken } from '../../web/lib/security/snapshot'
import { redis, CACHE_KEYS } from '../../web/lib/redis/client'
import { smsTemplates } from '../../web/lib/notifications/sms-templates'

// Invoked externally by a worker 5-minute schedule
export async function runSmsFallbacks() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find trips departing in < 65 minutes but > 0 minutes, where sms hasn't been sent.
  // In pure Postgres logic:
  const now = new Date()
  const cutoff = new Date(now.getTime() + 65 * 60 * 1000)

  const { data: activeTrips, error } = await supabase
    .from('trips')
    .select(`
      id,
      trip_date,
      departure_time,
      max_guests,
      snapshot_sms_sent_at,
      trip_code,
      boats(boat_name),
      trip_assignments(captains(phone))
    `)
    .is('snapshot_sms_sent_at', null)
    .is('deleted_at', null)

  if (error || !activeTrips) return

  for (const trip of activeTrips) {
    const tDate = trip.trip_date
    const tTime = trip.departure_time || '09:00:00'
    const tripTimestamp = new Date(`${tDate}T${tTime}Z`)
    
    const minutesToDeparture = (tripTimestamp.getTime() - now.getTime()) / 60000

    if (minutesToDeparture > 0 && minutesToDeparture <= 65) {
      // 1. Recount guests currently boarded
      const { count } = await supabase
        .from('guests')
        .select('id', { count: 'exact' })
        .eq('trip_id', trip.id)
        .is('deleted_at', null)
        .not('checked_in_at', 'is', null)

      const captainPhone = (trip?.trip_assignments as any)?.[0]?.captains?.phone
      if (!captainPhone) continue

      const expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000)
      const fullToken = generateSnapshotToken(trip.id, expiresAt)
      const shortToken = crypto.createHash('sha256').update(fullToken).digest('hex').substring(0, 8)
      
      await redis.set(CACHE_KEYS.shortUrlToken(shortToken), fullToken, { ex: 21600 })
      
      const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${shortToken}`
      const body = smsTemplates.captainSnapshotPartial({
        boatName: (trip.boats as any)?.boat_name || 'Vessel',
        date: tDate,
        time: tTime,
        checkedIn: count || 0,
        total: trip.max_guests,
        shortUrl,
      })

      // Lock the row before firing
      await supabase.from('trips').update({ snapshot_sms_sent_at: now.toISOString() }).eq('id', trip.id)

      await smsQueue.add('captain_snapshot', {
        type: 'captain_snapshot',
        payload: { tripId: trip.id, captainPhone, body, eventType: 'snapshot_partial' }
      }, {
        jobId: `snapshot-fallback-${trip.id}`,
        delay: 0,
      })

      console.log(`[sms-fallback] Queued partial snapshot for trip ${trip.id}`)
    }
  }
}
