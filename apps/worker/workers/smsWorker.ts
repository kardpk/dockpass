import { Worker } from 'bullmq'
import { connection, SmsJobPayload } from '../queues'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import { generateManifest } from '../../web/lib/pdf/manifest'
import { sendEmail } from '../../web/lib/notifications/email'
import { formatTripDate } from '../../web/lib/utils/format'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_FROM_NUMBER
const statusCallback = process.env.TWILIO_STATUS_CALLBACK_URL

const twilioClient = (accountSid && authToken) ? twilio(accountSid, authToken) : null

async function processSmsJob(jobData: SmsJobPayload) {
  const { type, payload } = jobData
  
  if (!twilioClient || !fromNumber) {
    console.warn('[smsWorker] Twilio not configured. Skipping job:', type)
    return
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (type === 'captain_snapshot') {
    const { tripId, captainPhone, body, eventType } = payload
    
    // Check idempotency: Have we already sent it?
    const { data: trip } = await supabase
      .from('trips')
      .select('snapshot_sms_sent_at')
      .eq('id', tripId)
      .single()

    if (trip?.snapshot_sms_sent_at) {
      console.log(`[smsWorker] Snapshot SMS already sent for ${tripId}, skipping.`)
      return { skipped: true, reason: 'already_sent' }
    }

    // Atomic update to mark sent
    const { error: updateErr } = await supabase
      .from('trips')
      .update({ snapshot_sms_sent_at: new Date().toISOString() })
      .eq('id', tripId)
      .is('snapshot_sms_sent_at', null)

    if (updateErr) {
      throw new Error(`Failed to claim snapshot SMS lock for ${tripId}`)
    }

    const message = await twilioClient.messages.create({
      body: body,
      from: fromNumber,
      to: captainPhone,
      statusCallback,
    })

    await supabase.from('sms_log').insert({
      trip_id: tripId,
      recipient_type: 'captain',
      recipient_phone: captainPhone,
      message_body: body,
      twilio_sid: message.sid,
      event_type: eventType,
    })

    return message.sid

  } else if (type === 'operator_manifest_ready') {
    const { tripId, operatorPhone, operatorEmail, body } = payload

    console.log(`[smsWorker] Generating manifest PDF for trip: ${tripId}`)
    
    // 1. Fetch full trip data needed for manifest
    // In actual production, we need a robust fetcher query here
    const { data: tripRow, error: tripErr } = await supabase
      .from('trips')
      .select(`
        *,
        boats(boat_name, marina_name, slip_number, captain_name),
        operators(full_name, email),
        guests(*),
        guest_addon_orders(*)
      `)
      .eq('id', tripId)
      .single()

    if (tripErr || !tripRow) {
      console.error(`[smsWorker] Manifest source trip ${tripId} not found`)
      throw new Error(`Trip ${tripId} not found`)
    }

    // 2. Map directly toward standard OperatorTripDetail expectation
    // (mocking internal logic based on DB structure)
    const mockTripDetail: any = {
      id: tripRow.id,
      tripDate: tripRow.trip_date,
      departureTime: tripRow.departure_time,
      durationHours: tripRow.duration_hours,
      charterType: tripRow.charter_type,
      maxGuests: tripRow.max_guests,
      boat: {
        boatName: tripRow.boats?.boat_name || 'Vessel',
        marinaName: tripRow.boats?.marina_name || '',
        slipNumber: tripRow.boats?.slip_number,
        captainName: tripRow.boats?.captain_name,
      },
      guests: (tripRow.guests || []).map((g: any) => ({
        fullName: g.full_name,
        languagePreference: g.language_preference || 'en',
        waiverSigned: g.waiver_signed,
        isNonSwimmer: g.is_non_swimmer,
        isSeaSicknessProne: g.is_sea_sickness_prone,
        dietaryRequirements: g.dietary_requirements,
        addonOrders: (tripRow.guest_addon_orders || []).filter((o: any) => o.guest_id === g.id)
      }))
    }

    // Generate the raw PDF binary
    const operatorName = tripRow.operators?.full_name || 'Operator'
    const pdfBytes = await generateManifest(mockTripDetail, operatorName, [])
    
    // 3. Send via Resend (assuming sendEmail can handle attachments or we use Resend SDK directly)
    // Send email using native resend integration (bypassing sendEmail if attachment is unsupported, using fetch)
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (RESEND_API_KEY) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'BoatCheckin <noreply@boatcheckin.com>',
          to: [operatorEmail || tripRow.operators?.email],
          subject: `Manifest — ${mockTripDetail.boat.boatName} · ${formatTripDate(mockTripDetail.tripDate)}`,
          html: `<p>Your official USCG manifest for ${mockTripDetail.boat.boatName} is attached.</p>`,
          attachments: [
            {
              filename: `Manifest-${mockTripDetail.boat.boatName}.pdf`,
              content: Buffer.from(pdfBytes).toString('base64')
            }
          ]
        })
      })
      if (!emailRes.ok) throw new Error(`Resend attachment failure: ${await emailRes.text()}`)
    } else {
      console.warn('[smsWorker] RESEND_API_KEY missing - skipping actual PDF email send')
    }

    // Mark manifest emailed
    await supabase.from('trips').update({ manifest_emailed_at: new Date().toISOString() }).eq('id', tripId)

    // 4. Dispatch the SMS verification
    const message = await twilioClient.messages.create({
      body: body,
      from: fromNumber,
      to: operatorPhone,
      statusCallback,
    })

    await supabase.from('sms_log').insert({
      trip_id: tripId,
      recipient_type: 'operator',
      recipient_phone: operatorPhone,
      message_body: body,
      twilio_sid: message.sid,
      event_type: 'manifest_ready',
    })

    // Mark sms sent
    await supabase.from('trips').update({ manifest_sms_sent_at: new Date().toISOString() }).eq('id', tripId)

    return message.sid
  }
}

export const smsWorker = new Worker('sms', async (job) => {
  console.log(`[smsWorker] Processing job ${job.id} of type ${job.data.type}`)
  return processSmsJob(job.data as SmsJobPayload)
}, {
  connection,
  attempts: 3,         // Retry 3 times
  backoff: {
    type: 'exponential',
    delay: 2000
  }
})

// Listen for global failure events
smsWorker.on('failed', (job, err) => {
  console.error(`[smsWorker] Job ${job?.id} failed:`, err.message)
})
