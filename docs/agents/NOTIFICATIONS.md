# BoatCheckin — Notifications Agent
# @NOTIFICATIONS

## Role
You own all communication channels: email (Resend),
SMS (Twilio), push notifications (Web Push API),
and in-app notifications. Every message must be
multilingual-aware. Never send without operator consent.

---

## Channels Summary

```
Email (Resend):
  → Post-trip review requests
  → Rebooking sequences (60-day)
  → Payment failed alerts
  → Weather cancellation notices
  → Welcome / onboarding
  → Manifest PDF delivery

SMS (Twilio):
  → Trip day reminder (guests)
  → Waiver reminder (operator sends to pending)
  → Weather alert (critical only)
  Cost: ~$0.008/SMS (US)

Push (Web Push API via PWA):
  → "Your charter is tomorrow"
  → "How was your trip?" (2hrs post-trip)
  → Weather update for trip day
  → "New guest checked in" (operator)

In-app (Supabase realtime):
  → Guest registered
  → Waiver signed
  → Add-on ordered
  → Weather alert
```

---

## Resend Email Setup

```typescript
// lib/notifications/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = 'BoatCheckin <hello@boatcheckin.com>'

// Base send function
async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text,
    })
    if (error) throw error
    return data
  } catch (err) {
    console.error('[email] send failed:', err)
    throw err
  }
}
```

---

## Email Templates

### Welcome Email (operator signup)

```typescript
export async function sendWelcomeEmail(operator: {
  email: string
  fullName: string
}) {
  return sendEmail({
    to: operator.email,
    subject: 'Welcome to BoatCheckin — let\'s set up your first boat',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0C447C; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚓ BoatCheckin</h1>
        </div>
        <div style="padding: 32px;">
          <h2>Welcome, ${operator.fullName}!</h2>
          <p>You're all set. Let's create your first trip in under 10 minutes.</p>
          <p><strong>Step 1:</strong> Set up your boat profile<br>
             <strong>Step 2:</strong> Create your first trip<br>
             <strong>Step 3:</strong> Share the link with your guests</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/boats/new"
             style="display: inline-block; background: #0C447C; color: white;
                    padding: 14px 28px; border-radius: 10px; text-decoration: none;
                    font-weight: 600; margin-top: 16px;">
            Set up my boat →
          </a>
        </div>
        <div style="padding: 16px 32px; color: #6B7C93; font-size: 12px;">
          BoatCheckin — Oakmont Logic LLC
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe"
             style="color: #6B7C93;">Unsubscribe</a>
        </div>
      </div>
    `,
    text: `Welcome ${operator.fullName}! Set up your boat at: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })
}
```

### Review Request Email (auto-triggered post-trip)

```typescript
export async function sendReviewRequest(guest: {
  email?: string
  fullName: string
  language: string
  boatName: string
  captainName: string
  tripSlug: string
}) {
  if (!guest.email) return // email optional in registration

  const t = getReviewTranslations(guest.language)

  return sendEmail({
    to: guest.email,
    subject: t.subject(guest.boatName),
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1D9E75; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">
            ${t.title} 🌊
          </h1>
        </div>
        <div style="padding: 32px;">
          <p>${t.greeting(guest.fullName)}</p>
          <p>${t.body(guest.boatName, guest.captainName)}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/trip/${guest.tripSlug}?review=true"
             style="display: inline-block; background: #0C447C; color: white;
                    padding: 14px 28px; border-radius: 10px; text-decoration: none;
                    font-weight: 600; margin-top: 16px;">
            ${t.cta} ⭐
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #6B7C93;">
            ${t.footer}
          </p>
        </div>
      </div>
    `,
    text: `${t.title} — ${t.body(guest.boatName, guest.captainName)}`,
  })
}

