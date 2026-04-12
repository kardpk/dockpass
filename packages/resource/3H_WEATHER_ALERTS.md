# BoatCheckin — Phase 3H Agent Instructions
# Weather + Alerts: Monitoring + Notifications
# @3H_WEATHER_ALERTS

---

## CONTEXT

The weather system has three jobs that run
at different times and cadences:

JOB 1 — Display (already built in 3B)
  Guest opens the trip page.
  Weather fetched from Open-Meteo server-side.
  Cached in Redis for 3 hours.
  Shown in the WeatherWidget component.
  This is done. Do not touch it.

JOB 2 — Monitoring (built in this phase)
  Every hour, scan all upcoming trips in the
  next 48 hours. If any have deteriorating
  conditions, alert the operator by email,
  push, and in-app notification.
  This runs as a BullMQ worker + Render cron.

JOB 3 — Reminders (built in this phase)
  24 hours before any trip: send each guest
  a reminder push notification + optional SMS.
  48 hours before: flag unsigned waivers to
  the operator.
  T-0: mark trip active in database (daily cron).

Phase 3H finalises the full notification
pipeline and wires together every scheduled
job that runs in the background.

---

## PASTE THIS INTO YOUR IDE

```
@docs/agents/00-MASTER.md
@docs/agents/03-DATABASE.md
@docs/agents/04-SECURITY.md
@docs/agents/07-BACKEND.md
@docs/agents/10-COMPLIANCE.md
@docs/agents/11-REDIS.md
@docs/agents/16-UX_SCREENS.md
@docs/agents/21-PHASE3_PLAN.md

TASK: Build Phase 3H — Weather + Alerts.
Monitoring cron, guest reminders, waiver
alerts, trip day activation, operator
weather alert dashboard UI.

Phases 3A–3G are complete and tested.
The weather fetching layer (getWeatherData)
exists at lib/trip/getWeatherData.ts.
The email layer (sendEmail) exists at
lib/notifications/email.ts.
The push layer (sendPushToAllGuests) exists at
lib/notifications/push.ts.
Build on all of them — do not duplicate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 — DATABASE MIGRATION 006
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Two columns needed. The trips table already
has weather_checked_at and weather_data.
We need alert deduplication columns.

────────────────────────────────────────────
1A. Migration file
────────────────────────────────────────────

Create: supabase/migrations/006_weather_alerts.sql

-- Track last weather alert sent per trip
-- Prevents duplicate alerts on re-check
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS weather_alert_sent_at
    TIMESTAMPTZ DEFAULT NULL;

-- Track the severity at time of last alert
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS weather_alert_severity
    TEXT DEFAULT NULL
    CHECK (weather_alert_severity IN (
      'fair', 'poor', 'dangerous', NULL
    ));

-- Track whether trip day reminder has been sent
-- Prevents duplicate reminders
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS trip_reminder_sent_at
    TIMESTAMPTZ DEFAULT NULL;

-- Track whether waiver reminder has been sent
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS waiver_reminder_sent_at
    TIMESTAMPTZ DEFAULT NULL;

-- Index: trips needing weather check (next 48 hrs)
CREATE INDEX IF NOT EXISTS idx_trips_weather_check
  ON trips (trip_date, weather_checked_at)
  WHERE status IN ('upcoming', 'active')
    AND trip_date >= CURRENT_DATE;

-- Index: guests needing trip day reminder
CREATE INDEX IF NOT EXISTS idx_guests_reminder_pending
  ON guests (trip_id, trip_reminder_sent_at)
  WHERE deleted_at IS NULL
    AND trip_reminder_sent_at IS NULL;

Run:
  npx supabase db push
  npx supabase gen types typescript --linked \
    > apps/web/types/database.ts

Verify:
  trips: weather_alert_sent_at, weather_alert_severity columns
  guests: trip_reminder_sent_at, waiver_reminder_sent_at columns
  Indexes created

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 — ALERT SEVERITY THRESHOLDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
2A. Weather alert rules (server-only)
────────────────────────────────────────────

Create: apps/web/lib/weather/alertRules.ts
import 'server-only'

Single source of truth for what constitutes
a weather alert. Imported by the monitor
worker AND the dashboard UI.

import 'server-only'
import type { WeatherData } from '@/lib/trip/getWeatherData'

export type AlertSeverity = 'fair' | 'poor' | 'dangerous'

export interface WeatherAlert {
  severity: AlertSeverity
  shouldAlert: boolean
  headline: string
  detail: string
  emoji: string
  colour: string
  bgColour: string
  operatorAction: string
}

// Thresholds (open-meteo WMO codes + wind mph)
export function evaluateWeatherAlert(
  weather: WeatherData
): WeatherAlert {
  const { code, windspeed, precipitation } = weather

  // Dangerous: thunderstorm, severe wind, heavy storms
  if (code >= 95 || windspeed >= 40) {
    return {
      severity: 'dangerous',
      shouldAlert: true,
      headline: 'Dangerous conditions forecast',
      detail: `${weather.label}. Wind: ${windspeed} mph. We strongly recommend contacting your guests about postponement.`,
      emoji: '🌩️',
      colour: '#D63B3B',
      bgColour: '#FDEAEA',
      operatorAction: 'Consider cancelling or postponing this charter.',
    }
  }

  // Poor: heavy rain, high wind, snow
  if (code >= 80 || windspeed >= 28 || precipitation > 10) {
    return {
      severity: 'poor',
      shouldAlert: true,
      headline: 'Poor conditions forecast',
      detail: `${weather.label}. Wind: ${windspeed} mph. Rain: ${precipitation}mm. Your guests should be aware.`,
      emoji: '⛈️',
      colour: '#E8593C',
      bgColour: '#FDEAEA',
      operatorAction: 'Notify guests. Consider rescheduling if conditions worsen.',
    }
  }

  // Fair: light rain or elevated wind — advisory only
  if (code >= 51 || windspeed >= 18) {
    return {
      severity: 'fair',
      shouldAlert: true,
      headline: 'Marginal conditions forecast',
      detail: `${weather.label}. Wind: ${windspeed} mph. Trip can proceed — guests should be prepared.`,
      emoji: '🌧️',
      colour: '#E5910A',
      bgColour: '#FEF3DC',
      operatorAction: 'No action required. Consider updating guests.',
    }
  }

  // Good — no alert
  return {
    severity: 'fair', // ignored since shouldAlert = false
    shouldAlert: false,
    headline: 'Good conditions',
    detail: `${weather.label}. Wind: ${windspeed} mph. Clear for departure.`,
    emoji: weather.icon,
    colour: '#1D9E75',
    bgColour: '#E8F9F4',
    operatorAction: '',
  }
}

// Determine if a NEW alert should fire
// given the previous alert state
export function shouldSendNewAlert(
  alert: WeatherAlert,
  previousSeverity: string | null,
  lastAlertSentAt: string | null
): boolean {
  if (!alert.shouldAlert) return false

  // Never alerted before → always send
  if (!lastAlertSentAt) return true

  // Only re-alert if severity has escalated
  const severityRank: Record<string, number> = {
    fair: 1, poor: 2, dangerous: 3,
  }
  const prev = severityRank[previousSeverity ?? ''] ?? 0
  const current = severityRank[alert.severity] ?? 0

  // Re-alert if escalated OR if last alert was >6 hours ago
  // for dangerous conditions
  const hoursSinceLast = lastAlertSentAt
    ? (Date.now() - new Date(lastAlertSentAt).getTime()) / 3600000
    : 999

  if (current > prev) return true
  if (alert.severity === 'dangerous' && hoursSinceLast >= 6) return true

  return false
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 3 — NOTIFICATION HELPERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
3A. Weather alert email template
────────────────────────────────────────────

Update: apps/web/lib/notifications/email.ts

Add sendWeatherAlertEmail function.
Extends the existing sendEmail base.

export async function sendWeatherAlertEmail(params: {
  to: string
  operatorName: string
  boatName: string
  tripDate: string
  departureTime: string
  alertHeadline: string
  alertDetail: string
  alertEmoji: string
  alertColour: string
  alertBgColour: string
  operatorAction: string
  guestCount: number
  tripSlug: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const dashboardUrl = `${appUrl}/dashboard`

  return sendEmail({
    to: params.to,
    subject: `${params.alertEmoji} Weather advisory — ${params.boatName} on ${params.tripDate}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#F5F8FC;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">

  <!-- Alert banner -->
  <div style="background:${params.alertBgColour};border-left:4px solid ${params.alertColour};padding:24px 32px;">
    <div style="font-size:32px;margin-bottom:8px;">${params.alertEmoji}</div>
    <h1 style="color:${params.alertColour};margin:0 0 8px;font-size:20px;font-weight:700;">
      ${params.alertHeadline}
    </h1>
    <p style="color:#0D1B2A;margin:0;font-size:15px;line-height:1.5;">
      ${params.alertDetail}
    </p>
  </div>

  <!-- Trip details -->
  <div style="padding:24px 32px;border-bottom:1px solid #D0E2F3;">
    <p style="margin:0 0 4px;font-size:13px;color:#6B7C93;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">
      TRIP DETAILS
    </p>
    <p style="margin:0;font-size:17px;font-weight:700;color:#0D1B2A;">
      ${params.boatName}
    </p>
    <p style="margin:4px 0 0;font-size:14px;color:#6B7C93;">
      ${params.tripDate} · ${params.departureTime} · ${params.guestCount} guests registered
    </p>
  </div>

  <!-- Operator action -->
  <div style="padding:24px 32px;">
    <p style="margin:0 0 16px;font-size:15px;color:#0D1B2A;line-height:1.5;">
      <strong>Recommended action:</strong> ${params.operatorAction}
    </p>

    <a href="${dashboardUrl}"
       style="display:inline-block;background:#0C447C;color:white;padding:14px 28px;
              border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;
              margin-bottom:12px;">
      Open dashboard to notify guests →
    </a>

    <p style="margin:12px 0 0;font-size:13px;color:#6B7C93;">
      You can notify all ${params.guestCount} guests with one tap from the dashboard.
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#F5F8FC;padding:16px 32px;border-top:1px solid #D0E2F3;">
    <p style="color:#6B7C93;font-size:11px;margin:0;">
      BoatCheckin Weather Monitor ·
      <a href="${appUrl}/privacy" style="color:#6B7C93;">Privacy</a> ·
      <a href="${appUrl}/unsubscribe" style="color:#6B7C93;">Unsubscribe</a>
    </p>
  </div>
