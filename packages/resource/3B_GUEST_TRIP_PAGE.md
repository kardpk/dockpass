# BoatCheckin — Phase 3B Agent Instructions
# Guest Trip Page: The Public-Facing Experience
# @3B_GUEST_TRIP_PAGE

---

## CONTEXT

Phase 3A built the trip creation flow.
This page is what the GUEST sees when
they open the link Conrad sent them.

No login. No account. Works on any phone.
First impression of BoatCheckin for every guest.
Gets the most traffic of any page in the product.

Must be fast, beautiful, multilingual,
and work offline via PWA cache.

---

## PASTE THIS INTO YOUR IDE

```
@docs/agents/00-MASTER.md
@docs/agents/02-ARCHITECTURE.md
@docs/agents/03-DATABASE.md
@docs/agents/04-SECURITY.md
@docs/agents/05-FRONTEND.md
@docs/agents/06-DESIGN.md
@docs/agents/07-BACKEND.md
@docs/agents/10-COMPLIANCE.md
@docs/agents/11-REDIS.md
@docs/agents/16-UX_SCREENS.md
@docs/agents/21-PHASE3_PLAN.md

TASK: Build Phase 3B — Guest Trip Page.
The public-facing experience guests see
when they open the shared trip link.

No auth required on any guest route.
Rate limit all public endpoints.
Use await params — Next.js 15.
Do not use 'use client' unless essential.
Server Components serve the HTML.
Client Components handle interactivity only.

Phase 3A is complete. The trips + boats tables
are populated. Build on top of them.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 — DATA LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before any UI, establish the data fetching
layer used by the trip page and all its sections.

────────────────────────────────────────────
1A. Trip page data fetcher (server-only)
────────────────────────────────────────────

Create: apps/web/lib/trip/getTripPageData.ts
import 'server-only'

This is the single query that powers the
entire guest trip page. Called once per
SSR render. Result cached in Redis 5min.

import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import { getRedis } from '@/lib/redis/upstash'

export interface TripPageData {
  // Trip core
  id: string
  slug: string
  tripCode: string
  tripDate: string          // YYYY-MM-DD
  departureTime: string     // HH:MM
  durationHours: number
  maxGuests: number
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  charterType: 'captained' | 'bareboat' | 'both'
  specialNotes: string | null
  requiresApproval: boolean
  routeDescription: string | null
  routeStops: RouteStop[]
  startedAt: string | null
  endedAt: string | null

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
  }[]

  // Live counts (not cached — always fresh)
  guestCount: number
  isFull: boolean

  // Operator display
  operator: {
    id: string
    companyName: string | null
  }
}

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

export type GetTripResult =
  | { found: true; data: TripPageData }
  | { found: false; reason: 'not_found' | 'cancelled' }

export async function getTripPageData(
  slug: string
): Promise<GetTripResult> {
  const redis = getRedis()
  const cacheKey = `cache:trip:${slug}`

  // ── Check Redis cache ──────────────────
  try {
    const cached = await redis.get<TripPageData>(cacheKey)
    if (cached) {
      // Still fetch live guest count (not cached)
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

  // ── Database query ─────────────────────
  const { data: trip, error } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_code, trip_date, departure_time,
      duration_hours, max_guests, status, charter_type,
      special_notes, requires_approval, route_description,
      route_stops, started_at, ended_at,
      operators ( id, company_name ),
      boats (
        id, boat_name, boat_type, boat_type_key,
        marina_name, marina_address, slip_number,
        parking_instructions, operating_area, lat, lng,
        captain_name, captain_photo_url, captain_bio,
        captain_license, captain_license_type,
        captain_languages, captain_years_exp,
        captain_trip_count, captain_rating,
        captain_certifications,
        what_to_bring, what_not_to_bring,
        house_rules, prohibited_items,
        custom_dos, custom_donts, custom_rule_sections,
        safety_points, waiver_text, cancellation_policy,
        selected_equipment, selected_amenities,
        specific_field_values, onboard_info,
        boat_photos (
          id, public_url, display_order, is_cover
        ),
        addons (
          id, name, description, emoji,
          price_cents, max_quantity, is_available, sort_order
        )
      )
    `)
    .eq('slug', slug)
    .order('display_order', {
      referencedTable: 'boats.boat_photos',
      ascending: true,
    })
    .order('sort_order', {
      referencedTable: 'boats.addons',
      ascending: true,
    })
    .single()

  if (error || !trip) {
    return { found: false, reason: 'not_found' }
  }

  if (trip.status === 'cancelled') {
    return { found: false, reason: 'cancelled' }
  }

  const boat = trip.boats as any
  const operator = trip.operators as any

  // ── Shape data ─────────────────────────
  const data: TripPageData = {
    id: trip.id,
    slug: trip.slug,
    tripCode: trip.trip_code,
    tripDate: trip.trip_date,
    departureTime: trip.departure_time,
    durationHours: trip.duration_hours,
    maxGuests: trip.max_guests,
    status: trip.status as any,
    charterType: trip.charter_type as any,
    specialNotes: trip.special_notes,
    requiresApproval: trip.requires_approval,
    routeDescription: trip.route_description,
    routeStops: (trip.route_stops as RouteStop[]) ?? [],
    startedAt: trip.started_at,
    endedAt: trip.ended_at,
    boat: {
      id: boat.id,
      boatName: boat.boat_name,
      boatType: boat.boat_type,
      boatTypeKey: boat.boat_type_key ?? boat.boat_type,
      marinaName: boat.marina_name,
      marinaAddress: boat.marina_address,
      slipNumber: boat.slip_number,
      parkingInstructions: boat.parking_instructions,
      operatingArea: boat.operating_area,
      lat: boat.lat ? Number(boat.lat) : null,
      lng: boat.lng ? Number(boat.lng) : null,
      captainName: boat.captain_name,
      captainPhotoUrl: boat.captain_photo_url,
      captainBio: boat.captain_bio,
      captainLicense: boat.captain_license,
      captainLicenseType: boat.captain_license_type,
      captainLanguages: boat.captain_languages ?? ['en'],
      captainYearsExp: boat.captain_years_exp,
      captainTripCount: boat.captain_trip_count,
      captainRating: boat.captain_rating
        ? Number(boat.captain_rating)
        : null,
      captainCertifications: boat.captain_certifications ?? [],
      whatToBring: boat.what_to_bring,
      whatNotToBring: boat.what_not_to_bring,
      houseRules: boat.house_rules,
      prohibitedItems: boat.prohibited_items,
      customDos: boat.custom_dos ?? [],
      customDonts: boat.custom_donts ?? [],
      customRuleSections: (boat.custom_rule_sections as CustomRuleSection[]) ?? [],
      safetyPoints: (boat.safety_points as SafetyPoint[]) ?? [],
      waiverText: boat.waiver_text,
      cancellationPolicy: boat.cancellation_policy,
      selectedEquipment: boat.selected_equipment ?? [],
      selectedAmenities: (boat.selected_amenities as Record<string, boolean>) ?? {},
      specificFieldValues: (boat.specific_field_values as Record<string, unknown>) ?? {},
      onboardInfo: (boat.onboard_info as Record<string, unknown>) ?? {},
    },
    photos: ((boat.boat_photos as any[]) ?? []).map((p: any) => ({
      id: p.id,
      publicUrl: p.public_url,
      displayOrder: p.display_order,
      isCover: p.is_cover,
    })),
    addons: ((boat.addons as any[]) ?? [])
      .filter((a: any) => a.is_available)
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        emoji: a.emoji,
        priceCents: a.price_cents,
        maxQuantity: a.max_quantity,
      })),
    operator: {
      id: operator?.id ?? '',
      companyName: operator?.company_name ?? null,
    },
    guestCount: 0,   // overwritten below
    isFull: false,
  }

  // ── Cache to Redis (exclude live counts) ─
  try {
    await redis.set(cacheKey, data, { ex: 300 })
  } catch {
    // Non-fatal
  }

  // ── Get live guest count ───────────────
  const liveCount = await getLiveGuestCount(trip.id)

  return {
    found: true,
    data: {
      ...data,
      guestCount: liveCount,
      isFull: liveCount >= trip.max_guests,
    },
  }
}