function getReviewTranslations(lang: string) {
  const translations: Record<string, any> = {
    en: {
      subject: (boat: string) => `How was your trip on ${boat}? ⭐`,
      title: 'Hope you had an amazing time!',
      greeting: (name: string) => `Hi ${name},`,
      body: (boat: string, captain: string) =>
        `Your charter on ${boat} with ${captain} is complete. We'd love to hear how it went!`,
      cta: 'Rate your experience',
      footer: 'Takes 30 seconds. Means everything to small operators.',
    },
    es: {
      subject: (boat: string) => `¿Cómo fue tu viaje en ${boat}? ⭐`,
      title: '¡Esperamos que lo hayas pasado increíble!',
      greeting: (name: string) => `Hola ${name},`,
      body: (boat: string, captain: string) =>
        `Tu charter en ${boat} con ${captain} ha terminado. ¡Nos encantaría saber cómo fue!`,
      cta: 'Valorar mi experiencia',
      footer: 'Solo 30 segundos. Significa mucho para los operadores.',
    },
  }
  return translations[lang] ?? translations.en
}
```

### Weather Cancellation Email

```typescript
export async function sendWeatherCancellation(params: {
  operatorEmail: string
  boatName: string
  tripDate: string
  weatherDescription: string
  guestEmails: string[]
  rebookDates: string[]
}) {
  // Email to operator
  await sendEmail({
    to: params.operatorEmail,
    subject: `⚠️ Weather advisory for your ${params.tripDate} charter`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #FEF3DC; border-left: 4px solid #E5910A;
                    padding: 20px; margin-bottom: 24px;">
          <h2 style="color: #7A4F00; margin: 0 0 8px;">
            ⚠️ Weather advisory detected
          </h2>
          <p style="color: #7A4F00; margin: 0;">
            ${params.weatherDescription} on ${params.tripDate}
          </p>
        </div>
        <p>Your BoatCheckin dashboard has a one-tap notification ready to send to all
           ${params.guestEmails.length} guests simultaneously.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="display: inline-block; background: #0C447C; color: white;
                  padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600;">
          Open dashboard to notify guests →
        </a>
      </div>
    `,
    text: `Weather advisory for ${params.tripDate}. Open BoatCheckin to notify guests.`,
  })
}
```

---

## SMS (Twilio)

```typescript
// lib/notifications/sms.ts
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function sendSMS(to: string, body: string) {
  // Validate phone number format
  if (!to.match(/^\+?[\d\s\-()]{7,20}$/)) {
    console.warn('[sms] invalid phone number format')
    return
  }

  try {
    await client.messages.create({
      from: process.env.TWILIO_FROM_NUMBER!,
      to,
      body: body.slice(0, 160), // SMS limit
    })
  } catch (err) {
    console.error('[sms] failed:', err)
    // Never throw — SMS failure is non-critical
  }
}

// Trip day reminder to guest
export async function sendTripReminder(guest: {
  phone: string
  fullName: string
  boatName: string
  departureTime: string
  marinaName: string
  slipNumber: string
  tripSlug: string
}) {
  const firstName = guest.fullName.split(' ')[0]
  await sendSMS(
    guest.phone,
    `Hi ${firstName}! Your charter on ${guest.boatName} ` +
    `departs at ${guest.departureTime} from ${guest.marinaName} ` +
    `Slip ${guest.slipNumber}. ` +
    `Trip guide: boatcheckin.com/trip/${guest.tripSlug}`
  )
}

// Waiver reminder (operator copies and sends manually, or auto)
export async function sendWaiverReminder(guest: {
  phone: string
  fullName: string
  tripSlug: string
}) {
  const firstName = guest.fullName.split(' ')[0]
  await sendSMS(
    guest.phone,
    `Hi ${firstName} — please sign your charter waiver before tomorrow: ` +
    `boatcheckin.com/trip/${guest.tripSlug}`
  )
}
```

---

## Web Push Notifications (PWA)

```typescript
// lib/notifications/push.ts
import webpush from 'web-push'

webpush.setVapidDetails(
  `mailto:hello@boatcheckin.com`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Store subscriptions in Supabase
export async function sendPushToGuest(
  subscription: PushSubscription,
  payload: {
    title: string
    body: string
    icon?: string
    url?: string
  }
) {
  try {
    await webpush.sendNotification(
      subscription as any,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon ?? '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        url: payload.url ?? '/',
        data: { url: payload.url },
      })
    )
  } catch (err: any) {
    // 410 = subscription expired, remove from DB
    if (err.statusCode === 410) {
      await removeExpiredSubscription(subscription)
    }
  }
}

// Pre-built notification types
export const pushTemplates = {
  tripTomorrow: (boatName: string, time: string) => ({
    title: `Your charter is tomorrow ⚓`,
    body: `${boatName} departs at ${time}. Tap to view dock details.`,
  }),
  reviewRequest: (boatName: string) => ({
    title: `How was your trip? ⭐`,
    body: `Rate your experience on ${boatName}. Takes 30 seconds.`,
  }),
  weatherAlert: (boatName: string) => ({
    title: `⚠️ Weather update for your charter`,
    body: `${boatName} operator has sent you a message.`,
  }),
  guestRegistered: (guestName: string) => ({
    title: `New guest checked in`,
    body: `${guestName} has registered and signed the waiver.`,
  }),
}
```

---

## In-App Notifications (Supabase Realtime)

```typescript
// hooks/useOperatorNotifications.ts
'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export function useOperatorNotifications(operatorId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Initial load
    supabase
      .from('operator_notifications')
      .select('*')
      .eq('operator_id', operatorId)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setNotifications(data ?? []))

    // Realtime subscription
    const channel = supabase
      .channel('operator-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'operator_notifications',
        filter: `operator_id=eq.${operatorId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [operatorId])

  const markRead = async (id: string) => {
    await supabase
      .from('operator_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return { notifications, markRead }
}
```

---

## Notification Triggers (when to send what)

```
Trigger: Guest self-registers
  → In-app: operator notified instantly
  → Push: operator push (if subscribed)
  
Trigger: All waivers signed for trip
  → In-app: "All guests checked in ✓"
  
Trigger: 24 hours before trip
  → SMS: guest reminder (if phone provided)
  → Push: guest reminder (if PWA installed)
  
Trigger: 2 hours after trip ends
  → Email: review request to each guest
  → Push: review request push

Trigger: Weather advisory detected for trip day
  → Email: operator alerted
  → Push: operator push
  
Trigger: Guest pending waiver 48hrs before trip
  → In-app: "Ahmed K. waiver pending" amber row
  → Operator can tap: "Send reminder" → copies SMS text
  
Trigger: Operator payment failed
  → Email: payment failed notice
  → In-app: red banner in dashboard
  
Trigger: 60 days since last trip (rebooking)
  → Email: personalised rebooking offer
```

---

## Anti-Spam Rules

```
Max 1 email per guest per trip per type
Max 1 SMS per guest per trip per type
Unsubscribe link in every email
Honour opt-out immediately
No marketing to guests without explicit consent
CAN-SPAM compliant footers on all emails
GDPR unsubscribe flow for EU guests
```
