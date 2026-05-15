import { notFound } from 'next/navigation'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { shapeTripDetail, buildAddonSummary } from '@/lib/dashboard/getDashboardData'
import { getWeatherData } from '@/lib/trip/getWeatherData'
import { correctTripStatus } from '@/lib/utils/tripStatus'
import { TripDetailHeader } from '@/components/dashboard/TripDetailHeader'
import { GuestManagementTable } from '@/components/dashboard/GuestManagementTable'
import { TripStatusBar } from '@/components/dashboard/TripStatusBar'
import { AddonOrdersSummary } from '@/components/dashboard/AddonOrdersSummary'
import { TripReviewsSummary } from '@/components/dashboard/TripReviewsSummary'
import { TripActionBar } from '@/components/dashboard/TripActionBar'
import { TripCommunicationsPanel } from '@/components/dashboard/TripCommunicationsPanel'
import { WeatherAlertCard } from '@/components/dashboard/WeatherAlertCard'
import { TripCrewPanel } from '@/components/dashboard/TripCrewPanel'
import type { Metadata } from 'next'
import type { QualificationStatus } from '@/types'
import './trip-detail.css'

export const metadata: Metadata = { title: 'Trip detail — BoatCheckin' }

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const { data: raw, error } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_code, trip_date, departure_time,
      duration_hours, duration_days, max_guests, status, charter_type,
      requires_approval, special_notes,
      started_at, trip_type, requires_qualification,
      return_inspected_at, return_has_issues, return_fuel_level, return_condition_notes,
      bookings ( id, organiser_name, organiser_email,
        max_guests, booking_code, notes ),
      boats (
        id, boat_name, boat_type, marina_name,
        marina_address, slip_number, lat, lng,
        captain_name, waiver_text, safety_cards,
        requires_qualification
      ),
      guests (
        id, full_name, language_preference,
        dietary_requirements, is_non_swimmer,
        is_seasickness_prone, waiver_signed,
        waiver_signed_at, approval_status,
        checked_in_at, created_at,
        safety_acknowledgments, waiver_text_hash,
        guest_addon_orders (
          quantity, total_cents,
          addons ( name, emoji )
        ),
        guest_qualifications (
          id, qualification_status,
          has_boat_ownership, experience_years,
          safe_boater_required, safe_boater_card_url,
          attested_at, review_notes
        )
      )
    `)
    .eq('id', id)
    .eq('operator_id', operator.id)
    .is('guests.deleted_at', null)
    .order('created_at', {
      referencedTable: 'guests',
      ascending: true,
    })
    .single()

  if (error || !raw) {
    console.error('[TRIP_DETAIL_404]', { id, error: error?.message })
    notFound()
  }

  const rawTrip = shapeTripDetail(raw as Record<string, unknown>)
  // Read-time date correction — ensure correct status regardless of cron
  const trip = {
    ...rawTrip,
    status: correctTripStatus(rawTrip.tripDate, rawTrip.status),
  }
  const addonSummary = buildAddonSummary(trip.guests)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Waiver completion: all guests must have signed or be firma_template
  const allWaiversSigned = trip.guests.length > 0 &&
    trip.guests.every(g => g.waiverSigned || g.waiverTextHash === 'firma_template')

  // Fetch weather for alert card
  const boat = raw.boats as unknown as { lat: number | null; lng: number | null } | null
  const weather = boat?.lat && boat?.lng
    ? await getWeatherData(boat.lat, boat.lng, trip.tripDate)
    : null

  // Fetch crew assignments for this trip
  const { data: crewAssignments } = await supabase
    .from('trip_assignments')
    .select('captain_id, role, captains ( full_name )')
    .eq('trip_id', id)
    .eq('operator_id', operator.id)

  const assignments = (crewAssignments ?? []).map(a => ({
    captainId: a.captain_id as string,
    captainName: (a.captains as unknown as { full_name: string })?.full_name ?? 'Unknown',
    role: a.role as string,
  }))

  // ── Multi-day rental days (Phase 4E) ──────────────────────────────────────
  const rawDurationDays = (raw as Record<string, unknown>).duration_days as number | null ?? 1
  const isMultiDay = rawDurationDays > 1

  type RentalDayRow = {
    id: string
    day_number: number
    day_date: string
    status: string
    notes_in: string | null
    notes_out: string | null
    fuel_level_in: string | null
    fuel_level_out: string | null
    issues_reported: string | null
    check_in_at: string | null
    check_out_at: string | null
    photos_in: { url: string; path: string }[] | null
    photos_out: { url: string; path: string }[] | null
  }

  let rentalDays: RentalDayRow[] = []
  if (isMultiDay) {
    try {
      const { data: rd } = await supabase
        .from('rental_days')
        .select('id, day_number, day_date, status, notes_in, notes_out, fuel_level_in, fuel_level_out, issues_reported, check_in_at, check_out_at, photos_in, photos_out')
        .eq('trip_id', id)
        .order('day_number')
      rentalDays = (rd ?? []) as RentalDayRow[]

      // Generate signed URLs for private photos (1h TTL)
      for (const day of rentalDays) {
        // photos_in paths
        if (day.photos_in && day.photos_in.length > 0) {
          day.photos_in = await Promise.all(
            day.photos_in.map(async (p) => {
              try {
                const { data: signed } = await supabase.storage
                  .from('condition-photos')
                  .createSignedUrl(p.path, 3600)
                return { ...p, url: signed?.signedUrl ?? p.url }
              } catch { return p }
            })
          )
        }
        // photos_out paths
        if (day.photos_out && day.photos_out.length > 0) {
          day.photos_out = await Promise.all(
            day.photos_out.map(async (p) => {
              try {
                const { data: signed } = await supabase.storage
                  .from('condition-photos')
                  .createSignedUrl(p.path, 3600)
                return { ...p, url: signed?.signedUrl ?? p.url }
              } catch { return p }
            })
          )
        }
      }
    } catch { /* non-fatal */ }
  }

  const returnRecord = (raw as Record<string, unknown>).return_inspected_at ? {
    inspectedAt:  (raw as Record<string, unknown>).return_inspected_at as string,
    hasIssues:    (raw as Record<string, unknown>).return_has_issues as boolean,
    fuelLevel:    (raw as Record<string, unknown>).return_fuel_level as string | null,
    notes:        (raw as Record<string, unknown>).return_condition_notes as string | null,
  } : null

  // Compute whether this is a qualification trip
  type RawTrip = typeof raw
  const rawBoat = (raw as Record<string, unknown>).boats as Record<string, unknown> | null
  const tripRequiresQualification =
    (raw as Record<string, unknown>).requires_qualification === true ||
    rawBoat?.requires_qualification === true

  // Shape qualification map: guest_id → qualification record
  const qualificationMap = new Map<string, {
    id: string
    qualificationStatus: QualificationStatus
    hasBoatOwnership: boolean
    experienceYears: number
    safetyBoaterRequired: boolean
    safetyBoaterCardUrl: string | null
    attestedAt: string
    reviewNotes: string | null
  }>()

  type RawGuest = { id: string; guest_qualifications?: Record<string, unknown>[] }
  const rawGuests = ((raw as Record<string, unknown>).guests ?? []) as RawGuest[]
  for (const g of rawGuests) {
    const quals = g.guest_qualifications ?? []
    if (quals.length > 0) {
      const q = quals[0] as Record<string, unknown>
      qualificationMap.set(g.id, {
        id:                  q.id as string,
        qualificationStatus: q.qualification_status as QualificationStatus,
        hasBoatOwnership:    q.has_boat_ownership as boolean,
        experienceYears:     q.experience_years as number,
        safetyBoaterRequired: q.safe_boater_required as boolean,
        safetyBoaterCardUrl: q.safe_boater_card_url as string | null,
        attestedAt:          q.attested_at as string,
        reviewNotes:         q.review_notes as string | null,
      })
    }
  }

  const tripDate = new Date(trip.tripDate + 'T00:00:00')
  const formattedDate = tripDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  const shareMessage = [
    `Hi! Everything for our ${formattedDate} charter is here:`,
    ``,
    `${appUrl}/trip/${trip.slug}`,
    ``,
    `Your check-in code is: ${trip.tripCode}`,
    ``,
    `Sign your waiver and check the weather before you arrive.`,
  ].join('\n')

  const tripLink = `${appUrl}/trip/${trip.slug}`

  return (
    <div className="td-page">
      {/* ── Header ─────────────────────────────────────── */}
      <TripDetailHeader trip={trip} />

      {/* ── Weather alert ──────────────────────────────── */}
      {weather && (
        <div style={{ marginTop: 'var(--s-4)' }}>
          <WeatherAlertCard
            tripId={trip.id}
            weather={weather}
            guestCount={trip.guests.length}
          />
        </div>
      )}

      {/* ── Guests ─────────────────────────────────────── */}
      <GuestManagementTable
        tripId={trip.id}
        initialGuests={trip.guests}
        maxGuests={trip.maxGuests}
        requiresApproval={trip.requiresApproval}
        requiresQualification={tripRequiresQualification}
        qualificationMap={Object.fromEntries(qualificationMap.entries())}
      />

      {/* ── Crew assignment ────────────────────────────── */}
      <TripCrewPanel
        tripId={trip.id}
        tripStatus={trip.status}
        initialAssignments={assignments}
      />

      {/* ── Trip control (start/end + compliance) ──────────── */}
      <TripStatusBar
        tripId={trip.id}
        tripSlug={trip.slug}
        initialStatus={trip.status}
        initialStartedAt={trip.startedAt}
        initialGuests={trip.guests}
        requiredSafetyCards={trip.boat.safetyCards?.length ?? 0}
      />

      {/* ── Communications (guest msg + captain notes) ───── */}
      <TripCommunicationsPanel
        tripId={trip.id}
        shareMessage={shareMessage}
        tripLink={tripLink}
        specialNotes={trip.specialNotes ?? null}
      />

      {/* ── Add-ons ───────────────────────────────── */}
      {addonSummary.length > 0 && (
        <AddonOrdersSummary
          summary={addonSummary}
          className="mt-4"
        />
      )}

      {/* ── Reviews (completed only) ────────────────── */}
      {trip.status === 'completed' && (
        <TripReviewsSummary
          tripId={trip.id}
          operatorId={operator.id}
        />
      )}

      {/* ── Rental Days (multi-day only · Phase 4E) ────── */}
      {isMultiDay && (
        <div style={{ marginTop: 'var(--s-6)' }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--color-ink-secondary)', fontWeight: 600, marginBottom: 12 }}>
            Rental Days — {rawDurationDays}-day
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rentalDays.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-ink-secondary)' }}>No day records yet — guest has not started check-in.</p>
            ) : rentalDays.map(day => {
              const statusColors: Record<string, string> = {
                complete: 'var(--color-green)',
                issue:    'var(--color-amber)',
                active:   'var(--color-rust)',
                pending:  'var(--color-ink-faint)',
              }
              const statusColor = statusColors[day.status] ?? statusColors.pending
              const dayDate = (() => {
                try { return new Date(day.day_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) } catch { return day.day_date }
              })()
              const photos = [...(day.photos_in ?? []), ...(day.photos_out ?? [])]

              return (
                <div key={day.id} style={{ border: '1px solid var(--color-border)', padding: '12px 14px', background: 'var(--color-surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: photos.length > 0 || day.issues_reported ? 8 : 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--color-ink)', margin: 0, letterSpacing: '.06em' }}>
                      Day {day.day_number} <span style={{ fontWeight: 400, color: 'var(--color-ink-secondary)' }}>· {dayDate}</span>
                    </p>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: statusColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginLeft: 'auto' }}>
                      {day.status}
                    </span>
                  </div>

                  {day.issues_reported && (
                    <p style={{ fontSize: 12, color: 'var(--color-amber)', fontWeight: 600, marginBottom: 8, paddingLeft: 18 }}>
                      Issue: {day.issues_reported}
                    </p>
                  )}

                  {photos.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 18 }}>
                      {photos.map((p, idx) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={idx} src={p.url} alt={`Day ${day.day_number} photo ${idx + 1}`}
                          style={{ width: 52, height: 52, objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Return condition */}
          {returnRecord && (
            <div style={{ marginTop: 12, border: '1px solid var(--color-border)', padding: '12px 14px', background: returnRecord.hasIssues ? 'rgba(245,158,11,.06)' : 'var(--color-surface)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 4px', letterSpacing: '.06em', textTransform: 'uppercase' }}>Return inspection</p>
              <p style={{ fontSize: 13, color: 'var(--color-ink-secondary)', margin: 0 }}>
                {returnRecord.fuelLevel && <span>Fuel: {returnRecord.fuelLevel} · </span>}
                {returnRecord.hasIssues
                  ? <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>Issues reported</span>
                  : <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>All clear</span>}
              </p>
              {returnRecord.notes && (
                <p style={{ fontSize: 12, color: 'var(--color-ink-secondary)', marginTop: 4 }}>{returnRecord.notes}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Share + Documents ────────────────────────── */}
      <TripActionBar
        tripId={trip.id}
        tripSlug={trip.slug}
        status={trip.status}
        allWaiversSigned={allWaiversSigned}
      />
    </div>
  )
}