// ── Live guest count (bypasses cache) ─────
async function getLiveGuestCount(tripId: string): Promise<number> {
  const supabase = createServiceClient()
  const { count } = await supabase
    .from('guests')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .is('deleted_at', null)
  return count ?? 0
}

────────────────────────────────────────────
1B. Weather data fetcher (server-only)
────────────────────────────────────────────

Create: apps/web/lib/trip/getWeatherData.ts
import 'server-only'

import 'server-only'
import { getRedis } from '@/lib/redis/upstash'

export interface WeatherData {
  code: number           // WMO weather code
  temperature: number    // °F
  windspeed: number      // mph
  precipitation: number  // mm
  label: string          // human-readable
  severity: 'good' | 'fair' | 'poor' | 'dangerous'
  icon: string           // emoji
  color: string          // CSS colour
  bgColor: string        // light bg colour
}

// WMO weather interpretation codes
// https://open-meteo.com/en/docs#weathervariables
const WMO_LABELS: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Clear sky',         icon: '☀️' },
  1:  { label: 'Mainly clear',       icon: '🌤️' },
  2:  { label: 'Partly cloudy',      icon: '⛅' },
  3:  { label: 'Overcast',           icon: '☁️' },
  45: { label: 'Fog',                icon: '🌫️' },
  48: { label: 'Icy fog',            icon: '🌫️' },
  51: { label: 'Light drizzle',      icon: '🌦️' },
  53: { label: 'Drizzle',            icon: '🌦️' },
  55: { label: 'Heavy drizzle',      icon: '🌧️' },
  61: { label: 'Light rain',         icon: '🌧️' },
  63: { label: 'Rain',               icon: '🌧️' },
  65: { label: 'Heavy rain',         icon: '🌧️' },
  71: { label: 'Light snow',         icon: '🌨️' },
  73: { label: 'Snow',               icon: '🌨️' },
  75: { label: 'Heavy snow',         icon: '❄️' },
  80: { label: 'Light showers',      icon: '🌦️' },
  81: { label: 'Showers',            icon: '🌧️' },
  82: { label: 'Heavy showers',      icon: '⛈️' },
  85: { label: 'Snow showers',       icon: '🌨️' },
  95: { label: 'Thunderstorm',       icon: '⛈️' },
  96: { label: 'Thunderstorm + hail',icon: '⛈️' },
  99: { label: 'Severe thunderstorm',icon: '🌩️' },
}

function getWeatherSeverity(
  code: number,
  windspeed: number
): WeatherData['severity'] {
  if (code >= 95 || windspeed >= 40) return 'dangerous'
  if (code >= 80 || windspeed >= 25) return 'poor'
  if (code >= 51 || windspeed >= 15) return 'fair'
  return 'good'
}

const SEVERITY_STYLES = {
  good:      { color: '#1D9E75', bgColor: '#E8F9F4' },
  fair:      { color: '#E5910A', bgColor: '#FEF3DC' },
  poor:      { color: '#E8593C', bgColor: '#FDEAEA' },
  dangerous: { color: '#D63B3B', bgColor: '#FDEAEA' },
}

export async function getWeatherData(
  lat: number,
  lng: number,
  date: string  // YYYY-MM-DD
): Promise<WeatherData | null> {
  const redis = getRedis()
  const cacheKey = `cache:weather:${lat.toFixed(4)}:${lng.toFixed(4)}:${date}`

  // Check cache first (3-hour TTL)
  try {
    const cached = await redis.get<WeatherData>(cacheKey)
    if (cached) return cached
  } catch {}

  // Fetch from Open-Meteo (free, no API key)
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat.toString())
  url.searchParams.set('longitude', lng.toString())
  url.searchParams.set('daily', [
    'weathercode',
    'temperature_2m_max',
    'temperature_2m_min',
    'windspeed_10m_max',
    'precipitation_sum',
    'sunrise',
    'sunset',
  ].join(','))
  url.searchParams.set('start_date', date)
  url.searchParams.set('end_date', date)
  url.searchParams.set('timezone', 'America/New_York')
  url.searchParams.set('temperature_unit', 'fahrenheit')
  url.searchParams.set('windspeed_unit', 'mph')
  url.searchParams.set('precipitation_unit', 'mm')

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 10800 }, // Next.js cache 3hr
    })
    if (!res.ok) return null

    const raw = await res.json()
    const code: number = raw.daily?.weathercode?.[0] ?? 0
    const tempMax: number = Math.round(raw.daily?.temperature_2m_max?.[0] ?? 75)
    const windspeed: number = Math.round(raw.daily?.windspeed_10m_max?.[0] ?? 0)
    const precipitation: number = raw.daily?.precipitation_sum?.[0] ?? 0
    const severity = getWeatherSeverity(code, windspeed)
    const wmo = WMO_LABELS[code] ?? { label: 'Unknown', icon: '🌡️' }

    const weather: WeatherData = {
      code,
      temperature: tempMax,
      windspeed,
      precipitation,
      label: wmo.label,
      severity,
      icon: wmo.icon,
      ...SEVERITY_STYLES[severity],
    }

    // Cache for 3 hours
    try {
      await redis.set(cacheKey, weather, { ex: 10800 })
    } catch {}

    return weather
  } catch {
    return null
  }
}

────────────────────────────────────────────
1C. i18n helpers
────────────────────────────────────────────

Create: apps/web/lib/i18n/detect.ts

Detects user language from Accept-Language
header. Used server-side in trip page.

import { headers } from 'next/headers'

export const SUPPORTED_LANGUAGES = ['en','es','pt','fr','de','it'] as const
export type SupportedLang = typeof SUPPORTED_LANGUAGES[number]

export async function detectLanguage(): Promise<SupportedLang> {
  const headerStore = await headers()
  const acceptLang = headerStore.get('accept-language') ?? 'en'
  // Parse: "es-ES,es;q=0.9,en;q=0.8" → 'es'
  const primary = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase() ?? 'en'
  return SUPPORTED_LANGUAGES.includes(primary as SupportedLang)
    ? (primary as SupportedLang)
    : 'en'
}

export const LANGUAGE_FLAGS: Record<SupportedLang, string> = {
  en: '🇬🇧', es: '🇪🇸', pt: '🇵🇹',
  fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹',
}

export const LANGUAGE_NAMES: Record<SupportedLang, string> = {
  en: 'English', es: 'Español', pt: 'Português',
  fr: 'Français', de: 'Deutsch', it: 'Italiano',
}

Create: apps/web/lib/i18n/tripTranslations.ts

All text shown on the guest trip page in
all 6 supported languages.
Operator-entered content (boat name, rules etc)
is NOT translated — shown as-is.
Only BoatCheckin UI labels are translated.

export type TripT = typeof EN_TRIP

