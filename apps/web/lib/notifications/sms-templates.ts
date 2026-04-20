/**
 * Standardized SMS templates optimized for < 160 characters (1 segment).
 */

export const smsTemplates = {

  // Captain receives snapshot
  captainSnapshotReady: (params: {
    boatName: string
    date: string  // "Apr 20"
    time: string  // "9AM"
    checkedIn: number
    total: number
    shortUrl: string
    code: string
  }) =>
    `Boatcheckin: ${params.boatName} ${params.date} ${params.time} — ${params.checkedIn}/${params.total} guests ready.\nSnapshot: ${params.shortUrl}\nCode: ${params.code} · Valid 6hr`,

  // Captain snapshot - partial (T-60min fallback)
  captainSnapshotPartial: (params: {
    boatName: string
    date: string
    time: string
    checkedIn: number
    total: number
    shortUrl: string
  }) =>
    `Boatcheckin: ${params.boatName} departs in 60min. ${params.checkedIn}/${params.total} guests ready.\nSnapshot: ${params.shortUrl}`,

  // Operator: all guests in
  operatorGuestsComplete: (params: {
    boatName: string
    count: number
    code: string
  }) =>
    `Boatcheckin: All ${params.count} guests checked in for ${params.boatName} (${params.code}). Trip ready to start.`,

  // Operator: trip started (if not present)
  operatorTripStarted: (params: {
    boatName: string
    startedAt: string  // "9:04 AM"
    guestCount: number
  }) =>
    `Boatcheckin: ${params.boatName} departed at ${params.startedAt} with ${params.guestCount} guests aboard.`,

  // Operator: manifest ready
  operatorManifestReady: (params: {
    boatName: string
    date: string
    guestCount: number
    code: string
  }) =>
    `Boatcheckin: ${params.boatName} manifest (${params.date}, ${params.guestCount} guests) emailed to you. Ref: ${params.code}`,

  // Operator: critical weather
  operatorWeatherCritical: (params: {
    boatName: string
    date: string
    condition: string  // "Storm warning"
    windKnots: number
  }) =>
    `Boatcheckin WEATHER: ${params.condition} forecast for ${params.boatName} ${params.date}. Wind ${params.windKnots}kt. Review in dashboard.`,

  // Captain: critical weather (if trip is active)
  captainWeatherActive: (params: {
    boatName: string
    condition: string
    windKnots: number
  }) =>
    `Boatcheckin WEATHER: ${params.condition} approaching. Wind ${params.windKnots}kt. Check your dashboard.`,

  // Operator: license expiry
  operatorLicenseExpiry: (params: {
    captainName: string
    licenseType: string
    expiresOn: string  // "May 17, 2026"
    daysLeft: number
  }) =>
    `Boatcheckin: ${params.captainName}'s ${params.licenseType} license expires ${params.expiresOn} (${params.daysLeft} days). Renew to keep them active.`,

  // Operator: first guest checked in (trip day, morning)
  operatorFirstGuestIn: (params: {
    guestName: string
    boatName: string
    remaining: number
  }) =>
    `Boatcheckin: ${params.guestName} checked into ${params.boatName}. ${params.remaining} guests still pending.`,

  // Captain: token expired, new link
  captainSnapshotRefreshed: (params: {
    boatName: string
    shortUrl: string
  }) =>
    `Boatcheckin: Your ${params.boatName} snapshot was refreshed. New link: ${params.shortUrl}`,
}
