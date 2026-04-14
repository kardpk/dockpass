'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { formatTripDate, formatTime, formatDuration } from '@/lib/utils/format'
import { SnapshotAlerts } from './SnapshotAlerts'
import { SnapshotGuestList } from './SnapshotGuestList'
import { SnapshotAddonSummary } from './SnapshotAddonSummary'
import { StartTripFlow } from './StartTripFlow'
import { EndTripFlow } from './EndTripFlow'
import { CaptainChatPanel } from './CaptainChatPanel'
import { CrewManifestPanel } from './CrewManifestPanel'
import { TripNotesPanel } from './TripNotesPanel'
import { HeadCountConfirm } from './HeadCountConfirm'
import { downloadFloatPlan } from '@/lib/captain/floatPlan'
import { useTripGuests } from '@/hooks/useTripGuests'
import { getComplianceProfile, getComplianceLevel } from '@/lib/compliance/tripCompliance'
import { SafetyBriefingGate } from './SafetyBriefingGate'
import type { BriefingAttestation } from './SafetyBriefingGate'
import type { CaptainSnapshotData, TripStatus, DashboardGuest, TripPurpose } from '@/types'

// Dynamic import — html5-qrcode uses browser APIs that break SSR
const QrBoardingScanner = dynamic(
  () => import('./QrBoardingScanner').then(m => ({ default: m.QrBoardingScanner })),
  { ssr: false }
)

interface CaptainSnapshotViewProps {
  snapshot: CaptainSnapshotData
  token: string
  tripStatus: TripStatus
  startedAt: string | null
  buoyPolicyId: string | null
}