const EN_TRIP = {
  // Hero
  charterType: { captained: 'Captained', bareboat: 'Bareboat', both: 'Flexible' },

  // Sections
  weather: 'Weather forecast',
  weatherGood: 'Great day for boating',
  weatherFair: 'Fair conditions — prepare for some wind',
  weatherPoor: 'Poor conditions — check with your captain',
  weatherDangerous: 'Dangerous conditions — expect updates',
  wind: 'wind',
  feels: 'High of',

  findDock: 'Find your dock',
  openMaps: 'Open in Maps →',
  parkingNote: 'Parking info',
  slip: 'Slip',

  captain: 'Your captain',
  uscgLicensed: 'USCG Licensed',
  trips: 'trips',
  rating: 'rating',
  yearsExp: 'yrs experience',
  languages: 'Speaks',

  safety: 'Safety briefing',
  safetyExpand: 'View safety information',
  emergency: 'Emergency contacts',
  coastGuard: 'Coast Guard',
  vhf16: 'VHF Channel 16',

  whatToBring: 'What to bring',
  whatNotToBring: 'What NOT to bring',

  rules: 'Boat rules',
  dos: 'DOs',
  donts: "DON'Ts",

  route: 'Route & location',

  onboard: 'On board',
  equipment: 'Equipment',
  amenities: 'Amenities',

  cost: 'Cost breakdown',
  pricePerPerson: 'per person',
  contactOperator: 'Contact operator for pricing',

  cancellation: 'Cancellation policy',

  addons: 'Add-ons available',
  addonNote: 'Order during check-in',
  free: 'Free',

  joinCta: 'Check in for this trip →',
  joinCtaFull: 'This trip is full',
  joinCtaActive: 'Trip is active — check in now',

  activeBanner: 'Your charter is active',
  headTo: 'Head to',
  completedHeading: 'Hope you had an amazing time! 🌊',

  guestCount: (n: number, max: number) => `${n} of ${max} checked in`,
} as const

const ES_TRIP: TripT = {
  charterType: { captained: 'Con capitán', bareboat: 'Sin tripulación', both: 'Flexible' },
  weather: 'Pronóstico del tiempo',
  weatherGood: 'Día perfecto para navegar',
  weatherFair: 'Condiciones aceptables — prepárate para algo de viento',
  weatherPoor: 'Condiciones difíciles — consulta con tu capitán',
  weatherDangerous: 'Condiciones peligrosas — espera actualizaciones',
  wind: 'viento',
  feels: 'Máxima de',
  findDock: 'Encontrar el muelle',
  openMaps: 'Abrir en Mapas →',
  parkingNote: 'Información de aparcamiento',
  slip: 'Amarre',
  captain: 'Tu capitán',
  uscgLicensed: 'Licencia USCG',
  trips: 'travesías',
  rating: 'valoración',
  yearsExp: 'años experiencia',
  languages: 'Habla',
  safety: 'Instrucciones de seguridad',
  safetyExpand: 'Ver información de seguridad',
  emergency: 'Contactos de emergencia',
  coastGuard: 'Guardacostas',
  vhf16: 'Canal VHF 16',
  whatToBring: 'Qué traer',
  whatNotToBring: 'Qué NO traer',
  rules: 'Normas del barco',
  dos: 'SÍ está permitido',
  donts: 'NO está permitido',
  route: 'Ruta y ubicación',
  onboard: 'A bordo',
  equipment: 'Equipamiento',
  amenities: 'Comodidades',
  cost: 'Desglose de costes',
  pricePerPerson: 'por persona',
  contactOperator: 'Contacta al operador para precios',
  cancellation: 'Política de cancelación',
  addons: 'Extras disponibles',
  addonNote: 'Pedir durante el registro',
  free: 'Gratis',
  joinCta: 'Registrarse para este viaje →',
  joinCtaFull: 'Este viaje está completo',
  joinCtaActive: 'Viaje activo — regístrate ahora',
  activeBanner: 'Tu charter está activo',
  headTo: 'Dirígete a',
  completedHeading: '¡Esperamos que lo hayas disfrutado! 🌊',
  guestCount: (n, max) => `${n} de ${max} registrados`,
}

// French, Portuguese, German, Italian follow
// same pattern as ES_TRIP above — add all 4

const FR_TRIP: TripT = {
  charterType: { captained: 'Avec capitaine', bareboat: 'Sans équipage', both: 'Flexible' },
  weather: 'Météo du jour', weatherGood: 'Parfait pour naviguer',
  weatherFair: 'Conditions acceptables', weatherPoor: 'Conditions difficiles',
  weatherDangerous: 'Conditions dangereuses', wind: 'vent', feels: 'Maximum de',
  findDock: 'Trouver le quai', openMaps: 'Ouvrir dans Maps →',
  parkingNote: 'Informations parking', slip: 'Anneau',
  captain: 'Votre capitaine', uscgLicensed: 'Licencié USCG',
  trips: 'sorties', rating: 'note', yearsExp: 'ans expérience', languages: 'Parle',
  safety: 'Consignes de sécurité', safetyExpand: 'Voir les informations de sécurité',
  emergency: 'Contacts d\'urgence', coastGuard: 'Garde côtière', vhf16: 'Canal VHF 16',
  whatToBring: 'Quoi apporter', whatNotToBring: 'Quoi NE PAS apporter',
  rules: 'Règles du bateau', dos: 'Autorisé', donts: 'Interdit',
  route: 'Itinéraire et localisation', onboard: 'À bord',
  equipment: 'Équipement', amenities: 'Commodités',
  cost: 'Détail des coûts', pricePerPerson: 'par personne',
  contactOperator: 'Contacter l\'opérateur pour les tarifs',
  cancellation: 'Politique d\'annulation',
  addons: 'Extras disponibles', addonNote: 'Commander lors de l\'enregistrement',
  free: 'Gratuit', joinCta: 'S\'enregistrer pour ce voyage →',
  joinCtaFull: 'Ce voyage est complet', joinCtaActive: 'Voyage actif — enregistrez-vous',
  activeBanner: 'Votre charter est actif', headTo: 'Rendez-vous à',
  completedHeading: 'Nous espérons que vous avez passé un bon moment ! 🌊',
  guestCount: (n, max) => `${n} sur ${max} enregistrés`,
}

const PT_TRIP: TripT = {
  charterType: { captained: 'Com capitão', bareboat: 'Sem tripulação', both: 'Flexível' },
  weather: 'Previsão do tempo', weatherGood: 'Dia perfeito para navegar',
  weatherFair: 'Condições razoáveis', weatherPoor: 'Condições difíceis',
  weatherDangerous: 'Condições perigosas', wind: 'vento', feels: 'Máxima de',
  findDock: 'Encontrar a marina', openMaps: 'Abrir no Maps →',
  parkingNote: 'Informação de estacionamento', slip: 'Box',
  captain: 'O seu capitão', uscgLicensed: 'Licença USCG',
  trips: 'viagens', rating: 'avaliação', yearsExp: 'anos experiência', languages: 'Fala',
  safety: 'Instruções de segurança', safetyExpand: 'Ver informações de segurança',
  emergency: 'Contatos de emergência', coastGuard: 'Guarda Costeira', vhf16: 'Canal VHF 16',
  whatToBring: 'O que trazer', whatNotToBring: 'O que NÃO trazer',
  rules: 'Regras do barco', dos: 'Permitido', donts: 'Proibido',
  route: 'Rota e localização', onboard: 'A bordo',
  equipment: 'Equipamento', amenities: 'Comodidades',
  cost: 'Detalhes de custos', pricePerPerson: 'por pessoa',
  contactOperator: 'Contacte o operador para preços',
  cancellation: 'Política de cancelamento',
  addons: 'Extras disponíveis', addonNote: 'Pedir durante o check-in',
  free: 'Grátis', joinCta: 'Fazer check-in →',
  joinCtaFull: 'Esta viagem está cheia', joinCtaActive: 'Viagem ativa — faça check-in',
  activeBanner: 'O seu charter está ativo', headTo: 'Dirija-se a',
  completedHeading: 'Esperamos que tenha adorado! 🌊',
  guestCount: (n, max) => `${n} de ${max} registados`,
}

