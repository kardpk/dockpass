import 'server-only'

import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib'
import { formatTripDate, formatTime, formatDuration, formatCurrency } from '@/lib/utils/format'
import type { OperatorTripDetail, AddonSummaryItem } from '@/types'

const NAVY  = rgb(0.047, 0.267, 0.486)
const TEAL  = rgb(0.114, 0.620, 0.459)
const CORAL = rgb(0.910, 0.349, 0.235)
const GREY  = rgb(0.419, 0.486, 0.576)
const DARK  = rgb(0.051, 0.106, 0.165)
const WHITE = rgb(1, 1, 1)
const LIGHT = rgb(0.961, 0.973, 0.988)

export async function generateManifest(
  trip: OperatorTripDetail,
  operatorName: string,
  addonSummary: AddonSummaryItem[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Passenger Manifest — ${trip.boat.boatName}`)
  doc.setAuthor('BoatCheckin')
  doc.setCreator('BoatCheckin — boatcheckin.com')
  doc.setCreationDate(new Date())

  let page = doc.addPage(PageSizes.A4)
  const { width, height } = page.getSize()
  const helvetica = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let y = height - 40

  // ── HEADER BAND ───────────────────────────
  page.drawRectangle({
    x: 0, y: y - 60,
    width, height: 80,
    color: NAVY,
  })
  page.drawText('PASSENGER MANIFEST', {
    x: 40, y: y - 20,
    size: 18, font: bold, color: WHITE,
  })
  page.drawText('BoatCheckin — boatcheckin.com', {
    x: width - 200, y: y - 20,
    size: 11, font: helvetica, color: rgb(1, 1, 1),
  })

  y -= 80

  // ── TRIP DETAILS ─────────────────────────
  y -= 20
  const details: [string, string][] = [
    ['Vessel', trip.boat.boatName],
    ['Operator', operatorName],
    ['Date', formatTripDate(trip.tripDate)],
    ['Departure', formatTime(trip.departureTime)],
    ['Duration', formatDuration(trip.durationHours)],
    ['Marina', trip.boat.marinaName],
    ['Slip', trip.boat.slipNumber ?? 'Not set'],
    ['Captain', trip.boat.captainName ?? 'Not set'],
    ['Charter Type', trip.charterType],
    ['Max Guests', trip.maxGuests.toString()],
  ]

  const col1 = details.slice(0, 5)
  const col2 = details.slice(5)

  col1.forEach(([label, value], i) => {
    page.drawText(`${label}:`, {
      x: 40, y: y - i * 18,
      size: 9, font: bold, color: GREY,
    })
    page.drawText(value, {
      x: 115, y: y - i * 18,
      size: 9, font: helvetica, color: DARK,
    })
  })
  col2.forEach(([label, value], i) => {
    page.drawText(`${label}:`, {
      x: width / 2, y: y - i * 18,
      size: 9, font: bold, color: GREY,
    })
    page.drawText(value, {
      x: width / 2 + 80, y: y - i * 18,
      size: 9, font: helvetica, color: DARK,
    })
  })

  y -= 110

  // ── SECTION DIVIDER helper ────────────────
  function sectionHeader(title: string, yPos: number): number {
    page.drawRectangle({
      x: 40, y: yPos - 20,
      width: width - 80, height: 22,
      color: LIGHT,
    })
    page.drawText(title, {
      x: 45, y: yPos - 13,
      size: 10, font: bold, color: NAVY,
    })
    return yPos - 30
  }

  // ── GUEST LIST ───────────────────────────
  y = sectionHeader(
    `PASSENGERS (${trip.guests.length} / ${trip.maxGuests})`,
    y
  )

  const cols = {
    num:    { x: 40  },
    name:   { x: 65  },
    lang:   { x: 200 },
    waiver: { x: 240 },
    ec:     { x: 305 },
    diet:   { x: 480 },
  }

  y -= 5
  page.drawText('#',        { x: cols.num.x,    y, size: 8, font: bold, color: GREY })
  page.drawText('Name',     { x: cols.name.x,   y, size: 8, font: bold, color: GREY })
  page.drawText('Lang',     { x: cols.lang.x,   y, size: 8, font: bold, color: GREY })
  page.drawText('Waiver',   { x: cols.waiver.x, y, size: 8, font: bold, color: GREY })
  page.drawText('Add-ons',  { x: cols.ec.x,     y, size: 8, font: bold, color: GREY })
  page.drawText('Dietary',  { x: cols.diet.x,   y, size: 8, font: bold, color: GREY })

  y -= 3
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 0.5,
    color: rgb(0.83, 0.89, 0.95),
  })
  y -= 16

  for (let i = 0; i < trip.guests.length; i++) {
    const guest = trip.guests[i]!

    // Zebra stripe
    if (i % 2 === 0) {
      page.drawRectangle({
        x: 40, y: y - 4,
        width: width - 80, height: 16,
        color: rgb(0.975, 0.984, 0.996),
      })
    }

    // Pending waiver — amber row
    if (!guest.waiverSigned) {
      page.drawRectangle({
        x: 40, y: y - 4,
        width: width - 80, height: 16,
        color: rgb(1, 0.976, 0.937),
      })
    }

    const rowY = y + 2
    page.drawText(`${i + 1}`, {
      x: cols.num.x, y: rowY,
      size: 9, font: helvetica, color: GREY,
    })

    const name = guest.fullName.length > 22
      ? guest.fullName.slice(0, 20) + '...'
      : guest.fullName
    page.drawText(name, {
      x: cols.name.x, y: rowY,
      size: 9, font: helvetica, color: DARK,
    })

    page.drawText(langToFlag(guest.languagePreference), {
      x: cols.lang.x, y: rowY,
      size: 9, font: helvetica, color: DARK,
    })

    if (guest.waiverSigned) {
      page.drawText('Signed', {
        x: cols.waiver.x, y: rowY,
        size: 9, font: bold, color: TEAL,
      })
    } else {
      page.drawText('Pending', {
        x: cols.waiver.x, y: rowY,
        size: 9, font: bold, color: CORAL,
      })
    }

    const addonText = guest.addonOrders.map(o => o.emoji).join(' ') || '—'
    page.drawText(addonText, {
      x: cols.ec.x, y: rowY,
      size: 9, font: helvetica, color: GREY,
    })

    if (guest.dietaryRequirements) {
      const dietShort = guest.dietaryRequirements.length > 14
        ? guest.dietaryRequirements.slice(0, 12) + '...'
        : guest.dietaryRequirements
      page.drawText(dietShort, {
        x: cols.diet.x, y: rowY,
        size: 8, font: helvetica,
        color: CORAL,
      })
    }

    y -= 16
    if (y < 100) {
      page = doc.addPage(PageSizes.A4)
      y = page.getSize().height - 60
    }
  }

  y -= 10

  // ── ADD-ON ORDERS ────────────────────────
  if (addonSummary.length > 0) {
    y = sectionHeader('ADD-ON ORDERS', y)

    addonSummary.forEach(item => {
      page.drawText(
        `${item.emoji} ${item.addonName} x ${item.totalQty} — ${item.guestNames.join(', ')} — ${formatCurrency(item.totalCents)}`,
        { x: 45, y, size: 9, font: helvetica, color: DARK }
      )
      y -= 16
    })
    y -= 8
  }

  // ── PASSENGER ALERTS ─────────────────────
  const nonSwimmers = trip.guests.filter(g => g.isNonSwimmer)
  const seasick = trip.guests.filter(g => g.isSeaSicknessProne)
  const dietary = trip.guests.filter(g => g.dietaryRequirements)

  if (nonSwimmers.length > 0 || seasick.length > 0 || dietary.length > 0) {
    y = sectionHeader('PASSENGER ALERTS', y)

    if (nonSwimmers.length > 0) {
      page.drawText(
        `Non-swimmers: ${nonSwimmers.map(g => g.fullName.split(' ')[0]).join(', ')}`,
        { x: 45, y, size: 9, font: bold, color: CORAL }
      )
      y -= 16
    }
    if (seasick.length > 0) {
      page.drawText(
        `Seasickness prone: ${seasick.map(g => g.fullName.split(' ')[0]).join(', ')}`,
        { x: 45, y, size: 9, font: bold, color: CORAL }
      )
      y -= 16
    }
    if (dietary.length > 0) {
      dietary.forEach(g => {
        page.drawText(
          `${g.fullName.split(' ')[0]}: ${g.dietaryRequirements}`,
          { x: 45, y, size: 9, font: helvetica, color: DARK }
        )
        y -= 14
      })
    }
    y -= 8
  }

  // ── LEGAL COMPLIANCE ─────────────────────
  const allSigned = trip.guests.every(g => g.waiverSigned)
  if (allSigned && trip.guests.length > 0) {
    y = sectionHeader('LEGAL COMPLIANCE', y)
    page.drawText(
      `All ${trip.guests.length} passengers have signed the digital liability waiver`,
      { x: 45, y, size: 9, font: helvetica, color: TEAL }
    )
    y -= 14
    page.drawText(
      `Safety briefing acknowledged individually by all passengers`,
      { x: 45, y, size: 9, font: helvetica, color: TEAL }
    )
  }

  // ── FOOTER ───────────────────────────────
  const finalPage = doc.getPages()[doc.getPageCount() - 1]!
  finalPage.drawLine({
    start: { x: 40, y: 60 },
    end: { x: width - 40, y: 60 },
    thickness: 0.5,
    color: rgb(0.83, 0.89, 0.95),
  })
  finalPage.drawText(
    `Generated by BoatCheckin (boatcheckin.com) · ${new Date().toLocaleString('en-US')} · Keep a copy for USCG compliance`,
    { x: 40, y: 45, size: 7, font: helvetica, color: GREY }
  )
  finalPage.drawText(
    `Trip ID: ${trip.id} · Vessel: ${trip.boat.boatName}`,
    { x: 40, y: 34, size: 7, font: helvetica, color: GREY }
  )

  return doc.save()
}

function langToFlag(code: string): string {
  const map: Record<string, string> = {
    en: 'EN', es: 'ES', pt: 'PT',
    fr: 'FR', de: 'DE', it: 'IT',
  }
  return map[code] ?? code.toUpperCase()
}
