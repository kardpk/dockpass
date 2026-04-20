import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    const messageSid = body.get('MessageSid') as string
    const status = body.get('MessageStatus') as string
    
    if (!messageSid || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Status values: queued, failed, sent, delivered, undelivered
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (status === 'delivered') {
      const timestamp = new Date().toISOString()
      await supabase
        .from('sms_log')
        .update({ delivered_at: timestamp })
        .eq('twilio_sid', messageSid)
        
      // Ensure there evaluates an audit log trail
      await supabase.from('audit_log').insert({
        action: 'sms_delivered',
        entity_type: 'sms_log',
        changes: { twilio_sid: messageSid, status: 'delivered', timestamp }
      })
    }
    
    if (status === 'failed' || status === 'undelivered') {
      await supabase
        .from('sms_log')
        .update({ failed_at: new Date().toISOString() })
        .eq('twilio_sid', messageSid)
      
      // Fallback: Notify operator in-app and via push
      const { data: log } = await supabase
        .from('sms_log')
        .select('*')
        .eq('twilio_sid', messageSid)
        .single()

      if (log?.event_type === 'snapshot_ready') {
        // Find operator to send in-app notification
        const { data: trip } = await supabase
          .from('trips')
          .select('operator_id, boats(boat_name)')
          .eq('id', log.trip_id)
          .single()

        if (trip && trip.operator_id) {
          const bName = (trip.boats as any)?.boat_name || "a trip"
          // Alert operator via operator_notifications (in-app fallback)
          await supabase.from('operator_notifications').insert({
            operator_id: trip.operator_id,
            title: "SMS Delivery Failed",
            message: `Failed to deliver captain snapshot SMS for ${bName}. Please share the link manually.`,
            type: "alert",
            trip_id: log.trip_id
          })
        }
      }
    }
    
    return new NextResponse('OK', { status: 200 })
  } catch (err: any) {
    console.error("[Twilio Webhook] exception:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