</div>
</body>
</html>`,
    text: `${params.alertHeadline} — ${params.alertDetail} Open your dashboard: ${dashboardUrl}`,
  })
}

────────────────────────────────────────────
3B. Trip reminder email template
────────────────────────────────────────────

Update: apps/web/lib/notifications/email.ts

Add sendTripReminderEmail function.

export async function sendTripReminderEmail(params: {
  to: string
  guestName: string
  language: string
  boatName: string
  tripDate: string
  departureTime: string
  marinaName: string
  slipNumber: string | null
  parkingInstructions: string | null
  captainName: string | null
  tripSlug: string
  weather: {
    icon: string
    label: string
    temperature: number
  } | null
}) {
  const t = getReminderEmailTranslation(params.language)
  const firstName = params.guestName.split(' ')[0]!
  const tripUrl = `${process.env.NEXT_PUBLIC_APP_URL}/trip/${params.tripSlug}`
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(params.marinaName)}`

  return sendEmail({
    to: params.to,
    subject: t.subject(params.boatName, params.tripDate),
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#F5F8FC;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">

  <!-- Teal header -->
  <div style="background:#0C447C;padding:40px 32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:12px;">⚓</div>
    <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">
      ${t.heading}
    </h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">
      ${params.boatName}
    </p>
  </div>

  <!-- Trip info -->
  <div style="padding:28px 32px;border-bottom:1px solid #D0E2F3;">
    <p style="margin:0 0 16px;font-size:16px;color:#0D1B2A;">
      ${t.greeting(firstName)}
    </p>

    <!-- Details grid -->
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6B7C93;width:30%;">📅 Date</td>
        <td style="padding:8px 0;font-size:15px;font-weight:600;color:#0D1B2A;">${params.tripDate}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6B7C93;">⏰ Time</td>
        <td style="padding:8px 0;font-size:15px;font-weight:600;color:#0D1B2A;">${params.departureTime}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6B7C93;">📍 Marina</td>
        <td style="padding:8px 0;font-size:15px;font-weight:600;color:#0D1B2A;">
          ${params.marinaName}${params.slipNumber ? `, Slip ${params.slipNumber}` : ''}
        </td>
      </tr>
      ${params.captainName ? `
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6B7C93;">⛵ Captain</td>
        <td style="padding:8px 0;font-size:15px;font-weight:600;color:#0D1B2A;">${params.captainName}</td>
      </tr>` : ''}
      ${params.weather ? `
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#6B7C93;">🌡️ Weather</td>
        <td style="padding:8px 0;font-size:15px;font-weight:600;color:#1D9E75;">
          ${params.weather.icon} ${params.weather.label} · ${params.weather.temperature}°F
        </td>
      </tr>` : ''}
    </table>
  </div>

  <!-- CTAs -->
  <div style="padding:24px 32px;">
    <a href="${tripUrl}"
       style="display:block;background:#0C447C;color:white;padding:14px 28px;
              border-radius:10px;text-decoration:none;font-weight:600;
              font-size:15px;text-align:center;margin-bottom:12px;">
      ${t.viewBoardingPass}
    </a>
    <a href="${mapsUrl}"
       style="display:block;background:white;color:#0C447C;padding:12px 28px;
              border-radius:10px;text-decoration:none;font-weight:600;
              font-size:14px;text-align:center;border:2px solid #D0E2F3;">
      📍 Open in Maps →
    </a>
    ${params.parkingInstructions ? `
    <p style="margin:16px 0 0;font-size:13px;color:#6B7C93;line-height:1.5;">
      🅿️ ${params.parkingInstructions}
    </p>` : ''}
  </div>

  <!-- Footer -->
  <div style="background:#F5F8FC;padding:16px 32px;border-top:1px solid #D0E2F3;">
    <p style="color:#6B7C93;font-size:11px;margin:0;">
      BoatCheckin · Powered by Oakmont Logic LLC ·
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color:#6B7C93;">Privacy</a>
    </p>
  </div>
</div>
</body>
</html>`,
    text: `${t.heading} — ${params.boatName} · ${params.tripDate} at ${params.departureTime} · ${params.marinaName}. View your boarding pass: ${tripUrl}`,
  })
}

// ─── Reminder email translations ─────────
type ReminderT = {
  subject: (boat: string, date: string) => string
  heading: string
  greeting: (name: string) => string
  viewBoardingPass: string
}

function getReminderEmailTranslation(lang: string): ReminderT {
  const map: Record<string, ReminderT> = {
    en: {
      subject: (b, d) => `Your charter tomorrow — ${b} · ${d}`,
      heading: "Your charter is tomorrow! ⚓",
      greeting: n => `Hi ${n} — see you tomorrow!`,
      viewBoardingPass: 'View boarding pass & dock details →',
    },
    es: {
      subject: (b, d) => `Tu charter mañana — ${b} · ${d}`,
      heading: "¡Tu charter es mañana! ⚓",
      greeting: n => `Hola ${n} — ¡hasta mañana!`,
      viewBoardingPass: 'Ver pase de embarque →',
    },
    fr: {
      subject: (b, d) => `Votre charter demain — ${b} · ${d}`,
      heading: "Votre charter est demain ! ⚓",
      greeting: n => `Bonjour ${n} — à demain !`,
      viewBoardingPass: 'Voir la carte d\'embarquement →',
    },
    pt: {
      subject: (b, d) => `O seu charter amanhã — ${b} · ${d}`,
      heading: "O seu charter é amanhã! ⚓",
      greeting: n => `Olá ${n} — até amanhã!`,
      viewBoardingPass: 'Ver cartão de embarque →',
    },
    de: {
      subject: (b, d) => `Ihr Charter morgen — ${b} · ${d}`,
      heading: "Ihr Charter ist morgen! ⚓",
      greeting: n => `Hallo ${n} — bis morgen!`,
      viewBoardingPass: 'Bordkarte anzeigen →',
    },
    it: {
      subject: (b, d) => `Il vostro charter domani — ${b} · ${d}`,
      heading: "Il vostro charter è domani! ⚓",
      greeting: n => `Ciao ${n} — a domani!`,
      viewBoardingPass: 'Visualizza carta d\'imbarco →',
    },
  }
  return map[lang] ?? map.en!
}

────────────────────────────────────────────
3C. Operator notify-guests API endpoint
────────────────────────────────────────────

Create: apps/web/app/api/dashboard/trips/
  [id]/notify-weather/route.ts
import 'server-only'

Operator taps "Notify all guests" from the
weather alert card in the dashboard.
Sends a push + chat system message to all
guests on this trip.
Rate limited: 1 per trip per hour.

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { sendPushToAllGuests } from '@/lib/notifications/push'
import { z } from 'zod'

const schema = z.object({
  message: z.string()
    .min(5)
    .max(200)
    .transform(s => s.trim()),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  // Rate limit: 1 weather notification per trip per hour
  const limited = await rateLimit(req, {
    max: 1, window: 3600,
    key: `notify-weather:${id}:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Weather notification already sent in the last hour' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid message' }, { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Verify ownership + get slug for chat
  const { data: trip } = await supabase
    .from('trips')
    .select('id, slug, operator_id')
    .eq('id', id)
    .eq('operator_id', operator.id)
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found' }, { status: 404 }
    )
  }

  // Send push to all guests
  const pushResult = await sendPushToAllGuests(id, {
    title: '⚠️ Weather update for your charter',
    body: parsed.data.message,
    url: `/trip/${trip.slug}`,
    tag: `weather-alert-${id}`,
  })

  // Also post as a system message in chat
  // so guests see it when they open the trip page
  await supabase.from('trip_messages').insert({
    trip_id: id,
    operator_id: operator.id,
    sender_type: 'system',
    sender_name: 'BoatCheckin Weather',
    body: `⚠️ ${parsed.data.message}`,
    is_quick_chip: false,
  })

  return NextResponse.json({
    data: {
      pushSent: pushResult.sent,
      pushFailed: pushResult.failed,
    },
  })
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 4 — WORKER: WEATHER MONITOR JOB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
4A. Weather monitor worker
────────────────────────────────────────────

