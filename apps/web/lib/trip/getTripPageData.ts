import 'server-only'

import { createServiceClient } from '@/lib/supabase/service'
import { getRedis } from '@/lib/redis/upstash'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RouteStop {
  name: string
  lat?: number
  lng?: number
  duration?: string
}

export interface SafetyPoint {
  id: string
  text: string
  icon?: string
}

export interface CustomRuleSection {
  id: string
  title: string
  items: string[]
  type: 'bullet' | 'numbered' | 'check'
}

export interface TripPageData {
  // Trip core
  id: string
  slug: string
  tripCode: string
  tripDate: string
  departureTime: string
  durationHours: number
  maxGuests: number
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  charterType: 'captained' | 'bareboat' | 'both'
  tripPurpose: string
  specialNotes: string | null
  requiresApproval: boolean
  routeDescription: string | null
  routeStops: RouteStop[]
  startedAt: string | null
  endedAt: string | null
  // Self-drive qualification settings
  requiresQualification: boolean
  requiresBoaterCard: boolean
  minExperienceYears: number
  requiresBoatOwnership: boolean
  qualificationNotes: string | null

  // Boat profile
  boat: {
    id: string
    boatName: string
    boatType: string
    boatTypeKey: string
    marinaName: string
    marinaAddress: string
    slipNumber: string | null
    parkingInstructions: string | null
    operatingArea: string | null
    lat: number | null
    lng: number | null
    captainName: string | null
    captainPhotoUrl: string | null
    captainBio: string | null
    captainLicense: string | null
    captainLicenseType: string | null
    captainLanguages: string[]
    captainYearsExp: number | null
    captainTripCount: number | null
    captainRating: number | null
    captainCertifications: string[]
    whatToBring: string | null
    whatNotToBring: string | null
    houseRules: string | null
    prohibitedItems: string | null
    customDos: string[]
    customDonts: string[]
    customRuleSections: CustomRuleSection[]
    safetyPoints: SafetyPoint[]
    safetyCards: GuestSafetyCardData[]
    waiverText: string
    cancellationPolicy: string | null
    selectedEquipment: string[]
    selectedAmenities: Record<string, boolean>
    specificFieldValues: Record<string, unknown>
    onboardInfo: Record<string, unknown>
  }

  // Photos
  photos: {
    id: string
    publicUrl: string
    displayOrder: number
    isCover: boolean
  }[]

  // Add-ons available
  addons: {
    id: string
    name: string
    description: string | null
    emoji: string
    priceCents: number
    maxQuantity: number
    // Resort fields (Phase 4D)
    category:      string
    cutoffHours:   number
    prepTimeHours: number
    isSeasonal:    boolean
    seasonalFrom:  string | null
    seasonalUntil: string | null
  }[]

  // Live counts (not cached — always fresh)
  guestCount: number
  isFull: boolean

  // Operator display
  operator: {
    id: string
    companyName: string | null
  }

  // Resort / add-on config (Phase 4D — NOT cached in Redis, operator config is volatile)
  addonPaymentMode:  'stripe' | 'external' | 'free'
  hasPropertyCodes:  boolean
  tripDepartureIso:  string   // trip_date + 'T' + departure_time for client-side cutoff math
}

export type GetTripResult =
  | { found: true; data: TripPageData }
  | { found: false; reason: 'not_found' | 'cancelled' }

// ─── Main fetcher ─────────────────────────────────────────────────────────────