const DE_TRIP: TripT = {
  charterType: { captained: 'Mit Skipper', bareboat: 'Bareboat', both: 'Flexibel' },
  weather: 'Wettervorhersage', weatherGood: 'Perfektes Segtelwetter',
  weatherFair: 'Akzeptable Bedingungen', weatherPoor: 'Schwierige Bedingungen',
  weatherDangerous: 'Gefährliche Bedingungen', wind: 'Wind', feels: 'Höchsttemperatur',
  findDock: 'Liegeplatz finden', openMaps: 'In Maps öffnen →',
  parkingNote: 'Parkinformationen', slip: 'Box',
  captain: 'Ihr Skipper', uscgLicensed: 'USCG-Lizenz',
  trips: 'Touren', rating: 'Bewertung', yearsExp: 'Jahre Erfahrung', languages: 'Spricht',
  safety: 'Sicherheitshinweise', safetyExpand: 'Sicherheitsinfos anzeigen',
  emergency: 'Notfallkontakte', coastGuard: 'Küstenwache', vhf16: 'VHF-Kanal 16',
  whatToBring: 'Was mitbringen', whatNotToBring: 'Was NICHT mitbringen',
  rules: 'Bordregeln', dos: 'Erlaubt', donts: 'Verboten',
  route: 'Route & Standort', onboard: 'An Bord',
  equipment: 'Ausrüstung', amenities: 'Annehmlichkeiten',
  cost: 'Kostenaufschlüsselung', pricePerPerson: 'pro Person',
  contactOperator: 'Betreiber für Preise kontaktieren',
  cancellation: 'Stornierungsrichtlinie',
  addons: 'Verfügbare Extras', addonNote: 'Beim Check-in bestellen',
  free: 'Kostenlos', joinCta: 'Für diese Tour einchecken →',
  joinCtaFull: 'Diese Tour ist ausgebucht', joinCtaActive: 'Tour aktiv — jetzt einchecken',
  activeBanner: 'Ihr Charter ist aktiv', headTo: 'Begeben Sie sich zu',
  completedHeading: 'Wir hoffen, es war wunderschön! 🌊',
  guestCount: (n, max) => `${n} von ${max} eingecheckt`,
}

const IT_TRIP: TripT = {
  charterType: { captained: 'Con capitano', bareboat: 'Senza equipaggio', both: 'Flessibile' },
  weather: 'Previsioni meteo', weatherGood: 'Giornata perfetta per navigare',
  weatherFair: 'Condizioni accettabili', weatherPoor: 'Condizioni difficili',
  weatherDangerous: 'Condizioni pericolose', wind: 'vento', feels: 'Massima di',
  findDock: 'Trova il porto', openMaps: 'Apri in Maps →',
  parkingNote: 'Informazioni parcheggio', slip: 'Posto barca',
  captain: 'Il tuo capitano', uscgLicensed: 'Licenza USCG',
  trips: 'traversate', rating: 'valutazione', yearsExp: 'anni esperienza', languages: 'Parla',
  safety: 'Norme di sicurezza', safetyExpand: 'Visualizza informazioni di sicurezza',
  emergency: 'Contatti di emergenza', coastGuard: 'Guardia Costiera', vhf16: 'Canale VHF 16',
  whatToBring: 'Cosa portare', whatNotToBring: 'Cosa NON portare',
  rules: 'Regole di bordo', dos: 'Consentito', donts: 'Vietato',
  route: 'Rotta e posizione', onboard: 'A bordo',
  equipment: 'Attrezzatura', amenities: 'Comfort',
  cost: 'Dettaglio costi', pricePerPerson: 'a persona',
  contactOperator: 'Contatta l\'operatore per i prezzi',
  cancellation: 'Politica di cancellazione',
  addons: 'Extra disponibili', addonNote: 'Ordinare durante il check-in',
  free: 'Gratuito', joinCta: 'Registrati per questo viaggio →',
  joinCtaFull: 'Questo viaggio è al completo', joinCtaActive: 'Viaggio attivo — registrati ora',
  activeBanner: 'Il tuo charter è attivo', headTo: 'Dirigiti a',
  completedHeading: 'Speriamo tu abbia trascorso un momento fantastico! 🌊',
  guestCount: (n, max) => `${n} di ${max} registrati`,
}

export const TRIP_TRANSLATIONS: Record<SupportedLang, TripT> = {
  en: EN_TRIP, es: ES_TRIP, fr: FR_TRIP,
  pt: PT_TRIP, de: DE_TRIP, it: IT_TRIP,
}

export function t(lang: SupportedLang): TripT {
  return TRIP_TRANSLATIONS[lang] ?? EN_TRIP
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 — PUBLIC API ROUTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
2A. GET /api/trips/[slug] — Public trip data
────────────────────────────────────────────

Create: apps/web/app/api/trips/[slug]/route.ts

Used by client components that need to
refresh trip data without full page reload.
Rate limited. No auth required.

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { getTripPageData } from '@/lib/trip/getTripPageData'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Rate limit: 60 requests per minute per IP
  const limited = await rateLimit(req, {
    max: 60, window: 60,
    key: `trip:public:${slug}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  // Validate slug format (prevents path traversal)
  if (!/^[A-Za-z0-9_-]{16,30}$/.test(slug)) {
    return NextResponse.json(
      { error: 'Invalid trip' },
      { status: 400 }
    )
  }

  const result = await getTripPageData(slug)

  if (!result.found) {
    return NextResponse.json(
      { error: result.reason === 'cancelled'
          ? 'This trip has been cancelled'
          : 'Trip not found' },
      { status: 404 }
    )
  }

  // Only return fields safe for public consumption
  // Never expose operator.id or waiver_text in list
  return NextResponse.json({
    data: {
      id: result.data.id,
      status: result.data.status,
      guestCount: result.data.guestCount,
      isFull: result.data.isFull,
      maxGuests: result.data.maxGuests,
      startedAt: result.data.startedAt,
    }
  })
}

────────────────────────────────────────────
2B. GET /api/weather/[lat]/[lng]/[date]
    (update existing route from BACKEND.md)
────────────────────────────────────────────

Update: apps/web/app/api/weather/
  [lat]/[lng]/[date]/route.ts

Replace the basic implementation with
the full version using getWeatherData():

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { getWeatherData } from '@/lib/trip/getWeatherData'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{
    lat: string; lng: string; date: string
  }> }
) {
  const { lat, lng, date } = await params

  // Rate limit: 120/min (weather is heavily used)
  const limited = await rateLimit(req, {
    max: 120, window: 60,
    key: `weather:${lat}:${lng}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // Validate params
  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)
  if (
    isNaN(latNum) || latNum < -90 || latNum > 90 ||
    isNaN(lngNum) || lngNum < -180 || lngNum > 180 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    )
  }

  const weather = await getWeatherData(latNum, lngNum, date)

  if (!weather) {
    return NextResponse.json(
      { error: 'Weather unavailable' },
      { status: 503 }
    )
  }

  // Cache response at HTTP level too
  return NextResponse.json(
    { data: weather },
    {
      headers: {
        'Cache-Control': 'public, max-age=10800, s-maxage=10800',
      }
    }
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 3 — TRIP PAGE ROUTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
3A. /trip/[slug] page
────────────────────────────────────────────

Create: apps/web/app/(public)/trip/[slug]/page.tsx

Server Component. No auth. Handles all trip
states. Renders all 13 sections.

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTripPageData } from '@/lib/trip/getTripPageData'
import { getWeatherData } from '@/lib/trip/getWeatherData'
import { detectLanguage } from '@/lib/i18n/detect'
import { t } from '@/lib/i18n/tripTranslations'
import { formatTripDate, formatTime, formatDuration } from '@/lib/utils/format'

// ── Section imports ───────────────────────
import { TripHero } from '@/components/trip/TripHero'
import { WeatherWidget } from '@/components/trip/WeatherWidget'
import { FindDockSection } from '@/components/trip/FindDockSection'
import { CaptainSection } from '@/components/trip/CaptainSection'
import { SafetySection } from '@/components/trip/SafetySection'
import { WhatToBringSection } from '@/components/trip/WhatToBringSection'
import { BoatRulesSection } from '@/components/trip/BoatRulesSection'
import { RouteSection } from '@/components/trip/RouteSection'
import { OnboardSection } from '@/components/trip/OnboardSection'
import { AddonsPreviewSection } from '@/components/trip/AddonsPreviewSection'
import { CancellationSection } from '@/components/trip/CancellationSection'
import { StickyJoinCTA } from '@/components/trip/StickyJoinCTA'
import { ActiveTripBanner } from '@/components/trip/ActiveTripBanner'
import { TripCancelledPage } from '@/components/trip/TripCancelledPage'

// ── Dynamic metadata ─────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const result = await getTripPageData(slug)
  if (!result.found) return { title: 'Trip not found — BoatCheckin' }
  const d = result.data
  return {
    title: `${d.boat.boatName} — ${formatTripDate(d.tripDate)} | BoatCheckin`,
    description: `Join ${d.boat.captainName ?? 'your captain'} aboard ${d.boat.boatName} on ${formatTripDate(d.tripDate)} from ${d.boat.marinaName}.`,
    openGraph: {
      title: `${d.boat.boatName} | BoatCheckin`,
      description: `Charter on ${formatTripDate(d.tripDate)} at ${formatTime(d.departureTime)} · ${d.boat.marinaName}`,
      images: d.photos[0]?.publicUrl
        ? [{ url: d.photos[0].publicUrl }]
        : [],
    },
  }
}

