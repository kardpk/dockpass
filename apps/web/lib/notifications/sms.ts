import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

export type SmsRecipientType = 'captain' | 'operator' | 'guest'
export type SmsEventType = 
  | 'snapshot_ready' 
  | 'snapshot_partial'
  | 'guests_complete' 
  | 'trip_started' 
  | 'manifest_ready' 
  | 'weather_critical'
  | 'license_expiry'
  | 'first_guest_in'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_FROM_NUMBER
const statusCallback = process.env.TWILIO_STATUS_CALLBACK_URL

// Initialize Twilio globally if configured
export const twilioClient = (accountSid && authToken) 
  ? twilio(accountSid, authToken) 
  : null

/**
 * Sends an SMS via Twilio and registers the initial record payload
 * onto `sms_log`. The true delivery will be confirmed via `twilio-status` webhook.
 */
export async function sendTwilioMessage(params: {
  tripId: string | null;
  recipientPhone: string;
  recipientType: SmsRecipientType;
  body: string;
  eventType: SmsEventType;
}) {
  if (!twilioClient || !fromNumber) {
    console.warn('[SMS] Twilio client not configured. Skipping SMS to', params.recipientPhone)
    return null
  }

  // 1. Initialize Supabase service role client to log the SMS intention
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 2. Dispatch via Twilio
    const message = await twilioClient.messages.create({
      body: params.body,
      from: fromNumber,
      to: params.recipientPhone,
      statusCallback: statusCallback,
    })

    // 3. Log initial pending state with twilio_sid
    const { data: dbLog, error } = await supabase
      .from('sms_log')
      .insert({
        trip_id: params.tripId,
        recipient_type: params.recipientType,
        recipient_phone: params.recipientPhone,
        message_body: params.body,
        twilio_sid: message.sid,
        event_type: params.eventType,
        // delivered_at and failed_at remain null until the webhook resolves them.
      })
      .select()
      .single()

    if (error) {
     console.error('[SMS] Failed to log sms record:', error.message)
    }

    return message
  } catch (err: any) {
    console.error('[SMS] Send Failed:', err.message)
    
    // Log explicit failure if Twilio crashed instantly (e.g. invalid number)
    await supabase.from('sms_log').insert({
      trip_id: params.tripId,
      recipient_type: params.recipientType,
      recipient_phone: params.recipientPhone,
      message_body: params.body,
      event_type: params.eventType,
      failed_at: new Date().toISOString()
    })

    throw err
  }
}
