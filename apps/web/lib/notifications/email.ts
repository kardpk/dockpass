import 'server-only'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS = 'BoatCheckin <noreply@boatcheckin.com>'

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  // Dev/missing key: log and return mock
  if (!RESEND_API_KEY) {
    console.log(`[email] No RESEND_API_KEY — mock send to: ${params.to}`)
    console.log(`[email] Subject: ${params.subject}`)
    return { success: true, messageId: `mock-${Date.now()}` }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error(`[email] Resend error ${res.status}: ${error}`)
      return { success: false, messageId: null }
    }

    const data = await res.json()
    return { success: true, messageId: data.id ?? null }
  } catch (err) {
    console.error('[email] Failed to send:', err)
    return { success: false, messageId: null }
  }
}

export async function sendReviewRequestEmail(params: {
  to: string
  guestName: string
  language: string
  boatName: string
  captainName: string
  tripSlug: string
}) {
  const t = getReviewEmailTranslation(params.language)
  const firstName = params.guestName.split(' ')[0]!
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/trip/${params.tripSlug}/completed`

  return sendEmail({
    to: params.to,
    subject: t.subject(params.boatName),
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#F5F8FC;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">

    <!-- Header -->
    <div style="background:#1D9E75;padding:40px 32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🌊</div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">
        ${t.heading}
      </h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">
        — ${params.captainName} ${t.andTeam}
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#0D1B2A;font-size:16px;margin:0 0 8px;">
        ${t.greeting(firstName)},
      </p>
      <p style="color:#6B7C93;font-size:15px;line-height:1.6;margin:0 0 24px;">
        ${t.body(params.boatName)}
      </p>

      <!-- Star rating CTA -->
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${reviewUrl}"
           style="display:inline-block;background:#0C447C;color:white;
                  padding:16px 36px;border-radius:12px;text-decoration:none;
                  font-weight:700;font-size:16px;">
          ${t.cta}
        </a>
      </div>

      <p style="color:#6B7C93;font-size:13px;text-align:center;margin:0;">
        ${t.footer}
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#F5F8FC;padding:16px 32px;text-align:center;
                border-top:1px solid #D0E2F3;">
      <p style="color:#6B7C93;font-size:11px;margin:0;">
        BoatCheckin — Oakmont Logic LLC ·
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy"
           style="color:#6B7C93;">Privacy</a> ·
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe"
           style="color:#6B7C93;">${t.unsubscribe}</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    text: `${t.heading} ${t.body(params.boatName)} ${reviewUrl}`,
  })
}

// ─── Review email translations ───────────
type ReviewEmailT = {
  subject: (boat: string) => string
  heading: string
  andTeam: string
  greeting: (name: string) => string
  body: (boat: string) => string
  cta: string
  footer: string
  unsubscribe: string
}

function getReviewEmailTranslation(lang: string): ReviewEmailT {
  const map: Record<string, ReviewEmailT> = {
    en: {
      subject: b => `How was your trip on ${b}? ⭐`,
      heading: 'Hope you had an amazing time!',
      andTeam: '& the BoatCheckin team',
      greeting: n => `Hi ${n}`,
      body: b => `Your charter on ${b} is complete. It takes 30 seconds to leave a review — and it means everything to a small charter operator.`,
      cta: 'Rate my experience ⭐',
      footer: 'Takes 30 seconds. Means everything.',
      unsubscribe: 'Unsubscribe',
    },
    es: {
      subject: b => `¿Cómo fue tu viaje en ${b}? ⭐`,
      heading: '¡Esperamos que lo hayas pasado increíble!',
      andTeam: 'y el equipo de BoatCheckin',
      greeting: n => `Hola ${n}`,
      body: b => `Tu charter en ${b} ha terminado. Solo 30 segundos para dejar una reseña — significa mucho para los operadores.`,
      cta: 'Valorar mi experiencia ⭐',
      footer: 'Solo 30 segundos.',
      unsubscribe: 'Cancelar suscripción',
    },
    fr: {
      subject: b => `Comment était votre sortie sur ${b} ? ⭐`,
      heading: 'Nous espérons que vous avez passé un moment inoubliable !',
      andTeam: "& l'équipe BoatCheckin",
      greeting: n => `Bonjour ${n}`,
      body: b => `Votre charter sur ${b} est terminé. 30 secondes pour laisser un avis — cela compte énormément.`,
      cta: 'Évaluer mon expérience ⭐',
      footer: '30 secondes suffisent.',
      unsubscribe: 'Se désabonner',
    },
    pt: {
      subject: b => `Como foi a sua viagem no ${b}? ⭐`,
      heading: 'Esperamos que tenha adorado!',
      andTeam: '& a equipa BoatCheckin',
      greeting: n => `Olá ${n}`,
      body: b => `O seu charter no ${b} terminou. São apenas 30 segundos para deixar uma avaliação.`,
      cta: 'Avaliar a minha experiência ⭐',
      footer: 'Apenas 30 segundos.',
      unsubscribe: 'Cancelar subscrição',
    },
    de: {
      subject: b => `Wie war Ihre Tour auf ${b}? ⭐`,
      heading: 'Wir hoffen, es war wunderschön!',
      andTeam: '& das BoatCheckin-Team',
      greeting: n => `Hallo ${n}`,
      body: b => `Ihr Charter auf ${b} ist abgeschlossen. 30 Sekunden für eine Bewertung — es bedeutet alles.`,
      cta: 'Erfahrung bewerten ⭐',
      footer: 'Nur 30 Sekunden.',
      unsubscribe: 'Abmelden',
    },
    it: {
      subject: b => `Com'è andato il viaggio su ${b}? ⭐`,
      heading: 'Speriamo tu abbia trascorso un momento fantastico!',
      andTeam: '& il team BoatCheckin',
      greeting: n => `Ciao ${n}`,
      body: b => `Il tuo charter su ${b} è terminato. Ci vogliono 30 secondi per lasciare una recensione.`,
      cta: 'Valuta la mia esperienza ⭐',
      footer: 'Solo 30 secondi.',
      unsubscribe: 'Disiscriviti',
    },
  }
  return map[lang] ?? map.en!
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Weather alert email (to operator)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Trip reminder email (to guest)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
      viewBoardingPass: "Voir la carte d'embarquement →",
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
      viewBoardingPass: "Visualizza carta d'imbarco →",
    },
  }
  return map[lang] ?? map.en!
}