export default async function TripPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const lang = await detectLanguage()
  const tr = t(lang)

  // Validate slug format
  if (!/^[A-Za-z0-9_-]{16,30}$/.test(slug)) {
    notFound()
  }

  // Fetch trip data
  const result = await getTripPageData(slug)

  if (!result.found) {
    if (result.reason === 'cancelled') {
      return <TripCancelledPage />
    }
    notFound()
  }

  const trip = result.data

  // Redirect completed trips to post-trip page
  if (trip.status === 'completed') {
    redirect(`/trip/${slug}/completed`)
  }

  // Fetch weather server-side (has location)
  const weather = trip.boat.lat && trip.boat.lng
    ? await getWeatherData(trip.boat.lat, trip.boat.lng, trip.tripDate)
    : null

  return (
    <>
      {/* Active trip banner — above everything */}
      {trip.status === 'active' && (
        <ActiveTripBanner
          boatName={trip.boat.boatName}
          marinaName={trip.boat.marinaName}
          slipNumber={trip.boat.slipNumber}
          startedAt={trip.startedAt}
          tr={tr}
        />
      )}

      {/* SECTION 1 — Hero */}
      <TripHero
        boatName={trip.boat.boatName}
        tripDate={trip.tripDate}
        departureTime={trip.departureTime}
        durationHours={trip.durationHours}
        marinaName={trip.boat.marinaName}
        charterType={trip.charterType}
        currentLang={lang}
        tr={tr}
      />

      {/* Page content sections */}
      <div className="bg-[#F5F8FC] pb-32">

        {/* SECTION 2 — Weather */}
        {weather && (
          <WeatherWidget
            weather={weather}
            tripDate={trip.tripDate}
            tr={tr}
          />
        )}

        {/* SECTION 3 — Find Dock */}
        <FindDockSection
          marinaName={trip.boat.marinaName}
          marinaAddress={trip.boat.marinaAddress}
          slipNumber={trip.boat.slipNumber}
          parkingInstructions={trip.boat.parkingInstructions}
          operatingArea={trip.boat.operatingArea}
          lat={trip.boat.lat}
          lng={trip.boat.lng}
          tr={tr}
        />

        {/* SECTION 4 — Captain */}
        {trip.boat.captainName && (
          <CaptainSection
            captainName={trip.boat.captainName}
            captainPhotoUrl={trip.boat.captainPhotoUrl}
            captainBio={trip.boat.captainBio}
            captainLicense={trip.boat.captainLicense}
            captainLanguages={trip.boat.captainLanguages}
            captainYearsExp={trip.boat.captainYearsExp}
            captainTripCount={trip.boat.captainTripCount}
            captainRating={trip.boat.captainRating}
            captainCertifications={trip.boat.captainCertifications}
            tr={tr}
          />
        )}

        {/* SECTION 5 — Safety */}
        {trip.boat.safetyPoints.length > 0 && (
          <SafetySection
            safetyPoints={trip.boat.safetyPoints}
            tr={tr}
          />
        )}

        {/* SECTION 6 — What to Bring */}
        {(trip.boat.whatToBring || trip.boat.whatNotToBring) && (
          <WhatToBringSection
            whatToBring={trip.boat.whatToBring}
            whatNotToBring={trip.boat.whatNotToBring}
            tr={tr}
          />
        )}

        {/* SECTION 7 — Boat Rules */}
        {(trip.boat.houseRules ||
          trip.boat.customDos.length > 0 ||
          trip.boat.customDonts.length > 0 ||
          trip.boat.customRuleSections.length > 0) && (
          <BoatRulesSection
            houseRules={trip.boat.houseRules}
            customDos={trip.boat.customDos}
            customDonts={trip.boat.customDonts}
            customRuleSections={trip.boat.customRuleSections}
            tr={tr}
          />
        )}

        {/* SECTION 8 — Route */}
        {(trip.boat.lat && trip.boat.lng) && (
          <RouteSection
            lat={trip.boat.lat}
            lng={trip.boat.lng}
            marinaName={trip.boat.marinaName}
            slipNumber={trip.boat.slipNumber}
            routeDescription={trip.routeDescription}
            routeStops={trip.routeStops}
            tr={tr}
          />
        )}

        {/* SECTION 9 — On Board Info */}
        {(trip.boat.selectedEquipment.length > 0 ||
          Object.keys(trip.boat.selectedAmenities).length > 0 ||
          Object.keys(trip.boat.onboardInfo).length > 0 ||
          Object.keys(trip.boat.specificFieldValues).length > 0) && (
          <OnboardSection
            selectedEquipment={trip.boat.selectedEquipment}
            selectedAmenities={trip.boat.selectedAmenities}
            specificFieldValues={trip.boat.specificFieldValues}
            onboardInfo={trip.boat.onboardInfo}
            boatTypeKey={trip.boat.boatTypeKey}
            tr={tr}
          />
        )}

        {/* SECTION 10 — Cancellation Policy */}
        {trip.boat.cancellationPolicy && (
          <CancellationSection
            policy={trip.boat.cancellationPolicy}
            tripDate={trip.tripDate}
            tr={tr}
          />
        )}

        {/* SECTION 11 — Add-ons Preview */}
        {trip.addons.length > 0 && (
          <AddonsPreviewSection
            addons={trip.addons}
            tr={tr}
          />
        )}
      </div>

      {/* Sticky CTA — always visible */}
      <StickyJoinCTA
        tripSlug={slug}
        tripCode={trip.tripCode}
        status={trip.status}
        isFull={trip.isFull}
        guestCount={trip.guestCount}
        maxGuests={trip.maxGuests}
        requiresApproval={trip.requiresApproval}
        tr={tr}
      />
    </>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 4 — ALL 11 SECTION COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All in: apps/web/components/trip/
Server Components unless marked 'use client'.

────────────────────────────────────────────
4A. TripHero — navy header with all meta
────────────────────────────────────────────

Create: components/trip/TripHero.tsx
(Server Component — no interactivity needed)

Props:
  boatName, tripDate, departureTime,
  durationHours, marinaName, charterType,
  currentLang, tr

Visual spec (from DESIGN.md hero section):
  Navy (#0C447C) background
  Full width, no horizontal padding on mobile

  Top row:
    "BoatCheckin ⚓" white bold left
    Language selector right (flag emoji + language)
      Clicking opens language bottom sheet
      (Client Component wrapped inside)

  Boat name:
    28px bold white, 2px letter-spacing tight

  Trip chips (flex-wrap row, gap-2):
    📅 [Day, Month Date]    — e.g. "Sat, Oct 21"
    ⏰ [Time]               — e.g. "2:00 PM"
    ⏳ [Duration]           — e.g. "4 hours"
    🚢 [Charter type label] — e.g. "Captained"
    Each chip: bg-white/20, text-white, 13px,
      rounded-full, px-3 py-1

  Marina row (below chips):
    📍 [marinaName]
    text-white/70, 13px

Padding: px-5 pt-5 pb-8

────────────────────────────────────────────
4B. WeatherWidget — colour-coded forecast
────────────────────────────────────────────

Create: components/trip/WeatherWidget.tsx
(Server Component — data fetched server-side)

Props: weather (WeatherData), tripDate, tr

Container: white card, mx-4 mt-3, rounded-2xl,
  border border-[#D0E2F3], p-5

Header row:
  Icon chip: 48px circle, severity bg colour
    Large weather emoji centred (24px)
  Right of chip:
    Label text: weather.label (15px, 600, dark)
    Temperature: "High of [X]°F" (13px, grey)

Details row (3 items, equal width):
  [🌡️ [temp]°F] [💨 [wind] mph] [🌧️ [precip]mm]
  Each: label 11px grey above, value 15px 600 dark

Condition banner (below details):
  Background = severity bg colour
  Text = severity text colour
  Message from tr based on severity
  Rounded-[10px], px-4 py-2.5, text-14px 500

GOOD:       "Great day for boating ✓" — teal bg
FAIR:       "Fair conditions — prepare for wind" — amber bg
POOR:       "Poor conditions — check with captain" — coral bg
DANGEROUS:  "Dangerous conditions — expect updates" — red bg

────────────────────────────────────────────
4C. FindDockSection — marina location
────────────────────────────────────────────

Create: components/trip/FindDockSection.tsx
(Server Component)

White card, mx-4 mt-3, rounded-2xl, p-5

Section header (from DESIGN.md Info Card):
  Navy icon chip (MapPin icon, 20px, navy)
  Title: tr.findDock (18px, 600)

Content:
  Marina name (15px, 600, dark)
  Address (14px, grey, mt-1)
  
  Slip badge (if slipNumber):
    Teal pill: "Slip [slipNumber]"
    bg-[#E8F9F4] text-[#1D9E75]
    inline-flex, mt-2

  [Open in Maps →] button:
    Ghost style with external link icon
    href: https://maps.google.com/?q=[encoded address]
    Opens in new tab
    Height 44px minimum

  Parking instructions (if exists):
    Collapsible: "🅿️ Parking info" label
    Toggle open/closed (Client Component needed)
    Text content inside

  Operating area (if exists):
    Small grey text: "Operating area: [text]"
    mt-3, 13px

────────────────────────────────────────────
4D. CaptainSection — captain profile
────────────────────────────────────────────

Create: components/trip/CaptainSection.tsx
(Server Component)

White card, mx-4 mt-3, rounded-2xl, p-5

Profile row (flex, items-start, gap-4):
  Left: circular photo 72×72
    If captainPhotoUrl: <Image> circular crop
    If no photo: initials avatar
      bg-[#E8F2FB], text-[#0C447C], 22px bold
  Right:
    Captain name: 17px, 600, dark
    
    Verification row (flex gap-2, mt-0.5):
      If captainLicense:
        "⚓ USCG Licensed" pill
        bg-[#E8F2FB] text-[#0C447C] 11px
      If captainTripCount:
        "[N] trips" grey 12px
      If captainRating:
        "★ [N]" 12px, amber text

Stats row (3 items, if data exists):
  [Years exp] [Trip count] [Rating]
  Each: value bold (17px navy), label small grey

Languages row:
  "Speaks:" grey 12px
  Flag emojis for each language (18px each)

Bio (if exists):
  14px, grey, leading-relaxed, mt-3
  Max 3 lines with "Read more →" expand

Certifications (if any):
  Small chips: "✓ CPR Certified" etc
  flex-wrap, gap-2, mt-3

────────────────────────────────────────────
4E. SafetySection — expandable briefing
────────────────────────────────────────────

Create: components/trip/SafetySection.tsx
(Server Component — client expand via CSS only)

Light blue bg section: bg-[#E8F2FB]
mx-4 mt-3, rounded-2xl, p-5

Header with shield icon:
  ShieldCheck icon (20px, navy)
  tr.safety

Safety points list (collapsed by default):
  Show first 2 points always
  
  Each point: flex items-start, gap-3, py-3,
  border-b border-[#D0E2F3] last:border-none
    Icon: small circle, navy bg, white check
    Text: 14px dark

  Collapse toggle (Client Component):
    "View all [N] briefing points ↓"
    Expands to show all
    CSS transition, smooth

Emergency contacts (always visible):
  Separator line
  "🆘 Emergency contacts"
  "🚢 Coast Guard — VHF Channel 16"
  "📞 Local marina: [phone if set]"

────────────────────────────────────────────
4F. WhatToBringSection — tickable checklist
────────────────────────────────────────────

Create: components/trip/WhatToBringSection.tsx
'use client'

Must be client component because localStorage
persists tick state per guest.

White card, mx-4 mt-3, rounded-2xl, p-5

BRING tab active by default:
  Tab switcher: [Bring ✓] [Don't Bring ✗]
  Active tab: navy bg, white text
  Inactive: grey border

Bring list:
  Each item parsed from whatToBring (one per line)
  Checklist item from DESIGN.md:
    Checkbox (22×22, accent-navy)
    Text: strikethrough when checked
  Ticks saved in localStorage:
    key: dp-checklist-[slug]
    value: Set of checked item indices

Don't Bring list (shown on tab switch):
  Same pattern but no checkboxes
  Each item: ✗ red prefix, 14px coral text

────────────────────────────────────────────
4G. BoatRulesSection — rules display
────────────────────────────────────────────

Create: components/trip/BoatRulesSection.tsx
(Server Component)

White card, mx-4 mt-3, rounded-2xl, p-5

Three sections (show if data exists):

House Rules:
  Header: "Boat rules" (from houseRules text)
  Parse newline-separated → bullet list
  Each: 14px, dark, 8px gap, "•" prefix

DOs section (if customDos.length > 0):
  "DOs" label: teal, 12px 600
  Each item: "✓ [text]" — teal ✓, dark text

DON'Ts section (if customDonts.length > 0):
  "DON'Ts" label: coral, 12px 600
  Each item: "✗ [text]" — coral ✗, dark text

Custom rule sections:
  Each section renders differently by type:
  
  bullet: unordered list with • prefix
  numbered: ordered with 1. 2. 3.
  check: checkbox-style list items
  
  Section title: 14px 600 dark, mb-2
  Separator between sections

────────────────────────────────────────────
4H. RouteSection — Mapbox map
────────────────────────────────────────────

Create: components/trip/RouteSection.tsx
(Server Component shell, Client map inside)

Create: components/trip/MarinaMap.tsx
'use client'

White card, mx-4 mt-3, rounded-2xl, overflow-hidden

MarinaMap client component:
  'use client'
  import mapboxgl from 'mapbox-gl'
  import 'mapbox-gl/dist/mapbox-gl.css'

  useEffect — initialise map:
    style: satellite-streets-v12
    centre: [lng, lat]
    zoom: 15
    interactive: true (pan + zoom)
    
    Custom navy marker at marina location
    Popup on click: marina name + slip number
    
  Height: 200px (mobile) / 240px (desktop)
  
  Return: <div ref={mapRef} className="h-[200px]" />

Below map in card:
  Marina name bold
  Address grey
  Route description if set (14px, grey italic)
  Route stops list if set:
    Small dots: "Stop 1 → Stop 2 → Stop 3"

────────────────────────────────────────────
4I. OnboardSection — amenities + equipment
────────────────────────────────────────────

Create: components/trip/OnboardSection.tsx
(Server Component)

White card, mx-4 mt-3, rounded-2xl, p-5

Equipment (if selectedEquipment has items):
  "Equipment included" label (12px 600 grey)
  Pill grid (flex-wrap, gap-2):
    Each item: small chip
    bg-[#E8F2FB] text-[#0C447C] text-12px
    px-3 py-1 rounded-full

Amenities (if selectedAmenities has true values):
  "Amenities" label
  Same pill style, filter only true values
  
Specific field values:
  Renders each field based on boatTypeKey
  Each: label (grey 12px) + value (dark 14px)
  Example (fishing): "Catch policy: Keep all catch"
  Example (dive): "Max depth: 40ft"
  Example (yacht): "Gratuity: 15% is standard"
  
  Display rules:
    Skip false/null/empty values
    Skip internal keys (id, sort, etc.)
    Format boolean true as "Yes", false as "No"

Custom onboardInfo (key-value pairs):
  Each entry: label: value
  12px grey label, 14px dark value
  "WiFi: YachtMiami2024" style

────────────────────────────────────────────
4J. CancellationSection — policy timeline
────────────────────────────────────────────

Create: components/trip/CancellationSection.tsx
(Server Component)

White card, mx-4 mt-3, rounded-2xl, p-5

Header: Calendar icon + tr.cancellation

Policy text displayed as written by operator.
Parse newline-separated → bullet list OR
display as paragraph if no newlines.

Visual timeline (if policy text contains 48/24):
  Three dot timeline:
    🟢 "48+ hours before" — Full refund
    🟡 "24–48 hours before" — 50% refund
    🔴 "Under 24 hours" — No refund
  
  Dots connected by vertical line
  Active dot based on days until trip:
    > 48hrs: green dot highlighted
    24-48hrs: yellow dot highlighted
    < 24hrs: red dot highlighted

────────────────────────────────────────────
4K. AddonsPreviewSection — browse only
────────────────────────────────────────────

Create: components/trip/AddonsPreviewSection.tsx
(Server Component)

White card, mx-4 mt-3, rounded-2xl, p-5

Header: ShoppingBag icon + tr.addons

Info banner (light navy):
  "🛒 [tr.addonNote]"
  bg-[#E8F2FB], rounded-[10px], px-4 py-2.5
  text-13px, text-[#0C447C]

Addon grid (1 column on mobile):
  Each addon card:
    flex items-center, gap-3, py-3
    border-b last:border-none
    
    Emoji: 36px in square chip
    Middle: name (15px 600) + description (13px grey)
    Right: price (15px 600 navy) + "disabled +"
    
    Disabled steppers (+ and − greyed out)
    Not interactive — just preview
    
    Free items: show "Free" teal pill instead of price

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 5 — STICKY CTA + STATE BANNERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
5A. StickyJoinCTA — the call to action
────────────────────────────────────────────

Create: components/trip/StickyJoinCTA.tsx
'use client'

Fixed bottom bar. Always visible. Launches
the join flow (built in Phase 3C).

Fixed bottom, full width, z-50
White bg, border-top 1px #D0E2F3
px-5 py-4, pb-[calc(1rem+env(safe-area-inset-bottom))]

Content varies by state:

UPCOMING + space available:
  Row: "[guestCount] of [maxGuests] checked in" (left, grey 13px)
  Full-width navy button: "[tr.joinCta]" (52px, radius 12px)
  
  If requiresApproval:
    Sub-text below button: "⏳ Subject to approval"
    12px grey centred

UPCOMING + full:
  Full-width disabled grey button: "[tr.joinCtaFull]"
  Sub-text: "All spots taken"

ACTIVE:
  Green banner above button:
    "✓ [tr.activeBanner]"
    bg-[#E8F9F4], text-[#1D9E75], 13px centred
  Button: teal bg, "Check in now →"

On button press:
  Opens join flow bottom sheet
  (Phase 3C builds this — for now: placeholder)
  Call: setJoinFlowOpen(true)

State: use useState(false) for joinFlowOpen
When 3C is merged: render <JoinFlowSheet />
For now: render placeholder modal with
  "Join flow coming in Phase 3C"

────────────────────────────────────────────
5B. ActiveTripBanner
────────────────────────────────────────────

Create: components/trip/ActiveTripBanner.tsx
(Server Component)

Shown above hero when trip.status === 'active'

Full-width teal banner:
  bg-[#1D9E75], text-white, py-3, px-5
  
  "⚓ Your charter is active"
  Sub: "[tr.headTo] Slip [slipNumber] · [marinaName]"
  13px, centred

────────────────────────────────────────────
5C. TripCancelledPage
────────────────────────────────────────────

Create: components/trip/TripCancelledPage.tsx
(Server Component)

Full page, centred, white bg:
  ⚓ anchor grey (not animated)
  "This trip has been cancelled" (18px 600)
  "If you have questions, contact the operator."
  (grey 14px)
  [← Return home] ghost link

────────────────────────────────────────────
5D. Language selector (client component)
────────────────────────────────────────────

Create: components/trip/LanguageSelector.tsx
'use client'

Triggered from TripHero language flag button.

State: showSheet (boolean)

Button in hero:
  Current lang flag emoji (24px)
  Tap → opens bottom sheet

Bottom sheet:
  Standard BoatCheckin bottom sheet pattern
  Title: "Select language"
  
  6 language options as list items:
    Flag + name + checkmark if current
    On tap: reload page with ?lang=[code]
    Page reads ?lang param for override
    Stores in localStorage: dp-lang

  Update getTripPageData pattern:
    Check localStorage dp-lang first
    Then Accept-Language header
    Allow URL ?lang=[code] override

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 6 — COMPLETED TRIP PAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/app/(public)/trip/[slug]/
  completed/page.tsx

This is a placeholder. Phase 3F builds
the full post-trip experience. For now:
show a clean "trip complete" state.

import { getTripPageData } from '@/lib/trip/getTripPageData'
import { notFound } from 'next/navigation'

export default async function TripCompletedPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const result = await getTripPageData(slug)
  if (!result.found) notFound()
  const trip = result.data
  if (trip.status !== 'completed') {
    // Redirect back to live page
    redirect(`/trip/${slug}`)
  }

  return (
    <div className="min-h-screen bg-[#0C447C] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-[60px] mb-6">⚓</div>
      <h1 className="text-[28px] font-bold text-white mb-3">
        What a trip!
      </h1>
      <p className="text-[16px] text-white/80 mb-2">
        {trip.boat.boatName}
      </p>
      <p className="text-[14px] text-white/60 mb-8">
        Post-trip review and postcard coming soon.
      </p>
      {/* Phase 3F will replace this placeholder */}
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 7 — PUBLIC LAYOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/app/(public)/layout.tsx

Wraps all guest-facing pages.
No dashboard nav. No auth redirect.
Just page structure.

import type { ReactNode } from 'react'

export default function PublicLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* No header or footer for guest pages */}
      {/* Each page is fully self-contained */}
      {children}
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 8 — PERFORMANCE + PWA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
8A. next.config.ts — add trip to PWA routes
────────────────────────────────────────────

Update: apps/web/next.config.ts

In the PWA runtimeCaching array, add:
{
  urlPattern: /^https:\/\/dockpass\.io\/trip\/.+/,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'trip-pages',
    networkTimeoutSeconds: 3,
    expiration: {
      maxEntries: 20,
      maxAgeSeconds: 24 * 60 * 60,
    },
  },
},

This means: try network first (for live data),
fall back to cache if offline.
Guest sees their trip page even with no signal.

────────────────────────────────────────────
8B. Trip page metadata + OG image
────────────────────────────────────────────

Already handled in generateMetadata above.
The OG image uses the boat's cover photo.
If no photo: no OG image (acceptable for MVP).

Add twitter card meta:
  twitter:card = 'summary_large_image'
  twitter:title = boat name
  twitter:description = date + marina

────────────────────────────────────────────
8C. No JS fallback
────────────────────────────────────────────

Trip page sections 1-4, 7-9 are Server
Components and render HTML immediately.
Sections 5 (expand/collapse safety) and 6
(checklist ticks) require JS but degrade
gracefully — show all content if JS fails.

Add to each section:
  <noscript>
    Shows expanded content by default
    (no progressive disclosure needed without JS)
  </noscript>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 9 — TEST SUITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/__tests__/unit/trip/
  getTripPageData.test.ts

import { describe, it, expect, vi } from 'vitest'
import { getWeatherData } from '@/lib/trip/getWeatherData'

// Mock Redis
vi.mock('@/lib/redis/upstash', () => ({
  getRedis: () => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(null),
  }),
}))

// Mock fetch for Open-Meteo
const mockWeatherResponse = {
  daily: {
    weathercode: [1],
    temperature_2m_max: [82],
    temperature_2m_min: [72],
    windspeed_10m_max: [8],
    precipitation_sum: [0],
    sunrise: ['2024-10-21T07:12'],
    sunset: ['2024-10-21T19:34'],
  }
}

describe('getWeatherData', () => {
  it('returns shaped weather data for valid coords', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWeatherResponse),
    })

    const result = await getWeatherData(25.7786, -80.1392, '2024-10-21')
    expect(result).not.toBeNull()
    expect(result?.temperature).toBe(82)
    expect(result?.severity).toBe('good')
    expect(result?.code).toBe(1)
    expect(result?.icon).toBe('🌤️')
  })

  it('returns dangerous severity for storm codes', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        daily: { ...mockWeatherResponse.daily, weathercode: [95] }
      }),
    })
    const result = await getWeatherData(25.7786, -80.1392, '2024-10-21')
    expect(result?.severity).toBe('dangerous')
    expect(result?.icon).toBe('⛈️')
  })

  it('returns null on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false })
    const result = await getWeatherData(25.7786, -80.1392, '2024-10-21')
    expect(result).toBeNull()
  })

  it('returns poor severity for high winds', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        daily: { ...mockWeatherResponse.daily, windspeed_10m_max: [28] }
      }),
    })
    const result = await getWeatherData(25.7786, -80.1392, '2024-10-21')
    expect(result?.severity).toBe('poor')
  })
})