Create: apps/worker/workers/weatherWorker.ts

Runs in the Render background service.
Called by the hourly cron.
Scans all trips in the next 48 hours.
Fires alerts for trips with deteriorating
conditions.

import { createServiceClient } from '../../web/lib/supabase/service'
import { getWeatherData } from '../../web/lib/trip/getWeatherData'
import { evaluateWeatherAlert, shouldSendNewAlert } from '../../web/lib/weather/alertRules'
import { sendWeatherAlertEmail } from '../../web/lib/notifications/email'
import { sendPushToAllGuests } from '../../web/lib/notifications/push'

interface TripWeatherCandidate {
  id: string
  slug: string
  trip_date: string
  departure_time: string
  operator_id: string
  weather_checked_at: string | null
  weather_alert_sent_at: string | null
  weather_alert_severity: string | null
  boats: {
    boat_name: string
    lat: number | null
    lng: number | null
  }
  operators: {
    email: string
    full_name: string
  }
  _guestCount: number
}

export async function runWeatherMonitor(): Promise<{
  checked: number
  alerted: number
  errors: number
}> {
  const supabase = createServiceClient()

  // Get all upcoming trips in next 48 hours
  // with marina coordinates
  const now = new Date()
  const cutoff = new Date(now.getTime() + 48 * 3600000)
  const todayStr = now.toISOString().split('T')[0]!
  const cutoffStr = cutoff.toISOString().split('T')[0]!

  const { data: trips, error } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time,
      operator_id, weather_checked_at,
      weather_alert_sent_at, weather_alert_severity,
      boats ( boat_name, lat, lng ),
      operators ( email, full_name )
    `)
    .in('status', ['upcoming', 'active'])
    .gte('trip_date', todayStr)
    .lte('trip_date', cutoffStr)
    .not('boats.lat', 'is', null)
    .not('boats.lng', 'is', null)

  if (error || !trips) {
    console.error('[weather-monitor] fetch failed:', error?.message)
    return { checked: 0, alerted: 0, errors: 1 }
  }

  let checked = 0
  let alerted = 0
  let errors = 0

  for (const trip of trips) {
    try {
      const boat = trip.boats as any
      const operator = trip.operators as any

      if (!boat?.lat || !boat?.lng) continue

      // Skip if checked in the last 3 hours
      if (trip.weather_checked_at) {
        const hoursSince = (Date.now() -
          new Date(trip.weather_checked_at).getTime()) / 3600000
        if (hoursSince < 3) continue
      }

      // Fetch weather
      const weather = await getWeatherData(
        Number(boat.lat),
        Number(boat.lng),
        trip.trip_date
      )

      if (!weather) {
        errors++
        continue
      }

      checked++

      // Evaluate alert
      const alert = evaluateWeatherAlert(weather)

      // Update trip with latest weather
      await supabase
        .from('trips')
        .update({
          weather_data: weather,
          weather_checked_at: new Date().toISOString(),
        })
        .eq('id', trip.id)

      // Check if we should send an alert
      const shouldAlert = shouldSendNewAlert(
        alert,
        trip.weather_alert_severity,
        trip.weather_alert_sent_at
      )

      if (!shouldAlert) continue

      // Get guest count for this trip
      const { count: guestCount } = await supabase
        .from('guests')
        .select('id', { count: 'exact', head: true })
        .eq('trip_id', trip.id)
        .is('deleted_at', null)

      const alertData = {
        operatorName: operator.full_name,
        boatName: boat.boat_name,
        tripDate: trip.trip_date,
        departureTime: trip.departure_time,
        alertHeadline: alert.headline,
        alertDetail: alert.detail,
        alertEmoji: alert.emoji,
        alertColour: alert.colour,
        alertBgColour: alert.bgColour,
        operatorAction: alert.operatorAction,
        guestCount: guestCount ?? 0,
        tripSlug: trip.slug,
      }

      // 1. Email operator
      await sendWeatherAlertEmail({
        to: operator.email,
        ...alertData,
      }).catch(err => {
        console.error('[weather-monitor] email failed:', err.message)
      })

      // 2. In-app operator notification
      await supabase.from('operator_notifications').insert({
        operator_id: trip.operator_id,
        type: 'weather_alert',
        title: `${alert.emoji} ${alert.headline}`,
        body: `${alertData.boatName} on ${trip.trip_date}: ${alert.detail.slice(0, 100)}`,
        data: {
          tripId: trip.id,
          severity: alert.severity,
          weatherCode: weather.code,
          windspeed: weather.windspeed,
        },
      }).catch(() => null)

      // 3. Push to operator (if subscribed) — via notification
      // (handled by Supabase Realtime subscription on dashboard)

      // 4. Push to guests for dangerous conditions only
      if (alert.severity === 'dangerous') {
        await sendPushToAllGuests(trip.id, {
          title: '⚠️ Weather update for your charter',
          body: `${alert.headline} — ${boat.boat_name} on ${trip.trip_date}`,
          url: `/trip/${trip.slug}`,
          tag: `weather-${trip.id}`,
        }).catch(() => null)
      }

      // 5. Record alert sent
      await supabase
        .from('trips')
        .update({
          weather_alert_sent_at: new Date().toISOString(),
          weather_alert_severity: alert.severity,
        })
        .eq('id', trip.id)

      alerted++
      console.log(
        `[weather-monitor] alerted: ${boat.boat_name} on ${trip.trip_date} — ${alert.severity}`
      )

    } catch (err: any) {
      console.error(`[weather-monitor] trip ${trip.id} error:`, err.message)
      errors++
    }
  }

  console.log(
    `[weather-monitor] done: checked=${checked}, alerted=${alerted}, errors=${errors}`
  )
  return { checked, alerted, errors }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 5 — WORKER: GUEST REMINDERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
5A. Trip day reminder worker
────────────────────────────────────────────

Create: apps/worker/workers/reminderWorker.ts

Runs in the Render background service.
Called by the hourly cron.
Sends 24-hour-before reminders to guests
and 48-hour unsigned waiver alerts to operators.

import { createServiceClient } from '../../web/lib/supabase/service'
import { getWeatherData } from '../../web/lib/trip/getWeatherData'
import { sendTripReminderEmail } from '../../web/lib/notifications/email'
import { sendPushToAllGuests } from '../../web/lib/notifications/push'
import { formatTripDate, formatTime } from '../../web/lib/utils/format'

export async function runReminderWorker(): Promise<{
  remindersSent: number
  waiverAlerts: number
  errors: number
}> {
  const supabase = createServiceClient()

  const now = new Date()
  // Window: trips departing 20–28 hours from now
  const windowStart = new Date(now.getTime() + 20 * 3600000)
  const windowEnd   = new Date(now.getTime() + 28 * 3600000)

  const windowStartDate = windowStart.toISOString().split('T')[0]!
  const windowEndDate   = windowEnd.toISOString().split('T')[0]!

  // Fetch trips in the reminder window
  const { data: trips } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time, duration_hours,
      operator_id,
      boats (
        boat_name, marina_name, marina_address, slip_number,
        parking_instructions, captain_name, lat, lng
      ),
      guests (
        id, full_name, email, language_preference,
        push_subscription, trip_reminder_sent_at,
        waiver_signed, waiver_reminder_sent_at,
        deleted_at
      )
    `)
    .in('status', ['upcoming'])
    .gte('trip_date', windowStartDate)
    .lte('trip_date', windowEndDate)

  let remindersSent = 0
  let waiverAlerts = 0
  let errors = 0

  for (const trip of trips ?? []) {
    try {
      const boat = trip.boats as any
      const guests = (trip.guests as any[]) ?? []
      const eligibleGuests = guests.filter(
        g => !g.deleted_at && !g.trip_reminder_sent_at
      )

      if (eligibleGuests.length === 0) continue

      // Fetch weather for reminder context
      const weather = boat?.lat && boat?.lng
        ? await getWeatherData(
            Number(boat.lat), Number(boat.lng), trip.trip_date
          ).catch(() => null)
        : null

      const weatherData = weather && weather.severity !== 'dangerous'
        ? {
            icon: weather.icon,
            label: weather.label,
            temperature: weather.temperature,
          }
        : null

      for (const guest of eligibleGuests) {
        try {
          // 1. Email reminder (if email provided)
          if (guest.email) {
            await sendTripReminderEmail({
              to: guest.email,
              guestName: guest.full_name,
              language: guest.language_preference ?? 'en',
              boatName: boat?.boat_name ?? '',
              tripDate: formatTripDate(trip.trip_date),
              departureTime: formatTime(trip.departure_time),
              marinaName: boat?.marina_name ?? '',
              slipNumber: boat?.slip_number ?? null,
              parkingInstructions: boat?.parking_instructions ?? null,
              captainName: boat?.captain_name ?? null,
              tripSlug: trip.slug,
              weather: weatherData,
            })
          }

          // 2. Push notification (if subscribed)
          if (guest.push_subscription) {
            const { sendPush } = await import(
              '../../web/lib/notifications/push'
            )
            await sendPush(guest.push_subscription, {
              title: 'Your charter is tomorrow ⚓',
              body: `${boat?.boat_name} departs at ${formatTime(trip.departure_time)} from ${boat?.marina_name}`,
              url: `/trip/${trip.slug}`,
              tag: `reminder-${trip.id}`,
            }).catch(() => null)
          }

          // Mark as sent
          await supabase
            .from('guests')
            .update({ trip_reminder_sent_at: new Date().toISOString() })
            .eq('id', guest.id)

          remindersSent++
        } catch (guestErr: any) {
          console.error(
            `[reminder] guest ${guest.id} error:`, guestErr.message
          )
          errors++
        }
      }

    } catch (tripErr: any) {
      console.error(`[reminder] trip ${trip.id} error:`, tripErr.message)
      errors++
    }
  }

  // ── Waiver alerts (48-hour window) ──────
  const waiverWindowStart = new Date(now.getTime() + 44 * 3600000)
  const waiverWindowEnd   = new Date(now.getTime() + 52 * 3600000)

  const { data: waiverTrips } = await supabase
    .from('trips')
    .select(`
      id, operator_id,
      boats ( boat_name ),
      guests (
        id, full_name, waiver_signed, deleted_at
      )
    `)
    .in('status', ['upcoming'])
    .gte('trip_date', waiverWindowStart.toISOString().split('T')[0]!)
    .lte('trip_date', waiverWindowEnd.toISOString().split('T')[0]!)

  for (const trip of waiverTrips ?? []) {
    const unsigned = (trip.guests as any[])
      .filter(g => !g.deleted_at && !g.waiver_signed)

    if (unsigned.length === 0) continue

    // Notify operator once about unsigned waivers
    await supabase.from('operator_notifications').insert({
      operator_id: trip.operator_id,
      type: 'unsigned_waivers',
      title: `⚠️ ${unsigned.length} unsigned waiver${unsigned.length !== 1 ? 's' : ''}`,
      body: `${unsigned.map((g: any) => g.full_name.split(' ')[0]).join(', ')} ${unsigned.length === 1 ? 'hasn\'t' : 'haven\'t'} signed yet`,
      data: {
        tripId: trip.id,
        unsignedNames: unsigned.map((g: any) => g.full_name),
      },
    }).catch(() => null)

    waiverAlerts++
  }

  console.log(
    `[reminder] done: sent=${remindersSent}, waiverAlerts=${waiverAlerts}, errors=${errors}`
  )
  return { remindersSent, waiverAlerts, errors }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 6 — WORKER: DAILY LIFECYCLE JOBS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
