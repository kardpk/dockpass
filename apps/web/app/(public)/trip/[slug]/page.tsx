import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTripPageData } from '@/lib/trip/getTripPageData'
import { getWeatherData } from '@/lib/trip/getWeatherData'
import { detectLanguage } from '@/lib/i18n/detect'
import { t } from '@/lib/i18n/tripTranslations'
import { formatTripDate, formatTime } from '@/lib/utils/format'

// Section imports — streamlined to 5 editorial sections
import { TripHero } from '@/components/trip/TripHero'
import { WeatherWidget } from '@/components/trip/WeatherWidget'
import { FindDockSection } from '@/components/trip/FindDockSection'
import { CaptainSection } from '@/components/trip/CaptainSection'
import { SafetySection } from '@/components/trip/SafetySection'
import { WhatToBringSection } from '@/components/trip/WhatToBringSection'
import { BoatRulesSection } from '@/components/trip/BoatRulesSection'
import { StickyJoinCTA } from '@/components/trip/StickyJoinCTA'
import { ActiveTripBanner } from '@/components/trip/ActiveTripBanner'
import { TripCancelledPage } from '@/components/trip/TripCancelledPage'
import { TripPageChat } from '@/components/chat/TripPageChat'

// ── Dynamic metadata ──────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
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
      images: d.photos[0]?.publicUrl ? [{ url: d.photos[0].publicUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: d.boat.boatName,
      description: `${formatTripDate(d.tripDate)} · ${d.boat.marinaName}`,
      images: d.photos[0]?.publicUrl ? [d.photos[0].publicUrl] : [],
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { slug } = await params
  const sp = await searchParams
  const langOverride = sp['lang'] as string | undefined

  // Validate slug format
  if (!/^[A-Za-z0-9_-]{16,30}$/.test(slug)) {
    notFound()
  }

  // Language detection — ?lang= > Accept-Language header
  const lang = await detectLanguage(langOverride)
  const tr = t(lang)

  // Fetch trip data
  const result = await getTripPageData(slug)

  if (!result.found) {
    if (result.reason === 'cancelled') {
      return <TripCancelledPage />
    }
    notFound()
  }

  const trip = result.data

  // Redirect completed trips
  if (trip.status === 'completed') {
    redirect(`/trip/${slug}/completed`)
  }

  // Fetch weather server-side
  const weather =
    trip.boat.lat && trip.boat.lng
      ? await getWeatherData(trip.boat.lat, trip.boat.lng, trip.tripDate)
      : null

  const hasRules =
    !!trip.boat.houseRules ||
    trip.boat.customDos.length > 0 ||
    trip.boat.customDonts.length > 0 ||
    trip.boat.customRuleSections.length > 0

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

      {/* ── SECTION 1: Hero ───────────────────────────── */}
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

      {/* ── SECTION 2: Before You Board ───────────────── */}
      <div style={{ background: 'var(--color-paper)', paddingBottom: 'calc(var(--s-16) + 80px)' }}>

        {/* Weather */}
        {weather && (
          <WeatherWidget weather={weather} tripDate={trip.tripDate} tr={tr} />
        )}

        {/* Find your dock */}
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

        {/* What to bring */}
        {(trip.boat.whatToBring || trip.boat.whatNotToBring) && (
          <WhatToBringSection
            whatToBring={trip.boat.whatToBring}
            whatNotToBring={trip.boat.whatNotToBring}
            slug={slug}
            tr={tr}
          />
        )}

        {/* ── SECTION 3: Your Captain ─────────────────── */}
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

        {/* ── SECTION 4: Safety & Rules ───────────────── */}
        {trip.boat.safetyPoints.length > 0 && (
          <SafetySection safetyPoints={trip.boat.safetyPoints} tr={tr} />
        )}

        {hasRules && (
          <BoatRulesSection
            houseRules={trip.boat.houseRules}
            customDos={trip.boat.customDos}
            customDonts={trip.boat.customDonts}
            customRuleSections={trip.boat.customRuleSections}
            tr={tr}
          />
        )}
      </div>

      {/* ── SECTION 5: Sticky CTA ─────────────────────── */}
      <StickyJoinCTA
        tripSlug={slug}
        tripCode={trip.tripCode}
        status={trip.status}
        isFull={trip.isFull}
        guestCount={trip.guestCount}
        maxGuests={trip.maxGuests}
        requiresApproval={trip.requiresApproval}
        currentLang={lang}
        tr={tr}
        tripData={{
          boatName: trip.boat.boatName,
          marinaName: trip.boat.marinaName,
          slipNumber: trip.boat.slipNumber,
          captainName: trip.boat.captainName,
          tripDate: trip.tripDate,
          departureTime: trip.departureTime,
          durationHours: trip.durationHours,
          charterType: trip.charterType as 'captained' | 'bareboat' | 'both',
          tripPurpose: trip.tripPurpose ?? 'commercial',
          addons: trip.addons,
          isEU: false,
          // Self-drive qualification settings
          requiresQualification: trip.requiresQualification,
          requiresBoaterCard:    trip.requiresBoaterCard,
          minExperienceYears:    trip.minExperienceYears,
          requiresBoatOwnership: trip.requiresBoatOwnership,
          qualificationNotes:    trip.qualificationNotes,
        }}
      />

      {/* Live chat widget — only active trips with guest session */}
      <TripPageChat
        tripId={trip.id}
        initialStatus={trip.status}
        captainName={trip.boat.captainName}
        marinaName={trip.boat.marinaName}
        slipNumber={trip.boat.slipNumber}
      />
    </>
  )
}