Create: apps/web/__tests__/unit/trip/
  tripTranslations.test.ts

import { describe, it, expect } from 'vitest'
import { t, SUPPORTED_LANGUAGES } from '@/lib/i18n/tripTranslations'

describe('tripTranslations', () => {
  it('has all 6 languages', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(6)
  })

  SUPPORTED_LANGUAGES.forEach(lang => {
    it(`${lang} has all required keys`, () => {
      const tr = t(lang)
      expect(tr.joinCta).toBeTruthy()
      expect(tr.findDock).toBeTruthy()
      expect(tr.weather).toBeTruthy()
      expect(tr.captain).toBeTruthy()
      expect(tr.safety).toBeTruthy()
      expect(tr.rules).toBeTruthy()
      expect(tr.addons).toBeTruthy()
    })
  })

  it('guestCount function returns correct string for en', () => {
    const tr = t('en')
    expect(tr.guestCount(7, 8)).toBe('7 of 8 checked in')
  })

  it('guestCount function works for es', () => {
    const tr = t('es')
    expect(tr.guestCount(3, 10)).toBe('3 de 10 registrados')
  })
})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 10 — VERIFICATION TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All 14 tests must pass before Phase 3C begins.

TEST 1 — Unit tests:
  npm run test
  All tests in __tests__/unit/trip/ pass