6A. Trip activation cron (daily at 6am UTC)
────────────────────────────────────────────

Create: apps/worker/cron/daily.ts

Runs at 6:00 AM UTC. Activates today's
upcoming trips. Completes yesterday's.
Runs GDPR cleanup.

import { createServiceClient } from '../../web/lib/supabase/service'

export async function runDailyCron(): Promise<void> {
  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]!

  // ── STEP 1: Activate today's upcoming trips ──
  const { data: activated, error: activateErr } = await supabase
    .from('trips')
    .update({ status: 'active' })
    .eq('status', 'upcoming')
    .eq('trip_date', today)
    .select('id, slug, operator_id, boats(boat_name)')

  if (activateErr) {
    console.error('[daily] activation error:', activateErr.message)
  } else {
    console.log(`[daily] activated ${activated?.length ?? 0} trips`)

    // Notify operators whose trips just activated
    for (const trip of activated ?? []) {
      await supabase.from('operator_notifications').insert({
        operator_id: trip.operator_id,
        type: 'trip_activated',
        title: '⚓ Trip activated',
        body: `${(trip.boats as any)?.boat_name} is active today`,
        data: { tripId: trip.id },
      }).catch(() => null)
    }
  }

  // ── STEP 2: Complete yesterday's active trips ──
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]!

  const { data: completed, error: completeErr } = await supabase
    .from('trips')
    .update({ status: 'completed', ended_at: new Date().toISOString() })
    .eq('status', 'active')
    .lt('trip_date', today)
    .select('id')

  if (completeErr) {
    console.error('[daily] completion error:', completeErr.message)
  } else {
    console.log(`[daily] completed ${completed?.length ?? 0} trips`)
  }

  // ── STEP 3: GDPR cleanup ─────────────────
  // Anonymise guests from trips older than 90 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)

  const { error: gdprErr } = await supabase
    .from('guests')
    .update({
      full_name: 'DELETED',
      emergency_contact_name: 'DELETED',
      emergency_contact_phone: 'DELETED',
      dietary_requirements: null,
      date_of_birth: null,
      email: null,
      waiver_signature_text: 'DELETED',
      waiver_ip_address: null,
      waiver_user_agent: null,
      push_subscription: null,
      deleted_at: new Date().toISOString(),
    })
    .lt('created_at', cutoff.toISOString())
    .is('deleted_at', null)

  if (gdprErr) {
    console.error('[daily] GDPR cleanup error:', gdprErr.message)
  } else {
    console.log('[daily] GDPR cleanup complete')
  }
}