export async function getTripPageData(slug: string): Promise<GetTripResult> {
  const redis = getRedis()
  const cacheKey = `cache:trip:${slug}`

  // ── Check Redis cache ──────────────────────────────────────────────────────
  try {
    const cached = await redis.get<TripPageData>(cacheKey)
    if (cached) {
      const liveCount = await getLiveGuestCount(cached.id)
      return {
        found: true,
        data: {
          ...cached,
          guestCount: liveCount,
          isFull: liveCount >= cached.maxGuests,
        },
      }
    }
  } catch {
    // Redis unavailable — proceed to DB
  }

  const supabase = createServiceClient()

  // ── Database query ─────────────────────────────────────────────────────────
  const { data: trip, error } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_code, trip_date, departure_time,
      duration_hours, max_guests, status, charter_type, trip_purpose,
      special_notes, requires_approval, route_description,
      route_stops, started_at, ended_at,
      trip_type, requires_qualification,
      operators ( id, company_name ),
      boats (
        id, boat_name, boat_type,
        marina_name, marina_address, slip_number,
        parking_instructions, lat, lng,
        captain_name, captain_photo_url, captain_bio,
        captain_license, captain_languages,
        captain_years_exp, captain_trip_count, captain_rating,
        what_to_bring, house_rules, prohibited_items,
        safety_briefing, safety_cards, waiver_text, cancellation_policy,
        onboard_info, photo_urls,
        requires_qualification, requires_boater_card,
        min_experience_years, requires_boat_ownership, qualification_notes,
        addons (
          id, name, description, emoji,
          price_cents, max_quantity, is_active, sort_order,
          category, cutoff_hours, prep_time_hours,
          is_seasonal, seasonal_from, seasonal_until
        )
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !trip) {
    if (error) console.error('[getTripPageData] Supabase Error:', error?.message, error?.details, error?.code, JSON.stringify(error))
    return { found: false, reason: 'not_found' }
  }

  if (trip.status === 'cancelled') {
    return { found: false, reason: 'cancelled' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boat = trip.boats as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const operator = trip.operators as any

  // ── Parallel: operator payment config + property codes existence ──────────────
  // NOT cached — these are operator config, can change at any time
  const [{ data: opConfig }, { count: propCodeCount }] = await Promise.all([
    supabase
      .from('operators')
      .select('addon_payment_mode')
      .eq('id', operator?.id ?? '')
      .single(),
    supabase
      .from('property_codes')
      .select('id', { count: 'exact', head: true })
      .eq('operator_id', operator?.id ?? '')
      .eq('is_active', true),
  ])

  const addonPaymentMode = ((opConfig as Record<string, unknown> | null)?.addon_payment_mode as string | null) ?? 'external'
  const hasPropertyCodes  = (propCodeCount ?? 0) > 0
  const tripDepartureIso  = `${trip.trip_date}T${trip.departure_time ?? '09:00:00'}`

  // ── Shape data ─────────────────────────────────────────────────────────────
  const data: TripPageData = {
    id: trip.id,
    slug: trip.slug,
    tripCode: trip.trip_code,
    tripDate: trip.trip_date,
    departureTime: trip.departure_time,
    durationHours: trip.duration_hours,
    maxGuests: trip.max_guests,
    status: trip.status as TripPageData['status'],
    charterType: trip.charter_type as TripPageData['charterType'],
    tripPurpose: (trip as Record<string, unknown>).trip_purpose as string ?? 'commercial',
    specialNotes: trip.special_notes,
    requiresApproval: trip.requires_approval,
    routeDescription: trip.route_description ?? null,
    routeStops: (trip.route_stops as RouteStop[]) ?? [],
    startedAt: trip.started_at ?? null,
    endedAt: trip.ended_at ?? null,
    // Self-drive qualification — trip-level OR boat-level (trip overrides)
    requiresQualification:
      (trip as Record<string, unknown>).requires_qualification === true ||
      boat.requires_qualification === true,
    requiresBoaterCard:    boat.requires_boater_card    ?? false,
    minExperienceYears:    boat.min_experience_years    ?? 0,
    requiresBoatOwnership: boat.requires_boat_ownership ?? false,
    qualificationNotes:    boat.qualification_notes     ?? null,
    boat: {
      id: boat.id,
      boatName: boat.boat_name,
      boatType: boat.boat_type,
      boatTypeKey: boat.boat_type_key ?? boat.boat_type,
      marinaName: boat.marina_name,
      marinaAddress: boat.marina_address ?? '',
      slipNumber: boat.slip_number ?? null,
      parkingInstructions: boat.parking_instructions ?? null,
      operatingArea: null,
      lat: boat.lat ? Number(boat.lat) : null,
      lng: boat.lng ? Number(boat.lng) : null,
      captainName: boat.captain_name ?? null,
      captainPhotoUrl: boat.captain_photo_url ?? null,
      captainBio: boat.captain_bio ?? null,
      captainLicense: boat.captain_license ?? null,
      captainLicenseType: null,
      captainLanguages: (boat.captain_languages as string[]) ?? ['en'],
      captainYearsExp: boat.captain_years_exp ?? null,
      captainTripCount: boat.captain_trip_count ?? null,
      captainRating: boat.captain_rating ? Number(boat.captain_rating) : null,
      captainCertifications: [],
      whatToBring: boat.what_to_bring ?? null,
      whatNotToBring: null,
      houseRules: boat.house_rules ?? null,
      prohibitedItems: boat.prohibited_items ?? null,
      customDos: [],
      customDonts: [],
      customRuleSections: [],
      safetyPoints: [],  // Legacy — replaced by safetyCards (populated below)
      safetyCards: [],    // Populated after DB query via getGuestSafetyCards()
      waiverText: boat.waiver_text ?? '',
      cancellationPolicy: boat.cancellation_policy ?? null,
      selectedEquipment: [],
      selectedAmenities: {},
      specificFieldValues: {},
      onboardInfo: (boat.onboard_info as Record<string, unknown>) ?? {},
    },
    photos: ((boat.photo_urls as string[]) ?? [])
      .map((url, i) => ({
        id: `photo-${i}`,
        publicUrl: url,
        displayOrder: i,
        isCover: i === 0,
      })),
    addons: ((boat.addons as Record<string, unknown>[]) ?? [])
      // is_active is the new column name; fall back to is_available for older rows
      .filter((a) => a['is_active'] === true || a['is_available'] === true)
      .sort((a, b) => (Number(a['sort_order']) || 0) - (Number(b['sort_order']) || 0))
      .map((a) => ({
        id:           a['id']          as string,
        name:         a['name']        as string,
        description:  (a['description'] as string | null) ?? null,
        emoji:        (a['emoji'] as string | null) ?? '',
        priceCents:   Number(a['price_cents'])   || 0,
        maxQuantity:  Number(a['max_quantity'])   || 4,
        // Resort fields
        category:     (a['category']      as string | null) ?? 'general',
        cutoffHours:  Number(a['cutoff_hours'])   || 0,
        prepTimeHours: Number(a['prep_time_hours']) || 0,
        isSeasonal:   (a['is_seasonal'] as boolean | null) ?? false,
        seasonalFrom: (a['seasonal_from'] as string | null) ?? null,
        seasonalUntil:(a['seasonal_until'] as string | null) ?? null,
      })),
    operator: {
      id: operator?.id ?? '',
      companyName: operator?.company_name ?? null,
    },
    // Resort config — NOT part of Redis cache key, appended fresh below
    addonPaymentMode: 'external' as const, // placeholder, overwritten after cache
    hasPropertyCodes: false,               // placeholder, overwritten after cache
    tripDepartureIso,
    guestCount: 0, // overwritten below
    isFull: false,
  }

  // ── Populate safety cards (merges captain photos + dictionary text) ────────
  try {
    const safetyCards = await getGuestSafetyCards(boat.id, 'en')
    data.boat.safetyCards = safetyCards
  } catch (e) {
    console.error('[getTripPageData] Failed to load safety cards:', e)
    // Non-fatal — data.boat.safetyCards stays as empty array
  }

  // ── Cache to Redis (exclude live counts) ──────────────────────────────────
  try {
    await redis.set(cacheKey, data, { ex: 300 })
  } catch {
    // Non-fatal
  }

  // ── Get live guest count ─────────────────────────────────────────────
  const liveCount = await getLiveGuestCount(trip.id)

  return {
    found: true,
    data: {
      ...data,
      guestCount:       liveCount,
      isFull:           liveCount >= trip.max_guests,
      // Merge fresh operator config (bypasses Redis cache)
      addonPaymentMode: addonPaymentMode as 'stripe' | 'external' | 'free',
      hasPropertyCodes,
    },
  }
}

// ── Live guest count (bypasses cache) ─────────────────────────────────────────
async function getLiveGuestCount(tripId: string): Promise<number> {
  const supabase = createServiceClient()
  const { count } = await supabase
    .from('guests')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .is('deleted_at', null)
  return count ?? 0
}

// ── Guest Safety Cards (joins boat photos + global dictionary) ─────────────────

export interface GuestSafetyCardData {
  topic_key: string
  image_url: string | null
  captainInstructions: string
  title: string
  instructions: string
  audio_url: string | null
  emoji: string
  sort_order: number
  /** USCG/FWC compliance target — who sees this card */
  compliance_target: 'bareboat_only' | 'passengers_only' | 'all'
  /** Hide card if boat >= this length (e.g., ECOS < 26ft) */
  max_length_ft?: number
  /** Hide card if boat < this length */
  min_length_ft?: number
}

interface SafetyCardRow {
  id: string
  topic_key: string
  url: string | null
  custom_title?: string
  instructions: string
  sort_order: number
  compliance_target?: 'bareboat_only' | 'passengers_only' | 'all'
  max_length_ft?: number
  min_length_ft?: number
}

/**
 * Merge a boat's safety_cards JSONB with the global_safety_dictionary
 * for a specific language. Falls back to 'en' if the target language
 * row doesn't exist, and falls back to the captain's own text if
 * no dictionary row exists at all.
 */
export async function getGuestSafetyCards(
  boatId: string,
  languageCode: string
): Promise<GuestSafetyCardData[]> {
  const supabase = createServiceClient()

  // 1. Fetch the boat's safety_cards JSONB
  const { data: boat, error: boatError } = await supabase
    .from('boats')
    .select('safety_cards')
    .eq('id', boatId)
    .single()

  if (boatError || !boat) {
    console.error('[getGuestSafetyCards] Failed to fetch boat:', boatError)
    return []
  }

  const safetyCards = (boat.safety_cards as SafetyCardRow[]) ?? []
  if (safetyCards.length === 0) return []

  // 2. Collect all topic_keys from the boat's cards
  const topicKeys = safetyCards.map((c) => c.topic_key)

  // 3. Fetch dictionary rows for the guest's language + English fallback
  const langCodes = languageCode === 'en' ? ['en'] : [languageCode, 'en']

  const { data: dictRows, error: dictError } = await supabase
    .from('global_safety_dictionary')
    .select('topic_key, language_code, title, instructions, audio_url, emoji')
    .in('topic_key', topicKeys)
    .in('language_code', langCodes)

  if (dictError) {
    console.error('[getGuestSafetyCards] Dictionary fetch failed:', dictError)
  }

  // 4. Build lookup: topic_key -> best available translation
  const dictMap = new Map<string, {
    title: string
    instructions: string
    audio_url: string | null
    emoji: string | null
  }>()

  // First pass: fill with English rows
  for (const row of (dictRows ?? [])) {
    if (row.language_code === 'en') {
      dictMap.set(row.topic_key, {
        title: row.title,
        instructions: row.instructions,
        audio_url: row.audio_url,
        emoji: row.emoji,
      })
    }
  }

  // Second pass: overwrite with preferred language if available
  if (languageCode !== 'en') {
    for (const row of (dictRows ?? [])) {
      if (row.language_code === languageCode) {
        dictMap.set(row.topic_key, {
          title: row.title,
          instructions: row.instructions,
          audio_url: row.audio_url,
          emoji: row.emoji,
        })
      }
    }
  }

  // 5. Merge: boat photo + dictionary text/audio
  return safetyCards
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((card) => {
      const dict = dictMap.get(card.topic_key)
      return {
        topic_key: card.topic_key,
        image_url: card.url ?? null,
        captainInstructions: card.instructions || '',
        title: dict?.title ?? card.custom_title ?? card.topic_key,
        instructions: dict?.instructions ?? card.instructions ?? '',
        audio_url: dict?.audio_url ?? null,
        emoji: dict?.emoji ?? '',
        sort_order: card.sort_order,
        compliance_target: card.compliance_target ?? 'all',
        max_length_ft: card.max_length_ft,
        min_length_ft: card.min_length_ft,
      }
    })
}