TEST 2 — Trip page loads:
  Create a test trip in Phase 3A
  Visit: /trip/[slug] in browser
  ALL 13 sections must render
  No blank sections, no errors in console

TEST 3 — Hero correctness:
  Boat name visible, large, white
  Date chip shows correct day
  Time chip shows 12hr format (e.g. "2:00 PM")
  Duration chip correct
  Marina name visible at bottom

TEST 4 — Weather widget:
  Weather shows for correct trip date
  NOT today's weather — the trip date
  Condition label matches WMO code
  Severity colour is correct (teal/amber/red)

TEST 5 — Multilingual (Spanish):
  Visit: /trip/[slug]?lang=es
  OR set browser to Spanish
  Section headers show in Spanish
  Boat name/marina/rules still in original language
  CTA button in Spanish: "Registrarse para este viaje →"

TEST 6 — Find dock section:
  Marina name shows
  Full address shows
  "Open in Maps →" link is correct Google Maps URL
  Slip number badge shows if set
  Parking info section expandable

TEST 7 — Captain section:
  Photo shows (or initials if no photo)
  Name, bio visible
  USCG badge shows if license set
  Rating, trip count if set
  Languages as flag emojis

TEST 8 — What to bring checklist:
  Items from boat's whatToBring show
  Checkboxes can be ticked
  Ticked items show strikethrough
  Refresh page: ticks persist (localStorage)
  Switch to "Don't Bring" tab: shows those items