────────────────────────────────────────────
6B. Hourly cron entry point
────────────────────────────────────────────

Create: apps/worker/cron/hourly.ts

Orchestrates all hourly jobs.
Each job runs independently — one failure
does not block the others.

import { runWeatherMonitor } from '../workers/weatherWorker'
import { runReminderWorker } from '../workers/reminderWorker'

export async function runHourlyCron(): Promise<void> {
  console.log('[hourly] starting at', new Date().toISOString())

  // Run jobs in parallel where safe
  // Weather monitor and reminder worker are independent
  const [weatherResult, reminderResult] = await Promise.allSettled([
    runWeatherMonitor(),
    runReminderWorker(),
  ])

  if (weatherResult.status === 'rejected') {
    console.error('[hourly] weather monitor failed:', weatherResult.reason)
  }
  if (reminderResult.status === 'rejected') {
    console.error('[hourly] reminder worker failed:', reminderResult.reason)
  }

  console.log('[hourly] complete')
}

// Entry point for Render cron
runHourlyCron().catch(err => {
  console.error('[hourly] fatal error:', err)
  process.exit(1)
})

────────────────────────────────────────────
6C. Daily cron entry point
────────────────────────────────────────────

Create: apps/worker/cron/daily-entry.ts

import { runDailyCron } from './daily'

