import type { CaptainSnapshotData } from '@/types'

/**
 * USCG Float Plan — generates a structured text-based float plan
 * for download as a printable file.
 * 
 * Based on the US Coast Guard Float Plan format:
 * https://www.uscgboating.org/recreational-boaters/floating-plan.php
 */

export function generateUSCGFloatPlan(snapshot: CaptainSnapshotData): string {
  const now = new Date()
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  })

  const durationStr = snapshot.durationHours
    ? `${snapshot.durationHours} hours`
    : 'N/A'

  const crewSection = snapshot.crewManifest.length > 0
    ? snapshot.crewManifest
        .map((c, i) => `    ${i + 1}. ${c.name} (${c.role})${c.license ? ` — License: ${c.license}` : ''}`)
        .join('\n')
    : `    1. ${snapshot.captainName ?? 'Unknown'} (Captain)${snapshot.captainLicense ? ` — License: ${snapshot.captainLicense}` : ''}`

  const guestSection = snapshot.guests
    .map((g, i) => {
      const ageInfo = g.dateOfBirth
        ? ` — DOB: ${new Date(g.dateOfBirth).toLocaleDateString('en-US')}`
        : ''
      const waiverStatus = g.waiverSigned ? '✓ Waiver' : '⏳ Pending'
      return `    ${i + 1}. ${g.fullName}${ageInfo} [${waiverStatus}]`
    })
    .join('\n')

  const alertLines: string[] = []
  if (snapshot.alerts.nonSwimmers > 0) alertLines.push(`    ⚠️ Non-swimmers: ${snapshot.alerts.nonSwimmers}`)
  if (snapshot.alerts.children > 0) alertLines.push(`    ⚠️ Children: ${snapshot.alerts.children}`)
  if (snapshot.alerts.childrenUnder6 > 0) alertLines.push(`    ⚠️ Children under 6 (PFD required): ${snapshot.alerts.childrenUnder6}`)
  if (snapshot.alerts.seasicknessProne > 0) alertLines.push(`    ⚠️ Seasickness prone: ${snapshot.alerts.seasicknessProne}`)
  if (snapshot.alerts.dietary.length > 0) {
    snapshot.alerts.dietary.forEach(d => alertLines.push(`    🥗 ${d.name}: ${d.requirement}`))
  }
  const alertSection = alertLines.length > 0 ? alertLines.join('\n') : '    None'

  const weatherSection = snapshot.weather
    ? `    ${snapshot.weather.icon} ${snapshot.weather.label} — ${snapshot.weather.temperature}°F`
    : '    Not available'

  return `
╔══════════════════════════════════════════════════════════╗
║            USCG FLOAT PLAN — BOATCHECKIN                ║
╚══════════════════════════════════════════════════════════╝

Generated: ${formattedDate} at ${formattedTime}
Trip ID:   ${snapshot.tripId}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1: VESSEL INFORMATION
─────────────────────────────
  Vessel Name:     ${snapshot.boatName}
  Vessel Type:     ${snapshot.boatType ?? 'N/A'}
  Charter Type:    ${snapshot.charterType}
  Trip Purpose:    ${snapshot.tripPurpose ?? 'commercial'}
  Compliance:      ${snapshot.forceFullCompliance ? 'FULL (override)' : snapshot.tripPurpose === 'commercial' || snapshot.tripPurpose === 'corporate' ? 'FULL' : 'RELAXED'}
  Length (ft):     ${snapshot.lengthFt ?? 'N/A'}
  State Code:      ${snapshot.stateCode || 'N/A'}

SECTION 2: DEPARTURE DETAILS
─────────────────────────────
  Marina:          ${snapshot.marinaName}
  Slip Number:     ${snapshot.slipNumber ?? 'N/A'}
  Trip Date:       ${snapshot.tripDate}
  Departure Time:  ${snapshot.departureTime}
  Est. Duration:   ${durationStr}

SECTION 3: CREW
─────────────────────────────
${crewSection}

SECTION 4: PASSENGERS (${snapshot.guests.length} / ${snapshot.maxGuests} max)
─────────────────────────────
${guestSection || '    No passengers registered'}

SECTION 5: WEATHER CONDITIONS
─────────────────────────────
${weatherSection}

SECTION 6: SAFETY ALERTS
─────────────────────────────
${alertSection}

SECTION 7: ADD-ONS & PROVISIONS
─────────────────────────────
${snapshot.addonSummary.length > 0
  ? snapshot.addonSummary
      .map(a => `    ${a.emoji} ${a.addonName}: ${a.totalQty} ordered ($${(a.totalCents / 100).toFixed(2)})`)
      .join('\n')
  : '    None'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAPTAIN'S NOTES
─────────────────────────────
(To be filled by captain before departure)

  Weather conditions at departure: _________________________
  Sea state: _______________________________________________
  VHF channel monitoring: __________________________________
  Safety equipment checked: ☐ PFDs  ☐ Fire ext.  ☐ Flares
  Float plan filed with: __________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7: SAFETY BRIEFING ATTESTATION (46 CFR §185.506)
─────────────────────────────────────────────────────────
${snapshot.safetyBriefingConfirmedAt
  ? `  Status:          ✅ CONFIRMED
  Confirmed By:    ${snapshot.safetyBriefingConfirmedBy ?? 'N/A'}
  Briefing Type:   ${(snapshot.safetyBriefingType ?? 'N/A').replace(/_/g, ' ')}
  Confirmed At:    ${snapshot.safetyBriefingConfirmedAt}`
  : `  Status:          ⚠️ NOT YET CONFIRMED
  Note:            Captain has not yet confirmed verbal safety orientation`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EMERGENCY: VHF Ch. 16 | USCG: 1-800-368-5647

This float plan was generated by BoatCheckin.
Filed on behalf of ${snapshot.captainName ?? 'the vessel captain'}.
`.trim()
}

/**
 * Triggers a browser download of the float plan as a text file.
 */
export function downloadFloatPlan(snapshot: CaptainSnapshotData): void {
  const content = generateUSCGFloatPlan(snapshot)
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().split('T')[0]
  link.href = url
  link.download = `float-plan-${snapshot.boatName.replace(/\s+/g, '-').toLowerCase()}-${date}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