TEST 9 — Mapbox map:
  Map renders at correct marina coordinates
  Navy pin visible at correct position
  Map is zoomable and pannable
  Does not crash if lat/lng is null

TEST 10 — Add-ons preview:
  All active addons show
  Prices correct
  Steppers are DISABLED (preview only)
  "Order during check-in" note visible

TEST 11 — Trip state: active:
  Manually set trip status to 'active' in Supabase
  Refresh page
  Teal "Your charter is active" banner at top
  Sticky CTA button turns teal

TEST 12 — Trip state: cancelled:
  Manually set trip status to 'cancelled'
  Visit trip URL
  Shows "This trip has been cancelled" cleanly
  NOT a 404 — a friendly message

TEST 13 — Sticky CTA:
  CTA is always visible while scrolling
  Does not cover content (body has padding-bottom)
  On click: placeholder modal shows
    "Join flow coming in Phase 3C"

TEST 14 — Build clean:
  npm run typecheck → zero errors
  npm run build → zero errors
  Bundle check: boat-templates NOT in client bundle
  No 'any' types in new files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORT BACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When all 14 tests pass:
  1. Every file created (full paths)
  2. Every file modified (full paths + change)
  3. All 14 test results: ✅ / ❌
  4. Lighthouse score on /trip/[slug]:
     Performance, FCP, LCP, CLS
  5. Screenshot descriptions:
     - Hero section
     - Weather widget (good + poor)
     - Captain card
     - What to bring checklist
     - Sticky CTA
  6. Any deviations from spec + why
  7. Total lines added
```