runDailyCron().catch(err => {
  console.error('[daily] fatal error:', err)
  process.exit(1)
})

────────────────────────────────────────────
6D. render.yaml — cron service config
────────────────────────────────────────────

Update: render.yaml (root of monorepo)

services:
  # Existing worker service...

  - type: cron
    name: dockpass-hourly
    env: node
    schedule: "0 * * * *"    # Every hour at :00
    buildCommand: cd apps/worker && npm install && npm run build
    startCommand: node dist/cron/hourly.js
    envVars:
      - fromGroup: dockpass-secrets

  - type: cron
    name: dockpass-daily
    env: node
    schedule: "0 6 * * *"    # 6:00 AM UTC daily
    buildCommand: cd apps/worker && npm install && npm run build
    startCommand: node dist/cron/daily-entry.js
    envVars:
      - fromGroup: dockpass-secrets

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 7 — DASHBOARD WEATHER ALERT UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
7A. WeatherAlertCard — dashboard component
────────────────────────────────────────────

Create: apps/web/components/dashboard/
  WeatherAlertCard.tsx
'use client'

Shows on the trip detail page when the trip
has an active weather alert.
Operator can dismiss or notify guests.

'use client'

import { useState } from 'react'
import { AlertTriangle, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { evaluateWeatherAlert } from '@/lib/weather/alertRules'
import type { WeatherData } from '@/lib/trip/getWeatherData'

interface WeatherAlertCardProps {
  tripId: string
  weather: WeatherData
  guestCount: number
  onDismiss?: () => void
}

export function WeatherAlertCard({
  tripId, weather, guestCount, onDismiss,
}: WeatherAlertCardProps) {
  const [customMessage, setCustomMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [dismissed, setDismissed] = useState(false)

  const alert = evaluateWeatherAlert(weather)

  if (!alert.shouldAlert || dismissed) return null

  // Default message operator can customise
  const defaultMessage = alert.severity === 'dangerous'
    ? `Important weather update for your charter on ${new Date().toLocaleDateString()}: ${alert.detail} Please check your email for details.`
    : `Weather update: ${alert.detail} Your trip is still on — we'll keep you posted.`

  const messageToSend = customMessage.trim() || defaultMessage

  async function notifyGuests() {
    if (!messageToSend.trim()) return
    setSending(true)
    setError('')

    try {
      const res = await fetch(
        `/api/dashboard/trips/${tripId}/notify-weather`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageToSend }),
        }
      )
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to send notification')
        return
      }

      setSent(true)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className={cn(
        'rounded-[20px] border overflow-hidden',
        'shadow-[0_1px_4px_rgba(12,68,124,0.06)]',
        alert.severity === 'dangerous'
          ? 'border-[#D63B3B]'
          : alert.severity === 'poor'
          ? 'border-[#E8593C]'
          : 'border-[#E5910A]'
      )}
    >
      {/* Alert header */}
      <div
        style={{ background: alert.bgColour }}
        className="px-5 py-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-[28px] flex-shrink-0">{alert.emoji}</span>
            <div>
              <h3
                className="text-[15px] font-bold leading-tight"
                style={{ color: alert.colour }}
              >
                {alert.headline}
              </h3>
              <p className="text-[13px] text-[#0D1B2A] mt-1 leading-relaxed">
                {alert.detail}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setDismissed(true); onDismiss?.() }}
            className="text-[#6B7C93] hover:text-[#0D1B2A] flex-shrink-0 ml-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* Recommended action */}
        <div className="mt-3 pt-3 border-t border-black/10">
          <p className="text-[13px] font-medium" style={{ color: alert.colour }}>
            → {alert.operatorAction}
          </p>
        </div>
      </div>

      {/* Notify guests section */}
      {guestCount > 0 && (
        <div className="bg-white px-5 py-4">
          {sent ? (
            <div className="flex items-center gap-2 text-[#1D9E75]">
              <span className="text-[18px]">✓</span>
              <p className="text-[14px] font-semibold">
                Notification sent to {guestCount} guest{guestCount !== 1 ? 's' : ''}
              </p>
            </div>
          ) : (
            <>
              <p className="text-[13px] font-medium text-[#0D1B2A] mb-2">
                Notify all {guestCount} guests:
              </p>
              <textarea
                rows={2}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder={defaultMessage}
                maxLength={200}
                className="
                  w-full px-3 py-2 rounded-[10px] text-[13px] resize-none
                  border border-[#D0E2F3] text-[#0D1B2A] mb-3
                  placeholder:text-[#6B7C93]
                  focus:outline-none focus:border-[#0C447C]
                "
              />
              {error && (
                <p className="text-[12px] text-[#D63B3B] mb-2">{error}</p>
              )}
              <button
                onClick={notifyGuests}
                disabled={sending}
                className="
                  flex items-center gap-2 h-[44px] px-5 rounded-[12px]
                  bg-[#0C447C] text-white font-semibold text-[14px]
                  hover:bg-[#093a6b] transition-colors
                  disabled:opacity-40
                "
              >
                <Send size={15} />
                {sending ? 'Sending...' : 'Send to all guests'}
              </button>
              <p className="text-[11px] text-[#6B7C93] mt-2">
                Sent via push notification + chat message
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

────────────────────────────────────────────
7B. Wire WeatherAlertCard into trip detail page
────────────────────────────────────────────

Update: apps/web/app/dashboard/trips/[id]/
  page.tsx

After TripDetailHeader, add:

import { WeatherAlertCard } from
  '@/components/dashboard/WeatherAlertCard'

Fetch weather and evaluate alert server-side:

// In the page Server Component:
const boat = trip.boat
const weather = boat.lat && boat.lng
  ? await getWeatherData(boat.lat, boat.lng, trip.tripDate)
  : null

// Then in JSX, after TripDetailHeader:
{weather && (
  <WeatherAlertCard
    tripId={trip.id}
    weather={weather}
    guestCount={trip.guests.length}
  />
)}

────────────────────────────────────────────
7C. TodayWeatherBar — dashboard home
────────────────────────────────────────────

Create: apps/web/components/dashboard/
  TodayWeatherBar.tsx
(Server Component)

Shows a concise weather row for today's
trip(s) at the top of the dashboard home.
Only visible if conditions are concerning.

import { evaluateWeatherAlert } from '@/lib/weather/alertRules'
import type { WeatherData } from '@/lib/trip/getWeatherData'

interface TodayWeatherBarProps {
  weather: WeatherData
  boatName: string
  tripId: string
}

export function TodayWeatherBar({
  weather, boatName, tripId,
}: TodayWeatherBarProps) {
  const alert = evaluateWeatherAlert(weather)

  if (!alert.shouldAlert) return null

  return (
    <a
      href={`/dashboard/trips/${tripId}`}
      className="
        flex items-center gap-3 px-4 py-3 rounded-[16px]
        border transition-colors no-underline
      "
      style={{
        background: alert.bgColour,
        borderColor: alert.colour + '40',
      }}
    >
      <span className="text-[22px]">{alert.emoji}</span>
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] font-semibold truncate"
          style={{ color: alert.colour }}
        >
          {alert.headline} — {boatName}
        </p>
        <p className="text-[12px] text-[#6B7C93] truncate">
          {weather.label} · {weather.windspeed} mph wind
        </p>
      </div>
      <span className="text-[#6B7C93] text-[13px] flex-shrink-0">
        View →
      </span>
    </a>
  )
}

Add to dashboard home page after greeting:
  Import getWeatherData for today's trips.
  If any trip has shouldAlert: true,
  render TodayWeatherBar above the TodayTripCard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 8 — TEST SUITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/__tests__/unit/weather/
  alertRules.test.ts

import { describe, it, expect } from 'vitest'
import {
  evaluateWeatherAlert,
  shouldSendNewAlert,
} from '@/lib/weather/alertRules'
import type { WeatherData } from '@/lib/trip/getWeatherData'

function makeWeather(
  override: Partial<WeatherData> = {}
): WeatherData {
  return {
    code: 1,
    temperature: 78,
    windspeed: 8,
    precipitation: 0,
    label: 'Mainly clear',
    severity: 'good',
    icon: '🌤️',
    color: '#1D9E75',
    bgColor: '#E8F9F4',
    ...override,
  }
}

describe('evaluateWeatherAlert', () => {
  it('returns shouldAlert:false for good conditions', () => {
    const w = makeWeather({ code: 1, windspeed: 8 })
    expect(evaluateWeatherAlert(w).shouldAlert).toBe(false)
  })

  it('returns fair severity for light drizzle', () => {
    const w = makeWeather({ code: 51, windspeed: 10 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.severity).toBe('fair')
    expect(alert.shouldAlert).toBe(true)
  })

  it('returns fair severity for elevated wind', () => {
    const w = makeWeather({ code: 1, windspeed: 20 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.severity).toBe('fair')
    expect(alert.shouldAlert).toBe(true)
  })

  it('returns poor severity for heavy showers', () => {
    const w = makeWeather({ code: 82, windspeed: 15 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.severity).toBe('poor')
    expect(alert.shouldAlert).toBe(true)
  })

  it('returns poor severity for high wind 28mph', () => {
    const w = makeWeather({ code: 2, windspeed: 28 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.severity).toBe('poor')
  })

  it('returns dangerous for thunderstorm', () => {
    const w = makeWeather({ code: 95, windspeed: 15 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.severity).toBe('dangerous')
    expect(alert.shouldAlert).toBe(true)
  })

  it('returns dangerous for extreme wind 40mph', () => {
    const w = makeWeather({ code: 2, windspeed: 40 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.severity).toBe('dangerous')
  })

  it('alert has all required fields', () => {
    const w = makeWeather({ code: 95, windspeed: 45 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.headline).toBeTruthy()
    expect(alert.detail).toBeTruthy()
    expect(alert.emoji).toBeTruthy()
    expect(alert.colour).toMatch(/^#/)
    expect(alert.bgColour).toMatch(/^#/)
    expect(alert.operatorAction).toBeTruthy()
  })
})

describe('shouldSendNewAlert', () => {
  const fairAlert = evaluateWeatherAlert(
    makeWeather({ code: 51, windspeed: 20 })
  )
  const poorAlert = evaluateWeatherAlert(
    makeWeather({ code: 82, windspeed: 25 })
  )
  const dangerousAlert = evaluateWeatherAlert(
    makeWeather({ code: 95, windspeed: 45 })
  )

  it('sends when never alerted before', () => {
    expect(shouldSendNewAlert(fairAlert, null, null)).toBe(true)
  })

  it('does not re-send at same severity', () => {
    const recentTime = new Date(Date.now() - 60000).toISOString()
    expect(
      shouldSendNewAlert(fairAlert, 'fair', recentTime)
    ).toBe(false)
  })

  it('sends when severity escalates fair → poor', () => {
    const recentTime = new Date(Date.now() - 60000).toISOString()
    expect(
      shouldSendNewAlert(poorAlert, 'fair', recentTime)
    ).toBe(true)
  })

  it('sends when severity escalates poor → dangerous', () => {
    const recentTime = new Date(Date.now() - 60000).toISOString()
    expect(
      shouldSendNewAlert(dangerousAlert, 'poor', recentTime)
    ).toBe(true)
  })

  it('re-sends dangerous after 6 hours', () => {
    const oldTime = new Date(Date.now() - 7 * 3600000).toISOString()
    expect(
      shouldSendNewAlert(dangerousAlert, 'dangerous', oldTime)
    ).toBe(true)
  })

  it('does not re-send dangerous within 6 hours', () => {
    const recentTime = new Date(Date.now() - 3 * 3600000).toISOString()
    expect(
      shouldSendNewAlert(dangerousAlert, 'dangerous', recentTime)
    ).toBe(false)
  })

  it('does not alert for good weather', () => {
    const goodAlert = evaluateWeatherAlert(makeWeather({ code: 1 }))
    expect(shouldSendNewAlert(goodAlert, null, null)).toBe(false)
  })
})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 9 — VERIFICATION TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All 14 tests must pass to complete Phase 3H
and the Phase 3 build cycle.

TEST 1 — Unit tests:
  npm run test
  All tests in __tests__/unit/weather/ pass
  21 assertions covering alertRules

TEST 2 — Migration 006 applied:
  trips: weather_alert_sent_at, weather_alert_severity
  guests: trip_reminder_sent_at, waiver_reminder_sent_at
  Both indexes created

TEST 3 — Alert severity thresholds (manual):
  Using the evaluateWeatherAlert function directly:
  WMO code 1, wind 8mph → shouldAlert: false
  WMO code 51, wind 10mph → severity: fair
  WMO code 82, wind 25mph → severity: poor
  WMO code 95, wind 20mph → severity: dangerous
  All verified with console.log in dev

TEST 4 — Weather monitor (manual trigger):
  Add a test endpoint (dev only):
    GET /api/dev/run-weather-monitor
  Triggers runWeatherMonitor() directly
  EXPECTED:
    Output: checked=N, alerted=M, errors=0
    If trip in next 48hrs has bad weather:
      operator_notifications row inserted
      trips.weather_checked_at updated

TEST 5 — Weather alert email:
  Set a test trip with tomorrow's date
  Set marina coords to a location with known
  weather (e.g. Miami)
  Manually run weather monitor
  If conditions trigger: operator receives email
    Subject: emoji + "Weather advisory — [boat] on [date]"
    Alert banner with correct colour
    "Open dashboard" button
    Unsubscribe link

TEST 6 — Alert deduplication:
  Trigger weather monitor twice within 3 hours
  Same trip, same severity
  EXPECTED:
    Only 1 operator_notification row
    Only 1 email sent
    trips.weather_alert_sent_at unchanged on 2nd run

TEST 7 — Severity escalation re-alerts:
  Manually set:
    trips.weather_alert_severity = 'fair'
    trips.weather_alert_sent_at = now - 1hr
  Then trigger monitor with 'poor' conditions
  EXPECTED: new alert fires (escalation)

TEST 8 — Trip day reminder (manual trigger):
  Create a test trip with trip_date = tomorrow
  Add a guest with email address
  Add a test endpoint: GET /api/dev/run-reminders
  Trigger it
  EXPECTED:
    Guest receives email reminder
    Subject: "Your charter is tomorrow — [boat]"
    Has boarding pass button, Maps link
    guest.trip_reminder_sent_at updated
    Running again: no duplicate email

TEST 9 — Waiver alert:
  Create a trip with trip_date = day after tomorrow
  Add a guest with waiver_signed = false
  Trigger reminder worker
  EXPECTED:
    operator_notifications row with type 'unsigned_waivers'
    Shows unsigned guest names in body
    Dashboard notification bell shows it

TEST 10 — Daily activation cron:
  Create a test trip with trip_date = today
  Manually call runDailyCron()
  EXPECTED:
    trips.status changes 'upcoming' → 'active'
    operator_notifications row with 'trip_activated'
    Dashboard shows trip as Active

TEST 11 — Daily GDPR cleanup:
  Create a test guest from 91 days ago
    (manually set created_at in Supabase)
  Run daily cron
  EXPECTED:
    guest.full_name = 'DELETED'
    guest.emergency_contact_name = 'DELETED'
    guest.deleted_at set
    Other guests unchanged

TEST 12 — WeatherAlertCard renders:
  Open /dashboard/trips/[id] for a trip
    with concerning weather (or mock weather data)
  WeatherAlertCard visible with:
    Correct emoji and headline
    Alert detail text
    Customisable message textarea
    "Send to all guests" button

TEST 13 — Notify guests from dashboard:
  Open trip detail with active weather alert
  Click "Send to all guests"
  EXPECTED:
    API rate limit: first call succeeds
    Second call within 1hr: 429 error shown
    Supabase: trip_messages row inserted
      with sender_type = 'system'
    Guest on trip page sees chat message:
      "⚠️ [operator message]"

TEST 14 — Build clean:
  npm run typecheck → zero errors
  npm run build → zero errors
  Worker TypeScript compiles: npm run build (in apps/worker)
  No 'any' in new files
  No unused imports

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORT BACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When all 14 tests pass:
  1. Every file created (full paths)
  2. Every file modified (full paths + what changed)
  3. Migration 006 confirmation:
     - 2 new columns on trips
     - 2 new columns on guests
     - Indexes created
  4. All 14 test results: ✅ / ❌
  5. Worker build output:
     - apps/worker: npm run build → success?
     - dist/cron/hourly.js exists?
     - dist/cron/daily-entry.js exists?
  6. Alert threshold coverage:
     - Which WMO codes map to each severity?
     - Confirmed with unit test output
  7. Render cron services:
     - dockpass-hourly: schedule confirmed
     - dockpass-daily: schedule confirmed
  8. Any deviations from spec + why
  9. Total lines added

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 COMPLETION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When Phase 3H passes all 14 tests,
the full Phase 3 cycle is complete.

Confirm all phases passed before moving
to the landing page (Phase 4A):

3A  Trip creation         ✅ / ❌
3B  Guest trip page       ✅ / ❌
3C  Guest join flow       ✅ / ❌
3D  Operator dashboard    ✅ / ❌
3E  Captain experience    ✅ / ❌
3F  Post-trip             ✅ / ❌
3G  Real-time layer       ✅ / ❌
3H  Weather + alerts      ✅ / ❌

When all 8 sub-phases are ✅:
  Phase 3 is complete.
  The product is feature-complete for MVP.
  Next: Phase 4A — Operator landing page.
```