export function CaptainSnapshotView({
  snapshot, token, tripStatus, startedAt, buoyPolicyId,
}: CaptainSnapshotViewProps) {
  const [status, setStatus] = useState<TripStatus>(tripStatus)
  const [startedAtState, setStartedAt] = useState(startedAt)
  const [policyId, setPolicyId] = useState(buoyPolicyId)
  const [showStartFlow, setShowStartFlow] = useState(false)
  const [showEndFlow, setShowEndFlow] = useState(false)
  const [liveSnapshot, setLiveSnapshot] = useState(snapshot)
  const [showScanner, setShowScanner] = useState(false)
  const [showBriefingGate, setShowBriefingGate] = useState(false)
  const [briefingAttestation, setBriefingAttestation] = useState<BriefingAttestation | null>(null)
  // Realtime guest subscription adapter
  const initialDashboardGuests = useMemo<DashboardGuest[]>(() => 
    snapshot.guests.map(g => ({
      id: g.id,
      fullName: g.fullName,
      emergencyContactName: null,
      emergencyContactPhone: null,
      languagePreference: 'en',
      dietaryRequirements: null,
      dateOfBirth: g.dateOfBirth ?? null,
      isNonSwimmer: false,
      isSeaSicknessProne: false,
      waiverSigned: g.waiverSigned,
      waiverSignedAt: null,
      approvalStatus: (g as Record<string, unknown>).approvalStatus as DashboardGuest['approvalStatus'] ?? 'auto_approved',
      checkedInAt: null,
      createdAt: '',
      customerId: null,
      safetyAcknowledgments: [],
      waiverTextHash: g.waiverTextHash ?? null,
      fwcLicenseUrl: (g as Record<string, unknown>).fwcLicenseUrl as string ?? null,
      liveryBriefingVerifiedAt: (g as Record<string, unknown>).liveryBriefingVerifiedAt as string ?? null,
      liveryBriefingVerifiedBy: (g as Record<string, unknown>).liveryBriefingVerifiedBy as string ?? null,
      addonOrders: []
    })), [snapshot.guests])

  const { guests: realtimeUpdates } = useTripGuests(snapshot.tripId, initialDashboardGuests)

  const mergedGuests = useMemo(() => {
    // Merge realtime updates into snapshot guests
    const updated = liveSnapshot.guests.map(guest => {
      const update = realtimeUpdates.find(r => r.id === guest.id)
      if (update) {
        return {
          ...guest,
          dateOfBirth: update.dateOfBirth ?? guest.dateOfBirth ?? null,
          waiverSigned: update.waiverSigned,
          waiverTextHash: update.waiverTextHash ?? guest.waiverTextHash,
          safetyAckCount: update.safetyAcknowledgments?.length ?? guest.safetyAckCount,
          approvalStatus: update.approvalStatus ?? guest.approvalStatus ?? 'auto_approved',
          fwcLicenseUrl: update.fwcLicenseUrl ?? guest.fwcLicenseUrl ?? null,
          liveryBriefingVerifiedAt: update.liveryBriefingVerifiedAt ?? guest.liveryBriefingVerifiedAt ?? null,
          liveryBriefingVerifiedBy: update.liveryBriefingVerifiedBy ?? guest.liveryBriefingVerifiedBy ?? null,
        }
      }
      return guest
    })
    // Add any NEW guests from realtime that weren't in the initial snapshot
    for (const rt of realtimeUpdates) {
      if (!updated.some(u => u.id === rt.id)) {
        updated.push({
          id: rt.id,
          fullName: rt.fullName,
          dateOfBirth: rt.dateOfBirth ?? null,
          waiverSigned: rt.waiverSigned,
          waiverTextHash: rt.waiverTextHash ?? null,
          safetyAckCount: rt.safetyAcknowledgments?.length ?? 0,
          languageFlag: '🌐',
          addonEmojis: [],
          approvalStatus: rt.approvalStatus ?? 'auto_approved',
          fwcLicenseUrl: rt.fwcLicenseUrl ?? null,
          liveryBriefingVerifiedAt: rt.liveryBriefingVerifiedAt ?? null,
          liveryBriefingVerifiedBy: rt.liveryBriefingVerifiedBy ?? null,
        })
      }
    }
    return updated
  }, [liveSnapshot.guests, realtimeUpdates])

  // ── COMPLIANCE PROFILE (derived from trip purpose) ────────────
  const compliance = useMemo(
    () => getComplianceProfile(
      liveSnapshot.tripPurpose as TripPurpose,
      liveSnapshot.forceFullCompliance
    ),
    [liveSnapshot.tripPurpose, liveSnapshot.forceFullCompliance]
  )
  const complianceLevel = useMemo(
    () => getComplianceLevel(
      liveSnapshot.tripPurpose as TripPurpose,
      liveSnapshot.forceFullCompliance
    ),
    [liveSnapshot.tripPurpose, liveSnapshot.forceFullCompliance]
  )

  const requiredCards = liveSnapshot.requiredSafetyCards ?? 0

  const isReadyToDepart = useMemo(() => {
    if (mergedGuests.length === 0) return false
    return mergedGuests.every(g => {
      const hasWaiver = !compliance.waiverRequired || g.waiverSigned || g.waiverTextHash === 'firma_template'
      const hasSafety = !compliance.safetyBriefingRequired || (g.safetyAckCount ?? 0) >= requiredCards
      return hasWaiver && hasSafety
    })
  }, [mergedGuests, requiredCards, compliance])

  const nonCompliantCount = useMemo(() =>
    mergedGuests.filter(g => {
      const hasWaiver = !compliance.waiverRequired || g.waiverSigned || g.waiverTextHash === 'firma_template'
      const hasSafety = !compliance.safetyBriefingRequired || (g.safetyAckCount ?? 0) >= requiredCards
      return !(hasWaiver && hasSafety)
    }).length
  , [mergedGuests, requiredCards, compliance])

  // Polling fallback — reduced to 5 minutes since realtime is primary
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/snapshot/${token}`)
        if (res.ok) {
          const json = await res.json()
          setLiveSnapshot(json.data)
        }
      } catch {}
    }, 30000) // 30 seconds — fast fallback for flaky marina WiFi
    return () => clearInterval(interval)
  }, [token])

  function onTripStarted(result: {
    startedAt: string
    buoyPolicyId: string | null
  }) {
    setStatus('active')
    setStartedAt(result.startedAt)
    setPolicyId(result.buoyPolicyId)
    setShowStartFlow(false)
  }

  function onTripEnded() {
    setStatus('completed')
    setShowEndFlow(false)
  }

  // Show briefing gate overlay (before start flow)
  if (showBriefingGate) {
    return (
      <SafetyBriefingGate
        boatName={liveSnapshot.boatName}
        captainName={liveSnapshot.captainName ?? 'Captain'}
        tripDate={formatTripDate(liveSnapshot.tripDate)}
        guestCount={mergedGuests.length}
        briefingTopics={compliance.briefingTopics}
        complianceLevel={complianceLevel.level}
        token={token}
        allowSkip={true}
        onConfirmed={(attestation) => {
          setBriefingAttestation(attestation)
          setShowBriefingGate(false)
          setShowStartFlow(true)
        }}
        onCancel={() => setShowBriefingGate(false)}
        onSkip={() => {
          // Grace period: skip briefing, go straight to start flow
          setBriefingAttestation(null)
          setShowBriefingGate(false)
          setShowStartFlow(true)
        }}
      />
    )
  }

  // Show start flow overlay
  if (showStartFlow) {
    return (
      <StartTripFlow
        snapshot={liveSnapshot}
        token={token}
        onStarted={onTripStarted}
        onCancel={() => setShowStartFlow(false)}
        briefingAttestation={briefingAttestation}
      />
    )
  }

  // Show end flow overlay
  if (showEndFlow) {
    return (
      <EndTripFlow
        boatName={liveSnapshot.boatName}
        startedAt={startedAtState}
        token={token}
        tripSlug={liveSnapshot.slug}
        onEnded={onTripEnded}
        onCancel={() => setShowEndFlow(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F8FC]">

      {/* Header */}
      <div className="bg-[#0C447C] px-5 pt-5 pb-6 text-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] font-bold tracking-wider opacity-70">
            CAPTAIN VIEW · BOATCHECKIN
          </span>
          <span className={
            status === 'active'
              ? 'text-[12px] font-bold bg-[#1D9E75] px-2.5 py-1 rounded-full'
              : 'text-[12px] font-bold bg-white/20 px-2.5 py-1 rounded-full'
          }>
            {status === 'active' ? '● Active' : status === 'completed' ? '✓ Completed' : 'Upcoming'}
          </span>
        </div>
        {/* Compliance mode badge */}
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${complianceLevel.color}22`, color: complianceLevel.color }}
          >
            {complianceLevel.icon} {complianceLevel.label}
          </span>
        </div>
        <h1 className="text-[24px] font-bold mb-1">
          {liveSnapshot.boatName}
        </h1>

        {/* Captain badge */}
        {liveSnapshot.captainName && (
          <div className="flex items-center gap-2.5 mt-2 mb-2">
            {liveSnapshot.captainPhotoUrl ? (
              <img
                src={liveSnapshot.captainPhotoUrl}
                alt={liveSnapshot.captainName}
                className="w-8 h-8 rounded-full border-2 border-white/40 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[12px] font-bold">
                {liveSnapshot.captainName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            )}
            <div>
              <p className="text-[14px] font-semibold leading-tight">
                {liveSnapshot.captainName}
              </p>
              {liveSnapshot.captainLicense && (
                <p className="text-[11px] text-white/60 leading-tight">
                  🪪 {liveSnapshot.captainLicense}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-2">
          {[
            `📅 ${formatTripDate(liveSnapshot.tripDate)}`,
            `⏰ ${formatTime(liveSnapshot.departureTime)}`,
            `⏳ ${formatDuration(liveSnapshot.durationHours)}`,
          ].map(chip => (
            <span key={chip} className="bg-white/20 text-white text-[12px] px-3 py-1 rounded-full">
              {chip}
            </span>
          ))}
        </div>
        <p className="text-white/70 text-[13px] mt-2">
          📍 {liveSnapshot.marinaName}
          {liveSnapshot.slipNumber ? ` · Slip ${liveSnapshot.slipNumber}` : ''}
        </p>

        {/* Weather */}
        {liveSnapshot.weather && (
          <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-[10px] px-3 py-2">
            <span className="text-[20px]">{liveSnapshot.weather.icon}</span>
            <span className="text-[13px] font-medium">
              {liveSnapshot.weather.label} · {liveSnapshot.weather.temperature}°F
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">

        {/* Buoy insurance status */}
        {status === 'active' && (
          <div className="p-4 rounded-[16px] bg-[#E8F9F4] border border-[#1D9E75] border-opacity-30">
            <div className="flex items-center gap-2">
              <span className="text-[20px]">🟢</span>
              <div>
                <p className="text-[14px] font-semibold text-[#1D9E75]">
                  Insurance active
                </p>
                {policyId && !policyId.startsWith('STUB') && !policyId.startsWith('FAIL') && (
                  <p className="text-[12px] text-[#6B7C93]">
                    Policy: {policyId}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Safety Briefing Confirmation Status ──────────────── */}
        {(briefingAttestation || liveSnapshot.safetyBriefingConfirmedAt) && (
          <div className="p-4 rounded-[16px] bg-[#E8F2FB] border-2 border-[#0C447C]">
            <div className="flex items-center gap-3">
              <span className="text-[24px]">🛡️</span>
              <div>
                <p className="text-[14px] font-bold text-[#0C447C]">
                  Safety Briefing Confirmed
                </p>
                <p className="text-[12px] text-[#6B7C93] mt-0.5">
                  {briefingAttestation?.signature ?? liveSnapshot.safetyBriefingConfirmedBy} ·{' '}
                  {briefingAttestation?.type?.replace(/_/g, ' ') ?? liveSnapshot.safetyBriefingType?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── USCG PRE-DEPARTURE COMPLIANCE BANNER ──────────────── */}
        {status === 'upcoming' && (
          isReadyToDepart ? (
            <div className="p-4 rounded-[16px] bg-[#E8F9F4] border-2 border-[#1D9E75]">
              <div className="flex items-center gap-3">
                <span className="text-[28px]">✅</span>
                <div>
                  <p className="text-[16px] font-bold text-[#1D9E75]">
                    ALL CLEAR — Ready for departure
                  </p>
                  <p className="text-[12px] text-[#6B7C93] mt-0.5">
                    {mergedGuests.length} guest{mergedGuests.length !== 1 ? 's' : ''} · All waivers signed · Safety briefing complete
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[16px] bg-[#FEF3DC] border-2 border-[#E5910A]">
              <div className="flex items-center gap-3">
                <span className="text-[28px]">⚠️</span>
                <div>
                  <p className="text-[16px] font-bold text-[#E5910A]">
                    WAITING ON GUESTS
                  </p>
                  <p className="text-[12px] text-[#6B7C93] mt-0.5">
                    {nonCompliantCount} guest{nonCompliantCount !== 1 ? 's' : ''} still need to sign the waiver or complete the safety briefing
                  </p>
                </div>
              </div>
            </div>
          )
        )}

        {/* ── Head Count Verification (pre-departure) ── */}
        {status === 'upcoming' && mergedGuests.length > 0 && (
          <HeadCountConfirm
            token={token}
            digitalGuestCount={mergedGuests.length}
          />
        )}

        {/* ── Crew Manifest ── */}
        <CrewManifestPanel
          crewManifest={liveSnapshot.crewManifest}
          captainName={liveSnapshot.captainName}
          captainLicense={liveSnapshot.captainLicense}
        />

        {/* Passenger alerts */}
        <SnapshotAlerts alerts={liveSnapshot.alerts} />

        {/* Guest list */}
        <SnapshotGuestList
          guests={mergedGuests}
          maxGuests={snapshot.maxGuests ?? mergedGuests.length}
          captainToken={token}
        />

        {/* Add-on summary */}
        {liveSnapshot.addonSummary.length > 0 && (
          <SnapshotAddonSummary summary={liveSnapshot.addonSummary} />
        )}

        {/* ── Trip Log (Notes) ── */}
        <TripNotesPanel token={token} initialNotes="" />

        {/* Chat panel (when trip is active) */}
        {status === 'active' && (
          <CaptainChatPanel
            snapshot={liveSnapshot}
          />
        )}

        {/* ── USCG Float Plan Download ── */}
        <div className="bg-white rounded-[20px] border border-[#D0E2F3] overflow-hidden">
          <button
            onClick={() => downloadFloatPlan(liveSnapshot)}
            className="
              w-full px-5 py-4 flex items-center gap-3
              text-left hover:bg-[#F5F8FC] transition-colors
            "
          >
            <span className="text-[20px]">📋</span>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-[#0D1B2A]">
                USCG Float Plan
              </p>
              <p className="text-[12px] text-[#6B7C93]">
                Download pre-filled float plan for this trip
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#0C447C] bg-[#E8F2FB] px-3 py-1.5 rounded-full">
              Download
            </span>
          </button>
        </div>

        {/* Refresh indicator */}
        <p className="text-[11px] text-[#6B7C93] text-center">
          Live updates active · Fallback refresh every 30s
        </p>

        {/* Bottom action button */}
        <div className="pt-2 pb-8">
          {status === 'upcoming' && (
            <button
              onClick={() => setShowBriefingGate(true)}
              disabled={!isReadyToDepart}
              className="
                w-full h-[64px] rounded-[16px]
                bg-[#1D9E75] text-white
                font-bold text-[18px]
                hover:bg-[#178a64] transition-colors
                active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed
                disabled:hover:bg-[#1D9E75]
              "
            >
              {isReadyToDepart ? '🛡️ Safety Briefing & Start →' : '🔒 Waiting on compliance...'}
            </button>
          )}

          {status === 'active' && (
            <button
              onClick={() => setShowEndFlow(true)}
              className="
                w-full h-[64px] rounded-[16px]
                bg-[#E8593C] text-white
                font-bold text-[18px]
                hover:bg-[#cc4a32] transition-colors
              "
            >
              End Trip →
            </button>
          )}

          {status === 'completed' && (
            <div className="
              w-full h-[64px] rounded-[16px]
              bg-[#E8F9F4] border border-[#1D9E75] border-opacity-30
              flex items-center justify-center
            ">
              <span className="text-[16px] font-semibold text-[#1D9E75]">
                ✓ Trip completed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Scan Mode button (shown when ≥3 guests) ── */}
      {mergedGuests.length >= 3 && status !== 'completed' && !showStartFlow && !showEndFlow && (
        <button
          onClick={() => setShowScanner(true)}
          className="
            fixed bottom-6 right-6 z-50
            w-[56px] h-[56px] rounded-full
            bg-[#0C447C] text-white shadow-lg
            flex items-center justify-center
            hover:bg-[#093a6b] transition-colors
            active:scale-95
          "
          title="Open QR boarding scanner"
        >
          <span className="text-[24px]">📱</span>
        </button>
      )}

      {/* ── QR Boarding Scanner overlay ── */}
      {showScanner && (
        <QrBoardingScanner
          tripSlug={liveSnapshot.slug}
          guests={mergedGuests.map(g => ({ id: g.id, fullName: g.fullName, boardedAt: (g as Record<string, unknown>).checkedInAt as string ?? null }))}
          onClose={() => setShowScanner(false)}
          onBoarded={() => {
            // Trigger a refresh of the snapshot
            fetch(`/api/snapshot/${token}`).then(async res => {
              if (res.ok) {
                const json = await res.json()
                setLiveSnapshot(json.data)
              }
            }).catch(() => null)
          }}
        />
      )}
    </div>
  )
}
